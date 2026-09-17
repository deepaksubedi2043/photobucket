import React, { useState } from "react";
import { ShieldCheck, Sparkles, Check, Building2, Briefcase, Star, Camera, Landmark, UserCheck } from "lucide-react";
import { VerificationCategory } from "../types";

interface VerifiedBadgeProps {
  category?: VerificationCategory | string;
  badgeTitle?: string;
  size?: "xs" | "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  category = "creator",
  badgeTitle,
  size = "sm",
  showTooltip = true,
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getCategoryMeta = () => {
    switch (category) {
      case "celebrity":
        return {
          label: "Verified Celebrity",
          nepaliLabel: "प्रमाणीकृत सेलिब्रेटी",
          icon: Star,
          color: "text-amber-500",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          description: "High-notability artist, actor, musician or public figure verified with official government identity documents.",
        };
      case "businessman":
        return {
          label: "Verified Businessman",
          nepaliLabel: "प्रमाणीकृत व्यवसायी",
          icon: Building2,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          description: "Distinguished corporate leader or business owner authenticated with PAN, Tax & Registration credentials.",
        };
      case "entrepreneur":
        return {
          label: "Verified Entrepreneur",
          nepaliLabel: "प्रमाणीकृत उद्यमी",
          icon: Briefcase,
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200",
          description: "Startup founder or innovative enterprise builder verified by Super Admin with corporate authentication.",
        };
      case "organization":
        return {
          label: "Verified Organization",
          nepaliLabel: "प्रमाणीकृत संस्था",
          icon: Landmark,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          description: "Registered institutional entity, enterprise or media organization verified under Nepal Law.",
        };
      case "public_figure":
        return {
          label: "Verified Public Figure",
          nepaliLabel: "प्रमाणीकृत सार्वजनिक व्यक्तित्व",
          icon: UserCheck,
          color: "text-indigo-600",
          bgColor: "bg-indigo-50",
          borderColor: "border-indigo-200",
          description: "Recognized community advocate, author or leader verified with government credentials.",
        };
      case "creator":
      default:
        return {
          label: badgeTitle || "Verified Creator",
          nepaliLabel: "प्रमाणीकृत सर्जक",
          icon: Camera,
          color: "text-[#003893]",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          description: "Authenticated visual storyteller verified with citizenship / national ID & Super Admin approval.",
        };
    }
  };

  const meta = getCategoryMeta();
  const IconComp = meta.icon;

  const sizeClasses = {
    xs: "w-3 h-3 text-[8px]",
    sm: "w-4 h-4 text-[9px]",
    md: "w-5 h-5 text-[11px]",
    lg: "w-6 h-6 text-[13px]",
  };

  const iconSizes = {
    xs: "w-2 h-2",
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
  };

  return (
    <span
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => e.stopPropagation()}
    >
      {/* The Official Blue Tick Badge Pill / Circle */}
      <span
        title={meta.label}
        className={`${sizeClasses[size]} rounded-full bg-[#003893] text-white flex items-center justify-center font-bold shadow-xs cursor-pointer ring-1.5 ring-white transition-transform hover:scale-110`}
      >
        <Check className={`${iconSizes[size]} stroke-[3.5]`} />
      </span>

      {/* Floating Detailed Hover Popover */}
      {showTooltip && isHovered && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-3 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 text-left animate-in fade-in zoom-in-95 duration-150 pointer-events-none"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`p-1 rounded-lg ${meta.bgColor} ${meta.color} border ${meta.borderColor}`}>
              <IconComp className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span>{badgeTitle || meta.label}</span>
                <span className="text-[10px] text-blue-400 font-mono">✓</span>
              </div>
              <div className="text-[10px] text-slate-300 font-['Mukta']">
                {meta.nepaliLabel}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-300 leading-snug mb-2">
            {meta.description}
          </p>

          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3 h-3" />
              <span>Super Admin Approved</span>
            </span>
            <span className="font-mono text-slate-500">ID Authenticated</span>
          </div>

          {/* Popover Pointer Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
        </span>
      )}
    </span>
  );
};
