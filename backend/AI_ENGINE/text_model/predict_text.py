import os
import re
import joblib
import nltk
from nltk.corpus import stopwords

# Download once if not already
nltk.download("stopwords", quiet=True)

# -------- Load Model --------
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(CURRENT_DIR, "text_emotion_model.pkl")

print("📦 Loading text emotion model...")
model = joblib.load(MODEL_PATH)
print("✅ Text emotion model loaded\n")

# -------- Stopwords --------
stop_words = set(stopwords.words("english"))

# -------- Clean Function --------


def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z ]", "", text)
    words = text.split()
    words = [w for w in words if w not in stop_words]
    return " ".join(words)

# -------- Predict Function --------


def predict_text_emotion(text):
    if not text or not text.strip():
        return "Neutral"

    cleaned = clean_text(text)
    prediction = model.predict([cleaned])[0]

    return prediction
