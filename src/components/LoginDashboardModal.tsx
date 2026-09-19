import React, { useState, useRef } from "react";
import { User, AccountSector, DEFAULT_CURRENT_USER } from "../types";
import { api } from "../services/api";
import {
  X,
  User as UserIcon,
  Building2,
  Lock,
  Mail,
  Phone,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Briefcase,
  Sparkles,
  ArrowRight,
  FileCheck,
  Check,
  Scale,
  ExternalLink,
  KeyRound,
  Send,
  RefreshCw,
  Copy,
  Inbox,
  ArrowLeft,
} from "lucide-react";
import { LegalComplianceModal } from "./LegalComplianceModal";
import { NepalLocationSelector } from "./NepalLocationSelector";
import { Logo } from "./Logo";
import { signInWithGooglePopup } from "../lib/firebase";
import { firestoreSync } from "../services/firestoreSync";

interface LoginDashboardModalProps {
  isOpen: boolean;
  onClose?: () => void;
  currentUser?: User;
  onAuthSuccess: (user: User) => void;
  language: "en" | "ne";
  initialSector?: AccountSector;
  initialMode?: "login" | "register" | "forgot_password" | "email_verification";
}

export const LoginDashboardModal: React.FC<LoginDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser = DEFAULT_CURRENT_USER,
  onAuthSuccess,
  language,
  initialSector = "personal",
  initialMode = "register",
}) => {
  const [sector, setSector] = useState<AccountSector>(initialSector);
  const [mode, setMode] = useState<"login" | "register" | "forgot_password" | "email_verification">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Legal Acceptance States
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<"terms" | "privacy" | "nepal_directives" | "community">("terms");

  // Synchronize sector and mode if modal reopens with specific arguments
  React.useEffect(() => {
    if (isOpen) {
      setSector(initialSector);
      setMode(initialMode);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialSector, initialMode]);

  // Show/Hide Passwords
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewConfirmPassword, setShowNewConfirmPassword] = useState(false);

  // Password Change / Reset via Official Registered Email
  const [forgotForm, setForgotForm] = useState({
    identifier: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
    step: 1 as 1 | 2,
    registeredEmail: "",
    maskedEmail: "",
    previewCode: "",
    officialNotification: null as null | {
      sender: string;
      subject: string;
      to: string;
      maskedTo: string;
      code: string;
      sentAt: string;
      expiresInMinutes: number;
    },
    timer: 0,
    copied: false,
  });

  // Dedicated Email Verification Notification & Token State
  const [emailVerificationNotice, setEmailVerificationNotice] = useState<{
    email: string;
    verifyLink?: string;
    token?: string;
    previewCode?: string;
    officialNotification?: {
      sender: string;
      subject: string;
      to: string;
      verifyLink: string;
      code: string;
      sentAt: string;
    } | null;
    verifiedSuccess?: boolean;
    copiedLink?: boolean;
  } | null>(null);
  const [verificationTimer, setVerificationTimer] = useState<number>(0);

  // Countdown timer for resending email verification link
  React.useEffect(() => {
    if (verificationTimer > 0) {
      const interval = setInterval(() => {
        setVerificationTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [verificationTimer]);

  // Countdown timer for resending verification code
  React.useEffect(() => {
    if (forgotForm.timer > 0) {
      const interval = setInterval(() => {
        setForgotForm((prev) => ({ ...prev, timer: Math.max(0, prev.timer - 1) }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [forgotForm.timer]);

  // Personal Form State
  const [personalForm, setPersonalForm] = useState({
    firstName: "",
    lastName: "",
    mobileNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    district: "Kathmandu",
    city: "Kathmandu Metro",
    province: "Bagmati",
  });

  // Business Form State
  const [businessForm, setBusinessForm] = useState({
    businessName: "",
    panNumber: "",
    registrationNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    documentFile: "",
    documentName: "",
    documentSize: "",
    district: "Kathmandu",
    city: "Kathmandu Metro",
    province: "Bagmati",
  });

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    identifier: "", // Email / Mobile for Personal, Email / PAN / Reg for Business
    password: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Validation helpers
  const isValidPersonalPhone = /^98\d{8}$/.test(
    personalForm.mobileNumber.replace(/\s+/g, "").replace(/^\+977/, "")
  );
  const isPersonalPasswordMatch =
    personalForm.password.length > 0 &&
    personalForm.password === personalForm.confirmPassword;

  const isBusinessPasswordMatch =
    businessForm.password.length > 0 &&
    businessForm.password === businessForm.confirmPassword;

  // Handle Document Upload (Drag & Drop or File Picker)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let files: FileList | null = null;
    if ("dataTransfer" in e) {
      e.preventDefault();
      files = e.dataTransfer.files;
    } else if (e.target.files) {
      files = e.target.files;
    }

    if (!files || files.length === 0) return;
    const file = files[0];

    // Check size limit (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(
        language === "ne"
          ? "कागजातको साइज १० MB भन्दा कम हुनुपर्छ।"
          : "Document size must be under 10MB."
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBusinessForm((prev) => ({
        ...prev,
        documentFile: result,
        documentName: file.name,
        documentSize: `${(file.size / 1024).toFixed(1)} KB`,
      }));
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Submit Personal Registration
  const handlePersonalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!personalForm.firstName || !personalForm.lastName) {
      setError(language === "ne" ? "पहिलो र थर नाम अनिवार्य छ।" : "First and Last Name are required.");
      return;
    }

    if (!isValidPersonalPhone) {
      setError(
        language === "ne"
          ? "मोबाइल नम्बर ९८ बाट सुरु हुने १० अंकको हुनुपर्छ।"
          : "Mobile Number must be 10 digits starting with 98 (e.g. 9841234567)."
      );
      return;
    }

    if (!personalForm.email || !personalForm.email.includes("@")) {
      setError(language === "ne" ? "मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस्।" : "Please enter a valid email address.");
      return;
    }

    if (personalForm.password.length < 6) {
      setError(language === "ne" ? "पासवर्ड कम्तिमा ६ वर्णको हुनुपर्छ।" : "Password must be at least 6 characters.");
      return;
    }

    if (personalForm.password !== personalForm.confirmPassword) {
      setError(language === "ne" ? "पासवर्डहरू मेल खाएनन्।" : "Passwords do not match.");
      return;
    }

    if (!acceptedPrivacy || !acceptedTerms) {
      setError(
        language === "ne"
          ? "कृपया दर्ता गर्नु अगाडि गोपनीयता नीति (Privacy Policy) र नियम तथा सर्तहरू (Terms & Conditions) दुवै स्वीकार गर्नुहोस्।"
          : "You must click and accept both the Privacy Policy and Terms & Conditions before registering."
      );
      return;
    }

    try {
      setLoading(true);
      const res = await api.registerPersonal({
        firstName: personalForm.firstName,
        lastName: personalForm.lastName,
        mobileNumber: personalForm.mobileNumber,
        email: personalForm.email,
        password: personalForm.password,
        confirmPassword: personalForm.confirmPassword,
        district: personalForm.district,
        city: personalForm.city,
        province: personalForm.province,
      });

      if (res.requiresVerification) {
        setEmailVerificationNotice({
          email: res.email || personalForm.email,
          verifyLink: res.verifyLink,
          token: res.token,
          previewCode: res.previewCode,
          officialNotification: res.officialNotification,
          verifiedSuccess: false,
        });
        setVerificationTimer(60);
        setMode("email_verification");
        setSuccessMsg(res.message);
        return;
      }

      setSuccessMsg(res.message);
      setTimeout(() => {
        if (res.user) onAuthSuccess(res.user);
        if (onClose) onClose();
      }, 700);
    } catch (err: any) {
      if (err.accountExists && err.isEmailVerified === false) {
        setEmailVerificationNotice({
          email: err.email || personalForm.email,
          verifyLink: err.verifyLink,
          token: err.token,
          verifiedSuccess: false,
        });
        setMode("email_verification");
        setError(err.message || "An account with this email exists but is not verified. Please click the verification link.");
        return;
      }
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Business Registration
  const handleBusinessRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!businessForm.businessName.trim()) {
      setError(language === "ne" ? "कम्पनी / संस्थाको नाम अनिवार्य छ।" : "Business / Organization Name is required.");
      return;
    }

    if (!businessForm.panNumber.trim()) {
      setError(language === "ne" ? "प्यान नम्बर (PAN No.) अनिवार्य छ।" : "PAN Number is required.");
      return;
    }

    if (!businessForm.registrationNumber.trim()) {
      setError(language === "ne" ? "दर्ता नम्बर अनिवार्य छ।" : "Company Registration Number is required.");
      return;
    }

    if (!businessForm.email || !businessForm.email.includes("@")) {
      setError(language === "ne" ? "मान्य आधिकारिक इमेल प्रविष्ट गर्नुहोस्।" : "Please provide a valid corporate email.");
      return;
    }

    if (businessForm.password.length < 6) {
      setError(language === "ne" ? "पासवर्ड कम्तिमा ६ वर्णको हुनुपर्छ।" : "Password must be at least 6 characters.");
      return;
    }

    if (businessForm.password !== businessForm.confirmPassword) {
      setError(language === "ne" ? "पासवर्डहरू मेल खाएनन्।" : "Passwords do not match.");
      return;
    }

    if (!businessForm.documentFile) {
      setError(
        language === "ne"
          ? "कृपया कम्पनी प्यान वा दर्ता प्रमाणपत्रको फाइल अपलोड गर्नुहोस्।"
          : "Please upload your Company PAN / Registration Document."
      );
      return;
    }

    if (!acceptedPrivacy || !acceptedTerms) {
      setError(
        language === "ne"
          ? "कृपया दर्ता गर्नु अगाडि गोपनीयता नीति (Privacy Policy) र नियम तथा सर्तहरू (Terms & Conditions) दुवै स्वीकार गर्नुहोस्।"
          : "You must click and accept both the Privacy Policy and Terms & Conditions before registering."
      );
      return;
    }

    try {
      setLoading(true);
      const res = await api.registerBusiness({
        businessName: businessForm.businessName,
        panNumber: businessForm.panNumber,
        registrationNumber: businessForm.registrationNumber,
        email: businessForm.email,
        password: businessForm.password,
        confirmPassword: businessForm.confirmPassword,
        documentFile: businessForm.documentFile,
        documentName: businessForm.documentName,
        district: businessForm.district,
        city: businessForm.city,
        province: businessForm.province,
      });

      if (res.requiresVerification) {
        setEmailVerificationNotice({
          email: res.email || businessForm.email,
          verifyLink: res.verifyLink,
          token: res.token,
          previewCode: res.previewCode,
          officialNotification: res.officialNotification,
          verifiedSuccess: false,
        });
        setVerificationTimer(60);
        setMode("email_verification");
        setSuccessMsg(res.message);
        return;
      }

      setSuccessMsg(res.message);
      setTimeout(() => {
        if (res.user) onAuthSuccess(res.user);
        if (onClose) onClose();
      }, 700);
    } catch (err: any) {
      if (err.accountExists && err.isEmailVerified === false) {
        setEmailVerificationNotice({
          email: err.email || businessForm.email,
          verifyLink: err.verifyLink,
          token: err.token,
          verifiedSuccess: false,
        });
        setMode("email_verification");
        setError(err.message || "An account with this email exists but is not verified. Please click the verification link.");
        return;
      }
      setError(err.message || "Business registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginForm.identifier.trim()) {
      setError(
        sector === "business"
          ? language === "ne"
            ? "आधिकारिक इमेल वा प्यान नम्बर प्रविष्ट गर्नुहोस्।"
            : "Please enter Business Email or PAN No."
          : language === "ne"
          ? "इमेल वा ९८... मोबाइल नम्बर प्रविष्ट गर्नुहोस्।"
          : "Please enter Email or 98-series Mobile Number."
      );
      return;
    }

    if (!loginForm.password) {
      setError(language === "ne" ? "कृपया पासवर्ड प्रविष्ट गर्नुहोस्।" : "Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.login({
        sector,
        identifier: loginForm.identifier,
        password: loginForm.password,
      });

      // Security Protocol: Do not permit Super Admin or Admin portal access from general login dashboard
      if (
        res.user?.isSuperAdmin ||
        res.user?.isDelegatedAdmin ||
        res.user?.role === "admin" ||
        res.user?.email === "deepaksubedi32@gmail.com" ||
        res.user?.email === "medeepaksubedi@gmail.com"
      ) {
        setError("Not access");
        return;
      }

      setSuccessMsg(res.message);
      setTimeout(() => {
        onAuthSuccess(res.user);
        if (onClose) onClose();
      }, 700);
    } catch (err: any) {
      if (err.emailNotVerified) {
        setEmailVerificationNotice({
          email: err.email || loginForm.identifier,
          verifyLink: err.verifyLink,
          token: err.token,
          previewCode: err.previewCode,
          verifiedSuccess: false,
        });
        setMode("email_verification");
        setError(err.message || "Your email is not verified yet. Please click the verification link sent to your email to access login.");
        return;
      }
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Email Verification: 1-Click Verification Handler
  const handleVerifyEmailDirectly = async () => {
    if (!emailVerificationNotice?.token && !emailVerificationNotice?.previewCode) {
      setError("No active verification token found. Please request a new link.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.verifyEmail({
        token: emailVerificationNotice.token,
        code: emailVerificationNotice.previewCode,
        email: emailVerificationNotice.email,
      });

      setEmailVerificationNotice((prev) => (prev ? { ...prev, verifiedSuccess: true } : null));
      setSuccessMsg(
        language === "ne"
          ? "तपाईंको इमेल सफलतापूर्वक प्रमाणीकरण भयो! अब लगइन गर्नुहोस्।"
          : "Your email has been verified successfully! You can now log in."
      );

      // Auto-populate login identifier & smoothly switch to login mode after brief confirmation
      setTimeout(() => {
        setLoginForm((prev) => ({
          ...prev,
          identifier: emailVerificationNotice?.email || prev.identifier,
        }));
        setMode("login");
      }, 1600);
    } catch (err: any) {
      setError(err.message || "Email verification failed. Please check the link or request a new one.");
    } finally {
      setLoading(false);
    }
  };

  // Email Verification: Resend Link Handler
  const handleResendVerificationLink = async () => {
    const targetEmail =
      emailVerificationNotice?.email ||
      personalForm.email ||
      businessForm.email ||
      loginForm.identifier;

    if (!targetEmail || !targetEmail.includes("@")) {
      setError("Please provide a valid email address to resend verification link.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.resendVerification({ email: targetEmail });
      if (res.isAlreadyVerified) {
        setSuccessMsg(res.message || "Account is already verified. You can log in.");
        setMode("login");
        return;
      }

      setEmailVerificationNotice((prev) => ({
        ...prev,
        email: targetEmail,
        verifyLink: res.verifyLink,
        token: res.token,
        previewCode: res.previewCode,
        officialNotification: res.officialNotification,
        verifiedSuccess: false,
      }));
      setVerificationTimer(60);
      setSuccessMsg(
        language === "ne"
          ? `नयाँ प्रमाणीकरण लिङ्क ${targetEmail} मा पठाइयो!`
          : `A fresh verification link has been sent to ${targetEmail}!`
      );
    } catch (err: any) {
      setError(err.message || "Failed to resend verification link.");
    } finally {
      setLoading(false);
    }
  };

  // Firebase Google Sign-In with Popup
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const googleUser = await signInWithGooglePopup();
      if (!googleUser) return;

      if (
        googleUser.email === "deepaksubedi32@gmail.com" ||
        googleUser.email === "medeepaksubedi@gmail.com"
      ) {
        setError("Not access");
        return;
      }

      const authenticatedUser: User = {
        id: googleUser.uid,
        username: (googleUser.email?.split("@")[0] || "user")
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_")
          .slice(0, 30),
        fullName: googleUser.displayName || "Nepali Creator",
        avatar: googleUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${googleUser.uid}`,
        bio: "Joined via Google • Photo Bucket Nepal",
        location: "Nepal",
        district: "Kathmandu",
        followersCount: 1,
        followingCount: 5,
        postsCount: 0,
        isVerified: false,
        isEmailVerified: !!googleUser.emailVerified,
        email: googleUser.email || undefined,
        accountType: sector,
        role: "user",
        createdAt: new Date().toISOString(),
      };

      // Save user record to Firestore
      await firestoreSync.saveUser(authenticatedUser);

      setSuccessMsg(
        language === "ne"
          ? "गुगल मार्फत सफलतापूर्वक लगइन भयो!"
          : "Signed in with Google successfully!"
      );
      setTimeout(() => {
        onAuthSuccess(authenticatedUser);
        if (onClose) onClose();
      }, 700);
    } catch (err: any) {
      if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/cancelled-popup-request" ||
        err?.message?.includes("auth/popup-closed-by-user")
      ) {
        // User closed or cancelled the popup - no error message or log needed
        return;
      }
      console.error("Google Sign-In error", err);
      setError(err.message || "Google sign-in was cancelled or encountered an error.");
    } finally {
      setLoading(false);
    }
  };



  // Request verification code to official registered email
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const targetIdentifier = forgotForm.identifier.trim() || loginForm.identifier.trim();
    if (!targetIdentifier) {
      setError(
        language === "ne"
          ? "कृपया आफ्नो दर्ता गरिएको इमेल, प्रयोगकर्ता नाम वा मोबाइल नम्बर प्रविष्ट गर्नुहोस्।"
          : "Please enter your registered Email, Username, or Mobile Number."
      );
      return;
    }

    try {
      setLoading(true);
      const res = await api.requestPasswordResetCode({ identifier: targetIdentifier });
      setForgotForm((prev) => ({
        ...prev,
        identifier: targetIdentifier,
        step: 2,
        registeredEmail: res.registeredEmail,
        maskedEmail: res.maskedEmail,
        previewCode: res.previewCode || "",
        officialNotification: res.officialNotification || null,
        timer: 60,
        code: "",
      }));
      setSuccessMsg(res.message);
    } catch (err: any) {
      setError(err.message || "Could not dispatch verification code. Please check your identifier.");
    } finally {
      setLoading(false);
    }
  };

  // Verify code and change password
  const handleVerifyAndChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!forgotForm.code.trim()) {
      setError(
        language === "ne"
          ? "कृपया आधिकारिक इमेलमा पठाइएको ६-अङ्के कोड प्रविष्ट गर्नुहोस्।"
          : "Please enter the 6-digit verification code sent to your official registered email."
      );
      return;
    }

    if (forgotForm.newPassword.length < 6) {
      setError(
        language === "ne"
          ? "नयाँ पासवर्ड कम्तीमा ६ अक्षरको हुनुपर्छ।"
          : "New password must be at least 6 characters long."
      );
      return;
    }

    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setError(
        language === "ne"
          ? "नयाँ पासवर्ड र पुष्टि पासवर्ड मिलेन।"
          : "New password and confirm password do not match."
      );
      return;
    }

    try {
      setLoading(true);
      const res = await api.verifyAndChangePassword({
        identifier: forgotForm.identifier,
        code: forgotForm.code,
        newPassword: forgotForm.newPassword,
        confirmPassword: forgotForm.confirmPassword,
      });

      setSuccessMsg(
        language === "ne"
          ? "पासवर्ड सफलतापूर्वक परिवर्तन भयो! अब नयाँ पासवर्डबाट लगइन गर्नुहोस्।"
          : res.message || "Password changed successfully! You can now log in."
      );

      // Pre-fill login credentials with updated password
      setLoginForm({
        identifier: forgotForm.identifier,
        password: forgotForm.newPassword,
      });

      // Switch back to login mode after brief delay
      setTimeout(() => {
        setMode("login");
        setForgotForm((prev) => ({
          ...prev,
          step: 1,
          code: "",
          newPassword: "",
          confirmPassword: "",
          officialNotification: null,
        }));
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please check the code.");
    } finally {
      setLoading(false);
    }
  };

  // Legal consent checkbox renderer (One-time confirmation during registration final step)
  const renderLegalConsentCheckboxes = (themeColor: "blue" | "crimson") => (
    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 my-2">
      <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Scale className={`w-3.5 h-3.5 ${themeColor === "crimson" ? "text-[#DC143C]" : "text-[#003893]"}`} />
          <span>
            {language === "ne"
              ? "अन्तिम चरण: कानूनी सहमति तथा नेपाल सरकारका निर्देशिका (एक पटक मात्र)"
              : "Final Step: Regulatory Compliance & Legal Consent (One-Time)"}
          </span>
        </span>
        <span className="text-[10px] text-rose-600 font-bold">* Required on Registration</span>
      </div>

      <p className="text-[10.5px] text-slate-500 bg-white/80 p-2 rounded-xl border border-slate-200/60 leading-relaxed">
        {language === "ne"
          ? "🔒 खाता दर्ता गर्दा यो कानूनी सहमति एक पटक मात्र स्वीकार गरिन्छ। सफल दर्तापछि लगइन गर्दा फेरि क्लिक गरिरहनु पर्दैन।"
          : "🔒 This legal consent is authenticated one-time during registration. Once registered, you will not need to re-click when signing in."}
      </p>

      {/* Checkbox 1: Privacy Policy */}
      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none group">
        <input
          type="checkbox"
          id="accept-privacy-policy-checkbox"
          checked={acceptedPrivacy}
          onChange={(e) => {
            setAcceptedPrivacy(e.target.checked);
            if (error) setError(null);
          }}
          className={`mt-0.5 w-4 h-4 rounded border-slate-300 ${themeColor === "crimson" ? "text-[#DC143C] accent-[#DC143C]" : "text-[#003893] accent-[#003893]"} cursor-pointer`}
        />
        <div className="leading-snug">
          <span>
            {language === "ne" ? "म फोटो Bucket को " : "I agree to the "}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLegalModalTab("privacy");
              setIsLegalModalOpen(true);
            }}
            className="font-bold text-[#DC143C] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
          >
            <span>Privacy Policy (गोपनीयता नीति)</span>
            <ExternalLink className="w-3 h-3 inline ml-0.5" />
          </button>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {language === "ne"
              ? "🔒 ९८... मोबाइल नम्बर पूर्ण सुरक्षित एवं इन्क्रिप्टेड रहने र प्रोफाइलमा नदेखिने सहमति।"
              : "🔒 Guaranteed non-disclosure of mobile number & 256-bit encrypted data protection."}
          </span>
        </div>
      </label>

      {/* Checkbox 2: Terms and Conditions & Nepal Social Media Directives */}
      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none group">
        <input
          type="checkbox"
          id="accept-terms-conditions-checkbox"
          checked={acceptedTerms}
          onChange={(e) => {
            setAcceptedTerms(e.target.checked);
            if (error) setError(null);
          }}
          className={`mt-0.5 w-4 h-4 rounded border-slate-300 ${themeColor === "crimson" ? "text-[#DC143C] accent-[#DC143C]" : "text-[#003893] accent-[#003893]"} cursor-pointer`}
        />
        <div className="leading-snug">
          <span>
            {language === "ne" ? "म फोटो Bucket का " : "I agree to the "}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLegalModalTab("terms");
              setIsLegalModalOpen(true);
            }}
            className="font-bold text-[#003893] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
          >
            <span>Terms and Conditions (नियम तथा सर्तहरू)</span>
            <ExternalLink className="w-3 h-3 inline ml-0.5" />
          </button>
          <span>
            {language === "ne" ? " तथा " : " & "}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLegalModalTab("nepal_directives");
              setIsLegalModalOpen(true);
            }}
            className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
          >
            <span>नेपाल सरकारको सामाजिक सञ्जाल निर्देशिका २०८०</span>
            <ExternalLink className="w-3 h-3 inline ml-0.5" />
          </button>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {language === "ne"
              ? "विद्युतीय कारोबार ऐन २०६३, प्रतिलिपि अधिकार र विश्वव्यापी अनलाइन सुरक्षा मापदण्ड।"
              : "Electronic Transactions Act 2063, copyright standards & worldwide safety norms."}
          </span>
        </div>
      </label>
    </div>
  );

  return (
    <div
      id="login-dashboard-modal"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-auto flex flex-col">
        {/* Top Header with Nepal Branding */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Logo size="sm" showTagline={false} variant="dark" />
            <div className="h-4 w-px bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                Auth Portal
              </span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold font-['Mukta'] text-emerald-400 tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 inline-block animate-pulse" />
                <span>नेपालको आफ्नै फोटो चौतारी</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-mono tracking-wide">
              {language === "ne" ? "सुरक्षित प्रमाणीकरण" : "Verified Auth"}
            </span>
          </div>
        </div>

        {/* Sector Switcher Tabs: Personal User vs Business Organisation */}
        <div className="p-4 sm:p-5 pb-0 bg-slate-50 border-b border-slate-200/80">
          <div className="grid grid-cols-2 p-1 bg-slate-200/80 rounded-2xl gap-1">
            <button
              id="sector-personal-tab-btn"
              type="button"
              onClick={() => {
                setSector("personal");
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                sector === "personal"
                  ? "bg-white text-[#003893] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <div className="text-left">
                <div className="leading-tight">
                  {language === "ne" ? "व्यक्तिगत प्रयोगकर्ता" : "Personal User"}
                </div>
                <div className="text-[10px] font-normal opacity-75">
                  {language === "ne" ? "फोटो / सिर्जनाकर्ता" : "Photographers & Creators"}
                </div>
              </div>
            </button>

            <button
              id="sector-business-tab-btn"
              type="button"
              onClick={() => {
                setSector("business");
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                sector === "business"
                  ? "bg-[#DC143C] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <div className="text-left">
                <div className="leading-tight">
                  {language === "ne" ? "व्यापार / संस्था" : "Business Organisation"}
                </div>
                <div className="text-[10px] font-normal opacity-85">
                  {language === "ne" ? "प्यान / कम्पनी दर्ता" : "PAN / Registered Company"}
                </div>
              </div>
            </button>
          </div>

          {/* Mode Switcher: Sign In vs Create Account */}
          <div className="flex items-center justify-between mt-3 px-1">
            <div className="flex gap-4">
              <button
                id="tab-register-btn"
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className={`pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  mode === "register"
                    ? sector === "business"
                      ? "border-[#DC143C] text-[#DC143C]"
                      : "border-[#003893] text-[#003893]"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                {language === "ne" ? "नयाँ खाता दर्ता (Registration)" : "Create New Account (Registration)"}
              </button>
              <button
                id="tab-login-btn"
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  mode === "login"
                    ? sector === "business"
                      ? "border-[#DC143C] text-[#DC143C]"
                      : "border-[#003893] text-[#003893]"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                {language === "ne" ? "लगइन (Login)" : "Sign In (Login)"}
              </button>
              <button
                id="tab-forgot-password-btn"
                type="button"
                onClick={() => {
                  setForgotForm((prev) => ({
                    ...prev,
                    identifier: loginForm.identifier || (sector === "personal" ? "aarav.sharma@example.com" : "info@himalayanhorizoneexpeditions.np"),
                    step: 1,
                  }));
                  setMode("forgot_password");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  mode === "forgot_password"
                    ? "border-amber-600 text-amber-700"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{language === "ne" ? "पासवर्ड परिवर्तन (Email Code)" : "Change Password"}</span>
              </button>

              {mode === "email_verification" && (
                <button
                  id="tab-email-verification-btn"
                  type="button"
                  className="pb-2 text-xs font-bold border-b-2 border-emerald-600 text-emerald-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{language === "ne" ? "इमेल प्रमाणीकरण" : "Email Verification"}</span>
                </button>
              )}
            </div>


          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#DC143C]" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[62vh]">
          {/* ======================================================== */}
          {/* 1. PERSONAL USER REGISTRATION FORM                       */}
          {/* ======================================================== */}
          {mode === "register" && sector === "personal" && (
            <form id="personal-registration-form" onSubmit={handlePersonalRegister} className="space-y-3.5">
              <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-start gap-2.5 text-xs text-slate-700">
                <ShieldCheck className="w-4 h-4 text-[#003893] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#003893]">
                    {language === "ne" ? "व्यक्तिगत सिर्जनाकर्ता खाता" : "Personal Creator Account"}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === "ne"
                      ? "नेपालका हिमाल, संस्कृति र जनजीवनका सुन्दर तस्बिरहरू साझेदारी गर्नुहोस्।"
                      : "Share and discover authentic photographs across Nepal's 77 districts."}
                  </p>
                </div>
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    First Name <span className="text-[#DC143C]">*</span>
                  </label>
                  <input
                    id="personal-first-name-input"
                    type="text"
                    required
                    placeholder="e.g. Deepak / सुमन"
                    value={personalForm.firstName}
                    onChange={(e) =>
                      setPersonalForm({ ...personalForm, firstName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30 focus:border-[#003893]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Last Name <span className="text-[#DC143C]">*</span>
                  </label>
                  <input
                    id="personal-last-name-input"
                    type="text"
                    required
                    placeholder="e.g. Subedi / शाक्य"
                    value={personalForm.lastName}
                    onChange={(e) =>
                      setPersonalForm({ ...personalForm, lastName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30 focus:border-[#003893]"
                  />
                </div>
              </div>

              {/* Mobile Number: 10 Digit starting with 98 (Explicit requirement) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#003893]" />
                    <span>Mobile Number</span>
                    <span className="text-[#DC143C]">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    10 digits (98XXXXXXXX)
                  </span>
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-3 font-mono font-bold text-xs text-slate-500 bg-slate-100 px-1.5 py-1 rounded">
                    🇳🇵 +977
                  </span>
                  <input
                    id="personal-mobile-input"
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9841234567"
                    value={personalForm.mobileNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setPersonalForm({ ...personalForm, mobileNumber: val });
                    }}
                    className={`w-full pl-24 pr-10 py-2.5 rounded-xl border text-xs text-slate-900 font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30 ${
                      personalForm.mobileNumber.length === 10
                        ? isValidPersonalPhone
                          ? "border-emerald-500 bg-emerald-50/20"
                          : "border-rose-500 bg-rose-50/20"
                        : "border-slate-300 focus:border-[#003893]"
                    }`}
                  />
                  {personalForm.mobileNumber.length === 10 && (
                    <div className="absolute right-3">
                      {isValidPersonalPhone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-[#DC143C]" />
                      )}
                    </div>
                  )}
                </div>

                {/* Privacy Badge: No need to show this info in profile */}
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span>
                    🔒 <strong>Privacy Assurance:</strong> Mobile number is used solely for secure verification & will <strong>NOT</strong> be displayed on your public profile.
                  </span>
                </div>
              </div>

              {/* Email ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email ID <span className="text-[#DC143C]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="personal-email-input"
                    type="email"
                    required
                    placeholder="deepak@example.com"
                    value={personalForm.email}
                    onChange={(e) =>
                      setPersonalForm({ ...personalForm, email: e.target.value })
                    }
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30 focus:border-[#003893]"
                  />
                </div>
              </div>

              {/* Nepal Administrative Location: District & City Selector */}
              <NepalLocationSelector
                idPrefix="personal-reg"
                district={personalForm.district}
                city={personalForm.city}
                province={personalForm.province}
                accentColor="blue"
                onLocationChange={(loc) => {
                  setPersonalForm((prev) => ({
                    ...prev,
                    district: loc.district,
                    city: loc.city,
                    province: loc.province,
                  }));
                }}
                helperNote={
                  language === "ne"
                    ? "📍 जिल्ला र शहर छनोट गर्नाले नेपालभरि वा तपाईंको आफ्नै जिल्ला/शहरका तस्बिरहरू खोज्न र व्यवसायिक प्रवर्द्धन (Boost) लक्षित गर्न सजिलो हुन्छ।"
                    : "📍 Selecting your District & City enables localized photo exploration and makes it easy for business owners to target and boost posts city-wise, district-wise, or across all Nepal."
                }
              />

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password <span className="text-[#DC143C]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="personal-password-input"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Min 6 characters"
                      value={personalForm.password}
                      onChange={(e) =>
                        setPersonalForm({ ...personalForm, password: e.target.value })
                      }
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30 focus:border-[#003893]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password <span className="text-[#DC143C]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="personal-confirm-password-input"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Re-type password"
                      value={personalForm.confirmPassword}
                      onChange={(e) =>
                        setPersonalForm({
                          ...personalForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30 ${
                        personalForm.confirmPassword
                          ? isPersonalPasswordMatch
                            ? "border-emerald-500"
                            : "border-rose-500"
                          : "border-slate-300 focus:border-[#003893]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Legal Acceptance Checkboxes */}
              {renderLegalConsentCheckboxes("blue")}

              {/* Submit Button */}
              <button
                id="submit-personal-register-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-2xl bg-[#003893] hover:bg-[#002a70] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Registering Personal User...</span>
                ) : (
                  <>
                    <span>{language === "ne" ? "व्यक्तिगत खाता सिर्जना गर्नुहोस्" : "Register Personal Creator Account"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* 2. BUSINESS ORGANISATION REGISTRATION FORM               */}
          {/* ======================================================== */}
          {mode === "register" && sector === "business" && (
            <form id="business-registration-form" onSubmit={handleBusinessRegister} className="space-y-3.5">
              <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-100 flex items-start gap-2.5 text-xs text-slate-700">
                <Briefcase className="w-4 h-4 text-[#DC143C] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#DC143C]">
                    {language === "ne" ? "व्यावसायिक तथा संस्थागत दर्ता" : "Business Organization Registration"}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === "ne"
                      ? "नेपाल सरकारबाट प्रमाणित कम्पनी प्यान वा दर्ता प्रमाणपत्रको साथ आधिकारिक प्रोफाइल पाउनुहोस्।"
                      : "Get a verified Business Profile with official badge, promotion tools & PAN verification."}
                  </p>
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Business Name <span className="text-[#DC143C]">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="business-name-input"
                    type="text"
                    required
                    placeholder="e.g. Himalayan Horizon Travels Pvt. Ltd."
                    value={businessForm.businessName}
                    onChange={(e) =>
                      setBusinessForm({ ...businessForm, businessName: e.target.value })
                    }
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#DC143C]/30 focus:border-[#DC143C]"
                  />
                </div>
              </div>

              {/* PAN No & Registration Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PAN No. <span className="text-[#DC143C]">*</span>
                  </label>
                  <input
                    id="business-pan-input"
                    type="text"
                    required
                    placeholder="e.g. 601928374"
                    value={businessForm.panNumber}
                    onChange={(e) =>
                      setBusinessForm({ ...businessForm, panNumber: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 uppercase focus:outline-hidden focus:ring-2 focus:ring-[#DC143C]/30 focus:border-[#DC143C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registration Number <span className="text-[#DC143C]">*</span>
                  </label>
                  <input
                    id="business-reg-input"
                    type="text"
                    required
                    placeholder="e.g. 148203/078/079"
                    value={businessForm.registrationNumber}
                    onChange={(e) =>
                      setBusinessForm({
                        ...businessForm,
                        registrationNumber: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#DC143C]/30 focus:border-[#DC143C]"
                  />
                </div>
              </div>

              {/* Email ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email ID (Official Corporate Email) <span className="text-[#DC143C]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="business-email-input"
                    type="email"
                    required
                    placeholder="contact@company.com.np"
                    value={businessForm.email}
                    onChange={(e) =>
                      setBusinessForm({ ...businessForm, email: e.target.value })
                    }
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#DC143C]/30 focus:border-[#DC143C]"
                  />
                </div>
              </div>

              {/* Nepal Administrative Location: Business HQ District & City Selector */}
              <NepalLocationSelector
                idPrefix="business-reg"
                district={businessForm.district}
                city={businessForm.city}
                province={businessForm.province}
                accentColor="crimson"
                onLocationChange={(loc) => {
                  setBusinessForm((prev) => ({
                    ...prev,
                    district: loc.district,
                    city: loc.city,
                    province: loc.province,
                  }));
                }}
                helperNote={
                  language === "ne"
                    ? "🏢 व्यावसायिक मुख्यालयको जिल्ला र शहर: यसले तपाईंलाई आफ्ना पोस्टहरू शहर अनुसार (City-wise), जिल्ला अनुसार (District-wise) वा समग्र नेपालभर (Entire Nepal) सहजै Boost र Track गर्न मद्दत गर्दछ।"
                    : "🏢 Business HQ District & City: Enables easy tracking and targeted post boosting City-wise, District-wise, or across All Nepal."
                }
              />

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password <span className="text-[#DC143C]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="business-password-input"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Min 6 characters"
                      value={businessForm.password}
                      onChange={(e) =>
                        setBusinessForm({ ...businessForm, password: e.target.value })
                      }
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#DC143C]/30 focus:border-[#DC143C]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password <span className="text-[#DC143C]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="business-confirm-password-input"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Re-type password"
                      value={businessForm.confirmPassword}
                      onChange={(e) =>
                        setBusinessForm({
                          ...businessForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#DC143C]/30 ${
                        businessForm.confirmPassword
                          ? isBusinessPasswordMatch
                            ? "border-emerald-500"
                            : "border-rose-500"
                          : "border-slate-300 focus:border-[#DC143C]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload File (Company PAN / Registration Document) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload File (Company PAN / Registration Document) <span className="text-[#DC143C]">*</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {businessForm.documentFile ? (
                  <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {businessForm.documentName}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-mono">
                          {businessForm.documentSize || "Uploaded & Verified"} • Ready to submit
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setBusinessForm({
                          ...businessForm,
                          documentFile: "",
                          documentName: "",
                          documentSize: "",
                        })
                      }
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded hover:bg-rose-100 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileUpload}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-[#DC143C] bg-slate-50/80 hover:bg-rose-50/30 rounded-2xl p-4 text-center cursor-pointer transition-all"
                  >
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                    <div className="text-xs font-bold text-slate-800">
                      Click to upload or Drag & Drop Document
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Company PAN Certificate, OCR Registration, or Ward Tax Certificate (PDF, PNG, JPG up to 10MB)
                    </div>
                  </div>
                )}
              </div>

              {/* Legal Acceptance Checkboxes */}
              {renderLegalConsentCheckboxes("crimson")}

              {/* Submit Button */}
              <button
                id="submit-business-register-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-2xl bg-[#DC143C] hover:bg-[#b01030] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Registering Business...</span>
                ) : (
                  <>
                    <span>{language === "ne" ? "संस्थागत खाता दर्ता गर्नुहोस्" : "Register Business Organisation"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* 3. UNIVERSAL SIGN IN / LOGIN FORM                        */}
          {/* ======================================================== */}
          {mode === "login" && (
            <form id="universal-login-form" onSubmit={handleLogin} className="space-y-4">
              <div
                className={`p-3 rounded-2xl border flex items-start gap-2.5 text-xs text-slate-700 ${
                  sector === "business"
                    ? "bg-rose-50/70 border-rose-100"
                    : "bg-blue-50/70 border-blue-100"
                }`}
              >
                {sector === "business" ? (
                  <Building2 className="w-4 h-4 text-[#DC143C] flex-shrink-0 mt-0.5" />
                ) : (
                  <UserIcon className="w-4 h-4 text-[#003893] flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold text-slate-900">
                    {sector === "business"
                      ? language === "ne"
                        ? "संस्थागत लगइन (Business Login)"
                        : "Business Organisation Sign In"
                      : language === "ne"
                      ? "व्यक्तिगत लगइन (Personal Login)"
                      : "Personal User Sign In"}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {sector === "business"
                      ? "Sign in with your Business Email, PAN Number, or Registration Number."
                      : "Sign in with your registered Email ID or 98-series Mobile Number."}
                  </p>
                </div>
              </div>

              {/* Identifier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {sector === "business"
                    ? "Business Email / PAN Number / Registration No."
                    : "Email ID or 98... Mobile Number"}
                </label>
                <div className="relative">
                  {sector === "business" ? (
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  ) : (
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  )}
                  <input
                    id="login-identifier-input"
                    type="text"
                    required
                    placeholder={
                      sector === "business"
                        ? "e.g. info@himalayanhorizoneexpeditions.np / 601849201"
                        : "e.g. deepak@example.com / 9841234567"
                    }
                    value={loginForm.identifier}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, identifier: e.target.value })
                    }
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30 focus:border-[#003893]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400">Default: nepal123</span>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotForm((prev) => ({
                          ...prev,
                          identifier: loginForm.identifier || (sector === "personal" ? "aarav.sharma@example.com" : "info@himalayanhorizoneexpeditions.np"),
                          step: 1,
                        }));
                        setMode("forgot_password");
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] font-bold text-[#003893] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>{language === "ne" ? "पासवर्ड बिर्सनुभयो?" : "Forgot / Change?"}</span>
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="login-password-input"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30 focus:border-[#003893]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* One-Time Registration Legal Compliance Status Banner (No clicking required on login) */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs text-slate-700 my-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                      <span>
                        {language === "ne"
                          ? "कानूनी सहमति तथा निर्देशिका प्रमाणित"
                          : "Legal Consent & Directives Authenticated"}
                      </span>
                      <span className="text-[10px] bg-emerald-200/80 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                        {language === "ne" ? "सम्पन्न" : "Active"}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      {language === "ne"
                        ? "खाता दर्ता गर्दा एक पटक सहमति सम्पन्न भइसकेको हुनाले लगइन गर्दा फेरि क्लिक गर्नु पर्दैन।"
                        : "One-time consent was completed during registration. No need to click while signing in."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLegalModalTab("terms");
                    setIsLegalModalOpen(true);
                  }}
                  className="text-[11px] font-bold text-[#003893] hover:underline shrink-0 flex items-center gap-0.5 ml-2 cursor-pointer"
                >
                  <span>{language === "ne" ? "सर्तहरू हेर्नुहोस्" : "Review Terms"}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Submit Login Button */}
              <button
                id="submit-login-btn"
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-2xl text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  sector === "business"
                    ? "bg-[#DC143C] hover:bg-[#b01030]"
                    : "bg-[#003893] hover:bg-[#002a70]"
                }`}
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>
                      {sector === "business"
                        ? language === "ne"
                          ? "संस्थागत खातामा लगइन गर्नुहोस्"
                          : "Sign In to Business Account"
                        : language === "ne"
                        ? "व्यक्तिगत खातामा लगइन गर्नुहोस्"
                        : "Sign In to Personal Account"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Or Google Firebase Auth */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  {language === "ne" ? "वा गुगल मार्फत" : "Or continue with"}
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                id="google-firebase-signin-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.02h3.87c2.26-2.09 3.67-5.17 3.67-9.12z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.02c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.12C3.25 21.31 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.61H1.26C.46 8.23 0 10.06 0 12s.46 3.77 1.26 5.39l4.01-3.12z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.69 1.26 6.61l4.01 3.12c.95-2.85 3.6-4.98 6.73-4.98z"
                  />
                </svg>
                <span>
                  {language === "ne" ? "गुगल खाता मार्फत लगइन" : "Sign in with Google"}
                </span>
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* 3. PASSWORD CHANGE VIA OFFICIAL REGISTERED EMAIL CODE    */}
          {/* ======================================================== */}
          {mode === "forgot_password" && (
            <div className="space-y-4">
              {/* Step 1: Request Code by Identifier */}
              {forgotForm.step === 1 && (
                <form onSubmit={handleRequestResetCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {language === "ne"
                        ? "दर्ता गरिएको इमेल, प्रयोगकर्ता नाम वा मोबाइल नम्बर"
                        : "Registered Email ID, Username, or Mobile Number"}
                      <span className="text-[#DC143C]"> *</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        id="forgot-identifier-input"
                        type="text"
                        required
                        placeholder="e.g. aarav.sharma@example.com or aarav_sharma"
                        value={forgotForm.identifier}
                        onChange={(e) =>
                          setForgotForm({ ...forgotForm, identifier: e.target.value })
                        }
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30 focus:border-[#003893]"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {language === "ne"
                        ? "तपाईंको आधिकारिक दर्ता गरिएको इमेलमा ६-अङ्के कोड पठाइनेछ।"
                        : "We will look up your account and dispatch the 6-digit code to your official registered email."}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{language === "ne" ? "लगइन फर्कनुहोस्" : "Back to Login"}</span>
                    </button>

                    <button
                      id="request-password-code-btn"
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#003893] to-[#002a70] hover:opacity-95 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <span>
                          {language === "ne" ? "कोड पठाउँदै..." : "Sending Code to Email..."}
                        </span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>
                            {language === "ne"
                              ? "आधिकारिक इमेलमा कोड पठाउनुहोस्"
                              : "Send Code to Official Registered Email"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Enter Verification Code & Set New Password */}
              {forgotForm.step === 2 && (
                <form onSubmit={handleVerifyAndChangePassword} className="space-y-4">
                  {/* Official Email Dispatch Notification Simulator */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-slate-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                      <div className="flex items-center gap-2">
                        <Inbox className="w-4 h-4 text-[#003893]" />
                        <span className="font-bold text-[#003893]">
                          Official Registered Email Dispatch
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-[#003893] font-bold">
                        Dispatched ✓
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1">
                      <div>
                        <strong>To Official Registered Email:</strong>{" "}
                        <span className="font-mono text-slate-900 font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">
                          {forgotForm.registeredEmail}
                        </span>
                      </div>
                      <div>
                        <strong>Subject:</strong> Photo Bucket Nepal: Security Verification Code
                      </div>
                    </div>

                    {/* Interactive Code Banner with 1-Click Auto Fill */}
                    {forgotForm.previewCode && (
                      <div className="p-2.5 rounded-xl bg-white border border-blue-300 flex items-center justify-between shadow-2xs">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                            Received 6-Digit Code
                          </div>
                          <div className="font-mono font-extrabold text-lg text-[#003893] tracking-widest">
                            {forgotForm.previewCode}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotForm((prev) => ({
                              ...prev,
                              code: prev.previewCode,
                              copied: true,
                            }));
                            setTimeout(() => {
                              setForgotForm((prev) => ({ ...prev, copied: false }));
                            }, 2000);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#003893] border border-blue-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {forgotForm.copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Auto-filled!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Auto-fill Code</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Code Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === "ne"
                        ? "इमेलमा प्राप्त ६-अङ्के सुरक्षा कोड"
                        : "6-Digit Email Verification Code"}
                      <span className="text-[#DC143C]"> *</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        id="forgot-code-input"
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={forgotForm.code}
                        onChange={(e) =>
                          setForgotForm({
                            ...forgotForm,
                            code: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 font-mono tracking-widest focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30 focus:border-[#003893]"
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === "ne" ? "नयाँ पासवर्ड" : "New Password"}
                      <span className="text-[#DC143C]"> *</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        id="forgot-new-password-input"
                        type={showNewPassword ? "text" : "password"}
                        required
                        placeholder="At least 6 characters"
                        value={forgotForm.newPassword}
                        onChange={(e) =>
                          setForgotForm({ ...forgotForm, newPassword: e.target.value })
                        }
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30 focus:border-[#003893]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === "ne" ? "नयाँ पासवर्ड पुनः टाइप गर्नुहोस्" : "Confirm New Password"}
                      <span className="text-[#DC143C]"> *</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        id="forgot-confirm-password-input"
                        type={showNewConfirmPassword ? "text" : "password"}
                        required
                        placeholder="Re-type new password"
                        value={forgotForm.confirmPassword}
                        onChange={(e) =>
                          setForgotForm({ ...forgotForm, confirmPassword: e.target.value })
                        }
                        className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs text-slate-900 focus:outline-hidden focus:ring-2 ${
                          forgotForm.confirmPassword.length > 0
                            ? forgotForm.newPassword === forgotForm.confirmPassword
                              ? "border-emerald-500 focus:ring-emerald-500/30"
                              : "border-rose-500 focus:ring-rose-500/30"
                            : "border-slate-300 focus:ring-[#003893]/30 focus:border-[#003893]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewConfirmPassword(!showNewConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {forgotForm.confirmPassword.length > 0 &&
                      forgotForm.newPassword !== forgotForm.confirmPassword && (
                        <p className="text-[11px] text-rose-600 mt-1">Passwords do not match</p>
                      )}
                  </div>

                  {/* Resend Code Option */}
                  <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
                    <button
                      type="button"
                      onClick={() => setForgotForm((prev) => ({ ...prev, step: 1 }))}
                      className="text-[#003893] hover:underline font-medium cursor-pointer"
                    >
                      ← Change Email / Identifier
                    </button>

                    {forgotForm.timer > 0 ? (
                      <span className="text-slate-400 font-mono text-[11px]">
                        Resend code in {forgotForm.timer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestResetCode}
                        className="text-[#003893] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Resend Code</span>
                      </button>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    id="submit-change-password-btn"
                    type="submit"
                    disabled={loading || forgotForm.newPassword !== forgotForm.confirmPassword}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Verifying & Changing Password...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {language === "ne"
                            ? "कोड प्रमाणीकरण गरी पासवर्ड बदल्नुहोस्"
                            : "Verify Code & Change Password"}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 4. MODE: EMAIL VERIFICATION REQUIRED / CHECK EMAIL */}
          {mode === "email_verification" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Top Banner Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 via-white to-emerald-50 border border-emerald-200 shadow-xs text-center relative overflow-hidden">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Mail className="w-8 h-8 animate-bounce" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-black mb-2 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {language === "ne" ? "इमेल प्रमाणीकरण आवश्यक" : "Email Verification Required"}
                  </span>
                </div>

                <h2 className="text-lg font-black text-slate-900">
                  {language === "ne"
                    ? "तपाईंको इमेलमा प्रमाणीकरण लिङ्क पठाइयो!"
                    : "Verification Link Sent to Your Email!"}
                </h2>

                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <Mail className="w-4 h-4 text-[#003893]" />
                  <span className="font-bold text-xs sm:text-sm text-slate-800 break-all">
                    {emailVerificationNotice?.email || personalForm.email || businessForm.email || loginForm.identifier}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Pending
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-3 max-w-md mx-auto leading-relaxed">
                  {language === "ne"
                    ? "सुरक्षाका लागि, दर्ता सम्पन्न भएपछि खाता सक्रिय गर्न इमेल प्रमाणीकरण अनिवार्य छ। कृपया आफ्नो इमेल इनबक्स (वा स्प्याम फोल्डर) खोली प्रमाणीकरण लिङ्कमा क्लिक गर्नुहोस्। लिङ्क क्लिक भएपछि मात्र लगइन खुल्नेछ।"
                    : "For account security, email verification is required to activate your account. Please check your inbox (or spam folder) and click the verification link. Once clicked, login access is instantly granted."}
                </p>
              </div>

              {/* Verified State or Direct 1-Click Verification simulation */}
              {emailVerificationNotice?.verifiedSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-extrabold text-sm">
                      {language === "ne" ? "इमेल सफलतापूर्वक प्रमाणित भयो!" : "Email Successfully Verified!"}
                    </div>
                    <div className="text-xs text-emerald-700">
                      {language === "ne" ? "लगइन पृष्ठमा लगिँदैछ..." : "Redirecting to login portal..."}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{language === "ne" ? "सिधै इमेल प्रमाणीकरण (One-Click Verification)" : "Instant 1-Click Verification"}</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">Nepal Certified Auth</span>
                  </div>

                  {/* Direct 1-Click Verification Button */}
                  <button
                    id="verify-email-now-btn"
                    type="button"
                    onClick={handleVerifyEmailDirectly}
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#003893] via-blue-700 to-[#003893] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Verifying Token...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>
                          {language === "ne"
                            ? "लिङ्क क्लिक गरी प्रमाणीकरण सम्पन्न गर्नुहोस्"
                            : "Click to Verify Email & Access Login"}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Browser External Link */}
                  {emailVerificationNotice?.verifyLink && (
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Official Verification Link URL:</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (emailVerificationNotice?.verifyLink) {
                              navigator.clipboard.writeText(emailVerificationNotice.verifyLink);
                              setEmailVerificationNotice((prev) => (prev ? { ...prev, copiedLink: true } : null));
                              setTimeout(() => {
                                setEmailVerificationNotice((prev) => (prev ? { ...prev, copiedLink: false } : null));
                              }, 2000);
                            }
                          }}
                          className="text-[#003893] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {emailVerificationNotice?.copiedLink ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      </div>
                      <a
                        href={emailVerificationNotice.verifyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2.5 rounded-xl bg-white border border-blue-200 text-xs font-mono text-[#003893] truncate hover:bg-blue-50/50 transition-colors"
                      >
                        {emailVerificationNotice.verifyLink}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Verification Steps Card */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{language === "ne" ? "महत्त्वपूर्ण जानकारी" : "Important Next Steps"}</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed">
                  <li>{language === "ne" ? "इमेल प्रमाणीकरण पूरा नगरेसम्म लगइन अवरुद्ध (Locked) रहनेछ।" : "Login access remains locked until your email is verified."}</li>
                  <li>{language === "ne" ? "इमेलमा प्राप्त लिङ्कमा क्लिक गर्नासाथ खाता स्वतः प्रमाणीकरण हुनेछ।" : "Clicking the link instantly marks your email as verified in our system."}</li>
                  <li>{language === "ne" ? "यदि इमेल प्राप्त भएन भने तलको बटनबाट नयाँ लिङ्क पठाउन सक्नुहुन्छ।" : "If you haven't received the email, request a fresh verification link below."}</li>
                </ol>
              </div>

              {/* Actions: Resend Link or Back to Login */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setLoginForm((prev) => ({
                      ...prev,
                      identifier: emailVerificationNotice?.email || prev.identifier,
                    }));
                    setError(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{language === "ne" ? "लगइनमा जानुहोस् (Go to Login)" : "Proceed to Login"}</span>
                </button>

                <button
                  id="resend-verification-link-btn"
                  type="button"
                  onClick={handleResendVerificationLink}
                  disabled={loading || verificationTimer > 0}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>
                    {verificationTimer > 0
                      ? `Resend in ${verificationTimer}s`
                      : language === "ne"
                      ? "नयाँ लिङ्क पुनः पठाउनुहोस्"
                      : "Resend Verification Link"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Legal & Directives Modal */}
      {isLegalModalOpen && (
        <LegalComplianceModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          initialTab={legalModalTab}
          language={language}
        />
      )}
    </div>
  );
};
