/**
 * FollowersModal.jsx
 *
 * Shows the list of people who follow a user.
 * Logged-in user can:
 *   - Follow/unfollow each follower (via FollowButton)
 *   - Remove a follower (DELETE /follow/remove-follower/:id)
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

/* ── Spinner ─────────────────────────────────────────────────── */
const Spinner = () => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:"48px 0" }}>
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      border: "3px solid #EEF0FD",
      borderTop: "3px solid #2F3EDB",
      animation: "fm-spin .7s linear infinite",
    }} />
    <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, color:"#9CA3AF" }}>
      Loading followers…
    </p>
  </div>
);

/* ── Empty state ─────────────────────────────────────────────── */
const Empty = ({ text, sub }) => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"48px 0", textAlign:"center" }}>
    <div style={{
      width:56, height:56, borderRadius:18,
      background:"linear-gradient(135deg,#EEF0FD,#F5F3FF)",
      border:"1px solid #E5E7F6",
      display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14,
    }}>
      <Users size={22} color="#9CA3AF" />
    </div>
    <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, fontWeight:700, color:"#374151", marginBottom:4 }}>{text}</p>
    <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, color:"#9CA3AF", lineHeight:1.5 }}>{sub}</p>
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

  useEffect(() => {
    mountedRef.current = true;
    if (!userId) return;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/profile/get-followers/${userId}`);
        let list = res.data.followers || [];

        if (user?.id) {
          list = list.filter(
            (item) => String(item.userId || item._id) !== String(user.id)
          );
        }

        if (!mountedRef.current) return;
        setFollowers(list);
        onFollowersCountUpdate?.(list.length);
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
  }, [userId]);

  const handleRemove = async (followerId) => {
    setRemovingId(followerId);
    setRemoveError(null);
    try {
      const res = await api.delete(`/follow/remove-follower/${followerId}`);
      if (res.status === 200 && mountedRef.current) {
        const updated = followers.filter((f) => (f.userId || f._id) !== followerId);
        setFollowers(updated);
        onFollowersUpdate?.();
        onFollowersCountUpdate?.(updated.length);
      }
    } catch (err) {
      if (mountedRef.current) {
        setRemoveError(err.response?.data?.message || "Failed to remove follower");
        setTimeout(() => mountedRef.current && setRemoveError(null), 3000);
      }
    } finally {
      if (mountedRef.current) setRemovingId(null);
    }
  };

  const handleFollowStatusChange = (targetUserId, status) => {
    setFollowers((current) =>
      current.map((item) => {
        const id = String(item.userId || item._id);
        if (id !== String(targetUserId)) return item;
        return { ...item, isFollowing: status === "followed" };
      })
    );
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const filteredFollowers = followers.filter((follower) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [
      follower.username,
      follower.name,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  return (
    <>
      <style>{`
        @keyframes fm-spin  { to { transform: rotate(360deg); } }
        @keyframes fm-slide { from { opacity:0; transform:translateY(16px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        .fm-scroll::-webkit-scrollbar { width:3px; }
        .fm-scroll::-webkit-scrollbar-thumb { background:rgba(47,62,219,.14); border-radius:8px; }
        .fm-card-divider > div + div { border-top: 1px solid #F9FAFB; }

        /* Mobile adjustments */
        @media (max-width: 480px) {
          .fm-modal-shell { width:100% !important; max-width:100% !important; border-radius:16px !important; padding:8px !important; margin:8px; }
          .fm-modal-inner { border-radius:14px !important; }
          .fm-scroll { max-height: calc(100vh - 140px) !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleBackdrop}
        style={{
          position:"fixed", inset:0, zIndex:50,
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:16,
          background:"rgba(15,23,42,0.45)",
          backdropFilter:"blur(6px)",
          WebkitBackdropFilter:"blur(6px)",
        }}
      >
        {/* Modal shell — gradient border trick */}
        <div className="fm-modal-shell" style={{
          width:"100%", maxWidth:480,
          borderRadius:28,
          padding:1.5,
          background:"linear-gradient(135deg,#2F3EDB,#5160F5,#FF7A3D)",
          boxShadow:"0 24px 64px rgba(0,0,0,0.22)",
          animation:"fm-slide .24s cubic-bezier(.22,1,.36,1) both",
        }}>
          <div className="fm-modal-inner" style={{ borderRadius:27, background:"#fff", overflow:"hidden" }}>

            {/* Header */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"18px 22px 16px",
              borderBottom:"1px solid #F3F4F6",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{
                  width:42, height:42, borderRadius:14,
                  background:"linear-gradient(135deg,#2F3EDB,#4F5EF0)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow:"0 4px 14px rgba(47,62,219,0.28)",
                }}>
                  <Users size={18} color="white" />
                </div>
                <div>
                  <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:17, fontWeight:800, color:"#111827", margin:0 }}>
                    Followers
                  </h2>
                  {!loading && (
                    <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11.5, color:"#9CA3AF", marginTop:1 }}>
                      {followers.length} {followers.length === 1 ? "person" : "people"}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                style={{
                  width:34, height:34, borderRadius:"50%", border:"none",
                  background:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center",
                  cursor:"pointer", transition:"background .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background="#E5E7EB"}
                onMouseLeave={e => e.currentTarget.style.background="#F3F4F6"}
                aria-label="Close"
              >
                <X size={16} color="#6B7280" />
              </button>
            </div>

            {/* Remove error banner */}
            {removeError && (
              <div style={{
                margin:"10px 22px 0",
                padding:"9px 14px", borderRadius:12,
                background:"#FEF2F2", border:"1px solid #FECACA",
                fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12.5, color:"#EF4444",
              }}>
                {removeError}
              </div>
            )}

            {/* Search */}
            <div style={{ margin: "16px 22px 0" }}>
              <label htmlFor="follower-search" style={{ display: "none" }}>Search followers</label>
              <div style={{ position: "relative" }}>
                <Search size={16} color="#9CA3AF" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="follower-search"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search"
                  style={{
                    width: "100%",
                    borderRadius: 9999,
                    border: "1px solid #E5E7EB",
                    background: "#F8FAFF",
                    color: "#111827",
                    padding: "12px 14px 12px 40px",
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* List */}
            <div className="fm-scroll" style={{ maxHeight:"54vh", overflowY:"auto", padding:"12px 22px 8px" }}>
              {loading ? (
                <Spinner />
              ) : error ? (
                <div style={{
                  padding:"12px 16px", borderRadius:14, margin:"8px 0",
                  background:"#FEF2F2", border:"1px solid #FECACA",
                  fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, color:"#EF4444",
                }}>
                  {error}
                </div>
              ) : followers.length === 0 ? (
                <Empty text="No followers yet" sub="When someone follows you, they'll appear here." />
              ) : (
                <div className="fm-card-divider">
                  {filteredFollowers.map((follower, i) => {
                    const followerId = follower.userId || follower._id;
                    const isOwnProfile = String(user?.id) === String(userId);
                    return (
                      <UserListCard
                        key={followerId}
                        user={follower}
                        onUserClick={onClose}
                        animationDelay={i * 0.04}
                        actionNode={
                          <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
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
                                style={{
                                  minWidth: 80,
                                  padding: "8px 12px",
                                  borderRadius: 9999,
                                  border: "1px solid #E5E7EB",
                                  background: "#F8FAFF",
                                  color: "#111827",
                                  fontSize: 13,
                                  fontWeight: 700,
                                  cursor: removingId === followerId ? "not-allowed" : "pointer",
                                  opacity: removingId === followerId ? 0.6 : 1,
                                  transition: "background .15s, transform .15s, opacity .15s",
                                }}
                                onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#EFF6FF"; }}
                                onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#F8FAFF"; }}
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
              <div style={{
                padding:"12px 22px",
                borderTop:"1px solid #F9FAFB",
                display:"flex", justifyContent:"flex-end",
              }}>
                <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11.5, color:"#9CA3AF" }}>
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
               