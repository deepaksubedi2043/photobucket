import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  className?: string;
  isNepaliFirst?: boolean;
  variant?: "default" | "dark";
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showTagline = false,
  className = "",
  isNepaliFirst = true,
  variant = "default",
}) => {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-4xl",
  };

  const isDarkVariant = variant === "dark";

  return (
    <div id="photo-bucket-logo" className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Visual Logo Mark: Nepal Double Triangle + Aperture in Crimson Red & Royal Blue */}
      <div className={`relative flex-shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Base Bucket / Frame Outline in Royal Blue */}
          <path
            d="M8 12C8 9.79086 9.79086 8 12 8H36C38.2091 8 40 9.79086 40 12V34C40 38.4183 36.4183 42 32 42H16C11.5817 42 8 38.4183 8 34V12Z"
            fill={isDarkVariant ? "#38bdf8" : "#003893"}
            fillOpacity={isDarkVariant ? "0.18" : "0.08"}
            stroke={isDarkVariant ? "#60a5fa" : "#003893"}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Upper Nepali Crimson Pennant / Mountain Peak */}
          <path
            d="M13 14L34 20L20 25L13 25V14Z"
            fill="#DC143C"
          />
          {/* Lower Nepali Crimson Pennant with Sun/Moon Aperture */}
          <path
            d="M13 25L32 31L18 36L13 36V25Z"
            fill="#DC143C"
          />

          {/* Central Camera Lens / White Sun Emblem */}
          <circle cx="27" cy="25" r="4.5" fill="#FFFFFF" stroke={isDarkVariant ? "#60a5fa" : "#003893"} strokeWidth="1.5" />
          <circle cx="27" cy="25" r="2" fill="#DC143C" />

          {/* Minimalist Top Handle */}
          <path
            d="M18 8C18 5.5 20.5 4 24 4C27.5 4 30 5.5 30 8"
            stroke={isDarkVariant ? "#60a5fa" : "#003893"}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Typography: फोटो (Nepali) in Crimson Red + Bucket (English) in Royal Blue or Pure White on Dark */}
      <div className="flex flex-col justify-center">
        <div className={`font-extrabold tracking-tight leading-none flex items-baseline gap-1.5 ${textSizes[size]}`}>
          <span className="text-[#DC143C] dark:text-rose-400 font-['Mukta'] font-bold drop-shadow-xs">
            फोटो
          </span>
          <span
            className={`${
              isDarkVariant
                ? "text-white font-['Plus_Jakarta_Sans'] font-extrabold tracking-normal"
                : "text-[#003893] dark:text-blue-400 font-['Plus_Jakarta_Sans'] font-extrabold tracking-normal"
            }`}
          >
            Bucket
          </span>
        </div>
        {showTagline && (
          <div className="flex items-center gap-1 mt-1">
            <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0 inline-block animate-pulse" />
            <span
              className={`text-[7.5px] sm:text-[8px] font-semibold font-['Mukta'] tracking-wide whitespace-nowrap leading-none ${
                isDarkVariant
                  ? "text-emerald-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              नेपालको आफ्नै फोटो चौतारी
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
