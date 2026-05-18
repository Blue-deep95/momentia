import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import api from "../services/api";

// Toast Component
const Toast = ({ message, type = "success", onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-60 p-4 rounded-2xl shadow-xl text-white transition-all duration-300 border-2 ${
      type === "error" ? "bg-red-500 border-red-400" : "bg-green-500 border-green-400"
    }`}>
      <div className="flex items-center gap-2">
        <span className="font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 text-white transition hover:text-gray-200">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

const SuggestedProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState({});
  const [followLoading, setFollowLoading] = useState({});
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const handleFollow = async (targetId) => {
    setFollowLoading((prev) => ({ ...prev, [targetId]: true }));

    try {
      await api.post("/follow/follow-user", { targetId });
      setFollowed((prev) => ({ ...prev, [targetId]: true }));
      setToast({ message: "User followed successfully!", type: "success" });

      // After 2 seconds, remove the profile from the list
      setTimeout(() => {
        setProfiles((prev) => prev.filter((profile) => profile._id !== targetId));
      }, 2000);
    } catch (err) {
      console.error("Could not follow user:", err.response?.data || err);
    } finally {
      setFollowLoading((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  useEffect(() => {
    const fetchSuggestedProfiles = async () => {
      try {
        const res = await api.get("/profile/get-suggested-users");
        setProfiles(res.data.users || []);
      } catch (err) {
        console.error("Failed to load suggested profiles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedProfiles();
  }, []);

  return (
    <>
      {/* TOAST */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Suggested for you</h2>
        <Link
          to="/search"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          See all
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading suggestions…</p>
      ) : profiles.length === 0 ? (
        <p className="text-sm text-gray-500">No suggestions available.</p>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile) => {
            const rawUsername = profile.username || "user";
            const displayName = profile.name || rawUsername.split("@")[0] || "User";
            const displayHandle = rawUsername.includes("@")
              ? `@${rawUsername.split("@")[0]}`
              : `@${rawUsername}`;
            const avatarSrc =
              profile.profilePicture?.commentView ||
              profile.profilePicture?.profileView ||
              "https://via.placeholder.com/150";

            return (
              <div
                key={profile._id}
                className="flex w-full items-center justify-between gap-3 rounded-3xl border border-gray-100 bg-gray-50 p-3"
              >
                <div className="flex min-w-0 cursor-pointer items-center gap-3" onClick={() => navigate(`/profile/${profile._id}`)}>
                  <img
                    src={avatarSrc}
                    alt={displayName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-gray-500">{displayHandle}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleFollow(profile._id)}
                  disabled={followLoading[profile._id]}
                  className={`rounded-full px-4 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed ${
                    followLoading[profile._id]
                      ? "bg-slate-400"
                      : followed[profile._id]
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {followLoading[profile._id]
                    ? "Please wait"
                    : followed[profile._id]
                    ? "Following"
                    : "Follow"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
};

export default SuggestedProfiles;
