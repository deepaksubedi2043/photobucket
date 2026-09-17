import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Upload,
  Link as LinkIcon,
  Eye,
  CheckCircle2,
  Building2,
  ExternalLink,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import { CompanyGifAdItem } from "../types";
import { companyGifAdsService } from "../services/companyGifAdsService";

interface CompanyGifAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPosition?: 1 | 2 | 3;
  onSaved?: () => void;
  language?: "en" | "ne";
  isSuperAdmin?: boolean;
}

const SAMPLE_PRESET_GIFS = [
  {
    name: "Camera & Gear",
    category: "Photography",
    url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    company: "Sony Alpha Nepal",
    title: "Pro Alpha 7 IV Kit - 15% Festive Rebate",
    link: "https://www.sony.com",
    badge: "FEATURED BRAND",
  },
  {
    name: "Digital Payment",
    category: "Fintech",
    url: "https://media.giphy.com/media/26n6WywJyh39n1pBu/giphy.gif",
    company: "eSewa Nepal",
    title: "Instant Digital Payments & Fast QR Settlements",
    link: "https://esewa.com.np",
    badge: "GIF SPONSORED",
  },
  {
    name: "Trekking & Tourism",
    category: "Travel",
    url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
    company: "Nepal Tourism Board",
    title: "Discover Hidden Nepal - Photo Expedition 2081",
    link: "https://ntb.gov.np",
    badge: "OFFICIAL PARTNER",
  },
  {
    name: "Creative Neon Pulse",
    category: "Creative",
    url: "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif",
    company: "Photo Bucket Studio",
    title: "Join Verified Nepal Creators Collective",
    link: "https://photobucket.com.np",
    badge: "CREATORS CLUB",
  },
];

export const CompanyGifAdModal: React.FC<CompanyGifAdModalProps> = ({
  isOpen,
  onClose,
  targetPosition = 1,
  onSaved,
  language = "en",
  isSuperAdmin = false,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<1 | 2 | 3>(targetPosition);
  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [badgeText, setBadgeText] = useState("GIF SPONSORED");
  const [actionText, setActionText] = useState("Visit Website ↗");
  const [viewCount, setViewCount] = useState(150);
  const [clickCount, setClickCount] = useState(25);
  const [previewError, setPreviewError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const pos: 1 | 2 | 3 =
        targetPosition === 2 ? 2 : targetPosition === 3 ? 3 : 1;
      setSelectedSlot(pos);
      loadSlotData(pos);
      setSuccessMsg("");
    }
  }, [isOpen, targetPosition]);


  const loadSlotData = (pos: 1 | 2 | 3) => {
    const ad = companyGifAdsService.getAdByPosition(pos);
    if (ad) {
      setCompanyName(ad.companyName || "");
      setTitle(ad.title || "");
      setSubtitle(ad.subtitle || "");
      setGifUrl(ad.gifUrl || "");
      setLinkUrl(ad.linkUrl || "");
      setBadgeText(ad.badgeText || "GIF SPONSORED");
      setActionText(ad.actionText || "Visit Website ↗");
      setViewCount(ad.viewCount ?? 150);
      setClickCount(ad.clickCount ?? 25);
      setPreviewError(false);
    }
  };

  const handleSlotChange = (pos: 1 | 2 | 3) => {
    setSelectedSlot(pos);
    loadSlotData(pos);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    if (!file.type.includes("image") && !file.name.endsWith(".gif")) {
      alert("Please upload an image or GIF file (.gif, .png, .webp).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setGifUrl(result);
        setPreviewError(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = (preset: typeof SAMPLE_PRESET_GIFS[0]) => {
    setGifUrl(preset.url);
    setCompanyName(preset.company);
    setTitle(preset.title);
    setLinkUrl(preset.link);
    setBadgeText(preset.badge);
    setPreviewError(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !title.trim() || !gifUrl.trim()) {
      alert("Please fill in Company Name, Ad Title, and provide a GIF image URL or upload.");
      return;
    }

    setIsSaving(true);
    try {
      await companyGifAdsService.updateAd(selectedSlot, {
        companyName: companyName.trim(),
        title: title.trim(),
        subtitle: subtitle.trim(),
        gifUrl: gifUrl.trim(),
        linkUrl: linkUrl.trim() || "https://photobucket.com.np",
        badgeText: badgeText.trim() || "GIF SPONSORED",
        actionText: actionText.trim() || "Visit Website ↗",
        viewCount: Number(viewCount) || 0,
        clickCount: Number(clickCount) || 0,
        isActive: true,
      });

      setSuccessMsg(`GIF Advertisement for Block #${selectedSlot} saved successfully!`);
      if (onSaved) onSaved();
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      alert("Failed to save advertisement. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const slotAreaNames: Record<1 | 2 | 3, { nameEn: string; nameNe: string }> = {
    1: { nameEn: "Block 1 (Privacy Policy Column)", nameNe: "ब्लक १ (गोपनीयता नीति भाग)" },
    2: { nameEn: "Block 2 (Terms & Conditions Column)", nameNe: "ब्लक २ (नियम तथा सर्त भाग)" },
    3: { nameEn: "Block 3 (Nepal Directives Column)", nameNe: "ब्लक ३ (नेपाल नीति निर्देशिका भाग)" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div
        id="company-gif-ad-modal"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-slate-200 overflow-hidden my-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#DC143C] to-amber-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                <span>{language === "ne" ? "कम्पनी GIF विज्ञापन व्यवस्थापन" : "Company GIF Advertisement"}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  SLOT #{selectedSlot}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {language === "ne"
                  ? "फुटरको ३ स्तम्भहरूमा कम्पनीको एनिमेटेड GIF विज्ञापन देखाउनुहोस्"
                  : "Provide or update animated GIF advertisement in the 3 footer columns"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slot Selector Tabs */}
        <div className="px-6 pt-4 pb-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 shrink-0 mr-1">
            {language === "ne" ? "विज्ञापन ब्लक छान्नुहोस्:" : "Target Block:"}
          </span>
          {([1, 2, 3] as const).map((slotNum) => {
            const isSel = selectedSlot === slotNum;
            return (
              <button
                key={slotNum}
                type="button"
                onClick={() => handleSlotChange(slotNum)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isSel
                    ? "bg-[#DC143C] text-white shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <span>Slot {slotNum}</span>
                <span className="text-[10px] opacity-80">
                  ({slotNum === 1 ? "Privacy" : slotNum === 2 ? "Terms" : "Directives"})
                </span>
              </button>
            );
          })}
        </div>

        {/* Success Message Banner */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Active slot indicator banner */}
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-center justify-between">
            <span className="font-semibold text-white">
              📍 {language === "ne" ? slotAreaNames[selectedSlot].nameNe : slotAreaNames[selectedSlot].nameEn}
            </span>
            <span className="text-slate-400 text-[11px]">
              {language === "ne" ? "प्रत्यक्ष फुटर स्तम्भ मुनि देखा पर्दछ" : "Appears directly in this footer column"}
            </span>
          </div>

          {/* Preset Samples */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>{language === "ne" ? "नमुना GIF हरू (द्रुत छनौट):" : "Quick Preset Animated GIFs:"}</span>
              <span className="text-[11px] text-slate-400">Click to apply instantly</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_PRESET_GIFS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition text-xs cursor-pointer group"
                >
                  <div className="font-bold text-white group-hover:text-amber-300 truncate">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{preset.company}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Company / Brand Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony Alpha Nepal, eSewa, NTB"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DC143C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Badge / Tag Text
              </label>
              <input
                type="text"
                placeholder="e.g. GIF SPONSORED, FEATURED BRAND"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DC143C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Advertisement Title / Campaign Headline <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sony Alpha 7 IV Creators Fest - 15% Festive Rebate"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DC143C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Short Description / Offer Subtitle
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Authentic digital payments, high-speed camera gear & creator privilege across Nepal."
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DC143C] resize-none"
            />
          </div>

          {/* GIF Image Input: URL or File Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Provide Animated GIF Image <span className="text-rose-400">*</span>
            </label>

            {/* Drag & Drop / File Upload Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`p-4 border-2 border-dashed rounded-xl text-center transition cursor-pointer mb-2 ${
                isDragging
                  ? "border-[#DC143C] bg-rose-950/20"
                  : "border-slate-700 hover:border-slate-500 bg-slate-950/50"
              }`}
              onClick={() => {
                const input = document.getElementById("gif-file-upload-input");
                if (input) input.click();
              }}
            >
              <input
                id="gif-file-upload-input"
                type="file"
                accept=".gif,image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center gap-1.5 text-xs text-slate-400">
                <Upload className="w-5 h-5 text-rose-400" />
                <span className="font-semibold text-slate-300">
                  {language === "ne" ? "GIF फाइल अपलोड गर्नुहोस् (Drag & Drop वा क्लिक)" : "Upload GIF file (Drag & drop or Click to browse)"}
                </span>
                <span className="text-[11px] text-slate-500">Supports .gif, .png, .webp, animated banners</span>
              </div>
            </div>

            {/* Direct URL input */}
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="url"
                placeholder="Or paste direct GIF URL (e.g. https://.../banner.gif)"
                value={gifUrl}
                onChange={(e) => {
                  setGifUrl(e.target.value);
                  setPreviewError(false);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DC143C]"
              />
            </div>
          </div>

          {/* Target Website Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Company Target Link URL
              </label>
              <div className="relative">
                <ExternalLink className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="url"
                  placeholder="https://company.com.np"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DC143C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Action Button Text
              </label>
              <input
                type="text"
                placeholder="Visit Website ↗"
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DC143C]"
              />
            </div>
          </div>

          {/* Views and Clicks Stats for Super Admin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Views Count (हेराइ संख्या)
              </label>
              <input
                type="number"
                min="0"
                value={viewCount}
                onChange={(e) => setViewCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DC143C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Clicks Count (क्लिक संख्या)
              </label>
              <input
                type="number"
                min="0"
                value={clickCount}
                onChange={(e) => setClickCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#DC143C]"
              />
            </div>
          </div>

          {/* Live GIF Animated Preview */}
          {gifUrl && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold flex items-center gap-1.5 text-white">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Live Animated Preview (Slot #{selectedSlot})</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
                  GIF READY
                </span>
              </div>

              <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-900 aspect-[16/9] max-h-48 flex items-center justify-center">
                {previewError ? (
                  <div className="p-4 text-center text-xs text-rose-400 flex flex-col items-center gap-1">
                    <ImageIcon className="w-6 h-6" />
                    <span>Unable to load GIF from URL. Please check the link or upload a file.</span>
                  </div>
                ) : (
                  <img
                    src={gifUrl}
                    alt={title || "Company GIF Advertisement"}
                    referrerPolicy="no-referrer"
                    onError={() => setPreviewError(true)}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Overlay Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-[10px] font-bold text-amber-300 border border-amber-500/40">
                  {badgeText || "GIF AD"}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <span className="font-bold text-white">{companyName || "Company Name"}</span>
                  <span className="text-slate-400 ml-1.5 font-normal">— {title || "Campaign Title"}</span>
                </div>
                <span className="text-[#DC143C] font-bold text-[11px] shrink-0">
                  {actionText}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                const defaults = companyGifAdsService.resetToDefaults();
                const resetItem = defaults.find((d) => d.position === selectedSlot);
                if (resetItem) {
                  loadSlotData(selectedSlot);
                }
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Slot to Default</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#003893] to-[#DC143C] hover:opacity-95 text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSaving ? "Saving..." : `Publish Live to Block #${selectedSlot}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
