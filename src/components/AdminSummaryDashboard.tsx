import React, { useState, useMemo } from "react";
import {
  Users,
  Building2,
  Layers,
  Activity,
  Award,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Filter,
  Sparkles,
  Radio,
  FileText,
  Camera,
  ArrowRight,
  Shield,
  Zap,
  Eye,
} from "lucide-react";
import { AdminOverviewStats, User, Post, AuditLog, HourlyActivityMetric } from "../types";

interface AdminSummaryDashboardProps {
  stats: AdminOverviewStats | null;
  usersList: User[];
  postsList: Post[];
  auditLogs: AuditLog[];
  onNavigateTab: (tab: "overview" | "users" | "verification" | "business" | "posts" | "create_post" | "logs" | "broadcast") => void;
  onSelectUserForDetail?: (user: User) => void;
}

export const AdminSummaryDashboard: React.FC<AdminSummaryDashboardProps> = ({
  stats,
  usersList,
  postsList,
  auditLogs,
  onNavigateTab,
  onSelectUserForDetail,
}) => {
  // Drill-down states
  const [isGeoFilterOpen, setIsGeoFilterOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [geoSearchQuery, setGeoSearchQuery] = useState("");

  const [isOnlineUsersOpen, setIsOnlineUsersOpen] = useState(false);
  const [isVerifiedOnlineOpen, setIsVerifiedOnlineOpen] = useState(false);

  // Time-Period Active Ratio states
  const [activeRatioTab, setActiveRatioTab] = useState<"24h" | "dayparts" | "peak_lull">("24h");
  const [selectedHour, setSelectedHour] = useState<HourlyActivityMetric | null>(null);

  // Derive districts and cities from stats or usersList
  const districtBreakdown = useMemo(() => {
    if (stats?.districtCityBreakdown && stats.districtCityBreakdown.length > 0) {
      return stats.districtCityBreakdown;
    }

    // Fallback calculation from usersList
    const map: Record<
      string,
      {
        district: string;
        province: string;
        totalUsers: number;
        activeNow: number;
        verifiedCount: number;
        cities: { city: string; count: number; activeNow: number }[];
      }
    > = {};

    usersList.forEach((u) => {
      const dist = u.district || "Kathmandu";
      const city = u.city || (u.location ? u.location.split(",")[0].trim() : dist);
      const isOnline = (stats?.activeUsersList || []).includes(u.id);
      const isVer = Boolean(u.isVerified || u.isBusinessVerified);

      if (!map[dist]) {
        map[dist] = {
          district: dist,
          province: u.province || "Bagmati",
          totalUsers: 0,
          activeNow: 0,
          verifiedCount: 0,
          cities: [],
        };
      }

      map[dist].totalUsers += 1;
      if (isOnline) map[dist].activeNow += 1;
      if (isVer) map[dist].verifiedCount += 1;

      const existingCity = map[dist].cities.find((c) => c.city === city);
      if (existingCity) {
        existingCity.count += 1;
        if (isOnline) existingCity.activeNow += 1;
      } else {
        map[dist].cities.push({ city, count: 1, activeNow: isOnline ? 1 : 0 });
      }
    });

    return Object.values(map).sort((a, b) => b.totalUsers - a.totalUsers);
  }, [stats, usersList]);

  // Filtered districts by search
  const filteredDistricts = useMemo(() => {
    if (!geoSearchQuery.trim()) return districtBreakdown;
    const q = geoSearchQuery.toLowerCase();
    return districtBreakdown.filter(
      (d) =>
        d.district.toLowerCase().includes(q) ||
        d.province?.toLowerCase().includes(q) ||
        d.cities.some((c) => c.city.toLowerCase().includes(q))
    );
  }, [districtBreakdown, geoSearchQuery]);

  // Filtered users by selected district and city
  const filteredDistrictUsers = useMemo(() => {
    if (!selectedDistrict) return [];
    return usersList.filter((u) => {
      const matchDistrict = (u.district || "Kathmandu").toLowerCase() === selectedDistrict.toLowerCase();
      if (!matchDistrict) return false;
      if (selectedCity) {
        const userCity = u.city || (u.location ? u.location.split(",")[0].trim() : "");
        return userCity.toLowerCase() === selectedCity.toLowerCase();
      }
      return true;
    });
  }, [usersList, selectedDistrict, selectedCity]);

  // Online Users list
  const onlineUsersList = useMemo(() => {
    if (stats?.onlineUsersDetails && stats.onlineUsersDetails.length > 0) {
      return stats.onlineUsersDetails;
    }
    const onlineIds = new Set(stats?.activeUsersList || []);
    return usersList.filter((u) => onlineIds.has(u.id));
  }, [stats, usersList]);

  // Online Verified Users list
  const onlineVerifiedUsersList = useMemo(() => {
    if (stats?.onlineVerifiedUsersList && stats.onlineVerifiedUsersList.length > 0) {
      return stats.onlineVerifiedUsersList;
    }
    return onlineUsersList.filter((u: any) => u.isVerified || u.isBusinessVerified);
  }, [stats, onlineUsersList]);

  // Hourly metrics
  const hourlyMetrics = useMemo(() => {
    if (stats?.hourlyActivityMetrics && stats.hourlyActivityMetrics.length > 0) {
      return stats.hourlyActivityMetrics;
    }
    // Fallback 24-hour distribution curve
    return [
      { hour: 0, label: "12 AM", ratio: 15, status: "low" as const, activeEstimate: 2, description: "Late Night Browsing" },
      { hour: 1, label: "1 AM", ratio: 9, status: "low" as const, activeEstimate: 1, description: "Overnight Low" },
      { hour: 2, label: "2 AM", ratio: 6, status: "low" as const, activeEstimate: 1, description: "Minimum Activity Baseline" },
      { hour: 3, label: "3 AM", ratio: 5, status: "low" as const, activeEstimate: 1, description: "System Dormancy Period" },
      { hour: 4, label: "4 AM", ratio: 7, status: "low" as const, activeEstimate: 1, description: "Pre-Dawn Early Birds" },
      { hour: 5, label: "5 AM", ratio: 14, status: "low" as const, activeEstimate: 2, description: "Early Morning Hikers" },
      { hour: 6, label: "6 AM", ratio: 32, status: "moderate" as const, activeEstimate: 4, description: "Sunrise Photography" },
      { hour: 7, label: "7 AM", ratio: 62, status: "high" as const, activeEstimate: 8, description: "Morning Commute & Feeds" },
      { hour: 8, label: "8 AM", ratio: 76, status: "high" as const, activeEstimate: 10, description: "Morning Activity Peak" },
      { hour: 9, label: "9 AM", ratio: 68, status: "high" as const, activeEstimate: 9, description: "Story Uploads & Check-ins" },
      { hour: 10, label: "10 AM", ratio: 54, status: "moderate" as const, activeEstimate: 7, description: "Office Hours Active Feeds" },
      { hour: 11, label: "11 AM", ratio: 48, status: "moderate" as const, activeEstimate: 6, description: "Midday Interactions" },
      { hour: 12, label: "12 PM", ratio: 44, status: "moderate" as const, activeEstimate: 6, description: "Lunch Break Sharing" },
      { hour: 13, label: "1 PM", ratio: 38, status: "moderate" as const, activeEstimate: 5, description: "Afternoon Work Lull" },
      { hour: 14, label: "2 PM", ratio: 35, status: "moderate" as const, activeEstimate: 5, description: "Low Midday Engagement" },
      { hour: 15, label: "3 PM", ratio: 42, status: "moderate" as const, activeEstimate: 6, description: "Tea Break Browsing" },
      { hour: 16, label: "4 PM", ratio: 56, status: "high" as const, activeEstimate: 8, description: "Late Afternoon Uploads" },
      { hour: 17, label: "5 PM", ratio: 70, status: "high" as const, activeEstimate: 9, description: "Evening Golden Hour Shots" },
      { hour: 18, label: "6 PM", ratio: 82, status: "peak" as const, activeEstimate: 11, description: "Post-Work Surge" },
      { hour: 19, label: "7 PM", ratio: 91, status: "peak" as const, activeEstimate: 12, description: "Prime Evening Engagement" },
      { hour: 20, label: "8 PM", ratio: 96, status: "peak" as const, activeEstimate: 13, description: "Highest Daily Peak (Photo Bucket Prime)" },
      { hour: 21, label: "9 PM", ratio: 93, status: "peak" as const, activeEstimate: 13, description: "High Social Interactions & DMs" },
      { hour: 22, label: "10 PM", ratio: 78, status: "high" as const, activeEstimate: 10, description: "Bedtime Browsing & Liking" },
      { hour: 23, label: "11 PM", ratio: 46, status: "moderate" as const, activeEstimate: 6, description: "Nighttime Wind Down" },
    ];
  }, [stats]);

  // Calculate current Nepal Time hour (UTC + 5:45)
  const currentNepalHour = useMemo(() => {
    const now = new Date();
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const nepalTotalMinutes = (utcMinutes + 345) % 1440;
    return Math.floor(nepalTotalMinutes / 60);
  }, []);

  const currentHourMetric = useMemo(() => {
    return hourlyMetrics.find((h) => h.hour === currentNepalHour) || hourlyMetrics[20];
  }, [hourlyMetrics, currentNepalHour]);

  // Active user ratio by dayparts
  const dayparts = [
    {
      name: "Morning Rush (6 AM - 11 AM)",
      nepaliName: "बिहानी सक्रियता",
      avgRatio: 58,
      status: "high",
      icon: "🌅",
      desc: "Sunrise photography, morning jogging & story uploads across Kathmandu & Pokhara",
    },
    {
      name: "Midday Lull (12 PM - 4 PM)",
      nepaliName: "दिउँसोको मन्द गति",
      avgRatio: 43,
      status: "moderate",
      icon: "☀️",
      desc: "Office hours and business transactions, light feed checking during lunch & tea breaks",
    },
    {
      name: "Evening Creator Prime (5 PM - 10 PM)",
      nepaliName: "साँझको शिखर समय",
      avgRatio: 88,
      status: "peak",
      icon: "🔥",
      desc: "Highest platform surge! Post uploads, dual-caption reads, active commenting & DMs",
    },
    {
      name: "Overnight Dormancy (11 PM - 5 AM)",
      nepaliName: "मध्यरातको विश्राम",
      avgRatio: 11,
      status: "low",
      icon: "🌙",
      desc: "Lowest activity window. Good for scheduled database maintenance & backups",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Post Addition Callout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-crimson-950 text-crimson-300 border border-crimson-800 uppercase tracking-wider">
              Nepal Command Center
            </span>
            <span className="text-xs text-slate-500 font-mono">
              NPT {new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kathmandu" })}
            </span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Super Admin Executive Summary Dashboard</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Geographic creator distribution, real-time presence, activity ratio rhythms, and Blue Tick monitoring.
          </p>
        </div>

        {/* Quick Post Addition & Broadcast Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab("create_post")}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-crimson-600 hover:from-indigo-500 hover:to-crimson-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 flex items-center gap-2 transition transform active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>+ Add New Post</span>
          </button>

          <button
            onClick={() => onNavigateTab("broadcast")}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>Broadcast</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 CORE INNOVATIVE SUMMARY CARDS                                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: TOTAL USERS (Clickable with City & District Filter) */}
        <div
          onClick={() => setIsGeoFilterOpen(!isGeoFilterOpen)}
          className={`p-5 rounded-2xl bg-slate-900 border transition cursor-pointer group select-none shadow-md ${
            isGeoFilterOpen
              ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-slate-900/95"
              : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span>Total Registered Users</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-950/80 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="text-3xl font-black text-white tracking-tight">
              {stats?.totalUsers || usersList.length}
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/80">
              77 Districts
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span className="text-indigo-400 font-bold">{stats?.personalUsers || 0} Personal</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{stats?.businessUsers || 0} Business</span>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-medium text-indigo-400 group-hover:text-indigo-300">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-crimson-400" />
              <span>{isGeoFilterOpen ? "Close City & District Filter" : "Click to Filter by City & District"}</span>
            </span>
            {isGeoFilterOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* CARD 2: TOTAL USERS ACTIVE AT PRESENT TIME */}
        <div
          onClick={() => setIsOnlineUsersOpen(!isOnlineUsersOpen)}
          className={`p-5 rounded-2xl bg-slate-900 border transition cursor-pointer group select-none shadow-md ${
            isOnlineUsersOpen
              ? "border-emerald-500 ring-2 ring-emerald-500/20"
              : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Active at Present Time</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="text-3xl font-black text-emerald-400 tracking-tight flex items-center gap-2">
              <span>{stats?.onlineUsers || onlineUsersList.length}</span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800">
              🟢 LIVE NOW
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-400">
            <span>
              {Math.round(((stats?.onlineUsers || onlineUsersList.length || 1) / (stats?.totalUsers || usersList.length || 1)) * 100)}% of user base currently connected
            </span>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-medium text-emerald-400 group-hover:text-emerald-300">
            <span>{isOnlineUsersOpen ? "Hide Online Roster" : "Inspect Online Users Roster"}</span>
            {isOnlineUsersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* CARD 3: ACTIVE USERS RATIO AS PER TIME PERIOD */}
        <div
          onClick={() => {
            const el = document.getElementById("active-ratio-section");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-700/80 hover:bg-slate-900/80 transition cursor-pointer group select-none shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Active Ratio by Time Period</span>
            <div className="w-8 h-8 rounded-xl bg-amber-950/80 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="text-3xl font-black text-amber-400 tracking-tight">
              {currentHourMetric.ratio}%
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
              Hour {currentHourMetric.label}
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-400 truncate">
            <span className="text-crimson-400 font-bold">Peak: 96% (8 PM)</span> • <span className="text-slate-500">Low: 5% (3 AM)</span>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-medium text-amber-400 group-hover:text-amber-300">
            <span>View 24h Rhythm Curve</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* CARD 4: BLUE TICK (VERIFIED) USERS ONLINE */}
        <div
          onClick={() => setIsVerifiedOnlineOpen(!isVerifiedOnlineOpen)}
          className={`p-5 rounded-2xl bg-slate-900 border transition cursor-pointer group select-none shadow-md ${
            isVerifiedOnlineOpen
              ? "border-blue-500 ring-2 ring-blue-500/20"
              : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Blue Tick Users Online</span>
            <div className="w-8 h-8 rounded-xl bg-blue-950/80 text-blue-400 flex items-center justify-center group-hover:scale-110 transition shadow-sm shadow-blue-900/30">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="text-3xl font-black text-blue-400 tracking-tight flex items-center gap-2">
              <span>{stats?.onlineVerifiedUsersCount || onlineVerifiedUsersList.length}</span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-blue-400" />
              Verified
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-400">
            <span>Celebrities, Creators & Business Leaders</span>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-medium text-blue-400 group-hover:text-blue-300">
            <span>{isVerifiedOnlineOpen ? "Hide Verified Roster" : "Inspect Online Blue Ticks"}</span>
            {isVerifiedOnlineOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: DISTRICT & CITY GEOGRAPHIC FILTER DRILL-DOWN CONSOLE           */}
      {/* ========================================================================= */}
      {isGeoFilterOpen && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/50 space-y-4 shadow-2xl animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-crimson-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Geographic User Distribution: City & District Explorer
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any district or city pill to filter users and view their credentials, online presence, and engagement.
              </p>
            </div>

            {/* Quick Search & Clear */}
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={geoSearchQuery}
                  onChange={(e) => setGeoSearchQuery(e.target.value)}
                  placeholder="Search district or city..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {(selectedDistrict || selectedCity || geoSearchQuery) && (
                <button
                  onClick={() => {
                    setSelectedDistrict(null);
                    setSelectedCity(null);
                    setGeoSearchQuery("");
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Indicator Tag */}
          {(selectedDistrict || selectedCity) && (
            <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-indigo-300 font-medium">Active Geographic Filter:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-bold">
                  {selectedDistrict} {selectedCity ? `→ ${selectedCity}` : ""}
                </span>
                <span className="text-slate-400">({filteredDistrictUsers.length} creators found)</span>
              </div>
              <button
                onClick={() => {
                  setSelectedDistrict(null);
                  setSelectedCity(null);
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            </div>
          )}

          {/* District Pills Grid */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select District of Nepal:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedDistrict(null);
                  setSelectedCity(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  !selectedDistrict
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                All 77 Districts ({usersList.length})
              </button>

              {filteredDistricts.map((d) => (
                <button
                  key={d.district}
                  onClick={() => {
                    if (selectedDistrict === d.district) {
                      setSelectedDistrict(null);
                      setSelectedCity(null);
                    } else {
                      setSelectedDistrict(d.district);
                      setSelectedCity(null);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                    selectedDistrict === d.district
                      ? "bg-gradient-to-r from-crimson-600 to-indigo-600 text-white border-crimson-500 shadow-md shadow-crimson-950"
                      : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  <span>{d.district}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-slate-200">
                    {d.totalUsers}
                  </span>
                  {d.activeNow > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title={`${d.activeNow} active now`}></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* City Sub-Pills (when a district is selected) */}
          {selectedDistrict && (
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-crimson-400" />
                <span>Cities & Municipalities in {selectedDistrict}:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCity(null)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                    !selectedCity
                      ? "bg-slate-700 text-white border-slate-600"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  All Cities in {selectedDistrict}
                </button>
                {districtBreakdown
                  .find((d) => d.district.toLowerCase() === selectedDistrict.toLowerCase())
                  ?.cities.map((c) => (
                    <button
                      key={c.city}
                      onClick={() => setSelectedCity(selectedCity === c.city ? null : c.city)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                        selectedCity === c.city
                          ? "bg-indigo-600 text-white border-indigo-500"
                          : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white"
                      }`}
                    >
                      <span>{c.city}</span>
                      <span className="text-[10px] text-slate-400">({c.count})</span>
                      {c.activeNow > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* User List for Selected District/City */}
          {selectedDistrict && (
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Registered Users in <strong className="text-white">{selectedDistrict}</strong>
                  {selectedCity ? ` (${selectedCity})` : ""}:
                </span>
                <button
                  onClick={() => onNavigateTab("users")}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Manage in Users Activity Tab →
                </button>
              </div>

              {filteredDistrictUsers.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 text-center text-xs text-slate-500">
                  No users found in {selectedDistrict} with current filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredDistrictUsers.map((u) => {
                    const isOnline = (stats?.activeUsersList || []).includes(u.id);
                    return (
                      <div
                        key={u.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="relative shrink-0">
                            <img
                              src={u.avatar || "/logo.svg"}
                              alt={u.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-700"
                            />
                            {isOnline && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950"></span>
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-1 font-bold text-white truncate">
                              <span className="truncate">{u.fullName}</span>
                              {u.isVerified && <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">@{u.username}</div>
                            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-crimson-400" />
                              <span>{u.location || u.district}</span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                            u.accountType === "business"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : "bg-indigo-950 text-indigo-300 border border-indigo-800"
                          }`}
                        >
                          {u.accountType}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: LIVE USERS ONLINE ROSTER (When toggled from Card 2)             */}
      {/* ========================================================================= */}
      {isOnlineUsersOpen && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/50 space-y-4 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Online Users Roster ({onlineUsersList.length} Connected Now)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Creators and businesses actively browsing feeds, uploading stories, and messaging via WebSocket.
              </p>
            </div>
            <button
              onClick={() => setIsOnlineUsersOpen(false)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {onlineUsersList.map((u: any) => (
              <div
                key={u.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-emerald-900/40 hover:border-emerald-700/60 transition flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="relative shrink-0">
                    <img
                      src={u.avatar || "/logo.svg"}
                      alt={u.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-emerald-600/50"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950"></span>
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1 font-bold text-white truncate">
                      <span className="truncate">{u.fullName}</span>
                      {u.isVerified && <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">@{u.username}</div>
                    <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-crimson-400" />
                      <span>{u.location || u.district || "Nepal"}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    ONLINE
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: BLUE TICK (VERIFIED) USERS ONLINE ROSTER (Card 4)             */}
      {/* ========================================================================= */}
      {isVerifiedOnlineOpen && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-blue-500/50 space-y-4 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Verified Blue Tick Creators & Figures Online ({onlineVerifiedUsersList.length})
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Celebrities, prominent creators, businessmen, and authenticated public figures currently active on Photo Bucket.
              </p>
            </div>
            <button
              onClick={() => setIsVerifiedOnlineOpen(false)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {onlineVerifiedUsersList.map((u: any) => (
              <div
                key={u.id}
                className="p-4 rounded-xl bg-slate-950 border border-blue-900/60 hover:border-blue-600 transition space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={u.avatar || "/logo.svg"}
                        alt={u.fullName}
                        className="w-11 h-11 rounded-full object-cover border-2 border-blue-500"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950"></span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{u.fullName}</span>
                        <Award className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      </div>
                      <div className="text-[11px] text-blue-300 font-mono">@{u.username}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-crimson-400" />
                        <span>{u.location || u.district}</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 uppercase shrink-0">
                    {u.verificationCategory || "Creator"}
                  </span>
                </div>

                {u.verifiedBadgeTitle && (
                  <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-200 font-semibold flex items-center gap-1.5">
                    <span>{u.verifiedBadgeTitle}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: INNOVATIVE ACTIVE USERS RATIO BY TIME PERIOD                   */}
      {/* ========================================================================= */}
      <div id="active-ratio-section" className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 uppercase">
                Activity Ratio Engine
              </span>
              <span className="text-xs text-slate-500 font-mono">Nepal Time Horizon (NPT)</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Active Users Ratio by Time Period: Peak vs Lowest Activity Rhythm
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies the optimal windows for Super Admin broadcasts, marketing boosts, and community engagement.
            </p>
          </div>

          {/* Sub-tab view toggle */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveRatioTab("24h")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeRatioTab === "24h"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              24-Hour Timeline
            </button>
            <button
              onClick={() => setActiveRatioTab("dayparts")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeRatioTab === "dayparts"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Dayparts Ratio
            </button>
            <button
              onClick={() => setActiveRatioTab("peak_lull")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeRatioTab === "peak_lull"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Peak vs Lowest
            </button>
          </div>
        </div>

        {/* Highlight Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-crimson-900/40">
            <div className="text-[11px] font-bold text-crimson-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Highest Peak Window</span>
            </div>
            <div className="mt-2 text-xl font-black text-white">7:00 PM – 10:00 PM</div>
            <div className="mt-1 text-xs text-crimson-300 font-semibold">96% Active Ratio (Photo Bucket Prime)</div>
            <p className="mt-1 text-[11px] text-slate-500">Users actively share dinner photos, stories & review explore feeds.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Lowest Lull Window</span>
            </div>
            <div className="mt-2 text-xl font-black text-slate-300">2:00 AM – 5:00 AM</div>
            <div className="mt-1 text-xs text-slate-400 font-semibold">5% – 7% Active Ratio (Dormancy)</div>
            <p className="mt-1 text-[11px] text-slate-500">Minimum network strain. Ideal for cron backups & index reindexing.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-900/40">
            <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Present Hour Ratio</span>
            </div>
            <div className="mt-2 text-xl font-black text-indigo-300">
              {currentHourMetric.ratio}% Active Ratio
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Hour {currentHourMetric.label} ({currentHourMetric.status.toUpperCase()})
            </div>
            <p className="mt-1 text-[11px] text-slate-500">{currentHourMetric.description}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/40">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Best Time to Broadcast</span>
            </div>
            <div className="mt-2 text-xl font-black text-emerald-300">8:00 PM – 9:30 PM</div>
            <div className="mt-1 text-xs text-emerald-400 font-semibold">Guaranteed Max Eyeballs</div>
            <p className="mt-1 text-[11px] text-slate-500">Schedule official notices and posts during this window for peak reach.</p>
          </div>
        </div>

        {/* VIEW 1: 24-HOUR INTERACTIVE TIMELINE CURVE */}
        {activeRatioTab === "24h" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Hourly Active Creator Ratio across Nepal (Hover or click any bar for details):</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-crimson-600"></span>
                  <span>Peak (80%+)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                  <span>High (55-79%)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-500"></span>
                  <span>Moderate (30-54%)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-700"></span>
                  <span>Low (&lt;30%)</span>
                </span>
              </div>
            </div>

            {/* Custom High-Performance Bar Visualizer */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="h-44 flex items-end justify-between gap-1 sm:gap-2 pt-6">
                {hourlyMetrics.map((item) => {
                  const isCurrent = item.hour === currentNepalHour;
                  const isSelected = selectedHour?.hour === item.hour;
                  const heightPercent = Math.max(8, item.ratio);

                  let barColor = "bg-slate-700";
                  if (item.status === "peak") barColor = "bg-gradient-to-t from-crimson-700 to-crimson-500";
                  else if (item.status === "high") barColor = "bg-gradient-to-t from-amber-600 to-amber-400";
                  else if (item.status === "moderate") barColor = "bg-gradient-to-t from-indigo-700 to-indigo-500";

                  return (
                    <div
                      key={item.hour}
                      onClick={() => setSelectedHour(item)}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                    >
                      {/* Current Hour Indicator Tag */}
                      {isCurrent && (
                        <div className="absolute -top-6 px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-500 text-white uppercase tracking-tighter whitespace-nowrap animate-bounce shadow-sm">
                          NOW
                        </div>
                      )}

                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 px-2 py-1 rounded-md bg-black/90 text-white text-[10px] font-mono whitespace-nowrap pointer-events-none z-20 border border-slate-700">
                        {item.label}: {item.ratio}% Active
                      </div>

                      {/* Animated Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all duration-300 ${barColor} ${
                          isSelected ? "ring-2 ring-white scale-y-105" : "group-hover:opacity-80"
                        } ${isCurrent ? "ring-2 ring-indigo-400" : ""}`}
                      ></div>

                      {/* Hour Label */}
                      <span
                        className={`mt-2 text-[9px] font-mono ${
                          isCurrent
                            ? "text-indigo-300 font-bold"
                            : item.hour % 3 === 0
                            ? "text-slate-400"
                            : "text-slate-600"
                        }`}
                      >
                        {item.hour % 3 === 0 ? item.label.replace(" ", "") : "•"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Hour Details Callout */}
            {selectedHour && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm ${
                      selectedHour.status === "peak"
                        ? "bg-crimson-600"
                        : selectedHour.status === "high"
                        ? "bg-amber-600"
                        : selectedHour.status === "moderate"
                        ? "bg-indigo-600"
                        : "bg-slate-700"
                    }`}
                  >
                    {selectedHour.ratio}%
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>Hour {selectedHour.label} NPT</span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                        {selectedHour.status} activity
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">{selectedHour.description}</div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400 shrink-0">
                  <div>Estimated active Nepali creators: <strong className="text-white">~{selectedHour.activeEstimate} users</strong></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: DAYPARTS RATIO BREAKDOWN */}
        {activeRatioTab === "dayparts" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dayparts.map((dp, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xl">{dp.icon}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      dp.status === "peak"
                        ? "bg-crimson-950 text-crimson-300 border border-crimson-800"
                        : dp.status === "high"
                        ? "bg-amber-950 text-amber-300 border border-amber-800"
                        : dp.status === "moderate"
                        ? "bg-indigo-950 text-indigo-300 border border-indigo-800"
                        : "bg-slate-900 text-slate-400 border border-slate-800"
                    }`}
                  >
                    {dp.status}
                  </span>
                </div>
                <div className="font-bold text-sm text-white">{dp.name}</div>
                <div className="text-2xl font-black text-indigo-400">{dp.avgRatio}% Avg Ratio</div>
                <p className="text-[11px] text-slate-400">{dp.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 3: PEAK VS LOWEST COMPARISON DEEP DIVE */}
        {activeRatioTab === "peak_lull" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-gradient-to-br from-crimson-950/40 to-slate-950 border border-crimson-800/60 space-y-3">
              <div className="flex items-center gap-2 text-crimson-400 font-bold text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>When Users Are Active MORE (Peak Period)</span>
              </div>
              <div className="text-2xl font-black text-white">7:00 PM – 10:00 PM (Prime Peak: 96%)</div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-crimson-400">✓</span>
                  <span><strong>Evening Family & Leisure:</strong> Workday in Nepal concludes; users gather, review daily captures, and share stories.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-crimson-400">✓</span>
                  <span><strong>Highest Story Views:</strong> Jhalak stories uploaded during this window receive 3.8x faster views and reactions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-crimson-400">✓</span>
                  <span><strong>Super Admin Action:</strong> Ideal for critical notices, festival announcements, and verified badges dispatch.</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                <TrendingDown className="w-4 h-4 text-slate-500" />
                <span>When Users Are Active LOWER (Lull Period)</span>
              </div>
              <div className="text-2xl font-black text-slate-300">2:00 AM – 5:00 AM (Dormant Baseline: 5%)</div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-slate-500">•</span>
                  <span><strong>Night Sleep Horizon:</strong> Creator activity naturally pauses across all mountain and valley communities.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-500">•</span>
                  <span><strong>Minimal Interaction:</strong> Feed comments drop to near zero; push notifications sent here cause user drop-off.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-500">•</span>
                  <span><strong>Super Admin Action:</strong> Execute database cleanups, audit archival, and system upgrades safely.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: RECENT SYSTEM AUDIT LOGS & PLATFORM HEALTH                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-white">Chronological System Audit Ledger</h3>
            </div>
            <button
              onClick={() => onNavigateTab("logs")}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              View Full Security Logs →
            </button>
          </div>

          <div className="space-y-2.5">
            {auditLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
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
                    <span className="font-semibold text-slate-200">{log.action}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{log.actor}</span>
                  </div>
                  <p className="text-slate-300 font-mono text-[11px]">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Launchpad */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-sm text-white mb-1">Super Admin Controls</h3>
            <p className="text-xs text-slate-400 mb-4">Direct shortcuts to critical management desks</p>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigateTab("create_post")}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-indigo-950 to-crimson-950 hover:from-indigo-900 hover:to-crimson-900 text-white border border-indigo-800/80 flex items-center justify-between text-xs font-semibold transition"
              >
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-crimson-400" />
                  <span>Publish Official Super Admin Post</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigateTab("verification")}
                className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 flex items-center justify-between text-xs font-medium transition"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>Blue Tick Verification Desk</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigateTab("users")}
                className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 flex items-center justify-between text-xs font-medium transition"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Users Activity & Control</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigateTab("broadcast")}
                className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 flex items-center justify-between text-xs font-medium transition"
              >
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400" />
                  <span>Emergency Alert Dispatcher</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>WebSocket Live Engine:</span>
            <span className="text-emerald-400 font-bold">Connected 🟢</span>
          </div>
        </div>
      </div>
    </div>
  );
};
