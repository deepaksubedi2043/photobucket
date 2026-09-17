import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Building,
  Compass,
  Check,
  Search,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import {
  NEPAL_PROVINCES,
  NEPAL_DISTRICTS,
  POPULAR_CITIES,
  getCitiesForDistrict,
  getDistrictInfo,
  findDistrictForCity,
} from "../data/nepalAdministrativeData";

interface NepalLocationSelectorProps {
  district: string;
  city: string;
  province?: string;
  onLocationChange: (data: { district: string; city: string; province: string }) => void;
  accentColor?: "blue" | "crimson" | "amber";
  showPopularChips?: boolean;
  required?: boolean;
  idPrefix?: string;
  helperNote?: string;
}

export const NepalLocationSelector: React.FC<NepalLocationSelectorProps> = ({
  district,
  city,
  province,
  onLocationChange,
  accentColor = "blue",
  showPopularChips = true,
  required = true,
  idPrefix = "loc",
  helperNote,
}) => {
  const [districtSearch, setDistrictSearch] = useState("");
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);

  // Derive active province based on district
  const currentDistrictInfo = useMemo(() => {
    return getDistrictInfo(district);
  }, [district]);

  const activeProvince = province || currentDistrictInfo?.province || "Bagmati";

  // Available cities for selected district
  const availableCities = useMemo(() => {
    return getCitiesForDistrict(district || "Kathmandu");
  }, [district]);

  // Filtered districts for search
  const filteredDistricts = useMemo(() => {
    if (!districtSearch.trim()) return NEPAL_DISTRICTS;
    const q = districtSearch.toLowerCase();
    return NEPAL_DISTRICTS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.nepaliName.includes(q) ||
        d.province.toLowerCase().includes(q) ||
        d.cities.some((c) => c.toLowerCase().includes(q))
    );
  }, [districtSearch]);

  const handleSelectDistrict = (distName: string) => {
    const info = getDistrictInfo(distName);
    const newProv = info ? info.province : "Bagmati";
    const cities = getCitiesForDistrict(distName);
    // If current city is not in this district, default to first city or "All Cities"
    const newCity = cities.includes(city) ? city : (cities[1] || cities[0] || "Central City");
    
    onLocationChange({
      district: distName,
      city: newCity,
      province: newProv,
    });
    setIsDistrictDropdownOpen(false);
    setDistrictSearch("");
  };

  const handleSelectCity = (cityName: string) => {
    onLocationChange({
      district,
      city: cityName,
      province: activeProvince,
    });
  };

  const handleQuickSelectPopular = (pop: typeof POPULAR_CITIES[0]) => {
    onLocationChange({
      district: pop.district,
      city: pop.name,
      province: pop.province,
    });
  };

  const ringFocusClass =
    accentColor === "crimson"
      ? "focus:ring-[#DC143C]/30 focus:border-[#DC143C]"
      : accentColor === "amber"
      ? "focus:ring-amber-500/30 focus:border-amber-500"
      : "focus:ring-[#003893]/30 focus:border-[#003893]";

  const activeBadgeBg =
    accentColor === "crimson"
      ? "bg-rose-50 text-rose-800 border-rose-200"
      : accentColor === "amber"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-blue-50 text-[#003893] border-blue-200";

  return (
    <div className="space-y-2.5">
      {/* Popular Quick-Select Chips */}
      {showPopularChips && (
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Quick Select Popular Hubs (नेपालका मुख्य शहरहरू):</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            {POPULAR_CITIES.slice(0, 8).map((pop) => {
              const isSelected = district === pop.district && city === pop.name;
              return (
                <button
                  key={pop.name}
                  type="button"
                  onClick={() => handleQuickSelectPopular(pop)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap border transition-all cursor-pointer flex-shrink-0 ${
                    isSelected
                      ? accentColor === "crimson"
                        ? "bg-[#DC143C] text-white border-[#DC143C] shadow-xs"
                        : accentColor === "amber"
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-[#003893] text-white border-[#003893] shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {pop.name.split(" ")[0]} ({pop.district})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Two-Column Grid: District and City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* District Selector (All 77 Districts) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            District (जिल्ला) {required && <span className="text-[#DC143C]">*</span>}
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 z-10 pointer-events-none" />
            
            <select
              id={`${idPrefix}-district-select`}
              required={required}
              value={district || "Kathmandu"}
              onChange={(e) => handleSelectDistrict(e.target.value)}
              className={`w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:outline-hidden focus:ring-2 appearance-none cursor-pointer ${ringFocusClass}`}
            >
              {NEPAL_PROVINCES.map((prov) => {
                const distsInProv = NEPAL_DISTRICTS.filter(
                  (d) => d.province.toLowerCase() === prov.name.split(" ")[0].toLowerCase()
                );
                return (
                  <optgroup key={prov.id} label={`📍 ${prov.name} (${prov.nepaliName})`}>
                    {distsInProv.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} ({d.nepaliName})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* City / Municipality Selector (Auto shown for selected district) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            City / Municipality (शहर / नगरपालिका) {required && <span className="text-[#DC143C]">*</span>}
          </label>
          <div className="relative">
            <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 z-10 pointer-events-none" />
            
            <select
              id={`${idPrefix}-city-select`}
              required={required}
              value={city || availableCities[0]}
              onChange={(e) => handleSelectCity(e.target.value)}
              className={`w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:outline-hidden focus:ring-2 appearance-none cursor-pointer ${ringFocusClass}`}
            >
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Selected Location Summary & Boosting Benefit Badge */}
      <div className="p-2.5 rounded-xl border bg-slate-50/70 text-[11px] text-slate-600 flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Compass className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span className="font-semibold text-slate-700">Selected Location:</span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${activeBadgeBg}`}>
            {city || "Central City"}, {district} ({activeProvince} Province)
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
          Nepal 77 Districts
        </span>
      </div>

      {/* Helper Note for Business Boosting & Tracking */}
      {helperNote ? (
        <p className="text-[11px] text-slate-500 italic">{helperNote}</p>
      ) : (
        <p className="text-[11px] text-slate-500 leading-tight">
          💡 <strong>Nepal Local Discovery:</strong> Setting your District & City enables localized photo feed curation and allows Business owners to track and boost posts <strong>City-wise</strong>, <strong>District-wise</strong>, or across <strong>All Nepal</strong>.
        </p>
      )}
    </div>
  );
};
