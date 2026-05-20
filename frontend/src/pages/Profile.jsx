import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

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
  Trash2,
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
  const navigate = useNavigate();

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

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/post/delete-post/${postId}`);
      setPosts(posts.filter((p) => p._id !== postId));
      if (profile) {
        setProfile((prev) => ({
          ...prev,
          totalPosts: (prev.totalPosts || 1) - 1,
        }));
      }
    } catch (err) {
      console.log(err);
      alert("Failed to delete post");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F6FB]">
        <div className="rounded-2xl bg-white px-6 py-4 shadow-lg">
          <p className="animate-pulse font-semibold text-[#2F3EDB]">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F5F6FB] text-[#111827]">

      {/* SIDEBAR */}

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* MAIN */}

      <div className="flex-1 overflow-y-auto">

        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">

          {/* PROFILE HEADER */}

          <div className="bg-linear-to-r relative overflow-hidden rounded-[35px] from-[#2F3EDB] via-[#5160F5] to-[#FF7A3D] p-px shadow-2xl">

            <div className="rounded-[35px] bg-[#F8FAFF]/95 p-6 backdrop-blur-xl md:p-10">

              <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[#FF7A3D]/20 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[#2F3EDB]/20 blur-3xl" />

              <div className="relative flex flex-col gap-10 xl:flex-row">

                {/* PROFILE IMAGE */}

                <div className="flex justify-center">

                  <div className="group relative">

                    <div className="bg-linear-to-br rounded-full from-[#2F3EDB] to-[#FF7A3D] p-1 shadow-2xl">

                      <div className="h-40 w-40 overflow-hidden rounded-full border-[6px] border-white bg-white md:h-52 md:w-52">

                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : profile?.profilePicture?.profileView ? (
                          <img
                            src={profile.profilePicture.profileView}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="bg-linear-to-br flex h-full w-full items-center justify-center from-[#2F3EDB] to-[#FF7A3D] text-6xl font-bold text-white">
                            {profile?.name?.[0]}
                          </div>
                        )}

                      </div>

                    </div>

                    {isOwnProfile && (
                      <label className="absolute left-4 bottom-4 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-white shadow-xl transition-all duration-300 hover:scale-110 dark:border-slate-900 dark:bg-slate-950">

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

                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

                    <div>

                      <div className="flex flex-wrap items-center gap-3">

                        <h1 className="text-3xl font-bold text-[#111827] md:text-5xl">
                          {profile?.username}
                        </h1>

                        <BadgeCheck
                          size={28}
                          className="text-[#2F3EDB]"
                        />

                      </div>

                      <p className="mt-2 text-lg text-[#6B7280]">
                        @{profile?.username}
                      </p>

                    </div>

                    {/* ACTIONS */}

                    <div className="flex flex-wrap gap-3">

                      {isOwnProfile ? (
                        <>
                          <button
                            onClick={() => setShowEdit(true)}
                            className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-3 font-semibold text-[#111827] shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
                          >
                            Edit Profile
                          </button>

                          <button
                            onClick={() => navigate("/messages")}
                            className="flex items-center gap-2 rounded-2xl bg-[#FF7A3D] px-5 py-3 font-semibold text-white shadow-xl transition-all hover:scale-105"
                          >
                            <Share2 size={18} />
                            Share
                          </button>
                        </>
                      ) : (
                        <FollowButton userId={profileUserId} />
                      )}

                    </div>

                  </div>

                  {/* STATS */}

                  <div className="mt-8 grid grid-cols-3 gap-4">

                    <div className="rounded-3xl border border-white bg-white/70 p-5 shadow-lg backdrop-blur-xl transition-all hover:-translate-y-1">

                      <h3 className="text-3xl font-bold text-[#2F3EDB]">
                        {profile?.totalPosts || 0}
                      </h3>

                      <p className="mt-1 text-[#6B7280]">
                        Posts
                      </p>

                    </div>

                    <button
                      onClick={() => setShowFollowers(true)}
                      className="rounded-3xl border border-white bg-white/70 p-5 text-left shadow-lg backdrop-blur-xl transition-all hover:-translate-y-1"
                    >

                      <h3 className="text-3xl font-bold text-[#FF7A3D]">
                        {profile?.followers || 0}
                      </h3>

                      <p className="mt-1 text-[#6B7280]">
                        Followers
                      </p>

                    </button>

                    <button
                      onClick={() => setShowFollowing(true)}
                      className="rounded-3xl border border-white bg-white/70 p-5 text-left shadow-lg backdrop-blur-xl transition-all hover:-translate-y-1"
                    >

                      <h3 className="text-3xl font-bold text-[#2F3EDB]">
                        {profile?.following || 0}
                      </h3>

                      <p className="mt-1 text-[#6B7280]">
                        Following
                      </p>

                    </button>

                  </div>

                  {/* BIO */}

                  <div className="mt-8 rounded-3xl border border-white bg-white/60 p-6 shadow-lg backdrop-blur-xl">

                    <h2 className="text-2xl font-bold text-[#111827]">
                      {profile?.name}
                    </h2>

                    {profile?.bio && (
                      <p className="mt-4 text-[15px] leading-8 text-[#4B5563]">
                        {profile.bio}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap gap-5">

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
                          className="flex items-center gap-2 font-medium text-[#2F3EDB]"
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

          <div className="sticky top-0 z-30 mt-8 rounded-3xl border border-white bg-white/70 px-2 shadow-lg backdrop-blur-xl">

            <div className="flex items-center justify-center overflow-x-auto">

              {TABS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-6 py-5 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === key
                      ? "bg-linear-to-r from-[#2F3EDB] to-[#5160F5] text-white shadow-lg"
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
                <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">

                  {posts.map((post, i) => (
                    <PostCard
                      key={i}
                      post={post}
                      onClick={() => setSelectedPost(post)}
                      showDelete={isOwnProfile}
                      onDelete={handleDeletePost}
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
            <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-5">

              {posts.map((post, i) => (
                <ReelCard
                  key={i}
                  post={post}
                  onClick={() => setSelectedPost(post)}
                  showDelete={isOwnProfile}
                  onDelete={handleDeletePost}
                />
              ))}

            </div>
          )}

          {/* PHOTOS */}

          {activeTab === "photos" && (
            <div className="mt-8 columns-2 gap-5 space-y-5 md:columns-3 xl:columns-4">

              {posts.map((post, i) => (
                <PhotoCard
                  key={i}
                  post={post}
                  onClick={() => setSelectedPost(post)}
                  showDelete={isOwnProfile}
                  onDelete={handleDeletePost}
                />
              ))}

            </div>
          )}

          {/* SAVED */}

          {activeTab === "saved" && (
            <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">

              {posts.map((post, i) => (
                <PostCard
                  key={i}
                  post={post}
                  onClick={() => setSelectedPost(post)}
                  showDelete={false}
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

const PostCard = ({ post, onClick, showDelete, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const image =
    post.thumbImage ||
    post.imageUrl ||
    post.images?.[0]?.url;

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-white shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
    >
      {showDelete && (
        <div className="absolute right-4 top-4 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition hover:bg-black/40"
            >
              <MoreHorizontal size={18} />
            </button>

            {showMenu && (
              <div className="animate-in fade-in zoom-in absolute right-0 mt-2 w-36 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(post._id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="aspect-square overflow-hidden">

        <img
          src={image}
          alt=""
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />

      </div>

      <div className="bg-linear-to-t absolute inset-0 flex items-end justify-center from-black/70 to-transparent pb-8 opacity-0 transition duration-500 group-hover:opacity-100">

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

const ReelCard = ({ post, onClick, showDelete, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const image =
    post.thumbImage ||
    post.imageUrl ||
    post.images?.[0]?.url;

  return (
    <div
      onClick={onClick}
      className="aspect-9/16 group relative cursor-pointer overflow-hidden rounded-[28px] bg-white shadow-xl"
    >
      {showDelete && (
        <div className="absolute right-4 top-4 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition hover:bg-black/40"
            >
              <MoreHorizontal size={18} />
            </button>

            {showMenu && (
              <div className="animate-in fade-in zoom-in absolute right-0 mt-2 w-36 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(post._id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <img
        src={image}
        alt=""
        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
      />

      <div className="bg-linear-to-t absolute inset-0 from-black/70 to-transparent" />

      <div className="absolute inset-0 flex items-center justify-center">

        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-xl">

          <Play
            fill="white"
            className="ml-1 text-white"
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

const PhotoCard = ({ post, onClick, showDelete, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const image =
    post.thumbImage ||
    post.imageUrl ||
    post.images?.[0]?.url;

  return (
    <div
      onClick={onClick}
      className="group relative mb-5 cursor-pointer break-inside-avoid overflow-hidden rounded-[28px] bg-white shadow-lg"
    >
      {showDelete && (
        <div className="absolute right-4 top-4 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition hover:bg-black/40"
            >
              <MoreHorizontal size={18} />
            </button>

            {showMenu && (
              <div className="animate-in fade-in zoom-in absolute right-0 mt-2 w-36 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(post._id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <img
        src={image}
        alt=""
        className="w-full object-cover transition duration-700 group-hover:scale-105"
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
      className="z-999 inz-999lex fixed items-center justify-center bg-black/60 p-4 backdrop-blur-md"
    >

      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-in fade-in zoom-in flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-[35px] bg-white shadow-2xl lg:flex-row"
      >

        {/* IMAGE */}

        <div className="flex flex-1 items-center justify-center bg-[#EEF2FF]">

          <img
            src={image}
            alt=""
            className="h-full w-full object-contain"
          />

        </div>

        {/* RIGHT */}

        <div className="lg:w-107.5 flex w-full flex-col bg-white">

          {/* HEADER */}

          <div className="flex items-center justify-between border-b border-[#E5E7EB] p-5">

            <div className="flex items-center gap-3">

              <div className="h-12 w-12 overflow-hidden rounded-full bg-[#EEF2FF]">

                {post.user?.profilePicture?.profileView && (
                  <img
                    src={post.user.profilePicture.profileView}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}

              </div>

              <div>

                <h3 className="font-semibold text-[#111827]">
                  {post.user?.username}
                </h3>

                <p className="text-sm text-[#6B7280]">
                  {post.user?.name}
                </p>

              </div>

            </div>

            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#F3F4F6]"
            >
              <X className="text-[#111827]" />
            </button>

          </div>

          {/* CONTENT */}

          <div className="flex-1 space-y-6 overflow-y-auto p-5">

            <p className="leading-7 text-[#374151]">
              {post.caption}
            </p>

            {post.comments?.map((comment, i) => (
              <div key={i} className="flex gap-3">

                <div className="h-10 w-10 rounded-full bg-[#E5E7EB]" />

                <div className="rounded-2xl bg-[#F9FAFB] px-4 py-3">

                  <p className="text-sm text-[#111827]">

                    <span className="mr-2 font-semibold">
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

                <Heart className="cursor-pointer transition hover:text-red-500" />

                <MessageCircle className="cursor-pointer" />

                <Send className="cursor-pointer" />

              </div>

              <Bookmark className="cursor-pointer" />

            </div>

            <p className="mt-4 font-semibold text-[#111827]">
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
      className="z-999 fixed inset-0 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md"
    >

      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-[35px] bg-white p-8 shadow-2xl"
      >

        <div className="mb-8 flex items-center justify-between">

          <h2 className="text-3xl font-bold text-[#111827]">
            Edit Profile
          </h2>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#F3F4F6]"
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

            <label className="text-sm font-medium text-[#6B7280]">
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
              className="mt-2 w-full resize-none rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-5 py-4 text-[#111827] outline-none focus:border-[#2F3EDB]"
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
            className="bg-linear-to-r flex w-full items-center justify-center gap-2 rounded-2xl from-[#2F3EDB] to-[#FF7A3D] py-4 font-semibold text-white shadow-xl transition hover:scale-[1.02]"
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

    <label className="text-sm font-medium text-[#6B7280]">
      {label}
    </label>

    <input
      value={value}
      onChange={onChange}
      className="mt-2 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-5 py-4 text-[#111827] outline-none focus:border-[#2F3EDB]"
    />

  </div>
);

/* EMPTY */

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center">

    <div className="bg-linear-to-r flex h-24 w-24 items-center justify-center rounded-full from-[#2F3EDB] to-[#FF7A3D] shadow-xl">

      <LayoutGrid size={34} className="text-white" />

    </div>

    <h2 className="mt-6 text-3xl font-bold text-[#111827]">
      No Posts Yet
    </h2>

    <p className="mt-3 text-base text-[#6B7280]">
      Shared posts will appear here.
    </p>

  </div>
);

export default Profile;