import { useState, useEffect, useRef } from "react";
import api from "../services/api.js";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

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

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const FollowButton = ({
  userId,
  initialFollowing = null,
  onFollowStatusChange,
  size = "md",
  className = "",
  unstyled = false,
}) => {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(initialFollowing === null);
  const [hovered, setHovered] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (initialFollowing !== null) {
      setFollowing(initialFollowing);
      setFetching(false);
      return;
    }

    const fetchStatus = async () => {
      if (!userId) return;
      setFetching(true);
      try {
        const res = await api.get(`/profile/get-profile/${userId}`);
        if (!mountedRef.current) return;
        setFollowing(Boolean(res.data.following));
      } catch (_) {
        if (mountedRef.current) setFollowing(false);
      } finally {
        if (mountedRef.current) setFetching(false);
      }
    };

    fetchStatus();
    return () => {
      mountedRef.current = false;
    };
  }, [userId, initialFollowing]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail.targetId !== userId) return;
      setFollowing(e.detail.status === "followed");
    };
    return onFollowChange(handler);
  }, [userId]);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading || fetching || !userId) return;

    const nextFollowing = !following;
    const status = nextFollowing ? "followed" : "unfollowed";

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
      emitFollowChange(userId, status);
      onFollowStatusChange?.(status);

      toast.success(
        nextFollowing ? "User followed!" : "User unfollowed!",
        {
          duration: 2000,
          position: "bottom-center",
        }
      );
    } catch (err) {
      if (!mountedRef.current) return;
      setFollowing(following);
      const msg = err.response?.data?.message || "Something went wrong";
      setError(msg);

      toast.error(msg, {
        duration: 3000,
        position: "bottom-center",
      });

      setTimeout(() => mountedRef.current && setError(null), 3000);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const isFollowing = following === true;
  const showUnfollow = isFollowing && hovered;

  // Determine button colors:
  // Not following -> GREEN
  // Following -> YELLOW
  // Hovering Following (Unfollow action) -> RED
  let colorStyle;
  if (loading || fetching) {
    colorStyle = "bg-gray-100 text-gray-500 border border-gray-200 cursor-wait";
  } else if (isFollowing) {
    if (showUnfollow) {
      colorStyle = "bg-rose-600 hover:bg-rose-700 text-white shadow-xs";
    } else {
      colorStyle = "bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold shadow-xs";
    }
  } else {
    colorStyle = "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs";
  }

  const paddingStyle = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-xs";

  const label = loading || fetching ? (
    <Loader2 className="animate-spin" size={14} />
  ) : showUnfollow ? (
    "Unfollow"
  ) : isFollowing ? (
    <span className="inline-flex items-center gap-1">
      <CheckIcon />
      Following
    </span>
  ) : (
    <span className="inline-flex items-center gap-1">
      <PlusIcon />
      Follow
    </span>
  );

  return (
    <div onClick={(e) => e.stopPropagation()} className="inline-block">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading || fetching}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={
          unstyled
            ? className
            : `inline-flex items-center justify-center rounded-full font-semibold transition-all duration-150 active:scale-95 ${paddingStyle} ${colorStyle} ${className}`
        }
        title={error || ""}
        aria-label={
          loading || fetching
            ? "Loading…"
            : isFollowing
            ? "Unfollow user"
            : "Follow user"
        }
      >
        {label}
      </button>

      {error && (
        <div className="mt-1 truncate text-xs text-rose-600" title={error}>
          {error}
        </div>
      )}
    </div>
  );
};

export default FollowButton;
