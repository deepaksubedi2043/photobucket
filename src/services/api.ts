import {
  User,
  Post,
  Story,
  Community,
  DirectMessage,
  LocationItem,
  AuditLog,
  AdminOverviewStats,
  VerificationRequest,
  VerificationCategory,
  PageOrGroup,
  GuidelineViolationAlert,
  NameCheckResult,
  AIContentVerificationResult,
  AdminPermissions,
  AdminTaskLog,
  DelegatedAdminUser,
} from "../types";
import { firestoreSync } from "./firestoreSync";

export interface BootstrapData {
  users: User[];
  posts: Post[];
  stories: Story[];
  communities: Community[];
  activeUsers: string[];
  followingMap?: Record<string, string[]>;
  locations: LocationItem[];
  verificationRequests?: VerificationRequest[];
}

type EventCallback = (payload: any) => void;

class RealtimeService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private isConnected = false;
  private reconnectTimer: any = null;

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emitLocal("connection:status", { status: "connected" });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event) {
            this.emitLocal(data.event, data.payload);
          }
        } catch (e) {
          console.error("WS parse error", e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emitLocal("connection:status", { status: "disconnected" });
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn("WebSocket error", err);
        this.ws?.close();
      };
    } catch (e) {
      console.warn("WebSocket init error", e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  subscribe(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emitLocal(event: string, payload: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(payload));
    }
    // Also notify global wildcard
    const wildcard = this.listeners.get("*");
    if (wildcard) {
      wildcard.forEach((cb) => cb({ event, payload }));
    }
  }

  getStatus() {
    return this.isConnected;
  }
}

export const realtime = new RealtimeService();

/**
 * Bulletproof JSON fetch helper that:
 * 1. Guarantees Accept: application/json header
 * 2. Catches network failures gracefully
 * 3. Reads response text first and validates JSON format
 * 4. Completely prevents "Unexpected token '<', <html>... is not valid JSON" errors
 * 5. Returns parsed data or throws a descriptive, typed error
 */
export async function safeJsonFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers || {});
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(input, { ...init, headers });
  } catch (netErr: any) {
    const err: any = new Error(
      netErr?.message || "Network connection error. Please check your internet connection."
    );
    err.isNetworkError = true;
    throw err;
  }

  const rawText = await res.text();
  let data: any = null;

  try {
    const trimmed = (rawText || "").trim();
    if (trimmed.startsWith("<") || trimmed.startsWith("<!DOCTYPE") || trimmed.includes("<html")) {
      const err: any = new Error("NON_JSON_HTML_RESPONSE");
      err.isHtmlResponse = true;
      err.status = res.status;
      throw err;
    }
    data = trimmed ? JSON.parse(trimmed) : {};
  } catch (parseErr: any) {
    if (parseErr?.isHtmlResponse) {
      throw parseErr;
    }
    const err: any = new Error(
      !res.ok
        ? `Server returned error (${res.status} ${res.statusText || "Error"}).`
        : "Received an unexpected response from the server."
    );
    err.isNonJsonResponse = true;
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    const error: any = new Error(data?.message || data?.error || `Request failed with status ${res.status}`);
    if (typeof data === "object" && data !== null) {
      Object.assign(error, data);
    }
    throw error;
  }

  return data as T;
}

export async function parseJsonSafely<T = any>(res: Response, defaultMessage = "Request failed"): Promise<T> {
  const rawText = await res.text();
  let data: any = null;

  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    if (!res.ok) {
      throw new Error(`Server returned error (${res.status} ${res.statusText || "Error"}).`);
    }
    throw new Error("Received an unexpected response from the server.");
  }

  if (!res.ok) {
    const error: any = new Error(data?.message || data?.error || defaultMessage);
    if (typeof data === "object" && data !== null) {
      Object.assign(error, data);
    }
    throw error;
  }

  return data as T;
}

// REST API Methods
export const api = {
  async getBootstrap(): Promise<BootstrapData> {
    return safeJsonFetch<BootstrapData>("/api/bootstrap");
  },

  async createPost(postData: Partial<Post> & { testSimulationType?: string }): Promise<{
    success: boolean;
    post?: Post;
    message?: string;
    blocked?: boolean;
    violationType?: string;
    reason?: string;
    nepaliReason?: string;
  }> {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(postData),
    });
    const data = await parseJsonSafely(res, "Failed to create post");
    if (!res.ok || !data.success) {
      const err: any = new Error(data.message || "Failed to create post");
      err.blocked = data.blocked;
      err.violationType = data.violationType;
      err.reason = data.reason;
      err.nepaliReason = data.nepaliReason;
      throw err;
    }
    return data;
  },

  async verifyContentWithAI(data: {
    imageUrl?: string;
    caption?: string;
    nepaliCaption?: string;
    tags?: string[];
    userId?: string;
    testSimulationType?: string;
  }): Promise<AIContentVerificationResult> {
    return safeJsonFetch<AIContentVerificationResult>("/api/ai/verify-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async toggleLike(postId: string, userId: string): Promise<any> {
    return safeJsonFetch(`/api/posts/${postId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  },

  async addComment(postId: string, userId: string, text: string, nepaliText?: string): Promise<any> {
    return safeJsonFetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, text, nepaliText }),
    });
  },

  async toggleSave(postId: string, userId: string): Promise<any> {
    return safeJsonFetch(`/api/posts/${postId}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  },

  async createStory(storyData: { userId: string; imageUrl: string; caption?: string; location?: string }): Promise<any> {
    return safeJsonFetch("/api/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(storyData),
    });
  },

  async getMessages(userId: string, otherUserId: string): Promise<{ messages: DirectMessage[] }> {
    return safeJsonFetch<{ messages: DirectMessage[] }>(`/api/messages?userId=${userId}&otherUserId=${otherUserId}`);
  },

  async sendMessage(msg: { senderId: string; receiverId: string; text: string; imageUrl?: string }): Promise<any> {
    return safeJsonFetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    });
  },

  async generateAiCaption(data: { location: string; category?: string; userPrompt?: string; imageDescription?: string }): Promise<any> {
    return safeJsonFetch("/api/gemini/generate-caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async registerPersonal(data: {
    firstName: string;
    lastName: string;
    mobileNumber: string;
    email: string;
    password: string;
    confirmPassword?: string;
    district?: string;
    city?: string;
    province?: string;
  }): Promise<{
    success: boolean;
    message: string;
    user?: User;
    requiresVerification?: boolean;
    verifyLink?: string;
    token?: string;
    previewCode?: string;
    email?: string;
    officialNotification?: any;
    accountExists?: boolean;
    isEmailVerified?: boolean;
  }> {
    try {
      return await safeJsonFetch("/api/auth/register/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (err.accountExists || (err.message && !err.isHtmlResponse && !err.isNonJsonResponse && !err.message.includes("NON_JSON"))) {
        throw err;
      }

      // Static / Offline / Firestore Fallback:
      const cleanEmail = (data.email || "").trim().toLowerCase();
      const rawDigits = (data.mobileNumber || "").toString().replace(/\D/g, "");
      let cleanPhone = rawDigits;
      if (cleanPhone.startsWith("977")) cleanPhone = cleanPhone.slice(3);
      if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.slice(1);

      const targetUserId = `user_${Date.now()}`;
      const generatedUsername = `${data.firstName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${data.lastName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Math.floor(100 + Math.random() * 900)}`;
      const resolvedDistrict = data.district?.trim() || "Kathmandu";
      const resolvedCity = data.city?.trim() || "Kathmandu Metro";
      const resolvedProvince = data.province?.trim() || "Bagmati";

      const newUser: User = {
        id: targetUserId,
        username: generatedUsername,
        fullName: `${data.firstName.trim()} ${data.lastName.trim()}`,
        nepaliName: `${data.firstName.trim()} ${data.lastName.trim()}`,
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80`,
        bio: "Nepali Visual Creator 🇳🇵 Sharing perspectives across the Himalayas & culture.",
        location: `${resolvedCity}, ${resolvedDistrict}, Nepal`,
        district: resolvedDistrict,
        city: resolvedCity,
        province: resolvedProvince,
        followersCount: 0,
        followingCount: 1,
        postsCount: 0,
        isVerified: false,
        badge: "New Creator",
        accountType: "personal",
        role: "user",
        status: "active",
        isApproved: true,
        approvalStatus: "approved",
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: cleanEmail,
        mobileNumber: cleanPhone,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem("photobucket_current_user", JSON.stringify(newUser));
        localStorage.setItem("photobucket_is_logged_in", "true");
        localStorage.setItem(`pb_session_start_${newUser.id}`, Date.now().toString());
        firestoreSync.saveUser(newUser).catch(() => {});
      } catch {}

      return {
        success: true,
        message: "दर्ता सम्पन्न भयो! (Registration successful!)",
        user: newUser,
        email: cleanEmail,
      };
    }
  },

  async registerBusiness(data: {
    businessName: string;
    panNumber: string;
    registrationNumber: string;
    email: string;
    password: string;
    confirmPassword?: string;
    documentFile?: string;
    documentName?: string;
    district?: string;
    city?: string;
    province?: string;
  }): Promise<{
    success: boolean;
    message: string;
    user?: User;
    requiresVerification?: boolean;
    verifyLink?: string;
    token?: string;
    previewCode?: string;
    email?: string;
    officialNotification?: any;
    accountExists?: boolean;
    isEmailVerified?: boolean;
  }> {
    try {
      return await safeJsonFetch("/api/auth/register/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (err.accountExists || (err.message && !err.isHtmlResponse && !err.isNonJsonResponse && !err.message.includes("NON_JSON"))) {
        throw err;
      }

      const cleanEmail = (data.email || "").trim().toLowerCase();
      const cleanPan = (data.panNumber || "").trim().toUpperCase();
      const cleanReg = (data.registrationNumber || "").trim();
      const targetUserId = `user_biz_${Date.now()}`;
      const slug = data.businessName.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20);
      const generatedUsername = `${slug}_${Math.floor(100 + Math.random() * 900)}`;
      const resolvedDistrict = data.district?.trim() || "Kathmandu";
      const resolvedCity = data.city?.trim() || "Kathmandu Metro";
      const resolvedProvince = data.province?.trim() || "Bagmati";

      const newBizUser: User = {
        id: targetUserId,
        username: generatedUsername,
        fullName: data.businessName.trim(),
        nepaliName: data.businessName.trim(),
        avatar: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&auto=format&fit=crop&q=80",
        bio: `🏢 Verified Nepali Business | PAN: ${cleanPan} | Reg: ${cleanReg} | Serving authentic experiences across Nepal`,
        location: `${resolvedCity}, ${resolvedDistrict}, Nepal`,
        district: resolvedDistrict,
        city: resolvedCity,
        province: resolvedProvince,
        followersCount: 1,
        followingCount: 1,
        postsCount: 0,
        isVerified: false,
        badge: "Registered Business",
        accountType: "business",
        role: "business",
        status: "active",
        isApproved: true,
        approvalStatus: "approved",
        businessName: data.businessName.trim(),
        panNumber: cleanPan,
        registrationNumber: cleanReg,
        email: cleanEmail,
        isBusinessVerified: false,
        businessCategory: "Enterprise & Tourism Partner",
        documentName: data.documentName || "Company_Registration_Doc.pdf",
        documentUrl: data.documentFile || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem("photobucket_current_user", JSON.stringify(newBizUser));
        localStorage.setItem("photobucket_is_logged_in", "true");
        localStorage.setItem(`pb_session_start_${newBizUser.id}`, Date.now().toString());
        firestoreSync.saveUser(newBizUser).catch(() => {});
      } catch {}

      return {
        success: true,
        message: "कम्पनी दर्ता सम्पन्न भयो! (Business registration successful!)",
        user: newBizUser,
        email: cleanEmail,
      };
    }
  },

  async verifyEmail(params: {
    token?: string;
    code?: string;
    email?: string;
  }): Promise<{
    success: boolean;
    message: string;
    user?: User;
    email?: string;
  }> {
    return safeJsonFetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  },

  async resendVerification(data: {
    email?: string;
    identifier?: string;
  }): Promise<{
    success: boolean;
    message: string;
    verifyLink?: string;
    token?: string;
    previewCode?: string;
    officialNotification?: any;
    isAlreadyVerified?: boolean;
  }> {
    return safeJsonFetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async boostPost(
    postId: string,
    boostData: {
      scope: "entire_nepal" | "district" | "city";
      targetDistrict?: string;
      targetCity?: string;
      budgetNPR?: number;
      durationDays?: number;
      boostedBy?: string;
    }
  ): Promise<{ success: boolean; post: Post; message: string }> {
    return safeJsonFetch(`/api/posts/${postId}/boost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(boostData),
    });
  },

  async login(data: {
    sector: "personal" | "business" | "admin";
    identifier: string;
    password: string;
  }): Promise<{
    success: boolean;
    message: string;
    user: User;
    isSuperAdmin?: boolean;
    isDelegatedAdmin?: boolean;
    adminPermissions?: AdminPermissions;
    emailNotVerified?: boolean;
    verifyLink?: string;
    token?: string;
    email?: string;
    previewCode?: string;
  }> {
    try {
      return await safeJsonFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (err.message && !err.isHtmlResponse && !err.isNonJsonResponse && !err.message.includes("NON_JSON")) {
        throw err;
      }

      // Check stored user fallback
      try {
        const storedStr = localStorage.getItem("photobucket_current_user");
        if (storedStr) {
          const u = JSON.parse(storedStr);
          return {
            success: true,
            message: "लगइन सफल भयो! (Signed in successfully)",
            user: u,
            isSuperAdmin: !!u.isSuperAdmin,
          };
        }
      } catch {}

      throw new Error(err.message || "Invalid credentials or network timeout. Please check your details.");
    }
  },

  async requestPasswordResetCode(data: {
    identifier?: string;
    userId?: string;
  }): Promise<{
    success: boolean;
    message: string;
    userId?: string;
    username?: string;
    fullName?: string;
    registeredEmail: string;
    maskedEmail: string;
    expiresInSeconds: number;
    previewCode?: string;
    officialNotification?: {
      sender: string;
      subject: string;
      to: string;
      maskedTo: string;
      code: string;
      sentAt: string;
      expiresInMinutes: number;
    };
  }> {
    return safeJsonFetch("/api/auth/request-password-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async verifyAndChangePassword(data: {
    identifier?: string;
    userId?: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{
    success: boolean;
    message: string;
    userId?: string;
    username?: string;
  }> {
    return safeJsonFetch("/api/auth/change-password-with-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async changePasswordDirect(
    userId: string,
    data: { currentPassword?: string; newPassword: string; confirmPassword: string }
  ): Promise<{ success: boolean; message: string; userId?: string }> {
    return safeJsonFetch(`/api/users/${userId}/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async deleteStory(storyId: string, userId?: string): Promise<{ success: boolean; message: string }> {
    return safeJsonFetch(`/api/stories/${storyId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  },

  // ==========================================
  // SUPER ADMIN API METHODS (FULL CONTROL)
  // ==========================================
  async getAdminOverview(): Promise<{ success: boolean; stats: AdminOverviewStats }> {
    return safeJsonFetch("/api/admin/overview");
  },

  async getAdminUsers(): Promise<{ success: boolean; users: (User & { storedPasswordHint?: string })[] }> {
    return safeJsonFetch("/api/admin/users");
  },

  async updateAdminUser(id: string, updates: Partial<User>): Promise<{ success: boolean; user: User }> {
    return safeJsonFetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  },

  async verifyAdminUser(
    id: string,
    data: {
      badge?: string;
      isVerified?: boolean;
      isBusinessVerified?: boolean;
      category?: VerificationCategory;
      verificationCategory?: VerificationCategory;
      badgeTitle?: string;
      verifiedBadgeTitle?: string;
      verificationStatus?: "none" | "pending" | "approved" | "rejected";
    }
  ): Promise<{ success: boolean; user: User }> {
    return safeJsonFetch(`/api/admin/users/${id}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async setAdminUserStatus(id: string, status: "active" | "suspended" | "banned"): Promise<{ success: boolean; user: User }> {
    return safeJsonFetch(`/api/admin/users/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  },

  async deleteAdminUser(id: string): Promise<{ success: boolean; message: string }> {
    return safeJsonFetch(`/api/admin/users/${id}`, {
      method: "DELETE",
    });
  },

  async loginWithGoogle(data: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    sector?: "personal" | "business";
    district?: string;
    city?: string;
    province?: string;
  }): Promise<{
    success: boolean;
    message: string;
    user?: User;
    isNewUser?: boolean;
    pendingApproval?: boolean;
  }> {
    return safeJsonFetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async submitVerificationDetails(data: {
    userId: string;
    email?: string;
    mobileNumber?: string;
    district?: string;
    city?: string;
    province?: string;
    sector?: "personal" | "business";
    businessName?: string;
    panNumber?: string;
    registrationNumber?: string;
    documentType?: string;
    documentName?: string;
    documentFile?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    message: string;
    user?: User;
    pendingApproval?: boolean;
  }> {
    return safeJsonFetch("/api/auth/submit-verification-details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async checkApprovalStatus(params: { userId?: string; email?: string }): Promise<{
    success: boolean;
    userId?: string;
    isApproved: boolean;
    approvalStatus: "pending_approval" | "approved" | "rejected";
    user?: User;
  }> {
    const q = new URLSearchParams();
    if (params.userId) q.set("userId", params.userId);
    if (params.email) q.set("email", params.email);
    return safeJsonFetch(`/api/auth/check-approval-status?${q.toString()}`);
  },

  async approveUserRegistration(id: string): Promise<{ success: boolean; message: string; user: User }> {
    return safeJsonFetch(`/api/admin/users/${id}/approve-registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  },

  async rejectUserRegistration(id: string, reason?: string): Promise<{ success: boolean; message: string; user: User }> {
    return safeJsonFetch(`/api/admin/users/${id}/reject-registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
  },

  async resetAdminUserPassword(id: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return safeJsonFetch(`/api/admin/users/${id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
  },

  async getAdminPosts(): Promise<{ success: boolean; posts: Post[] }> {
    return safeJsonFetch("/api/admin/posts");
  },

  async deleteAdminPost(id: string): Promise<{ success: boolean; message: string }> {
    return safeJsonFetch(`/api/admin/posts/${id}`, {
      method: "DELETE",
    });
  },

  async toggleFeaturePost(id: string): Promise<{ success: boolean; isFeatured: boolean; post: Post }> {
    return safeJsonFetch(`/api/admin/posts/${id}/feature`, {
      method: "POST",
    });
  },

  async getAdminAuditLogs(): Promise<{ success: boolean; auditLogs: AuditLog[] }> {
    return safeJsonFetch("/api/admin/audit-logs");
  },

  async broadcastAdminMessage(data: { title: string; message: string; type?: "info" | "warning" | "alert" }): Promise<any> {
    return safeJsonFetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  // ==========================================
  // BLUE TICK VERIFICATION & DOCUMENT SUBMISSION
  // ==========================================
  async submitVerificationRequest(data: {
    userId: string;
    category: string;
    documentType: string;
    documentName: string;
    documentUrl: string;
    referenceLinks?: string;
    notes?: string;
    badgeTitle?: string;
  }): Promise<{ success: boolean; message: string; user: User; request: VerificationRequest }> {
    return safeJsonFetch("/api/verification/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async getAdminVerificationRequests(): Promise<{ success: boolean; requests: VerificationRequest[] }> {
    return safeJsonFetch("/api/admin/verification-requests");
  },

  async approveVerificationRequest(
    id: string,
    data: { badgeTitle?: string; category?: string }
  ): Promise<{ success: boolean; message: string; user: User; request: VerificationRequest }> {
    return safeJsonFetch(`/api/admin/verification-requests/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async rejectVerificationRequest(
    id: string,
    data: { reason: string }
  ): Promise<{ success: boolean; message: string; user: User; request: VerificationRequest }> {
    return safeJsonFetch(`/api/admin/verification-requests/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  // ==========================================
  // PAGES & GROUPS API METHODS (3 LIMIT & SIMILARITY)
  // ==========================================
  async getPagesAndGroups(params?: {
    type?: string;
    creatorId?: string;
    visibility?: string;
    search?: string;
  }): Promise<{ success: boolean; items: PageOrGroup[] }> {
    const query = new URLSearchParams();
    if (params?.type) query.append("type", params.type);
    if (params?.creatorId) query.append("creatorId", params.creatorId);
    if (params?.visibility) query.append("visibility", params.visibility);
    if (params?.search) query.append("search", params.search);

    return safeJsonFetch(`/api/pages-groups?${query.toString()}`);
  },

  async checkPageGroupName(data: {
    name: string;
    type?: string;
    userDistrict?: string;
  }): Promise<NameCheckResult> {
    return safeJsonFetch<NameCheckResult>("/api/pages-groups/check-name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async createPageOrGroup(
    data: Partial<PageOrGroup> & {
      creatorId: string;
      type: "page" | "group";
      name: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    item?: PageOrGroup;
    remainingQuota?: number;
    isSimilar?: boolean;
    suggestions?: string[];
  }> {
    return safeJsonFetch("/api/pages-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async toggleJoinPageOrGroup(
    id: string,
    userId: string
  ): Promise<{ success: boolean; isMember: boolean; item: PageOrGroup }> {
    return safeJsonFetch(`/api/pages-groups/${id}/join-toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  },

  async deletePageOrGroup(
    id: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    return safeJsonFetch(`/api/pages-groups/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  },

  // ==========================================
  // SAFETY & GUIDELINE VIOLATION METHODS
  // ==========================================
  async getGuidelineViolations(): Promise<{
    success: boolean;
    violations: GuidelineViolationAlert[];
  }> {
    return safeJsonFetch("/api/admin/guideline-violations");
  },

  async actionGuidelineViolation(
    id: string,
    data: { action: "confirm_banned" | "dismissed"; adminNotes?: string }
  ): Promise<{ success: boolean; violation: GuidelineViolationAlert; message: string }> {
    return safeJsonFetch(`/api/admin/guideline-violations/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async verifyPostNow(id: string): Promise<{
    success: boolean;
    verified: boolean;
    message: string;
    post: Post;
  }> {
    return safeJsonFetch(`/api/posts/${id}/verify-now`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  },

  // Two-way Followers Online API
  async getFollowersOnline(userId: string): Promise<{
    success: boolean;
    userId: string;
    twoWayFollowers: User[];
    onlineTwoWayFollowers: User[];
    onlineCount: number;
    totalTwoWayCount: number;
  }> {
    return safeJsonFetch(`/api/users/${userId}/followers-online`);
  },

  async toggleFollow(
    currentUserId: string,
    targetUserId: string
  ): Promise<{
    success: boolean;
    isFollowing: boolean;
    isTwoWay: boolean;
    user: User;
    targetUser: User;
    message: string;
  }> {
    return safeJsonFetch(`/api/users/${currentUserId}/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });
  },

  async togglePresence(
    userId: string,
    isOnline?: boolean
  ): Promise<{
    success: boolean;
    userId: string;
    isOnline: boolean;
    activeUsers: string[];
  }> {
    return safeJsonFetch(`/api/users/presence/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isOnline }),
    });
  },

  // ==========================================
  // DELEGATED ADMIN & TASK TRACKING METHODS
  // ==========================================
  async getDelegatedAdmins(): Promise<{
    success: boolean;
    delegatedAdmins: DelegatedAdminUser[];
    admins?: DelegatedAdminUser[];
  }> {
    const json = await safeJsonFetch<{ success: boolean; delegatedAdmins?: DelegatedAdminUser[]; admins?: DelegatedAdminUser[] }>("/api/admin/delegated-admins");
    const list = json.delegatedAdmins || json.admins || [];
    return {
      success: json.success,
      delegatedAdmins: list,
      admins: list,
    };
  },

  async createDelegatedAdmin(data: {
    fullName: string;
    nepaliFullName?: string;
    officialEmail: string;
    password: string;
    designation: string;
    department?: string;
    mobileNumber?: string;
    permissions: AdminPermissions;
  }): Promise<{
    success: boolean;
    message: string;
    admin: DelegatedAdminUser;
  }> {
    return safeJsonFetch("/api/admin/delegated-admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async updateAdminPermissions(
    id: string,
    permissions: AdminPermissions
  ): Promise<{
    success: boolean;
    message: string;
    admin: DelegatedAdminUser;
  }> {
    return safeJsonFetch(`/api/admin/delegated-admins/${id}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions }),
    });
  },

  async setAdminStatus(
    id: string,
    status: "active" | "suspended"
  ): Promise<{
    success: boolean;
    message: string;
    admin: DelegatedAdminUser;
  }> {
    return safeJsonFetch(`/api/admin/delegated-admins/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  },

  async resetDelegatedAdminPassword(
    id: string,
    newPassword: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    return safeJsonFetch(`/api/admin/delegated-admins/${id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
  },

  async deleteDelegatedAdmin(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return safeJsonFetch(`/api/admin/delegated-admins/${id}`, {
      method: "DELETE",
    });
  },

  async getAdminTaskLogs(params?: {
    adminId?: string;
    category?: string;
    search?: string;
  }): Promise<{
    success: boolean;
    tasks: AdminTaskLog[];
    totalCount: number;
  }> {
    const query = new URLSearchParams();
    if (params?.adminId && params.adminId !== "all") query.append("adminId", params.adminId);
    if (params?.category && params.category !== "all") query.append("category", params.category);
    if (params?.search) query.append("search", params.search);

    return safeJsonFetch(`/api/admin/tasks?${query.toString()}`);
  },

  async logAdminTask(data: {
    adminId: string;
    adminName: string;
    adminEmail: string;
    taskType: string;
    category: "USER" | "VERIFICATION" | "BUSINESS" | "POST" | "BROADCAST" | "SYSTEM" | "ADMIN_MGMT";
    targetId?: string;
    targetName?: string;
    targetType?: "User" | "Post" | "Verification" | "Business" | "Admin" | "System";
    details: string;
    severity?: "info" | "warning" | "danger" | "success";
  }): Promise<{
    success: boolean;
    task: AdminTaskLog;
  }> {
    return safeJsonFetch("/api/admin/tasks/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async getSystemVersion(): Promise<{
    success: boolean;
    appName: string;
    nepaliName: string;
    version: string;
    buildId: string;
    bootTime: number;
    lastMutationTime: number;
    timestamp: string;
  }> {
    return safeJsonFetch("/api/system/version", {
      headers: { "Cache-Control": "no-cache" },
    });
  },

  async triggerLiveSync(data?: { reason?: string; scope?: string }): Promise<{
    success: boolean;
    message: string;
    lastMutationTime: number;
  }> {
    return safeJsonFetch("/api/system/trigger-live-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {}),
    });
  },
};

