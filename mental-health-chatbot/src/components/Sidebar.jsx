import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { MessageSquarePlus, Clock, MessageSquare } from 'lucide-react';

const Sidebar = ({ user, activeChatId, setActiveChatId }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user || user === 'guest') return;

    // We query by lastUpdated to keep the newest chats at the top
    const q = query(
      collection(db, "chats"),
      where("userId", "==", user.uid),
      orderBy("lastUpdated", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setHistory(chats);
    });

    return () => unsubscribe();
  }, [user]);

  // Helper to format the Firestore timestamp nicely
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200 w-64 p-4">
      <button 
        onClick={() => setActiveChatId(null)}
        className="flex items-center gap-2 w-full p-3 mb-6 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-all shadow-sm"
      >
        <MessageSquarePlus size={18} className="text-indigo-600" />
        New Chat
      </button>

      <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-2 mb-4">
        Recent History
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {history.map(chat => (
          <button
            key={chat.id}
            onClick={() => setActiveChatId(chat.id)}
            className={`w-full group flex items-center gap-3 p-3 rounded-xl transition-all ${
              activeChatId === chat.id 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <MessageSquare size={16} className={activeChatId === chat.id ? 'text-indigo-600' : 'text-gray-400'} />
            <div className="flex-1 text-left truncate">
              {/* USING THE PREVIEW FIELD FROM FIREBASE */}
              <p className="text-sm font-medium truncate">
                {chat.preview || "New Session"}
              </p>
              <p className="text-[10px] opacity-60">
                {formatDate(chat.lastUpdated)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;