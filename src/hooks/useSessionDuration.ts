import { useState, useEffect } from "react";

export interface SessionDurationInfo {
  hours: number;
  minutes: number;
  seconds: number;
  totalMinutes: number;
  formattedShort: string;
  formattedDetailed: string;
  formattedNepali: string;
  startTime: string;
  formattedHeaderBadge: string;
}

export function useSessionDuration(userId?: string, language: "en" | "ne" = "en"): SessionDurationInfo {
  const [duration, setDuration] = useState<SessionDurationInfo>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMinutes: 0,
    formattedShort: "0m",
    formattedDetailed: "Just logged in",
    formattedNepali: "भर्खरै लगइन",
    startTime: "",
    formattedHeaderBadge: "0m",
  });

  useEffect(() => {
    if (!userId) return;
    const key = `pb_session_start_${userId}`;
    let startTimeMs = 0;
    try {
      startTimeMs = parseInt(localStorage.getItem(key) || "0", 10);
    } catch {
      startTimeMs = 0;
    }

    // If not set or corrupted, save current timestamp
    if (!startTimeMs || isNaN(startTimeMs) || startTimeMs > Date.now()) {
      startTimeMs = Date.now();
      try {
        localStorage.setItem(key, startTimeMs.toString());
      } catch {
        // Safe fallback in restricted environments
      }
    }

    const calculate = () => {
      const diffMs = Math.max(0, Date.now() - startTimeMs);
      const totalSeconds = Math.floor(diffMs / 1000);
      const totalMinutes = Math.floor(totalSeconds / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const seconds = totalSeconds % 60;

      const formattedShort =
        hours > 0 ? `${hours}h ${minutes}m` : `${Math.max(1, minutes)}m`;

      const formattedDetailed =
        hours > 0
          ? `${hours} hr${hours > 1 ? "s" : ""} ${minutes} min${minutes !== 1 ? "s" : ""}`
          : `${Math.max(1, minutes)} minute${minutes !== 1 ? "s" : ""}`;

      const formattedNepali =
        hours > 0
          ? `${hours} घण्टा ${minutes} मिनेट`
          : `${Math.max(1, minutes)} मिनेट`;

      const startTimeFormatted = new Date(startTimeMs).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const formattedHeaderBadge =
        language === "ne"
          ? hours > 0
            ? `${hours}घण्टा ${minutes}मिनेट`
            : `${Math.max(1, minutes)}मिनेट`
          : formattedShort;

      setDuration({
        hours,
        minutes,
        seconds,
        totalMinutes,
        formattedShort,
        formattedDetailed,
        formattedNepali,
        startTime: startTimeFormatted,
        formattedHeaderBadge,
      });
    };

    calculate();
    // Update every 10 seconds for real-time accuracy without performance penalty
    const timer = setInterval(calculate, 10000);
    return () => clearInterval(timer);
  }, [userId, language]);

  return duration;
}
