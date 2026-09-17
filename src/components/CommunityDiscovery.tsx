import React, { useState } from "react";
import { Community, User, Post } from "../types";
import { Users, Sparkles, Flame, Tag, Check, ChevronRight, MessageSquare, Plus, Building2 } from "lucide-react";
import { PagesAndGroupsHub } from "./PagesAndGroupsHub";

interface CommunityDiscoveryProps {
  communities: Community[];
  users: User[];
  posts: Post[];
  currentUser: User;
  onSelectTag: (tag: string) => void;
  onSelectUser: (user: User) => void;
  language: "en" | "ne";
}

export const CommunityDiscovery: React.FC<CommunityDiscoveryProps> = ({
  communities,
  users,
  posts,
  currentUser,
  onSelectTag,
  onSelectUser,
  language,
}) => {
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>(["comm_1", "comm_3"]);
  const [activeTab, setActiveTab] = useState<"pages_groups" | "chautaris" | "creators" | "topics">("pages_groups");

  const toggleJoin = (commId: string) => {
    if (joinedCommunities.includes(commId)) {
      setJoinedCommunities(joinedCommunities.filter((id) => id !== commId));
    } else {
      setJoinedCommunities([...joinedCommunities, commId]);
    }
  };

  const trendingTags = [
    { tag: "#VisitNepal", postsCount: "42.8K", desc: "Showcase the best of Nepal to the world" },
    { tag: "#Himalayas", postsCount: "35.2K", desc: "Summit views, glaciers & trekking trails" },
    { tag: "#MomoLovers", postsCount: "28.4K", desc: "The official soul food of every Nepali" },
    { tag: "#HeritageNepal", postsCount: "19.7K", desc: "1000-year temples, guthi & newa art" },
    { tag: "#KathmanduVibes", postsCount: "31.0K", desc: "Street life, microbuses & old courtyards" },
    { tag: "#PokharaDiaries", postsCount: "22.5K", desc: "Lakeside sunsets & paragliding skies" },
  ];

  return (
    <div id="community-discovery-section" className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-[#DC143C] text-xs font-bold mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>{language === "ne" ? "नेपाली फोटो चौतारी" : "Nepali Photo Chautari"}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-['Mukta']">
              {language === "ne"
                ? "नेपाली समुदाय र नयाँ फोटोग्राफरहरू पत्ता लगाउनुहोस्"
                : "Connect with Nepali Creators & Communities"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Join focused Chautaris for landscape masters, street food enthusiasts, cultural preservers, and Himalayan mountaineers.
            </p>
          </div>
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-2 mt-5 border-t border-slate-100 pt-3.5 flex-wrap">
          <button
            onClick={() => setActiveTab("pages_groups")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "pages_groups"
                ? "bg-[#003893] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{language === "ne" ? "पेज र समूहहरू (३ कोटा)" : "Pages & Groups (3 Quota)"}</span>
          </button>
          <button
            onClick={() => setActiveTab("chautaris")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "chautaris"
                ? "bg-[#003893] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            {language === "ne" ? "चौतारी समूहहरू" : "Chautari Hubs"}
          </button>
          <button
            onClick={() => setActiveTab("creators")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "creators"
                ? "bg-[#DC143C] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            {language === "ne" ? "लोकप्रिय फोटोग्राफरहरू" : "Top Creators"}
          </button>
          <button
            onClick={() => setActiveTab("topics")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "topics"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            {language === "ne" ? "ट्रेन्डिङ विषयहरू" : "Trending Tags"}
          </button>
        </div>
      </div>

      {/* PAGES & GROUPS TAB */}
      {activeTab === "pages_groups" && (
        <PagesAndGroupsHub currentUser={currentUser} language={language} />
      )}

      {/* CHAUTARIS TAB */}
      {activeTab === "chautaris" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {communities.map((comm) => {
            const isJoined = joinedCommunities.includes(comm.id);
            return (
              <div
                key={comm.id}
                id={`community-card-${comm.slug}`}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-32 bg-slate-800 overflow-hidden">
                    <img
                      src={comm.coverImage}
                      alt={comm.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-2.5 left-3.5 right-3.5 text-white">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/50 backdrop-blur-xs">
                        {comm.category}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base leading-tight mt-1">
                        {comm.name}
                      </h3>
                      <div className="text-xs text-rose-300 font-['Mukta'] font-medium">
                        {comm.nepaliName}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {comm.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {comm.tags.map((tag) => (
                        <span
                          key={tag}
                          onClick={() => onSelectTag(tag)}
                          className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-[#003893] cursor-pointer hover:bg-blue-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-1 flex items-center justify-between border-t border-slate-100">
                  <div className="text-[11px] text-slate-500 font-mono">
                    <strong className="text-slate-900">{comm.membersCount.toLocaleString()}</strong> members •{" "}
                    <strong className="text-slate-900">{comm.postsCount.toLocaleString()}</strong> posts
                  </div>

                  <button
                    onClick={() => toggleJoin(comm.id)}
                    className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isJoined
                        ? "bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-[#DC143C]"
                        : "bg-[#003893] hover:bg-[#002a70] text-white shadow-xs"
                    }`}
                  >
                    {isJoined ? "Joined ✓" : "+ Join Chautari"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATORS TAB */}
      {activeTab === "creators" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 divide-y divide-slate-100 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 px-1">
            Top Nepali Visual Creators to Follow:
          </div>
          {users.map((u, idx) => (
            <div
              key={u.id}
              className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                <img
                  src={u.avatar}
                  alt={u.fullName}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-[#003893]/20"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900">{u.fullName}</span>
                    {u.isVerified && (
                      <span className="w-3.5 h-3.5 rounded-full bg-[#003893] text-white text-[9px] flex items-center justify-center font-bold">
                        ✓
                      </span>
                    )}
                    {u.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-[#DC143C]">
                        {u.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">@{u.username} • {u.location}</div>
                  <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{u.bio}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900">{u.followersCount.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400">followers</div>
                </div>

                <button
                  onClick={() => onSelectUser(u)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#003893] hover:text-white text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TRENDING TOPICS TAB */}
      {activeTab === "topics" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {trendingTags.map((t) => (
            <div
              key={t.tag}
              onClick={() => onSelectTag(t.tag)}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-[#DC143C] transition-all cursor-pointer flex items-center justify-between group shadow-xs"
            >
              <div>
                <div className="text-sm font-bold text-[#003893] group-hover:text-[#DC143C] transition-colors flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{t.tag}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{t.desc}</div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-800">{t.postsCount}</span>
                <div className="text-[10px] text-slate-400">photos</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
