// ============================================
// CAMERA UPLOAD ICON - QUICK REFERENCE
// ============================================

// Location: frontend/src/pages/Profile.jsx

// 1. ADD STATE HOOK
const [avatarUploading, setAvatarUploading] = useState(false);

// 2. ENHANCED AVATAR CHANGE HANDLER
const handleAvatarChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // Instant preview
  setAvatarFile(file);
  setAvatarPrev(URL.createObjectURL(file));
  
  // Auto-upload if not in edit mode (for seamless UX)
  if (!editMode) {
    const uploadAvatar = async () => {
      setAvatarUploading(true);
      try {
        const fd = new FormData();
        fd.append("avatar", file);
        await api.post("/profile/upload-avatar", fd);
        setAvatarFile(null);
        await fetchProfile();
      } catch (err) {
        console.error("Avatar upload failed:", err);
        setAvatarUploading(false);
      }
    };
    uploadAvatar();
  }
};

// 3. CSS CLASSES (Add to style tag)
const css = `
  ...existing css...
  
  /* camera icon hover */
  @keyframes cameraHover { 
    0% { transform:scale(1); }
    50% { transform:scale(1.15); }
    100% { transform:scale(1); }
  }
  
  .camera-icon-btn {
    position:absolute; bottom:4px; right:4px; width:32px; height:32px;
    border-radius:50%; background:linear-gradient(135deg, #059669 0%, #10B981 100%);
    border:2px solid #04050F; display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:all .2s ease; box-shadow:0 4px 14px rgba(16,185,129,0.3);
    z-index:10;
  }
  
  .camera-icon-btn:hover:not(:disabled) {
    transform:scale(1.1); box-shadow:0 6px 20px rgba(16,185,129,0.5), 0 0 16px rgba(16,185,129,0.3);
  }
  
  .camera-icon-btn:active:not(:disabled) {
    transform:scale(0.95);
  }
  
  .camera-icon-btn:disabled {
    cursor:not-allowed; opacity:0.8;
  }
`;

// 4. AVATAR SECTION JSX (Replace existing)
<div style={{ position:"relative", flexShrink:0 }}>
  <div className="avatar-ring" style={{ 
    width:108, height:108, borderRadius:"50%",
    border:"3px solid rgba(110,231,183,0.5)", 
    padding:3, background:"#04050F" 
  }}>
    {avatarSrc ? (
      <img 
        src={avatarSrc} 
        alt="avatar"
        style={{ 
          width:"100%", 
          height:"100%", 
          borderRadius:"50%", 
          objectFit:"cover", 
          display:"block", 
          opacity: avatarUploading ? 0.6 : 1, 
          transition: "opacity .2s" 
        }} 
      />
    ) : (
      <div style={{
        width:"100%", 
        height:"100%", 
        borderRadius:"50%",
        background:"linear-gradient(135deg, rgba(110,231,183,0.15) 0%, rgba(99,102,241,0.1) 100%)",
        display:"flex", 
        alignItems:"center", 
        justifyContent:"center", 
        opacity: avatarUploading ? 0.6 : 1, 
        transition: "opacity .2s" 
      }}>
        <span style={{ 
          fontFamily:"'Fraunces',serif", 
          fontSize:36, 
          fontWeight:700, 
          color:"#6EE7B7" 
        }}>
          {profile?.name?.[0] || "U"}
        </span>
      </div>
    )}
  </div>

  {/* Camera icon - show always if own profile */}
  {isOwnProfile && (
    <label 
      className="camera-icon-btn" 
      title={avatarSrc ? "Change profile picture" : "Add profile picture"} 
      style={{ opacity: avatarUploading ? 0.7 : 1 }}
    >
      {avatarUploading ? (
        <span style={{ 
          width:16, 
          height:16, 
          border:"2px solid rgba(255,255,255,0.3)", 
          borderTop:"2px solid #fff", 
          borderRadius:"50%", 
          animation:"spin .7s linear infinite", 
          display:"inline-block" 
        }} />
      ) : (
        <Camera size={16} color="#fff" />
      )}
      <input 
        type="file" 
        hidden 
        accept="image/*" 
        onChange={handleAvatarChange}
        disabled={avatarUploading}
      />
    </label>
  )}
</div>

// ============================================
// KEY FEATURES
// ============================================

// ✅ Shows camera icon only for own profile
// ✅ Instant image preview
// ✅ Auto-uploads without edit mode
// ✅ Loading spinner during upload
// ✅ Smooth hover animations
// ✅ Circular avatar maintained
// ✅ First letter default avatar
// ✅ Mobile responsive
// ✅ Modern cyan/green neon theme
// ✅ Glassmorphism UI style

// ============================================
// STYLING BREAKDOWN
// ============================================

// Camera Button:
// - Size: 32x32px (border-radius: 50%)
// - Position: bottom-right of avatar (absolute positioning)
// - Gradient: #059669 → #10B981
// - Border: 2px solid #04050F (matches bg)
// - Shadow: 0 4px 14px rgba(16,185,129,0.3)

// Hover State:
// - Transform: scale(1.1)
// - Enhanced shadow with glow
// - Smooth 0.2s transition

// Click State:
// - Transform: scale(0.95)
// - Provides tactile feedback

// Upload State:
// - Shows loading spinner
// - Avatar becomes semi-transparent (0.6 opacity)
// - Button becomes disabled (0.8 opacity)

// ============================================
// API ENDPOINT REQUIRED
// ============================================

// POST /profile/upload-avatar
// - Accept: image file via FormData
// - Field name: "avatar"
// - Response: { success: true, profilePicture: {...} }

// Example backend endpoint (Express):
/*
app.post('/profile/upload-avatar', protect, async (req, res) => {
  try {
    // Handle file upload to Cloudinary or local storage
    const user = await User.findById(req.user.id);
    user.profilePicture = uploadedImageUrl;
    await user.save();
    res.json({ success: true, profilePicture: user.profilePicture });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
*/
