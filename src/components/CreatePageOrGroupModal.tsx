import React, { useState, useEffect, useRef } from "react";
import { User, PageOrGroup, NameCheckResult } from "../types";
import { api } from "../services/api";
import {
  X,
  Sparkles,
  Shield,
  Globe,
  Lock,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  MapPin,
  Tag,
  FileText,
  Lightbulb,
  Upload,
} from "lucide-react";
import confetti from "canvas-confetti";

interface CreatePageOrGroupModalProps {
  currentUser: User;
  onClose: () => void;
  onCreated: (item: PageOrGroup) => void;
  language: "en" | "ne";
  initialType?: "page" | "group";
}

export const CreatePageOrGroupModal: React.FC<CreatePageOrGroupModalProps> = ({
  currentUser,
  onClose,
  onCreated,
  language,
  initialType = "page",
}) => {
  const [type, setType] = useState<"page" | "group">(initialType);
  const [name, setName] = useState("");
  const [nepaliName, setNepaliName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [category, setCategory] = useState("Culture & Heritage");
  const [district, setDistrict] = useState(currentUser.district || "Kathmandu");
  const [city, setCity] = useState(currentUser.city || "Kathmandu");
  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // Quota calculation
  const [userCreatedCount, setUserCreatedCount] = useState(0);
  const [isLoadingQuota, setIsLoadingQuota] = useState(true);

  // Real-time Name Similarity Checker State
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [checkResult, setCheckResult] = useState<NameCheckResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceTimerRef = useRef<any>(null);

  // Fetch current user quota for this type
  const fetchQuota = async () => {
    setIsLoadingQuota(true);
    try {
      const res = await api.getPagesAndGroups({ creatorId: currentUser.id, type });
      if (res.success) {
        setUserCreatedCount(res.items.length);
      }
    } catch (e) {
      console.warn("Could not fetch user created quota", e);
    } finally {
      setIsLoadingQuota(false);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, [type, currentUser.id]);

  // Real-time name checking with debouncing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!name.trim() || name.trim().length < 3) {
      setCheckResult(null);
      setIsCheckingName(false);
      return;
    }

    setIsCheckingName(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await api.checkPageGroupName({
          name: name.trim(),
          type,
          userDistrict: district,
        });
        setCheckResult(result);
      } catch (err) {
        console.warn("Name check failed", err);
      } finally {
        setIsCheckingName(false);
      }
    }, 450);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [name, type, district]);

  const categories = [
    "Culture & Heritage",
    "Photography & Aerial",
    "Adventure & Tourism",
    "Food & Hospitality",
    "Tech & Entrepreneurship",
    "Fashion & Lifestyle",
    "Arts & Music",
    "Sports & Fitness",
    "Education & Career",
    "General & Community",
  ];

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCoverImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSuggestion = (suggestedName: string) => {
    setName(suggestedName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter a name.");
      return;
    }

    if (userCreatedCount >= 3) {
      setErrorMessage(
        `Creation limit reached: You have already created 3 ${type === "page" ? "Pages" : "Groups"}. Maximum allowed is 3 per user.`
      );
      return;
    }

    if (checkResult?.isSimilar) {
      setErrorMessage(
        `Similar name detected with "${checkResult.matchedName}". Please select one of our suggested unique names below.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .map((t) => (t.startsWith("#") ? t : `#${t}`));

      const defaultAvatar =
        type === "page"
          ? "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80";

      const defaultCover =
        coverImage ||
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&auto=format&fit=crop&q=80";

      const res = await api.createPageOrGroup({
        creatorId: currentUser.id,
        type,
        name: name.trim(),
        nepaliName: nepaliName.trim() || undefined,
        description: description.trim() || `Welcome to ${name.trim()} on Photo Bucket.`,
        avatar: avatar.trim() || defaultAvatar,
        coverImage: defaultCover,
        visibility,
        category,
        district,
        city,
        tags,
      });

      if (res.success && res.item) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#003893", "#DC143C", "#10b981"],
        });
        onCreated(res.item);
        onClose();
      } else if (res.isSimilar) {
        setCheckResult({
          available: false,
          isSimilar: true,
          matchedName: res.item?.name,
          suggestions: res.suggestions || [],
          message: res.message,
        });
        setErrorMessage(res.message);
      } else {
        setErrorMessage(res.message || "Failed to create.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error while creating page or group.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isQuotaFull = userCreatedCount >= 3;

  return (
    <div
      id="create-page-group-modal"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#003893] text-white flex items-center justify-center font-bold">
              {type === "page" ? <Building2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 font-['Mukta']">
                <span>{language === "ne" ? (type === "page" ? "नयाँ पेज बनाउनुहोस्" : "नयाँ समूह बनाउनुहोस्") : `Create New ${type === "page" ? "Page" : "Group"}`}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-sans font-semibold bg-blue-100 text-[#003893]">
                  {currentUser.accountType === "business" ? "Business Account" : "Personal Account"}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Quota: {userCreatedCount}/3 {type === "page" ? "Pages" : "Groups"} created (Limit: 3)
              </p>
            </div>
          </div>

          <button
            id="close-create-page-group-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Quota Exceeded Warning */}
          {isQuotaFull && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#DC143C] shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">Maximum Limit Reached (3/3 {type === "page" ? "Pages" : "Groups"})</p>
                <p className="mt-0.5 text-rose-700">
                  Both Personal and Business accounts can create up to 3 {type === "page" ? "Pages" : "Groups"}. To create a new one, please delete one of your existing ones from the hub.
                </p>
              </div>
            </div>
          )}

          {/* Type Selector (Page vs Group) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Entity Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("page")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  type === "page"
                    ? "border-[#003893] bg-blue-50/50 shadow-xs ring-2 ring-[#003893]/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className={`p-2 rounded-xl ${type === "page" ? "bg-[#003893] text-white" : "bg-slate-100 text-slate-600"}`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Official Page (पेज)</div>
                  <div className="text-[11px] text-slate-500">For brands, public figures & organizations</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType("group")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  type === "group"
                    ? "border-[#003893] bg-blue-50/50 shadow-xs ring-2 ring-[#003893]/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className={`p-2 rounded-xl ${type === "group" ? "bg-[#003893] text-white" : "bg-slate-100 text-slate-600"}`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Community Group (समूह)</div>
                  <div className="text-[11px] text-slate-500">For enthusiasts, meetups & discussions</div>
                </div>
              </button>
            </div>
          </div>

          {/* Visibility: Public vs Private */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Privacy & Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  visibility === "public"
                    ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className={`p-2 rounded-xl ${visibility === "public" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Public (सार्वजनिक)</div>
                  <div className="text-[11px] text-slate-500">Anyone can see and join</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  visibility === "private"
                    ? "border-amber-600 bg-amber-50/40 ring-2 ring-amber-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className={`p-2 rounded-xl ${visibility === "private" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Private (गोप्य/बन्द)</div>
                  <div className="text-[11px] text-slate-500">Only approved members can view posts</div>
                </div>
              </button>
            </div>
          </div>

          {/* Name & Real-time Similarity Tracker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {type === "page" ? "Page Name" : "Group Name"} <span className="text-[#DC143C]">*</span>
              </label>
              {isCheckingName && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Tracking name similarity...</span>
                </div>
              )}
            </div>

            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "page" ? "e.g. Kathmandu Wildlife Photographers" : "e.g. Annapurna Trekkers Hub"}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all outline-hidden ${
                checkResult?.isSimilar
                  ? "border-amber-400 bg-amber-50/30 text-amber-950 focus:ring-2 focus:ring-amber-400"
                  : checkResult?.available
                  ? "border-emerald-400 bg-emerald-50/20 text-slate-900 focus:ring-2 focus:ring-emerald-400"
                  : "border-slate-200 bg-slate-50/50 focus:border-[#003893] focus:bg-white"
              }`}
            />

            {/* Similarity Feedback & Suggestions */}
            {checkResult && (
              <div className="space-y-2 pt-1">
                {checkResult.isSimilar ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300/80 text-amber-900 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Similar name tracked: </span>
                        <span>Matches existing entity </span>
                        <strong className="underline decoration-amber-500 font-bold">"{checkResult.matchedName}"</strong>.
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Photo Bucket strict policy: No similar names allowed to prevent user confusion. Please choose one of our suggested unique names:
                        </p>
                      </div>
                    </div>

                    {/* Suggestions list */}
                    {checkResult.suggestions && checkResult.suggestions.length > 0 && (
                      <div className="pt-1">
                        <div className="text-[11px] font-bold text-amber-900 mb-1.5 flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                          <span>Suggested Unique Names (Click to apply):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {checkResult.suggestions.map((sug, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectSuggestion(sug)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold text-xs hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              <span>{sug}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : checkResult.available ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✓ Name is unique and fully eligible across Nepal!</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Nepali Name (Optional Devanagari) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nepali Name (नेपाली नाम - ऐच्छिक)
            </label>
            <input
              type="text"
              value={nepaliName}
              onChange={(e) => setNepaliName(e.target.value)}
              placeholder="उदा. काठमाडौँ वाइल्डलाइफ फोटोग्राफर्स"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-['Mukta'] focus:border-[#003893] focus:bg-white outline-hidden"
            />
          </div>

          {/* Category & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-hidden focus:border-[#003893]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                District / Hub Location
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Kathmandu / Kaski"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-hidden focus:border-[#003893]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description & Purpose
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this page or group about? Share your mission with Nepali users..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:border-[#003893] focus:bg-white outline-hidden resize-none"
            />
          </div>

          {/* Cover Banner */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Cover Photo / Banner</span>
              <span className="text-[11px] text-slate-400 font-normal">Upload or paste URL</span>
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:border-[#003893] focus:bg-white outline-hidden"
                />
                <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1 shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </label>
                {coverImage && (
                  <button
                    type="button"
                    onClick={() => setCoverImage("")}
                    className="px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              {coverImage && (
                <div className="relative rounded-xl overflow-hidden h-24 border border-slate-200">
                  <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Hashtags
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="#Nepal #Photography #Kathmandu"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-mono focus:border-[#003893] focus:bg-white outline-hidden"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[#DC143C] text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isQuotaFull || (checkResult?.isSimilar ?? false)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#003893] to-[#002d75] hover:from-[#002d75] hover:to-[#00235b] text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating {type === "page" ? "Page" : "Group"}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    Create {visibility === "private" ? "Private" : "Public"} {type === "page" ? "Page" : "Group"} (3 Quota)
                  </span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              Regulated under Nepal Community Guidelines & Digital Standards
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
