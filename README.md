# 🌱 Yui — Emotion-Aware AI Mental Health Companion

> *An emotionally intelligent AI system that listens, understands, and responds — across text, voice, and facial expression.*

Yui (結 / 優) represents gentleness, connection, and emotional harmony in Japanese.

Yui is a full-stack AI mental health companion that integrates **multi-modal emotion detection (Speech + Face + Text)** with empathetic AI conversation to create a calm, supportive digital wellness space.

Unlike traditional chatbots, Yui does not just respond to words — it interprets emotional signals.

---

## 🚀 What Makes Yui Different?

Yui combines **three independent emotion pipelines**:

* 🎤 **Speech Emotion Recognition** (trained on RAVDESS dataset)
* 👁 **Facial Emotion Recognition** (custom CNN model)
* 💬 **Text Emotion Detection** (fine-tuned NLP model)
* 🤖 **Context-Aware AI Response Generation** (Gemini 2.5)

All signals are fused using priority logic:

```
Text Emotion → Speech Emotion → Facial Emotion
```

## 🧩 Core Features

### 🎭 Multi-Modal Emotion Detection

* Real-time facial emotion inference (CNN-based model)
* Speech tone classification (Angry, Happy, Sad, Fearful, etc.)
* NLP-based emotional intent detection
* Confidence-based emotion filtering

---

### 💬 Emotion-Aware AI Conversations

* Powered by Gemini 2.5
* Generates short, human-like, empathetic responses
* Emotion-conditioned prompt engineering
* Non-judgmental and supportive tone

---

### 📊 Mood Analytics & Pattern Recognition

* Conversation-based mood tracking
* Weekly emotional trend visualization
* Emotional polarity scale (negative → positive)
* Pattern and trigger detection

---

### 🌿 Wellness Toolkit

* Guided breathing exercises with dynamic timing
* Mood-based calming video/audio sessions
* Focused grounding experiences
* Minimalist and distraction-free UI

---

## 🏗 System Architecture

```
Frontend (React + Tailwind)
        ↓
FastAPI Backend
        ↓
AI Engine
   ├── Speech Model (CNN + Feature Extraction)
   ├── Face Model (Custom CNN)
   ├── Text Model (NLP)
   └── Gemini API Integration
        ↓
Firebase (Auth + Firestore)
```

Yui is structured for scalability and modular AI experimentation.

---

## 🧪 Research & Model Training

**Speech model trained on:**

* RAVDESS Emotional Speech Dataset

**Face model:**

* CNN architecture trained on facial emotion dataset
* Confidence threshold filtering to reduce false positives

**Text model:**

* Emotion extraction and classification pipeline
* Custom preprocessing and token filtering

---

## ⚠️ Disclaimer

Yui is not a substitute for professional mental health care or therapy.

It is designed as a reflective and supportive emotional awareness tool — not for diagnosis or crisis intervention.

If you are in immediate distress, please seek professional help.

---

## 🎯 Vision

Yui explores the intersection of:

* Artificial Intelligence
* Emotional Computing
* Human-Centered Design
* Mental Wellness Technology

The long-term goal is to build emotionally intelligent AI systems that support self-awareness, reflection, and digital well-being.