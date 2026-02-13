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

/* -------------------- TRIGGER METADATA -------------------- */

// 🟢 Triggers that represent strengths / positive states
const POSITIVE_TRIGGERS = new Set([
  "emotional_resilience",
  "inner_peace",
  "self_confidence",
  "joy_momentum",
  "emotional_balance",
  "self_growth"
]);

// 🧠 Human-readable labels for all triggers (negative + positive + risk)
const TRIGGER_LABELS = {
  // 🔴 Core struggles
  severe_loneliness: "Severe Loneliness",
  fear_spiral: "Fear Spiral",
  emotional_instability: "Emotional Instability",
  jealousy_prone: "Jealousy Prone",
  anger_spikes: "Anger Spikes",
  low_self_worth: "Low Self-Worth",

  // ⚠️ Derived mental-health risks (educational, not diagnostic)
  depression_risk: "Depressive Tendencies",
  anxiety_disorder_risk: "Anxiety Patterns",
  burnout_risk: "Emotional Burnout",
  grief_processing: "Grief Processing",

  // 🟢 Strengths & growth
  emotional_resilience: "Emotional Resilience",
  inner_peace: "Inner Peace",
  self_confidence: "Self-Confidence",
  joy_momentum: "Joy Momentum",
  emotional_balance: "Emotional Balance",
  self_growth: "Personal Growth"
};


/* -------------------- TRIGGER → RESOURCES MAP -------------------- */

const TRIGGER_RESOURCES = {
  severe_loneliness: [
    {
      title: "Coping With Loneliness",
      source: "Psychology Today",
      link: "https://www.psychologytoday.com/us/basics/loneliness"
    },
    {
      title: "Building Social Connection",
      source: "Mind",
      link: "https://www.mind.org.uk/information-support/tips-for-everyday-living/loneliness/"
    }
  ],

  low_self_worth: [
    {
      title: "Improving Self-Esteem",
      source: "NHS",
      link: "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/self-esteem/"
    }
  ],

  fear_spiral: [
    {
      title: "Managing Anxiety",
      source: "American Psychological Association",
      link: "https://www.apa.org/topics/anxiety"
    }
  ],

  anger_spikes: [
    {
      title: "Anger Management Techniques",
      source: "HelpGuide",
      link: "https://www.helpguide.org/articles/anger/anger-management.htm"
    }
  ],

  emotional_instability: [
    {
      title: "Emotional Regulation Skills",
      source: "Verywell Mind",
      link: "https://www.verywellmind.com/emotional-regulation-2795197"
    }
  ],

  emotional_resilience: [
    {
      title: "Building Emotional Resilience",
      source: "APA",
      link: "https://www.apa.org/topics/resilience"
    }
  ],

  inner_peace: [
    {
      title: "Mindfulness & Calm",
      source: "Greater Good Science Center",
      link: "https://greatergood.berkeley.edu/topic/mindfulness"
    }
  ],

  self_confidence: [
    {
      title: "Confidence & Self-Growth",
      source: "Psychology Today",
      link: "https://www.psychologytoday.com/us/basics/self-confidence"
    }
  ],

  joy_momentum: [
    {
      title: "Sustaining Happiness",
      source: "Harvard Health",
      link: "https://www.health.harvard.edu/mind-and-mood/the-happiness-workshop"
    }
  ],

  /* -------------------- EXTENDED TRIGGER → RESOURCES -------------------- */

  depression_risk: [
    {
      title: "Understanding Depression",
      source: "National Institute of Mental Health (NIMH)",
      link: "https://www.nimh.nih.gov/health/topics/depression"
    },
    {
      title: "Depression: Symptoms & Treatment",
      source: "Mayo Clinic",
      link: "https://www.mayoclinic.org/diseases-conditions/depression"
    }
  ],

  // 😟 Chronic anxiety / fear loops
  anxiety_disorder_risk: [
    {
      title: "Anxiety Disorders Explained",
      source: "NHS",
      link: "https://www.nhs.uk/mental-health/conditions/anxiety-disorders/"
    },
    {
      title: "Managing Anxiety",
      source: "Anxiety Canada",
      link: "https://www.anxietycanada.com/"
    }
  ],

  // 🧯 Burnout / emotional exhaustion
  burnout_risk: [
    {
      title: "Signs of Burnout",
      source: "HelpGuide",
      link: "https://www.helpguide.org/articles/stress/burnout-prevention-and-recovery.htm"
    },
    {
      title: "Burnout at Work",
      source: "Harvard Business Review",
      link: "https://hbr.org/2015/11/burnout"
    }
  ],

  // 💔 Grief / emotional loss
  grief_processing: [
    {
      title: "Coping With Grief",
      source: "American Psychological Association",
      link: "https://www.apa.org/topics/grief"
    }
  ],

  // 🌱 Positive growth reinforcement
  self_growth: [
    {
      title: "Personal Growth & Wellbeing",
      source: "Greater Good Science Center",
      link: "https://greatergood.berkeley.edu/topic/personal_growth"
    }
  ]
};


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

      // Emotion → score mapping (1 = anger … 10 = happy)
      const emotionScoreMap = {
        sadness: 1,
        lonely: 2,
        anger: 3,
        disgust: 4,
        fear: 5,
        neutral: 6,
        surprise: 7,
        love: 8,
        excitement: 9,
        joy: 10
      };

      setDailyData(
        todayLogs.map(l => ({
          time: l.timestamp.toDate().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          score: emotionScoreMap[l.emotion] ?? 6 // default = neutral
        }))
      );

      /* -------- WEEKLY (TOTAL SCORE + EMOTION DETAILS) -------- */
      const weeklyMap = {};

      logs.forEach(l => {
        if (!l.timestamp || !l.emotion) return;

        const date = l.timestamp.toDate();
        const dayKey = date.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric"
        });

        const emotion = l.emotion.toLowerCase().trim();
        const score = emotionScoreMap[emotion] ?? 6;

        if (!weeklyMap[dayKey]) {
          weeklyMap[dayKey] = {
            day: dayKey,
            totalScore: 0,
            emotions: {},
            emotionList: new Set()
          };
        }

        weeklyMap[dayKey].totalScore += score;
        weeklyMap[dayKey].emotionList.add(emotion);
        weeklyMap[dayKey].emotions[emotion] =
          (weeklyMap[dayKey].emotions[emotion] || 0) + 1;
      });

      setWeeklyData(
        Object.values(weeklyMap).map(d => {
          const dominantEmotion = Object.entries(d.emotions).sort(
            (a, b) => b[1] - a[1]
          )[0]?.[0];

          return {
            day: d.day,
            score: d.totalScore,
            dominantEmotion,
            emotions: Array.from(d.emotionList)
          };
        })
      );



      /* -------- RECENT EMOTION -------- */
      setRecentEmotion(logs.at(-1)?.emotion || "—");

      /* -------- DERIVED PSYCHOLOGICAL + POSITIVE + RISK TRIGGERS -------- */

      const triggerCount = {
        // 🔴 Core struggles
        severe_loneliness: 0,
        fear_spiral: 0,
        emotional_instability: 0,
        jealousy_prone: 0,
        anger_spikes: 0,
        low_self_worth: 0,

        // ⚠️ Derived risk signals (educational, not diagnostic)
        depression_risk: 0,
        anxiety_disorder_risk: 0,
        burnout_risk: 0,

        // 🟢 Strengths
        emotional_resilience: 0,
        inner_peace: 0,
        self_confidence: 0,
        joy_momentum: 0,
        emotional_balance: 0,
        self_growth: 0
      };

      let prevScore = null;
      let positiveStreak = 0;
      let negativeStreak = 0;

      logs.forEach(l => {
        const emotion = l.emotion?.toLowerCase().trim();
        if (!emotion) return;

        const score = emotionScoreMap[emotion] ?? 6;

        /* -------- NEGATIVE PATTERNS -------- */

        if (emotion === "lonely" || emotion === "sadness") {
          triggerCount.severe_loneliness += 1;
          negativeStreak += 1;
        } else {
          negativeStreak = 0;
        }

        if (emotion === "fear") {
          triggerCount.fear_spiral += 1;
          triggerCount.anxiety_disorder_risk += 1;
        }

        if (emotion === "anger") {
          triggerCount.anger_spikes += 1;
        }

        if (emotion === "jealousy" || emotion === "envy") {
          triggerCount.jealousy_prone += 1;
        }

        if (emotion === "sadness" || emotion === "disgust") {
          triggerCount.low_self_worth += 1;
        }

        if (prevScore !== null && Math.abs(score - prevScore) >= 4) {
          triggerCount.emotional_instability += 1;
        }

        /* -------- RISK DERIVATION -------- */

        // Prolonged sadness / loneliness → depression risk
        if (negativeStreak >= 3) {
          triggerCount.depression_risk += 1;
        }

        // Emotional volatility + fear → burnout risk
        if (
          triggerCount.emotional_instability > 2 &&
          triggerCount.fear_spiral > 1
        ) {
          triggerCount.burnout_risk += 1;
        }

        /* -------- POSITIVE PATTERNS -------- */

        if (score >= 8) {
          positiveStreak += 1;
        } else {
          positiveStreak = 0;
        }

        if (positiveStreak >= 2) {
          triggerCount.joy_momentum += 1;
        }

        if (emotion === "neutral" || emotion === "calm") {
          triggerCount.inner_peace += 1;
        }

        if (emotion === "joy" || emotion === "love" || emotion === "excitement") {
          triggerCount.self_confidence += 1;
        }

        if (prevScore !== null && prevScore <= 4 && score >= 7) {
          triggerCount.emotional_resilience += 1;
        }

        if (prevScore !== null && Math.abs(score - prevScore) <= 1) {
          triggerCount.emotional_balance += 1;
        }

        if (positiveStreak >= 3 && triggerCount.low_self_worth === 0) {
          triggerCount.self_growth += 1;
        }

        prevScore = score;
      });

      /* -------- REMOVE CONTRADICTING TRIGGERS -------- */

      const resolvedTriggers = { ...triggerCount };

      // ❌ Low self-worth vs ✅ Self-confidence
      if (resolvedTriggers.self_confidence > 1) {
        delete resolvedTriggers.low_self_worth;
      }
      if (resolvedTriggers.low_self_worth > 3) {
        delete resolvedTriggers.self_confidence;
      }

      // ❌ Emotional instability vs ✅ Emotional balance
      if (resolvedTriggers.emotional_balance > 1) {
        delete resolvedTriggers.emotional_instability;
      }
      if (resolvedTriggers.emotional_instability > 3) {
        delete resolvedTriggers.emotional_balance;
      }

      // ❌ Depression risk vs ✅ Joy momentum
      if (resolvedTriggers.joy_momentum > 1) {
        delete resolvedTriggers.depression_risk;
      }

      // Remove zero values
      const meaningfulTriggers = Object.fromEntries(
        Object.entries(resolvedTriggers).filter(([_, count]) => count > 0)
      );

      setTriggerStats(meaningfulTriggers);



      /* -------- RECOMMENDATIONS (TRIGGER-BASED) -------- */

      const recs = [];
      const addedLinks = new Set();

      // Prioritize HIGH → MEDIUM triggers
      Object.entries(meaningfulTriggers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3) // max 3 triggers influence recs
        .forEach(([trigger]) => {
          const resources = TRIGGER_RESOURCES[trigger] || [];

          resources.forEach(r => {
            if (!addedLinks.has(r.link)) {
              addedLinks.add(r.link);
              recs.push({
                ...r,
                icon: POSITIVE_TRIGGERS.has(trigger)
                  ? <Award className="text-green-500" />
                  : <Heart className="text-indigo-500" />
              });
            }
          });
        });

      setRecommendations(recs.slice(0, 3));

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

            {Object.entries(triggerStats)
              .map(([label, count]) => {
                const intensity =
                  count > 3 ? "High" : count > 1 ? "Medium" : "Low";

                const isPositive = POSITIVE_TRIGGERS.has(label);

                return {
                  label,
                  intensity,
                  isPositive,
                  priority:
                    (isPositive ? 50 : 0) +
                    (intensity === "High" ? 0 : intensity === "Medium" ? 1 : 2)
                };
              })
              .sort((a, b) => a.priority - b.priority)
              .slice(0, 5)
              .map(({ label, intensity, isPositive }) => (
                <TriggerItem
                  key={label}
                  label={TRIGGER_LABELS[label] || label}
                  intensity={intensity}
                  color={
                    isPositive
                      ? intensity === "High"
                        ? "bg-green-100 text-green-700"
                        : intensity === "Medium"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-lime-100 text-lime-700"
                      : intensity === "High"
                        ? "bg-red-100 text-red-700"
                        : intensity === "Medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                  }
                />
              ))}

          </div>
        </div>

        {/* WEEKLY MOOD TREND */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border mt-6">
          <h3 className="text-lg font-bold mb-4 text-gray-700">
            Weekly Mood Trend
          </h3>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis hide />
                <Tooltip content={<WeeklyTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#059669"
                  fill="#a7f3d0"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
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

const WeeklyTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white p-3 rounded-xl shadow-md border text-xs space-y-1">
      <p className="font-bold text-gray-800">{label}</p>
      <p>Total Mood Score: <b>{data.score}</b></p>
      <p>Dominant Emotion: <b className="capitalize">{data.dominantEmotion}</b></p>
      <p>
        Emotions:
        <span className="capitalize">
          {" "}{data.emotions.join(", ")}
        </span>
      </p>
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
