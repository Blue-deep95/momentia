/**
 * FollowButton.jsx
 *
 * Instagram-style follow/unfollow button.
 *
 * Props:
 *   userId            – target user's ID
 *   initialFollowing  – boolean | null  (null = auto-fetch from API)
 *   onFollowStatusChange(status: "followed"|"unfollowed") – optional callback
 *   size              – "sm" | "md" (default "md")
 *   variant           – "default" | "outline" | "minimal"
 *
 * Global event: "momentia:follow-changed" → { targetId, status }
 * Any component can listen to this to react without prop drilling.
 *
 * APIs used:
 *   GET  /profile/get-profile/:userId   → { following: boolean }
 *   POST /follow/follow-user            → { targetId }
 *   DELETE /follow/unfollow-user/:id
 */

import { useState, useEffect, useRef } from "react";
import api from "../services/api.js";

/* ── Global event helpers ─────────────────────────────────────── */
const FOLLOW_EVENT = "momentia:follow-changed";

export const emitFollowChange = (targetId, status) => {
  window.dispatchEvent(
    new CustomEvent(FOLLOW_EVENT, { detail: { targetId, status } })
  );
};

export const onFollowChange = (handler) => {
  window.addEventListener(FOLLOW_EVENT, handler);
  return () => window.removeEventListener(FOLLOW_EVENT, handler);
};

/* ── Spinner ──────────────────────────────────────────────────── */
const Spinner = ({ color = "currentColor" }) => (
  <span
    style={{
      display: "inline-block",
      width: 13,
      height: 13,
      border: `2px solid ${color}44`,
      borderTop: `2px solid ${color}`,
      borderRadius: "50%",
      animation: "fb-spin .6s linear infinite",
      flexShrink: 0,
    }}
  />
);

/* ── Icons ────────────────────────────────────────────────────── */
const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ── FollowButton ─────────────────────────────────────────────── */
const FollowButton = ({
  userId,
  initialFollowing = null,
  onFollowStatusChange,
  size = "md",
  variant = "default",
}) => {
  const [following, setFollowing]   = useState(initialFollowing);
  const [loading, setLoading]       = useState(false);
  const [fetching, setFetching]     = useState(initialFollowing === null);
  const [hovered, setHovered]       = useState(false);
  const [error, setError]           = useState(null);
  const mountedRef                  = useRef(true);

  /* ── 1. Auto-fetch follow status if not provided ── */
  useEffect(() => {
    mountedRef.current = true;

    if (initialFollowing !== null) {
      setFollowing(initialFollowing);
      setFetching(false);
      return;
    }

    const fetchStatus = async () => {
      setFetching(true);
      try {
        const res = await api.get(`/profile/get-profile/${userId}`);
        if (!mountedRef.current) return;
        // backend returns `following: boolean` on profile endpoint
        setFollowing(Boolean(res.data.following));
      } catch (_) {
        if (mountedRef.current) setFollowing(false);
      } finally {
        if (mountedRef.current) setFetching(false);
      }
    };

    fetchStatus();
    return () => { mountedRef.current = false; };
  }, [userId, initialFollowing]);

  /* ── 2. Listen for global follow events from OTHER components ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.detail.targetId !== userId) return;
      setFollowing(e.detail.status === "followed");
    };
    return onFollowChange(handler);
  }, [userId]);

  /* ── 3. Toggle follow/unfollow ── */
  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading || fetching) return;

    const nextFollowing = !following;
    const status        = nextFollowing ? "followed" : "unfollowed";

    // Optimistic UI
    setFollowing(nextFollowing);
    setLoading(true);
    setError(null);

    try {
      if (following) {
        await api.delete(`/follow/unfollow-user/${userId}`);
      } else {
        await api.post(`/follow/follow-user`, { targetId: userId });
      }

      if (!mountedRef.current) return;

      // Emit global event so every FollowButton with same userId syncs
      emitFollowChange(userId, status);

      // Notify parent
      onFollowStatusChange?.(status);

    } catch (err) {
      if (!mountedRef.current) return;

      // Revert optimistic update
      setFollowing(following);
      const msg = err.response?.data?.message || "Something went wrong";
      setError(msg);
      setTimeout(() => mountedRef.current && setError(null), 3000);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  /* ── Sizing ── */
  const sizeMap = {
    sm: { padding: "5px 12px", fontSize: 11, height: 28, gap: 4, minWidth: 72 },
    md: { padding: "7px 18px", fontSize: 13, height: 34, gap: 6, minWidth: 90 },
  };
  const s = sizeMap[size] || sizeMap.md;

  /* ── Visual state ── */
  const isFollowing  = following === true;
  const showUnfollow = isFollowing && hovered; // show "Unfollow" on hover like Instagram

  /* ── Styles ── */
  const btnStyle = (() => {
    if (fetching || loading) return {
      background: "#F3F4F6",
      color: "#9CA3AF",
      border: "1px solid #E5E7EB",
    };

    if (isFollowing) {
      if (showUnfollow) return {
        background: "#FEF2F2",
        color: "#EF4444",
        border: "1px solid #FECACA",
      };
      return {
        background: "#F3F4F6",
        color: "#374151",
        border: "1px solid #E5E7EB",
      };
    }

    // Not following
    if (variant === "outline") return {
      background: "transparent",
      color: "#2F3EDB",
      border: "1.5px solid #2F3EDB",
    };

    return {
      background: "linear-gradient(135deg, #2F3EDB 0%, #4F5EF0 100%)",
      color: "#fff",
      border: "none",
      boxShadow: "0 3px 12px rgba(47,62,219,0.28)",
    };
  })();

  const label = (() => {
    if (fetching)     return <Spinner color={isFollowing ? "#9CA3AF" : "#fff"} />;
    if (loading)      return <Spinner color={isFollowing ? "#9CA3AF" : "#fff"} />;
    if (showUnfollow) return "Unfollow";
    if (isFollowing)  return (
      <span style={{ display:"flex", alignItems:"center", gap: 4 }}>
        <CheckIcon /> Following
      </span>
    );
    return (
      <span style={{ display:"flex", alignItems:"center", gap: 4 }}>
        <PlusIcon /> Follow
      </span>
    );
  })();

  return (
    <div onClick={e => e.stopPropagation()}>
      <style>{`
        @keyframes fb-spin { to { transform: rotate(360deg); } }
        .fb-btn { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; }
        .fb-btn:active:not(:disabled) { transform: scale(0.97) !important; }
      `}</style>

      <button
        className="fb-btn"
        onClick={handleToggle}
        disabled={loading || fetching}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: s.gap,
          padding: s.padding,
          height: s.height,
          minWidth: s.minWidth,
          fontSize: s.fontSize,
          fontWeight: 700,
          borderRadius: 10,
          cursor: loading || fetching ? "not-allowed" : "pointer",
          transition: "all 0.18s ease",
          transform: hovered && !loading && !fetching ? "translateY(-1px)" : "translateY(0)",
          letterSpacing: "0.1px",
          whiteSpace: "nowrap",
          ...btnStyle,
        }}
      >
        {label}
      </button>

      {error && (
        <p style={{
          marginTop: 4, fontSize: 10.5, color: "#EF4444",
          background: "#FEF2F2", padding: "3px 8px", borderRadius: 6,
          border: "1px solid #FECACA", fontFamily: "inherit",
        }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default FollowButton;