import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import {
  LayoutDashboard, MessageSquare, LogOut, ChevronRight,
  Heart, Brain, Activity, Menu, ChevronLeft
} from 'lucide-react';


// Importing components
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Dashboard from './components/Dashboard';
import YuiOrb from "./components/YuiOrb";
import Breathing from './components/Breathing';
import Videos from './components/Videos';


// --- LANDING PAGE COMPONENT ---

const LandingPage = ({ onGoogleLogin, onGuestLogin }) => (

  <div className="min-h-screen bg-white">

    {/* Hero Section */}

    <header className="bg-gradient-to-br from-indigo-50 to-white py-20 px-6">

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">

        <div className="flex-1 text-center md:text-left">

          <h1 className="text-6xl font-extrabold text-indigo-950 mb-6 leading-tight">

            Meet Yui, <span className="text-indigo-600">your AI therapist.</span>

          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">

            In a world that never stops, Yui provides a safe, anonymous space to express your feelings,

            track your emotional trends, and receive guidance rooted in empathy.

          </p>

          <div className="flex flex-wrap gap-4 justify-center md:justify-start">

            <button onClick={onGoogleLogin} className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-full font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">

              Get Started with Google <ChevronRight size={20} />

            </button>

            <button onClick={onGuestLogin} className="px-8 py-4 rounded-full font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition">

              Try Guest Mode

            </button>

          </div>

        </div>

        <div className="flex-1 hidden md:block">
          <div className="bg-indigo-100 w-full h-96 rounded-3xl flex items-center justify-center border-4 border-white shadow-2xl overflow-hidden relative">

            <YuiOrb theme="light" />
          </div>
        </div>


      </div>

    </header>



    {/* Why Mental Health Matters Section */}

    <section className="py-20 px-6 max-w-6xl mx-auto">

      <div className="text-center mb-16">

        <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Mental Wellness Matters?</h2>

        <div className="w-20 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>

      </div>

      <div className="grid md:grid-cols-3 gap-12">

        <div className="p-8 rounded-2xl bg-blue-50">

          <Heart className="text-blue-600 mb-4" size={40} />

          <h3 className="text-xl font-bold mb-3">Self-Awareness</h3>

          <p className="text-gray-600">Identifying your emotions is the first step toward healing. Our AI helps you name what you feel.</p>

        </div>

        <div className="p-8 rounded-2xl bg-indigo-50">

          <Activity className="text-indigo-600 mb-4" size={40} />

          <h3 className="text-xl font-bold mb-3">Trend Tracking</h3>

          <p className="text-gray-600">Mental health isn't a moment; it's a journey. Visualize your weekly progress with data-driven charts.</p>

        </div>

        <div className="p-8 rounded-2xl bg-purple-50">

          <Brain className="text-purple-600 mb-4" size={40} />

          <h3 className="text-xl font-bold mb-3">Professional Insights</h3>

          <p className="text-gray-600">Get curated recommendations from trusted resources like the APA when you need them most.</p>

        </div>

      </div>

    </section>

  </div>

);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState(null);

  const [theme, setTheme] = useState("light");


  // Sidebar States
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (error) { console.error(error); }
  };

  const handleGuestLogin = () => setUser('guest');

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          user ? <Navigate to="/chat" /> : <LandingPage onGoogleLogin={handleGoogleLogin} onGuestLogin={handleGuestLogin} />
        } />

        <Route path="/*" element={
          user ? (
            <div className="flex h-screen bg-gray-50 overflow-hidden relative">

              {/* --- RESPONSIVE SIDEBAR --- */}
              {user !== 'guest' && (
                <>
                  {/* Mobile Menu Toggle */}
                  <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-lg shadow-lg"
                  >
                    <Menu size={20} />
                  </button>

                  <aside className={`
                    fixed lg:relative z-40 h-full bg-white border-r flex flex-col transition-all duration-300 ease-in-out
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isCollapsed ? 'w-20' : 'w-72'}
                  `}>

                    {/* Desktop Collapse Toggle */}
                    <button
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      className="hidden lg:flex absolute -right-3 top-10 bg-white border rounded-full p-1 text-gray-400 hover:text-indigo-600 shadow-sm z-50"
                    >
                      {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>

                    <div className={`flex items-center gap-3 mb-8 px-6 pt-8 ${isCollapsed ? 'justify-center' : ''}`}>
                      <div className="w-8 h-8 flex items-center justify-center">
                        <img
                          src="/orb.png"
                          alt="Yui"
                          className="w-7 h-7 object-contain rounded-full"
                        />
                      </div>

                      {!isCollapsed && <span className="font-bold text-2xl text-indigo-950 tracking-tight whitespace-nowrap">Yui</span>}
                    </div>

                    <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                      <SidebarLink to="/chat" icon={<MessageSquare size={20} />} label="Chat" isCollapsed={isCollapsed} />
                      <SidebarLink to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" isCollapsed={isCollapsed} />

                      <div className="pt-4 mt-4 border-t">
                        <Sidebar
                          isCollapsed={isCollapsed}
                          onBreathingOpen={() => setShowBreathing(true)}
                          onCalmVideosOpen={() => setShowCalmVideos(true)}
                        />
                      </div>

                    </nav>

                    {/* User Profile Area */}
                    <div className="p-4 border-t">
                      <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
                        <img src={user.photoURL} alt="pfp" className="w-10 h-10 rounded-full border-2 border-indigo-100 shrink-0" />
                        {!isCollapsed && (
                          <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate text-gray-800">{user.displayName}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => signOut(auth).then(() => setUser(null))}
                        className={`flex items-center gap-3 w-full p-3 text-red-500 hover:bg-red-50 rounded-xl transition font-semibold ${isCollapsed ? 'justify-center' : ''}`}
                      >
                        <LogOut size={20} />
                        {!isCollapsed && <span>Logout</span>}
                      </button>
                    </div>
                  </aside>

                  {/* Mobile Overlay */}
                  {isMobileOpen && (
                    <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30" onClick={() => setIsMobileOpen(false)} />
                  )}
                </>
              )}

              {/* Dynamic Content Area */}
              <main className="flex-1 flex flex-col relative overflow-hidden">
                {user === 'guest' && (
                  <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <img
                          src="/orb.png"
                          alt="Yui"
                          className="w-7 h-7 object-contain rounded-full"
                        />
                      </div>

                      <span className="font-bold text-indigo-950">Yui Guest</span>
                    </div>
                    <button onClick={() => setUser(null)} className="bg-indigo-50 px-4 py-2 rounded-lg text-sm font-bold text-indigo-600 hover:bg-indigo-100 transition">
                      Exit Demo
                    </button>
                  </div>
                )}

                <div className="flex-1 overflow-auto">
                  <Routes>
                    <Route
                      path="/chat"
                      element={<ChatWindow user={user} activeChatId={activeChatId} setActiveChatId={setActiveChatId} />}
                    />

                    <Route
                      path="/dashboard"
                      element={<Dashboard user={user} />}
                    />

                    {/* NEW WELLNESS ROUTES */}
                    <Route
                      path="/breathing"
                      element={<Breathing />}
                    />

                    <Route
                      path="/videos"
                      element={<Videos />}
                    />
                  </Routes>
                </div>

              </main>
            </div>
          ) : <Navigate to="/" />
        } />
      </Routes>
    </Router>
  );
}

// Simple Helper for Sidebar Links
const SidebarLink = ({ to, icon, label, isCollapsed }) => (
  <Link to={to} className={`flex items-center gap-3 p-3 rounded-xl transition font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${isCollapsed ? 'justify-center' : ''}`}>
    <div className="shrink-0">{icon}</div>
    {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
  </Link>
);

export default App;