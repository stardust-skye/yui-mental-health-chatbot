import threading
from AI_ENGINE.speech_model.audio_input import record_and_process_until_stop

# ===============================
# GLOBAL CONTROL
# ===============================
recording_active = False
final_result = {}

# ===============================
# STOP FUNCTION (called by API)
# ===============================
def stop_recording():
    global recording_active
    print("🛑 Stop signal received")
    recording_active = False


# ===============================
# MAIN RECORD FUNCTION
# ===============================
def run_call_session():
    """
    Runs in background thread.
    Records mic until stop_recording() is called.
    """

    global recording_active, final_result

    print("🎤 Starting call session (backend listening)...")
    recording_active = True

    def stop_flag():
        return not recording_active

    # 🎤 RECORD + ANALYZE
    text, speech_emotion, text_emotion = record_and_process_until_stop(stop_flag)

    print("🧠 Emotion processing done")
    print("User said:", text)
    print("Speech emotion:", speech_emotion)
    print("Text emotion:", text_emotion)

    # 🎯 priority
    if text_emotion != "Neutral":
        final = text_emotion
    elif speech_emotion != "Neutral":
        final = speech_emotion
    else:
        final = "Neutral"

    final_result = {
        "text": text,
        "speech_emotion": speech_emotion,
        "text_emotion": text_emotion,
        "final_emotion": final,
    }

    return final_result