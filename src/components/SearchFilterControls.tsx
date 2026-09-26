import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
  Calendar,
  Image as ImageIcon,
  Flame,
  Clock,
  Heart,
  MessageCircle,
  TrendingUp,
  RotateCcw,
  Check,
  ChevronDown,
  Layers,
} from "lucide-react";
import {
  SearchFilterState,
  MediaTypeFilter,
  DateRangeFilter,
  PopularitySortFilter,
} from "../types";

interface SearchFilterControlsProps {
  filters: SearchFilterState;
  onChangeFilters: (updated: SearchFilterState) => void;
  totalResultsCount: number;
  totalPhotosCount: number;
  totalStoriesCount: number;
  language: "en" | "ne";
  onTagClick?: (tag: string) => void;
}

export const SearchFilterControls: React.FC<SearchFilterControlsProps> = ({
  filters,
  onChangeFilters,
  totalResultsCount,
  totalPhotosCount,
  totalStoriesCount,
  language,
  onTagClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if any filter differs from default
  const isFiltered =
    Boolean(filters.query.trim()) ||
    filters.mediaType !== "all" ||
    filters.dateRange !== "all" ||
    filters.sortBy !== "trending" ||
    filters.minPopularityScore > 0;

  const handleReset = () => {
    onChangeFilters({
      query: "",
      mediaType: "all",
      dateRange: "all",
      sortBy: "trending",
      minPopularityScore: 0,
    });
  };

  const handleQueryChange = (q: string) => {
    onChangeFilters({
      ...filters,
      query: q,
    });
  };

  const handleMediaTypeChange = (m: MediaTypeFilter) => {
    onChangeFilters({
      ...filters,
      mediaType: m,
    });
  };

  const handleDateRangeChange = (d: DateRangeFilter) => {
    onChangeFilters({
      ...filters,
      dateRange: d,
    });
  };

  const handleSortChange = (s: PopularitySortFilter) => {
    onChangeFilters({
      ...filters,
      sortBy: s,
    });
  };

  const handleMinScoreChange = (score: number) => {
    onChangeFilters({
      ...filters,
      minPopularityScore: score,
    });
  };

  // Popular Nepali search shortcuts
  const popularTags = [
    "#Himalayas",
    "#Kathmandu",
    "#Pokhara",
    "#Momo",
    "#Everest",
    "#Heritage",
    "#Mustang",
  ];

  return (
    <div
      id="search-filter-controls-container"
      className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-3 sm:p-4 space-y-3 transition-colors"
    >
      {/* Top Search Bar & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Main Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="main-search-input"
            type="text"
            value={filters.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={
              language === "ne"
                ? "स्थान, जिल्ला, क्याप्सन, #ट्याग वा क्रिएटर खोज्नुहोस्..."
                : "Search Nepal locations, districts, captions, #tags, or creators..."
            }
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-900 dark:text-white rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700/80 focus:border-[#003893] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs"
          />
          {filters.query && (
            <button
              onClick={() => handleQueryChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Media Type Segmented Control */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shrink-0">
          <button
            id="filter-media-all"
            onClick={() => handleMediaTypeChange("all")}
            className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filters.mediaType === "all"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>{language === "ne" ? "सबै" : "All"}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({totalPhotosCount + totalStoriesCount})
            </span>
          </button>

          <button
            id="filter-media-images"
            onClick={() => handleMediaTypeChange("images")}
            className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filters.mediaType === "images"
                ? "bg-white dark:bg-slate-900 text-[#003893] dark:text-blue-400 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
            <span>{language === "ne" ? "तस्वीर" : "Photos"}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({totalPhotosCount})
            </span>
          </button>

          <button
            id="filter-media-stories"
            onClick={() => handleMediaTypeChange("stories")}
            className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filters.mediaType === "stories"
                ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === "ne" ? "स्टोरी" : "Stories"}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({totalStoriesCount})
            </span>
          </button>
        </div>

        {/* Expand / Filter Details Toggle Button */}
        <button
          id="toggle-filter-panel-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl sm:rounded-2xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
            isExpanded || isFiltered
              ? "bg-[#003893]/10 dark:bg-blue-950/60 border-[#003893]/30 dark:border-blue-800 text-[#003893] dark:text-blue-300"
              : "bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700/80 border-transparent text-slate-700 dark:text-slate-300"
          }`}
          title="Toggle Filter Options (Date range, Popularity scores)"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{language === "ne" ? "फिल्टरहरू" : "Filters"}</span>
          {isFiltered && (
            <span className="w-2 h-2 rounded-full bg-[#003893] dark:bg-blue-400" />
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Expanded Filter Panel (Date Range, Popularity Score & Sort Options) */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Column 1: Date Range Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>{language === "ne" ? "समय अवधि (Date Range)" : "Date Range"}</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "all", label: language === "ne" ? "सधैंको (All Time)" : "All Time" },
                { id: "today", label: language === "ne" ? "आज (Past 24h)" : "Past 24h" },
                { id: "week", label: language === "ne" ? "यो हप्ता (Past 7d)" : "Past 7 Days" },
                { id: "month", label: language === "ne" ? "यो महिना (Past 30d)" : "Past 30 Days" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleDateRangeChange(opt.id as DateRangeFilter)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold text-left transition cursor-pointer flex items-center justify-between ${
                    filters.dateRange === opt.id
                      ? "bg-rose-50 dark:bg-rose-950/60 text-[#DC143C] dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-bold"
                      : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {filters.dateRange === opt.id && <Check className="w-3 h-3 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Column 2: Popularity / Trending Sort */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === "ne" ? "क्रमबद्ध (Rank & Sort)" : "Sort By"}</span>
            </label>
            <div className="space-y-1">
              {[
                {
                  id: "trending",
                  label: language === "ne" ? "⚡ ट्रेन्डिङ स्कोर (Popularity)" : "⚡ Trending Score",
                },
                {
                  id: "most_liked",
                  label: language === "ne" ? "❤️ धेरै लाइक गरिएको (Likes)" : "❤️ Most Liked",
                },
                {
                  id: "most_discussed",
                  label: language === "ne" ? "💬 धेरै कमेन्ट (Comments)" : "💬 Most Discussed",
                },
                {
                  id: "latest",
                  label: language === "ne" ? "🕒 नयाँ पहिले (Newest)" : "🕒 Newest First",
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSortChange(opt.id as PopularitySortFilter)}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold text-left transition cursor-pointer flex items-center justify-between ${
                    filters.sortBy === opt.id
                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 font-bold"
                      : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {filters.sortBy === opt.id && <Check className="w-3 h-3 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Column 3: Minimum Popularity Score Threshold */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>{language === "ne" ? "न्यूनतम स्कोर थ्रेसहोल्ड" : "Min Popularity Score"}</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { score: 0, label: language === "ne" ? "सबै स्कोर (All)" : "Any Score (0+)" },
                { score: 20, label: language === "ne" ? "🔥 लोकप्रिय (20+)" : "🔥 Rising (20+)" },
                { score: 50, label: language === "ne" ? "⚡ ट्रेन्डिङ (50+)" : "⚡ Trending (50+)" },
                { score: 100, label: language === "ne" ? "🌟 भाइरल (100+)" : "🌟 Viral (100+)" },
              ].map((lvl) => (
                <button
                  key={lvl.score}
                  onClick={() => handleMinScoreChange(lvl.score)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold text-left transition cursor-pointer flex items-center justify-between ${
                    filters.minPopularityScore === lvl.score
                      ? "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900/60 font-bold"
                      : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate">{lvl.label}</span>
                  {filters.minPopularityScore === lvl.score && (
                    <Check className="w-3 h-3 shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 pt-1 leading-tight font-sans">
              {language === "ne"
                ? "लाइक, कमेन्ट, सेभ, बुस्ट र समयको आधारमा स्कोर गणना गरिन्छ।"
                : "Calculated dynamically using likes, comments, bookmarks, and recency."}
            </p>
          </div>
        </div>
      )}

      {/* Active Filter Badges & Results Counter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        {/* Results Counter & Active Pills */}
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <span className="font-semibold text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            {totalResultsCount}{" "}
            {language === "ne" ? "नतिजाहरू भेटिए" : "results found"}
          </span>

          {filters.query && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-[#003893] dark:text-blue-300 font-medium text-[11px]">
              <span>"{filters.query}"</span>
              <button
                onClick={() => handleQueryChange("")}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.mediaType !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-medium text-[11px]">
              <span>
                {filters.mediaType === "images" ? "📸 Photos" : "✨ Stories"}
              </span>
              <button
                onClick={() => handleMediaTypeChange("all")}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.dateRange !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-medium text-[11px]">
              <span>
                {filters.dateRange === "today"
                  ? "Past 24h"
                  : filters.dateRange === "week"
                  ? "Past 7d"
                  : "Past 30d"}
              </span>
              <button
                onClick={() => handleDateRangeChange("all")}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.minPopularityScore > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 font-medium text-[11px]">
              <span>⚡ Score ≥ {filters.minPopularityScore}</span>
              <button
                onClick={() => handleMinScoreChange(0)}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.sortBy !== "trending" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-medium text-[11px]">
              <span>
                Sort:{" "}
                {filters.sortBy === "most_liked"
                  ? "Likes"
                  : filters.sortBy === "most_discussed"
                  ? "Comments"
                  : "Newest"}
              </span>
              <button
                onClick={() => handleSortChange("trending")}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {/* Reset button or popular tag hints */}
        {isFiltered ? (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{language === "ne" ? "फिल्टर रिसेट" : "Reset Filters"}</span>
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-none">
            <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">
              Popular:
            </span>
            {popularTags.slice(0, 5).map((t) => (
              <button
                key={t}
                onClick={() => {
                  handleQueryChange(t);
                  if (onTagClick) onTagClick(t);
                }}
                className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-[#003893] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-0.5 rounded-md transition cursor-pointer"
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
