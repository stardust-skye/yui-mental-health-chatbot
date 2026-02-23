import cv2
import numpy as np
import tensorflow as tf
import os
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, Flatten, Conv2D, MaxPooling2D, Input

os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

print("😐 Loading face emotion model...")

# ============================================
# 🔥 ABSOLUTE PATH FIX (WORKS FROM ANYWHERE)
# ============================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model_path = os.path.join(BASE_DIR, "model.h5")
cascade_path = os.path.join(BASE_DIR, "haarcascade_frontalface_default.xml")

# ---------------- FACE DETECTOR ----------------
face_cascade = cv2.CascadeClassifier(cascade_path)

if face_cascade.empty():
    print("❌ Haarcascade not found:", cascade_path)

# ---------------- MODEL ----------------
emotion_model = Sequential([
    Input(shape=(48, 48, 1)),
    Conv2D(32, (3, 3), activation='relu'),
    Conv2D(64, (3, 3), activation='relu'),
    MaxPooling2D((2, 2)),
    Dropout(0.25),

    Conv2D(128, (3, 3), activation='relu'),
    MaxPooling2D((2, 2)),
    Conv2D(128, (3, 3), activation='relu'),
    MaxPooling2D((2, 2)),
    Dropout(0.25),

    Flatten(),
    Dense(1024, activation='relu'),
    Dropout(0.5),
    Dense(7, activation='softmax')
])

# ---------------- LOAD WEIGHTS ----------------
if not os.path.exists(model_path):
    print("❌ Face model not found:", model_path)
else:
    emotion_model.load_weights(model_path)
    print("✅ Face model loaded successfully")

# ---------------- EMOTION MAP ----------------
emotion_dict = {
    0: "Angry",
    1: "Disgust",
    2: "Fearful",
    3: "Happy",
    4: "Neutral",
    5: "Sad",
    6: "Surprised"
}

# ============================================
# MAIN FACE EMOTION FUNCTION
# ============================================


def get_face_emotion(frame):
    try:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.3,
            minNeighbors=5,
            minSize=(30, 30)
        )

        if len(faces) == 0:
            return "No Face"

        # take largest face
        (x, y, w, h) = max(faces, key=lambda b: b[2] * b[3])

        roi_gray = gray[y:y+h, x:x+w]
        roi_gray = cv2.resize(roi_gray, (48, 48))
        roi_gray = roi_gray.astype("float32") / 255.0  # normalize
        cropped = np.expand_dims(np.expand_dims(roi_gray, -1), 0)

        prediction = emotion_model.predict(cropped, verbose=0)
        maxindex = int(np.argmax(prediction))
        confidence = float(np.max(prediction))

        emotion = emotion_dict[maxindex]

        if confidence < 0.40:
            return "Neutral"

        return emotion

    except Exception as e:
        print("Face emotion error:", e)
        return "Error"
