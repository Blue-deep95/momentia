import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import {Heart,
        MessageCircleMore,
        Send,
        Bookmark,
        EllipsisVertical
} from "lucide-react";
import CommentsModal from "./Comment";
import FollowButton from "./FollowButton.jsx";


const PostCard = ({ post }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [liked, setLiked] = useState(post.isLiked || false);
  const [saved, setSaved] = useState(post.isSaved || false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [likesCount, setLikesCount] = useState(post.totalLikes || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.totalComments || 0);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  useEffect(() => {
    const onCommentCountChanged = (e) => {
      const { postId, delta } = e.detail || {};
      if (String(postId) === String(post._id) && typeof delta === 'number') {
        setCommentsCount((c) => Math.max(0, c + delta));
      }
    };

    window.addEventListener('commentCountChanged', onCommentCountChanged);
    return () => window.removeEventListener('commentCountChanged', onCommentCountChanged);
  }, [post._id]);

  const handleToggleLike = async () => {
    try {
      const res = await api.post(`/post/toggle-like/${post._id}`);
      const isLiked = res.data.isLiked;
      setLiked(isLiked);
      setLikesCount((prevLikes) => Math.max(0, prevLikes + (isLiked ? 1 : -1)));
    } catch (err) {
      console.error("Error toggling like", err);
    }
  };

  const handleToggleSave = async () => {
    if (saveLoading) return;
    setSaveLoading(true);

    try {
      const res = await api.post(`/post/toggle-savedposts/${post._id}`);
      const isSaved = res.data.isSaved;
      setSaved(isSaved);

      if (isSaved) {
        toast.success("Post saved");
      } else {
        toast.success("Post removed from saved");
      }
    } catch (err) {
      console.error("Error toggling save", err);
      toast.error("Could not update saved posts");
    } finally {
      setSaveLoading(false);
    }
  };

  // Keep `saved` state in sync when the `post` prop changes
  useEffect(() => {
    setSaved(Boolean(post.isSaved));
  }, [post.isSaved]);

  const toggleOptionsMenu = () => {
    setShowOptionsMenu((prev) => !prev);
  };

  const goToPost = () => {
    navigate(`/post/${post._id}`);
    setShowOptionsMenu(false);
  };

  return (
    <div className="max-w-153.5 mx-auto w-full overflow-visible rounded-2xl border border-gray-200 bg-white shadow-md">

      {/* 🔝 HEADER */}
      <div className="flex items-center justify-between p-4">
    
        {/* USER INFO */}
        <div
          className="flex cursor-pointer items-center gap-3"
          onClick={() => navigate(`/profile/${post.authorDetails?._id}`)}
        >

          {/* PROFILE IMAGE */}
          <img
            src={
              post.authorDetails?.profilePicture?.profileView ||
              "https://i.pravatar.cc/150?img=12"
            }
            alt="profile"
            className="h-11 w-11 rounded-full object-cover"
            loading="lazy"
            decoding="async"
          />

          {/* USERNAME */}
          <div>
            <h3 className="font-semibold text-gray-800">
              {post.authorDetails?.username || "momentia_user"}
            </h3>

            <p className="text-xs text-gray-400">
              Momentia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user?.id !== post.authorDetails?._id && (
            <FollowButton
              userId={post.authorDetails?._id}
              initialFollowing={post.isFollowing ?? null}
              size="sm"
              variant="outline"
            />
          )}

          <div className="relative inline-block">
            <button
              onClick={toggleOptionsMenu}
              className="text-xl text-gray-500"
            >
              <EllipsisVertical size={24} />
            </button>

            {showOptionsMenu && (
              <div className="absolute right-0 top-1/2 z-10 w-44 -translate-y-1/2 translate-x-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                <button
                  onClick={goToPost}
                  className="w-full px-4 py-3 text-left text-sm text-gray-800 transition hover:bg-gray-50"
                >
                  Go to post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🖼️ IMAGE POST */}
      {post.mediaType === "image" && post.images?.length > 0 && (
        <img
          src={post.images[0].url}
          alt="post"
          onClick={() => navigate(`/post/${post._id}`)}
          className="max-h-190 h-auto w-full object-cover cursor-pointer hover:opacity-95 transition"
          loading="lazy"
          decoding="async"
        />
      )}

      {/* 🎥 VIDEO POST */}
      {post.mediaType === "video" && post.video?.url && (
        <video
          src={post.video.url}
          controls
          preload="none"
          poster={post.thumbImage || post.images?.[0]?.url || ""}
          onClick={() => navigate(`/post/${post._id}`)}
          className="max-h-190 h-auto w-full object-cover cursor-pointer hover:opacity-95 transition"
        />
      )}

      {/* ❤️ ACTION SECTION */}
      <div className="p-4">

        {/* BUTTONS */}
        <div className="mb-3 flex items-center justify-between">

          {/* LEFT BUTTONS */}
          <div className="flex items-center gap-5">

            {/* LIKE */}
            <button
              onClick={handleToggleLike}
              className="transition hover:scale-110"
            >
              <Heart
                size={24}
                className={`transition ${
                  liked ? "fill-red-500 text-red-500" : "text-gray-700"
                }`}
              />
            </button>

            {/* COMMENT */}
            <button 
              onClick={() => setShowComments(true)}
              className="text-2xl text-gray-700 transition hover:scale-110"
            >
              <MessageCircleMore size={24}  />
            </button>

            {/* SHARE */}
            <button className="text-2xl text-gray-700 transition hover:scale-110">
              <Send size={24} />
            </button>
          </div>

          {/* SAVE */}
          <button
            type="button"
            onClick={handleToggleSave}
            disabled={saveLoading}
            className="transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Bookmark
              size={24}
              className={`transition ${
                saved ? "fill-gray-700 text-gray-700" : "text-gray-700"
              }`}
            />
          </button>
        </div>

        {/* TOTAL LIKES */}
        <p className="text-sm font-semibold text-gray-800">
          {likesCount} likes
        </p>

        {/* CAPTION */}
        <div className="mt-2 text-sm">
          <span className="mr-2 font-semibold">
            {post.authorDetails?.username || "momentia_user"}
          </span>

          <span className="text-gray-700">
            {post.caption}
          </span>
        </div>

        {/* COMMENTS */}
        <button 
          onClick={() => setShowComments(true)}
          className="mt-2 text-sm text-gray-500"
        >
          View all {commentsCount || 0} comments
        </button>

        {/* DATE */}
        <p className="mt-2 text-xs uppercase text-gray-400">
          {new Date(post.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* COMMENTS MODAL */}
      {showComments && (
        <CommentsModal 
          post={post} 
          commentsCount={commentsCount}
          closeModal={() => setShowComments(false)} 
        />
      )}
    </div>
  );
};

export default PostCard;
