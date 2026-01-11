import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { ExternalLink, Award, Heart, ShieldCheck, Zap, Target, Smile } from 'lucide-react';

const Dashboard = ({ user }) => {
  const [analytics, setAnalytics] = useState([
    { time: '08:00', emotion: 'Joy', score: 5 },
    { time: '12:00', emotion: 'Neutral', score: 3 },
    { time: '16:00', emotion: 'Fear', score: 2 },
    { time: '20:00', emotion: 'Joy', score: 5 },
  ]);

  const [recommendations] = useState([
    { title: "Managing Anxiety", source: "APA", link: "https://www.apa.org/topics/anxiety", icon: <ShieldCheck className="text-blue-500"/> },
    { title: "Depression Recovery", source: "Psychiatry.org", link: "https://www.psychiatry.org/patients-families/depression", icon: <Heart className="text-red-500"/> },
    { title: "Youth Mental Health", source: "APA Services", link: "https://www.apaservices.org/practice/ce/tools/factsheets", icon: <Award className="text-indigo-500"/> }
  ]);

  const isGuest = !user || user === 'guest';

  // Average mood score for spectrum
  const moodScore =
    analytics.reduce((sum, a) => sum + a.score, 0) / analytics.length || 5;

  useEffect(() => {
    const fetchRealData = async () => {
      if (isGuest) return;
      const q = query(
        collection(db, "chats"),
        where("userId", "==", user.uid),
        orderBy("lastUpdated", "asc"),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        time: doc.data().lastUpdated?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emotion: doc.data().latestEmotion || "Neutral",
        score: doc.data().emotionScore || 5
      }));
      if (data.length > 0) setAnalytics(data);
    };
    fetchRealData();
  }, [user, isGuest]);

  return (
    <div className="p-8 bg-gray-50 min-h-full overflow-y-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Wellness Insights</h2>
          <p className="text-gray-500">Analysis powered by DistilRoBERTa RNN</p>
        </div>
        {isGuest && (
          <span className="px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold tracking-widest uppercase">
            Guest Demo
          </span>
        )}
      </div>

      {/* STAT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Mood Score" value={`${moodScore.toFixed(1)}/10`} icon={<Smile className="text-green-500"/>} />
        <StatCard title="Total Chats" value={analytics.length} icon={<Zap className="text-yellow-500"/>} />
        <StatCard title="Recent State" value={analytics.at(-1)?.emotion || "—"} icon={<Target className="text-indigo-500"/>} />
        <StatCard title="Vulnerability" value="Low" icon={<ShieldCheck className="text-blue-500"/>} />
      </div>

      {/* 🌈 EMOTIONAL SPECTRUM (ADDED) */}
      <div className="mb-10">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-widest">
          Emotional Spectrum
        </p>

        <div className="relative h-4 rounded-full overflow-hidden bg-gradient-to-r from-rose-400 via-indigo-300 to-emerald-400">
          <div
            className="absolute top-1/2 w-3.5 h-3.5 rounded-full bg-white border border-gray-300 shadow-md"
            style={{
              left: `${(moodScore / 10) * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>Negative</span>
          <span>Neutral</span>
          <span>Positive</span>
        </div>
      </div>

      {/* EMOTIONAL TRAJECTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4 text-gray-700">Emotional Trajectory</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis hide domain={[0, 10]} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#4f46e5" fill="url(#colorScore)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TRIGGERS */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4 text-gray-700">Detected Triggers</h3>
          <div className="space-y-4">
            <TriggerItem label="Placement Anxiety" intensity="High" color="bg-red-100 text-red-700" />
            <TriggerItem label="Social Stress" intensity="Medium" color="bg-amber-100 text-amber-700" />
            <TriggerItem label="Academic Load" intensity="Low" color="bg-blue-100 text-blue-700" />
          </div>
        </div>
      </div>

      {/* RECOMMENDATIONS */}
      <h3 className="text-xl font-bold mb-4 text-gray-800">Resources for You</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="mb-4 p-3 bg-gray-50 w-fit rounded-xl">{item.icon}</div>
            <h4 className="font-bold text-gray-800 mb-1">{item.title}</h4>
            <p className="text-sm text-gray-500 mb-4">{item.source}</p>
            <a href={item.link} target="_blank" className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline">
              Read Article <ExternalLink size={14} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

/* SUB COMPONENTS */

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="p-3 bg-indigo-50 rounded-xl">{icon}</div>
    <div>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{title}</p>
      <p className="text-lg font-bold text-gray-800 mt-1">{value}</p>
    </div>
  </div>
);

const TriggerItem = ({ label, intensity, color }) => (
  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-gray-50/50">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${color}`}>{intensity}</span>
  </div>
);

export default Dashboard;
