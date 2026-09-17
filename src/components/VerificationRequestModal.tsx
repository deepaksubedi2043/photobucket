import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Star,
  Building2,
  Briefcase,
  Camera,
  Landmark,
  UserCheck,
  Upload,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  Scale,
  Eye,
  Info,
} from "lucide-react";
import { User, VerificationCategory, VerificationDocType } from "../types";
import { api } from "../services/api";

interface VerificationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onApplicationSubmitted: (updatedUser: User) => void;
  language: "en" | "ne";
}

const CATEGORIES: {
  id: VerificationCategory;
  titleEn: string;
  titleNe: string;
  descEn: string;
  descNe: string;
  icon: any;
  defaultBadge: string;
  color: string;
}[] = [
  {
    id: "celebrity",
    titleEn: "Celebrity / Artist / Public Figure",
    titleNe: "सेलिब्रेटी / ख्यातिप्राप्त कलाकार",
    descEn: "Actors, musicians, filmmakers, athletes, models or public personalities with recognized media presence.",
    descNe: "अभिनेता, संगीतकार, चलचित्रकर्मी, खेलाडी वा राष्ट्रिय तथा अन्तर्राष्ट्रिय स्तरमा परिचित व्यक्तित्व।",
    icon: Star,
    defaultBadge: "Verified Celebrity 🌟",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "businessman",
    titleEn: "Businessman / Corporate Leader",
    titleNe: "व्यवसायी / कम्पनी सञ्चालक",
    descEn: "Established business owners, managing directors, corporate executives or commerce leaders.",
    descNe: "स्थापित व्यवसायी, प्रबन्ध निर्देशक वा उद्योग/वाणिज्य क्षेत्रका नेतृत्वकर्ता।",
    icon: Building2,
    defaultBadge: "Verified Businessman 🏢",
    color: "from-blue-600 to-indigo-600",
  },
  {
    id: "entrepreneur",
    titleEn: "Entrepreneur / Startup Founder",
    titleNe: "उद्यमी / स्टार्टअप संस्थापक",
    descEn: "Tech startup founders, social enterprise builders, innovators and venture creators.",
    descNe: "स्टार्टअप संस्थापक, सामाजिक उद्यमी, नयाँ प्रविधि तथा व्यवसायका सर्जक।",
    icon: Briefcase,
    defaultBadge: "Verified Entrepreneur 💼",
    color: "from-emerald-600 to-teal-600",
  },
  {
    id: "creator",
    titleEn: "Creator / Heritage Documentarian",
    titleNe: "सर्जक / सम्पदा वृत्तचित्रकार",
    descEn: "Acclaimed photographers, travel cinematographers, mountain guides and cultural storytellers.",
    descNe: "प्रख्यात फोटोग्राफर, यात्रा वृत्तचित्रकार, हिमाल पथप्रदर्शक तथा सांस्कृतिक सर्जक।",
    icon: Camera,
    defaultBadge: "Verified Creator 📸",
    color: "from-[#003893] to-cyan-600",
  },
  {
    id: "organization",
    titleEn: "Organization / Enterprise / Media",
    titleNe: "संस्था / व्यावसायिक प्रतिष्ठान / मिडिया",
    descEn: "Registered companies, news organizations, cultural trusts or non-profit institutions.",
    descNe: "नेपाल सरकारमा दर्ता भएको संस्था, सञ्चार माध्यम वा सांस्कृतिक प्रतिष्ठान।",
    icon: Landmark,
    defaultBadge: "Verified Enterprise 🏛️",
    color: "from-purple-600 to-pink-600",
  },
];

const DOC_TYPES: {
  id: VerificationDocType;
  titleEn: string;
  titleNe: string;
}[] = [
  {
    id: "citizenship",
    titleEn: "Nepali Citizenship Certificate (नागरिकताको प्रमाणपत्र)",
    titleNe: "नागरिकताको प्रमाणपत्र (दुवै भाग देखिने)",
  },
  {
    id: "passport",
    titleEn: "Official Passport (राहदानी)",
    titleNe: "आधिकारिक राहदानी (पहिलो र पछिल्लो पृष्ठ)",
  },
  {
    id: "national_id",
    titleEn: "National Identity Card (राष्ट्रिय परिचयपत्र)",
    titleNe: "राष्ट्रिय परिचयपत्र (NID Card)",
  },
  {
    id: "pan_card",
    titleEn: "PAN / VAT Certificate (स्थायी लेखा नम्बर दर्ता)",
    titleNe: "स्थायी लेखा नम्बर (PAN) प्रमाणपत्र",
  },
  {
    id: "company_reg",
    titleEn: "Company Registration Certificate (कम्पनी दर्ता / OCR)",
    titleNe: "कम्पनी रजिष्ट्रारको कार्यालय दर्ता प्रमाणपत्र",
  },
  {
    id: "media_reference",
    titleEn: "Media Recognition & Press Citations (सञ्चार माध्यम कभरेज)",
    titleNe: "प्रमुख मिडिया कभरेज तथा समाचार लिंकहरू",
  },
];

export const VerificationRequestModal: React.FC<VerificationRequestModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onApplicationSubmitted,
  language,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<VerificationCategory>(
    currentUser.accountType === "business" ? "businessman" : "celebrity"
  );
  const [selectedDocType, setSelectedDocType] = useState<VerificationDocType>("citizenship");
  const [documentName, setDocumentName] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [referenceLinks, setReferenceLinks] = useState("");
  const [notes, setNotes] = useState("");
  const [customBadgeTitle, setCustomBadgeTitle] = useState("");
  const [acceptedDirectives, setAcceptedDirectives] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!isOpen) return null;

  const currentCategoryMeta = CATEGORIES.find((c) => c.id === selectedCategory)!;
  const currentDocMeta = DOC_TYPES.find((d) => d.id === selectedDocType)!;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setDocumentUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!documentName || !documentUrl) {
      setError(
        language === "ne"
          ? "कृपया आफ्नो आधिकारिक सरकारी पहिचान वा कम्पनी दर्ता कागजात अपलोड गर्नुहोस्।"
          : "Please upload your official government identification or corporate registration document."
      );
      return;
    }

    if (!acceptedDirectives) {
      setError(
        language === "ne"
          ? "कृपया नेपाल सरकारको निर्देशिका तथा प्रामाणिकता सम्झौता स्वीकार गर्नुहोस्।"
          : "Please accept the legal authenticity statement and Nepal Government directives."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userId: currentUser.id,
        category: selectedCategory,
        documentType: selectedDocType,
        documentName,
        documentUrl,
        referenceLinks: referenceLinks.trim(),
        notes: notes.trim(),
        badgeTitle: customBadgeTitle.trim() || currentCategoryMeta.defaultBadge,
      };

      const res = await api.submitVerificationRequest(payload);
      if (res.success && res.user) {
        onApplicationSubmitted(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit verification request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="verification-request-modal"
      className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#003893] via-[#002a70] to-[#DC143C] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
              <ShieldCheck className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {language === "ne"
                    ? "ब्लू टिक प्रमाणीकरण आवेदन"
                    : "Apply for Verified Blue Tick"}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold font-mono">
                  ✓ Official ID Check
                </span>
              </div>
              <p className="text-xs text-white/80">
                {language === "ne"
                  ? "सेलिब्रेटी, व्यवसायी, उद्यमी तथा सर्जकहरूका लागि आधिकारिक पहिचान"
                  : "Authentic verification for Celebrities, Business Leaders, Entrepreneurs & Creators"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Eligibility Banner */}
          <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-3 text-xs text-slate-700">
            <Info className="w-4 h-4 text-[#003893] flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-[#003893]">
                {language === "ne" ? "प्रमाणीकरण प्रक्रिया:" : "Super Admin Review Protocol:"}{" "}
              </span>
              <span>
                {language === "ne"
                  ? "आवेदन प्राप्त भएपछि सुपर एडमिनले तपाईंले पेस गरेको आधिकारिक सरकारी कागजात (नागरिकता, राहदानी, प्यान वा कम्पनी दर्ता) प्रमाणीकरण गरी प्रोफाइलमा आधिकारिक ब्लू टिक र ब्याच प्रदान गर्नेछ।"
                  : "Upon submission, our Super Admin will manually review your submitted government identity or corporate registration documents and grant the official Blue Tick badge to your profile."}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Category Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              {language === "ne" ? "१. प्रमाणीकरण विधा छान्नुहोस्" : "1. Select Verification Category"} *
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setCustomBadgeTitle(cat.defaultBadge);
                    }}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-[#003893]/40"
                        : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "bg-white/20 text-white" : "bg-white text-[#003893] border border-slate-200"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>{language === "ne" ? cat.titleNe : cat.titleEn}</span>
                        {isSelected && <span className="text-[10px] text-cyan-300 font-mono">✓</span>}
                      </div>
                      <p
                        className={`text-[11px] leading-snug mt-0.5 line-clamp-2 ${
                          isSelected ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {language === "ne" ? cat.descNe : cat.descEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Document Selection & Upload */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              {language === "ne" ? "२. आधिकारिक सरकारी कागजात पेस गर्नुहोस्" : "2. Submit Authenticate Document"} *
            </label>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600">
                {language === "ne" ? "कागजातको प्रकार:" : "Document Type:"}
              </label>
              <select
                value={selectedDocType}
                onChange={(e) => {
                  setSelectedDocType(e.target.value as VerificationDocType);
                  setDocumentName("");
                  setDocumentUrl("");
                }}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#003893]/30"
              >
                {DOC_TYPES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {language === "ne" ? d.titleNe : d.titleEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Upload Box */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition-colors text-center">
              {documentName ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div className="text-left truncate">
                      <div className="font-bold text-xs text-slate-800 truncate">{documentName}</div>
                      <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready for Super Admin authentication</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(!previewOpen)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDocumentName("");
                        setDocumentUrl("");
                        setPreviewOpen(false);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <Upload className="w-7 h-7 mx-auto text-slate-400" />
                  <div className="text-xs text-slate-600">
                    <label className="font-bold text-[#003893] hover:underline cursor-pointer">
                      <span>Click to upload file</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>{" "}
                    or drag & drop (JPG, PNG, PDF up to 25MB)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {language === "ne"
                      ? "आधिकारिक सरकारी कागजात वा कम्पनी दर्ता प्रमाणपत्र संलग्न गर्नुहोस्।"
                      : "Please upload your official government ID or registration document."}
                  </div>
                </div>
              )}

              {/* Document Preview image if open */}
              {previewOpen && documentUrl && (
                <div className="mt-3 p-2 rounded-xl bg-slate-900/5 border border-slate-200 overflow-hidden">
                  <img
                    src={documentUrl}
                    alt="Document preview"
                    className="max-h-48 mx-auto rounded-lg object-contain shadow-xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. Notability / Media / Reference Links */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              {language === "ne" ? "३. मिडिया तथा अनलाइन प्रमाण लिंकहरू" : "3. Media & Reference Links (Notability)"}
            </label>
            <input
              type="text"
              placeholder="e.g. IMDb, Wikipedia, News Mentions, LinkedIn, Official Website URL"
              value={referenceLinks}
              onChange={(e) => setReferenceLinks(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003893]/30"
            />
            <p className="text-[11px] text-slate-500">
              {language === "ne"
                ? "तपाईंको सेलिब्रेटी वा व्यावसायिक ख्याति प्रमाणित गर्ने समाचार, प्रोफाइल वा वेबसाइटका लिंकहरू।"
                : "Links verifying your celebrity status, business registration, or public prominence."}
            </p>
          </div>

          {/* 4. Notes & Custom Badge Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                {language === "ne" ? "ब्याचको नाम (प्रस्तावित)" : "Requested Badge Title"}
              </label>
              <input
                type="text"
                value={customBadgeTitle}
                onChange={(e) => setCustomBadgeTitle(e.target.value)}
                placeholder={currentCategoryMeta.defaultBadge}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#003893]/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                {language === "ne" ? "थप विवरण / टिप्पणी" : "Additional Notes for Admin"}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Briefly state your profession / business in Nepal..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#003893]/30"
              />
            </div>
          </div>

          {/* 5. Legal Compliance & Declaration */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#DC143C]" />
              <span>
                {language === "ne"
                  ? "कागजात प्रामाणिकता तथा कानूनी घोषणा"
                  : "Authenticity Declaration & Legal Compliance"}
              </span>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
              <input
                type="checkbox"
                checked={acceptedDirectives}
                onChange={(e) => setAcceptedDirectives(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#003893] accent-[#003893] cursor-pointer"
              />
              <span className="leading-snug">
                {language === "ne"
                  ? "म प्रमाणित गर्दछु कि पेस गरिएका सम्पूर्ण कागजातहरू सत्य एवं आधिकारिक हुन्। विद्युतीय कारोबार ऐन २०६३ तथा नेपाल सरकारको सामाजिक सञ्जाल निर्देशिका २०८० अनुसार विवरण असत्य ठहरिएमा कानूनी कारबाहीको मन्जुरी दिन्छु।"
                  : "I declare that all submitted identity/business documents are authentic and valid under the Nepal Electronic Transactions Act 2063 and MoCIT Social Media Directives 2080."}
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {language === "ne" ? "रद्द गर्नुहोस्" : "Cancel"}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-[#003893] to-[#DC143C] hover:opacity-95 text-white shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <span>Submitting to Super Admin...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {language === "ne"
                      ? "आवेदन सुपर एडमिनमा पठाउनुहोस्"
                      : "Submit Application to Super Admin"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
