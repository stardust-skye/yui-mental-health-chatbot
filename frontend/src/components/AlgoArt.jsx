import React, { useState, useEffect, useRef, useCallback } from 'react';

const EmotionalAlgorithmicArt = () => {
    const [feeling, setFeeling] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [visualParams, setVisualParams] = useState({
        colors: ['#4169E1', '#87CEEB', '#B0E0E6'],
        speed: 0.5,
        rhythm: 'smooth',
        density: 0.5,
        shape: 'curves',
        energy: 0.5
    });
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const timeRef = useRef(0);
    const particlesRef = useRef([]);

    // Claude API interaction
    const analyzeFeeling = async (emotion) => {
        if (!emotion.trim()) return;

        setIsLoading(true);

        const prompt = `Analyze the emotion "${emotion}" and provide visual parameters as JSON:
{
  "colors": ["#hex1", "#hex2", "#hex3"],
  "speed": number between 0.1 and 1.0,
  "rhythm": "smooth" or "pulsing" or "erratic",
  "density": number between 0.1 and 1.0,
  "shape": "curves" or "lines" or "circles",
  "energy": number between 0.1 and 1.0
}

Respond ONLY with valid JSON. For "${emotion}", create colors and parameters that visually represent this feeling.`;

        try {
            const response = await window.claude.complete(prompt);
            const data = JSON.parse(response);
            setVisualParams(data);
        } catch (error) {
            console.error('Error analyzing feeling:', error);
            // Fallback to predefined patterns
            const fallbackPatterns = {
                happy: {
                    colors: ['#FFD700', '#FFA500', '#FF69B4'],
                    speed: 0.7,
                    rhythm: 'smooth',
                    density: 0.8,
                    shape: 'curves',
                    energy: 0.9
                },
                sad: {
                    colors: ['#4169E1', '#191970', '#483D8B'],
                    speed: 0.3,
                    rhythm: 'smooth',
                    density: 0.4,
                    shape: 'curves',
                    energy: 0.3
                },
                angry: {
                    colors: ['#FF0000', '#8B0000', '#FF4500'],
                    speed: 0.9,
                    rhythm: 'erratic',
                    density: 0.9,
                    shape: 'lines',
                    energy: 0.95
                },
                calm: {
                    colors: ['#98FB98', '#00CED1', '#87CEEB'],
                    speed: 0.3,
                    rhythm: 'smooth',
                    density: 0.5,
                    shape: 'curves',
                    energy: 0.4
                },
                excited: {
                    colors: ['#FF1493', '#00FF00', '#FFFF00'],
                    speed: 0.8,
                    rhythm: 'pulsing',
                    density: 0.9,
                    shape: 'circles',
                    energy: 0.9
                }
            };

            // Find best match
            const lowerEmotion = emotion.toLowerCase();
            let bestMatch = null;
            for (const [key, pattern] of Object.entries(fallbackPatterns)) {
                if (lowerEmotion.includes(key)) {
                    bestMatch = pattern;
                    break;
                }
            }

            setVisualParams(bestMatch || fallbackPatterns.calm);
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize particles
    const initializeParticles = useCallback((canvas) => {
        const numParticles = Math.floor(visualParams.density * 200);
        particlesRef.current = Array.from({ length: numParticles }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * visualParams.speed * 5,
            vy: (Math.random() - 0.5) * visualParams.speed * 5,
            size: Math.random() * 3 + 1,
            angle: Math.random() * Math.PI * 2,
            angleSpeed: (Math.random() - 0.5) * 0.02,
            life: Math.random()
        }));
    }, [visualParams]);

    // Animation loop
    const animate = useCallback((canvas, ctx) => {
        timeRef.current += 0.016 * visualParams.speed;

        // Clear canvas with fade effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update and draw particles
        particlesRef.current.forEach((particle, index) => {
            // Update position based on rhythm
            if (visualParams.rhythm === 'smooth') {
                particle.x += particle.vx;
                particle.y += particle.vy;
            } else if (visualParams.rhythm === 'pulsing') {
                const pulse = Math.sin(timeRef.current * 2);
                particle.x += particle.vx * (1 + pulse * 0.5);
                particle.y += particle.vy * (1 + pulse * 0.5);
            } else { // erratic
                particle.x += particle.vx + (Math.random() - 0.5) * visualParams.energy * 2;
                particle.y += particle.vy + (Math.random() - 0.5) * visualParams.energy * 2;
            }

            // Wrap around edges
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.x > canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = canvas.height;
            if (particle.y > canvas.height) particle.y = 0;

            // Update angle
            particle.angle += particle.angleSpeed * visualParams.energy;

            // Draw particle
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.angle);

            const colorIndex = index % visualParams.colors.length;
            ctx.fillStyle = visualParams.colors[colorIndex] + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
            ctx.strokeStyle = visualParams.colors[colorIndex];
            ctx.lineWidth = 1;

            if (visualParams.shape === 'curves') {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(
                    particle.size * 10,
                    particle.size * 5 * Math.sin(timeRef.current + index),
                    particle.size * 20,
                    0
                );
                ctx.stroke();
            } else if (visualParams.shape === 'lines') {
                ctx.beginPath();
                ctx.moveTo(-particle.size * 10, 0);
                ctx.lineTo(particle.size * 10, 0);
                ctx.stroke();
            } else { // circles
                ctx.beginPath();
                ctx.arc(0, 0, particle.size * 5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();

            // Update life
            particle.life += 0.01;
            if (particle.life > 1) {
                particle.life = 0;
                particle.x = Math.random() * canvas.width;
                particle.y = Math.random() * canvas.height;
            }
        });

        // Draw connections between nearby particles
        for (let i = 0; i < particlesRef.current.length; i++) {
            for (let j = i + 1; j < particlesRef.current.length; j++) {
                const p1 = particlesRef.current[i];
                const p2 = particlesRef.current[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    const alpha = (1 - distance / 100) * 0.2 * visualParams.energy;
                    ctx.strokeStyle = visualParams.colors[0] + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                    ctx.stroke();
                }
            }
        }

        // Continue animation
        animationRef.current = requestAnimationFrame(() => animate(canvas, ctx));
    }, [visualParams]);

    // Handle canvas setup and animation
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initializeParticles(canvas);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Start animation
        animate(canvas, ctx);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [animate, initializeParticles]);

    // Handle feeling input
    const handleFeelingSubmit = () => {
        analyzeFeeling(feeling);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleFeelingSubmit();
        }
    };

    return (
        <div className="w-full h-screen relative overflow-hidden bg-black">
            <canvas
                ref={canvasRef}
                className="absolute inset-0"
            />

            {/* Title */}
            <div className="absolute top-8 left-8 z-10">
                <h1 className="text-white font-light">The feeling machine</h1>
            </div>

            {/* Input controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={feeling}
                        onChange={(e) => setFeeling(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="How are you feeling?"
                        className="px-4 py-2 w-96 rounded-lg bg-black/50 text-white border border-white/30 
                     focus:outline-none focus:border-white/60 backdrop-blur-sm"
                    />
                    <button
                        onClick={handleFeelingSubmit}
                        disabled={isLoading}
                        className={`px-6 py-2 rounded-lg bg-white/10 text-white border border-white/30 
                     transition-colors backdrop-blur-sm
                     ${isLoading
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-white/20'
                            }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </span>
                        ) : (
                            'Update'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmotionalAlgorithmicArt;