import React from "react";
import { X } from "lucide-react";
import { useSelector } from "react-redux";

const CommentInput = ({ input, setInput, onSend, replyTo, onClearReply, isDisabled }) => {
  const { user } = useSelector(state => state.auth);

  return (
    <div className="border-t border-zinc-800 px-4 py-3 bg-black">
      {replyTo && (
        <div className="flex justify-between items-center mb-2 px-2 py-1 bg-zinc-900 rounded text-xs text-zinc-400">
          <span>Replying to @{replyTo.authorDetails?.username || replyTo.author?.username || "user"}</span>
          <button onClick={onClearReply}>
            <X size={14} />
          </button>
        </div>
      )}
      
      <div className="flex items-center gap-3">
        <img
          src={user?.profilePicture?.commentView || user?.profilePicture?.profileView || "https://i.pravatar.cc/150?img=60"}
          alt=""
          className="w-9 h-9 rounded-full object-cover"
        />

        <div className="flex-1 bg-zinc-900 rounded-full px-4 py-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSend()}
            className="w-full bg-transparent outline-none text-white text-sm"
          />
        </div>

        <button
          onClick={onSend}
          disabled={isDisabled || !input.trim()}
          className={`font-semibold ${input.trim() ? "text-blue-500" : "text-blue-900 cursor-not-allowed"}`}
        >
          Post
        </button>
      </div>
    </div>
  );
};

export default CommentInput;
