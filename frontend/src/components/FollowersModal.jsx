/**
 * FollowersModal.jsx
 *
 * Shows the list of people who follow a user.
 * Logged-in user can:
 *   - Follow/unfollow each follower (via FollowButton)
 *   - Remove a follower (DELETE /follow/remove-follower/:id)
 *   - Search followers by username or name
 *
 * Props:
 *   userId                  – whose followers to load
 *   onClose()               – close handler
 *   onFollowersUpdate()     – called after remove (for parent count refresh)
 *   onFollowersCountUpdate(n) – passes the new list length up
 *
 * APIs:
 *   GET    /profile/get-followers/:userId  → { followers: UserListItem[] }
 *   DELETE /follow/remove-follower/:id
 *
 * UserListItem shape: { userId, username, name, profilePicture, isFollowing? }
 */

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Search, X, Users } from "lucide-react";
import api from "../services/api.js";
import UserListCard from "./UserListCard.jsx";
import FollowButton from "./FollowButton.jsx";
import "../styles/modalStyles.css";

/* ── Spinner ─────────────────────────────────────────────────── */
const Spinner = () => (
  <div className="spinner-center">
    <span className="spinner-ring" />
    <p className="text-sm text-slate-500">Loading followers…</p>
  </div>
);

/* ── Empty state ─────────────────────────────────────────────── */
const Empty = ({ text, sub }) => (
  <div className="empty-state">
    <div className="empty-illustration">
      <Users size={22} color="#6B7280" />
    </div>
    <p className="empty-title">{text}</p>
    <p className="empty-subtitle">{sub}</p>
  </div>
);

/* ── FollowersModal ───────────────────────────────────────────── */
const FollowersModal = ({
  userId,
  onClose,
  onFollowersUpdate,
  onFollowersCountUpdate,
}) => {
  const { user } = useSelector((state) => state.auth);
  const [followers, setFollowers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [removeError, setRemoveError] = useState(null);
  const mountedRef = useRef(true);

  // Lock body scroll when modal opens
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Fetch followers on mount or userId change
  useEffect(() => {
    mountedRef.current = true;
    if (!userId) return;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/profile/get-followers/${userId}`);
        let list = res.data.followers || [];

        // Filter out current user to avoid duplicate
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
        
        setFollowers(uniqueList);
        onFollowersCountUpdate?.(uniqueList.length);
      } catch (err) {
        if (mountedRef.current) {
          setError(err.response?.data?.message || "Could not load followers.");
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetch();
    return () => {
      mountedRef.current = false;
    };
  }, [userId, user?.id]);

  // Handle removing follower with optimistic UI
  const handleRemove = async (followerId) => {
    setRemovingId(followerId);
    setRemoveError(null);
    
    // Optimistic UI update
    const updatedList = followers.filter((f) => (f.userId || f._id) !== followerId);
    
    try {
      await api.delete(`/follow/remove-follower/${followerId}`);
      if (mountedRef.current) {
        setFollowers(updatedList);
        onFollowersUpdate?.();
        onFollowersCountUpdate?.(updatedList.length);
      }
    } catch (err) {
      if (mountedRef.current) {
        // Revert optimistic update
        setFollowers(followers);
        setRemoveError(err.response?.data?.message || "Failed to remove follower");
        setTimeout(() => mountedRef.current && setRemoveError(null), 3000);
      }
    } finally {
      if (mountedRef.current) setRemovingId(null);
    }
  };

  // Update follow status when follow/unfollow happens
  const handleFollowStatusChange = (targetUserId, status) => {
    setFollowers((current) =>
      current.map((item) => {
        const id = String(item.userId || item._id);
        if (id !== String(targetUserId)) return item;
        return { ...item, isFollowing: status === "followed" };
      })
    );
  };

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Filter followers based on search term
  const filteredFollowers = followers.filter((follower) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [follower.username, follower.name]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  const isOwnProfile = String(user?.id) === String(userId);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdrop}
        className="modal-backdrop"
      >
        {/* Modal shell */}
        <div className="modal-shell">
          <div className="modal-inner">

            {/* Header */}
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="modal-icon-shell">
                  <Users size={18} />
                </div>
                <div>
                  <h2 className="modal-title">Followers</h2>
                  {!loading && (
                    <p className="modal-subtitle">
                      {followers.length} {followers.length === 1 ? "person" : "people"}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="modal-close"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Error banner */}
            {removeError && (
              <div className="mx-4 mt-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {removeError}
              </div>
            )}

            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-100">
              <label htmlFor="follower-search" className="hidden">
                Search followers
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  id="follower-search"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search"
                  className="w-full rounded-full border border-gray-200 bg-gray-50 px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* List */}
            <div className="modal-list-body modal-scroll">
              {loading ? (
                <Spinner />
              ) : error ? (
                <div className="modal-alert">{error}</div>
              ) : followers.length === 0 ? (
                <Empty
                  text="No followers yet"
                  sub="When someone follows you, they'll appear here."
                />
              ) : filteredFollowers.length === 0 ? (
                <Empty
                  text="No results found"
                  sub="Try searching with a different name or username."
                />
              ) : (
                <div className="space-y-3">
                  {filteredFollowers.map((follower) => {
                    const followerId = follower.userId || follower._id;
                    return (
                      <UserListCard
                        key={followerId}
                        user={follower}
                        onUserClick={onClose}
                        actionNode={
                          <div className="flex items-center gap-2">
                            <FollowButton
                              userId={followerId}
                              initialFollowing={follower.isFollowing ?? null}
                              size="sm"
                              onFollowStatusChange={(status) =>
                                handleFollowStatusChange(followerId, status)
                              }
                            />
                            {isOwnProfile && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemove(followerId);
                                }}
                                disabled={removingId === followerId}
                                className="rounded-full px-4 py-2 text-sm font-semibold border border-gray-200 bg-gray-50 hover:bg-blue-50 text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                              >
                                {removingId === followerId ? "Removing…" : "Remove"}
                              </button>
                            )}
                          </div>
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {!loading && followers.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-3 text-right">
                <span className="text-xs text-gray-500">
                  {followers.length} {followers.length === 1 ? "follower" : "followers"}
                </span>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default FollowersModal;
               