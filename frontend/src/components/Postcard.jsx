import React, { useState, useEffect } from "react";
import api from "../services/api";
import {Heart,
        MessageCircleMore,
        Send,
        Bookmark
} from "lucide-react";
import CommentsModal from "./Comment";


const PostCard = ({ post }) => {
  const [liked, setLiked] = useState(post.isLiked || false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.totalLikes || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.totalComments || 0);

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

  return (
    <div className="mx-auto w-full max-w-153.5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">

      {/* 🔝 HEADER */}
      <div className="flex items-center justify-between p-4">
    
        {/* USER INFO */}
        <div className="flex items-center gap-3">

          {/* PROFILE IMAGE */}
          <img
            src={
              post.authorDetails?.profilePicture?.profileView ||
              "https://i.pravatar.cc/150?img=12"
            }
            alt="profile"
            className="h-11 w-11 rounded-full object-cover"
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

        {/* MORE OPTIONS */}
        <button className="text-xl text-gray-500">
          ⋮
        </button>
      </div>

      {/* 🖼️ IMAGE POST */}
      {post.mediaType === "image" && post.images?.length > 0 && (
        <img
          src={post.images[0].url}
          alt="post"
          className="h-auto max-h-190 w-full object-cover"
        />
      )}

      {/* 🎥 VIDEO POST */}
      {post.mediaType === "video" && post.video?.url && (
        <video
          src={post.video.url}
          controls
          className="h-auto max-h-190 w-full object-cover"
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
            onClick={() => setSaved(!saved)}
            className="transition hover:scale-110"
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
