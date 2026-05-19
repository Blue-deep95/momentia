import React, { useState } from "react";
import { UserMinus, UserPlus } from "lucide-react";
import api from "../services/api.js";

const FollowButton = ({ userId, onFollowStatusChange, isFollowing: initialFollowing = false }) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFollowToggle = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setLoading(true);
    setError(null);

    try {
      let response;
      if (isFollowing) {
        response = await api.delete(`/follow/unfollow-user/${userId}`);
      } else {
        response = await api.post(`/follow/follow-user`, { targetId: userId });
      }

      if (response.status === 200 || response.status === 201) {
        setIsFollowing(!isFollowing);
        if (onFollowStatusChange) {
          onFollowStatusChange(isFollowing ? "unfollowed" : "followed");
        }
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
      const errorMsg = err.response?.data?.message || "Failed to update follow status";
      setError(errorMsg);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={handleFollowToggle}
        disabled={loading}
        className={`flex items-center justify-center rounded-lg px-5 py-1.5 text-xs font-semibold transition-all duration-200 ${
          isFollowing
            ? "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700"
            : "bg-sky-500 text-white hover:bg-sky-600"
        } disabled:opacity-50 disabled:cursor-not-allowed min-w-[85px] h-[32px]`}
      >
        {loading ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>
            {isFollowing ? (
              <>
                <UserMinus size={16} />
                Unfollow
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Follow
              </>
            )}
          </>
        )}
      </button>

      {error && (
        <p className="rounded bg-red-50 px-2 py-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default FollowButton;
