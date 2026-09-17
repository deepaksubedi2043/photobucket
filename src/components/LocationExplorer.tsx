import React, { useState } from "react";
import { LocationItem, Post, User } from "../types";
import { MapPin, Image as ImageIcon, Camera, Compass, ArrowRight, Sparkles } from "lucide-react";

interface LocationExplorerProps {
  locations: LocationItem[];
  posts: Post[];
  selectedLocation: string | null;
  onSelectLocation: (locationName: string | null) => void;
  onSelectPost: (post: Post) => void;
  language: "en" | "ne";
}

export const LocationExplorer: React.FC<LocationExplorerProps> = ({
  locations,
  posts,
  selectedLocation,
  onSelectLocation,
  onSelectPost,
  language,
}) => {
  const [districtFilter, setDistrictFilter] = useState("all");

  const uniqueDistricts = Array.from(new Set(locations.map((l) => l.district)));

  const filteredLocations = locations.filter((loc) => {
    if (districtFilter !== "all" && loc.district !== districtFilter) return false;
    return true;
  });

  const matchingPosts = selectedLocation
    ? posts.filter(
        (p) =>
          p.location.toLowerCase().includes(selectedLocation.toLowerCase()) ||
          p.district.toLowerCase() === selectedLocation.toLowerCase()
      )
    : posts;

  return (
    <div id="location-explorer-section" className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#003893] to-[#0a235c] rounded-2xl p-5 sm:p-6 text-white shadow-sm relative overflow-hidden">
        {/* Subtle geometric background */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-[#DC143C]/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-semibold mb-2 backdrop-blur-xs border border-white/10">
            <Compass className="w-3.5 h-3.5 text-rose-300" />
            <span>{language === "ne" ? "नेपालका ७७ जिल्लाहरू" : "Explore Nepal by Geotags"}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-['Mukta'] mb-1.5">
            {language === "ne"
              ? "ठाउँ र जिल्ला अनुसार फोटोहरू खोज्नुहोस्"
              : "Discover Visual Stories by Location"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            From the high Himalayan glaciers of Khumbu and Mustang canyons to the historic royal courtyards of Patan and subtropical forests of Chitwan.
          </p>
        </div>

        {/* District Quick Filter Chips */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => {
              setDistrictFilter("all");
              onSelectLocation(null);
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
              districtFilter === "all" && !selectedLocation
                ? "bg-[#DC143C] text-white shadow-xs"
                : "bg-white/15 text-white hover:bg-white/25"
            }`}
          >
            All Nepal (सबै)
          </button>
          {uniqueDistricts.map((dist) => (
            <button
              key={dist}
              onClick={() => {
                setDistrictFilter(dist);
                onSelectLocation(dist);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex-shrink-0 ${
                districtFilter === dist || selectedLocation === dist
                  ? "bg-[#DC143C] text-white font-bold shadow-xs"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              {dist}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Nepal Locations Carousel Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-bold text-sm text-slate-900 font-['Mukta'] flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#DC143C]" />
            <span>{language === "ne" ? "लोकप्रिय पर्यटकीय ठाउँहरू" : "Popular Nepal Geotags"}</span>
          </h3>
          {selectedLocation && (
            <button
              onClick={() => onSelectLocation(null)}
              className="text-xs font-semibold text-[#003893] hover:underline cursor-pointer"
            >
              Clear Filter ({selectedLocation})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredLocations.map((loc) => {
            const isSelected = selectedLocation === loc.name || selectedLocation === loc.district;
            return (
              <div
                key={loc.name}
                id={`location-card-${loc.name.replace(/\s+/g, "-")}`}
                onClick={() => onSelectLocation(isSelected ? null : loc.name)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-rose-50/80 border-[#DC143C] ring-2 ring-[#DC143C]/20 shadow-xs"
                    : "bg-white border-slate-200 hover:border-[#003893]/50 hover:shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-bold text-xs text-slate-900 leading-tight truncate">
                    {loc.name.split(",")[0]}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    {loc.district}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Camera className="w-3 h-3 text-[#003893]" />
                  <span>{loc.count}+ photos shared</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filtered Photo Gallery Grid */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">
              {selectedLocation ? `Photos from ${selectedLocation}` : "Recent Geotagged Photos"}
            </span>
            <span className="text-xs text-slate-400 font-mono">({matchingPosts.length} posts)</span>
          </div>
        </div>

        {matchingPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-700">No photos found for this location yet</div>
            <div className="text-xs text-slate-400 mt-1">Be the first Nepali creator to share a photo from here!</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {matchingPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 cursor-pointer border border-slate-200 hover:border-[#DC143C] transition-all"
              >
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end text-white">
                  <div className="text-xs font-bold truncate">{post.username}</div>
                  <div className="text-[10px] text-slate-200 truncate flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-[#DC143C]" />
                    <span>{post.location}</span>
                  </div>
                  <div className="text-[10px] text-amber-300 font-mono mt-0.5">
                    ❤️ {post.likes.length} &nbsp; 💬 {post.comments.length}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
