import React, { useState, useEffect } from "react";
import { ExternalLink, Sparkles, Image as ImageIcon, Building2, Eye, MousePointerClick } from "lucide-react";
import { CompanyGifAdItem, User } from "../types";
import { companyGifAdsService } from "../services/companyGifAdsService";

interface CompanyGifAdBlockProps {
  position: 1 | 2 | 3;
  onOpenModal?: (position: 1 | 2 | 3) => void;
  language?: "en" | "ne";
  currentUser?: User | null;
  isSuperAdmin?: boolean;
}

export const CompanyGifAdBlock: React.FC<CompanyGifAdBlockProps> = ({
  position,
  language = "en",
}) => {
  const [ad, setAd] = useState<CompanyGifAdItem | null>(null);
  const [imgError, setImgError] = useState(false);

  const reloadAd = () => {
    const data = companyGifAdsService.getAdByPosition(position);
    setAd(data);
    setImgError(false);
  };

  useEffect(() => {
    reloadAd();
    companyGifAdsService.recordView(position);
  }, [position]);

  if (!ad || !ad.isActive) return null;

  const handleClick = () => {
    companyGifAdsService.recordClick(position);
    setAd((prev) =>
      prev ? { ...prev, clickCount: (prev.clickCount || 0) + 1 } : prev
    );
    if (ad.linkUrl) {
      window.open(ad.linkUrl, "_blank", "noopener,noreferrer");
    }
  };

  const titleText = language === "ne" && ad.nepaliTitle ? ad.nepaliTitle : ad.title;
  const subtitleText = language === "ne" && ad.nepaliSubtitle ? ad.nepaliSubtitle : ad.subtitle;

  return (
    <div
      id={`company-gif-block-${position}`}
      className="flex flex-col justify-between h-full space-y-2 group/gif-block"
    >
      {/* Top Header: Advertising Company Name Centered */}
      <div className="flex items-center justify-center gap-1.5 min-h-[32px] shrink-0 w-full text-center px-2">
        <div className="p-1 rounded-md bg-[#DC143C]/15 border border-[#DC143C]/30 text-[#DC143C] shrink-0">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <h4
          className="text-xs sm:text-sm font-extrabold text-white tracking-wide uppercase truncate max-w-[220px] text-center"
          title={ad.companyName}
        >
          {ad.companyName || (language === "ne" ? "विज्ञापनदाता कम्पनी" : "Advertising Company")}
        </h4>
      </div>

      {/* Main GIF Advertisement Card */}
      <div
        onClick={handleClick}
        className="flex-1 flex flex-col justify-between rounded-xl overflow-hidden bg-slate-950 border border-slate-800/90 hover:border-slate-700 hover:shadow-xl transition-all duration-200 cursor-pointer select-none group min-h-0"
      >
        {/* GIF Visual Viewport */}
        <div className="relative h-24 sm:h-28 w-full bg-slate-900 overflow-hidden flex items-center justify-center shrink-0">
          {ad.gifUrl && !imgError ? (
            <img
              src={ad.gifUrl}
              alt={`${ad.companyName} - ${ad.title}`}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="p-2 text-center flex flex-col items-center justify-center gap-1 text-slate-500">
              <ImageIcon className="w-6 h-6 text-slate-600 animate-pulse" />
              <span className="text-xs font-semibold text-slate-300 truncate max-w-[160px]">
                {ad.companyName || "Company Advertisement"}
              </span>
              <span className="text-[9px] text-slate-500">Official Brand Partner</span>
            </div>
          )}

          {/* Top Pill: Category / Badge Tag */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[9px] font-bold text-amber-300 border border-white/10 flex items-center gap-1 shadow-sm font-mono uppercase tracking-wider">
            <Sparkles className="w-2 h-2 text-amber-300" />
            <span className="truncate max-w-[120px]">{ad.badgeText || `Sponsored`}</span>
          </div>

          {/* GIF Live Indicator Pill */}
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-rose-600 text-white font-extrabold text-[8px] tracking-widest font-mono shadow-sm uppercase">
            GIF
          </div>

          {/* Bottom Gradient overlay for legibility */}
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />
        </div>

        {/* Text Details & CTA */}
        <div className="p-2.5 flex-1 flex flex-col justify-between bg-slate-950 min-h-0 space-y-1">
          <div className="space-y-0.5">
            <div className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors truncate leading-snug">
              {titleText}
            </div>

            {subtitleText && (
              <p className="text-[11px] text-slate-400 line-clamp-1 leading-tight">
                {subtitleText}
              </p>
            )}
          </div>

          {/* Bottom Row: Views & Clicks on Left, Action Link on Right */}
          <div className="pt-1.5 border-t border-slate-900 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-slate-400 shrink-0">
              <span className="flex items-center gap-1 text-slate-300">
                <Eye className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{ad.viewCount ?? 150} views</span>
              </span>
              <span className="text-slate-600 font-bold">•</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <MousePointerClick className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{ad.clickCount ?? 0} clicks</span>
              </span>
            </div>

            <span className="inline-flex items-center gap-1 font-bold text-rose-400 group-hover:text-rose-300 transition-colors text-xs shrink-0 truncate">
              <span>{ad.actionText || (language === "ne" ? "वेबसाइट हेर्नुहोस्" : "Visit Website")}</span>
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
