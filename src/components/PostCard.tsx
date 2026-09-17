import React, { useState, useEffect } from "react";
import { Post, User } from "../types";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MapPin,
  Music2,
  Send,
  MoreHorizontal,
  Sparkles,
  Globe,
  Check,
  Clock,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  EyeOff,
  Zap,
  Loader2,
} from "lucide-react";
import { FILTER_PRESETS } from "../data/filters";
import confetti from "canvas-confetti";
import { VerifiedBadge } from "./VerifiedBadge";
import { api } from "../services/api";

interface PostCardProps {
  post: Post;
  currentUser: User;
  onLike: (postId: string) => void;
  onComment: (postId: string, text: string, nepaliText?: string) => void;
  onSave: (postId: string) => void;
  onTagClick?: (tag: string) => void;
  onLocationClick?: (location: string, district: string) => void;
  onUserClick?: (userId: string) => void;
  onBoostClick?: (post: Post) => void;
  language: "en" | "ne";
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  onLike,
  onComment,
  onSave,
  onTagClick,
  onLocationClick,
  onUserClick,
  onBoostClick,
  language,
}) => {
  const [commentInput, setCommentInput] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [showNepaliCaption, setShowNepaliCaption] = useState(language === "ne");
  const [copiedLink, setCopiedLink] = useState(false);
  const [doubleTapHeart, setDoubleTapHeart] = useState(false);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (post.verificationStatus !== "pending") return 0;
    if (post.verificationTargetAt) {
      const diff = Math.ceil((new Date(post.verificationTargetAt).getTime() - Date.now()) / 1000);
      return Math.max(0, diff);
    }
    return 60;
  });

  useEffect(() => {
    if (post.verificationStatus !== "pending") return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [post.verificationStatus]);

  const isLiked = post.likes.includes(currentUser.id);
  const isSaved = post.savedBy.includes(currentUser.id);
  const filterPreset = FILTER_PRESETS.find((f) => f.id === post.filter);

  const handleDoubleTap = () => {
    if (!isLiked) {
      onLike(post.id);
    }
    setDoubleTapHeart(true);
    confetti({
      particleCount: 20,
      spread: 50,
      origin: { y: 0.7 },
      colors: ["#DC143C", "#003893"],
    });
    setTimeout(() => setDoubleTapHeart(false), 800);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onComment(post.id, commentInput.trim());
    setCommentInput("");
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <article
      id={`post-card-${post.id}`}
      className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-3xl border shadow-xs mb-6 overflow-hidden transition-all duration-200 hover:shadow-sm ${
        post.verificationStatus === "rejected"
          ? "border-rose-300 dark:border-rose-900 ring-2 ring-rose-200/50 dark:ring-rose-900/30 bg-rose-50/10"
          : post.verificationStatus === "pending"
          ? "border-amber-300 dark:border-amber-900 ring-2 ring-amber-200/40 dark:ring-amber-900/30"
          : "border-slate-200/90 dark:border-slate-800 hover:border-slate-300/90 dark:hover:border-slate-700"
      }`}
    >
      {/* Safety Verification Pending (Shown only to the author while processing) */}
      {post.verificationStatus === "pending" && post.userId === currentUser.id && (
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 flex items-center gap-2 text-xs text-amber-900">
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
          <div>
            <span className="font-bold">Under safety review: </span>
            <span className="text-amber-800">
              Scanning image for Nepal Community Guidelines (~{remainingSeconds}s remaining).
            </span>
          </div>
        </div>
      )}

      {/* Safety Rejection Alert (Prohibited Content - Author/Super Admin only) */}
      {post.verificationStatus === "rejected" && (post.userId === currentUser.id || currentUser.isSuperAdmin) && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 flex items-start gap-2.5 text-xs text-rose-900">
          <ShieldAlert className="w-4 h-4 text-[#DC143C] shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-[#DC143C] flex items-center gap-1.5">
              <span>Photo Hidden from Public Feed</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-200 text-rose-800 font-mono">
                Policy Notice
              </span>
            </div>
            <p className="text-rose-800 mt-0.5 leading-relaxed">
              Reason: <strong>{post.rejectionReason || "Prohibited content detected"}</strong>.
              This photo is hidden from public feeds and only visible to you.
            </p>
          </div>
        </div>
      )}

      {/* Header: User & Location Tag */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onUserClick && onUserClick(post.userId)}
            className="relative cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#003893] to-[#DC143C] group-hover:scale-105 transition-transform">
              <img
                src={post.userAvatar}
                alt={post.username}
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
          </button>

          <div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onUserClick && onUserClick(post.userId)}
                className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-[#003893] dark:hover:text-blue-400 transition-colors leading-tight flex items-center gap-1.5"
              >
                <span>{post.username}</span>
                {(post.isVerified || post.userId === "user_deepak" || post.userId === "user_dikshya" || post.userId === "user_kiran") && (
                  <VerifiedBadge
                    category={post.userVerificationCategory || (post.userId === "user_kiran" ? "businessman" : "creator")}
                    badgeTitle={post.userVerifiedBadgeTitle}
                    size="xs"
                  />
                )}
              </button>
            </div>

            {/* Location Tag */}
            {post.location && (
              <button
                onClick={() => onLocationClick && onLocationClick(post.location, post.district)}
                className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-[#DC143C] transition-colors mt-0.5 leading-tight font-medium"
              >
                <MapPin className="w-3 h-3 text-[#DC143C] flex-shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-xs">{post.location}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                  {post.district}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Music or Category Badge & Boosted Indicator */}
        <div className="flex items-center gap-2">
          {post.isBoosted && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-blue-500/15 border border-amber-400/50 text-[11px] font-bold text-amber-900 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse flex-shrink-0" />
              <span className="hidden sm:inline">
                {post.boostTarget?.scope === "city"
                  ? `Boosted in ${post.boostTarget.targetCity || post.city || post.district}`
                  : post.boostTarget?.scope === "district"
                  ? `Boosted in ${post.boostTarget.targetDistrict || post.district} Dist.`
                  : "Boosted in Nepal 🇳🇵"}
              </span>
              <span className="sm:hidden">Boosted 🇳🇵</span>
            </div>
          )}

          {post.musicTrack && (
            <div
              className="hidden sm:flex items-center gap-1 px-2 py-0.8 rounded-full bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono max-w-[140px] truncate"
              title={post.musicTrack}
            >
              <Music2 className="w-3 h-3 text-[#003893] flex-shrink-0" />
              <span className="truncate">{post.musicTrack.split("-")[0]}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative bg-slate-950 flex items-center justify-center overflow-hidden select-none cursor-pointer group"
        onDoubleClick={post.verificationStatus === "rejected" ? undefined : handleDoubleTap}
      >
        <img
          src={post.imageUrl}
          alt={post.caption}
          style={{ filter: filterPreset?.cssFilter || "none" }}
          className={`w-full max-h-[580px] object-cover transition-transform duration-300 group-hover:scale-[1.005] ${
            post.verificationStatus === "rejected" ? "blur-2xl opacity-30 grayscale scale-105" : ""
          }`}
          loading="lazy"
        />

        {/* Rejected Safety Overlay */}
        {post.verificationStatus === "rejected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/60 backdrop-blur-xs text-white">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/90 text-white flex items-center justify-center shadow-lg mb-3">
              <EyeOff className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-rose-200">Sensitive & Prohibited Media Redacted</h4>
            <p className="text-xs text-slate-300 max-w-xs mt-1">
              Violated Community Guidelines: {post.rejectionReason || "Nudity / Bullying detected"}.
            </p>
            <div className="mt-3 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-[10px] text-rose-300 font-mono">
              Not shown in user profile • Reported to Super Admin
            </div>
          </div>
        )}

        {/* Optional filter overlay */}
        {filterPreset?.overlayClass && post.verificationStatus !== "rejected" && (
          <div className={`absolute inset-0 pointer-events-none ${filterPreset.overlayClass}`} />
        )}

        {/* Double tap heart animation */}
        {doubleTapHeart && post.verificationStatus !== "rejected" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-in duration-200">
            <Heart className="w-24 h-24 text-[#DC143C] fill-[#DC143C] drop-shadow-2xl animate-pulse" />
          </div>
        )}

        {/* Active filter badge in corner */}
        {filterPreset && filterPreset.id !== "normal" && post.verificationStatus !== "rejected" && (
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold tracking-wider font-mono">
            {filterPreset.name}
          </div>
        )}
      </div>

      {/* Action Buttons & Interactions */}
      <div className="p-3.5 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <button
              id={`like-btn-${post.id}`}
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 text-sm font-semibold transition-all active:scale-90 cursor-pointer ${
                isLiked ? "text-[#DC143C]" : "text-slate-700 dark:text-slate-300 hover:text-[#DC143C]"
              }`}
            >
              <Heart
                className={`w-6 h-6 transition-transform ${
                  isLiked ? "fill-[#DC143C] scale-110" : ""
                }`}
              />
              <span className="font-mono text-sm">{post.likes.length}</span>
            </button>

            {/* Comment Button */}
            <button
              id={`comment-btn-${post.id}`}
              onClick={() => setShowAllComments(!showAllComments)}
              className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-[#003893] dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="font-mono text-sm">{post.comments.length}</span>
            </button>

            {/* Share Link Button */}
            <button
              id={`share-btn-${post.id}`}
              onClick={handleShare}
              className="text-slate-700 dark:text-slate-300 hover:text-[#003893] dark:hover:text-blue-400 transition-colors cursor-pointer"
              title="Share photo link"
            >
              {copiedLink ? (
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-50" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Boost Post Button */}
            {onBoostClick && (
              <button
                id={`boost-post-btn-${post.id}`}
                onClick={() => onBoostClick(post)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  post.isBoosted
                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-200"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-800 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 hover:border-amber-300"
                }`}
                title="Boost post City-wise, District-wise, or across Nepal"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px]">{post.isBoosted ? "Boosted" : "Boost"}</span>
              </button>
            )}

            {/* Bookmark / Save to Bucket */}
            <button
              id={`save-btn-${post.id}`}
              onClick={() => onSave(post.id)}
              className={`p-1 transition-all active:scale-90 cursor-pointer ${
                isSaved ? "text-[#003893] dark:text-blue-400" : "text-slate-700 dark:text-slate-300 hover:text-[#003893] dark:hover:text-blue-400"
              }`}
              title="Save to Nepali Bucket"
            >
              <Bookmark className={`w-6 h-6 ${isSaved ? "fill-[#003893] dark:fill-blue-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Captions (English & Nepali Toggle) */}
        <div className="space-y-1.5 text-sm text-slate-800 dark:text-slate-200">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 mr-2">{post.username}</span>

              {showNepaliCaption && post.nepaliCaption ? (
                <span className="font-['Mukta'] text-slate-900 dark:text-slate-100 text-base font-medium leading-relaxed">
                  {post.nepaliCaption}
                </span>
              ) : (
                <span className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                  {post.caption}
                </span>
              )}
            </div>

            {/* Dual Language Caption Switcher Pill */}
            {post.nepaliCaption && (
              <button
                onClick={() => setShowNepaliCaption(!showNepaliCaption)}
                className="flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full font-bold border border-slate-200 dark:border-slate-700 hover:border-[#DC143C] text-slate-600 dark:text-slate-300 hover:text-[#DC143C] transition-colors flex items-center gap-1 cursor-pointer bg-slate-50 dark:bg-slate-800"
                title="Toggle Nepali / English Caption"
              >
                <Globe className="w-3 h-3 text-[#003893] dark:text-blue-400" />
                <span>{showNepaliCaption ? "English" : "नेपाली"}</span>
              </button>
            )}
          </div>

          {/* Hashtags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {post.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagClick && onTagClick(tag)}
                  className="text-xs font-semibold text-[#003893] dark:text-blue-400 hover:text-[#DC143C] transition-colors cursor-pointer"
                >
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          {post.comments.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {/* Show either last comment or all comments */}
              {(showAllComments ? post.comments : post.comments.slice(-2)).map((c) => (
                <div key={c.id} className="text-xs flex items-baseline justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 mr-1.5">{c.username}</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {c.nepaliText && showNepaliCaption ? c.nepaliText : c.text}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                    {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}

              {post.comments.length > 2 && !showAllComments && (
                <button
                  onClick={() => setShowAllComments(true)}
                  className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-[#003893] dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  View all {post.comments.length} comments...
                </button>
              )}
            </div>
          )}

          {/* Real-time Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 mt-2">
            <img
              src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
              alt={currentUser?.fullName || "User"}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
            />
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Add a comment... (e.g. धेरै राम्रो! / Beautiful shot)"
              className="flex-1 text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-full focus:outline-none focus:border-[#003893] focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-slate-200"
            />
            <button
              type="submit"
              disabled={!commentInput.trim()}
              className="px-3 py-1 text-xs font-bold text-[#003893] dark:text-blue-400 hover:text-[#DC143C] disabled:opacity-40 transition-colors cursor-pointer"
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </article>
  );
};
