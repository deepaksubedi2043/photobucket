import fs from "fs";
import path from "path";

export const CURRENT_DATABASE_SCHEMA_VERSION = 4;

export interface DatabaseState {
  schemaVersion: number;
  lastUpdated: string;
  users: any[];
  posts: any[];
  stories: any[];
  communities: any[];
  verificationRequests: any[];
  auditLogs: any[];
  adminTaskLogs: any[];
  delegatedAdmins: any[];
  messages: any[];
  followingMap: Record<string, string[]>;
  companyAds: any[];
  scrollingAds: any[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "photobucket_database.json");
const BACKUP_FILE = path.join(DATA_DIR, "photobucket_database.backup.json");

/**
 * Ensures the data storage directory exists
 */
function ensureDataDirectory() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("Failed to create data directory:", err);
  }
}

/**
 * Migration engine: Safely migrates existing database to new schema version
 * without ever losing or overwriting existing user documents, uploaded photos,
 * likes, follower mappings, or custom records.
 */
function applyIncrementalMigrations(existingState: Partial<DatabaseState>, defaults: DatabaseState): DatabaseState {
  const currentVersion = existingState.schemaVersion || 1;
  console.log(`[DB Migration] Loaded existing database (Schema v${currentVersion}). Migrating to v${CURRENT_DATABASE_SCHEMA_VERSION}...`);

  // 1. Preserve and enhance existing users (Backfill new schema fields without altering existing user values)
  const existingUsers = Array.isArray(existingState.users) ? existingState.users : [];
  const existingUserMap = new Map<string, any>(existingUsers.map((u) => [u.id, u]));

  // Merge default users only if they don't already exist
  defaults.users.forEach((defaultUser) => {
    if (!existingUserMap.has(defaultUser.id)) {
      existingUserMap.set(defaultUser.id, defaultUser);
    } else {
      // Backfill missing fields from newer version if absent
      const current = existingUserMap.get(defaultUser.id);
      existingUserMap.set(defaultUser.id, {
        ...defaultUser,
        ...current, // user's actual data takes precedence
      });
    }
  });

  const migratedUsers = Array.from(existingUserMap.values()).map((user) => ({
    accountType: user.accountType || "personal",
    role: user.role || "user",
    status: user.status || "active",
    isApproved: user.isApproved !== undefined ? user.isApproved : true,
    approvalStatus: user.approvalStatus || "approved",
    isVerified: !!user.isVerified,
    isEmailVerified: user.isEmailVerified !== undefined ? user.isEmailVerified : true,
    followersCount: typeof user.followersCount === "number" ? user.followersCount : 0,
    followingCount: typeof user.followingCount === "number" ? user.followingCount : 0,
    postsCount: typeof user.postsCount === "number" ? user.postsCount : 0,
    district: user.district || "Kathmandu",
    ...user,
  }));

  // 2. Preserve and enhance existing posts
  const existingPosts = Array.isArray(existingState.posts) ? existingState.posts : [];
  const existingPostMap = new Map<string, any>(existingPosts.map((p) => [p.id, p]));

  defaults.posts.forEach((defaultPost) => {
    if (!existingPostMap.has(defaultPost.id)) {
      existingPostMap.set(defaultPost.id, defaultPost);
    }
  });

  const migratedPosts = Array.from(existingPostMap.values()).map((post) => ({
    likes: Array.isArray(post.likes) ? post.likes : [],
    comments: Array.isArray(post.comments) ? post.comments : [],
    savedBy: Array.isArray(post.savedBy) ? post.savedBy : [],
    tags: Array.isArray(post.tags) ? post.tags : ["#PhotoBucket", "#Nepal"],
    category: post.category || "lifestyle",
    district: post.district || "Kathmandu",
    createdAt: post.createdAt || new Date().toISOString(),
    isVerified: post.isVerified !== undefined ? post.isVerified : true,
    ...post,
  }));

  // 3. Preserve Communities
  const existingCommunities = Array.isArray(existingState.communities) ? existingState.communities : [];
  const communityMap = new Map<string, any>(existingCommunities.map((c) => [c.id, c]));
  defaults.communities.forEach((c) => {
    if (!communityMap.has(c.id)) communityMap.set(c.id, c);
  });

  // 4. Preserve Stories
  const migratedStories = Array.isArray(existingState.stories) && existingState.stories.length > 0
    ? existingState.stories
    : defaults.stories;

  // 5. Preserve Verification Requests
  const existingVerifications = Array.isArray(existingState.verificationRequests) ? existingState.verificationRequests : [];
  const verifMap = new Map<string, any>(existingVerifications.map((v) => [v.id, v]));
  defaults.verificationRequests.forEach((v) => {
    if (!verifMap.has(v.id)) verifMap.set(v.id, v);
  });

  // 6. Preserve Follower Map & Messages & Audit Logs
  const followingMap = existingState.followingMap && typeof existingState.followingMap === "object"
    ? { ...defaults.followingMap, ...existingState.followingMap }
    : defaults.followingMap;

  const messages = Array.isArray(existingState.messages) ? existingState.messages : defaults.messages;
  const auditLogs = Array.isArray(existingState.auditLogs) ? existingState.auditLogs : defaults.auditLogs;
  const adminTaskLogs = Array.isArray(existingState.adminTaskLogs) ? existingState.adminTaskLogs : defaults.adminTaskLogs;
  const delegatedAdmins = Array.isArray(existingState.delegatedAdmins) ? existingState.delegatedAdmins : defaults.delegatedAdmins;
  const companyAds = Array.isArray(existingState.companyAds) ? existingState.companyAds : defaults.companyAds;
  const scrollingAds = Array.isArray(existingState.scrollingAds) ? existingState.scrollingAds : defaults.scrollingAds;

  console.log(`[DB Migration] Successfully migrated to Schema v${CURRENT_DATABASE_SCHEMA_VERSION}. Preserved ${migratedUsers.length} users and ${migratedPosts.length} posts.`);

  return {
    schemaVersion: CURRENT_DATABASE_SCHEMA_VERSION,
    lastUpdated: new Date().toISOString(),
    users: migratedUsers,
    posts: migratedPosts,
    stories: migratedStories,
    communities: Array.from(communityMap.values()),
    verificationRequests: Array.from(verifMap.values()),
    auditLogs,
    adminTaskLogs,
    delegatedAdmins,
    messages,
    followingMap,
    companyAds,
    scrollingAds,
  };
}

/**
 * Load persisted database or initialize defaults with incremental schema migrations
 */
export function initializePersistentDatabase(initialDefaults: DatabaseState): DatabaseState {
  ensureDataDirectory();

  try {
    if (fs.existsSync(DB_FILE)) {
      const fileData = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(fileData);
      
      // Perform automated schema migration
      const migrated = applyIncrementalMigrations(parsed, initialDefaults);
      
      // Save migrated state
      saveDatabaseState(migrated);
      return migrated;
    }
  } catch (error) {
    console.error("[DB Init Error] Failed to read existing database file, checking backup:", error);
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        const backupData = fs.readFileSync(BACKUP_FILE, "utf-8");
        const parsedBackup = JSON.parse(backupData);
        const migrated = applyIncrementalMigrations(parsedBackup, initialDefaults);
        saveDatabaseState(migrated);
        return migrated;
      }
    } catch (backupError) {
      console.error("[DB Init Error] Backup recovery also failed:", backupError);
    }
  }

  // First time initialization
  console.log(`[DB Init] Initializing fresh database with Schema v${CURRENT_DATABASE_SCHEMA_VERSION}`);
  const freshState: DatabaseState = {
    ...initialDefaults,
    schemaVersion: CURRENT_DATABASE_SCHEMA_VERSION,
    lastUpdated: new Date().toISOString(),
  };
  saveDatabaseState(freshState);
  return freshState;
}

let saveTimeout: NodeJS.Timeout | null = null;

/**
 * Debounced atomic write to prevent corruption during concurrent requests
 */
export function saveDatabaseState(state: DatabaseState): void {
  ensureDataDirectory();

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    try {
      state.lastUpdated = new Date().toISOString();
      state.schemaVersion = CURRENT_DATABASE_SCHEMA_VERSION;
      const dataString = JSON.stringify(state, null, 2);
      const tempFile = `${DB_FILE}.tmp`;

      // 1. Write to temporary file first
      fs.writeFileSync(tempFile, dataString, "utf-8");

      // 2. Create rolling backup if main file exists
      if (fs.existsSync(DB_FILE)) {
        try {
          fs.copyFileSync(DB_FILE, BACKUP_FILE);
        } catch {}
      }

      // 3. Atomically rename temp file to main database file
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error("[DB Save Error] Failed to persist database state:", err);
    }
  }, 100);
}
