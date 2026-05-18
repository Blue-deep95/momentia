import React, { useState } from "react";
import { Heart, ChevronDown, ChevronUp } from "lucide-react";
import { useToggleLikeMutation, useGetRepliesQuery } from "../slices/commentApi";

const CommentItem = ({ comment, postId, onReply }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [repliesPage, setRepliesPage] = useState(1);
  
  const [toggleLike] = useToggleLikeMutation();
  
  const { 
    data: repliesData, 
    isFetching: loadingReplies,
  } = useGetRepliesQuery(
    { postId, parentId: comment._id, page: repliesPage },
    { skip: !showReplies }
  );

  const author = comment.authorDetails || comment.author;
  const hasMoreReplies = repliesData?.replies?.length > 0 && (repliesData.replies.length % 25 === 0);

  const handleToggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const handleLoadMoreReplies = (e) => {
    e.stopPropagation();
    setRepliesPage(prev => prev + 1);
  };

  return (
    <div className="flex flex-col gap-3 w-full overflow-hidden">
      <div className="flex justify-between gap-3 w-full">
        {/* LEFT SECTION: AVATAR + CONTENT */}
        <div className="flex gap-3 flex-1 min-w-0">
          <img
            src={author?.profilePicture?.commentView || author?.profilePicture?.profileView || "https://i.pravatar.cc/150?img=50"}
            alt=""
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-white truncate max-w-[120px] sm:max-w-none">
                {author?.username || "user"}
              </h3>
              <span className="text-[11px] text-zinc-500 whitespace-nowrap">
                {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : "Just now"}
              </span>
            </div>
            
            <p className="text-sm text-zinc-300 mt-1 break-words leading-relaxed overflow-hidden">
              {comment.referencedUser?.username && (
                <span className="text-blue-400 font-medium mr-1.5">@{comment.referencedUser.username}</span>
              )}
              {comment.content}
            </p>

            <div className="flex items-center gap-4 mt-2.5 text-[11px] text-zinc-500 font-bold uppercase tracking-tight">
              <button 
                onClick={() => onReply(comment)} 
                className="hover:text-white transition-colors"
              >
                Reply
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: LIKES */}
        <div className="flex flex-col items-center min-w-[40px] flex-shrink-0 pt-1">
          <button 
            onClick={() => toggleLike({ commentId: comment._id, postId })}
            className="p-1.5 hover:bg-zinc-800 rounded-full transition-all active:scale-90 group"
          >
            <Heart
              size={18}
              className={`transition-colors ${comment.isLiked ? "fill-red-500 text-red-500" : "text-zinc-500 group-hover:text-zinc-300"}`}
            />
          </button>
          <span className="text-[11px] text-zinc-500 font-medium mt-0.5">
            {comment.totalLikes || 0}
          </span>
        </div>
      </div>

      {/* REPLIES SECTION */}
      {(comment.totalReplies > 0) && (
        <div className="ml-8 sm:ml-12 border-l border-zinc-900 pl-4">
          <button 
            onClick={handleToggleReplies}
            className="flex items-center gap-3 text-xs text-zinc-500 font-bold hover:text-zinc-300 transition-colors py-1"
          >
            <div className="w-6 h-[1px] bg-zinc-800" />
            {showReplies ? (
              <>Hide replies <ChevronUp size={14} /></>
            ) : (
              <>View replies ({comment.totalReplies}) <ChevronDown size={14} /></>
            )}
          </button>

          {showReplies && (
            <div className="mt-4 space-y-6">
              {repliesData?.replies?.map(reply => (
                <CommentItem 
                  key={reply._id} 
                  comment={reply} 
                  postId={postId} 
                  onReply={onReply}
                />
              ))}
              
              {loadingReplies && (
                <div className="flex justify-center py-2">
                  <div className="w-4 h-4 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
                </div>
              )}
              
              {hasMoreReplies && !loadingReplies && (
                <button 
                  onClick={handleLoadMoreReplies}
                  className="text-[11px] text-zinc-500 font-bold hover:text-white transition-colors mt-2 pl-9"
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
