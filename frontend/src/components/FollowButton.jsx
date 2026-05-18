import React, { useState } from "react";
import { UserPlus, UserMinus } from "lucide-react";
import api from "../services/api.js";

const FollowButton = ({ userId, onFollowStatusChange, isFollowing: initialFollowing = false }) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFollowToggle = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      if (isFollowing) {
        // Unfollow
        response = await api.delete(`/follow/unfollow-user/${userId}`);
      } else {
        // Follow
        response = await api.post(`/follow/follow-user`, { targetId: userId });
      }

      // Only update state if backend confirms success
      if (response.status === 200 || response.status === 201) {
        setIsFollowing(!isFollowing);

        // Notify parent component
        if (onFollowStatusChange) {
          onFollowStatusChange(isFollowing ? "unfollowed" : "followed");
        }
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
      const errorMsg = err.response?.data?.message || "Failed to update follow status";
      setError(errorMsg);

      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleFollowToggle}
        disabled={loading}
        className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition ${
          isFollowing
            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
            : "bg-blue-600 text-white hover:bg-blue-700"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {isFollowing ? "Unfollowing..." : "Following..."}
          </>
        ) : (
          <>
            {isFollowing ? (
              <>
                <UserMinus size={16} />
                Following
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
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default FollowButton;
