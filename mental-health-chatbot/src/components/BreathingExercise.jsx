import React, { useState, useEffect } from 'react';
import { Phone, Heart, X } from 'lucide-react';

const BreathingExercise = ({ onDismiss }) => {
  const [phase, setPhase] = useState('Inhale');

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((prev) => (prev === 'Inhale' ? 'Exhale' : 'Inhale'));
    }, 4000); // 4 seconds in, 4 seconds out
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
      <button 
        onClick={onDismiss}
        className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <X size={24} className="text-gray-400" />
      </button>

      <div className="max-w-md w-full">
        <Heart className="text-red-500 mx-auto mb-4 animate-pulse" size={40} />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Let's take a moment together</h2>
        <p className="text-gray-600 mb-10">Your safety is the most important thing right now. Breathe with the circle.</p>

        {/* Breathing Circle */}
        <div className="relative flex items-center justify-center h-64 mb-10">
          <div 
            className={`absolute rounded-full bg-indigo-100 transition-all duration-[4000ms] ease-in-out ${
              phase === 'Inhale' ? 'w-64 h-64 opacity-100' : 'w-20 h-20 opacity-30'
            }`}
          />
          <div 
            className={`absolute rounded-full bg-indigo-500 transition-all duration-[4000ms] ease-in-out flex items-center justify-center text-white font-bold ${
              phase === 'Inhale' ? 'w-48 h-48' : 'w-16 h-16 text-[0px]'
            }`}
          >
            {phase}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Immediate Support</p>
          <a 
            href="tel:988" 
            className="flex items-center justify-center gap-3 w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-red-700 transition-all"
          >
            <Phone size={20} /> Call 988 (Crisis Line)
          </a>
          <button 
            onClick={() => window.open('https://www.crisistextline.org/', '_blank')}
            className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-2xl font-semibold hover:bg-gray-50 transition-all"
          >
            Text HOME to 741741
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreathingExercise;