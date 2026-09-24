from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

import librosa
import numpy as np
import tempfile
import os


app = FastAPI(
    title="SkillSensAI",
    description="AI Powered Skill Learning Platform"
)


# Allow the frontend to communicate with the backend.
# We will make this more restrictive after deployment if needed.
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


@app.post("/analyze-song")
async def analyze_song(file: UploadFile = File(...)):

    suffix = os.path.splitext(file.filename or "")[1]

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix
    ) as temp_file:

        content = await file.read()
        temp_file.write(content)
        temp_path = temp_file.name

    try:

        audio, sample_rate = librosa.load(
            temp_path,
            sr=None,
            mono=True
        )

        # Detect pitch using YIN
        pitches = librosa.yin(
            audio,
            fmin=librosa.note_to_hz("C2"),
            fmax=librosa.note_to_hz("C7"),
            sr=sample_rate
        )

        valid_pitches = [
            float(p)
            for p in pitches
            if p > 0
        ]

        notes = []

        for pitch in valid_pitches:

            midi_note = librosa.hz_to_midi(pitch)

            note_name = librosa.midi_to_note(
                round(midi_note)
            )

            notes.append({
                "frequency": round(pitch, 2),
                "note": note_name
            })

        # Keep the response reasonably small
        max_points = 300

        if len(notes) > max_points:
            step = max(1, len(notes) // max_points)
            sampled_notes = notes[::step][:max_points]
        else:
            sampled_notes = notes

        return {
            "success": True,
            "filename": file.filename,
            "sample_rate": sample_rate,
            "duration": float(len(audio) / sample_rate),
            "total_pitch_points": len(valid_pitches),
            "pitch_data": sampled_notes
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }

    finally:

        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/analyze-voice")
async def analyze_voice(file: UploadFile = File(...)):

    suffix = os.path.splitext(file.filename or "")[1]

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix
    ) as temp_file:

        content = await file.read()
        temp_file.write(content)
        temp_path = temp_file.name

    try:

        audio, sample_rate = librosa.load(
            temp_path,
            sr=None,
            mono=True
        )

        # Detect the user's pitch
        pitches = librosa.yin(
            audio,
            fmin=librosa.note_to_hz("C2"),
            fmax=librosa.note_to_hz("C7"),
            sr=sample_rate
        )

        valid_pitches = [
            float(p)
            for p in pitches
            if p > 0
        ]

        max_points = 500

        if len(valid_pitches) > max_points:

            indices = np.linspace(
                0,
                len(valid_pitches) - 1,
                max_points
            ).astype(int)

            pitch_values = [
                valid_pitches[i]
                for i in indices
            ]

        else:

            pitch_values = valid_pitches

        return {
            "success": True,
            "filename": file.filename,
            "duration": float(len(audio) / sample_rate),
            "pitch": pitch_values
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }

    finally:

        if os.path.exists(temp_path):
            os.remove(temp_path)