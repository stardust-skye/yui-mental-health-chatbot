import { useEffect, useRef, useState } from "react";

const moodColors = {
    happy: {
        light: "from-green-300 via-emerald-400 to-lime-400",
        dark: "from-green-400 via-emerald-500 to-lime-500",
    },
    sad: {
        light: "from-blue-300 via-indigo-400 to-sky-400",
        dark: "from-blue-500 via-indigo-600 to-cyan-500",
    },
    anxious: {
        light: "from-yellow-300 via-orange-300 to-amber-400",
        dark: "from-orange-500 via-amber-500 to-yellow-500",
    },
    angry: {
        light: "from-rose-300 via-red-400 to-orange-400",
        dark: "from-red-600 via-rose-600 to-orange-500",
    },
    neutral: {
        light: "from-indigo-300 via-blue-400 to-purple-400",
        dark: "from-indigo-500 via-purple-600 to-fuchsia-500",
    },
};

const YuiOrb = ({ theme = "light", mood = "neutral" }) => {
    const orbRef = useRef(null);
    const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
    const [blink, setBlink] = useState(false);
    const [smile, setSmile] = useState(false);
    const [hovered, setHovered] = useState(false);

    const gradient =
        moodColors[mood]?.[theme] || moodColors.neutral[theme];

    // Cursor tracking
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!orbRef.current) return;

            const rect = orbRef.current.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            const dx = e.clientX - cx;
            const dy = e.clientY - cy;

            // Body float
            orbRef.current.style.transform = `
        translate(${dx * 0.035}px, ${dy * 0.035}px)
      `;

            // Eyes follow cursor
            setEyeOffset({
                x: Math.max(-7, Math.min(7, dx * 0.025)),
                y: Math.max(-7, Math.min(7, dy * 0.025)),
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // Blink every 5s
    useEffect(() => {
        const interval = setInterval(() => {
            setBlink(true);
            setTimeout(() => setBlink(false), 140);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Random gentle smile
    useEffect(() => {
        const interval = setInterval(() => {
            if (!hovered) {
                setSmile(true);
                setTimeout(() => setSmile(false), 1200);
            }
        }, 9000);
        return () => clearInterval(interval);
    }, [hovered]);

    return (
        <div
            ref={orbRef}
            onMouseEnter={() => {
                setSmile(true);
                setHovered(true);
            }}
            onMouseLeave={() => {
                setSmile(false);
                setHovered(false);
            }}
            className={`
        relative w-44 h-44 rounded-full cursor-pointer
        bg-gradient-to-br ${gradient}
        transition-all duration-300 ease-out
        ${theme === "dark"
                    ? "shadow-[0_0_140px_rgba(168,85,247,0.7)]"
                    : "shadow-[0_0_90px_rgba(99,102,241,0.45)]"
                }
      `}
        >
            {/* Aura Glow */}
            <div
                className={`
          absolute inset-0 rounded-full blur-2xl opacity-60
          bg-gradient-to-br ${gradient}
        `}
            />

            {/* Inner Glow */}
            <div
                className={`
          absolute inset-4 rounded-full blur-xl opacity-50
          bg-gradient-to-br ${gradient}
        `}
            />

            {/* Eyes */}
            <div className="absolute inset-0 flex items-center justify-center gap-7">
                {[0, 1].map((_, i) => (
                    <div
                        key={i}
                        className={`
              w-4 bg-white transition-all duration-200 ease-out
              shadow-[0_0_10px_rgba(255,255,255,0.8)]
              ${blink
                                ? "h-1"
                                : smile
                                    ? "h-2 rounded-t-full scale-x-125"
                                    : "h-4 rounded-full"
                            }
            `}
                        style={{
                            transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default YuiOrb;
