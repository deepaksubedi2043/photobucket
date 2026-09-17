import React, { useState, useRef, useEffect } from "react";
import { User, Post } from "../types";
import {
  X,
  Upload,
  Camera,
  MapPin,
  Sparkles,
  Music2,
  Image as ImageIcon,
  Check,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Zap,
  EyeOff,
} from "lucide-react";
import { FILTER_PRESETS } from "../data/filters";
import { NEPAL_LOCATIONS } from "../data/nepalLocations";
import { api } from "../services/api";
import { optimizeImageUnder1MB, formatBytes } from "../utils/imageOptimizer";
import confetti from "canvas-confetti";

interface CreatePostModalProps {
  currentUser: User;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
  language: "en" | "ne";
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  currentUser,
  onClose,
  onPostCreated,
  language,
}) => {
  const [step, setStep] = useState<"select" | "edit" | "details" | "verifying">("select");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState("normal");
  const [caption, setCaption] = useState("");
  const [nepaliCaption, setNepaliCaption] = useState("");
  const [location, setLocation] = useState("");
  const [district, setDistrict] = useState(currentUser.district || "");
  const [category, setCategory] = useState<Post["category"]>("himalayas");
  const [tagsInput, setTagsInput] = useState("");
  const [musicTrack, setMusicTrack] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [aiBlockedDetails, setAiBlockedDetails] = useState<{
    violationType: string;
    reason: string;
    nepaliReason?: string;
  } | null>(null);

  // Post creation state
  const [createdPost, setCreatedPost] = useState<Post | null>(null);

  // Image optimization state (Auto-minimize > 1MB)
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [imageOptimizationInfo, setImageOptimizationInfo] = useState<{
    originalSize: number;
    optimizedSize: number;
    wasOptimized: boolean;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to count words
  const countWords = (text: string): number => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  };

  // Helper to extract hashtags
  const extractHashtags = (text: string): string[] => {
    return text
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));
  };

  const captionWordCount = countWords(caption);
  const nepaliCaptionWordCount = countWords(nepaliCaption);
  const currentTags = extractHashtags(tagsInput);
  const isHashtagsOverLimit = currentTags.length > 10;
  const isCaptionOverLimit = captionWordCount > 300;
  const isNepaliCaptionOverLimit = nepaliCaptionWordCount > 300;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOptimizingImage(true);
    setValidationError(null);

    try {
      // Auto optimize if > 1 MB, maintaining high definition quality
      const optResult = await optimizeImageUnder1MB(file);
      setImageUrl(optResult.dataUrl);
      setImageOptimizationInfo({
        originalSize: optResult.originalSizeBytes,
        optimizedSize: optResult.optimizedSizeBytes,
        wasOptimized: optResult.wasOptimized,
      });
      setStep("edit");
    } catch (err) {
      console.error("Image processing error", err);
      // Fallback standard FileReader
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
          setStep("edit");
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsOptimizingImage(false);
    }
  };



  // Gemini AI Smart Caption Generator (Max 10 tags & max 300 words)
  const handleGenerateAiCaptions = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    setValidationError(null);
    try {
      const res = await api.generateAiCaption({
        location,
        category,
        userPrompt: `Photo from ${location} in category ${category}`,
      });

      if (res.result) {
        let eng = res.result.english || "";
        let nep = res.result.nepali || "";

        // Ensure caption does not exceed 300 words
        const engWords = eng.trim().split(/\s+/).filter(Boolean);
        if (engWords.length > 300) {
          eng = engWords.slice(0, 300).join(" ");
        }

        const nepWords = nep.trim().split(/\s+/).filter(Boolean);
        if (nepWords.length > 300) {
          nep = nepWords.slice(0, 300).join(" ");
        }

        setCaption(eng);
        setNepaliCaption(nep);

        // Cap hashtags at maximum 10
        if (res.result.hashtags && Array.isArray(res.result.hashtags)) {
          const limitedTags = res.result.hashtags.slice(0, 10);
          setTagsInput(limitedTags.join(" "));
        }
      }
    } catch (err: any) {
      console.error(err);
      setAiError("Could not connect to AI service. Using default Nepali caption.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async () => {
    if (!imageUrl) return;

    // Validate 10 hashtags limit
    const tagsArray = extractHashtags(tagsInput);
    if (tagsArray.length > 10) {
      setValidationError(`Maximum limit is 10 hashtags (currently ${tagsArray.length}). Please remove ${tagsArray.length - 10} hashtag(s).`);
      return;
    }

    // Validate 300 words limit for caption
    if (captionWordCount > 300) {
      setValidationError(`English caption exceeds the 300-word limit (${captionWordCount}/300 words).`);
      return;
    }

    if (nepaliCaptionWordCount > 300) {
      setValidationError(`Nepali caption exceeds the 300-word limit (${nepaliCaptionWordCount}/300 words).`);
      return;
    }

    setValidationError(null);
    setAiBlockedDetails(null);
    setIsSubmitting(true);

    try {
      const finalCaption = caption || `Captured in ${location}, Nepal.`;

      const response = await api.createPost({
        userId: currentUser.id,
        imageUrl,
        caption: finalCaption,
        nepaliCaption: nepaliCaption || `${location}को सुन्दर दृश्य।`,
        location,
        district,
        category,
        filter: selectedFilter,
        tags: tagsArray.slice(0, 10), // Strict limit of 10 tags
        musicTrack,
      });

      if (response.success && response.post) {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#DC143C", "#003893", "#f59e0b"],
        });
        setCreatedPost(response.post);
        setStep("verifying");
        onPostCreated(response.post);
      } else {
        setValidationError(response.message || "Failed to create post.");
      }
    } catch (e: any) {
      console.error("Post creation error", e);
      if (e.blocked) {
        setAiBlockedDetails({
          violationType: e.violationType || "nudity",
          reason: e.reason || e.message,
          nepaliReason: e.nepaliReason,
        });
      } else {
        setValidationError(e.message || "Network error while publishing post.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentFilterObj = FILTER_PRESETS.find((f) => f.id === selectedFilter);

  return (
    <div
      id="create-post-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC143C]" />
            <h3 className="font-bold text-slate-900 text-base font-['Mukta'] flex items-center gap-1.5">
              <span>{language === "ne" ? "नयाँ फोटो पोस्ट" : "Share to Photo Bucket"}</span>
              <span className="text-xs text-slate-400 font-sans font-normal">
                (Step {step === "select" ? "1" : step === "edit" ? "2" : "3"}/3)
              </span>
            </h3>
          </div>

          <button
            id="close-create-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* STEP 1: Select Image or Sample */}
          {step === "select" && (
            <div className="space-y-5">
              {/* Drag and Drop / File Input */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#003893] rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-blue-50/30 group relative"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                {isOptimizingImage ? (
                  <div className="py-4 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#003893] animate-spin mb-2" />
                    <span className="text-xs font-bold text-slate-700">Auto-optimizing image to under 1 MB...</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">Preserving high-definition clarity</span>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 mx-auto rounded-full bg-blue-100 text-[#003893] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-slate-800 text-sm mb-1">
                      Upload Photo from Device or Camera
                    </div>
                    <div className="text-xs text-slate-500 max-w-sm mx-auto">
                      Supports high-resolution images. Images &gt; 1 MB are automatically minimized to under 1 MB with HD clarity preserved.
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Nepali Filter Studio */}
          {step === "edit" && (
            <div className="space-y-5">
              {/* Image Preview with applied filter */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center max-h-[320px] border border-slate-200">
                <img
                  src={imageUrl}
                  alt="Preview"
                  style={{ filter: currentFilterObj?.cssFilter || "none" }}
                  className="w-full max-h-[320px] object-cover"
                />
                {currentFilterObj?.overlayClass && (
                  <div className={`absolute inset-0 pointer-events-none ${currentFilterObj.overlayClass}`} />
                )}
                {imageOptimizationInfo && (
                  <div className="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1.5 shadow-md border border-white/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {imageOptimizationInfo.wasOptimized ? (
                      <span>
                        Auto-minimized to {formatBytes(imageOptimizationInfo.optimizedSize)} (was {formatBytes(imageOptimizationInfo.originalSize)}) • HD Preserved
                      </span>
                    ) : (
                      <span>Image Size: {formatBytes(imageOptimizationInfo.optimizedSize)} (&le; 1 MB limit)</span>
                    )}
                  </div>
                )}
              </div>

              {/* Nepali Filter Carousel */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Nepal Aesthetic Presets (८ वटा नेपाली फिल्टरहरू):
                </span>

                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {FILTER_PRESETS.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer p-1 rounded-xl transition-all ${
                        selectedFilter === filter.id
                          ? "ring-2 ring-[#DC143C] bg-rose-50"
                          : "hover:bg-slate-100"
                      }`}
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden relative border border-slate-200">
                        <img
                          src={imageUrl}
                          alt={filter.name}
                          style={{ filter: filter.cssFilter }}
                          className="w-full h-full object-cover"
                        />
                        {filter.overlayClass && (
                          <div className={`absolute inset-0 pointer-events-none ${filter.overlayClass}`} />
                        )}
                        {selectedFilter === filter.id && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                            <Check className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-800 text-center max-w-[64px] truncate leading-tight">
                        {filter.nepaliName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Details, Location Tagging & AI Nepali Caption */}
          {step === "details" && (
            <div className="space-y-4">
              {/* AI Auto-Verification Blocked Alert */}
              {aiBlockedDetails && (
                <div
                  id="ai-blocked-banner"
                  className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 space-y-2.5 animate-in fade-in duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                        <span>In-Built AI System: Post Automatically Blocked</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-800 text-[10px] font-mono">
                          Auto-Blocked
                        </span>
                      </h4>
                      <p className="text-[11px] text-rose-700 font-medium">
                        Under Photo Bucket Terms & Conditions and Nepal Community Guidelines, this content is prohibited.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-white/90 rounded-xl border border-rose-200 text-xs space-y-1">
                    <div className="font-semibold text-rose-800 flex items-center gap-1.5">
                      <span className="capitalize px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-mono font-bold">
                        Violation: {aiBlockedDetails.violationType}
                      </span>
                    </div>
                    <p className="text-slate-800 text-xs leading-relaxed">{aiBlockedDetails.reason}</p>
                    {aiBlockedDetails.nepaliReason && (
                      <p className="text-slate-700 text-xs font-['Mukta'] leading-relaxed pt-1 border-t border-rose-100">
                        {aiBlockedDetails.nepaliReason}
                      </p>
                    )}
                  </div>
                  <div className="text-[11px] text-rose-700 font-medium flex items-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5 shrink-0" />
                    <span>This post has NOT been saved and will NOT be shown on any feed, profile, or wall.</span>
                  </div>
                </div>
              )}

              {/* Validation Warning Alert */}
              {validationError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Cannot Publish: </span>
                    <span>{validationError}</span>
                  </div>
                </div>
              )}

              {/* AI Nepali & English Caption Generator Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-rose-50 border border-blue-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#003893] text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <span>Gemini AI Nepali Caption Creator</span>
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-rose-100 text-[#DC143C]">
                        AI 🇳🇵
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Auto-generates captions (max 300 words) & curated hashtags (max 10)
                    </div>
                  </div>
                </div>

                <button
                  id="generate-ai-caption-btn"
                  onClick={handleGenerateAiCaptions}
                  disabled={isGeneratingAi}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#003893] hover:bg-[#002b70] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer flex-shrink-0"
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Generate AI Caption</span>
                    </>
                  )}
                </button>
              </div>

              {aiError && (
                <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  {aiError}
                </div>
              )}

              {/* Dual Captions with 300-word Limit Counters */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      English Caption:
                    </label>
                    <span
                      className={`text-[11px] font-mono font-medium ${
                        isCaptionOverLimit
                          ? "text-red-600 font-bold"
                          : captionWordCount > 250
                          ? "text-amber-600"
                          : "text-slate-400"
                      }`}
                    >
                      {captionWordCount}/300 words {isCaptionOverLimit && "⚠️ Limit exceeded"}
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={caption}
                    onChange={(e) => {
                      setCaption(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="Describe your photo in English (e.g. Golden sunrise touching Phewa lake... max 300 words)"
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none bg-slate-50 focus:bg-white text-slate-800 transition-colors ${
                      isCaptionOverLimit
                        ? "border-red-400 focus:border-red-500 bg-red-50/30"
                        : "border-slate-200 focus:border-[#003893]"
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 font-['Mukta']">
                      नेपाली क्याप्सन (Nepali Caption in Devanagari):
                    </label>
                    <span
                      className={`text-[11px] font-mono font-medium ${
                        isNepaliCaptionOverLimit
                          ? "text-red-600 font-bold"
                          : nepaliCaptionWordCount > 250
                          ? "text-amber-600"
                          : "text-slate-400"
                      }`}
                    >
                      {nepaliCaptionWordCount}/300 शब्द {isNepaliCaptionOverLimit && "⚠️ सीमा नाघ्यो"}
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={nepaliCaption}
                    onChange={(e) => {
                      setNepaliCaption(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="नेपाली भाषामा वर्णन गर्नुहोस् (उदा: फेवातालको शान्त पानीमा माछापुच्छ्रेको प्रतिबिम्ब... बढीमा ३०० शब्द)"
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none bg-slate-50 focus:bg-white text-slate-800 font-['Mukta'] text-sm transition-colors ${
                      isNepaliCaptionOverLimit
                        ? "border-red-400 focus:border-red-500 bg-red-50/30"
                        : "border-slate-200 focus:border-[#DC143C]"
                    }`}
                  />
                </div>
              </div>

              {/* Location Tag & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#DC143C]" />
                    <span>Location Tag (ठाउँ):</span>
                  </label>
                  <select
                    value={location}
                    onChange={(e) => {
                      const loc = e.target.value;
                      setLocation(loc);
                      const found = NEPAL_LOCATIONS.find((l) => l.name === loc);
                      if (found) {
                        setDistrict(found.district);
                        setCategory(found.popularCategory);
                      }
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none text-slate-800"
                  >
                    {NEPAL_LOCATIONS.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name} ({loc.district})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category (विधा):
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none text-slate-800 capitalize"
                  >
                    <option value="himalayas">Mountains & Landscapes 🏔️</option>
                    <option value="culture">Newa & Nepali Heritage 🛕</option>
                    <option value="food">Nepali Street Food / Momo 🥟</option>
                    <option value="street">Kathmandu Street Life 🚲</option>
                    <option value="wildlife">Chitwan & Bardia Wildlife 🦏</option>
                    <option value="lifestyle">Youth & Daily Life 🇳🇵</option>
                  </select>
                </div>
              </div>

              {/* Hashtags (Max 10 Limit) & Music */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Hashtags (Max 10):
                    </label>
                    <span
                      className={`text-[11px] font-mono font-medium ${
                        isHashtagsOverLimit
                          ? "text-red-600 font-bold"
                          : currentTags.length === 10
                          ? "text-amber-600 font-semibold"
                          : "text-slate-400"
                      }`}
                    >
                      {currentTags.length}/10 {isHashtagsOverLimit && "⚠️ Limit exceeded"}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => {
                      setTagsInput(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="#VisitNepal #Pokhara #Momo (max 10 tags)"
                    className={`w-full text-xs p-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:outline-none text-slate-800 font-mono transition-colors ${
                      isHashtagsOverLimit
                        ? "border-red-400 focus:border-red-500 bg-red-50/30"
                        : "border-slate-200 focus:border-[#003893]"
                    }`}
                  />
                  {currentTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {currentTags.slice(0, 10).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-[#003893] border border-blue-100 font-mono font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {currentTags.length > 10 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-red-50 text-red-600 border border-red-200 font-mono font-bold">
                          +{currentTags.length - 10} extra (please remove)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Music2 className="w-3.5 h-3.5 text-[#003893]" />
                    <span>Nepali Music Track:</span>
                  </label>
                  <select
                    value={musicTrack}
                    onChange={(e) => setMusicTrack(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none text-slate-800"
                  >
                    <option value="Resham Firiri - Mountain Breeze">Resham Firiri - Mountain Breeze</option>
                    <option value="Dhimay Baja - Traditional Rhythms">Dhimay Baja - Traditional Rhythms</option>
                    <option value="Kutu Ma Kutu - Nepali Beats">Kutu Ma Kutu - Nepali Beats</option>
                    <option value="Tibetan Flute - Himalayan Echoes">Tibetan Flute - Himalayan Echoes</option>
                    <option value="Tharu Dholak - Terai Sunset">Tharu Dholak - Terai Sunset</option>
                  </select>
                </div>

                {/* In-Built AI Content Auto-Verification Sentinel */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#003893] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-5 h-5 text-cyan-300" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>In-Built AI Content Auto-Verification</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 font-bold font-mono">
                          Active Sentinel
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Every post is automatically verified against Terms & Conditions and Nepal Community Standards. Photos depicting prohibited content are automatically blocked from public feeds.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success & Verification Confirmation */}
          {step === "verifying" && createdPost && (
            <div className="py-6 px-3 sm:px-6 space-y-5 text-center">
              <div className="mx-auto w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center relative shadow-xs">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                <span className="absolute -bottom-1 -right-1 p-1 bg-[#003893] text-white rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                </span>
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 font-['Mukta']">
                  {language === "ne"
                    ? "तपाईंको तस्बिर सफलतापूर्वक प्रकाशित भयो! 🇳🇵"
                    : "Photo Published Successfully! 🇳🇵"}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  {language === "ne"
                    ? "तपाईंको तस्बिर इन-बिल्ट एआई प्रणालीबाट स्वतः प्रमाणित भई फोटो बकेटमा सुरक्षित रूपमा प्रकाशित भएको छ।"
                    : "Your photo passed In-Built AI Content Auto-Verification and is verified compliant with Photo Bucket Terms & Conditions."}
                </p>
              </div>

              {/* Preview Card */}
              <div className="max-w-md mx-auto p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 text-left flex items-center gap-3">
                <img
                  src={createdPost.imageUrl}
                  alt="Uploaded preview"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#DC143C] font-semibold">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{createdPost.location} ({createdPost.district || "Nepal"})</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium truncate mt-0.5">
                    {createdPost.caption}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span>{createdPost.category}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>AI Verified Safe & Compliant</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  id="done-view-feed-btn"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#003893] to-[#002a70] hover:from-[#002a70] hover:to-[#001c4d] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Done & View in Feed →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
          {step !== "select" && step !== "verifying" ? (
            <button
              onClick={() => setStep(step === "details" ? "edit" : "select")}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {step === "select" && (
              <button
                disabled={!imageUrl}
                onClick={() => setStep("edit")}
                className="px-4 py-2 rounded-lg bg-[#003893] hover:bg-[#002a70] text-white text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer"
              >
                Continue to Filters →
              </button>
            )}

            {step === "edit" && (
              <button
                onClick={() => setStep("details")}
                className="px-4 py-2 rounded-lg bg-[#003893] hover:bg-[#002a70] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Continue to Details →
              </button>
            )}

            {step === "details" && (
              <button
                id="submit-post-btn"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-[#DC143C] to-[#b80d32] hover:from-[#c21034] hover:to-[#9f0b2a] text-white text-xs font-bold shadow-sm disabled:opacity-50 transition-all cursor-pointer active:scale-97"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing & Verifying...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>{language === "ne" ? "फोटो पोस्ट गर्नुहोस्" : "Publish to Bucket"}</span>
                  </>
                )}
              </button>
            )}

            {step === "verifying" && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close Window
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
