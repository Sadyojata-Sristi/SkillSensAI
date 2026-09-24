from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

import librosa
import numpy as np
import tempfile
import os
import subprocess
import imageio_ffmpeg


app = FastAPI(
    title="SkillSensAI",
    description="AI Powered Skill Learning Platform"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "SkillSensAI backend is running!"
    }


# =========================================================
# AUDIO CONVERSION
# =========================================================

def convert_to_wav(input_path):
    ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()

    output_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".wav"
    )

    output_path = output_file.name
    output_file.close()

    command = [
        ffmpeg_path,
        "-y",
        "-i",
        input_path,
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-acodec",
        "pcm_s16le",
        output_path
    ]

    subprocess.run(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True
    )

    return output_path


# =========================================================
# FAST PITCH DETECTION
# =========================================================

def detect_pitch(audio, sample_rate):
    audio = np.asarray(
        audio,
        dtype=np.float32
    )

    if len(audio) == 0:
        return []

    # Normalize audio
    audio = librosa.util.normalize(audio)

    # Faster pitch detection configuration
    f0, voiced_flag, voiced_prob = librosa.pyin(
        audio,
        fmin=librosa.note_to_hz("C2"),
        fmax=librosa.note_to_hz("C7"),
        sr=sample_rate,
        frame_length=1024,
        hop_length=512
    )

    valid_pitch = []

    for pitch, voiced in zip(
        f0,
        voiced_flag
    ):

        if (
            voiced
            and not np.isnan(pitch)
        ):
            valid_pitch.append(
                float(pitch)
            )

    return valid_pitch


# =========================================================
# ANALYZE SONG
# =========================================================

@app.post("/analyze-song")
async def analyze_song(
    file: UploadFile = File(...)
):

    original_path = None
    wav_path = None

    try:

        # -------------------------------------------------
        # Save uploaded file
        # -------------------------------------------------

        suffix = os.path.splitext(
            file.filename or ""
        )[1] or ".audio"

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            content = await file.read()

            temp_file.write(content)

            original_path = temp_file.name


        # -------------------------------------------------
        # Convert audio
        # -------------------------------------------------

        wav_path = convert_to_wav(
            original_path
        )


        # -------------------------------------------------
        # Load ONLY first 30 seconds
        # -------------------------------------------------

        audio, sample_rate = librosa.load(
            wav_path,
            sr=16000,
            mono=True,
            duration=30
        )


        if len(audio) == 0:

            return {
                "success": False,
                "error": "The uploaded audio is empty."
            }


        # -------------------------------------------------
        # Detect pitch
        # -------------------------------------------------

        pitches = detect_pitch(
            audio,
            sample_rate
        )


        if len(pitches) < 3:

            return {
                "success": False,
                "error": (
                    "A clear vocal pitch could not "
                    "be detected in the uploaded song."
                )
            }


        # -------------------------------------------------
        # Convert pitch → musical notes
        # -------------------------------------------------

        notes = []

        for pitch in pitches:

            midi_note = librosa.hz_to_midi(
                pitch
            )

            note_name = librosa.midi_to_note(
                round(midi_note)
            )

            notes.append({

                "frequency": round(
                    float(pitch),
                    2
                ),

                "note": note_name

            })


        # -------------------------------------------------
        # Limit graph points
        # -------------------------------------------------

        max_points = 300

        if len(notes) > max_points:

            indices = np.linspace(
                0,
                len(notes) - 1,
                max_points
            ).astype(int)

            notes = [
                notes[i]
                for i in indices
            ]


        return {

            "success": True,

            "filename":
                file.filename,

            "duration":
                round(
                    float(
                        len(audio) /
                        sample_rate
                    ),
                    2
                ),

            "total_pitch_points":
                len(pitches),

            "pitch_data":
                notes,

            "prototype_note":
                "The prototype analyzes the first 30 seconds of the uploaded song for faster AI feedback."

        }


    except subprocess.CalledProcessError:

        return {

            "success": False,

            "error":
                "Unable to decode the uploaded song."

        }


    except Exception as e:

        return {

            "success": False,

            "error":
                str(e)

        }


    finally:

        if (
            original_path
            and os.path.exists(
                original_path
            )
        ):

            os.remove(
                original_path
            )


        if (
            wav_path
            and os.path.exists(
                wav_path
            )
        ):

            os.remove(
                wav_path
            )


# =========================================================
# ANALYZE VOICE
# =========================================================

@app.post("/analyze-voice")
async def analyze_voice(
    file: UploadFile = File(...)
):

    original_path = None
    wav_path = None

    try:

        suffix = os.path.splitext(
            file.filename or ""
        )[1] or ".audio"

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            content = await file.read()

            temp_file.write(content)

            original_path = temp_file.name


        wav_path = convert_to_wav(
            original_path
        )


        audio, sample_rate = librosa.load(
            wav_path,
            sr=16000,
            mono=True,
            duration=30
        )


        if len(audio) == 0:

            return {

                "success": False,

                "error":
                    "The recording is empty."

            }


        # -------------------------------------------------
        # Volume check
        # -------------------------------------------------

        rms = librosa.feature.rms(
            y=audio
        )

        average_volume = float(
            np.mean(rms)
        )


        if average_volume < 0.001:

            return {

                "success": False,

                "error":
                    "The recording is too quiet. "
                    "Please sing closer to the microphone."

            }


        # -------------------------------------------------
        # Pitch
        # -------------------------------------------------

        pitch_values = detect_pitch(
            audio,
            sample_rate
        )


        if len(pitch_values) < 3:

            return {

                "success": False,

                "error":
                    "No clear pitch was detected. "
                    "Please sing for a few seconds."

            }


        max_points = 300

        if len(pitch_values) > max_points:

            indices = np.linspace(
                0,
                len(pitch_values) - 1,
                max_points
            ).astype(int)

            pitch_values = [
                pitch_values[i]
                for i in indices
            ]


        return {

            "success": True,

            "filename":
                file.filename,

            "duration":
                round(
                    float(
                        len(audio) /
                        sample_rate
                    ),
                    2
                ),

            "pitch":
                [
                    round(
                        float(p),
                        2
                    )
                    for p in pitch_values
                ],

            "pitch_points":
                len(pitch_values),

            "average_volume":
                round(
                    average_volume,
                    5
                )

        }


    except subprocess.CalledProcessError:

        return {

            "success": False,

            "error":
                "The recording could not be decoded."

        }


    except Exception as e:

        return {

            "success": False,

            "error":
                str(e)

        }


    finally:

        if (
            original_path
            and os.path.exists(
                original_path
            )
        ):

            os.remove(
                original_path
            )


        if (
            wav_path
            and os.path.exists(
                wav_path
            )
        ):

            os.remove(
                wav_path
            )


# =========================================================
# COMPARE SONG + USER VOICE
# =========================================================

@app.post("/compare-song-voice")
async def compare_song_voice(
    song: UploadFile = File(...),
    voice: UploadFile = File(...)
):

    song_path = None
    song_wav = None

    voice_path = None
    voice_wav = None

    try:

        # =================================================
        # SAVE SONG
        # =================================================

        song_suffix = os.path.splitext(
            song.filename or ""
        )[1] or ".audio"

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=song_suffix
        ) as temp_file:

            song_content = await song.read()

            temp_file.write(
                song_content
            )

            song_path = temp_file.name


        # =================================================
        # SAVE VOICE
        # =================================================

        voice_suffix = os.path.splitext(
            voice.filename or ""
        )[1] or ".audio"

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=voice_suffix
        ) as temp_file:

            voice_content = await voice.read()

            temp_file.write(
                voice_content
            )

            voice_path = temp_file.name


        # =================================================
        # CONVERT BOTH FILES
        # =================================================

        song_wav = convert_to_wav(
            song_path
        )

        voice_wav = convert_to_wav(
            voice_path
        )


        # =================================================
        # LOAD ONLY FIRST 30 SECONDS
        # =================================================

        song_audio, song_sr = librosa.load(
            song_wav,
            sr=16000,
            mono=True,
            duration=30
        )

        voice_audio, voice_sr = librosa.load(
            voice_wav,
            sr=16000,
            mono=True,
            duration=30
        )


        # =================================================
        # PITCH EXTRACTION
        # =================================================

        song_pitch = detect_pitch(
            song_audio,
            song_sr
        )

        voice_pitch = detect_pitch(
            voice_audio,
            voice_sr
        )


        if len(song_pitch) < 3:

            return {

                "success": False,

                "error":
                    "A clear vocal pitch could not be detected from the uploaded song."

            }


        if len(voice_pitch) < 3:

            return {

                "success": False,

                "error":
                    "A clear pitch could not be detected from your recording."

            }


        # =================================================
        # ALIGN PITCH DATA
        # =================================================

        comparison_length = min(
            len(song_pitch),
            len(voice_pitch)
        )


        if comparison_length < 3:

            return {

                "success": False,

                "error":
                    "There was not enough matching pitch information."

            }


        song_indices = np.linspace(
            0,
            len(song_pitch) - 1,
            comparison_length
        ).astype(int)


        voice_indices = np.linspace(
            0,
            len(voice_pitch) - 1,
            comparison_length
        ).astype(int)


        reference = np.array([

            song_pitch[i]

            for i in song_indices

        ])


        user = np.array([

            voice_pitch[i]

            for i in voice_indices

        ])


        # =================================================
        # PITCH ERROR
        # =================================================

        cents_difference = (

            1200 *

            np.log2(
                user / reference
            )

        )


        absolute_difference = np.abs(
            cents_difference
        )


        absolute_difference = np.clip(
            absolute_difference,
            0,
            600
        )


        average_error = float(
            np.mean(
                absolute_difference
            )
        )


        pitch_accuracy = 100 - (
            average_error / 6
        )


        pitch_accuracy = max(
            0,
            min(
                100,
                pitch_accuracy
            )
        )


        # =================================================
        # NOTE MATCH
        # =================================================

        matched_notes = np.sum(
            absolute_difference <= 50
        )


        note_match = (

            matched_notes /
            comparison_length

        ) * 100


        note_match = max(
            0,
            min(
                100,
                float(note_match)
            )
        )


        # =================================================
        # STABILITY
        # =================================================

        if len(voice_pitch) > 2:

            user_log_pitch = np.log2(
                np.array(
                    voice_pitch
                )
            )


            frame_changes = (

                np.abs(
                    np.diff(
                        user_log_pitch
                    )
                )

                * 1200

            )


            smooth_changes = np.clip(
                frame_changes,
                0,
                300
            )


            average_change = float(
                np.mean(
                    smooth_changes
                )
            )


            stability = 100 - (
                average_change * 0.35
            )

        else:

            stability = 50


        stability = max(
            0,
            min(
                100,
                stability
            )
        )


        # =================================================
        # OVERALL SCORE
        # =================================================

        overall = (

            pitch_accuracy * 0.55

            +

            note_match * 0.30

            +

            stability * 0.15

        )


        overall = round(

            max(
                0,
                min(
                    100,
                    overall
                )
            )

        )


        pitch_accuracy = round(
            pitch_accuracy
        )

        note_match = round(
            note_match
        )

        stability = round(
            stability
        )


        # =================================================
        # FEEDBACK
        # =================================================

        feedback = []


        if pitch_accuracy >= 85:

            feedback.append(
                "Your pitch was closely matched to the reference."
            )

        elif pitch_accuracy >= 70:

            feedback.append(
                "Your pitch was fairly close to the reference, but some notes need adjustment."
            )

        else:

            feedback.append(
                "Several notes were noticeably different from the reference pitch."
            )


        if note_match >= 85:

            feedback.append(
                "Most of the detected notes were within a close pitch range."
            )

        elif note_match >= 60:

            feedback.append(
                "Try focusing on reaching the target notes more precisely."
            )

        else:

            feedback.append(
                "Practice the song slowly and focus on matching each note."
            )


        if stability >= 85:

            feedback.append(
                "Your pitch remained relatively stable during the recording."
            )

        elif stability >= 65:

            feedback.append(
                "Your pitch showed some variation. Try maintaining a steady voice."
            )

        else:

            feedback.append(
                "Your pitch varied significantly. Try slower and controlled singing."
            )


        return {

            "success": True,

            "overall_score":
                overall,

            "pitch_accuracy":
                pitch_accuracy,

            "note_match":
                note_match,

            "stability":
                stability,

            "average_pitch_error_cents":
                round(
                    average_error,
                    2
                ),

            "reference_pitch_points":
                len(song_pitch),

            "voice_pitch_points":
                len(voice_pitch),

            "feedback":
                feedback,

            "prototype_note":
                "This prototype compares extracted pitch information. Future versions can use supervised learning, vocal separation and time-aligned reference melody analysis for more accurate singing assessment."

        }


    except subprocess.CalledProcessError:

        return {

            "success": False,

            "error":
                "One of the audio files could not be decoded."

        }


    except Exception as e:

        return {

            "success": False,

            "error":
                str(e)

        }


    finally:

        for path in [

            song_path,
            song_wav,
            voice_path,
            voice_wav

        ]:

            if (
                path
                and os.path.exists(path)
            ):

                os.remove(path)
