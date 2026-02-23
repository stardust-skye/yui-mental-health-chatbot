import joblib
import librosa
import numpy as np

print("Loading Yui speech emotion model...")

model = joblib.load("speech_mood_model.pkl")
scaler = joblib.load("scaler.pkl")

print("Speech emotion model loaded\n")

SAMPLE_RATE = 22050

emotion_labels = {
    0: "Neutral",
    1: "Happy",
    2: "Sad",
    3: "Angry",
    4: "Fearful",
    5: "Disgust",
    6: "Surprised"
}


def extract_features(audio, sr=22050):
    try:
        audio = audio / (np.max(np.abs(audio)) + 1e-8)

        mfccs = np.mean(librosa.feature.mfcc(
            y=audio, sr=sr, n_mfcc=40).T, axis=0)
        chroma = np.mean(librosa.feature.chroma_stft(y=audio, sr=sr).T, axis=0)
        mel = np.mean(librosa.feature.melspectrogram(y=audio, sr=sr).T, axis=0)

        features = np.hstack([mfccs, chroma, mel])
        return features

    except:
        return None


def detect_emotion(audio_data):
    if audio_data is None or len(audio_data) < 1000:
        return "Neutral"

    features = extract_features(audio_data)

    if features is None:
        return "Neutral"

    features_scaled = scaler.transform([features])

    prediction = model.predict(features_scaled)[0]
    probabilities = model.predict_proba(features_scaled)[0]

    emotion = emotion_labels.get(prediction, "Neutral")
    confidence = round(np.max(probabilities) * 100, 2)

    print(f"🎭 Detected Emotion: {emotion} ({confidence}%)")

    return emotion
