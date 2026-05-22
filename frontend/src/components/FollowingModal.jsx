/**
 * FollowingModal.jsx
 *
 * Shows the list of users that a user follows.
 * Logged-in user can unfollow any of them via FollowButton.
 * When FollowButton reports "unfollowed", the row is removed instantly.
 *
 * Props:
 *   userId                   – whose following list to load
 *   onClose()                – close handler
 *   onFollowingUpdate()      – called after unfollow (parent count refresh)
 *   onFollowingCountUpdate(n) – passes the new list length up
 *
 * APIs:
 *   GET    /profile/get-following/:userId  → { following: UserListItem[] }
 *   DELETE /follow/unfollow-user/:id       (delegated to FollowButton)
 *
 * UserListItem shape: { userId, username, name, profilePicture, isFollowing? }
 */

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { X, UserCheck } from "lucide-react";
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
      animation: "fgm-spin .7s linear infinite",
    }} />
    <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, color:"#9CA3AF" }}>
      Loading following…
    </p>
  </div>
);

/* ── Empty state ─────────────────────────────────────────────── */
const Empty = ({ text, sub }) => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"48px 0", textAlign:"center" }}>
    <div style={{
      width:56, height:56, borderRadius:18,
      background:"linear-gradient(135deg,#EEF0FD,#F0FDF4)",
      border:"1px solid #E5E7F6",
      display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14,
    }}>
      <UserCheck size={22} color="#9CA3AF" />
    </div>
    <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, fontWeight:700, color:"#374151", marginBottom:4 }}>{text}</p>
    <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, color:"#9CA3AF", lineHeight:1.5 }}>{sub}</p>
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
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const mountedRef = useRef(true);

  /* ── Fetch ── */
  useEffect(() => {
    mountedRef.current = true;
    if (!userId) return;

    const fetch = async () => {
      setLoading(true); setError(null);
      try {
        const res  = await api.get(`/profile/get-following/${userId}`);
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
    return () => { mountedRef.current = false; };
  }, [userId]);

  /* ── Handle unfollow from FollowButton ── */
  const handleFollowStatusChange = (targetUserId, status) => {
    if (status === "unfollowed" && mountedRef.current) {
      const updated = following.filter(u => u.userId !== targetUserId);
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
    <>
      <style>{`
        @keyframes fgm-spin  { to { transform: rotate(360deg); } }
        @keyframes fgm-slide { from { opacity:0; transform:translateY(16px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        .fgm-scroll::-webkit-scrollbar { width:3px; }
        .fgm-scroll::-webkit-scrollbar-thumb { background:rgba(47,62,219,.14); border-radius:8px; }
        .fgm-divider > div + div { border-top: 1px solid #F9FAFB; }
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
        {/* Modal shell — gradient border */}
        <div style={{
          width:"100%", maxWidth:480,
          borderRadius:28,
          padding:1.5,
          background:"linear-gradient(135deg,#2F3EDB,#5160F5,#FF7A3D)",
          boxShadow:"0 24px 64px rgba(0,0,0,0.22)",
          animation:"fgm-slide .24s cubic-bezier(.22,1,.36,1) both",
        }}>
          <div style={{ borderRadius:27, background:"#fff", overflow:"hidden" }}>

            {/* ── Header ── */}
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
                  <UserCheck size={18} color="white" />
                </div>
                <div>
                  <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:17, fontWeight:800, color:"#111827", margin:0 }}>
                    Following
                  </h2>
                  {!loading && (
                    <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11.5, color:"#9CA3AF", marginTop:1 }}>
                      {following.length} {following.length === 1 ? "user" : "users"}
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

            {/* ── List ── */}
            <div className="fgm-scroll" style={{ maxHeight:"58vh", overflowY:"auto", padding:"8px 22px 4px" }}>
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
              ) : following.length === 0 ? (
                <Empty text="Not following anyone" sub="Find and follow creators to see their content." />
              ) : (
                <div className="fgm-divider">
                  {following.map((user, i) => (
                    <UserListCard
                      key={user.userId}
                      user={user}
                      onUserClick={onClose}
                      animationDelay={i * 0.04}
                      actionNode={
                        <FollowButton
                          userId={user.userId}
                          /*
                           * Each user in the "following" list is, by definition,
                           * already followed by the logged-in user.
                           * We pass true so FollowButton skips the extra GET call.
                           */
                          initialFollowing={true}
                          size="sm"
                          onFollowStatusChange={(status) =>
                            handleFollowStatusChange(user.userId, status)
                          }
                        />
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            {!loading && following.length > 0 && (
              <div style={{
                padding:"12px 22px",
                borderTop:"1px solid #F9FAFB",
                display:"flex", justifyContent:"flex-end",
              }}>
                <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11.5, color:"#9CA3AF" }}>
                  Following {following.length} {following.length === 1 ? "user" : "users"}
                </span>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default FollowingModal;