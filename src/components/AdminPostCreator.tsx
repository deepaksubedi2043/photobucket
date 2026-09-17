import React, { useState, useRef } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  MapPin,
  Music2,
  Check,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  Pin,
  Megaphone,
  Layers,
  Award,
} from "lucide-react";
import { User, Post } from "../types";
import { FILTER_PRESETS } from "../data/filters";
import { NEPAL_LOCATIONS } from "../data/nepalLocations";
import { api } from "../services/api";
import { optimizeImageUnder1MB, formatBytes } from "../utils/imageOptimizer";
import confetti from "canvas-confetti";

interface AdminPostCreatorProps {
  currentUser: User;
  onPostCreated: (post: Post) => void;
  onCancel?: () => void;
}

const NEPAL_MUSIC_TRACKS = [
  "Resham Firiri - Mountain Breeze",
  "Dhimay Baja - Newa Traditional Beat",
  "Kutu Ma Kutu - Folk Rhythm",
  "Himalayan Flute Meditation",
  "Sarangi Melodies of Gandaki",
  "Chautari Radio Acoustic Vibes",
];

export const AdminPostCreator: React.FC<AdminPostCreatorProps> = ({
  currentUser,
  onPostCreated,
  onCancel,
}) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState("normal");
  const [caption, setCaption] = useState("");
  const [nepaliCaption, setNepaliCaption] = useState("");
  const [location, setLocation] = useState("");
  const [district, setDistrict] = useState(currentUser.district || "Kathmandu");
  const [category, setCategory] = useState<Post["category"]>("himalayas");
  const [tagsInput, setTagsInput] = useState("");
  const [musicTrack, setMusicTrack] = useState("");
  const [isOfficialBroadcast, setIsOfficialBroadcast] = useState(true);
  const [isFeaturedPinned, setIsFeaturedPinned] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [imageSizeNotice, setImageSizeNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({ text: "Please upload a valid image file (JPEG, PNG, WebP).", type: "error" });
      return;
    }

    try {
      const origSize = file.size;
      const optResult = await optimizeImageUnder1MB(file);
      const optimizedBase64 = optResult.dataUrl;
      setImageUrl(optimizedBase64);
      setImageSizeNotice(
        `Optimized: ${formatBytes(origSize)} → Safe Web Delivery (< 1MB)`
      );
      setStatusMessage({ text: "Image loaded and auto-optimized successfully!", type: "success" });
    } catch (err: any) {
      setStatusMessage({ text: "Failed to optimize image: " + err.message, type: "error" });
    }
  };

  const handleGenerateAiCaptions = async () => {
    setIsGeneratingAi(true);
    setStatusMessage(null);
    try {
      const prompt = `Official platform announcement and highlight for Photo Bucket Nepal community regarding location: ${location}, district: ${district}, category: ${category}.`;
      const res = await api.generateAiCaption({
        location: location || "Nepal",
        category,
        userPrompt: prompt,
      });

      if (res.caption) {
        setCaption(res.caption);
      }
      if (res.nepaliCaption) {
        setNepaliCaption(res.nepaliCaption);
      }
      if (res.tags && Array.isArray(res.tags) && res.tags.length > 0) {
        setTagsInput(res.tags.join(" ") + " #OfficialPhotoBucket");
      }
      setStatusMessage({ text: "Gemini AI generated bilingual captions and cultural tags!", type: "success" });
    } catch (err: any) {
      setStatusMessage({ text: "AI caption generation fallback: " + (err.message || "Could not contact Gemini"), type: "error" });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setStatusMessage({ text: "Please provide an image URL or choose a preset photo.", type: "error" });
      return;
    }

    if (!caption.trim() && !nepaliCaption.trim()) {
      setStatusMessage({ text: "Please write an English or Nepali caption.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const processedTags = tagsInput
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 1)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));

    try {
      const postPayload: any = {
        userId: currentUser.id,
        imageUrl,
        caption: caption.trim() || "Official announcement from Photo Bucket Super Admin.",
        nepaliCaption: nepaliCaption.trim() || "फोटो Bucket सुपर एडमिनको आधिकारिक सन्देश।",
        location: location.trim() || `${district}, Nepal`,
        district: district.trim() || "Kathmandu",
        category,
        filter: selectedFilter,
        tags: processedTags.length > 0 ? processedTags : ["#PhotoBucket", "#SuperAdmin", "#Nepal"],
        musicTrack,
        isBoosted: isOfficialBroadcast,
        isFeatured: isFeaturedPinned,
      };

      const res = await api.createPost(postPayload);

      if (res.post) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#DC143C", "#003893", "#FFFFFF", "#FFD700"],
        });

        onPostCreated(res.post);
        setStatusMessage({ text: "Super Admin post published and broadcasted across all feeds!", type: "success" });

        // Reset inputs
        setCaption("");
        setNepaliCaption("");
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to publish post", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeFilterPreset = FILTER_PRESETS.find((f) => f.id === selectedFilter);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-crimson-600 flex items-center justify-center text-white shadow-lg shadow-indigo-950/50">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Super Admin Official Post Publisher</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/60 uppercase">
                Direct Wall Broadcast
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Publish official announcements, verified photography, and community highlights visible to all Nepali creators.
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
          >
            Back to Moderation
          </button>
        )}
      </div>

      {/* Notice Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 transition animate-in fade-in duration-200 ${
            statusMessage.type === "success"
              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
              : "bg-rose-950/80 text-rose-300 border border-rose-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <Layers className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Publishing Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Preview & Presets (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                Live Post Canvas Preview
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">1:1 Square Feed Format</span>
            </div>

            {/* Simulated Post Card */}
            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl">
              {/* Author Header */}
              <div className="p-3 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={currentUser.avatar || "/logo.svg"}
                    alt={currentUser.fullName}
                    className="w-8 h-8 rounded-full border border-indigo-500 object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{currentUser.fullName}</span>
                      <Award className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    </div>
                    <div className="text-[10px] text-indigo-400 font-mono">@{currentUser.username} • Super Admin</div>
                  </div>
                </div>

                {isOfficialBroadcast && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-crimson-950 text-crimson-300 border border-crimson-800 flex items-center gap-1">
                    <Megaphone className="w-3 h-3 text-crimson-400" />
                    Broadcast
                  </span>
                )}
              </div>

              {/* Image Preview with Filter */}
              <div className="relative aspect-square bg-slate-900 overflow-hidden">
                {imageUrl && typeof imageUrl === "string" ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{ filter: activeFilterPreset?.cssFilter || "none" }}
                    className="w-full h-full object-cover transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 space-y-2 p-6 text-center">
                    <Camera className="w-10 h-10 opacity-40" />
                    <p className="text-xs">No image chosen. Select a preset below or enter image URL.</p>
                  </div>
                )}

                {/* Location Overlay Pill */}
                {location && (
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur text-[11px] text-white flex items-center gap-1.5 border border-white/10">
                    <MapPin className="w-3 h-3 text-crimson-400" />
                    <span className="font-medium">{location}</span>
                  </div>
                )}
              </div>

              {/* Music Pill */}
              <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate">{musicTrack}</span>
              </div>
            </div>

            {imageSizeNotice && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <Check className="w-3 h-3" />
                {imageSizeNotice}
              </p>
            )}

            {/* Custom Image URL or Upload */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300">
                Custom Image URL or Direct File Upload
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={typeof imageUrl === "string" && imageUrl.startsWith("data:") ? "" : (typeof imageUrl === "string" ? imageUrl : "")}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1.5 transition shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Filter Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300">Aesthetic Nepal Filter Preset</label>
              <div className="grid grid-cols-3 gap-1.5">
                {FILTER_PRESETS.slice(0, 6).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFilter(f.id)}
                    className={`p-2 rounded-xl text-left border transition ${
                      selectedFilter === f.id
                        ? "bg-indigo-950 text-indigo-200 border-indigo-500"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="text-[11px] font-bold truncate">{f.name}</div>
                    <div className="text-[9px] opacity-75 font-nepali truncate">{f.nepaliName}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata, Captions & Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            {/* AI Caption Generator Row */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-800/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-white">Gemini AI Bilingual Caption Generator</div>
                  <div className="text-[10px] text-slate-400">Creates authentic Nepali & English cultural captions</div>
                </div>
              </div>

              <button
                type="button"
                disabled={isGeneratingAi}
                onClick={handleGenerateAiCaptions}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Auto Generate</span>
                  </>
                )}
              </button>
            </div>

            {/* Captions */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">English Caption</label>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Type English description or announcement..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Nepali Devanagari Caption (नेपाली विवरण)</span>
                  <span className="text-[10px] text-indigo-400 font-nepali">मौलिक नेपाली भाषा</span>
                </label>
                <textarea
                  rows={2}
                  value={nepaliCaption}
                  onChange={(e) => setNepaliCaption(e.target.value)}
                  placeholder="यहाँ नेपाली भाषामा क्याप्सन लेख्नुहोस्..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-nepali"
                />
              </div>
            </div>

            {/* District & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target District (जिल्ला)</label>
                <select
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    const matchedLoc = NEPAL_LOCATIONS.find((l) => l.district === e.target.value);
                    if (matchedLoc) setLocation(matchedLoc.name);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Kathmandu">Kathmandu (काठमाडौं)</option>
                  <option value="Kaski">Kaski / Pokhara (कास्की / पोखरा)</option>
                  <option value="Lalitpur">Lalitpur (ललितपुर)</option>
                  <option value="Bhaktapur">Bhaktapur (भक्तपुर)</option>
                  <option value="Mustang">Mustang (मुस्ताङ)</option>
                  <option value="Chitwan">Chitwan (चितवन)</option>
                  <option value="Solukhumbu">Solukhumbu / Everest (सोलुखुम्बु)</option>
                  <option value="Morang">Morang / Biratnagar (मोरङ)</option>
                  <option value="Rupandehi">Rupandehi / Lumbini (रुपन्देही)</option>
                  <option value="Dolpa">Dolpa (डोल्पा)</option>
                  <option value="Gorkha">Gorkha (गोरखा)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Specific Location Name</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Phewa Lake, Pokhara"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Category & Music Track */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Content Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Post["category"])}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="himalayas">🏔️ Himalayas & Landscapes</option>
                  <option value="culture">🛕 Culture & Heritage</option>
                  <option value="food">🥟 Food & Momo Culture</option>
                  <option value="street">🚶 Street & Urban Life</option>
                  <option value="wildlife">🦏 Wildlife & Nature</option>
                  <option value="lifestyle">✨ Nepali Lifestyle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nepali Audio Ambient Track</label>
                <select
                  value={musicTrack}
                  onChange={(e) => setMusicTrack(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {NEPAL_MUSIC_TRACKS.map((t, idx) => (
                    <option key={idx} value={t}>
                      🎵 {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Hashtags & Community Keywords</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="#PhotoBucketNepal #VisitNepal2026 #Pokhara"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Super Admin Privileges / Toggles */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Super Admin Broadcast Settings
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOfficialBroadcast}
                  onChange={(e) => setIsOfficialBroadcast(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Auto-Broadcast to All Users' Walls & Feeds</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Live Boost
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Guarantees top exposure across all 77 districts with official Super Admin verification badge.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeaturedPinned}
                  onChange={(e) => setIsFeaturedPinned(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pin to Top of Explore & Community Feed</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Sticky placement in the top carousel of the Nepal Photo Bucket discover screen.
                  </div>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-crimson-600 hover:from-indigo-500 hover:to-crimson-500 text-white text-xs font-bold shadow-lg shadow-indigo-950 flex items-center gap-2 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing & Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Publish Official Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
