import { useEffect, useState } from "react";
import { Heart, X } from "lucide-react";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import calmVideos from "../data/calmVideos";

const Videos = () => {
  const user = auth.currentUser;

  const [activeVideo, setActiveVideo] = useState(null);
  const [favorites, setFavorites] = useState([]);

  // 🔥 Fetch favorites from Firestore
  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      const favRef = collection(db, "users", user.uid, "favorites");
      const snapshot = await getDocs(favRef);
      setFavorites(snapshot.docs.map((doc) => doc.id));
    };

    fetchFavorites();
  }, [user]);

  // ❤️ Toggle favorite
  const toggleFavorite = async (video) => {
    if (!user) return;

    const favRef = doc(db, "users", user.uid, "favorites", video.id);

    if (favorites.includes(video.id)) {
      await deleteDoc(favRef);
      setFavorites((prev) => prev.filter((id) => id !== video.id));
    } else {
      await setDoc(favRef, {
        title: video.title,
        category: video.category,
        createdAt: serverTimestamp(),
      });
      setFavorites((prev) => [...prev, video.id]);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-emerald-50 to-white px-6 py-10">

      {/* Header */}
      <div className="mb-10 max-w-4xl">
        <h1 className="text-3xl font-bold text-emerald-900 mb-3">
          Calming Sounds & Music
        </h1>

        <p className="text-gray-600 text-lg">
          Choose a soundscape. Let it play in the background while you rest,
          breathe, or think.
          All videos belong to their respective creators on YouTube. Used for wellness support purposes.
        </p>
      </div>

      {/* 🎥 Video Player */}
      {activeVideo && (
        <div className="relative mb-14 w-full rounded-3xl overflow-hidden shadow-2xl border bg-black">

          {/* Close Button */}
          <button
            onClick={() => setActiveVideo(null)}
            className="absolute top-3 right-3 z-10 bg-black/60 text-white rounded-full p-1 hover:bg-black transition"
          >
            <X size={18} />
          </button>

          <iframe
            className="w-full aspect-video"
            src={`https://www.youtube-nocookie.com/embed/${activeVideo}?autoplay=1&rel=0`}
            title="Calming Sound Player"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      )}

      {/* 🎧 Sound Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {calmVideos.map((video) => {
          const isActive = activeVideo === video.id;
          const isFav = favorites.includes(video.id);

          return (
            <div
              key={video.id}
              className={`
                relative p-6 rounded-2xl border bg-white transition-all
                ${isActive
                  ? "border-emerald-500 shadow-lg scale-[1.02]"
                  : "border-gray-200 hover:shadow-md hover:-translate-y-0.5"
                }
              `}
            >
              {/* ❤️ Favorite */}
              <button
                onClick={() => toggleFavorite(video)}
                className="absolute top-4 right-4 text-gray-400 hover:text-rose-500 transition"
              >
                <Heart
                  size={18}
                  fill={isFav ? "#f43f5e" : "none"}
                  stroke={isFav ? "#f43f5e" : "currentColor"}
                />
              </button>

              {/* ▶ Play */}
              <button
                onClick={() => setActiveVideo(video.id)}
                className="text-left w-full"
              >
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                  {video.category}
                </p>

                <h3 className="text-lg font-semibold text-gray-800">
                  {video.title}
                </h3>
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default Videos;
