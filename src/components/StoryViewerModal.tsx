import React, { useState, useEffect } from "react";
import { Story, User } from "../types";
import { X, Heart, Send, MapPin, Music2, Eye } from "lucide-react";
import confetti from "canvas-confetti";

interface StoryViewerModalProps {
  story: Story | null;
  currentUser: User;
  onClose: () => void;
  onLikeStory?: (storyId: string) => void;
  onSendReaction?: (storyId: string, emoji: string) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  story,
  currentUser,
  onClose,
  onLikeStory,
  onSendReaction,
}) => {
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (!story) return;
    setProgress(0);
    setLiked(story.likes.includes(currentUser.id));

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          onClose();
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [story]);

  if (!story) return null;

  const handleHeartClick = () => {
    setLiked(!liked);
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#DC143C", "#003893", "#f59e0b"],
    });
    if (onLikeStory) onLikeStory(story.id);
  };

  const handleEmojiClick = (emoji: string) => {
    if (onSendReaction) onSendReaction(story.id, emoji);
    confetti({
      particleCount: 15,
      spread: 40,
      origin: { y: 0.85 },
    });
  };

  return (
    <div
      id="story-viewer-modal"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm sm:max-w-md h-full sm:h-[85vh] max-h-[750px] bg-slate-950 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-800">
        {/* Top Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1.5">
          <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Story Header */}
        <div className="absolute top-6 left-3 right-3 z-20 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <img
              src={story.userAvatar}
              alt={story.username}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-[#DC143C]"
            />
            <div>
              <div className="text-sm font-bold flex items-center gap-1 drop-shadow-md">
                <span>{story.username}</span>
                <span className="text-[10px] text-emerald-400 font-medium">● 24h</span>
              </div>
              {story.location && (
                <div className="flex items-center gap-1 text-[11px] text-slate-200 drop-shadow-sm">
                  <MapPin className="w-3 h-3 text-[#DC143C]" />
                  <span>{story.location}</span>
                </div>
              )}
            </div>
          </div>

          <button
            id="close-story-viewer-btn"
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Main Image */}
        <div className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden">
          <img
            src={story.imageUrl}
            alt={story.caption || "Nepali Story"}
            className="w-full h-full object-cover"
          />

          {/* Gradient Shadows for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

          {/* Ambient Music & Caption */}
          <div className="absolute bottom-20 left-4 right-4 text-white z-10">
            {/* Music sticker */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-xs text-white mb-2 shadow-sm">
              <Music2 className="w-3.5 h-3.5 text-rose-400 animate-spin" style={{ animationDuration: "6s" }} />
              <span className="font-mono text-[11px] truncate max-w-[200px]">
                Nepali Mountain Rhythms 🎶
              </span>
            </div>

            {story.caption && (
              <p className="text-sm font-medium text-white/95 drop-shadow-md leading-snug">
                {story.caption}
              </p>
            )}
          </div>
        </div>

        {/* Bottom Interaction Bar */}
        <div className="p-3 bg-black/60 backdrop-blur-md flex flex-col gap-2 z-20 border-t border-white/10">
          {/* Quick Nepali Reactions */}
          <div className="flex items-center justify-around py-1 text-lg">
            {["🇳🇵", "🏔️", "❤️", "🙏", "🔥", "🥟"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="hover:scale-125 transition-transform active:scale-95 cursor-pointer p-1"
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Send message to story..."
              className="flex-1 px-3.5 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-rose-400"
            />
            <button
              onClick={handleHeartClick}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                liked ? "text-[#DC143C] bg-rose-500/20" : "text-white hover:text-rose-400"
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
