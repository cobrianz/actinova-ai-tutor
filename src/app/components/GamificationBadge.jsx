"use client";

import { getRarityColor } from "@/lib/gamification";

const BADGE_ICONS = {
  "1": "📖", "2": "🔥", "3": "🔥", "4": "🔥", "5": "🔥",
  "6": "🧠", "7": "🧠", "8": "🧠",
  "9": "🏆", "10": "🏆", "11": "🏆",
  "12": "💾", "13": "💾", "14": "💾",
  "15": "⭐", "16": "⭐", "17": "⭐",
  "18": "⚡", "19": "⚡", "20": "⚡",
  "21": "📅",
};

export default function GamificationBadge({ badge, size = "md" }) {
  const rarityColor = getRarityColor(badge.rarity);
  const icon = BADGE_ICONS[badge.icon] || "🎖";

  const sizeClasses = {
    sm: "w-10 h-10 text-lg",
    md: "w-14 h-14 text-2xl",
    lg: "w-18 h-18 text-3xl",
  };

  const containerSize = {
    sm: "w-16 p-1.5",
    md: "w-22 p-2",
    lg: "w-26 p-3",
  };

  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-xl border-2 transition-all ${rarityColor} ${
        badge.earned ? "" : "opacity-40 grayscale"
      } ${containerSize[size]}`}
      title={`${badge.name} - ${badge.description}`}
    >
      <div
        className={`flex items-center justify-center rounded-lg ${sizeClasses[size]}`}
      >
        {icon}
      </div>
      {size !== "sm" && (
        <span className="text-[10px] font-medium text-center leading-tight truncate w-full">
          {badge.name}
        </span>
      )}
    </div>
  );
}
