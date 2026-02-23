import pandas as pd
import numpy as np
import joblib
import nltk
import re
import os

from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

nltk.download("stopwords")

print("🔥 Training Yui Text Emotion Model...\n")

# ---------------- LOAD ALL CSV FILES ----------------
path = "dataset/data/full_dataset/"

files = [
    path + "goemotions_1.csv",
    path + "goemotions_2.csv",
    path + "goemotions_3.csv"
]

dfs = []
for f in files:
    print("Loading:", f)
    dfs.append(pd.read_csv(f))

df = pd.concat(dfs, ignore_index=True)

print("Total rows loaded:", len(df))
print("Columns:", df.columns)

# ---------------- TEXT COLUMN ----------------
# In GoEmotions text column name = "text"
if "text" not in df.columns:
    raise Exception("❌ TEXT COLUMN NOT FOUND. CHECK CSV.")

# ---------------- CLEAN TEXT ----------------
stop_words = set(stopwords.words("english"))


def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z ]", "", text)
    words = text.split()
    words = [w for w in words if w not in stop_words]
    return " ".join(words)


df["clean"] = df["text"].apply(clean_text)

# ---------------- MAP TO 7 EMOTIONS ----------------
emotion_map = {
    "joy": "Happy",
    "love": "Happy",
    "amusement": "Happy",
    "approval": "Happy",

    "sadness": "Sad",
    "disappointment": "Sad",
    "grief": "Sad",

    "anger": "Angry",
    "annoyance": "Angry",
    "disapproval": "Angry",

    "fear": "Fearful",
    "nervousness": "Fearful",

    "surprise": "Surprised",
    "realization": "Surprised",

    "disgust": "Disgust",

    "neutral": "Neutral"
}


def map_emotion(row):
    for emo in emotion_map:
        if emo in row and row[emo] == 1:
            return emotion_map[emo]
    return None


print("\nMapping emotions...")
df["emotion"] = df.apply(map_emotion, axis=1)
df = df.dropna(subset=["emotion"])

print("After mapping:", len(df))

X = df["clean"]
y = df["emotion"]

# ---------------- TRAIN ----------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.1, random_state=42
)

print("\nTraining model...")

model = Pipeline([
    ("tfidf", TfidfVectorizer(max_features=8000)),
    ("clf", LogisticRegression(max_iter=400))
])

model.fit(X_train, y_train)

# ---------------- EVALUATE ----------------
pred = model.predict(X_test)
print("\n📊 Classification Report:\n")
print(classification_report(y_test, pred))

# ---------------- SAVE ----------------
joblib.dump(model, "text_emotion_model.pkl")

print("\n🔥🔥 TEXT MODEL TRAINED & SAVED SUCCESSFULLY 🔥🔥")
