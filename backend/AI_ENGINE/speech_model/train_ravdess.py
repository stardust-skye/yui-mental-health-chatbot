import os
import numpy as np
import librosa
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

DATASET_PATH = "dataset/audio_speech_actors_01-24"
SAMPLE_RATE = 22050

# 7 emotion mapping
emotion_map = {
    "01": 0,  # neutral
    "03": 1,  # happy
    "04": 2,  # sad
    "05": 3,  # angry
    "06": 4,  # fearful
    "07": 5,  # disgust
    "08": 6   # surprised
}

emotion_labels = {
    0: "NEUTRAL",
    1: "HAPPY",
    2: "SAD",
    3: "ANGRY",
    4: "FEARFUL",
    5: "DISGUST",
    6: "SURPRISED"
}


def extract_features(file_path):
    try:
        audio, sr = librosa.load(file_path, sr=SAMPLE_RATE)

        mfcc = np.mean(librosa.feature.mfcc(
            y=audio, sr=sr, n_mfcc=40).T, axis=0)
        chroma = np.mean(librosa.feature.chroma_stft(y=audio, sr=sr).T, axis=0)
        mel = np.mean(librosa.feature.melspectrogram(y=audio, sr=sr).T, axis=0)

        return np.hstack([mfcc, chroma, mel])
    except:
        return None


print("Loading RAVDESS dataset...")

X = []
y = []

for actor_folder in os.listdir(DATASET_PATH):
    actor_path = os.path.join(DATASET_PATH, actor_folder)

    for file in os.listdir(actor_path):
        emotion_code = file.split("-")[2]

        if emotion_code in emotion_map:
            file_path = os.path.join(actor_path, file)
            features = extract_features(file_path)

            if features is not None:
                X.append(features)
                y.append(emotion_map[emotion_code])

X = np.array(X)
y = np.array(y)

print("Total samples loaded:", len(X))

# Train/Test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# Scaling
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Random Forest
model = RandomForestClassifier(
    n_estimators=400,
    max_depth=25,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

# Evaluation
y_pred = model.predict(X_test)

print("\nClassification Report:\n")
print(classification_report(y_test, y_pred,
      target_names=list(emotion_labels.values())))

# Save model
joblib.dump(model, "speech_mood_model.pkl")
joblib.dump(scaler, "scaler.pkl")

print("\nModel trained and saved successfully!")
