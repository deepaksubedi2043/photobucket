import React from "react";
import { Smartphone, Monitor, Columns2, Wifi, Battery, Signal, Sparkles } from "lucide-react";
import { Logo } from "./Logo";

interface DeviceSimulatorFrameProps {
  children: React.ReactNode;
  platformName?: string;
  isSyncing?: boolean;
}

export const MobileAppSimulatorFrame: React.FC<DeviceSimulatorFrameProps> = ({
  children,
  platformName = "Photo Bucket Mobile App (iOS / Android)",
  isSyncing = true,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900/60 transition-colors">
      {/* Platform Info Header */}
      <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-800/90 px-3.5 py-1.5 rounded-full shadow-xs border border-slate-200 dark:border-slate-700">
        <Smartphone className="w-4 h-4 text-[#DC143C]" />
        <span>{platformName}</span>
        {isSyncing && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Cloud Sync
          </span>
        )}
      </div>

      {/* Realistic Mobile Device Frame */}
      <div className="relative w-full max-w-[410px] h-[840px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 dark:border-slate-700 flex flex-col ring-1 ring-slate-900/10">
        {/* Dynamic Island / Speaker Notch */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-end px-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800" />
        </div>

        {/* Mobile Status Bar */}
        <div className="h-6 w-full flex items-center justify-between px-6 text-[11px] font-bold text-slate-800 dark:text-slate-200 z-40 bg-white dark:bg-slate-900 rounded-t-[38px] pt-1 transition-colors">
          <span className="font-mono">9:41</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3 h-3 text-slate-700 dark:text-slate-300" />
            <Wifi className="w-3 h-3 text-slate-700 dark:text-slate-300" />
            <Battery className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
          </div>
        </div>

        {/* Screen Container */}
        <div className="flex-1 bg-white dark:bg-slate-950 rounded-b-[38px] overflow-hidden flex flex-col relative transition-colors">
          <div className="flex-1 overflow-y-auto scrollbar-none">{children}</div>
        </div>

        {/* Bottom Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full z-40 pointer-events-none" />
      </div>
    </div>
  );
};
