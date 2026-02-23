import React, { useEffect, useRef, useState } from "react";

const LOCAL_API = "http://localhost:8000";
const PROD_API = "https://yui-backend-t2aw.onrender.com";

const YuiCallScreen = () => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const [faceEmotion, setFaceEmotion] = useState("Neutral");
    const [speechEmotion, setSpeechEmotion] = useState("Neutral");
    const [textEmotion, setTextEmotion] = useState("Neutral");
    const [geminiReply, setGeminiReply] = useState(
        "Hi… I’m here with you. Tell me what’s on your mind."
    );

    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    // ================= CAMERA START =================
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

                const res = await fetch("http://localhost:8000/face/emotion", {
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

        }, 1000); // every 1 second

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

    // ================= START SESSION =================
    const startSession = async () => {
        setGeminiReply("I'm listening… speak now.");
        setFaceEmotion("Observing...");
        setSpeechEmotion("Listening...");
        setTextEmotion("Reading...");

        try {
            console.log("STARTING RECORDING");

            // try local first
            try {
                await fetch("http://localhost:8000/call/start", { method: "POST" });
                console.log("Local recording started");
            } catch {
                await fetch("https://yui-backend-t2aw.onrender.com/call/start", { method: "POST" });
                console.log("Render recording started");
            }

        } catch (err) {
            console.error("Start error:", err);
            setGeminiReply("Could not access mic backend.");
        }
    };

    // ================= CALL BACKEND =================
    const callBackend = async (url) => {
        const res = await fetch(`${url}/call/process`, {
            method: "POST",
        });

        if (!res.ok) throw new Error("Server error");
        return await res.json();
    };

    // ================= STOP SESSION =================
    const stopSession = async () => {
        setLoading(true);
        setGeminiReply("Analyzing emotions...");

        try {
            let res;

            console.log("STOPPING + ANALYZING");

            // try local first
            try {
                res = await fetch("http://localhost:8000/call/stop", { method: "POST" });
                console.log("Local stop success");
            } catch {
                res = await fetch("https://yui-backend-t2aw.onrender.com/call/stop", { method: "POST" });
                console.log("Render stop success");
            }

            const data = await res.json();
            console.log("BACKEND:", data);

            const userMsg = data.user_text || "";
            const aiMsg = data.gemini_reply || "I'm here for you.";

            setSpeechEmotion(data.speech_emotion || "Neutral");
            setTextEmotion(data.text_emotion || "Neutral");

            // 🔥 ADD TO CHAT HISTORY
            if (userMsg.trim() !== "") {
                setChatHistory(prev => [
                    ...prev,
                    { sender: "user", text: userMsg },
                    { sender: "ai", text: aiMsg }
                ]);
            }

            setGeminiReply(aiMsg);

        } catch (err) {
            console.error("Backend error:", err);
            setGeminiReply("Connection error.");
        }

        setLoading(false);
    };

    return (
        <div className="w-full h-screen flex bg-[#0f1117] text-white overflow-x-hidden">

            {/* ================= LEFT CAMERA ================= */}
            <div className="flex-[1.2] h-full relative bg-black flex items-center justify-center">

                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />

                {/* Emotion overlay */}
                <div className="absolute top-5 left-5 bg-black/60 backdrop-blur-md p-4 rounded-xl">
                    <h2 className="text-lg font-semibold mb-2">Live Emotions</h2>
                    <p>👁 Face: {faceEmotion}</p>
                    <p>🎤 Speech: {speechEmotion}</p>
                    <p>💬 Text: {textEmotion}</p>
                </div>

                {/* Controls */}
                <div className="absolute bottom-10 flex gap-4">
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

            {/* ================= RIGHT CHAT ================= */}
            <div className="flex-1 h-full bg-[#161a23] flex flex-col border-l border-gray-800">

                <div className="p-5 border-b border-gray-800">
                    <h1 className="text-xl font-bold">YUI Companion</h1>
                    <p className="text-sm text-gray-400">
                        Emotion-aware AI listener
                    </p>
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

                <div className="p-4 border-t border-gray-800 text-sm text-gray-400">
                    Emotion priority: Text → Speech → Face
                </div>
            </div>
        </div>
    );
};

export default YuiCallScreen;