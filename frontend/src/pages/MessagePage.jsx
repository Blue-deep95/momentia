import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Send,
  ArrowLeft,
  Info,
  LogOut,
  User,
  Users,
  MessageSquare,
  Loader2,
} from "lucide-react";
import MessageItem from "../components/chat/MessageItem.jsx";
import NewChatModal from "../components/chat/NewChatModal.jsx";

export default function MessagePage() {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const location = useLocation();

  const userId = user?._id
    ? String(user._id)
    : user?.id
    ? String(user.id)
    : null;

  // Rooms & Messaging state
  const [rooms, setRooms] = useState([]);
  const [followingProfiles, setFollowingProfiles] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // Pagination & Loading state
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // UI Modals & Panels
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Refs
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const activeRoomRef = useRef(null);

  // Keep activeRoomRef synchronized for socket callbacks
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // Handle shared profile links from Profile page navigation
  useEffect(() => {
    const shareProfile = location.state?.shareProfile;
    if (shareProfile) {
      setText(shareProfile);
      setShowNewChatModal(true);
      toast.success("Profile link ready in message composer!");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state?.shareProfile]);

  // Initial Data Fetch & Real-time Socket Setup
  useEffect(() => {
    if (!userId) return;

    fetchFollowing();
    fetchRooms();

    let socketHandler = null;

    const attachSocket = () => {
      const socket = window.__socket;
      if (!socket) return;

      socketHandler = (payload) => {
        if (!payload || !payload.roomId) return;
        const currentActive = activeRoomRef.current;
        const payloadRoomId = String(payload.roomId);

        // If message belongs to current active room
        if (currentActive && String(currentActive._id) === payloadRoomId) {
          setMessages((prev) => {
            // Deduplicate incoming socket message
            if (prev.some((m) => String(m._id) === String(payload._id))) return prev;
            return [...prev, payload];
          });
          markRead(currentActive._id, payload.messageNumber);
        }

        // Update Rooms list ordering and unread counts
        setRooms((prev) => {
          const idx = prev.findIndex((r) => String(r._id) === payloadRoomId);
          if (idx === -1) {
            // Refetch rooms if it's a brand new conversation room
            fetchRooms();
            return prev;
          }

          const updatedRooms = [...prev];
          const isCurrentActive = currentActive && String(currentActive._id) === payloadRoomId;

          updatedRooms[idx] = {
            ...updatedRooms[idx],
            lastMessage: { content: payload.content, sender: payload.sender },
            lastMessageAt: Date.now(),
            currentMessageCount: payload.messageNumber || (updatedRooms[idx].currentMessageCount || 0) + 1,
            unreadCount: isCurrentActive
              ? 0
              : (updatedRooms[idx].unreadCount || 0) + 1,
          };

          // Re-sort: move updated room to top
          const [movedRoom] = updatedRooms.splice(idx, 1);
          return [movedRoom, ...updatedRooms];
        });
      };

      socket.on("new-message", socketHandler);
    };

    attachSocket();

    const onSocketReady = () => {
      if (socketHandler && window.__socket) {
        window.__socket.off("new-message", socketHandler);
      }
      attachSocket();
    };

    window.addEventListener("socket-ready", onSocketReady);

    return () => {
      window.removeEventListener("socket-ready", onSocketReady);
      if (window.__socket && socketHandler) {
        window.__socket.off("new-message", socketHandler);
      }
    };
  }, [userId]);

  // Auto-scroll to bottom when new messages arrive in active room
  useEffect(() => {
    if (bottomRef.current && !loadingMessages) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, loadingMessages]);

  // Fetch Following Users for New Chat Modal
  const fetchFollowing = async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/profile/get-following/${userId}`);
      setFollowingProfiles(res.data?.following || []);
    } catch (err) {
      console.error("Error fetching following profiles:", err);
    }
  };

  // Fetch User Rooms
  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await api.get("/message/get-rooms");
      setRooms(res.data?.userRooms || []);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      toast.error("Could not load conversations");
    } finally {
      setLoadingRooms(false);
    }
  };

  // Create Room (DM or Group)
  const handleCreateRoom = async ({ participants, roomType, roomName }) => {
    try {
      const res = await api.post("/message/create-room", {
        participants,
        roomName,
      });

      const room = res.data.room;
      if (room) {
        await fetchRooms();
        await openRoom(room);
        toast.success(res.data.message || "Conversation started");
      }
    } catch (err) {
      console.error("Error creating room:", err);
      toast.error(err.response?.data?.message || "Failed to start chat");
    }
  };

  // Open & Select A Room
  const openRoom = async (room) => {
    setActiveRoom(room);
    setMessages([]);
    setNextCursor(null);
    setHasMore(false);
    setShowInfoDrawer(false);

    await fetchMessages(room._id, null, true);
  };

  // Fetch Messages with Cursor Pagination
  const fetchMessages = async (roomId, cursor = null, replace = false) => {
    try {
      setLoadingMessages(true);
      const params = { limit: 50 };
      if (cursor) params.cursor = cursor;

      const res = await api.get(`/message/get-messages/${roomId}`, { params });
      const arr = res.data?.messageArray || [];

      // Reversal: backend returns newest first, reverse for chronological order
      const ordered = arr.slice().reverse();

      if (replace) {
        setMessages(ordered);
      } else {
        // Retain scroll position when prepending older messages
        const container = scrollContainerRef.current;
        const previousScrollHeight = container ? container.scrollHeight : 0;

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => String(m._id)));
          const filteredNew = ordered.filter((m) => !existingIds.has(String(m._id)));
          return [...filteredNew, ...prev];
        });

        // Restore scroll offset after DOM update
        setTimeout(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - previousScrollHeight;
          }
        }, 50);
      }

      setNextCursor(res.data?.nextCursor || null);
      setHasMore(res.data?.hasMore || false);

      // Automatically mark room read if latest messages loaded
      if (replace && ordered.length > 0) {
        const lastMsg = ordered[ordered.length - 1];
        await markRead(roomId, lastMsg.messageNumber);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      toast.error("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  // Load More Older Messages
  const handleLoadMore = () => {
    if (!activeRoom || !hasMore || loadingMessages) return;
    const firstMsg = messages[0];
    const cursor = firstMsg ? firstMsg.messageNumber : null;
    fetchMessages(activeRoom._id, cursor, false);
  };

  // Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!text.trim() || !activeRoom || sending) return;

    const messageContent = text.trim();
    setText("");
    setSending(true);

    try {
      const res = await api.post("/message/send-message", {
        roomId: activeRoom._id,
        content: messageContent,
      });

      const newMsg = res.data.message;
      if (newMsg) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(newMsg._id))) return prev;
          return [...prev, newMsg];
        });

        // Update Rooms list ordering
        setRooms((prev) => {
          const idx = prev.findIndex((r) => String(r._id) === String(activeRoom._id));
          if (idx === -1) return prev;

          const copy = [...prev];
          copy[idx] = {
            ...copy[idx],
            lastMessage: { content: newMsg.content, sender: newMsg.sender },
            lastMessageAt: Date.now(),
            currentMessageCount: newMsg.messageNumber,
            unreadCount: 0,
          };

          const [moved] = copy.splice(idx, 1);
          return [moved, ...copy];
        });

        await markRead(activeRoom._id, newMsg.messageNumber);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message");
      setText(messageContent); // Restore text on error
    } finally {
      setSending(false);
    }
  };

  // Edit Message
  const handleEditMessage = async (messageId, newContent) => {
    try {
      const res = await api.put(`/message/edit-message/${messageId}`, {
        content: newContent,
      });

      const updated = res.data?.updatedMessage;
      if (updated) {
        setMessages((prev) =>
          prev.map((m) => (String(m._id) === String(messageId) ? updated : m))
        );
        toast.success("Message edited");
      }
    } catch (err) {
      console.error("Error editing message:", err);
      toast.error("Could not edit message");
    }
  };

  // Delete Message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    try {
      const res = await api.delete(`/message/delete-message/${messageId}`);
      const deleted = res.data?.deletedMessage;

      if (deleted) {
        setMessages((prev) =>
          prev.map((m) =>
            String(m._id) === String(messageId) ? { ...m, isDeleted: true, content: "This message was deleted" } : m
          )
        );
        toast.success("Message deleted");
      }
    } catch (err) {
      console.error("Error deleting message:", err);
      toast.error("Could not delete message");
    }
  };

  // Mark Room Read
  const markRead = async (roomId, latestMessageNumber) => {
    try {
      await api.put("/message/mark-message-read", {
        roomId,
        latestMessageNumber,
      });
      setRooms((prev) =>
        prev.map((r) =>
          String(r._id) === String(roomId) ? { ...r, unreadCount: 0 } : r
        )
      );
    } catch (err) {
      // non-fatal
    }
  };

  // Leave Group Room
  const handleLeaveGroup = async () => {
    if (!activeRoom || activeRoom.roomType === "dm") return;
    if (!window.confirm(`Are you sure you want to leave ${activeRoom.roomName}?`)) return;

    try {
      await api.put("/message/leave-room", { roomId: activeRoom._id });
      toast.success("Left group successfully");
      setActiveRoom(null);
      fetchRooms();
    } catch (err) {
      console.error("Error leaving room:", err);
      toast.error(err.response?.data?.message || "Could not leave group");
    }
  };

  // Filter Rooms
  const filteredRooms = rooms.filter((r) => {
    const title =
      r.roomType === "dm"
        ? r.dmUserInfo?.username || r.dmUserInfo?.name || "Direct Message"
        : r.roomName || "Group Chat";
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-100 font-sans text-gray-900 md:pl-16 lg:pl-64">
      {/* NEW CHAT MODAL */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        followingProfiles={followingProfiles}
        onCreateRoom={handleCreateRoom}
      />

      {/* LEFT PANEL: ROOMS LIST */}
      <div
        className={`${
          activeRoom ? "hidden md:flex" : "flex"
        } w-full md:w-80 lg:w-96 flex-col border-r border-gray-200 bg-white flex-shrink-0 min-h-0 pb-16 md:pb-0`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h1 className="text-xl font-black text-gray-900 tracking-tight">
            Messages
          </h1>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition shadow-xs"
            title="Start new message"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 transition shadow-2xs"
            />
          </div>
        </div>

        {/* CONVERSATIONS LIST */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loadingRooms ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
              <Loader2 className="animate-spin text-indigo-500" size={28} />
              <span className="text-xs font-semibold">Loading chats...</span>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <MessageSquare size={40} className="text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-700">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
                {searchTerm
                  ? "No conversations match your search"
                  : "Connect with friends to start chatting!"}
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="mt-4 rounded-full bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
              >
                Start Chat
              </button>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const isActive = activeRoom?._id === room._id;
              const isDM = room.roomType === "dm";
              const title = isDM
                ? room.dmUserInfo?.name || room.dmUserInfo?.username || "Direct Message"
                : room.roomName || "Group Chat";

              const avatar = isDM
                ? room.dmUserInfo?.profilePicture?.commentView ||
                  room.dmUserInfo?.profilePicture?.profileView ||
                  room.dmUserInfo?.profilePicture?.url ||
                  "/default-avatar.svg"
                : "/default-avatar.svg";

              const lastMsgText = room.lastMessage?.content || "No messages yet";
              const unread = room.unreadCount || 0;

              return (
                <div
                  key={room._id}
                  onClick={() => openRoom(room)}
                  className={`flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer transition ${
                    isActive
                      ? "bg-indigo-50/80 border border-indigo-100 shadow-2xs"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={avatar}
                      alt={title}
                      onError={(e) => {
                        e.target.src = "/default-avatar.svg";
                      }}
                      className="h-12 w-12 rounded-full object-cover border border-gray-200"
                    />
                    {!isDM && (
                      <span className="absolute bottom-0 right-0 rounded-full bg-indigo-600 p-0.5 text-white ring-2 ring-white">
                        <Users size={10} />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3
                        className={`text-sm font-bold truncate ${
                          isActive ? "text-indigo-900" : "text-gray-900"
                        }`}
                      >
                        {title}
                      </h3>
                      {room.lastMessageAt && (
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {new Date(room.lastMessageAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 truncate max-w-[180px]">
                        {lastMsgText}
                      </p>
                      {unread > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-bold text-white shadow-xs">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CENTER PANEL: ACTIVE CHAT */}
      <div
        className={`${
          activeRoom ? "flex" : "hidden md:flex"
        } flex-1 flex-col bg-white min-h-0 relative`}
      >
        {activeRoom ? (
          <>
            {/* CHAT HEADER */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3.5 bg-white z-10">
              <div className="flex items-center gap-3">
                {/* MOBILE BACK BUTTON */}
                <button
                  onClick={() => setActiveRoom(null)}
                  className="md:hidden rounded-full p-2 text-gray-500 hover:bg-gray-100 transition"
                >
                  <ArrowLeft size={20} />
                </button>

                <img
                  src={
                    activeRoom.roomType === "dm"
                      ? activeRoom.dmUserInfo?.profilePicture?.commentView ||
                        activeRoom.dmUserInfo?.profilePicture?.profileView ||
                        "/default-avatar.svg"
                      : "/default-avatar.svg"
                  }
                  alt="Avatar"
                  onError={(e) => {
                    e.target.src = "/default-avatar.svg";
                  }}
                  className="h-10 w-10 rounded-full object-cover border border-gray-200 cursor-pointer"
                  onClick={() => {
                    if (activeRoom.roomType === "dm" && activeRoom.dmUserInfo?._id) {
                      navigate(`/profile/${activeRoom.dmUserInfo._id}`);
                    }
                  }}
                />

                <div>
                  <h2
                    className="text-sm font-bold text-gray-900 cursor-pointer hover:text-indigo-600 transition truncate max-w-[200px]"
                    onClick={() => {
                      if (activeRoom.roomType === "dm" && activeRoom.dmUserInfo?._id) {
                        navigate(`/profile/${activeRoom.dmUserInfo._id}`);
                      }
                    }}
                  >
                    {activeRoom.roomType === "dm"
                      ? activeRoom.dmUserInfo?.name ||
                        activeRoom.dmUserInfo?.username ||
                        "Direct Message"
                      : activeRoom.roomName || "Group Chat"}
                  </h2>
                  <p className="text-[11px] text-gray-400">
                    {activeRoom.roomType === "dm"
                      ? `@${activeRoom.dmUserInfo?.username || "user"}`
                      : `${activeRoom.totalMembers || activeRoom.members?.length || 2} members`}
                  </p>
                </div>
              </div>

              {/* TOGGLE INFO DRAWER */}
              <button
                onClick={() => setShowInfoDrawer(!showInfoDrawer)}
                className={`rounded-full p-2.5 transition ${
                  showInfoDrawer
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                <Info size={20} />
              </button>
            </div>

            {/* MESSAGES LIST AREA */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 bg-gray-50/50 min-h-0"
            >
              {hasMore && (
                <div className="flex justify-center py-2">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMessages}
                    className="rounded-full bg-white border border-gray-200 px-4 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 shadow-2xs transition disabled:opacity-50"
                  >
                    {loadingMessages ? "Loading older messages..." : "Load earlier messages"}
                  </button>
                </div>
              )}

              {loadingMessages && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                  <span className="text-xs font-semibold">Loading conversation...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3">
                    <MessageSquare size={32} />
                  </div>
                  <h3 className="text-base font-bold text-gray-800">
                    No messages yet
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-[240px]">
                    Say hello and start the conversation!
                  </p>
                </div>
              ) : (
                messages.map((m) => (
                  <MessageItem
                    key={m._id}
                    message={m}
                    currentUserId={userId}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                  />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* COMPOSER INPUT */}
            <form
              onSubmit={handleSendMessage}
              className="border-t border-gray-100 p-4 bg-white flex items-center gap-3"
            >
              <input
                type="text"
                placeholder="Write a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={sending}
                className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={!text.trim() || sending}
                className="flex items-center justify-center h-11 w-11 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          /* EMPTY UNSELECTED STATE */
          <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-gray-50/30">
            <div className="h-20 w-20 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100 shadow-xs">
              <MessageSquare size={40} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Your Messages
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Send private direct messages or group chats to your friends and followers.
            </p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="mt-6 rounded-full bg-indigo-600 px-6 py-3 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition shadow-md"
            >
              Send Message
            </button>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: INFO DRAWER */}
      {activeRoom && showInfoDrawer && (
        <div className="w-72 lg:w-80 border-l border-gray-200 bg-white flex flex-col min-h-0 animate-in slide-in-from-right duration-200">
          <div className="border-b border-gray-100 p-6 text-center">
            <img
              src={
                activeRoom.roomType === "dm"
                  ? activeRoom.dmUserInfo?.profilePicture?.profileView ||
                    "/default-avatar.svg"
                  : "/default-avatar.svg"
              }
              alt="Profile"
              onError={(e) => {
                e.target.src = "/default-avatar.svg";
              }}
              className="mx-auto h-20 w-20 rounded-full object-cover border-2 border-gray-100 shadow-xs mb-3"
            />
            <h3 className="text-base font-bold text-gray-900">
              {activeRoom.roomType === "dm"
                ? activeRoom.dmUserInfo?.name || activeRoom.dmUserInfo?.username || "DM"
                : activeRoom.roomName || "Group Chat"}
            </h3>
            {activeRoom.roomType === "dm" && activeRoom.dmUserInfo?.username && (
              <p className="text-xs text-gray-400 mt-0.5">
                @{activeRoom.dmUserInfo.username}
              </p>
            )}

            {activeRoom.roomType === "dm" && activeRoom.dmUserInfo?._id && (
              <button
                onClick={() => navigate(`/profile/${activeRoom.dmUserInfo._id}`)}
                className="mt-4 w-full rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
              >
                View Profile
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* GROUP MEMBERS */}
            {activeRoom.roomType === "group" && (
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Members ({activeRoom.members?.length || 0})
                </h4>
                <div className="space-y-2">
                  {activeRoom.members?.map((m) => {
                    const memberObj = m.memberId || {};
                    return (
                      <div
                        key={memberObj._id || m._id}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => memberObj._id && navigate(`/profile/${memberObj._id}`)}
                      >
                        <img
                          src={
                            memberObj.profilePicture?.commentView ||
                            memberObj.profilePicture?.profileView ||
                            "/default-avatar.svg"
                          }
                          alt={memberObj.username}
                          onError={(e) => {
                            e.target.src = "/default-avatar.svg";
                          }}
                          className="h-8 w-8 rounded-full object-cover border border-gray-200"
                        />
                        <span className="text-xs font-bold text-gray-800 truncate">
                          {memberObj.username || "User"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LEAVE GROUP ACTION */}
            {activeRoom.roomType === "group" && (
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleLeaveGroup}
                  className="flex items-center justify-center gap-2 w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                >
                  <LogOut size={16} />
                  Leave Group
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
