import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  X,
  Copy,
  MessageCircle,
  Send,
  Share2,
  Check,
} from "lucide-react";

const ShareProfileModal = ({ profile, onClose }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!profile) return null;

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : `https://momentia.com/profile/${profile._id || profile.username}`;

  const shareText = profile?.name
    ? `Check out my profile on Momentia: ${profile.name}`
    : `Check out this profile on Momentia`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Profile link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name}'s Momentia Profile`,
          text: shareText,
          url: profileUrl,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
        }
      }
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `${shareText}\n\n${profileUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleTelegram = () => {
    const message = encodeURIComponent(
      `${shareText}\n\n${profileUrl}`
    );
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${message}`,
      "_blank"
    );
  };

  const handleShareToMomentia = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Profile link copied successfully");
      navigate("/messages", {
        state: {
          shareProfile: profileUrl,
          sharedUsername: profile.username,
        },
      });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to share via Momentia");
    }
  };

  const handleTwitter = () => {
    const tweetText = encodeURIComponent(
      `${shareText} ${profileUrl}`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${tweetText}`,
      "_blank"
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900">Share Profile</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Profile Preview */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
              {profile?.profilePicture?.profileView ? (
                <img
                  src={profile.profilePicture.profileView}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                  {profile?.name?.[0]}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {profile?.name}
              </h3>
              <p className="text-sm text-gray-600">@{profile?.username}</p>
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="p-6">
          <div className="mb-4 rounded-xl bg-blue-50 p-3">
            <p className="text-xs text-gray-600">Share link:</p>
            <p className="truncate text-sm font-medium text-blue-600">
              {profileUrl}
            </p>
          </div>

          <div className="space-y-3">
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
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

            {/* Native Share (Mobile) */}
            {navigator.share && (
              <button
                onClick={handleNativeShare}
                className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 font-semibold text-white transition hover:shadow-lg"
              >
                <Share2 size={20} />
                Share via System
              </button>
            )}

            <button
              onClick={handleShareToMomentia}
              className="flex w-full items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              <MessageCircle size={20} />
              Share in Momentia Messages
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#25D366] px-4 py-3 font-semibold text-white transition hover:bg-[#22BE55]"
            >
              <MessageCircle size={20} />
              Share on WhatsApp
            </button>

            {/* Telegram */}
            <button
              onClick={handleTelegram}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#0088cc] px-4 py-3 font-semibold text-white transition hover:bg-[#0077b5]"
            >
              <Send size={20} />
              Share on Telegram
            </button>

            {/* Twitter/X */}
            <button
              onClick={handleTwitter}
              className="flex w-full items-center gap-3 rounded-2xl bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-900"
            >
              <Share2 size={20} />
              Share on Twitter/X
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="mt-4 w-full rounded-2xl border border-gray-200 px-4 py-3 font-semibold text-gray-900 transition hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareProfileModal;
