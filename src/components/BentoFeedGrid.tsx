import React, { useState } from "react";
import { Post, User, Story, Community, LocationItem } from "../types";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MapPin,
  Music2,
  Sparkles,
  Flame,
  Globe,
  Compass,
  Users,
  Check,
  TrendingUp,
  Camera,
  Layers,
  Grid3X3,
  List,
} from "lucide-react";
import { FILTER_PRESETS } from "../data/filters";
import confetti from "canvas-confetti";

interface BentoFeedGridProps {
  posts: Post[];
  stories: Story[];
  currentUser: User;
  communities: Community[];
  locations: LocationItem[];
  onLike: (postId: string) => void;
  onComment: (postId: string, text: string, nepaliText?: string) => void;
  onSave: (postId: string) => void;
  onTagClick?: (tag: string) => void;
  onLocationClick?: (location: string, district: string) => void;
  onUserClick?: (userId: string) => void;
  onOpenStory?: (story: Story) => void;
  onOpenCreate?: () => void;
  language: "en" | "ne";
}

export const BentoFeedGrid: React.FC<BentoFeedGridProps> = ({
  posts,
  stories,
  currentUser,
  communities,
  locations,
  onLike,
  onComment,
  onSave,
  onTagClick,
  onLocationClick,
  onUserClick,
  onOpenStory,
  onOpenCreate,
  language,
}) => {
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [bentoFilter, setBentoFilter] = useState<string>("all");

  const handleShare = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(window.location.href);
    setCopiedId(postId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLikePost = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(postId);
    confetti({
      particleCount: 18,
      spread: 45,
      origin: { y: 0.6 },
      colors: ["#DC143C", "#003893", "#FFA500"],
    });
  };

  const handleCommentSubmit = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onComment(postId, commentInput.trim());
    setCommentInput("");
    setActiveCommentPostId(null);
  };

  const filteredPosts = bentoFilter === "all"
    ? posts
    : posts.filter((p) => p.category === bentoFilter);

  // Group top community and location for bento spotlight tiles
  const topCommunity = communities[0];
  const topLocation = locations[0];

  return (
    <div id="bento-grid-feed-container" className="space-y-5 animate-in fade-in duration-200">
      {/* Category Filter Chips in Bento Bar */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 overflow-x-auto scrollbar-none transition-colors">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 px-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#003893] dark:text-blue-400" />
            <span>Bento Hub:</span>
          </span>

          {[
            { id: "all", label: language === "ne" ? "सबै (All Nepal)" : "All Nepal 🇳🇵" },
            { id: "himalayas", label: "Himalayas 🏔️" },
            { id: "culture", label: "Heritage 🛕" },
            { id: "food", label: "Momo & Food 🥟" },
            { id: "street", label: "KTM Streets 🚲" },
            { id: "wildlife", label: "Wild Chitwan 🦏" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setBentoFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                bentoFilter === cat.id
                  ? "bg-gradient-to-r from-[#003893] to-[#0a2f77] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono flex-shrink-0 pr-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{filteredPosts.length} Nepali Shots</span>
        </div>
      </div>

      {/* Main Bento Grid Arrangement */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 auto-rows-[280px]">
        {/* BENTO TILE 1: Primary Featured Post (2 cols, 2 rows on large screens) */}
        {filteredPosts[0] && (
          <div
            key={filteredPosts[0].id}
            id={`bento-featured-${filteredPosts[0].id}`}
            onMouseEnter={() => setHoveredCardId(filteredPosts[0].id)}
            onMouseLeave={() => setHoveredCardId(null)}
            className="md:col-span-2 md:row-span-2 group relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            {/* Background Image Stage */}
            <img
              src={filteredPosts[0].imageUrl}
              alt={filteredPosts[0].caption}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none" />

            {/* Top Bar: Spotlight Pill + Location + Save */}
            <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-xs font-bold shadow-xs">
                  <Flame className="w-3.5 h-3.5 text-[#DC143C] fill-[#DC143C]" />
                  <span>Featured Snapshot</span>
                </span>

                <button
                  onClick={() =>
                    onLocationClick &&
                    onLocationClick(filteredPosts[0].location, filteredPosts[0].district)
                  }
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-medium border border-white/15 hover:bg-black/70 transition-colors cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-[#DC143C]" />
                  <span>{filteredPosts[0].location}</span>
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSave(filteredPosts[0].id);
                }}
                className={`p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                  filteredPosts[0].savedBy.includes(currentUser.id)
                    ? "bg-[#003893] text-white border-[#003893]"
                    : "bg-black/40 text-white border-white/20 hover:bg-black/60"
                }`}
                title="Save to Bucket"
              >
                <Bookmark className={`w-4 h-4 ${filteredPosts[0].savedBy.includes(currentUser.id) ? "fill-white" : ""}`} />
              </button>
            </div>

            {/* Bottom Content: Creator Info, Caption & Action Toolbar */}
            <div className="relative z-10 p-4 sm:p-6 text-white space-y-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onUserClick && onUserClick(filteredPosts[0].userId)}
                  className="flex items-center gap-2.5 text-left group/user cursor-pointer"
                >
                  <img
                    src={filteredPosts[0].userAvatar}
                    alt={filteredPosts[0].username}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-[#DC143C]"
                  />
                  <div>
                    <div className="font-bold text-sm text-white group-hover/user:text-rose-300 transition-colors flex items-center gap-1">
                      <span>{filteredPosts[0].userFullName}</span>
                      <span className="text-[10px] font-mono text-slate-300 font-normal">
                        @{filteredPosts[0].username}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono">
                      {filteredPosts[0].district} • Nepal
                    </div>
                  </div>
                </button>
              </div>

              {/* Caption */}
              <p className="text-sm sm:text-base text-slate-100 line-clamp-2 leading-relaxed font-['Mukta']">
                {language === "ne" && filteredPosts[0].nepaliCaption
                  ? filteredPosts[0].nepaliCaption
                  : filteredPosts[0].caption}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {filteredPosts[0].tags.slice(0, 3).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onTagClick && onTagClick(tag)}
                    className="text-xs px-2.5 py-0.5 rounded-md bg-white/15 backdrop-blur-xs text-slate-200 hover:bg-[#DC143C] hover:text-white transition-all cursor-pointer font-mono"
                  >
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </button>
                ))}
              </div>

              {/* Interaction Bar */}
              <div className="pt-2 border-t border-white/15 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => handleLikePost(filteredPosts[0].id, e)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md transition-all cursor-pointer ${
                      filteredPosts[0].likes.includes(currentUser.id)
                        ? "bg-[#DC143C] text-white"
                        : "bg-white/15 text-white hover:bg-white/25"
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        filteredPosts[0].likes.includes(currentUser.id) ? "fill-white" : ""
                      }`}
                    />
                    <span>{filteredPosts[0].likes.length}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCommentPostId(
                        activeCommentPostId === filteredPosts[0].id ? null : filteredPosts[0].id
                      );
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/15 hover:bg-white/25 text-white backdrop-blur-md transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{filteredPosts[0].comments.length}</span>
                  </button>

                  <button
                    onClick={(e) => handleShare(filteredPosts[0].id, e)}
                    className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md transition-all cursor-pointer"
                    title="Share"
                  >
                    {copiedId === filteredPosts[0].id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-300">
                  {new Date(filteredPosts[0].createdAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>

              {/* Inline comment drawer */}
              {activeCommentPostId === filteredPosts[0].id && (
                <form
                  onSubmit={(e) => handleCommentSubmit(filteredPosts[0].id, e)}
                  className="flex items-center gap-2 pt-2 animate-in fade-in"
                >
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Add a comment... (e.g. धेरै राम्रो! / Stunning)"
                    className="flex-1 text-xs px-3 py-1.5 rounded-full bg-white text-slate-900 placeholder:text-slate-400 outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-full bg-[#003893] text-white text-xs font-bold cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* BENTO TILE 2: Live Jhalak Stories Spotlight (1 col, 1 row) */}
        <div
          id="bento-tile-stories"
          className="rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 border border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#DC143C]/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#DC143C] animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300 font-['Mukta']">
                {language === "ne" ? "झलक कथाहरू" : "Jhalak Stories"}
              </span>
            </div>
            <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
              {stories.length} Live
            </span>
          </div>

          {/* Stories Avatar Cluster */}
          <div className="relative z-10 my-auto py-2">
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {stories.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  onClick={() => onOpenStory && onOpenStory(s)}
                  className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group/story"
                >
                  <div className="relative w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-[#DC143C] to-[#003893] group-hover/story:scale-105 transition-transform">
                    <img
                      src={s.userAvatar}
                      alt={s.username}
                      className="w-full h-full rounded-full object-cover bg-slate-900"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 max-w-[48px] truncate">
                    {s.username.split("_")[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10 text-xs">
            <span className="text-slate-400 text-[11px]">Nepal 24-hr moments</span>
            <button
              onClick={onOpenCreate}
              className="text-[#DC143C] hover:text-white font-bold text-xs transition-colors cursor-pointer"
            >
              + Add Yours
            </button>
          </div>
        </div>

        {/* BENTO TILE 3: Community Chautari Spotlight (1 col, 1 row) */}
        {topCommunity && (
          <div
            id="bento-tile-community"
            className="rounded-3xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#003893] dark:text-blue-400 uppercase tracking-wider font-['Mukta']">
                <Users className="w-3.5 h-3.5" />
                <span>{language === "ne" ? "फोटो चौतारी" : "Featured Chautari"}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {topCommunity.membersCount.toLocaleString()} members
              </span>
            </div>

            <div className="my-auto py-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 leading-tight">
                {topCommunity.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {topCommunity.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex gap-1">
                {topCommunity.tags.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    onClick={() => onTagClick && onTagClick(t)}
                    className="text-[10px] font-mono font-bold text-[#003893] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/60"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <button
                onClick={() => onTagClick && onTagClick(topCommunity.tags[0])}
                className="text-xs font-bold text-[#DC143C] dark:text-rose-400 hover:underline cursor-pointer"
              >
                Explore Hub →
              </button>
            </div>
          </div>
        )}

        {/* REMAINING POSTS: Dynamic Bento Grid Cards */}
        {filteredPosts.slice(1).map((post, index) => {
          const isSpanWide = index % 5 === 2; // Every few cards gets a double span
          const filterPreset = FILTER_PRESETS.find((f) => f.id === post.filter);
          const isLiked = post.likes.includes(currentUser.id);
          const isSaved = post.savedBy.includes(currentUser.id);

          return (
            <div
              key={post.id}
              id={`bento-card-${post.id}`}
              onMouseEnter={() => setHoveredCardId(post.id)}
              onMouseLeave={() => setHoveredCardId(null)}
              className={`${
                isSpanWide ? "md:col-span-2" : "col-span-1"
              } group relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[280px]`}
            >
              {/* Image */}
              <img
                src={post.imageUrl}
                alt={post.caption}
                style={{ filter: filterPreset?.cssFilter || "none" }}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                loading="lazy"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

              {/* Top Tag & Actions */}
              <div className="relative z-10 p-3.5 flex items-center justify-between">
                <button
                  onClick={() =>
                    onLocationClick && onLocationClick(post.location, post.district)
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-medium border border-white/15 hover:bg-black/70 transition-colors cursor-pointer truncate max-w-[180px]"
                >
                  <MapPin className="w-3 h-3 text-[#DC143C] flex-shrink-0" />
                  <span className="truncate">{post.location.split(",")[0]}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSave(post.id);
                    }}
                    className={`p-1.5 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                      isSaved
                        ? "bg-[#003893] text-white border-[#003893]"
                        : "bg-black/40 text-white border-white/20 hover:bg-black/60"
                    }`}
                    title="Save"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-white" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Bottom Info & Interactions */}
              <div className="relative z-10 p-3.5 sm:p-4 text-white space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => onUserClick && onUserClick(post.userId)}
                    className="flex items-center gap-2 text-left group/user cursor-pointer min-w-0"
                  >
                    <img
                      src={post.userAvatar}
                      alt={post.username}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-white/60 flex-shrink-0"
                    />
                    <div className="truncate">
                      <div className="font-bold text-xs text-white group-hover/user:text-rose-300 transition-colors truncate">
                        {post.username}
                      </div>
                    </div>
                  </button>

                  <span className="text-[10px] font-mono text-slate-300 px-1.5 py-0.5 rounded bg-white/10 backdrop-blur-xs flex-shrink-0">
                    {post.district}
                  </span>
                </div>

                <p className="text-xs text-slate-100 line-clamp-2 leading-relaxed font-['Mukta']">
                  {language === "ne" && post.nepaliCaption ? post.nepaliCaption : post.caption}
                </p>

                {/* Interaction Footer */}
                <div className="pt-2 border-t border-white/15 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={(e) => handleLikePost(post.id, e)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md transition-all cursor-pointer ${
                        isLiked
                          ? "bg-[#DC143C] text-white"
                          : "bg-white/15 text-white hover:bg-white/25"
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${isLiked ? "fill-white" : ""}`} />
                      <span>{post.likes.length}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCommentPostId(
                          activeCommentPostId === post.id ? null : post.id
                        );
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/15 hover:bg-white/25 text-white backdrop-blur-md transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>{post.comments.length}</span>
                    </button>

                    <button
                      onClick={(e) => handleShare(post.id, e)}
                      className="p-1 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md transition-all cursor-pointer"
                      title="Share"
                    >
                      {copiedId === post.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Share2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {post.tags[0] && (
                    <button
                      onClick={() => onTagClick && onTagClick(post.tags[0])}
                      className="text-[10px] font-mono text-slate-300 hover:text-white cursor-pointer"
                    >
                      {post.tags[0].startsWith("#") ? post.tags[0] : `#${post.tags[0]}`}
                    </button>
                  )}
                </div>

                {/* Inline Comment Input */}
                {activeCommentPostId === post.id && (
                  <form
                    onSubmit={(e) => handleCommentSubmit(post.id, e)}
                    className="flex items-center gap-1.5 pt-2 animate-in fade-in"
                  >
                    <input
                      type="text"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Comment..."
                      className="flex-1 text-xs px-2.5 py-1 rounded-full bg-white text-slate-900 placeholder:text-slate-400 outline-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-full bg-[#003893] text-white text-xs font-bold cursor-pointer"
                    >
                      Post
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
