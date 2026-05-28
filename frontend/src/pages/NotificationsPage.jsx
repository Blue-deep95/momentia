import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

/* ════════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════════ */

const timeAgo = (iso) => {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 5) return "just now";
  if (s < 60) return `${Math.floor(s)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;

  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const bucketDate = (iso) => {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = (today - d) / 86400000;

  if (diff < 1) return "Today";
  if (diff < 2) return "Yesterday";
  if (diff < 8) return "This week";

  return "Earlier";
};

const BUCKET_ORDER = ["Today", "Yesterday", "This week", "Earlier"];

const groupNotifs = (list) => {
  const map = {};

  list.forEach((n) => {
    const b = bucketDate(n.updatedAt);

    if (!map[b]) map[b] = [];

    map[b].push(n);
  });

  return BUCKET_ORDER.filter((b) => map[b]).map((b) => ({
    label: b,
    items: map[b],
  }));
};

const actorName = (actors = []) => {
  if (!actors.length) return "Someone";

  if (actors.length === 1) return actors[0].username;

  if (actors.length === 2)
    return `${actors[0].username} & ${actors[1].username}`;

  return `${actors[0].username} +${actors.length - 1} others`;
};

const buildAction = (n) => {
  const commentSnippet = n.commentDetails?.content?.slice(0, 50);
  const postSnippet = n.postDetails?.caption?.slice(0, 70);

  switch (n.notificationType) {
    case "post":
      return {
        sentence: `liked your post${postSnippet ? `: "${postSnippet}"` : ""}`,
        icon: "❤️",
      };

    case "comment":
      return {
        sentence:
          n.notificationSubType === "reply"
            ? `replied to your comment${commentSnippet ? `: "${commentSnippet}"` : ""}`
            : `commented on your post${commentSnippet ? `: "${commentSnippet}"` : ""}`,
        icon: "💬",
      };

    case "follow":
      return {
        sentence: `started following you`,
        icon: "👤",
      };

    case "mention":
      return {
        sentence: `mentioned you`,
        icon: "@",
      };

    default:
      return {
        sentence: `interacted with your content`,
        icon: "❤️",
      };
  }
};

const getThumb = (n) =>
  n.postDetails?.thumbImage ||
  n.commentDetails?.postInfo?.thumbImage ||
  null;

const getAvatar = (actors = []) =>
  actors[0]?.profilePicture?.commentView ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    actors[0]?.username || "U"
  )}&background=random&color=fff`;

/* ════════════════════════════════════════════════════════════════
   TABS
════════════════════════════════════════════════════════════════ */

const TABS = [
  { label: "All", type: null },
  { label: "Likes", type: "post" },
  { label: "Comments", type: "comment" },
  { label: "Follows", type: "follow" },
  { label: "Mentions", type: "mention" },
];

/* ════════════════════════════════════════════════════════════════
   NOTIFICATION CARD
════════════════════════════════════════════════════════════════ */

const NotifCard = ({ n, onRead, isNew }) => {
  const navigate = useNavigate();
  const { sentence, icon } = buildAction(n);

  const thumb = getThumb(n);

  const actors = n.actorDetails || n.actors || [];
  const avatar = getAvatar(actors);
  const name = actorName(actors);
  const actorId = actors[0]?._id;
  const profilePath = actorId ? `/profile/${actorId}` : null;

  const unread = !n.isRead;

  const [followed, setFollowed] = useState(false);

  return (
    <div
      onClick={() => unread && onRead(n._id)}
      className={`group relative flex items-center gap-3 rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer
      ${
        unread
          ? "bg-indigo-50 border-indigo-100"
          : "bg-white border-gray-100"
      }`}
    >
      {/* NEW */}
      {isNew && (
        <span className="absolute top-2 right-3 bg-rose-500 text-white text-[10px] px-2 py-1 rounded-full font-bold animate-pulse">
          NEW
        </span>
      )}

      {/* LEFT BAR */}
      {unread && (
        <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-pink-500" />
      )}

      {/* AVATAR */}
      <div className="relative shrink-0">
        <img
          src={avatar}
          alt={name}
          onClick={(e) => {
            e.stopPropagation();
            if (profilePath) navigate(profilePath);
          }}
          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow cursor-pointer"
        />

        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center text-[10px]">
          {icon}
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 leading-5">
          <span
            className={`font-bold ${profilePath ? "cursor-pointer text-indigo-600 hover:underline" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (profilePath) navigate(profilePath);
            }}
          >
            {name}
          </span>{" "}
          <span className="text-gray-600">{sentence}</span>
        </p>

        <span
          className={`text-xs mt-1 inline-block ${
            unread ? "text-indigo-600 font-semibold" : "text-gray-400"
          }`}
        >
          {timeAgo(n.updatedAt)}
        </span>
      </div>

      {/* FOLLOW BUTTON */}
      {n.notificationType === "follow" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFollowed(!followed);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all
          ${
            followed
              ? "bg-gray-100 text-gray-500"
              : "bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg"
          }`}
        >
          {followed ? "Following" : "Follow"}
        </button>
      )}

      {/* THUMB */}
      {thumb && n.notificationType !== "follow" && (
        <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 shrink-0">
          <img
            src={thumb}
            alt="post"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState([]);
  const [newIds, setNewIds] = useState(new Set());

  const [page, setPage] = useState(1);

  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(true);

  const [loadingMore, setLoadingMore] = useState(false);

  const [tab, setTab] = useState("All");

  const [markingAll, setMarkingAll] = useState(false);

  const markedRef = useRef(new Set());

  /* FETCH */
  const fetchPage = useCallback(async (pg, replace = false) => {
    try {
      replace ? setLoading(true) : setLoadingMore(true);

      const res = await api.get(
        `/notifications/get-notifications/${pg}`
      );

      const data = res.data.notifications || [];

      setNotifs((prev) => (replace ? data : [...prev, ...data]));

      setHasMore(data.length === 20);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  /* INITIAL */
  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  /* SOCKET */
  useEffect(() => {
    let socketHandler;
    const eventNames = ["notification-post-liked", "user-followed", "comment-reply"];

    const attachSocket = () => {
      const socket = window.__socket;
      if (!socket) return;

      socketHandler = (newNotif) => {
        setNotifs((prev) => [newNotif, ...prev]);
        setNewIds((prev) => new Set([...prev, newNotif._id]));

        setTimeout(() => {
          setNewIds((prev) => {
            const s = new Set(prev);
            s.delete(newNotif._id);
            return s;
          });
        }, 8000);
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

  /* MARK ALL */
  const handleMarkAll = async () => {
    const ids = notifs.filter((n) => !n.isRead).map((n) => n._id);

    if (!ids.length) return;

    setMarkingAll(true);

    try {
      await api.put("/notifications/mark-as-read", {
        seenNotifications: ids,
      });

      setNotifs((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
        }))
      );
    } catch (err) {
      console.log(err);
    } finally {
      setMarkingAll(false);
    }
  };

  /* MARK ONE */
  const handleReadOne = async (id) => {
    setNotifs((prev) =>
      prev.map((n) =>
        n._id === id
          ? {
              ...n,
              isRead: true,
            }
          : n
      )
    );

    if (!markedRef.current.has(id)) {
      markedRef.current.add(id);

      try {
        await api.put("/notifications/mark-as-read", {
          seenNotifications: [id],
        });
      } catch (err) {
        console.log(err);
      }
    }
  };

  /* LOAD MORE */
  const handleLoadMore = () => {
    const next = page + 1;

    setPage(next);

    fetchPage(next, false);
  };

  /* FILTER */
  const activeType = TABS.find((t) => t.label === tab)?.type;

  const filtered = activeType
    ? notifs.filter((n) => n.notificationType === activeType)
    : notifs;

  const groups = groupNotifs(filtered);

  const unreadCt = notifs.filter((n) => !n.isRead).length;

  const tabCount = (type) =>
    type
      ? notifs.filter(
          (n) => !n.isRead && n.notificationType === type
        ).length
      : unreadCt;

  return (
    <div className="min-h-screen bg-[#f5f7ff]">

      {/* HEADER */}
      <div className="sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="bg-linear-to-r relative overflow-hidden rounded-[28px] from-[#2F3EDB] via-[#5160F5] to-[#FF7A3D] p-px shadow-2xl">
            <div className="rounded-[28px] bg-white/95 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#2F3EDB] to-[#5160F5] flex items-center justify-center text-white text-xl shadow-lg">
                      🔔
                    </div>
                    {unreadCt > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCt > 99 ? "99+" : unreadCt}
                      </span>
                    )}
                  </div>

                  <div>
                    <h1 className="text-2xl font-black text-[#111827]">Notifications</h1>
                    <p className="text-xs text-[#6B7280]">{unreadCt > 0 ? `${unreadCt} new notifications` : "You're all caught up"}</p>
                  </div>
                </div>

                {unreadCt > 0 && (
                  <button
                    onClick={handleMarkAll}
                    disabled={markingAll}
                    className="px-4 py-2 rounded-2xl bg-white/60 text-[#2F3EDB] text-sm font-semibold shadow-md hover:scale-105 transition"
                  >
                    {markingAll ? "Loading..." : "Mark all"}
                  </button>
                )}
              </div>

              <div className="sticky top-4 z-30 mt-2 rounded-3xl border border-white bg-white/70 px-2 shadow-lg backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {TABS.map(({ label, type }) => {
                    const active = tab === label;
                    const cnt = tabCount(type);
                    return (
                      <button
                        key={label}
                        onClick={() => setTab(label)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${
                          active
                            ? "bg-linear-to-r from-[#2F3EDB] to-[#5160F5] text-white shadow-lg"
                            : "text-[#6B7280] hover:text-[#111827]"
                        }`}
                      >
                        {label}
                        {cnt > 0 && (
                          <span className={`min-w-[18px] h-[18px] ml-1 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${active ? "bg-white text-[#2F3EDB]" : "bg-rose-500 text-white"}`}>
                            {cnt > 9 ? "9+" : cnt}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* LOADING */}
        {loading ? (
          <div className="space-y-4">

            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-2xl p-4 border border-gray-100 flex gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-gray-200" />

                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2" />

                  <div className="h-2 bg-gray-100 rounded w-1/4" />
                </div>

                <div className="w-12 h-12 rounded-xl bg-gray-200" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">

            <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-indigo-100 to-pink-100 flex items-center justify-center text-4xl mb-6">
              🔔
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-2">
              No Notifications
            </h2>

            <p className="text-sm text-gray-400 max-w-xs">
              Activity from your followers will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">

            {groups.map(({ label, items }) => (
              <div key={label}>

                {/* SECTION */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {label}
                  </span>

                  <div className="flex-1 h-px bg-gradient-to-r from-indigo-100 to-transparent" />
                </div>

                {/* CARDS */}
                <div className="space-y-3">

                  {items.map((n) => (
                    <NotifCard
                      key={n._id}
                      n={n}
                      onRead={handleReadOne}
                      isNew={newIds.has(n._id)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* LOAD MORE */}
            <div className="flex justify-center pt-4">

              {hasMore ? (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold shadow-xl hover:-translate-y-1 transition-all"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              ) : (
                <p className="text-sm text-gray-400">
                  All caught up ✓
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}