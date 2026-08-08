import React, { useState } from "react";
import { Pencil, Trash2, X, Check } from "lucide-react";

export default function MessageItem({ message, currentUserId, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");
  const [isSaving, setIsSaving] = useState(false);

  const senderObj =
    typeof message.sender === "object" && message.sender !== null
      ? message.sender
      : message.senderDetails || {};

  const senderId = senderObj._id
    ? String(senderObj._id)
    : message.sender
    ? String(message.sender)
    : null;

  const isOwn = currentUserId && senderId && String(currentUserId) === senderId;
  const senderName = senderObj.username || senderObj.name || "User";
  const senderAvatar =
    senderObj.profilePicture?.commentView ||
    senderObj.profilePicture?.profileView ||
    senderObj.profilePicture?.original?.url ||
    senderObj.profilePicture?.url ||
    "/default-avatar.svg";

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent === message.content || isSaving) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await onEdit(message._id, editContent);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to edit message:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(message.content || "");
    setIsEditing(false);
  };

  const formatTimestamp = (dateInput) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";

    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    if (isToday) {
      return timeStr;
    }

    const dateStr = date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return `${dateStr}, ${timeStr}`;
  };

  const formattedTime = formatTimestamp(message.createdAt);

  return (
    <div
      className={`group relative flex items-end gap-2 my-1.5 ${
        isOwn ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* AVATAR FOR OTHER USERS */}
      {!isOwn && (
        <img
          src={senderAvatar}
          alt={senderName}
          onError={(e) => {
            e.target.src = "/default-avatar.svg";
          }}
          className="h-8 w-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
        />
      )}

      {/* MESSAGE BUBBLE & ACTIONS */}
      <div className={`relative max-w-[75%] sm:max-w-[65%]`}>
        {/* ACTION BUTTONS HOVER OVERLAY (FOR SENDER) */}
        {isOwn && !message.isDeleted && !isEditing && (
          <div className="absolute top-1/2 -translate-y-1/2 -left-16 hidden group-hover:flex items-center gap-1 bg-white border border-gray-200 rounded-full p-1 shadow-sm z-10">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition"
              title="Edit message"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(message._id)}
              className="p-1 text-gray-500 hover:text-rose-600 rounded-full hover:bg-gray-100 transition"
              title="Delete message"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {/* BUBBLE CONTENT */}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
            isOwn
              ? "bg-indigo-600 text-white rounded-br-xs"
              : "bg-white text-gray-900 border border-gray-100 rounded-bl-xs"
          }`}
        >
          {!isOwn && (
            <p className="text-[11px] font-bold text-indigo-600 mb-0.5 truncate">
              {senderName}
            </p>
          )}

          {message.isDeleted ? (
            <p className="italic text-xs opacity-75">This message was deleted</p>
          ) : isEditing ? (
            <div className="flex flex-col gap-2 min-w-[200px]">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                autoFocus
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={handleCancelEdit}
                  className="rounded-md bg-gray-200 p-1 text-gray-700 hover:bg-gray-300 transition"
                >
                  <X size={14} />
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editContent.trim()}
                  className="rounded-md bg-emerald-600 p-1 text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  <Check size={14} />
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          )}

          {/* METADATA (TIME + EDITED TAG) */}
          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
              isOwn ? "text-indigo-200" : "text-gray-400"
            }`}
          >
            {message.isEdited && !message.isDeleted && <span>(edited)</span>}
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
