import React from "react";
import { Story, User } from "../types";
import { Plus } from "lucide-react";

interface StoriesBarProps {
  stories: Story[];
  currentUser: User;
  onOpenStory: (story: Story) => void;
  onAddStory: () => void;
  language: "en" | "ne";
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  stories,
  currentUser,
  onOpenStory,
  onAddStory,
  language,
}) => {
  // Group stories or show user stories
  const userHasStory = stories.some((s) => s.userId === currentUser.id);

  return (
    <section
      id="nepali-stories-bar"
      className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs mb-5 overflow-hidden transition-all"
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-['Mukta'] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#DC143C] animate-pulse" />
            <span>{language === "ne" ? "झलक (२४ घण्टा)" : "Jhalak Stories"}</span>
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-[#DC143C] dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
            LIVE 🇳🇵
          </span>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
          {stories.length} {language === "ne" ? "कथा" : "stories"}
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-1.5 scrollbar-none">
        {/* Current user: Add Story button */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
          <div
            id="add-story-button"
            onClick={onAddStory}
            className="relative w-15 h-15 sm:w-16 sm:h-16 rounded-full p-0.5 border-2 border-dashed border-[#003893]/40 dark:border-blue-400/40 hover:border-[#DC143C] transition-all flex items-center justify-center bg-slate-50 dark:bg-slate-800 group-hover:scale-105"
          >
            <img
              src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
              alt={currentUser?.fullName || "User"}
              className="w-full h-full rounded-full object-cover opacity-90 group-hover:opacity-100"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#DC143C] text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-900">
              <Plus className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 max-w-[64px] truncate text-center">
            {language === "ne" ? "मेरो झलक" : "Your Jhalak"}
          </span>
        </div>

        {/* Stories from Nepali users */}
        {stories.map((story) => {
          return (
            <div
              key={story.id}
              id={`story-item-${story.id}`}
              onClick={() => onOpenStory(story)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
            >
              {/* Vibrant Nepal Blue & Red ring */}
              <div className="relative w-15 h-15 sm:w-16 sm:h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-[#003893] via-[#DC143C] to-amber-500 hover:scale-105 transition-transform duration-200 shadow-xs">
                <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 p-[1.5px]">
                  <img
                    src={story.userAvatar}
                    alt={story.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                {story.location && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-900/85 text-[8px] font-semibold text-white px-1.5 py-0.2 rounded-full whitespace-nowrap shadow-xs max-w-[54px] truncate">
                    {story.location.split(",")[0]}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 max-w-[68px] truncate text-center group-hover:text-[#003893] dark:group-hover:text-blue-400">
                {story.username.split("_")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
