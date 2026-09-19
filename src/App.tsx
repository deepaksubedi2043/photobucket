import React, { useState, useEffect } from "react";
import { User, Post, Story, Community, FeedType, LocationItem, DEFAULT_CURRENT_USER } from "./types";
import { api, realtime } from "./services/api";
import { Navbar } from "./components/Navbar";
import { StoriesBar } from "./components/StoriesBar";
import { StoryViewerModal } from "./components/StoryViewerModal";
import { PostCard } from "./components/PostCard";
import { BentoFeedGrid } from "./components/BentoFeedGrid";
import { CreatePostModal } from "./components/CreatePostModal";
import { LocationExplorer } from "./components/LocationExplorer";
import { CommunityDiscovery } from "./components/CommunityDiscovery";
import { DirectMessagesDrawer } from "./components/DirectMessagesDrawer";
import { UserProfileModal } from "./components/UserProfileModal";
import { LoginDashboardModal } from "./components/LoginDashboardModal";
import { SuperAdminPortal } from "./components/SuperAdminPortal";
import { SuperAdminLoginModal } from "./components/SuperAdminLoginModal";
import { LiveNotificationToast, LiveNotification } from "./components/LiveNotificationToast";
import { MobileAppSimulatorFrame } from "./components/DeviceSimulatorView";
import { AppFooter } from "./components/AppFooter";
import { LegalComplianceModal } from "./components/LegalComplianceModal";
import { AppDownloadModal } from "./components/AppDownloadModal";
import { BoostPostModal } from "./components/BoostPostModal";
import { Logo } from "./components/Logo";
import { FollowersOnlineWidget } from "./components/FollowersOnlineWidget";
import { WebToAppSidebarCard } from "./components/WebToAppSidebarCard";
import { testFirestoreConnection } from "./lib/firebase";
import { firestoreSync } from "./services/firestoreSync";
import {
  Sparkles,
  MapPin,
  Users,
  Compass,
  Flame,
  Filter,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Home,
  MessageCircle,
  Bell,
  Heart,
  Smartphone,
  Monitor,
  CheckCircle2,
  TrendingUp,
  LayoutGrid,
  List,
  Shield,
  Download,
  Sun,
  Moon,
  PanelLeft,
  X,
  PlusSquare,
} from "lucide-react";

export default function App() {
  const [users, setUsers] = useState<User[]>([DEFAULT_CURRENT_USER]);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_CURRENT_USER);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);

  const [activeFeed, setActiveFeed] = useState<FeedType>("for-you");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(2);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(1);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [showNotificationsPopover, setShowNotificationsPopover] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialSector, setAuthInitialSector] = useState<"personal" | "business">("personal");
  const [authInitialMode, setAuthInitialMode] = useState<"login" | "register" | "forgot_password" | "email_verification">("register");
  const [isSuperAdminPortalOpen, setIsSuperAdminPortalOpen] = useState(false);
  const [isSuperAdminLoginOpen, setIsSuperAdminLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("photobucket_is_logged_in");
      if (stored !== null) return stored === "true";
    } catch {}
    return true; // Default to logged in
  });
  const [superAdminInitialTab, setSuperAdminInitialTab] = useState<string | undefined>(undefined);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<"terms" | "privacy" | "nepal_directives" | "community">("terms");
  const [isAppDownloadOpen, setIsAppDownloadOpen] = useState(false);
  const [boostTargetPost, setBoostTargetPost] = useState<Post | null>(null);

  // Web to App download state (persisted so downloaded app is not shown again)
  const [isAppDownloaded, setIsAppDownloaded] = useState<boolean>(() => {
    try {
      return localStorage.getItem("photobucket_web_to_app_downloaded") === "true";
    } catch {
      return false;
    }
  });
  const [highlightWebToApp, setHighlightWebToApp] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Followers Online & Two-Way Connections State
  const [activeUserIds, setActiveUserIds] = useState<string[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, string[]>>({});
  const [selectedChatUser, setSelectedChatUser] = useState<User | undefined>(undefined);

  const scrollToWebToApp = () => {
    setTimeout(() => {
      const el = document.getElementById("sidebar-web-to-app-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 350);
  };

  const handleAppDownloaded = () => {
    try {
      localStorage.setItem("photobucket_web_to_app_downloaded", "true");
    } catch {}
    setIsAppDownloaded(true);
    setHighlightWebToApp(false);
    addNotification({
      id: `notif_${Date.now()}`,
      type: "sync",
      title: language === "ne" ? "एप सेभ भयो! 📲" : "Web to App Saved! 📲",
      subtitle:
        language === "ne"
          ? "फोटो Bucket तपाईंको Homescreen मा सफलतापूर्वक सेभ भयो।"
          : "Photo Bucket is now saved to your homescreen. The prompt will be hidden from next time.",
      avatar: "/logo.svg",
      timestamp: new Date().toISOString(),
    });
  };

  const handleResetAppDownload = () => {
    try {
      localStorage.removeItem("photobucket_web_to_app_downloaded");
    } catch {}
    setIsAppDownloaded(false);
    setHighlightWebToApp(true);
    scrollToWebToApp();
    setTimeout(() => setHighlightWebToApp(false), 5000);
    addNotification({
      id: `notif_${Date.now()}`,
      type: "sync",
      title: "Web to App Reset (Uninstalled Test)",
      subtitle: "Web to App card is active again in sidebar below followers online.",
      avatar: "/logo.svg",
      timestamp: new Date().toISOString(),
    });
  };

  const handleOpenLegal = (tab: "terms" | "privacy" | "nepal_directives" | "community" = "terms") => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  const handleOpenAuth = (
    sector: "personal" | "business" = "personal",
    mode: "login" | "register" | "forgot_password" = "login"
  ) => {
    setAuthInitialSector(sector);
    setAuthInitialMode(mode);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    try {
      localStorage.setItem(`pb_session_start_${authenticatedUser.id}`, Date.now().toString());
      localStorage.setItem("photobucket_is_logged_in", "true");
    } catch {
      // Ignore if localStorage unavailable
    }
    setIsLoggedIn(true);
    setCurrentUser(authenticatedUser);
    setUsers((prev) => {
      if (prev.some((u) => u.id === authenticatedUser.id)) {
        return prev.map((u) => (u.id === authenticatedUser.id ? authenticatedUser : u));
      }
      return [authenticatedUser, ...prev];
    });

    const isAnyAdmin = Boolean(
      authenticatedUser.isSuperAdmin ||
      authenticatedUser.isDelegatedAdmin ||
      authenticatedUser.role === "admin" ||
      authenticatedUser.role === "super_admin" ||
      authenticatedUser.email?.toLowerCase() === "photobucketnepal@gmail.com"
    );

    addNotification({
      id: `notif_${Date.now()}`,
      type: "sync",
      title: isAnyAdmin
        ? (authenticatedUser.isSuperAdmin || authenticatedUser.email?.toLowerCase() === "photobucketnepal@gmail.com")
          ? `Super Admin Command Activated 🛡️`
          : `Admin Staff Portal Activated 🛡️`
        : `Welcome, ${authenticatedUser.fullName}! 🇳🇵`,
      subtitle: isAnyAdmin
        ? (authenticatedUser.isSuperAdmin || authenticatedUser.email?.toLowerCase() === "photobucketnepal@gmail.com")
          ? `Logged in as Root Super Admin (फोटो Bucket)`
          : `Logged in as ${authenticatedUser.fullName} (${authenticatedUser.designation || "Administrative Staff"})`
        : authenticatedUser.accountType === "business"
        ? `Logged into ${authenticatedUser.businessName || "Business Organization"} account`
        : `Signed in as @${authenticatedUser.username}`,
      avatar: authenticatedUser.avatar,
      timestamp: new Date().toISOString(),
    });

    // Requirement:
    // "After user and business logged in from mobile , directly land to web to app at sidebar .
    // Once web to app version is downloaded no need to show from next time . 
    // Those user who haven't downloaded or unstalled from mobile , in every loggedin directly land to web to app area which is in side bar below followers online ."
    if (!isAppDownloaded) {
      const isMobile =
        typeof window !== "undefined" &&
        (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
          window.innerWidth < 1024 ||
          deviceMode === "mobile");

      if (isMobile) {
        setIsMobileSidebarOpen(true);
      }
      setHighlightWebToApp(true);
      scrollToWebToApp();
      setTimeout(() => {
        setHighlightWebToApp(false);
      }, 6000);
    }
  };

  // Requirement: Once logged out the user should auto see login portal
  const handleLogout = () => {
    setIsLoggedIn(false);
    try {
      localStorage.setItem("photobucket_is_logged_in", "false");
      if (currentUser?.id) {
        localStorage.removeItem(`pb_session_start_${currentUser.id}`);
      }
    } catch {
      // Ignore storage errors
    }

    setIsSuperAdminPortalOpen(false);
    setIsSuperAdminLoginOpen(false);

    addNotification({
      id: `notif_${Date.now()}`,
      type: "sync",
      title: language === "ne" ? "सफलतापूर्वक लगआउट गरियो" : "Logged Out Successfully",
      subtitle:
        language === "ne"
          ? "तपाईंको खाता सुरक्षित रूपमा लगआउट भयो।"
          : `Signed out from @${currentUser?.username || "account"}. Please sign in to continue.`,
      timestamp: new Date().toISOString(),
    });

    // Automatically open the login portal
    handleOpenAuth("personal", "login");
  };

  // Platform view mode: desktop / mobile / dual
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile" | "dual">("desktop");
  const [language, setLanguage] = useState<"en" | "ne">("en");
  const [feedLayout, setFeedLayout] = useState<"bento" | "stream">("bento");

  // Day mode (clean white background) vs Dark mode (night time)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("photobucket_theme");
      if (saved === "dark" || saved === "light") return saved;
    } catch {
      // ignore storage error
    }
    return "light"; // Default to pristine Day mode (white background)
  });

  useEffect(() => {
    try {
      localStorage.setItem("photobucket_theme", theme);
    } catch {
      // ignore storage error
    }
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      document.body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      document.body.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // 5-Click Blank-Space Activation: Opens Super Admin & Delegated Admin Login Portal
  useEffect(() => {
    let clickTimestamps: number[] = [];

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore clicks on interactive elements
      const interactive = target.closest(
        'button, a, input, textarea, select, option, label, [role="button"], [role="link"], [role="menuitem"], [role="tab"], [role="switch"], [role="checkbox"], [contenteditable="true"], video, audio, [data-interactive="true"], img'
      );
      if (interactive) {
        return;
      }

      // If computed cursor is pointer, it is an interactive element
      try {
        const style = window.getComputedStyle(target);
        if (style.cursor === "pointer") {
          return;
        }
      } catch {
        // Continue if style check is unavailable
      }

      const now = Date.now();
      // Keep clicks occurring within a 2.5-second rolling window
      clickTimestamps = clickTimestamps.filter((t) => now - t < 2500);
      clickTimestamps.push(now);

      if (clickTimestamps.length >= 5) {
        clickTimestamps = [];

        // Check if current user is already an authenticated Super Admin or Delegated Admin
        const isAlreadyAdmin = Boolean(
          currentUser?.isSuperAdmin ||
          currentUser?.isDelegatedAdmin ||
          currentUser?.role === "admin" ||
          currentUser?.role === "super_admin" ||
          currentUser?.email?.toLowerCase() === "photobucketnepal@gmail.com"
        );

        if (isAlreadyAdmin) {
          setIsSuperAdminPortalOpen(true);
        } else {
          // Open the Super Admin / Admin login portal
          setIsSuperAdminLoginOpen(true);
        }
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [currentUser]);

  // Fetch initial bootstrap data
  useEffect(() => {
    const initApp = async () => {
      try {
        const data = await api.getBootstrap();
        setUsers(data.users);
        if (data.users.length > 0) {
          setCurrentUser(data.users[0]);
        }
        setPosts(data.posts);
        setStories(data.stories);
        setCommunities(data.communities);
        setLocations(data.locations);
        setActiveUserIds(data.activeUsers || []);
        setFollowingMap(data.followingMap || {});
      } catch (err) {
        console.error("Init data error", err);
      }
    };

    initApp();
    realtime.connect();
    testFirestoreConnection().catch(console.error);

    // Check for email verification callback in URL (?verified=true or ?token=...)
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const isVerified = searchParams.get("verified");
      const verifiedEmail = searchParams.get("email");
      const verifyToken = searchParams.get("token");

      if (verifyToken) {
        api.verifyEmail({ token: verifyToken }).then((res) => {
          addNotification({
            id: `verify_${Date.now()}`,
            type: "sync",
            title: "इमेल सफलतापूर्वक प्रमाणीकरण भयो!",
            subtitle: res.message || "Email verified! You can now log in to your account.",
            timestamp: new Date().toISOString(),
          });
          setAuthInitialMode("login");
          setIsAuthOpen(true);
        }).catch((err) => {
          console.warn("Token verification notice:", err);
        });
      } else if (isVerified === "true") {
        addNotification({
          id: `verify_${Date.now()}`,
          type: "sync",
          title: "इमेल सफलतापूर्वक प्रमाणीकरण भयो!",
          subtitle: `Your email (${verifiedEmail || "registered"}) has been verified. Welcome to Photo Bucket Nepal!`,
          timestamp: new Date().toISOString(),
        });
        setAuthInitialMode("login");
        setIsAuthOpen(true);
      }
    } catch {
      // ignore URL parsing error
    }
  }, []);

  // Land directly on Web to App area below followers online on mobile if not downloaded
  useEffect(() => {
    if (!isAppDownloaded && currentUser) {
      const isMobileDevice =
        typeof window !== "undefined" &&
        (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
          window.innerWidth < 1024 ||
          deviceMode === "mobile");

      if (isMobileDevice) {
        setIsMobileSidebarOpen(true);
        scrollToWebToApp();
        setHighlightWebToApp(true);
        const timer = setTimeout(() => setHighlightWebToApp(false), 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAppDownloaded, deviceMode]);

  // Real-time Event Subscriptions
  useEffect(() => {
    // 1. Connection status
    const unsubStatus = realtime.subscribe("connection:status", (data: any) => {
      setIsRealtimeConnected(data.status === "connected");
    });

    // 2. Post created
    const unsubPost = realtime.subscribe("post:created", (newPost: Post) => {
      setPosts((prev) => {
        if (prev.some((p) => p.id === newPost.id)) return prev;
        return [newPost, ...prev];
      });

      addNotification({
        id: `notif_${Date.now()}`,
        type: "post",
        title: `New photo shared by @${newPost.username}`,
        subtitle: `${newPost.location} • ${newPost.caption.slice(0, 40)}...`,
        avatar: newPost.userAvatar,
        timestamp: new Date().toISOString(),
      });
    });

    // 3. Post liked
    const unsubLike = realtime.subscribe("post:liked", (payload: any) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === payload.postId) {
            return { ...p, likes: payload.likes };
          }
          return p;
        })
      );

      if (payload.userId !== currentUser?.id && payload.isLiked) {
        const actingUser = users.find((u) => u.id === payload.userId);
        addNotification({
          id: `notif_${Date.now()}`,
          type: "like",
          title: `@${actingUser?.username || "Someone"} liked a photo`,
          subtitle: "Liked a post on Photo Bucket",
          avatar: actingUser?.avatar,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // 4. Post comment
    const unsubComment = realtime.subscribe("post:comment", (payload: any) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === payload.postId) {
            return { ...p, comments: [...p.comments, payload.comment] };
          }
          return p;
        })
      );

      if (payload.comment.userId !== currentUser?.id) {
        addNotification({
          id: `notif_${Date.now()}`,
          type: "comment",
          title: `Comment from @${payload.comment.username}`,
          subtitle: payload.comment.text,
          avatar: payload.comment.userAvatar,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // 5. Post saved
    const unsubSave = realtime.subscribe("post:saved", (payload: any) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === payload.postId) {
            return { ...p, savedBy: payload.savedBy };
          }
          return p;
        })
      );
    });

    // 6. Story created
    const unsubStory = realtime.subscribe("story:created", (newStory: Story) => {
      setStories((prev) => {
        if (prev.some((s) => s.id === newStory.id)) return prev;
        return [newStory, ...prev];
      });

      addNotification({
        id: `notif_${Date.now()}`,
        type: "story",
        title: `New Jhalak Story from @${newStory.username}`,
        subtitle: newStory.caption || "View fresh Nepali 24-hr story",
        avatar: newStory.userAvatar,
        timestamp: new Date().toISOString(),
      });
    });

    // 7. Super Admin System Broadcast
    const unsubBroadcast = realtime.subscribe("system:broadcast", (broadcastData: any) => {
      addNotification({
        id: broadcastData.id || `notif_${Date.now()}`,
        type: "sync",
        title: `📢 ${broadcastData.title}`,
        subtitle: broadcastData.message,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
        timestamp: broadcastData.timestamp || new Date().toISOString(),
      });
    });

    // 8. Post Boosted
    const unsubBoost = realtime.subscribe("post:boosted", (payload: any) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === payload.post.id ? payload.post : p))
      );
      addNotification({
        id: `notif_${Date.now()}`,
        type: "sync",
        title: `Post Boost Activated 🚀`,
        subtitle: `Boosted in ${
          payload.post.boostTarget?.scope === "city"
            ? payload.post.boostTarget?.targetCity
            : payload.post.boostTarget?.scope === "district"
            ? `${payload.post.boostTarget?.targetDistrict} District`
            : "Entire Nepal"
        }`,
        avatar: payload.post.userAvatar,
        timestamp: new Date().toISOString(),
      });
    });

    // 9. Post Moderation Verified
    const unsubVerified = realtime.subscribe("post:verified", (payload: any) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === payload.postId ? { ...p, verificationStatus: "approved" as const, verifiedAt: payload.verifiedAt } : p))
      );
      if (payload.userId === currentUser?.id) {
        addNotification({
          id: `notif_${Date.now()}`,
          type: "sync",
          title: "Photo Approved by Safety System ✓",
          subtitle: "Your photo passed all Community Guidelines (nudity & bullying checks) and is live!",
          avatar: currentUser?.avatar,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // 10. Post Moderation Rejected (Nudity / Bullying Violation)
    const unsubRejected = realtime.subscribe("post:rejected", (payload: any) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === payload.postId
            ? { ...p, verificationStatus: "rejected" as const, rejectionReason: payload.reason }
            : p
        )
      );
      if (payload.userId === currentUser?.id) {
        addNotification({
          id: `notif_${Date.now()}`,
          type: "sync",
          title: "⚠️ Photo Blocked by Safety Guidelines",
          subtitle: `Flagged for: ${payload.reason || "Prohibited content"}. Hidden from profile & reported to Super Admin.`,
          avatar: currentUser?.avatar,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // 11. Safety Alert to Super Admin
    const unsubViolationAlert = realtime.subscribe("post:violation_alert", (alertData: any) => {
      if (currentUser?.isSuperAdmin) {
        addNotification({
          id: `notif_${Date.now()}`,
          type: "sync",
          title: `🚨 Guideline Violation Alert!`,
          subtitle: `@${alertData.authorUsername} uploaded prohibited photo: ${alertData.reason}. Super Admin inspection required.`,
          avatar: alertData.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
          timestamp: new Date().toISOString(),
        });
      }
    });

    // 12. Real-time Presence Updates
    const unsubPresence = realtime.subscribe("presence:updated", (payload: any) => {
      if (payload?.activeUsers) {
        setActiveUserIds(payload.activeUsers);
      }
    });

    // 13. Real-time Two-Way Follow Updates
    const unsubFollow = realtime.subscribe("user:follow_changed", (payload: any) => {
      setFollowingMap((prev) => {
        const next = { ...prev };
        const list = next[payload.userId] || [];
        if (payload.isFollowing) {
          if (!list.includes(payload.targetUserId)) {
            next[payload.userId] = [...list, payload.targetUserId];
          }
        } else {
          next[payload.userId] = list.filter((uid: string) => uid !== payload.targetUserId);
        }
        return next;
      });

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === payload.userId && payload.currentUserFollowingCount !== undefined) {
            return { ...u, followingCount: payload.currentUserFollowingCount };
          }
          if (u.id === payload.targetUserId && payload.targetUserFollowersCount !== undefined) {
            return { ...u, followersCount: payload.targetUserFollowersCount };
          }
          return u;
        })
      );

      setCurrentUser((prev) => {
        if (!prev) return prev;
        if (prev.id === payload.userId && payload.currentUserFollowingCount !== undefined) {
          return { ...prev, followingCount: payload.currentUserFollowingCount };
        }
        if (prev.id === payload.targetUserId && payload.targetUserFollowersCount !== undefined) {
          return { ...prev, followersCount: payload.targetUserFollowersCount };
        }
        return prev;
      });
    });

    return () => {
      unsubStatus();
      unsubPost();
      unsubLike();
      unsubComment();
      unsubSave();
      unsubStory();
      unsubBroadcast();
      unsubBoost();
      unsubVerified();
      unsubRejected();
      unsubViolationAlert();
      unsubPresence();
      unsubFollow();
    };
  }, [currentUser?.id, currentUser?.isSuperAdmin, currentUser?.email, users]);

  const addNotification = (notif: LiveNotification) => {
    setNotifications((prev) => [notif, ...prev.slice(0, 4)]);
    setUnreadNotificationsCount((prev) => prev + 1);
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Actions
  const handleLike = async (postId: string) => {
    if (!currentUser) return;
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const hasLiked = p.likes.includes(currentUser.id);
          const nextLikes = hasLiked
            ? p.likes.filter((id) => id !== currentUser.id)
            : [...p.likes, currentUser.id];
          return { ...p, likes: nextLikes };
        }
        return p;
      })
    );

    try {
      const currentPost = posts.find((p) => p.id === postId);
      const isNowLiked = currentPost ? !currentPost.likes.includes(currentUser.id) : true;
      firestoreSync.setLike(postId, currentUser.id, isNowLiked).catch(console.error);
      await api.toggleLike(postId, currentUser.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleComment = async (postId: string, text: string, nepaliText?: string) => {
    if (!currentUser) return;
    try {
      await api.addComment(postId, currentUser.id, text, nepaliText);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (postId: string) => {
    if (!currentUser) return;
    // Optimistic
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const hasSaved = p.savedBy.includes(currentUser.id);
          const nextSaved = hasSaved
            ? p.savedBy.filter((id) => id !== currentUser.id)
            : [...p.savedBy, currentUser.id];
          return { ...p, savedBy: nextSaved };
        }
        return p;
      })
    );

    try {
      await api.toggleSave(postId, currentUser.id);
    } catch (e) {
      console.error(e);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" />
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <RefreshCw className="w-4 h-4 animate-spin text-[#003893]" />
            <span>Connecting to Nepali Photo Bucket Cloud...</span>
          </div>
        </div>
      </div>
    );
  }

  // Filtered posts based on active feed & search
  let displayPosts = [...posts].filter((p) => {
    // Hide rejected posts from public feed; only super admin or post author can see the rejection alert
    if (p.verificationStatus === "rejected") {
      return currentUser.isSuperAdmin || p.userId === currentUser.id;
    }
    return true;
  });

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayPosts = displayPosts.filter(
      (p) =>
        p.caption.toLowerCase().includes(q) ||
        (p.nepaliCaption && p.nepaliCaption.includes(q)) ||
        p.location.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  } else if (selectedTag) {
    displayPosts = displayPosts.filter((p) =>
      p.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())
    );
  } else if (categoryFilter !== "all") {
    displayPosts = displayPosts.filter((p) => p.category === categoryFilter);
  }

  if (activeFeed === "following") {
    // Show posts from creators other than current user or specific list
    displayPosts = displayPosts.filter((p) => p.userId !== currentUser.id);
  }

  // Render the core Feed Content
  const renderFeedContent = (isMobileView = false) => {
    return (
      <div className="w-full space-y-5">
        {/* Jhalak Stories Bar (Rendered only if not in Bento mode or in mobile view) */}
        {(!isMobileView && feedLayout === "bento" && activeFeed === "for-you") ? null : (
          <StoriesBar
            stories={stories}
            currentUser={currentUser}
            onOpenStory={(s) => setViewingStory(s)}
            onAddStory={() => setIsCreateOpen(true)}
            language={language}
          />
        )}

        {/* Feed Content based on Navigation */}
        {activeFeed === "locations" ? (
          <LocationExplorer
            locations={locations}
            posts={posts}
            selectedLocation={selectedLocation}
            onSelectLocation={(loc) => setSelectedLocation(loc)}
            onSelectPost={(p) => {
              // Highlight post or scroll
            }}
            language={language}
          />
        ) : activeFeed === "communities" ? (
          <CommunityDiscovery
            communities={communities}
            users={users}
            posts={posts}
            currentUser={currentUser}
            onSelectTag={(t) => {
              setSelectedTag(t);
              setActiveFeed("for-you");
            }}
            onSelectUser={(u) => setProfileUser(u)}
            language={language}
          />
        ) : feedLayout === "bento" && !isMobileView ? (
          <BentoFeedGrid
            posts={displayPosts}
            stories={stories}
            currentUser={currentUser}
            communities={communities}
            locations={locations}
            onLike={handleLike}
            onComment={handleComment}
            onSave={handleSave}
            onTagClick={(tag) => {
              setSelectedTag(tag);
              setCategoryFilter("all");
            }}
            onLocationClick={(loc, dist) => {
              setSelectedLocation(loc);
              setActiveFeed("locations");
            }}
            onUserClick={(userId) => {
              const u = users.find((usr) => usr.id === userId);
              if (u) setProfileUser(u);
            }}
            onOpenStory={(s) => setViewingStory(s)}
            onOpenCreate={() => setIsCreateOpen(true)}
            language={language}
          />
        ) : (
          <div>
            {/* Category Filter Chips */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs mb-4 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none transition-colors">
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 px-1">
                  <Filter className="w-3 h-3 text-[#003893] dark:text-blue-400" />
                  <span>Feeds:</span>
                </span>

                {[
                  { id: "all", label: language === "ne" ? "सबै (All)" : "All Nepal" },
                  { id: "himalayas", label: "Himalayas 🏔️" },
                  { id: "culture", label: "Heritage 🛕" },
                  { id: "food", label: "Momo & Food 🥟" },
                  { id: "street", label: "KTM Streets 🚲" },
                  { id: "wildlife", label: "Wild Chitwan 🦏" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategoryFilter(cat.id);
                      setSelectedTag(null);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
                      categoryFilter === cat.id && !selectedTag
                        ? "bg-[#003893] text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {selectedTag && (
                <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-2 py-0.5 rounded-md text-xs font-bold text-[#DC143C] dark:text-rose-400 flex-shrink-0">
                  <span>Tag: {selectedTag}</span>
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="hover:text-black dark:hover:text-white ml-1 text-slate-500 dark:text-slate-400"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Posts Stream */}
            {displayPosts.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 transition-colors">
                <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No photos found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Try selecting a different filter or search query.
                </p>
              </div>
            ) : (
              displayPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onLike={handleLike}
                  onComment={handleComment}
                  onSave={handleSave}
                  onTagClick={(tag) => {
                    setSelectedTag(tag);
                    setCategoryFilter("all");
                  }}
                  onLocationClick={(loc, dist) => {
                    setSelectedLocation(loc);
                    setActiveFeed("locations");
                  }}
                  onUserClick={(userId) => {
                    const u = users.find((usr) => usr.id === userId);
                    if (u) setProfileUser(u);
                  }}
                  onBoostClick={(p) => setBoostTargetPost(p)}
                  language={language}
                />
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="photo-bucket-app-root" className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Universal Navigation Header */}
      <Navbar
        currentUser={currentUser}
        allUsers={users}
        onSelectUser={(u) => {
          setCurrentUser(u);
          setIsLoggedIn(true);
          try {
            localStorage.setItem("photobucket_is_logged_in", "true");
            localStorage.setItem(`pb_session_start_${u.id}`, Date.now().toString());
          } catch {}
          addNotification({
            id: `notif_${Date.now()}`,
            type: "sync",
            title: language === "ne"
              ? `सक्रिय प्रोफाइल परिवर्तन भयो: @${u.username} (${u.accountType === "business" ? "🏢 व्यवसाय" : "👤 व्यक्तिगत"})`
              : `Switched active profile to @${u.username} (${u.accountType === "business" ? "🏢 Business" : "👤 User"})`,
            subtitle: `Real-time synchronization active for ${u.fullName}`,
            avatar: u.avatar,
            timestamp: new Date().toISOString(),
          });
        }}
        activeFeed={activeFeed}
        onSelectFeed={(feed) => {
          setActiveFeed(feed);
          setSelectedTag(null);
          setSelectedLocation(null);
        }}
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenMessages={() => setIsMessagesOpen(true)}
        onOpenProfile={(u) => setProfileUser(u)}
        onOpenAuth={handleOpenAuth}
        onOpenAppDownload={() => setIsAppDownloadOpen(true)}
        unreadMessagesCount={unreadMessagesCount}
        unreadNotificationsCount={unreadNotificationsCount}
        onToggleNotifications={() => setShowNotificationsPopover(!showNotificationsPopover)}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        isRealtimeConnected={isRealtimeConnected}
        deviceMode={deviceMode}
        onSetDeviceMode={(m) => setDeviceMode(m)}
        language={language}
        onToggleLanguage={() => setLanguage((l) => (l === "en" ? "ne" : "en"))}
        feedLayout={feedLayout}
        onToggleFeedLayout={() => setFeedLayout((l) => (l === "bento" ? "stream" : "bento"))}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />

      {/* Main Display Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* VIEW MODE 1: Standard Desktop Web Layout */}
        {deviceMode === "desktop" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Sidebar (Desktop Profile & Quick Hubs) */}
            <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-20">
              {/* Creator Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4.5 border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.fullName}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-[#DC143C]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {currentUser.fullName}
                      </div>
                      {/* Share Button right beside the Profile name */}
                      <button
                        id="creator-profile-share-btn"
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#DC143C] to-[#b80d32] hover:from-[#c21034] hover:to-[#9f0b2a] text-white font-bold text-xs shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer shrink-0"
                        title={language === "ne" ? "फोटो सेयर गर्नुहोस्" : "Share Photo"}
                      >
                        <PlusSquare className="w-3.5 h-3.5 text-white" />
                        <span>{language === "ne" ? "सेयर" : "Share"}</span>
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">@{currentUser.username}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 line-clamp-2 leading-relaxed">
                  {currentUser.bio}
                </p>

                <div className="grid grid-cols-3 text-center border-t border-slate-100 dark:border-slate-800 pt-2.5 mb-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {posts.filter((p) => p.userId === currentUser.id).length}
                    </div>
                    <div className="text-[10px] text-slate-400">Photos</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {currentUser.followersCount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">Followers</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 font-mono">{currentUser.followingCount}</div>
                    <div className="text-[10px] text-slate-400">Following</div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => setProfileUser(currentUser)}
                    className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#003893] dark:hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer shadow-xs text-center"
                  >
                    My Bucket Profile
                  </button>
                </div>
              </div>

              {/* Followers Online Widget (Two-Way Mutual Followed Users Active Now) */}
              <FollowersOnlineWidget
                currentUser={currentUser}
                allUsers={users}
                activeUserIds={activeUserIds}
                followingMap={followingMap}
                language={language}
                onSelectUser={(user) => setProfileUser(user)}
                onOpenDirectMessage={(user) => {
                  setSelectedChatUser(user);
                  setIsMessagesOpen(true);
                }}
                onFollowToggled={() => {
                  // Instant reactive update
                }}
              />

              {/* Direct Web to App Card (Rendered below Followers Online only if not yet downloaded) */}
              {!isAppDownloaded && (
                <WebToAppSidebarCard
                  language={language}
                  isHighlighted={highlightWebToApp}
                  onOpenFullModal={() => setIsAppDownloadOpen(true)}
                  onDownloaded={handleAppDownloaded}
                />
              )}

              {/* Top Geotags in Nepal */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4.5 border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-['Mukta']">
                    <MapPin className="w-3.5 h-3.5 text-[#DC143C]" />
                    <span>Top Locations</span>
                  </span>
                  <button
                    onClick={() => setActiveFeed("locations")}
                    className="text-[11px] font-bold text-[#003893] dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-1.5">
                  {locations.slice(0, 5).map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => {
                        setSelectedLocation(loc.name);
                        setActiveFeed("locations");
                      }}
                      className="w-full flex items-center justify-between text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 transition-colors group cursor-pointer"
                    >
                      <span className="truncate font-medium group-hover:text-[#003893] dark:group-hover:text-blue-400">
                        {loc.name.split(",")[0]}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {loc.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Center Main Feed */}
            <div className="lg:col-span-6 max-w-xl mx-auto w-full">
              {renderFeedContent(false)}
            </div>

            {/* Right Sidebar: Trending Chautaris & Nepali Creators */}
            <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-20">
              {/* Nepali Communities (Chautari) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4.5 border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-['Mukta']">
                    <Users className="w-3.5 h-3.5 text-[#003893] dark:text-blue-400" />
                    <span>Photo Chautaris</span>
                  </span>
                  <button
                    onClick={() => setActiveFeed("communities")}
                    className="text-[11px] font-bold text-[#003893] dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Explore
                  </button>
                </div>

                <div className="space-y-2.5">
                  {communities.slice(0, 3).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setActiveFeed("communities")}
                      className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <img
                        src={c.coverImage}
                        alt={c.name}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate leading-tight">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {c.membersCount.toLocaleString()} members
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Nepali Creators */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4.5 border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 font-['Mukta']">
                  Nepali Creators to Follow
                </div>

                <div className="space-y-3">
                  {users
                    .filter((u) => u.id !== currentUser.id)
                    .slice(0, 4)
                    .map((u) => (
                      <div key={u.id} className="flex items-center justify-between gap-2">
                        <div
                          onClick={() => setProfileUser(u)}
                          className="flex items-center gap-2 cursor-pointer min-w-0"
                        >
                          <img
                            src={u.avatar}
                            alt={u.fullName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1">
                              <span>{u.fullName}</span>
                              {u.isVerified && (
                                <span className="text-[9px] text-[#003893] dark:text-blue-400 font-bold">✓</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{u.location}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => setProfileUser(u)}
                          className="text-xs font-bold text-[#003893] dark:text-blue-400 hover:text-[#DC143C] dark:hover:text-rose-400 px-2 py-1 transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Minimalist Footer Note */}
              <div className="text-[11px] text-slate-400 dark:text-slate-500 px-2 space-y-1">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold font-['Mukta']">
                  <span>फोटो Bucket • नेपालको आफ्नै फोटो चौतारी</span>
                </div>
                <div>Real-time sync across Web & Mobile platforms.</div>
              </div>
            </aside>
          </div>
        )}

        {/* VIEW MODE 2: Handheld Mobile App Simulator */}
        {deviceMode === "mobile" && (
          <MobileAppSimulatorFrame
            platformName="फोटो Bucket Mobile App (iOS / Android)"
            isSyncing={isRealtimeConnected}
          >
            {/* Mobile Header Inside Simulator */}
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between z-30 transition-colors">
              <div className="flex items-center gap-2">
                <button
                  id="simulator-sidebar-btn"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="p-1 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Open Sidebar (Followers Online & Web to App)"
                >
                  <PanelLeft className="w-5 h-5 text-[#003893] dark:text-blue-400" />
                </button>
                <Logo size="sm" />
              </div>

              <div className="flex items-center gap-1.5">
                {/* Mobile Day/Night Theme Mode Switcher */}
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-full text-slate-700 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={theme === "dark" ? "Day Mode (White background)" : "Dark Mode for night time"}
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-[#003893]" />
                  )}
                </button>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="p-1 rounded-full text-[#DC143C] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsMessagesOpen(true)}
                  className="p-1 text-slate-700 dark:text-slate-200 relative hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#DC143C]" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Body */}
            <div className="p-3 pb-16">{renderFeedContent(true)}</div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-around z-30 transition-colors">
              <button
                onClick={() => setActiveFeed("for-you")}
                className={`p-1.5 transition-colors ${
                  activeFeed === "for-you" ? "text-[#003893] dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                <Home className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveFeed("locations")}
                className={`p-1.5 transition-colors ${
                  activeFeed === "locations" ? "text-[#DC143C] dark:text-rose-400" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                <MapPin className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="w-8 h-8 rounded-full bg-gradient-to-r from-[#DC143C] to-[#003893] text-white flex items-center justify-center shadow-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                id="simulator-bottom-sidebar-btn"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-[#003893] dark:hover:text-blue-400 transition-colors"
                title="Sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveFeed("communities")}
                className={`p-1.5 transition-colors ${
                  activeFeed === "communities" ? "text-[#003893] dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                <Users className="w-5 h-5" />
              </button>
              <button
                onClick={() => setProfileUser(currentUser)}
                className="p-1 rounded-full ring-1 ring-[#DC143C]"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.fullName}
                  className="w-5 h-5 rounded-full object-cover"
                />
              </button>
            </div>
          </MobileAppSimulatorFrame>
        )}

        {/* VIEW MODE 3: Dual Synchronized Live View (Side-by-Side) */}
        {deviceMode === "dual" && (
          <div className="space-y-4">
            {/* Synchronized Notice Banner */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span>Dual Synchronized Live Sync Mode</span>
                    <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                      WebSocket Live ⚡
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Interact with either the Web View (Left) or Mobile App (Right). Any photo upload, like, or comment instantly reflects on both screens simultaneously!
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#DC143C] hover:bg-[#b50f31] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                + Post Photo to Both
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Left Column: Full Desktop Web Feed */}
              <div className="xl:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-[#003893] dark:text-blue-400" />
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Desktop Web Platform
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200 dark:border-emerald-800">
                    ● Synced
                  </span>
                </div>
                {renderFeedContent(false)}
              </div>

              {/* Right Column: Mobile App Frame */}
              <div className="xl:col-span-5 flex justify-center">
                <MobileAppSimulatorFrame
                  platformName="Mobile App (Synchronized)"
                  isSyncing={isRealtimeConnected}
                >
                  {/* Mobile Header */}
                  <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between z-30 transition-colors">
                    <Logo size="sm" />
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={toggleTheme}
                        className="p-1.5 rounded-full text-slate-700 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title={theme === "dark" ? "Day Mode (White background)" : "Dark Mode"}
                      >
                        {theme === "dark" ? (
                          <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
                        ) : (
                          <Moon className="w-4 h-4 text-[#003893]" />
                        )}
                      </button>
                      <button
                        onClick={() => setIsCreateOpen(true)}
                        className="p-1 text-[#DC143C]"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 pb-16">{renderFeedContent(true)}</div>

                  <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-around z-30 transition-colors">
                    <button
                      onClick={() => setActiveFeed("for-you")}
                      className={`p-1.5 ${activeFeed === "for-you" ? "text-[#003893] dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}
                    >
                      <Home className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActiveFeed("locations")}
                      className={`p-1.5 ${activeFeed === "locations" ? "text-[#DC143C] dark:text-rose-400" : "text-slate-400 dark:text-slate-500"}`}
                    >
                      <MapPin className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setIsCreateOpen(true)}
                      className="w-8 h-8 rounded-full bg-gradient-to-r from-[#DC143C] to-[#003893] text-white flex items-center justify-center shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveFeed("communities")}
                      className={`p-1.5 ${activeFeed === "communities" ? "text-[#003893] dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}
                    >
                      <Users className="w-5 h-5" />
                    </button>
                  </div>
                </MobileAppSimulatorFrame>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Persistent App Footer with Continuously Scrolling Ads & Bulletins */}
      <AppFooter
        onOpenLegal={handleOpenLegal}
        onOpenAppDownload={() => setIsAppDownloadOpen(true)}
        language={language}
        isAppDownloaded={isAppDownloaded}
        onResetAppDownload={handleResetAppDownload}
        currentUser={currentUser}
      />

      {/* Floating Notifications Toasts */}
      <LiveNotificationToast
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />

      {/* Mobile Slide-Over Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div
          id="mobile-sidebar-drawer"
          className="fixed inset-0 z-50 flex animate-in fade-in duration-200"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 h-full overflow-y-auto p-4 space-y-4 shadow-2xl border-r border-slate-200 dark:border-slate-800 z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PanelLeft className="w-5 h-5 text-[#003893] dark:text-blue-400" />
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100 font-['Mukta']">
                  {language === "ne" ? "फोटो चौतारी साइडबार" : "Sidebar Menu"}
                </span>
              </div>
              <button
                id="close-mobile-sidebar-btn"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Close Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Creator Profile Summary */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.fullName}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-[#DC143C]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {currentUser.fullName}
                    </div>
                    <button
                      id="mobile-drawer-share-btn"
                      onClick={() => {
                        setIsMobileSidebarOpen(false);
                        setIsCreateOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-[#DC143C] to-[#b80d32] text-white font-bold text-[11px] shadow-xs cursor-pointer shrink-0"
                      title="Share Photo"
                    >
                      <PlusSquare className="w-3 h-3 text-white" />
                      <span>{language === "ne" ? "सेयर" : "Share"}</span>
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                    @{currentUser.username}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setProfileUser(currentUser);
                  setIsMobileSidebarOpen(false);
                }}
                className="text-xs font-bold text-[#003893] dark:text-blue-400 hover:underline px-2 py-1"
              >
                View
              </button>
            </div>

            {/* Followers Online Widget in Sidebar */}
            <FollowersOnlineWidget
              currentUser={currentUser}
              allUsers={users}
              activeUserIds={activeUserIds}
              followingMap={followingMap}
              language={language}
              onSelectUser={(user) => {
                setProfileUser(user);
                setIsMobileSidebarOpen(false);
              }}
              onOpenDirectMessage={(user) => {
                setSelectedChatUser(user);
                setIsMessagesOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              onFollowToggled={() => {}}
            />

            {/* Direct Web to App Card in Sidebar below Followers Online */}
            {!isAppDownloaded && (
              <WebToAppSidebarCard
                language={language}
                isHighlighted={highlightWebToApp}
                onOpenFullModal={() => {
                  setIsAppDownloadOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                onDownloaded={handleAppDownloaded}
                isMobileViewport={true}
              />
            )}

            {/* Top Locations in Sidebar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-['Mukta']">
                  <MapPin className="w-3.5 h-3.5 text-[#DC143C]" />
                  <span>Top Locations</span>
                </span>
              </div>
              <div className="space-y-1">
                {locations.slice(0, 4).map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => {
                      setSelectedLocation(loc.name);
                      setActiveFeed("locations");
                      setIsMobileSidebarOpen(false);
                    }}
                    className="w-full flex items-center justify-between text-left p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <span className="truncate">{loc.name.split(",")[0]}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {loc.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isAppDownloadOpen && (
        <AppDownloadModal
          isOpen={isAppDownloadOpen}
          onClose={() => setIsAppDownloadOpen(false)}
          language={language}
          onDownloaded={handleAppDownloaded}
        />
      )}

      {isLegalModalOpen && (
        <LegalComplianceModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          initialTab={legalModalTab}
          language={language}
        />
      )}

      {isCreateOpen && (
        <CreatePostModal
          currentUser={currentUser}
          onClose={() => setIsCreateOpen(false)}
          onPostCreated={(newPost) => {
            firestoreSync.createPost(newPost).catch(console.error);
          }}
          language={language}
        />
      )}

      {viewingStory && (
        <StoryViewerModal
          story={viewingStory}
          currentUser={currentUser}
          onClose={() => setViewingStory(null)}
          onLikeStory={(storyId) => {
            // Heart story
          }}
        />
      )}

      {isMessagesOpen && (
        <DirectMessagesDrawer
          currentUser={currentUser}
          allUsers={users}
          onClose={() => {
            setIsMessagesOpen(false);
            setSelectedChatUser(undefined);
          }}
          language={language}
          initialSelectedUser={selectedChatUser}
        />
      )}

      {profileUser && (
        <UserProfileModal
          user={profileUser}
          currentUser={currentUser}
          posts={posts}
          followingMap={followingMap}
          activeUserIds={activeUserIds}
          allUsers={users}
          onSelectUser={(u) => {
            setProfileUser(u);
          }}
          onOpenDirectMessage={(u) => {
            setSelectedChatUser(u);
            setIsMessagesOpen(true);
          }}
          onFollowToggled={(targetId, isFollowing) => {
            setFollowingMap((prev) => {
              const next = { ...prev };
              const currentList = next[currentUser.id] || [];
              if (isFollowing) {
                if (!currentList.includes(targetId)) next[currentUser.id] = [...currentList, targetId];
              } else {
                next[currentUser.id] = currentList.filter((uid) => uid !== targetId);
              }
              return next;
            });
          }}
          onClose={() => setProfileUser(null)}
          onSelectPost={(p) => {
            // Show post
          }}
          onUserUpdated={(updatedUser) => {
            setProfileUser(updatedUser);
            if (currentUser.id === updatedUser.id) {
              setCurrentUser(updatedUser);
            }
            setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
          }}
          language={language}
        />
      )}

      {/* Login & Registration Sector Dashboard Modal (Cannot bypass without logging in) */}
      {(isAuthOpen || !isLoggedIn) && (
        <LoginDashboardModal
          isOpen={isAuthOpen || !isLoggedIn}
          onClose={() => {
            if (isLoggedIn) {
              setIsAuthOpen(false);
            }
          }}
          currentUser={currentUser}
          onAuthSuccess={handleAuthSuccess}
          initialSector={authInitialSector}
          initialMode={authInitialMode}
          language={language}
        />
      )}

      {/* Boost Post Modal */}
      {boostTargetPost && (
        <BoostPostModal
          isOpen={!!boostTargetPost}
          onClose={() => setBoostTargetPost(null)}
          post={boostTargetPost}
          currentUser={currentUser}
          onBoostSuccess={(updatedPost) => {
            setPosts((prev) =>
              prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
            );
            setBoostTargetPost(null);
          }}
          language={language}
        />
      )}

      {/* 5-Click Blank-Space Activated Super Admin & Administrative Staff Login Portal */}
      <SuperAdminLoginModal
        isOpen={isSuperAdminLoginOpen}
        onClose={() => setIsSuperAdminLoginOpen(false)}
        onAuthSuccess={(authedAdmin) => {
          handleAuthSuccess(authedAdmin);
          setIsSuperAdminPortalOpen(true);
        }}
        language={language}
      />

      {/* Super Admin & Administrative Staff Full Control Portal */}
      {isSuperAdminPortalOpen &&
        (currentUser?.isSuperAdmin ||
          currentUser?.isDelegatedAdmin ||
          currentUser?.role === "admin" ||
          currentUser?.role === "super_admin" ||
          currentUser?.email?.toLowerCase() === "photobucketnepal@gmail.com") && (
        <SuperAdminPortal
          currentUser={currentUser}
          initialTab={superAdminInitialTab}
          onClose={() => {
            setIsSuperAdminPortalOpen(false);
            setSuperAdminInitialTab(undefined);
          }}
          onLogout={() => {
            handleLogout();
          }}
          onSwitchToUserView={() => {
            setIsSuperAdminPortalOpen(false);
            setSuperAdminInitialTab(undefined);
          }}
        />
      )}
    </div>
  );
}
