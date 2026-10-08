import numpy as np
import joblib

from sklearn.ensemble import RandomForestRegressor


# ============================================================
# SkillSensAI Music AI — Training
# ============================================================

MODEL_PATH = "music_model.joblib"


# ============================================================
# FEATURE ORDER
#
# IMPORTANT:
# main.py MUST use this exact order when sending
# features to the model.
#
# 0 = pitch accuracy
# 1 = note match
# 2 = timing accuracy
# 3 = stability
# 4 = average pitch error (cents)
# 5 = voiced ratio
# ============================================================

FEATURE_NAMES = [
    "pitch_accuracy",
    "note_match",
    "timing_accuracy",
    "stability",
    "average_pitch_error_cents",
    "voiced_ratio",
]


# ============================================================
# TRAINING DATA
# ============================================================

X = np.array([
    [98, 97, 97, 96, 8,   0.98],
    [95, 94, 96, 94, 12,  0.97],
    [92, 91, 94, 92, 18,  0.95],
    [90, 88, 92, 90, 22,  0.94],

    [87, 86, 88, 87, 28,  0.93],
    [84, 82, 85, 84, 34,  0.92],
    [81, 80, 83, 81, 40,  0.91],
    [78, 76, 80, 79, 47,  0.90],

    [75, 73, 77, 75, 55,  0.88],
    [72, 70, 74, 72, 62,  0.87],
    [69, 67, 71, 69, 70,  0.85],
    [66, 64, 68, 66, 78,  0.83],

    [63, 61, 65, 63, 87,  0.81],
    [60, 58, 62, 60, 96,  0.79],
    [56, 54, 59, 57, 108, 0.76],
    [52, 50, 55, 53, 120, 0.73],

    [48, 45, 51, 49, 135, 0.70],
    [44, 41, 47, 45, 150, 0.67],
    [40, 37, 43, 41, 165, 0.63],
    [35, 32, 39, 37, 185, 0.58],
], dtype=np.float32)


# ============================================================
# TARGET SCORES
# ============================================================

y = np.array([
    98,
    95,
    92,
    90,

    87,
    84,
    81,
    78,

    75,
    72,
    69,
    66,

    63,
    60,
    56,
    52,

    48,
    44,
    40,
    35,
], dtype=np.float32)


# ============================================================
# CREATE RANDOM FOREST MODEL
# ============================================================

model = RandomForestRegressor(
    n_estimators=200,
    max_depth=8,
    min_samples_leaf=1,
    random_state=42,
    n_jobs=-1,
)


# ============================================================
# TRAIN
# ============================================================

model.fit(X, y)


# ============================================================
# SAVE MODEL
# ============================================================

joblib.dump(model, MODEL_PATH)


# ============================================================
# TEST MODEL
# ============================================================

test_examples = np.array([
    [95, 94, 96, 94, 15, 0.96],
    [75, 72, 78, 74, 55, 0.88],
    [50, 47, 52, 48, 130, 0.70],
], dtype=np.float32)


predictions = model.predict(test_examples)


# ============================================================
# OUTPUT
# ============================================================

print()
print("==========================================")
print("       SkillSensAI Music AI")
print("==========================================")
print()
print("Model: Random Forest Regressor")
print("Training samples:", len(X))
print("Features:", len(FEATURE_NAMES))
print()
print("Feature order:")

for index, feature in enumerate(FEATURE_NAMES):
    print(f"{index}: {feature}")

print()
print("Test predictions:")

for index, prediction in enumerate(predictions):

    prediction = float(
        np.clip(prediction, 0, 100)
    )

    print(
        f"Example {index + 1}: "
        f"{prediction:.2f}/100"
    )

print()
print("Model saved as:")
print(MODEL_PATH)
print()
print("==========================================")
