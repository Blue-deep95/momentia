import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const SuggestedProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState({});
  const [followLoading, setFollowLoading] = useState({});

  const handleFollow = async (targetId) => {
    setFollowLoading((prev) => ({ ...prev, [targetId]: true }));

    try {
      await api.post("/follow/follow-user", { targetId });
      setFollowed((prev) => ({ ...prev, [targetId]: true }));
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
                <div className="flex min-w-0 items-center gap-3">
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
                  className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
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
  );
};

export default SuggestedProfiles;
