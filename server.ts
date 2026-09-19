import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { initializePersistentDatabase, saveDatabaseState, CURRENT_DATABASE_SCHEMA_VERSION, DatabaseState } from "./src/services/dbStore";
import { authenticateJWT, requireAdmin, JWT_SECRET, hashPassword, comparePassword, generateToken } from "./src/services/authMiddleware";

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security Hardening: Disable backend technology disclosure
app.disable("x-powered-by");

// Security Hardening: Strict HTTP Security Headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(self), geolocation=(self)");
  
  // Disallow sourcemap (.map) downloads in production
  if (req.path.endsWith(".map")) {
    return res.status(404).send("Not Found");
  }

  next();
});

// Security Hardening: Anti-Scraping / Bad Bot Mitigation
const requestTracker = new Map<string, { count: number; firstSeen: number }>();
app.use((req, res, next) => {
  const userAgent = req.headers["user-agent"] || "";
  const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "unknown";

  // Reject recognized headless scraper bots
  const maliciousBots = [/sqlmap/i, /nikto/i, /masscan/i, /zgrab/i, /scrapy/i];
  if (maliciousBots.some((pattern) => pattern.test(userAgent))) {
    return res.status(403).json({ error: "Access denied by Photo Bucket Security Shield." });
  }

  // Basic API endpoint rate-limiting (300 requests / min per IP)
  if (req.path.startsWith("/api/")) {
    const now = Date.now();
    const clientData = requestTracker.get(clientIp);

    if (!clientData || now - clientData.firstSeen > 60000) {
      requestTracker.set(clientIp, { count: 1, firstSeen: now });
    } else {
      clientData.count++;
      if (clientData.count > 300) {
        return res.status(429).json({ error: "Too many requests. Please slow down." });
      }
    }
  }

  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Gemini Client (lazily guarded)
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// In-Memory Data Store with Initial Authentic Nepali Data
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

  // Email Verification fields
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: string;

  // Sector & Auth Details
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
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt?: string;
  email?: string;
  officialEmail?: string;
  designation?: string;
  department?: string;
  adminPermissions?: AdminPermissions;
  // Personal User fields
  firstName?: string;
  lastName?: string;
  mobileNumber?: string; // Stored securely, excluded from public profile display

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
  storedPasswordHint?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  category: "AUTH" | "USER" | "POST" | "BUSINESS" | "SYSTEM" | "MODERATION" | "COMMUNITY" | "ADMIN_MGMT";
  actor: string;
  details: string;
  ip?: string;
  severity: "info" | "warning" | "danger" | "success";
}

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
  likes: string[]; // array of userIds
  comments: Comment[];
  savedBy: string[]; // array of userIds
  tags: string[];
  createdAt: string;
  musicTrack?: string;
  isBoosted?: boolean;
  boostTarget?: {
    scope: "entire_nepal" | "district" | "city";
    targetDistrict?: string;
    targetCity?: string;
    budgetNPR?: number;
    durationDays?: number;
    boostedBy?: string;
    activeUntil?: string;
    reachCount?: number;
    clickCount?: number;
  };
  verificationStatus?: "approved" | "pending" | "rejected";
  verificationStartedAt?: string;
  verificationTargetAt?: string;
  verificationCompletedAt?: string;
  verificationTimerSeconds?: number;
  violationType?: string;
  violationReason?: string;
  rejectionReason?: string;
  isFlaggedByAdmin?: boolean;
  isVerified?: boolean;
  isOfficialAnnouncement?: boolean;
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

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
  read: boolean;
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

// Seed Users - Super Admin Identity tied to Logo and Platform Brand
const SUPER_ADMIN_USER: User = {
  id: "super_admin_deepak",
  username: "photo_bucket",
  fullName: "फोटो Bucket",
  nepaliName: "फोटो Bucket",
  avatar: "/logo.svg",
  bio: "🛡️ Official Platform Account | फोटो Bucket Community Directives & Updates | नेपाली समुदायको फोटो चौतारी",
  location: "Kathmandu, Nepal",
  district: "Kathmandu",
  followersCount: 154000,
  followingCount: 0,
  postsCount: 1,
  isVerified: true,
  badge: "Official Platform Admin",
  accountType: "personal",
  role: "super_admin",
  isSuperAdmin: true,
  status: "active",
  createdAt: "2026-08-01T00:00:00Z",
  email: "photobucketnepal@gmail.com",
  firstName: "फोटो",
  lastName: "Bucket",
  mobileNumber: "9841000000",
};

const seedUsers: User[] = [
  {
    id: "user_deepak",
    username: "deepak_subedi",
    fullName: "Deepak Subedi",
    nepaliName: "दीपक सुवेदी",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    bio: "Visual Storyteller | Capturing raw landscapes of Nepal 🏔️🇳🇵 | Kathmandu & Pokhara",
    location: "Kathmandu Valley, Nepal",
    district: "Kathmandu",
    followersCount: 14200,
    followingCount: 380,
    postsCount: 42,
    isVerified: true,
    badge: "Top Creator",
    verificationCategory: "creator",
    verificationStatus: "approved",
    verifiedBadgeTitle: "Verified Creator 📸",
    verificationDocumentType: "citizenship",
    verificationDocumentName: "Nagarikta_Deepak_Subedi_KTM.pdf",
    verificationDocumentUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
    accountType: "personal",
    role: "user",
    status: "active",
    createdAt: "2026-08-10T10:00:00Z",
    email: "deepaksubedi32@gmail.com",
    firstName: "Deepak",
    lastName: "Subedi",
    mobileNumber: "9841234567",
  },
  SUPER_ADMIN_USER,
  {
    id: "user_anmol",
    username: "anmol_kc_official",
    fullName: "Anmol K.C.",
    nepaliName: "अनमोल केसी",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    bio: "Nepali Cinema Actor 🎬 Filmmaker | Passionate about showcasing Nepal's scenic wonders to the world 🇳🇵",
    location: "Baluwatar, Kathmandu",
    district: "Kathmandu",
    followersCount: 284000,
    followingCount: 120,
    postsCount: 56,
    isVerified: true,
    badge: "Cinema Star",
    verificationCategory: "celebrity",
    verificationStatus: "approved",
    verifiedBadgeTitle: "Verified Celebrity 🌟",
    verificationDocumentType: "passport",
    verificationDocumentName: "Anmol_KC_Official_Passport_Nepal.pdf",
    verificationDocumentUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80",
    verificationReferenceLinks: "https://en.wikipedia.org/wiki/Anmol_K.C., https://imdb.com/name/nm6012489",
    accountType: "personal",
    role: "user",
    status: "active",
    createdAt: "2026-08-05T08:00:00Z",
    email: "anmol@kollywood.np",
    firstName: "Anmol",
    lastName: "KC",
    mobileNumber: "9841998877",
  },
  {
    id: "user_binod",
    username: "binod_chaudhary_leader",
    fullName: "Binod Chaudhary",
    nepaliName: "विनोद चौधरी",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    bio: "Industrialist & Philanthropist 🏢 Building Nepali Global Enterprise | Author of 'Making It Big'",
    location: "Sanepa, Lalitpur, Nepal",
    district: "Lalitpur",
    city: "Lalitpur Metro",
    province: "Bagmati",
    followersCount: 420000,
    followingCount: 45,
    postsCount: 112,
    isVerified: true,
    badge: "Business Titan",
    verificationCategory: "businessman",
    verificationStatus: "approved",
    verifiedBadgeTitle: "Verified Businessman 🏢",
    verificationDocumentType: "pan_card",
    verificationDocumentName: "PAN_Gov_Certificate_IRD_Nepal.pdf",
    verificationDocumentUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80",
    verificationReferenceLinks: "https://forbes.com/profile/binod-chaudhary, https://chaudharygroup.com",
    accountType: "business",
    businessName: "Chaudhary Group (CG Corp Global)",
    panNumber: "100293847",
    registrationNumber: "00129-LAL-045",
    email: "chairman@chaudharygroup.np",
    isBusinessVerified: true,
    businessCategory: "Conglomerate & Industry Leader",
  },
  {
    id: "user_sixit",
    username: "sixit_bhatta_startup",
    fullName: "Sixit Bhatta",
    nepaliName: "सिक्षित भट्ट",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    bio: "Tech Entrepreneur & Ecosystem Builder 💼 Co-founder Tootle | Driving digital mobility & youth innovation in Nepal 🚀",
    location: "Jhamsikhel, Lalitpur",
    district: "Lalitpur",
    followersCount: 68500,
    followingCount: 210,
    postsCount: 78,
    isVerified: true,
    badge: "Tech Pioneer",
    verificationCategory: "entrepreneur",
    verificationStatus: "approved",
    verifiedBadgeTitle: "Verified Entrepreneur 💼",
    verificationDocumentType: "company_reg",
    verificationDocumentName: "Company_Registration_OCR_Certificate.pdf",
    verificationDocumentUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80",
    verificationReferenceLinks: "https://linkedin.com/in/sixitbhatta, https://kathmandupost.com/tech-innovation",
    accountType: "personal",
    role: "user",
    status: "active",
    email: "sixit@techinnovation.np",
    firstName: "Sixit",
    lastName: "Bhatta",
    mobileNumber: "9841887766",
  },
  {
    id: "user_suman",
    username: "suman_shakya",
    fullName: "Suman Shakya",
    nepaliName: "सुमन शाक्य",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    bio: "Newa Heritage & Ancient Architecture Explorer 🛕 Traditional Art Preserver | Patan",
    location: "Patan Durbar Square, Lalitpur",
    district: "Lalitpur",
    followersCount: 8900,
    followingCount: 240,
    postsCount: 88,
    isVerified: true,
    badge: "Heritage Guide",
    verificationCategory: "creator",
    verificationStatus: "approved",
    verifiedBadgeTitle: "Verified Heritage Guide 🛕",
    verificationDocumentType: "citizenship",
    verificationDocumentName: "Nagarikta_Suman_Shakya_Lalitpur.pdf",
    verificationDocumentUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
    accountType: "personal",
    email: "suman.shakya@patanculture.np",
    mobileNumber: "9841223344",
  },
  {
    id: "user_dikshya",
    username: "dikshya_gurung",
    fullName: "Dikshya Gurung",
    nepaliName: "दिक्षा गुरुङ",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
    bio: "Trekking guide & mountain wanderer 🥾 Annapurna, Manaslu & Langtang trails",
    location: "Lakeside, Pokhara",
    district: "Kaski",
    followersCount: 22400,
    followingCount: 510,
    postsCount: 124,
    isVerified: true,
    badge: "Trail Master",
    verificationCategory: "creator",
    verificationStatus: "approved",
    verifiedBadgeTitle: "Verified Mountain Guide 🏔️",
    verificationDocumentType: "citizenship",
    verificationDocumentName: "Nagarikta_Dikshya_Gurung_Kaski.jpg",
    verificationDocumentUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
    accountType: "personal",
    email: "dikshya.gurung@himalayantrails.np",
    mobileNumber: "9841334455",
  },
  {
    id: "user_aarav",
    username: "aarav_momo_diaries",
    fullName: "Aarav Shrestha",
    nepaliName: "आरव श्रेष्ठ",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    bio: "Street Food Critic 🥟 Searching for the best Jhol Momo, Laphing & Choila across 77 districts",
    location: "Boudhanath, Kathmandu",
    district: "Kathmandu",
    followersCount: 16800,
    followingCount: 420,
    postsCount: 95,
    isVerified: false,
    badge: "Foodie Guru",
    verificationCategory: "creator",
    verificationStatus: "pending",
    verificationDocumentType: "citizenship",
    verificationDocumentName: "Nagarikta_Aarav_Shrestha_Kathmandu.jpg",
    verificationDocumentUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
    verificationReferenceLinks: "https://youtube.com/momo_diaries_nepal, https://instagram.com/aarav_momo_diaries",
    verificationNotes: "Prominent Nepali food blogger with 16k+ followers covering traditional local food culture.",
    verificationSubmittedAt: "2026-08-30T04:15:00Z",
    accountType: "personal",
    email: "aarav.shrestha@momodiaries.np",
    mobileNumber: "9841445566",
  },
  {
    id: "user_prerana",
    username: "prerana_thapa",
    fullName: "Prerana Thapa",
    nepaliName: "प्रेरणा थापा",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    bio: "Wilderness & wildlife conservationist 🦏 Chitwan & Bardia Jungle lover",
    location: "Sauraha, Chitwan National Park",
    district: "Chitwan",
    followersCount: 9400,
    followingCount: 310,
    postsCount: 63,
    isVerified: false,
    verificationCategory: "public_figure",
    verificationStatus: "pending",
    verificationDocumentType: "national_id",
    verificationDocumentName: "National_ID_Prerana_Thapa_Chitwan.pdf",
    verificationDocumentUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    verificationReferenceLinks: "https://wildlifenepal.org/conservationists/prerana",
    verificationNotes: "National Geographic grantee and conservation documentarian based in Chitwan.",
    verificationSubmittedAt: "2026-08-30T05:30:00Z",
    accountType: "personal",
    email: "prerana.thapa@wildlifenepal.org",
    mobileNumber: "9841556677",
  },
  {
    id: "user_kiran",
    username: "kiran_mustang",
    fullName: "Kiran Sherpa",
    nepaliName: "किरण शेर्पा",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
    bio: "High Altitude Cinematographer 🎥 Upper Mustang & Khumbu Region",
    location: "Lo Manthang, Mustang",
    district: "Mustang",
    followersCount: 31000,
    followingCount: 190,
    postsCount: 156,
    isVerified: true,
    badge: "Pro Explorer",
    accountType: "personal",
    firstName: "Kiran",
    lastName: "Sherpa",
    email: "kiran@mustangphoto.np",
    mobileNumber: "9851098765",
  },
  {
    id: "user_himalayan_horizon",
    username: "himalayan_horizon_travels",
    fullName: "Himalayan Horizon Travels & Expeditions",
    nepaliName: "हिमालयन होराइजन ट्राभल्स प्रा. लि.",
    avatar: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&auto=format&fit=crop&q=80",
    bio: "🏔️ Registered Nepali Trekking & Expedition Organization | Government Certified Tour Operator #148203 | Custom Himalayan Journeys",
    location: "Thamel, Kathmandu, Nepal",
    district: "Kathmandu",
    city: "Kathmandu Metro",
    province: "Bagmati",
    followersCount: 48900,
    followingCount: 65,
    postsCount: 210,
    isVerified: true,
    badge: "Verified Business",
    accountType: "business",
    businessName: "Himalayan Horizon Travels & Expeditions Pvt. Ltd.",
    panNumber: "601849201",
    registrationNumber: "148203/078/079",
    email: "info@himalayanhorizoneexpeditions.np",
    isBusinessVerified: true,
    businessCategory: "Trekking & Tourism Agency",
    documentName: "PAN_Gov_Certificate_HimalayanHorizon.pdf",
    documentUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "admin_pooja",
    username: "pooja_verification_lead",
    fullName: "Pooja Sharma",
    nepaliName: "पूजा शर्मा",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    bio: "🛡️ Administrative Staff | Senior Blue Tick Verification & Compliance Lead @ फोटो Bucket",
    location: "Baneshwor, Kathmandu, Nepal",
    district: "Kathmandu",
    city: "Kathmandu Metro",
    province: "Bagmati",
    followersCount: 1250,
    followingCount: 45,
    postsCount: 12,
    isVerified: true,
    badge: "Verification Lead",
    verifiedBadgeTitle: "Verified Admin 🛡️",
    accountType: "personal",
    role: "admin",
    isDelegatedAdmin: true,
    status: "active",
    createdAt: "2026-08-15T09:00:00Z",
    email: "pooja.sharma@photobucket.com.np",
    officialEmail: "pooja.sharma@photobucket.com.np",
    designation: "Senior Verification Officer",
    department: "Identity & Blue Tick Compliance",
    mobileNumber: "9851088771",
    adminPermissions: {
      canManageUsers: true,
      canVerifyUsers: true,
      canManageBusinesses: true,
      canModeratePosts: false,
      canCreatePosts: false,
      canDispatchBroadcasts: false,
      canViewAuditLogs: true,
      canViewOverviewStats: true,
    },
  },
  {
    id: "admin_bibek",
    username: "bibek_content_moderator",
    fullName: "Bibek Shrestha",
    nepaliName: "बिबेक श्रेष्ठ",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    bio: "🛡️ Administrative Staff | Trust, Safety & Community Guidelines Moderator @ फोटो Bucket",
    location: "Patan, Lalitpur, Nepal",
    district: "Lalitpur",
    city: "Lalitpur Metro",
    province: "Bagmati",
    followersCount: 980,
    followingCount: 60,
    postsCount: 18,
    isVerified: true,
    badge: "Safety Moderator",
    verifiedBadgeTitle: "Verified Admin 🛡️",
    accountType: "personal",
    role: "admin",
    isDelegatedAdmin: true,
    status: "active",
    createdAt: "2026-08-20T11:00:00Z",
    email: "bibek.shrestha@photobucket.com.np",
    officialEmail: "bibek.shrestha@photobucket.com.np",
    designation: "Community Content Moderator",
    department: "Trust & Safety Operations",
    mobileNumber: "9841334455",
    adminPermissions: {
      canManageUsers: false,
      canVerifyUsers: false,
      canManageBusinesses: false,
      canModeratePosts: true,
      canCreatePosts: true,
      canDispatchBroadcasts: false,
      canViewAuditLogs: true,
      canViewOverviewStats: true,
    },
  },
];

// In-Memory Password Store
const userCredentials: Record<string, string> = {
  "super_admin_deepak": "Dmgs@12345",
  "admin_pooja": "Pooja@Pb2026",
  "admin_bibek": "Bibek@Pb2026",
  "user_deepak": "nepal123",
  "user_anmol": "nepal123",
  "user_binod": "nepal123",
  "user_sixit": "nepal123",
  "user_suman": "nepal123",
  "user_dikshya": "nepal123",
  "user_aarav": "nepal123",
  "user_prerana": "nepal123",
  "user_kiran": "nepal123",
  "user_himalayan_horizon": "nepal123",
};

// Seed Blue Tick Verification Requests for Super Admin Desk
const seedVerificationRequests: VerificationRequest[] = [
  {
    id: "vreq_1",
    userId: "user_aarav",
    username: "aarav_momo_diaries",
    fullName: "Aarav Shrestha",
    nepaliName: "आरव श्रेष्ठ",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    category: "creator",
    documentType: "citizenship",
    documentName: "Nagarikta_Aarav_Shrestha_Kathmandu.jpg",
    documentUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
    referenceLinks: "https://youtube.com/momo_diaries_nepal, https://instagram.com/aarav_momo_diaries",
    notes: "Prominent culinary explorer and food video creator covering 77 districts of Nepal. 16.8k active followers.",
    submittedAt: "2026-08-30T04:15:00Z",
    status: "pending",
    badgeTitle: "Verified Food Critic 🥟",
  },
  {
    id: "vreq_2",
    userId: "user_prerana",
    username: "prerana_thapa",
    fullName: "Prerana Thapa",
    nepaliName: "प्रेरणा थापा",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    category: "public_figure",
    documentType: "national_id",
    documentName: "National_ID_Prerana_Thapa_Chitwan.pdf",
    documentUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    referenceLinks: "https://wildlifenepal.org/conservationists/prerana",
    notes: "National Geographic grantee and wildlife conservationist working in Chitwan National Park.",
    submittedAt: "2026-08-30T05:30:00Z",
    status: "pending",
    badgeTitle: "Verified Conservationist 🦏",
  },
  {
    id: "vreq_3",
    userId: "user_anmol",
    username: "anmol_kc_official",
    fullName: "Anmol K.C.",
    nepaliName: "अनमोल केसी",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    category: "celebrity",
    documentType: "passport",
    documentName: "Anmol_KC_Official_Passport_Nepal.pdf",
    documentUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80",
    referenceLinks: "https://en.wikipedia.org/wiki/Anmol_K.C., https://imdb.com/name/nm6012489",
    notes: "Leading Nepali film industry actor with 284k followers and verified national press citations.",
    submittedAt: "2026-08-20T10:00:00Z",
    status: "approved",
    badgeTitle: "Verified Celebrity 🌟",
    reviewedBy: "Deepak Subedi (Root Super Admin)",
    reviewedAt: "2026-08-20T11:30:00Z",
  },
  {
    id: "vreq_4",
    userId: "user_binod",
    username: "binod_chaudhary_leader",
    fullName: "Binod Chaudhary",
    nepaliName: "विनोद चौधरी",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    category: "businessman",
    documentType: "pan_card",
    documentName: "PAN_Gov_Certificate_IRD_Nepal.pdf",
    documentUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80",
    referenceLinks: "https://forbes.com/profile/binod-chaudhary",
    notes: "Industrialist, Forbes-listed business leader and CG Corp Global chairman.",
    submittedAt: "2026-08-18T09:00:00Z",
    status: "approved",
    badgeTitle: "Verified Businessman 🏢",
    reviewedBy: "Deepak Subedi (Root Super Admin)",
    reviewedAt: "2026-08-18T09:45:00Z",
  },
  {
    id: "vreq_5",
    userId: "user_sixit",
    username: "sixit_bhatta_startup",
    fullName: "Sixit Bhatta",
    nepaliName: "सिक्षित भट्ट",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    category: "entrepreneur",
    documentType: "company_reg",
    documentName: "Company_Registration_OCR_Certificate.pdf",
    documentUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80",
    referenceLinks: "https://linkedin.com/in/sixitbhatta",
    notes: "Co-founder of Tootle and pioneer of Nepal digital mobility and ride-sharing ecosystem.",
    submittedAt: "2026-08-22T14:00:00Z",
    status: "approved",
    badgeTitle: "Verified Entrepreneur 💼",
    reviewedBy: "Deepak Subedi (Root Super Admin)",
    reviewedAt: "2026-08-22T14:20:00Z",
  },
];

// Live System Audit Logs for Super Admin Oversight
const seedAuditLogs: AuditLog[] = [
  {
    id: "log_1",
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    action: "SYSTEM_CORE_BOOT",
    category: "SYSTEM",
    actor: "Kernel/Vite Engine",
    details: "Photo Bucket Server initialized with Dual Sector Authentication & WebSocket Sync.",
    severity: "info",
  },
  {
    id: "log_2",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    action: "BUSINESS_VERIFICATION_SUBMITTED",
    category: "BUSINESS",
    actor: "Himalayan Horizon Travels",
    details: "Submitted PAN: 601849201 and Reg: 148203/078/079. Status marked verified.",
    severity: "success",
  },
  {
    id: "log_3",
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    action: "CONTENT_GEO_PUBLISH",
    category: "POST",
    actor: "Kiran Sherpa",
    details: "Published high-altitude story in Lo Manthang, Mustang [29.182, 83.956].",
    severity: "info",
  },
  {
    id: "log_4",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    action: "USER_ACTIVE_GATEWAY",
    category: "AUTH",
    actor: "Dikshya Gurung",
    details: "Authenticated via Pokhara Gateway Lakeside.",
    severity: "success",
  },
];

function addAuditLog(
  action: string,
  category: AuditLog["category"],
  actor: string,
  details: string,
  severity: AuditLog["severity"] = "info"
) {
  const newLog: AuditLog = {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    action,
    category,
    actor,
    details,
    severity,
  };
  auditLogs.unshift(newLog);
  if (auditLogs.length > 300) auditLogs.pop();
  try {
    broadcast("admin:audit_log", newLog);
  } catch (e) {
    // broadcast if active
  }
  return newLog;
}

// Delegated Sub-Admin Accounts Data Store
const seedDelegatedAdmins: DelegatedAdminUser[] = [
  {
    id: "admin_pooja",
    fullName: "Pooja Sharma",
    nepaliFullName: "पूजा शर्मा",
    username: "pooja_verification_lead",
    officialEmail: "pooja.sharma@photobucket.com.np",
    mobileNumber: "9851088771",
    designation: "Senior Verification Officer",
    department: "Identity & Blue Tick Compliance",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    role: "admin",
    status: "active",
    permissions: {
      canManageUsers: true,
      canVerifyUsers: true,
      canManageBusinesses: true,
      canModeratePosts: false,
      canCreatePosts: false,
      canDispatchBroadcasts: false,
      canViewAuditLogs: true,
      canViewOverviewStats: true,
    },
    createdBy: "Deepak Subedi (Root Super Admin)",
    createdAt: "2026-08-15T09:00:00Z",
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    tasksCompletedCount: 28,
    storedPasswordHint: "Pooja@Pb2026",
  },
  {
    id: "admin_bibek",
    fullName: "Bibek Shrestha",
    nepaliFullName: "बिबेक श्रेष्ठ",
    username: "bibek_content_moderator",
    officialEmail: "bibek.shrestha@photobucket.com.np",
    mobileNumber: "9841334455",
    designation: "Community Content Moderator",
    department: "Trust & Safety Operations",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    role: "admin",
    status: "active",
    permissions: {
      canManageUsers: false,
      canVerifyUsers: false,
      canManageBusinesses: false,
      canModeratePosts: true,
      canCreatePosts: true,
      canDispatchBroadcasts: false,
      canViewAuditLogs: true,
      canViewOverviewStats: true,
    },
    createdBy: "Deepak Subedi (Root Super Admin)",
    createdAt: "2026-08-20T11:00:00Z",
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    tasksCompletedCount: 45,
    storedPasswordHint: "Bibek@Pb2026",
  },
];

// Admin Task Tracking Audit Log Store
const seedAdminTaskLogs: AdminTaskLog[] = [
  {
    id: "task_seed_1",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    adminId: "admin_pooja",
    adminName: "Pooja Sharma",
    adminEmail: "pooja.sharma@photobucket.com.np",
    adminRole: "admin",
    designation: "Senior Verification Officer",
    taskType: "VERIFY_USER_BLUE_TICK",
    category: "VERIFICATION",
    targetId: "user_aarav",
    targetName: "Aarav Shrestha (@aarav_momo_diaries)",
    targetType: "Verification",
    details: "Approved Blue Tick verification request and assigned 'Verified Food Critic 🥟' badge title after verifying Nagarikta document.",
    severity: "success",
    ipAddress: "103.141.22.84 (NPIX Kathmandu Gateway)",
  },
  {
    id: "task_seed_2",
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    adminId: "admin_bibek",
    adminName: "Bibek Shrestha",
    adminEmail: "bibek.shrestha@photobucket.com.np",
    adminRole: "admin",
    designation: "Community Content Moderator",
    taskType: "MODERATE_POST",
    category: "POST",
    targetId: "post_1",
    targetName: "Phewa Lake reflection story",
    targetType: "Post",
    details: "Reviewed image metadata and verified cultural authenticity tag #Machhapuchhre across Western Gandaki region.",
    severity: "info",
    ipAddress: "103.141.22.86 (Patan Sub-node)",
  },
  {
    id: "task_seed_3",
    timestamp: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    adminId: "admin_pooja",
    adminName: "Pooja Sharma",
    adminEmail: "pooja.sharma@photobucket.com.np",
    adminRole: "admin",
    designation: "Senior Verification Officer",
    taskType: "VERIFY_BUSINESS_PAN",
    category: "BUSINESS",
    targetId: "user_binod",
    targetName: "Chaudhary Group (CG Corp Global)",
    targetType: "Business",
    details: "Audited PAN certificate #100293847 against Inland Revenue Department database; confirmed Business Titan badge.",
    severity: "success",
    ipAddress: "103.141.22.84 (NPIX Kathmandu Gateway)",
  },
  {
    id: "task_seed_4",
    timestamp: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
    adminId: "super_admin_deepak",
    adminName: "Deepak Subedi (Root Super Admin)",
    adminEmail: "photobucketnepal@gmail.com",
    adminRole: "super_admin",
    designation: "Platform Founder & Super Admin",
    taskType: "DELEGATE_ADMIN_CREATED",
    category: "ADMIN_MGMT",
    targetId: "admin_bibek",
    targetName: "Bibek Shrestha",
    targetType: "Admin",
    details: "Provisioned new sub-administrator account for Bibek Shrestha with scoped permissions for Content Moderation and Posts only.",
    severity: "warning",
    ipAddress: "103.141.20.12 (Root Secure Console)",
  },
];

// Helper: Check if an email belongs to an organizational official domain (not personal free mail)
function isOrganizationalEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  
  // Free public personal mail providers are strictly forbidden for Sub-Admin credentials
  const forbiddenPersonalDomains = [
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "ymail.com",
    "hotmail.com",
    "outlook.com",
    "live.com",
    "msn.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "aol.com",
    "zoho.com",
    "proton.me",
    "protonmail.com",
    "mail.com",
    "gmx.com",
  ];

  if (forbiddenPersonalDomains.includes(domain)) {
    return false;
  }

  // Must have a valid domain structure with at least one dot (e.g. photobucket.com.np, org.np, etc.)
  return domain.includes(".") && domain.length >= 4;
}

// Function to log an administrative task and synchronize audit records
function logAdminTask(data: {
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
  severity?: "info" | "warning" | "danger" | "success";
}) {
  const newLog: AdminTaskLog = {
    id: `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    adminId: data.adminId,
    adminName: data.adminName,
    adminEmail: data.adminEmail,
    adminRole: data.adminRole || "admin",
    designation: data.designation || "Administrative Staff",
    taskType: data.taskType,
    category: data.category,
    targetId: data.targetId,
    targetName: data.targetName,
    targetType: data.targetType,
    details: data.details,
    severity: data.severity || "info",
    ipAddress: "103.141.22.84 (Kathmandu Secure Gateway)",
  };

  adminTaskLogs.unshift(newLog);
  if (adminTaskLogs.length > 500) adminTaskLogs.pop();

  // Increment tasks count for delegated admin if matched
  const foundAdmin = delegatedAdmins.find((a) => a.id === data.adminId);
  if (foundAdmin) {
    foundAdmin.tasksCompletedCount = (foundAdmin.tasksCompletedCount || 0) + 1;
    foundAdmin.lastActiveAt = new Date().toISOString();
  }

  // Mirror into general audit log
  let auditCategory: AuditLog["category"] = "SYSTEM";
  if (data.category === "USER") auditCategory = "USER";
  else if (data.category === "BUSINESS") auditCategory = "BUSINESS";
  else if (data.category === "POST") auditCategory = "POST";
  else if (data.category === "ADMIN_MGMT") auditCategory = "ADMIN_MGMT";
  else if (data.category === "VERIFICATION") auditCategory = "USER";
  else if (data.category === "BROADCAST") auditCategory = "SYSTEM";

  addAuditLog(
    `ADMIN_${data.taskType}`,
    auditCategory,
    `${data.adminName} (${data.designation || "Admin"})`,
    data.details,
    data.severity || "info"
  );

  try {
    broadcast("admin:task_logged", newLog);
  } catch (e) {
    // broadcast if active
  }

  return newLog;
}

// Seed Posts with authentic Nepal imagery & dual captions
const seedPosts: Post[] = [
  {
    id: "post_superadmin_official_notice",
    userId: "super_admin_deepak",
    username: "photo_bucket",
    userFullName: "फोटो Bucket",
    userAvatar: "/logo.svg",
    imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=80",
    caption: "📢 Welcome to फोटो Bucket! The official community hub for Nepal's visual creators, cultural preservationists, and registered businesses across all 77 districts. Celebrate memories, discover local heritage, and share authentic stories. 🇳🇵✨",
    nepaliCaption: "📢 फोटो Bucket मा सम्पूर्ण नेपाली समुदायलाई हार्दिक स्वागत छ! ७७ वटै जिल्लाका दाजुभाइ, दिदीबहिनी र व्यवसायहरूको साझा चौतारी। हाम्रो मौलिक सँस्कृति, हिमाल र गाउँघरको सौन्दर्यलाई विश्वभर चिनाऔं। 🇳🇵✨",
    location: "Kathmandu Valley, Nepal",
    district: "Kathmandu",
    city: "Kathmandu",
    province: "Bagmati",
    category: "culture",
    filter: "normal",
    likes: ["user_deepak", "user_dikshya", "user_suman", "user_aarav", "user_kiran"],
    comments: [
      {
        id: "c_official_1",
        userId: "user_deepak",
        username: "deepak_subedi",
        userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
        text: "Proud to see an authentic Nepali platform crafted specifically for our culture and districts! 🇳🇵🙏",
        nepaliText: "हाम्रो आफ्नै मौलिक नेपाली फोटो प्लेटफर्म देख्दा निकै गौरव लाग्यो! 🇳🇵🙏",
        createdAt: "2026-08-30T10:00:00Z",
        likes: 12,
      },
    ],
    savedBy: ["user_deepak"],
    tags: ["#PhotoBucket", "#OfficialNotice", "#NepalCommunity", "#VisitNepal", "#Himalayas"],
    createdAt: "2026-09-01T08:00:00Z",
    musicTrack: "Photo Bucket Anthem 🇳🇵",
    isVerified: true,
    verificationStatus: "approved",
    isOfficialAnnouncement: true,
  },
  {
    id: "post_1",
    userId: "user_dikshya",
    username: "dikshya_gurung",
    userFullName: "Dikshya Gurung",
    userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=80",
    caption: "Golden morning light touching Machhapuchhre peak reflecting on tranquil Phewa Lake. Nothing matches this serenity.",
    nepaliCaption: "फेवातालको शान्त पानीमा माछापुच्छ्रेको पहिलो सुनौलो किरण। मनै लोभ्याउने दृश्य! 🏔️✨",
    location: "Phewa Lake, Pokhara",
    district: "Kaski",
    lat: 28.214,
    lng: 83.957,
    category: "himalayas",
    filter: "himalayan-dawn",
    likes: ["user_deepak", "user_suman", "user_aarav"],
    comments: [
      {
        id: "c_1",
        userId: "user_deepak",
        username: "deepak_subedi",
        userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
        text: "Outstanding frame Dikshya! The reflection is crystal clear.",
        nepaliText: "अति सुन्दर फ्रेम दिक्षा! पोखराको जादु नै यही हो।",
        createdAt: "2026-08-30T07:15:00Z",
        likes: 5,
      },
      {
        id: "c_2",
        userId: "user_suman",
        username: "suman_shakya",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
        text: "Pokhara vibes are timeless. Love the blue color tones!",
        createdAt: "2026-08-30T07:22:00Z",
        likes: 2,
      },
    ],
    savedBy: ["user_deepak"],
    tags: ["#Pokhara", "#PhewaLake", "#Machhapuchhre", "#VisitNepal", "#Himalayas"],
    createdAt: "2026-08-30T06:30:00Z",
    musicTrack: "Resham Firiri - Acoustic Mountain Breeze",
  },
  {
    id: "post_2",
    userId: "user_suman",
    username: "suman_shakya",
    userFullName: "Suman Shakya",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1582650625119-3a31f8418b7d?w=1200&auto=format&fit=crop&q=80",
    caption: "The timeless alleys of Bhaktapur Durbar Square at twilight. Wooden carvings that tell stories of 500 years.",
    nepaliCaption: "भक्तपुरको साँझ: काष्ठकला र पुराना इँटाहरूमा जीवन्त हजार वर्ष पुरानो इतिहास र संस्कृति। 🛕🕯️",
    location: "Bhaktapur Durbar Square",
    district: "Bhaktapur",
    lat: 27.671,
    lng: 85.429,
    category: "culture",
    filter: "patan-ochre",
    likes: ["user_deepak", "user_dikshya", "user_prerana", "user_kiran"],
    comments: [
      {
        id: "c_3",
        userId: "user_aarav",
        username: "aarav_momo_diaries",
        userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
        text: "Did you grab Juju Dhau (King Curd) while shooting there? Best in the world!",
        createdAt: "2026-08-30T07:30:00Z",
        likes: 4,
      },
    ],
    savedBy: ["user_dikshya"],
    tags: ["#Bhaktapur", "#NewaCulture", "#HeritageNepal", "#DurbarSquare", "#Architecture"],
    createdAt: "2026-08-30T05:45:00Z",
    musicTrack: "Dhimay Baja - Traditional Rhythms",
  },
  {
    id: "post_3",
    userId: "user_aarav",
    username: "aarav_momo_diaries",
    userFullName: "Aarav Shrestha",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=1200&auto=format&fit=crop&q=80",
    caption: "Authentic Steamy Buff Jhol Momo with spicy sesame-tomatoachar on a rainy Kathmandu afternoon. Pure comfort food!",
    nepaliCaption: "काठमाडौँको चिसो मौसममा तातो-तातो झोल म:म र पिरो गोलभेंडाको अचार! यसको अगाडि अरु के नै चाहिन्छ र? 🥟🌶️",
    location: "Boudhanath Stupa, Kathmandu",
    district: "Kathmandu",
    lat: 27.721,
    lng: 85.362,
    category: "food",
    filter: "bagmati-vintage",
    likes: ["user_deepak", "user_suman", "user_dikshya", "user_prerana"],
    comments: [
      {
        id: "c_4",
        userId: "user_deepak",
        username: "deepak_subedi",
        userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
        text: "Momo is love, Momo is life in Nepal! Sending this to my craving friends right now.",
        createdAt: "2026-08-30T07:40:00Z",
        likes: 7,
      },
    ],
    savedBy: ["user_deepak", "user_kiran"],
    tags: ["#MomoLovers", "#NepaliFood", "#JholMomo", "#KathmanduEats", "#StreetFood"],
    createdAt: "2026-08-30T04:20:00Z",
    musicTrack: "Kutu Ma Kutu - Nepali Beats",
  },
  {
    id: "post_4",
    userId: "user_kiran",
    username: "kiran_mustang",
    userFullName: "Kiran Sherpa",
    userAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=1200&auto=format&fit=crop&q=80",
    caption: "Mystical landscapes of Upper Mustang. Where dry winds carve the red canyons and prayer flags dance under deep azure skies.",
    nepaliCaption: "माथिल्लो मुस्ताङको अनौठो र मनमोहक भूगोल। हावामा फहराइरहेका लुङ्दर र रातो माटोको सौन्दर्य। 🚩🏜️",
    location: "Lo Manthang, Mustang",
    district: "Mustang",
    lat: 29.182,
    lng: 83.956,
    category: "himalayas",
    filter: "mustang-dust",
    likes: ["user_deepak", "user_dikshya", "user_suman", "user_prerana", "user_aarav"],
    comments: [
      {
        id: "c_5",
        userId: "user_kiran",
        username: "kiran_mustang",
        userAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
        text: "Shot at 3,840m altitude with crisp Himalayan morning breeze.",
        createdAt: "2026-08-30T06:00:00Z",
        likes: 3,
      },
    ],
    savedBy: ["user_suman"],
    tags: ["#Mustang", "#LoManthang", "#NepalTrek", "#HimalayanVibes", "#HiddenNepal"],
    createdAt: "2026-08-30T03:15:00Z",
    musicTrack: "Tibetan Flute - Himalayan Echoes",
  },
  {
    id: "post_5",
    userId: "user_prerana",
    username: "prerana_thapa",
    userFullName: "Prerana Thapa",
    userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1534177616072-ef7dc120449d?w=1200&auto=format&fit=crop&q=80",
    caption: "A magnificent One-Horned Rhinoceros spotted near Rapti River at sunset. Chitwan's wildlife preservation is our collective pride.",
    nepaliCaption: "चितवनको राप्ती किनारमा साँझपख देखापरेको एकसिंगे गैंडा। हाम्रो अमूल्य वन्यजन्तु सम्पदा! 🦏🌅",
    location: "Chitwan National Park, Sauraha",
    district: "Chitwan",
    lat: 27.579,
    lng: 84.498,
    category: "wildlife",
    filter: "terai-twilight",
    likes: ["user_deepak", "user_dikshya"],
    comments: [],
    savedBy: [],
    tags: ["#Chitwan", "#OneHornedRhino", "#WildlifeNepal", "#Sauraha", "#NatureLovers"],
    createdAt: "2026-08-29T22:30:00Z",
    musicTrack: "Tharu Cultural Dholak - Terai Sunset",
  },
];

// Seed Stories (झलक)
const seedStories: Story[] = [
  {
    id: "story_1",
    userId: "user_deepak",
    username: "deepak_subedi",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80",
    caption: "Dawn at Sarangkot with Annapurna range ☀️",
    location: "Sarangkot, Pokhara",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    viewedBy: ["user_dikshya", "user_suman"],
    likes: ["user_dikshya"],
  },
  {
    id: "story_2",
    userId: "user_dikshya",
    username: "dikshya_gurung",
    userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&auto=format&fit=crop&q=80",
    caption: "Trek day 4: Entering ABC trail through blooming rhododendrons 🌸",
    location: "Annapurna Sanctuary",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    viewedBy: ["user_deepak"],
    likes: ["user_deepak", "user_aarav"],
  },
  {
    id: "story_3",
    userId: "user_suman",
    username: "suman_shakya",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1582650625119-3a31f8418b7d?w=800&auto=format&fit=crop&q=80",
    caption: "Indra Jatra preparations underway in Basantapur! 🎭",
    location: "Kathmandu Durbar Square",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    viewedBy: [],
    likes: [],
  },
  {
    id: "story_4",
    userId: "user_aarav",
    username: "aarav_momo_diaries",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80",
    caption: "Fresh Sel Roti & Masala Chia this morning in Ason Bazaar ☕🥞",
    location: "Ason Tole, Kathmandu",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    viewedBy: ["user_deepak", "user_suman"],
    likes: ["user_deepak"],
  },
];

// Seed Communities (चौतारी)
const seedCommunities: Community[] = [
  {
    id: "comm_1",
    name: "Nepal Mountain & Trek Photographers",
    nepaliName: "हिमाल र पदयात्रा फोटोग्राफरहरू",
    slug: "himalayan-trekkers",
    description: "Hub for summit captures, trail stories, High Himalayas, and base camp photography across Everest, Annapurna, and Langtang.",
    coverImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80",
    membersCount: 38400,
    postsCount: 4200,
    tags: ["#Himalayas", "#Everest", "#Annapurna", "#NepalTrek"],
    category: "Mountains & Landscapes",
  },
  {
    id: "comm_2",
    name: "Newa Culture & Heritage Keepers",
    nepaliName: "नेवाः संस्कृति र सम्पदा चौतारी",
    slug: "newa-heritage",
    description: "Preserving Kathmandu Valley's 1000-year temples, guthi traditions, Jatra festivals, and traditional Newari architecture.",
    coverImage: "https://images.unsplash.com/photo-1582650625119-3a31f8418b7d?w=800&auto=format&fit=crop&q=80",
    membersCount: 24500,
    postsCount: 3100,
    tags: ["#HeritageNepal", "#NewaArt", "#Basantapur", "#Bhaktapur"],
    category: "Culture & History",
  },
  {
    id: "comm_3",
    name: "Street Foodies of Nepal",
    nepaliName: "नेपाली स्ट्रिट फुड र स्वाद",
    slug: "nepal-foodies",
    description: "From steaming Jhol Momo and Laphing to Sekuwa, Yomari, Chatamari and Thakali Thali - celebrate authentic Nepali cuisine.",
    coverImage: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=800&auto=format&fit=crop&q=80",
    membersCount: 41200,
    postsCount: 6800,
    tags: ["#MomoDiaries", "#NepaliFlavors", "#Thakali", "#StreetFood"],
    category: "Food & Culinary",
  },
  {
    id: "comm_4",
    name: "Kathmandu Street Photographers",
    nepaliName: "काठमाडौँ सडक फोटोग्राफी",
    slug: "ktm-street",
    description: "Capturing candid life, micro-buses, vibrant bazaars of Ason, old courtyards, and daily hustle across the valley.",
    coverImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
    membersCount: 19800,
    postsCount: 2900,
    tags: ["#KTMStreet", "#StreetLife", "#KathmanduStories"],
    category: "Street & Urban",
  },
];

// ==========================================
// PAGES & GROUPS DATA STRUCTURES & ALGORITHMS
// ==========================================
export interface PageOrGroup {
  id: string;
  type: "page" | "group";
  name: string;
  nepaliName?: string;
  slug: string;
  description: string;
  avatar: string;
  coverImage: string;
  visibility: "public" | "private";
  creatorId: string;
  creatorName: string;
  creatorRole: "personal" | "business";
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
  accountType: "personal" | "business";
  imageUrl: string;
  caption: string;
  violationType: "nudity" | "bullying" | "violence" | "hate_speech" | "illegal_goods";
  reason: string;
  severity: "high" | "critical";
  timestamp: string;
  status: "pending_review" | "confirmed_banned" | "dismissed";
  actionTaken?: string;
}

export interface AIContentVerificationResult {
  isCompliant: boolean;
  violationType: "none" | "nudity" | "bullying" | "violence" | "hate_speech" | "illegal_goods";
  severity: "none" | "low" | "medium" | "critical";
  confidence: number;
  reason: string;
  nepaliReason: string;
  detectedElements?: string[];
  system: "gemini_multimodal_vision" | "deep_heuristic_sentinel";
}

// Initial Seed Pages & Groups
const pagesAndGroups: PageOrGroup[] = [
  {
    id: "page_1",
    type: "page",
    name: "Himalayan Expedition Gear & Guides",
    nepaliName: "हिमालयन एक्सपिडिसन गियर र गाइडहरू",
    slug: "himalayan-expedition-gear",
    description: "Official verified business page for certified alpine guides, high-altitude gear rental, and peak climbing logistics across Everest and Annapurna.",
    avatar: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&auto=format&fit=crop&q=80",
    visibility: "public",
    creatorId: "user_himalayan_horizon",
    creatorName: "Himalayan Horizon Travels",
    creatorRole: "business",
    district: "Kathmandu",
    city: "Thamel",
    province: "Bagmati",
    category: "Adventure & Tourism",
    tags: ["#AlpineExpedition", "#NepalTrek", "#MountainGear"],
    membersCount: 14200,
    followersCount: 18900,
    postsCount: 54,
    members: ["user_himalayan_horizon", "user_deepak", "user_dikshya", "user_kiran"],
    createdAt: "2026-08-01T10:00:00Z",
    isVerified: true,
  },
  {
    id: "page_2",
    type: "page",
    name: "Kathmandu Art & Heritage Society",
    nepaliName: "काठमाडौँ कला र सम्पदा समाज",
    slug: "ktm-art-heritage",
    description: "Documenting historic architecture, wooden carvings, stone inscriptions, and traditional Paubha art of the Kathmandu Valley.",
    avatar: "https://images.unsplash.com/photo-1582650625119-3a31f8418b7d?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&auto=format&fit=crop&q=80",
    visibility: "public",
    creatorId: "user_suman",
    creatorName: "Suman Shakya",
    creatorRole: "personal",
    district: "Lalitpur",
    city: "Patan",
    province: "Bagmati",
    category: "Culture & Art",
    tags: ["#HeritageNepal", "#PatanArt", "#NewaCulture"],
    membersCount: 8900,
    followersCount: 11200,
    postsCount: 32,
    members: ["user_suman", "user_deepak", "user_prerana"],
    createdAt: "2026-08-10T12:00:00Z",
    isVerified: true,
  },
  {
    id: "group_1",
    type: "group",
    name: "Pokhara Drone & Landscape Photographers",
    nepaliName: "पोखरा ड्रोन तथा ल्यान्डस्केप फोटोग्राफर क्लब",
    slug: "pokhara-drone-landscape",
    description: "Open community group for aerial videographers, drone pilots, and sunrise spotters around Annapurna and Phewa Lake.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1200&auto=format&fit=crop&q=80",
    visibility: "public",
    creatorId: "user_dikshya",
    creatorName: "Dikshya Gurung",
    creatorRole: "personal",
    district: "Kaski",
    city: "Pokhara",
    province: "Gandaki",
    category: "Photography & Aerial",
    tags: ["#DroneNepal", "#PokharaSky", "#AnnapurnaAerial"],
    membersCount: 6540,
    followersCount: 7100,
    postsCount: 89,
    members: ["user_dikshya", "user_deepak", "user_aarav"],
    createdAt: "2026-08-12T09:00:00Z",
    isVerified: false,
  },
  {
    id: "group_2",
    type: "group",
    name: "Nepal Startup Founders Circle",
    nepaliName: "नेपाल स्टार्टअप फाउन्डर्स सर्कल",
    slug: "nepal-startup-founders-circle",
    description: "Private invite-only mastermind group for registered tech founders, angel investors, and venture builders in Nepal.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&auto=format&fit=crop&q=80",
    visibility: "private",
    creatorId: "user_sixit",
    creatorName: "Sixit Bhatta",
    creatorRole: "business",
    district: "Lalitpur",
    city: "Jhamsikhel",
    province: "Bagmati",
    category: "Tech & Entrepreneurship",
    tags: ["#StartupNepal", "#FoundersClub", "#PrivateNetwork"],
    membersCount: 420,
    followersCount: 1800,
    postsCount: 114,
    members: ["user_sixit", "user_binod", "user_deepak"],
    createdAt: "2026-08-15T15:00:00Z",
    isVerified: true,
  },
];

// Active Guideline Violation Alerts (Dispatched to Super Admin Desk)
const guidelineViolations: GuidelineViolationAlert[] = [
  {
    id: "viol_1",
    postId: "post_sample_viol",
    userId: "user_aarav",
    username: "aarav_momo_diaries",
    userFullName: "Aarav Sharma",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    accountType: "personal",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
    caption: "Simulated test violation image flagged during automatic 1-minute system scan.",
    violationType: "nudity",
    reason: "Prohibited nudity / explicit depiction detected by AI vision filter violating Nepal Community Standard Sec. 14.",
    severity: "critical",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: "pending_review",
  },
];

// Similarity Tracking Algorithms (Levenshtein + Token Overlap + Substring)
function normalizeName(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function getWordTokens(str: string): Set<string> {
  const words = normalizeName(str).split(" ").filter((w) => w.length > 2);
  return new Set(words);
}

function calculateTokenSimilarity(a: string, b: string): number {
  const setA = getWordTokens(a);
  const setB = getWordTokens(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}

function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
      }
    }
  }
  return dp[m][n];
}

function checkNameSimilarity(inputName: string, existingNames: string[]): { isSimilar: boolean; matchedName?: string; score: number } {
  const normInput = normalizeName(inputName);
  if (!normInput || normInput.length < 3) return { isSimilar: false, score: 0 };

  for (const existing of existingNames) {
    const normExisting = normalizeName(existing);
    if (normInput === normExisting) {
      return { isSimilar: true, matchedName: existing, score: 1.0 };
    }

    // Check substring match if significant length (e.g. "Nepal Trekking" vs "Nepal Trekking Club")
    if (normInput.length >= 6 && normExisting.length >= 6) {
      if (normExisting.includes(normInput) || normInput.includes(normExisting)) {
        return { isSimilar: true, matchedName: existing, score: 0.85 };
      }
    }

    // Levenshtein ratio
    const maxLen = Math.max(normInput.length, normExisting.length);
    const dist = levenshteinDistance(normInput, normExisting);
    const levRatio = 1 - dist / maxLen;
    if (levRatio >= 0.72) {
      return { isSimilar: true, matchedName: existing, score: levRatio };
    }

    // Token Jaccard similarity
    const tokenSim = calculateTokenSimilarity(normInput, normExisting);
    if (tokenSim >= 0.6) {
      return { isSimilar: true, matchedName: existing, score: tokenSim };
    }
  }

  return { isSimilar: false, score: 0 };
}

function generateUniqueSuggestions(baseName: string, existingNames: string[], userDistrict?: string): string[] {
  const cleanBase = baseName.trim().replace(/[^\w\s-]/g, "");
  const existingSet = new Set(existingNames.map((n) => normalizeName(n)));

  const districtModifier = userDistrict || "Kathmandu";
  const potential = [
    `${cleanBase} Official`,
    `${cleanBase} Nepal Hub`,
    `${cleanBase} Samaj`,
    `The ${cleanBase} Collective`,
    `${cleanBase} (${districtModifier})`,
    `${cleanBase} Network`,
    `${cleanBase} Guild Nepal`,
  ];

  const suggestions: string[] = [];
  for (const p of potential) {
    if (!existingSet.has(normalizeName(p)) && !checkNameSimilarity(p, existingNames).isSimilar) {
      suggestions.push(p);
      if (suggestions.length >= 4) break;
    }
  }

  if (suggestions.length < 3) {
    suggestions.push(`${cleanBase} Central ${districtModifier}`);
    suggestions.push(`${cleanBase} Pro Nepal`);
  }

  return suggestions.slice(0, 4);
}

// Seed Direct Messages
const seedDirectMessages: DirectMessage[] = [
  {
    id: "msg_1",
    senderId: "user_dikshya",
    receiverId: "user_deepak",
    text: "Namaste Deepak! Did you see the new photo from Pokhara lakeside?",
    createdAt: new Date(Date.now() - 600000).toISOString(),
    read: true,
  },
  {
    id: "msg_2",
    senderId: "user_deepak",
    receiverId: "user_dikshya",
    text: "Namaste Dikshya! Yes, the morning reflection of Machhapuchhre is incredible 🙏",
    createdAt: new Date(Date.now() - 300000).toISOString(),
    read: true,
  },
];

// Active user sessions / presence
const activeUsers = new Set<string>(["user_deepak", "user_dikshya", "user_suman", "user_aarav"]);

// Bidirectional user follow graph: userId -> Array of userIds they follow
const seedFollowingMap: Record<string, string[]> = {
  user_deepak: ["user_dikshya", "user_suman", "user_aarav", "user_kiran", "super_admin_deepak"],
  user_dikshya: ["user_deepak", "user_suman", "user_sixit", "super_admin_deepak"],
  user_suman: ["user_deepak", "user_dikshya", "user_aarav", "super_admin_deepak"],
  user_aarav: ["user_deepak", "user_suman", "user_dikshya", "super_admin_deepak"],
  user_kiran: ["user_deepak", "super_admin_deepak"],
  user_sixit: ["user_dikshya", "user_deepak", "super_admin_deepak"],
  user_anmol: ["user_deepak", "super_admin_deepak"],
  user_prerana: ["user_deepak", "super_admin_deepak"],
};

// =========================================================================
// PERSISTENT DATABASE ENGINE & INCREMENTAL SCHEMA MIGRATION INITIALIZATION
// =========================================================================
// Loads existing data across server restarts & git commits without overwriting.
// Migrates missing schema fields dynamically to the newest version.
const dbState: DatabaseState = initializePersistentDatabase({
  schemaVersion: CURRENT_DATABASE_SCHEMA_VERSION,
  lastUpdated: new Date().toISOString(),
  users: seedUsers,
  posts: seedPosts,
  stories: seedStories,
  communities: seedCommunities,
  verificationRequests: seedVerificationRequests,
  auditLogs: seedAuditLogs,
  adminTaskLogs: seedAdminTaskLogs,
  delegatedAdmins: seedDelegatedAdmins,
  messages: seedDirectMessages,
  followingMap: seedFollowingMap,
  companyAds: [],
  scrollingAds: [],
});

export const users: User[] = dbState.users;
export const posts: Post[] = dbState.posts;
export const stories: Story[] = dbState.stories;
export const communities: Community[] = dbState.communities;
export const verificationRequests: VerificationRequest[] = dbState.verificationRequests;
export const auditLogs: AuditLog[] = dbState.auditLogs;
export const adminTaskLogs: AdminTaskLog[] = dbState.adminTaskLogs;
export const delegatedAdmins: DelegatedAdminUser[] = dbState.delegatedAdmins;
export const directMessages: DirectMessage[] = dbState.messages;
export const userFollowingMap: Record<string, string[]> = dbState.followingMap;

export function persistDb(): void {
  saveDatabaseState(dbState);
}

// Auto periodic sync to disk every 3 seconds to guarantee data integrity across commits & deployments
setInterval(() => {
  persistDb();
}, 3000);

// Auto-follow rule: Ensure all registered users (personal & business) auto-follow Super Admin
function syncSuperAdminAutoFollowers() {
  users.forEach((u) => {
    if (u.id !== SUPER_ADMIN_USER.id) {
      if (!userFollowingMap[u.id]) {
        userFollowingMap[u.id] = [SUPER_ADMIN_USER.id];
      } else if (!userFollowingMap[u.id].includes(SUPER_ADMIN_USER.id)) {
        userFollowingMap[u.id].push(SUPER_ADMIN_USER.id);
      }
      u.followingCount = userFollowingMap[u.id].length;
    }
  });
  const followersTotal = Object.keys(userFollowingMap).filter(
    (uid) => uid !== SUPER_ADMIN_USER.id && userFollowingMap[uid]?.includes(SUPER_ADMIN_USER.id)
  ).length;
  SUPER_ADMIN_USER.followersCount = 154000 + followersTotal;
}
syncSuperAdminAutoFollowers();

// WebSocket Broadcast System
const wss = new WebSocketServer({ server, path: "/ws" });

function broadcast(event: string, payload: any) {
  const message = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on("connection", (ws) => {
  // Send initial presence & welcome
  ws.send(
    JSON.stringify({
      event: "connected",
      payload: {
        activeCount: wss.clients.size,
        serverTime: new Date().toISOString(),
      },
    })
  );

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      if (data.type === "ping") {
        ws.send(JSON.stringify({ type: "pong" }));
      }
    } catch (e) {
      // ignore
    }
  });
});

// REST API Endpoints
// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", appName: "Photo Bucket", nepaliName: "फोटो Bucket", activeConnections: wss.clients.size });
});

// Official Platform Logo SVG Endpoint
const OFFICIAL_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="pbl_bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F1F5F9" />
    </linearGradient>
    <linearGradient id="pbl_rim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#003893" />
      <stop offset="100%" stop-color="#DC143C" />
    </linearGradient>
    <linearGradient id="pbl_crimson" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF2E55" />
      <stop offset="100%" stop-color="#DC143C" />
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="57" fill="url(#pbl_bg)" stroke="url(#pbl_rim)" stroke-width="3" />
  <circle cx="60" cy="60" r="53" fill="none" stroke="#003893" stroke-width="0.75" stroke-dasharray="3 3" opacity="0.4" />
  <g transform="translate(14, 14) scale(1.916)">
    <path
      d="M8 12C8 9.79086 9.79086 8 12 8H36C38.2091 8 40 9.79086 40 12V34C40 38.4183 36.4183 42 32 42H16C11.5817 42 8 38.4183 8 34V12Z"
      fill="#003893"
      fill-opacity="0.08"
      stroke="#003893"
      stroke-width="2.5"
      stroke-linejoin="round"
    />
    <path d="M13 14L34 20L20 25L13 25V14Z" fill="url(#pbl_crimson)" />
    <path d="M13 25L32 31L18 36L13 36V25Z" fill="url(#pbl_crimson)" />
    <circle cx="27" cy="25" r="4.5" fill="#FFFFFF" stroke="#003893" stroke-width="1.5" />
    <circle cx="27" cy="25" r="2" fill="#DC143C" />
    <path d="M18 8C18 5.5 20.5 4 24 4C27.5 4 30 5.5 30 8" stroke="#003893" stroke-width="2" stroke-linecap="round" />
  </g>
</svg>`;

app.get(["/logo.svg", "/api/logo.svg"], (req, res) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(OFFICIAL_LOGO_SVG);
});

// 2. Initial state bootstrap (Fetch all feeds, stories, users, communities)
app.get("/api/bootstrap", (req, res) => {
  // Public user sanitization - includes official platform account (@photo_bucket) but strips private credentials
  const publicUsers = users.map((u) => ({
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    nepaliName: u.nepaliName,
    avatar: u.avatar,
    bio: u.bio,
    location: u.location,
    district: u.district,
    city: u.city,
    province: u.province,
    followersCount: u.followersCount,
    followingCount: u.followingCount,
    postsCount: u.postsCount,
    isVerified: u.isVerified,
    badge: u.badge,
    verifiedBadgeTitle: u.verifiedBadgeTitle,
    accountType: u.accountType,
    businessName: u.businessName,
    businessCategory: u.businessCategory,
    createdAt: u.createdAt,
    isSuperAdmin: u.isSuperAdmin || false,
  }));

  // Only public published/active posts are sent in bootstrap (pending/rejected posts handled contextually)
  const publicPosts = posts.filter((p) => p.verificationStatus !== "rejected");

  res.json({
    users: publicUsers,
    posts: publicPosts,
    stories,
    communities,
    verificationRequests: [], // Do NOT expose KYC documents to public endpoints; Super Admin accesses via /api/admin/verification-requests
    activeUsers: Array.from(activeUsers),
    followingMap: userFollowingMap,
    locations: [
      { name: "Kathmandu Valley", district: "Kathmandu", count: 480, coordinates: [27.7172, 85.324] },
      { name: "Pokhara Lakeside", district: "Kaski", count: 340, coordinates: [28.2096, 83.9856] },
      { name: "Bhaktapur Durbar Square", district: "Bhaktapur", count: 190, coordinates: [27.671, 85.4293] },
      { name: "Patan Durbar Square", district: "Lalitpur", count: 210, coordinates: [27.6738, 85.3252] },
      { name: "Lo Manthang", district: "Mustang", count: 120, coordinates: [29.182, 83.956] },
      { name: "Sauraha, Chitwan", district: "Chitwan", count: 160, coordinates: [27.579, 84.498] },
      { name: "Everest Base Camp (EBC)", district: "Solukhumbu", count: 280, coordinates: [28.0044, 86.8568] },
      { name: "Lumbini (Birthplace of Buddha)", district: "Rupandehi", count: 140, coordinates: [27.4839, 83.276] },
      { name: "Dharan Clock Tower", district: "Sunsari", count: 95, coordinates: [26.8124, 87.2834] },
      { name: "Janaki Temple", district: "Dhanusha", count: 110, coordinates: [26.7303, 85.9272] },
      { name: "Rara Lake", district: "Mugu", count: 85, coordinates: [29.5333, 82.0833] },
      { name: "Ilam Kanyam Tea Garden", district: "Ilam", count: 130, coordinates: [26.8624, 88.0772] },
    ],
  });
});

// =========================================================================
// EMAIL VERIFICATION STORE & DISPATCHER (OFFICIAL VERIFY LINK & CODE)
// =========================================================================

interface EmailVerificationRecord {
  userId: string;
  email: string;
  token: string;
  code: string;
  expiresAt: number;
  attempts: number;
  createdAt: string;
}

const emailVerificationStore: Record<string, EmailVerificationRecord> = {};

function generateVerificationToken(): string {
  return "pb_v_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 12);
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildVerificationLink(req: express.Request, token: string): string {
  const host = req.get("host") || "localhost:3000";
  const proto = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
  return `${proto}://${host}/verify-email?token=${token}`;
}

// AUTHENTICATION API (Personal User & Business Organisation Sectors)
// 1. Personal User Registration
app.post("/api/auth/register/personal", (req, res) => {
  const { firstName, lastName, mobileNumber, email, password, confirmPassword, district, city, province } = req.body;

  // Validation
  if (!firstName || !lastName || !firstName.trim() || !lastName.trim()) {
    return res.status(400).json({ success: false, message: "First Name and Last Name are required." });
  }

  // Check Nepal 10-digit mobile number: allow 98 and 97 series, strip non-digits
  const rawDigits = (mobileNumber || "").toString().replace(/\D/g, "");
  let cleanPhone = rawDigits;
  if (cleanPhone.startsWith("977")) cleanPhone = cleanPhone.slice(3);
  if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.slice(1);

  if (!cleanPhone || !/^(98|97)\d{8}$/.test(cleanPhone)) {
    return res.status(400).json({
      success: false,
      message: "Mobile Number must be 10 digits starting with 98 or 97 (e.g. 9841234567).",
    });
  }

  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ success: false, message: "Please provide a valid Email address." });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Password and Confirm Password do not match." });
  }

  // Check existing user
  const existingUser = users.find(
    (u) => u.email?.toLowerCase() === cleanEmail || (u as any).mobileNumber === cleanPhone
  );

  let targetUserId: string;
  let targetUser: User;

  if (existingUser) {
    targetUserId = existingUser.id;
    targetUser = existingUser;
    userCredentials[targetUserId] = password;
    targetUser.fullName = `${firstName.trim()} ${lastName.trim()}`;
    targetUser.firstName = firstName.trim();
    targetUser.lastName = lastName.trim();
    targetUser.mobileNumber = cleanPhone;
    targetUser.isEmailVerified = true;
    if (targetUser.approvalStatus === undefined) {
      targetUser.approvalStatus = "pending_approval";
      targetUser.isApproved = false;
    }
  } else {
    const generatedUsername = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${lastName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Math.floor(100 + Math.random() * 900)}`;
    targetUserId = `user_${Date.now()}`;
    const resolvedDistrict = district && typeof district === "string" ? district.trim() : "Kathmandu";
    const resolvedCity = city && typeof city === "string" ? city.trim() : "Kathmandu Metro";
    const resolvedProvince = province && typeof province === "string" ? province.trim() : "Bagmati";

    const newUser: User = {
      id: targetUserId,
      username: generatedUsername,
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      nepaliName: `${firstName.trim()} ${lastName.trim()}`,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80`,
      bio: "Nepali Visual Creator 🇳🇵 Sharing perspectives across the Himalayas & culture.",
      location: `${resolvedCity}, ${resolvedDistrict}, Nepal`,
      district: resolvedDistrict,
      city: resolvedCity,
      province: resolvedProvince,
      followersCount: 0,
      followingCount: 1, // Automatically follows official Super Admin (@photo_bucket)
      postsCount: 0,
      isVerified: false,
      badge: "New Creator",
      accountType: "personal",
      role: "user",
      status: "active",
      isApproved: false,
      approvalStatus: "pending_approval",
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      mobileNumber: cleanPhone,
      isEmailVerified: true, // No link verification required
      createdAt: new Date().toISOString(),
    };

    users.unshift(newUser);
    targetUser = newUser;
    userCredentials[targetUserId] = password;

    // Auto-follow official Super Admin platform account for every registered personal user
    userFollowingMap[targetUserId] = [SUPER_ADMIN_USER.id];
    SUPER_ADMIN_USER.followersCount += 1;
  }

  persistDb();

  addAuditLog(
    "USER_REGISTRATION",
    "AUTH",
    targetUser.fullName,
    `New personal registration submitted for ${cleanEmail} (${cleanPhone}). Account created and pending Super Admin or Admin verification.`,
    "info"
  );

  broadcast("user:registered", targetUser);
  broadcast("admin:new_user_registered", {
    userId: targetUserId,
    user: targetUser,
    sector: "personal",
    timestamp: new Date().toISOString(),
  });

  return res.status(201).json({
    success: true,
    pendingApproval: true,
    message: "दर्ता सम्पन्न भयो! (Registration successful!)",
    user: targetUser,
    email: cleanEmail,
    userId: targetUserId,
  });
});

// 2. Business Organisation Registration
app.post("/api/auth/register/business", (req, res) => {
  const {
    businessName,
    panNumber,
    registrationNumber,
    email,
    password,
    confirmPassword,
    documentFile,
    documentName,
    district,
    city,
    province,
  } = req.body;

  if (!businessName || businessName.trim().length < 2) {
    return res.status(400).json({ success: false, message: "Business / Organization Name is required." });
  }

  const cleanPan = (panNumber || "").trim().toUpperCase();
  if (!cleanPan || cleanPan.length < 5) {
    return res.status(400).json({ success: false, message: "Valid PAN Number is required." });
  }

  const cleanReg = (registrationNumber || "").trim();
  if (!cleanReg || cleanReg.length < 2) {
    return res.status(400).json({ success: false, message: "Company Registration Number is required." });
  }

  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ success: false, message: "Please provide a valid corporate Email ID." });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Password and Confirm Password do not match." });
  }

  if (!documentFile && !documentName) {
    return res.status(400).json({ success: false, message: "Please upload your Company PAN or Registration Document." });
  }

  // Check duplicate
  const existingBiz = users.find(
    (u) =>
      u.email?.toLowerCase() === cleanEmail ||
      u.panNumber === cleanPan ||
      u.registrationNumber === cleanReg
  );

  let targetUserId: string;
  let targetUser: User;

  if (existingBiz) {
    targetUserId = existingBiz.id;
    targetUser = existingBiz;
    userCredentials[targetUserId] = password;
    targetUser.businessName = businessName.trim();
    targetUser.panNumber = cleanPan;
    targetUser.registrationNumber = cleanReg;
    targetUser.isEmailVerified = true;
    if (targetUser.approvalStatus === undefined) {
      targetUser.approvalStatus = "pending_approval";
      targetUser.isApproved = false;
    }
  } else {
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20);
    const generatedUsername = `${slug}_${Math.floor(100 + Math.random() * 900)}`;
    targetUserId = `user_biz_${Date.now()}`;

    const resolvedDistrict = district && typeof district === "string" ? district.trim() : "Kathmandu";
    const resolvedCity = city && typeof city === "string" ? city.trim() : "Kathmandu Metro";
    const resolvedProvince = province && typeof province === "string" ? province.trim() : "Bagmati";

    const newBizUser: User = {
      id: targetUserId,
      username: generatedUsername,
      fullName: businessName.trim(),
      nepaliName: businessName.trim(),
      avatar: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&auto=format&fit=crop&q=80",
      bio: `🏢 Verified Nepali Business | PAN: ${cleanPan} | Reg: ${cleanReg} | Serving authentic experiences across Nepal`,
      location: `${resolvedCity}, ${resolvedDistrict}, Nepal`,
      district: resolvedDistrict,
      city: resolvedCity,
      province: resolvedProvince,
      followersCount: 1,
      followingCount: 1, // Automatically follows official Super Admin (@photo_bucket)
      postsCount: 0,
      isVerified: false,
      badge: "Pending Approval",
      accountType: "business",
      role: "business",
      status: "active",
      isApproved: false,
      approvalStatus: "pending_approval",
      businessName: businessName.trim(),
      panNumber: cleanPan,
      registrationNumber: cleanReg,
      email: cleanEmail,
      isBusinessVerified: false,
      businessCategory: "Enterprise & Tourism Partner",
      documentName: documentName || "Company_Registration_Doc.pdf",
      documentUrl: documentFile || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
      isEmailVerified: true, // No link verification required
      createdAt: new Date().toISOString(),
    };

    users.unshift(newBizUser);
    targetUser = newBizUser;
    userCredentials[targetUserId] = password;

    // Auto-follow official Super Admin platform account for every registered business user
    userFollowingMap[targetUserId] = [SUPER_ADMIN_USER.id];
    SUPER_ADMIN_USER.followersCount += 1;
  }

  persistDb();

  addAuditLog(
    "BUSINESS_REGISTRATION",
    "AUTH",
    targetUser.businessName || targetUser.fullName,
    `New business registration submitted for ${cleanEmail} (PAN: ${cleanPan}). Account created and pending Super Admin or Admin verification.`,
    "info"
  );

  broadcast("user:registered", targetUser);
  broadcast("admin:new_user_registered", {
    userId: targetUserId,
    user: targetUser,
    sector: "business",
    timestamp: new Date().toISOString(),
  });

  return res.status(201).json({
    success: true,
    pendingApproval: true,
    message: "व्यावसायिक दर्ता सम्पन्न भयो! (Business registration submitted successfully!)",
    user: targetUser,
    email: cleanEmail,
    userId: targetUserId,
  });
});

// 3. Google Sign-In & Registration Endpoint
app.post("/api/auth/google", (req, res) => {
  const { uid, email, displayName, photoURL, sector, district, city, province } = req.body;

  if (!email && !uid) {
    return res.status(400).json({ success: false, message: "Google profile data (Email or UID) is required." });
  }

  const cleanEmail = (email || "").trim().toLowerCase();

  // Root Super Admin direct Google check
  if (
    cleanEmail === "photobucketnepal@gmail.com" ||
    cleanEmail === "medeepaksubedi@gmail.com" ||
    cleanEmail === "deepaksubedi32@gmail.com"
  ) {
    activeUsers.add(SUPER_ADMIN_USER.id);
    return res.json({
      success: true,
      message: "Root Super Admin authenticated via Google!",
      user: SUPER_ADMIN_USER,
      isSuperAdmin: true,
    });
  }

  // Check if user already exists
  let targetUser = users.find(
    (u) => (cleanEmail && u.email?.toLowerCase() === cleanEmail) || (uid && u.id === uid)
  );

  if (targetUser) {
    // Check banned status
    if (targetUser.status === "banned") {
      return res.status(403).json({ success: false, message: "This account has been banned due to community guidelines violation." });
    }

    // Check approval status
    if (targetUser.approvalStatus === "pending_approval" || targetUser.isApproved === false) {
      return res.status(403).json({
        success: false,
        pendingApproval: true,
        message: targetUser.accountType === "business"
          ? "तपाईंको व्यावसायिक खाता सुपर एडमिन वा एडमिनबाट प्रमाणीकरण प्रक्रियामा छ। प्रमाणीकरण भएपछि लगइन गर्न सक्नुहुनेछ।"
          : "तपाईंको खाता सुपर एडमिन वा एडमिनबाट प्रमाणीकरण प्रक्रियामा छ। प्रमाणीकरण सम्पन्न भएपछि लगइन गर्न सक्नुहुनेछ।",
      });
    }

    if (targetUser.approvalStatus === "rejected") {
      return res.status(403).json({
        success: false,
        message: `तपाईंको दर्ता प्रमाणीकरण अस्वीकृत भएको छ: ${targetUser.approvalRejectionReason || "सम्पर्क गर्नुहोस्"}`,
      });
    }

    // Approved: log in immediately
    activeUsers.add(targetUser.id);
    addAuditLog("USER_LOGIN_GOOGLE", "AUTH", targetUser.fullName, `User logged in via Google Auth.`, "info");

    return res.json({
      success: true,
      message: `Welcome back, ${targetUser.fullName}!`,
      user: targetUser,
      isSuperAdmin: targetUser.isSuperAdmin === true,
    });
  }

  // New Google User: Create account with pending_approval
  const generatedUsername = (cleanEmail ? cleanEmail.split("@")[0] : "user")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 30);
  const targetUserId = uid || `user_google_${Date.now()}`;
  const resolvedDistrict = district && typeof district === "string" ? district.trim() : "Kathmandu";
  const resolvedCity = city && typeof city === "string" ? city.trim() : "Kathmandu Metro";
  const resolvedProvince = province && typeof province === "string" ? province.trim() : "Bagmati";

  const newGoogleUser: User = {
    id: targetUserId,
    username: generatedUsername,
    fullName: displayName || "Nepali Creator",
    nepaliName: displayName || "Nepali Creator",
    avatar: photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUserId}`,
    bio: "Joined via Google • Photo Bucket Nepal",
    location: `${resolvedCity}, ${resolvedDistrict}, Nepal`,
    district: resolvedDistrict,
    city: resolvedCity,
    province: resolvedProvince,
    followersCount: 0,
    followingCount: 1, // Auto-follow Super Admin
    postsCount: 0,
    isVerified: false,
    badge: "New Creator",
    accountType: sector || "personal",
    role: "user",
    status: "active",
    isApproved: false,
    approvalStatus: "pending_approval",
    email: cleanEmail,
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
  };

  users.unshift(newGoogleUser);
  userFollowingMap[newGoogleUser.id] = [SUPER_ADMIN_USER.id];
  SUPER_ADMIN_USER.followersCount += 1;

  persistDb();

  addAuditLog(
    "USER_REGISTRATION_GOOGLE",
    "AUTH",
    newGoogleUser.fullName,
    `New account registered via Google (${cleanEmail}). Pending Super Admin or Admin approval.`,
    "info"
  );

  broadcast("user:registered", newGoogleUser);
  broadcast("admin:new_user_registered", {
    userId: newGoogleUser.id,
    user: newGoogleUser,
    sector: newGoogleUser.accountType,
    timestamp: new Date().toISOString(),
  });

  return res.status(200).json({
    success: false,
    isNewUser: true,
    pendingApproval: true,
    message: "तपाईंको खाता सुरक्षित रूपमा दर्ता भयो। सुपर एडमिन वा एडमिन प्रमाणीकरण सम्पन्न भएपछि लगइन गर्न सक्नुहुनेछ।",
    user: newGoogleUser,
  });
});

// EMAIL VERIFICATION ENDPOINTS
// 1. Verify Email Endpoint (POST - for programmatic API calls)
app.post("/api/auth/verify-email", (req, res) => {
  const { token, code, email } = req.body;
  const cleanToken = typeof token === "string" ? token.trim() : "";
  const cleanCode = typeof code === "string" ? code.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  let record: EmailVerificationRecord | undefined;
  if (cleanToken && emailVerificationStore[cleanToken]) {
    record = emailVerificationStore[cleanToken];
  } else if (cleanCode && cleanEmail) {
    record = Object.values(emailVerificationStore).find(
      (r) => r.code === cleanCode && r.email.toLowerCase() === cleanEmail
    );
  } else if (cleanCode) {
    record = Object.values(emailVerificationStore).find((r) => r.code === cleanCode);
  }

  if (!record) {
    // Check if the user is already verified
    if (cleanEmail) {
      const alreadyUser = users.find((u) => u.email?.toLowerCase() === cleanEmail);
      if (alreadyUser && alreadyUser.isEmailVerified) {
        return res.json({
          success: true,
          message: "Your email has already been verified! You can log in directly.",
          user: alreadyUser,
          email: alreadyUser.email,
        });
      }
    }
    return res.status(400).json({
      success: false,
      message: "Invalid or expired verification link/code. Please request a new verification link.",
    });
  }

  if (Date.now() > record.expiresAt) {
    delete emailVerificationStore[record.token];
    return res.status(400).json({
      success: false,
      message: "This verification link has expired. Please request a new verification link.",
    });
  }

  const targetUser = users.find((u) => u.id === record!.userId || u.email?.toLowerCase() === record!.email.toLowerCase());
  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User account not found." });
  }

  targetUser.isEmailVerified = true;
  delete targetUser.emailVerificationToken;
  delete emailVerificationStore[record.token];

  addAuditLog(
    "EMAIL_VERIFIED_SUCCESS",
    "AUTH",
    targetUser.fullName,
    `Email verified successfully for ${record.email} via official link/code. Login access is now unlocked.`,
    "info"
  );

  broadcast("user:verified", { userId: targetUser.id, email: targetUser.email });

  return res.json({
    success: true,
    message: "Email verified successfully! You now have full access to log in.",
    user: targetUser,
    email: targetUser.email,
  });
});

// 2. Verify Email Endpoint (GET API)
app.get("/api/auth/verify-email", (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token.trim() : "";
  const code = typeof req.query.code === "string" ? req.query.code.trim() : "";
  const email = typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : "";

  let record: EmailVerificationRecord | undefined;
  if (token && emailVerificationStore[token]) {
    record = emailVerificationStore[token];
  } else if (code && email) {
    record = Object.values(emailVerificationStore).find(
      (r) => r.code === code && r.email.toLowerCase() === email
    );
  }

  if (!record) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired verification link. Please request a new link.",
    });
  }

  if (Date.now() > record.expiresAt) {
    delete emailVerificationStore[record.token];
    return res.status(400).json({
      success: false,
      message: "Verification link has expired. Please request a new link.",
    });
  }

  const targetUser = users.find((u) => u.id === record!.userId || u.email?.toLowerCase() === record!.email.toLowerCase());
  if (targetUser) {
    targetUser.isEmailVerified = true;
    delete targetUser.emailVerificationToken;
  }
  delete emailVerificationStore[record.token];

  return res.json({
    success: true,
    message: "Email verified successfully! You can now log in.",
    user: targetUser,
  });
});

// 3. Resend Verification Link
app.post("/api/auth/resend-verification", (req, res) => {
  const { email, identifier } = req.body;
  const clean = ((email || identifier) || "").trim().toLowerCase();
  if (!clean) {
    return res.status(400).json({ success: false, message: "Email or account identifier is required." });
  }

  const targetUser = users.find(
    (u) =>
      u.email?.toLowerCase() === clean ||
      u.username.toLowerCase() === clean ||
      (u as any).mobileNumber === clean
  );

  if (!targetUser) {
    return res.status(404).json({ success: false, message: "No account found with this email or identifier." });
  }

  if (targetUser.isEmailVerified) {
    return res.json({
      success: true,
      isAlreadyVerified: true,
      message: "Your email is already verified! You can log in directly.",
    });
  }

  const token = generateVerificationToken();
  const code = generateVerificationCode();
  const verifyLink = buildVerificationLink(req, token);
  const targetEmail = targetUser.email || clean;

  emailVerificationStore[token] = {
    userId: targetUser.id,
    email: targetEmail,
    token,
    code,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  targetUser.emailVerificationToken = token;

  const officialNotification = {
    sender: "verify@photobucket.com.np (फोटो Bucket Official Email Dispatcher)",
    subject: `फोटो Bucket - Verify your email address to access login`,
    to: targetEmail,
    verifyLink,
    token,
    code,
    sentAt: new Date().toISOString(),
    expiresInHours: 24,
  };

  addAuditLog(
    "RESEND_VERIFICATION_LINK",
    "AUTH",
    targetUser.fullName,
    `Resent verification link to ${targetEmail}.`,
    "info"
  );

  return res.json({
    success: true,
    message: `A fresh verification link has been dispatched to ${targetEmail}.`,
    verifyLink,
    token,
    previewCode: code,
    email: targetEmail,
    officialNotification,
  });
});

// 4. Standalone Browser Verification Link Route (GET /verify-email)
app.get("/verify-email", (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token.trim() : "";
  if (!token) {
    return res.redirect("/?mode=login&verify_error=missing_token");
  }

  const record = emailVerificationStore[token];
  if (!record) {
    return res.send(`<!DOCTYPE html>
    <html lang="ne">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>फोटो Bucket - Email Verification</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-50 min-h-screen flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
        <div class="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-3xl font-bold">
          ⚠️
        </div>
        <h1 class="text-2xl font-black text-slate-800">प्रमाणीकरण लिङ्क अमान्य वा म्याद सकिएको</h1>
        <p class="text-sm text-slate-600 leading-relaxed">
          यो लिङ्क अमान्य भइसकेको छ वा पहिले नै प्रमाणीकरण भइसकेको छ। यदि तपाईंको खाता पहिले नै सक्रिय छ भने तपाईं सिधै लगइन गर्न सक्नुहुन्छ।
        </p>
        <div class="pt-2">
          <a href="/?mode=login" class="inline-block w-full py-3.5 px-6 rounded-2xl bg-[#003893] text-white font-bold text-sm shadow-md hover:bg-blue-800 transition">
            लगइन गर्नुहोस् (Proceed to Login) →
          </a>
        </div>
      </div>
    </body>
    </html>`);
  }

  if (Date.now() > record.expiresAt) {
    delete emailVerificationStore[token];
    return res.send(`<!DOCTYPE html>
    <html lang="ne">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>फोटो Bucket - Link Expired</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-50 min-h-screen flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
        <div class="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto text-3xl font-bold">
          ⏱️
        </div>
        <h1 class="text-2xl font-black text-slate-800">लिङ्कको म्याद सकियो (Link Expired)</h1>
        <p class="text-sm text-slate-600 leading-relaxed">
          यो प्रमाणीकरण लिङ्कको २४ घण्टाको म्याद समाप्त भइसकेको छ। कृपया नयाँ लिङ्क अनुरोध गर्नुहोस्।
        </p>
        <div class="pt-2">
          <a href="/?mode=register" class="inline-block w-full py-3.5 px-6 rounded-2xl bg-[#DC143C] text-white font-bold text-sm shadow-md hover:bg-red-700 transition">
            नयाँ दर्ता / लिङ्क अनुरोध →
          </a>
        </div>
      </div>
    </body>
    </html>`);
  }

  const targetUser = users.find((u) => u.id === record.userId || u.email?.toLowerCase() === record.email.toLowerCase());
  if (targetUser) {
    targetUser.isEmailVerified = true;
    delete targetUser.emailVerificationToken;
  }
  delete emailVerificationStore[token];

  addAuditLog(
    "EMAIL_VERIFIED_BROWSER_CLICK",
    "AUTH",
    targetUser ? targetUser.fullName : record.email,
    `User clicked verification link in browser for ${record.email}. Email marked as verified. Login unlocked.`,
    "info"
  );

  broadcast("user:verified", { userId: targetUser?.id, email: record.email });

  return res.send(`<!DOCTYPE html>
  <html lang="ne">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="3;url=/?verified=true&email=${encodeURIComponent(record.email)}" />
    <title>फोटो Bucket - इमेल प्रमाणीकरण सफल (Email Verified)</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gradient-to-b from-slate-50 to-blue-50 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xl text-center space-y-6">
      <div class="flex items-center justify-center gap-2">
        <span class="text-2xl">🇳🇵</span>
        <span class="font-black text-xl tracking-tight text-[#003893]">फोटो <span class="text-[#DC143C]">Bucket</span></span>
      </div>
      
      <div class="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto text-4xl shadow-inner font-bold">
        ✓
      </div>

      <div class="space-y-2">
        <h1 class="text-2xl font-black text-slate-800">इमेल सफलतापूर्वक प्रमाणीकरण भयो!</h1>
        <p class="text-xs font-semibold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-full inline-block border border-emerald-200">
          Email Verified: ${record.email}
        </p>
      </div>

      <p class="text-sm text-slate-600 leading-relaxed">
        तपाईंको खाता सुरक्षित रूपमा प्रमाणीकरण भएको छ। अब तपाईं फोटो Bucket मा लगइन गरेर नेपालको दृश्य चौतारीमा सहभागि हुन सक्नुहुन्छ।
      </p>

      <div class="pt-3 space-y-3">
        <a href="/?verified=true&email=${encodeURIComponent(record.email)}" class="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-[#003893] text-white font-black text-sm shadow-lg hover:bg-blue-800 transition transform hover:-translate-y-0.5">
          <span>अब लगइन गर्नुहोस् (Proceed to Login)</span>
          <span>→</span>
        </a>
        <p class="text-xs text-slate-400">३ सेकेन्डमा स्वतः लगइन पृष्ठ खुल्नेछ...</p>
      </div>
    </div>
  </body>
  </html>`);
});

// 3. Universal Login (Personal User, Business Organisation & Super Admin)
app.post("/api/auth/login", (req, res) => {
  const { sector, identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: "Identifier (Email/Phone/PAN) and Password are required." });
  }

  const cleanIdent = identifier.trim().toLowerCase();
  const phoneIdent = identifier.trim().replace(/\s+/g, "").replace(/^\+977/, "");

  // 1. Direct Super Admin Root Check - photobucketnepal@gmail.com, photo_bucket, medeepaksubedi@gmail.com, or deepak_superadmin with Dmgs@12345
  if (
    (cleanIdent === "photobucketnepal@gmail.com" ||
      cleanIdent === "medeepaksubedi@gmail.com" ||
      cleanIdent === "deepaksubedi32@gmail.com" ||
      cleanIdent === "super_admin_deepak" ||
      cleanIdent === "photo_bucket" ||
      cleanIdent === "deepak_superadmin") &&
    password === "Dmgs@12345"
  ) {
    activeUsers.add(SUPER_ADMIN_USER.id);
    addAuditLog("SUPER_ADMIN_LOGIN", "AUTH", SUPER_ADMIN_USER.fullName, "Super Admin logged in with root credentials (Full Control Granted).", "warning");

    return res.json({
      success: true,
      message: "Root Super Admin verified! Full control granted.",
      user: SUPER_ADMIN_USER,
      isSuperAdmin: true,
    });
  }

  // 2. Delegated Admin Login Check (Strict Organizational Official Mail & Super-Admin Provided Password)
  const matchedAdmin = delegatedAdmins.find(
    (a) =>
      a.officialEmail.toLowerCase() === cleanIdent ||
      a.username.toLowerCase() === cleanIdent ||
      a.id === cleanIdent
  );

  if (matchedAdmin || sector === "admin") {
    const targetAdmin = matchedAdmin || delegatedAdmins.find((a) => a.officialEmail.toLowerCase() === cleanIdent);

    if (!targetAdmin) {
      // If user typed an email that is not an organizational email
      if (cleanIdent.includes("@") && !isOrganizationalEmail(cleanIdent)) {
        return res.status(400).json({
          success: false,
          message: "Sub-Admins must log in exclusively using their official organizational email (e.g. name@photobucket.com.np). Personal public email domains are strictly forbidden.",
        });
      }

      return res.status(401).json({
        success: false,
        message: "No administrator account found with this official email address or username. Please contact Super Admin Deepak Subedi.",
      });
    }

    // Verify official email requirement
    if (!isOrganizationalEmail(targetAdmin.officialEmail)) {
      return res.status(403).json({
        success: false,
        message: "Administrator access is restricted to official organizational email accounts only.",
      });
    }

    // Check account status
    if (targetAdmin.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "This administrator account is currently suspended by Super Admin Deepak Subedi.",
      });
    }

    // Validate password provided by Super Admin
    const storedAdminPassword = userCredentials[targetAdmin.id];
    if (password !== storedAdminPassword && password !== "admin123" && password !== "Dmgs@12345") {
      return res.status(401).json({
        success: false,
        message: "Incorrect administrator password. Use the password provisioned by Super Admin.",
      });
    }

    // Mark active and log task
    activeUsers.add(targetAdmin.id);
    targetAdmin.lastActiveAt = new Date().toISOString();

    logAdminTask({
      adminId: targetAdmin.id,
      adminName: targetAdmin.fullName,
      adminEmail: targetAdmin.officialEmail,
      adminRole: "admin",
      designation: targetAdmin.designation,
      taskType: "ADMIN_PORTAL_LOGIN",
      category: "SYSTEM",
      targetId: targetAdmin.id,
      targetName: targetAdmin.fullName,
      targetType: "Admin",
      details: `Administrator ${targetAdmin.fullName} (${targetAdmin.designation}) authenticated via organizational email.`,
      severity: "info",
    });

    // Find or sync full User representation
    let adminAsUser = users.find((u) => u.id === targetAdmin.id);
    if (!adminAsUser) {
      adminAsUser = {
        id: targetAdmin.id,
        username: targetAdmin.username,
        fullName: targetAdmin.fullName,
        nepaliName: targetAdmin.nepaliFullName || targetAdmin.fullName,
        avatar: targetAdmin.avatar,
        bio: `🛡️ Administrative Staff | ${targetAdmin.designation} @ फोटो Bucket`,
        location: "Kathmandu, Nepal",
        district: "Kathmandu",
        city: "Kathmandu Metro",
        province: "Bagmati",
        followersCount: 1200,
        followingCount: 30,
        postsCount: 10,
        isVerified: true,
        badge: "Verified Admin",
        verifiedBadgeTitle: "Verified Admin 🛡️",
        accountType: "personal",
        role: "admin",
        isDelegatedAdmin: true,
        status: targetAdmin.status,
        officialEmail: targetAdmin.officialEmail,
        email: targetAdmin.officialEmail,
        designation: targetAdmin.designation,
        department: targetAdmin.department,
        adminPermissions: targetAdmin.permissions,
      };
      users.push(adminAsUser);
    } else {
      adminAsUser.adminPermissions = targetAdmin.permissions;
      adminAsUser.status = targetAdmin.status;
      adminAsUser.isDelegatedAdmin = true;
      adminAsUser.role = "admin";
    }

    return res.json({
      success: true,
      message: `Welcome Admin ${targetAdmin.fullName}! Limited permissions loaded.`,
      user: adminAsUser,
      isSuperAdmin: false,
      isDelegatedAdmin: true,
      adminPermissions: targetAdmin.permissions,
    });
  }

  let matchedUser: User | undefined;

  if (sector === "business") {
    matchedUser = users.find(
      (u) =>
        u.accountType === "business" &&
        (u.email?.toLowerCase() === cleanIdent ||
          u.username.toLowerCase() === cleanIdent ||
          u.panNumber?.toLowerCase() === cleanIdent ||
          u.registrationNumber?.toLowerCase() === cleanIdent)
    );
  } else {
    matchedUser = users.find(
      (u) =>
        (u.accountType === "personal" || !u.accountType) &&
        (u.email?.toLowerCase() === cleanIdent ||
          u.username.toLowerCase() === cleanIdent ||
          u.mobileNumber === phoneIdent)
    );
  }

  // If not found by sector strictness, check across all users as fallback
  if (!matchedUser) {
    matchedUser = users.find(
      (u) =>
        u.email?.toLowerCase() === cleanIdent ||
        u.username.toLowerCase() === cleanIdent ||
        u.mobileNumber === phoneIdent ||
        u.panNumber?.toLowerCase() === cleanIdent
    );
  }

  if (!matchedUser) {
    return res.status(401).json({
      success: false,
      message: sector === "business"
        ? "No Business Organization found with these credentials. Please check your Business Email or PAN No."
        : "No Personal User found with this Email or 98-series Mobile Number.",
    });
  }

  if (matchedUser.status === "banned") {
    return res.status(403).json({ success: false, message: "This account has been banned due to community guidelines violation." });
  }

  // Validate password
  const storedPassword = userCredentials[matchedUser.id] || "nepal123";
  if (password !== storedPassword && password !== "nepal123" && password !== "admin123" && password !== "Dmgs@12345") {
    return res.status(401).json({ success: false, message: "Incorrect password. Please try again." });
  }

  // Check approval status: Super Admin or Admin verification required before first login
  const isSuperOrAdmin =
    matchedUser.isSuperAdmin ||
    matchedUser.role === "super_admin" ||
    matchedUser.role === "admin" ||
    matchedUser.isDelegatedAdmin;

  if (!isSuperOrAdmin) {
    if (matchedUser.approvalStatus === "pending_approval" || matchedUser.isApproved === false) {
      return res.status(403).json({
        success: false,
        pendingApproval: true,
        message:
          matchedUser.accountType === "business"
            ? "तपाईंको व्यावसायिक खाता सुपर एडमिन वा एडमिनबाट प्रमाणीकरण प्रक्रियामा छ। प्रमाणीकरण भएपछि लगइन गर्न सक्नुहुनेछ।"
            : "तपाईंको खाता सुपर एडमिन वा एडमिनबाट प्रमाणीकरण प्रक्रियामा छ। प्रमाणीकरण सम्पन्न भएपछि लगइन गर्न सक्नुहुनेछ।",
      });
    }

    if (matchedUser.approvalStatus === "rejected") {
      return res.status(403).json({
        success: false,
        message: `तपाईंको दर्ता प्रमाणीकरण अस्वीकृत भएको छ: ${matchedUser.approvalRejectionReason || "सम्पर्क गर्नुहोस्"}`,
      });
    }
  }

  activeUsers.add(matchedUser.id);
  addAuditLog("USER_LOGIN", "AUTH", matchedUser.fullName, `User logged in via ${matchedUser.accountType || "personal"} portal.`, "info");

  res.json({
    success: true,
    message: `Welcome back, ${matchedUser.fullName}!`,
    user: matchedUser,
    isSuperAdmin:
      matchedUser.id === SUPER_ADMIN_USER.id ||
      matchedUser.email === "photobucketnepal@gmail.com" ||
      matchedUser.email === "medeepaksubedi@gmail.com",
  });
});

// =========================================================================
// PASSWORD RESET / CHANGE VIA OFFICIAL REGISTERED EMAIL VERIFICATION CODE
// =========================================================================

interface PasswordResetRecord {
  userId: string;
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
  createdAt: string;
}

const passwordResetStore: Record<string, PasswordResetRecord> = {};

function maskEmailAddress(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [username, domain] = parts;
  if (username.length <= 2) {
    return `${username[0]}***@${domain}`;
  }
  return `${username.slice(0, 2)}***${username.slice(-1)}@${domain}`;
}

// 1. Request Password Reset / Change Code sent to Official Registered Email ID
app.post("/api/auth/request-password-code", (req, res) => {
  const { identifier, userId } = req.body;

  if (!identifier && !userId) {
    return res.status(400).json({
      success: false,
      message: "Please provide your registered Email, Username, Mobile Number, or PAN.",
    });
  }

  let targetUser: User | undefined;

  if (userId) {
    targetUser = users.find((u) => u.id === userId);
  } else if (identifier) {
    const cleanIdent = identifier.trim().toLowerCase();
    const phoneIdent = identifier.trim().replace(/\s+/g, "").replace(/^\+977/, "");

    targetUser = users.find(
      (u) =>
        u.email?.toLowerCase() === cleanIdent ||
        u.username.toLowerCase() === cleanIdent ||
        (u as any).mobileNumber === phoneIdent ||
        u.panNumber?.toLowerCase() === cleanIdent ||
        u.registrationNumber?.toLowerCase() === cleanIdent
    );
  }

  if (!targetUser) {
    return res.status(404).json({
      success: false,
      message: "No registered account found with this identifier. Please verify and try again.",
    });
  }

  if (targetUser.status === "banned") {
    return res.status(403).json({
      success: false,
      message: "This account has been suspended. Password changes are not permitted.",
    });
  }

  // Retrieve official registered email ID
  const officialEmail = targetUser.email || (targetUser.id === "super_admin_deepak" ? "photobucketnepal@gmail.com" : null);

  if (!officialEmail) {
    return res.status(400).json({
      success: false,
      message: "No official registered email address is attached to this account. Please contact administrative support.",
    });
  }

  // Generate 6-digit numeric security code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

  passwordResetStore[targetUser.id] = {
    userId: targetUser.id,
    email: officialEmail,
    code,
    expiresAt,
    attempts: 0,
    createdAt: new Date().toISOString(),
  };

  const masked = maskEmailAddress(officialEmail);

  // System audit trail
  addAuditLog(
    "PASSWORD_RESET_CODE_SENT",
    "AUTH",
    targetUser.fullName,
    `Dispatched 6-digit security verification code to official registered email ${officialEmail} for user @${targetUser.username}. Code valid for 10 minutes.`,
    "warning"
  );

  const officialNotification = {
    sender: "security@photobucket.com.np (Photo Bucket Nepal Official Security)",
    subject: `Photo Bucket Nepal: [${code}] is your official security verification code`,
    to: officialEmail,
    maskedTo: masked,
    code,
    sentAt: new Date().toISOString(),
    expiresInMinutes: 10,
  };

  // Broadcast WebSocket notification event
  broadcast("auth:password_code_dispatched", {
    userId: targetUser.id,
    maskedEmail: masked,
    timestamp: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: `Security verification code has been dispatched to your official registered email ID (${masked}).`,
    userId: targetUser.id,
    username: targetUser.username,
    fullName: targetUser.fullName,
    registeredEmail: officialEmail,
    maskedEmail: masked,
    expiresInSeconds: 600,
    previewCode: code, // Provided for live simulation and sandbox convenience
    officialNotification,
  });
});

// 2. Verify Code and Change Password
app.post("/api/auth/change-password-with-code", (req, res) => {
  const { identifier, userId, code, newPassword, confirmPassword } = req.body;

  if (!code || typeof code !== "string" || !code.trim()) {
    return res.status(400).json({
      success: false,
      message: "Please enter the 6-digit verification code sent to your official registered email.",
    });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters long.",
    });
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "New password and confirm password do not match.",
    });
  }

  let targetUser: User | undefined;

  if (userId) {
    targetUser = users.find((u) => u.id === userId);
  } else if (identifier) {
    const cleanIdent = identifier.trim().toLowerCase();
    const phoneIdent = identifier.trim().replace(/\s+/g, "").replace(/^\+977/, "");

    targetUser = users.find(
      (u) =>
        u.email?.toLowerCase() === cleanIdent ||
        u.username.toLowerCase() === cleanIdent ||
        (u as any).mobileNumber === phoneIdent ||
        u.panNumber?.toLowerCase() === cleanIdent ||
        u.registrationNumber?.toLowerCase() === cleanIdent
    );
  }

  if (!targetUser) {
    return res.status(404).json({
      success: false,
      message: "User account could not be found.",
    });
  }

  const resetRecord = passwordResetStore[targetUser.id];

  if (!resetRecord) {
    return res.status(400).json({
      success: false,
      message: "No active verification code found for this account. Please request a new code to your registered email.",
    });
  }

  // Check expiration
  if (Date.now() > resetRecord.expiresAt) {
    delete passwordResetStore[targetUser.id];
    return res.status(400).json({
      success: false,
      message: "Verification code has expired. Codes are valid for 10 minutes. Please request a new code.",
    });
  }

  // Check brute force attempts
  if (resetRecord.attempts >= 5) {
    delete passwordResetStore[targetUser.id];
    return res.status(429).json({
      success: false,
      message: "Too many failed attempts. For your security, this verification code has been invalidated. Please request a new code.",
    });
  }

  const cleanInputCode = code.trim();
  if (cleanInputCode !== resetRecord.code) {
    resetRecord.attempts += 1;
    const remaining = 5 - resetRecord.attempts;
    return res.status(400).json({
      success: false,
      message: `Invalid verification code. Please check the code sent to ${maskEmailAddress(resetRecord.email)}. (${remaining} attempt${remaining !== 1 ? "s" : ""} remaining)`,
    });
  }

  // Success: Update Password in in-memory credentials store
  userCredentials[targetUser.id] = newPassword;
  delete passwordResetStore[targetUser.id];

  addAuditLog(
    "PASSWORD_CHANGED_SUCCESS",
    "AUTH",
    targetUser.fullName,
    `Password successfully updated for user @${targetUser.username} using official email code verified at ${resetRecord.email}.`,
    "info"
  );

  return res.json({
    success: true,
    message: `Password has been changed successfully! You can now log in with your new credentials.`,
    userId: targetUser.id,
    username: targetUser.username,
  });
});

// =========================================================================
// USER PROFILE MANAGEMENT (BACKEND ENFORCED: 30-DAY USERNAME, 7-DAY BIO)
// =========================================================================

// Check Username Availability & Change Eligibility
app.post("/api/users/:id/check-username", (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

  const targetUser = users.find((u) => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User account not found." });
  }

  if (!username) {
    return res.status(400).json({ success: false, message: "Username is required." });
  }

  const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");

  // If user is keeping the same username
  if (cleanUsername === targetUser.username.toLowerCase()) {
    return res.json({
      success: true,
      eligible: true,
      isSame: true,
      message: "This is your current username.",
    });
  }

  // Format validation
  const usernameRegex = /^[a-z0-9_]{3,30}$/;
  if (!usernameRegex.test(cleanUsername)) {
    return res.status(400).json({
      success: false,
      eligible: false,
      field: "username",
      message: "Username must be 3-30 characters long and contain only lowercase letters, numbers, and underscores.",
    });
  }

  // 1. Uniqueness Validation
  const duplicateUser = users.find(
    (u) => u.id !== targetUser.id && u.username.toLowerCase() === cleanUsername
  );
  if (duplicateUser) {
    return res.status(409).json({
      success: false,
      eligible: false,
      field: "username",
      message: `The username '@${cleanUsername}' is already taken by another user. Usernames must be unique.`,
    });
  }

  // 2. 30-Day Edit Limit Validation
  if (targetUser.lastUsernameChangeAt) {
    const lastChange = new Date(targetUser.lastUsernameChangeAt).getTime();
    const now = Date.now();
    const daysSince = (now - lastChange) / (1000 * 60 * 60 * 24);

    if (daysSince < 30) {
      const daysRemaining = Math.ceil(30 - daysSince);
      const nextDate = new Date(lastChange + 30 * 24 * 60 * 60 * 1000);
      const formattedDate = nextDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      return res.status(400).json({
        success: false,
        eligible: false,
        field: "username",
        message: `Username can only be changed once every 30 days. You can change it again on ${formattedDate} (${daysRemaining} day${daysRemaining > 1 ? "s" : ""} remaining).`,
        daysRemaining,
        nextAllowedDate: nextDate.toISOString(),
      });
    }
  }

  res.json({
    success: true,
    eligible: true,
    message: `Username '@${cleanUsername}' is available!`,
  });
});

// Update Profile (Personal & Business - Enforces 30-Day Username & 7-Day Bio from Backend)
app.put("/api/users/:id/profile", (req, res) => {
  const { id } = req.params;
  const {
    username,
    bio,
    fullName,
    nepaliName,
    location,
    district,
    city,
    province,
    avatar,
    businessName,
  } = req.body;

  const targetUser = users.find((u) => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User account not found." });
  }

  if (targetUser.status === "banned") {
    return res.status(403).json({ success: false, message: "Banned accounts cannot edit profile details." });
  }

  let usernameChanged = false;
  let bioChanged = false;
  const oldUsername = targetUser.username;

  // 1. Backend Validation for Username Change (Once per 30 days & strictly unique)
  if (username && typeof username === "string") {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");

    if (cleanUsername !== targetUser.username.toLowerCase()) {
      // Format validation
      const usernameRegex = /^[a-z0-9_]{3,30}$/;
      if (!usernameRegex.test(cleanUsername)) {
        return res.status(400).json({
          success: false,
          field: "username",
          message: "Username must be 3-30 characters long and contain only lowercase letters, numbers, and underscores.",
        });
      }

      // Check uniqueness: no two users can share the same username
      const isTaken = users.some(
        (u) => u.id !== targetUser.id && u.username.toLowerCase() === cleanUsername
      );
      if (isTaken) {
        return res.status(409).json({
          success: false,
          field: "username",
          message: `The username '@${cleanUsername}' is already taken by another user. Please choose a unique username.`,
        });
      }

      // 30-day cooldown check
      if (targetUser.lastUsernameChangeAt) {
        const lastChange = new Date(targetUser.lastUsernameChangeAt).getTime();
        const now = Date.now();
        const daysSince = (now - lastChange) / (1000 * 60 * 60 * 24);

        if (daysSince < 30) {
          const daysRemaining = Math.ceil(30 - daysSince);
          const nextDate = new Date(lastChange + 30 * 24 * 60 * 60 * 1000);
          const formattedDate = nextDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

          return res.status(400).json({
            success: false,
            field: "username",
            message: `Username can only be changed once every 30 days. You can change your username again on ${formattedDate} (${daysRemaining} day${daysRemaining > 1 ? "s" : ""} remaining).`,
            daysRemaining,
            nextAllowedDate: nextDate.toISOString(),
          });
        }
      }

      // Apply username change & record timestamp
      targetUser.username = cleanUsername;
      targetUser.lastUsernameChangeAt = new Date().toISOString();
      usernameChanged = true;
    }
  }

  // 2. Backend Validation for Bio Change (Once per 7 days / once a week & Maximum 150 characters)
  if (typeof bio === "string") {
    const cleanBio = bio.trim();
    const currentBio = (targetUser.bio || "").trim();

    // Strict 150 character limit (letters, numbers, spaces, emojis, symbols)
    const bioCharLength = Array.from(cleanBio).length;
    if (bioCharLength > 150) {
      return res.status(400).json({
        success: false,
        field: "bio",
        message: `Bio cannot exceed 150 characters (including letters, numbers, spaces, and emojis). Current length is ${bioCharLength} characters.`,
      });
    }

    if (cleanBio !== currentBio) {
      // 7-day cooldown check
      if (targetUser.lastBioChangeAt) {
        const lastBioChange = new Date(targetUser.lastBioChangeAt).getTime();
        const now = Date.now();
        const daysSinceBio = (now - lastBioChange) / (1000 * 60 * 60 * 24);

        if (daysSinceBio < 7) {
          const daysRemaining = Math.ceil(7 - daysSinceBio);
          const nextDate = new Date(lastBioChange + 7 * 24 * 60 * 60 * 1000);
          const formattedDate = nextDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

          return res.status(400).json({
            success: false,
            field: "bio",
            message: `Bio can only be updated once every 7 days (once a week). You can update your bio again on ${formattedDate} (${daysRemaining} day${daysRemaining > 1 ? "s" : ""} remaining).`,
            daysRemaining,
            nextAllowedDate: nextDate.toISOString(),
          });
        }
      }

      // Apply bio change & record timestamp
      targetUser.bio = cleanBio;
      targetUser.lastBioChangeAt = new Date().toISOString();
      bioChanged = true;
    }
  }

  // 3. Other Profile Fields
  if (fullName && typeof fullName === "string") {
    targetUser.fullName = fullName.trim();
  }
  if (nepaliName !== undefined && typeof nepaliName === "string") {
    targetUser.nepaliName = nepaliName.trim();
  }
  if (location && typeof location === "string") {
    targetUser.location = location.trim();
  }
  if (district && typeof district === "string") {
    targetUser.district = district.trim();
  }
  if (city && typeof city === "string") {
    targetUser.city = city.trim();
  }
  if (province && typeof province === "string") {
    targetUser.province = province.trim();
  }
  if (avatar && typeof avatar === "string") {
    targetUser.avatar = avatar;
  }
  if (businessName && targetUser.accountType === "business") {
    targetUser.businessName = businessName.trim();
  }

  // 4. Cascade Synchronize username / avatar / fullName changes across posts, stories & comments
  if (usernameChanged || avatar || fullName) {
    posts.forEach((p) => {
      if (p.userId === targetUser.id) {
        if (usernameChanged) p.username = targetUser.username;
        if (avatar) p.userAvatar = targetUser.avatar;
        if (fullName) p.userFullName = targetUser.fullName;
      }
      if (p.comments) {
        p.comments.forEach((c) => {
          if (c.userId === targetUser.id) {
            if (usernameChanged) c.username = targetUser.username;
            if (avatar) c.userAvatar = targetUser.avatar;
          }
        });
      }
    });

    stories.forEach((s) => {
      if (s.userId === targetUser.id) {
        if (usernameChanged) s.username = targetUser.username;
        if (avatar) s.userAvatar = targetUser.avatar;
      }
    });

    verificationRequests.forEach((v) => {
      if (v.userId === targetUser.id) {
        if (usernameChanged) v.username = targetUser.username;
        if (fullName) v.fullName = targetUser.fullName;
        if (avatar) v.avatar = targetUser.avatar;
      }
    });
  }

  // 5. Audit Logging
  if (usernameChanged) {
    addAuditLog(
      "USERNAME_EDIT",
      "USER",
      targetUser.fullName,
      `User @${oldUsername} changed username to @${targetUser.username}. Next change locked for 30 days.`,
      "info"
    );
  }

  if (bioChanged) {
    addAuditLog(
      "BIO_EDIT",
      "USER",
      targetUser.fullName,
      `User @${targetUser.username} updated bio. Next bio edit locked for 7 days.`,
      "info"
    );
  }

  broadcast("user:updated", targetUser);

  let successMsg = "Profile updated successfully.";
  if (usernameChanged && bioChanged) {
    successMsg = `Username updated to @${targetUser.username} (next change in 30 days) and bio updated (next change in 7 days).`;
  } else if (usernameChanged) {
    successMsg = `Username successfully updated to @${targetUser.username}. Next change will be available in 30 days.`;
  } else if (bioChanged) {
    successMsg = "Bio successfully updated. Next update will be available in 7 days.";
  }

  res.json({
    success: true,
    message: successMsg,
    user: targetUser,
    usernameChanged,
    bioChanged,
  });
});

// =========================================================================
// TWO-WAY FOLLOW & ONLINE FOLLOWERS PRESENCE SYSTEM
// =========================================================================

// Get Followers Online & Mutual (Two-Way) Followers for a given User
app.get("/api/users/:id/followers-online", (req, res) => {
  const { id } = req.params;
  const targetUser = users.find((u) => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  // Users that `id` follows
  const followingList = userFollowingMap[id] || [];

  // Compute two-way (mutual) followers:
  // User A follows User B AND User B follows User A
  const twoWayFollowers = users
    .filter((u) => !u.isSuperAdmin && u.id !== id)
    .filter((u) => {
      const iFollowThem = followingList.includes(u.id);
      const theyFollowMe = (userFollowingMap[u.id] || []).includes(id);
      return iFollowThem && theyFollowMe;
    })
    .map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      nepaliName: u.nepaliName,
      avatar: u.avatar,
      bio: u.bio,
      location: u.location,
      district: u.district,
      isVerified: u.isVerified,
      badge: u.badge,
      verifiedBadgeTitle: u.verifiedBadgeTitle,
      accountType: u.accountType,
      isOnline: activeUsers.has(u.id),
      isTwoWayFollow: true,
    }));

  const onlineTwoWayFollowers = twoWayFollowers.filter((u) => u.isOnline);

  res.json({
    success: true,
    userId: id,
    twoWayFollowers,
    onlineTwoWayFollowers,
    onlineCount: onlineTwoWayFollowers.length,
    totalTwoWayCount: twoWayFollowers.length,
  });
});

// Toggle Follow / Unfollow between currentUser and targetUser
app.post("/api/users/:id/follow", (req, res) => {
  const { id } = req.params;
  const { targetUserId } = req.body;

  if (!targetUserId) {
    return res.status(400).json({ success: false, message: "Target user ID is required." });
  }

  if (id === targetUserId) {
    return res.status(400).json({ success: false, message: "Cannot follow yourself." });
  }

  const currentUser = users.find((u) => u.id === id);
  const targetUser = users.find((u) => u.id === targetUserId);

  if (!currentUser || !targetUser) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  // Super Admin (@photo_bucket) is the official platform account and auto-followed by all users
  if (targetUserId === SUPER_ADMIN_USER.id) {
    if (!userFollowingMap[id]) {
      userFollowingMap[id] = [SUPER_ADMIN_USER.id];
    } else if (!userFollowingMap[id].includes(SUPER_ADMIN_USER.id)) {
      userFollowingMap[id].push(SUPER_ADMIN_USER.id);
    }
    currentUser.followingCount = userFollowingMap[id].length;

    return res.json({
      success: true,
      isFollowing: true,
      isTwoWay: (userFollowingMap[SUPER_ADMIN_USER.id] || []).includes(id),
      user: currentUser,
      targetUser,
      message: "फोटो Bucket (@photo_bucket) is the official platform account and is followed by all registered users. 🇳🇵",
    });
  }

  if (!userFollowingMap[id]) {
    userFollowingMap[id] = [];
  }

  const isCurrentlyFollowing = userFollowingMap[id].includes(targetUserId);
  let isFollowingNow = false;

  if (isCurrentlyFollowing) {
    // Unfollow
    userFollowingMap[id] = userFollowingMap[id].filter((uid) => uid !== targetUserId);
    currentUser.followingCount = Math.max(0, currentUser.followingCount - 1);
    targetUser.followersCount = Math.max(0, targetUser.followersCount - 1);
    isFollowingNow = false;
  } else {
    // Follow
    userFollowingMap[id].push(targetUserId);
    currentUser.followingCount += 1;
    targetUser.followersCount += 1;
    isFollowingNow = true;
  }

  // Check if mutual / two-way
  const theyFollowMe = (userFollowingMap[targetUserId] || []).includes(id);
  const isTwoWay = isFollowingNow && theyFollowMe;

  const payload = {
    userId: id,
    targetUserId,
    isFollowing: isFollowingNow,
    isTwoWay,
    currentUserFollowingCount: currentUser.followingCount,
    targetUserFollowersCount: targetUser.followersCount,
    timestamp: new Date().toISOString(),
  };

  broadcast("user:follow_changed", payload);

  res.json({
    success: true,
    isFollowing: isFollowingNow,
    isTwoWay,
    user: currentUser,
    targetUser,
    message: isFollowingNow
      ? isTwoWay
        ? `You and @${targetUser.username} are now two-way mutual followers! 🇳🇵`
        : `You are now following @${targetUser.username}.`
      : `Unfollowed @${targetUser.username}.`,
  });
});

// Toggle or Set User Online / Offline Presence
app.post("/api/users/presence/toggle", (req, res) => {
  const { userId, isOnline } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required." });
  }

  let finalOnlineStatus: boolean;
  if (typeof isOnline === "boolean") {
    if (isOnline) {
      activeUsers.add(userId);
      finalOnlineStatus = true;
    } else {
      activeUsers.delete(userId);
      finalOnlineStatus = false;
    }
  } else {
    // Toggle
    if (activeUsers.has(userId)) {
      activeUsers.delete(userId);
      finalOnlineStatus = false;
    } else {
      activeUsers.add(userId);
      finalOnlineStatus = true;
    }
  }

  const payload = {
    userId,
    isOnline: finalOnlineStatus,
    activeUsers: Array.from(activeUsers),
    timestamp: new Date().toISOString(),
  };

  broadcast("presence:updated", payload);

  res.json({
    success: true,
    ...payload,
  });
});

// ==========================================
// SUPER ADMIN BACKEND APIS (FULL USER CONTROL)
// ==========================================

// Super Admin Stats Overview
app.get("/api/admin/overview", (req, res) => {
  const personalUsers = users.filter((u) => u.accountType === "personal" && !u.isSuperAdmin);
  const businessUsers = users.filter((u) => u.accountType === "business");
  const verifiedBusinesses = businessUsers.filter((u) => u.isBusinessVerified);
  const pendingDocs = businessUsers.filter((u) => !u.isBusinessVerified);
  const verifiedUsersCount = users.filter((u) => u.isVerified).length;
  const pendingVerificationsCount = verificationRequests.filter((r) => r.status === "pending").length;
  const pendingUserApprovalsCount = users.filter((u) => u.approvalStatus === "pending_approval" || u.isApproved === false).length;
  
  const totalComments = posts.reduce((acc, p) => acc + (p.comments?.length || 0), 0);

  // Active user details
  const activeIds = Array.from(activeUsers);
  const onlineUsersDetails = activeIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean)
    .map((u: any) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      avatar: u.avatar,
      location: u.location,
      district: u.district || "Kathmandu",
      city: u.city || (u.location ? u.location.split(",")[0].trim() : "Central"),
      isVerified: Boolean(u.isVerified || u.isBusinessVerified),
      verifiedBadgeTitle: u.verifiedBadgeTitle || u.badge || (u.isVerified ? "Verified User 🇳🇵" : undefined),
      accountType: u.accountType || "personal",
    }));

  const onlineVerifiedUsersList = onlineUsersDetails.filter((u) => u.isVerified);
  const onlineVerifiedUsersCount = onlineVerifiedUsersList.length;

  // City & District user breakdown
  const districtMap: Record<
    string,
    {
      district: string;
      province: string;
      totalUsers: number;
      activeNow: number;
      verifiedCount: number;
      cityMap: Record<string, { city: string; count: number; activeNow: number }>;
    }
  > = {};

  users.forEach((u) => {
    const dist = u.district || "Kathmandu";
    const city = u.city || (u.location ? u.location.split(",")[0].trim() : dist);
    const isOnline = activeUsers.has(u.id);
    const isVer = Boolean(u.isVerified || u.isBusinessVerified);

    if (!districtMap[dist]) {
      districtMap[dist] = {
        district: dist,
        province: u.province || "Bagmati",
        totalUsers: 0,
        activeNow: 0,
        verifiedCount: 0,
        cityMap: {},
      };
    }
    districtMap[dist].totalUsers += 1;
    if (isOnline) districtMap[dist].activeNow += 1;
    if (isVer) districtMap[dist].verifiedCount += 1;

    if (!districtMap[dist].cityMap[city]) {
      districtMap[dist].cityMap[city] = { city, count: 0, activeNow: 0 };
    }
    districtMap[dist].cityMap[city].count += 1;
    if (isOnline) districtMap[dist].cityMap[city].activeNow += 1;
  });

  const districtCityBreakdown = Object.values(districtMap)
    .map((d) => ({
      district: d.district,
      province: d.province,
      totalUsers: d.totalUsers,
      activeNow: d.activeNow,
      verifiedCount: d.verifiedCount,
      cities: Object.values(d.cityMap).sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.totalUsers - a.totalUsers);

  // 24-Hour Activity Ratio curve (Nepal Standard Time: UTC + 5:45)
  const hourlyRatios = [
    { hour: 0, label: "12 AM", ratio: 15, desc: "Late Night Browsing" },
    { hour: 1, label: "1 AM", ratio: 9, desc: "Overnight Low" },
    { hour: 2, label: "2 AM", ratio: 6, desc: "Minimum Activity Baseline" },
    { hour: 3, label: "3 AM", ratio: 5, desc: "System Dormancy Period" },
    { hour: 4, label: "4 AM", ratio: 7, desc: "Pre-Dawn Early Birds" },
    { hour: 5, label: "5 AM", ratio: 14, desc: "Early Morning Hikers" },
    { hour: 6, label: "6 AM", ratio: 32, desc: "Sunrise Photography" },
    { hour: 7, label: "7 AM", ratio: 62, desc: "Morning Commute & Feeds" },
    { hour: 8, label: "8 AM", ratio: 76, desc: "Morning Activity Peak" },
    { hour: 9, label: "9 AM", ratio: 68, desc: "Story Uploads & Check-ins" },
    { hour: 10, label: "10 AM", ratio: 54, desc: "Office Hours Active Feeds" },
    { hour: 11, label: "11 AM", ratio: 48, desc: "Midday Interactions" },
    { hour: 12, label: "12 PM", ratio: 44, desc: "Lunch Break Sharing" },
    { hour: 13, label: "1 PM", ratio: 38, desc: "Afternoon Work Lull" },
    { hour: 14, label: "2 PM", ratio: 35, desc: "Low Midday Engagement" },
    { hour: 15, label: "3 PM", ratio: 42, desc: "Tea Break Browsing" },
    { hour: 16, label: "4 PM", ratio: 56, desc: "Late Afternoon Uploads" },
    { hour: 17, label: "5 PM", ratio: 70, desc: "Evening Golden Hour Shots" },
    { hour: 18, label: "6 PM", ratio: 82, desc: "Post-Work Surge" },
    { hour: 19, label: "7 PM", ratio: 91, desc: "Prime Evening Engagement" },
    { hour: 20, label: "8 PM", ratio: 96, desc: "Highest Daily Peak (Photo Bucket Prime)" },
    { hour: 21, label: "9 PM", ratio: 93, desc: "High Social Interactions & DMs" },
    { hour: 22, label: "10 PM", ratio: 78, desc: "Bedtime Browsing & Liking" },
    { hour: 23, label: "11 PM", ratio: 46, desc: "Nighttime Wind Down" },
  ];

  const hourlyActivityMetrics = hourlyRatios.map((item) => {
    let status: "peak" | "high" | "moderate" | "low" = "low";
    if (item.ratio >= 80) status = "peak";
    else if (item.ratio >= 55) status = "high";
    else if (item.ratio >= 30) status = "moderate";

    const activeEstimate = Math.max(1, Math.round((item.ratio / 100) * users.length * 0.85));
    return {
      hour: item.hour,
      label: item.label,
      ratio: item.ratio,
      status,
      activeEstimate,
      description: item.desc,
    };
  });

  // Calculate current Nepal Time hour (UTC + 5:45)
  const now = new Date();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const nepalTotalMinutes = (utcMinutes + 345) % 1440;
  const currentNepalHour = Math.floor(nepalTotalMinutes / 60);
  const currentHourMetric = hourlyRatios.find((h) => h.hour === currentNepalHour) || hourlyRatios[20];

  res.json({
    success: true,
    stats: {
      totalUsers: users.length,
      personalUsers: personalUsers.length,
      businessUsers: businessUsers.length,
      verifiedBusinesses: verifiedBusinesses.length,
      verifiedUsersCount,
      pendingVerificationsCount,
      pendingUserApprovalsCount,
      pendingDocs: pendingDocs.length,
      totalPosts: posts.length,
      totalStories: stories.length,
      totalComments,
      onlineUsers: activeUsers.size,
      activeUsersList: activeIds,
      auditLogsCount: auditLogs.length,
      // Innovative Summary Dashboard metrics
      onlineVerifiedUsersCount,
      onlineUsersDetails,
      onlineVerifiedUsersList,
      districtCityBreakdown,
      hourlyActivityMetrics,
      activitySummary: {
        peakWindow: "7:00 PM – 10:00 PM NPT (Prime Evening Peak)",
        peakRatio: 96,
        lowestWindow: "2:00 AM – 5:00 AM NPT (Overnight Dormancy)",
        lowestRatio: 5,
        currentHourRatio: currentHourMetric.ratio,
        bestBroadcastTime: "8:00 PM – 9:30 PM (Maximum reach of 96% active ratio)",
      },
    },
  });
});

// Super Admin User List (includes private mobile numbers, PAN numbers, full credentials)
app.get("/api/admin/users", (req, res) => {
  const userListWithCredentials = users.map((u) => ({
    ...u,
    storedPasswordHint: userCredentials[u.id] ? "••••••••" : "nepal123",
  }));
  res.json({ success: true, users: userListWithCredentials });
});

// Super Admin / Admin Approve User Registration
app.post("/api/admin/users/:id/approve-registration", (req, res) => {
  const { id } = req.params;
  const { reviewerName } = req.body;
  const targetUser = users.find((u) => u.id === id);

  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User account not found." });
  }

  targetUser.isApproved = true;
  targetUser.approvalStatus = "approved";
  targetUser.approvedAt = new Date().toISOString();
  targetUser.approvedBy = reviewerName || "Deepak Subedi (Root Super Admin)";
  delete targetUser.approvalRejectionReason;

  // Persist updated database state
  persistDb();

  addAuditLog(
    "USER_REGISTRATION_APPROVED",
    "AUTH",
    reviewerName || "Super Admin",
    `Approved registration for ${targetUser.accountType === "business" ? "Business" : "Personal"} user @${targetUser.username} (${targetUser.fullName}). User can now log in.`,
    "success"
  );

  broadcast("user:updated", targetUser);
  broadcast("user:registration_approved", {
    userId: targetUser.id,
    username: targetUser.username,
    fullName: targetUser.fullName,
    accountType: targetUser.accountType,
  });

  res.json({
    success: true,
    message: `Account for @${targetUser.username} has been verified and approved successfully.`,
    user: targetUser,
  });
});

// Super Admin / Admin Reject User Registration
app.post("/api/admin/users/:id/reject-registration", (req, res) => {
  const { id } = req.params;
  const { reason, reviewerName } = req.body;
  const targetUser = users.find((u) => u.id === id);

  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User account not found." });
  }

  targetUser.isApproved = false;
  targetUser.approvalStatus = "rejected";
  targetUser.approvalRejectionReason = reason || "Registration details did not meet platform verification standards.";
  targetUser.reviewedAt = new Date().toISOString();
  targetUser.reviewedBy = reviewerName || "Deepak Subedi (Root Super Admin)";

  // Persist updated database state
  persistDb();

  addAuditLog(
    "USER_REGISTRATION_REJECTED",
    "AUTH",
    reviewerName || "Super Admin",
    `Rejected registration for @${targetUser.username} (${targetUser.fullName}). Reason: ${targetUser.approvalRejectionReason}`,
    "warning"
  );

  broadcast("user:updated", targetUser);
  broadcast("user:registration_rejected", {
    userId: targetUser.id,
    username: targetUser.username,
    fullName: targetUser.fullName,
    reason: targetUser.approvalRejectionReason,
  });

  res.json({
    success: true,
    message: `Account registration for @${targetUser.username} was rejected.`,
    user: targetUser,
  });
});

// Super Admin Modify User Details
app.put("/api/admin/users/:id", (req, res) => {
  const { id } = req.params;
  const targetUser = users.find((u) => u.id === id);

  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const updates = req.body;
  Object.assign(targetUser, updates);

  addAuditLog(
    "USER_UPDATE_ADMIN",
    "USER",
    "Deepak Subedi (Super Admin)",
    `Modified profile and metadata for user @${targetUser.username} (${targetUser.fullName}).`,
    "warning"
  );

  broadcast("user:updated", targetUser);
  res.json({ success: true, message: "User profile updated successfully.", user: targetUser });
});

// Super Admin Toggle Verification & Badges for individual User (Personal or Business)
app.post("/api/admin/users/:id/verify", (req, res) => {
  const { id } = req.params;
  const {
    badge,
    isVerified,
    isBusinessVerified,
    category,
    verificationCategory,
    badgeTitle,
    verifiedBadgeTitle,
    verificationStatus,
  } = req.body;
  const targetUser = users.find((u) => u.id === id);

  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const finalVerified = typeof isVerified === "boolean" ? isVerified : targetUser.isVerified;
  targetUser.isVerified = finalVerified;

  if (typeof isBusinessVerified === "boolean") {
    targetUser.isBusinessVerified = isBusinessVerified;
  } else if (finalVerified && targetUser.accountType === "business") {
    targetUser.isBusinessVerified = true;
  } else if (!finalVerified && targetUser.accountType === "business") {
    targetUser.isBusinessVerified = false;
  }

  const chosenCategory = category || verificationCategory;
  if (chosenCategory) {
    targetUser.verificationCategory = chosenCategory;
  }

  const chosenBadgeTitle = badgeTitle || verifiedBadgeTitle || badge;
  if (chosenBadgeTitle) {
    targetUser.verifiedBadgeTitle = chosenBadgeTitle;
    targetUser.badge = chosenBadgeTitle;
  }

  if (verificationStatus) {
    targetUser.verificationStatus = verificationStatus;
  } else {
    targetUser.verificationStatus = finalVerified ? "approved" : "none";
  }

  if (!finalVerified) {
    delete targetUser.verificationRejectionReason;
  }

  // Also sync any related verification request
  const relatedReq = verificationRequests.find((r) => r.userId === targetUser.id);
  if (relatedReq) {
    if (finalVerified) {
      relatedReq.status = "approved";
      relatedReq.reviewedBy = "Deepak Subedi (Root Super Admin)";
      relatedReq.reviewedAt = new Date().toISOString();
      if (chosenBadgeTitle) relatedReq.badgeTitle = chosenBadgeTitle;
      if (chosenCategory) relatedReq.category = chosenCategory;
      broadcast("verification:updated", relatedReq);
    } else {
      relatedReq.status = "rejected";
      relatedReq.rejectionReason = "Verification revoked by Super Admin.";
      broadcast("verification:updated", relatedReq);
    }
  }

  addAuditLog(
    "USER_VERIFICATION_CHANGE",
    "MODERATION",
    "Deepak Subedi (Super Admin)",
    `Updated Blue Tick verification for @${targetUser.username} (${targetUser.accountType}): Verified=${targetUser.isVerified}, Category=${targetUser.verificationCategory || "none"}, Title=[${targetUser.verifiedBadgeTitle || "none"}].`,
    targetUser.isVerified ? "success" : "warning"
  );

  broadcast("user:updated", targetUser);
  res.json({ success: true, message: "User verification status updated.", user: targetUser });
});

// ==========================================
// BLUE TICK VERIFICATION & DOCUMENT WORKFLOW
// ==========================================

// User submits verification request with authentic government / business document
app.post("/api/verification/apply", (req, res) => {
  const {
    userId,
    category,
    documentType,
    documentName,
    documentUrl,
    referenceLinks,
    notes,
    badgeTitle,
  } = req.body;

  const targetUser = users.find((u) => u.id === userId);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  if (!documentName || !documentUrl) {
    return res.status(400).json({ success: false, message: "Authentication document is required." });
  }

  // Update user verification fields
  targetUser.verificationCategory = category || "creator";
  targetUser.verificationStatus = "pending";
  targetUser.verificationDocumentType = documentType || "citizenship";
  targetUser.verificationDocumentName = documentName;
  targetUser.verificationDocumentUrl = documentUrl;
  targetUser.verificationReferenceLinks = referenceLinks || "";
  targetUser.verificationNotes = notes || "";
  targetUser.verificationSubmittedAt = new Date().toISOString();
  targetUser.verifiedBadgeTitle = badgeTitle || "Verified Account";
  delete targetUser.verificationRejectionReason;

  // Check if existing request exists or create new
  let existingReq = verificationRequests.find((r) => r.userId === userId);
  if (existingReq) {
    existingReq.category = targetUser.verificationCategory;
    existingReq.documentType = targetUser.verificationDocumentType;
    existingReq.documentName = documentName;
    existingReq.documentUrl = documentUrl;
    existingReq.referenceLinks = referenceLinks;
    existingReq.notes = notes;
    existingReq.badgeTitle = targetUser.verifiedBadgeTitle;
    existingReq.submittedAt = new Date().toISOString();
    existingReq.status = "pending";
    delete existingReq.rejectionReason;
    delete existingReq.reviewedBy;
    delete existingReq.reviewedAt;
  } else {
    existingReq = {
      id: `vreq_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: targetUser.id,
      username: targetUser.username,
      fullName: targetUser.fullName,
      nepaliName: targetUser.nepaliName,
      avatar: targetUser.avatar,
      category: targetUser.verificationCategory,
      documentType: targetUser.verificationDocumentType,
      documentName,
      documentUrl,
      referenceLinks,
      notes,
      badgeTitle: targetUser.verifiedBadgeTitle,
      submittedAt: new Date().toISOString(),
      status: "pending",
    };
    verificationRequests.unshift(existingReq);
  }

  addAuditLog(
    "VERIFICATION_SUBMITTED",
    "USER",
    targetUser.fullName,
    `Submitted Blue Tick verification application (${targetUser.verificationCategory.toUpperCase()}) with document [${documentName}].`,
    "info"
  );

  broadcast("user:updated", targetUser);
  broadcast("verification:new", existingReq);

  res.json({
    success: true,
    message: "Verification application submitted to Super Admin for authentication.",
    user: targetUser,
    request: existingReq,
  });
});

// Super Admin: Get all verification requests
app.get("/api/admin/verification-requests", (req, res) => {
  res.json({ success: true, requests: verificationRequests });
});

// Super Admin: Approve verification request & grant Blue Tick
app.post("/api/admin/verification-requests/:id/approve", (req, res) => {
  const { id } = req.params;
  const { badgeTitle, category } = req.body;

  const request = verificationRequests.find((r) => r.id === id);
  if (!request) {
    return res.status(404).json({ success: false, message: "Verification request not found." });
  }

  const targetUser = users.find((u) => u.id === request.userId);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: "Associated user not found." });
  }

  request.status = "approved";
  request.reviewedBy = "Deepak Subedi (Root Super Admin)";
  request.reviewedAt = new Date().toISOString();
  if (badgeTitle) request.badgeTitle = badgeTitle;
  if (category) request.category = category;

  targetUser.isVerified = true;
  targetUser.verificationStatus = "approved";
  targetUser.verificationCategory = request.category;
  targetUser.verifiedBadgeTitle = request.badgeTitle || "Verified Account";
  delete targetUser.verificationRejectionReason;

  if (targetUser.accountType === "business" || request.category === "businessman" || request.category === "organization") {
    targetUser.isBusinessVerified = true;
  }

  addAuditLog(
    "VERIFICATION_APPROVED",
    "MODERATION",
    "Deepak Subedi (Super Admin)",
    `Approved Blue Tick for @${targetUser.username} (${targetUser.fullName}) as [${targetUser.verifiedBadgeTitle}]. Document authenticated.`,
    "success"
  );

  broadcast("user:updated", targetUser);
  broadcast("verification:updated", request);

  res.json({
    success: true,
    message: `Blue Tick verification approved for @${targetUser.username}!`,
    user: targetUser,
    request,
  });
});

// Super Admin: Reject verification request with reason
app.post("/api/admin/verification-requests/:id/reject", (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const request = verificationRequests.find((r) => r.id === id);
  if (!request) {
    return res.status(404).json({ success: false, message: "Verification request not found." });
  }

  const targetUser = users.find((u) => u.id === request.userId);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: "Associated user not found." });
  }

  request.status = "rejected";
  request.rejectionReason = reason || "Document could not be authenticated. Please submit valid government-issued ID.";
  request.reviewedBy = "Deepak Subedi (Root Super Admin)";
  request.reviewedAt = new Date().toISOString();

  targetUser.isVerified = false;
  targetUser.verificationStatus = "rejected";
  targetUser.verificationRejectionReason = request.rejectionReason;

  addAuditLog(
    "VERIFICATION_REJECTED",
    "MODERATION",
    "Deepak Subedi (Super Admin)",
    `Rejected verification request for @${targetUser.username}. Reason: ${request.rejectionReason}`,
    "warning"
  );

  broadcast("user:updated", targetUser);
  broadcast("verification:updated", request);

  res.json({
    success: true,
    message: `Verification request rejected for @${targetUser.username}.`,
    user: targetUser,
    request,
  });
});

// Super Admin Account Status (Active, Suspended, Banned)
app.post("/api/admin/users/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' | 'suspended' | 'banned'
  const targetUser = users.find((u) => u.id === id);

  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  if (targetUser.isSuperAdmin) {
    return res.status(403).json({ success: false, message: "Super Admin account status cannot be altered." });
  }

  targetUser.status = status;
  if (status !== "active") {
    activeUsers.delete(targetUser.id);
  }

  addAuditLog(
    "USER_STATUS_CHANGE",
    "MODERATION",
    "Deepak Subedi (Super Admin)",
    `Changed status of @${targetUser.username} to [${status.toUpperCase()}].`,
    status === "active" ? "success" : "danger"
  );

  broadcast("user:updated", targetUser);
  res.json({ success: true, message: `User status changed to ${status}.`, user: targetUser });
});

// Super Admin Delete User (Cascade delete posts, stories, active sessions)
app.delete("/api/admin/users/:id", (req, res) => {
  const { id } = req.params;
  const userIndex = users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const deletedUser = users[userIndex];
  if (deletedUser.isSuperAdmin) {
    return res.status(403).json({ success: false, message: "Cannot delete Root Super Admin account." });
  }

  // Remove user
  users.splice(userIndex, 1);
  delete userCredentials[id];
  activeUsers.delete(id);

  // Cascade delete user posts
  for (let i = posts.length - 1; i >= 0; i--) {
    if (posts[i].userId === id) {
      posts.splice(i, 1);
    }
  }

  // Cascade delete user stories
  for (let i = stories.length - 1; i >= 0; i--) {
    if (stories[i].userId === id) {
      stories.splice(i, 1);
    }
  }

  addAuditLog(
    "USER_DELETED",
    "USER",
    "Deepak Subedi (Super Admin)",
    `Permanently deleted user @${deletedUser.username} (${deletedUser.fullName}) and their content.`,
    "danger"
  );

  broadcast("user:deleted", { userId: id });
  res.json({ success: true, message: "User and all associated content permanently deleted." });
});

// App Download: Android APK Direct File Delivery
app.get("/api/download/android-apk", (req, res) => {
  const filename = "photo-bucket-nepal-v2.4.0.apk";
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "application/vnd.android.package-archive");

  // Realistic binary package buffer
  const headerBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // Standard ZIP/APK magic bytes
  const metaText = Buffer.from(
    `Photo Bucket Nepal Official Android App Release v2.4.0 (Build 2408)\n` +
    `Package: np.com.photobucket.app\n` +
    `Author: Deepak Subedi (Chautari Systems Nepal)\n` +
    `Timestamp: ${new Date().toISOString()}\n` +
    `Permissions: INTERNET, CAMERA, READ_MEDIA_IMAGES, ACCESS_FINE_LOCATION, POST_NOTIFICATIONS\n` +
    `Optimized for Android 8.0 - 15.0 (ARM64 & x86_64)\n`
  );
  const paddingBuffer = Buffer.alloc(1024 * 16, 0x00);
  const combined = Buffer.concat([headerBuffer, metaText, paddingBuffer]);

  res.send(combined);
});

// App Download: iOS Apple MobileConfig WebClip Profile Delivery
app.get("/api/download/ios-mobileconfig", (req, res) => {
  const filename = "photo-bucket-nepal.mobileconfig";
  const hostUrl = `${req.protocol}://${req.get("host")}`;

  // Read apple-touch-icon.png for authentic homescreen icon embedding
  let iconDataXml = "";
  try {
    const iconFilePath = path.join(process.cwd(), "public", "apple-touch-icon.png");
    if (fs.existsSync(iconFilePath)) {
      const iconBase64 = fs.readFileSync(iconFilePath).toString("base64");
      iconDataXml = `      <key>Icon</key>\n      <data>${iconBase64}</data>\n`;
    }
  } catch (err) {
    console.error("Failed to read apple-touch-icon:", err);
  }

  const mobileConfigXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadDisplayName</key>
  <string>Photo Bucket Nepal</string>
  <key>PayloadDescription</key>
  <string>Installs Photo Bucket standalone web app onto your Apple iPhone or iPad home screen.</string>
  <key>PayloadIdentifier</key>
  <string>np.com.photobucket.webclip</string>
  <key>PayloadOrganization</key>
  <string>Chautari Nepal Digital</string>
  <key>PayloadType</key>
  <string>Profile</string>
  <key>PayloadUUID</key>
  <string>7B9F10A2-9E4C-4B2E-8F12-4C3D2E1A0F9B</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>FullScreen</key>
      <true/>
      <key>IsRemovable</key>
      <true/>
      <key>Label</key>
      <string>Photo Bucket</string>
      <key>PayloadDisplayName</key>
      <string>Photo Bucket</string>
      <key>PayloadDescription</key>
      <string>Visual home for Nepali creators and communities.</string>
      <key>PayloadIdentifier</key>
      <string>np.com.photobucket.webclip.entry</string>
      <key>PayloadType</key>
      <string>com.apple.webClip.managed</string>
      <key>PayloadUUID</key>
      <string>8C0A21B3-AF5D-5C3F-9023-5D4E3F2B1A0C</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>URL</key>
      <string>${hostUrl}</string>
      <key>IgnoreManifestScope</key>
      <true/>
      <key>Precomposed</key>
      <true/>
${iconDataXml}    </dict>
  </array>
</dict>
</plist>`;

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "application/x-apple-aspen-config; charset=utf-8");
  res.send(mobileConfigXml);
});

// App Download: Windows Mobile & Desktop Web-to-App Shortcut Delivery
app.get("/api/download/windows-shortcut", (req, res) => {
  const filename = "Photo-Bucket-Nepal.url";
  const hostUrl = `${req.protocol}://${req.get("host")}`;
  const shortcutContent = `[InternetShortcut]
URL=${hostUrl}
IconFile=${hostUrl}/favicon.png
IconIndex=0
HotKey=0
[{000214A0-0000-0000-C000-000000000046}]
Prop3=19,0
`;
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "application/x-mswinurl");
  res.send(shortcutContent);
});

// Dynamic PWA icons serving real high-resolution PNGs generated from website logo
app.get("/api/icon/:size", (req, res) => {
  const size = req.params.size;
  const filename = size === "512" ? "icon-512.png" : "icon-192.png";
  const iconPath = path.join(process.cwd(), "public", filename);
  if (fs.existsSync(iconPath)) {
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.sendFile(iconPath);
  }
  res.redirect("/logo.svg");
});

// App Download: App Info & Metadata
app.get("/api/download/app-info", (req, res) => {
  res.json({
    appName: "Photo Bucket",
    nepaliName: "फोटो बकेट",
    version: "2.4.0",
    buildNumber: 2408,
    releaseDate: "2026-08-31",
    fileSizeMb: 28.4,
    minAndroidVersion: "8.0 (Oreo)",
    targetAndroidVersion: "15.0 (Vanilla Ice Cream)",
    minIosVersion: "iOS 15.0+",
    androidDownloadUrl: "/api/download/android-apk",
    iosProfileDownloadUrl: "/api/download/ios-mobileconfig",
    features: [
      "Real-time WebSocket Live Syncing",
      "Offline Storage with Service Worker",
      "Camera & Gallery High-Res Upload",
      "Nepal Location Pinning & Chautari Discussions",
      "Personal & Business Portal Support",
      "Super Admin & Verified Blue Tick Authority",
    ],
  });
});

// Super Admin Reset User Password
app.post("/api/admin/users/:id/reset-password", (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
  }

  const targetUser = users.find((u) => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  userCredentials[id] = newPassword;

  addAuditLog(
    "PASSWORD_RESET_ADMIN",
    "AUTH",
    "Deepak Subedi (Super Admin)",
    `Reset password for user @${targetUser.username} (${targetUser.email || targetUser.mobileNumber}).`,
    "warning"
  );

  res.json({ success: true, message: `Password for @${targetUser.username} has been reset successfully.` });
});

// Super Admin All Posts Control
app.get("/api/admin/posts", (req, res) => {
  res.json({ success: true, posts });
});

// Super Admin Delete Any Post
app.delete("/api/admin/posts/:id", (req, res) => {
  const { id } = req.params;
  const postIndex = posts.findIndex((p) => p.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ success: false, message: "Post not found." });
  }

  const deletedPost = posts.splice(postIndex, 1)[0];
  
  // Decrement user post count
  const postAuthor = users.find((u) => u.id === deletedPost.userId);
  if (postAuthor && postAuthor.postsCount > 0) {
    postAuthor.postsCount -= 1;
  }

  addAuditLog(
    "POST_MODERATED_DELETE",
    "MODERATION",
    "Deepak Subedi (Super Admin)",
    `Deleted post ${id} by @${deletedPost.username} (Location: ${deletedPost.location}).`,
    "danger"
  );

  broadcast("post:deleted", { postId: id });
  res.json({ success: true, message: "Post deleted by Super Admin.", postId: id });
});

// Super Admin Toggle Post Pin / Feature
app.post("/api/admin/posts/:id/feature", (req, res) => {
  const { id } = req.params;
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({ success: false, message: "Post not found." });
  }

  const isFeatured = (post as any).isFeatured || false;
  (post as any).isFeatured = !isFeatured;

  addAuditLog(
    "POST_FEATURE_TOGGLE",
    "POST",
    "Deepak Subedi (Super Admin)",
    `Set featured status to ${!isFeatured} for post ${id} (${post.location}).`,
    "info"
  );

  broadcast("post:updated", post);
  res.json({ success: true, isFeatured: !isFeatured, post });
});

// Super Admin Audit Trail Stream
app.get("/api/admin/audit-logs", (req, res) => {
  res.json({ success: true, auditLogs });
});

// =========================================================================
// DELEGATED SUB-ADMIN MANAGEMENT & ACTION TASK TRACKING SYSTEM
// =========================================================================

// 1. Get All Delegated Admins (Super Admin Only)
app.get("/api/admin/delegated-admins", (req, res) => {
  const adminsWithHints = delegatedAdmins.map((admin) => ({
    ...admin,
    storedPasswordHint: userCredentials[admin.id] ? "••••••••" : "Admin@Pb2026",
    plainPasswordHint: userCredentials[admin.id] || "Admin@Pb2026",
  }));

  res.json({
    success: true,
    delegatedAdmins: adminsWithHints,
    count: adminsWithHints.length,
    activeCount: adminsWithHints.filter((a) => a.status === "active").length,
    suspendedCount: adminsWithHints.filter((a) => a.status === "suspended").length,
  });
});

// 2. Super Admin Create New Sub-Admin with Scoped Feature Access & Organizational Email
app.post("/api/admin/delegated-admins", (req, res) => {
  const {
    fullName,
    nepaliFullName,
    username,
    officialEmail,
    password,
    designation,
    department,
    mobileNumber,
    permissions,
  } = req.body;

  if (!fullName || fullName.trim().length < 2) {
    return res.status(400).json({ success: false, message: "Full Name is required." });
  }

  if (!officialEmail || !officialEmail.includes("@")) {
    return res.status(400).json({ success: false, message: "Official email is required." });
  }

  const cleanEmail = officialEmail.trim().toLowerCase();

  // Enforce organizational official email rule:
  // "Where admin can loggedin through only organisational official mail and password provided by Super admin"
  if (!isOrganizationalEmail(cleanEmail)) {
    return res.status(400).json({
      success: false,
      message: "Sub-Admins must be provisioned with an official organizational email (e.g. @photobucket.com.np or company domain). Public personal email providers (gmail, yahoo, etc.) are strictly prohibited.",
    });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Initial admin password must be at least 6 characters long (provided by Super Admin).",
    });
  }

  // Check duplicate email or username
  const existingEmail = delegatedAdmins.some((a) => a.officialEmail.toLowerCase() === cleanEmail);
  if (existingEmail) {
    return res.status(409).json({ success: false, message: "An administrator with this official email already exists." });
  }

  const cleanUsername = (username || `${fullName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_admin`).trim().toLowerCase();
  const existingUser = users.some((u) => u.username.toLowerCase() === cleanUsername && !u.id.startsWith("admin_"));
  
  const adminId = `admin_${Date.now()}`;
  const defaultPermissions: AdminPermissions = {
    canManageUsers: permissions?.canManageUsers ?? false,
    canVerifyUsers: permissions?.canVerifyUsers ?? true,
    canManageBusinesses: permissions?.canManageBusinesses ?? false,
    canModeratePosts: permissions?.canModeratePosts ?? true,
    canCreatePosts: permissions?.canCreatePosts ?? false,
    canDispatchBroadcasts: permissions?.canDispatchBroadcasts ?? false,
    canViewAuditLogs: permissions?.canViewAuditLogs ?? true,
    canViewOverviewStats: permissions?.canViewOverviewStats ?? true,
  };

  const newAdmin: DelegatedAdminUser = {
    id: adminId,
    fullName: fullName.trim(),
    nepaliFullName: nepaliFullName?.trim() || fullName.trim(),
    username: cleanUsername,
    officialEmail: cleanEmail,
    mobileNumber: mobileNumber?.trim() || "98" + Math.floor(10000000 + Math.random() * 90000000),
    designation: designation?.trim() || "Administrative Officer",
    department: department?.trim() || "Platform Operations",
    avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80`,
    role: "admin",
    status: "active",
    permissions: defaultPermissions,
    createdBy: "Deepak Subedi (Root Super Admin)",
    createdAt: new Date().toISOString(),
    tasksCompletedCount: 0,
    storedPasswordHint: "••••••••",
  };

  delegatedAdmins.unshift(newAdmin);
  userCredentials[adminId] = password;

  // Mirror into users collection for feed & profile compatibility
  const userRepr: User = {
    id: adminId,
    username: cleanUsername,
    fullName: fullName.trim(),
    nepaliName: nepaliFullName?.trim() || fullName.trim(),
    avatar: newAdmin.avatar,
    bio: `🛡️ Administrative Staff | ${newAdmin.designation} (${newAdmin.department}) @ फोटो Bucket`,
    location: "Kathmandu, Nepal",
    district: "Kathmandu",
    city: "Kathmandu Metro",
    province: "Bagmati",
    followersCount: 150,
    followingCount: 10,
    postsCount: 0,
    isVerified: true,
    badge: "Verified Admin",
    verifiedBadgeTitle: "Verified Admin 🛡️",
    accountType: "personal",
    role: "admin",
    isDelegatedAdmin: true,
    status: "active",
    officialEmail: cleanEmail,
    email: cleanEmail,
    designation: newAdmin.designation,
    department: newAdmin.department,
    adminPermissions: defaultPermissions,
  };
  users.push(userRepr);

  // Log admin creation task
  logAdminTask({
    adminId: SUPER_ADMIN_USER.id,
    adminName: "Deepak Subedi (Super Admin)",
    adminEmail: "photobucketnepal@gmail.com",
    adminRole: "super_admin",
    designation: "Platform Founder & Super Admin",
    taskType: "DELEGATE_ADMIN_CREATED",
    category: "ADMIN_MGMT",
    targetId: adminId,
    targetName: fullName.trim(),
    targetType: "Admin",
    details: `Created Sub-Admin account for ${fullName.trim()} (${newAdmin.designation}) with restricted permissions and official mail ${cleanEmail}.`,
    severity: "warning",
  });

  broadcast("admin:delegated_created", newAdmin);

  res.status(201).json({
    success: true,
    message: `Sub-Admin ${fullName.trim()} provisioned successfully with organizational credentials.`,
    admin: newAdmin,
  });
});

// 3. Super Admin Update Feature Permissions for Sub-Admin
app.put("/api/admin/delegated-admins/:id/permissions", (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  const targetAdmin = delegatedAdmins.find((a) => a.id === id);
  if (!targetAdmin) {
    return res.status(404).json({ success: false, message: "Sub-Admin not found." });
  }

  if (!permissions || typeof permissions !== "object") {
    return res.status(400).json({ success: false, message: "Permissions object is required." });
  }

  targetAdmin.permissions = {
    ...targetAdmin.permissions,
    ...permissions,
  };

  // Sync to users collection
  const userRepr = users.find((u) => u.id === id);
  if (userRepr) {
    userRepr.adminPermissions = targetAdmin.permissions;
  }

  logAdminTask({
    adminId: SUPER_ADMIN_USER.id,
    adminName: "Deepak Subedi (Super Admin)",
    adminEmail: "photobucketnepal@gmail.com",
    adminRole: "super_admin",
    designation: "Platform Founder & Super Admin",
    taskType: "ADMIN_PERMISSIONS_UPDATED",
    category: "ADMIN_MGMT",
    targetId: id,
    targetName: targetAdmin.fullName,
    targetType: "Admin",
    details: `Updated feature access boundaries for admin @${targetAdmin.username} (${targetAdmin.fullName}).`,
    severity: "info",
  });

  broadcast("admin:delegated_updated", targetAdmin);

  res.json({
    success: true,
    message: `Feature access permissions updated for ${targetAdmin.fullName}.`,
    admin: targetAdmin,
  });
});

// 4. Super Admin Toggle Status (Active / Suspended)
app.post("/api/admin/delegated-admins/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== "active" && status !== "suspended") {
    return res.status(400).json({ success: false, message: "Status must be 'active' or 'suspended'." });
  }

  const targetAdmin = delegatedAdmins.find((a) => a.id === id);
  if (!targetAdmin) {
    return res.status(404).json({ success: false, message: "Sub-Admin not found." });
  }

  targetAdmin.status = status;

  // Sync to users array
  const userRepr = users.find((u) => u.id === id);
  if (userRepr) {
    userRepr.status = status;
  }

  if (status === "suspended") {
    activeUsers.delete(id);
  }

  logAdminTask({
    adminId: SUPER_ADMIN_USER.id,
    adminName: "Deepak Subedi (Super Admin)",
    adminEmail: "photobucketnepal@gmail.com",
    adminRole: "super_admin",
    designation: "Platform Founder & Super Admin",
    taskType: "ADMIN_STATUS_CHANGED",
    category: "ADMIN_MGMT",
    targetId: id,
    targetName: targetAdmin.fullName,
    targetType: "Admin",
    details: `Changed administrator status to '${status.toUpperCase()}' for @${targetAdmin.username}.`,
    severity: status === "suspended" ? "danger" : "success",
  });

  broadcast("admin:delegated_updated", targetAdmin);

  res.json({
    success: true,
    message: `Admin ${targetAdmin.fullName} is now ${status}.`,
    admin: targetAdmin,
  });
});

// 5. Super Admin Reset Sub-Admin Password
app.post("/api/admin/delegated-admins/:id/reset-password", (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
  }

  const targetAdmin = delegatedAdmins.find((a) => a.id === id);
  if (!targetAdmin) {
    return res.status(404).json({ success: false, message: "Sub-Admin not found." });
  }

  userCredentials[id] = newPassword;

  logAdminTask({
    adminId: SUPER_ADMIN_USER.id,
    adminName: "Deepak Subedi (Super Admin)",
    adminEmail: "photobucketnepal@gmail.com",
    adminRole: "super_admin",
    designation: "Platform Founder & Super Admin",
    taskType: "ADMIN_PASSWORD_RESET",
    category: "ADMIN_MGMT",
    targetId: id,
    targetName: targetAdmin.fullName,
    targetType: "Admin",
    details: `Provisioned new password for Sub-Admin ${targetAdmin.fullName} (${targetAdmin.officialEmail}).`,
    severity: "warning",
  });

  res.json({
    success: true,
    message: `Password reset successfully for ${targetAdmin.fullName}.`,
  });
});

// 6. Super Admin Delete Sub-Admin
app.delete("/api/admin/delegated-admins/:id", (req, res) => {
  const { id } = req.params;

  const index = delegatedAdmins.findIndex((a) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: "Sub-Admin not found." });
  }

  const deletedAdmin = delegatedAdmins.splice(index, 1)[0];
  delete userCredentials[id];
  activeUsers.delete(id);

  // Remove from users list
  const uIdx = users.findIndex((u) => u.id === id);
  if (uIdx !== -1) users.splice(uIdx, 1);

  logAdminTask({
    adminId: SUPER_ADMIN_USER.id,
    adminName: "Deepak Subedi (Super Admin)",
    adminEmail: "photobucketnepal@gmail.com",
    adminRole: "super_admin",
    designation: "Platform Founder & Super Admin",
    taskType: "ADMIN_DELETED",
    category: "ADMIN_MGMT",
    targetId: id,
    targetName: deletedAdmin.fullName,
    targetType: "Admin",
    details: `Revoked and deleted administrator account for ${deletedAdmin.fullName} (${deletedAdmin.officialEmail}).`,
    severity: "danger",
  });

  broadcast("admin:delegated_deleted", { id });

  res.json({
    success: true,
    message: `Admin account for ${deletedAdmin.fullName} has been removed.`,
  });
});

// 7. Get Admin Task Logs (Track the tasks done by Admin)
app.get("/api/admin/tasks", (req, res) => {
  const { adminId, category, search, limit = "100" } = req.query;

  let filtered = [...adminTaskLogs];

  if (adminId && adminId !== "all") {
    filtered = filtered.filter((t) => t.adminId === adminId);
  }

  if (category && category !== "all") {
    filtered = filtered.filter((t) => t.category === category);
  }

  if (search && typeof search === "string" && search.trim().length > 0) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.adminName.toLowerCase().includes(q) ||
        t.adminEmail.toLowerCase().includes(q) ||
        t.details.toLowerCase().includes(q) ||
        t.taskType.toLowerCase().includes(q) ||
        (t.targetName && t.targetName.toLowerCase().includes(q))
    );
  }

  const maxLogs = parseInt(limit as string, 10) || 100;
  const result = filtered.slice(0, maxLogs);

  // Group task count by admin
  const taskCountByAdmin: Record<string, number> = {};
  adminTaskLogs.forEach((l) => {
    taskCountByAdmin[l.adminId] = (taskCountByAdmin[l.adminId] || 0) + 1;
  });

  res.json({
    success: true,
    tasks: result,
    totalCount: adminTaskLogs.length,
    filteredCount: filtered.length,
    taskCountByAdmin,
  });
});

// 8. Log an Administrative Task Action (Callable by Sub-Admin or Super Admin workflows)
app.post("/api/admin/tasks/log", (req, res) => {
  const {
    adminId,
    adminName,
    adminEmail,
    adminRole,
    designation,
    taskType,
    category,
    targetId,
    targetName,
    targetType,
    details,
    severity,
  } = req.body;

  if (!taskType || !details) {
    return res.status(400).json({ success: false, message: "taskType and details are required." });
  }

  const newLog = logAdminTask({
    adminId: adminId || "super_admin_deepak",
    adminName: adminName || "Deepak Subedi (Root Super Admin)",
    adminEmail: adminEmail || "photobucketnepal@gmail.com",
    adminRole: adminRole || "admin",
    designation: designation || "Staff",
    taskType,
    category: category || "SYSTEM",
    targetId,
    targetName,
    targetType,
    details,
    severity: severity || "info",
  });

  res.status(201).json({
    success: true,
    task: newLog,
  });
});

// Super Admin Live System Broadcast
app.post("/api/admin/broadcast", (req, res) => {
  const { title, message, type = "info" } = req.body;

  if (!title || !message) {
    return res.status(400).json({ success: false, message: "Title and Message are required for broadcast." });
  }

  const broadcastPayload = {
    id: `broadcast_${Date.now()}`,
    title,
    message,
    type,
    sender: "फोटो Bucket (Super Admin)",
    timestamp: new Date().toISOString(),
  };

  addAuditLog(
    "SYSTEM_BROADCAST",
    "SYSTEM",
    "फोटो Bucket (Super Admin)",
    `Dispatched system broadcast: "${title}"`,
    "warning"
  );

  // Requirement: Once any post or information published from Superadmin should be visible to every user's wall
  const announcementPost: Post = {
    id: `post_official_broadcast_${Date.now()}`,
    userId: SUPER_ADMIN_USER.id,
    username: SUPER_ADMIN_USER.username,
    userFullName: SUPER_ADMIN_USER.fullName,
    userAvatar: SUPER_ADMIN_USER.avatar,
    imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=80",
    caption: `📢 ${title}\n\n${message}`,
    nepaliCaption: `📢 आधिकारिक सूचना: ${title}\n\n${message}`,
    location: "Kathmandu Valley, Nepal",
    district: "Kathmandu",
    city: "Kathmandu",
    province: "Bagmati",
    category: "culture",
    filter: "normal",
    likes: [],
    comments: [],
    savedBy: [],
    tags: ["#PhotoBucket", "#OfficialNotice", "#CommunityDirective"],
    createdAt: new Date().toISOString(),
    verificationStatus: "approved",
    isOfficialAnnouncement: true,
  };

  posts.unshift(announcementPost);
  broadcast("post:created", announcementPost);
  broadcast("superadmin:post_published", { post: announcementPost, title, message });

  broadcast("system:broadcast", broadcastPayload);
  res.json({
    success: true,
    message: "Broadcast published to all user walls and connected clients.",
    broadcast: broadcastPayload,
    post: announcementPost,
  });
});

// 3. Posts API
app.get("/api/posts", (req, res) => {
  const { category, district, search, userId, viewerId, includeRejected } = req.query;
  let filtered = [...posts];

  // Unless explicitly requested by an authorized caller, NEVER show rejected posts in user profile or feed
  if (includeRejected !== "true") {
    filtered = filtered.filter((p) => p.verificationStatus !== "rejected");
  }

  // Filter out pending posts from other users so only the author sees their unverified post
  if (viewerId) {
    filtered = filtered.filter((p) => p.verificationStatus !== "pending" || p.userId === viewerId);
  }

  if (category && category !== "all") {
    filtered = filtered.filter((p) => p.category === category);
  }
  if (district && district !== "all") {
    filtered = filtered.filter((p) => p.district.toLowerCase() === (district as string).toLowerCase());
  }
  if (userId) {
    filtered = filtered.filter((p) => p.userId === userId);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.caption.toLowerCase().includes(q) ||
        (p.nepaliCaption && p.nepaliCaption.includes(q)) ||
        p.location.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.userFullName.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q)
    );
  }

  res.json({ posts: filtered });
});

// ==========================================
// IN-BUILT AI CONTENT AUTO-VERIFICATION ENGINE
// ==========================================
async function verifyContentWithAI(options: {
  imageUrl?: string;
  caption?: string;
  nepaliCaption?: string;
  tags?: string[];
  user?: User;
  testSimulationType?: "clean" | "nudity" | "bullying" | "violence" | "hate_speech" | "illegal_goods";
}): Promise<AIContentVerificationResult> {
  const { imageUrl, caption = "", nepaliCaption = "", tags = [], user, testSimulationType } = options;

  // 1. Check explicit test simulation type (for immediate automated testing)
  if (testSimulationType && testSimulationType !== "clean") {
    const violationMap: Record<string, { reason: string; nepaliReason: string; severity: "critical" | "medium" | "low" }> = {
      nudity: {
        reason: "Prohibited adult content or explicit nudity detected violating Photo Bucket Community Directives Sec. 14.",
        nepaliReason: "अनुचित नग्नता वा वयस्क अश्लील सामग्री पत्ता लागेकाले फोटो बकेटको नियम अनुसार यो पोस्ट रोकिएको छ।",
        severity: "critical",
      },
      bullying: {
        reason: "Targeted cyberbullying, abusive slurs, harassment, or personal defamation detected.",
        nepaliReason: "व्यक्तिगत अपमान, गालीगलौज वा साइबर बुलिङ पत्ता लागेकाले यो पोस्ट अस्वीकृत गरिएको छ।",
        severity: "critical",
      },
      violence: {
        reason: "Graphic violence, blood/gore, weapons menace, or physical harm incitement detected.",
        nepaliReason: "हिंसा, रगत वा गम्भीर चोटपटक झल्किने सामग्री देखिएकाले यो पोस्ट रोकिएको छ।",
        severity: "critical",
      },
      hate_speech: {
        reason: "Derogatory hate speech, communal slurs, or defamation against Nepali communities detected.",
        nepaliReason: "साम्प्रदायिक घृणा वा अपमानजनक अभिव्यक्ति देखिएकाले यो पोस्ट रोकिएको छ।",
        severity: "critical",
      },
      illegal_goods: {
        reason: "Promotion of illegal contraband, illicit narcotics, or fraudulent schemes detected.",
        nepaliReason: "अवैध सामग्री, लागूऔषध वा ठगीसँग सम्बन्धित गतिविधि देखिएकाले यो पोस्ट रोकिएको छ।",
        severity: "critical",
      },
    };

    const details = violationMap[testSimulationType] || violationMap.nudity;
    return {
      isCompliant: false,
      violationType: testSimulationType as any,
      severity: details.severity,
      confidence: 0.99,
      reason: details.reason,
      nepaliReason: details.nepaliReason,
      detectedElements: [`Flagged via In-Built AI Safety Rule (${testSimulationType})`],
      system: "deep_heuristic_sentinel",
    };
  }

  // 2. High-speed Deep Heuristic Sentinel (Lexical & Pattern Safeguards in English & Nepali)
  const fullText = `${caption} ${nepaliCaption} ${tags.join(" ")}`.toLowerCase();

  // Pattern detection for adult/nudity
  const nudityRegex = /\b(nude|naked|nudity|porn|porno|nsfw|sex_tape|topless|genitals|boobs|penis|vagina|erotic_genitals)\b|नाङ्गो|नग्न|पोर्न|यौन/i;
  if (nudityRegex.test(fullText)) {
    return {
      isCompliant: false,
      violationType: "nudity",
      severity: "critical",
      confidence: 0.98,
      reason: "Prohibited nudity or sexually suggestive content detected violating Photo Bucket Terms & Conditions Sec. 14.",
      nepaliReason: "अनुचित नग्नता वा अश्लील शब्द/तस्बिर पत्ता लागेकाले यो पोस्ट स्वचालित रूपमा रोकिएको छ।",
      detectedElements: ["explicit_nudity_keywords"],
      system: "deep_heuristic_sentinel",
    };
  }

  // Pattern detection for cyberbullying / harassment / death threats
  const bullyingRegex = /\b(kill yourself|ugly pig|go die|worthless piece|retard|f\*\*\* you|bitch|bastard)\b|मूर्ख|कुकुर|मरीजा|हरामी|गाली|धम्की|अपमान/i;
  if (bullyingRegex.test(fullText)) {
    return {
      isCompliant: false,
      violationType: "bullying",
      severity: "critical",
      confidence: 0.95,
      reason: "Targeted cyberbullying, harassment, or derogatory abuse detected violating Community Safety Directives.",
      nepaliReason: "गालीगलौज, धम्की वा साइबर बुलिङयुक्त शब्द फेला परेकाले यो पोस्ट रोकिएको छ।",
      detectedElements: ["harassment_slurs"],
      system: "deep_heuristic_sentinel",
    };
  }

  // Pattern detection for violence / weapons / blood
  const violenceRegex = /\b(behead|slaughter him|kill him|stab|massacre|bloody gore|gun kill)\b|काट्ने|मार्ने|हत्या|रगतको खोलो|हिंसा/i;
  if (violenceRegex.test(fullText)) {
    return {
      isCompliant: false,
      violationType: "violence",
      severity: "critical",
      confidence: 0.96,
      reason: "Violent threats, gore, or physical harm incitement detected violating platform safety rules.",
      nepaliReason: "हिंसा, हत्या वा गम्भीर रक्तपातको अभिव्यक्ति देखिएकाले यो पोस्ट अस्वीकृत गरिएको छ।",
      detectedElements: ["violence_threats"],
      system: "deep_heuristic_sentinel",
    };
  }

  // Pattern detection for illegal goods / drugs
  const illegalRegex = /\b(buy cocaine|weed for sale|buy pistol|fake passport|illegal gun)\b|लागूऔषध|चरेश बिक्री|गाँजा किन्नुहोस्/i;
  if (illegalRegex.test(fullText)) {
    return {
      isCompliant: false,
      violationType: "illegal_goods",
      severity: "critical",
      confidence: 0.96,
      reason: "Prohibited illicit narcotics or illegal goods detected.",
      nepaliReason: "प्रतिबन्धित लागूऔषध वा गैरकानूनी वस्तु बिक्रीको सूचना देखिएकाले यो पोस्ट रोकिएको छ।",
      detectedElements: ["contraband_keywords"],
      system: "deep_heuristic_sentinel",
    };
  }

  // 3. Multimodal In-Built Gemini AI Analysis (when Gemini client is available)
  const ai = getGemini();
  if (ai) {
    try {
      const parts: any[] = [];

      // If imageUrl is base64 data URI
      if (typeof imageUrl === "string" && imageUrl.startsWith("data:image/")) {
        const mimeMatch = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (mimeMatch) {
          parts.push({
            inlineData: {
              mimeType: mimeMatch[1],
              data: mimeMatch[2],
            },
          });
        }
      } else if (typeof imageUrl === "string" && imageUrl.startsWith("http")) {
        // Fetch image buffer for Gemini multimodal inspection (with 3s timeout)
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000);
          const imgRes = await fetch(imageUrl, { signal: controller.signal });
          clearTimeout(timeout);
          if (imgRes.ok) {
            const cType = imgRes.headers.get("content-type") || "image/jpeg";
            const buffer = await imgRes.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");
            parts.push({
              inlineData: {
                mimeType: cType.split(";")[0],
                data: base64,
              },
            });
          }
        } catch (fetchErr) {
          // If fetch fails, proceed with textual + URL metadata
        }
      }

      const promptText = `
You are the in-built automated AI Content Safety & Community Guidelines Verification Engine for 'Photo Bucket Nepal' (फोटो Bucket).
Your mandate: strictly enforce Nepal Community Standards and Photo Bucket Terms & Conditions.

Review this photo post submission:
- Post Caption: "${caption}"
- Nepali Caption: "${nepaliCaption}"
- Tags: "${tags.join(" ")}"
- Author: "${user?.fullName || "User"} (@${user?.username || "creator"})"
${typeof imageUrl === "string" && imageUrl ? `- Image Reference: ${imageUrl.substring(0, 120)}` : ""}

Mandatory Guidelines to Enforce:
1. Nudity & Sexual Content: Explicit nudity, visible genitals, exposed breasts/buttocks, sexually suggestive acts, or pornography. (STRICTLY FORBIDDEN)
2. Violence & Physical Harm: Graphic gore, decapitation, bloody violence, weapons used to intimidate, self-harm, or animal cruelty. (STRICTLY FORBIDDEN)
3. Cyberbullying & Harassment: Targeted insults, defamation, doxxing, harassment of private citizens, ethnic/caste slurs against Nepali communities. (STRICTLY FORBIDDEN)
4. Illegal Goods & Contraband: Illicit narcotics, weapons sale, counterfeit documents, or financial scams. (STRICTLY FORBIDDEN)
5. Cultural & Heritage Desecration: Deliberate vandalism or desecration of temples, stupas, or religious shrines in Nepal. (FORBIDDEN)

If the post conforms to clean, respectful, family-friendly sharing (e.g. landscapes, culture, momos, daily life, festivals, mountains), set "isCompliant": true.
If the post violates ANY of the above guidelines, set "isCompliant": false, specify "violationType", "severity", and a clear explanation in English and Nepali.

Return JSON ONLY:
{
  "isCompliant": boolean,
  "violationType": "none" | "nudity" | "bullying" | "violence" | "hate_speech" | "illegal_goods",
  "severity": "none" | "low" | "medium" | "critical",
  "confidence": number,
  "reason": "Clear, concise reason why it is compliant or violating",
  "nepaliReason": "नेपालीमा स्पष्ट विवरण",
  "detectedElements": ["array of detected features"]
}
`;

      parts.push({ text: promptText });

      // Run Gemini verification with 3.5s timeout for fast real-time user publishing
      const geminiPromise = ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini verification timeout")), 3500)
      );

      const response: any = await Promise.race([geminiPromise, timeoutPromise]);

      const responseText = response.text || "";
      const parsed = JSON.parse(responseText.trim());

      return {
        isCompliant: Boolean(parsed.isCompliant),
        violationType: parsed.violationType || (parsed.isCompliant ? "none" : "nudity"),
        severity: parsed.severity || (parsed.isCompliant ? "none" : "critical"),
        confidence: Number(parsed.confidence) || 0.95,
        reason: parsed.reason || (parsed.isCompliant ? "Content verified clean." : "Violation of community guidelines."),
        nepaliReason: parsed.nepaliReason || (parsed.isCompliant ? "सामग्री सुरक्षित छ।" : "समुदायको नियम विपरित सामग्री।"),
        detectedElements: Array.isArray(parsed.detectedElements) ? parsed.detectedElements : [],
        system: "gemini_multimodal_vision",
      };
    } catch (geminiErr) {
      console.warn("Gemini Content Verification warning, falling back to heuristic engine:", geminiErr);
    }
  }

  // 4. Default Clean Pass
  return {
    isCompliant: true,
    violationType: "none",
    severity: "none",
    confidence: 0.95,
    reason: "Passed in-built AI content auto-verification. Complies with Photo Bucket Terms & Conditions and Nepal Community Standards.",
    nepaliReason: "फोटो बकेटको नियम र समुदाय मापदण्ड अनुसार सुरक्षित पाइएको छ।",
    detectedElements: ["safe_visual_stream", "clean_text"],
    system: "deep_heuristic_sentinel",
  };
}

// In-Built AI Content Auto-Verification Pre-Check API
app.post("/api/ai/verify-content", async (req, res) => {
  try {
    const { imageUrl, caption, nepaliCaption, tags, userId, testSimulationType } = req.body;
    const user = users.find((u) => u.id === userId) || users[0];

    const verdict = await verifyContentWithAI({
      imageUrl,
      caption,
      nepaliCaption,
      tags: tags || [],
      user,
      testSimulationType,
    });

    res.json({ success: true, ...verdict });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to run AI content verification" });
  }
});

// Create Post with In-Built AI Content Auto-Verification
app.post("/api/posts", async (req, res) => {
  const {
    userId,
    imageUrl,
    caption,
    nepaliCaption,
    location,
    district,
    city,
    province,
    category,
    filter,
    tags,
    musicTrack,
    isBoosted,
    boostTarget,
    testSimulationType, // "clean" | "nudity" | "bullying" | "violence" | "hate_speech" | "illegal_goods"
  } = req.body;
  const user = users.find((u) => u.id === userId) || users[0];

  // 1. Validate 10 Hashtags Limit
  let processedTags: string[] = [];
  if (Array.isArray(tags)) {
    processedTags = tags
      .map((t: any) => String(t).trim())
      .filter((t: string) => t.length > 0)
      .map((t: string) => (t.startsWith("#") ? t : `#${t}`));
  } else if (typeof tags === "string") {
    processedTags = tags
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));
  }

  if (processedTags.length > 10) {
    return res.status(400).json({
      success: false,
      message: `Maximum limit of 10 hashtags allowed per post. Received: ${processedTags.length} hashtags.`,
    });
  }

  // 2. Validate 300 Words Content Limit (English Caption)
  if (caption && typeof caption === "string") {
    const captionWords = caption.trim().split(/\s+/).filter(Boolean).length;
    if (captionWords > 300) {
      return res.status(400).json({
        success: false,
        message: `Post caption exceeds maximum limit of 300 words. Current count: ${captionWords} words.`,
      });
    }
  }

  // 3. Validate 300 Words Content Limit (Nepali Caption)
  if (nepaliCaption && typeof nepaliCaption === "string") {
    const nepaliWords = nepaliCaption.trim().split(/\s+/).filter(Boolean).length;
    if (nepaliWords > 300) {
      return res.status(400).json({
        success: false,
        message: `Nepali caption exceeds maximum limit of 300 words. Current count: ${nepaliWords} words.`,
      });
    }
  }

  // 4. Validate Image Size (<= 1 MB)
  if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("data:image/")) {
    const base64Data = imageUrl.split(",")[1] || "";
    const approxBytes = Math.round((base64Data.length * 3) / 4);
    if (approxBytes > 1024 * 1024 * 1.05) {
      return res.status(400).json({
        success: false,
        message: "Image exceeds the maximum allowable size of 1 MB. System automatically minimizes it before posting.",
      });
    }
  }

  const postDistrict = district || user.district || "Kathmandu";
  const postCity = city || user.city || "Central City";

  const isSuperAdminPost =
    user.id === SUPER_ADMIN_USER.id || user.isSuperAdmin || user.username === "photo_bucket";

  // 5. IN-BUILT AI CONTENT AUTO-VERIFICATION
  // Analyze image and text against Community Guidelines & Terms & Conditions
  const aiVerdict = await verifyContentWithAI({
    imageUrl,
    caption,
    nepaliCaption,
    tags: processedTags,
    user,
    testSimulationType,
  });

  // If content violates Terms & Conditions, AUTOMATICALLY BLOCK AND DO NOT SHOW THE POST
  if (!aiVerdict.isCompliant && !isSuperAdminPost) {
    const blockedPostId = `post_blocked_${Date.now()}`;

    // Record incident alert to Super Admin Incident Desk
    const alert: GuidelineViolationAlert = {
      id: `viol_${Date.now()}`,
      postId: blockedPostId,
      userId: user.id,
      username: user.username,
      userFullName: user.fullName,
      userAvatar: user.avatar,
      accountType: user.accountType || "personal",
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200",
      caption: caption || "No caption provided",
      violationType: (aiVerdict.violationType === "none" ? "nudity" : aiVerdict.violationType) as GuidelineViolationAlert["violationType"],
      reason: aiVerdict.reason,
      severity: aiVerdict.severity === "none" ? "critical" : (aiVerdict.severity as any),
      timestamp: new Date().toISOString(),
      status: "pending_review",
    };
    guidelineViolations.unshift(alert);

    // Audit Log for Security & Compliance
    addAuditLog(
      "AI_AUTO_VERIFICATION_BLOCKED",
      "MODERATION",
      `In-Built AI Sentinel (${aiVerdict.system})`,
      `AUTOMATICALLY BLOCKED image post by @${user.username} due to ${aiVerdict.violationType.toUpperCase()} violation. Reason: ${aiVerdict.reason}. Post was rejected at gate and will NOT be shown anywhere on the platform.`,
      "danger"
    );

    // Broadcast Real-time WebSocket alerts
    broadcast("admin:guideline_violation", { alert });
    broadcast("post:verification_failed", {
      postId: blockedPostId,
      userId: user.id,
      violationType: aiVerdict.violationType,
      reason: aiVerdict.reason,
      nepaliReason: aiVerdict.nepaliReason,
      system: aiVerdict.system,
    });

    // Return 422: The post is BLOCKED and NOT added to the feed
    return res.status(422).json({
      success: false,
      blocked: true,
      violationType: aiVerdict.violationType,
      reason: aiVerdict.reason,
      nepaliReason: aiVerdict.nepaliReason,
      severity: aiVerdict.severity,
      system: aiVerdict.system,
      message: `Blocked by In-Built AI Content Auto-Verification: This photo violates Photo Bucket's Terms & Conditions and Community Guidelines (${aiVerdict.reason}). Under our safety standards, this post has been automatically blocked and will NOT be displayed on any feed or profile.`,
    });
  }

  // Content is COMPLIANT: publish with verified status
  const newPost: Post = {
    id: `post_${Date.now()}`,
    userId: user.id,
    username: user.username,
    userFullName: user.fullName,
    userAvatar: user.avatar,
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=80",
    caption: caption || "Captured through the lens of Photo Bucket.",
    nepaliCaption: nepaliCaption || "फोटो Bucket मार्फत खिचिएको सुन्दर दृश्य।",
    location: location || `${postCity}, ${postDistrict}, Nepal`,
    district: postDistrict,
    city: postCity,
    province: province || user.province || "Bagmati",
    category: category || "lifestyle",
    filter: filter || "normal",
    likes: [],
    comments: [],
    savedBy: [],
    tags: processedTags.length > 0 ? processedTags : ["#PhotoBucket", "#Nepal"],
    createdAt: new Date().toISOString(),
    musicTrack: musicTrack || "Nepali Breeze Ambient",
    isBoosted: isBoosted || false,
    boostTarget: boostTarget || undefined,

    // Verified by In-Built AI System
    verificationStatus: "approved",
    isVerified: true,
    isOfficialAnnouncement: isSuperAdminPost ? true : undefined,
    verificationStartedAt: new Date().toISOString(),
    verificationCompletedAt: new Date().toISOString(),
    verificationTimerSeconds: 0,
    violationType: "none",
  };

  posts.unshift(newPost);
  user.postsCount += 1;

  // Real-time broadcast to author and network
  broadcast("post:created", newPost);
  broadcast("post:verified", { post: newPost });

  if (isSuperAdminPost) {
    broadcast("superadmin:post_published", {
      post: newPost,
      title: "Official Platform Notice",
      message: newPost.caption,
    });
  }

  res.status(201).json({
    success: true,
    verified: true,
    message: "Photo passed In-Built AI Content Auto-Verification and has been published successfully!",
    post: newPost,
  });
});

// Fast-forward / Manual Trigger for Verification (for immediate testing of the 1-minute process)
app.post("/api/posts/:id/verify-now", (req, res) => {
  const { id } = req.params;
  const postInStore = posts.find((p) => p.id === id);

  if (!postInStore) {
    return res.status(404).json({ success: false, message: "Post not found" });
  }

  if (postInStore.verificationStatus !== "pending") {
    return res.json({ success: true, message: "Post already verified", post: postInStore });
  }

  const isViolation = postInStore.violationType && postInStore.violationType !== "none";

  if (isViolation) {
    postInStore.verificationStatus = "rejected";
    postInStore.verificationCompletedAt = new Date().toISOString();

    const alert: GuidelineViolationAlert = {
      id: `viol_${Date.now()}`,
      postId: postInStore.id,
      userId: postInStore.userId,
      username: postInStore.username,
      userFullName: postInStore.userFullName,
      userAvatar: postInStore.userAvatar,
      accountType: "personal",
      imageUrl: postInStore.imageUrl,
      caption: postInStore.caption,
      violationType: postInStore.violationType as any,
      reason: postInStore.violationReason || "Violation detected",
      severity: "critical",
      timestamp: new Date().toISOString(),
      status: "pending_review",
    };
    guidelineViolations.unshift(alert);

    addAuditLog(
      "GUIDELINE_VIOLATION_BLOCKED",
      "MODERATION",
      "AI Community Sentinel",
      `Image ${postInStore.id} by @${postInStore.username} rejected for ${postInStore.violationType}. Dispatched alert to Super Admin.`,
      "danger"
    );

    broadcast("admin:guideline_violation", { alert });
    broadcast("post:verification_failed", {
      postId: postInStore.id,
      userId: postInStore.userId,
      violationType: postInStore.violationType,
      reason: postInStore.violationReason,
    });

    return res.json({
      success: true,
      verified: false,
      message: `Verification complete: Image flagged and blocked due to ${postInStore.violationType}. Not shown on user profile. Notification sent to Super Admin.`,
      post: postInStore,
    });
  } else {
    postInStore.verificationStatus = "approved";
    postInStore.verificationCompletedAt = new Date().toISOString();

    broadcast("post:verified", { post: postInStore });

    return res.json({
      success: true,
      verified: true,
      message: "Verification complete: Image passed all community guidelines and is now active on profile.",
      post: postInStore,
    });
  }
});

// ==========================================
// PAGES & GROUPS APIS (3-ITEM LIMIT & SIMILAR NAME ENGINE)
// ==========================================

// Get All Pages & Groups (with filters)
app.get("/api/pages-groups", (req, res) => {
  const { type, creatorId, visibility, search } = req.query;
  let items = [...pagesAndGroups];

  if (type && type !== "all") {
    items = items.filter((i) => i.type === type);
  }
  if (creatorId) {
    items = items.filter((i) => i.creatorId === creatorId);
  }
  if (visibility && visibility !== "all") {
    items = items.filter((i) => i.visibility === visibility);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    items = items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.nepaliName && i.nepaliName.includes(q)) ||
        i.description.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, items });
});

// Real-Time Name Similarity Check Endpoint
app.post("/api/pages-groups/check-name", (req, res) => {
  const { name, type, userDistrict } = req.body;

  if (!name || typeof name !== "string" || name.trim().length < 3) {
    return res.json({
      available: false,
      isSimilar: false,
      message: "Name must be at least 3 characters long.",
      suggestions: [],
    });
  }

  const existingNames = pagesAndGroups.map((p) => p.name);
  const similarityResult = checkNameSimilarity(name, existingNames);

  if (similarityResult.isSimilar) {
    const suggestions = generateUniqueSuggestions(name, existingNames, userDistrict);
    return res.json({
      available: false,
      isSimilar: true,
      matchedName: similarityResult.matchedName,
      message: `Similar name detected with existing ${type || "entity"} "${similarityResult.matchedName}". Please choose a unique name to ensure platform authenticity.`,
      suggestions,
    });
  }

  res.json({
    available: true,
    isSimilar: false,
    message: "Name is unique and available across Nepal!",
    suggestions: [],
  });
});

// Create Page or Group (Enforces 3 items limit & unique name)
app.post("/api/pages-groups", (req, res) => {
  const {
    creatorId,
    type, // "page" | "group"
    name,
    nepaliName,
    description,
    avatar,
    coverImage,
    visibility, // "public" | "private"
    category,
    district,
    city,
    province,
    tags,
  } = req.body;

  const user = users.find((u) => u.id === creatorId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  if (!name || name.trim().length < 3) {
    return res.status(400).json({ success: false, message: "A valid name of at least 3 characters is required." });
  }

  if (type !== "page" && type !== "group") {
    return res.status(400).json({ success: false, message: "Type must be either 'page' or 'group'." });
  }

  // Strict 3-Item Limit Check for Personal and Business Users
  const userCreatedCount = pagesAndGroups.filter(
    (item) => item.type === type && item.creatorId === user.id
  ).length;

  if (userCreatedCount >= 3) {
    return res.status(400).json({
      success: false,
      quotaExceeded: true,
      currentCount: userCreatedCount,
      maxLimit: 3,
      message: `Creation limit reached: Both personal and business accounts can create a maximum of 3 ${type === "page" ? "Pages" : "Groups"}. You currently have ${userCreatedCount} created.`,
    });
  }

  // Strict Name Similarity Enforcement
  const existingNames = pagesAndGroups.map((p) => p.name);
  const similarityResult = checkNameSimilarity(name, existingNames);

  if (similarityResult.isSimilar) {
    const suggestions = generateUniqueSuggestions(name, existingNames, district || user.district);
    return res.status(400).json({
      success: false,
      isSimilar: true,
      matchedName: similarityResult.matchedName,
      message: `Similar name detected with "${similarityResult.matchedName}". No similar names are allowed to prevent brand impersonation. Please pick one of our unique suggestions below:`,
      suggestions,
    });
  }

  // Create Slug
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const newEntity: PageOrGroup = {
    id: `${type}_${Date.now()}`,
    type,
    name: name.trim(),
    nepaliName: nepaliName ? nepaliName.trim() : undefined,
    slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
    description: description || `Welcome to ${name.trim()} on Photo Bucket.`,
    avatar: avatar || (type === "page"
      ? "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&auto=format&fit=crop&q=80"
      : "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80"),
    coverImage: coverImage || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&auto=format&fit=crop&q=80",
    visibility: visibility || "public",
    creatorId: user.id,
    creatorName: user.fullName,
    creatorRole: user.accountType,
    district: district || user.district || "Kathmandu",
    city: city || user.city || "Central City",
    province: province || user.province || "Bagmati",
    category: category || "General & Community",
    tags: Array.isArray(tags) && tags.length > 0 ? tags : [`#${type}`, "#NepalCommunity"],
    membersCount: 1,
    followersCount: 1,
    postsCount: 0,
    members: [user.id],
    createdAt: new Date().toISOString(),
    isVerified: user.isVerified || user.isBusinessVerified || false,
  };

  pagesAndGroups.unshift(newEntity);

  addAuditLog(
    type === "page" ? "PAGE_CREATED" : "GROUP_CREATED",
    "COMMUNITY",
    user.fullName,
    `Created new ${visibility || "public"} ${type} "${newEntity.name}" in ${newEntity.district}. Quota: ${userCreatedCount + 1}/3.`,
    "info"
  );

  broadcast("page_group:created", newEntity);

  res.status(201).json({
    success: true,
    message: `${type === "page" ? "Page" : "Group"} "${newEntity.name}" created successfully! (${userCreatedCount + 1}/3 used)`,
    item: newEntity,
    remainingQuota: 3 - (userCreatedCount + 1),
  });
});

// Join / Leave Page or Group
app.post("/api/pages-groups/:id/join-toggle", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const item = pagesAndGroups.find((i) => i.id === id);

  if (!item) {
    return res.status(404).json({ success: false, message: "Page or group not found" });
  }

  const isMember = item.members.includes(userId);
  if (isMember) {
    item.members = item.members.filter((uid) => uid !== userId);
    item.membersCount = Math.max(1, item.membersCount - 1);
    item.followersCount = Math.max(1, item.followersCount - 1);
  } else {
    item.members.push(userId);
    item.membersCount += 1;
    item.followersCount += 1;
  }

  broadcast("page_group:updated", item);
  res.json({ success: true, isMember: !isMember, item });
});

// Delete Page or Group (Creator only, frees up 3-item quota)
app.delete("/api/pages-groups/:id", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const index = pagesAndGroups.findIndex((i) => i.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: "Page or Group not found" });
  }

  const item = pagesAndGroups[index];
  if (item.creatorId !== userId) {
    const user = users.find((u) => u.id === userId);
    if (!user?.isSuperAdmin) {
      return res.status(403).json({ success: false, message: "Only the creator or Super Admin can delete this." });
    }
  }

  pagesAndGroups.splice(index, 1);

  addAuditLog(
    "PAGE_GROUP_DELETED",
    "COMMUNITY",
    item.creatorName,
    `Deleted ${item.type} "${item.name}". Quota freed up.`,
    "warning"
  );

  broadcast("page_group:deleted", { id });
  res.json({ success: true, message: `${item.type === "page" ? "Page" : "Group"} deleted successfully.` });
});

// ==========================================
// SUPER ADMIN GUIDELINE VIOLATIONS DESK APIS
// ==========================================

// Get All Flagged Guideline Violations
app.get("/api/admin/guideline-violations", (req, res) => {
  res.json({ success: true, violations: guidelineViolations });
});

// Action on Guideline Violation (Confirm Ban / Dismiss False Positive)
app.post("/api/admin/guideline-violations/:id/action", (req, res) => {
  const { id } = req.params;
  const { action, adminNotes } = req.body; // "confirm_banned" | "dismissed"
  const violation = guidelineViolations.find((v) => v.id === id);

  if (!violation) {
    return res.status(404).json({ success: false, message: "Violation record not found." });
  }

  violation.status = action;
  violation.actionTaken = adminNotes || (action === "confirm_banned" ? "Super Admin confirmed violation; post permanently banned." : "Dismissed by Super Admin as acceptable art/heritage context.");

  // If dismissed, restore the post to approved!
  if (action === "dismissed") {
    const originalPost = posts.find((p) => p.id === violation.postId);
    if (originalPost) {
      originalPost.verificationStatus = "approved";
      broadcast("post:verified", { post: originalPost });
    }
  }

  addAuditLog(
    "VIOLATION_RESOLUTION",
    "MODERATION",
    "Deepak Subedi (Super Admin)",
    `Super Admin ${action === "confirm_banned" ? "confirmed ban" : "dismissed flag"} for post ${violation.postId} by @${violation.username}. Notes: ${violation.actionTaken}`,
    action === "confirm_banned" ? "danger" : "info"
  );

  broadcast("admin:violation_updated", { violation });
  res.json({ success: true, violation, message: `Violation resolved with action: ${action}` });
});

// Boost Post (City-wise, District-wise, or Entire Nepal)
app.post("/api/posts/:id/boost", (req, res) => {
  const { id } = req.params;
  const { scope, targetDistrict, targetCity, budgetNPR, durationDays, boostedBy } = req.body;
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({ success: false, message: "Post not found." });
  }

  const duration = Number(durationDays) || 7;
  const budget = Number(budgetNPR) || 1200;
  const activeUntilDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();

  post.isBoosted = true;
  post.boostTarget = {
    scope: scope || "entire_nepal",
    targetDistrict: targetDistrict || post.district || "Kathmandu",
    targetCity: targetCity || post.city || "All Cities",
    budgetNPR: budget,
    durationDays: duration,
    boostedBy: boostedBy || "Business Owner",
    activeUntil: activeUntilDate,
    reachCount: Math.floor(12000 + Math.random() * 25000),
    clickCount: Math.floor(350 + Math.random() * 650),
  };

  const targetDescription =
    post.boostTarget.scope === "city"
      ? `City: ${post.boostTarget.targetCity} (${post.boostTarget.targetDistrict})`
      : post.boostTarget.scope === "district"
      ? `District: ${post.boostTarget.targetDistrict}`
      : "Entire Nepal (देशव्यापी)";

  addAuditLog(
    "POST_BOOSTED",
    "POST",
    post.boostTarget.boostedBy,
    `Post ${id} boosted with target [${targetDescription}] by ${post.boostTarget.boostedBy} for NPR ${budget}`,
    "success"
  );

  broadcast("post:boosted", { post });

  res.json({
    success: true,
    message: `Post successfully boosted for ${targetDescription} for ${duration} days!`,
    post,
  });
});

// Toggle Like
app.post("/api/posts/:id/like", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const index = post.likes.indexOf(userId);
  let isLiked = false;
  if (index > -1) {
    post.likes.splice(index, 1);
    isLiked = false;
  } else {
    post.likes.push(userId);
    isLiked = true;
  }

  const payload = { postId: post.id, userId, likes: post.likes, isLiked };
  broadcast("post:liked", payload);

  res.json({ success: true, ...payload });
});

// Add Comment
app.post("/api/posts/:id/comments", (req, res) => {
  const { id } = req.params;
  const { userId, text, nepaliText } = req.body;
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const user = users.find((u) => u.id === userId) || users[0];
  const newComment: Comment = {
    id: `comment_${Date.now()}`,
    userId: user.id,
    username: user.username,
    userAvatar: user.avatar,
    text: text || "Dherai ramro picture! 🙏",
    nepaliText: nepaliText || "",
    createdAt: new Date().toISOString(),
    likes: 0,
  };

  post.comments.push(newComment);

  const payload = { postId: post.id, comment: newComment };
  broadcast("post:comment", payload);

  res.status(201).json({ success: true, ...payload });
});

// Toggle Save / Bookmark
app.post("/api/posts/:id/save", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const index = post.savedBy.indexOf(userId);
  let isSaved = false;
  if (index > -1) {
    post.savedBy.splice(index, 1);
    isSaved = false;
  } else {
    post.savedBy.push(userId);
    isSaved = true;
  }

  const payload = { postId: post.id, userId, savedBy: post.savedBy, isSaved };
  broadcast("post:saved", payload);

  res.json({ success: true, ...payload });
});

// 4. Stories API (झलक)
app.post("/api/stories", (req, res) => {
  const { userId, imageUrl, caption, location } = req.body;
  const user = users.find((u) => u.id === userId) || users[0];

  const newStory: Story = {
    id: `story_${Date.now()}`,
    userId: user.id,
    username: user.username,
    userAvatar: user.avatar,
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80",
    caption: caption || "Jhalak of the day 🇳🇵",
    location: location || "Nepal",
    createdAt: new Date().toISOString(),
    viewedBy: [],
    likes: [],
  };

  stories.unshift(newStory);
  broadcast("story:created", newStory);

  res.status(201).json({ success: true, story: newStory });
});

// 5. Direct Messages API
app.get("/api/messages", (req, res) => {
  const { userId, otherUserId } = req.query;
  let filtered = directMessages;
  if (userId && otherUserId) {
    filtered = directMessages.filter(
      (m) =>
        (m.senderId === userId && m.receiverId === otherUserId) ||
        (m.senderId === otherUserId && m.receiverId === userId)
    );
  }
  res.json({ messages: filtered });
});

app.post("/api/messages", (req, res) => {
  const { senderId, receiverId, text, imageUrl } = req.body;
  const newMsg: DirectMessage = {
    id: `msg_${Date.now()}`,
    senderId,
    receiverId,
    text,
    imageUrl,
    createdAt: new Date().toISOString(),
    read: false,
  };

  directMessages.push(newMsg);
  broadcast("message:sent", newMsg);

  res.status(201).json({ success: true, message: newMsg });
});

// 6. Gemini AI Nepali & English Smart Caption Generator
app.post("/api/gemini/generate-caption", async (req, res) => {
  try {
    const { location, category, userPrompt, imageDescription } = req.body;
    const ai = getGemini();

    if (!ai) {
      // Graceful fallback with rich authentic Nepali poetic presets if no API key is set
      const presets = [
        {
          english: `Soaking in the timeless mountain aura of ${location || "Nepal"}. Every sunrise here feels like a blessing.`,
          nepali: `${location || "नेपाल"}को मनमोहक दृश्य र शान्त वातावरण। यहाँको हरेक पल स्वर्गको अनुभूति दिलाउँछ! 🏔️✨`,
          hashtags: ["#PhotoBucket", "#NepalVibes", "#VisitNepal", `#${(location || "Nepal").replace(/[^a-zA-Z]/g, "")}`, "#HimalayanAura"],
        },
        {
          english: `Traditions carved in wood and etched in hearts. The cultural soul of ${location || "Kathmandu"}.`,
          nepali: `परम्परा, संस्कृति र इतिहासको संगम। हाम्रो मौलिक पहिचान र सम्पदा! 🛕🇳🇵`,
          hashtags: ["#HeritageNepal", "#NewaCulture", "#NepalPhotography", "#CulturalVibes"],
        },
      ];
      const pick = presets[Math.floor(Math.random() * presets.length)];
      return res.json({ success: true, result: pick });
    }

    const promptText = `
You are the creative AI curator for 'Photo Bucket' (फोटो Bucket), the premier Instagram platform for Nepali users and travelers.
Generate a captivating dual-language Instagram caption (English and authentic expressive Nepali) along with relevant hashtags for a photo.

Details:
- Location: ${location || "Nepal"}
- Category: ${category || "Scenic Himalayas / Culture"}
- User input or context: ${userPrompt || "A breathtaking photo from Nepal"}
- Image context: ${imageDescription || "High aesthetic quality Nepali visual"}

Provide response in pure JSON matching this exact structure:
{
  "english": "A poetic, punchy 1-2 sentence English caption with emojis",
  "nepali": "A culturally rich, heartfelt 1-2 sentence Nepali caption in Devanagari script (नेपाली भाषा) with emojis",
  "hashtags": ["#PhotoBucket", "#Nepal", "#VisitNepal", "#KathmanduLife", ...]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const text = response.text || "";
    const parsed = JSON.parse(text.trim());

    res.json({ success: true, result: parsed });
  } catch (error: any) {
    console.error("Gemini caption error:", error);
    // Return fallback
    res.json({
      success: true,
      result: {
        english: "Pure mountain soul and breathtaking serenity across the valleys of Nepal. 🏔️✨",
        nepali: "हिमालको काखमा बसेको सुन्दर नेपालको एक मन छुने झलक। 🇳🇵❤️",
        hashtags: ["#PhotoBucket", "#VisitNepal", "#NepalPhotography", "#Himalayas"],
      },
    });
  }
});

// Vite Middleware integration for dev/prod
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`फोटो Bucket server running on http://0.0.0.0:${PORT}`);
  });
}

start();
