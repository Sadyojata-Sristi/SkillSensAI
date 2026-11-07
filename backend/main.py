
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import os
import tempfile
import subprocess
import urllib.request
import re

import numpy as np
import librosa
import imageio_ffmpeg
import joblib
import replicate


# ============================================================
# SkillSensAI Backend - Version 5.0
# Vocal separation + pitch comparison + existing ML model
# ============================================================

app = FastAPI(
    title="SkillSensAI Backend",
    description="AI-powered skill learning backend for SkillSensAI",
    version="5.3.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLE_RATE = 16000
MAX_ANALYSIS_SECONDS = 20  # Current pitch-analysis window; longer uploads are validated but only this window is scored.
MAX_UPLOAD_BYTES = 100 * 1024 * 1024
MAX_TRACK_SECONDS = 5 * 60
MAX_GRAPH_POINTS = 250
FRAME_LENGTH = 2048
HOP_LENGTH = 512

# Paid Replicate features are OFF by default so normal practice sessions
# never make paid API calls accidentally. Enable each one explicitly only
# when credits are available and the owner wants to use them.
ENABLE_REPLICATE_VOCAL_SEPARATION = (
    os.getenv("SKILLSENSAI_ENABLE_REPLICATE_VOCAL_SEPARATION", "false").lower()
    in {"1", "true", "yes", "on"}
)
ENABLE_REPLICATE_LYRICS = (
    os.getenv("SKILLSENSAI_ENABLE_REPLICATE_LYRICS", "false").lower()
    in {"1", "true", "yes", "on"}
)
REPLICATE_TOKEN_AVAILABLE = bool(os.getenv("REPLICATE_API_TOKEN"))

DEMUCS_MODEL = (
    "cjwbw/demucs:"
    "25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953"
)

MODEL_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "music_model.joblib"
)

music_model = None

try:
    if os.path.exists(MODEL_PATH):
        music_model = joblib.load(MODEL_PATH)
        print("SkillSensAI Music AI model loaded.")
    else:
        print("WARNING: music_model.joblib was not found.")
except Exception as error:
    music_model = None
    print("WARNING: Music AI model could not be loaded:", str(error))


# ============================================================
# ROOT / HEALTH / MODEL STATUS
# ============================================================

@app.get("/")
def root():
    return {
        "message": "SkillSensAI backend is running!",
        "status": "online",
        "version": "5.3.0",
        "music_ai": "active" if music_model is not None else "unavailable",
        "music_ai_model": (
            "Random Forest Regressor"
            if music_model is not None else None
        ),
        "vocal_separation": (
            "enabled"
            if ENABLE_REPLICATE_VOCAL_SEPARATION and REPLICATE_TOKEN_AVAILABLE
            else "disabled_to_avoid_paid_api_calls"
        ),
        "lyrics_transcription": (
            "enabled"
            if ENABLE_REPLICATE_LYRICS and REPLICATE_TOKEN_AVAILABLE
            else "disabled_to_avoid_paid_api_calls"
        )
    }


@app.get("/health")
def health():
    return {
        "success": True,
        "status": "healthy",
        "music_ai": "active" if music_model is not None else "unavailable",
        "vocal_separation_enabled": (
            ENABLE_REPLICATE_VOCAL_SEPARATION and REPLICATE_TOKEN_AVAILABLE
        ),
        "lyrics_transcription_enabled": (
            ENABLE_REPLICATE_LYRICS and REPLICATE_TOKEN_AVAILABLE
        )
    }


@app.get("/model-status")
def model_status():
    return {
        "success": True,
        "model_loaded": music_model is not None,
        "model_name": (
            "Random Forest Music Performance Model"
            if music_model is not None else None
        ),
        "model_file": "music_model.joblib",
        "features": [
            "pitch_accuracy",
            "note_match",
            "timing_accuracy",
            "stability",
            "average_pitch_error_cents",
            "voiced_ratio"
        ],
        "vocal_separation_enabled": (
            ENABLE_REPLICATE_VOCAL_SEPARATION and REPLICATE_TOKEN_AVAILABLE
        ),
        "lyrics_transcription_enabled": (
            ENABLE_REPLICATE_LYRICS and REPLICATE_TOKEN_AVAILABLE
        )
    }


# ============================================================
# AUDIO CONVERSION
# ============================================================

def get_ffmpeg_path():
    try:
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception as error:
        raise RuntimeError(f"FFmpeg could not be found: {error}")


def convert_to_wav(input_path, output_path):
    command = [
        get_ffmpeg_path(),
        "-y",
        "-i", input_path,
        "-vn",
        "-ac", "1",
        "-ar", str(SAMPLE_RATE),
        "-sample_fmt", "s16",
        output_path
    ]

    result = subprocess.run(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=120
    )

    if result.returncode != 0:
        raise RuntimeError(
            "Audio conversion failed: " + result.stderr[-1000:]
        )


def load_audio(file_path):
    wav_file = tempfile.NamedTemporaryFile(
        suffix=".wav", delete=False
    )
    wav_path = wav_file.name
    wav_file.close()

    try:
        convert_to_wav(file_path, wav_path)

        audio, sr = librosa.load(
            wav_path,
            sr=SAMPLE_RATE,
            mono=True,
            duration=MAX_ANALYSIS_SECONDS
        )

        return audio, sr
    finally:
        if os.path.exists(wav_path):
            os.remove(wav_path)


# ============================================================
# VOCAL SEPARATION
# ============================================================

def separate_lead_vocals(input_path):
    """
    Send the first 20 seconds to Replicate Demucs.
    Return the path to the separated vocal file.
    Caller is responsible for deleting the returned file.
    """

    if not ENABLE_REPLICATE_VOCAL_SEPARATION:
        print("VOCAL SEPARATION SKIPPED: paid Replicate calls are disabled by default.")
        return None

    if not REPLICATE_TOKEN_AVAILABLE:
        print("VOCAL SEPARATION SKIPPED: REPLICATE_API_TOKEN is not configured.")
        return None

    clip = tempfile.NamedTemporaryFile(
        suffix=".mp3", delete=False
    )
    clip_path = clip.name
    clip.close()

    vocal = tempfile.NamedTemporaryFile(
        suffix=".mp3", delete=False
    )
    vocal_path = vocal.name
    vocal.close()

    try:
        # Prepare a short clip before sending it to the service.
        command = [
            get_ffmpeg_path(),
            "-y",
            "-i", input_path,
            "-t", str(MAX_ANALYSIS_SECONDS),
            "-vn",
            "-ac", "2",
            "-ar", "44100",
            "-b:a", "192k",
            clip_path
        ]

        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=120
        )

        if result.returncode != 0:
            raise RuntimeError(
                "Could not prepare audio for vocal separation."
            )

        with open(clip_path, "rb") as audio_file:
            output = replicate.run(
                DEMUCS_MODEL,
                input={
                    "audio": audio_file,
                    "stem": "vocals",
                    "model_name": "htdemucs",
                    "shifts": 1,
                    "overlap": 0.25,
                    "clip_mode": "rescale",
                    "mp3_bitrate": 192,
                    "output_format": "mp3"
                }
            )

        if not isinstance(output, dict):
            raise RuntimeError(
                "Unexpected response from the vocal-separation service."
            )

        vocals_output = output.get("vocals")

        if not vocals_output:
            raise RuntimeError(
                "Demucs did not return a vocals audio file."
            )

        # Replicate output may be a URL or a file-like object.
        if isinstance(vocals_output, str):
            with urllib.request.urlopen(
                vocals_output, timeout=120
            ) as response:
                vocal_bytes = response.read()

        elif hasattr(vocals_output, "read"):
            vocal_bytes = vocals_output.read()

        elif hasattr(vocals_output, "url"):
            with urllib.request.urlopen(
                str(vocals_output.url), timeout=120
            ) as response:
                vocal_bytes = response.read()

        else:
            raise RuntimeError(
                "Unrecognised vocal audio output format."
            )

        if not vocal_bytes:
            raise RuntimeError("The separated vocal file is empty.")

        with open(vocal_path, "wb") as destination:
            destination.write(vocal_bytes)

        return vocal_path

    except Exception as error:
        if os.path.exists(vocal_path):
            os.remove(vocal_path)

        # Do not block the whole practice session if the external service
        # is out of credit, unavailable, or fails. Callers must use the
        # original audio and explicitly warn that background music can
        # reduce pitch-analysis accuracy.
        print("VOCAL SEPARATION UNAVAILABLE; falling back to original audio:", str(error))
        return None

    finally:
        if os.path.exists(clip_path):
            os.remove(clip_path)


# ============================================================
# PITCH DETECTION
# ============================================================

def frequency_to_note(frequency):
    if frequency is None or not np.isfinite(frequency):
        return "Unknown"

    if frequency <= 0:
        return "Silence"

    note_number = int(round(
        12 * np.log2(frequency / 440.0) + 69
    ))

    names = [
        "C", "C#", "D", "D#", "E", "F",
        "F#", "G", "G#", "A", "A#", "B"
    ]

    return f"{names[note_number % 12]}{note_number // 12 - 1}"


def detect_pitch_timeline(audio, sample_rate):
    audio = np.asarray(audio, dtype=np.float32)

    if len(audio) < FRAME_LENGTH:
        return []

    if not np.any(np.abs(audio) > 1e-6):
        return []

    audio = librosa.util.normalize(audio)

    rms = librosa.feature.rms(
        y=audio,
        frame_length=FRAME_LENGTH,
        hop_length=HOP_LENGTH
    )[0]

    try:
        pitch = librosa.yin(
            audio,
            fmin=librosa.note_to_hz("C2"),
            fmax=librosa.note_to_hz("C7"),
            sr=sample_rate,
            frame_length=FRAME_LENGTH,
            hop_length=HOP_LENGTH
        )
    except Exception as error:
        print("PITCH DETECTION ERROR:", str(error))
        return []

    timeline = []

    for i, frequency in enumerate(pitch):
        energy = float(rms[i]) if i < len(rms) else 0.0

        # Separation reduces accompaniment, but residual instruments
        # can remain. Energy alone is not a true pitch confidence score.
        if energy < 0.01 or not np.isfinite(frequency) or frequency <= 0:
            frequency = 0.0

        timeline.append({
            "time": round(float(i * HOP_LENGTH / sample_rate), 4),
            "frequency": round(float(frequency), 2),
            "note": frequency_to_note(frequency),
            "confidence": round(min(energy * 20, 1.0), 3)
        })

    return timeline


def detect_pitch(audio, sample_rate):
    return [
        point["frequency"]
        for point in detect_pitch_timeline(audio, sample_rate)
        if point["frequency"] > 0
    ]


def reduce_pitch_timeline(timeline, max_points=MAX_GRAPH_POINTS):
    if len(timeline) <= max_points:
        return timeline

    indexes = np.linspace(
        0, len(timeline) - 1, max_points
    ).astype(int)

    return [timeline[i] for i in indexes]


def create_pitch_data(timeline):
    return reduce_pitch_timeline(timeline)


# ============================================================
# TIMELINE RESAMPLING
# ============================================================

def calculate_cents(reference, user):
    if reference <= 0 or user <= 0:
        return None

    return float(1200 * np.log2(user / reference))


def resample_timeline(
    timeline,
    target_times,
    normalize_duration=None,
    comparison_duration=None
):
    if not timeline:
        return (
            np.zeros(len(target_times), dtype=np.float32),
            np.zeros(len(target_times), dtype=bool)
        )

    source_times = np.array(
        [p["time"] for p in timeline], dtype=np.float32
    )
    source_pitch = np.array(
        [p["frequency"] for p in timeline], dtype=np.float32
    )

    source_active = (source_pitch > 0).astype(np.float32)

    if (
        normalize_duration is not None
        and comparison_duration is not None
        and normalize_duration > 0
    ):
        source_times = (
            source_times / normalize_duration * comparison_duration
        )

    if len(source_times) == 1:
        pitch = np.repeat(source_pitch[0], len(target_times))
        active = np.repeat(source_active[0] > 0.5, len(target_times))
        return pitch.astype(np.float32), active

    pitch = np.interp(target_times, source_times, source_pitch)
    activity = np.interp(target_times, source_times, source_active)
    active = activity >= 0.5

    active[target_times < source_times[0]] = False
    active[target_times > source_times[-1]] = False
    pitch[~active] = 0

    return pitch.astype(np.float32), active


def interpolate_timeline(timeline, target_times):
    pitch, _ = resample_timeline(timeline, target_times)
    return pitch


# ============================================================
# AI FEATURES AND PREDICTION
# ============================================================

def calculate_ai_features(
    pitch_accuracy,
    note_match,
    timing_accuracy,
    stability,
    average_pitch_error,
    reference_active,
    user_active
):
    reference_count = int(np.sum(reference_active))

    if reference_count:
        voiced_ratio = (
            np.sum(user_active[reference_active]) / reference_count
        )
    else:
        voiced_ratio = 0.0

    voiced_ratio = float(np.clip(voiced_ratio, 0, 1))

    return np.array([
        pitch_accuracy,
        note_match,
        timing_accuracy,
        stability,
        average_pitch_error,
        voiced_ratio
    ], dtype=np.float32)


def predict_ai_score(features):
    if music_model is None:
        return None

    try:
        prediction = music_model.predict(features.reshape(1, -1))[0]
        return float(np.clip(prediction, 0, 100))
    except Exception as error:
        print("AI PREDICTION ERROR:", str(error))
        return None


# ============================================================
# SCORING
# ============================================================

def build_mistake_report(reference_pitch, user_pitch, target_times, both_active, cents_limit=50):
    """Group sustained pitch mismatches into timestamped coaching items."""
    frames = []
    for index in np.where(both_active)[0]:
        ref_hz = float(reference_pitch[index])
        user_hz = float(user_pitch[index])
        cents = calculate_cents(ref_hz, user_hz)
        if cents is None or not np.isfinite(cents) or abs(cents) < cents_limit:
            continue
        frames.append({
            "time": float(target_times[index]),
            "reference_note": frequency_to_note(ref_hz),
            "user_note": frequency_to_note(user_hz),
            "cents_error": float(cents),
            "absolute_error": abs(float(cents)),
        })

    if not frames:
        return []

    groups = []
    current = [frames[0]]
    for frame in frames[1:]:
        if frame["time"] - current[-1]["time"] <= 0.45:
            current.append(frame)
        else:
            groups.append(current)
            current = [frame]
    groups.append(current)

    report = []
    for group in groups:
        # Ignore single isolated frames: they are often pitch-detection noise.
        if len(group) < 2:
            continue
        mean_error = float(np.mean([item["cents_error"] for item in group]))
        magnitude = abs(mean_error)
        if magnitude >= 150:
            severity = "high"
            exercise = "Slow the phrase down and match one reference note at a time before singing the full phrase."
        elif magnitude >= 80:
            severity = "medium"
            exercise = "Replay this short phrase, hum the reference note, then sing it again while holding the pitch steady."
        else:
            severity = "low"
            exercise = "Repeat this phrase slowly and make a small pitch adjustment toward the reference."
        report.append({
            "start_time": round(group[0]["time"], 2),
            "end_time": round(group[-1]["time"], 2),
            "reference_note": group[len(group) // 2]["reference_note"],
            "user_note": group[len(group) // 2]["user_note"],
            "average_cents_error": round(mean_error, 1),
            "severity": severity,
            "title": "Singing pitch differs from the reference",
            "explanation": ("Your detected pitch is " + ("sharp" if mean_error > 0 else "flat") + " compared with the reference in this section. Pitch detection can be affected by background music."),
            "exercise": exercise,
        })
    return report[:15]


def level_coaching(level, pitch_accuracy, note_match, timing_accuracy, stability, mistakes):
    level = level if level in {"beginner", "intermediate", "advanced"} else "beginner"
    if level == "beginner":
        focus = "Start with short phrases, hum each reference note, then sing at a comfortable speed."
    elif level == "intermediate":
        focus = "Practise the weakest metric in 2–4 second sections, then repeat at normal tempo."
    else:
        focus = "Work on precise note transitions and phrase consistency; repeat difficult sections at reduced speed, then at original tempo."
    weakest = min(
        [("pitch accuracy", pitch_accuracy), ("note matching", note_match),
         ("timing", timing_accuracy), ("stability", stability)],
        key=lambda item: item[1]
    )[0]
    return {
        "starting_level": level,
        "focus_metric": weakest,
        "next_exercise": focus,
        "mistake_count": len(mistakes),
        "progression_rule": "Repeat this exercise after each attempt. Increase difficulty after two attempts improve the focus metric; otherwise keep the section short and slow."
    }


def calculate_music_score_from_timelines(
    reference_timeline,
    user_timeline
):
    empty_result = {
        "overall_score": None,
        "ai_score": None,
        "rule_based_score": None,
        "ai_model": "Unavailable",
        "ai_model_used": False,
        "pitch_accuracy": None,
        "note_match": None,
        "timing_accuracy": None,
        "stability": None,
        "average_pitch_error_cents": None,
        "voiced_ratio": None,
        "training_features": None,
        "reference_pitch": [],
        "user_pitch": [],
        "comparison_times": [],
        "skill_scores": {
            "pitch_accuracy": {"score": None, "evaluated": False},
            "note_match": {"score": None, "evaluated": False},
            "timing_accuracy": {"score": None, "evaluated": False},
            "stability": {"score": None, "evaluated": False},
        },
        "mistakes": [],
        "coaching": {},
        "analysis_status": "insufficient_data",
        "feedback": []
    }

    reference_valid = [
        p for p in reference_timeline if p["frequency"] > 0
    ]
    user_valid = [
        p for p in user_timeline if p["frequency"] > 0
    ]

    if not reference_valid:
        result = dict(empty_result)
        result["feedback"] = [
            "Could not detect enough lead-vocal melody in the reference."
        ]
        return result

    if not user_valid:
        result = dict(empty_result)
        result["feedback"] = [
            "We could not detect enough singing from your recording."
        ]
        return result

    reference_duration = max(
        max(p["time"] for p in reference_valid), 0.1
    )
    user_duration = max(
        max(p["time"] for p in user_valid), 0.1
    )

    comparison_duration = min(reference_duration, user_duration)

    sample_count = min(
        MAX_GRAPH_POINTS,
        max(50, int(comparison_duration * 20))
    )

    target_times = np.linspace(0, comparison_duration, sample_count)

    reference_pitch, reference_active = resample_timeline(
        reference_timeline, target_times
    )

    user_pitch, user_active = resample_timeline(
        user_timeline,
        target_times,
        normalize_duration=user_duration,
        comparison_duration=comparison_duration
    )

    both_active = reference_active & user_active
    indexes = np.where(both_active)[0]

    if len(indexes) < 5:
        result = dict(empty_result)
        result["feedback"] = [
            "There is not enough overlapping singing to score reliably. "
            "Try recording the same section of the song."
        ]
        return result

    cents_errors = []

    for index in indexes:
        cents = calculate_cents(
            reference_pitch[index], user_pitch[index]
        )
        if cents is not None and np.isfinite(cents):
            cents_errors.append(cents)

    if len(cents_errors) < 5:
        result = dict(empty_result)
        result["feedback"] = [
            "There is not enough reliable pitch information for comparison."
        ]
        return result

    cents_errors = np.asarray(cents_errors, dtype=np.float32)
    absolute_errors = np.abs(cents_errors)

    pitch_accuracy = float(np.mean(
        np.exp(-absolute_errors / 100.0)
    ) * 100)

    note_match = float(np.mean(absolute_errors <= 50) * 100)

    reference_voiced_count = int(np.sum(reference_active))

    timing_accuracy = (
        float(np.sum(user_active[reference_active]) /
              reference_voiced_count * 100)
        if reference_voiced_count else 0.0
    )

    # Compare frame-to-frame movement in cents, not raw Hz.
    ref_active_pitch = reference_pitch[reference_active]
    usr_active_pitch = user_pitch[user_active]

    if len(ref_active_pitch) > 2 and len(usr_active_pitch) > 2:
        ref_changes = np.diff(1200 * np.log2(
            np.maximum(ref_active_pitch, 1e-6)
        ))
        usr_changes = np.diff(1200 * np.log2(
            np.maximum(usr_active_pitch, 1e-6)
        ))

        ref_variation = float(np.std(ref_changes))
        usr_variation = float(np.std(usr_changes))

        stability = (
            100.0 * np.exp(
                -abs(usr_variation - ref_variation) / 100.0
            )
        )
    else:
        stability = 0.0

    average_error = float(np.mean(absolute_errors))

    rule_based_score = (
        pitch_accuracy * 0.50
        + note_match * 0.25
        + timing_accuracy * 0.15
        + stability * 0.10
    )

    features = calculate_ai_features(
        pitch_accuracy,
        note_match,
        timing_accuracy,
        stability,
        average_error,
        reference_active,
        user_active
    )

    ai_score = predict_ai_score(features)

    # The existing Random Forest was trained on synthetic examples.
    # Keep it visible for compatibility, but don't let unvalidated
    # predictions override the transparent audio-analysis score.
    overall_score = rule_based_score

    feedback = []

    if pitch_accuracy >= 90:
        feedback.append("Excellent pitch control.")
    elif pitch_accuracy >= 75:
        feedback.append("Good pitch control with small corrections needed.")
    elif pitch_accuracy >= 55:
        feedback.append("Practise matching the reference notes slowly.")
    else:
        feedback.append(
            "Focus on matching each reference note before increasing speed."
        )

    if note_match >= 85:
        feedback.append("Most of your notes matched the reference closely.")
    elif note_match >= 65:
        feedback.append("Several notes matched, but others need correction.")
    else:
        feedback.append("Try holding each note and matching its pitch carefully.")

    if timing_accuracy >= 85:
        feedback.append("Your recording overlaps well with the reference singing.")
    elif timing_accuracy >= 65:
        feedback.append("Some vocal phrases may need better timing.")
    else:
        feedback.append(
            "Try recording the same section and starting at the same point."
        )

    if average_error <= 25:
        feedback.append("Your average pitch error is very small.")
    elif average_error <= 50:
        feedback.append("Your average pitch error is within a good musical range.")
    elif average_error <= 100:
        feedback.append("Some notes are noticeably sharp or flat.")
    else:
        feedback.append(
            "Large pitch differences were detected. Check alignment and "
            "whether the recording matches the reference section."
        )

    feedback.append(
        "Scores are estimates: vocal separation, pitch detection, "
        "and timing alignment can still make mistakes."
    )

    mistakes = build_mistake_report(
        reference_pitch, user_pitch, target_times, both_active
    )
    skill_scores = {
        "pitch_accuracy": {"score": round(pitch_accuracy, 2), "evaluated": True},
        "note_match": {"score": round(note_match, 2), "evaluated": True},
        "timing_accuracy": {"score": round(float(np.clip(timing_accuracy, 0, 100)), 2), "evaluated": True},
        "stability": {"score": round(float(np.clip(stability, 0, 100)), 2), "evaluated": len(ref_active_pitch) > 2 and len(usr_active_pitch) > 2},
    }
    coaching = level_coaching(
        "beginner", pitch_accuracy, note_match, timing_accuracy, stability, mistakes
    )

    return {
        "analysis_status": "scored",
        "overall_score": round(float(np.clip(overall_score, 0, 100)), 2),
        "ai_score": round(ai_score, 2) if ai_score is not None else None,
        "rule_based_score": round(rule_based_score, 2),
        "ai_model": (
            "Random Forest Music Performance Model (experimental)"
            if ai_score is not None else "Unavailable"
        ),
        "ai_model_used": ai_score is not None,
        "pitch_accuracy": round(pitch_accuracy, 2),
        "note_match": round(note_match, 2),
        "timing_accuracy": round(float(np.clip(timing_accuracy, 0, 100)), 2),
        "stability": round(float(np.clip(stability, 0, 100)), 2),
        "voiced_ratio": round(float(features[5]), 4),
        "training_features": {
            "pitch_accuracy": round(float(features[0]), 2),
            "note_match": round(float(features[1]), 2),
            "timing_accuracy": round(float(features[2]), 2),
            "stability": round(float(features[3]), 2),
            "average_pitch_error_cents": round(float(features[4]), 2),
            "voiced_ratio": round(float(features[5]), 4)
        },
        "average_pitch_error_cents": round(average_error, 2),
        "skill_scores": skill_scores,
        "mistakes": mistakes,
        "coaching": coaching,
        "feedback": feedback,
        "reference_pitch": [round(float(x), 2) for x in reference_pitch],
        "user_pitch": [round(float(x), 2) for x in user_pitch],
        "comparison_times": [round(float(x), 3) for x in target_times]
    }


# ============================================================
# UPLOAD UTILITIES
# ============================================================

async def save_upload(uploaded_file):
    suffix = os.path.splitext(uploaded_file.filename or "")[1]
    temporary_file = tempfile.NamedTemporaryFile(
        suffix=suffix, delete=False
    )
    path = temporary_file.name
    total_bytes = 0

    try:
        while True:
            chunk = await uploaded_file.read(1024 * 1024)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > MAX_UPLOAD_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail="Audio file exceeds the 100 MB upload limit."
                )
            temporary_file.write(chunk)

        temporary_file.close()
        if total_bytes == 0:
            raise HTTPException(status_code=400, detail="The uploaded file is empty.")
        return path

    except Exception:
        temporary_file.close()
        if os.path.exists(path):
            os.remove(path)
        raise


def validate_audio_duration(path):
    """Reject unsupported long tracks before running expensive audio processing."""
    try:
        result = subprocess.run(
            [get_ffmpeg_path(), "-i", path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=30
        )
        details = result.stderr or ""
        match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", details)
        if not match:
            raise HTTPException(
                status_code=400,
                detail="Could not read the audio duration. Please try a valid audio file."
            )
        hours, minutes, seconds = match.groups()
        duration = int(hours) * 3600 + int(minutes) * 60 + float(seconds)
        if duration <= 0:
            raise HTTPException(status_code=400, detail="The audio file has no usable duration.")
        if duration > MAX_TRACK_SECONDS:
            raise HTTPException(
                status_code=413,
                detail="Audio must be 5 minutes or shorter. Please upload a shorter song or section."
            )
        return duration
    except HTTPException:
        raise
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Reading audio duration timed out. Try a shorter file.")
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"Could not validate this audio file: {error}")


def safe_remove(path):
    if path and os.path.exists(path):
        try:
            os.remove(path)
        except Exception as error:
            print("TEMP FILE CLEANUP WARNING:", str(error))


def transcribe_song_lyrics(input_path):
    """Attempt song lyric transcription with Replicate Whisper.

    Transcription is best-effort: music, harmonies, accents and instrumental
    backing can prevent accurate lyrics. A failure never blocks pitch analysis.
    This API call may consume Replicate credits when configured.
    Returns (lyrics_text, warning).
    """
    if not ENABLE_REPLICATE_LYRICS:
        return None, (
            "Automatic lyrics transcription is disabled to avoid paid API calls. "
            "Pitch analysis is still available. Lyrics can be shown when a "
            "no-cost transcription option is configured or supplied separately."
        )

    if not REPLICATE_TOKEN_AVAILABLE:
        return None, (
            "Lyrics transcription is not configured because no API token is available. "
            "Pitch analysis is still available."
        )

    try:
        with open(input_path, "rb") as audio_file:
            output = replicate.run(
                "openai/whisper",
                input={
                    "audio": audio_file,
                    "model": "large-v3",
                    "transcription": "plain text",
                    "translate": False,
                    "temperature": 0,
                    "suppress_tokens": "-1",
                    "condition_on_previous_text": True,
                    "word_timestamps": False,
                },
            )

        text_value = None
        if isinstance(output, str):
            text_value = output
        elif isinstance(output, dict):
            text_value = (
                output.get("transcription")
                or output.get("text")
                or output.get("transcript")
            )
            if not text_value and isinstance(output.get("segments"), list):
                text_value = "\n".join(
                    str(segment.get("text", "")).strip()
                    for segment in output["segments"]
                    if isinstance(segment, dict) and segment.get("text")
                )

        lyrics = str(text_value).strip() if text_value else ""
        if lyrics:
            return lyrics, None
        return None, (
            "The transcription service did not detect clear lyrics in this song. "
            "Try a version with clearer vocals or a shorter section."
        )
    except Exception as error:
        message = str(error)
        print("LYRICS TRANSCRIPTION UNAVAILABLE:", message)
        if "402" in message or "insufficient credit" in message.lower():
            warning = (
                "Lyrics could not be transcribed because the Replicate account "
                "has insufficient credits. Add credits to enable this service."
            )
        elif "401" in message or "unauthorized" in message.lower():
            warning = (
                "Lyrics transcription could not authenticate. Check the "
                "REPLICATE_API_TOKEN setting in Render."
            )
        else:
            warning = (
                "The lyrics transcription service is temporarily unavailable. "
                "Pitch analysis is still available."
            )
        return None, warning


# ============================================================
# ANALYZE SONG - RETURNS VOCAL PITCH GRAPH
# ============================================================

@app.post("/analyze-song")
async def analyze_song(file: UploadFile = File(...)):
    file_path = None
    vocal_path = None

    try:
        if not file.filename:
            raise HTTPException(400, "No song file was selected.")

        file_path = await save_upload(file)
        validate_audio_duration(file_path)

        # Prefer isolated vocals. If Replicate is unavailable (including
        # HTTP 402 insufficient credit), analyse the original track instead.
        vocal_path = separate_lead_vocals(file_path)
        analysis_path = vocal_path or file_path
        separation_used = vocal_path is not None
        audio, sr = load_audio(analysis_path)

        if len(audio) == 0:
            raise HTTPException(400, "No readable vocal audio was returned.")

        timeline = detect_pitch_timeline(audio, sr)
        valid = [p for p in timeline if p["frequency"] > 0]

        if not valid:
            raise HTTPException(
                422,
                "Could not detect a clear melody in the separated vocals."
            )

        # Transcribe the full uploaded song independently from the 20-second
        # pitch-analysis window. Failure is non-fatal and is surfaced to the UI.
        lyrics, lyrics_warning = transcribe_song_lyrics(file_path)

        return {
            "success": True,
            "filename": file.filename,
            "duration": round(float(len(audio) / sr), 2),
            "total_pitch_points": len(valid),
            "lyrics": lyrics,
            "lyrics_status": "available" if lyrics else "unavailable",
            "lyrics_warning": lyrics_warning,
            "pitch_data": create_pitch_data(timeline),
            "vocal_separation_used": separation_used,
            "warning": None if separation_used else (
                "Vocal separation was unavailable, so the original song was "
                "analysed. Background music may reduce pitch accuracy."
            ),
            "prototype_note": (
                "The first 20 seconds are analysed. Pitch detection is an "
                "estimate and may be affected by accompaniment."
            )
        }

    except HTTPException:
        raise
    except Exception as error:
        print("ANALYZE SONG ERROR:", str(error))
        raise HTTPException(
            status_code=502,
            detail="Song vocal analysis failed: " + str(error)
        )
    finally:
        safe_remove(file_path)
        safe_remove(vocal_path)


# ============================================================
# ANALYZE VOICE - USER RECORDING ONLY
# ============================================================

@app.post("/analyze-voice")
async def analyze_voice(file: UploadFile = File(...)):
    file_path = None

    try:
        if not file.filename:
            raise HTTPException(400, "No voice recording was selected.")

        file_path = await save_upload(file)
        validate_audio_duration(file_path)
        audio, sr = load_audio(file_path)

        if len(audio) == 0:
            raise HTTPException(400, "The recording has no readable audio.")

        timeline = detect_pitch_timeline(audio, sr)
        valid = np.asarray(
            [p["frequency"] for p in timeline if p["frequency"] > 0],
            dtype=np.float32
        )

        if len(valid) == 0:
            raise HTTPException(
                422,
                "Could not detect your voice. Try recording in a quieter room."
            )

        return {
            "success": True,
            "pitch_data": create_pitch_data(timeline),
            "average_pitch": round(float(np.mean(valid)), 2),
            "minimum_pitch": round(float(np.min(valid)), 2),
            "maximum_pitch": round(float(np.max(valid)), 2),
            "total_pitch_points": len(valid)
        }

    except HTTPException:
        raise
    except Exception as error:
        print("ANALYZE VOICE ERROR:", str(error))
        raise HTTPException(
            status_code=500,
            detail="Voice analysis failed: " + str(error)
        )
    finally:
        safe_remove(file_path)


# ============================================================
# COMPARE SONG + VOICE - MAIN EVALUATION ENDPOINT
# ============================================================

@app.post("/compare-song-voice")
async def compare_song_voice(
    song: UploadFile = File(...),
    voice: UploadFile = File(...),
    level: str = Form("beginner")
):
    song_path = None
    voice_path = None
    vocal_path = None

    try:
        if not song.filename:
            raise HTTPException(400, "No song file was provided.")

        if not voice.filename:
            raise HTTPException(400, "No voice recording was provided.")

        song_path = await save_upload(song)
        voice_path = await save_upload(voice)
        validate_audio_duration(song_path)
        validate_audio_duration(voice_path)

        # Prefer isolated reference vocals. If Replicate fails or is out of
        # credit, continue using the original song and report reduced quality.
        vocal_path = separate_lead_vocals(song_path)
        reference_path = vocal_path or song_path
        separation_used = vocal_path is not None

        song_audio, song_sr = load_audio(reference_path)
        voice_audio, voice_sr = load_audio(voice_path)

        if len(song_audio) == 0:
            raise HTTPException(400, "No readable reference vocal audio.")

        if len(voice_audio) == 0:
            raise HTTPException(400, "No readable user recording.")

        reference_timeline = detect_pitch_timeline(song_audio, song_sr)
        user_timeline = detect_pitch_timeline(voice_audio, voice_sr)

        if not any(p["frequency"] > 0 for p in reference_timeline):
            raise HTTPException(
                422,
                "Could not detect enough melody in the reference audio. "
                "Try a clearer song or a shorter section."
            )

        if not any(p["frequency"] > 0 for p in user_timeline):
            raise HTTPException(
                422, "Could not detect enough pitch in your recording."
            )

        score = calculate_music_score_from_timelines(
            reference_timeline, user_timeline
        )
        if score.get("overall_score") is not None:
            score["coaching"] = level_coaching(
                level,
                score.get("pitch_accuracy", 0),
                score.get("note_match", 0),
                score.get("timing_accuracy", 0),
                score.get("stability", 0),
                score.get("mistakes", [])
            )
        else:
            score["coaching"] = {
                "starting_level": level if level in {"beginner", "intermediate", "advanced"} else "beginner",
                "focus_metric": "not evaluated",
                "next_exercise": "Record a clearer, matching section with both recordings containing audible singing, then compare again.",
                "progression_rule": "A score and adaptive difficulty will be assigned only after enough overlapping pitch is detected."
            }

        return {
            "success": True,
            "analysis_status": score.get("analysis_status", "insufficient_data"),
            "overall_score": score["overall_score"],
            "ai_score": score["ai_score"],
            "rule_based_score": score["rule_based_score"],
            "ai_model": score["ai_model"],
            "ai_model_used": score["ai_model_used"],
            "pitch_accuracy": score["pitch_accuracy"],
            "note_match": score["note_match"],
            "timing_accuracy": score["timing_accuracy"],
            "stability": score["stability"],
            "voiced_ratio": score.get("voiced_ratio"),
            "training_features": score.get("training_features"),
            "average_pitch_error_cents": score[
                "average_pitch_error_cents"
            ],
            "skill_scores": score.get("skill_scores", {}),
            "mistakes": score.get("mistakes", []),
            "coaching": score.get("coaching", {}),
            "reference_pitch": score.get("reference_pitch", []),
            "user_pitch": score.get("user_pitch", []),
            "comparison_times": score.get("comparison_times", []),
            "feedback": score["feedback"],
            "reference_timeline": reduce_pitch_timeline(reference_timeline),
            "user_timeline": reduce_pitch_timeline(user_timeline),
            "vocal_separation_used": separation_used,
            "warning": None if separation_used else (
                "Vocal separation was unavailable, so the original reference "
                "song was used. Background music may reduce score accuracy."
            ),
            "prototype_note": (
                "Pitch metrics are estimates. Results may be less accurate "
                "when the reference includes instrumental accompaniment."
            )
        }

    except HTTPException:
        raise
    except Exception as error:
        print("COMPARE SONG + VOICE ERROR:", str(error))
        raise HTTPException(
            status_code=502,
            detail="Song and voice comparison failed: " + str(error)
        )
    finally:
        safe_remove(song_path)
        safe_remove(voice_path)
        safe_remove(vocal_path)


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
async def startup_event():
    print("==========================================")
    print("SkillSensAI Backend Started")
    print("Version: 5.2.0")
    print(f"Sample rate: {SAMPLE_RATE} Hz")
    print(f"Maximum analysis: {MAX_ANALYSIS_SECONDS} seconds")
    print(f"Maximum graph points: {MAX_GRAPH_POINTS}")
    print("Vocal separation configured:", bool(
        os.getenv("REPLICATE_API_TOKEN")
    ))
    print("Music AI model loaded:", music_model is not None)
    print("==========================================")
