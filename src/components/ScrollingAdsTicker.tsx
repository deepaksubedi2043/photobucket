import React, { useState } from "react";
import {
  Megaphone,
  Sparkles,
  Camera,
  Compass,
  Store,
  ArrowRight,
  Mail,
  Phone,
  CheckCircle2,
  X,
  Send,
  Building2,
} from "lucide-react";
import { User } from "../types";

interface ScrollingAdsTickerProps {
  currentUser?: User | null;
  language: "en" | "ne";
}

interface AdBlockSlot {
  id: number;
  badgeEn: string;
  badgeNe: string;
  categoryEn: string;
  categoryNe: string;
  descEn: string;
  descNe: string;
  icon: React.ReactNode;
  iconBg: string;
  badgeBorder: string;
}

const AD_SLOTS: AdBlockSlot[] = [
  {
    id: 1,
    badgeEn: "Slot 01 • Prime",
    badgeNe: "स्थान ०१ • प्रिमियम",
    categoryEn: "Featured Sponsor",
    categoryNe: "प्रमुख प्रायोजक",
    descEn: "Reach thousands of authentic photographers and visual creators across Nepal.",
    descNe: "नेपालभरिका हजारौँ फोटोग्राफर तथा सिर्जनात्मक समुदायसम्म आफ्नो ब्राण्ड पुर्याउनुहोस्।",
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    iconBg: "bg-amber-500/15 border-amber-500/30",
    badgeBorder: "border-amber-500/40 text-amber-300 bg-amber-950/40",
  },
  {
    id: 2,
    badgeEn: "Slot 02 • Gear & Tech",
    badgeNe: "स्थान ०२ • क्यामेरा तथा गियर",
    categoryEn: "Photography Gear",
    categoryNe: "क्यामेरा उपकरण",
    descEn: "Promote camera equipment, lenses, lighting accessories, and creative software.",
    descNe: "क्यामेरा बडी, लेन्स, लाइटिङ र फोटो सम्पादन सामग्रीको विशेष प्रचार गर्नुहोस्।",
    icon: <Camera className="w-4 h-4 text-sky-400" />,
    iconBg: "bg-sky-500/15 border-sky-500/30",
    badgeBorder: "border-sky-500/40 text-sky-300 bg-sky-950/40",
  },
  {
    id: 3,
    badgeEn: "Slot 03 • Tourism",
    badgeNe: "स्थान ०३ • पर्यटन तथा यात्रा",
    categoryEn: "Expedition & Travel",
    categoryNe: "पदयात्रा तथा पर्यटन",
    descEn: "Highlight Himalayan trekking packages, resort stays, and cultural heritage tours.",
    descNe: "हिमाल पदयात्रा, रिसोर्ट बसाइ र नेपालका प्रमुख पर्यटकीय गन्तव्यहरू प्रस्तुत गर्नुहोस्।",
    icon: <Compass className="w-4 h-4 text-emerald-400" />,
    iconBg: "bg-emerald-500/15 border-emerald-500/30",
    badgeBorder: "border-emerald-500/40 text-emerald-300 bg-emerald-950/40",
  },
  {
    id: 4,
    badgeEn: "Slot 04 • Enterprise",
    badgeNe: "स्थान ०४ • व्यवसाय प्रवर्द्धन",
    categoryEn: "Local Business",
    categoryNe: "स्थानीय व्यवसाय",
    descEn: "Engage localized customers across Kathmandu, Pokhara, and all 77 districts.",
    descNe: "काठमाडौं, पोखरा लगायत ७७ वटै जिल्लामा लक्षित दर्शकमाझ व्यवसाय विस्तार गर्नुहोस्।",
    icon: <Store className="w-4 h-4 text-rose-400" />,
    iconBg: "bg-rose-500/15 border-rose-500/30",
    badgeBorder: "border-rose-500/40 text-rose-300 bg-rose-950/40",
  },
];

export const ScrollingAdsTicker: React.FC<ScrollingAdsTickerProps> = ({
  currentUser,
  language,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<AdBlockSlot | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    businessName: "",
    contactPerson: "",
    emailOrPhone: "",
    message: "",
  });

  const handleOpenSlot = (slot: AdBlockSlot) => {
    setSelectedSlot(slot);
    setFormSubmitted(false);
    setInquiryForm({
      businessName: currentUser?.businessName || "",
      contactPerson: currentUser?.name || "",
      emailOrPhone: currentUser?.email || "",
      message: "",
    });
  };

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div
      id="scrolling-ads-banner"
      className="relative w-full bg-slate-950 text-slate-200 border-t border-b border-slate-800/80 py-4 select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 4 Responsive Advertising Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {AD_SLOTS.map((slot) => {
            const badge = language === "ne" ? slot.badgeNe : slot.badgeEn;
            const category = language === "ne" ? slot.categoryNe : slot.categoryEn;
            const desc = language === "ne" ? slot.descNe : slot.descEn;

            return (
              <div
                key={slot.id}
                id={`ad-block-slot-${slot.id}`}
                onClick={() => handleOpenSlot(slot)}
                className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/85 hover:bg-slate-900 border border-slate-800 hover:border-slate-600/90 p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md"
              >
                {/* Top Badge & Icon */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${slot.badgeBorder} tracking-wide font-mono`}
                    >
                      {badge}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center border ${slot.iconBg} shrink-0 transition-transform group-hover:scale-105`}
                    >
                      {slot.icon}
                    </div>
                  </div>

                  {/* Primary Heading: Advertise Here */}
                  <div className="space-y-0.5">
                    <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                      <span>Advertise Here</span>
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400 font-['Mukta']">
                      यहाँ विज्ञापन गर्नुहोस्
                    </p>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-2">
                    {desc}
                  </p>
                </div>

                {/* Bottom Call to Action */}
                <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-blue-400 group-hover:text-blue-300 flex items-center gap-1 transition-colors">
                    <span>
                      {language === "ne"
                        ? "विज्ञापन बुक गर्नुहोस्"
                        : "Book This Space"}
                    </span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Available</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ad Booking & Inquiry Modal */}
      {selectedSlot && (
        <div
          id="advertise-here-inquiry-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedSlot(null)}
        >
          <div
            className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    {language === "ne"
                      ? "फोटो Bucket मा विज्ञापन गर्नुहोस्"
                      : "Advertise on फोटो Bucket Nepal"}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {language === "ne"
                      ? selectedSlot.badgeNe
                      : selectedSlot.badgeEn}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {formSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">
                    {language === "ne"
                      ? "विज्ञापन अनुरोध प्राप्त भयो!"
                      : "Advertisement Request Received!"}
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    {language === "ne"
                      ? "हाम्रो मार्केटिङ टोलीले छिट्टै तपाईंको इमेल वा फोनमा दर र विवरणसहित सम्पर्क गर्नेछ।"
                      : "Our advertising team will contact you shortly with slot placement options, rates, and schedule details."}
                  </p>
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="mt-2 px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition cursor-pointer"
                  >
                    {language === "ne" ? "बन्द गर्नुहोस्" : "Close"}
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="font-mono font-medium">
                        advertise@photobucket.np
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-mono text-[11px]">+977-9800000000</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitInquiry} className="space-y-3 pt-1">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        {language === "ne"
                          ? "कम्पनी / ब्राण्डको नाम"
                          : "Company / Brand Name"}
                      </label>
                      <input
                        type="text"
                        required
                        value={inquiryForm.businessName}
                        onChange={(e) =>
                          setInquiryForm({
                            ...inquiryForm,
                            businessName: e.target.value,
                          })
                        }
                        placeholder="e.g. Sony Alpha Nepal / Pokhara Resort"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">
                          {language === "ne"
                            ? "सम्पर्क व्यक्तिको नाम"
                            : "Contact Person"}
                        </label>
                        <input
                          type="text"
                          required
                          value={inquiryForm.contactPerson}
                          onChange={(e) =>
                            setInquiryForm({
                              ...inquiryForm,
                              contactPerson: e.target.value,
                            })
                          }
                          placeholder="Your Name"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">
                          {language === "ne"
                            ? "इमेल वा फोन नम्बर"
                            : "Email or Phone"}
                        </label>
                        <input
                          type="text"
                          required
                          value={inquiryForm.emailOrPhone}
                          onChange={(e) =>
                            setInquiryForm({
                              ...inquiryForm,
                              emailOrPhone: e.target.value,
                            })
                          }
                          placeholder="info@yourcompany.com"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        {language === "ne"
                          ? "विज्ञापन योजना वा सन्देश (वैकल्पिक)"
                          : "Campaign Details or Notes (Optional)"}
                      </label>
                      <textarea
                        rows={2}
                        value={inquiryForm.message}
                        onChange={(e) =>
                          setInquiryForm({
                            ...inquiryForm,
                            message: e.target.value,
                          })
                        }
                        placeholder="Briefly describe what you'd like to promote..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 resize-none"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSlot(null)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                      >
                        {language === "ne" ? "रद्द गर्नुहोस्" : "Cancel"}
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {language === "ne"
                            ? "अनुरोध पठाउनुहोस्"
                            : "Send Ad Request"}
                        </span>
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
