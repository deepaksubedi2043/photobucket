import React, { useState } from "react";
import { Logo } from "./Logo";
import { User, FeedType } from "../types";
import {
  Search,
  PlusSquare,
  MessageCircle,
  Bell,
  Compass,
  MapPin,
  Users,
  Home,
  Sparkles,
  Check,
  ChevronDown,
  Wifi,
  Globe,
  LayoutGrid,
  Download,
  ArrowDownToLine,
  Apple,
  KeyRound,
  Sun,
  Moon,
  Clock,
  PanelLeft,
  X,
  LogOut,
} from "lucide-react";
import { useSessionDuration } from "../hooks/useSessionDuration";

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  activeFeed: FeedType;
  onSelectFeed: (feed: FeedType) => void;
  onOpenCreate: () => void;
  onOpenMessages: () => void;
  onOpenProfile: (user: User) => void;
  onOpenAuth: (sector?: "personal" | "business", mode?: "login" | "register" | "forgot_password") => void;
  onOpenAppDownload: () => void;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  onToggleNotifications: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isRealtimeConnected: boolean;
  deviceMode?: "desktop" | "mobile" | "dual";
  onSetDeviceMode?: (mode: "desktop" | "mobile" | "dual") => void;
  language: "en" | "ne";
  onToggleLanguage: () => void;
  feedLayout?: "bento" | "stream";
  onToggleFeedLayout?: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  onOpenMobileSidebar?: () => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
  onOpenSuperAdminPortal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  activeFeed,
  onSelectFeed,
  onOpenCreate,
  onOpenMessages,
  onOpenProfile,
  onOpenAuth,
  onOpenAppDownload,
  unreadMessagesCount,
  unreadNotificationsCount,
  onToggleNotifications,
  searchQuery,
  onSearchChange,
  isRealtimeConnected,
  deviceMode,
  onSetDeviceMode,
  language,
  onToggleLanguage,
  feedLayout = "bento",
  onToggleFeedLayout,
  theme = "light",
  onToggleTheme,
  onOpenMobileSidebar,
  isLoggedIn = true,
  onLogout,
  onOpenSuperAdminPortal,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const sessionDuration = useSessionDuration(currentUser?.id, language);

  const t = {
    home: language === "ne" ? "गृहपृष्ठ" : "Feed",
    explore: language === "ne" ? "ट्रेन्डिङ" : "Trending",
    locations: language === "ne" ? "ठाउँहरू" : "Locations",
    communities: language === "ne" ? "चौतारी" : "Chautari",
    create: language === "ne" ? "फोटो हाल्नुहोस्" : "Share",
    msg: language === "ne" ? "सन्देश" : "Msg",
    notifications: language === "ne" ? "सूचना" : "Notice",
    searchPlaceholder: language === "ne" ? "काठमाडौँ, पोखरा, #momo खोज्नुहोस्..." : "Search Nepal locations, tags, creators...",
    tagline: "नेपालको आफ्नै फोटो चौतारी",
    switchProfile: language === "ne" ? "सक्रिय प्रोफाइल हेर्नुहोस्" : "View active profile",
    authPortal: language === "ne" ? "लगइन / दर्ता" : "Login / Register",
    logout: language === "ne" ? "लगआउट" : "Logout",
    downloadApp: language === "ne" ? "वेब बाट एप" : "Web to App",
    dayMode: language === "ne" ? "दिन मोड" : "Day Mode",
    darkMode: language === "ne" ? "रात मोड" : "Dark Mode",
  };

  return (
    <header id="main-navbar" className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 lg:gap-3">
        {/* Left: Mobile Sidebar Button & Brand Logo & Tagline Badge & Round Search Button */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {onOpenMobileSidebar && (
            <button
              id="navbar-mobile-sidebar-btn"
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Open Sidebar (Followers Online & Web to App)"
            >
              <PanelLeft className="w-5 h-5 text-[#003893] dark:text-blue-400" />
            </button>
          )}

          <button
            id="nav-logo-button"
            onClick={() => onSelectFeed("for-you")}
            className="text-left focus:outline-none transition-transform active:scale-98 cursor-pointer shrink-0 flex items-center"
            title="फोटो Bucket - नेपालको आफ्नै फोटो चौतारी"
          >
            <Logo size="md" showTagline={true} />
          </button>

          {/* Round Search Button (aligned in screenshot area) */}
          <div className="relative">
            <button
              id="navbar-search-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                searchOpen || searchQuery
                  ? "bg-blue-100 dark:bg-blue-900/60 text-[#003893] dark:text-blue-300 ring-2 ring-[#003893]/30"
                  : "bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
              title="Search Nepal locations, tags, creators"
            >
              <Search className="w-4 h-4" />
              {searchQuery && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#003893] dark:bg-blue-400 ring-1 ring-white" />
              )}
            </button>

            {/* Expandable Search Popover */}
            {searchOpen && (
              <div
                id="navbar-search-popover"
                className="absolute left-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-[#003893] dark:focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange("")}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {/* Popular Tags */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 font-mono">Popular in Nepal</div>
                  <div className="flex flex-wrap gap-1">
                    {["#Himalayas", "#Kathmandu", "#Pokhara", "#Momo", "#Newa", "#Mustang"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          onSearchChange(tag);
                          setSearchOpen(false);
                        }}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 hover:text-[#003893] dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Feed Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 shrink-0">
          <button
            id="nav-tab-foryou"
            onClick={() => onSelectFeed("for-you")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeFeed === "for-you"
                ? "text-[#003893] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 font-bold border border-blue-200/60 dark:border-blue-800/60 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800"
            }`}
          >
            <Home className={`w-4 h-4 ${activeFeed === "for-you" ? "text-[#003893] dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`} />
            <span>{t.home}</span>
          </button>

          <button
            id="nav-tab-locations"
            onClick={() => onSelectFeed("locations")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeFeed === "locations"
                ? "text-[#DC143C] dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 font-bold border border-rose-200/60 dark:border-rose-900/60 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800"
            }`}
          >
            <MapPin className={`w-4 h-4 ${activeFeed === "locations" ? "text-[#DC143C] dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`} />
            <span>{t.locations}</span>
          </button>

          <button
            id="nav-tab-communities"
            onClick={() => onSelectFeed("communities")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeFeed === "communities"
                ? "text-[#003893] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 font-bold border border-blue-200/60 dark:border-blue-800/60 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800"
            }`}
          >
            <Users className={`w-4 h-4 ${activeFeed === "communities" ? "text-[#003893] dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`} />
            <span>{t.communities}</span>
          </button>

          <button
            id="nav-tab-trending"
            onClick={() => onSelectFeed("trending")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeFeed === "trending"
                ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 font-bold border border-amber-200/60 dark:border-amber-900/60 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800"
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeFeed === "trending" ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`} />
            <span>{t.explore}</span>
          </button>
        </nav>

        {/* Right: Actions, Controls, Msg, Notification, Login/Register & User Avatar */}
        <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0">
          {/* Bento Grid Layout Toggle (Dark Button Matching Screenshot) */}
          {onToggleFeedLayout && (
            <button
              id="bento-layout-toggle-btn"
              onClick={onToggleFeedLayout}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-2xs shrink-0 ${
                feedLayout === "bento"
                  ? "bg-slate-900 dark:bg-slate-850 text-white border-slate-900 dark:border-slate-700"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              }`}
              title="Toggle Bento Grid Layout / Stream View"
            >
              <LayoutGrid className={`w-3.5 h-3.5 ${feedLayout === "bento" ? "text-rose-400" : "text-slate-500 dark:text-slate-400"}`} />
              <span className="hidden xl:inline">{feedLayout === "bento" ? "Bento Grid" : "Stream"}</span>
            </button>
          )}

          {/* Language Toggle (Matching Screenshot) */}
          <button
            id="lang-toggle-button"
            onClick={onToggleLanguage}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer shrink-0"
            title="Toggle Nepali / English"
          >
            <Globe className="w-3.5 h-3.5 text-[#003893] dark:text-blue-400" />
            <span>{language === "ne" ? "नेपाली" : "EN"}</span>
          </button>

          {/* Messages (Msg) Button - Aligned in Screenshot Area */}
          <button
            id="navbar-msg-btn"
            onClick={onOpenMessages}
            className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer shrink-0"
            title="Direct Messages (Chat with Mutual Followers)"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#003893] dark:text-blue-400" />
            <span className="hidden sm:inline">{t.msg}</span>
            {unreadMessagesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#DC143C] text-white text-[10px] font-extrabold leading-none animate-pulse">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          {/* Notifications Button - Aligned in Screenshot Area */}
          <button
            id="navbar-notification-btn"
            onClick={onToggleNotifications}
            className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer shrink-0"
            title="Notifications & Community Alerts"
          >
            <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">{t.notifications}</span>
            {unreadNotificationsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#003893] dark:bg-blue-400 ring-1 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Header Authentication: Shows Logout when either user or business profile is logged in.
              Never show Login/Register in header if a user or business profile is already logged in. */}
          {currentUser && currentUser.id ? (
            <button
              id="navbar-logout-btn"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl border border-rose-200/90 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 transition-colors shadow-2xs cursor-pointer shrink-0"
              title={
                language === "ne"
                  ? currentUser.accountType === "business"
                    ? `व्यवसायिक खाता (@${currentUser.username}) बाट लगआउट गर्नुहोस्`
                    : `व्यक्तिगत खाता (@${currentUser.username}) बाट लगआउट गर्नुहोस्`
                  : currentUser.accountType === "business"
                  ? `Log out of Business Profile (@${currentUser.username})`
                  : `Log out of User Profile (@${currentUser.username})`
              }
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span className="whitespace-nowrap">{t.logout}</span>
            </button>
          ) : (
            <button
              id="navbar-auth-portal-btn"
              onClick={() => onOpenAuth("personal", "login")}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl border border-[#003893]/35 dark:border-blue-500/40 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#003893] dark:text-blue-300 transition-colors shadow-2xs cursor-pointer shrink-0"
              title="Login or Register as Personal User / Business Organisation"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#003893] dark:text-blue-400" />
              <span className="whitespace-nowrap">{t.authPortal}</span>
            </button>
          )}

          {/* Current User Avatar & Profile Switcher Dropdown */}
          <div className="relative flex items-center gap-1.5 shrink-0">
            {/* Header Logged-In Time Indicator */}
            <button
              id="header-logged-in-time-badge"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="hidden 2xl:flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50/90 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-slate-700 dark:text-slate-200 border border-blue-200/80 dark:border-blue-800/80 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
              title={`${language === "ne" ? "लगइन भएको समय" : "Logged in for"}: ${sessionDuration.formattedDetailed}`}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <Clock className="w-3 h-3 text-[#003893] dark:text-cyan-400 shrink-0" />
              <span className="font-mono text-[10px] font-bold text-[#003893] dark:text-cyan-300">
                {sessionDuration.formattedHeaderBadge}
              </span>
            </button>

            <button
              id="user-profile-menu-button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-[#003893]/30 dark:hover:ring-blue-500/30 transition-all cursor-pointer"
              title={currentUser?.fullName || "User Profile"}
            >
              <img
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                alt={currentUser?.fullName || "User"}
                className={`w-8 h-8 rounded-full object-cover ring-2 ${
                  currentUser?.accountType === "business" ? "ring-[#DC143C]" : "ring-[#003893] dark:ring-blue-500"
                }`}
              />
            </button>

            {userDropdownOpen && (
              <div
                id="user-profile-menu-dropdown"
                className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 top-full"
              >
                {/* Active user header */}
                <div
                  onClick={() => {
                    if (currentUser) {
                      onOpenProfile(currentUser);
                      setUserDropdownOpen(false);
                    }
                  }}
                  className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <img
                    src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                    alt={currentUser?.fullName || "User"}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate flex items-center gap-1">
                      {currentUser?.fullName || "User"}
                      {currentUser?.isVerified && (
                        <span className="w-3.5 h-3.5 rounded-full bg-[#003893] dark:bg-blue-600 text-white text-[9px] flex items-center justify-center">✓</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                      <span>@{currentUser?.username || "creator"}</span>
                      {currentUser?.accountType === "business" && (
                        <span className="text-[9px] font-bold px-1 rounded bg-rose-100 dark:bg-rose-950 text-[#DC143C] dark:text-rose-400">
                          Business
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Active Session Logged In Time Banner */}
                <div className="px-3.5 py-2.5 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-slate-50 dark:from-slate-850 dark:via-blue-950/40 dark:to-slate-850 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-[#003893] dark:text-cyan-300 flex items-center justify-center shrink-0 shadow-2xs">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                        <span>{language === "ne" ? "लगइन समय:" : "Logged in:"}</span>
                        <span className="font-mono text-[#003893] dark:text-cyan-400 font-extrabold">
                          {language === "ne" ? sessionDuration.formattedNepali : sessionDuration.formattedDetailed}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>
                          {language === "ne"
                            ? `सुरु: ${sessionDuration.startTime}`
                            : `Since: ${sessionDuration.startTime}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Active
                  </span>
                </div>

                {/* Day / Night Mode Switcher inside Menu */}
                <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/70 dark:bg-slate-800/40">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    {theme === "dark" ? <Moon className="w-3.5 h-3.5 text-amber-300" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                    <span>{language === "ne" ? "दृश्य मोड (Theme)" : "Appearance Mode"}</span>
                  </span>
                  <div className="inline-flex rounded-lg p-0.5 bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                    <button
                      onClick={() => {
                        if (theme !== "light" && onToggleTheme) onToggleTheme();
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        theme === "light"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      ☀️ Day
                    </button>
                    <button
                      onClick={() => {
                        if (theme !== "dark" && onToggleTheme) onToggleTheme();
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        theme === "dark"
                          ? "bg-slate-900 text-amber-300 shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      🌙 Dark
                    </button>
                  </div>
                </div>

                {/* Active profile only - no switching allowed */}
                <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t.switchProfile}
                </div>

                <div className="px-2 py-1">
                  <button
                    id="view-active-profile-card"
                    onClick={() => {
                      onOpenProfile(currentUser);
                      setUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/50 hover:bg-blue-100/80 dark:hover:bg-blue-900/60 transition-colors text-left cursor-pointer group"
                    title={language === "ne" ? "सक्रिय प्रोफाइल हेर्नुहोस्" : "View active profile"}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.fullName}
                        className="w-8 h-8 rounded-full object-cover border border-blue-200 dark:border-blue-800 shrink-0 shadow-2xs"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-[#003893] dark:group-hover:text-blue-400">
                          {currentUser.fullName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          @{currentUser.username} {currentUser.accountType === "business" ? "• 🏢 Business" : "• 👤 Personal"}
                        </div>
                      </div>
                    </div>
                    <Check className="w-3.5 h-3.5 text-[#003893] dark:text-blue-400 shrink-0 ml-1.5" />
                  </button>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1 space-y-0.5">
                  {(currentUser?.isSuperAdmin ||
                    currentUser?.isDelegatedAdmin ||
                    currentUser?.role === "admin" ||
                    currentUser?.role === "super_admin" ||
                    currentUser?.email?.toLowerCase() === "photobucketnepal@gmail.com" ||
                    currentUser?.email?.toLowerCase() === "medeepaksubedi@gmail.com" ||
                    onOpenSuperAdminPortal) && (
                    <button
                      id="dropdown-super-admin-portal-btn"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onOpenSuperAdminPortal) onOpenSuperAdminPortal();
                      }}
                      className="w-full px-3.5 py-1.5 text-xs text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/40 font-bold cursor-pointer flex items-center justify-between rounded-lg transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>🛡️</span>
                        <span>
                          {language === "ne"
                            ? "सुपर एडमिन कमाण्ड सेन्टर"
                            : "Super Admin Control Center"}
                        </span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 font-mono text-rose-700 dark:text-rose-300">
                        Portal
                      </span>
                    </button>
                  )}

                  <button
                    id="view-my-profile-btn"
                    onClick={() => {
                      onOpenProfile(currentUser);
                      setUserDropdownOpen(false);
                    }}
                    className="w-full px-3.5 py-1.5 text-xs text-left text-[#003893] dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 font-semibold cursor-pointer flex items-center justify-between rounded-lg transition-colors"
                  >
                    <span>{language === "ne" ? "सक्रिय प्रोफाइल हेर्नुहोस्" : "View active profile"}</span>
                    <span className="text-[11px] font-bold">→</span>
                  </button>

                  {currentUser && onLogout && (
                    <button
                      id="dropdown-logout-btn"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full px-3.5 py-1.5 text-xs text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>{t.logout}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
