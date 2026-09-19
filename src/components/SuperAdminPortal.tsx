import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Building2,
  FileCheck,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  Search,
  RefreshCw,
  Edit3,
  Key,
  Eye,
  Send,
  Pin,
  MapPin,
  Phone,
  Mail,
  FileText,
  Lock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Ban,
  Activity,
  Layers,
  ChevronRight,
  X,
  Star,
  Briefcase,
  Camera,
  Check,
  Clock,
  Award,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
import { User, Post, AuditLog, AdminOverviewStats, VerificationRequest } from "../types";
import { api, realtime } from "../services/api";
import { VerifiedBadge } from "./VerifiedBadge";
import { AdminSummaryDashboard } from "./AdminSummaryDashboard";
import { AdminPostCreator } from "./AdminPostCreator";
import { DelegatedAdminManagement } from "./DelegatedAdminManagement";
import { SuperAdminAdsManager } from "./SuperAdminAdsManager";

interface SuperAdminPortalProps {
  currentUser: User;
  onClose: () => void;
  onLogout: () => void;
  onSwitchToUserView: () => void;
  initialTab?: string;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  currentUser,
  onClose,
  onLogout,
  onSwitchToUserView,
  initialTab,
}) => {
  const isRootSuperAdmin = currentUser.isSuperAdmin === true || currentUser.email === "deepaksubedi32@gmail.com";
  const permissions = currentUser.adminPermissions;

  // Determine initial tab based on permissions
  const getInitialTab = (): "overview" | "users" | "verification" | "business" | "posts" | "create_post" | "scrolling_ads" | "logs" | "broadcast" | "delegated_admins" => {
    if (initialTab && ["overview", "users", "verification", "business", "posts", "create_post", "scrolling_ads", "logs", "broadcast", "delegated_admins"].includes(initialTab)) {
      return initialTab as any;
    }
    if (isRootSuperAdmin) return "overview";
    if (permissions?.canViewOverviewStats !== false) return "overview";
    if (permissions?.canVerifyUsers) return "verification";
    if (permissions?.canModeratePosts) return "posts";
    if (permissions?.canManageUsers) return "users";
    if (permissions?.canManageBusinesses) return "business";
    if (permissions?.canCreatePosts) return "create_post";
    if (permissions?.canViewAuditLogs) return "logs";
    if (permissions?.canDispatchBroadcasts) return "broadcast";
    return "overview";
  };

  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "verification" | "business" | "posts" | "create_post" | "scrolling_ads" | "logs" | "broadcast" | "delegated_admins"
  >(getInitialTab);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [usersList, setUsersList] = useState<(User & { storedPasswordHint?: string })[]>([]);
  const [postsList, setPostsList] = useState<Post[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);

  // Search & Filter States
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSectorFilter, setUserSectorFilter] = useState<"all" | "pending_approval" | "personal" | "business" | "suspended">("all");
  const [verificationFilter, setVerificationFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>("all");

  // Modals & Action States
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [selectedUserForPasswordReset, setSelectedUserForPasswordReset] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [previewingDocUser, setPreviewingDocUser] = useState<User | null>(null);
  const [selectedVerificationForReview, setSelectedVerificationForReview] = useState<VerificationRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [customBadgeTitleInput, setCustomBadgeTitleInput] = useState("");
  const [actionNotice, setActionNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Super Admin Blue Tick Management for Individual User (Personal or Business)
  const [selectedUserForBlueTickModal, setSelectedUserForBlueTickModal] = useState<User | null>(null);
  const [blueTickForm, setBlueTickForm] = useState<{
    isVerified: boolean;
    category: "celebrity" | "businessman" | "entrepreneur" | "public_figure" | "creator" | "organization";
    badgeTitle: string;
    isBusinessVerified: boolean;
  }>({
    isVerified: false,
    category: "creator",
    badgeTitle: "Verified Creator",
    isBusinessVerified: false,
  });

  const handleOpenBlueTickModal = (user: User) => {
    const isBiz = user.accountType === "business";
    const defaultCat = isBiz ? "businessman" : (user.verificationCategory || "creator");
    const defaultTitle = user.verifiedBadgeTitle || user.badge || (
      defaultCat === "celebrity" ? "Verified Celebrity" :
      defaultCat === "businessman" ? "Verified Businessman" :
      defaultCat === "entrepreneur" ? "Verified Entrepreneur" :
      defaultCat === "public_figure" ? "Verified Public Figure" :
      defaultCat === "organization" ? "Verified Business Org" : "Verified Creator"
    );

    setBlueTickForm({
      isVerified: user.isVerified || user.isBusinessVerified || false,
      category: (user.verificationCategory as any) || defaultCat,
      badgeTitle: defaultTitle,
      isBusinessVerified: isBiz ? (user.isBusinessVerified || user.isVerified || false) : false,
    });
    setSelectedUserForBlueTickModal(user);
  };

  const handleSaveUserBlueTick = async () => {
    if (!selectedUserForBlueTickModal) return;
    try {
      const isBiz = selectedUserForBlueTickModal.accountType === "business";
      const res = await api.verifyAdminUser(selectedUserForBlueTickModal.id, {
        isVerified: blueTickForm.isVerified,
        isBusinessVerified: isBiz ? blueTickForm.isVerified : false,
        category: blueTickForm.category,
        verificationCategory: blueTickForm.category,
        badgeTitle: blueTickForm.badgeTitle.trim() || undefined,
        verifiedBadgeTitle: blueTickForm.badgeTitle.trim() || undefined,
        badge: blueTickForm.badgeTitle.trim() || undefined,
        verificationStatus: blueTickForm.isVerified ? "approved" : "none",
      });

      setUsersList((prev) =>
        prev.map((u) => (u.id === selectedUserForBlueTickModal.id ? { ...u, ...res.user } : u))
      );
      setSelectedUserForBlueTickModal(null);
      showToast(
        `Blue Tick ${blueTickForm.isVerified ? "granted" : "revoked"} for @${selectedUserForBlueTickModal.username} (${selectedUserForBlueTickModal.accountType})!`,
        "success"
      );
    } catch (err: any) {
      showToast(err.message || "Failed to update user Blue Tick", "error");
    }
  };

  // Broadcast Form
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState<"info" | "warning" | "alert">("info");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Load All Admin Data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [overviewRes, usersRes, postsRes, logsRes, verifRes] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminUsers(),
        api.getAdminPosts(),
        api.getAdminAuditLogs(),
        api.getAdminVerificationRequests(),
      ]);

      if (overviewRes.stats) setStats(overviewRes.stats);
      if (usersRes.users) setUsersList(usersRes.users);
      if (postsRes.posts) setPostsList(postsRes.posts);
      if (logsRes.auditLogs) setAuditLogs(logsRes.auditLogs);
      if (verifRes.requests) setVerificationRequests(verifRes.requests);
    } catch (err: any) {
      console.error("Admin data fetch error:", err);
      showToast(err.message || "Failed to sync admin portal data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Subscribe to live audit logs and updates via WebSocket
    const unsubLog = realtime.subscribe("admin:audit_log", (newLog: AuditLog) => {
      setAuditLogs((prev) => [newLog, ...prev]);
    });

    const unsubUserUpdate = realtime.subscribe("user:updated", (updatedUser: User) => {
      setUsersList((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
      );
    });

    const unsubUserDelete = realtime.subscribe("user:deleted", ({ userId }: { userId: string }) => {
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
      setPostsList((prev) => prev.filter((p) => p.userId !== userId));
    });

    const unsubPostDelete = realtime.subscribe("post:deleted", ({ postId }: { postId: string }) => {
      setPostsList((prev) => prev.filter((p) => p.id !== postId));
    });

    const unsubVerifNew = realtime.subscribe("verification:new", (newReq: VerificationRequest) => {
      setVerificationRequests((prev) => {
        const filtered = prev.filter((r) => r.id !== newReq.id);
        return [newReq, ...filtered];
      });
    });

    const unsubVerifUpdate = realtime.subscribe("verification:updated", (updatedReq: VerificationRequest) => {
      setVerificationRequests((prev) =>
        prev.map((r) => (r.id === updatedReq.id ? updatedReq : r))
      );
    });

    return () => {
      unsubLog();
      unsubUserUpdate();
      unsubUserDelete();
      unsubPostDelete();
      unsubVerifNew();
      unsubVerifUpdate();
    };
  }, []);

  // Action: Approve Verification Request
  const handleApproveVerification = async (req: VerificationRequest) => {
    try {
      const res = await api.approveVerificationRequest(req.id, {
        badgeTitle: customBadgeTitleInput.trim() || req.badgeTitle || undefined,
        category: req.category,
      });

      setVerificationRequests((prev) =>
        prev.map((r) => (r.id === req.id ? res.request : r))
      );
      setUsersList((prev) =>
        prev.map((u) => (u.id === res.user.id ? { ...u, ...res.user } : u))
      );
      setSelectedVerificationForReview(null);
      setCustomBadgeTitleInput("");
      showToast(`Blue tick verification approved for @${req.username}!`, "success");
    } catch (err: any) {
      showToast(err.message || "Approval failed", "error");
    }
  };

  // Action: Reject Verification Request
  const handleRejectVerification = async (req: VerificationRequest) => {
    try {
      const res = await api.rejectVerificationRequest(
        req.id,
        rejectionReasonInput.trim() || "The submitted document could not be authenticated as valid government ID."
      );

      setVerificationRequests((prev) =>
        prev.map((r) => (r.id === req.id ? res.request : r))
      );
      setUsersList((prev) =>
        prev.map((u) => (u.id === res.user.id ? { ...u, ...res.user } : u))
      );
      setSelectedVerificationForReview(null);
      setRejectionReasonInput("");
      showToast(`Verification request rejected for @${req.username}.`, "success");
    } catch (err: any) {
      showToast(err.message || "Rejection failed", "error");
    }
  };

  // Action: Toggle Verification directly on User
  const handleToggleVerification = async (user: User) => {
    try {
      const isBiz = user.accountType === "business";
      const newStatus = isBiz ? !user.isBusinessVerified : !user.isVerified;
      const res = await api.verifyAdminUser(user.id, {
        isVerified: newStatus,
        isBusinessVerified: isBiz ? newStatus : undefined,
        badge: newStatus ? (isBiz ? "Verified Business" : "Verified Creator") : undefined,
      });

      setUsersList((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...res.user } : u)));
      showToast(`Verification status updated for @${user.username}`, "success");
    } catch (err: any) {
      showToast(err.message || "Action failed", "error");
    }
  };

  // Action: Toggle Account Status (Active / Suspended / Banned)
  const handleSetUserStatus = async (userId: string, newStatus: "active" | "suspended" | "banned") => {
    try {
      const res = await api.setAdminUserStatus(userId, newStatus);
      setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
      showToast(`User status set to ${newStatus.toUpperCase()}`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update user status", "error");
    }
  };

  // Action: Approve User Registration
  const handleApproveRegistration = async (user: User) => {
    try {
      const res = await api.approveUserRegistration(user.id);
      setUsersList((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...res.user } : u)));
      showToast(`Registration approved for @${user.username} (${user.fullName}). Account can now login.`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to approve registration", "error");
    }
  };

  // Action: Reject User Registration
  const handleRejectRegistration = async (user: User) => {
    const reason = window.prompt(
      `Enter rejection reason for @${user.username}:`,
      "Registration details did not meet platform verification standards."
    );
    if (reason === null) return;

    try {
      const res = await api.rejectUserRegistration(user.id, reason);
      setUsersList((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...res.user } : u)));
      showToast(`Registration rejected for @${user.username}.`, "error");
    } catch (err: any) {
      showToast(err.message || "Failed to reject registration", "error");
    }
  };

  // Action: Delete User
  const handleDeleteUser = async (user: User) => {
    if (user.isSuperAdmin) {
      showToast("Cannot delete root super admin!", "error");
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete user @${user.username} (${user.fullName}) and all their posts?`)) {
      return;
    }

    try {
      await api.deleteAdminUser(user.id);
      setUsersList((prev) => prev.filter((u) => u.id !== user.id));
      setPostsList((prev) => prev.filter((p) => p.userId !== user.id));
      showToast(`User @${user.username} permanently deleted.`, "success");
    } catch (err: any) {
      showToast(err.message || "Delete failed", "error");
    }
  };

  // Action: Save Edited User
  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    try {
      const res = await api.updateAdminUser(selectedUserForEdit.id, editFormData);
      setUsersList((prev) => prev.map((u) => (u.id === selectedUserForEdit.id ? { ...u, ...res.user } : u)));
      setSelectedUserForEdit(null);
      showToast(`Profile for @${selectedUserForEdit.username} updated.`, "success");
    } catch (err: any) {
      showToast(err.message || "Update failed", "error");
    }
  };

  // Action: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPasswordReset || !newPasswordInput) return;

    try {
      await api.resetAdminUserPassword(selectedUserForPasswordReset.id, newPasswordInput);
      setSelectedUserForPasswordReset(null);
      setNewPasswordInput("");
      showToast(`Password for @${selectedUserForPasswordReset.username} has been reset.`, "success");
    } catch (err: any) {
      showToast(err.message || "Password reset failed", "error");
    }
  };

  // Action: Delete Post
  const handleDeletePost = async (post: Post) => {
    if (!window.confirm(`Delete post from ${post.location} by @${post.username}?`)) return;

    try {
      await api.deleteAdminPost(post.id);
      setPostsList((prev) => prev.filter((p) => p.id !== post.id));
      showToast("Post removed by Super Admin.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to delete post", "error");
    }
  };

  // Action: Feature / Pin Post
  const handleToggleFeaturePost = async (post: Post) => {
    try {
      const res = await api.toggleFeaturePost(post.id);
      setPostsList((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, isFeatured: res.isFeatured } as any : p))
      );
      showToast(res.isFeatured ? "Post featured on Nepal Explore feed" : "Post unfeatured", "success");
    } catch (err: any) {
      showToast(err.message || "Feature action failed", "error");
    }
  };

  // Action: Send Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    setIsBroadcasting(true);
    try {
      await api.broadcastAdminMessage({
        title: broadcastTitle,
        message: broadcastMessage,
        type: broadcastType,
      });
      setBroadcastTitle("");
      setBroadcastMessage("");
      showToast("System announcement successfully broadcasted to all live users!", "success");
    } catch (err: any) {
      showToast(err.message || "Broadcast failed", "error");
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Filtered Lists
  const filteredUsers = usersList.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    const matchesSearch =
      u.fullName?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.mobileNumber?.includes(q) ||
      u.panNumber?.includes(q) ||
      u.district?.toLowerCase().includes(q) ||
      u.businessName?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (userSectorFilter === "pending_approval") return u.approvalStatus === "pending_approval" || u.isApproved === false;
    if (userSectorFilter === "personal") return u.accountType === "personal" && !u.isSuperAdmin;
    if (userSectorFilter === "business") return u.accountType === "business";
    if (userSectorFilter === "suspended") return u.status === "suspended" || u.status === "banned";
    return true;
  });

  const pendingApprovalsCount = usersList.filter(
    (u) => (u.approvalStatus === "pending_approval" || u.isApproved === false) && !u.isSuperAdmin
  ).length;
  const businessUsers = usersList.filter((u) => u.accountType === "business");

  const pendingVerificationsCount = verificationRequests.filter((r) => r.status === "pending").length;

  const filteredVerificationRequests = verificationRequests.filter((r) => {
    if (verificationFilter === "pending") return r.status === "pending";
    if (verificationFilter === "approved") return r.status === "approved";
    if (verificationFilter === "rejected") return r.status === "rejected";
    return true;
  });

  const filteredPosts = postsList.filter((p) => {
    const q = postSearchQuery.toLowerCase();
    return (
      p.caption?.toLowerCase().includes(q) ||
      p.nepaliCaption?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.userFullName?.toLowerCase().includes(q) ||
      p.username?.toLowerCase().includes(q) ||
      p.district?.toLowerCase().includes(q)
    );
  });

  const filteredLogs = auditLogs.filter((l) => {
    if (logCategoryFilter === "all") return true;
    return l.category === logCategoryFilter;
  });

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Banner / Toast */}
      {actionNotice && (
        <div
          className={`absolute top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium border ${
            actionNotice.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/30"
              : "bg-rose-950/90 text-rose-200 border-rose-500/30"
          }`}
        >
          {actionNotice.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* Super Admin / Delegated Admin Top Command Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-crimson-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-950">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-white tracking-wide">
                {isRootSuperAdmin ? "SUPER ADMIN COMMAND CENTER" : "ADMINISTRATIVE STAFF PORTAL"}
              </h1>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded uppercase ${
                isRootSuperAdmin
                  ? "bg-crimson-500/20 text-crimson-300 border border-crimson-500/30"
                  : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
              }`}>
                {isRootSuperAdmin ? "ROOT PRIVILEGES" : "LIMITED STAFF ACCESS"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              फोटो Bucket (Nepal) • Authenticated:{" "}
              <span className="text-indigo-300 font-medium font-mono">
                {currentUser.officialEmail || currentUser.email}
              </span>
              {currentUser.designation && (
                <span className="text-amber-300 ml-1.5 font-semibold">({currentUser.designation})</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            Sync Data
          </button>

          <button
            onClick={onSwitchToUserView}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-200 text-xs font-medium border border-indigo-700/50 transition"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            Preview Public Feed
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-medium border border-rose-800/50 transition"
          >
            <X className="w-3.5 h-3.5" />
            Exit Admin
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-1.5">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Control Modules
            </div>

            {(isRootSuperAdmin || permissions?.canViewOverviewStats !== false) && (
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === "overview"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4" />
                  <span>Command Overview</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            )}

            {(isRootSuperAdmin || permissions?.canManageUsers) && (
              <button
                onClick={() => setActiveTab("users")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === "users"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>Users Activity & Control</span>
                </div>
                {pendingApprovalsCount > 0 ? (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500 text-slate-950 font-bold animate-pulse shadow-sm">
                    {pendingApprovalsCount} pending
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {usersList.length}
                  </span>
                )}
              </button>
            )}

            {/* Blue Tick Verification Desk for Celebrities, Businessman & Entrepreneurs */}
            {(isRootSuperAdmin || permissions?.canVerifyUsers) && (
              <button
                onClick={() => setActiveTab("verification")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === "verification"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>Blue Tick Verification Desk</span>
                </div>
                {pendingVerificationsCount > 0 ? (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white font-bold animate-pulse shadow-sm shadow-blue-400">
                    {pendingVerificationsCount} pending
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {verificationRequests.length}
                  </span>
                )}
              </button>
            )}

            {(isRootSuperAdmin || permissions?.canManageBusinesses) && (
              <button
                onClick={() => setActiveTab("business")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === "business"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4" />
                  <span>Business Verification Desk</span>
                </div>
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                  {businessUsers.length}
                </span>
              </button>
            )}

            {(isRootSuperAdmin || permissions?.canModeratePosts) && (
              <button
                onClick={() => setActiveTab("posts")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === "posts"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4" />
                  <span>Content Moderation</span>
                </div>
                <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {postsList.length}
                </span>
              </button>
            )}

            {/* Post Addition Part in Super Admin Panel */}
            {(isRootSuperAdmin || permissions?.canCreatePosts) && (
              <button
                onClick={() => setActiveTab("create_post")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === "create_post"
                    ? "bg-gradient-to-r from-indigo-600 to-crimson-600 text-white shadow-lg shadow-indigo-950"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Camera className="w-4 h-4 text-crimson-400" />
                  <span>+ Add Official Post</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-crimson-950 text-crimson-300 border border-crimson-800/80">
                  Broadcast
                </span>
              </button>
            )}

            {(isRootSuperAdmin || permissions?.canViewAuditLogs) && (
              <button
                onClick={() => setActiveTab("logs")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === "logs"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4" />
                  <span>Live Audit & Security Logs</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </button>
            )}

            {(isRootSuperAdmin || permissions?.canDispatchBroadcasts) && (
              <button
                onClick={() => setActiveTab("broadcast")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === "broadcast"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Radio className="w-4 h-4" />
                  <span>Live System Broadcast</span>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </button>
            )}

            {/* Scrolling Ads & Announcement Ticker Upload & Management */}
            {(isRootSuperAdmin || permissions?.canCreatePosts) && (
              <button
                id="sidebar-scrolling-ads-btn"
                onClick={() => setActiveTab("scrolling_ads")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === "scrolling_ads"
                    ? "bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-lg shadow-rose-950"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Megaphone className="w-4 h-4 text-rose-400" />
                  <span>Scrolling Ads & Notices</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-950 text-rose-300 border border-rose-800/80">
                  Ads
                </span>
              </button>
            )}

            {/* Sub-Admin Delegation & Track Tasks Done - Exclusively Super Admin */}
            {isRootSuperAdmin && (
              <button
                id="sidebar-delegated-admins-btn"
                onClick={() => setActiveTab("delegated_admins")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === "delegated_admins"
                    ? "bg-gradient-to-r from-indigo-600 to-crimson-600 text-white shadow-lg shadow-indigo-950"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sub-Admins & Tasks</span>
                </div>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Super Admin Only
                </span>
              </button>
            )}
          </div>

          {/* Super Admin / Admin Identity Badge */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.fullName}
              className="w-10 h-10 rounded-full border border-indigo-500 object-cover"
            />
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">{currentUser.fullName}</div>
              <div className="text-[11px] text-indigo-400 font-mono truncate">
                {currentUser.officialEmail || currentUser.email}
              </div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{isRootSuperAdmin ? "Root Super Admin" : `${currentUser.designation || "Sub-Admin Staff"}`}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Tab Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {/* TAB 1: INNOVATIVE OVERVIEW & GEOGRAPHIC / TIME-RATIO SUMMARY */}
          {activeTab === "overview" && (
            <AdminSummaryDashboard
              stats={stats}
              usersList={usersList}
              postsList={postsList}
              auditLogs={auditLogs}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSelectUserForDetail={(u) => {
                setSelectedUserForEdit(u);
                setEditFormData(u);
              }}
            />
          )}

          {/* TAB: SUPER ADMIN POST ADDITION STUDIO */}
          {activeTab === "create_post" && (
            <AdminPostCreator
              currentUser={currentUser}
              onPostCreated={(newPost) => {
                setPostsList((prev) => [newPost, ...prev]);
                showToast("Official Super Admin Post published and broadcasted!", "success");
                setActiveTab("posts");
              }}
              onCancel={() => setActiveTab("overview")}
            />
          )}

          {/* TAB 2: USERS CONTROL & MANAGEMENT */}
          {activeTab === "users" && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">All Users Directory & Activity Control</h2>
                  <p className="text-xs text-slate-400">
                    Full access to confidential registration records, 98-series mobile numbers, PAN certificates, and account moderation.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
                  <button
                    onClick={() => setUserSectorFilter("all")}
                    className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition ${
                      userSectorFilter === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All ({usersList.length})
                  </button>
                  <button
                    onClick={() => setUserSectorFilter("pending_approval")}
                    className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap flex items-center gap-1.5 transition ${
                      userSectorFilter === "pending_approval"
                        ? "bg-amber-600 text-white shadow-md shadow-amber-950"
                        : "text-amber-400 hover:bg-amber-950/40"
                    }`}
                  >
                    <span>Pending Approval</span>
                    {pendingApprovalsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                        {pendingApprovalsCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setUserSectorFilter("personal")}
                    className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition ${
                      userSectorFilter === "personal" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Personal
                  </button>
                  <button
                    onClick={() => setUserSectorFilter("business")}
                    className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition ${
                      userSectorFilter === "business" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Business ({businessUsers.length})
                  </button>
                  <button
                    onClick={() => setUserSectorFilter("suspended")}
                    className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition ${
                      userSectorFilter === "suspended" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Suspended/Banned
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search by Name, Username, 98-series Mobile, Email, PAN Number, District..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Users Table */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">User / Organization</th>
                        <th className="py-3 px-4">Sector</th>
                        <th className="py-3 px-4">Contact / Credentials</th>
                        <th className="py-3 px-4">District / Location</th>
                        <th className="py-3 px-4">Status & Badge</th>
                        <th className="py-3 px-4 text-right">Super Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition">
                          {/* User Avatar & Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.avatar}
                                alt={u.fullName}
                                className="w-9 h-9 rounded-full object-cover border border-slate-700"
                              />
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{u.fullName}</span>
                                  {u.isSuperAdmin && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-crimson-600 text-white">
                                      SUPER ADMIN
                                    </span>
                                  )}
                                  {(u.isVerified || u.isBusinessVerified) && !u.isSuperAdmin && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                              </div>
                            </div>
                          </td>

                          {/* Sector */}
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                u.accountType === "business"
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                  : "bg-indigo-950 text-indigo-300 border border-indigo-800"
                              }`}
                            >
                              {u.accountType || "personal"}
                            </span>
                          </td>

                          {/* Contact Info (Revealed only to Super Admin) */}
                          <td className="py-3 px-4">
                            <div className="space-y-0.5 font-mono text-[11px]">
                              {u.email && (
                                <div className="text-slate-300 flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-500" />
                                  <span>{u.email}</span>
                                </div>
                              )}
                              {u.mobileNumber && (
                                <div className="text-emerald-400 flex items-center gap-1 font-semibold">
                                  <Phone className="w-3 h-3 text-emerald-500" />
                                  <span>+977 {u.mobileNumber}</span>
                                </div>
                              )}
                              {u.panNumber && (
                                <div className="text-amber-300 flex items-center gap-1 font-semibold">
                                  <span>PAN: {u.panNumber}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Location */}
                          <td className="py-3 px-4 text-slate-300">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              <span>{u.location || u.district || "Nepal"}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">{u.postsCount || 0} posts • {u.followersCount || 0} followers</div>
                          </td>

                          {/* Status & Blue Tick Badge */}
                          <td className="py-3 px-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {!u.isSuperAdmin && (u.approvalStatus === "pending_approval" || u.isApproved === false) ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                    PENDING APPROVAL
                                  </span>
                                ) : u.approvalStatus === "rejected" ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                                    REJECTED
                                  </span>
                                ) : (
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                      u.status === "banned"
                                        ? "bg-rose-950 text-rose-300 border border-rose-800"
                                        : u.status === "suspended"
                                        ? "bg-amber-950 text-amber-300 border border-amber-800"
                                        : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                    }`}
                                  >
                                    {u.status || "active"}
                                  </span>
                                )}
                                {(u.isVerified || u.isBusinessVerified) && (
                                  <VerifiedBadge
                                    category={u.verificationCategory || (u.accountType === "business" ? "businessman" : "creator")}
                                    badgeTitle={u.verifiedBadgeTitle || u.badge}
                                    size="xs"
                                    showTooltip={false}
                                  />
                                )}
                              </div>
                              {(u.isVerified || u.isBusinessVerified) ? (
                                <div className="text-[10px] text-cyan-300 font-medium capitalize flex items-center gap-1">
                                  <span>
                                    {u.verificationCategory === "celebrity" ? "🌟 Celebrity" :
                                     u.verificationCategory === "businessman" ? "🏢 Businessman" :
                                     u.verificationCategory === "entrepreneur" ? "💼 Entrepreneur" :
                                     u.verificationCategory === "public_figure" ? "🎙️ Public Figure" :
                                     u.verificationCategory === "organization" ? "🏛️ Org" : "📸 Creator"}
                                  </span>
                                  {u.verifiedBadgeTitle && (
                                    <span className="text-slate-400 font-mono truncate max-w-[120px]">
                                      • {u.verifiedBadgeTitle}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono block">
                                  {u.approvalStatus === "pending_approval" ? "Awaiting Super Admin" : "Standard Account"}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Pending Registration Approval Actions */}
                              {!u.isSuperAdmin && (u.approvalStatus === "pending_approval" || u.isApproved === false) && (
                                <>
                                  <button
                                    onClick={() => handleApproveRegistration(u)}
                                    title="Approve user registration to allow login"
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-950 transition cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => handleRejectRegistration(u)}
                                    title="Reject user registration"
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}

                              {/* Blue Tick Super Admin Manager Button */}
                              <button
                                onClick={() => handleOpenBlueTickModal(u)}
                                title={u.isVerified || u.isBusinessVerified ? `Manage / Edit Blue Tick (@${u.username})` : `Grant Blue Tick to @${u.username} (Personal/Business)`}
                                className={`px-2 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                                  u.isVerified || u.isBusinessVerified
                                    ? "bg-blue-950/90 text-blue-300 border-blue-700 hover:bg-blue-900 shadow-sm"
                                    : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white"
                                }`}
                              >
                                <span className={`w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[9px] font-bold ${
                                  u.isVerified || u.isBusinessVerified ? "bg-[#003893] text-white" : "bg-slate-700 text-slate-300"
                                }`}>
                                  ✓
                                </span>
                                <span className="hidden sm:inline">Blue Tick</span>
                              </button>

                              {/* Edit Profile */}
                              <button
                                onClick={() => {
                                  setSelectedUserForEdit(u);
                                  setEditFormData(u);
                                }}
                                title="Edit User Details"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => setSelectedUserForPasswordReset(u)}
                                title="Reset User Password"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition cursor-pointer"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              {/* Suspend / Ban / Reactivate Dropdown */}
                              {!u.isSuperAdmin && (
                                <>
                                  {u.status === "banned" || u.status === "suspended" ? (
                                    <button
                                      onClick={() => handleSetUserStatus(u.id, "active")}
                                      title="Reactivate Account"
                                      className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleSetUserStatus(u.id, "suspended")}
                                      title="Suspend Account"
                                      className="p-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 transition cursor-pointer"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Delete User */}
                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    title="Permanently Delete User"
                                    className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: BLUE TICK VERIFICATION DESK (Celebrities, Businessman, Entrepreneurs, Public Figures) */}
          {activeTab === "verification" && (
            <div className="space-y-5 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>Blue Tick Document Authentication & Approval Desk</span>
                      <span className="w-5 h-5 rounded-full bg-[#003893] text-white text-[11px] font-bold inline-flex items-center justify-center">✓</span>
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Review legal identification documents submitted by Nepali Celebrities, Businessmen, Entrepreneurs, and Public Figures for official Blue Tick badge issuance.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                  <button
                    onClick={() => setVerificationFilter("all")}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                      verificationFilter === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All ({verificationRequests.length})
                  </button>
                  <button
                    onClick={() => setVerificationFilter("pending")}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition flex items-center gap-1.5 ${
                      verificationFilter === "pending" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>Pending Review</span>
                    {pendingVerificationsCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full font-bold">
                        {pendingVerificationsCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setVerificationFilter("approved")}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                      verificationFilter === "approved" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Approved Blue Ticks
                  </button>
                  <button
                    onClick={() => setVerificationFilter("rejected")}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                      verificationFilter === "rejected" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Rejected
                  </button>
                </div>
              </div>

              {/* Verification Info Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-800/40 text-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-white block text-sm">Nepal Social Media Regulatory Compliance</strong>
                    <span className="text-slate-300">
                      As per Nepal Government Ministry of Communication & Information Technology norms, all verified accounts must have authenticated Citizenship, Passport, or PAN documentation on record.
                    </span>
                  </div>
                </div>
                <span className="hidden md:inline-flex px-3 py-1.5 rounded-xl bg-slate-900/90 text-blue-300 border border-blue-700/50 text-[11px] font-mono shrink-0">
                  Super Admin Root Gateway
                </span>
              </div>

              {/* Requests Cards Grid */}
              {filteredVerificationRequests.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
                  <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="font-bold text-white text-base">No Verification Requests Found</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {verificationFilter === "pending"
                      ? "There are currently no pending Blue Tick applications."
                      : "No verification requests match the selected filter."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredVerificationRequests.map((req) => {
                    const applicantUser = usersList.find((u) => u.id === req.userId);
                    return (
                      <div
                        key={req.id}
                        className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition relative"
                      >
                        {/* Header: User Info & Status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={req.avatar || applicantUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"}
                              alt={req.fullName}
                              className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-white text-sm">{req.fullName}</h3>
                                {req.status === "approved" && (
                                  <span className="w-4 h-4 rounded-full bg-[#003893] text-white text-[10px] font-bold inline-flex items-center justify-center">✓</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400">@{req.username}</div>
                              {req.nepaliName && (
                                <div className="text-xs text-indigo-300 font-nepali">{req.nepaliName}</div>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                req.status === "approved"
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                  : req.status === "rejected"
                                  ? "bg-rose-950 text-rose-300 border border-rose-800"
                                  : "bg-blue-950 text-blue-300 border border-blue-800 animate-pulse"
                              }`}
                            >
                              {req.status === "approved" && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {req.status === "rejected" && <XCircle className="w-3.5 h-3.5" />}
                              {req.status === "pending" && <Clock className="w-3.5 h-3.5" />}
                              <span className="capitalize">{req.status === "pending" ? "Pending Audit" : req.status}</span>
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono mt-1">
                              {new Date(req.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>

                        {/* Category & Badge Meta */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Verification Category</span>
                            <span className="font-bold text-cyan-300 capitalize flex items-center gap-1 mt-0.5">
                              {req.category === "celebrity" && "🌟 Celebrity"}
                              {req.category === "businessman" && "🏢 Businessman"}
                              {req.category === "entrepreneur" && "💼 Entrepreneur"}
                              {req.category === "public_figure" && "🎙️ Public Figure"}
                              {req.category === "creator" && "📸 Verified Creator"}
                              {req.category === "organization" && "🏛️ Organization"}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Badge Display Title</span>
                            <span className="font-bold text-indigo-300 truncate block mt-0.5">
                              {req.badgeTitle || "Verified Profile"}
                            </span>
                          </div>
                        </div>

                        {/* Document & Proof Section */}
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-emerald-400" />
                              <span className="text-slate-300 font-medium capitalize">
                                {req.documentType?.replace("_", " ") || "Government ID"}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedVerificationForReview(req);
                                setCustomBadgeTitleInput(req.badgeTitle || "");
                                setRejectionReasonInput("");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-950 hover:bg-blue-900 text-blue-200 text-xs font-semibold border border-blue-700/60 transition cursor-pointer"
                            >
                              Inspect Document →
                            </button>
                          </div>

                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            File: {req.documentName || "Identity_Authentication_Document.pdf"}
                          </div>

                          {req.documentUrl && (
                            <div
                              onClick={() => {
                                setSelectedVerificationForReview(req);
                                setCustomBadgeTitleInput(req.badgeTitle || "");
                                setRejectionReasonInput("");
                              }}
                              className="relative h-24 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer group"
                            >
                              <img
                                src={req.documentUrl}
                                alt="Document Thumbnail"
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <span className="text-xs text-white font-bold bg-black/70 px-2.5 py-1 rounded-lg">
                                  🔍 Click to Inspect Full Document
                                </span>
                              </div>
                            </div>
                          )}

                          {req.referenceLink && (
                            <div className="text-xs pt-1 flex items-center gap-1.5 text-blue-400">
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              <a
                                href={req.referenceLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline truncate"
                              >
                                {req.referenceLink}
                              </a>
                            </div>
                          )}

                          {req.reason && (
                            <p className="text-xs text-slate-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800 italic">
                              "{req.reason}"
                            </p>
                          )}
                        </div>

                        {/* Rejection Note if already rejected */}
                        {req.status === "rejected" && req.rejectionReason && (
                          <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/40 text-xs text-rose-300">
                            <strong>Rejection Note:</strong> {req.rejectionReason}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                          {req.status === "pending" ? (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedVerificationForReview(req);
                                  setCustomBadgeTitleInput(req.badgeTitle || "");
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                              >
                                Full Audit
                              </button>
                              <button
                                onClick={() => handleApproveVerification(req)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve & Grant Blue Tick</span>
                              </button>
                            </>
                          ) : req.status === "approved" ? (
                            <button
                              onClick={() => {
                                const user = usersList.find((u) => u.id === req.userId);
                                if (user) handleToggleVerification(user);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs font-semibold border border-rose-800 transition cursor-pointer"
                            >
                              Revoke Blue Tick
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApproveVerification(req)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
                            >
                              Re-evaluate & Approve
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BUSINESS VERIFICATION DESK */}
          {activeTab === "business" && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Nepali Business & Organization Verification Desk</h2>
                  <p className="text-xs text-slate-400">
                    Review PAN documents, company registration numbers, and tourism licences submitted during business onboarding.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businessUsers.map((biz) => (
                  <div
                    key={biz.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 relative"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={biz.avatar}
                          alt={biz.fullName}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <h3 className="font-bold text-white text-sm">{biz.businessName || biz.fullName}</h3>
                          <div className="text-xs text-slate-400">@{biz.username}</div>
                          <div className="text-xs text-indigo-400 font-mono mt-0.5">{biz.email}</div>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          biz.isBusinessVerified
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : "bg-amber-950 text-amber-300 border border-amber-800"
                        }`}
                      >
                        {biz.isBusinessVerified ? "Verified Organisation" : "Pending Document Audit"}
                      </span>
                    </div>

                    {/* PAN, Registration & Location Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block text-[10px]">PAN NUMBER</span>
                        <strong className="text-amber-300">{biz.panNumber || "N/A"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">COMPANY REG NO.</span>
                        <strong className="text-slate-200">{biz.registrationNumber || "N/A"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">DISTRICT (जिल्ला)</span>
                        <strong className="text-cyan-300">{biz.district || "Kathmandu"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">CITY / MUNICIPALITY</span>
                        <strong className="text-slate-200">{biz.city || "Kathmandu Metro"}</strong>
                      </div>
                    </div>

                    {/* Uploaded Certificate / Document */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                      <div className="flex items-center gap-2 overflow-hidden text-xs">
                        <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-slate-300 truncate font-mono text-[11px]">
                          {biz.documentName || "Company_Registration_Document.pdf"}
                        </span>
                      </div>
                      <button
                        onClick={() => setPreviewingDocUser(biz)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 shrink-0 transition"
                      >
                        Inspect Document
                      </button>
                    </div>

                    {/* Verification Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleOpenBlueTickModal(biz)}
                        className="px-3 py-1.5 rounded-xl bg-blue-950/90 hover:bg-blue-900 text-blue-300 border border-blue-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-[#003893] text-white inline-flex items-center justify-center text-[9px] font-bold">✓</span>
                        <span>Manage Blue Tick</span>
                      </button>
                      <button
                        onClick={() => handleToggleVerification(biz)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          biz.isBusinessVerified
                            ? "bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950"
                        }`}
                      >
                        {biz.isBusinessVerified ? "Revoke Verification" : "Quick Approve"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CONTENT MODERATION */}
          {activeTab === "posts" && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">Content & Post Moderation Center</h2>
                  <p className="text-xs text-slate-400">
                    Monitor, pin, or delete content across all 77 districts of Nepal.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={postSearchQuery}
                      onChange={(e) => setPostSearchQuery(e.target.value)}
                      placeholder="Search captions, creators, locations..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setActiveTab("create_post")}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-crimson-600 hover:from-indigo-500 hover:to-crimson-500 text-white text-xs font-bold shadow-md shadow-indigo-950 flex items-center gap-1.5 shrink-0 transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>+ Add Post</span>
                  </button>
                </div>
              </div>

              {/* Posts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPosts.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      {/* Author Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={p.userAvatar}
                            alt={p.userFullName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="text-xs font-bold text-white">{p.userFullName}</div>
                            <div className="text-[10px] text-slate-400">@{p.username}</div>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-slate-300 uppercase">
                          {p.category}
                        </span>
                      </div>

                      {/* Post Thumbnail */}
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                        <img src={p.imageUrl} alt={p.caption} className="w-full h-full object-cover" />
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] text-white flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-crimson-400" />
                          <span>{p.location}</span>
                        </div>
                      </div>

                      {/* Captions */}
                      <div className="mt-2.5 space-y-1">
                        <p className="text-xs text-slate-200 line-clamp-2">{p.caption}</p>
                        {p.nepaliCaption && (
                          <p className="text-xs text-indigo-300 font-nepali line-clamp-1">{p.nepaliCaption}</p>
                        )}
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div className="text-slate-400 text-[11px]">
                        ❤️ {p.likes.length} likes • 💬 {p.comments.length} comments
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleFeaturePost(p)}
                          title={(p as any).isFeatured ? "Unpin Post" : "Pin/Feature Post"}
                          className={`p-1.5 rounded-lg border transition ${
                            (p as any).isFeatured
                              ? "bg-amber-950 text-amber-300 border-amber-700"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeletePost(p)}
                          title="Delete Post"
                          className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === "logs" && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">Live System Audit & Security Logs</h2>
                  <p className="text-xs text-slate-400">
                    Comprehensive chronological ledger of user registrations, logins, posts, and super admin events.
                  </p>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                  {["all", "AUTH", "USER", "POST", "BUSINESS", "MODERATION", "SYSTEM"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setLogCategoryFilter(cat)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                        logCategoryFilter === cat ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {cat.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logs Stream */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                <div className="divide-y divide-slate-800/80">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 hover:bg-slate-800/40 transition flex items-start justify-between gap-4 text-xs font-mono"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.severity === "danger"
                                ? "bg-rose-950 text-rose-300 border border-rose-800"
                                : log.severity === "warning"
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : log.severity === "success"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                : "bg-indigo-950 text-indigo-300 border border-indigo-800"
                            }`}
                          >
                            {log.category}
                          </span>
                          <span className="font-bold text-white">{log.action}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-300">By: {log.actor}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] font-sans">{log.details}</p>
                      </div>

                      <div className="text-right text-[11px] text-slate-500 shrink-0">
                        <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                        <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: BROADCAST */}
          {activeTab === "broadcast" && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h2 className="text-xl font-bold text-white">Live System Announcement & Alert Dispatcher</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Publish persistent, real-time broadcasts to all connected Nepali creators and registered businesses over WebSocket.
                </p>
              </div>

              <form onSubmit={handleSendBroadcast} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Announcement Headline
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Welcome to Photo Bucket Nepal / Weather Advisory for Mustang"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Broadcast Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setBroadcastType("info")}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition ${
                        broadcastType === "info"
                          ? "bg-indigo-950 text-indigo-200 border-indigo-600"
                          : "bg-slate-950 text-slate-400 border-slate-800"
                      }`}
                    >
                      ℹ️ General Info
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastType("warning")}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition ${
                        broadcastType === "warning"
                          ? "bg-amber-950 text-amber-200 border-amber-600"
                          : "bg-slate-950 text-slate-400 border-slate-800"
                      }`}
                    >
                      ⚠️ Important Warning
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastType("alert")}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition ${
                        broadcastType === "alert"
                          ? "bg-rose-950 text-rose-200 border-rose-600"
                          : "bg-slate-950 text-slate-400 border-slate-800"
                      }`}
                    >
                      🚨 Critical Alert
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Message Body (English / नेपाली)
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Type the message content that will immediately flash on all active users' screens..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isBroadcasting}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-crimson-600 hover:from-indigo-500 hover:to-crimson-500 text-white font-semibold text-sm shadow-xl shadow-indigo-950 flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isBroadcasting ? "Transmitting..." : "Dispatch Broadcast to All Clients"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 7: SUB-ADMIN DELEGATION & TASK TRACKING */}
          {activeTab === "delegated_admins" && (
            <DelegatedAdminManagement />
          )}

          {/* TAB: SCROLLING ADS & TICKER MANAGER (UPLOADED BY SUPERADMIN) */}
          {activeTab === "scrolling_ads" && (
            <SuperAdminAdsManager currentUser={currentUser} />
          )}
        </main>
      </div>

      {/* MODAL 1: EDIT USER PROFILE */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                Edit User: @{selectedUserForEdit.username}
              </h3>
              <button
                onClick={() => setSelectedUserForEdit(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFormData.fullName || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={editFormData.email || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Mobile Number (98...)</label>
                  <input
                    type="text"
                    value={editFormData.mobileNumber || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, mobileNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    value={editFormData.district || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Custom Badge Title</label>
                  <input
                    type="text"
                    value={editFormData.badge || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, badge: e.target.value })}
                    placeholder="e.g. Pro Photographer, Top Explorer"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Bio</label>
                <textarea
                  rows={2}
                  value={editFormData.bio || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUserForEdit(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PASSWORD */}
      {selectedUserForPasswordReset && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                Reset Password
              </h3>
              <button
                onClick={() => setSelectedUserForPasswordReset(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Set a new secure password for <strong className="text-white">@{selectedUserForPasswordReset.username}</strong> ({selectedUserForPasswordReset.email || selectedUserForPasswordReset.mobileNumber}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUserForPasswordReset(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PREVIEW BUSINESS DOCUMENT */}
      {previewingDocUser && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">
                  {previewingDocUser.businessName || previewingDocUser.fullName}
                </h3>
                <p className="text-xs text-slate-400">PAN Certificate / Gov Registration Document</p>
              </div>
              <button
                onClick={() => setPreviewingDocUser(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center min-h-64">
              {previewingDocUser.documentUrl ? (
                <img
                  src={previewingDocUser.documentUrl}
                  alt="PAN Document Preview"
                  className="max-h-80 rounded-lg object-contain border border-slate-800"
                />
              ) : (
                <div className="text-center text-slate-400 space-y-2">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-xs font-mono">{previewingDocUser.documentName || "Document Uploaded"}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>PAN: <span className="text-amber-300 font-bold">{previewingDocUser.panNumber}</span></div>
              <div>Reg: <span className="text-slate-200 font-bold">{previewingDocUser.registrationNumber}</span></div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  handleToggleVerification(previewingDocUser);
                  setPreviewingDocUser(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Approve & Grant Official Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: SUPER ADMIN INDIVIDUAL BLUE TICK MANAGER (Personal or Business) */}
      {selectedUserForBlueTickModal && (
        <div className="fixed inset-0 z-[115] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 text-slate-100 shadow-2xl my-8">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <span>Super Admin Blue Tick Authority</span>
                    <span className="w-5 h-5 rounded-full bg-[#003893] text-white text-[11px] font-bold inline-flex items-center justify-center">
                      ✓
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Grant, customize, or revoke official Blue Tick verification for individual Personal or Business user.
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForBlueTickModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Identity Snapshot Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3.5">
              <img
                src={selectedUserForBlueTickModal.avatar}
                alt={selectedUserForBlueTickModal.fullName}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-base truncate">
                    {selectedUserForBlueTickModal.businessName || selectedUserForBlueTickModal.fullName}
                  </h4>
                  {selectedUserForBlueTickModal.isVerified && (
                    <VerifiedBadge
                      category={selectedUserForBlueTickModal.verificationCategory}
                      badgeTitle={selectedUserForBlueTickModal.verifiedBadgeTitle}
                      size="sm"
                    />
                  )}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>@{selectedUserForBlueTickModal.username}</span>
                  {selectedUserForBlueTickModal.nepaliName && (
                    <span className="text-indigo-300 font-nepali">({selectedUserForBlueTickModal.nepaliName})</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    selectedUserForBlueTickModal.accountType === "business"
                      ? "bg-purple-950 text-purple-300 border border-purple-800"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}>
                    {selectedUserForBlueTickModal.accountType === "business" ? "🏢 Business Entity" : "👤 Personal Profile"}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {selectedUserForBlueTickModal.district || selectedUserForBlueTickModal.location || "Nepal"}
                  </span>
                </div>
              </div>
            </div>

            {/* Blue Tick Enable / Disable Master Switch */}
            <div
              onClick={() => setBlueTickForm((prev) => ({ ...prev, isVerified: !prev.isVerified }))}
              className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-4 ${
                blueTickForm.isVerified
                  ? "bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border-blue-600/70 shadow-lg shadow-blue-950/50"
                  : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base transition ${
                  blueTickForm.isVerified
                    ? "bg-[#003893] text-white shadow-md shadow-blue-900"
                    : "bg-slate-800 text-slate-500"
                }`}>
                  ✓
                </div>
                <div>
                  <strong className="text-white text-sm block">
                    {blueTickForm.isVerified ? "Blue Tick Verification Active" : "Blue Tick Verification Disabled"}
                  </strong>
                  <span className="text-xs text-slate-400">
                    {blueTickForm.isVerified
                      ? "User profile displays authentic Nepal verified badge on all posts & comments"
                      : "Profile displays standard unverified indicator"}
                  </span>
                </div>
              </div>

              <div className={`w-12 h-6 rounded-full p-1 transition flex items-center shrink-0 ${
                blueTickForm.isVerified ? "bg-blue-600 justify-end" : "bg-slate-800 justify-start"
              }`}>
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>

            {/* Category Selection (Only when verified or customizing) */}
            {blueTickForm.isVerified && (
              <div className="space-y-4 pt-1 animate-fadeIn">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    Official Verification Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: "celebrity", label: "Celebrity / Artist", neLabel: "सेलिब्रेटी / कलाकार", icon: "🌟" },
                      { id: "businessman", label: "Businessman / Industrialist", neLabel: "व्यवसायी / उद्योगपति", icon: "🏢" },
                      { id: "entrepreneur", label: "Entrepreneur / Founder", neLabel: "उद्यमी / संस्थापक", icon: "💼" },
                      { id: "public_figure", label: "Public Figure / Leader", neLabel: "सार्वजनिक व्यक्तित्व", icon: "🎙️" },
                      { id: "creator", label: "Verified Creator", neLabel: "प्रमाणीकृत सर्जक", icon: "📸" },
                      { id: "organization", label: "Organization / Enterprise", neLabel: "संस्था / प्रतिष्ठान", icon: "🏛️" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          const defaultTitle =
                            cat.id === "celebrity" ? "Verified Celebrity" :
                            cat.id === "businessman" ? "Verified Businessman" :
                            cat.id === "entrepreneur" ? "Verified Entrepreneur" :
                            cat.id === "public_figure" ? "Verified Public Figure" :
                            cat.id === "organization" ? "Verified Business Org" : "Verified Creator";

                          setBlueTickForm((prev) => ({
                            ...prev,
                            category: cat.id as any,
                            badgeTitle: defaultTitle,
                          }));
                        }}
                        className={`p-3 rounded-2xl text-left border transition flex flex-col justify-between ${
                          blueTickForm.category === cat.id
                            ? "bg-blue-950/80 text-blue-200 border-blue-500 shadow-md"
                            : "bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="text-xl mb-1">{cat.icon}</div>
                        <div>
                          <div className="text-xs font-bold text-white leading-tight">{cat.label}</div>
                          <div className="text-[10px] text-slate-400 font-nepali mt-0.5">{cat.neLabel}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Badge Display Title Input & Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    Custom Badge Title (Displayed in tooltip & profile)
                  </label>
                  <input
                    type="text"
                    value={blueTickForm.badgeTitle}
                    onChange={(e) => setBlueTickForm((prev) => ({ ...prev, badgeTitle: e.target.value }))}
                    placeholder="e.g. Verified Nepali Celebrity, Tech Entrepreneur, Industrialist"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
                  />

                  {/* Preset Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    {[
                      "Verified Celebrity",
                      "Verified Businessman",
                      "Verified Entrepreneur",
                      "Tech Entrepreneur",
                      "Verified Public Figure",
                      "Verified Creator",
                      "Verified Business Org",
                      "Heritage Documentarian",
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBlueTickForm((prev) => ({ ...prev, badgeTitle: preset }))}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document Submissions Status */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Authentication Evidence:</span>
                    {selectedUserForBlueTickModal.documentUrl || selectedUserForBlueTickModal.documentName ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Document On File</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Super Admin Executive Authority</span>
                      </span>
                    )}
                  </div>
                  {selectedUserForBlueTickModal.documentName && (
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      File: {selectedUserForBlueTickModal.documentName}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedUserForBlueTickModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {selectedUserForBlueTickModal.isVerified && (
                  <button
                    type="button"
                    onClick={() => {
                      setBlueTickForm((prev) => ({ ...prev, isVerified: false }));
                      handleSaveUserBlueTick();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs font-semibold border border-rose-800 transition cursor-pointer"
                  >
                    Revoke Blue Tick
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveUserBlueTick}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-950 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Blue Tick Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: VERIFICATION REQUEST AUDIT & APPROVAL DESK */}
      {selectedVerificationForReview && (
        <div className="fixed inset-0 z-[115] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 text-slate-100 shadow-2xl my-8">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={selectedVerificationForReview.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"}
                  alt={selectedVerificationForReview.fullName}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-white">
                      {selectedVerificationForReview.fullName}
                    </h3>
                    <span className="w-4 h-4 rounded-full bg-[#003893] text-white text-[10px] font-bold inline-flex items-center justify-center">
                      ✓
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    @{selectedVerificationForReview.username} • Submitted on {new Date(selectedVerificationForReview.submittedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedVerificationForReview(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Preview Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Submitted Document: {selectedVerificationForReview.documentType?.replace("_", " ")}</span>
                </span>
                {selectedVerificationForReview.documentUrl && (
                  <a
                    href={selectedVerificationForReview.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    <span>Open High-Res</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {selectedVerificationForReview.documentUrl ? (
                <div className="relative max-h-72 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center">
                  <img
                    src={selectedVerificationForReview.documentUrl}
                    alt="Document Inspection"
                    className="max-h-72 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 text-center text-slate-400 text-xs">
                  Document: {selectedVerificationForReview.documentName || "Identity_Document.pdf"}
                </div>
              )}

              {/* Reference Links & Reason */}
              {selectedVerificationForReview.referenceLink && (
                <div className="text-xs pt-1 flex items-center gap-1.5 text-blue-400">
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <a
                    href={selectedVerificationForReview.referenceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline truncate"
                  >
                    {selectedVerificationForReview.referenceLink}
                  </a>
                </div>
              )}

              {selectedVerificationForReview.reason && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 italic">
                  "{selectedVerificationForReview.reason}"
                </div>
              )}
            </div>

            {/* Customize Badge Title Before Approval */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase">
                Confirm Badge Display Title
              </label>
              <input
                type="text"
                value={customBadgeTitleInput}
                onChange={(e) => setCustomBadgeTitleInput(e.target.value)}
                placeholder="e.g. Verified Nepali Celebrity, Tech Entrepreneur"
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {/* Rejection Section if declining */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase">
                Rejection Reason (Optional feedback if declining)
              </label>
              <input
                type="text"
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Unclear citizenship photo / Official business registration required"
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
              />
            </div>

            {/* Approval & Rejection Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedVerificationForReview(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRejectVerification(selectedVerificationForReview)}
                  className="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs font-semibold border border-rose-800 transition cursor-pointer"
                >
                  Reject Application
                </button>

                <button
                  type="button"
                  onClick={() => handleApproveVerification(selectedVerificationForReview)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Grant Blue Tick</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
