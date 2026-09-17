import React, { useState, useEffect } from "react";
import { User, PageOrGroup } from "../types";
import { api, realtime } from "../services/api";
import {
  Building2,
  Users,
  Plus,
  Search,
  Lock,
  Globe,
  MapPin,
  Tag,
  Check,
  Trash2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Eye,
  RefreshCw,
} from "lucide-react";
import { CreatePageOrGroupModal } from "./CreatePageOrGroupModal";

interface PagesAndGroupsHubProps {
  currentUser: User;
  language: "en" | "ne";
}

export const PagesAndGroupsHub: React.FC<PagesAndGroupsHubProps> = ({
  currentUser,
  language,
}) => {
  const [items, setItems] = useState<PageOrGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "page" | "group">("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "public" | "private">("all");
  const [onlyMine, setOnlyMine] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialType, setCreateInitialType] = useState<"page" | "group">("page");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getPagesAndGroups();
      if (res.success) {
        setItems(res.items);
      }
    } catch (e) {
      console.error("Failed to load pages and groups", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    const unsubCreated = realtime.subscribe("page_group:created", (newItem: PageOrGroup) => {
      setItems((prev) => [newItem, ...prev]);
    });
    const unsubUpdated = realtime.subscribe("page_group:updated", (updatedItem: PageOrGroup) => {
      setItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
    });
    const unsubDeleted = realtime.subscribe("page_group:deleted", ({ id }: { id: string }) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, []);

  const handleToggleJoin = async (id: string) => {
    try {
      const res = await api.toggleJoinPageOrGroup(id, currentUser.id);
      if (res.success) {
        setItems((prev) => prev.map((item) => (item.id === id ? res.item : item)));
        setActionNotice(res.isMember ? "Joined successfully!" : "Left group/page.");
        setTimeout(() => setActionNotice(null), 2500);
      }
    } catch (e) {
      console.error("Join toggle failed", e);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action is irreversible and will restore 1 quota slot.`)) {
      return;
    }
    try {
      const res = await api.deletePageOrGroup(id, currentUser.id);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setActionNotice(`"${name}" deleted. Quota slot restored.`);
        setTimeout(() => setActionNotice(null), 2500);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete.");
    }
  };

  // Quota counts for current user
  const myPagesCount = items.filter((i) => i.type === "page" && i.creatorId === currentUser.id).length;
  const myGroupsCount = items.filter((i) => i.type === "group" && i.creatorId === currentUser.id).length;

  // Filtered display list
  let displayList = [...items];
  if (typeFilter !== "all") {
    displayList = displayList.filter((i) => i.type === typeFilter);
  }
  if (visibilityFilter !== "all") {
    displayList = displayList.filter((i) => i.visibility === visibilityFilter);
  }
  if (onlyMine) {
    displayList = displayList.filter((i) => i.creatorId === currentUser.id);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayList = displayList.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.nepaliName && i.nepaliName.includes(q)) ||
        i.description.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return (
    <div id="pages-and-groups-hub" className="space-y-6">
      {/* Quota & Creation Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-[#001d4a] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#DC143C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Official Hub • Pages & Groups Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Mukta'] text-white">
              {language === "ne" ? "पेज र समूह चौतारी" : "Pages & Community Groups Hub"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Create official brand pages or private/public community circles across Nepal. Both Personal and Business accounts can create up to 3 Pages and 3 Groups each with automated name uniqueness verification.
            </p>

            {/* Quota Counters Pill */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-300" />
                <span>Page Quota: </span>
                <strong className={myPagesCount >= 3 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                  {myPagesCount} / 3 Used
                </strong>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-300" />
                <span>Group Quota: </span>
                <strong className={myGroupsCount >= 3 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                  {myGroupsCount} / 3 Used
                </strong>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              id="create-page-btn"
              onClick={() => {
                setCreateInitialType("page");
                setIsCreateModalOpen(true);
              }}
              disabled={myPagesCount >= 3}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-[#003893] hover:from-blue-500 hover:to-blue-700 text-white font-bold text-xs shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-blue-200" />
              <span>+ Create Page (पेज बनाउनुहोस्)</span>
            </button>

            <button
              id="create-group-btn"
              onClick={() => {
                setCreateInitialType("group");
                setIsCreateModalOpen(true);
              }}
              disabled={myGroupsCount >= 3}
              className="px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xs"
            >
              <Users className="w-4 h-4 text-rose-300" />
              <span>+ Create Group (समूह बनाउनुहोस्)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages or groups by name/district..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-800 focus:bg-white focus:border-[#003893] outline-hidden transition-colors"
            />
          </div>

          {/* Type Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setTypeFilter("all")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === "all" ? "bg-white text-[#003893] shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setTypeFilter("page")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                typeFilter === "page" ? "bg-[#003893] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Pages</span>
            </button>
            <button
              onClick={() => setTypeFilter("group")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                typeFilter === "group" ? "bg-[#003893] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Groups</span>
            </button>
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs">
          <span className="text-slate-400 font-medium">Filter by:</span>

          <button
            onClick={() => setVisibilityFilter("all")}
            className={`px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
              visibilityFilter === "all"
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            All Visibilities
          </button>
          <button
            onClick={() => setVisibilityFilter("public")}
            className={`px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              visibilityFilter === "public"
                ? "bg-emerald-700 text-white border-emerald-700"
                : "bg-white text-emerald-700 border-slate-200 hover:bg-emerald-50/50"
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Public</span>
          </button>
          <button
            onClick={() => setVisibilityFilter("private")}
            className={`px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              visibilityFilter === "private"
                ? "bg-amber-700 text-white border-amber-700"
                : "bg-white text-amber-700 border-slate-200 hover:bg-amber-50/50"
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Private</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          <button
            onClick={() => setOnlyMine(!onlyMine)}
            className={`px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              onlyMine
                ? "bg-[#003893] text-white border-[#003893]"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>My Created ({myPagesCount + myGroupsCount}/6)</span>
          </button>
        </div>
      </div>

      {/* Pages and Groups Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#003893]" />
          <p className="text-xs">Loading Pages and Groups...</p>
        </div>
      ) : displayList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No Pages or Groups Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery ? "Try refining your search keyword." : "Be the first to create an official page or private community group for your district!"}
          </p>
          <button
            onClick={() => {
              setCreateInitialType("page");
              setIsCreateModalOpen(true);
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#003893] text-white text-xs font-bold shadow-sm hover:bg-[#002d75] transition-all cursor-pointer"
          >
            + Create One Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayList.map((item) => {
            const isCreator = item.creatorId === currentUser.id;
            const isMember = item.members.includes(currentUser.id);

            return (
              <div
                key={item.id}
                id={`page-group-card-${item.id}`}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col"
              >
                {/* Cover Image Stage */}
                <div className="h-32 bg-slate-900 relative overflow-hidden">
                  <img
                    src={item.coverImage}
                    alt={item.name}
                    className="w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Badges in top corners */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 backdrop-blur-xs ${
                        item.type === "page"
                          ? "bg-blue-600/90 text-white border border-blue-400/40"
                          : "bg-purple-600/90 text-white border border-purple-400/40"
                      }`}
                    >
                      {item.type === "page" ? <Building2 className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                      <span>{item.type.toUpperCase()}</span>
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs ${
                        item.visibility === "public"
                          ? "bg-emerald-600/90 text-white border border-emerald-400/40"
                          : "bg-amber-600/90 text-white border border-amber-400/40"
                      }`}
                    >
                      {item.visibility === "public" ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{item.visibility === "public" ? "Public" : "Private"}</span>
                    </span>
                  </div>

                  {item.district && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-400" />
                      <span>{item.district}</span>
                    </div>
                  )}

                  {/* Avatar overlapping */}
                  <div className="absolute -bottom-5 left-5 w-14 h-14 rounded-2xl p-1 bg-white shadow-md border border-slate-200">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 pt-8 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base font-['Mukta'] leading-snug">
                          {item.name}
                        </h3>
                        {item.nepaliName && (
                          <div className="text-xs text-slate-500 font-['Mukta']">{item.nepaliName}</div>
                        )}
                      </div>

                      {item.isVerified && (
                        <span className="shrink-0 p-1 rounded-full bg-blue-50 text-[#003893]" title="Verified">
                          <ShieldCheck className="w-4 h-4" />
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Creator Metadata */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <span>Created by:</span>
                        <strong className="text-slate-800 font-semibold">{item.creatorName}</strong>
                        <span className={`px-1.5 py-0.2 rounded-md font-bold text-[9px] ${
                          item.creatorRole === "business" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {item.creatorRole === "business" ? "Business" : "Personal"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 font-mono font-semibold">
                        <span>{item.membersCount.toLocaleString()} {item.type === "page" ? "followers" : "members"}</span>
                        <span>•</span>
                        <span>{item.postsCount} posts</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleJoin(item.id)}
                      className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isMember
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                          : "bg-[#003893] hover:bg-[#002d75] text-white shadow-xs"
                      }`}
                    >
                      {isMember ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{item.type === "page" ? "Following" : "Joined"}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>{item.type === "page" ? "Follow Page" : "Join Group"}</span>
                        </>
                      )}
                    </button>

                    {isCreator && (
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                        title="Delete (Frees up your 3-item quota)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Creating Page or Group */}
      {isCreateModalOpen && (
        <CreatePageOrGroupModal
          currentUser={currentUser}
          initialType={createInitialType}
          language={language}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={(newItem) => {
            setItems((prev) => [newItem, ...prev]);
            setActionNotice(`"${newItem.name}" created successfully!`);
            setTimeout(() => setActionNotice(null), 3000);
          }}
        />
      )}
    </div>
  );
};
