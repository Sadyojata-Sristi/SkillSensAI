from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import os
import tempfile
import subprocess

import numpy as np
import librosa
import imageio_ffmpeg
import joblib


# ============================================================
# SkillSensAI Backend
# Version 4.0
# ============================================================

app = FastAPI(
    title="SkillSensAI Backend",
    description="AI-powered skill learning backend for SkillSensAI",
    version="4.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# AUDIO SETTINGS
# ============================================================

SAMPLE_RATE = 16000

MAX_ANALYSIS_SECONDS = 20

MAX_GRAPH_POINTS = 250

FRAME_LENGTH = 2048

HOP_LENGTH = 512


# ============================================================
# MUSIC AI MODEL
#
# IMPORTANT:
# train_model.py creates:
#
# music_model.joblib
#
# The model expects these six features in EXACTLY this order:
#
# 0 = pitch accuracy
# 1 = note match
# 2 = timing accuracy
# 3 = stability
# 4 = average pitch error
# 5 = voiced ratio
# ============================================================

MODEL_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "music_model.joblib"
)

music_model = None


try:

    if os.path.exists(MODEL_PATH):

        music_model = joblib.load(
            MODEL_PATH
        )

        print(
            "=========================================="
        )

        print(
            "SkillSensAI Music AI model loaded."
        )

        print(
            f"Model: {MODEL_PATH}"
        )

        print(
            "Model type:",
            type(music_model).__name__
        )

        print(
            "=========================================="
        )

    else:

        print(
            "WARNING: music_model.joblib was not found."
        )

        print(
            f"Expected location: {MODEL_PATH}"
        )

except Exception as error:

    music_model = None

    print(
        "WARNING: Music AI model could not be loaded."
    )

    print(
        "Error:",
        str(error)
    )


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message": "SkillSensAI backend is running!",
        "status": "online",
        "version": "4.0.0",
        "music_ai": (
            "active"
            if music_model is not None
            else "unavailable"
        ),
        "music_ai_model": (
            "Random Forest Regressor"
            if music_model is not None
            else None
        )
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {
        "success": True,
        "status": "healthy",
        "music_ai": (
            "active"
            if music_model is not None
            else "unavailable"
        )
    }


# ============================================================
# MODEL STATUS
# ============================================================

@app.get("/model-status")
def model_status():

    return {
        "success": True,
        "model_loaded": music_model is not None,
        "model_name": (
            "Random Forest Music Performance Model"
            if music_model is not None
            else None
        ),
        "model_file": "music_model.joblib",
        "features": [
            "pitch_accuracy",
            "note_match",
            "timing_accuracy",
            "stability",
            "average_pitch_error_cents",
            "voiced_ratio"
        ]
    }


# ============================================================
# FFMPEG
# ============================================================

def get_ffmpeg_path():

    try:

        return imageio_ffmpeg.get_ffmpeg_exe()

    except Exception as error:

        raise RuntimeError(
            f"FFmpeg could not be found: {str(error)}"
        )


# ============================================================
# CONVERT AUDIO TO WAV
# ============================================================

def convert_to_wav(
    input_path: str,
    output_path: str
):

    ffmpeg_path = get_ffmpeg_path()

    command = [
        ffmpeg_path,
        "-y",
        "-i",
        input_path,
        "-vn",
        "-ac",
        "1",
        "-ar",
        str(SAMPLE_RATE),
        "-sample_fmt",
        "s16",
        output_path
    ]

    result = subprocess.run(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    if result.returncode != 0:

        raise RuntimeError(
            "FFmpeg conversion failed:\n"
            + result.stderr[-2000:]
        )


# ============================================================
# LOAD AUDIO
# ============================================================

def load_audio(file_path: str):

    temporary_wav = tempfile.NamedTemporaryFile(
        suffix=".wav",
        delete=False
    )

    wav_path = temporary_wav.name

    temporary_wav.close()

    try:

        convert_to_wav(
            file_path,
            wav_path
        )

        audio, sample_rate = librosa.load(
            wav_path,
            sr=SAMPLE_RATE,
            mono=True,
            duration=MAX_ANALYSIS_SECONDS
        )

        return audio, sample_rate

    finally:

        if os.path.exists(wav_path):

            os.remove(wav_path)


# ============================================================
# FREQUENCY → NOTE
# ============================================================

def frequency_to_note(
    frequency
):

    if frequency is None:

        return "Unknown"

    if not np.isfinite(frequency):

        return "Unknown"

    if frequency <= 0:

        return "Silence"

    try:

        note_number = (
            12
            * np.log2(
                frequency / 440.0
            )
            + 69
        )

        note_number = int(
            round(note_number)
        )

        note_names = [
            "C",
            "C#",
            "D",
            "D#",
            "E",
            "F",
            "F#",
            "G",
            "G#",
            "A",
            "A#",
            "B"
        ]

        note_name = note_names[
            note_number % 12
        ]

        octave = (
            note_number // 12
        ) - 1

        return f"{note_name}{octave}"

    except Exception:

        return "Unknown"


# ============================================================
# PITCH DETECTION
# ============================================================

def detect_pitch_timeline(
    audio,
    sample_rate
):

    audio = np.asarray(
        audio,
        dtype=np.float32
    )

    if len(audio) == 0:

        return []

    # --------------------------------------------------------
    # NORMALIZE
    # --------------------------------------------------------

    try:

        audio = librosa.util.normalize(
            audio
        )

    except Exception:

        pass

    # --------------------------------------------------------
    # RMS ENERGY
    # --------------------------------------------------------

    rms = librosa.feature.rms(
        y=audio,
        frame_length=FRAME_LENGTH,
        hop_length=HOP_LENGTH
    )[0]

    # --------------------------------------------------------
    # YIN PITCH DETECTION
    # --------------------------------------------------------

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

        print(
            "Pitch detection error:",
            str(error)
        )

        return []

    timeline = []

    for index, frequency in enumerate(pitch):

        time = (
            index
            * HOP_LENGTH
            / sample_rate
        )

        energy = (
            float(rms[index])
            if index < len(rms)
            else 0.0
        )

        # ----------------------------------------------------
        # REMOVE VERY QUIET FRAMES
        # ----------------------------------------------------

        if energy < 0.01:

            frequency = 0.0

        if (
            not np.isfinite(frequency)
            or frequency <= 0
        ):

            frequency = 0.0

        timeline.append(
            {
                "time": round(
                    float(time),
                    4
                ),

                "frequency": round(
                    float(frequency),
                    2
                ),

                "note": frequency_to_note(
                    frequency
                ),

                "confidence": round(
                    min(
                        energy * 20,
                        1.0
                    ),
                    3
                )
            }
        )

    return timeline


# ============================================================
# PITCH COMPATIBILITY HELPER
# ============================================================

def detect_pitch(
    audio,
    sample_rate
):

    timeline = detect_pitch_timeline(
        audio,
        sample_rate
    )

    return [
        point["frequency"]
        for point in timeline
        if point["frequency"] > 0
    ]


# ============================================================
# REDUCE TIMELINE
# ============================================================

def reduce_pitch_timeline(
    timeline,
    max_points=MAX_GRAPH_POINTS
):

    if not timeline:

        return []

    if len(timeline) <= max_points:

        return timeline

    indexes = np.linspace(
        0,
        len(timeline) - 1,
        max_points
    ).astype(int)

    return [
        timeline[index]
        for index in indexes
    ]


# ============================================================
# GRAPH DATA
# ============================================================

def create_pitch_data(
    timeline
):

    return reduce_pitch_timeline(
        timeline,
        MAX_GRAPH_POINTS
    )


# ============================================================
# CENTS ERROR
#
# Positive = user is higher
# Negative = user is lower
# ============================================================

def calculate_cents(
    reference,
    user
):

    if (
        reference <= 0
        or user <= 0
    ):

        return None

    try:

        return float(
            1200
            * np.log2(
                user / reference
            )
        )

    except Exception:

        return None


# ============================================================
# RESAMPLE TIMELINE
#
# Returns:
#   pitch values
#   voiced/non-voiced mask
# ============================================================

def resample_timeline(
    timeline,
    target_times,
    normalize_duration=None,
    comparison_duration=None
):

    if not timeline:

        return (
            np.zeros(
                len(target_times),
                dtype=np.float32
            ),
            np.zeros(
                len(target_times),
                dtype=bool
            )
        )

    source_times = np.array(
        [
            point["time"]
            for point in timeline
        ],
        dtype=np.float32
    )

    source_pitch = np.array(
        [
            point["frequency"]
            for point in timeline
        ],
        dtype=np.float32
    )

    source_active = (
        source_pitch > 0
    ).astype(np.float32)

    # --------------------------------------------------------
    # NORMALIZE USER TIME
    # --------------------------------------------------------

    if (
        normalize_duration is not None
        and comparison_duration is not None
        and normalize_duration > 0
    ):

        source_times = (
            source_times
            / normalize_duration
            * comparison_duration
        )

    if len(source_times) == 1:

        pitch = np.repeat(
            source_pitch[0],
            len(target_times)
        )

        active = np.repeat(
            source_active[0] > 0.5,
            len(target_times)
        )

        return pitch, active

    # --------------------------------------------------------
    # INTERPOLATE
    # --------------------------------------------------------

    pitch = np.interp(
        target_times,
        source_times,
        source_pitch
    )

    activity = np.interp(
        target_times,
        source_times,
        source_active
    )

    active = activity >= 0.5

    # Do not artificially extend singing outside
    # the actual source recording.
    active[
        target_times < source_times[0]
    ] = False

    active[
        target_times > source_times[-1]
    ] = False

    pitch[
        ~active
    ] = 0

    return (
        pitch.astype(np.float32),
        active
    )


# ============================================================
# OLD COMPATIBILITY FUNCTION
# ============================================================

def interpolate_timeline(
    timeline,
    target_times
):

    pitch, _ = resample_timeline(
        timeline,
        target_times
    )

    return pitch


# ============================================================
# AI FEATURE EXTRACTION
#
# EXACT SAME ORDER AS train_model.py
#
# 0 = pitch accuracy
# 1 = note match
# 2 = timing accuracy
# 3 = stability
# 4 = average pitch error
# 5 = voiced ratio
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

    # --------------------------------------------------------
    # VOICED RATIO
    #
    # Percentage of reference singing regions where the
    # user also produced voiced audio.
    # --------------------------------------------------------

    reference_voiced = np.sum(
        reference_active
    )

    if reference_voiced > 0:

        voiced_ratio = (
            np.sum(
                user_active[
                    reference_active
                ]
            )
            / reference_voiced
        )

    else:

        voiced_ratio = 0.0

    voiced_ratio = float(
        np.clip(
            voiced_ratio,
            0.0,
            1.0
        )
    )

    # --------------------------------------------------------
    # EXACT MODEL FEATURE ORDER
    # --------------------------------------------------------

    features = np.array(
        [
            pitch_accuracy,
            note_match,
            timing_accuracy,
            stability,
            average_pitch_error,
            voiced_ratio
        ],
        dtype=np.float32
    )

    return features


# ============================================================
# AI PREDICTION
# ============================================================

def predict_ai_score(
    features
):

    if music_model is None:

        return None

    try:

        prediction = music_model.predict(
            features.reshape(
                1,
                -1
            )
        )[0]

        return float(
            np.clip(
                prediction,
                0,
                100
            )
        )

    except Exception as error:

        print(
            "AI prediction error:",
            str(error)
        )

        return None


# ============================================================
# MUSIC SCORE CALCULATION
# ============================================================

def calculate_music_score_from_timelines(
    reference_timeline,
    user_timeline
):

    reference_valid = [
        point
        for point in reference_timeline
        if point["frequency"] > 0
    ]

    user_valid = [
        point
        for point in user_timeline
        if point["frequency"] > 0
    ]

    # ========================================================
    # NO REFERENCE
    # ========================================================

    if not reference_valid:

        return {
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
            "feedback": [
                "The reference song did not contain enough detectable melody."
            ]
        }

    # ========================================================
    # NO USER VOICE
    # ========================================================

    if not user_valid:

        return {
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
            "feedback": [
                "We could not detect enough singing from your recording."
            ]
        }

    # ========================================================
    # RECORDING DURATIONS
    # ========================================================

    reference_duration = max(
        point["time"]
        for point in reference_valid
    )

    user_duration = max(
        point["time"]
        for point in user_valid
    )

    reference_duration = max(
        reference_duration,
        0.1
    )

    user_duration = max(
        user_duration,
        0.1
    )

    comparison_duration = min(
        reference_duration,
        user_duration
    )

    # ========================================================
    # TIME GRID
    # ========================================================

    sample_count = min(
        MAX_GRAPH_POINTS,
        max(
            50,
            int(
                comparison_duration * 20
            )
        )
    )

    target_times = np.linspace(
        0,
        comparison_duration,
        sample_count
    )

    # ========================================================
    # REFERENCE RESAMPLING
    # ========================================================

    reference_pitch, reference_active = (
        resample_timeline(
            reference_timeline,
            target_times
        )
    )

    # ========================================================
    # USER RESAMPLING
    #
    # User recording is normalized to the reference duration.
    # ========================================================

    user_pitch, user_active = (
        resample_timeline(
            user_timeline,
            target_times,
            normalize_duration=user_duration,
            comparison_duration=comparison_duration
        )
    )

    # ========================================================
    # ONLY COMPARE WHERE BOTH ARE VOICED
    # ========================================================

    both_active = (
        reference_active
        & user_active
    )

    matching_indexes = np.where(
        both_active
    )[0]

    if len(matching_indexes) == 0:

        return {
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
            "feedback": [
                "We could not find enough overlapping singing between the reference and your recording."
            ]
        }

    # ========================================================
    # CENTS ERRORS
    # ========================================================

    cents_errors = []

    for index in matching_indexes:

        cents = calculate_cents(
            reference_pitch[index],
            user_pitch[index]
        )

        if cents is not None:

            cents_errors.append(
                cents
            )

    if not cents_errors:

        return {
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
            "feedback": [
                "Not enough matching pitch information was found."
            ]
        }

    cents_errors = np.asarray(
        cents_errors,
        dtype=np.float32
    )

    absolute_errors = np.abs(
        cents_errors
    )

    # ========================================================
    # PITCH ACCURACY
    # ========================================================

    pitch_accuracy = float(
        np.mean(
            np.exp(
                -absolute_errors / 100.0
            )
        )
        * 100
    )

    pitch_accuracy = float(
        np.clip(
            pitch_accuracy,
            0,
            100
        )
    )

    # ========================================================
    # NOTE MATCH
    #
    # Within 50 cents = same musical note.
    # ========================================================

    note_match = float(
        np.mean(
            absolute_errors <= 50
        )
        * 100
    )

    # ========================================================
    # TIMING ACCURACY
    # ========================================================

    reference_voiced_count = np.sum(
        reference_active
    )

    if reference_voiced_count > 0:

        timing_accuracy = float(
            np.sum(
                user_active[
                    reference_active
                ]
            )
            / reference_voiced_count
            * 100
        )

    else:

        timing_accuracy = 0.0

    timing_accuracy = float(
        np.clip(
            timing_accuracy,
            0,
            100
        )
    )

    # ========================================================
    # STABILITY
    #
    # Compare pitch movement rather than raw pitch level.
    # ========================================================

    user_voiced_pitch = user_pitch[
        user_active
    ]

    reference_voiced_pitch = reference_pitch[
        reference_active
    ]

    if len(user_voiced_pitch) > 2:

        user_changes = np.diff(
            user_voiced_pitch
        )

        user_variation = float(
            np.std(
                user_changes
            )
        )

    else:

        user_variation = 0.0

    if len(reference_voiced_pitch) > 2:

        reference_changes = np.diff(
            reference_voiced_pitch
        )

        reference_variation = float(
            np.std(
                reference_changes
            )
        )

    else:

        reference_variation = 0.0

    if reference_variation > 0:

        variation_difference = (
            abs(
                user_variation
                - reference_variation
            )
            / reference_variation
        )

        stability = (
            100
            * np.exp(
                -variation_difference
            )
        )

    else:

        stability = 100.0

    stability = float(
        np.clip(
            stability,
            0,
            100
        )
    )

    # ========================================================
    # AVERAGE PITCH ERROR
    # ========================================================

    average_error = float(
        np.mean(
            absolute_errors
        )
    )

    # ========================================================
    # RULE-BASED SCORE
    # ========================================================

    rule_based_score = (
        pitch_accuracy * 0.50
        + note_match * 0.25
        + timing_accuracy * 0.15
        + stability * 0.10
    )

    rule_based_score = float(
        np.clip(
            rule_based_score,
            0,
            100
        )
    )

    # ========================================================
    # AI FEATURES
    # ========================================================

    ai_features = calculate_ai_features(
        pitch_accuracy,
        note_match,
        timing_accuracy,
        stability,
        average_error,
        reference_active,
        user_active
    )

    # ========================================================
    # RANDOM FOREST AI SCORE
    # ========================================================

    ai_score = predict_ai_score(
        ai_features
    )

    # ========================================================
    # FINAL SCORE
    #
    # 60% trained ML model
    # 40% explainable audio-analysis score
    # ========================================================

    if ai_score is not None:

        overall_score = (
            ai_score * 0.60
            + rule_based_score * 0.40
        )

        ai_model_used = True

        ai_model_name = (
            "Random Forest Music Performance Model"
        )

    else:

        overall_score = (
            rule_based_score
        )

        ai_model_used = False

        ai_model_name = "Unavailable"

    overall_score = float(
        np.clip(
            overall_score,
            0,
            100
        )
    )

    # ========================================================
    # FEEDBACK
    # ========================================================

    feedback = []

    # --------------------------------------------------------
    # Pitch
    # --------------------------------------------------------

    if pitch_accuracy >= 90:

        feedback.append(
            "Excellent pitch control."
        )

    elif pitch_accuracy >= 75:

        feedback.append(
            "Good pitch control with only small corrections needed."
        )

    elif pitch_accuracy >= 55:

        feedback.append(
            "Your pitch is developing. Practise slowly with the reference."
        )

    else:

        feedback.append(
            "Focus on matching the reference note before increasing speed."
        )

    # --------------------------------------------------------
    # Notes
    # --------------------------------------------------------

    if note_match >= 85:

        feedback.append(
            "Most of your notes matched the reference closely."
        )

    elif note_match >= 65:

        feedback.append(
            "Several notes matched, but some need pitch correction."
        )

    else:

        feedback.append(
            "Try holding each note and matching its pitch carefully."
        )

    # --------------------------------------------------------
    # Timing
    # --------------------------------------------------------

    if timing_accuracy >= 85:

        feedback.append(
            "Your singing timing follows the reference well."
        )

    elif timing_accuracy >= 65:

        feedback.append(
            "Your timing is fairly good, but some sections need better alignment."
        )

    else:

        feedback.append(
            "Try following the reference rhythm and entering each phrase at the correct time."
        )

    # --------------------------------------------------------
    # Pitch error
    # --------------------------------------------------------

    if average_error <= 25:

        feedback.append(
            "Your average pitch error is very small."
        )

    elif average_error <= 50:

        feedback.append(
            "Your average pitch error is within a good musical range."
        )

    elif average_error <= 100:

        feedback.append(
            "Some notes are noticeably sharp or flat."
        )

    else:

        feedback.append(
            "Several notes are significantly different from the reference."
        )

    # --------------------------------------------------------
    # AI feedback
    # --------------------------------------------------------

    if ai_score is not None:

        if ai_score >= 90:

            feedback.append(
                "AI evaluation: your overall singing performance is excellent."
            )

        elif ai_score >= 75:

            feedback.append(
                "AI evaluation: your performance is good with some areas to improve."
            )

        elif ai_score >= 60:

            feedback.append(
                "AI evaluation: your performance is developing. Focused practice can improve your score."
            )

        else:

            feedback.append(
                "AI evaluation: focus on pitch matching and consistent singing before increasing song difficulty."
            )

    # ========================================================
    # RETURN
    # ========================================================

    return {

        "overall_score": round(
            overall_score,
            2
        ),

        "ai_score": (
            round(
                ai_score,
                2
            )
            if ai_score is not None
            else None
        ),

        "rule_based_score": round(
            rule_based_score,
            2
        ),

        "ai_model": ai_model_name,

        "ai_model_used": ai_model_used,

        "pitch_accuracy": round(
            pitch_accuracy,
            2
        ),

        "note_match": round(
            note_match,
            2
        ),

        "timing_accuracy": round(
            timing_accuracy,
            2
        ),

        "stability": round(
            stability,
            2
        ),

        "average_pitch_error_cents": round(
            average_error,
            2
        ),

        "feedback": feedback,

        "reference_pitch": [
            round(
                float(value),
                2
            )
            for value in reference_pitch
        ],

        "user_pitch": [
            round(
                float(value),
                2
            )
            for value in user_pitch
        ],

        "comparison_times": [
            round(
                float(value),
                3
            )
            for value in target_times
        ]
    }


# ============================================================
# SAVE UPLOAD
# ============================================================

async def save_upload(
    uploaded_file: UploadFile
):

    suffix = ""

    if uploaded_file.filename:

        _, extension = os.path.splitext(
            uploaded_file.filename
        )

        suffix = extension

    temporary_file = tempfile.NamedTemporaryFile(
        suffix=suffix,
        delete=False
    )

    file_path = temporary_file.name

    try:

        while True:

            chunk = await uploaded_file.read(
                1024 * 1024
            )

            if not chunk:

                break

            temporary_file.write(
                chunk
            )

        temporary_file.close()

        return file_path

    except Exception:

        temporary_file.close()

        if os.path.exists(file_path):

            os.remove(
                file_path
            )

        raise


# ============================================================
# ANALYZE SONG
# ============================================================

@app.post("/analyze-song")
async def analyze_song(
    file: UploadFile = File(...)
):

    file_path = None

    try:

        if not file.filename:

            raise HTTPException(
                status_code=400,
                detail="No song file was selected."
            )

        file_path = await save_upload(
            file
        )

        audio, sample_rate = load_audio(
            file_path
        )

        if len(audio) == 0:

            raise HTTPException(
                status_code=400,
                detail="The uploaded song contains no readable audio."
            )

        timeline = detect_pitch_timeline(
            audio,
            sample_rate
        )

        valid_pitch = [
            point
            for point in timeline
            if point["frequency"] > 0
        ]

        if not valid_pitch:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Could not detect pitch from this song. "
                    "Please try a clearer audio file."
                )
            )

        pitch_data = create_pitch_data(
            timeline
        )

        duration = min(
            len(audio) / sample_rate,
            MAX_ANALYSIS_SECONDS
        )

        return {

            "success": True,

            "filename": file.filename,

            "duration": round(
                float(duration),
                2
            ),

            "total_pitch_points": len(
                valid_pitch
            ),

            "pitch_data": pitch_data,

            "prototype_note": (
                "The first 20 seconds are analysed. "
                "Pitch points contain real time information."
            )
        }

    except HTTPException:

        raise

    except Exception as error:

        print(
            "ANALYZE SONG ERROR:",
            str(error)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Song analysis failed: "
                + str(error)
            )
        )

    finally:

        if (
            file_path
            and
            os.path.exists(file_path)
        ):

            try:

                os.remove(
                    file_path
                )

            except Exception:

                pass


# ============================================================
# ANALYZE VOICE
# ============================================================

@app.post("/analyze-voice")
async def analyze_voice(
    file: UploadFile = File(...)
):

    file_path = None

    try:

        if not file.filename:

            raise HTTPException(
                status_code=400,
                detail="No voice recording was selected."
            )

        file_path = await save_upload(
            file
        )

        audio, sample_rate = load_audio(
            file_path
        )

        if len(audio) == 0:

            raise HTTPException(
                status_code=400,
                detail="The recording contains no readable audio."
            )

        timeline = detect_pitch_timeline(
            audio,
            sample_rate
        )

        valid_pitch = [
            point["frequency"]
            for point in timeline
            if point["frequency"] > 0
        ]

        if not valid_pitch:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Could not detect your voice pitch. "
                    "Please record in a quieter environment "
                    "and make sure your voice is clearly audible."
                )
            )

        pitch_array = np.asarray(
            valid_pitch,
            dtype=np.float32
        )

        return {

            "success": True,

            "pitch_data":
                create_pitch_data(
                    timeline
                ),

            "average_pitch": round(
                float(
                    np.mean(
                        pitch_array
                    )
                ),
                2
            ),

            "minimum_pitch": round(
                float(
                    np.min(
                        pitch_array
                    )
                ),
                2
            ),

            "maximum_pitch": round(
                float(
                    np.max(
                        pitch_array
                    )
                ),
                2
            ),

            "total_pitch_points": len(
                valid_pitch
            )
        }

    except HTTPException:

        raise

    except Exception as error:

        print(
            "ANALYZE VOICE ERROR:",
            str(error)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Voice analysis failed: "
                + str(error)
            )
        )

    finally:

        if (
            file_path
            and
            os.path.exists(file_path)
        ):

            try:

                os.remove(
                    file_path
                )

            except Exception:

                pass


# ============================================================
# COMPARE SONG + VOICE
#
# THIS IS THE MAIN AI ENDPOINT
# ============================================================

@app.post("/compare-song-voice")
async def compare_song_voice(
    song: UploadFile = File(...),
    voice: UploadFile = File(...)
):

    song_path = None

    voice_path = None

    try:

        if not song.filename:

            raise HTTPException(
                status_code=400,
                detail="No song file was provided."
            )

        if not voice.filename:

            raise HTTPException(
                status_code=400,
                detail="No voice recording was provided."
            )

        # ----------------------------------------------------
        # SAVE FILES
        # ----------------------------------------------------

        song_path = await save_upload(
            song
        )

        voice_path = await save_upload(
            voice
        )

        # ----------------------------------------------------
        # LOAD AUDIO
        # ----------------------------------------------------

        song_audio, song_sample_rate = load_audio(
            song_path
        )

        voice_audio, voice_sample_rate = load_audio(
            voice_path
        )

        if len(song_audio) == 0:

            raise HTTPException(
                status_code=400,
                detail="The uploaded song contains no readable audio."
            )

        if len(voice_audio) == 0:

            raise HTTPException(
                status_code=400,
                detail="The voice recording contains no readable audio."
            )

        # ----------------------------------------------------
        # REFERENCE PITCH
        # ----------------------------------------------------

        reference_timeline = detect_pitch_timeline(
            song_audio,
            song_sample_rate
        )

        # ----------------------------------------------------
        # USER PITCH
        # ----------------------------------------------------

        user_timeline = detect_pitch_timeline(
            voice_audio,
            voice_sample_rate
        )

        # ----------------------------------------------------
        # VALIDATE REFERENCE
        # ----------------------------------------------------

        if not any(
            point["frequency"] > 0
            for point in reference_timeline
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Could not detect enough pitch "
                    "from the uploaded song."
                )
            )

        # ----------------------------------------------------
        # VALIDATE USER
        # ----------------------------------------------------

        if not any(
            point["frequency"] > 0
            for point in user_timeline
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Could not detect enough pitch "
                    "from your recording."
                )
            )

        # ----------------------------------------------------
        # CALCULATE SCORE + AI
        # ----------------------------------------------------

        score = calculate_music_score_from_timelines(
            reference_timeline,
            user_timeline
        )

        # ----------------------------------------------------
        # RETURN RESULT
        # ----------------------------------------------------

        return {

            "success": True,

            "overall_score":
                score["overall_score"],

            "ai_score":
                score["ai_score"],

            "rule_based_score":
                score["rule_based_score"],

            "ai_model":
                score["ai_model"],

            "ai_model_used":
                score["ai_model_used"],

            "pitch_accuracy":
                score["pitch_accuracy"],

            "note_match":
                score["note_match"],

            "timing_accuracy":
                score["timing_accuracy"],

            "stability":
                score["stability"],

            "average_pitch_error_cents":
                score[
                    "average_pitch_error_cents"
                ],

            "reference_pitch":
                score[
                    "reference_pitch"
                ],

            "user_pitch":
                score[
                    "user_pitch"
                ],

            "comparison_times":
                score[
                    "comparison_times"
                ],

            "feedback":
                score["feedback"],

            "reference_timeline":
                reduce_pitch_timeline(
                    reference_timeline
                ),

            "user_timeline":
                reduce_pitch_timeline(
                    user_timeline
                ),

            "prototype_note": (
                "SkillSensAI extracts vocal pitch and "
                "performance features and evaluates them "
                "using a trained Random Forest machine-learning model."
            )
        }

    except HTTPException:

        raise

    except Exception as error:

        print(
            "COMPARE SONG + VOICE ERROR:",
            str(error)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Song and voice comparison failed: "
                + str(error)
            )
        )

    finally:

        # ----------------------------------------------------
        # DELETE SONG
        # ----------------------------------------------------

        if (
            song_path
            and
            os.path.exists(song_path)
        ):

            try:

                os.remove(
                    song_path
                )

            except Exception:

                pass

        # ----------------------------------------------------
        # DELETE VOICE
        # ----------------------------------------------------

        if (
            voice_path
            and
            os.path.exists(voice_path)
        ):

            try:

                os.remove(
                    voice_path
                )

            except Exception:

                pass


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
async def startup_event():

    print()
    print("==========================================")
    print("      SkillSensAI Backend Started")
    print("==========================================")

    print(
        f"Sample rate: {SAMPLE_RATE} Hz"
    )

    print(
        f"Maximum analysis: "
        f"{MAX_ANALYSIS_SECONDS} seconds"
    )

    print(
        f"Maximum graph points: "
        f"{MAX_GRAPH_POINTS}"
    )

    print(
        "Pitch analysis: ACTIVE"
    )

    print(
        "Time-aware comparison: ACTIVE"
    )

    print(
        "Machine-learning model: "
        + (
            "ACTIVE"
            if music_model is not None
            else "UNAVAILABLE"
        )
    )

    if music_model is not None:

        print(
            "AI model: Random Forest Regressor"
        )

        print(
            "AI features: 6"
        )

    print("==========================================")
    print()
