import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Heart, ChevronDown, ChevronUp } from "lucide-react";
import { 
  useToggleLikeMutation, 
  useGetRepliesQuery, 
  useDeleteCommentMutation 
} from "../slices/commentApi";

/**
 * CommentItem component represents a single comment or reply.
 * It is recursively structured to render its own replies using the RTK Query cache.
 */
const CommentItem = ({ comment, postId, onReply }) => {
  // Local state to toggle visibility of nested replies
  const [showReplies, setShowReplies] = useState(false);
  // Local state to track current pagination page for child replies
  const [repliesPage, setRepliesPage] = useState(1);
  
  // RTK Query Mutations
  const [toggleLike] = useToggleLikeMutation();
  const [deleteComment] = useDeleteCommentMutation();
  
  // Get active user from the Redux store to authorize comment deletion
  const currentUser = useSelector((state) => state.auth.user);

  // RTK Query: Fetch replies under this parent comment.
  // The query is skipped (skip: !showReplies) until the user expands the replies section.
  const { 
    data: repliesData, 
    isFetching: loadingReplies,
  } = useGetRepliesQuery(
    { postId, parentId: comment._id, page: repliesPage },
    { skip: !showReplies }
  );

  // Helper variables for author detail resolution
  const author = comment.authorDetails || comment.author;
  const referencedUsername = comment.referencedUser?.username;

  // Normalization helper for checking user IDs
  const normalizeId = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (val._id) return String(val._id);
    if (val.id) return String(val.id);
    return null;
  };

  const currentUserId = normalizeId(currentUser);
  const commentAuthorId = normalizeId(author) || normalizeId(comment.author);

  // Logic to clean the comment content:
  // If the content starts with the '@username' handle of the referenced user,
  // we strip it to avoid displaying the username handle twice.
  const cleanedContent = (() => {
    if (!comment.content) return "";
    const trimmed = comment.content.trim();
    if (referencedUsername && trimmed.startsWith(`@${referencedUsername}`)) {
      return trimmed.replace(new RegExp(`^@${referencedUsername}\\s*`), "");
    }
    return trimmed;
  })();

  // Handlers
  const handleLike = () => {
    // Pass the commentId, postId, and optional parentId (comment.parent)
    // to allow the query to patch the correct cache slice (comments list vs replies list)
    toggleLike({ 
      commentId: comment._id, 
      postId, 
      parentId: comment.parent 
    });
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const res = await deleteComment({ 
        commentId: comment._id, 
        parent: comment.parent 
      }).unwrap();
      
      const deletedCount = res?.deletedCount || 1;
      // Dispatch custom window event to sync comment counts in external elements (like the feed)
      window.dispatchEvent(
        new CustomEvent("commentCountChanged", { 
          detail: { postId, delta: -deletedCount } 
        })
      );
    } catch (err) {
      console.error("Error deleting comment", err);
      alert(err?.data?.message || "Failed to delete comment.");
    }
  };

  const handleToggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const handleLoadMoreReplies = (e) => {
    e.stopPropagation();
    setRepliesPage((prev) => prev + 1);
  };

  // Determine if there are more replies to fetch based on count
  const hasMoreReplies = 
    repliesData?.replies?.length > 0 && 
    (repliesData.replies.length % 25 === 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between gap-3">
        {/* LEFT: AVATAR & CONTENT */}
        <div className="flex gap-3 flex-1 min-w-0">
          <img
            src={
              author?.profilePicture?.commentView || 
              author?.profilePicture?.profileView || 
              "/default-avatar.svg"
            }
            alt=""
            className="w-9 h-9 rounded-full object-cover border border-gray-100 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            {/* Author info & Created date */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-gray-900 truncate">
                {author?.username || "user"}
              </h3>
              <span className="text-[10px] text-gray-400 font-medium">
                {comment.createdAt 
                  ? new Date(comment.createdAt).toLocaleDateString() 
                  : "Just now"}
              </span>
            </div>
            
            {/* Comment message content */}
            <p className="mt-0.5 text-sm text-gray-700 leading-snug break-words">
              {referencedUsername && (
                <span className="mr-1 font-bold text-blue-600">
                  @{referencedUsername}
                </span>
              )}
              {cleanedContent}
            </p>

            {/* Actions: Reply and Delete (if authorized) */}
            <div className="mt-2 flex items-center gap-4 text-[11px] font-bold text-gray-400">
              <button 
                onClick={() => onReply(comment)} 
                className="hover:text-gray-900 transition-colors"
              >
                Reply
              </button>
              {currentUserId && commentAuthorId && String(currentUserId) === String(commentAuthorId) && (
                <button 
                  onClick={handleDelete} 
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: LIKES TRIGGER */}
        <div className="flex flex-col items-center flex-shrink-0">
          <button 
            onClick={handleLike}
            className="transition-transform active:scale-95"
          >
            <Heart
              size={14}
              className={`${
                comment.isLiked 
                  ? "fill-red-500 text-red-500" 
                  : "text-gray-300 hover:text-gray-400"
              }`}
            />
          </button>
          <span className="mt-0.5 text-[10px] font-bold text-gray-400">
            {comment.totalLikes || 0}
          </span>
        </div>
      </div>

      {/* REPLIES LIST (Nested recursive calls) */}
      {(comment.totalReplies > 0 || (repliesData?.replies?.length > 0)) && (
        <div className="ml-8 sm:ml-12">
          {/* Toggle trigger */}
          <button 
            onClick={handleToggleReplies}
            className="flex items-center gap-2 text-[11px] font-bold text-gray-400 transition hover:text-gray-600 py-1"
          >
            <div className="h-px w-6 bg-gray-200" />
            {showReplies ? (
              <>Hide replies <ChevronUp size={14} /></>
            ) : (
              <>
                View replies ({comment.totalReplies || repliesData?.replies?.length || 0}) 
                <ChevronDown size={14} />
              </>
            )}
          </button>

          {/* Render replies recursively */}
          {showReplies && (
            <div className="mt-4 space-y-4 border-l-2 border-gray-50 pl-4">
              {repliesData?.replies?.map((reply, index) => (
                <CommentItem 
                  key={reply._id || index} 
                  comment={reply} 
                  postId={postId} 
                  onReply={onReply}
                />
              ))}
              
              {loadingReplies && (
                <div className="flex justify-center py-2">
                  <div className="w-4 h-4 border-2 border-gray-100 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}
              
              {hasMoreReplies && !loadingReplies && (
                <button 
                  onClick={handleLoadMoreReplies}
                  className="mt-2 text-[11px] font-bold text-blue-500 hover:text-blue-600"
                >
                  Load more replies
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
