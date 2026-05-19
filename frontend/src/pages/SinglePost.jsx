import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../services/api";
import {
  Heart,
  MessageCircleMore,
  Send,
  Bookmark,
  X,
  EllipsisVertical,
} from "lucide-react";

const SinglePost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Fetch single post
  useEffect(() => {
    const fetchPost = async () => {
      try {
        console.log("Fetching post with ID:", postId);
        const res = await api.get(`/post/get-singlepost/${postId}`);
        console.log("Post response:", res.data);
        
        if (res.data.post) {
          setPost(res.data.post);
          setLiked(res.data.post.isLiked || false);
          setLikesCount(res.data.post.totalLikes || 0);
          setCommentsCount(res.data.post.totalComments || 0);
          setIsFollowing(res.data.post.isFollowing || false);
          
          // Fetch comments separately
          try {
            const commentsRes = await api.get(`/comment/get-comments/${postId}/1`);
            setComments(commentsRes.data.comments || []);
          } catch (err) {
            console.error("Error fetching comments", err);
          }
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  // Listen for comment count changes
  useEffect(() => {
    const onCommentCountChanged = (e) => {
      const { postId: changedPostId, delta } = e.detail || {};
      if (String(changedPostId) === String(postId) && typeof delta === "number") {
        setCommentsCount((c) => Math.max(0, c + delta));
      }
    };

    window.addEventListener("commentCountChanged", onCommentCountChanged);
    return () =>
      window.removeEventListener("commentCountChanged", onCommentCountChanged);
  }, [postId]);

  const handleToggleLike = async () => {
    try {
      const res = await api.post(`/post/toggle-like/${post._id}`);
      const isLiked = res.data.isLiked;
      setLiked(isLiked);
      setLikesCount((prevLikes) =>
        Math.max(0, prevLikes + (isLiked ? 1 : -1))
      );
    } catch (err) {
      console.error("Error toggling like", err);
    }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      await api.post(`/follow/follow-user`, {
        targetId: post.authorDetails?._id,
      });
      setIsFollowing(true);
    } catch (err) {
      console.error("Error following user", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setFollowLoading(true);
    try {
      await api.delete(`/follow/unfollow-user/${post.authorDetails?._id}`);
      setIsFollowing(false);
      setShowOptionsMenu(false);
    } catch (err) {
      console.error("Error unfollowing user", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAddComment = (newComment) => {
    setComments([...comments, newComment]);
    setCommentsCount((c) => c + 1);
  };

  const handleSendComment = async () => {
    if (!commentInput.trim()) return;
    
    try {
      const res = await api.post(`/comment/create-comment`, {
        post: post._id,
        text: commentInput,
      });
      
      if (res.data.comment) {
        handleAddComment(res.data.comment);
        setCommentInput("");
      }
    } catch (err) {
      console.error("Error posting comment", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="mb-4 text-gray-500">Loading post...</p>
          <p className="text-xs text-gray-400">Post ID: {postId}</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md rounded-lg bg-white p-8 text-center shadow">
          <p className="mb-4 font-semibold text-red-500">Error loading post</p>
          <p className="mb-4 text-gray-700">{error || "Post not found"}</p>
          <p className="mb-4 text-xs text-gray-400">Post ID: {postId}</p>
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-100 p-4">
      {/* CLOSE BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="fixed right-4 top-4 z-20 rounded-full border border-gray-300 bg-white p-2 shadow-md transition hover:bg-gray-100"
      >
        <X size={24} />
      </button>

      {/* MODAL CONTAINER */}
      <div className="mt-12 flex w-full max-w-6xl flex-col gap-0 overflow-hidden rounded-lg bg-white shadow-lg md:flex-row">
        {/* LEFT SIDE - IMAGE/VIDEO */}
        <div className="flex w-full items-center justify-center bg-black md:w-2/3">
          {post.mediaType === "image" && post.images?.length > 0 ? (
            <img
              src={post.images[0].url}
              alt="post"
              className="h-[640px] w-full object-cover"
            />
          ) : post.mediaType === "video" && post.video?.url ? (
            <video
              src={post.video.url}
              controls
              className="h-[640px] w-full object-cover"
            />
          ) : (
            <div className="text-center text-white">No media available</div>
          )}
        </div>

        {/* RIGHT SIDE - POST DETAILS */}
        <div className="flex max-h-[640px] w-full flex-col bg-white md:w-1/3">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            {/* USER INFO */}
            <div
              className="flex cursor-pointer items-center gap-3"
              onClick={() =>
                navigate(`/profile/${post.authorDetails?._id}`)
              }
            >
              <img
                src={
                  post.authorDetails?.profilePicture?.profileView ||
                  "https://i.pravatar.cc/150?img=12"
                }
                alt="profile"
                className="h-10 w-10 rounded-full object-cover"
              />

              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {post.authorDetails?.username || "momentia_user"}
                </h3>
                <p className="text-xs text-gray-400">Momentia</p>
              </div>
            </div>

            {/* OPTIONS */}
            <div className="relative inline-block">
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="text-gray-500 hover:text-gray-700"
              >
                <EllipsisVertical size={20} />
              </button>

              {showOptionsMenu && (
                <div className="absolute right-0 top-full z-10 mt-2 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                  {user?.id !== post.authorDetails?._id && !isFollowing && (
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className="w-full px-4 py-3 text-left text-sm text-gray-800 transition hover:bg-gray-50"
                    >
                      {followLoading ? "Following..." : "Follow"}
                    </button>
                  )}
                  {isFollowing && (
                    <button
                      onClick={handleUnfollow}
                      disabled={followLoading}
                      className="w-full px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50"
                    >
                      {followLoading ? "Unfollowing..." : "Unfollow"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CAPTION */}
          <div className="border-b border-gray-200 p-4">
            <div className="text-sm">
              <span className="mr-2 font-semibold">
                {post.authorDetails?.username || "momentia_user"}
              </span>
              <span className="text-gray-700">{post.caption}</span>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* COMMENTS SECTION */}
          <div className="flex-1 overflow-y-auto p-6">
            {comments && comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-semibold">
                      {comment.authorDetails?.username || "user"}
                    </span>
                    <span className="ml-2 text-gray-700">{comment.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-700">No comments yet.</h3>
                  <p className="text-sm text-gray-500">Start the conversation.</p>
                </div>
              </div>
            )}
          </div>

          {/* LIKES + ACTIONS */}
          <div className="border-t border-gray-200 px-4 py-3">
            <div className="mb-3 text-sm font-semibold">{likesCount} likes</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={handleToggleLike} className="transition hover:scale-110">
                  <Heart size={24} className={`transition ${liked ? "fill-red-500 text-red-500" : "text-gray-700"}`} />
                </button>

                <button className="text-gray-700 transition hover:scale-110">
                  <MessageCircleMore size={24} />
                </button>

                <button className="text-gray-700 transition hover:scale-110">
                  <Send size={24} />
                </button>
              </div>

              <button onClick={() => setSaved(!saved)} className="transition hover:scale-110">
                <Bookmark size={24} className={`transition ${saved ? "fill-gray-700 text-gray-700" : "text-gray-700"}`} />
              </button>
            </div>
          </div>

          {/* COMMENT INPUT */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendComment()}
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
              <button
                onClick={handleSendComment}
                disabled={!commentInput.trim()}
                className={`font-semibold text-sm ${commentInput.trim() ? "text-blue-600 hover:text-blue-700" : "text-gray-300 cursor-not-allowed"}`}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SinglePost;
