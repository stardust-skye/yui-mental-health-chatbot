import { createContext, useContext, useState } from "react";
import calmVideos from "../data/calmVideos";

const SoundContext = createContext();

export const SoundProvider = ({ children }) => {
    const [currentIndex, setCurrentIndex] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const currentSound =
        currentIndex !== null ? calmVideos[currentIndex] : null;

    const playSound = (index) => {
        setCurrentIndex(index);
        setIsPlaying(true);
    };

    const pauseSound = () => setIsPlaying(false);
    const resumeSound = () => setIsPlaying(true);
    const stopSound = () => {
        setIsPlaying(false);
        setCurrentIndex(null);
    };

    const nextSound = () => {
        if (currentIndex === null) return;
        setCurrentIndex((currentIndex + 1) % calmVideos.length);
    };

    const prevSound = () => {
        if (currentIndex === null) return;
        setCurrentIndex(
            (currentIndex - 1 + calmVideos.length) % calmVideos.length
        );
    };

    return (
        <SoundContext.Provider
            value={{
                currentSound,
                currentIndex,
                isPlaying,
                playSound,
                pauseSound,
                resumeSound,
                stopSound,
                nextSound,
                prevSound,
            }}
        >
            {children}
        </SoundContext.Provider>
    );
};

export const useSound = () => useContext(SoundContext);
