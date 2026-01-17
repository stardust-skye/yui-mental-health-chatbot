import { Play, Pause, X, SkipBack, SkipForward } from "lucide-react";
import { useSound } from "../context/SoundContext";

const MiniPlayer = () => {
    const {
        currentSound,
        isPlaying,
        pauseSound,
        resumeSound,
        stopSound,
        nextSound,
        prevSound,
    } = useSound();

    if (!currentSound) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
      bg-white border shadow-xl rounded-full px-6 py-3
      flex items-center gap-4"
        >
            <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">
                    {currentSound.title}
                </p>
                <p className="text-xs text-gray-500">
                    {currentSound.category}
                </p>
            </div>

            <div className="flex items-center gap-2">
                <button onClick={prevSound}>
                    <SkipBack size={18} />
                </button>

                <button
                    onClick={isPlaying ? pauseSound : resumeSound}
                    className="bg-indigo-600 text-white rounded-full p-2"
                >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                <button onClick={nextSound}>
                    <SkipForward size={18} />
                </button>
            </div>

            <button
                onClick={stopSound}
                className="text-gray-400 hover:text-red-500"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default MiniPlayer;
