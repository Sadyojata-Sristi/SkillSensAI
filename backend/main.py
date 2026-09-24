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


def convert_to_wav(input_path):
    """
    Converts browser audio such as WebM/Opus into WAV
    so librosa can reliably analyse it.
    """

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
        "22050",
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


def detect_pitch(audio, sample_rate):
    """
    Detects fundamental frequency using librosa.pyin.
    Returns only valid pitch values.
    """

    audio = np.asarray(audio, dtype=np.float32)

    # Remove very quiet background noise
    audio = librosa.util.normalize(audio)

    f0, voiced_flag, voiced_prob = librosa.pyin(
        audio,
        fmin=librosa.note_to_hz("C2"),
        fmax=librosa.note_to_hz("C7"),
        sr=sample_rate,
        frame_length=2048,
        hop_length=256
    )

    valid_pitch = f0[
        ~np.isnan(f0)
    ]

    # Keep only realistic human-voice frequencies
    valid_pitch = valid_pitch[
        (valid_pitch >= librosa.note_to_hz("C2")) &
        (valid_pitch <= librosa.note_to_hz("C7"))
    ]

    return valid_pitch.tolist()


@app.post("/analyze-song")
async def analyze_song(file: UploadFile = File(...)):

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

        # Convert uploaded song to WAV
        wav_path = convert_to_wav(original_path)

        audio, sample_rate = librosa.load(
            wav_path,
            sr=None,
            mono=True
        )

        pitches = detect_pitch(
            audio,
            sample_rate
        )

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

        max_points = 300

        if len(notes) > max_points:

            step = max(
                1,
                len(notes) // max_points
            )

            sampled_notes = notes[
                ::step
            ][:max_points]

        else:

            sampled_notes = notes

        return {
            "success": True,
            "filename": file.filename,
            "sample_rate": sample_rate,
            "duration": float(
                len(audio) / sample_rate
            ),
            "total_pitch_points": len(pitches),
            "pitch_data": sampled_notes
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }

    finally:

        if original_path and os.path.exists(
            original_path
        ):
            os.remove(original_path)

        if wav_path and os.path.exists(
            wav_path
        ):
            os.remove(wav_path)


@app.post("/analyze-voice")
async def analyze_voice(file: UploadFile = File(...)):

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

        # Convert browser WebM/Opus to WAV
        wav_path = convert_to_wav(
            original_path
        )

        audio, sample_rate = librosa.load(
            wav_path,
            sr=None,
            mono=True
        )

        # Check if audio actually contains sound
        rms = librosa.feature.rms(
            y=audio
        )

        average_volume = float(
            np.mean(rms)
        )

        if average_volume < 0.001:

            return {
                "success": False,
                "error": "The recording is too quiet. Please speak or sing closer to the microphone."
            }

        pitch_values = detect_pitch(
            audio,
            sample_rate
        )

        if len(pitch_values) < 3:

            return {
                "success": False,
                "error": "No clear pitch was detected. Please record your voice more clearly."
            }

        max_points = 500

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
            "filename": file.filename,
            "duration": float(
                len(audio) / sample_rate
            ),
            "pitch": [
                round(float(p), 2)
                for p in pitch_values
            ],
            "pitch_points": len(
                pitch_values
            ),
            "average_volume": round(
                average_volume,
                5
            )
        }

    except subprocess.CalledProcessError as e:

        return {
            "success": False,
            "error": "The uploaded recording could not be decoded. Please try recording again."
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }

    finally:

        if original_path and os.path.exists(
            original_path
        ):
            os.remove(original_path)

        if wav_path and os.path.exists(
            wav_path
        ):
            os.remove(wav_path)
