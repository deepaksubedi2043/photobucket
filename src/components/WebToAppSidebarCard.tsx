import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Download,
  CheckCircle2,
  Sparkles,
  HardDrive,
  Apple,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import confetti from "canvas-confetti";

interface WebToAppSidebarCardProps {
  language: "en" | "ne";
  isHighlighted?: boolean;
  onOpenFullModal: () => void;
  onDownloaded: () => void;
  isMobileViewport?: boolean;
}

export const WebToAppSidebarCard: React.FC<WebToAppSidebarCardProps> = ({
  language,
  isHighlighted = false,
  onOpenFullModal,
  onDownloaded,
  isMobileViewport = false,
}) => {
  const [activeOs, setActiveOs] = useState<"android" | "ios" | "windows">("android");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    if (/android/i.test(ua)) {
      setActiveOs("android");
    } else if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
      setActiveOs("ios");
    } else if (/windows/i.test(ua)) {
      setActiveOs("windows");
    }

    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  const triggerDirectDownload = (url: string, filename: string) => {
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.warn("Direct download failed:", err);
    }
  };

  const handleQuickDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(20);

    // If native PWA install prompt is ready
    if (deferredPrompt && (activeOs === "android" || activeOs === "windows")) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          completeDownload();
          return;
        }
      } catch (err) {
        console.warn("Deferred prompt error:", err);
      }
    }

    // High speed automated file download
    const timer = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer);
          setTimeout(() => {
            setDownloadProgress(100);
            setIsDownloading(false);
            setIsSuccess(true);

            if (activeOs === "android") {
              triggerDirectDownload("/api/download/android-apk", "photo-bucket-nepal-v2.4.0.apk");
            } else if (activeOs === "ios") {
              triggerDirectDownload("/api/download/ios-mobileconfig", "photo-bucket-nepal.mobileconfig");
            } else {
              triggerDirectDownload("/api/download/windows-shortcut", "Photo-Bucket-Nepal.url");
            }

            try {
              confetti({
                particleCount: 60,
                spread: 60,
                origin: { y: 0.7 },
                colors: ["#003893", "#DC143C", "#10B981", "#F59E0B"],
              });
            } catch {}

            // Notify parent that app is downloaded
            setTimeout(() => {
              onDownloaded();
            }, 1200);
          }, 400);
          return 90;
        }
        return prev + 35;
      });
    }, 120);
  };

  const completeDownload = () => {
    setIsDownloading(false);
    setIsSuccess(true);
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#003893", "#DC143C", "#10B981"],
      });
    } catch {}
    setTimeout(() => {
      onDownloaded();
    }, 1200);
  };

  return (
    <div
      id="sidebar-web-to-app-section"
      className={`rounded-3xl p-4.5 text-white shadow-md transition-all duration-500 relative overflow-hidden ${
        isHighlighted
          ? "ring-4 ring-amber-400 dark:ring-amber-300 shadow-2xl scale-[1.02] bg-gradient-to-br from-[#002d77] via-[#003893] to-[#c80f33]"
          : "bg-gradient-to-br from-[#003893] via-[#08357f] to-[#DC143C] border border-white/15"
      }`}
    >
      {/* Glow highlight background particle */}
      {isHighlighted && (
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-400/20 rounded-full blur-2xl animate-pulse pointer-events-none" />
      )}

      {/* Direct landing callout banner if highlighted */}
      {isHighlighted && (
        <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-400 text-slate-900 font-extrabold text-[11px] flex items-center gap-1.5 shadow-sm animate-bounce-short">
          <Sparkles className="w-3.5 h-3.5 text-slate-900" />
          <span>
            {language === "ne"
              ? "📱 मोबाइलबाट लगइन हुनुभयो! Homescreen मा सेभ गर्नुहोस्:"
              : "📱 Logged in from Mobile! Save to Homescreen below:"}
          </span>
        </div>
      )}

      {/* Top Header info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-white/15 backdrop-blur-xs">
            <Smartphone className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
              <span>{language === "ne" ? "वेब बाट एप (Web to App)" : "Web to App"}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-blue-100 font-medium">
              {language === "ne" ? "नेपालको आफ्नै फोटो चौतारी" : "Homescreen App Edition"}
            </div>
          </div>
        </div>

        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-bold border border-white/30 backdrop-blur-xs font-mono uppercase tracking-wider">
          Homescreen
        </span>
      </div>

      <p className="text-[11px] text-blue-100 mb-3.5 leading-relaxed">
        {language === "ne"
          ? "एक क्लिकमा मोबाइलको होमस्क्रिनमा इन्स्टल गर्नुहोस्। छिटो खुल्ने र डाटा बचत हुने एप!"
          : "Save Photo Bucket directly to your mobile or desktop homescreen for 1-click launch & full screen."}
      </p>

      {/* Quick OS Tabs */}
      <div className="flex gap-1.5 p-1 bg-black/20 rounded-xl mb-3 text-[10px] font-bold">
        <button
          type="button"
          onClick={() => setActiveOs("android")}
          className={`flex-1 py-1 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeOs === "android" ? "bg-white text-[#003893] shadow-xs" : "text-white/80 hover:text-white"
          }`}
        >
          <span>🤖</span>
          <span>Android</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveOs("ios")}
          className={`flex-1 py-1 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeOs === "ios" ? "bg-white text-[#003893] shadow-xs" : "text-white/80 hover:text-white"
          }`}
        >
          <span>🍎</span>
          <span>iPhone</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveOs("windows")}
          className={`flex-1 py-1 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeOs === "windows" ? "bg-white text-[#003893] shadow-xs" : "text-white/80 hover:text-white"
          }`}
        >
          <span>💻</span>
          <span>PC</span>
        </button>
      </div>

      {/* Action Area: Download / Save to Homescreen */}
      {isSuccess ? (
        <div className="py-2.5 px-3 bg-emerald-500/90 rounded-2xl text-center text-xs font-black flex items-center justify-center gap-2 text-white shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{language === "ne" ? "Homescreen मा सेभ भयो!" : "Downloaded & Saved to Homescreen!"}</span>
        </div>
      ) : isDownloading ? (
        <div className="space-y-1.5 py-1">
          <div className="flex justify-between text-[10px] font-bold text-blue-100">
            <span>{language === "ne" ? "एप तयार हुँदैछ..." : "Preparing Web to App..."}</span>
            <span>{downloadProgress}%</span>
          </div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-200"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            id="sidebar-download-app-btn"
            type="button"
            onClick={handleQuickDownload}
            className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 text-[#003893] hover:text-[#002868] font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer group"
          >
            <Download className="w-3.5 h-3.5 text-[#DC143C] group-hover:translate-y-0.5 transition-transform" />
            <span>
              {language === "ne"
                ? `Homescreen मा सेभ गर्नुहोस् (${activeOs.toUpperCase()})`
                : `Save to Homescreen (${activeOs.toUpperCase()})`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
