import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { X, UserCheck } from "lucide-react";
import api from "../services/api.js";
import UserListCard from "./UserListCard.jsx";
import FollowButton from "./FollowButton.jsx";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  /* ── Fetch ── */
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
        setFollowing(list);
        onFollowingCountUpdate?.(list.length);
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
  }, [userId]);

  /* ── Handle unfollow from FollowButton ── */
  const handleFollowStatusChange = (targetUserId, status) => {
    if (status === "unfollowed" && mountedRef.current) {
      const updated = following.filter((u) => u.userId !== targetUserId);
      setFollowing(updated);
      onFollowingUpdate?.();
      onFollowingCountUpdate?.(updated.length);
    }
  };

  /* ── Close on backdrop click ── */
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

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

            <button type="button" onClick={onClose} className="modal-close" aria-label="Close">
              <X size={16} />
            </button>
          </div>

          <div className="modal-list-body modal-scroll">
            {loading ? (
              <Spinner />
            ) : error ? (
              <div className="modal-alert">{error}</div>
            ) : following.length === 0 ? (
              <Empty text="Not following anyone" sub="Find and follow creators to see their content." />
            ) : (
              <div className="space-y-3">
                {following.map((userItem) => (
                  <UserListCard
                    key={userItem.userId}
                    user={userItem}
                    onUserClick={onClose}
                    actionNode={
                      <FollowButton
                        userId={userItem.userId}
                        initialFollowing={true}
                        size="sm"
                        onFollowStatusChange={(status) =>
                          handleFollowStatusChange(userItem.userId, status)
                        }
                      />
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {!loading && following.length > 0 && (
            <div className="modal-footer">
              <span className="text-xs text-slate-500">
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
