import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import axios from 'axios';
import { db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import Markdown from 'react-markdown';
import BreathingExercise from './BreathingExercise';

const YUI_GREETING = {
  role: "model",
  content: "Hey 🤍\n\nI’m here with you. How are you feeling today?"
};

const ChatWindow = ({ user }) => {
  const [messages, setMessages] = useState([]); // ✅ NEVER null
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const scrollRef = useRef(null);

  const chatId = user?.uid;

  /* LOAD CHAT (SAFE) */
  useEffect(() => {
    if (!user) return;

    const loadChat = async () => {
      try {
        const ref = doc(db, "chats", chatId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
            return;
          }
        }

        // 🔑 No messages → inject greeting immediately
        setMessages([YUI_GREETING]);

        // Persist greeting async (non-blocking UX)
        await setDoc(
          ref,
          {
            userId: chatId,
            messages: [YUI_GREETING],
            hasGreeted: true,
            lastUpdated: serverTimestamp(),
            preview: "Hey 🤍 I’m here with you."
          },
          { merge: true }
        );
      } catch (err) {
        console.error("Chat load error:", err);
        // Even on error → show greeting
        setMessages([YUI_GREETING]);
      }
    };

    loadChat();
  }, [user, chatId]);

  /* AUTO SCROLL */
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* SEND MESSAGE */
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      /* const response = await axios.post("http://127.0.0.1:8000/chat",*/
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/chat`,
        {
          chat_id: chatId,
          user_id: chatId,
          messages: newMessages
        });

      if (response.data.is_emergency) {
        setShowCrisisModal(true);
      }

      const aiMsg = { role: "model", content: response.data.response };
      const updatedHistory = [...newMessages, aiMsg];

      setMessages(updatedHistory);

      await setDoc(
        doc(db, "chats", chatId),
        {
          messages: updatedHistory,
          lastUpdated: serverTimestamp(),
          preview: userMsg.content.slice(0, 40) + "..."
        },
        { merge: true }
      );

    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-white shadow-inner overflow-hidden">

      {showCrisisModal && (
        <BreathingExercise onDismiss={() => setShowCrisisModal(false)} />
      )}

      {/* EMPTY STATE (robot emoji) */}
      {messages.length === 0 && !isTyping && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
          <Bot size={48} className="text-indigo-300" />
          <p className="text-gray-500 max-w-xs">
            I'm here to listen. Tell me what's on your mind today.
          </p>
        </div>
      )}

      {/* CHAT MESSAGES */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm
                ${msg.role === 'user'
                    ? 'bg-indigo-600'
                    : 'bg-white border border-indigo-100'}`}
              >
                {msg.role === 'user'
                  ? <User size={18} className="text-white" />
                  : <Bot size={18} className="text-indigo-600" />}
              </div>

              <div
                className={`p-4 rounded-2xl shadow-sm leading-relaxed
                ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-indigo-50 text-gray-800 rounded-tl-none border border-indigo-100'}`}
              >
                <article className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                  <Markdown>{msg.content}</Markdown>
                </article>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium ml-12">
            <Loader2 size={16} className="animate-spin" />
            Thinking…
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* INPUT */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Share your thoughts…"
          className="flex-1 p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;


