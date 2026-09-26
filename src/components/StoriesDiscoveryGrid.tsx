import React from "react";
import { Story, User } from "../types";
import { RankedStory } from "../utils/searchFilterUtils";
import { Eye, Heart, MapPin, Sparkles, Clock, Play } from "lucide-react";
import { VerifiedBadge } from "./VerifiedBadge";

interface StoriesDiscoveryGridProps {
  rankedStories: RankedStory[];
  currentUser: User;
  onOpenStory: (story: Story) => void;
  language: "en" | "ne";
}

export const StoriesDiscoveryGrid: React.FC<StoriesDiscoveryGridProps> = ({
  rankedStories,
  currentUser,
  onOpenStory,
  language,
}) => {
  if (rankedStories.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-10 border border-slate-200/80 dark:border-slate-800 text-center space-y-3 shadow-xs">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 text-2xl">
          ✨
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          {language === "ne" ? "कुनै स्टोरी फेला परेन" : "No Matching Stories Found"}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {language === "ne"
            ? "तपाईंको खोजी वा फिल्टर अनुसार कुनै पनि २४ घण्टे स्टोरीहरू भेटिएन। कृपया फिल्टर परिवर्तन गरी पुन: खोज्नुहोस्।"
            : "No 24-hour stories match your current search query or date/popularity filters. Try adjusting your filter settings."}
        </p>
      </div>
    );
  }

  return (
    <div id="stories-discovery-grid-wrapper" className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{language === "ne" ? "नेपाली झलक स्टोरीहरू" : "Trending Stories (झलक)"}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-mono">
                {rankedStories.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === "ne"
                ? "२४ घण्टा भित्रका प्रत्यक्ष दृश्य र अनुभवहरू"
                : "Active 24-hour visual moments ranked by popularity"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {rankedStories.map(({ story, popularityScore }) => {
          const isViewed = story.viewedBy.includes(currentUser.id);
          const hasLiked = story.likes.includes(currentUser.id);

          return (
            <div
              key={story.id}
              id={`story-card-${story.id}`}
              onClick={() => onOpenStory(story)}
              className="group relative h-64 sm:h-72 rounded-2xl overflow-hidden cursor-pointer bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between"
            >
              {/* Story Background Image */}
              <img
                src={story.imageUrl}
                alt={story.caption || `Story by @${story.username}`}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/60 pointer-events-none" />

              {/* Top Bar: Creator Info & Popularity Pill */}
              <div className="relative z-10 p-2.5 sm:p-3 flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`p-0.5 rounded-full ${
                      isViewed
                        ? "bg-slate-400/40"
                        : "bg-gradient-to-tr from-[#DC143C] via-amber-400 to-[#003893] p-[2px]"
                    } shrink-0`}
                  >
                    <img
                      src={story.userAvatar}
                      alt={story.username}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-white"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate drop-shadow-sm flex items-center gap-1">
                      <span>@{story.username}</span>
                    </p>
                    {story.location && (
                      <p className="text-[10px] text-slate-300 truncate flex items-center gap-0.5 drop-shadow-sm">
                        <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                        <span>{story.location}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Popularity Score Pill */}
                <div
                  className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 shadow-xs shrink-0 font-mono"
                  title={`Popularity Score: ${popularityScore}`}
                >
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  <span>{popularityScore}</span>
                </div>
              </div>

              {/* Center Play Button on hover */}
              <div className="relative z-10 flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="w-11 h-11 rounded-full bg-white/90 text-slate-900 shadow-xl flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>

              {/* Bottom Info: Caption & Engagement Counters */}
              <div className="relative z-10 p-2.5 sm:p-3 space-y-1.5">
                {story.caption && (
                  <p className="text-xs text-white/95 line-clamp-2 font-medium drop-shadow-sm leading-snug">
                    {story.caption}
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-white/10 font-mono">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-400" />
                      <span>{story.viewedBy.length}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart
                        className={`w-3 h-3 ${
                          hasLiked ? "text-rose-500 fill-rose-500" : "text-slate-400"
                        }`}
                      />
                      <span>{story.likes.length}</span>
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Story</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
