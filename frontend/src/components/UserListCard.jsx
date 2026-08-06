import { useNavigate } from "react-router-dom";

const UserListCard = ({
  user,
  onUserClick,
  actionNode = null,
  showOnline = false,
}) => {
  const navigate = useNavigate();

  const avatarSrc =
    user?.profilePicture?.commentView ||
    user?.profilePicture?.profileView ||
    user?.profilePicture?.url ||
    (typeof user?.profilePicture === "string" && user.profilePicture ? user.profilePicture : "/default-avatar.svg");

  const username = user?.username || user?.name || "Unknown";
  const realName = user?.username && user?.name ? user.name : null;

  const handleUserClick = () => {
    onUserClick?.();
    const profileId = user?.userId || user?._id;

    if (profileId) {
      navigate(`/profile/${profileId}`);
    }
  };

  const handleImageError = (e) => {
    e.target.src = "/default-avatar.svg";
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-xs hover:border-indigo-100 hover:bg-gray-50/50 transition">
      <div
        className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
        onClick={handleUserClick}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-indigo-500/20 bg-indigo-50">
            <img
              src={avatarSrc}
              alt={username}
              className="h-full w-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
          </div>
          {showOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
          )}
        </div>

        {/* User Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-gray-900 hover:text-indigo-600">
              {username}
            </span>
          </div>
          <p className="truncate text-xs text-gray-500">
            {realName ? realName : `@${user?.username || "user"}`}
          </p>
        </div>
      </div>

      {/* Action button container */}
      {actionNode && (
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {actionNode}
        </div>
      )}
    </div>
  );
};

export default UserListCard;
