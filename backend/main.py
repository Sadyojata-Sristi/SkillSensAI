
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import os
import tempfile
import subprocess
import urllib.request

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
    version="5.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLE_RATE = 16000
MAX_ANALYSIS_SECONDS = 20
MAX_GRAPH_POINTS = 250
FRAME_LENGTH = 2048
HOP_LENGTH = 512

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
        "version": "5.0.0",
        "music_ai": "active" if music_model is not None else "unavailable",
        "music_ai_model": (
            "Random Forest Regressor"
            if music_model is not None else None
        ),
        "vocal_separation": (
            "configured"
            if os.getenv("REPLICATE_API_TOKEN")
            else "missing_api_token"
        )
    }


@app.get("/health")
def health():
    return {
        "success": True,
        "status": "healthy",
        "music_ai": "active" if music_model is not None else "unavailable",
        "vocal_separation_configured": bool(
            os.getenv("REPLICATE_API_TOKEN")
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
        "vocal_separation_configured": bool(
            os.getenv("REPLICATE_API_TOKEN")
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

    if not os.getenv("REPLICATE_API_TOKEN"):
        raise RuntimeError(
            "REPLICATE_API_TOKEN is missing in Render Environment."
        )

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

        print("VOCAL SEPARATION ERROR:", str(error))
        raise RuntimeError(
            "Vocal separation failed. Please retry with a supported "
            "audio file. Details: " + str(error)
        ) from error

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

def calculate_music_score_from_timelines(
    reference_timeline,
    user_timeline
):
    empty_result = {
        "overall_score": 0,
        "ai_score": None,
        "rule_based_score": 0,
        "ai_model": "Unavailable",
        "ai_model_used": False,
        "pitch_accuracy": 0,
        "note_match": 0,
        "timing_accuracy": 0,
        "stability": 0,
        "average_pitch_error_cents": 0,
        "voiced_ratio": 0,
        "training_features": None,
        "reference_pitch": [],
        "user_pitch": [],
        "comparison_times": [],
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

    return {
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

    try:
        while True:
            chunk = await uploaded_file.read(1024 * 1024)
            if not chunk:
                break
            temporary_file.write(chunk)

        temporary_file.close()
        return path

    except Exception:
        temporary_file.close()
        if os.path.exists(path):
            os.remove(path)
        raise


def safe_remove(path):
    if path and os.path.exists(path):
        try:
            os.remove(path)
        except Exception as error:
            print("TEMP FILE CLEANUP WARNING:", str(error))


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

        # Analyse the separated vocals, not the full instrumental mix.
        vocal_path = separate_lead_vocals(file_path)
        audio, sr = load_audio(vocal_path)

        if len(audio) == 0:
            raise HTTPException(400, "No readable vocal audio was returned.")

        timeline = detect_pitch_timeline(audio, sr)
        valid = [p for p in timeline if p["frequency"] > 0]

        if not valid:
            raise HTTPException(
                422,
                "Could not detect a clear melody in the separated vocals."
            )

        return {
            "success": True,
            "filename": file.filename,
            "duration": round(float(len(audio) / sr), 2),
            "total_pitch_points": len(valid),
            "pitch_data": create_pitch_data(timeline),
            "prototype_note": (
                "Vocal separation is enabled. The first 20 seconds are "
                "analysed; residual accompaniment may still affect pitch."
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
    voice: UploadFile = File(...)
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

        # Separate reference vocals only; preserve user's original recording.
        vocal_path = separate_lead_vocals(song_path)

        song_audio, song_sr = load_audio(vocal_path)
        voice_audio, voice_sr = load_audio(voice_path)

        if len(song_audio) == 0:
            raise HTTPException(400, "No readable reference vocal audio.")

        if len(voice_audio) == 0:
            raise HTTPException(400, "No readable user recording.")

        reference_timeline = detect_pitch_timeline(song_audio, song_sr)
        user_timeline = detect_pitch_timeline(voice_audio, voice_sr)

        if not any(p["frequency"] > 0 for p in reference_timeline):
            raise HTTPException(
                422, "Could not detect enough melody in the separated vocals."
            )

        if not any(p["frequency"] > 0 for p in user_timeline):
            raise HTTPException(
                422, "Could not detect enough pitch in your recording."
            )

        score = calculate_music_score_from_timelines(
            reference_timeline, user_timeline
        )

        return {
            "success": True,
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
            "reference_pitch": score.get("reference_pitch", []),
            "user_pitch": score.get("user_pitch", []),
            "comparison_times": score.get("comparison_times", []),
            "feedback": score["feedback"],
            "reference_timeline": reduce_pitch_timeline(reference_timeline),
            "user_timeline": reduce_pitch_timeline(user_timeline),
            "prototype_note": (
                "The reference vocal stem is extracted with Demucs. "
                "Pitch metrics are estimated and require validation against "
                "real singing recordings."
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
    print("Version: 5.0.0")
    print(f"Sample rate: {SAMPLE_RATE} Hz")
    print(f"Maximum analysis: {MAX_ANALYSIS_SECONDS} seconds")
    print(f"Maximum graph points: {MAX_GRAPH_POINTS}")
    print("Vocal separation configured:", bool(
        os.getenv("REPLICATE_API_TOKEN")
    ))
    print("Music AI model loaded:", music_model is not None)
    print("==========================================")
