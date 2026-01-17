import { useEffect, useRef, useState } from "react";
import { Music, Music2 } from "lucide-react";
import YuiOrb from "./YuiOrb";

/* ---------------- BREATHING PROGRAMS ---------------- */

const breathingPrograms = {
    anxious: {
        mood: "anxious",
        phases: [
            { name: "Inhale", duration: 4, text: "Inhale slowly with me…" },
            { name: "Hold", duration: 4, text: "Hold gently. You’re okay." },
            { name: "Exhale", duration: 6, text: "Exhale… let the tension melt away." },
        ],
    },
    sad: {
        mood: "sad",
        phases: [
            { name: "Inhale", duration: 5, text: "Breathe in warmth and care…" },
            { name: "Hold", duration: 3, text: "Stay here for a moment." },
            { name: "Exhale", duration: 5, text: "Breathe out the heaviness." },
        ],
    },
    angry: {
        mood: "angry",
        phases: [
            { name: "Inhale", duration: 4, text: "Inhale deeply. Gather control." },
            { name: "Hold", duration: 6, text: "Hold. Feel the power settle." },
            { name: "Exhale", duration: 8, text: "Exhale forcefully. Release it all." },
        ],
    },
    neutral: {
        mood: "neutral",
        phases: [
            { name: "Inhale", duration: 4, text: "Inhale…" },
            { name: "Hold", duration: 4, text: "Hold…" },
            { name: "Exhale", duration: 4, text: "Exhale…" },
        ],
    },
};

/* ---------------- COMPONENT ---------------- */

const Breathing = () => {
    const [selectedMood, setSelectedMood] = useState("anxious");
    const program = breathingPrograms[selectedMood];

    const [phaseIndex, setPhaseIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(program.phases[0].duration);
    const [isActive, setIsActive] = useState(true);

    const phase = program.phases[phaseIndex];

    /* ---------------- MUSIC (YouTube Audio) ---------------- */

    const playerRef = useRef(null);
    const [musicOn, setMusicOn] = useState(false);

    const volumeRef = useRef(30); // start soft
    const fadeIntervalRef = useRef(null);

    const MAX_VOLUME = 60;
    const MIN_VOLUME = 10;
    const FADE_STEP = 2;

    const sendYTCommand = (func, args = []) => {
        if (!playerRef.current) return;
        playerRef.current.contentWindow.postMessage(
            JSON.stringify({ event: "command", func, args }),
            "*"
        );
    };

    const fadeTo = (target) => {
        clearInterval(fadeIntervalRef.current);

        fadeIntervalRef.current = setInterval(() => {
            if (volumeRef.current === target) {
                clearInterval(fadeIntervalRef.current);
                return;
            }

            volumeRef.current =
                volumeRef.current < target
                    ? Math.min(volumeRef.current + FADE_STEP, target)
                    : Math.max(volumeRef.current - FADE_STEP, target);

            sendYTCommand("setVolume", [volumeRef.current]);
        }, 120);
    };

    const toggleMusic = () => {
        if (!musicOn) {
            sendYTCommand("playVideo");
            setTimeout(() => {
                sendYTCommand("setVolume", [volumeRef.current]);
            }, 300);
        } else {
            fadeTo(MIN_VOLUME);
            setTimeout(() => sendYTCommand("pauseVideo"), 600);
        }
        setMusicOn(!musicOn);
    };

    /* ---------------- SYNC MUSIC WITH BREATH ---------------- */

    useEffect(() => {
        if (!musicOn) return;

        if (phase.name === "Inhale") fadeTo(MAX_VOLUME);
        if (phase.name === "Exhale") fadeTo(MIN_VOLUME);
    }, [phase.name, musicOn]);

    /* ---------------- BREATH TIMER ---------------- */

    useEffect(() => {
        if (!isActive) return;

        if (timeLeft === 0) {
            setPhaseIndex((p) => (p + 1) % program.phases.length);
            return;
        }

        const t = setTimeout(() => setTimeLeft((x) => x - 1), 1000);
        return () => clearTimeout(t);
    }, [timeLeft, isActive, program.phases.length]);

    useEffect(() => {
        setTimeLeft(program.phases[phaseIndex].duration);
    }, [phaseIndex, program]);

    useEffect(() => {
        setPhaseIndex(0);
        setTimeLeft(program.phases[0].duration);
    }, [selectedMood]);

    /* ---------------- UI ---------------- */

    return (
        <div className="relative min-h-full flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-white px-6 text-center">

            {/* Hidden YouTube Audio Player */}
            <iframe
                ref={playerRef}
                className="w-0 h-0 absolute"
                title="Breathing Audio"
                src="https://www.youtube-nocookie.com/embed/vPvIxwh9N2w?enablejsapi=1&controls=0&loop=1&playlist=vPvIxwh9N2w"
                allow="autoplay"
            />

            {/* Floating Music Toggle */}
            <button
                onClick={toggleMusic}
                className="
          fixed top-6 right-6 z-50
          w-12 h-12 rounded-full
          bg-white/90 backdrop-blur
          shadow-lg border
          flex items-center justify-center
          hover:scale-105 transition
        "
                title={musicOn ? "Turn music off" : "Play calming music"}
            >
                {musicOn ? (
                    <Music2 size={22} className="text-indigo-600" />
                ) : (
                    <Music size={22} className="text-gray-400" />
                )}
            </button>

            {/* Title */}
            <h1 className="text-3xl font-bold text-indigo-900 mb-2">
                How are you feeling right now?
            </h1>

            <p className="text-gray-600 mb-8">
                Choose what feels closest. I’ll guide your breathing.
            </p>

            {/* Mood Selector */}
            <div className="flex gap-3 mb-10 flex-wrap justify-center">
                {Object.keys(breathingPrograms).map((mood) => (
                    <button
                        key={mood}
                        onClick={() => setSelectedMood(mood)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition
              ${selectedMood === mood
                                ? "bg-indigo-600 text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                    >
                        {mood.charAt(0).toUpperCase() + mood.slice(1)}
                    </button>
                ))}
            </div>

            {/* Orb */}
            <div
                className={`
          transition-transform ease-in-out
          ${phase.name === "Inhale" ? "scale-110 duration-[4000ms]" : ""}
          ${phase.name === "Hold" ? "scale-110 duration-[3000ms]" : ""}
          ${phase.name === "Exhale" ? "scale-95 duration-[6000ms]" : ""}
        `}
            >
                <YuiOrb mood={program.mood} theme="light" />
            </div>

            {/* Instructions */}
            <p className="mt-10 text-xl font-medium text-indigo-800">
                {phase.text}
            </p>

            <p className="mt-2 text-sm text-gray-500 tracking-wide">
                {phase.name} • {timeLeft}s
            </p>

            {/* Control */}
            <button
                onClick={() => setIsActive(!isActive)}
                className="mt-10 px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
            >
                {isActive ? "Pause" : "Continue"}
            </button>
        </div>
    );
};

export default Breathing;
