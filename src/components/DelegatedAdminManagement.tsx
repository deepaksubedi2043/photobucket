import React, { useState, useEffect } from "react";
import {
  DelegatedAdminUser,
  AdminPermissions,
  AdminTaskLog,
} from "../types";
import { api, realtime } from "../services/api";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Lock,
  Mail,
  KeyRound,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Briefcase,
  Layers,
  Award,
  Building2,
  Camera,
  Radio,
  FileText,
  Activity,
  Trash2,
  Edit3,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
  Sliders,
} from "lucide-react";

interface DelegatedAdminManagementProps {
  onNotify?: (text: string, type?: "success" | "error") => void;
}

export const DelegatedAdminManagement: React.FC<DelegatedAdminManagementProps> = ({
  onNotify,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"admins" | "tasks">("admins");
  const [admins, setAdmins] = useState<DelegatedAdminUser[]>([]);
  const [taskLogs, setTaskLogs] = useState<AdminTaskLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Filters
  const [adminSearch, setAdminSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [taskAdminFilter, setTaskAdminFilter] = useState<string>("all");
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>("all");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAdminForPermissions, setSelectedAdminForPermissions] = useState<DelegatedAdminUser | null>(null);
  const [selectedAdminForReset, setSelectedAdminForReset] = useState<DelegatedAdminUser | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Create Form State
  const [createForm, setCreateForm] = useState({
    fullName: "",
    nepaliFullName: "",
    username: "",
    officialEmail: "",
    password: "",
    designation: "Content Moderation Lead",
    department: "Trust & Safety Operations",
    mobileNumber: "",
    permissions: {
      canManageUsers: false,
      canVerifyUsers: true,
      canManageBusinesses: false,
      canModeratePosts: true,
      canCreatePosts: false,
      canDispatchBroadcasts: false,
      canViewAuditLogs: true,
      canViewOverviewStats: true,
    } as AdminPermissions,
  });

  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");

  const notify = (text: string, type: "success" | "error" = "success") => {
    if (onNotify) onNotify(text, type);
  };

  // Organizational Email Validation Helper
  const isOrgEmail = (email: string) => {
    if (!email || !email.includes("@")) return false;
    const domain = email.split("@")[1]?.toLowerCase().trim();
    const banned = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "icloud.com",
      "mail.com",
      "aol.com",
      "proton.me",
      "protonmail.com",
      "zoho.com",
      "yandex.com",
    ];
    return domain && !banned.includes(domain);
  };

  // Fetch Admins
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await api.getDelegatedAdmins();
      if (res.delegatedAdmins) {
        setAdmins(res.delegatedAdmins);
      }
    } catch (err: any) {
      console.error("Error fetching delegated admins:", err);
      notify(err.message || "Failed to load sub-admins list", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Tasks
  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await api.getAdminTaskLogs({
        adminId: taskAdminFilter,
        category: taskCategoryFilter,
        search: taskSearchQuery,
      });
      if (res.tasks) {
        setTaskLogs(res.tasks);
      }
    } catch (err: any) {
      console.error("Error fetching admin tasks:", err);
      notify(err.message || "Failed to load admin tasks", "error");
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchTasks();

    const unsubCreated = realtime.subscribe("admin:delegated_created", (newAdmin: DelegatedAdminUser) => {
      setAdmins((prev) => [newAdmin, ...prev.filter((a) => a.id !== newAdmin.id)]);
    });

    const unsubUpdated = realtime.subscribe("admin:delegated_updated", (updAdmin: DelegatedAdminUser) => {
      setAdmins((prev) => prev.map((a) => (a.id === updAdmin.id ? { ...a, ...updAdmin } : a)));
    });

    const unsubDeleted = realtime.subscribe("admin:delegated_deleted", ({ id }: { id: string }) => {
      setAdmins((prev) => prev.filter((a) => a.id !== id));
    });

    const unsubTask = realtime.subscribe("admin:task_logged", (newTask: AdminTaskLog) => {
      setTaskLogs((prev) => [newTask, ...prev.filter((t) => t.id !== newTask.id)]);
      setAdmins((prev) =>
        prev.map((a) =>
          a.id === newTask.adminId
            ? { ...a, tasksCompletedCount: (a.tasksCompletedCount || 0) + 1 }
            : a
        )
      );
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
      unsubTask();
    };
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [taskAdminFilter, taskCategoryFilter, taskSearchQuery]);

  // Generate random strong password
  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "Admin@";
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm((prev) => ({ ...prev, password: pwd }));
  };

  // Create Sub-Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createForm.fullName.trim()) {
      setCreateError("Full name is required.");
      return;
    }

    if (!createForm.officialEmail.trim()) {
      setCreateError("Official organizational email is required.");
      return;
    }

    if (!isOrgEmail(createForm.officialEmail)) {
      setCreateError(
        "Invalid email domain. Administrative accounts strictly require an official organizational email (e.g. name@photobucket.com.np). Public domains like @gmail.com or @yahoo.com are forbidden."
      );
      return;
    }

    if (!createForm.password || createForm.password.length < 6) {
      setCreateError("Initial password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createDelegatedAdmin({
        fullName: createForm.fullName.trim(),
        nepaliFullName: createForm.nepaliFullName.trim() || undefined,
        officialEmail: createForm.officialEmail.trim().toLowerCase(),
        password: createForm.password,
        designation: createForm.designation.trim(),
        department: createForm.department.trim(),
        mobileNumber: createForm.mobileNumber.trim() || undefined,
        permissions: createForm.permissions,
      });

      notify(res.message || "Sub-Admin created successfully!", "success");
      setIsCreateModalOpen(false);
      setCreateForm({
        fullName: "",
        nepaliFullName: "",
        username: "",
        officialEmail: "",
        password: "",
        designation: "Content Moderation Lead",
        department: "Trust & Safety Operations",
        mobileNumber: "",
        permissions: {
          canManageUsers: false,
          canVerifyUsers: true,
          canManageBusinesses: false,
          canModeratePosts: true,
          canCreatePosts: false,
          canDispatchBroadcasts: false,
          canViewAuditLogs: true,
          canViewOverviewStats: true,
        },
      });
      fetchAdmins();
      fetchTasks();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create administrator");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Permissions
  const handleSavePermissions = async () => {
    if (!selectedAdminForPermissions) return;

    try {
      const res = await api.updateAdminPermissions(
        selectedAdminForPermissions.id,
        selectedAdminForPermissions.permissions
      );
      setAdmins((prev) =>
        prev.map((a) => (a.id === selectedAdminForPermissions.id ? res.admin : a))
      );
      notify(`Feature access limits updated for ${selectedAdminForPermissions.fullName}`, "success");
      setSelectedAdminForPermissions(null);
      fetchTasks();
    } catch (err: any) {
      notify(err.message || "Failed to update permissions", "error");
    }
  };

  // Toggle Status
  const handleToggleStatus = async (admin: DelegatedAdminUser) => {
    const newStatus = admin.status === "active" ? "suspended" : "active";
    try {
      const res = await api.setAdminStatus(admin.id, newStatus);
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? res.admin : a)));
      notify(`Admin ${admin.fullName} has been ${newStatus.toUpperCase()}`, "success");
      fetchTasks();
    } catch (err: any) {
      notify(err.message || "Failed to update status", "error");
    }
  };

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminForReset || !newPasswordInput || newPasswordInput.length < 6) {
      notify("Password must be at least 6 characters.", "error");
      return;
    }

    try {
      const res = await api.resetDelegatedAdminPassword(selectedAdminForReset.id, newPasswordInput);
      notify(res.message || "Admin password reset successfully!", "success");
      setSelectedAdminForReset(null);
      setNewPasswordInput("");
      fetchAdmins();
      fetchTasks();
    } catch (err: any) {
      notify(err.message || "Password reset failed", "error");
    }
  };

  // Delete Admin
  const handleDeleteAdmin = async (admin: DelegatedAdminUser) => {
    if (!window.confirm(`Are you sure you want to permanently revoke and delete administrator ${admin.fullName} (${admin.officialEmail})?`)) {
      return;
    }

    try {
      const res = await api.deleteDelegatedAdmin(admin.id);
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      notify(res.message || "Administrator removed.", "success");
      fetchTasks();
    } catch (err: any) {
      notify(err.message || "Failed to delete administrator", "error");
    }
  };

  // Filtered Admins List
  const filteredAdmins = admins.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (adminSearch.trim()) {
      const q = adminSearch.toLowerCase();
      return (
        a.fullName.toLowerCase().includes(q) ||
        (a.nepaliFullName && a.nepaliFullName.includes(q)) ||
        a.officialEmail.toLowerCase().includes(q) ||
        a.designation.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalTasksCount = taskLogs.length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Highlights */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Super Admin Delegation Hub
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                Domain Restrict: @photobucket.com.np
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Sub-Admin Management & Action Task Tracking
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Super Admin Deepak Subedi can create delegated administrators with strictly scoped feature limits.
              Sub-Admins can <strong>only log in through organizational official email</strong> and passwords provisioned by Super Admin, and every action they execute is tracked live below.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              id="refresh-admin-data-btn"
              onClick={() => {
                fetchAdmins();
                fetchTasks();
              }}
              disabled={loading || loadingTasks}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading || loadingTasks ? "animate-spin text-indigo-400" : ""}`} />
              Refresh
            </button>
            <button
              id="open-create-admin-modal-btn"
              onClick={() => {
                handleGeneratePassword();
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-crimson-600 hover:from-indigo-500 hover:to-crimson-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/80 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Create Sub-Admin
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Total Sub-Admins</div>
              <div className="text-lg font-extrabold text-white">{admins.length}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Active Status</div>
              <div className="text-lg font-extrabold text-emerald-400">
                {admins.filter((a) => a.status === "active").length}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Suspended</div>
              <div className="text-lg font-extrabold text-rose-400">
                {admins.filter((a) => a.status === "suspended").length}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Tasks Executed</div>
              <div className="text-lg font-extrabold text-amber-400">{totalTasksCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation: Admins Roster vs Tasks Done by Admin */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex gap-2">
          <button
            id="tab-admins-roster-btn"
            onClick={() => setActiveSubTab("admins")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === "admins"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sub-Admins Roster ({admins.length})</span>
          </button>

          <button
            id="tab-admin-tasks-tracker-btn"
            onClick={() => setActiveSubTab("tasks")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === "tasks"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Track Tasks Done by Admin ({taskLogs.length})</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          {activeSubTab === "admins" ? (
            <span>Manage administrative authority and permission boundaries</span>
          ) : (
            <span>Real-time auditable record of moderation & operational actions</span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-ADMINS ROSTER TAB                                                  */}
      {/* ========================================================================= */}
      {activeSubTab === "admins" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                id="search-sub-admins-input"
                placeholder="Search by name, email or role..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <div className="grid grid-cols-3 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    statusFilter === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    statusFilter === "active" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter("suspended")}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    statusFilter === "suspended" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Suspended
                </button>
              </div>
            </div>
          </div>

          {/* Admins Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAdmins.map((admin) => {
              const perms = admin.permissions;
              const isPasswordRevealed = showPasswordMap[admin.id] || false;

              return (
                <div
                  key={admin.id}
                  className={`rounded-2xl border bg-slate-900/90 p-5 transition hover:border-slate-700 space-y-4 relative ${
                    admin.status === "suspended"
                      ? "border-rose-900/40 bg-rose-950/10"
                      : "border-slate-800"
                  }`}
                >
                  {/* Top: Avatar & Identification */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={admin.avatar}
                          alt={admin.fullName}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                        />
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                            admin.status === "active" ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-white">{admin.fullName}</h3>
                          {admin.nepaliFullName && (
                            <span className="text-xs text-slate-400">({admin.nepaliFullName})</span>
                          )}
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              admin.status === "active"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            }`}
                          >
                            {admin.status}
                          </span>
                        </div>
                        <div className="text-xs text-indigo-300 font-medium flex items-center gap-1.5 mt-0.5">
                          <Briefcase className="w-3 h-3" />
                          <span>{admin.designation}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">{admin.department}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tasks Count Badge */}
                    <div className="text-right shrink-0">
                      <div className="px-2.5 py-1 rounded-xl bg-indigo-950/70 border border-indigo-800/50 text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-amber-400" />
                        <span>{admin.tasksCompletedCount || 0} Tasks</span>
                      </div>
                    </div>
                  </div>

                  {/* Official Organizational Email & Password Box */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        Official Email:
                      </span>
                      <span className="font-mono text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/60 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        {admin.officialEmail}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/60">
                      <span className="flex items-center gap-1.5 font-medium text-slate-300">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        Provisioned Password:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {isPasswordRevealed
                            ? admin.storedPasswordHint || "Admin@Pb2026"
                            : "••••••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswordMap((prev) => ({
                              ...prev,
                              [admin.id]: !prev[admin.id],
                            }))
                          }
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                          title="Toggle password view"
                        >
                          {isPasswordRevealed ? (
                            <EyeOff className="w-3.5 h-3.5 text-slate-300" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Permissions Chips (Limiting feature access display) */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-indigo-400" />
                        Authorized Feature Boundaries:
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {
                          Object.values(perms || {}).filter(Boolean).length
                        } / 8 Allowed
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {perms?.canVerifyUsers && (
                        <span className="px-2 py-0.5 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-800/60 text-[10px] font-medium flex items-center gap-1">
                          <Award className="w-3 h-3 text-blue-400" />
                          Blue Tick Verify
                        </span>
                      )}
                      {perms?.canModeratePosts && (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 text-[10px] font-medium flex items-center gap-1">
                          <Layers className="w-3 h-3 text-indigo-400" />
                          Post Moderation
                        </span>
                      )}
                      {perms?.canManageUsers && (
                        <span className="px-2 py-0.5 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-800/60 text-[10px] font-medium flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-purple-400" />
                          User Profiles
                        </span>
                      )}
                      {perms?.canManageBusinesses && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-[10px] font-medium flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-emerald-400" />
                          Business KYC
                        </span>
                      )}
                      {perms?.canCreatePosts && (
                        <span className="px-2 py-0.5 rounded-lg bg-crimson-950/80 text-crimson-300 border border-crimson-800/60 text-[10px] font-medium flex items-center gap-1">
                          <Camera className="w-3 h-3 text-crimson-400" />
                          Create Post
                        </span>
                      )}
                      {perms?.canDispatchBroadcasts && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800/60 text-[10px] font-medium flex items-center gap-1">
                          <Radio className="w-3 h-3 text-amber-400" />
                          Broadcast
                        </span>
                      )}
                      {perms?.canViewAuditLogs && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-medium flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          Audit Logs
                        </span>
                      )}
                      {perms?.canViewOverviewStats && (
                        <span className="px-2 py-0.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 text-[10px] font-medium flex items-center gap-1">
                          <Activity className="w-3 h-3 text-cyan-400" />
                          Overview
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedAdminForPermissions(admin)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                        title="Limit or expand feature access"
                      >
                        <Sliders className="w-3 h-3 text-indigo-400" />
                        <span>Permissions</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAdminForReset(admin);
                          setNewPasswordInput("");
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                        title="Reset Sub-Admin Password"
                      >
                        <KeyRound className="w-3 h-3 text-amber-400" />
                        <span>Reset Password</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveSubTab("tasks");
                          setTaskAdminFilter(admin.id);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 text-xs font-semibold border border-indigo-800/50 transition cursor-pointer"
                        title="View tasks executed by this admin"
                      >
                        <Activity className="w-3 h-3 text-indigo-400" />
                        <span>Tasks</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(admin)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          admin.status === "active"
                            ? "bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800/50"
                            : "bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50"
                        }`}
                      >
                        {admin.status === "active" ? (
                          <>
                            <UserX className="w-3 h-3" />
                            <span>Suspend</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3" />
                            <span>Activate</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteAdmin(admin)}
                        className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 transition cursor-pointer"
                        title="Permanently remove Sub-Admin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredAdmins.length === 0 && (
              <div className="col-span-full text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 p-6 space-y-3">
                <ShieldAlert className="w-10 h-10 text-slate-500 mx-auto" />
                <div className="text-sm font-bold text-slate-300">No Sub-Admins Found</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No administrators match the current search or status filters. Click "+ Create Sub-Admin" to provision a new staff member.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create First Sub-Admin
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TRACK TASKS DONE BY ADMIN TAB                                          */}
      {/* ========================================================================= */}
      {activeSubTab === "tasks" && (
        <div className="space-y-4">
          {/* Filter Bar for Tasks */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 items-center">
            {/* Search */}
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                id="search-admin-tasks-input"
                placeholder="Search tasks, actions or targets..."
                value={taskSearchQuery}
                onChange={(e) => setTaskSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter by Admin */}
            <div className="sm:col-span-4 flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium shrink-0">Admin:</span>
              <select
                id="filter-tasks-by-admin-select"
                value={taskAdminFilter}
                onChange={(e) => setTaskAdminFilter(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Administrators</option>
                {admins.map((adm) => (
                  <option key={adm.id} value={adm.id}>
                    {adm.fullName} ({adm.designation})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Category */}
            <div className="sm:col-span-3 flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium shrink-0">Category:</span>
              <select
                id="filter-tasks-by-category-select"
                value={taskCategoryFilter}
                onChange={(e) => setTaskCategoryFilter(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Categories</option>
                <option value="VERIFICATION">Verification Desk</option>
                <option value="POST">Content & Posts</option>
                <option value="BUSINESS">Business & KYC</option>
                <option value="USER">User Management</option>
                <option value="BROADCAST">System Broadcast</option>
                <option value="ADMIN_MGMT">Admin Management</option>
                <option value="SYSTEM">System Access</option>
              </select>
            </div>
          </div>

          {/* Tasks Timeline / Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Live Administrator Action Trail</h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                  {taskLogs.length} events logged
                </span>
              </div>
              <button
                onClick={fetchTasks}
                disabled={loadingTasks}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingTasks ? "animate-spin" : ""}`} />
                <span>Refresh Log</span>
              </button>
            </div>

            <div className="divide-y divide-slate-800/60 max-h-[580px] overflow-y-auto font-sans">
              {taskLogs.map((log) => {
                let badgeClass = "bg-slate-800 text-slate-300 border-slate-700";
                if (log.severity === "danger") badgeClass = "bg-rose-950/80 text-rose-300 border-rose-800/60";
                if (log.severity === "warning") badgeClass = "bg-amber-950/80 text-amber-300 border-amber-800/60";
                if (log.severity === "success") badgeClass = "bg-emerald-950/80 text-emerald-300 border-emerald-800/60";
                if (log.severity === "info") badgeClass = "bg-blue-950/80 text-blue-300 border-blue-800/60";

                const dateStr = new Date(log.timestamp).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });

                const dateFull = new Date(log.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <div
                    key={log.id}
                    className="p-4 hover:bg-slate-850/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    {/* Left: Admin Identifier & Time */}
                    <div className="flex items-start gap-3 sm:max-w-md">
                      <div className="w-8 h-8 rounded-lg bg-indigo-950/70 border border-indigo-800/50 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{log.adminName}</span>
                          <span className="text-[10px] text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-900/60 font-mono">
                            {log.adminEmail}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>
                            {dateFull} at {dateStr} (NPT)
                          </span>
                          {log.designation && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-500">{log.designation}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Center: Details & Target */}
                    <div className="flex-1 sm:px-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${badgeClass}`}>
                          {log.taskType}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">
                          [{log.category}]
                        </span>
                        {log.targetName && (
                          <span className="text-[11px] font-medium text-slate-300">
                            Target: <span className="text-amber-300 font-semibold">{log.targetName}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{log.details}</p>
                    </div>

                    {/* Right: Category tag */}
                    <div className="shrink-0 text-right">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-400">
                        Audit Verified ✓
                      </span>
                    </div>
                  </div>
                );
              })}

              {taskLogs.length === 0 && (
                <div className="text-center py-12 p-6 space-y-2">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto" />
                  <div className="text-sm font-semibold text-slate-300">No Action Logs Found</div>
                  <p className="text-xs text-slate-500">
                    No administrator actions have been recorded under the chosen filters.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE SUB-ADMIN                                                   */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-base text-white">Create New Delegated Sub-Admin</h3>
                    <p className="text-xs text-slate-400">
                      Provision restricted access and assign an official organizational email.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {createError && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-xs text-rose-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{createError}</div>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              {/* Row 1: Name (English & Nepali) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Full Name (English) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Karki"
                    value={createForm.fullName}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Full Name (Nepali - optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. रमेश कार्की"
                    value={createForm.nepaliFullName}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, nepaliFullName: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Row 2: Official Organizational Email */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Official Organizational Email <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@photobucket.com.np"
                    value={createForm.officialEmail}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, officialEmail: e.target.value }))
                    }
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Mandatory organizational domain (e.g., @photobucket.com.np). Public emails (gmail/yahoo) will be rejected.
                  </span>
                  {createForm.officialEmail && (
                    <span
                      className={`text-[10px] font-bold ${
                        isOrgEmail(createForm.officialEmail)
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {isOrgEmail(createForm.officialEmail)
                        ? "✓ Valid Organizational Domain"
                        : "✗ Public Domain Forbidden"}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 3: Super-Admin Provided Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">
                    Super-Admin Provisioned Password <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                  >
                    🎲 Generate Strong Password
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Admin password (min 6 chars)"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>
                <p className="text-[10px] text-amber-300/80 mt-1">
                  🔒 Provide this password to the administrator. They can only log in using this password and their official organizational email.
                </p>
              </div>

              {/* Row 4: Designation & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Content Moderation Officer"
                    value={createForm.designation}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, designation: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Trust & Safety Operations"
                    value={createForm.department}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, department: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Row 5: Mobile Number (Official) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Official Mobile Number (optional)
                </label>
                <input
                  type="tel"
                  placeholder="98XXXXXXXX"
                  value={createForm.mobileNumber}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, mobileNumber: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Permission Boundary Matrix (Limiting feature access provided) */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span>Limiting Feature Access (Permissions)</span>
                  </div>
                  <span className="text-[10px] text-indigo-300 font-medium">
                    Configure authorized tools
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* canVerifyUsers */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.canVerifyUsers}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            canVerifyUsers: e.target.checked,
                          },
                        }))
                      }
                      className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-blue-400" />
                        Blue Tick Verification Desk
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Review submitted KYC & award Verified Badges
                      </div>
                    </div>
                  </label>

                  {/* canModeratePosts */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.canModeratePosts}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            canModeratePosts: e.target.checked,
                          },
                        }))
                      }
                      className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        Content & Post Moderation
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Flag, moderate or remove guideline-violating posts
                      </div>
                    </div>
                  </label>

                  {/* canManageBusinesses */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.canManageBusinesses}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            canManageBusinesses: e.target.checked,
                          },
                        }))
                      }
                      className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                        Business KYC Verification
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Audit PAN certificates & company registrations
                      </div>
                    </div>
                  </label>

                  {/* canManageUsers */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.canManageUsers}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            canManageUsers: e.target.checked,
                          },
                        }))
                      }
                      className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                        User Account Management
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Edit user metadata & manage suspension states
                      </div>
                    </div>
                  </label>

                  {/* canCreatePosts */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.canCreatePosts}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            canCreatePosts: e.target.checked,
                          },
                        }))
                      }
                      className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-crimson-400" />
                        Create Official Posts
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Publish official photos & directives to user walls
                      </div>
                    </div>
                  </label>

                  {/* canDispatchBroadcasts */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.canDispatchBroadcasts}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            canDispatchBroadcasts: e.target.checked,
                          },
                        }))
                      }
                      className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-amber-400" />
                        Live System Broadcasts
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Push urgent notifications to all online users
                      </div>
                    </div>
                  </label>

                  {/* canViewAuditLogs */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.canViewAuditLogs}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            canViewAuditLogs: e.target.checked,
                          },
                        }))
                      }
                      className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        Audit & Security Logs
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Inspect security audit trail & history
                      </div>
                    </div>
                  </label>

                  {/* canViewOverviewStats */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.canViewOverviewStats}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            canViewOverviewStats: e.target.checked,
                          },
                        }))
                      }
                      className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        Command Overview & Analytics
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Access executive dashboards and user ratio charts
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-crimson-600 hover:from-indigo-500 hover:to-crimson-500 text-white font-bold shadow-lg shadow-indigo-950 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Provisioning...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Provision Sub-Admin
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT PERMISSIONS (LIMITING FEATURE ACCESS)                         */}
      {/* ========================================================================= */}
      {selectedAdminForPermissions && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Adjust Feature Access Limits</h3>
                <p className="text-xs text-slate-400">
                  Editing permissions for <span className="text-indigo-300 font-semibold">{selectedAdminForPermissions.fullName}</span> ({selectedAdminForPermissions.officialEmail})
                </p>
              </div>
              <button
                onClick={() => setSelectedAdminForPermissions(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto text-xs">
              {[
                {
                  key: "canVerifyUsers",
                  icon: Award,
                  color: "text-blue-400",
                  title: "Blue Tick Verification Desk",
                  desc: "Review submitted documents & verify authentic public figures",
                },
                {
                  key: "canModeratePosts",
                  icon: Layers,
                  color: "text-indigo-400",
                  title: "Content & Post Moderation",
                  desc: "Review, flag, and remove posts violating community guidelines",
                },
                {
                  key: "canManageUsers",
                  icon: UserCheck,
                  color: "text-purple-400",
                  title: "User Profile Management",
                  desc: "Modify user details, status, and reset passwords",
                },
                {
                  key: "canManageBusinesses",
                  icon: Building2,
                  color: "text-emerald-400",
                  title: "Business Verification Desk",
                  desc: "Review PAN credentials and verify enterprise businesses",
                },
                {
                  key: "canCreatePosts",
                  icon: Camera,
                  color: "text-crimson-400",
                  title: "Create Official Posts",
                  desc: "Author and post platform updates to user feeds",
                },
                {
                  key: "canDispatchBroadcasts",
                  icon: Radio,
                  color: "text-amber-400",
                  title: "Live System Broadcasts",
                  desc: "Push instant emergency announcements to connected clients",
                },
                {
                  key: "canViewAuditLogs",
                  icon: FileText,
                  color: "text-slate-400",
                  title: "Audit & Security Logs",
                  desc: "View live security event logs and system audit trails",
                },
                {
                  key: "canViewOverviewStats",
                  icon: Activity,
                  color: "text-cyan-400",
                  title: "Executive Analytics Overview",
                  desc: "View user activity ratios and geographic charts",
                },
              ].map(({ key, icon: Icon, color, title, desc }) => {
                const isChecked = (selectedAdminForPermissions.permissions as any)[key] || false;

                return (
                  <label
                    key={key}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                      isChecked
                        ? "bg-slate-850 border-indigo-500/50"
                        : "bg-slate-950 border-slate-800 opacity-60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setSelectedAdminForPermissions((prev) =>
                          prev
                            ? {
                                ...prev,
                                permissions: {
                                  ...prev.permissions,
                                  [key]: e.target.checked,
                                },
                              }
                            : null
                        )
                      }
                      className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                        <span>{title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setSelectedAdminForPermissions(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-950 cursor-pointer"
              >
                Save Feature Limits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESET PASSWORD (SUPER-ADMIN PROVISIONED)                           */}
      {/* ========================================================================= */}
      {selectedAdminForReset && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in duration-150 text-xs">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Reset Sub-Admin Password</h3>
                <p className="text-xs text-slate-400">
                  For <span className="text-indigo-300 font-semibold">{selectedAdminForReset.fullName}</span> ({selectedAdminForReset.officialEmail})
                </p>
              </div>
              <button
                onClick={() => setSelectedAdminForReset(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  New Password Provided by Super Admin
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter at least 6 characters"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-slate-400">Minimum 6 characters</span>
                  <button
                    type="button"
                    onClick={() => {
                      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
                      let pwd = "Admin@";
                      for (let i = 0; i < 6; i++) {
                        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
                      }
                      setNewPasswordInput(pwd);
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                  >
                    🎲 Suggest Password
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAdminForReset(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-950 cursor-pointer"
                >
                  Confirm & Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
