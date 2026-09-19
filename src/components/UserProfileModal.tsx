import React, { useState, useEffect } from "react";
import { User, Post } from "../types";
import {
  X,
  MapPin,
  Grid,
  Bookmark,
  Building2,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Heart,
  MessageCircle,
  LogIn,
  Sparkles,
  Clock,
  AlertCircle,
  Edit3,
  Save,
  Loader2,
  Check,
  UserCheck,
  RefreshCw,
  KeyRound,
  Mail,
  Lock,
  Send,
  Eye,
  EyeOff,
  Copy,
  Inbox,
  Users,
  Radio,
} from "lucide-react";
import { VerifiedBadge } from "./VerifiedBadge";
import { VerificationRequestModal } from "./VerificationRequestModal";
import { NepalLocationSelector } from "./NepalLocationSelector";
import { api } from "../services/api";
import { useSessionDuration } from "../hooks/useSessionDuration";

interface UserProfileModalProps {
  user: User;
  currentUser: User;
  posts: Post[];
  onClose: () => void;
  onSelectPost: (post: Post) => void;
  onUserUpdated?: (updatedUser: User) => void;
  language: "en" | "ne";
  followingMap?: Record<string, string[]>;
  onFollowToggled?: (targetUserId: string, isFollowing: boolean) => void;
  activeUserIds?: string[];
  allUsers?: User[];
  onSelectUser?: (user: User) => void;
  onOpenDirectMessage?: (user: User) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  currentUser,
  posts,
  onClose,
  onSelectPost,
  onUserUpdated,
  language,
  followingMap = {},
  onFollowToggled,
  activeUserIds = [],
  allUsers = [],
  onSelectUser,
  onOpenDirectMessage,
}) => {
  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "business" | "verification" | "security" | "onlineFollowers">("posts");
  const sessionDuration = useSessionDuration(currentUser?.id, language);
  const [isFollowing, setIsFollowing] = useState(
    followingMap[currentUser?.id]?.includes(user?.id) || false
  );
  const [followers, setFollowers] = useState(user?.followersCount || 0);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  // Compute two-way mutual followers for this profile
  const userFollowing = followingMap[user?.id] || [];
  const twoWayFollowers = (allUsers || []).filter((u) => {
    if (u.id === user?.id || u.isSuperAdmin) return false;
    const userFollowsThem = userFollowing.includes(u.id);
    const theyFollowUser = (followingMap[u.id] || []).includes(user?.id);
    return userFollowsThem && theyFollowUser;
  });
  const onlineTwoWayFollowers = twoWayFollowers.filter((u) =>
    activeUserIds.includes(u.id)
  );
  const offlineTwoWayFollowers = twoWayFollowers.filter((u) =>
    !activeUserIds.includes(u.id)
  );

  useEffect(() => {
    setIsFollowing(followingMap[currentUser?.id]?.includes(user?.id) || false);
    setFollowers(user?.followersCount || 0);
    setActiveTab("posts");
  }, [user?.id, currentUser?.id, followingMap]);

  // Security & Password Change Flow States
  const [securityStep, setSecurityStep] = useState<1 | 2>(1);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityNotice, setSecurityNotice] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [securityForm, setSecurityForm] = useState({
    code: "",
    newPassword: "",
    confirmPassword: "",
    previewCode: "",
    registeredEmail: "",
    maskedEmail: "",
    timer: 0,
    showNewPassword: false,
    showConfirmPassword: false,
    copied: false,
  });

  // Countdown timer for resending security verification code
  React.useEffect(() => {
    if (securityForm.timer > 0) {
      const interval = setInterval(() => {
        setSecurityForm((prev) => ({ ...prev, timer: Math.max(0, prev.timer - 1) }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [securityForm.timer]);

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || "",
    fullName: user?.fullName || "",
    nepaliName: user?.nepaliName || "",
    bio: user?.bio || "",
    location: user?.location || "",
    district: user?.district || "Kathmandu",
    city: user?.city || "Kathmandu Metro",
    province: user?.province || "Bagmati",
    avatar: user?.avatar || "",
    businessName: user?.businessName || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameCheckResult, setUsernameCheckResult] = useState<{
    status: "idle" | "available" | "error";
    message?: string;
  }>({ status: "idle" });

  const [systemNotice, setSystemNotice] = useState<{
    type: "error" | "success" | "warning";
    message: string;
    field?: string;
  } | null>(null);

  const userPosts = posts.filter((p) => {
    if (p.userId !== user?.id) return false;
    // CRITICAL REQUIREMENT: Prohibited pics (nudity, bullying) must NOT be shown in user profiles
    if (p.verificationStatus === "rejected") return false;
    // If pending, only show if owner is viewing their own profile
    if (p.verificationStatus === "pending" && !isMe) return false;
    return true;
  });
  const savedPosts = posts.filter((p) => {
    if (!p.savedBy || !p.savedBy.includes(user?.id)) return false;
    if (p.verificationStatus === "rejected") return false;
    return true;
  });
  const rejectedCountForMe = posts.filter(
    (p) => p.userId === user?.id && p.verificationStatus === "rejected"
  ).length;

  const isMe = user?.id === currentUser?.id;
  const isBusiness = user?.accountType === "business";
  const isTwoWay =
    isFollowing &&
    Boolean(
      followingMap[user?.id]?.includes(currentUser?.id) ||
        (user?.id && currentUser?.id && followingMap[currentUser.id]?.includes(user.id))
    );

  const handleFollowToggle = async () => {
    if (!currentUser || !user || isMe) return;
    try {
      const res = await api.toggleFollow(currentUser.id, user.id);
      setIsFollowing(res.isFollowing);
      setFollowers(
        res.targetUser?.followersCount ??
          (res.isFollowing ? followers + 1 : Math.max(0, followers - 1))
      );
      if (onFollowToggled) onFollowToggled(user.id, res.isFollowing);
    } catch (err) {
      console.warn("Follow toggle failed", err);
      // Fallback
      if (isFollowing) {
        setIsFollowing(false);
        setFollowers((prev) => Math.max(0, prev - 1));
      } else {
        setIsFollowing(true);
        setFollowers((prev) => prev + 1);
      }
    }
  };

  // Check username availability in real-time when user tests/types
  const handleCheckUsername = async () => {
    if (!editForm.username.trim()) return;
    const cleanU = editForm.username.trim().toLowerCase().replace(/^@/, "");

    if (cleanU === user.username.toLowerCase()) {
      setUsernameCheckResult({
        status: "available",
        message: "Current username",
      });
      return;
    }

    setIsCheckingUsername(true);
    setUsernameCheckResult({ status: "idle" });
    setSystemNotice(null);

    try {
      const res = await fetch(`/api/users/${user.id}/check-username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanU }),
      });
      const data = await res.json();

      if (res.ok && data.eligible) {
        setUsernameCheckResult({
          status: "available",
          message: data.message || `Username @${cleanU} is available!`,
        });
      } else {
        setUsernameCheckResult({
          status: "error",
          message: data.message || "Username cannot be used.",
        });
        setSystemNotice({
          type: "warning",
          field: "username",
          message: data.message || "Username verification failed.",
        });
      }
    } catch {
      setUsernameCheckResult({
        status: "error",
        message: "Unable to verify username. Please try again.",
      });
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Submit Profile Edits to Backend
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side guard for 150 char limit (letters, numbers, spaces, emojis)
    const bioCharLength = Array.from((editForm.bio || "").trim()).length;
    if (bioCharLength > 150) {
      setSystemNotice({
        type: "error",
        field: "bio",
        message: `Bio must not exceed 150 characters (currently ${bioCharLength}/150 characters).`,
      });
      return;
    }

    setIsSaving(true);
    setSystemNotice(null);

    try {
      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (!res.ok) {
        // Backend prevented change (e.g. 30 days username limit, uniqueness, 7 days bio limit)
        setSystemNotice({
          type: "error",
          field: data.field,
          message: data.message || "Failed to update profile.",
        });
        setIsSaving(false);
        return;
      }

      // Success
      setSystemNotice({
        type: "success",
        message: data.message || "Profile updated successfully!",
      });

      if (onUserUpdated && data.user) {
        onUserUpdated(data.user);
      }

      setTimeout(() => {
        setIsEditing(false);
        setSystemNotice(null);
      }, 1500);
    } catch {
      setSystemNotice({
        type: "error",
        message: "Network error occurred while updating profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Request Security Verification Code to Official Registered Email ID
  const handleRequestPasswordCode = async () => {
    setSecurityNotice(null);
    try {
      setSecurityLoading(true);
      const res = await api.requestPasswordResetCode({ userId: user.id });
      setSecurityForm((prev) => ({
        ...prev,
        previewCode: res.previewCode || "",
        registeredEmail: res.registeredEmail,
        maskedEmail: res.maskedEmail,
        timer: 60,
        code: "",
      }));
      setSecurityStep(2);
      setSecurityNotice({
        type: "success",
        message: res.message || `Verification code sent to ${res.maskedEmail}`,
      });
    } catch (err: any) {
      setSecurityNotice({
        type: "error",
        message: err.message || "Could not dispatch code to official registered email.",
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  // Verify Code and Update Password
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityNotice(null);

    if (!securityForm.code.trim()) {
      setSecurityNotice({
        type: "error",
        message: language === "ne" ? "कृपया इमेलमा प्राप्त ६-अङ्के कोड प्रविष्ट गर्नुहोस्।" : "Please enter the 6-digit code sent to your official registered email.",
      });
      return;
    }

    if (securityForm.newPassword.length < 6) {
      setSecurityNotice({
        type: "error",
        message: language === "ne" ? "नयाँ पासवर्ड कम्तीमा ६ अक्षरको हुनुपर्छ।" : "New password must be at least 6 characters.",
      });
      return;
    }

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityNotice({
        type: "error",
        message: language === "ne" ? "नयाँ पासवर्ड र पुष्टि पासवर्ड मिलेन।" : "New password and confirm password do not match.",
      });
      return;
    }

    try {
      setSecurityLoading(true);
      const res = await api.verifyAndChangePassword({
        userId: user.id,
        code: securityForm.code,
        newPassword: securityForm.newPassword,
        confirmPassword: securityForm.confirmPassword,
      });

      setSecurityNotice({
        type: "success",
        message: res.message || "Password changed successfully!",
      });

      setSecurityStep(1);
      setSecurityForm((prev) => ({
        ...prev,
        code: "",
        newPassword: "",
        confirmPassword: "",
        previewCode: "",
      }));
    } catch (err: any) {
      setSecurityNotice({
        type: "error",
        message: err.message || "Failed to update password. Please check the code.",
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <div
        id="user-profile-modal"
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      >
        <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 font-mono">
                @{user.username}
              </span>
              {isBusiness ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-[#DC143C] border border-rose-100">
                  <Building2 className="w-3 h-3" />
                  <span>Business Org</span>
                </span>
              ) : (
                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#003893] border border-blue-100">
                  Personal User
                </span>
              )}

              {user.isVerified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#003893] border border-blue-200">
                  <VerifiedBadge
                    category={user.verificationCategory}
                    badgeTitle={user.verifiedBadgeTitle}
                    size="xs"
                    showTooltip={false}
                  />
                  <span>{user.verifiedBadgeTitle || "Verified"}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isMe && (
                <div
                  id="profile-header-logged-in-badge"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#003893] text-[11px] font-semibold"
                  title={`Logged in session: ${sessionDuration.formattedDetailed} (since ${sessionDuration.startTime})`}
                >
                  <Clock className="w-3.5 h-3.5 text-[#003893]" />
                  <span className="font-mono font-bold">{sessionDuration.formattedHeaderBadge}</span>
                  <span className="text-slate-500 font-normal">
                    {language === "ne" ? "लगइन" : "logged in"}
                  </span>
                </div>
              )}
              {isMe && !isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditForm({
                      username: user.username || "",
                      fullName: user.fullName || "",
                      nepaliName: user.nepaliName || "",
                      bio: user.bio || "",
                      location: user.location || "",
                      district: user.district || "Kathmandu",
                      avatar: user.avatar || "",
                      businessName: user.businessName || "",
                    });
                    setSystemNotice(null);
                    setUsernameCheckResult({ status: "idle" });
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-200/70 hover:bg-slate-300 text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Edit Profile"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}

              {isMe && isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSystemNotice(null);
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* System Dynamic Notification Banner (Appears ONLY when user performs an action / attempts edit) */}
            {systemNotice && (
              <div
                className={`mb-4 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 ${
                  systemNotice.type === "error"
                    ? "bg-rose-50 border border-rose-200 text-rose-800"
                    : systemNotice.type === "warning"
                    ? "bg-amber-50 border border-amber-200 text-amber-900"
                    : "bg-emerald-50 border border-emerald-200 text-emerald-800"
                }`}
              >
                {systemNotice.type === "error" || systemNotice.type === "warning" ? (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-current" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                )}
                <div className="flex-1">
                  <div className="font-bold">
                    {systemNotice.type === "error"
                      ? "System Action Restricted"
                      : systemNotice.type === "warning"
                      ? "System Information"
                      : "System Notice"}
                  </div>
                  <p className="mt-0.5 leading-relaxed">{systemNotice.message}</p>
                </div>
              </div>
            )}

            {/* EDIT PROFILE MODE */}
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-[#003893]" />
                      <span>Edit Account Profile</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {isBusiness ? "Business Account" : "Personal Account"}
                    </span>
                  </div>

                  {/* Username Field with Availability Check */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Username
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">@</span>
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) => {
                            setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") });
                            setUsernameCheckResult({ status: "idle" });
                            setSystemNotice(null);
                          }}
                          placeholder="unique_username"
                          className="w-full pl-7 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003893]"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleCheckUsername}
                        disabled={isCheckingUsername || !editForm.username || editForm.username === user.username}
                        className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {isCheckingUsername ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        <span>Check</span>
                      </button>
                    </div>

                    {/* Live Username Feedback when user tests */}
                    {usernameCheckResult.status === "available" && (
                      <div className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        <span>{usernameCheckResult.message}</span>
                      </div>
                    )}
                    {usernameCheckResult.status === "error" && (
                      <div className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{usernameCheckResult.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Full Name & Nepali Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003893]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 font-['Mukta']">
                        नाम (Nepali Name)
                      </label>
                      <input
                        type="text"
                        value={editForm.nepaliName}
                        onChange={(e) => setEditForm({ ...editForm, nepaliName: e.target.value })}
                        placeholder="e.g. दिपक सुवेदी"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003893]"
                      />
                    </div>
                  </div>

                  {/* Business Name if business user */}
                  {isBusiness && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Registered Business / Enterprise Name
                      </label>
                      <input
                        type="text"
                        value={editForm.businessName}
                        onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003893]"
                      />
                    </div>
                  )}

                  {/* Bio Field (Strict 150 Character Limit) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Bio
                      </label>
                      <span
                        className={`text-[10px] font-mono font-semibold ${
                          Array.from(editForm.bio || "").length >= 150
                            ? "text-rose-600 font-bold"
                            : Array.from(editForm.bio || "").length >= 130
                            ? "text-amber-600"
                            : "text-slate-400"
                        }`}
                      >
                        {Array.from(editForm.bio || "").length}/150
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={150}
                      value={editForm.bio}
                      onChange={(e) => {
                        const valPortion = e.target.value;
                        const chars = Array.from(valPortion);
                        const trimmed = chars.length > 150 ? chars.slice(0, 150).join("") : valPortion;
                        setEditForm({ ...editForm, bio: trimmed });
                        setSystemNotice(null);
                      }}
                      placeholder="Write something about your photography, travels, or business... (max 150 characters)"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003893] resize-none"
                    />
                  </div>

                  {/* Nepal Administrative Location (District & City Selector) */}
                  <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200">
                    <NepalLocationSelector
                      idPrefix="profile-edit"
                      district={editForm.district}
                      city={editForm.city}
                      province={editForm.province}
                      accentColor={isBusiness ? "crimson" : "blue"}
                      onLocationChange={(loc) => {
                        setEditForm((prev) => ({
                          ...prev,
                          district: loc.district,
                          city: loc.city,
                          province: loc.province,
                          location: `${loc.city}, ${loc.district}, Nepal`,
                        }));
                      }}
                      helperNote={
                        language === "ne"
                          ? "📍 जिल्ला र शहर छनोट गर्नाले नेपालभरिका प्रयोगकर्ताहरूले तपाईंको जिल्ला अनुसार तस्बिरहरू भेट्टाउन सजिलो हुन्छ।"
                          : "📍 Updating your District & City enables localized photo exploration and discovery across Nepal."
                      }
                    />
                  </div>

                  {/* Avatar URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Profile Avatar URL
                    </label>
                    <div className="flex items-center gap-2">
                      <img
                        src={editForm.avatar || user.avatar}
                        alt="Avatar Preview"
                        className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                      />
                      <input
                        type="url"
                        value={editForm.avatar}
                        onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003893]"
                      />
                    </div>
                  </div>
                </div>

                {/* Save and Security Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setActiveTab("security");
                      setSecurityNotice(null);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Change Password (Email Code)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setSystemNotice(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#003893] hover:bg-[#002a70] disabled:opacity-50 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* REGULAR PROFILE VIEW */
              <>
                {/* Top Profile Summary */}
                <div className="flex items-start gap-4 sm:gap-6 mb-6">
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-1 flex-shrink-0 ${
                      user.isVerified
                        ? "bg-gradient-to-tr from-[#003893] via-[#1D4ED8] to-[#DC143C] ring-2 ring-blue-400/50"
                        : isBusiness
                        ? "bg-gradient-to-tr from-[#DC143C] to-rose-400"
                        : "bg-gradient-to-tr from-[#003893] to-[#DC143C]"
                    }`}
                  >
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-full h-full rounded-2xl object-cover bg-white"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{user.fullName}</span>
                        {user.isVerified && (
                          <VerifiedBadge
                            category={user.verificationCategory}
                            badgeTitle={user.verifiedBadgeTitle}
                            size="md"
                          />
                        )}
                      </h2>
                      {user.nepaliName && user.nepaliName !== user.fullName && (
                        <span className="text-sm font-['Mukta'] font-semibold text-[#DC143C]">
                          ({user.nepaliName})
                        </span>
                      )}
                    </div>

                    {/* Location Tag */}
                    <div className="flex items-center gap-1 text-xs text-slate-600 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-[#DC143C]" />
                      <span>{user.location}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-mono text-slate-500">
                        {user.district}
                      </span>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-slate-700 leading-relaxed mb-3">{user.bio}</p>

                    {/* Blue Tick Verified Status Card */}
                    {user.isVerified && (
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-200/90 mb-3 flex items-center justify-between text-xs shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#003893] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                            <ShieldCheck className="w-5 h-5 text-cyan-300" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                              <span>{language === "ne" ? "ब्लू टिक प्रमाणित" : "Blue Tick Verified"}</span>
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-[#003893] bg-white px-2.5 py-1 rounded-xl border border-blue-200 shadow-2xs flex-shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>{language === "ne" ? "प्रमाणित" : "Verified"}</span>
                        </span>
                      </div>
                    )}

                    {/* If ME: Application status / Apply for Blue Tick */}
                    {isMe && !user.isVerified && (
                      <div className="mb-3">
                        {user.verificationStatus === "pending" ? (
                          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex items-start gap-2.5">
                            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                                <span>Blue Tick Verification Pending Review</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 font-mono">
                                  Under Authentication
                                </span>
                              </div>
                              <p className="text-[11px] text-amber-700 mt-0.5">
                                Document ({user.verificationDocumentName || "Government ID"}) submitted on{" "}
                                {user.verificationSubmittedAt ? new Date(user.verificationSubmittedAt).toLocaleDateString() : "today"}. Our compliance team will review and activate your Blue Tick soon.
                              </p>
                            </div>
                          </div>
                        ) : user.verificationStatus === "rejected" ? (
                          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs flex items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2 flex-1">
                              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="font-bold text-rose-900">
                                  Verification Application Needs Resubmission
                                </div>
                                <p className="text-[11px] text-rose-700 mt-0.5">
                                  {user.verificationRejectionReason || "Please provide a clearer photo of your government-issued ID."}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setIsVerificationModalOpen(true)}
                              className="px-3 py-1 rounded-xl bg-[#003893] text-white text-xs font-bold hover:bg-[#002a70] transition-colors cursor-pointer flex-shrink-0"
                            >
                              Re-Apply
                            </button>
                          </div>
                        ) : (
                          <button
                            id="apply-blue-tick-profile-btn"
                            onClick={() => setIsVerificationModalOpen(true)}
                            className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-[#003893] via-[#002a70] to-[#DC143C] hover:opacity-95 text-white text-xs font-bold flex items-center justify-between shadow-xs transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-cyan-300 group-hover:rotate-12 transition-transform" />
                              <span>
                                {language === "ne"
                                  ? "ब्लू टिक प्रमाणीकरणका लागि आवेदन दिनुहोस् (सेलिब्रेटी / व्यवसायी / उद्यमी)"
                                  : "Apply for Blue Tick (Celebrity / Businessman / Entrepreneur)"}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">
                              Apply Now →
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Business Official Verification Banner (Only if not verified via Blue Tick) */}
                    {isBusiness && !user.isVerified && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 mb-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <div>
                            <div className="font-bold text-slate-800">
                              {user.businessName || user.fullName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              PAN: {user.panNumber || "Verified"} • Reg: {user.registrationNumber || "Verified"}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Business</span>
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {!isMe && (
                      <div className="flex items-center gap-1.5">
                        {isTwoWay && (
                          <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200 flex items-center gap-1 shadow-2xs">
                            <span>🤝</span>
                            <span>{language === "ne" ? "दुईतर्फी साथी" : "Mutual Friend"}</span>
                          </span>
                        )}
                        <button
                          onClick={handleFollowToggle}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isFollowing
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              : isBusiness
                              ? "bg-[#DC143C] hover:bg-[#b01030] text-white shadow-xs"
                              : "bg-[#003893] hover:bg-[#002a70] text-white shadow-xs"
                          }`}
                        >
                          {isFollowing ? "Following ✓" : "Follow +"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Bar */}
                <div
                  className={`grid ${
                    isMe ? "grid-cols-4" : "grid-cols-3"
                  } border-y border-slate-100 py-3 text-center mb-6 bg-slate-50/50 rounded-2xl`}
                >
                  <div>
                    <div className="font-mono font-bold text-sm sm:text-base text-slate-900">
                      {userPosts.length}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">Posts</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-sm sm:text-base text-slate-900">
                      {followers.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">Followers</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-sm sm:text-base text-slate-900">
                      {user.followingCount}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">Following</div>
                  </div>
                  {isMe && (
                    <div
                      onClick={() => setActiveTab("onlineFollowers")}
                      className="cursor-pointer hover:bg-emerald-50/60 transition-colors rounded-xl py-0.5"
                      title="View Online Two-Way Followers"
                    >
                      <div className="font-mono font-bold text-sm sm:text-base text-emerald-600 flex items-center justify-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span>{onlineTwoWayFollowers.length}</span>
                      </div>
                      <div className="text-[11px] text-emerald-700 font-bold">Online</div>
                    </div>
                  )}
                </div>

                {/* Active Logged In Session Time Bar for Profile Owner */}
                {isMe && (
                  <div
                    id="profile-active-session-card"
                    className="mb-5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#003893] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Clock className="w-4 h-4 text-cyan-300" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{language === "ne" ? "सक्रिय लगइन समय अवधि:" : "Active Session Duration:"}</span>
                          <span className="font-mono text-sm font-extrabold text-[#003893]">
                            {language === "ne" ? sessionDuration.formattedNepali : sessionDuration.formattedDetailed}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {language === "ne"
                            ? `आज ${sessionDuration.startTime} मा लगइन गरिएको (लाइभ ट्र्याकिङ)`
                            : `Logged in today at ${sessionDuration.startTime} (Live session tracking)`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{language === "ne" ? "सक्रिय लगइन" : "Active"}</span>
                    </div>
                  </div>
                )}

                {/* Grid Tabs */}
                <div className="flex items-center justify-center gap-4 sm:gap-8 border-b border-slate-100 mb-4 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("posts")}
                    className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                      activeTab === "posts"
                        ? "border-[#003893] text-[#003893]"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>POSTS</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("saved")}
                    className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                      activeTab === "saved"
                        ? "border-[#DC143C] text-[#DC143C]"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>SAVED BUCKET</span>
                  </button>
                  {isMe && (
                    <button
                      id="tab-online-followers"
                      onClick={() => setActiveTab("onlineFollowers")}
                      className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                        activeTab === "onlineFollowers"
                          ? "border-emerald-600 text-emerald-700"
                          : "border-transparent text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span>{language === "ne" ? "अनलाइन फलोअर्स" : "FOLLOWERS ONLINE"}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                        {onlineTwoWayFollowers.length}
                      </span>
                    </button>
                  )}
                  {isBusiness && (
                    <button
                      onClick={() => setActiveTab("business")}
                      className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                        activeTab === "business"
                          ? "border-emerald-600 text-emerald-700"
                          : "border-transparent text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>BUSINESS PROFILE</span>
                    </button>
                  )}
                  {isMe && (
                    <button
                      id="profile-security-tab-btn"
                      onClick={() => {
                        setActiveTab("security");
                        setSecurityNotice(null);
                      }}
                      className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                        activeTab === "security"
                          ? "border-amber-600 text-amber-700"
                          : "border-transparent text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>SECURITY & PASSWORD</span>
                    </button>
                  )}
                </div>

                {/* Security & Password Tab */}
                {activeTab === "security" && isMe ? (
                  <div className="space-y-4">
                    {/* Official Registered Email ID Display Card */}
                    <div className="p-4 bg-gradient-to-br from-amber-50/70 via-blue-50/40 to-slate-50 rounded-2xl border border-amber-200/80 text-xs">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#003893] text-white flex items-center justify-center shrink-0 shadow-xs">
                            <ShieldCheck className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <span>Official Registered Security Contact</span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Verified Email
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-slate-500 font-medium">Official Registered Email ID:</span>
                              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                                {user.email || "support@photobucket.com.np"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                              {language === "ne"
                                ? "सुरक्षा नियम: पासवर्ड परिवर्तन गर्नका लागि ६-अङ्के एक-पटक प्रयोग हुने कोड अनिवार्य रूपमा तपाईंको आधिकारिक दर्ता गरिएको इमेल ठेगानामा मात्र पठाइन्छ।"
                                : "Security Mandate: For password changing, the 6-digit one-time security verification code is strictly dispatched to your official registered email ID."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notice Messages */}
                    {securityNotice && (
                      <div
                        className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                          securityNotice.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {securityNotice.type === "success" ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        )}
                        <span>{securityNotice.message}</span>
                      </div>
                    )}

                    {/* Step 1: Request Code Button */}
                    {securityStep === 1 && (
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {language === "ne" ? "पासवर्ड परिवर्तन सुरु गर्नुहोस्" : "Initiate Password Change"}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {language === "ne"
                                ? `तलको बटन थिची तपाईंको आधिकारिक इमेल (${user.email || "support@photobucket.com.np"}) मा सुरक्षा कोड पठाउनुहोस्।`
                                : `Click below to receive a 6-digit verification code on your official registered email (${user.email || "support@photobucket.com.np"}).`}
                            </p>
                          </div>
                        </div>

                        <button
                          id="profile-request-password-code-btn"
                          type="button"
                          onClick={handleRequestPasswordCode}
                          disabled={securityLoading}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#003893] to-[#002a70] hover:opacity-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {securityLoading ? (
                            <span>Sending code to official email...</span>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>
                                {language === "ne"
                                  ? `आधिकारिक इमेल (${user.email || "support@photobucket.com.np"}) मा कोड पठाउनुहोस्`
                                  : `Send Code to Official Registered Email (${user.email || "support@photobucket.com.np"})`}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Step 2: Verification Code Input and New Password */}
                    {securityStep === 2 && (
                      <form onSubmit={handleSaveNewPassword} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
                        {/* Simulation Dispatch Banner */}
                        <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-[#003893]">
                              <Inbox className="w-4 h-4" />
                              <span>Official Email Dispatched</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#003893] bg-blue-100 px-2 py-0.5 rounded-full">
                              Code Dispatched ✓
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            Sent to: <strong>{securityForm.registeredEmail || user.email}</strong>
                          </div>

                          {securityForm.previewCode && (
                            <div className="p-2.5 rounded-lg bg-white border border-blue-300 flex items-center justify-between">
                              <div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase">Received 6-Digit Code</div>
                                <div className="font-mono font-extrabold text-lg text-[#003893] tracking-widest">
                                  {securityForm.previewCode}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSecurityForm((prev) => ({
                                    ...prev,
                                    code: prev.previewCode,
                                    copied: true,
                                  }));
                                  setTimeout(() => {
                                    setSecurityForm((prev) => ({ ...prev, copied: false }));
                                  }, 2000);
                                }}
                                className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#003893] border border-blue-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                {securityForm.copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{securityForm.copied ? "Auto-filled!" : "Auto-fill Code"}</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 6-Digit Code */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            6-Digit Verification Code <span className="text-[#DC143C]">*</span>
                          </label>
                          <div className="relative">
                            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            <input
                              id="profile-security-code-input"
                              type="text"
                              required
                              maxLength={6}
                              placeholder="e.g. 123456"
                              value={securityForm.code}
                              onChange={(e) =>
                                setSecurityForm({
                                  ...securityForm,
                                  code: e.target.value.replace(/\D/g, ""),
                                })
                              }
                              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30 focus:border-[#003893]"
                            />
                          </div>
                        </div>

                        {/* New Password */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            New Password <span className="text-[#DC143C]">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            <input
                              id="profile-new-password-input"
                              type={securityForm.showNewPassword ? "text" : "password"}
                              required
                              placeholder="At least 6 characters"
                              value={securityForm.newPassword}
                              onChange={(e) =>
                                setSecurityForm({ ...securityForm, newPassword: e.target.value })
                              }
                              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30 focus:border-[#003893]"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setSecurityForm({
                                  ...securityForm,
                                  showNewPassword: !securityForm.showNewPassword,
                                })
                              }
                              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {securityForm.showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Confirm New Password */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Confirm New Password <span className="text-[#DC143C]">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            <input
                              id="profile-confirm-new-password-input"
                              type={securityForm.showConfirmPassword ? "text" : "password"}
                              required
                              placeholder="Re-type new password"
                              value={securityForm.confirmPassword}
                              onChange={(e) =>
                                setSecurityForm({ ...securityForm, confirmPassword: e.target.value })
                              }
                              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#003893]/30 focus:border-[#003893]"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setSecurityForm({
                                  ...securityForm,
                                  showConfirmPassword: !securityForm.showConfirmPassword,
                                })
                              }
                              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {securityForm.showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {securityForm.confirmPassword.length > 0 &&
                            securityForm.newPassword !== securityForm.confirmPassword && (
                              <p className="text-[11px] text-rose-600 mt-1">Passwords do not match</p>
                            )}
                        </div>

                        {/* Resend Code & Timer */}
                        <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
                          <button
                            type="button"
                            onClick={() => setSecurityStep(1)}
                            className="text-[#003893] hover:underline font-medium cursor-pointer"
                          >
                            ← Back
                          </button>
                          {securityForm.timer > 0 ? (
                            <span className="text-slate-400 font-mono text-[11px]">
                              Resend code in {securityForm.timer}s
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleRequestPasswordCode}
                              className="text-[#003893] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Resend Code to Email</span>
                            </button>
                          )}
                        </div>

                        {/* Submit Button */}
                        <button
                          id="profile-submit-change-password-btn"
                          type="submit"
                          disabled={securityLoading || securityForm.newPassword !== securityForm.confirmPassword}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {securityLoading ? (
                            <span>Verifying & Updating...</span>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Verify Code & Change Password</span>
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                ) : activeTab === "business" && isBusiness ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                      <Building2 className="w-4 h-4 text-[#DC143C]" />
                      <span>Official Business Registration Details</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <div className="text-[10px] uppercase font-bold text-slate-400">PAN Number</div>
                        <div className="font-mono font-bold text-slate-800 text-sm">{user.panNumber}</div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Registration No.</div>
                        <div className="font-mono font-bold text-slate-800 text-sm">{user.registrationNumber}</div>
                      </div>
                    </div>
                    {user.documentName && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          <div>
                            <div className="font-bold text-slate-800">{user.documentName}</div>
                            <div className="text-[10px] text-slate-400">Verified Corporate Documentation</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          Verified Document
                        </span>
                      </div>
                    )}
                  </div>
                ) : activeTab === "onlineFollowers" && isMe ? (
                  <div className="space-y-4">
                    {/* Header banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                            <Radio className="w-4 h-4 animate-pulse" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                              <span>{language === "ne" ? "अनलाइन फलोअर्स (दोहोरो साथीहरू)" : "Followers Online (Mutual Friends)"}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                <span>{onlineTwoWayFollowers.length} Online</span>
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              {language === "ne"
                                ? "दुईतर्फी साथीहरू (जसलाई तपाईंले फलो गर्नुभएको छ र उहाँहरूले पनि तपाईंलाई फलो गर्नुभएको छ)।"
                                : "Two-way mutual followers (users who follow this account and whom this account follows back)."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Online List */}
                    {onlineTwoWayFollowers.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 px-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{language === "ne" ? "अहिले सक्रिय अनलाइन साथीहरू" : "Active Right Now"}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({onlineTwoWayFollowers.length})</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {onlineTwoWayFollowers.map((friend) => (
                            <div
                              key={friend.id}
                              className="p-3 bg-white rounded-2xl border border-emerald-200/80 hover:border-emerald-400 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                            >
                              <div
                                onClick={() => {
                                  if (onSelectUser) onSelectUser(friend);
                                }}
                                className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                              >
                                <div className="relative shrink-0">
                                  <img
                                    src={friend.avatar}
                                    alt={friend.fullName}
                                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500"
                                  />
                                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white" />
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-1">
                                    <span className="truncate">{friend.fullName}</span>
                                    {friend.isVerified && (
                                      <VerifiedBadge
                                        category={friend.verificationCategory}
                                        badgeTitle={friend.verifiedBadgeTitle}
                                        size="sm"
                                      />
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                                    <span className="font-mono text-slate-600">@{friend.username}</span>
                                    {friend.location && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate">{friend.location}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {onOpenDirectMessage && (
                                  <button
                                    onClick={() => {
                                      onOpenDirectMessage(friend);
                                      onClose();
                                    }}
                                    className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                                    title="Send Message"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {onSelectUser && (
                                  <button
                                    onClick={() => {
                                      onSelectUser(friend);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#003893] hover:text-white text-slate-700 text-xs font-bold transition-all cursor-pointer"
                                  >
                                    Wall
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <div className="text-xs font-bold text-slate-700">
                          {language === "ne" ? "अहिले कुनै पनि दुईतर्फी साथी अनलाइन हुनुहुन्न" : "No two-way mutual followers online right now"}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                          {language === "ne"
                            ? "जब साथीहरू लगइन गर्नुहुन्छ, उहाँहरू यहाँ हरियो अनलाइन सूचकसहित देखिनुहुनेछ।"
                            : "When your mutual followers log in or browse Photo Bucket, they will appear here with a live green indicator."}
                        </p>
                      </div>
                    )}

                    {/* Offline Mutual Followers section */}
                    {offlineTwoWayFollowers.length > 0 && (
                      <div className="pt-3 border-t border-slate-100">
                        <div className="text-xs font-bold text-slate-500 mb-2 px-1 flex items-center justify-between">
                          <span>{language === "ne" ? "अन्य दोहोरो साथीहरू (अहिले अफलाइन)" : "Other Mutual Friends (Offline)"}</span>
                          <span className="text-[10px] font-mono">({offlineTwoWayFollowers.length})</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {offlineTwoWayFollowers.map((friend) => (
                            <div
                              key={friend.id}
                              onClick={() => {
                                if (onSelectUser) onSelectUser(friend);
                              }}
                              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <img
                                src={friend.avatar}
                                alt={friend.fullName}
                                className="w-7 h-7 rounded-lg object-cover bg-slate-200"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-[11px] text-slate-800 truncate">
                                  {friend.fullName}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate font-mono">
                                  @{friend.username}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {isMe && rejectedCountForMe > 0 && activeTab === "posts" && (
                      <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-[#DC143C] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Community Guidelines System Notice: </span>
                          <span>
                            {rejectedCountForMe} photo(s) did not comply with safety guidelines (nudity / bullying policy) and are suppressed from your public profile.
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      {(activeTab === "posts" ? userPosts : savedPosts).map((post) => (
                        <div
                          key={post.id}
                          onClick={() => {
                            onSelectPost(post);
                            onClose();
                          }}
                          className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 cursor-pointer"
                        >
                          <img
                            src={post.imageUrl}
                            alt={post.caption}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />

                          {post.verificationStatus === "pending" && (
                            <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-amber-500/90 text-white text-[9px] font-bold flex items-center gap-1 backdrop-blur-xs shadow-xs">
                              <Clock className="w-2.5 h-2.5 animate-spin" />
                              <span>Verifying (~1 min)</span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-mono">
                            <div className="flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 fill-white" />
                              <span>{post.likes.length}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3.5 h-3.5 fill-white" />
                              <span>{post.comments.length}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(activeTab === "posts" ? userPosts : savedPosts).length === 0 && activeTab !== "business" && activeTab !== "security" && activeTab !== "onlineFollowers" && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No photos in this section yet.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Blue Tick Verification Application Modal */}
      {isVerificationModalOpen && (
        <VerificationRequestModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          currentUser={user}
          onApplicationSubmitted={(updatedUser) => {
            if (onUserUpdated) onUserUpdated(updatedUser);
          }}
          language={language}
        />
      )}
    </>
  );
};
