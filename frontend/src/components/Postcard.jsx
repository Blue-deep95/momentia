import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import {Heart,
        MessageCircleMore,
        Send,
        Bookmark,
        EllipsisVertical,
        Copy,
        Check,
        MessageCircle,
        Share2,
        X
} from "lucide-react";
import CommentsModal from "./Comment";
import FollowButton, { onFollowChange, emitFollowChange } from "./FollowButton.jsx";


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
  const [isFollowingLocal, setIsFollowingLocal] = useState(post.isFollowing ?? false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Keep local following state in sync when the `post` prop changes
  useEffect(() => {
    setIsFollowingLocal(Boolean(post.isFollowing));
  }, [post.isFollowing]);

  // Listen for follow/unfollow events (emitted by FollowButton) so header updates
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.targetId !== post.authorDetails?._id) return;
      setIsFollowingLocal(e.detail?.status === 'followed');
    };
    const cleanup = onFollowChange(handler);
    return cleanup;
  }, [post.authorDetails?._id]);

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
              post.authorDetails?.profilePicture?.profileView
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
          {user?.id !== post.authorDetails?._id && !isFollowingLocal && (
            <FollowButton
              userId={post.authorDetails?._id}
              initialFollowing={post.isFollowing ?? null}
              size="sm"
              variant="outline"
            />
          )}

          <button
            onClick={toggleOptionsMenu}
            className="text-xl text-gray-500"
          >
            <EllipsisVertical size={24} />
          </button>

          {showOptionsMenu && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50" onClick={() => setShowOptionsMenu(false)}>
              <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                {/* OPTIONS */}
                <div className="max-h-96 overflow-y-auto">
                  {!isFollowingLocal && (
                    <button
                      onClick={async () => {
                        try {
                          await api.post('/follow/follow-user', { targetId: post.authorDetails?._id });
                          toast.success('Following');
                          setIsFollowingLocal(true);
                          emitFollowChange(post.authorDetails?._id, 'followed');
                          setShowOptionsMenu(false);
                        } catch (err) {
                          console.error('follow error', err);
                          toast.error(err?.response?.data?.message || 'Could not follow user');
                        }
                      }}
                      className="w-full px-6 py-3 text-center text-sm font-semibold text-blue-600 transition hover:bg-gray-50"
                    >
                      Follow
                    </button>
                  )}

                  {isFollowingLocal && (
                    <button
                      onClick={async () => {
                        try {
                          await api.delete(`/follow/unfollow-user/${post.authorDetails?._id}`);
                          toast.success('Unfollowed');
                          setIsFollowingLocal(false);
                          emitFollowChange(post.authorDetails?._id, 'unfollowed');
                          setShowOptionsMenu(false);
                        } catch (err) {
                          console.error('unfollow error', err);
                          toast.error(err?.response?.data?.message || 'Could not unfollow user');
                        }
                      }}
                      className="w-full px-6 py-3 text-center text-sm font-semibold text-red-500 transition hover:bg-gray-50"
                    >
                      Unfollow
                    </button>
                  )}
                  <button
                    onClick={goToPost}
                    className="w-full px-6 py-3 text-center text-sm text-gray-800 transition hover:bg-gray-50"
                  >
                    Go to post
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + `/post/${post._id}`);
                      toast.success("Link copied!");
                      setShowOptionsMenu(false);
                    }}
                    className="w-full px-6 py-3 text-center text-sm text-gray-800 transition hover:bg-gray-50"
                  >
                    Copy link
                  </button>
                  <button
                    onClick={() => navigate(`/profile/${post.authorDetails?._id}`)}
                    className="w-full px-6 py-3 text-center text-sm text-gray-800 transition hover:bg-gray-50"
                  >
                    About this account
                  </button>
                  <button
                    onClick={() => setShowOptionsMenu(false)}
                    className="w-full px-6 py-3 text-center text-sm text-gray-800 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🖼️ IMAGE POST */}
      {post.mediaType === "image" && post.images?.length > 0 && (
        <img
          src={post.images[0].url}
          alt="post"
          onClick={() => navigate(`/post/${post._id}`)}
          className="max-h-190 h-auto w-full cursor-pointer object-cover transition hover:opacity-95"
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
          className="max-h-190 h-auto w-full cursor-pointer object-cover transition hover:opacity-95"
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
            <button 
              onClick={() => setShowShareModal(true)}
              className="text-2xl text-gray-700 transition hover:scale-110"
            >
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

      {/* SHARE POST MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
          <div className="w-full max-w-md rounded-[28px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900">Share Post</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Post Preview */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="bg-linear-to-br h-16 w-16 overflow-hidden rounded-full from-blue-600 to-indigo-600 shadow-lg">
                  <img
                    src={post.authorDetails?.profilePicture?.profileView || "https://i.pravatar.cc/150?img=12"}
                    alt={post.authorDetails?.username}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {post.authorDetails?.username || "momentia_user"}
                  </h3>
                  <p className="text-sm text-gray-600">Momentia</p>
                </div>
              </div>
            </div>

            {/* Share Options */}
            <div className="p-6">
              <div className="mb-4 rounded-xl bg-blue-50 p-3">
                <p className="text-xs text-gray-600">Share link:</p>
                <p className="truncate text-sm font-medium text-blue-600">
                  {window.location.origin}/post/{post._id}
                </p>
              </div>

              <div className="space-y-3">
                {/* Copy Link */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
                    setCopied(true);
                    toast.success("Post link copied!");
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-600 transition hover:bg-blue-100"
                >
                  {copied ? (
                    <>
                      <Check size={20} />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={20} />
                      Copy Link
                    </>
                  )}
                </button>

                {/* Share via System (Mobile) */}
                {navigator.share && (
                  <button
                    onClick={async () => {
                      try {
                        await navigator.share({
                          title: `Post by ${post.authorDetails?.username}`,
                          text: post.caption || "Check out this post on Momentia",
                          url: `${window.location.origin}/post/${post._id}`,
                        });
                      } catch (err) {
                        if (err.name !== "AbortError") {
                          console.error(err);
                        }
                      }
                    }}
                    className="bg-linear-to-r flex w-full items-center gap-3 rounded-2xl from-indigo-600 to-purple-600 px-4 py-3 font-semibold text-white transition hover:shadow-lg"
                  >
                    <Share2 size={20} />
                    Share via System
                  </button>
                )}

                {/* Share in Momentia Messages */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
                    setShowShareModal(false);
                    navigate("/messages");
                    toast.success("Post link copied - share in messages!");
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
                >
                  <MessageCircle size={20} />
                  Share in Momentia Messages
                </button>

                {/* WhatsApp */}
                <button
                  onClick={() => {
                    const message = encodeURIComponent(
                      `${post.caption || "Check out this post on Momentia"}\n\n${window.location.origin}/post/${post._id}`
                    );
                    window.open(`https://wa.me/?text=${message}`, "_blank");
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#25D366] px-4 py-3 font-semibold text-white transition hover:bg-[#22BE55]"
                >
                  <MessageCircle size={20} />
                  Share on WhatsApp
                </button>

                {/* Telegram */}
                <button
                  onClick={() => {
                    const message = encodeURIComponent(
                      `${post.caption || "Check out this post on Momentia"}\n\n${window.location.origin}/post/${post._id}`
                    );
                    window.open(
                      `https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/post/${post._id}`)}&text=${message}`,
                      "_blank"
                    );
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#0088cc] px-4 py-3 font-semibold text-white transition hover:bg-[#0077b5]"
                >
                  <Send size={20} />
                  Share on Telegram
                </button>

                {/* Twitter/X */}
                <button
                  onClick={() => {
                    const tweetText = encodeURIComponent(
                      `${post.caption || "Check out this post on Momentia"} ${window.location.origin}/post/${post._id}`
                    );
                    window.open(
                      `https://twitter.com/intent/tweet?text=${tweetText}`,
                      "_blank"
                    );
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-900"
                >
                  <Share2 size={20} />
                  Share on Twitter/X
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowShareModal(false)}
                className="mt-4 w-full rounded-2xl border border-gray-200 px-4 py-3 font-semibold text-gray-900 transition hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
