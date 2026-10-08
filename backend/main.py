from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import os
import tempfile
import subprocess

import numpy as np
import librosa
import imageio_ffmpeg


# ============================================================
# APP CONFIGURATION
# ============================================================

app = FastAPI(
    title="SkillSensAI Backend",
    description="AI-powered skill learning backend for SkillSensAI",
    version="2.0.0"
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
# ANALYSIS SETTINGS
# ============================================================

SAMPLE_RATE = 16000

MAX_ANALYSIS_SECONDS = 20

MAX_GRAPH_POINTS = 250

FRAME_LENGTH = 2048

HOP_LENGTH = 512


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message": "SkillSensAI backend is running!",
        "status": "online",
        "version": "2.0.0"
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {
        "success": True,
        "status": "healthy"
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
# CONVERT TO WAV
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
# PITCH DETECTION
#
# Returns pitch for every time frame.
#
# 0 means that no reliable pitch was detected.
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
    # REMOVE EXTREMELY QUIET SIGNALS
    # --------------------------------------------------------

    rms = librosa.feature.rms(
        y=audio,
        frame_length=FRAME_LENGTH,
        hop_length=HOP_LENGTH
    )[0]


    # --------------------------------------------------------
    # PITCH DETECTION
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

    except Exception:

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
        # Ignore very quiet frames
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
# PITCH DETECTION
# Compatibility helper
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
# CREATE GRAPH DATA
# ============================================================

def create_pitch_data(
    timeline
):

    reduced = reduce_pitch_timeline(
        timeline,
        MAX_GRAPH_POINTS
    )

    return reduced


# ============================================================
# CENTS ERROR
#
# Positive = user is HIGH
# Negative = user is LOW
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
# PITCH ACCURACY FROM CENTS
# ============================================================

def cents_to_accuracy(
    cents
):

    if cents is None:

        return 0.0


    absolute_error = abs(
        cents
    )


    # Very forgiving musical tolerance.
    #
    # 0 cents   = 100
    # 25 cents  ≈ excellent
    # 50 cents  ≈ good
    # 100 cents ≈ one semitone
    # 200 cents ≈ two semitones

    accuracy = (
        100
        * np.exp(
            -absolute_error / 100.0
        )
    )


    return float(
        np.clip(
            accuracy,
            0,
            100
        )
    )


# ============================================================
# TIME ALIGNMENT
#
# Instead of comparing array positions, compare the
# reference and user recordings across normalized time.
# ============================================================

def interpolate_timeline(
    timeline,
    target_times
):

    if not timeline:

        return np.zeros(
            len(target_times),
            dtype=np.float32
        )


    valid = [
        point
        for point in timeline
        if point["frequency"] > 0
    ]


    if not valid:

        return np.zeros(
            len(target_times),
            dtype=np.float32
        )


    source_times = np.array(
        [
            point["time"]
            for point in valid
        ],
        dtype=np.float32
    )


    source_pitch = np.array(
        [
            point["frequency"]
            for point in valid
        ],
        dtype=np.float32
    )


    if len(source_pitch) == 1:

        return np.repeat(
            source_pitch[0],
            len(target_times)
        )


    return np.interp(
        target_times,
        source_times,
        source_pitch
    )


# ============================================================
# SCORE REFERENCE + USER
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


    if not reference_valid:

        return {
            "overall_score": 0,
            "pitch_accuracy": 0,
            "note_match": 0,
            "timing_accuracy": 0,
            "stability": 0,
            "average_pitch_error_cents": 0,
            "feedback": [
                "The reference song did not contain enough detectable melody."
            ]
        }


    if not user_valid:

        return {
            "overall_score": 0,
            "pitch_accuracy": 0,
            "note_match": 0,
            "timing_accuracy": 0,
            "stability": 0,
            "average_pitch_error_cents": 0,
            "feedback": [
                "We could not detect enough singing from your recording."
            ]
        }


    # --------------------------------------------------------
    # NORMALIZED TIME
    # --------------------------------------------------------

    reference_duration = max(
        point["time"]
        for point in reference_valid
    )


    user_duration = max(
        point["time"]
        for point in user_valid
    )


    if reference_duration <= 0:
        reference_duration = 1


    if user_duration <= 0:
        user_duration = 1


    comparison_duration = min(
        reference_duration,
        user_duration
    )


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


    reference_pitch = interpolate_timeline(
        reference_timeline,
        target_times
    )


    user_normalized_times = (
        np.array(
            [
                point["time"]
                for point in user_valid
            ],
            dtype=np.float32
        )
        / user_duration
        * comparison_duration
    )


    user_pitch_values = np.array(
        [
            point["frequency"]
            for point in user_valid
        ],
        dtype=np.float32
    )


    if len(user_pitch_values) > 1:

        user_pitch = np.interp(
            target_times,
            user_normalized_times,
            user_pitch_values
        )

    else:

        user_pitch = np.repeat(
            user_pitch_values[0],
            len(target_times)
        )


    # --------------------------------------------------------
    # CENTS
    # --------------------------------------------------------

    cents_errors = []

    valid_indexes = []


    for index in range(
        len(target_times)
    ):

        reference_value = (
            reference_pitch[index]
        )

        user_value = (
            user_pitch[index]
        )


        cents = calculate_cents(
            reference_value,
            user_value
        )


        if cents is None:
            continue


        cents_errors.append(
            cents
        )

        valid_indexes.append(
            index
        )


    if not cents_errors:

        return {
            "overall_score": 0,
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


    # --------------------------------------------------------
    # PITCH ACCURACY
    # --------------------------------------------------------

    pitch_accuracy = float(
        np.mean(
            np.exp(
                -absolute_errors / 100.0
            )
        )
        * 100
    )


    # --------------------------------------------------------
    # NOTE MATCH
    #
    # 50 cents = same musical note region.
    # 80 cents = still reasonably close.
    # --------------------------------------------------------

    note_match = float(
        np.mean(
            absolute_errors <= 50
        )
        * 100
    )


    # --------------------------------------------------------
    # TIMING ACCURACY
    #
    # Approximation based on how much usable singing overlaps
    # the reference melody.
    # --------------------------------------------------------

    reference_active = np.array(
        [
            reference_pitch[index] > 0
            for index in range(
                len(reference_pitch)
            )
        ]
    )


    user_active = np.array(
        [
            user_pitch[index] > 0
            for index in range(
                len(user_pitch)
            )
        ]
    )


    if np.any(reference_active):

        overlap = np.mean(
            user_active[
                reference_active
            ]
        )

        timing_accuracy = float(
            overlap * 100
        )

    else:

        timing_accuracy = 0.0


    # --------------------------------------------------------
    # STABILITY
    # --------------------------------------------------------

    if len(user_pitch) > 2:

        user_changes = np.diff(
            user_pitch
        )

        user_variation = float(
            np.std(
                user_changes
            )
        )

    else:

        user_variation = 0.0


    if len(reference_pitch) > 2:

        reference_changes = np.diff(
            reference_pitch
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


    # --------------------------------------------------------
    # OVERALL SCORE
    # --------------------------------------------------------

    overall_score = (
        pitch_accuracy * 0.50
        + note_match * 0.25
        + timing_accuracy * 0.15
        + stability * 0.10
    )


    overall_score = float(
        np.clip(
            overall_score,
            0,
            100
        )
    )


    # --------------------------------------------------------
    # FEEDBACK
    # --------------------------------------------------------

    feedback = []


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


    average_error = float(
        np.mean(
            absolute_errors
        )
    )


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


    return {

        "overall_score": round(
            overall_score,
            2
        ),

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


        song_path = await save_upload(
            song
        )


        voice_path = await save_upload(
            voice
        )


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


        reference_timeline = detect_pitch_timeline(
            song_audio,
            song_sample_rate
        )


        user_timeline = detect_pitch_timeline(
            voice_audio,
            voice_sample_rate
        )


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


        score = calculate_music_score_from_timelines(
            reference_timeline,
            user_timeline
        )


        return {

            "success": True,

            "overall_score":
                score["overall_score"],

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
                "Pitch is compared using a "
                "time-aware musical timeline."
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

    print(
        "=========================================="
    )

    print(
        "SkillSensAI backend started successfully."
    )

    print(
        "Music analysis engine: ACTIVE"
    )

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
        "Time-aware pitch comparison: ACTIVE"
    )

    print(
        "=========================================="
    )
