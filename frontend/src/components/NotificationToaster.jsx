import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  UserPlus,
  AtSign,
  Clock2,
  ArrowUpRight,
} from "lucide-react";
import api from "../services/api.js";
import FollowButton from "./FollowButton.jsx";

const NOTIFICATION_TYPES = {
  post: {
    label: "liked your post",
    icon: Heart,
    iconColor: "text-rose-500",
    hue: "from-rose-400 to-pink-500",
  },
  comment: {
    label: "commented on your post",
    icon: MessageCircle,
    iconColor: "text-sky-500",
    hue: "from-sky-400 to-indigo-500",
  },
  follow: {
    label: "started following you",
    icon: UserPlus,
    iconColor: "text-violet-500",
    hue: "from-violet-400 to-fuchsia-500",
  },
  mention: {
    label: "mentioned you",
    icon: AtSign,
    iconColor: "text-emerald-500",
    hue: "from-emerald-400 to-teal-500",
  },
};

const formatActorName = (notification) => {
  const actors = notification.actorDetails || notification.actors || [];
  if (!actors.length) return "Someone";
  if (actors.length === 1) return actors[0].username;
  if (actors.length === 2)
    return `${actors[0].username} & ${actors[1].username}`;
  return `${actors[0].username} +${actors.length - 1} others`;
};

const getAvatar = (notification) => {
  const actors = notification.actorDetails || notification.actors || [];
  const actor = actors[0];
  const username = actor?.username || "User";
  const picture = actor?.profilePicture?.profileView || actor?.profilePicture;
  return (
    picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=2F3EDB&color=fff&size=128`
  );
};

const getNotificationUrl = (notification) => {
  const actors = notification.actorDetails || notification.actors || [];
  if (notification.notificationType === "follow") {
    return `/profile/${actors[0]?._id || ""}`;
  }

  const targetId = notification.targetEntityId?._id || notification.targetEntityId;
  if (targetId) {
    return `/post/${targetId}`;
  }

  return "/notifications";
};

const formatTimestamp = (iso) => {
  const date = new Date(iso);
  const now = Date.now();
  const seconds = Math.floor((now - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const playNotificationSound = () => {
  if (!document.hidden) return;
  if (typeof window === "undefined") return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const audioCtx = new AudioContext();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gainNode.gain.value = 0.03;

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.16);
};

const NotificationToastCard = ({ notification, isNew, onClick }) => {
  const navigate = useNavigate();
  const typeMeta = NOTIFICATION_TYPES[notification.notificationType] || NOTIFICATION_TYPES.post;
  const actors = notification.actorDetails || notification.actors || [];
  const ActorName = formatActorName(notification) || "Someone";
  const Icon = typeMeta.icon;
  const avatar = getAvatar(notification);

  const actorId = actors[0]?._id;
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchFollow = async () => {
      if (!actorId) return;
      try {
        const res = await api.get(`/profile/get-profile/${actorId}`);
        if (!mounted) return;
        setIsFollowing(Boolean(res.data.following));
      } catch (err) {
        // ignore
      }
    };
    fetchFollow();
    return () => {
      mounted = false;
    };
  }, [actorId]);

  const handleActorClick = (e) => {
    e.stopPropagation();
    if (!actorId) return;
    navigate(`/profile/${actorId}`);
  };

  const handleFollowStatusChange = (status) => {
    // status === 'followed' or 'unfollowed'
    setIsFollowing(status === "followed");
    // emit a global event so other parts of app (Profile page) can update counts optimistically
    window.dispatchEvent(new CustomEvent("momentia:follow-changed", {
      detail: { targetId: actorId, status }
    }));
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 120 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 120 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      onClick={() => onClick(notification)}
      className="group flex w-full max-w-[420px] cursor-pointer flex-col gap-3 overflow-hidden rounded-[28px] border border-white/30 bg-white/85 p-4 shadow-[0_32px_120px_rgba(15,23,42,0.18)] backdrop-blur-xl transition duration-300 hover:scale-[1.01] hover:bg-slate-100/95 focus:outline-none dark:border-slate-700/60 dark:bg-slate-900/90 dark:hover:bg-slate-800/95"
    >
      <div className="flex items-start gap-3">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 p-[2px] shadow-[0_0_24px_rgba(79,70,229,0.18)] dark:from-slate-700 dark:to-slate-900">
          <div className="absolute inset-0 rounded-full border border-white/60 blur-sm" />
          <img
            src={avatar}
            alt={ActorName}
            className="relative h-full w-full rounded-full object-cover cursor-pointer"
            onClick={(e) => { e.stopPropagation(); handleActorClick(e); }}
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ActorName)}&background=2F3EDB&color=fff&size=128`;
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span onClick={(e) => { e.stopPropagation(); handleActorClick(e); }} role="button" tabIndex={0} className="truncate text-left cursor-pointer text-sm font-semibold text-slate-950 dark:text-white">
              {ActorName}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {typeMeta.label}
            </span>
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {notification.notificationType === "comment"
              ? notification.commentDetails?.content || "Commented on your post"
              : `@${actors[0]?.username || "someone"} ${typeMeta.label}`}
          </p>
        </div>
        <div className="ml-2 flex items-start">
          {actorId && (
            <FollowButton
              userId={actorId}
              initialFollowing={isFollowing ?? null}
              onFollowStatusChange={handleFollowStatusChange}
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className={`flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-100 text-sm ${typeMeta.iconColor} dark:bg-slate-800`}>
            <Icon size={16} />
          </span>
          <span className="flex items-center gap-1">
            <Clock2 size={12} />
            {formatTimestamp(notification.updatedAt)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isNew && (
            <span className="rounded-full bg-rose-500 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-rose-500/20 animate-pulse">
              NEW
            </span>
          )}
          <ArrowUpRight size={14} className="text-slate-400 dark:text-slate-300" />
        </div>
      </div>
    </motion.div>
  );
};

const NotificationToaster = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newBadgeIds, setNewBadgeIds] = useState(new Set());
  const seenIds = useRef(new Set());
  const titleRef = useRef(document.title);

  const markAsRead = async (notification) => {
    if (notification.isRead) return;
    try {
      await api.put("/notifications/mark-as-read", {
        seenNotifications: [notification._id],
      });
    } catch (err) {
      console.warn("Could not mark notification read", err);
    }
    setNotifications((prev) =>
      prev.map((item) =>
        item._id === notification._id ? { ...item, isRead: true } : item
      )
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    setNewBadgeIds((prev) => {
      const next = new Set(prev);
      next.delete(notification._id);
      return next;
    });
  };

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification);
    const url = getNotificationUrl(notification);
    navigate(url);
    toast.dismiss(notification._id);
  };

  const showToast = (notification) => {
    toast.custom(
      (t) => (
        <NotificationToastCard
          notification={notification}
          isNew={!notification.isRead}
          onClick={handleNotificationClick}
        />
      ),
      {
        id: notification._id,
        duration: 4000,
        position: "top-right",
      }
    );
  };

  useEffect(() => {
    const updateTitle = () => {
      if (unreadCount > 0) {
        document.title = `(${unreadCount}) Notifications`;
      } else {
        document.title = titleRef.current;
      }
    };
    updateTitle();
  }, [unreadCount]);

  useEffect(() => {
    titleRef.current = document.title;
  }, []);

  useEffect(() => {
    let socketHandler;
    const eventNames = ["notification-post-liked", "user-followed"];

    const attachSocket = () => {
      const socket = window.__socket;
      if (!socket) return;

      socketHandler = (payload) => {
        if (!payload || !payload._id) return;
        if (seenIds.current.has(payload._id)) return;

        seenIds.current.add(payload._id);
        setNotifications((prev) => [payload, ...prev]);

        if (!payload.isRead) {
          setUnreadCount((count) => count + 1);
        }

        setNewBadgeIds((prev) => {
          const next = new Set(prev);
          next.add(payload._id);
          return next;
        });

        playNotificationSound();
        showToast(payload);

        setTimeout(() => {
          setNewBadgeIds((prev) => {
            const next = new Set(prev);
            next.delete(payload._id);
            return next;
          });
        }, 7000);
      };

      eventNames.forEach((eventName) => socket.on(eventName, socketHandler));
    };

    attachSocket();

    const onSocketReady = () => {
      if (socketHandler) {
        eventNames.forEach((eventName) =>
          window.__socket?.off(eventName, socketHandler)
        );
      }
      attachSocket();
    };

    window.addEventListener("socket-ready", onSocketReady);
    return () => {
      window.removeEventListener("socket-ready", onSocketReady);
      if (window.__socket && socketHandler) {
        eventNames.forEach((eventName) =>
          window.__socket.off(eventName, socketHandler)
        );
      }
    };
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "transparent",
            boxShadow: "none",
          },
        }}
      />
      <div className="pointer-events-none fixed top-4 right-4 z-[9999] hidden md:block" />
    </>
  );
};

export default NotificationToaster;
