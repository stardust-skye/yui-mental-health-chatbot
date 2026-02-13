import React from 'react';
import { Wind, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ isCollapsed }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">

      {/* SECTION TITLE */}
      {!isCollapsed && (
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">
          Wellness Tools
        </p>
      )}

      {/* BREATHING EXERCISE */}
      <button
        onClick={() => navigate('/breathing')}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all
          hover:bg-indigo-50 text-gray-700
          ${isCollapsed ? 'justify-center' : ''}`}
      >
        <Wind size={20} className="text-indigo-600 shrink-0" />

        {!isCollapsed && (
          <div className="text-left">
            <p className="text-sm font-medium">Breathing Exercise</p>
            <p className="text-[11px] text-gray-500">Slow your breath</p>
          </div>
        )}
      </button>

      {/* CALMING VIDEOS */}
      <button
        onClick={() => navigate('/videos')}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all
          hover:bg-emerald-50 text-gray-700
          ${isCollapsed ? 'justify-center' : ''}`}
      >
        <PlayCircle size={20} className="text-emerald-600 shrink-0" />

        {!isCollapsed && (
          <div className="text-left">
            <p className="text-sm font-medium">Calming Videos</p>
            <p className="text-[11px] text-gray-500">Rain • Ocean • Music</p>
          </div>
        )}
      </button>

    </div>
  );
};

export default Sidebar;
