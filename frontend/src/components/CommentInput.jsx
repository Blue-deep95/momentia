import React from "react";
import { X } from "lucide-react";
import { useSelector } from "react-redux";

const CommentInput = ({ input, setInput, onSend, replyTo, onClearReply, isDisabled }) => {
  const { user } = useSelector(state => state.auth);

  return (
    <div className="border-t border-gray-100 px-4 py-3 bg-white">
      {replyTo && (
        <div className="flex justify-between items-center mb-2 px-3 py-1.5 bg-blue-50/50 rounded-lg text-[11px] font-bold text-blue-500 uppercase tracking-tight">
          <span>Replying to @{replyTo.authorDetails?.username || replyTo.author?.username || "user"}</span>
          <button onClick={onClearReply} className="hover:text-blue-700">
            <X size={14} />
          </button>
        </div>
      )}
      
      <div className="flex items-center gap-3">
        <img
          src={user?.profilePicture?.commentView || user?.profilePicture?.profileView || "https://i.pravatar.cc/150?img=60"}
          alt=""
          className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
        />

        <div className="flex-1 bg-gray-100/80 rounded-2xl px-4 py-2.5 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
          <input
            type="text"
            placeholder="Add a comment..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSend()}
            className="w-full bg-transparent outline-none text-gray-900 text-sm placeholder:text-gray-400 font-medium"
          />
        </div>

        <button
          onClick={onSend}
          disabled={isDisabled || !input.trim()}
          className={`text-sm font-black transition-all ${input.trim() ? "text-blue-500 hover:text-blue-600 scale-105" : "text-gray-300 cursor-not-allowed"}`}
        >
          Post
        </button>
      </div>
    </div>
  );
};

export default CommentInput;
