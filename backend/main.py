from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import os
import tempfile
import subprocess
import shutil

import numpy as np
import librosa
import imageio_ffmpeg


# ============================================================
# APP CONFIGURATION
# ============================================================

app = FastAPI(
    title="SkillSensAI Backend",
    description="AI-powered skill learning backend for SkillSensAI",
    version="1.0.0"
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

# Maximum audio analyzed per request.
# Keeping this at 20 seconds makes Render deployment
# significantly faster than analyzing the entire song.
MAX_ANALYSIS_SECONDS = 20

# Maximum number of points returned to the frontend graph.
MAX_GRAPH_POINTS = 200


# ============================================================
# BASIC ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "SkillSensAI backend is running!",
        "status": "online",
        "version": "1.0.0"
    }


# ============================================================
# HEALTH CHECK
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
    """
    Get the FFmpeg executable bundled/provided by
    imageio-ffmpeg.
    """

    try:
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception as error:
        raise RuntimeError(
            f"FFmpeg could not be found: {str(error)}"
        )


# ============================================================
# CONVERT UPLOAD TO WAV
# ============================================================

def convert_to_wav(input_path: str, output_path: str):
    """
    Convert uploaded audio/video into mono 16 kHz WAV.

    This allows MP3, M4A, WebM, WAV and other formats
    supported by FFmpeg to be processed consistently.
    """

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
    """
    Convert file to WAV and load only the first
    MAX_ANALYSIS_SECONDS seconds.
    """

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
# ============================================================

def detect_pitch(audio, sample_rate):
    """
    Detect fundamental frequency using librosa.yin().

    Returns a list of valid frequency values in Hz.

    Higher frequency = higher pitch
    Lower frequency = lower pitch
    """

    audio = np.asarray(
        audio,
        dtype=np.float32
    )

    if len(audio) == 0:
        return []

    # Normalize audio.
    try:
        audio = librosa.util.normalize(audio)
    except Exception:
        pass

    try:

        pitch = librosa.yin(
            audio,

            fmin=librosa.note_to_hz("C2"),

            fmax=librosa.note_to_hz("C7"),

            sr=sample_rate,

            frame_length=1024,

            hop_length=1024
        )

    except Exception:
        return []

    valid_pitch = []

    for value in pitch:

        if np.isfinite(value):

            valid_pitch.append(
                float(value)
            )

    return valid_pitch


# ============================================================
# REDUCE GRAPH POINTS
# ============================================================

def reduce_pitch_points(
    pitch_data,
    max_points=MAX_GRAPH_POINTS
):
    """
    Reduce pitch data so the frontend does not receive
    thousands of unnecessary graph points.

    Average values inside each segment.
    """

    if not pitch_data:
        return []

    pitch_data = np.asarray(
        pitch_data,
        dtype=np.float32
    )

    if len(pitch_data) <= max_points:

        return [
            float(round(value, 2))
            for value in pitch_data
        ]

    reduced = []

    chunks = np.array_split(
        pitch_data,
        max_points
    )

    for chunk in chunks:

        if len(chunk) == 0:
            continue

        reduced.append(
            float(
                round(
                    float(np.mean(chunk)),
                    2
                )
            )
        )

    return reduced


# ============================================================
# FREQUENCY → MUSICAL NOTE
# ============================================================

def frequency_to_note(frequency):
    """
    Convert frequency in Hz to a musical note name.
    """

    if frequency is None:
        return "Unknown"

    if not np.isfinite(frequency):
        return "Unknown"

    if frequency <= 0:
        return "Unknown"

    try:

        note_number = (
            12 * np.log2(frequency / 440.0)
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
# PITCH DATA FOR FRONTEND
# ============================================================

def create_pitch_data(pitch):
    """
    Convert pitch frequencies into objects that the
    frontend can use for its graph.

    Example:

    {
        "frequency": 440.0,
        "note": "A4"
    }
    """

    reduced = reduce_pitch_points(
        pitch,
        MAX_GRAPH_POINTS
    )

    result = []

    for frequency in reduced:

        result.append(
            {
                "frequency": frequency,
                "note": frequency_to_note(
                    frequency
                )
            }
        )

    return result


# ============================================================
# RESAMPLE PITCH DATA
# ============================================================

def resample_pitch(
    pitch,
    target_length
):
    """
    Resize pitch sequence to a common length
    so reference and user pitch can be compared.
    """

    if not pitch:
        return np.array(
            [],
            dtype=np.float32
        )

    if target_length <= 0:
        return np.array(
            [],
            dtype=np.float32
        )

    pitch = np.asarray(
        pitch,
        dtype=np.float32
    )

    if len(pitch) == target_length:
        return pitch

    if len(pitch) == 1:

        return np.repeat(
            pitch,
            target_length
        )

    old_x = np.linspace(
        0,
        1,
        len(pitch)
    )

    new_x = np.linspace(
        0,
        1,
        target_length
    )

    return np.interp(
        new_x,
        old_x,
        pitch
    )


# ============================================================
# PITCH ERROR IN CENTS
# ============================================================

def calculate_cents_error(
    reference,
    user
):
    """
    Calculate pitch difference in cents.

    100 cents = 1 semitone.

    This uses the ratio between the two frequencies.
    """

    reference = np.asarray(
        reference,
        dtype=np.float32
    )

    user = np.asarray(
        user,
        dtype=np.float32
    )

    if (
        len(reference) == 0
        or len(user) == 0
    ):
        return np.array(
            [],
            dtype=np.float32
        )

    minimum_length = min(
        len(reference),
        len(user)
    )

    reference = reference[
        :minimum_length
    ]

    user = user[
        :minimum_length
    ]

    valid = (
        (reference > 0)
        &
        (user > 0)
        &
        np.isfinite(reference)
        &
        np.isfinite(user)
    )

    reference = reference[valid]
    user = user[valid]

    if len(reference) == 0:
        return np.array(
            [],
            dtype=np.float32
        )

    cents = (
        1200
        *
        np.log2(
            user / reference
        )
    )

    return cents


# ============================================================
# CALCULATE MUSIC SCORE
# ============================================================

def calculate_music_score(
    reference,
    user
):
    """
    Calculate prototype singing accuracy.

    The comparison is based on pitch distance.

    Smaller pitch error = higher accuracy.
    """

    if (
        len(reference) == 0
        or len(user) == 0
    ):
        return {
            "overall_score": 0,
            "pitch_accuracy": 0,
            "note_match": 0,
            "stability": 0,
            "average_pitch_error_cents": 0,
            "feedback": [
                "We could not detect enough pitch from the recording."
            ]
        }

    target_length = min(
        len(reference),
        len(user),
        MAX_GRAPH_POINTS
    )

    reference_resampled = resample_pitch(
        reference,
        target_length
    )

    user_resampled = resample_pitch(
        user,
        target_length
    )

    cents_error = calculate_cents_error(
        reference_resampled,
        user_resampled
    )

    if len(cents_error) == 0:

        return {
            "overall_score": 0,
            "pitch_accuracy": 0,
            "note_match": 0,
            "stability": 0,
            "average_pitch_error_cents": 0,
            "feedback": [
                "Your recording did not contain enough detectable pitch."
            ]
        }

    absolute_error = np.abs(
        cents_error
    )

    average_error = float(
        np.mean(absolute_error)
    )

    # --------------------------------------------------------
    # Pitch accuracy
    #
    # 0 cents = perfect match.
    # The score gradually decreases as pitch error grows.
    # --------------------------------------------------------

    pitch_accuracy = (
        100
        *
        np.mean(
            np.exp(
                -absolute_error / 100.0
            )
        )
    )

    pitch_accuracy = float(
        np.clip(
            pitch_accuracy,
            0,
            100
        )
    )

    # --------------------------------------------------------
    # Note match
    #
    # Count how many frames are within 50 cents.
    # --------------------------------------------------------

    note_match = float(
        np.mean(
            absolute_error <= 50
        )
        * 100
    )

    # --------------------------------------------------------
    # Stability
    #
    # Measures how much the user's pitch changes
    # relative to the reference.
    # --------------------------------------------------------

    if len(user_resampled) > 1:

        user_changes = np.diff(
            user_resampled
        )

        user_variation = float(
            np.std(user_changes)
        )

    else:

        user_variation = 0.0

    if len(reference_resampled) > 1:

        reference_changes = np.diff(
            reference_resampled
        )

        reference_variation = float(
            np.std(reference_changes)
        )

    else:

        reference_variation = 0.0

    if reference_variation > 0:

        stability_difference = (
            abs(
                user_variation
                -
                reference_variation
            )
            /
            reference_variation
        )

        stability = (
            100
            *
            np.exp(
                -stability_difference
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
    # Overall score
    # --------------------------------------------------------

    overall_score = (
        pitch_accuracy * 0.55
        +
        note_match * 0.30
        +
        stability * 0.15
    )

    overall_score = float(
        np.clip(
            overall_score,
            0,
            100
        )
    )

    # --------------------------------------------------------
    # Feedback
    # --------------------------------------------------------

    feedback = []

    if pitch_accuracy >= 85:

        feedback.append(
            "Excellent pitch matching."
        )

    elif pitch_accuracy >= 70:

        feedback.append(
            "Good pitch control. Keep practising."
        )

    elif pitch_accuracy >= 50:

        feedback.append(
            "Your pitch is developing. Practise slowly with the reference."
        )

    else:

        feedback.append(
            "Try singing more slowly and focus on matching the reference pitch."
        )

    if note_match >= 80:

        feedback.append(
            "Most of your notes are close to the reference."
        )

    elif note_match >= 60:

        feedback.append(
            "Several notes are close, but some need pitch correction."
        )

    else:

        feedback.append(
            "Work on matching each note before increasing singing speed."
        )

    if average_error <= 30:

        feedback.append(
            "Your average pitch difference is very small."
        )

    elif average_error <= 70:

        feedback.append(
            "Your average pitch difference is moderate."
        )

    else:

        feedback.append(
            "There is a noticeable pitch difference from the reference."
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

        "stability": round(
            stability,
            2
        ),

        "average_pitch_error_cents": round(
            average_error,
            2
        ),

        "feedback": feedback
    }


# ============================================================
# SAVE UPLOADED FILE
# ============================================================

async def save_upload(
    uploaded_file: UploadFile
):
    """
    Save an uploaded file to a temporary location.
    """

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
            os.remove(file_path)

        raise


# ============================================================
# ANALYZE SONG
# ============================================================

@app.post("/analyze-song")
async def analyze_song(
    file: UploadFile = File(...)
):
    """
    Upload a song and extract its pitch.

    Returns pitch_data for the frontend graph.
    """

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

        pitch = detect_pitch(
            audio,
            sample_rate
        )

        if len(pitch) == 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Could not detect pitch from this song. "
                    "Please try a clearer audio file."
                )
            )

        pitch_data = create_pitch_data(
            pitch
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
                pitch
            ),

            "pitch_data": pitch_data,

            "prototype_note": (
                "The prototype currently analyses "
                "the first 20 seconds of the uploaded song."
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
                os.remove(file_path)
            except Exception:
                pass


# ============================================================
# ANALYZE VOICE
# ============================================================

@app.post("/analyze-voice")
async def analyze_voice(
    file: UploadFile = File(...)
):
    """
    Analyze a user's voice recording independently.

    Used by Learn From Scratch.
    """

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

        pitch = detect_pitch(
            audio,
            sample_rate
        )

        if len(pitch) == 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Could not detect your voice pitch. "
                    "Please record in a quieter environment "
                    "and make sure your voice is clearly audible."
                )
            )

        pitch_points = reduce_pitch_points(
            pitch,
            MAX_GRAPH_POINTS
        )

        # Basic prototype statistics.
        pitch_array = np.asarray(
            pitch,
            dtype=np.float32
        )

        average_pitch = float(
            np.mean(pitch_array)
        )

        minimum_pitch = float(
            np.min(pitch_array)
        )

        maximum_pitch = float(
            np.max(pitch_array)
        )

        return {
            "success": True,

            "pitch": pitch_points,

            "average_pitch": round(
                average_pitch,
                2
            ),

            "minimum_pitch": round(
                minimum_pitch,
                2
            ),

            "maximum_pitch": round(
                maximum_pitch,
                2
            ),

            "total_pitch_points": len(
                pitch
            ),

            "prototype_note": (
                "This endpoint detects the pitch "
                "of the uploaded voice recording."
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
                os.remove(file_path)
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
    """
    Compare the uploaded song's pitch with the
    user's voice pitch.

    Returns:
        - overall score
        - pitch accuracy
        - note match
        - stability
        - average pitch error
        - reference pitch points
        - user pitch points
        - feedback
    """

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
        # LOAD SONG
        # ----------------------------------------------------

        song_audio, song_sample_rate = load_audio(
            song_path
        )

        # ----------------------------------------------------
        # LOAD USER VOICE
        # ----------------------------------------------------

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
        # DETECT REFERENCE SONG PITCH
        # ----------------------------------------------------

        reference_pitch = detect_pitch(
            song_audio,
            song_sample_rate
        )

        # ----------------------------------------------------
        # DETECT USER PITCH
        # ----------------------------------------------------

        user_pitch = detect_pitch(
            voice_audio,
            voice_sample_rate
        )

        if len(reference_pitch) == 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Could not detect enough pitch "
                    "from the uploaded song."
                )
            )

        if len(user_pitch) == 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Could not detect enough pitch "
                    "from your recording."
                )
            )

        # ----------------------------------------------------
        # REDUCE DATA FOR FRONTEND
        # ----------------------------------------------------

        reference_points = reduce_pitch_points(
            reference_pitch,
            MAX_GRAPH_POINTS
        )

        user_points = reduce_pitch_points(
            user_pitch,
            MAX_GRAPH_POINTS
        )

        # ----------------------------------------------------
        # CALCULATE SCORE
        # ----------------------------------------------------

        score = calculate_music_score(
            reference_points,
            user_points
        )

        # ----------------------------------------------------
        # FINAL RESPONSE
        # ----------------------------------------------------

        return {
            "success": True,

            "overall_score":
                score["overall_score"],

            "pitch_accuracy":
                score["pitch_accuracy"],

            "note_match":
                score["note_match"],

            "stability":
                score["stability"],

            "average_pitch_error_cents":
                score[
                    "average_pitch_error_cents"
                ],

            # -----------------------------------------------
            # GRAPH DATA
            # -----------------------------------------------

            "reference_pitch": [
                round(
                    float(value),
                    2
                )
                for value in reference_points
            ],

            "user_pitch": [
                round(
                    float(value),
                    2
                )
                for value in user_points
            ],

            # -----------------------------------------------
            # FEEDBACK
            # -----------------------------------------------

            "feedback":
                score["feedback"],

            "prototype_note": (
                "The prototype compares pitch "
                "sequences from the first 20 seconds "
                "of the reference song and voice recording."
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
        # CLEAN TEMPORARY SONG
        # ----------------------------------------------------

        if (
            song_path
            and
            os.path.exists(song_path)
        ):

            try:
                os.remove(song_path)
            except Exception:
                pass

        # ----------------------------------------------------
        # CLEAN TEMPORARY VOICE
        # ----------------------------------------------------

        if (
            voice_path
            and
            os.path.exists(voice_path)
        ):

            try:
                os.remove(voice_path)
            except Exception:
                pass


# ============================================================
# STARTUP MESSAGE
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
        "=========================================="
    )
