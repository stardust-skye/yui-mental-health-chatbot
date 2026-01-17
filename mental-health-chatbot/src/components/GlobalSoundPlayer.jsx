import { useSound } from "../context/SoundContext";

const GlobalSoundPlayer = () => {
    const { currentSound, isPlaying } = useSound();

    if (!currentSound || !isPlaying) return null;

    return (
        <iframe
            className="hidden"
            src={`https://www.youtube-nocookie.com/embed/${currentSound.id}?autoplay=1&loop=1`}
            allow="autoplay"
            title="Global Sound Player"
        />
    );
};

export default GlobalSoundPlayer;
