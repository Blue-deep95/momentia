import { useNavigate } from "react-router-dom";

const UserListCard = ({
  user,
  onUserClick,
  actionNode = null,
  showOnline = false,
  animationDelay = 0,
}) => {
  const navigate = useNavigate();

  // Safely get profile picture from different possible locations
  const avatarSrc =
    user?.profilePicture?.commentView ||
    user?.profilePicture?.profileView ||
    user?.profilePicture?.url ||
    (typeof user?.profilePicture === "string" ? user.profilePicture : null);

  const username = user?.username || user?.name || "Unknown";
  const realName = user?.username && user?.name ? user.name : null;
  
  // Determine status label
  const statusLabel =
    user?.isFollowing === false
      ? "Follow"
      : user?.isFollowing === true
      ? "Following"
      : null;
  
  const initial = username[0]?.toUpperCase() || "U";

  // Handle user card click - navigate to profile
  const handleUserClick = () => {
    onUserClick?.();
    const profileId = user?.userId || user?._id;
    
    if (profileId) {
      navigate(`/profile/${profileId}`, { replace: false });
    }
  };

  // Handle image load error - hide broken images
  const handleImageError = (e) => {
    e.target.style.display = "none";
  };

  return (
    <div
      className="user-card"
      style={animationDelay ? { animationDelay: `${animationDelay}s` } : {}}
    >
      <div className="card-main" onClick={handleUserClick}>
        <div className="avatar-ring">
          <div className="avatar-inner">
            <div className="avatar-content">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={username}
                  className="h-full w-full object-cover"
                  onError={handleImageError}
                  loading="lazy"
                />
              ) : (
                <span className="avatar-initial">{initial}</span>
              )}
            </div>
          </div>
          {showOnline && <span className="online-dot" />}
        </div>

        <div className="user-details">
          <div className="user-name">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap block">
              {username}
            </span>
            {statusLabel && (
              <span className={`status-pill ${statusLabel === "Follow" ? "follow" : "following"}`}>
                {statusLabel}
              </span>
            )}
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              className="flex-shrink-0"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" fill="#2F3EDB" opacity="0.15" />
              <circle cx="12" cy="12" r="10" stroke="#2F3EDB" strokeWidth="1.5" fill="none" />
              <polyline
                points="8 12 11 15 16 9"
                stroke="#2F3EDB"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="user-handle" title={realName ? `@${user?.username}` : ""}>
            {realName ? realName : `@${user?.username || "user"}`}
          </p>
        </div>
      </div>

      {actionNode && (
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {actionNode}
        </div>
      )}
    </div>
  );
};

export default UserListCard;
