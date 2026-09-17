import React, { useState } from "react";
import {
  ShieldCheck,
  FileText,
  Scale,
  Lock,
  Globe2,
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  BookOpen,
  Eye,
  Shield,
  Building,
  UserCheck,
} from "lucide-react";

interface LegalComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "terms" | "privacy" | "nepal_directives" | "community";
  language?: "en" | "ne";
}

export const LegalComplianceModal: React.FC<LegalComplianceModalProps> = ({
  isOpen,
  onClose,
  initialTab = "terms",
  language = "en",
}) => {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy" | "nepal_directives" | "community">(initialTab);
  const [docLang, setDocLang] = useState<"en" | "ne">(language);

  if (!isOpen) return null;

  return (
    <div
      id="legal-compliance-modal"
      className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#003893] to-[#DC143C] flex items-center justify-center font-bold text-white shadow-md">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base tracking-tight text-white">
                  {docLang === "ne" ? "कानूनी नीति, नियम तथा सर्तहरू" : "Legal Terms, Privacy Policy & Directives"}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Govt. of Nepal & Global Compliance
                </span>
              </div>
              <p className="text-xs text-slate-300">
                फोटो Bucket (Nepal) • Ministry of Communication & IT Norms & Global Data Standards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setDocLang("en")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  docLang === "en" ? "bg-[#003893] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setDocLang("ne")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  docLang === "ne" ? "bg-[#DC143C] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                नेपाली
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-0 bg-slate-50 border-b border-slate-200 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("terms")}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "terms"
                ? "border-[#003893] text-[#003893]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{docLang === "ne" ? "१. नियम तथा सर्तहरू (Terms)" : "1. Terms & Conditions"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "privacy"
                ? "border-[#DC143C] text-[#DC143C]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{docLang === "ne" ? "२. गोपनीयता नीति (Privacy Policy)" : "2. Privacy Policy"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("nepal_directives")}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "nepal_directives"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{docLang === "ne" ? "३. सामाजिक सञ्जाल निर्देशिका २०८०" : "3. Nepal Govt. Directives 2080"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("community")}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "community"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Globe2 className="w-4 h-4" />
            <span>{docLang === "ne" ? "४. अन्तर्राष्ट्रिय मापदण्ड (Global Standards)" : "4. Global Safety Standards"}</span>
          </button>
        </div>

        {/* Document Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-700 leading-relaxed text-sm">
          {/* ======================================================== */}
          {/* TAB 1: TERMS & CONDITIONS                                */}
          {/* ======================================================== */}
          {activeTab === "terms" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                <FileText className="w-5 h-5 text-[#003893] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-[#003893] text-base">
                    {docLang === "ne"
                      ? "फोटो Bucket (नेपाल) प्रयोगका नियम तथा सर्तहरू"
                      : "Photo Bucket (Nepal) User Agreement & Terms of Service"}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {docLang === "ne"
                      ? "पछिल्लो परिमार्जन: २०८१ / २०२६ • नेपालको विद्युतीय कारोबार ऐन २०६३ तथा प्रचलित कानून बमोजिम लागु हुनेछ।"
                      : "Last Updated: August 2026 • Enforced under the Nepal Electronic Transactions Act, 2063 & global standards."}
                  </p>
                </div>
              </div>

              {docLang === "en" ? (
                <>
                  <section className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-[#003893] flex items-center justify-center font-mono text-xs">1</span>
                      Acceptance of Terms & Eligibility
                    </h4>
                    <p className="text-slate-600 text-xs sm:text-sm pl-8">
                      By registering, logging in, or accessing Photo Bucket Nepal ("the Platform"), you confirm that you are at least 13 years of age (or authorized by legal guardians/commercial entities) and agree to be bound unconditionally by these Terms and Conditions, our Privacy Policy, and the laws of Nepal.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-[#003893] flex items-center justify-center font-mono text-xs">2</span>
                      Account Categories & Dual-Sector Verification
                    </h4>
                    <div className="text-slate-600 text-xs sm:text-sm pl-8 space-y-1.5">
                      <p>
                        <strong>• Personal Accounts:</strong> Intended for individual photographers, storytellers, and travelers. Validated via verified email or Nepal Telecom / Ncell mobile number (98-series format).
                      </p>
                      <p>
                        <strong>• Business / Corporate Accounts:</strong> Required for travel agencies, hotels, restaurants, and registered organizations. Must provide legitimate Permanent Account Number (PAN) and Department of Commerce / Company Registrar registration certificates.
                      </p>
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-[#003893] flex items-center justify-center font-mono text-xs">3</span>
                      User Content & Copyright Ownership
                    </h4>
                    <p className="text-slate-600 text-xs sm:text-sm pl-8">
                      You retain full intellectual property ownership and copyright of original photographs, videos, and captions you upload to your Photo Bucket. By posting, you grant Photo Bucket Nepal a non-exclusive, royalty-free license to host, display, and organize your content across our localized discovery feeds and 77-district galleries. You must not post copyrighted works of other creators without authorization.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-[#003893] flex items-center justify-center font-mono text-xs">4</span>
                      Strictly Prohibited Conduct & Content
                    </h4>
                    <div className="text-slate-600 text-xs sm:text-sm pl-8 space-y-1">
                      <p>Users must not upload, share, or transmit content that:</p>
                      <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
                        <li>Threatens the national sovereignty, territorial integrity, or independence of Nepal.</li>
                        <li>Incites religious disharmony, ethnic tension, caste discrimination, or regional hatred.</li>
                        <li>Contains non-consensual sexual content, explicit obscenity, or exploitation of minors.</li>
                        <li>Constitutes cyberbullying, doxxing, harassment, blackmail, or deliberate defamation.</li>
                        <li>Promotes illegal gambling, narcotics trafficking, or financial pyramid scams.</li>
                      </ul>
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-[#003893] flex items-center justify-center font-mono text-xs">5</span>
                      Account Termination & Law Enforcement Cooperation
                    </h4>
                    <p className="text-slate-600 text-xs sm:text-sm pl-8">
                      Photo Bucket Nepal reserves the absolute right to suspend, terminate, or ban any account that violates these terms. In compliance with Nepal Cyber Bureau and law enforcement orders, unlawful activities will be investigated with technical logs preserved.
                    </p>
                  </section>
                </>
              ) : (
                <>
                  <section className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-[#DC143C] flex items-center justify-center font-mono text-xs">१</span>
                      सर्तहरूको स्वीकार्यता र योग्यता
                    </h4>
                    <p className="text-slate-600 text-xs sm:text-sm pl-8">
                      फोटो Bucket (नेपाल) मा खाता खोल्दा, लगइन गर्दा वा सेवा प्रयोग गर्दा तपाईं कम्तिमा १३ वर्ष उमेर पुगेको (वा अभिभावक/संस्थाको स्वीकृति प्राप्त) र यी सम्पूर्ण नियम, गोपनीयता नीति तथा नेपालको प्रचलित कानुनको पूर्ण पालना गर्न सहमत हुनुहुन्छ।
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-[#DC143C] flex items-center justify-center font-mono text-xs">२</span>
                      दोहोरो खाता प्रणाली (व्यक्तिगत र व्यावसायिक)
                    </h4>
                    <div className="text-slate-600 text-xs sm:text-sm pl-8 space-y-1.5">
                      <p>
                        <strong>• व्यक्तिगत खाता:</strong> सिर्जनाकर्ता तथा फोटोग्राफरहरूका लागि। प्रमाणित इमेल वा नेपालका ९८... सिरिजको मोबाइल नम्बरद्वारा दर्ता गरिन्छ।
                      </p>
                      <p>
                        <strong>• व्यावसायिक तथा संस्थागत खाता:</strong> होटेल, पर्यटन, ट्राभल एजेन्सी वा अन्य व्यवसायहरूका लागि। नेपाल सरकारको प्यान (PAN No.) र कम्पनी दर्ता प्रमाणपत्र अनिवार्य पेश गर्नुपर्दछ।
                      </p>
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-[#DC143C] flex items-center justify-center font-mono text-xs">३</span>
                      सामग्रीको प्रतिलिपि अधिकार (Copyright)
                    </h4>
                    <p className="text-slate-600 text-xs sm:text-sm pl-8">
                      तपाईंले अपलोड गर्नुभएका मौलिक तस्बिर तथा भिडियोहरूको सर्वाधिकार तपाईंसँगै सुरक्षित रहन्छ। प्लेटफर्ममा सामग्री अपलोड गर्दा तपाईंले फोटो Bucket लाई नेपालका ७७ वटै जिल्लाका फिडहरूमा प्रदर्शन गर्न अनुमति दिनुहुन्छ। अरूको अनुमति बिना चोरीका तस्बिरहरू पोस्ट गर्न निषेध गरिएको छ।
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-[#DC143C] flex items-center justify-center font-mono text-xs">४</span>
                      पूर्ण रूपमा निषेधित कार्यहरू
                    </h4>
                    <div className="text-slate-600 text-xs sm:text-sm pl-8 space-y-1">
                      <p>निम्न प्रकारका सामग्री वा गतिविधि पूर्ण रूपमा गैरकानूनी मानिनेछ:</p>
                      <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
                        <li>नेपालको सार्वभौमसत्ता, भौगोलिक अखण्डता वा राष्ट्रिय एकतामा आँच पुर्‍याउने सामग्री।</li>
                        <li>धार्मिक, जातीय, क्षेत्रीय वा साम्प्रदायिक सद्भाव भड्काउने घृणास्पद अभिव्यक्ति (Hate Speech)।</li>
                        <li>अश्लील, यौनजन्य वा बालबालिकालाई दुर्व्यवहार गर्ने सामग्री।</li>
                        <li>साइबर बुलिङ, धम्की, व्यक्तिगत चरित्र हत्या वा झूटो अफवाह फैलाउने कार्य।</li>
                        <li>गैरकानूनी अनलाइन जुवा, ठगी वा प्रतिबन्धित वस्तुको विज्ञापन।</li>
                      </ul>
                    </div>
                  </section>
                </>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: PRIVACY POLICY                                    */}
          {/* ======================================================== */}
          {activeTab === "privacy" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#DC143C] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-[#DC143C] text-base">
                    {docLang === "ne"
                      ? "फोटो Bucket गोपनीयता नीति तथा डाटा सुरक्षा"
                      : "Photo Bucket Nepal Data Protection & Privacy Policy"}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {docLang === "ne"
                      ? "नेपालको वैयक्तिक गोपनीयता सम्बन्धी ऐन २०७५ तथा अन्तर्राष्ट्रिय GDPR डाटा सिद्धान्त अनुसार निर्मित।"
                      : "Compliant with the Individual Privacy Act 2075 (Nepal) and international GDPR standards."}
                  </p>
                </div>
              </div>

              {docLang === "en" ? (
                <>
                  <section className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      1. Information We Collect
                    </h4>
                    <p className="text-slate-600 text-xs sm:text-sm pl-6">
                      We collect only essential data needed to provide a seamless social platform:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-8 text-xs sm:text-sm text-slate-600">
                      <li><strong>Personal Identity:</strong> Full Name, Username, Verified Email Address.</li>
                      <li><strong>Security Verification:</strong> 10-digit Mobile Number (98-series), securely encrypted.</li>
                      <li><strong>Business Entities:</strong> PAN Number, Company Registration Details, and Verification Documents.</li>
                      <li><strong>Device & Geolocation:</strong> District tags and location metadata attached explicitly by you when sharing photos.</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#003893]" />
                      2. Mobile Number Privacy Guarantee
                    </h4>
                    <p className="text-slate-600 text-xs sm:text-sm pl-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      🔒 <strong>Zero Public Exposure:</strong> Your registered phone number is strictly encrypted and used purely for two-factor verification, security alerts, and account recovery. It will <strong>NEVER</strong> be displayed on your public profile or shared with advertisers.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      3. Data Rights & User Control (GDPR Alignment)
                    </h4>
                    <p className="text-slate-600 text-xs sm:text-sm pl-6">
                      Under our data governance framework, you have the right to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-8 text-xs sm:text-sm text-slate-600">
                      <li>Access and export your uploaded photo portfolio and engagement history.</li>
                      <li>Edit your profile information, password, and privacy settings at any time.</li>
                      <li>Request permanent account and photo bucket deletion (Right to be Forgotten).</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Scale className="w-4 h-4 text-amber-600" />
                      4. Data Storage & 256-Bit Cryptographic Security
                    </h4>
                    <p className="text-slate-600 text-xs sm:text-sm pl-6">
                      All account passwords, business PAN records, and session tokens are protected with industry-standard 256-bit encryption. We maintain strict access control barriers ensuring that sensitive data is shielded from unauthorized access.
                    </p>
                  </section>
                </>
              ) : (
                <>
                  <section className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      १. हामीले संकलन गर्ने जानकारीहरू
                    </h4>
                    <ul className="list-disc list-inside space-y-1 pl-6 text-xs sm:text-sm text-slate-600">
                      <li><strong>व्यक्तिगत विवरण:</strong> पूरा नाम, प्रयोगकर्ताको नाम (Username), आधिकारिक इमेल।</li>
                      <li><strong>प्रमाणीकरण सम्पर्क:</strong> १० अंकको नेपाली मोबाइल नम्बर (९८... सिरिज) - गोप्य रूपमा इन्क्रिप्टेड।</li>
                      <li><strong>व्यावसायिक विवरण:</strong> प्यान नम्बर (PAN), कम्पनी दर्ता नम्बर तथा प्रमाणपत्र कागजात।</li>
                      <li><strong>स्थान तथा तस्बिर डेटा:</strong> तपाईंले तस्बिर पोस्ट गर्दा छनौट गर्नुभएको जिल्ला तथा भौगोलिक स्थान।</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#003893]" />
                      २. मोबाइल नम्बरको पूर्ण गोपनीयता ग्यारेन्टी
                    </h4>
                    <p className="text-slate-600 text-xs sm:text-sm pl-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      🔒 <strong>गोपनीयता प्रतिबद्धता:</strong> तपाईंको दर्ता गरिएको फोन नम्बर खाता सुरक्षा र प्रमाणीकरणका लागि मात्र प्रयोग हुन्छ। यो नम्बर तपाईंको प्रोफाइलमा कसैलाई पनि देखाइने छैन र कुनै पनि बाह्य विज्ञापनदातालाई बेचिने छैन।
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      ३. प्रयोगकर्ताको अधिकार (डेटा मेटाउने तथा नियन्त्रण)
                    </h4>
                    <p className="text-slate-600 text-xs sm:text-sm pl-6">
                      तपाईंलाई आफ्नो खाता विवरण जुनसुकै बेला परिवर्तन गर्ने, फोटोहरू हटाउने वा आफ्नो सम्पूर्ण खाता स्थायी रूपमा मेटाउने (Delete Account) पूर्ण अधिकार छ।
                    </p>
                  </section>
                </>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: NEPAL GOVT DIRECTIVES 2080                        */}
          {/* ======================================================== */}
          {activeTab === "nepal_directives" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                <Shield className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-emerald-900 text-base">
                    {docLang === "ne"
                      ? "नेपाल सरकारको सामाजिक सञ्जालको प्रयोगलाई व्यवस्थित गर्ने निर्देशिका, २०८०"
                      : "Directives for Regulating the Use of Social Media, 2080 (Nepal MoCIT)"}
                  </h3>
                  <p className="text-xs text-emerald-800 mt-1">
                    {docLang === "ne"
                      ? "सञ्चार तथा सूचना प्रविधि मन्त्रालय, नेपाल सरकारद्वारा जारी निर्देशिकाको पूर्ण पालना।"
                      : "Mandated by Ministry of Communication & Information Technology (MoCIT), Government of Nepal."}
                  </p>
                </div>
              </div>

              {docLang === "en" ? (
                <div className="space-y-4 text-xs sm:text-sm text-slate-600">
                  <p>
                    Photo Bucket Nepal operates in full compliance with the <strong>Social Media Directives, 2080</strong> enacted by the Government of Nepal to maintain digital civility, national security, and legal accountability.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <strong className="text-slate-900 block text-xs">Section 19: Content Integrity</strong>
                      <p className="text-xs text-slate-600">
                        Prohibits publishing deceptive deepfakes, manipulated media intended to defame individuals, fake news, or false crisis alarms.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <strong className="text-slate-900 block text-xs">Section 20: Grievance Redressal</strong>
                      <p className="text-xs text-slate-600">
                        Photo Bucket maintains an active 24/7 Super Admin Moderation Desk to investigate user complaints and remove violating content within 24 hours.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <strong className="text-slate-900 block text-xs">Electronic Transactions Act 2063</strong>
                      <p className="text-xs text-slate-600">
                        Sections 44-47 penalize unauthorized data interception, cyber-harassment, and transmission of obscene or unlawful materials.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <strong className="text-slate-900 block text-xs">National Harm & Hate Speech Ban</strong>
                      <p className="text-xs text-slate-600">
                        Zero tolerance for posts that disrupt communal peace, promote secessionism, or attack constitutional fundamental rights.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs sm:text-sm text-slate-600">
                  <p>
                    नेपाल सरकार (सञ्चार तथा सूचना प्रविधि मन्त्रालय) द्वारा जारी <strong>सामाजिक सञ्जालको प्रयोगलाई व्यवस्थित गर्ने निर्देशिका, २०८०</strong> का प्रमुख बुँदाहरू:
                  </p>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <strong className="text-slate-900 block font-semibold mb-1">दफा १९ बमोजिम गर्न नहुने कार्यहरू:</strong>
                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pl-2">
                        <li>नेपालको सार्वभौमसत्ता, अखण्डता र राष्ट्रिय सुरक्षामा खलल पुग्ने सामग्री सम्प्रेषण गर्न पाइने छैन।</li>
                        <li>जाति, भाषा, धर्म वा सम्प्रदायबीच विद्वेष फैलाउने तथा घृणास्पद अभिव्यक्ति (Hate Speech) निषेध छ।</li>
                        <li>तस्बिर वा भिडियो बिगारेर (Deepfake/Morphing) अरूको व्यक्तिगत चरित्र हत्या वा मानमर्दन गर्न पाइने छैन।</li>
                        <li>बालबालिकाको गोपनीयता र सुरक्षा प्रतिकूल हुने कुनै पनि अश्लील वा हिंसात्मक सामग्री पोस्ट गर्न निषेध छ।</li>
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <strong className="text-slate-900 block font-semibold mb-1">गुनासो सुनुवाइ तथा सुपर एडमिन नियन्त्रण (दफा २०):</strong>
                      <p className="text-xs text-slate-600">
                        प्लेटफर्ममा कुनै पनि गैरकानूनी सामग्री भेटिएमा तत्काल उजुरी गर्न सकिनेछ र हाम्रो सुरक्षा डेस्कले २४ घण्टाभित्र आवश्यक छानबिन गरी सामग्री हटाउनेछ।
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: GLOBAL STANDARDS & COMMUNITY                      */}
          {/* ======================================================== */}
          {activeTab === "community" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
                <Globe2 className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-900 text-base">
                    {docLang === "ne"
                      ? "विश्वव्यापी सामाजिक सञ्जाल सुरक्षा तथा समुदाय मापदण्ड"
                      : "Worldwide Social Media Standards & Community Guidelines"}
                  </h3>
                  <p className="text-xs text-amber-800 mt-1">
                    {docLang === "ne"
                      ? "अन्तर्राष्ट्रिय डिजिटल शिष्टाचार, प्रतिलिपि अधिकार तथा सुरक्षित समुदाय निर्माण।"
                      : "Global online safety guidelines, DMCA copyright rules & ethical community building."}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-600">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block text-xs">1. Respectful Digital Culture & Nepali Hospitality</strong>
                  <p className="text-xs text-slate-600">
                    Photo Bucket represents the warmth, heritage, and scenic grandeur of Nepal. Engage constructively with creators, provide encouraging feedback, and celebrate cultural diversity across all regions.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block text-xs">2. Anti-Spam & Commercial Transparency</strong>
                  <p className="text-xs text-slate-600">
                    Spam comments, automated bots, and deceptive link schemes are actively filtered. Commercial promotions must be conducted via verified Business Accounts with transparent pricing and contact points.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block text-xs">3. Intellectual Property (DMCA Compliance)</strong>
                  <p className="text-xs text-slate-600">
                    If you believe your copyrighted photograph has been uploaded without authorization, our administration team will promptly review and take down infringing assets upon legitimate notice.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Acknowledgement */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {docLang === "ne"
                ? "यी नीतिहरू फोटो Bucket प्रयोगकर्ता, सिर्जनाकर्ता तथा संस्थाहरूमा समान रूपले लागु हुनेछन्।"
                : "By continuing to use Photo Bucket Nepal, you uphold these regulatory standards."}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#003893] hover:bg-[#002a70] text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            {docLang === "ne" ? "मैले बुझें र स्वीकार गर्दछु (Close & Agree)" : "I Understand & Acknowledge"}
          </button>
        </div>
      </div>
    </div>
  );
};
