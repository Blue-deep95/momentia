import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import Sidebar from "../components/Sidebar.jsx";
import FollowersModal from "../components/FollowersModal.jsx";
import FollowingModal from "../components/FollowingModal.jsx";
import FollowButton from "../components/FollowButton.jsx";

import {
  Camera,
  Heart,
  MapPin,
  Link2,
  Calendar,
  BadgeCheck,
  LayoutGrid,
  Bookmark,
  Plus,
  MoreHorizontal,
  MessageCircle,
  Send,
  X,
  Loader2,
  Clapperboard,
  Image as ImageIcon,
  Play,
  Share2,
} from "lucide-react";

const TABS = [
  { key: "posts", label: "Posts", Icon: LayoutGrid },
  { key: "reels", label: "Reels", Icon: Clapperboard },
  { key: "photos", label: "Photos", Icon: ImageIcon },
  { key: "saved", label: "Saved", Icon: Bookmark },
];

const Profile = () => {
  const { user } = useSelector((s) => s.auth);
  const { userId } = useParams();

  const profileUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("posts");

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const [selectedPost, setSelectedPost] = useState(null);

  const [showEdit, setShowEdit] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/profile/get-profile/${profileUserId}`);
      setProfile(res.data.profile);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await api.get(`/profile/get-userposts/${profileUserId}`);
      setPosts(res.data.posts || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (!profileUserId) return;

    (async () => {
      try {
        setLoading(true);

        await Promise.all([fetchProfile(), fetchPosts()]);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [profileUserId]);

  const handleProfileUpload = async (e) => {
    try {
      const file = e.target.files[0];

      if (!file) return;

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        return alert("Only jpg, jpeg, png and webp allowed");
      }

      const localPreview = URL.createObjectURL(file);

      setPreviewImage(localPreview);

      const formData = new FormData();

      formData.append("avatar", file);

      setUploading(true);

      await api.post("/profile/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchProfile();
    } catch (err) {
      console.log(err);
      alert("Profile upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6FB] flex items-center justify-center">
        <div className="bg-white px-6 py-4 rounded-2xl shadow-lg">
          <p className="text-[#2F3EDB] font-semibold animate-pulse">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FB] flex text-[#111827]">

      {/* SIDEBAR */}

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* MAIN */}

      <div className="flex-1 overflow-y-auto">

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">

          {/* PROFILE HEADER */}

          <div className="relative overflow-hidden rounded-[35px] bg-gradient-to-r from-[#2F3EDB] via-[#5160F5] to-[#FF7A3D] p-[1px] shadow-2xl">

            <div className="bg-[#F8FAFF]/95 backdrop-blur-xl rounded-[35px] p-6 md:p-10">

              <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF7A3D]/20 blur-3xl rounded-full" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#2F3EDB]/20 blur-3xl rounded-full" />

              <div className="relative flex flex-col xl:flex-row gap-10">

                {/* PROFILE IMAGE */}

                <div className="flex justify-center">

                  <div className="relative group">

                    <div className="p-1 rounded-full bg-gradient-to-br from-[#2F3EDB] to-[#FF7A3D] shadow-2xl">

                      <div className="w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden bg-white border-[6px] border-white">

                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : profile?.profilePicture?.profileView ? (
                          <img
                            src={profile.profilePicture.profileView}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2F3EDB] to-[#FF7A3D] text-white text-6xl font-bold">
                            {profile?.name?.[0]}
                          </div>
                        )}

                      </div>

                    </div>

                    {isOwnProfile && (
                      <label className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300">

                        {uploading ? (
                          <Loader2
                            size={20}
                            className="animate-spin text-[#2F3EDB]"
                          />
                        ) : (
                          <Camera
                            size={20}
                            className="text-[#2F3EDB]"
                          />
                        )}

                        <input
                          type="file"
                          hidden
                          accept=".jpg,.jpeg,.png,.webp"
                          onChange={handleProfileUpload}
                        />

                      </label>
                    )}

                  </div>

                </div>

                {/* INFO */}

                <div className="flex-1">

                  {/* USERNAME */}

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

                    <div>

                      <div className="flex items-center gap-3 flex-wrap">

                        <h1 className="text-3xl md:text-5xl font-bold text-[#111827]">
                          {profile?.username}
                        </h1>

                        <BadgeCheck
                          size={28}
                          className="text-[#2F3EDB]"
                        />

                      </div>

                      <p className="text-[#6B7280] mt-2 text-lg">
                        @{profile?.username}
                      </p>

                    </div>

                    {/* ACTIONS */}

                    <div className="flex flex-wrap gap-3">

                      {isOwnProfile ? (
                        <>
                          <button
                            onClick={() => setShowEdit(true)}
                            className="px-6 py-3 rounded-2xl bg-white border border-[#E5E7EB] text-[#111827] font-semibold shadow-md hover:shadow-xl hover:-translate-y-1 transition-all"
                          >
                            Edit Profile
                          </button>

                          <button className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#2F3EDB] to-[#5160F5] text-white font-semibold shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                            <Plus size={18} />
                            Create Post
                          </button>

                          <button className="px-5 py-3 rounded-2xl bg-[#FF7A3D] text-white font-semibold shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                            <Share2 size={18} />
                            Share
                          </button>
                        </>
                      ) : (
                        <FollowButton userId={profileUserId} />
                      )}

                      <button className="w-12 h-12 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center shadow-md hover:shadow-xl transition-all">
                        <MoreHorizontal
                          size={20}
                          className="text-[#111827]"
                        />
                      </button>

                    </div>

                  </div>

                  {/* STATS */}

                  <div className="grid grid-cols-3 gap-4 mt-8">

                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 border border-white shadow-lg hover:-translate-y-1 transition-all">

                      <h3 className="text-3xl font-bold text-[#2F3EDB]">
                        {profile?.totalPosts || 0}
                      </h3>

                      <p className="text-[#6B7280] mt-1">
                        Posts
                      </p>

                    </div>

                    <button
                      onClick={() => setShowFollowers(true)}
                      className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 border border-white shadow-lg hover:-translate-y-1 transition-all text-left"
                    >

                      <h3 className="text-3xl font-bold text-[#FF7A3D]">
                        {profile?.followers || 0}
                      </h3>

                      <p className="text-[#6B7280] mt-1">
                        Followers
                      </p>

                    </button>

                    <button
                      onClick={() => setShowFollowing(true)}
                      className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 border border-white shadow-lg hover:-translate-y-1 transition-all text-left"
                    >

                      <h3 className="text-3xl font-bold text-[#2F3EDB]">
                        {profile?.following || 0}
                      </h3>

                      <p className="text-[#6B7280] mt-1">
                        Following
                      </p>

                    </button>

                  </div>

                  {/* BIO */}

                  <div className="mt-8 bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white">

                    <h2 className="text-2xl font-bold text-[#111827]">
                      {profile?.name}
                    </h2>

                    {profile?.bio && (
                      <p className="text-[#4B5563] mt-4 leading-8 text-[15px]">
                        {profile.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-5 mt-5">

                      {profile?.location && (
                        <div className="flex items-center gap-2 text-[#6B7280]">
                          <MapPin size={16} />
                          {profile.location}
                        </div>
                      )}

                      {profile?.website && (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-[#2F3EDB] font-medium"
                        >
                          <Link2 size={16} />
                          Website
                        </a>
                      )}

                      <div className="flex items-center gap-2 text-[#6B7280]">
                        <Calendar size={16} />
                        Joined 2026
                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* TABS */}

          <div className="sticky top-0 z-30 mt-8 backdrop-blur-xl bg-white/70 border border-white rounded-3xl shadow-lg px-2">

            <div className="flex items-center justify-center overflow-x-auto">

              {TABS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-6 py-5 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === key
                      ? "bg-gradient-to-r from-[#2F3EDB] to-[#5160F5] text-white shadow-lg"
                      : "text-[#6B7280] hover:text-[#111827]"
                  }`}
                >

                  <Icon size={18} />

                  {label}

                </button>
              ))}

            </div>

          </div>

          {/* POSTS */}

          {activeTab === "posts" && (
            <>
              {posts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 mt-8">

                  {posts.map((post, i) => (
                    <PostCard
                      key={i}
                      post={post}
                      onClick={() => setSelectedPost(post)}
                    />
                  ))}

                </div>
              ) : (
                <EmptyState />
              )}
            </>
          )}

          {/* REELS */}

          {activeTab === "reels" && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5 mt-8">

              {posts.map((post, i) => (
                <ReelCard
                  key={i}
                  post={post}
                  onClick={() => setSelectedPost(post)}
                />
              ))}

            </div>
          )}

          {/* PHOTOS */}

          {activeTab === "photos" && (
            <div className="columns-2 md:columns-3 xl:columns-4 gap-5 mt-8 space-y-5">

              {posts.map((post, i) => (
                <PhotoCard
                  key={i}
                  post={post}
                  onClick={() => setSelectedPost(post)}
                />
              ))}

            </div>
          )}

          {/* SAVED */}

          {activeTab === "saved" && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 mt-8">

              {posts.map((post, i) => (
                <PostCard
                  key={i}
                  post={post}
                  onClick={() => setSelectedPost(post)}
                />
              ))}

            </div>
          )}

        </div>

      </div>

      {/* POST MODAL */}

      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {/* EDIT PROFILE */}

      {showEdit && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          refreshProfile={fetchProfile}
        />
      )}

      {/* FOLLOWERS */}

      {showFollowers && (
        <FollowersModal
          userId={profileUserId}
          onClose={() => setShowFollowers(false)}
        />
      )}

      {/* FOLLOWING */}

      {showFollowing && (
        <FollowingModal
          userId={profileUserId}
          onClose={() => setShowFollowing(false)}
        />
      )}

    </div>
  );
};

/* POST CARD */

const PostCard = ({ post, onClick }) => {
  const image =
    post.thumbImage ||
    post.imageUrl ||
    post.images?.[0]?.url;

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-[28px] bg-white border border-[#E5E7EB] shadow-lg cursor-pointer hover:-translate-y-2 hover:shadow-2xl transition-all duration-500"
    >

      <div className="aspect-square overflow-hidden">

        <img
          src={image}
          alt=""
          className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
        />

      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition duration-500 flex items-end justify-center pb-8">

        <div className="flex items-center gap-8 text-white">

          <div className="flex items-center gap-2">
            <Heart size={20} fill="white" />
            <span>{post.totalLikes || 0}</span>
          </div>

          <div className="flex items-center gap-2">
            <MessageCircle size={20} />
            <span>{post.comments?.length || 0}</span>
          </div>

        </div>

      </div>

    </div>
  );
};

/* REEL CARD */

const ReelCard = ({ post, onClick }) => {
  const image =
    post.thumbImage ||
    post.imageUrl ||
    post.images?.[0]?.url;

  return (
    <div
      onClick={onClick}
      className="group relative aspect-[9/16] overflow-hidden rounded-[28px] bg-white shadow-xl cursor-pointer"
    >

      <img
        src={image}
        alt=""
        className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

      <div className="absolute inset-0 flex items-center justify-center">

        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center">

          <Play
            fill="white"
            className="text-white ml-1"
          />

        </div>

      </div>

      <div className="absolute bottom-4 left-4 text-white">

        <p className="font-semibold">
          {post.totalLikes || 0} Likes
        </p>

      </div>

    </div>
  );
};

/* PHOTO CARD */

const PhotoCard = ({ post, onClick }) => {
  const image =
    post.thumbImage ||
    post.imageUrl ||
    post.images?.[0]?.url;

  return (
    <div
      onClick={onClick}
      className="group overflow-hidden rounded-[28px] bg-white shadow-lg cursor-pointer mb-5 break-inside-avoid"
    >

      <img
        src={image}
        alt=""
        className="w-full object-cover group-hover:scale-105 transition duration-700"
      />

    </div>
  );
};

/* POST MODAL */

const PostModal = ({ post, onClose }) => {
  const image =
    post.thumbImage ||
    post.imageUrl ||
    post.images?.[0]?.url;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
    >

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-6xl h-[95vh] rounded-[35px] overflow-hidden flex flex-col lg:flex-row shadow-2xl animate-in fade-in zoom-in"
      >

        {/* IMAGE */}

        <div className="flex-1 bg-[#EEF2FF] flex items-center justify-center">

          <img
            src={image}
            alt=""
            className="w-full h-full object-contain"
          />

        </div>

        {/* RIGHT */}

        <div className="w-full lg:w-[430px] flex flex-col bg-white">

          {/* HEADER */}

          <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#EEF2FF]">

                {post.user?.profilePicture?.profileView && (
                  <img
                    src={post.user.profilePicture.profileView}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}

              </div>

              <div>

                <h3 className="text-[#111827] font-semibold">
                  {post.user?.username}
                </h3>

                <p className="text-[#6B7280] text-sm">
                  {post.user?.name}
                </p>

              </div>

            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-[#F3F4F6] flex items-center justify-center"
            >
              <X className="text-[#111827]" />
            </button>

          </div>

          {/* CONTENT */}

          <div className="flex-1 overflow-y-auto p-5 space-y-6">

            <p className="text-[#374151] leading-7">
              {post.caption}
            </p>

            {post.comments?.map((comment, i) => (
              <div key={i} className="flex gap-3">

                <div className="w-10 h-10 rounded-full bg-[#E5E7EB]" />

                <div className="bg-[#F9FAFB] rounded-2xl px-4 py-3">

                  <p className="text-sm text-[#111827]">

                    <span className="font-semibold mr-2">
                      {comment.user?.username || "user"}
                    </span>

                    {comment.text}

                  </p>

                </div>

              </div>
            ))}

          </div>

          {/* ACTIONS */}

          <div className="border-t border-[#E5E7EB] p-5">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-5">

                <Heart className="cursor-pointer hover:text-red-500 transition" />

                <MessageCircle className="cursor-pointer" />

                <Send className="cursor-pointer" />

              </div>

              <Bookmark className="cursor-pointer" />

            </div>

            <p className="font-semibold mt-4 text-[#111827]">
              {post.totalLikes || 0} likes
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

/* EDIT PROFILE */

const EditProfileModal = ({
  profile,
  onClose,
  refreshProfile,
}) => {
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    website: profile?.website || "",
    location: profile?.location || "",
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      await api.put("/profile/update-profile", formData);

      await refreshProfile();

      onClose();
    } catch (err) {
      console.log(err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-md flex items-center justify-center p-4"
    >

      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white rounded-[35px] p-8 shadow-2xl"
      >

        <div className="flex items-center justify-between mb-8">

          <h2 className="text-3xl font-bold text-[#111827]">
            Edit Profile
          </h2>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-[#F3F4F6] flex items-center justify-center"
          >
            <X className="text-[#111827]" />
          </button>

        </div>

        <div className="space-y-5">

          <InputField
            label="Name"
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value,
              })
            }
          />

          <InputField
            label="Username"
            value={formData.username}
            onChange={(e) =>
              setFormData({
                ...formData,
                username: e.target.value,
              })
            }
          />

          <div>

            <label className="text-[#6B7280] text-sm font-medium">
              Bio
            </label>

            <textarea
              rows={4}
              value={formData.bio}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bio: e.target.value,
                })
              }
              className="w-full mt-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-5 py-4 text-[#111827] outline-none focus:border-[#2F3EDB] resize-none"
            />

          </div>

          <InputField
            label="Website"
            value={formData.website}
            onChange={(e) =>
              setFormData({
                ...formData,
                website: e.target.value,
              })
            }
          />

          <InputField
            label="Location"
            value={formData.location}
            onChange={(e) =>
              setFormData({
                ...formData,
                location: e.target.value,
              })
            }
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#2F3EDB] to-[#FF7A3D] hover:scale-[1.02] transition text-white font-semibold flex items-center justify-center gap-2 shadow-xl"
          >

            {saving && (
              <Loader2
                size={18}
                className="animate-spin"
              />
            )}

            {saving ? "Saving..." : "Save Changes"}

          </button>

        </div>

      </div>

    </div>
  );
};

const InputField = ({
  label,
  value,
  onChange,
}) => (
  <div>

    <label className="text-[#6B7280] text-sm font-medium">
      {label}
    </label>

    <input
      value={value}
      onChange={onChange}
      className="w-full mt-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-5 py-4 text-[#111827] outline-none focus:border-[#2F3EDB]"
    />

  </div>
);

/* EMPTY */

const EmptyState = () => (
  <div className="py-24 flex flex-col items-center justify-center text-center">

    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#2F3EDB] to-[#FF7A3D] flex items-center justify-center shadow-xl">

      <LayoutGrid size={34} className="text-white" />

    </div>

    <h2 className="text-[#111827] text-3xl font-bold mt-6">
      No Posts Yet
    </h2>

    <p className="text-[#6B7280] text-base mt-3">
      Shared posts will appear here.
    </p>

  </div>
);

export default Profile;