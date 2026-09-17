import React, { useState, useEffect } from "react";
import { User } from "../types";
import { api, realtime } from "../services/api";
import {
  Users,
  MessageCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Radio,
  MapPin,
  RefreshCw,
  Eye,
} from "lucide-react";

interface FollowersOnlineWidgetProps {
  currentUser: User;
  allUsers: User[];
  activeUserIds: string[];
  followingMap?: Record<string, string[]>;
  language: "en" | "ne";
  onSelectUser: (user: User) => void;
  onOpenDirectMessage: (user: User) => void;
  onFollowToggled?: () => void;
}

export const FollowersOnlineWidget: React.FC<FollowersOnlineWidgetProps> = ({
  currentUser,
  allUsers,
  activeUserIds,
  followingMap = {},
  language,
  onSelectUser,
  onOpenDirectMessage,
  onFollowToggled,
}) => {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [offlineMutuals, setOfflineMutuals] = useState<User[]>([]);
  const [showAllMutuals, setShowAllMutuals] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Compute two-way followed users (Mutuals) and partition by active/online status
  const computeMutuals = () => {
    if (!currentUser) return;

    const myFollowing = followingMap[currentUser.id] || [];

    // Filter users that currentUser follows AND who follow currentUser back
    const mutuals = allUsers.filter((u) => {
      if (u.id === currentUser.id || u.isSuperAdmin) return false;
      const iFollowThem = myFollowing.includes(u.id);
      const theyFollowMe = (followingMap[u.id] || []).includes(currentUser.id);
      return iFollowThem && theyFollowMe;
    });

    const onlineList = mutuals.filter((u) => activeUserIds.includes(u.id));
    const offlineList = mutuals.filter((u) => !activeUserIds.includes(u.id));

    setOnlineUsers(onlineList);
    setOfflineMutuals(offlineList);
  };

  useEffect(() => {
    computeMutuals();
  }, [currentUser?.id, allUsers, activeUserIds, followingMap]);

  // Real-time listener for follow updates and presence
  useEffect(() => {
    const unsubPresence = realtime.subscribe("presence:updated", () => {
      computeMutuals();
    });

    const unsubFollow = realtime.subscribe("user:follow_changed", () => {
      computeMutuals();
      if (onFollowToggled) onFollowToggled();
    });

    return () => {
      unsubPresence();
      unsubFollow();
    };
  }, [currentUser?.id, allUsers, activeUserIds, followingMap]);

  // Toggle user presence for testing / simulation
  const handleToggleFriendPresence = async (targetUser: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSimulating(true);
    try {
      await api.togglePresence(targetUser.id);
    } catch (err) {
      console.warn("Toggle presence failed", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const totalMutualCount = onlineUsers.length + offlineMutuals.length;

  return (
    <div
      id="followers-online-widget"
      className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 rounded-3xl p-4 text-white shadow-sm border border-slate-800 relative overflow-hidden transition-all duration-300"
    >
      {/* Subtle background glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5 font-['Mukta']">
              <span>{language === "ne" ? "अनलाइन फलोअर्स" : "Followers Online"}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>
                  {onlineUsers.length} {language === "ne" ? "सक्रिय" : "Online"}
                </span>
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-cyan-400" />
              <span>
                {language === "ne"
                  ? "दुईतर्फी साथीहरू (Two-way followed)"
                  : "Mutual 2-way followed users"}
              </span>
            </div>
          </div>
        </div>

        {totalMutualCount > 0 && (
          <button
            onClick={() => setShowAllMutuals(!showAllMutuals)}
            className="text-[11px] px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer flex items-center gap-1"
            title="Toggle All Mutual Followers"
          >
            <span>{totalMutualCount}</span>
            <ChevronRight
              className={`w-3 h-3 transition-transform ${showAllMutuals ? "rotate-90" : ""}`}
            />
          </button>
        )}
      </div>

      {/* Online Users List */}
      <div className="mt-3 space-y-2 relative z-10">
        {onlineUsers.length > 0 ? (
          <div className="space-y-1.5">
            {onlineUsers.map((user) => (
              <div
                key={user.id}
                id={`online-user-${user.username}`}
                onClick={() => onSelectUser(user)}
                className="group flex items-center justify-between p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer"
              >
                {/* User Info & Avatar */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-9 h-9 rounded-xl object-cover ring-1 ring-emerald-500/50"
                    />
                    {/* Pulsing Green Online Indicator */}
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900" />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-100 truncate">
                      <span className="truncate">
                        {language === "ne" && user.nepaliName ? user.nepaliName : user.fullName}
                      </span>
                      {user.isVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
                      <span className="text-slate-300">@{user.username}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">
                        {language === "ne" ? "अहिले सक्रिय" : "Active now"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Send Message & Profile */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    id={`dm-btn-${user.username}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDirectMessage(user);
                    }}
                    className="p-1.5 rounded-xl bg-[#003893]/70 hover:bg-[#003893] text-cyan-200 hover:text-white transition-all cursor-pointer shadow-2xs group-hover:scale-105"
                    title={language === "ne" ? "सन्देश पठाउनुहोस्" : "Message"}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty state: No two-way followers online right now */
          <div className="py-3 px-2 text-center rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <div className="w-8 h-8 mx-auto rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-300">
              {language === "ne"
                ? "अहिले कुनै दुईतर्फी साथीहरू अनलाइन छैनन्"
                : "No mutual followers online right now"}
            </p>
            <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">
              {language === "ne"
                ? "तपाईंले फलो गरेका र तपाईंलाई फलो ब्याक गरेका साथीहरू अनलाइन हुँदा यहाँ देखिनेछन्।"
                : "When creators you follow who also follow you back come online, they appear here live."}
            </p>
          </div>
        )}

        {/* Offline Mutuals Drawer / Section (if expanded or available) */}
        {showAllMutuals && offlineMutuals.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">
              {language === "ne" ? "अफलाइन दुईतर्फी साथीहरू" : "Offline Mutual Followers"} (
              {offlineMutuals.length})
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
              {offlineMutuals.map((user) => (
                <div
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className="flex items-center justify-between p-1.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="w-7 h-7 rounded-lg object-cover grayscale opacity-70"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-slate-500 border border-slate-900" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-slate-300 font-medium truncate text-[11px]">
                        {language === "ne" && user.nepaliName ? user.nepaliName : user.fullName}
                      </div>
                      <div className="text-[9px] text-slate-500">@{user.username}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Quick simulate online toggle */}
                    <button
                      onClick={(e) => handleToggleFriendPresence(user, e)}
                      disabled={isSimulating}
                      className="px-1.5 py-0.5 rounded-md bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-[9px] text-slate-400 border border-white/5 transition"
                      title="Simulate this friend coming online"
                    >
                      {language === "ne" ? "अनलाइन बनाउनुहोस्" : "Set Online"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer info tip */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Real-time Presence</span>
        </span>
        <span className="text-slate-500">
          {totalMutualCount} {language === "ne" ? "कुल दोहोरो साथीहरू" : "Total 2-way follows"}
        </span>
      </div>
    </div>
  );
};
