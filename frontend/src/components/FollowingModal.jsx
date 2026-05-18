import React, { useEffect, useState } from "react";
import { X, User } from "lucide-react";
import api from "../services/api.js";
import UserListCard from "./UserListCard.jsx";

const FollowingModal = ({ userId, onClose, onFollowingUpdate, onFollowingCountUpdate }) => {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unfollowingId, setUnfollowingId] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchFollowing = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get(`/profile/get-following/${userId}`);
        const followingList = res.data.following || [];
        setFollowing(followingList);
        if (onFollowingCountUpdate) {
          onFollowingCountUpdate(followingList.length);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Could not load following.");
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [userId]);

  const handleUnfollow = async (targetId) => {
    setUnfollowingId(targetId);
    try {
      const response = await api.delete(`/follow/unfollow-user/${targetId}`);
      
      // Only remove from UI if backend confirms success
      if (response.status === 200) {
        const updatedFollowing = following.filter((user) => user.userId !== targetId);
        setFollowing(updatedFollowing);

        // Notify parent to update following count
        if (onFollowingUpdate) {
          onFollowingUpdate();
        }
        if (onFollowingCountUpdate) {
          onFollowingCountUpdate(updatedFollowing.length);
        }
      }
    } catch (err) {
      console.error("Error unfollowing user:", err);
      const errorMsg = err.response?.data?.message || "Failed to unfollow user";
      setError(errorMsg);
      
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setUnfollowingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
              <User size={18} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Following</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-100 border-t-blue-600" />
                <p className="text-sm text-gray-500">Loading following...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          ) : following.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={20} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">Not following anyone</p>
                <p className="text-xs text-gray-500 mt-1">
                  Find and follow creators to see their content
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {following.map((user) => (
                <UserListCard
                  key={user.userId}
                  user={user}
                  actionLabel="Unfollow"
                  onActionClick={handleUnfollow}
                  isLoading={unfollowingId === user.userId}
                  onUserClick={onClose}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-3 text-right">
          <span className="text-xs text-gray-500">
            Following {following.length} {following.length === 1 ? "user" : "users"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FollowingModal;
