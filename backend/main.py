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


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

    suffix = os.path.splitext(file.filename)[1]

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix
    ) as temp_file:

        contents = await file.read()

        temp_file.write(contents)

        temp_path = temp_file.name

    try:

        audio, sample_rate = librosa.load(
            temp_path,
            sr=None,
            mono=True
        )

        pitches, magnitudes = librosa.piptrack(
            y=audio,
            sr=sample_rate
        )

        pitch_values = []

        for i in range(pitches.shape[1]):

            index = magnitudes[:, i].argmax()

            pitch = pitches[index, i]

            if pitch > 0:
                pitch_values.append(float(pitch))
            else:
                pitch_values.append(0.0)

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
            "filename": file.filename,
            "sample_rate": sample_rate,
            "duration": float(len(audio) / sample_rate),
            "pitch": pitch_values
        }

    finally:

        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/analyze-voice")
async def analyze_voice(file: UploadFile = File(...)):

    suffix = os.path.splitext(file.filename)[1]

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix
    ) as temp_file:

        contents = await file.read()
        temp_file.write(contents)
        temp_path = temp_file.name

    try:

        # Load user's recording
        audio, sample_rate = librosa.load(
            temp_path,
            sr=None,
            mono=True
        )

        # Detect user's pitch
        pitches, magnitudes = librosa.piptrack(
            y=audio,
            sr=sample_rate
        )

        pitch_values = []

        for i in range(pitches.shape[1]):

            index = magnitudes[:, i].argmax()

            pitch = pitches[index, i]

            if pitch > 0:
                pitch_values.append(float(pitch))
            else:
                pitch_values.append(0.0)

        # Reduce data for frontend
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
            "filename": file.filename,
            "duration": float(len(audio) / sample_rate),
            "pitch": pitch_values
        }

    finally:

        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/analyze-song")
async def analyze_song(file: UploadFile = File(...)):
    try:
        import os
        import tempfile
        import librosa

        suffix = os.path.splitext(file.filename)[1]

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        audio, sample_rate = librosa.load(
            temp_path,
            sr=None,
            mono=True
        )

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

        step = max(1, len(notes) // 300)

        sampled_notes = notes[::step][:300]

        os.remove(temp_path)

        return {
            "success": True,
            "filename": file.filename,
            "sample_rate": sample_rate,
            "total_pitch_points": len(valid_pitches),
            "pitch_data": sampled_notes
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }