from AI_ENGINE.yui_core import run_call_session, stop_recording
from fastapi import APIRouter, UploadFile, File
import os
import threading
from google import genai
from dotenv import load_dotenv
import cv2
import numpy as np
from AI_ENGINE.face_model.face_emotion import get_face_emotion

load_dotenv()
router = APIRouter()

# ===============================
# GEMINI SAFE INIT
# ===============================
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_KEY:
    client = genai.Client(api_key=GEMINI_KEY)
    print("✅ Gemini connected")
else:
    client = None
    print("⚠️ Gemini key missing — running without AI reply")

MODEL_ID = "gemini-2.5-flash-lite"

# ===============================
# GLOBAL SESSION STORAGE
# ===============================
session_result = {}
recording_thread = None

# ===============================
# 🎥 FACE EMOTION FROM FRONTEND FRAME
# ===============================


@router.post("/face/emotion")
async def detect_face(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        npimg = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        emotion = get_face_emotion(frame)

        if not emotion:
            emotion = "Neutral"

        return {"face_emotion": emotion}

    except Exception as e:
        print("Face API error:", e)
        return {"face_emotion": "Neutral"}

# ===============================
# START CALL (mic start)
# ===============================


@router.post("/call/start")
async def start_call():
    global recording_thread, session_result

    print("🎤 START recording requested")
    session_result = {}

    def run():
        global session_result
        session_result = run_call_session()

    recording_thread = threading.Thread(target=run)
    recording_thread.start()

    return {"status": "recording_started"}

# ===============================
# STOP CALL + PROCESS
# ===============================


@router.post("/call/stop")
async def stop_call():
    global recording_thread, session_result

    print("🛑 STOP requested")

    stop_recording()

    if recording_thread:
        recording_thread.join()

    user_text = session_result.get("text", "")
    speech_emotion = session_result.get("speech_emotion", "Neutral")
    text_emotion = session_result.get("text_emotion", "Neutral")

    print("📝 USER TEXT:", user_text)
    print("🎭 EMOTIONS:", speech_emotion, text_emotion)

    # ================= GEMINI =================
    reply = "I'm here for you. Tell me more."

    if client and user_text:
        prompt = f"""
User said: {user_text}

Detected emotions:
Speech: {speech_emotion}
Text: {text_emotion}

Respond like a warm emotional support AI friend.
Short, human, caring.
"""
        try:
            response = client.models.generate_content(
                model=MODEL_ID,
                contents=prompt
            )
            reply = response.text.strip()
        except Exception as e:
            print("Gemini error:", e)

    return {
        "user_text": user_text,
        "speech_emotion": speech_emotion,
        "text_emotion": text_emotion,
        "gemini_reply": reply
    }
