import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  ExternalLink,
  Eye,
  RefreshCw,
  Sparkles,
  Trophy,
  AlertCircle,
  Compass,
  Tag,
  Check,
  X,
  Sliders,
  ShieldCheck,
  Building2,
  Image as ImageIcon,
} from "lucide-react";
import { ScrollingAdItem, ScrollingAdCategory, User, CompanyGifAdItem } from "../types";
import { scrollingAdsService } from "../services/scrollingAdsService";
import { companyGifAdsService } from "../services/companyGifAdsService";
import { CompanyGifAdModal } from "./CompanyGifAdModal";

interface SuperAdminAdsManagerProps {
  currentUser: User;
  onClose?: () => void;
}

export const SuperAdminAdsManager: React.FC<SuperAdminAdsManagerProps> = ({
  currentUser,
}) => {
  const [activeSection, setActiveSection] = useState<"ticker" | "gif_blocks">("ticker");
  const [ads, setAds] = useState<ScrollingAdItem[]>([]);
  const [gifAds, setGifAds] = useState<CompanyGifAdItem[]>([]);
  const [selectedGifSlot, setSelectedGifSlot] = useState<1 | 2 | 3>(1);
  const [isGifModalOpen, setIsGifModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);


  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formNepaliTitle, setFormNepaliTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formNepaliDescription, setFormNepaliDescription] = useState("");
  const [formCategory, setFormCategory] = useState<ScrollingAdCategory>("sponsored");
  const [formBadgeText, setFormBadgeText] = useState("");
  const [formSponsorName, setFormSponsorName] = useState("");
  const [formLinkUrl, setFormLinkUrl] = useState("");
  const [formActionText, setFormActionText] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formPriority, setFormPriority] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  const refreshList = () => {
    setAds(scrollingAdsService.getAds());
  };

  const refreshGifList = () => {
    setGifAds(companyGifAdsService.getAds());
  };

  useEffect(() => {
    refreshList();
    refreshGifList();
    const handleUpdate = () => {
      refreshList();
      refreshGifList();
    };
    window.addEventListener("photobucket_ads_updated", handleUpdate);
    return () => window.removeEventListener("photobucket_ads_updated", handleUpdate);
  }, []);


  const resetForm = () => {
    setEditingAdId(null);
    setFormTitle("");
    setFormNepaliTitle("");
    setFormDescription("");
    setFormNepaliDescription("");
    setFormCategory("sponsored");
    setFormBadgeText("");
    setFormSponsorName("");
    setFormLinkUrl("");
    setFormActionText("");
    setFormImageUrl("");
    setFormPriority(1);
    setFormIsActive(true);
  };

  const handleStartEdit = (ad: ScrollingAdItem) => {
    setEditingAdId(ad.id);
    setFormTitle(ad.title);
    setFormNepaliTitle(ad.nepaliTitle || "");
    setFormDescription(ad.description);
    setFormNepaliDescription(ad.nepaliDescription || "");
    setFormCategory(ad.category);
    setFormBadgeText(ad.badgeText || "");
    setFormSponsorName(ad.sponsorName || "");
    setFormLinkUrl(ad.linkUrl || "");
    setFormActionText(ad.actionText || "");
    setFormImageUrl(ad.imageUrl || "");
    setFormPriority(ad.priority || 1);
    setFormIsActive(ad.isActive);

    // Scroll to form
    const formEl = document.getElementById("superadmin-ads-form");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      alert("Please provide at least a Title and Description for the ad/notice.");
      return;
    }

    if (editingAdId) {
      scrollingAdsService.updateAd(editingAdId, {
        title: formTitle.trim(),
        nepaliTitle: formNepaliTitle.trim() || undefined,
        description: formDescription.trim(),
        nepaliDescription: formNepaliDescription.trim() || undefined,
        category: formCategory,
        badgeText: formBadgeText.trim() || undefined,
        sponsorName: formSponsorName.trim() || undefined,
        linkUrl: formLinkUrl.trim() || undefined,
        actionText: formActionText.trim() || undefined,
        imageUrl: formImageUrl.trim() || undefined,
        priority: Number(formPriority) || 1,
        isActive: formIsActive,
      });
      setActionSuccess("Ad updated successfully!");
    } else {
      scrollingAdsService.addAd({
        title: formTitle.trim(),
        nepaliTitle: formNepaliTitle.trim() || undefined,
        description: formDescription.trim(),
        nepaliDescription: formNepaliDescription.trim() || undefined,
        category: formCategory,
        badgeText: formBadgeText.trim() || undefined,
        sponsorName: formSponsorName.trim() || undefined,
        linkUrl: formLinkUrl.trim() || undefined,
        actionText: formActionText.trim() || undefined,
        imageUrl: formImageUrl.trim() || undefined,
        priority: Number(formPriority) || 1,
        isActive: formIsActive,
      });
      setActionSuccess("New scrolling ad/notice published live!");
    }

    resetForm();
    refreshList();
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to permanently remove "${title}"?`)) {
      scrollingAdsService.deleteAd(id);
      refreshList();
      setActionSuccess("Ad removed from ticker.");
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const handleToggle = (id: string) => {
    scrollingAdsService.toggleAdActive(id);
    refreshList();
  };

  const handleResetDefaults = () => {
    if (confirm("Reset all ticker ads to default verified Nepali notices and partner sponsorships?")) {
      scrollingAdsService.resetToDefaults();
      refreshList();
      setActionSuccess("Reset to standard Nepali ads.");
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const filteredAds = ads.filter((ad) => {
    if (filterCategory === "all") return true;
    if (filterCategory === "active") return ad.isActive;
    if (filterCategory === "inactive") return !ad.isActive;
    return ad.category === filterCategory;
  });

  const getCategoryIcon = (cat: ScrollingAdCategory) => {
    switch (cat) {
      case "contest":
        return <Trophy className="w-3.5 h-3.5 text-amber-400" />;
      case "sponsored":
        return <Sparkles className="w-3.5 h-3.5 text-rose-400" />;
      case "advisory":
        return <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />;
      case "tourism":
        return <Compass className="w-3.5 h-3.5 text-emerald-400" />;
      case "offer":
        return <Tag className="w-3.5 h-3.5 text-fuchsia-400" />;
      default:
        return <Megaphone className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#DC143C] to-[#003893] text-white shadow-md">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">
                Advertisement & Company Notice Portal
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage both the running center marquee ticker and the 3 footer company GIF image advertisement blocks.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeSection === "ticker" ? (
            <>
              <button
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title="Reset to default official Nepal notices"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Ticker Defaults</span>
              </button>

              <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-bold">
                {ads.filter((a) => a.isActive).length} / {ads.length} Live in Ticker
              </span>
            </>
          ) : (
            <button
              onClick={() => {
                companyGifAdsService.resetToDefaults();
                refreshGifList();
                setActionSuccess("Reset all 3 GIF advertisement slots to default!");
                setTimeout(() => setActionSuccess(null), 3000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset 3 GIF Slots to Default</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSection("ticker")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSection === "ticker"
              ? "bg-[#DC143C] text-white shadow-md"
              : "bg-slate-850 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Continuous Running Ads (Ticker)</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/30 font-mono">
            {ads.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSection("gif_blocks");
            refreshGifList();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSection === "gif_blocks"
              ? "bg-[#DC143C] text-white shadow-md"
              : "bg-slate-850 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Footer 3 GIF Image Blocks (Attached Area)</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-400/20 text-amber-300 font-mono font-bold">
            3 Blocks
          </span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* View 1: Footer 3 GIF Image Blocks */}
      {activeSection === "gif_blocks" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Three Attached GIF Advertisement Blocks</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                These 3 animated GIF advertisement cards appear directly under the Privacy Policy, Terms & Conditions, and Nepal Directives columns in the footer.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {([1, 2, 3] as const).map((slotNum) => {
              const gifAd =
                gifAds.find((g) => g.position === slotNum) ||
                companyGifAdsService.getAdByPosition(slotNum);
              const slotLabel =
                slotNum === 1
                  ? "Slot 1: Privacy Policy Area"
                  : slotNum === 2
                  ? "Slot 2: Terms & Conditions Area"
                  : "Slot 3: Nepal Directives Area";

              return (
                <div
                  key={slotNum}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg"
                >
                  <div>
                    {/* Header */}
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                      <div>
                        <span className="text-xs font-bold text-white block">{slotLabel}</span>
                        <span className="text-[10px] text-amber-400 font-mono">
                          {gifAd?.badgeText || "GIF SPONSORED"}
                        </span>
                      </div>
                      <div className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 flex items-center gap-1.5">
                        <span>{gifAd?.viewCount || 0} Views</span>
                        <span className="text-slate-600 font-bold">•</span>
                        <span className="text-emerald-400 font-bold">{gifAd?.clickCount || 0} Clicks</span>
                      </div>
                    </div>

                    {/* Animated GIF Preview Container */}
                    <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden flex items-center justify-center border-b border-slate-800">
                      {gifAd?.gifUrl ? (
                        <img
                          src={gifAd.gifUrl}
                          alt={gifAd.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-500 flex flex-col items-center gap-1">
                          <ImageIcon className="w-6 h-6 text-slate-600" />
                          <span>No GIF Set</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-[#DC143C]" />
                        <span>{gifAd?.companyName}</span>
                      </div>
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[9px] font-mono uppercase">
                        GIF
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <div className="font-bold text-sm text-white">{gifAd?.title}</div>
                      {gifAd?.subtitle && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {gifAd.subtitle}
                        </p>
                      )}
                      <div className="text-[11px] text-slate-500 truncate">
                        Link: <a href={gifAd?.linkUrl} target="_blank" rel="noopener noreferrer" className="text-rose-400 underline">{gifAd?.linkUrl}</a>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGifSlot(slotNum);
                        setIsGifModalOpen(true);
                      }}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-[#003893] to-[#DC143C] hover:opacity-95 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit / Upload GIF for Slot #{slotNum}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: Continuous Running Ads (Ticker) Form & List */}
      {activeSection === "ticker" && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload / Edit Form */}
        <div id="superadmin-ads-form" className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              {editingAdId ? (
                <>
                  <Edit2 className="w-4 h-4 text-amber-400" />
                  <span>Edit Scrolling Ad</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-[#DC143C]" />
                  <span>Upload New Scrolling Ad / Notice</span>
                </>
              )}
            </h3>
            {editingAdId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Category and Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Category / Type</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ScrollingAdCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-[#DC143C] outline-none"
                >
                  <option value="sponsored">✨ Sponsored Ad</option>
                  <option value="notice">📢 Government Notice</option>
                  <option value="contest">🏆 Photo Contest</option>
                  <option value="tourism">🏛️ Heritage / Tourism</option>
                  <option value="advisory">🏔️ Trekker Advisory</option>
                  <option value="offer">🎉 Special Offer</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Badge Text (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. SPONSORED, 15% OFF"
                  value={formBadgeText}
                  onChange={(e) => setFormBadgeText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-[#DC143C] outline-none"
                />
              </div>
            </div>

            {/* Sponsor / Organization Name */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Sponsor / Source Organization</label>
              <input
                type="text"
                placeholder="e.g. Ministry of Communication (MoCIT), CAAN, NTNC"
                value={formSponsorName}
                onChange={(e) => setFormSponsorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-[#DC143C] outline-none"
              />
            </div>

            {/* Title (English) */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Headline / Title (English) <span className="text-[#DC143C]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. MoCIT Directive: Respect Individual Privacy in Public Spaces"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-[#DC143C] outline-none font-medium"
              />
            </div>

            {/* Title (Nepali) */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1 font-['Mukta']">
                शीर्षक (नेपालीमा - ऐच्छिक)
              </label>
              <input
                type="text"
                placeholder="उदा: सञ्चार तथा सूचना प्रविधि मन्त्रालय: सार्वजनिक स्थानमा गोपनीयता निर्देशिका"
                value={formNepaliTitle}
                onChange={(e) => setFormNepaliTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-[#DC143C] outline-none font-['Mukta']"
              />
            </div>

            {/* Description (English) */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Informational Text / Description (English) <span className="text-[#DC143C]">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Provide short informational summary that scrolls continuously..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-[#DC143C] outline-none resize-none"
              />
            </div>

            {/* Description (Nepali) */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1 font-['Mukta']">
                विवरण (नेपालीमा - ऐच्छिक)
              </label>
              <textarea
                rows={2}
                placeholder="नेपाली भाषामा जानकारी वा सूचना..."
                value={formNepaliDescription}
                onChange={(e) => setFormNepaliDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-[#DC143C] outline-none resize-none font-['Mukta']"
              />
            </div>

            {/* Link & Action Text */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Destination URL / Link</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={formLinkUrl}
                  onChange={(e) => setFormLinkUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-[#DC143C] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Button / CTA Label</label>
                <input
                  type="text"
                  placeholder="e.g. Apply Now, View Details"
                  value={formActionText}
                  onChange={(e) => setFormActionText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-[#DC143C] outline-none"
                />
              </div>
            </div>

            {/* Image URL & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Image / Logo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-[#DC143C] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Priority Order (1 = First)</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={formPriority}
                  onChange={(e) => setFormPriority(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-[#DC143C] outline-none"
                />
              </div>
            </div>

            {/* Active Status Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="formIsActive"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-[#DC143C] bg-slate-950 border-slate-800"
              />
              <label htmlFor="formIsActive" className="text-slate-300 font-medium cursor-pointer">
                Publish live in the scrolling ticker immediately
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#DC143C] to-[#003893] hover:from-rose-600 hover:to-blue-700 text-white font-bold text-xs shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{editingAdId ? "Update Scrolling Ad" : "Publish to Scrolling Ticker"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Existing Ads List & Live Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1 flex-wrap">
              {["all", "active", "sponsored", "notice", "contest", "advisory"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                    filterCategory === cat
                      ? "bg-[#DC143C] text-white shadow-sm"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500 font-mono">
              Showing {filteredAds.length} of {ads.length}
            </span>
          </div>

          {/* Cards List */}
          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredAds.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                No scrolling ads match your filter. Create one using the form on the left!
              </div>
            ) : (
              filteredAds.map((ad) => (
                <div
                  key={ad.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    ad.isActive
                      ? "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                      : "bg-slate-950/60 border-slate-900 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                          {getCategoryIcon(ad.category)}
                          <span className="uppercase">{ad.badgeText || ad.category}</span>
                        </span>

                        {ad.sponsorName && (
                          <span className="text-[11px] font-mono text-slate-400">
                            {ad.sponsorName}
                          </span>
                        )}

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                          P: #{ad.priority || 1}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            ad.isActive
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                              : "bg-rose-950 text-rose-300 border border-rose-800/60"
                          }`}
                        >
                          {ad.isActive ? "ACTIVE" : "PAUSED"}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white leading-snug">
                        {ad.title}
                      </h4>
                      {ad.nepaliTitle && (
                        <p className="text-xs text-slate-400 font-['Mukta']">{ad.nepaliTitle}</p>
                      )}

                      <p className="text-xs text-slate-300 line-clamp-2 mt-1">
                        {ad.description}
                      </p>

                      {ad.linkUrl && (
                        <div className="pt-1 flex items-center gap-2 text-[11px] text-[#DC143C]">
                          <ExternalLink className="w-3 h-3" />
                          <a
                            href={ad.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline truncate max-w-xs"
                          >
                            {ad.linkUrl}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Quick Action Controls */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {/* Active Toggle Switch */}
                      <button
                        onClick={() => handleToggle(ad.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                          ad.isActive
                            ? "bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-300 border border-emerald-700"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-400"
                        }`}
                        title="Toggle Ticker Visibility"
                      >
                        {ad.isActive ? "Active in Ticker" : "Enable"}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(ad)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Edit Ad Content"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(ad.id, ad.title)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 transition cursor-pointer"
                          title="Delete Ad"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-1">
                        <Eye className="w-3 h-3" />
                        <span>{ad.clickCount || 0} clicks</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      )}

      {/* Company GIF Ad Modal for SuperAdmin */}
      <CompanyGifAdModal
        isOpen={isGifModalOpen}
        onClose={() => setIsGifModalOpen(false)}
        targetPosition={selectedGifSlot}
        onSaved={() => {
          refreshGifList();
          setActionSuccess(`GIF Advertisement for Slot #${selectedGifSlot} updated!`);
          setTimeout(() => setActionSuccess(null), 3000);
        }}
        isSuperAdmin={true}
      />
    </div>
  );
};

