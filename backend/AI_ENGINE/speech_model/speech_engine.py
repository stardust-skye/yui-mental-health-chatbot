import speech_recognition as sr
import numpy as np
import joblib
import librosa
import threading
import keyboard
import time

print("🎤 Loading Yui Speech Engine...")

# ===============================
# LOAD SPEECH EMOTION MODEL
# ===============================
speech_model = joblib.load("speech_model/speech_mood_model.pkl")
speech_scaler = joblib.load("speech_model/scaler.pkl")

# ===============================
# LOAD TEXT EMOTION MODEL
# ===============================
text_model = joblib.load("text_model/text_emotion_model.pkl")

print("✅ Speech + Text models loaded\n")

# ===============================
# EMOTION LABELS
# ===============================
emotion_labels = {
    0: "Neutral",
    1: "Happy",
    2: "Sad",
    3: "Angry",
    4: "Fearful",
    5: "Disgust",
    6: "Surprised"
}

# ===============================
# FEATURE EXTRACTION
# ===============================


def extract_features(audio, sr=22050):
    try:
        audio = audio / (np.max(np.abs(audio)) + 1e-8)

        mfccs = np.mean(librosa.feature.mfcc(
            y=audio, sr=sr, n_mfcc=40).T, axis=0)
        chroma = np.mean(librosa.feature.chroma_stft(y=audio, sr=sr).T, axis=0)
        mel = np.mean(librosa.feature.melspectrogram(y=audio, sr=sr).T, axis=0)

        return np.hstack([mfccs, chroma, mel])
    except:
        return None


# ===============================
# SPEECH SESSION RECORDING
# ===============================
def record_until_stop():
    recognizer = sr.Recognizer()
    mic = sr.Microphone()

    full_audio = []
    final_text = ""

    print("\n🎤 SPEAK NOW (press P to stop)\n")

    def listen_loop():
        nonlocal full_audio, final_text
        with mic as source:
            recognizer.adjust_for_ambient_noise(source)
            while not keyboard.is_pressed("p"):
                try:
                    audio = recognizer.listen(
                        source, timeout=1, phrase_time_limit=5)

                    # save raw audio
                    data = np.frombuffer(
                        audio.get_raw_data(), np.int16).astype(np.float32)
                    data = data / 32768.0
                    full_audio.extend(data)

                    # speech → text
                    try:
                        text = recognizer.recognize_google(audio)
                        final_text += " " + text
                        print("📝", text)
                    except:
                        pass

                except:
                    pass

    t = threading.Thread(target=listen_loop)
    t.start()

    while not keyboard.is_pressed("p"):
        time.sleep(0.1)

    print("\n⏹ Speech stopped\n")
    return np.array(full_audio), final_text.strip()


# ===============================
# SPEECH EMOTION
# ===============================
def detect_speech_emotion(audio_data):
    if len(audio_data) < 2000:
        return "Neutral"

    features = extract_features(audio_data)
    if features is None:
        return "Neutral"

    scaled = speech_scaler.transform([features])
    pred = speech_model.predict(scaled)[0]
    probs = speech_model.predict_proba(scaled)[0]

    emotion = emotion_labels.get(pred, "Neutral")
    conf = round(np.max(probs) * 100, 2)

    print(f"🎭 Speech Emotion: {emotion} ({conf}%)")
    return emotion


# ===============================
# TEXT EMOTION
# ===============================
def detect_text_emotion(text):
    if not text.strip():
        return "Neutral"

    pred = text_model.predict([text])[0]
    print("💬 Text Emotion:", pred)
    return pred


# ===============================
# MAIN FUNCTION FOR YUI CORE
# ===============================
def get_speech_data():
    audio_data, text = record_until_stop()

    speech_emotion = detect_speech_emotion(audio_data)
    text_emotion = detect_text_emotion(text)

    return text, speech_emotion, text_emotion
