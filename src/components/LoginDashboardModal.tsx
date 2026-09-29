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
  initialMode?: "login" | "register" | "forgot_password" | "email_verification" | "verification_details" | "pending_approval";
  onOpenSuperAdminGateway?: () => void;
}

export const LoginDashboardModal: React.FC<LoginDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser = DEFAULT_CURRENT_USER,
  onAuthSuccess,
  language,
  initialSector = "personal",
  initialMode = "register",
  onOpenSuperAdminGateway,
}) => {
  const [sector, setSector] = useState<AccountSector>(initialSector);
  const [mode, setMode] = useState<"login" | "register" | "forgot_password" | "email_verification" | "verification_details" | "pending_approval">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Google Auto Sign-In Draft and Pending Approval States
  const [googleDraftUser, setGoogleDraftUser] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  // Verification Details Form (Post-Google / Required for Super Admin Review)
  const [verificationForm, setVerificationForm] = useState({
    accountType: initialSector as "personal" | "business",
    fullName: "",
    email: "",
    mobileNumber: "",
    district: "Kathmandu",
    city: "Kathmandu Metro",
    province: "Bagmati",
    bio: "",
    businessName: "",
    panNumber: "",
    registrationNumber: "",
    documentFile: "",
    documentName: "",
    documentSize: "",
    notes: "",
  });

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
      if (initialSector) {
        setVerificationForm((prev) => ({ ...prev, accountType: initialSector }));
      }
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
      const rawMsg = err.message || "";
      const isSyntaxOrHtml =
        rawMsg.includes("Unexpected token") ||
        rawMsg.includes("is not valid JSON") ||
        rawMsg.includes("<html") ||
        rawMsg.includes("<!DOCTYPE");

      const cleanError = isSyntaxOrHtml
        ? language === "ne"
          ? "दर्ता सेवा सिङ्क हुँदैछ। कृपया केही क्षणमा पुन: प्रयास गर्नुहोस्।"
          : "Registration service is connecting. Please try again in a moment."
        : rawMsg || (language === "ne" ? "दर्ता असफल भयो। कृपया विवरण जाँच गरी पुन: प्रयास गर्नुहोस्।" : "Registration failed. Please verify your details and try again.");

      setError(cleanError);
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
      const rawMsg = err.message || "";
      const isSyntaxOrHtml =
        rawMsg.includes("Unexpected token") ||
        rawMsg.includes("is not valid JSON") ||
        rawMsg.includes("<html") ||
        rawMsg.includes("<!DOCTYPE");

      const cleanError = isSyntaxOrHtml
        ? language === "ne"
          ? "कम्पनी दर्ता सेवा सिङ्क हुँदैछ। कृपया केही क्षणमा पुन: प्रयास गर्नुहोस्।"
          : "Business registration service is connecting. Please try again in a moment."
        : rawMsg || (language === "ne" ? "कम्पनी दर्ता असफल भयो। कृपया विवरण जाँच गरी पुन: प्रयास गर्नुहोस्।" : "Business registration failed. Please verify your details and try again.");

      setError(cleanError);
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

      const isSuperOrAdmin =
        res.user?.isSuperAdmin ||
        res.isSuperAdmin ||
        res.user?.isDelegatedAdmin ||
        res.user?.role === "admin" ||
        res.user?.role === "super_admin" ||
        res.user?.email?.toLowerCase() === "photobucketnepal@gmail.com" ||
        res.user?.email?.toLowerCase() === "medeepaksubedi@gmail.com" ||
        res.user?.email?.toLowerCase() === "deepaksubedi32@gmail.com";

      if (isSuperOrAdmin) {
        setSuccessMsg(
          language === "ne"
            ? "प्रशासकीय प्रमाणीकरण सफल! कमाण्ड सेन्टर खुल्दैछ..."
            : "Administrative authorization verified! Launching portal..."
        );
      } else {
        setSuccessMsg(res.message);
      }

      setTimeout(() => {
        onAuthSuccess(res.user);
        if (onClose) onClose();
      }, 600);
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
      const rawMsg = err.message || "";
      const isSyntaxOrHtml =
        rawMsg.includes("Unexpected token") ||
        rawMsg.includes("is not valid JSON") ||
        rawMsg.includes("<html") ||
        rawMsg.includes("<!DOCTYPE");

      const cleanError = isSyntaxOrHtml
        ? language === "ne"
          ? "सर्भरसँग सम्पर्क हुन सकेन। कृपया पुन: प्रयास गर्नुहोस्।"
          : "Authentication service connection error. Please try again."
        : rawMsg || (language === "ne" ? "लगइन असफल भयो। कृपया विवरण जाँच गर्नुहोस्।" : "Login failed. Please check your credentials.");

      setError(cleanError);
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

  // Firebase Google Sign-In with Popup & Approval Flow
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      const googleUser = await signInWithGooglePopup();
      if (!googleUser) return;

      const cleanEmail = (googleUser.email || "").trim().toLowerCase();

      // Root Super Admin direct check
      if (
        cleanEmail === "photobucketnepal@gmail.com" ||
        cleanEmail === "medeepaksubedi@gmail.com" ||
        cleanEmail === "deepaksubedi32@gmail.com"
      ) {
        const rootAdminUser: User = {
          id: "user_deepak",
          username: "photo_bucket",
          fullName: "Deepak Subedi (Root Super Admin)",
          nepaliName: "दिपक सुवेदी (सुपर एडमिन)",
          avatar: googleUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
          bio: "👑 Root Super Admin & Founder of Photo Bucket Nepal",
          location: "Kathmandu, Nepal",
          district: "Kathmandu",
          followersCount: 1540,
          followingCount: 120,
          postsCount: 48,
          isVerified: true,
          isSuperAdmin: true,
          isApproved: true,
          approvalStatus: "approved",
          role: "super_admin",
          email: cleanEmail,
          createdAt: new Date().toISOString(),
        };

        try {
          await firestoreSync.saveUser(rootAdminUser);
        } catch {}

        setSuccessMsg(
          language === "ne"
            ? "सुपर एडमिन प्रमाणीकरण सफल भयो! (Super Admin Authenticated)"
            : "Root Super Admin authenticated via Google!"
        );
        setTimeout(() => {
          onAuthSuccess(rootAdminUser);
          if (onClose) onClose();
        }, 600);
        return;
      }

      // Check if user already exists on server or Firestore
      let existingUser: User | null = null;
      try {
        const statusRes = await api.checkApprovalStatus({ email: cleanEmail, userId: googleUser.uid });
        if (statusRes.user) {
          existingUser = statusRes.user;
        }
      } catch {}

      if (!existingUser) {
        try {
          existingUser = await firestoreSync.getUser(googleUser.uid);
        } catch {}
      }

      // User exists in system
      if (existingUser) {
        // If approved by Super Admin: Log in immediately
        if (existingUser.isApproved === true || existingUser.approvalStatus === "approved" || existingUser.isSuperAdmin) {
          setSuccessMsg(
            language === "ne"
              ? `स्वागत छ, ${existingUser.fullName}! गुगलबाट लगइन सफल भयो।`
              : `Welcome back, ${existingUser.fullName}! Logged in with Google.`
          );
          setTimeout(() => {
            onAuthSuccess(existingUser!);
            if (onClose) onClose();
          }, 600);
          return;
        }

        // If rejected by Super Admin
        if (existingUser.approvalStatus === "rejected") {
          setPendingUser(existingUser);
          setMode("pending_approval");
          setError(
            language === "ne"
              ? `तपाईंको खाता सुपर एडमिनबाट अस्वीकृत भएको छ: ${existingUser.approvalRejectionReason || "सम्पर्क गर्नुहोस्।"}`
              : `Your registration was rejected by Super Admin: ${existingUser.approvalRejectionReason || "Please update your details."}`
          );
          return;
        }

        // User is Pending Super Admin Approval: Lock login and show pending screen
        setPendingUser(existingUser);
        setMode("pending_approval");
        setSuccessMsg(
          language === "ne"
            ? "तपाईंको विवरण दर्ता छ र सुपर एडमिन प्रमाणीकरणको पर्खाइमा छ।"
            : "Your account details have been received and are pending Super Admin approval."
        );
        return;
      }

      // New Google User: Create Google draft and transition to Verification Details Form
      const generatedUsername = (cleanEmail ? cleanEmail.split("@")[0] : "user")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .slice(0, 30);

      const draft: User = {
        id: googleUser.uid,
        username: generatedUsername,
        fullName: googleUser.displayName || "Nepali Creator",
        avatar: googleUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${googleUser.uid}`,
        bio: "Joined via Google • Photo Bucket Nepal",
        location: "Kathmandu, Nepal",
        district: "Kathmandu",
        city: "Kathmandu Metro",
        province: "Bagmati",
        followersCount: 0,
        followingCount: 1,
        postsCount: 0,
        isVerified: false,
        isEmailVerified: !!googleUser.emailVerified,
        email: cleanEmail,
        accountType: sector,
        role: sector === "business" ? "business" : "user",
        status: "pending_approval",
        isApproved: false,
        approvalStatus: "pending_approval",
        createdAt: new Date().toISOString(),
      };

      setGoogleDraftUser(draft);
      setVerificationForm({
        accountType: sector,
        fullName: draft.fullName,
        email: cleanEmail,
        mobileNumber: "",
        district: "Kathmandu",
        city: "Kathmandu Metro",
        province: "Bagmati",
        bio: "",
        businessName: sector === "business" ? draft.fullName : "",
        panNumber: "",
        registrationNumber: "",
        documentFile: "",
        documentName: "",
        documentSize: "",
        notes: "",
      });

      setSuccessMsg(
        language === "ne"
          ? `गुगल खाता जोडिएको छ (${cleanEmail})! कृपया सुपर एडमिन प्रमाणीकरणका लागि थप विवरण भर्नुहोस्।`
          : `Google profile verified (${cleanEmail})! Please provide verification details for Super Admin review.`
      );
      setMode("verification_details");
    } catch (err: any) {
      if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/cancelled-popup-request" ||
        err?.message?.includes("auth/popup-closed-by-user")
      ) {
        return;
      }
      console.error("Google Sign-In error", err);
      setError(err.message || "Google sign-in was cancelled or encountered an error.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Further Verification Details for Super Admin Review
  const handleSubmitVerificationDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanPhone = (verificationForm.mobileNumber || "").replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10 || !/^9[78]\d{8}$/.test(cleanPhone)) {
      setError(
        language === "ne"
          ? "मोबाइल नम्बर ९८ वा ९७ बाट सुरु हुने १० अंकको हुनुपर्छ।"
          : "Mobile Number must be 10 digits starting with 98 or 97 (e.g. 9841234567)."
      );
      return;
    }

    if (verificationForm.accountType === "business") {
      if (!verificationForm.businessName.trim()) {
        setError(language === "ne" ? "कम्पनी / व्यापारको नाम अनिवार्य छ।" : "Business / Company Name is required.");
        return;
      }
      if (!verificationForm.panNumber.trim() || verificationForm.panNumber.trim().length !== 9) {
        setError(language === "ne" ? "प्यान नम्बर ९ अंकको हुनुपर्छ।" : "PAN Number must be 9 digits.");
        return;
      }
    }

    if (!acceptedPrivacy || !acceptedTerms) {
      setError(
        language === "ne"
          ? "कृपया प्रमाणीकरणका लागि गोपनीयता नीति र नेपाल सरकारका निर्देशिका स्वीकार गर्नुहोस्।"
          : "Please accept the Privacy Policy and Nepal Regulatory Directives before submitting."
      );
      return;
    }

    try {
      setLoading(true);
      const targetUserId = googleDraftUser?.id || `user_google_${Date.now()}`;
      const userEmail = verificationForm.email || googleDraftUser?.email || "";
      const generatedUsername = (userEmail.split("@")[0] || "user")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .slice(0, 30);

      const submissionData = {
        userId: targetUserId,
        email: userEmail,
        mobileNumber: cleanPhone,
        district: verificationForm.district,
        city: verificationForm.city,
        province: verificationForm.province,
        sector: verificationForm.accountType,
        businessName: verificationForm.accountType === "business" ? verificationForm.businessName.trim() : undefined,
        panNumber: verificationForm.accountType === "business" ? verificationForm.panNumber.trim().toUpperCase() : undefined,
        registrationNumber: verificationForm.accountType === "business" ? verificationForm.registrationNumber.trim() : undefined,
        documentType: verificationForm.accountType === "business" ? "company_reg" : "citizenship",
        documentName: verificationForm.documentName,
        documentFile: verificationForm.documentFile,
        notes: verificationForm.notes || `Phone: ${cleanPhone} | Location: ${verificationForm.city}, ${verificationForm.district}`,
      };

      await api.submitVerificationDetails(submissionData);

      const updatedPendingUser: User = {
        id: targetUserId,
        username: generatedUsername,
        fullName: verificationForm.fullName || googleDraftUser?.fullName || "Nepali Creator",
        avatar: googleDraftUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUserId}`,
        bio: verificationForm.bio || (verificationForm.accountType === "business" ? `🏢 ${verificationForm.businessName}` : "Nepali Creator • Photo Bucket Nepal"),
        location: `${verificationForm.city}, ${verificationForm.district}, Nepal`,
        district: verificationForm.district,
        city: verificationForm.city,
        province: verificationForm.province,
        followersCount: 0,
        followingCount: 1,
        postsCount: 0,
        isVerified: false,
        isEmailVerified: true,
        email: userEmail,
        mobileNumber: cleanPhone,
        accountType: verificationForm.accountType,
        role: verificationForm.accountType === "business" ? "business" : "user",
        businessName: verificationForm.accountType === "business" ? verificationForm.businessName.trim() : undefined,
        panNumber: verificationForm.accountType === "business" ? verificationForm.panNumber.trim().toUpperCase() : undefined,
        registrationNumber: verificationForm.accountType === "business" ? verificationForm.registrationNumber.trim() : undefined,
        verificationDocumentUrl: verificationForm.documentFile,
        verificationDocumentName: verificationForm.documentName,
        status: "pending_approval",
        isApproved: false,
        approvalStatus: "pending_approval",
        verificationSubmittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      try {
        await firestoreSync.saveUser(updatedPendingUser);
      } catch {}

      setPendingUser(updatedPendingUser);
      setMode("pending_approval");
      setSuccessMsg(
        language === "ne"
          ? "विवरण सुपर एडमिन समक्ष पेश गरियो! सुपर एडमिनबाट स्वीकृत भएपछि मात्र खाता सक्रिय हुनेछ।"
          : "Verification details submitted to Super Admin! Login access will be granted upon Super Admin approval."
      );
    } catch (err: any) {
      setError(err.message || "Failed to submit verification details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Live Check Approval Status Button Handler
  const handleCheckApprovalStatus = async () => {
    if (!pendingUser) return;
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      let isApproved = false;
      let freshUser: User | undefined = undefined;

      try {
        const res = await api.checkApprovalStatus({ userId: pendingUser.id, email: pendingUser.email });
        if (res.isApproved && res.user) {
          isApproved = true;
          freshUser = res.user;
        }
      } catch {}

      if (!isApproved) {
        try {
          const fUser = await firestoreSync.getUser(pendingUser.id);
          if (fUser && (fUser.isApproved === true || fUser.approvalStatus === "approved")) {
            isApproved = true;
            freshUser = fUser;
          }
        } catch {}
      }

      if (isApproved && freshUser) {
        setSuccessMsg(
          language === "ne"
            ? "🎉 बधाई छ! सुपर एडमिनबाट तपाईंको खाता स्वीकृत भयो। लगइन गरिँदैछ..."
            : "🎉 Congratulations! Your account has been approved by Super Admin. Signing in..."
        );
        setTimeout(() => {
          onAuthSuccess(freshUser!);
          if (onClose) onClose();
        }, 1000);
        return;
      }

      setSuccessMsg(
        language === "ne"
          ? "⏳ तपाईंको खाता अझै सुपर एडमिन समीक्षामा छ। सुपर एडमिनले स्वीकृति दिएपछि लगइन हुनेछ।"
          : "⏳ Your account is currently under Super Admin review. You will be able to log in once approved."
      );
    } catch (err: any) {
      setError("Could not check approval status right now. Please check your connection.");
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
          {/* One-Click Google Auto Sign-In (Primary Recommended Action) */}
          {(mode === "register" || mode === "login") && (
            <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-white border-2 border-blue-200 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-extrabold text-slate-800">
                    {language === "ne" ? "⚡ गुगलबाट १-क्लिक अटो साइन-इन" : "⚡ 1-Click Auto Sign In with Google"}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Primary Flow
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-snug">
                {language === "ne"
                  ? "गुगलबाट सजिलै साइन-इन गर्नुहोस्। साइन-इन गरेपछि सुपर एडमिन प्रमाणीकरणका लागि थप विवरण पेश गर्न सकिनेछ।"
                  : "Effortless 1-click Google authentication. After sign-in, submit your verification details for Super Admin review."}
              </p>

              <button
                id="hero-google-signin-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs sm:text-sm border-2 border-slate-300 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 group"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="group-hover:text-blue-600 transition-colors">
                  {language === "ne" ? "गुगल मार्फत तुरुन्त सुरु गर्नुहोस् (Continue with Google)" : "Continue with Google (Auto Sign-In)"}
                </span>
              </button>

              <div className="flex items-center gap-2 pt-1">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {language === "ne" ? "वा पासवर्ड मार्फत" : "Or with Email / Password"}
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
            </div>
          )}

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

              {/* Direct Administrative Portal Gateway Link */}
              {onOpenSuperAdminGateway && (
                <div className="pt-2 text-center border-t border-slate-100">
                  <button
                    id="open-superadmin-gateway-from-login-modal-btn"
                    type="button"
                    onClick={() => {
                      if (onClose) onClose();
                      onOpenSuperAdminGateway();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50/60 transition cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                    <span>
                      {language === "ne"
                        ? "🛡️ सुपर एडमिन तथा प्रशासकीय गेटवे खोल्नुहोस्"
                        : "🛡️ Open Super Admin & Staff Access Gateway"}
                    </span>
                  </button>
                </div>
              )}
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

          {/* ======================================================== */}
          {/* 5. VERIFICATION DETAILS FOR SUPER ADMIN FORM             */}
          {/* ======================================================== */}
          {mode === "verification_details" && (
            <form id="superadmin-verification-details-form" onSubmit={handleSubmitVerificationDetails} className="space-y-4">
              {/* Header Info */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/80 rounded-2xl border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#003893] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#003893]" />
                    <span>{language === "ne" ? "चरण २: सुपर एडमिन प्रमाणीकरण विवरण" : "Step 2: Submit Verification Details"}</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    Awaiting Super Admin Review
                  </span>
                </div>

                {googleDraftUser && (
                  <div className="flex items-center gap-2.5 p-2 bg-white/90 rounded-xl border border-blue-100">
                    <img
                      src={googleDraftUser.avatar}
                      alt={googleDraftUser.fullName}
                      className="w-8 h-8 rounded-full border border-blue-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1 text-left">
                      <div className="text-xs font-bold text-slate-800 truncate">{googleDraftUser.fullName}</div>
                      <div className="text-[10.5px] font-mono text-slate-500 truncate">{googleDraftUser.email} (Google Verified)</div>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {language === "ne"
                    ? "🔒 नेपाल सरकारको सामाजिक सञ्जाल निर्देशिका तथा सुरक्षा मापदण्ड बमोजिम सुपर एडमिनबाट प्रमाणीकरण नभएसम्म कुनै पनि प्रयोगकर्ता वा व्यवसाय लगइन हुन सक्दैनन्।"
                    : "🔒 In compliance with Nepal safety directives, no user (Personal or Business) can log in until Super Admin reviews and verifies your submitted details."}
                </p>
              </div>

              {/* Account Type Selector: Personal vs Business */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === "ne" ? "खाताको प्रकार (Account Type)" : "Account Type"} <span className="text-[#DC143C]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVerificationForm((prev) => ({ ...prev, accountType: "personal" }))}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      verificationForm.accountType === "personal"
                        ? "bg-blue-50/80 border-[#003893] text-[#003893] shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>{language === "ne" ? "व्यक्तिगत प्रयोगकर्ता" : "Personal User"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerificationForm((prev) => ({ ...prev, accountType: "business" }))}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      verificationForm.accountType === "business"
                        ? "bg-rose-50/80 border-[#DC143C] text-[#DC143C] shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{language === "ne" ? "व्यापार / संस्था" : "Business / Org"}</span>
                  </button>
                </div>
              </div>

              {/* Full Name / Contact Person */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {verificationForm.accountType === "business"
                    ? language === "ne" ? "सम्पर्क अधिकारीको पूरा नाम" : "Contact Officer / Representative Name"
                    : language === "ne" ? "तपाईंको पूरा नाम" : "Full Legal Name"}
                  <span className="text-[#DC143C]"> *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deepak Subedi"
                  value={verificationForm.fullName}
                  onChange={(e) => setVerificationForm({ ...verificationForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30 focus:border-[#003893]"
                />
              </div>

              {/* Business Specific Fields: Name, PAN, Registration */}
              {verificationForm.accountType === "business" && (
                <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-200/80 space-y-3">
                  <div className="text-xs font-bold text-[#DC143C] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>{language === "ne" ? "व्यावसायिक विवरण (Business Information)" : "Registered Business Details"}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === "ne" ? "कम्पनी वा संस्थाको नाम" : "Company / Business Legal Name"}
                      <span className="text-[#DC143C]"> *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Himalayan Horizon Expeditions Pvt. Ltd."
                      value={verificationForm.businessName}
                      onChange={(e) => setVerificationForm({ ...verificationForm, businessName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#DC143C]/30 focus:border-[#DC143C]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        PAN Number (९ अंक) <span className="text-[#DC143C]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={9}
                        placeholder="e.g. 601234567"
                        value={verificationForm.panNumber}
                        onChange={(e) =>
                          setVerificationForm({
                            ...verificationForm,
                            panNumber: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-[#DC143C]/30 focus:border-[#DC143C]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Company Reg No (ऐच्छिक)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 248910/080/081"
                        value={verificationForm.registrationNumber}
                        onChange={(e) =>
                          setVerificationForm({ ...verificationForm, registrationNumber: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-[#DC143C]/30 focus:border-[#DC143C]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Number: Mandatory for Super Admin Review */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#003893]" />
                    <span>{language === "ne" ? "सम्पर्क मोबाइल नम्बर" : "Contact Mobile Number"}</span>
                    <span className="text-[#DC143C]">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">10 digits (98XXXXXXXX / 97XXXXXXXX)</span>
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-3 font-mono font-bold text-xs text-slate-500 bg-slate-100 px-1.5 py-1 rounded">
                    🇳🇵 +977
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9841234567"
                    value={verificationForm.mobileNumber}
                    onChange={(e) =>
                      setVerificationForm({
                        ...verificationForm,
                        mobileNumber: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="w-full pl-24 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30 focus:border-[#003893]"
                  />
                </div>
                <p className="text-[10.5px] text-slate-500 mt-1">
                  🔒 {language === "ne" ? "मोबाइल नम्बर केवल सुपर एडमिन प्रमाणीकरणका लागि सुरक्षित रहनेछ र प्रोफाइलमा सार्वजनिक हुँदैन।" : "Your phone number is securely encrypted and visible exclusively to Super Admin."}
                </p>
              </div>

              {/* Nepal Location Selector (Province, District, City) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === "ne" ? "नेपालको ठेगाना / जिल्ला" : "Location & District"} <span className="text-[#DC143C]">*</span>
                </label>
                <NepalLocationSelector
                  province={verificationForm.province}
                  district={verificationForm.district}
                  city={verificationForm.city}
                  onChange={({ province, district, city }) =>
                    setVerificationForm((prev) => ({ ...prev, province, district, city }))
                  }
                  language={language}
                />
              </div>

              {/* Bio / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {verificationForm.accountType === "business"
                    ? language === "ne" ? "संस्थाको विवरण / कार्यक्षेत्र" : "Business Profile & Sector"
                    : language === "ne" ? "छोटो परिचय / फोटोग्राफी विधा" : "Bio / Photography Passion"}
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    verificationForm.accountType === "business"
                      ? "e.g. Travel & Tourism agency promoting Nepal's heritage"
                      : "e.g. Landscape and cultural photographer from Pokhara"
                  }
                  value={verificationForm.bio}
                  onChange={(e) => setVerificationForm({ ...verificationForm, bio: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30 focus:border-[#003893]"
                />
              </div>

              {/* Document / Certificate Upload (Optional for Personal, Recommended for Business) */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {verificationForm.accountType === "business"
                        ? "PAN / Company Registration Document (ऐच्छिक / सिफारिस)"
                        : "Citizenship / ID Card / Reference (ऐच्छिक)"}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400">PDF, PNG, JPG</span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setVerificationForm((prev) => ({
                            ...prev,
                            documentFile: reader.result as string,
                            documentName: file.name,
                            documentSize: `${(file.size / 1024).toFixed(1)} KB`,
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#003893] hover:file:bg-blue-100 cursor-pointer"
                  />
                  {verificationForm.documentName && (
                    <span className="text-[11px] font-mono text-emerald-700 truncate">
                      ✓ {verificationForm.documentName}
                    </span>
                  )}
                </div>
              </div>

              {/* Legal Directives & Privacy Acceptance */}
              {renderLegalConsentCheckboxes(verificationForm.accountType === "business" ? "crimson" : "blue")}

              {/* Submit Button */}
              <button
                id="submit-verification-details-btn"
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  verificationForm.accountType === "business"
                    ? "bg-[#DC143C] hover:bg-[#b01030]"
                    : "bg-[#003893] hover:bg-blue-900"
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Details...</span>
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {language === "ne"
                        ? "सुपर एडमिन प्रमाणीकरणका लागि पेश गर्नुहोस्"
                        : "Submit Details for Super Admin Verification"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  ← {language === "ne" ? "रद्द गरी लगइनमा फर्कनुहोस्" : "Cancel and Return to Sign In"}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* 6. PENDING SUPER ADMIN APPROVAL VIEW (GATEWAY LOCK)       */}
          {/* ======================================================== */}
          {mode === "pending_approval" && (
            <div id="pending-approval-view" className="space-y-4 text-center py-2">
              {/* Amber Lock Shield */}
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 shadow-inner">
                <Lock className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 font-mono tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  PENDING SUPER ADMIN APPROVAL
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-2 font-['Mukta']">
                  {language === "ne" ? "खाता सुपर एडमिन समीक्षामा छ" : "Account Pending Super Admin Review"}
                </h3>
              </div>

              {/* Strict Rule Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-left space-y-1.5 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    {language === "ne"
                      ? "सुपर एडमिन प्रमाणीकरण नभएसम्म खाता लगइन हुँदैन"
                      : "Login is Locked Until Super Admin Verification"}
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-700 leading-relaxed">
                  {language === "ne"
                    ? "सुरक्षा तथा कानूनी मापदण्डका कारण सुपर एडमिन (@photo_bucket) ले तपाईंको विवरण (फोन नम्बर, ठेगाना, व्यवसाय प्यान) प्रमाणीकरण गरेपछि मात्र प्लेटफर्ममा पूर्ण पहुँच खुल्नेछ।"
                    : "Until verification from Super Admin, no users (Personal or Business) can log in. Your submitted details have been queued for Root Super Admin verification."}
                </p>
              </div>

              {/* Submitted Details Card */}
              {pendingUser && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between border-b border-slate-200 pb-2">
                    <span>{language === "ne" ? "पेश गरिएको विवरण" : "Submitted Profile Summary"}</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {pendingUser.accountType === "business" ? "🏢 Business Org" : "👤 Personal Creator"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10.5px] text-slate-500 block">Name:</span>
                      <span className="font-bold text-slate-800 truncate block">{pendingUser.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-slate-500 block">Email:</span>
                      <span className="font-mono text-[11px] text-slate-800 truncate block">{pendingUser.email || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-slate-500 block">Mobile:</span>
                      <span className="font-mono text-xs font-bold text-slate-800 truncate block">
                        🇳🇵 {pendingUser.mobileNumber ? `+977 ${pendingUser.mobileNumber}` : "Verified via Google"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-slate-500 block">Location:</span>
                      <span className="text-xs font-medium text-slate-800 truncate block">
                        {pendingUser.district ? `${pendingUser.district}, Nepal` : "Nepal"}
                      </span>
                    </div>
                    {pendingUser.businessName && (
                      <div className="col-span-2">
                        <span className="text-[10.5px] text-slate-500 block">Business Name & PAN:</span>
                        <span className="font-bold text-slate-800 text-xs truncate block">
                          {pendingUser.businessName} {pendingUser.panNumber ? `(PAN: ${pendingUser.panNumber})` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Checker & Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  id="check-approval-status-btn"
                  type="button"
                  onClick={handleCheckApprovalStatus}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  <span>
                    {loading
                      ? (language === "ne" ? "स्थिति जाँच गरिँदैछ..." : "Checking Super Admin Status...")
                      : (language === "ne" ? "प्रमाणीकरण स्थिति पुनः जाँच्नुहोस् (Check Status)" : "Check Approval Status Now")}
                  </span>
                </button>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (pendingUser) {
                        setVerificationForm({
                          accountType: pendingUser.accountType || "personal",
                          fullName: pendingUser.fullName,
                          email: pendingUser.email || "",
                          mobileNumber: pendingUser.mobileNumber || "",
                          district: pendingUser.district || "Kathmandu",
                          city: pendingUser.city || "Kathmandu Metro",
                          province: pendingUser.province || "Bagmati",
                          bio: pendingUser.bio || "",
                          businessName: pendingUser.businessName || "",
                          panNumber: pendingUser.panNumber || "",
                          registrationNumber: pendingUser.registrationNumber || "",
                          documentFile: pendingUser.verificationDocumentUrl || "",
                          documentName: pendingUser.verificationDocumentName || "",
                          documentSize: "",
                          notes: "",
                        });
                      }
                      setMode("verification_details");
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>✏️ {language === "ne" ? "विवरण सच्याउनुहोस्" : "Edit Submitted Details"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPendingUser(null);
                      setGoogleDraftUser(null);
                      setMode("login");
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🚪 {language === "ne" ? "खाता परिवर्तन / रद्द" : "Sign Out / Switch"}</span>
                  </button>
                </div>
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
