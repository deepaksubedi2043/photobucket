import React from "react";
import { Heart, MessageCircle, Upload, MapPin, Sparkles, X } from "lucide-react";

export interface LiveNotification {
  id: string;
  type: "like" | "comment" | "post" | "story" | "sync";
  title: string;
  subtitle: string;
  avatar?: string;
  timestamp: string;
}

interface LiveNotificationToastProps {
  notifications: LiveNotification[];
  onDismiss: (id: string) => void;
}

export const LiveNotificationToast: React.FC<LiveNotificationToastProps> = ({
  notifications,
  onDismiss,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div
      id="live-notifications-container"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {notifications.slice(-3).map((notif) => {
        return (
          <div
            key={notif.id}
            className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl border border-slate-700 shadow-xl flex items-start gap-3 animate-in slide-in-from-bottom-3 duration-200"
          >
            {/* Icon/Avatar */}
            <div className="relative flex-shrink-0 mt-0.5">
              {notif.avatar ? (
                <img
                  src={notif.avatar}
                  alt="User"
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#003893] text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
              )}

              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#DC143C] text-white flex items-center justify-center text-[8px]">
                {notif.type === "like" && <Heart className="w-2.5 h-2.5 fill-white" />}
                {notif.type === "comment" && <MessageCircle className="w-2.5 h-2.5" />}
                {notif.type === "post" && <Upload className="w-2.5 h-2.5" />}
                {notif.type === "sync" && <Sparkles className="w-2.5 h-2.5" />}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold leading-tight truncate text-slate-100">
                {notif.title}
              </div>
              <div className="text-[11px] text-slate-300 leading-snug truncate mt-0.5">
                {notif.subtitle}
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-1">
                Real-time WebSocket Sync
              </div>
            </div>

            {/* Close */}
            <button
              onClick={() => onDismiss(notif.id)}
              className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
