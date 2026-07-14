"use client";

import { getRarityColor } from "@/lib/gamification";
import {
  Award,
  BookOpen,
  Flame,
  Trophy,
  Database,
  Star,
  Zap,
  CalendarDays,
} from "lucide-react";

const BADGE_ICON_COMPONENTS = {
  "1": BookOpen,
  "2": Flame,
  "3": Flame,
  "4": Flame,
  "5": Flame,
  "6": Award,
  "7": Award,
  "8": Award,
  "9": Trophy,
  "10": Trophy,
  "11": Trophy,
  "12": Database,
  "13": Database,
  "14": Database,
  "15": Star,
  "16": Star,
  "17": Star,
  "18": Zap,
  "19": Zap,
  "20": Zap,
  "21": CalendarDays,
};

export default function GamificationBadge({ badge, size = "md" }) {
  const rarityColor = getRarityColor(badge.rarity);
  const IconComponent = BADGE_ICON_COMPONENTS[badge.icon] || Award;

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
        <IconComponent className="w-full h-full" />
      </div>
      {size !== "sm" && (
        <span className="text-[10px] font-medium text-center leading-tight truncate w-full">
          {badge.name}
        </span>
      )}
    </div>
  );
}
