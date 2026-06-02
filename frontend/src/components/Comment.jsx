// CommentsModal.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, MessageCircle } from "lucide-react";
import { Virtuoso } from "react-virtuoso";
import CommentInput from "./CommentInput.jsx";
import CommentItem from "./CommentItem.jsx";
import { useGetCommentsQuery, useCreateCommentMutation } from "../slices/commentApi.js";

// Toast Component
const Toast = ({ message, type = "error", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-[70] p-4 rounded-2xl shadow-xl text-white transition-all duration-300 border-2 ${
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
        payload.referenceComment = replyTo._id;
      }

      const res = await createComment(payload).unwrap();
      window.dispatchEvent(new CustomEvent('commentCountChanged', { detail: { postId: post._id, delta: 1 } }));

      setInput("");
      setReplyTo(null);

      if (!replyTo && virtuosoRef.current) {
        virtuosoRef.current.scrollToIndex({ index: 0, align: 'start', behavior: 'smooth' });
      }
    } catch (err) {
      console.error("Error adding comment", err);
      setToast({ message: err.data?.message || "Failed to post comment.", type: "error" });
    }
  };

  const handleReplyClick = useCallback((comment) => {
    setReplyTo(comment);
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
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] p-0 sm:items-center sm:p-4"
      onClick={closeModal}
    >
      {/* TOAST */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* MODAL CONTAINER */}
      <div 
        className="animate-slideUp sm:animate-zoomIn flex h-[85vh] w-full max-w-xl flex-col overflow-hidden bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] sm:h-[70vh] sm:rounded-3xl lg:h-[80vh] lg:max-w-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* MOBILE HANDLE */}
        <div className="flex justify-center py-3 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-gray-200" />
        </div>

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-50 bg-white px-6 py-5">
            <div className="flex items-center gap-3">
            <h2 className="text-xl font-black tracking-tight text-gray-900">Comments</h2>
            <div className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-black text-gray-500 uppercase tracking-wider">
              {typeof commentsCount === 'number' ? commentsCount : (post.totalComments || 0)}
            </div>
          </div>
          <button 
            onClick={closeModal}
            className="rounded-full p-2 text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        {/* COMMENTS LIST */}
        <div className="min-h-0 w-full flex-1 overflow-hidden bg-white">
          {isLoading && page === 1 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
               <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-100 border-t-blue-500" />
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading conversation</p>
            </div>
          ) : comments.length > 0 ? (
            <Virtuoso
              ref={virtuosoRef}
              data={comments}
              className="h-full w-full"
              endReached={loadMore}
              increaseViewportBy={400}
              itemContent={(index, comment) => (
                <div className="px-6 py-4 sm:px-8">
                  <CommentItem 
                    comment={comment} 
                    postId={post._id}
                    onReply={handleReplyClick}
                  />
                </div>
              )}
              components={{
                Footer: () => isFetching && (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-100 border-t-blue-500" />
                  </div>
                )
              }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center space-y-6 px-10">
              <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gray-50 border border-gray-100 rotate-12 shadow-sm">
                <MessageCircle size={40} className="text-gray-300 -rotate-12" />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-2xl font-black text-gray-900">No comments yet</p>
                <p className="max-w-[240px] text-sm text-gray-400 font-medium">Be the first to share your thoughts and start the conversation!</p>
              </div>
            </div>
          )}
        </div>

        {/* INPUT SECTION */}
        <div className="border-t border-gray-50 bg-white p-4 sm:p-6 mt-auto">
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
  );
}
