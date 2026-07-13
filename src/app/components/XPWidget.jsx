"use client";

import { useEffect, useState } from "react";
import { Zap, Flame, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function XPWidget({ compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchXP();
  }, []);

  const fetchXP = async () => {
    try {
      const res = await fetch("/api/xp");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch XP data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="animate-pulse p-3 rounded-xl bg-secondary/50 space-y-2">
        <div className="h-3 bg-muted rounded-full w-24" />
        <div className="h-1.5 bg-muted rounded-full w-full" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1 text-amber-500">
          <Zap className="w-3.5 h-3.5" />
          <span className="font-semibold">{data.xp}</span>
        </div>
        <span className="text-muted-foreground text-xs">Lv.{data.level}</span>
        {data.streak?.current > 0 && (
          <div className="flex items-center gap-0.5 text-orange-500">
            <Flame className="w-3 h-3" />
            <span className="text-xs">{data.streak.current}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-3 py-2.5 rounded-xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/15 space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-3 h-3 text-white" />
          </span>
          <span className="text-[10px] font-semibold text-green-700 dark:text-green-400">
            Level {data.level}
          </span>
        </div>

        {data.streak?.current > 0 && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
            <Flame className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
            <span className="text-[9px] font-semibold text-green-700 dark:text-green-400">
              {data.streak.current}d
            </span>
          </div>
        )}
      </div>

      {/* XP progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground font-medium">
            {data.currentXp} / {data.nextLevelXp} XP
          </span>
          <span className="text-[9px] text-muted-foreground">
            {Math.round(data.progress)}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${data.progress}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
