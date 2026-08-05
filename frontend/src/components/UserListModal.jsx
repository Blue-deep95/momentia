import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Search, X, Users, UserCheck, Loader2 } from "lucide-react";
import api from "../services/api.js";
import UserListCard from "./UserListCard.jsx";
import FollowButton from "./FollowButton.jsx";

export default function UserListModal({
  userId,
  type = "followers",
  onClose,
  onListUpdate,
  onCountUpdate,
}) {
  const { user } = useSelector((state) => state.auth);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const mountedRef = useRef(true);

  // Store onCountUpdate in a ref so changes to it don't trigger the fetch effect
  const onCountUpdateRef = useRef(onCountUpdate);
  useEffect(() => {
    onCountUpdateRef.current = onCountUpdate;
  }, [onCountUpdate]);

  const isFollowers = type === "followers";
  const isOwnProfile = user?.id === userId;
  const title = isFollowers ? "Followers" : "Following";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!userId) return;

    const fetchList = async () => {
      setLoading(true);
      setError(null);

      try {
        const path = isFollowers
          ? `/profile/get-followers/${userId}`
          : `/profile/get-following/${userId}`;

        const res = await api.get(path);
        let rawList = isFollowers
          ? res.data.followers || []
          : res.data.following || [];

        if (!mountedRef.current) return;

        // Deduplicate list by userId
        const uniqueList = Array.from(
          new Map(rawList.map((item) => [item.userId || item._id, item])).values()
        );

        setItems(uniqueList);
        if (onCountUpdateRef.current) {
          onCountUpdateRef.current(uniqueList.length);
        }
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err.response?.data?.message || `Could not load ${type}.`);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetchList();

    return () => {
      mountedRef.current = false;
    };
  }, [userId, type, isFollowers]);

  // Remove a follower (only if own profile and looking at followers)
  const handleRemoveFollower = async (targetUserId) => {
    if (!targetUserId || removingId) return;
    setRemovingId(targetUserId);

    try {
      await api.delete(`/follow/remove-follower/${targetUserId}`);
      const updated = items.filter((item) => (item.userId || item._id) !== targetUserId);
      setItems(updated);
      if (onCountUpdateRef.current) onCountUpdateRef.current(updated.length);
      if (onListUpdate) onListUpdate();
    } catch (err) {
      console.error("Failed to remove follower:", err);
    } finally {
      setRemovingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.username && item.username.toLowerCase().includes(term)) ||
      (item.name && item.name.toLowerCase().includes(term))
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-[80vh] max-h-[580px] w-full max-w-md flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl bg-white border border-gray-200 py-2 pl-10 pr-4 text-sm text-gray-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-sm font-medium text-gray-500">Loading {title.toLowerCase()}...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-red-50 p-4 text-center text-sm font-medium text-red-600">
              {error}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-3">
                {isFollowers ? <Users size={28} /> : <UserCheck size={28} />}
              </div>
              <p className="text-base font-semibold text-gray-800">
                {searchTerm ? "No results found" : `No ${title.toLowerCase()} yet`}
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                {searchTerm
                  ? `No user matched "${searchTerm}"`
                  : isFollowers
                  ? "When users follow this profile, they will show up here."
                  : "When this profile follows users, they will show up here."}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const targetId = item.userId || item._id;
              const isSelf = targetId === user?.id;

              return (
                <UserListCard
                  key={targetId}
                  user={item}
                  onUserClick={onClose}
                  actionNode={
                    isSelf ? null : isFollowers && isOwnProfile ? (
                      <div className="flex items-center gap-2">
                        <FollowButton userId={targetId} initialFollowing={item.isFollowing} />
                        <button
                          onClick={() => handleRemoveFollower(targetId)}
                          disabled={removingId === targetId}
                          className="rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold px-3.5 py-1.5 text-xs shadow-xs transition-all disabled:opacity-50"
                        >
                          {removingId === targetId ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    ) : (
                      <FollowButton userId={targetId} initialFollowing={item.isFollowing} />
                    )
                  }
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
