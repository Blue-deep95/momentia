import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { X, UserCheck, Search } from "lucide-react";
import api from "../services/api.js";
import UserListCard from "./UserListCard.jsx";
import FollowButton from "./FollowButton.jsx";
import "../styles/modalStyles.css";

/* ── Spinner ─────────────────────────────────────────────────── */
const Spinner = () => (
  <div className="spinner-center">
    <span className="spinner-ring" />
    <p className="text-sm text-slate-500">Loading following…</p>
  </div>
);

/* ── Empty state ─────────────────────────────────────────────── */
const Empty = ({ text, sub }) => (
  <div className="empty-state">
    <div className="empty-illustration">
      <UserCheck size={22} color="#6B7280" />
    </div>
    <p className="empty-title">{text}</p>
    <p className="empty-subtitle">{sub}</p>
  </div>
);

/* ── FollowingModal ───────────────────────────────────────────── */
const FollowingModal = ({
  userId,
  onClose,
  onFollowingUpdate,
  onFollowingCountUpdate,
}) => {
  const { user } = useSelector((state) => state.auth);
  const [following, setFollowing] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  // Lock body scroll when modal opens
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  /* ── Fetch following list ── */
  useEffect(() => {
    mountedRef.current = true;
    if (!userId) return;

    const fetch = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get(`/profile/get-following/${userId}`);
        let list = res.data.following || [];
        if (user?.id) {
          list = list.filter(
            (item) => String(item.userId || item._id) !== String(user.id)
          );
        }

        if (!mountedRef.current) return;
        
        // Avoid duplicates
        const uniqueList = Array.from(
          new Map(list.map((item) => [item.userId || item._id, item])).values()
        );
        
        setFollowing(uniqueList);
        onFollowingCountUpdate?.(uniqueList.length);
      } catch (err) {
        if (mountedRef.current)
          setError(err.response?.data?.message || "Could not load following.");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetch();
    return () => {
      mountedRef.current = false;
    };
  }, [userId, user?.id]);

  /* ── Handle unfollow from FollowButton ── */
  const handleFollowStatusChange = (targetUserId, status) => {
    if (status === "unfollowed" && mountedRef.current) {
      const updated = following.filter(
        (u) => String(u.userId || u._id) !== String(targetUserId)
      );
      setFollowing(updated);
      onFollowingUpdate?.();
      onFollowingCountUpdate?.(updated.length);
    }
  };

  /* ── Close on backdrop click ── */
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  /* ── Filter following based on search ── */
  const filteredFollowing = following.filter((followingUser) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [followingUser.username, followingUser.name]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  return (
    <div onClick={handleBackdrop} className="modal-backdrop">
      <div className="modal-shell">
        <div className="modal-inner">
          <div className="modal-header">
            <div className="flex items-center gap-3">
              <div className="modal-icon-shell">
                <UserCheck size={18} />
              </div>
              <div>
                <h2 className="modal-title">Following</h2>
                {!loading && (
                  <p className="modal-subtitle">
                    {following.length} {following.length === 1 ? "user" : "users"}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="modal-close"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-gray-100">
            <label htmlFor="following-search" className="hidden">
              Search following
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                id="following-search"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search"
                className="w-full rounded-full border border-gray-200 bg-gray-50 px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="modal-list-body modal-scroll">
            {loading ? (
              <Spinner />
            ) : error ? (
              <div className="modal-alert">{error}</div>
            ) : following.length === 0 ? (
              <Empty
                text="Not following anyone"
                sub="Find and follow creators to see their content."
              />
            ) : filteredFollowing.length === 0 ? (
              <Empty
                text="No results found"
                sub="Try searching with a different name or username."
              />
            ) : (
              <div className="space-y-3">
                {filteredFollowing.map((userItem) => (
                  <UserListCard
                    key={userItem.userId || userItem._id}
                    user={userItem}
                    onUserClick={onClose}
                    actionNode={
                      <FollowButton
                        userId={userItem.userId || userItem._id}
                        initialFollowing={true}
                        size="sm"
                        onFollowStatusChange={(status) =>
                          handleFollowStatusChange(userItem.userId || userItem._id, status)
                        }
                      />
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {!loading && following.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-3 text-right">
              <span className="text-xs text-gray-500">
                Following {following.length} {following.length === 1 ? "user" : "users"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowingModal;
