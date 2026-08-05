import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Heart,
  MessageCircle,
  Bookmark,
  X,
  EllipsisVertical,
  Share2,
  Trash2,
  Loader2,
  UserPlus,
  UserCheck,
} from "lucide-react";
import {
  useGetCommentsQuery,
  useCreateCommentMutation,
} from "../slices/commentApi";
import CommentItem from "../components/CommentItem.jsx";
import CommentInput from "../components/CommentInput.jsx";
import FollowButton from "../components/FollowButton.jsx";

export default function SinglePost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

  // RTK Query hooks for comments
  const {
    data: commentsData,
    isLoading: loadingComments,
    isFetching: fetchingComments,
  } = useGetCommentsQuery({ postId, page: 1 }, { skip: !postId });

  const [createComment, { isLoading: isPostingComment }] =
    useCreateCommentMutation();

  // Fetch post metadata
  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/post/get-singlepost/${postId}`);

        if (res.data?.post) {
          const p = res.data.post;
          setPost(p);
          setLiked(p.isLiked || false);
          setLikesCount(p.totalLikes || 0);
          setSaved(p.isSaved || false);
        } else {
          setError("Post not found");
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError(err.response?.data?.message || "Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  // Handle Like toggle
  const handleToggleLike = async () => {
    if (!post) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));

    try {
      const res = await api.post(`/post/toggle-like/${post._id}`);
      if (typeof res.data?.isLiked === "boolean") {
        setLiked(res.data.isLiked);
      }
    } catch (err) {
      console.error("Error toggling post like:", err);
      // Rollback on error
      setLiked(liked);
      setLikesCount((prev) => Math.max(0, prev + (liked ? 1 : -1)));
    }
  };

  // Handle Save toggle
  const handleToggleSave = async () => {
    if (!post) return;
    const nextSaved = !saved;
    setSaved(nextSaved);

    try {
      const res = await api.post(`/post/toggle-savedposts/${post._id}`);
      if (typeof res.data?.isSaved === "boolean") {
        setSaved(res.data.isSaved);
        toast.success(res.data.isSaved ? "Post saved" : "Removed from saved");
      }
    } catch (err) {
      console.error("Error toggling save:", err);
      setSaved(saved);
      toast.error("Could not update saved status");
    }
  };

  // Handle Add Comment / Reply via RTK Query
  const handleAddComment = async () => {
    if (!input.trim() || isPostingComment || !post) return;

    try {
      const payload = {
        content: input,
        postid: post._id,
      };

      if (replyTo) {
        payload.parent = replyTo.parent || replyTo._id;
        payload.reference =
          replyTo.authorDetails?._id || replyTo.author?._id || replyTo.author;
        payload.referenceComment = replyTo._id;
      }

      await createComment(payload).unwrap();

      // Dispatch event to update comments count locally if needed
      window.dispatchEvent(
        new CustomEvent("commentCountChanged", {
          detail: { postId: post._id, delta: 1 },
        })
      );

      setInput("");
      setReplyTo(null);
    } catch (err) {
      console.error("Error adding comment:", err);
      toast.error(err.data?.message || "Failed to post comment");
    }
  };

  // Handle Delete Post
  const handleDeletePost = async () => {
    if (!post || deletingPost) return;
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      setDeletingPost(true);
      await api.delete(`/post/delete-post/${post._id}`);
      toast.success("Post deleted successfully");
      navigate(-1);
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error(err.response?.data?.message || "Could not delete post");
    } finally {
      setDeletingPost(false);
    }
  };

  // Handle Share Post link
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Post link copied to clipboard!");
    }
  };

  const comments = commentsData?.comments || [];
  const author = post?.authorDetails || {};
  const isOwnPost = user?.id === author?._id;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
          <p className="text-sm font-medium text-gray-400">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4 text-white">
        <div className="max-w-md rounded-3xl bg-gray-800 p-8 text-center shadow-2xl border border-gray-700">
          <p className="text-lg font-bold text-rose-500 mb-2">Unavailable</p>
          <p className="text-sm text-gray-300 mb-6">{error || "Post not found or deleted."}</p>
          <button
            onClick={() => navigate(-1)}
            className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-6 overflow-y-auto">
      {/* CLOSE BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 right-4 z-50 rounded-full bg-black/60 p-2.5 text-white hover:bg-black/90 transition shadow-lg border border-white/10"
        aria-label="Close"
      >
        <X size={22} />
      </button>

      {/* CONTAINER */}
      <div className="relative flex h-[90vh] max-h-[780px] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 flex-col md:flex-row">
        {/* LEFT: MEDIA CONTAINER */}
        <div className="relative flex items-center justify-center bg-black md:w-[60%] h-64 md:h-full overflow-hidden">
          {post.mediaType === "video" || post.video?.url ? (
            <video
              src={post.video?.url || post.mediaUrl}
              controls
              autoPlay
              loop
              className="max-h-full max-w-full object-contain"
              poster={post.thumbImage || post.images?.[0]?.url}
            />
          ) : (
            <img
              src={
                post.imageUrl ||
                post.images?.[0]?.url ||
                post.thumbImage ||
                "https://via.placeholder.com/600"
              }
              alt={post.caption || "post"}
              className="max-h-full max-w-full object-contain"
            />
          )}
        </div>

        {/* RIGHT: DETAILS & COMMENTS PANEL */}
        <div className="flex flex-1 flex-col bg-white md:w-[40%] min-h-0">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 bg-white">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate(`/profile/${author?._id}`)}
            >
              <img
                src={
                  author?.profilePicture?.commentView ||
                  author?.profilePicture?.profileView ||
                  "/default-avatar.svg"
                }
                alt={author?.username}
                className="h-10 w-10 rounded-full object-cover border border-gray-200 group-hover:scale-105 transition"
              />
              <div>
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition truncate max-w-[140px]">
                  {author?.username || "user"}
                </h3>
                <p className="text-xs text-gray-400 truncate max-w-[140px]">
                  {author?.name || "Momentia Creator"}
                </p>
              </div>
            </div>

            {/* ACTION / OPTIONS */}
            <div className="flex items-center gap-2">
              {!isOwnPost && author?._id && (
                <FollowButton userId={author._id} initialFollowing={post.isFollowing} size="sm" />
              )}

              <div className="relative">
                <button
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                >
                  <EllipsisVertical size={18} />
                </button>

                {showOptionsMenu && (
                  <div
                    className="absolute right-0 top-full z-20 mt-1 w-44 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl animate-in fade-in duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setShowOptionsMenu(false);
                        handleShare();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Share2 size={16} />
                      Share link
                    </button>

                    {isOwnPost && (
                      <button
                        onClick={() => {
                          setShowOptionsMenu(false);
                          handleDeletePost();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 size={16} />
                        Delete post
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CAPTION */}
          {post.caption && (
            <div className="border-b border-gray-100 px-5 py-3 bg-gray-50/50">
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                <span className="font-bold text-gray-900 mr-2">
                  @{author?.username}
                </span>
                {post.caption}
              </p>
              <p className="mt-1 text-[10px] text-gray-400 uppercase font-semibold">
                {new Date(post.createdAt || Date.now()).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          )}

          {/* COMMENTS LIST */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-white">
            {loadingComments ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 py-10">
                <Loader2 className="animate-spin text-indigo-500" size={24} />
                <p className="text-xs text-gray-400 font-medium">Loading comments...</p>
              </div>
            ) : comments.length > 0 ? (
              comments.map((c) => (
                <CommentItem
                  key={c._id}
                  comment={c}
                  postId={post._id}
                  onReply={(targetComment) => setReplyTo(targetComment)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <MessageCircle size={32} className="text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-gray-700">No comments yet</p>
                <p className="text-xs text-gray-400 mt-0.5">Start the conversation below!</p>
              </div>
            )}
          </div>

          {/* LIKE & ACTIONS BAR */}
          <div className="border-t border-gray-100 px-5 py-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleToggleLike}
                  className="transition transform active:scale-125"
                  aria-label="Like post"
                >
                  <Heart
                    size={22}
                    className={
                      liked ? "fill-rose-500 text-rose-500" : "text-gray-700 hover:text-rose-500 transition"
                    }
                  />
                </button>

                <button
                  onClick={handleShare}
                  className="text-gray-700 hover:text-indigo-600 transition"
                  aria-label="Share post"
                >
                  <Share2 size={20} />
                </button>
              </div>

              <button
                onClick={handleToggleSave}
                className="transition transform active:scale-125"
                aria-label="Save post"
              >
                <Bookmark
                  size={22}
                  className={
                    saved ? "fill-indigo-600 text-indigo-600" : "text-gray-700 hover:text-indigo-600 transition"
                  }
                />
              </button>
            </div>

            <p className="text-xs font-bold text-gray-900">
              {likesCount} {likesCount === 1 ? "like" : "likes"}
            </p>
          </div>

          {/* INPUT BAR */}
          <div className="border-t border-gray-100 bg-white">
            <CommentInput
              input={input}
              setInput={setInput}
              onSend={handleAddComment}
              replyTo={replyTo}
              onClearReply={() => setReplyTo(null)}
              isDisabled={isPostingComment}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
