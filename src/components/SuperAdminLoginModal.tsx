import React, { useState } from "react";
import {
  ShieldAlert,
  Lock,
  UserCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  CheckCircle2,
  Fingerprint,
} from "lucide-react";
import { User } from "../types";
import { api } from "../services/api";

interface SuperAdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  language?: "en" | "ne";
}

export const SuperAdminLoginModal: React.FC<SuperAdminLoginModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  language = "en",
}) => {
  const [roleType, setRoleType] = useState<"super_admin" | "admin">("super_admin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError(
        language === "ne"
          ? "कृपया आधिकारिक इमेल वा युजरनेम र पासवर्ड प्रविष्ट गर्नुहोस्।"
          : "Please enter your official administrator identifier and password."
      );
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.login({
        sector: "admin",
        identifier: identifier.trim(),
        password: password.trim(),
      });

      if (res && res.user) {
        setSuccessMessage(
          res.isSuperAdmin
            ? language === "ne"
              ? "रूट सुपर एडमिन प्रमाणीकरण सफल भयो! कमाण्ड सेन्टर खुल्दैछ..."
              : "Root Super Admin verified! Opening Command Center..."
            : language === "ne"
            ? `प्रशासकीय स्टाफ (${res.user.fullName}) प्रमाणीकरण सफल! पोर्टल खुल्दैछ...`
            : `Administrative Staff (${res.user.fullName}) verified! Opening portal...`
        );

        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 750);
      } else {
        throw new Error("Invalid response from authorization service.");
      }
    } catch (err: any) {
      console.error("Admin login error:", err);
      setError(
        err.message ||
          (language === "ne"
            ? "प्रशासकीय प्रमाणीकरण असफल भयो। कृपया आधिकारिक विवरण जाँच गर्नुहोस्।"
            : "Administrative authorization failed. Please check your credentials.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="super-admin-login-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="super-admin-login-modal"
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Decorative Nepal Flag Gradient Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#DC143C] via-indigo-600 to-[#003893]" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-900/60 to-slate-900 border border-rose-500/40 text-rose-400 shadow-md">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                    {language === "ne"
                      ? "प्रशासकीय लगइन गेटवे"
                      : "Administrative Access Gateway"}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Restricted
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === "ne"
                    ? "अधिकृत प्रशासकहरूको लागि मात्र"
                    : "For authorized administrators only"}
                </p>
              </div>
            </div>

            <button
              id="close-super-admin-login-modal-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Mode Selector */}
          <div className="mt-4 grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              id="select-super-admin-role-btn"
              type="button"
              onClick={() => {
                setRoleType("super_admin");
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                roleType === "super_admin"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-900/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>{language === "ne" ? "सुपर एडमिन" : "Root Super Admin"}</span>
            </button>

            <button
              id="select-admin-role-btn"
              type="button"
              onClick={() => {
                setRoleType("admin");
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                roleType === "admin"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{language === "ne" ? "प्रशासकीय स्टाफ" : "Admin Staff"}</span>
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Error Message Display */}
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-start gap-2 text-xs text-red-200 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Success Message Display */}
          {successMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-center gap-2 text-xs text-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* Input 1: Identifier */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
              {roleType === "super_admin"
                ? language === "ne"
                  ? "सुपर एडमिन इमेल वा युजरनेम"
                  : "Super Admin Email or Username"
                : language === "ne"
                ? "स्टाफ इमेल वा युजरनेम"
                : "Staff Email or Username"}
            </label>
            <div className="relative">
              <input
                id="admin-login-identifier-input"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError(null);
                }}
                placeholder={
                  language === "ne"
                    ? "आधिकारिक इमेल वा युजरनेम प्रविष्ट गर्नुहोस्"
                    : "Enter official email or username"
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-mono transition"
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          {/* Input 2: Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                {language === "ne" ? "प्रशासकीय पासवर्ड" : "Administrative Password"}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPassword ? "Hide" : "Show"}</span>
              </button>
            </div>
            <div className="relative">
              <input
                id="admin-login-password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-mono transition"
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            id="super-admin-authenticate-submit-btn"
            type="submit"
            disabled={loading || !identifier.trim() || !password.trim()}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
              roleType === "super_admin"
                ? "bg-[#DC143C] hover:bg-rose-700 shadow-rose-950/60"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-950/60"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{language === "ne" ? "प्रमाणीकरण हुँदैछ..." : "Verifying..."}</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>
                  {roleType === "super_admin"
                    ? language === "ne"
                      ? "सुपर एडमिन लगइन गर्नुहोस्"
                      : "Sign In to Super Admin"
                    : language === "ne"
                    ? "स्टाफ एडमिन लगइन गर्नुहोस्"
                    : "Sign In to Admin Staff"}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950/90 border-t border-slate-800/80 text-center">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            फोटो Bucket Nepal • Authorized Administrative Gateway
          </p>
        </div>
      </div>
    </div>
  );
};
