// CommentsModal.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import api from "../services/api";
import {
  Heart,
  X,
  ChevronDown,
  ChevronUp,
  MessageCircle
} from "lucide-react";
import { Virtuoso } from "react-virtuoso";
import CommentInput from "./CommentInput.jsx";
import { useGetCommentsQuery, useCreateCommentMutation, useDeleteCommentMutation } from "../slices/commentApi.js";

// Toast Component
const Toast = ({ message, type = "error", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-60 p-4 rounded-2xl shadow-xl text-white transition-all duration-300 border-2 ${
      type === "error" ? "bg-red-500 border-red-400" : "bg-green-500 border-green-400"
    }`}>
      <div className="flex items-center gap-2">
        <span className="font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 text-white transition hover:text-gray-200">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

const CommentItem = ({ comment, postId, onReply }) => {
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [likesCount, setLikesCount] = useState(comment.totalLikes || 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);
  const [repliesPage, setRepliesPage] = useState(1);
  const [hasMoreReplies, setHasMoreReplies] = useState(comment.totalReplies > 0);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Map backend field authorDetails to a consistent internal format if needed
  const author = comment.authorDetails || comment.author;
  const referencedUsername = comment.referencedUser?.username;
  const cleanedContent = (() => {
    if (!comment.content) return "";
    const trimmed = comment.content.trim();
    if (referencedUsername && trimmed.startsWith(`@${referencedUsername}`)) {
      return trimmed.replace(new RegExp(`^@${referencedUsername}\\s*`), "");
    }
    return trimmed;
  })();

  const toggleLike = async () => {
    try {
      const res = await api.post(`/comment/toggle-like/${comment._id}`);
      setIsLiked(res.data.isLiked);
      setLikesCount(prev => res.data.isLiked ? prev + 1 : prev - 1);
    } catch (err) {
      console.error("Error liking comment", err);
    }
  };

  const currentUser = useSelector((state) => state.auth.user);
  const [deleteComment] = useDeleteCommentMutation();

  const normalizeId = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (val._id) return String(val._id);
    if (val.id) return String(val.id);
    return null;
  };

  const currentUserId = normalizeId(currentUser);
  const commentAuthorId = normalizeId(author) || normalizeId(comment.author);

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await deleteComment({ commentId: comment._id, parent: comment.parent }).unwrap();
      const deletedCount = res?.deletedCount || 1;
      // notify post card to update count
      window.dispatchEvent(new CustomEvent('commentCountChanged', { detail: { postId, delta: -deletedCount } }));
    } catch (err) {
      console.error('Error deleting comment', err);
      alert(err?.data?.message || 'Failed to delete comment.');
    }
  };

  const fetchReplies = async () => {
    if (loadingReplies) return;
    setLoadingReplies(true);
    try {
      const res = await api.get(`/comment/get-replies/${postId}/${comment._id}/${repliesPage}`);
      // Backend returns { replies: [...] }
      const newReplies = res.data.replies;
      if (newReplies && Array.isArray(newReplies) && newReplies.length > 0) {
        setReplies(prev => [...prev, ...newReplies]);
        setRepliesPage(prev => prev + 1);
        if (newReplies.length < 25) setHasMoreReplies(false);
      } else {
        setHasMoreReplies(false);
      }
    } catch (err) {
      console.error("Error fetching replies", err);
      setHasMoreReplies(false);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleToggleReplies = () => {
    if (!showReplies && replies.length === 0) {
      fetchReplies();
    }
    setShowReplies(!showReplies);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between gap-3">
        {/* LEFT */}
        <div className="flex flex-1 gap-3">
          <img
            src={author?.profilePicture?.commentView || author?.profilePicture?.profileView || "https://i.pravatar.cc/150?img=50"}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">
                {author?.username || "user"}
              </h3>
              <span className="text-xs text-zinc-500">
                {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : "Just now"}
              </span>
            </div>

            <p className="mt-1 text-sm text-zinc-300">
              {referencedUsername && (
                <span className="mr-1 text-blue-400">@{referencedUsername}</span>
              )}
              {cleanedContent}
            </p>

            <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-zinc-500">
              <button onClick={() => onReply(comment)} className="hover:text-zinc-300">
                Reply
              </button>
              {currentUserId && commentAuthorId && String(currentUserId) === String(commentAuthorId) && (
                <button onClick={handleDelete} className="text-red-400 hover:text-red-200">
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col items-center">
          <button onClick={toggleLike}>
            <Heart
              size={14}
              className={`${isLiked ? "fill-red-500 text-red-500" : "text-zinc-500"}`}
            />
          </button>
          <span className="mt-0.5 text-[10px] text-zinc-500">
            {likesCount}
          </span>
        </div>
      </div>

      {/* REPLIES SECTION */}
      {(comment.totalReplies > 0 || replies.length > 0) && (
        <div className="ml-12">
          <button 
            onClick={handleToggleReplies}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-500 transition hover:text-zinc-300"
          >
            <div className="h-px w-6 bg-zinc-700" />
            {showReplies ? (
              <>Hide replies <ChevronUp size={14} /></>
            ) : (
              <>View replies ({comment.totalReplies || replies.length}) <ChevronDown size={14} /></>
            )}
          </button>

          {showReplies && (
            <div className="mt-4 space-y-4 border-l border-zinc-800 pl-4">
              {replies.map(reply => (
                <CommentItem 
                  key={reply._id || Math.random()} 
                  comment={reply} 
                  postId={postId} 
                  onReply={onReply}
                />
              ))}
              {hasMoreReplies && (
                <button 
                  onClick={fetchReplies}
                  className="mt-2 text-xs font-semibold text-zinc-500"
                >
                  {loadingReplies ? "Loading..." : "Load more replies"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function CommentsModal({ post, closeModal, commentsCount }) {
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [toast, setToast] = useState(null);
  const virtuosoRef = useRef(null);

  const { 
    data: commentsData, 
    isLoading, 
    isFetching 
  } = useGetCommentsQuery({ postId: post?._id, page });

  const [createComment, { isLoading: isPosting }] = useCreateCommentMutation();

  const handleAddComment = async () => {
    if (!input.trim() || isPosting) return;

    try {
      const payload = {
        content: input,
        postid: post._id,
      };

      if (replyTo) {
        payload.parent = replyTo.parent || replyTo._id; 
        payload.reference = (replyTo.authorDetails?._id || replyTo.author?._id || replyTo.author);
      }

      const res = await createComment(payload).unwrap();
      // notify post card to increment comment count
      window.dispatchEvent(new CustomEvent('commentCountChanged', { detail: { postId: post._id, delta: 1 } }));

      setInput("");
      setReplyTo(null);

      if (!replyTo && virtuosoRef.current) {
        virtuosoRef.current.scrollToIndex({ index: 0, align: 'start', behavior: 'smooth' });
      }
    } catch (err) {
      console.error("Error adding comment", err);
      if (err.response?.data?.message) {
        setToast({ message: err.response.data.message, type: "error" });
      } else {
        setToast({ message: "Failed to post comment.", type: "error" });
      }
      alert(err.data?.message || "Failed to post comment.");
    }
  };

  const handleReplyClick = useCallback((comment) => {
    setReplyTo(comment);
    const authorName = comment.authorDetails?.username || comment.author?.username || "user";
    setInput(``);
  }, []);

  const loadMore = useCallback(() => {
    const comments = commentsData?.comments || [];
    const hasMore = comments.length > 0 && (comments.length % 25 === 0);
    if (hasMore && !isFetching) {
      setPage(prev => prev + 1);
    }
  }, [commentsData, isFetching]);

  if (!post) return null;

  const comments = commentsData?.comments || [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
      {/* TOAST */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* MODAL */}
      <div className="animate-slideUp flex h-[80vh] w-full max-w-md flex-col rounded-t-3xl bg-black">
    <div 
      className="z-100 fixed inset-0 flex items-end justify-center overflow-hidden bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={closeModal}
    >
      <div 
        className="animate-slideUp sm:animate-zoomIn flex h-[85vh] w-full max-w-xl flex-col overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl sm:h-[70vh] sm:rounded-2xl lg:h-[80vh] lg:max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* MOBILE HANDLE */}
        <div className="flex justify-center border-b border-zinc-900 py-3 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-zinc-700" />
        </div>

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-zinc-900 bg-zinc-950 px-6 py-4">
            <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold tracking-tight text-white">Comments</h2>
            <div className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
              {typeof commentsCount === 'number' ? commentsCount : (post.totalComments || 0)}
            </div>
          </div>
          <button 
            onClick={closeModal}
            className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* COMMENTS LIST */}
        <div className="min-h-0 w-full flex-1 overflow-hidden">
          {isLoading && page === 1 ? (
            <div className="flex h-full animate-pulse flex-col items-center justify-center gap-3">
               <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
               <p className="text-sm font-medium text-zinc-500">Fetching conversation...</p>
            </div>
          ) : comments.length > 0 ? (
            <Virtuoso
              ref={virtuosoRef}
              data={comments}
              className="h-full w-full"
              endReached={loadMore}
              increaseViewportBy={400}
              itemContent={(index, comment) => (
                <div className="px-4 pb-6 pt-2 sm:px-6">
                  <CommentItem 
                    comment={comment} 
                    postId={post._id}
                    onReply={handleReplyClick}
                  />
                </div>
              )}
              components={{
                Footer: () => isFetching && (
                  <div className="flex justify-center py-6">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
                  </div>
                )
              }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center space-y-4 px-10 text-zinc-500">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-zinc-800/50 bg-zinc-900/50">
                <MessageCircle size={36} className="text-zinc-700" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-xl font-bold text-white">No comments yet</p>
                <p className="max-w-62.5 text-sm text-zinc-500">Start the conversation by sharing your thoughts on this post.</p>
              </div>
            </div>
          )}
        </div>

        {/* INPUT SECTION */}
        <div className="border-t border-zinc-900 bg-zinc-950 p-4 sm:rounded-b-2xl sm:p-6">
          <CommentInput 
            input={input}
            setInput={setInput}
            onSend={handleAddComment}
            replyTo={replyTo}
            onClearReply={() => { setReplyTo(null); setInput(""); }}
            isDisabled={isPosting}
          />
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}
