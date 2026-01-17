import os
import uvicorn
from typing import List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from huggingface_hub import InferenceClient
from dotenv import load_dotenv
import json

# 1. Initialize FastAPI & CORS
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()  # Load environment variables from .env file

# Helper to get env and strip potential extra quotes


def get_env_var(key):
    val = os.getenv(key)
    if val:
        return val.strip().strip('"').strip("'")
    return None


private_key = get_env_var("FIREBASE_PRIVATE_KEY")

if not private_key:
    raise ValueError(
        "FIREBASE_PRIVATE_KEY is missing from environment variables!")

# Reconstruct the dictionary
firebase_creds = {
    "type": "service_account",
    "project_id": get_env_var("FIREBASE_PROJECT_ID"),
    "private_key_id": get_env_var("FIREBASE_PRIVATE_KEY_ID"),
    "private_key": private_key.replace('\\n', '\n'),  # Crucial for RSA keys
    "client_email": get_env_var("FIREBASE_CLIENT_EMAIL"),
    "client_id": get_env_var("FIREBASE_CLIENT_ID"),
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": get_env_var("FIREBASE_CLIENT_X509_CERT_URL")
}

try:
    cred = credentials.Certificate(firebase_creds)
    firebase_admin.initialize_app(cred)
    print("Successfully connected to Firebase!")
except Exception as e:
    print(f"Detailed Error: {e}")

db = firestore.client()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_ID = "gemini-2.5-flash-lite"  # Or gemini-3.0-flash when available

hf_client = InferenceClient(api_key=os.getenv("HUGGING_FACE_KEY"))
if (not hf_client):
    print("Hugging Face Client Initialization Failed!")
if hf_client:
    print("Hugging Face Client Initialized Successfully!")
EMOTION_MODEL = "j-hartmann/emotion-english-distilroberta-base"


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    chat_id: str
    user_id: str
    messages: List[Message]


class GeminiSafetyResponse(BaseModel):
    response: str
    is_emergency: bool
    detected_trigger: str


def process_analytics_and_log(user_id: str, chat_id: str, user_text: str, full_history: list, trigger: str):
    try:
        # Step A: Emotion detection (Hugging Face)
        results = hf_client.text_classification(user_text, model=EMOTION_MODEL)
        top_emotion = max(results, key=lambda x: x['score'])

        # Current time
        now = datetime.utcnow()
        day = now.strftime("%Y-%m-%d")
        week = now.strftime("%Y-W%U")

        # Step B1: Update chat document (existing behavior)
        db.collection("chats").document(chat_id).set({
            "userId": user_id,
            "messages": full_history,
            "lastUpdated": now,
            "latestEmotion": top_emotion["label"].lower(),
            "latestTrigger": trigger,
            "emotionScore": float(top_emotion["score"]),
            "preview": user_text[:40] + "..."
        }, merge=True)

        # Step B2: 🔥 ADD MOOD LOG (THIS IS NEW + REQUIRED)
        db.collection("mood_logs").add({
            "userId": user_id,
            "chatId": chat_id,
            "emotion": top_emotion["label"].lower(),
            "score": float(top_emotion["score"]),
            "trigger": trigger,
            "timestamp": now,
            "day": day,
            "week": week
        })

        print(
            f"✅ Mood Logged: {top_emotion['label']} ({top_emotion['score']:.2f})")

    except Exception as e:
        print(f"❌ Analytics/Logging Error: {e}")


# def log_emotion_for_analytics(user_id: str, chat_id: str, text: str):
#     try:
#         # Using the new Client for the emotion labeler
#         response = client.models.generate_content(
#             model=MODEL_ID,
#             contents=f"Analyze the emotion of this text: '{text}'. Return ONLY one word: Joy, Sadness, Anger, Fear, or Neutral."
#         )
#         detected_emotion = response.text.strip()

#         db.collection("wellness_logs").add({
#             "userId": user_id,
#             "chatId": chat_id,
#             "text": text,
#             "emotion": detected_emotion,
#             "timestamp": datetime.utcnow(),
#             "source": "genai_v2_labeler"
#         })
#     except Exception as e:
#         print(f"Logging Error: {e}")
THERAPIST_PROMPT = """
You are an empathetic, compassionate, and non-judgmental mental health therapist.
Your goal is to provide emotional support, validate the user's feelings, and offer
therapeutic reflections using techniques like Active Listening and Cognitive Reframing.
DO NOT give clinical diagnoses or purely technical career advice unless asked to help
with a specific coping strategy for work stress. Always maintain a gentle, supportive tone.
"""


@app.post("/chat")
async def chat_endpoint(request: ChatRequest, background_tasks: BackgroundTasks):
    try:
        # 1. Update the Prompt to demand JSON
        SAFETY_INSTRUCTION = """
        Analyze the user's message for crisis/self-harm.
        Return a JSON object:
        {
          "response": "Your empathetic therapeutic reply",
          "is_emergency": true/false,
          "detected_trigger": "one word category like 'exam', 'family', 'health', or 'none'"
        }
        """

        # 2. Construct contents
        contents = [
            types.Content(role="user", parts=[types.Part.from_text(
                text=THERAPIST_PROMPT + "\n" + SAFETY_INSTRUCTION)]),
            types.Content(role="model", parts=[types.Part.from_text(
                text="Understood. I will provide therapeutic support and monitor for safety in JSON format.")])
        ]

        for m in request.messages:
            role = "user" if m.role == "user" else "model"
            contents.append(types.Content(role=role, parts=[
                            types.Part.from_text(text=m.content)]))

        # 3. Generate response with JSON constraint
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        # 4. Parse the result
        ai_data = json.loads(response.text)
        ai_text = ai_data.get("response", "")
        is_emergency = ai_data.get("is_emergency", False)
        trigger = ai_data.get("detected_trigger", "none")

        # 5. Background Tasks (Analytics & Logging)
        updated_history = [m.dict() for m in request.messages]
        updated_history.append({"role": "model", "content": ai_text})

        # ✅ FIX chat_id ONCE, BEFORE USING IT
        chat_id = request.chat_id
        if chat_id == "temp":
           chat_id = f"chat_{request.user_id}"
       
        if request.user_id != "guest":
           background_tasks.add_task(
             process_analytics_and_log,
             request.user_id,               # ✅ Firebase UID
             chat_id,                       # ✅ FIXED chat id
             request.messages[-1].content,
             updated_history,
             trigger
    )

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
