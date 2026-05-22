/**
 * UserListCard.jsx
 *
 * Reusable user row card for followers/following modals and search results.
 *
 * Props:
 *   user             – { userId, username, name, profilePicture }
 *   onUserClick()    – called before navigating to profile
 *   actionNode       – JSX rendered on the right (FollowButton, Remove, etc.)
 *   showOnline       – boolean — green dot on avatar
 *   animationDelay   – number (seconds) for stagger fade-in
 */

import { useNavigate } from "react-router-dom";

const UserListCard = ({
  user,
  onUserClick,
  actionNode      = null,
  showOnline      = false,
  animationDelay  = 0,
}) => {
  const navigate = useNavigate();

  /* Resolve avatar across possible shapes from backend */
  const avatarSrc =
    user?.profilePicture?.commentView ||
    user?.profilePicture?.profileView ||
    (typeof user?.profilePicture === "string" ? user.profilePicture : null);

  const username = user?.username || user?.name || "Unknown";
  const realName = user?.username && user?.name ? user.name : null;
  const statusLabel = user?.isFollowing === false ? "Follow" : user?.isFollowing === true ? "Following" : null;
  const initial = username[0]?.toUpperCase() || "U";

  const handleUserClick = () => {
    onUserClick?.();
    const profileId = user.userId || user._id;
    if (profileId) {
      navigate(`/profile/${profileId}`);
    }
  };

  return (
    <>
      <style>{`
        @keyframes ulc-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .ulc-card {
          animation: ulc-fadein 0.32s cubic-bezier(.22,1,.36,1) both;
        }
        .ulc-card:hover { background: #FAFBFF !important; }
      `}</style>

      <div
        className="ulc-card"
        style={{
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "space-between",
          gap:             12,
          padding:         "10px 0",
          borderRadius:    14,
          background:      "#fff",
          animationDelay:  `${animationDelay}s`,
          transition:      "background 0.15s ease",
        }}
      >
        {/* LEFT: avatar + text — clickable */}
        <div
          onClick={handleUserClick}
          style={{
            display:    "flex",
            alignItems: "center",
            gap:        11,
            flex:       1,
            minWidth:   0,
            cursor:     "pointer",
          }}
        >
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 46, height: 46, borderRadius: "50%",
              padding: 2,
              background: "linear-gradient(135deg, #2F3EDB, #4F5EF0, #FF7A3D)",
            }}>
              <div style={{
                width: "100%", height: "100%", borderRadius: "50%",
                overflow: "hidden", border: "2px solid #fff",
                background: "#F3F4F6",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={username}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <span style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 17, fontWeight: 800, color: "#2F3EDB",
                  }}>
                    {initial}
                  </span>
                )}
              </div>
            </div>

            {/* Online indicator */}
            {showOnline && (
              <span style={{
                position: "absolute", bottom: 1, right: 1,
                width: 11, height: 11, borderRadius: "50%",
                background: "#22C55E",
                border: "2px solid #fff",
                boxShadow: "0 0 6px rgba(34,197,94,0.5)",
              }} />
            )}
          </div>

          {/* Name + handle */}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 14, fontWeight: 700, color: "#111827",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                maxWidth: 160,
              }}>
                {username}
              </span>
              {statusLabel && (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 8px",
                  borderRadius: 9999,
                  background: statusLabel === "Follow" ? "#EFF6FF" : "#ECFDF5",
                  color: statusLabel === "Follow" ? "#1D4ED8" : "#166534",
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}>
                  {statusLabel}
                </span>
              )}
              {/* Verified badge */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" fill="#2F3EDB" opacity="0.15"/>
                <circle cx="12" cy="12" r="10" stroke="#2F3EDB" strokeWidth="1.5" fill="none"/>
                <polyline points="8 12 11 15 16 9" stroke="#2F3EDB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {realName ? (
              <p style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 12, color: "#9CA3AF", marginTop: 1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                maxWidth: 160,
              }}>
                {realName}
              </p>
            ) : (
              <p style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 12, color: "#9CA3AF", marginTop: 1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                maxWidth: 160,
              }}>
                @{user?.username}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT: action slot */}
        {actionNode && (
          <div style={{ flexShrink: 0 }}>
            {actionNode}
          </div>
        )}
      </div>
    </>
  );
};

export default UserListCard;