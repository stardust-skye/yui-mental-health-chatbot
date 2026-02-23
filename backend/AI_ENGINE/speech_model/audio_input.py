import speech_recognition as sr
import numpy as np
import joblib
import librosa
import os

print("🧠 Loading speech + text models...")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ==============================
# LOAD SPEECH MODEL
# ==============================
speech_model = joblib.load(os.path.join(BASE_DIR, "speech_mood_model.pkl"))
scaler = joblib.load(os.path.join(BASE_DIR, "scaler.pkl"))
print("✅ Speech model loaded")

# ==============================
# LOAD TEXT MODEL
# ==============================
TEXT_MODEL_PATH = os.path.join(
    BASE_DIR, "..", "text_model", "text_emotion_model.pkl")
text_model = joblib.load(TEXT_MODEL_PATH)
print("✅ Text model loaded")

emotion_labels = {
    0: "Neutral",
    1: "Happy",
    2: "Sad",
    3: "Angry",
    4: "Fearful",
    5: "Disgust",
    6: "Surprised"
}

# ==============================
# FEATURE EXTRACT
# ==============================


def extract_features(audio, sr_rate=22050):
    try:
        audio = audio / (np.max(np.abs(audio)) + 1e-8)

        mfccs = np.mean(librosa.feature.mfcc(
            y=audio, sr=sr_rate, n_mfcc=40).T, axis=0)
        chroma = np.mean(librosa.feature.chroma_stft(
            y=audio, sr=sr_rate).T, axis=0)
        mel = np.mean(librosa.feature.melspectrogram(
            y=audio, sr=sr_rate).T, axis=0)

        features = np.hstack([mfccs, chroma, mel])
        return features
    except:
        return None

# ==============================
# SPEECH EMOTION
# ==============================


def detect_speech_emotion(audio_data):
    if audio_data is None or len(audio_data) < 1000:
        return "Neutral"

    features = extract_features(audio_data)
    if features is None:
        return "Neutral"

    features_scaled = scaler.transform([features])
    prediction = speech_model.predict(features_scaled)[0]
    return emotion_labels.get(prediction, "Neutral")

# ==============================
# TEXT EMOTION
# ==============================


def detect_text_emotion(text):
    if not text.strip():
        return "Neutral"
    pred = text_model.predict([text])[0]
    return pred

# ==========================================================
# 🔥 MAIN FUNCTION USED BY BACKEND
# ==========================================================


def record_and_process_until_stop(stop_flag_func):

    recognizer = sr.Recognizer()
    mic = sr.Microphone()

    full_audio = []
    full_text = []

    print("🎤 Listening... speak now")

    with mic as source:
        recognizer.adjust_for_ambient_noise(source, duration=1)

        while not stop_flag_func():
            try:
                audio = recognizer.listen(
                    source, timeout=1, phrase_time_limit=4)

                # numpy audio
                chunk = np.frombuffer(
                    audio.get_raw_data(), np.int16).astype(np.float32)
                chunk = chunk / 32768.0
                full_audio.extend(chunk)

                # speech → text
                try:
                    text = recognizer.recognize_google(audio, language="en-IN")
                    print("📝", text)
                    full_text.append(text)
                except:
                    pass

            except sr.WaitTimeoutError:
                pass

    # ======================
    # FINAL PROCESS
    # ======================
    full_audio = np.array(full_audio)
    final_text = " ".join(full_text).strip()

    print("🧠 Processing emotions...")

    speech_emotion = detect_speech_emotion(full_audio)
    text_emotion = detect_text_emotion(final_text)

    print("FINAL TEXT:", final_text)
    print("Speech emotion:", speech_emotion)
    print("Text emotion:", text_emotion)

    return final_text, speech_emotion, text_emotion
