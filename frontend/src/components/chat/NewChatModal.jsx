import React, { useState } from "react";
import { X, Search, Users, User, Check } from "lucide-react";

export default function NewChatModal({ isOpen, onClose, followingProfiles = [], onCreateRoom }) {
  const [chatType, setChatType] = useState("dm"); // "dm" or "group"
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const filteredUsers = followingProfiles.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.username?.toLowerCase().includes(term) ||
      p.name?.toLowerCase().includes(term)
    );
  });

  const toggleUserSelection = (userId) => {
    if (chatType === "dm") {
      setSelectedUsers([userId]);
    } else {
      setSelectedUsers((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedUsers.length === 0 || loading) return;

    if (chatType === "group" && !groupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    try {
      setLoading(true);
      await onCreateRoom({
        participants: selectedUsers,
        roomType: selectedUsers.length >= 2 ? "group" : chatType,
        roomName: chatType === "group" ? groupName.trim() : undefined,
      });
      // Reset state on success
      setSelectedUsers([]);
      setGroupName("");
      setSearchTerm("");
      onClose();
    } catch (err) {
      console.error("Error creating room:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">New Message</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Start a direct conversation or create a group chat
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* TYPE TABS */}
        <div className="flex rounded-2xl bg-gray-100 p-1 my-4">
          <button
            type="button"
            onClick={() => {
              setChatType("dm");
              setSelectedUsers([]);
            }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition ${
              chatType === "dm"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <User size={15} />
            Direct Message
          </button>
          <button
            type="button"
            onClick={() => {
              setChatType("group");
              setSelectedUsers([]);
            }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition ${
              chatType === "group"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Users size={15} />
            Group Chat
          </button>
        </div>

        {/* GROUP NAME INPUT (IF GROUP CHAT) */}
        {chatType === "group" && (
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
              Group Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Momentia Squad"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>
        )}

        {/* SEARCH FILTER */}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:bg-white transition"
          />
        </div>

        {/* USER SELECTION LIST */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No matching people found.
            </div>
          ) : (
            filteredUsers.map((user) => {
              const targetId = user.userId || user._id;
              const isSelected = selectedUsers.includes(targetId);
              const avatar =
                user.profilePicture?.commentView ||
                user.profilePicture?.profileView ||
                user.profilePicture?.url ||
                (typeof user.profilePicture === "string" ? user.profilePicture : "/default-avatar.svg");

              return (
                <div
                  key={targetId}
                  onClick={() => toggleUserSelection(targetId)}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50/60 shadow-xs"
                      : "border-gray-100 bg-gray-50/50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={avatar}
                      alt={user.username}
                      onError={(e) => {
                        e.target.src = "/default-avatar.svg";
                      }}
                      className="h-10 w-10 rounded-full object-cover border border-gray-200"
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{user.username}</p>
                      {user.name && <p className="text-xs text-gray-400">{user.name}</p>}
                    </div>
                  </div>

                  <div
                    className={`h-6 w-6 rounded-full border flex items-center justify-center transition ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check size={14} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="border-t border-gray-100 pt-4 mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {selectedUsers.length} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedUsers.length === 0 || loading || (chatType === "group" && !groupName.trim())}
              className="rounded-full bg-indigo-600 px-6 py-2 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {loading ? "Creating..." : chatType === "group" ? "Create Group" : "Start Chat"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
