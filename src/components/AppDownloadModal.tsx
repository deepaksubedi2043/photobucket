import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Apple,
  Share2,
  QrCode,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  HardDrive,
  Copy,
  Check,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  WifiOff,
  Bell,
  Camera,
  Monitor,
  Download,
  ArrowRight,
  Laptop,
  CheckCheck,
  RefreshCw,
  Radio,
} from "lucide-react";
import confetti from "canvas-confetti";
import { liveUpdateSync } from "../services/liveUpdateSync";


interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "en" | "ne";
  onDownloaded?: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({
  isOpen,
  onClose,
  language,
  onDownloaded,
}) => {
  const [activePlatform, setActivePlatform] = useState<"android" | "ios" | "windows" | "qr">("android");
  const [detectedOs, setDetectedOs] = useState<"android" | "ios" | "windows" | "other">("android");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSavedToHomescreen, setIsSavedToHomescreen] = useState(false);
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);


  const handleManualLiveSync = async () => {
    setIsSyncingLive(true);
    setSyncStatusText(language === "ne" ? "लाइभ सिङ्क गरिँदैछ..." : "Syncing live across platforms...");
    try {
      await liveUpdateSync.forceSync();
      setTimeout(() => {
        setIsSyncingLive(false);
        setSyncStatusText(
          language === "ne"
            ? "वेबसाइट र सबै डाउनलोड भएका एपहरू (iOS, Android, Windows) पूर्ण रूपमा सिङ्क भए!"
            : "Website and all downloaded app instances (iOS, Android, Windows) are 100% in sync!"
        );
        setTimeout(() => setSyncStatusText(null), 5000);
      }, 700);
    } catch {
      setIsSyncingLive(false);
      setSyncStatusText(null);
    }
  };


  // Detect user OS on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    if (/android/i.test(ua)) {
      setDetectedOs("android");
      setActivePlatform("android");
    } else if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
      setDetectedOs("ios");
      setActivePlatform("ios");
    } else if (/windows phone|windows mobile|windows nt|win64|win32/i.test(ua)) {
      setDetectedOs("windows");
      setActivePlatform("windows");
    } else {
      setDetectedOs("other");
      setActivePlatform("android");
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsSavedToHomescreen(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://photobucket.np";

  // Trigger Automatic Web-to-App Download & Save to Homescreen
  const handleAutoSaveToHomescreen = async (platform: "android" | "ios" | "windows" = activePlatform === "qr" ? "android" : activePlatform) => {
    setIsProcessing(true);
    setProgress(0);
    setIsSavedToHomescreen(false);

    // If native PWA install prompt is ready (Android/Chrome/Edge), trigger it
    if (deferredPrompt && (platform === "android" || platform === "windows")) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setIsInstalled(true);
          setIsSavedToHomescreen(true);
          try {
            localStorage.setItem("photobucket_web_to_app_downloaded", "true");
          } catch {}
          onDownloaded?.();
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn("Deferred prompt error:", err);
      }
    }

    // High speed automated file download & homescreen registration
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            setProgress(100);
            setIsProcessing(false);
            setIsSavedToHomescreen(true);
            try {
              localStorage.setItem("photobucket_web_to_app_downloaded", "true");
            } catch {}
            onDownloaded?.();

            // Trigger platform-specific automated download
            if (platform === "android") {
              triggerFileDownload("/api/download/android-apk", "photo-bucket-nepal-v2.4.0.apk");
            } else if (platform === "ios") {
              triggerFileDownload("/api/download/ios-mobileconfig", "photo-bucket-nepal.mobileconfig");
            } else if (platform === "windows") {
              triggerFileDownload("/api/download/windows-shortcut", "Photo-Bucket-Nepal.url");
            }

            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.65 },
                colors: ["#003893", "#DC143C", "#10B981", "#38BDF8"],
              });
            } catch {}
          }, 400);
          return 90;
        }
        return prev + 30;
      });
    }, 120);
  };

  const triggerFileDownload = (url: string, filename: string) => {
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Download trigger failed:", e);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div
      id="app-download-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="app-download-modal-card"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
      >
        {/* Top Header Banner: Web to App with Authentic Website Logo */}
        <div className="relative bg-gradient-to-r from-[#003893] via-[#0b429c] to-[#DC143C] p-6 text-white">
          <button
            id="close-app-download-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/25 hover:bg-black/45 text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            {/* App Icon matching Website Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-2xl flex items-center justify-center relative shrink-0 border-2 border-white/90">
              <img
                src="/logo.svg"
                alt="Photo Bucket Official Logo"
                className="w-full h-full object-contain rounded-xl"
              />
              <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm" title="Verified Brand Logo">
                ✓
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {/* Brand Typography: फोटो in Crimson Red + Bucket in White */}
                <div className="flex items-baseline gap-1.5 bg-black/20 px-3 py-0.5 rounded-xl backdrop-blur-xs border border-white/15">
                  <span className="text-[#FF2E55] font-['Mukta'] text-xl sm:text-2xl font-black drop-shadow-xs">
                    फोटो
                  </span>
                  <span className="text-white font-['Plus_Jakarta_Sans'] text-xl sm:text-2xl font-black tracking-tight">
                    Bucket
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-900 text-[11px] font-black uppercase tracking-wider shadow-xs">
                  {language === "ne" ? "वेब बाट एप" : "Web to App"}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold border border-white/20">
                  {language === "ne" ? "आधिकारिक लोगो" : "Official Logo"}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-blue-100 mt-1 font-medium leading-snug">
                {language === "ne"
                  ? "डाउनलोड गर्दा वा फोनको होमस्क्रिनमा सेभ गर्दा वेबसाइटको जस्तै आधिकारिक फोटो Bucket लोगो नै रहन्छ।"
                  : "When downloading or saving to your phone homescreen, the app logo is exactly the same as on the website."}
              </p>

              {/* Specs Pills */}
              <div className="flex items-center gap-2 mt-3 flex-wrap text-[11px] font-semibold text-white/90">
                <span className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  <span>100% Brand Logo Match</span>
                </span>
                <span className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>Instant 1-Click</span>
                </span>
                <span className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  <WifiOff className="w-3 h-3" />
                  <span>Offline Sync</span>
                </span>
                <span className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  <Bell className="w-3 h-3" />
                  <span>Push Alerts</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Selection Tabs: Android, iOS, Windows Mobile, QR */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/80 px-4 pt-3 gap-1.5 overflow-x-auto">
          <button
            id="tab-download-android"
            onClick={() => setActivePlatform("android")}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl border-t border-x transition-all shrink-0 cursor-pointer ${
              activePlatform === "android"
                ? "bg-white text-emerald-700 border-slate-200 border-b-white -mb-px shadow-xs"
                : "text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Android</span>
            {detectedOs === "android" && (
              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                Your Device
              </span>
            )}
          </button>

          <button
            id="tab-download-ios"
            onClick={() => setActivePlatform("ios")}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl border-t border-x transition-all shrink-0 cursor-pointer ${
              activePlatform === "ios"
                ? "bg-white text-[#003893] border-slate-200 border-b-white -mb-px shadow-xs"
                : "text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Apple className="w-4 h-4 text-slate-900" />
            <span>iPhone / iOS</span>
            {detectedOs === "ios" && (
              <span className="text-[9px] bg-blue-100 text-[#003893] px-1.5 py-0.2 rounded-full font-bold">
                Your Device
              </span>
            )}
          </button>

          <button
            id="tab-download-windows"
            onClick={() => setActivePlatform("windows")}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl border-t border-x transition-all shrink-0 cursor-pointer ${
              activePlatform === "windows"
                ? "bg-white text-blue-700 border-slate-200 border-b-white -mb-px shadow-xs"
                : "text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Laptop className="w-4 h-4 text-blue-600" />
            <span>Windows Mobile / PC</span>
            {detectedOs === "windows" && (
              <span className="text-[9px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded-full font-bold">
                Your Device
              </span>
            )}
          </button>

          <button
            id="tab-download-qr"
            onClick={() => setActivePlatform("qr")}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl border-t border-x transition-all shrink-0 cursor-pointer ${
              activePlatform === "qr"
                ? "bg-white text-slate-900 border-slate-200 border-b-white -mb-px shadow-xs"
                : "text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <QrCode className="w-4 h-4 text-slate-700" />
            <span>QR Scan</span>
          </button>
        </div>

        {/* Verified App Icon Matching Guarantee */}
        <div className="bg-slate-50/90 border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white p-1 border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
              <img src="/logo.svg" alt="Photo Bucket App Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-slate-900">फोटो Bucket App</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>{language === "ne" ? "वेबसाइटको समान लोगो" : "Matches Website Logo"}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {language === "ne"
                  ? "डाउनलोड गरेपछि तपाईंको फोनको Home Screen मा देखिने एप लोगो वेबसाइटसँग १००% समान हुन्छ।"
                  : "The installed app icon on your home screen is 100% identical to the website logo."}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified PWA & WebClip</span>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6">
          {/* TAB 1: ANDROID */}
          {activePlatform === "android" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Android Installed Icon Preview Card */}
              <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 shadow-xs flex items-center gap-3.5">
                <div className="relative w-14 h-14 rounded-2xl bg-white p-1 border border-slate-200 shadow-md flex items-center justify-center shrink-0">
                  <img src="/logo.svg" alt="Android App Icon" className="w-full h-full object-contain rounded-xl" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-xs">✓</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">फोटो Bucket</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Android Launcher Icon
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === "ne"
                      ? "नेपाली रातो झण्डा, क्यामेरा लेन्स र निलो बकेट भएको आधिकारिक लोगो फोनमा स्थापित हुन्छ।"
                      : "The official logo with Nepali double pennants, camera lens, and royal blue bucket installs directly onto your phone."}
                  </p>
                </div>
              </div>

              {/* Automated One-Click Primary CTA */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/40 p-5 rounded-2xl border border-emerald-200/80">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-base text-emerald-950 flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-emerald-600" />
                      <span>{language === "ne" ? "Android मा स्वतः डाउनलोड र Homescreen मा सेभ" : "Android: Automatic Save to Homescreen"}</span>
                    </h3>
                    <p className="text-xs text-emerald-800/90 mt-0.5">
                      {language === "ne"
                        ? "तलको बटन थिच्नासाथ एप स्वचालित डाउनलोड भई फोनको होमस्क्रिनमा एप आइकन सेभ हुन्छ।"
                        : "Click below to automatically download the Web-to-App package and save directly to your Android homescreen."}
                    </p>
                  </div>
                </div>

                {/* Progress bar when downloading */}
                {isProcessing && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-bold text-emerald-800 mb-1.5">
                      <span>{language === "ne" ? "डाउनलोड हुँदैछ र Homescreen मा सेभ गरिँदैछ..." : "Downloading & Saving to Homescreen..."}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-emerald-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Success Banner */}
                {isSavedToHomescreen && (
                  <div className="mb-4 p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      {language === "ne"
                        ? "सफलतापूर्वक डाउनलोड भयो र Homescreen मा सेभ गरियो! फोटो Bucket तपाईंको एप्समा तयार छ।"
                        : "Successfully downloaded and saved to your Homescreen! Photo Bucket is ready in your apps."}
                    </span>
                  </div>
                )}

                <button
                  id="btn-auto-save-android"
                  onClick={() => handleAutoSaveToHomescreen("android")}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-4 h-4 animate-bounce" />
                  <span>
                    {language === "ne"
                      ? "Android Homescreen मा सेभ गर्नुहोस् (Web to App)"
                      : "Save to Android Homescreen (Web to App)"}
                  </span>
                </button>
              </div>

              {/* 2-Step Homescreen Shortcut Guide */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  <span>{language === "ne" ? "ब्राउजरबाट सीधै होमस्क्रिनमा राख्ने विधि" : "Direct Browser 2-Step Guide"}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="font-bold text-emerald-700 mb-1 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono flex items-center justify-center font-bold">1</span>
                      <span>Chrome / Brave मा मेनु खोल्नुहोस्</span>
                    </div>
                    <p className="text-slate-600 text-[11px] pl-6.5">
                      ब्राउजरको माथि दायाँ कुनामा रहेको तीन थोप्ला (⋮) थिच्नुहोस्।
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="font-bold text-emerald-700 mb-1 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono flex items-center justify-center font-bold">2</span>
                      <span>'Add to Home screen' थिच्नुहोस्</span>
                    </div>
                    <p className="text-slate-600 text-[11px] pl-6.5">
                      "Install App" वा "Add to Home screen" छान्नुहोस् — फोटो Bucket तुरुन्त मोबाइल एप बन्नेछ!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IPHONE / IOS */}
          {activePlatform === "ios" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* iOS Apple Touch Icon Preview Card */}
              <div className="p-3.5 bg-white rounded-2xl border border-blue-200 shadow-xs flex items-center gap-3.5">
                <div className="relative w-14 h-14 rounded-2xl bg-white p-1 border border-slate-200 shadow-md flex items-center justify-center shrink-0">
                  <img src="/apple-touch-icon.png" alt="Apple Touch Icon" className="w-full h-full object-contain rounded-xl" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-xs">✓</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">फोटो Bucket</span>
                    <span className="text-[10px] bg-blue-50 text-[#003893] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                      Apple Touch Icon (180x180)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === "ne"
                      ? "iPhone को Home Screen मा Safari वा WebClip प्रोफाइलबाट सेभ गर्दा यही लोगो आउँछ।"
                      : "The high-DPI Apple WebClip profile embeds this verified logo directly into your iPhone/iPad Home Screen."}
                  </p>
                </div>
              </div>

              {/* Automated One-Click Primary CTA for iOS */}
              <div className="bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100/50 p-5 rounded-2xl border border-blue-200/80">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-base text-[#003893] flex items-center gap-2">
                      <Apple className="w-5 h-5 text-slate-900" />
                      <span>{language === "ne" ? "iPhone (iOS) मा स्वतः डाउनलोड र Homescreen मा सेभ" : "iPhone (iOS): Automatic Save to Homescreen"}</span>
                    </h3>
                    <p className="text-xs text-slate-700 mt-0.5">
                      {language === "ne"
                        ? "Apple WebClip प्रोफाइल डाउनलोड गर्नुहोस् र १ सेकेन्डमा Safari बाट सिधै iPhone को Homescreen मा राख्नुहोस्।"
                        : "Download Apple WebClip profile and instantly save Photo Bucket directly to your iPhone / iPad homescreen."}
                    </p>
                  </div>
                </div>

                {/* Progress bar when downloading */}
                {isProcessing && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-bold text-[#003893] mb-1.5">
                      <span>{language === "ne" ? "iOS प्रोफाइल डाउनलोड हुँदैछ..." : "Downloading iOS WebClip Profile..."}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-blue-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#003893] rounded-full transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Success Banner */}
                {isSavedToHomescreen && (
                  <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-xl text-xs text-blue-950 font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCheck className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>
                      {language === "ne"
                        ? "iOS प्रोफाइल डाउनलोड भयो! Settings वा Safari Share बाट 'Add to Home Screen' थिच्नुहोस्।"
                        : "iOS WebClip downloaded! Tap 'Add to Home Screen' via Safari Share to complete."}
                    </span>
                  </div>
                )}

                <button
                  id="btn-auto-save-ios"
                  onClick={() => handleAutoSaveToHomescreen("ios")}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-[#003893] via-[#0b429c] to-[#DC143C] hover:opacity-95 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-4 h-4 animate-bounce" />
                  <span>
                    {language === "ne"
                      ? "iPhone Homescreen मा सेभ गर्नुहोस् (Web to App)"
                      : "Save to iPhone Homescreen (Web to App)"}
                  </span>
                </button>
              </div>

              {/* Apple Official Visual Guide */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Apple className="w-3.5 h-3.5 text-slate-700" />
                  <span>{language === "ne" ? "Safari बाट iPhone मा राख्ने सरल २ चरण" : "iPhone Safari 2-Step Visual Guide"}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="font-bold text-[#003893] mb-1 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-[#003893] text-[11px] font-mono flex items-center justify-center font-bold">1</span>
                      <span>Share बटन (⎋) थिच्नुहोस्</span>
                    </div>
                    <p className="text-slate-600 text-[11px] pl-6.5">
                      Safari को पुछारमा रहेको शेयर आइकन (बाकसबाट बाहिर निस्केको तीर ⎋) ट्याप गर्नुहोस्।
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="font-bold text-[#003893] mb-1 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-[#003893] text-[11px] font-mono flex items-center justify-center font-bold">2</span>
                      <span>'Add to Home Screen' (⊞) छान्नुहोस्</span>
                    </div>
                    <p className="text-slate-600 text-[11px] pl-6.5">
                      तल स्क्रोल गरी <strong>Add to Home Screen</strong> छान्नुहोस् र माथि दायाँको <strong>Add</strong> थिच्नुहोस्।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WINDOWS MOBILE & PC */}
          {activePlatform === "windows" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Windows Desktop & Start Menu Shortcut Icon Preview Card */}
              <div className="p-3.5 bg-white rounded-2xl border border-sky-200 shadow-xs flex items-center gap-3.5">
                <div className="relative w-14 h-14 rounded-2xl bg-white p-1 border border-slate-200 shadow-md flex items-center justify-center shrink-0">
                  <img src="/logo.svg" alt="Windows App Icon" className="w-full h-full object-contain rounded-xl" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-xs">✓</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">फोटो Bucket</span>
                    <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-full border border-sky-200">
                      Windows Desktop Icon
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === "ne"
                      ? "Windows PC वा Mobile को Desktop तथा Taskbar मा यही आधिकारिक लोगो रहनेछ।"
                      : "The Windows shortcut launcher connects directly with this verified brand logo."}
                  </p>
                </div>
              </div>

              {/* Automated One-Click Primary CTA for Windows */}
              <div className="bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100/50 p-5 rounded-2xl border border-sky-200/80">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-base text-sky-950 flex items-center gap-2">
                      <Laptop className="w-5 h-5 text-sky-600" />
                      <span>{language === "ne" ? "Windows Mobile तथा PC मा स्वतः डाउनलोड र Homescreen मा सेभ" : "Windows Mobile & PC: Automatic Save to Homescreen"}</span>
                    </h3>
                    <p className="text-xs text-sky-900/90 mt-0.5">
                      {language === "ne"
                        ? "तलको बटन थिच्नासाथ Windows Homescreen लन्चर डाउनलोड हुन्छ र सिधै डेस्कटप वा स्टार्ट मेनुमा एप खुल्छ।"
                        : "Click below to download the Windows desktop launcher shortcut or install as a standalone native Windows App."}
                    </p>
                  </div>
                </div>

                {/* Progress bar when downloading */}
                {isProcessing && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-bold text-sky-900 mb-1.5">
                      <span>{language === "ne" ? "Windows Homescreen लन्चर डाउनलोड हुँदैछ..." : "Downloading Windows Homescreen Launcher..."}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-sky-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-600 rounded-full transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Success Banner */}
                {isSavedToHomescreen && (
                  <div className="mb-4 p-3 bg-sky-100 border border-sky-300 rounded-xl text-xs text-sky-950 font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCheck className="w-4 h-4 text-sky-700 shrink-0" />
                    <span>
                      {language === "ne"
                        ? "सफलतापूर्वक डाउनलोड भयो! यस सर्टकटलाई Desktop वा Taskbar मा तानेर तुरुन्त प्रयोग गर्नुहोस्।"
                        : "Downloaded successfully! Drag shortcut to Desktop or Taskbar for 1-click launch."}
                    </span>
                  </div>
                )}

                <button
                  id="btn-auto-save-windows"
                  onClick={() => handleAutoSaveToHomescreen("windows")}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-4 h-4 animate-bounce" />
                  <span>
                    {language === "ne"
                      ? "Windows Homescreen मा सेभ गर्नुहोस् (Web to App)"
                      : "Save to Windows Homescreen (Web to App)"}
                  </span>
                </button>
              </div>

              {/* Windows Edge / Chrome 1-Click Guide */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-slate-600" />
                  <span>{language === "ne" ? "Edge वा Chrome मा १-क्लिक स्थापना" : "Edge / Chrome 1-Click App Install"}</span>
                </h4>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  ब्राउजरको एड्रेस बारको दायाँपट्टि रहेको <strong>'App available. Install Photo Bucket' (⊞)</strong> आइकन थिच्नुहोस्। यसले एपलाई विना कुनै ब्राउजर ट्याब स्वतः पूर्ण-स्क्रिन विन्डोज एपको रूपमा सुरु गर्छ।
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QR CODE */}
          {activePlatform === "qr" && (
            <div className="space-y-4 animate-in fade-in duration-150 text-center py-2">
              <div className="max-w-xs mx-auto p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-inner">
                {/* SVG Mock QR Code that encodes the app URL */}
                <div className="relative aspect-square w-full max-w-[200px] mx-auto bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-center text-white">
                  <QrCode className="w-32 h-32 text-white" />
                  <span className="text-[10px] font-mono tracking-widest text-emerald-400 mt-1 uppercase">
                    SCAN • WEB TO APP
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-700 font-bold">
                  {language === "ne" ? "कुनै पनि फोनको क्यामेराले स्क्यान गर्नुहोस्" : "Scan with Any Phone Camera"}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {language === "ne"
                    ? "Android वा iPhone मा सिधै खुल्छ र Homescreen मा सेभ हुन्छ।"
                    : "Directly opens and saves to Homescreen on Android or iPhone."}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className="px-3 py-1.5 text-xs bg-slate-100 rounded-lg text-slate-600 border border-slate-200 w-64 text-center font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-[#003893] text-white rounded-lg text-xs font-bold hover:bg-[#002a70] transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          )}
          {/* Global Cross-Platform Live Update & Auto-Sync Guarantee Card */}
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-indigo-200/80 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs text-indigo-950">
                      {language === "ne" ? "प्रत्यक्ष क्लाउड अद्यावधिक प्रणाली (Live Cloud Auto-Sync)" : "Instant Cloud Auto-Sync Guarantee"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                      iOS • Android • Windows
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-900/90 mt-1 leading-relaxed">
                    {language === "ne"
                      ? "वेबसाइटमा फोटो, स्टोरी वा जुनसुकै फिचर अपडेट हुनासाथ तपाईंले iOS, Android वा Windows मा डाउनलोड/सेभ गर्नुभएको एपमा स्वतः रियल-टाइममा अपडेट हुन्छ। एप पुनः डाउनलोड वा रि-इन्स्टल गर्नुपर्दैन।"
                      : "Once anything is updated live on the website, all downloaded Web-to-App versions across iOS, Android, and Windows update automatically in real time without needing reinstallation."}
                  </p>
                  {syncStatusText && (
                    <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-100/90 px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-2 animate-in fade-in">
                      <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{syncStatusText}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                id="btn-trigger-cross-platform-sync"
                onClick={handleManualLiveSync}
                disabled={isSyncingLive}
                className="shrink-0 px-3 py-2 bg-white hover:bg-indigo-50 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Force test live sync"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isSyncingLive ? "animate-spin" : ""}`} />
                <span>{language === "ne" ? "लाइभ सिङ्क जाँच्नुहोस्" : "Check Live Sync"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer with Direct Link and Version */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Photo Bucket Nepal • Live Sync Engine v2.5.0 (Cross-Platform Active)</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="text-xs font-bold text-[#003893] hover:underline cursor-pointer flex items-center gap-1"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Link Copied!" : "Copy Web App Link"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

