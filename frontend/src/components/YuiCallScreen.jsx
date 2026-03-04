import React, { useEffect, useRef, useState } from "react";
import YuiAvatar3D from "./YuiAvatar3D";

const LOCAL_API = "http://localhost:8000";
const PROD_API = "https://yui-backend-t2aw.onrender.com";

const backgrounds = [
    { label: "Blur Cafe", value: "blur_cafe.jpg" },
    { label: "Morning Anime Room", value: "morning_anime_room.jpg" },
    { label: "Night Anime Room", value: "night_anime_room.jpg" },
    { label: "Sunset Ocean", value: "sunset_ocean.jpg" },
    { label: "Skyscraper Room Night", value: "skyscraper_room_night.jpg" }
];

const YuiCallScreen = () => {

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const [avatar, setAvatar] = useState("kai");

    // ⭐ background state
    const [background, setBackground] = useState("blur_cafe.jpg");

    const [faceEmotion, setFaceEmotion] = useState("Neutral");
    const [speechEmotion, setSpeechEmotion] = useState("Neutral");
    const [textEmotion, setTextEmotion] = useState("Neutral");

    const [geminiReply, setGeminiReply] = useState(
        "Hi… I’m here with you. Tell me what’s on your mind."
    );

    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [footerOpen, setFooterOpen] = useState(true);

    const removeEmojis = (text) => {
        return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "");
    };

    useEffect(() => {

        const loadVoices = () => {

            const voiceList = speechSynthesis.getVoices();
            setVoices(voiceList);

            if (voiceList.length > 0 && !selectedVoice) {
                setSelectedVoice(voiceList[0]);
            }

        };

        loadVoices();
        speechSynthesis.onvoiceschanged = loadVoices;

    }, []);

    const speak = (text) => {

        if (!voiceEnabled || !text) return;

        const cleanText = removeEmojis(text);

        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanText);

        if (selectedVoice) {

            utterance.voice = selectedVoice;

            // ⭐ force language to match voice
            utterance.lang = selectedVoice.lang;

        }

        speechSynthesis.speak(utterance);

    };

    useEffect(() => {

        startCamera();

        const interval = setInterval(async () => {

            if (!videoRef.current) return;

            try {

                const canvas = document.createElement("canvas");
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(videoRef.current, 0, 0);

                const blob = await new Promise(resolve =>
                    canvas.toBlob(resolve, "image/jpeg")
                );

                const formData = new FormData();
                formData.append("file", blob, "frame.jpg");

                const res = await fetch(`${LOCAL_API}/face/emotion`, {
                    method: "POST",
                    body: formData
                });

                const data = await res.json();

                if (data.face_emotion) {
                    setFaceEmotion(data.face_emotion);
                }

            } catch (err) {
                console.log("Face detection error");
            }

        }, 1000);

        return () => {
            stopCamera();
            clearInterval(interval);
        };

    }, []);

    const startCamera = async () => {

        try {

            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

        } catch (err) {
            console.error("Camera error:", err);
        }

    };

    const stopCamera = () => {

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

    };

    const startSession = async () => {

        setGeminiReply("I'm listening… speak now.");
        setFaceEmotion("Observing...");
        setSpeechEmotion("Listening...");
        setTextEmotion("Reading...");

        try {
            await fetch(`${LOCAL_API}/call/start`, { method: "POST" });
        } catch {
            await fetch(`${PROD_API}/call/start`, { method: "POST" });
        }

    };

    const stopSession = async () => {

        setLoading(true);
        setGeminiReply("Analyzing emotions...");

        try {

            let res;

            try {
                res = await fetch(`${LOCAL_API}/call/stop`, { method: "POST" });
            } catch {
                res = await fetch(`${PROD_API}/call/stop`, { method: "POST" });
            }

            const data = await res.json();

            const userMsg = data.user_text || "";
            const aiMsg = data.gemini_reply || "I'm here for you.";

            setSpeechEmotion(data.speech_emotion || "Neutral");
            setTextEmotion(data.text_emotion || "Neutral");

            if (userMsg.trim() !== "") {

                setChatHistory(prev => [
                    ...prev,
                    { sender: "user", text: userMsg },
                    { sender: "ai", text: aiMsg }
                ]);

            }

            setGeminiReply(aiMsg);

            speak(aiMsg);

        } catch (err) {

            console.error("Backend error:", err);
            setGeminiReply("Connection error.");

        }

        setLoading(false);

    };

    return (

        <div className="w-full h-screen flex bg-[#0f1117] text-white overflow-hidden">

            <div className="flex-[1.4] h-full relative flex bg-black">

                <div className="w-1/2 h-full">

                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />

                </div>

                <div className="w-1/2 h-full flex items-center justify-center">

                    {/* ⭐ background passed here */}
                    <YuiAvatar3D avatar={avatar} background={background} />

                </div>

                <div className="absolute top-5 left-5 bg-black/60 backdrop-blur-md p-4 rounded-xl">

                    <h2 className="text-lg font-semibold mb-2">Live Emotions</h2>

                    <p>👁 Face: {faceEmotion}</p>
                    <p>🎤 Speech: {speechEmotion}</p>
                    <p>💬 Text: {textEmotion}</p>

                </div>

                <button
                    onClick={() => setSettingsOpen(true)}
                    className="absolute top-5 right-5 bg-gray-800 px-3 py-2 rounded-lg"
                >
                    ⚙
                </button>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4">

                    <button
                        onClick={startSession}
                        className="bg-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-green-700"
                    >
                        Start Talking
                    </button>

                    <button
                        onClick={stopSession}
                        className="bg-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-red-700"
                    >
                        {loading ? "Analyzing..." : "Stop & Analyze"}
                    </button>

                </div>

            </div>

            <div className="w-[420px] h-full bg-[#161a23] flex flex-col border-l border-gray-800">

                <div className="p-5 border-b border-gray-800 flex justify-between items-center">

                    <div>
                        <h1 className="text-xl font-bold">YUI Companion</h1>
                        <p className="text-sm text-gray-400">
                            Emotion-aware AI listener
                        </p>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        🔊 Voice
                        <input
                            type="checkbox"
                            checked={voiceEnabled}
                            onChange={() => setVoiceEnabled(!voiceEnabled)}
                        />
                    </label>

                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">

                    {chatHistory.map((msg, index) => (

                        <div
                            key={index}
                            className={`p-3 rounded-xl max-w-[80%] ${msg.sender === "user"
                                ? "bg-indigo-600 ml-auto"
                                : "bg-gray-700"
                                }`}
                        >
                            {msg.text}
                        </div>

                    ))}

                </div>

                <div className="border-t border-gray-800 text-sm text-gray-400">

                    {/* Toggle Button */}
                    <button
                        onClick={() => setFooterOpen(!footerOpen)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-800/40 transition"
                    >
                        <span className="text-xs text-gray-400">About</span>
                        <span className="text-sm">
                            {footerOpen ? "▼" : "▲"}
                        </span>
                    </button>

                    {/* Collapsible Content */}
                    {footerOpen && (
                        <div className="p-4 space-y-2 text-xs text-gray-500">

                            <div>Emotion priority: Text → Speech → Face</div>

                            <div>
                                Avatar credits:
                                <br />

                                Aiko (female avatar) – Nephalia
                                {/* https://hub.vroid.com/en/users/59089136 */}

                                <br />

                                Kai (male avatar) – VenusVariation
                                {/* https://hub.vroid.com/en/users/69054885 */}
                            </div>

                        </div>
                    )}

                </div>

            </div>

            {settingsOpen && (

                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">

                    <div className="bg-[#1f2533] p-6 rounded-xl w-[350px]">

                        <h2 className="text-lg font-bold mb-4">Settings</h2>

                        <label className="block text-sm mb-2">Voice</label>

                        <select
                            className="w-full p-2 rounded bg-gray-800 mb-4"
                            value={selectedVoice?.name || ""}
                            onChange={(e) =>
                                setSelectedVoice(
                                    voices.find(v => v.name === e.target.value)
                                )
                            }
                        >

                            {voices.map((voice, index) => (
                                <option key={index} value={voice.name}>
                                    {voice.name}
                                </option>
                            ))}

                        </select>

                        <label className="block text-sm mb-2">Avatar</label>

                        <select
                            className="w-full p-2 rounded bg-gray-800 mb-4"
                            value={avatar}
                            onChange={(e) => setAvatar(e.target.value)}
                        >
                            <option value="kai">Kai</option>
                            <option value="aiko">Aiko</option>
                        </select>

                        {/* ⭐ BACKGROUND SELECTOR */}

                        <label className="block text-sm mb-2">Background</label>

                        <select
                            className="w-full p-2 rounded bg-gray-800"
                            value={background}
                            onChange={(e) => setBackground(e.target.value)}
                        >
                            {backgrounds.map(bg => (
                                <option key={bg.value} value={bg.value}>
                                    {bg.label}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={() => setSettingsOpen(false)}
                            className="mt-6 bg-indigo-600 px-4 py-2 rounded-lg w-full"
                        >
                            Close
                        </button>

                    </div>

                </div>

            )}

        </div>

    );

};

export default YuiCallScreen;