import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  ExternalLink,
  Award,
  Heart,
  ShieldCheck,
  Zap,
  Target,
  Smile
} from 'lucide-react';


/* -------------------- DASHBOARD -------------------- */

const Dashboard = ({ user }) => {
  const isGuest = !user || user === 'guest';

  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [recentEmotion, setRecentEmotion] = useState("—");
  const [triggerStats, setTriggerStats] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0); // ✅ NEW

  /* -------------------- FETCH ANALYTICS -------------------- */

  useEffect(() => {
    if (isGuest || !user?.uid) return;

    const fetchAnalytics = async () => {
      const q = query(
        collection(db, "mood_logs"),
        where("userId", "==", user.uid)
      );

      const snapshot = await getDocs(q);

      const logs = snapshot.docs
        .map(doc => doc.data())
        .sort((a, b) => {
          if (!a.timestamp || !b.timestamp) return 0;
          return a.timestamp.toMillis() - b.timestamp.toMillis();
        });

      console.log("🔥 FETCHED LOGS:", logs);



      if (logs.length === 0) {
        setDailyData([]);
        setWeeklyData([]);
        setRecentEmotion("—");
        setTriggerStats({});
        setRecommendations([]);
        setTotalLogs(0);
        return;
      }

      // ✅ TOTAL LOGS
      setTotalLogs(logs.length);

      /* -------- TODAY FILTER (FIXED – NO TIMEZONE BUG) -------- */
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const todayLogs = logs.filter(l => {
        if (!l.timestamp) return false;
        const t = l.timestamp.toDate();
        return t >= startOfToday;
      });

      setDailyData(
        todayLogs.map(l => ({
          time: l.timestamp.toDate().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          score: Math.round((l.score || 0.5) * 10)
        }))
      );

      /* -------- WEEKLY (AVG PER DAY) -------- */
      const dayMap = {};

      logs.forEach(l => {
        if (!l.day) return;
        if (!dayMap[l.day]) dayMap[l.day] = [];
        dayMap[l.day].push((l.score || 0.5) * 10);
      });

      setWeeklyData(
        Object.entries(dayMap).map(([day, scores]) => ({
          day,
          score: scores.reduce((a, b) => a + b, 0) / scores.length
        }))
      );


      /* -------- RECENT EMOTION -------- */
      setRecentEmotion(logs.at(-1)?.emotion || "—");

      /* -------- TRIGGERS -------- */
      const triggerCount = {};
      logs.forEach(l => {
        if (!l.trigger || l.trigger === "none") return;
        triggerCount[l.trigger] = (triggerCount[l.trigger] || 0) + 1;
      });
      setTriggerStats(triggerCount);

      /* -------- RECOMMENDATIONS -------- */
      const dominantEmotion = logs.at(-1)?.emotion;
      const recs = [];

      if (dominantEmotion === "fear" || dominantEmotion === "sadness") {
        recs.push({
          title: "Grounding & Anxiety Relief",
          source: "APA",
          link: "https://www.apa.org/topics/anxiety",
          icon: <ShieldCheck className="text-blue-500" />
        });
      }

      if (dominantEmotion === "sadness") {
        recs.push({
          title: "Coping with Low Mood",
          source: "Psychiatry.org",
          link: "https://www.psychiatry.org/patients-families/depression",
          icon: <Heart className="text-red-500" />
        });
      }

      if (dominantEmotion === "neutral") {
        recs.push({
          title: "Building Emotional Awareness",
          source: "APA Services",
          link: "https://www.apaservices.org/practice/ce/tools/factsheets",
          icon: <Award className="text-indigo-500" />
        });
      }

      setRecommendations(recs);
    };

    fetchAnalytics();
  }, [user, isGuest]);

  /* -------------------- DERIVED VALUES -------------------- */

  const moodScore =
    dailyData.reduce((sum, a) => sum + a.score, 0) /
    (dailyData.length || 1);

  /* -------------------- UI -------------------- */

  return (
    <div className="p-8 bg-gray-50 min-h-full overflow-y-auto pb-20">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Wellness Insights</h2>
          <p className="text-gray-500">Emotion trends based on your conversations</p>
        </div>
        {isGuest && (
          <span className="px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase">
            Guest Demo
          </span>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Mood Score" value={`${moodScore.toFixed(1)}/10`} icon={<Smile className="text-green-500" />} />
        <StatCard title="Mood Logs" value={totalLogs} icon={<Zap className="text-yellow-500" />} />
        <StatCard title="Recent State" value={recentEmotion} icon={<Target className="text-indigo-500" />} />
        <StatCard title="Vulnerability" value={moodScore < 4 ? "High" : "Low"} icon={<ShieldCheck className="text-blue-500" />} />
      </div>

      {/* EMOTIONAL SPECTRUM */}
      <div className="mb-10">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-widest">
          Emotional Spectrum
        </p>

        <div className="relative h-4 rounded-full overflow-hidden bg-gradient-to-r from-rose-400 via-indigo-300 to-emerald-400">
          <div
            className="absolute top-1/2 w-3.5 h-3.5 rounded-full bg-white border shadow-md"
            style={{
              left: `${(moodScore / 10) * 100}%`,
              transform: "translate(-50%, -50%)"
            }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>Negative</span>
          <span>Neutral</span>
          <span>Positive</span>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        {/* DAILY TRAJECTORY */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border">
          <h3 className="text-lg font-bold mb-4 text-gray-700">
            Today’s Emotional Trajectory
          </h3>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" fontSize={11} />
                <YAxis hide domain={[0, 10]} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#4f46e5"
                  fill="#c7d2fe"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TRIGGERS */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <h3 className="text-lg font-bold mb-4 text-gray-700">
            Detected Triggers
          </h3>

          <div className="space-y-4">
            {Object.keys(triggerStats).length === 0 && (
              <p className="text-sm text-gray-400">
                No strong triggers detected yet.
              </p>
            )}

            {Object.entries(triggerStats).map(([label, count]) => (
              <TriggerItem
                key={label}
                label={label}
                intensity={count > 3 ? "High" : count > 1 ? "Medium" : "Low"}
                color={
                  count > 3
                    ? "bg-red-100 text-red-700"
                    : count > 1
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* RECOMMENDATIONS */}
      <h3 className="text-xl font-bold mb-4 text-gray-800">
        Resources for You
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border shadow-sm">
            <div className="mb-4 p-3 bg-gray-50 w-fit rounded-xl">
              {item.icon}
            </div>
            <h4 className="font-bold text-gray-800 mb-1">{item.title}</h4>
            <p className="text-sm text-gray-500 mb-4">{item.source}</p>
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"
            >
              Read Article <ExternalLink size={14} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

/* -------------------- SUB COMPONENTS -------------------- */

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
    <div className="p-3 bg-indigo-50 rounded-xl">{icon}</div>
    <div>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        {title}
      </p>
      <p className="text-lg font-bold text-gray-800 mt-1">{value}</p>
    </div>
  </div>
);

const TriggerItem = ({ label, intensity, color }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
    <span className="text-sm font-medium text-gray-700 capitalize">
      {label}
    </span>
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${color}`}>
      {intensity}
    </span>
  </div>
);

export default Dashboard;
