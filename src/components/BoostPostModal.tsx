import React, { useState } from "react";
import { Post, User } from "../types";
import { api } from "../services/api";
import {
  X,
  Sparkles,
  MapPin,
  Building,
  Globe2,
  TrendingUp,
  Target,
  CheckCircle2,
  CreditCard,
  Calendar,
  AlertCircle,
  Eye,
  MousePointer,
  Compass,
} from "lucide-react";
import { NepalLocationSelector } from "./NepalLocationSelector";
import confetti from "canvas-confetti";

interface BoostPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  currentUser: User;
  onBoostSuccess: (updatedPost: Post) => void;
  language: "en" | "ne";
}

export const BoostPostModal: React.FC<BoostPostModalProps> = ({
  isOpen,
  onClose,
  post,
  currentUser,
  onBoostSuccess,
  language,
}) => {
  const [scope, setScope] = useState<"city" | "district" | "entire_nepal">("city");
  const [targetDistrict, setTargetDistrict] = useState(post.district || currentUser.district || "Kathmandu");
  const [targetCity, setTargetCity] = useState(post.city || currentUser.city || "Central City");
  const [targetProvince, setTargetProvince] = useState(post.province || currentUser.province || "Bagmati");
  
  const [budgetNPR, setBudgetNPR] = useState(1200);
  const [durationDays, setDurationDays] = useState(7);
  const [paymentMethod, setPaymentMethod] = useState<"esewa" | "khalti" | "connectips" | "corporate_pan">("esewa");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Estimated reach calculation based on scope and budget
  const calculateEstimatedReach = () => {
    const baseMultiplier = scope === "city" ? 18 : scope === "district" ? 15 : 12;
    const reach = Math.round(budgetNPR * baseMultiplier * (durationDays / 7));
    const clicks = Math.round(reach * 0.045);
    return { reach: reach.toLocaleString(), clicks: clicks.toLocaleString() };
  };

  const { reach, clicks } = calculateEstimatedReach();

  const handleBoostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.boostPost(post.id, {
        scope,
        targetDistrict: scope !== "entire_nepal" ? targetDistrict : undefined,
        targetCity: scope === "city" ? targetCity : undefined,
        budgetNPR,
        durationDays,
        boostedBy: currentUser.businessName || currentUser.fullName,
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#DC143C", "#003893", "#F59E0B"],
      });

      setSuccessMsg(res.message);
      setTimeout(() => {
        onBoostSuccess(res.post);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to boost post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="boost-post-modal"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 px-5 py-4 text-white flex items-center justify-between border-b border-rose-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#DC143C] to-amber-500 flex items-center justify-center text-white shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-white font-['Mukta']">
                  {language === "ne" ? "पोस्ट प्रवर्द्धन (Boost Post)" : "Boost Post Campaign"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Nepal Targeted</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {language === "ne"
                  ? "शहर, जिल्ला वा समग्र नेपालभर व्यवसायिक रूपमा तस्बिर प्रवर्द्धन गर्नुहोस्"
                  : "Target & boost visual posts city-wise, district-wise, or across All Nepal"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleBoostSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Post Snippet Preview */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <img
              src={post.imageUrl}
              alt="Post preview"
              className="w-16 h-16 rounded-xl object-cover bg-slate-200 flex-shrink-0 border"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-bold text-xs text-slate-900 truncate">@{post.username}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                  {post.district}
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-1 italic">
                "{post.caption || post.nepaliCaption}"
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                <span>{post.likes.length} Likes</span>
                <span>•</span>
                <span>{post.comments.length} Comments</span>
              </div>
            </div>
          </div>

          {/* Scope Selector: City-wise, District-wise, Entire Nepal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-[#003893]" />
              <span>{language === "ne" ? "प्रवर्द्धन क्षेत्र (Targeting Scope):" : "Geographic Targeting Scope:"}</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScope("city")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  scope === "city"
                    ? "bg-rose-50/80 border-[#DC143C] ring-2 ring-[#DC143C]/20 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Building className={`w-4 h-4 ${scope === "city" ? "text-[#DC143C]" : "text-slate-500"}`} />
                  <span className="text-xs font-bold text-slate-900">City-Wise</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Target local residents & tourists in a specific city/town.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScope("district")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  scope === "district"
                    ? "bg-blue-50/80 border-[#003893] ring-2 ring-[#003893]/20 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className={`w-4 h-4 ${scope === "district" ? "text-[#003893]" : "text-slate-500"}`} />
                  <span className="text-xs font-bold text-slate-900">District-Wise</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Reach all users across one of Nepal's 77 districts.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScope("entire_nepal")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  scope === "entire_nepal"
                    ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Globe2 className={`w-4 h-4 ${scope === "entire_nepal" ? "text-amber-600" : "text-slate-500"}`} />
                  <span className="text-xs font-bold text-slate-900">Entire Nepal</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Country-wide reach across all 7 provinces.
                </p>
              </button>
            </div>
          </div>

          {/* Location Selector if City or District scope */}
          {scope !== "entire_nepal" && (
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#003893]" />
                  <span>
                    {scope === "city"
                      ? "Select Target District & City of Nepal:"
                      : "Select Target District of Nepal (77 Districts):"}
                  </span>
                </span>
              </div>

              <NepalLocationSelector
                idPrefix="boost"
                district={targetDistrict}
                city={targetCity}
                province={targetProvince}
                accentColor={scope === "city" ? "crimson" : "blue"}
                onLocationChange={(loc) => {
                  setTargetDistrict(loc.district);
                  setTargetCity(loc.city);
                  setTargetProvince(loc.province);
                }}
                helperNote={
                  scope === "city"
                    ? `🎯 Your post will appear as a 'Featured Boost' in ${targetCity}, ${targetDistrict} (${targetProvince} Province).`
                    : `🎯 Your post will be boosted across all cities and communities throughout ${targetDistrict} District.`
                }
              />
            </div>
          )}

          {/* Budget & Estimated Reach */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Campaign Budget (NPR रू)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-xs text-slate-500">
                  NPR रू
                </span>
                <select
                  value={budgetNPR}
                  onChange={(e) => setBudgetNPR(Number(e.target.value))}
                  className="w-full pl-18 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30"
                >
                  <option value={500}>500 (Starter Local)</option>
                  <option value={1200}>1,200 (Recommended Growth)</option>
                  <option value={2500}>2,500 (High Visibility)</option>
                  <option value={5000}>5,000 (Mega Campaign)</option>
                  <option value={10000}>10,000 (Omni-Nepal Blitz)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Campaign Duration</span>
              </label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30"
              >
                <option value={3}>3 Days (Weekend Spotlight)</option>
                <option value={7}>7 Days (1 Week Standard)</option>
                <option value={14}>14 Days (2 Weeks Intensive)</option>
                <option value={30}>30 Days (Monthly Branding)</option>
              </select>
            </div>
          </div>

          {/* Real-time Estimated Analytics Metric Box */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 to-rose-50/90 border border-blue-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center text-[#003893]">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Estimated Reach</p>
                <p className="text-sm font-extrabold text-[#003893] font-mono leading-tight">
                  ~{reach} <span className="text-[10px] font-normal text-slate-600">views</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-600/10 flex items-center justify-center text-[#DC143C]">
                <MousePointer className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Profile / Tag Clicks</p>
                <p className="text-sm font-extrabold text-[#DC143C] font-mono leading-tight">
                  ~{clicks} <span className="text-[10px] font-normal text-slate-600">interactions</span>
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method in Nepal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>Payment Gateway (नेपाल भुक्तानी प्रणाली):</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "esewa", label: "eSewa 🇳🇵", sub: "Wallet / QR" },
                { id: "khalti", label: "Khalti", sub: "Digital Pay" },
                { id: "connectips", label: "connectIPS", sub: "Direct Bank" },
                { id: "corporate_pan", label: "PAN Invoice", sub: "Business Bill" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === m.id
                      ? "border-[#003893] bg-blue-50 text-[#003893] font-bold ring-1 ring-[#003893]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-xs">{m.label}</div>
                  <div className="text-[10px] text-slate-400">{m.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-slate-500">Total Investment:</p>
              <p className="text-base font-extrabold text-slate-900 font-mono">
                NPR रू {budgetNPR.toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#DC143C] to-rose-700 hover:from-rose-700 hover:to-[#DC143C] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loading ? "Activating Boost..." : `Confirm & Boost Now`}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
