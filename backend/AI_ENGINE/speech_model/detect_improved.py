import joblib
import librosa
import numpy as np
import sounddevice as sd
import warnings
warnings.filterwarnings("ignore")

print("Loading Yui speech emotion model...")

# load trained model
model = joblib.load("speech_mood_model.pkl")
scaler = joblib.load("scaler.pkl")

print("Model loaded successfully\n")

SAMPLE_RATE = 22050
DURATION = 3  # seconds recording

# 7 EMOTIONS (same as face)
emotion_labels = {
    0: "Neutral",
    1: "Happy",
    2: "Sad",
    3: "Angry",
    4: "Fearful",
    5: "Disgust",
    6: "Surprised"
}

# ---------------- FEATURE EXTRACTION ----------------


def extract_features(audio):
    try:
        audio = audio / (np.max(np.abs(audio)) + 1e-8)

        # EXACT SAME FEATURES USED IN TRAINING
        mfccs = np.mean(librosa.feature.mfcc(
            y=audio, sr=SAMPLE_RATE, n_mfcc=40
        ).T, axis=0)

        chroma = np.mean(librosa.feature.chroma_stft(
            y=audio, sr=SAMPLE_RATE
        ).T, axis=0)

        mel = np.mean(librosa.feature.melspectrogram(
            y=audio, sr=SAMPLE_RATE
        ).T, axis=0)

        features = np.hstack([mfccs, chroma, mel])

        return features

    except:
        return None


# ---------------- LIVE DETECTION ----------------
print("🎤 Yui Speech Emotion Detection Started")
print("Speak for 3 seconds when prompted")
print("Press CTRL+C to stop\n")

try:
    count = 1
    last_emotion = None

    while True:
        print(f"[{count}] Speak now...", end="", flush=True)

        audio = sd.rec(int(DURATION * SAMPLE_RATE),
                       samplerate=SAMPLE_RATE,
                       channels=1,
                       dtype="float32")
        sd.wait()

        audio = audio.flatten()

        if np.max(np.abs(audio)) < 0.005:
            print(" too quiet")
            continue

        features = extract_features(audio)
        if features is None:
            print(" error reading voice")
            continue

        features_scaled = scaler.transform([features])

        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]

        emotion = emotion_labels.get(prediction, "Unknown")
        confidence = round(np.max(probabilities) * 100, 2)

        # print only when emotion changes
        if emotion != last_emotion:
            print(f" → Detected: {emotion} ({confidence}%)")
            last_emotion = emotion
        else:
            print(" ...")

        count += 1

except KeyboardInterrupt:
    print("\nStopped safely")
