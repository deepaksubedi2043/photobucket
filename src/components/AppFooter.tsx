import React, { useState } from "react";
import {
  ShieldCheck,
  Globe2,
  Building2,
  Sparkles,
  MapPin,
  Heart,
} from "lucide-react";
import { Logo } from "./Logo";

import { ScrollingAdsTicker } from "./ScrollingAdsTicker";
import { CompanyGifAdBlock } from "./CompanyGifAdBlock";
import { CompanyGifAdModal } from "./CompanyGifAdModal";
import { User } from "../types";

interface AppFooterProps {
  onOpenLegal: (tab: "terms" | "privacy" | "nepal_directives" | "community") => void;
  onOpenAppDownload?: () => void;
  language: "en" | "ne";
  isAppDownloaded?: boolean;
  onResetAppDownload?: () => void;
  currentUser?: User | null;
  onOpenSuperAdminGateway?: () => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  onOpenLegal,
  onOpenAppDownload,
  language,
  isAppDownloaded = false,
  onResetAppDownload,
  currentUser,
  onOpenSuperAdminGateway,
}) => {
  const [isGifModalOpen, setIsGifModalOpen] = useState(false);
  const [activeGifSlot, setActiveGifSlot] = useState<1 | 2 | 3>(1);
  const [gifRefreshKey, setGifRefreshKey] = useState(0);

  const isSuperAdmin =
    currentUser?.email?.toLowerCase() === "photobucketnepal@gmail.com" ||
    currentUser?.isSuperAdmin ||
    currentUser?.isDelegatedAdmin ||
    currentUser?.role === "admin" ||
    currentUser?.role === "super_admin";

  const handleOpenGifModal = (slot: 1 | 2 | 3) => {
    setActiveGifSlot(slot);
    setIsGifModalOpen(true);
  };

  return (
    <footer className="mt-12 bg-slate-900 text-slate-300 font-sans">
      {/* Running Ads Single-Line Ticker in Center */}
      <ScrollingAdsTicker
        currentUser={currentUser}
        language={language}
      />

      {/* Main Footer Columns with Separate Headings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* Column 1: Brand & Identity */}
          <div className="flex flex-col justify-between h-full space-y-3">
            <div className="space-y-2.5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Logo size="md" showTagline={false} variant="dark" />
                </div>
                {/* Tagline Badge matching header */}
                <div
                  id="footer-tagline-badge"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 shadow-2xs font-['Mukta'] w-fit"
                  title="फोटो Bucket - नेपालको आफ्नै फोटो चौतारी"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="whitespace-nowrap">नेपालको आफ्नै फोटो चौतारी</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                Empowering authentic visual storytellers, photographers, and registered businesses across Nepal's 77 districts with high-fidelity photo sharing and localized discovery.
              </p>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                <span>Made with</span>
                <Heart className="w-3.5 h-3.5 text-[#DC143C] fill-current" />
                <span>for Creators & Tourism in Nepal</span>
              </div>
            </div>

            {/* Bottom: Web to App Button aligned with Ad bottom cards */}
            <div className="pt-2">
              {isAppDownloaded ? (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-bold flex items-center gap-1.5 w-full justify-center">
                    <span>📱</span>
                    <span>{language === "ne" ? "Web to App: Homescreen मा सेभ भएको छ" : "Web to App: Installed on Homescreen"}</span>
                  </span>
                  {onResetAppDownload && (
                    <button
                      type="button"
                      onClick={onResetAppDownload}
                      className="text-[11px] text-slate-400 hover:text-amber-300 underline cursor-pointer w-full text-center"
                      title="Simulate uninstalled mobile status to re-test Web to App flow"
                    >
                      {language === "ne" ? "पुनः परीक्षण गर्नुहोस् (Reset)" : "Simulate Uninstalled (Reset)"}
                    </button>
                  )}
                </div>
              ) : onOpenAppDownload ? (
                <button
                  id="footer-download-app-btn"
                  onClick={onOpenAppDownload}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003893] to-[#DC143C] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <span>📲</span>
                  <span>{language === "ne" ? "वेब बाट एप (Homescreen मा सेभ गर्नुहोस्)" : "Web to App (Save to Homescreen)"}</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Column 2: Company GIF Advertisement 1 (Replacing Privacy Policy Area) */}
          <div className="flex flex-col justify-between h-full">
            <CompanyGifAdBlock
              key={`gif-slot-1-${gifRefreshKey}`}
              position={1}
              onOpenModal={handleOpenGifModal}
              language={language}
              currentUser={currentUser}
              isSuperAdmin={isSuperAdmin}
            />
          </div>

          {/* Column 3: Company GIF Advertisement 2 (Replacing Terms and Conditions Area) */}
          <div className="flex flex-col justify-between h-full">
            <CompanyGifAdBlock
              key={`gif-slot-2-${gifRefreshKey}`}
              position={2}
              onOpenModal={handleOpenGifModal}
              language={language}
              currentUser={currentUser}
              isSuperAdmin={isSuperAdmin}
            />
          </div>

          {/* Column 4: Company GIF Advertisement 3 (Replacing Nepal Directives Area) */}
          <div className="flex flex-col justify-between h-full">
            <CompanyGifAdBlock
              key={`gif-slot-3-${gifRefreshKey}`}
              position={3}
              onOpenModal={handleOpenGifModal}
              language={language}
              currentUser={currentUser}
              isSuperAdmin={isSuperAdmin}
            />
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800/80 bg-slate-950 py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} फोटो Bucket (Nepal) Pvt. Ltd. All Rights Reserved.
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onOpenLegal("privacy")}
              className="hover:text-slate-300 transition cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => onOpenLegal("terms")}
              className="hover:text-slate-300 transition cursor-pointer"
            >
              Terms & Conditions
            </button>
            <span>•</span>
            <button
              onClick={() => onOpenLegal("nepal_directives")}
              className="hover:text-slate-300 transition cursor-pointer"
            >
              Nepal Directives 2080
            </button>
            <span>•</span>
            <button
              onClick={() => onOpenLegal("community")}
              className="hover:text-slate-300 transition cursor-pointer"
            >
              Community Standards
            </button>
            {onOpenSuperAdminGateway && (
              <>
                <span>•</span>
                <button
                  id="footer-super-admin-gateway-btn"
                  onClick={onOpenSuperAdminGateway}
                  className="text-rose-400 hover:text-rose-300 font-semibold transition cursor-pointer flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{language === "ne" ? "प्रशासकीय गेटवे" : "Admin Gateway"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Company GIF Advertisement Modal (Upload / Edit) */}
      <CompanyGifAdModal
        isOpen={isGifModalOpen}
        onClose={() => setIsGifModalOpen(false)}
        targetPosition={activeGifSlot}
        onSaved={() => setGifRefreshKey((prev) => prev + 1)}
        language={language}
        isSuperAdmin={isSuperAdmin}
      />
    </footer>
  );
};
