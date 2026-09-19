export type AccountSector = "personal" | "business";

export type VerificationCategory =
  | "celebrity"
  | "businessman"
  | "entrepreneur"
  | "creator"
  | "organization"
  | "public_figure";

export type VerificationDocType =
  | "citizenship"
  | "passport"
  | "national_id"
  | "pan_card"
  | "company_reg"
  | "media_reference";

export interface VerificationRequest {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  nepaliName?: string;
  avatar: string;
  category: VerificationCategory;
  documentType: VerificationDocType;
  documentName: string;
  documentUrl: string;
  referenceLinks?: string;
  notes?: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  badgeTitle?: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  nepaliName?: string;
  avatar: string;
  bio: string;
  location: string;
  district: string;
  city?: string;
  province?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified?: boolean;
  badge?: string;
  
  // Blue Tick & Authenticate Verification fields
  verificationCategory?: VerificationCategory;
  verificationStatus?: "none" | "pending" | "approved" | "rejected";
  verificationDocumentUrl?: string;
  verificationDocumentType?: VerificationDocType;
  verificationDocumentName?: string;
  verificationNotes?: string;
  verificationReferenceLinks?: string;
  verificationSubmittedAt?: string;
  verifiedBadgeTitle?: string;
  verificationRejectionReason?: string;
  
  // Email Verification
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: string;
  
  // Sector & Auth Details
  isOnline?: boolean;
  isTwoWayFollow?: boolean;
  accountType?: AccountSector;
  role?: "user" | "business" | "super_admin" | "admin";
  isSuperAdmin?: boolean;
  isDelegatedAdmin?: boolean;
  status?: "active" | "suspended" | "banned";
  isApproved?: boolean;
  approvalStatus?: "pending_approval" | "approved" | "rejected";
  approvedAt?: string;
  approvedBy?: string;
  approvalRejectionReason?: string;
  createdAt?: string;
  email?: string;
  officialEmail?: string;
  designation?: string;
  department?: string;
  adminPermissions?: AdminPermissions;
  // Personal User fields
  firstName?: string;
  lastName?: string;
  mobileNumber?: string; // Encrypted/stored for security, visible exclusively to Super Admin
  
  // Business Organisation fields
  businessName?: string;
  panNumber?: string;
  registrationNumber?: string;
  documentUrl?: string;
  documentName?: string;
  isBusinessVerified?: boolean;
  businessCategory?: string;

  // Rate-limiting and edit timestamps (Enforced backend-only)
  lastUsernameChangeAt?: string;
  lastBioChangeAt?: string;
}

export interface AdminPermissions {
  canManageUsers: boolean;
  canVerifyUsers: boolean;
  canManageBusinesses: boolean;
  canModeratePosts: boolean;
  canCreatePosts: boolean;
  canDispatchBroadcasts: boolean;
  canViewAuditLogs: boolean;
  canViewOverviewStats: boolean;
}

export interface AdminTaskLog {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  adminRole?: string;
  designation?: string;
  taskType: string;
  category: "USER" | "VERIFICATION" | "BUSINESS" | "POST" | "BROADCAST" | "SYSTEM" | "ADMIN_MGMT";
  targetId?: string;
  targetName?: string;
  targetType?: "User" | "Post" | "Verification" | "Business" | "Admin" | "System";
  details: string;
  severity: "info" | "warning" | "danger" | "success";
  ipAddress?: string;
}

export interface DelegatedAdminUser {
  id: string;
  fullName: string;
  nepaliFullName?: string;
  username: string;
  officialEmail: string;
  mobileNumber?: string;
  designation: string;
  department: string;
  avatar: string;
  role: "admin";
  status: "active" | "suspended";
  permissions: AdminPermissions;
  createdBy: string;
  createdAt: string;
  lastActiveAt?: string;
  tasksCompletedCount: number;
  storedPasswordHint?: string; // Visible exclusively to Root Super Admin
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  category: "AUTH" | "USER" | "POST" | "BUSINESS" | "SYSTEM" | "MODERATION" | "ADMIN_MGMT";
  actor: string;
  details: string;
  ip?: string;
  severity: "info" | "warning" | "danger" | "success";
}

export interface DistrictCityUserSummary {
  district: string;
  province?: string;
  totalUsers: number;
  activeNow: number;
  verifiedCount: number;
  cities: { city: string; count: number; activeNow: number }[];
}

export interface HourlyActivityMetric {
  hour: number; // 0 - 23
  label: string; // e.g. "8 PM", "9 AM"
  ratio: number; // 0 to 100 percentage
  status: "peak" | "high" | "moderate" | "low";
  activeEstimate: number;
  description: string;
}

export interface OnlineUserDetails {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  location: string;
  district: string;
  city?: string;
  isVerified?: boolean;
  verifiedBadgeTitle?: string;
  accountType?: "personal" | "business";
}

export interface AdminOverviewStats {
  totalUsers: number;
  personalUsers: number;
  businessUsers: number;
  verifiedBusinesses: number;
  verifiedUsersCount: number;
  pendingVerificationsCount: number;
  pendingUserApprovalsCount?: number;
  pendingDocs: number;
  totalPosts: number;
  totalStories: number;
  totalComments: number;
  onlineUsers: number;
  auditLogsCount: number;
  activeUsersList: string[];
  // Innovative summary dashboard metrics
  onlineVerifiedUsersCount?: number;
  onlineUsersDetails?: OnlineUserDetails[];
  onlineVerifiedUsersList?: OnlineUserDetails[];
  districtCityBreakdown?: DistrictCityUserSummary[];
  hourlyActivityMetrics?: HourlyActivityMetric[];
  activitySummary?: {
    peakWindow: string;
    peakRatio: number;
    lowestWindow: string;
    lowestRatio: number;
    currentHourRatio: number;
    bestBroadcastTime: string;
  };
}

export interface PersonalRegisterPayload {
  sector: "personal";
  firstName: string;
  lastName: string;
  mobileNumber: string; // 10 digit starting with 98
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface BusinessRegisterPayload {
  sector: "business";
  businessName: string;
  panNumber: string;
  registrationNumber: string;
  email: string;
  password: string;
  confirmPassword?: string;
  documentFile?: string; // base64 or file URL
  documentName?: string;
}

export interface LoginPayload {
  sector: AccountSector;
  identifier: string; // email or mobile for personal, email or PAN/Reg for business
  password: string;
}

export const DEFAULT_CURRENT_USER: User = {
  id: "user_deepak",
  username: "deepak_subedi",
  fullName: "Deepak Subedi",
  nepaliName: "दीपक सुवेदी",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  bio: "🇳🇵 Capturing the soul of Nepal from Solukhumbu to Pokhara. Mountain & Cultural Visuals.",
  location: "Kathmandu & Pokhara",
  district: "Kathmandu",
  followersCount: 14200,
  followingCount: 380,
  postsCount: 84,
  isVerified: true,
  badge: "Mountain Visuals",
  accountType: "personal",
  isApproved: true,
  approvalStatus: "approved",
  firstName: "Deepak",
  lastName: "Subedi",
  email: "deepaksubedi32@gmail.com",
  mobileNumber: "9841234567",
};

export interface Comment {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  text: string;
  nepaliText?: string;
  createdAt: string;
  likes: number;
}

export interface PostBoostTarget {
  scope: "entire_nepal" | "district" | "city";
  targetDistrict?: string;
  targetCity?: string;
  budgetNPR?: number;
  durationDays?: number;
  boostedBy?: string;
  activeUntil?: string;
  reachCount?: number;
  clickCount?: number;
}

export type PostVerificationStatus = "pending" | "approved" | "rejected";
export type PostViolationType = "none" | "nudity" | "bullying" | "violence" | "hate_speech" | "illegal_goods";

export interface AIContentVerificationResult {
  isCompliant: boolean;
  violationType: PostViolationType;
  severity: "none" | "low" | "medium" | "critical";
  confidence: number;
  reason: string;
  nepaliReason: string;
  detectedElements?: string[];
  system?: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  userFullName: string;
  imageUrl: string;
  caption: string;
  nepaliCaption?: string;
  location: string;
  district: string;
  city?: string;
  province?: string;
  lat?: number;
  lng?: number;
  category: "himalayas" | "culture" | "food" | "street" | "wildlife" | "lifestyle";
  filter?: string;
  likes: string[]; // userIds
  comments: Comment[];
  savedBy: string[]; // userIds
  tags: string[];
  createdAt: string;
  musicTrack?: string;
  isVerified?: boolean;
  userVerificationCategory?: VerificationCategory;
  userVerifiedBadgeTitle?: string;
  isBoosted?: boolean;
  boostTarget?: PostBoostTarget;

  // 1-Minute Guideline Verification & Safety Directives
  verificationStatus?: PostVerificationStatus;
  verificationStartedAt?: string;
  verificationTargetAt?: string;
  verificationCompletedAt?: string;
  verificationTimerSeconds?: number;
  violationType?: PostViolationType;
  violationReason?: string;
  rejectionReason?: string;
  isFlaggedByAdmin?: boolean;
  isOfficialAnnouncement?: boolean;
}

export type PageOrGroupType = "page" | "group";
export type PageOrGroupVisibility = "public" | "private";

export interface PageOrGroup {
  id: string;
  type: PageOrGroupType;
  name: string;
  nepaliName?: string;
  slug: string;
  description: string;
  avatar: string;
  coverImage: string;
  visibility: PageOrGroupVisibility;
  creatorId: string;
  creatorName: string;
  creatorRole: AccountSector;
  district?: string;
  city?: string;
  province?: string;
  category: string;
  tags: string[];
  membersCount: number;
  followersCount: number;
  postsCount: number;
  members: string[]; // userIds
  createdAt: string;
  isVerified?: boolean;
}

export interface GuidelineViolationAlert {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userFullName: string;
  userAvatar: string;
  accountType: AccountSector;
  imageUrl: string;
  caption: string;
  violationType: "nudity" | "bullying" | "violence" | "hate_speech" | "illegal_goods";
  reason: string;
  severity: "high" | "critical";
  timestamp: string;
  status: "pending_review" | "confirmed_banned" | "dismissed";
  actionTaken?: string;
}

export interface NameCheckResult {
  available: boolean;
  isSimilar: boolean;
  matchedName?: string;
  suggestions: string[];
  message: string;
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  imageUrl: string;
  caption?: string;
  location?: string;
  createdAt: string;
  viewedBy: string[];
  likes: string[];
}

export interface Community {
  id: string;
  name: string;
  nepaliName: string;
  slug: string;
  description: string;
  coverImage: string;
  membersCount: number;
  postsCount: number;
  tags: string[];
  category: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
  read: boolean;
}

export interface LocationItem {
  name: string;
  district: string;
  count: number;
  coordinates: [number, number];
}

export type FeedType = "for-you" | "following" | "trending" | "locations" | "communities";

export interface FilterPreset {
  id: string;
  name: string;
  nepaliName: string;
  cssFilter: string;
  overlayClass?: string;
}

export type ScrollingAdCategory =
  | "notice"
  | "sponsored"
  | "tourism"
  | "contest"
  | "advisory"
  | "offer";

export interface ScrollingAdItem {
  id: string;
  title: string;
  nepaliTitle?: string;
  description: string;
  nepaliDescription?: string;
  category: ScrollingAdCategory;
  badgeText?: string;
  sponsorName?: string;
  linkUrl?: string;
  actionText?: string;
  imageUrl?: string;
  isActive: boolean;
  priority?: number;
  createdAt: string;
  expiresAt?: string;
  clickCount?: number;
}

export interface CompanyGifAdItem {
  id: string; // e.g. "footer-gif-slot-1" | "footer-gif-slot-2" | "footer-gif-slot-3"
  position: 1 | 2 | 3;
  companyName: string;
  title: string;
  nepaliTitle?: string;
  subtitle?: string;
  nepaliSubtitle?: string;
  gifUrl: string; // Animated GIF URL or Base64 data URL
  linkUrl: string; // Target company website URL
  badgeText?: string; // e.g. "GIF AD", "SPONSORED", "BRAND PARTNER"
  actionText?: string; // e.g. "Visit Site", "Claim Offer"
  isActive: boolean;
  viewCount?: number;
  clickCount?: number;
  updatedAt?: string;
}

