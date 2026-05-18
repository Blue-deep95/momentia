import React from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck } from "lucide-react";

const UserListCard = ({
  user,
  onActionClick,
  actionLabel = "Remove",
  isLoading = false,
  onUserClick,
  showOnline = false,
  animationDelay = 0,
}) => {
  const navigate = useNavigate();

  const avatarSrc =
    user.profilePicture?.commentView ||
    user.profilePicture?.profileView ||
    (typeof user.profilePicture === "string" ? user.profilePicture : null);

  const handleUserClick = () => {
    if (onUserClick) onUserClick();
    navigate(`/profile/${user.userId}`);
  };

  const btnStyles =
    actionLabel === "Remove"
      ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 hover:shadow-[0_6px_20px_-4px_rgba(239,68,68,0.25)]"
      : actionLabel === "Follow" || actionLabel === "Unfollow"
      ? "bg-gradient-to-br from-emerald-700 via-emerald-500 to-emerald-400 text-white shadow-[0_4px_16px_-4px_rgba(16,185,129,0.4)] hover:shadow-[0_8px_24px_-4px_rgba(16,185,129,0.55)]"
      : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:border-emerald-400/30 hover:text-emerald-300";

  return (
    <div
      style={{ animationDelay: `${animationDelay}s` }}
      className="group relative flex items-center justify-between gap-3 px-4 py-3 rounded-[18px] bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Hover glow overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-200/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-[18px]" />

      {/* LEFT: avatar + info */}
      <div
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        onClick={handleUserClick}
      >
        {/* Avatar ring */}
        <div className="relative flex-shrink-0 w-[52px] h-[52px] rounded-full p-[2px] bg-white border border-slate-200 shadow-sm">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={user.username}
              className="w-full h-full rounded-full object-cover block"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xl font-bold">
              {(user.name || user.username || "U")[0].toUpperCase()}
            </div>
          )}

          {/* Online dot */}
          {showOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_6px_2px_rgba(52,238,129,0.35)] animate-pulse" />
          )}
        </div>

        {/* Name + handle */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-semibold text-slate-900 truncate leading-tight">
              {user.name || user.username}
            </span>
            <BadgeCheck size={13} className="text-emerald-500 flex-shrink-0" />
          </div>
          <p className="text-[12px] text-slate-500 truncate mt-0.5">
            @{user.username}
          </p>
        </div>
      </div>

      {/* RIGHT: action button */}
      <button
        onClick={() => onActionClick(user.userId)}
        disabled={isLoading}
        className={`relative flex-shrink-0 flex items-center gap-1.5 px-3.5 py-[7px] rounded-[10px] text-[11px] font-bold tracking-[0.3px] hover:-translate-y-px transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${btnStyles}`}
      >
        {isLoading ? (
          <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin inline-block" />
        ) : (
          actionLabel
        )}
      </button>
    </div>
  );
};

export default UserListCard;
