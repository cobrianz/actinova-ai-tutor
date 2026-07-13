"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award, Crown, Star } from "lucide-react";
import { apiClient } from "@/lib/csrfClient";
import { motion } from "framer-motion";

const rankStyles = {
  1: {
    bg: "bg-gradient-to-r from-yellow-500/10 to-amber-500/10",
    border: "border-yellow-500/30",
    icon: <Crown className="w-4 h-4 text-yellow-500" />,
    badge: "bg-yellow-500 text-white",
    name: "text-yellow-700 dark:text-yellow-300",
  },
  2: {
    bg: "bg-gradient-to-r from-gray-300/10 to-slate-400/10",
    border: "border-gray-400/30",
    icon: <Medal className="w-4 h-4 text-gray-400" />,
    badge: "bg-gray-400 text-white",
    name: "text-gray-600 dark:text-gray-300",
  },
  3: {
    bg: "bg-gradient-to-r from-orange-400/10 to-amber-600/10",
    border: "border-orange-400/30",
    icon: <Award className="w-4 h-4 text-orange-500" />,
    badge: "bg-orange-500 text-white",
    name: "text-orange-700 dark:text-orange-300",
  },
};

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/50 animate-pulse"
        >
          <div className="w-8 h-8 rounded-lg bg-muted" />
          <div className="flex-1">
            <div className="h-3 bg-muted rounded w-1/3 mb-1.5" />
            <div className="h-2 bg-muted rounded w-1/4" />
          </div>
          <div className="h-5 w-12 bg-muted rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function StudyPlanLeaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await apiClient.get("/api/study-plan/leaderboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <h3 className="text-sm font-semibold text-foreground">Study Plan Leaderboard</h3>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (!data || !data.leaderboard || data.leaderboard.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <Trophy className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No leaderboard data yet</p>
      </div>
    );
  }

  const { leaderboard, currentUserRank } = data;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <h3 className="text-sm font-semibold text-foreground">Study Plan Leaderboard</h3>
        </div>
        <span className="text-xs text-muted-foreground">Top 20 by tasks completed</span>
      </div>

      <div className="px-3 pb-3 space-y-1">
        {leaderboard.map((entry) => {
          const rankStyle = rankStyles[entry.rank];
          const isCurrentUser = entry.isCurrentUser;

          return (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: entry.rank * 0.03 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isCurrentUser
                  ? "bg-green-500/10 border border-green-500/20"
                  : rankStyle
                  ? `${rankStyle.bg} border ${rankStyle.border}`
                  : "hover:bg-secondary/50"
              }`}
            >
              {/* Rank */}
              {rankStyle ? (
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${rankStyle.badge}`}>
                  {rankStyle.icon}
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-muted-foreground">{entry.rank}</span>
                </div>
              )}

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  isCurrentUser
                    ? "text-green-700 dark:text-green-300"
                    : rankStyle
                    ? rankStyle.name
                    : "text-foreground"
                }`}>
                  {entry.name}
                  {isCurrentUser && (
                    <span className="ml-1.5 text-[10px] font-semibold text-green-600 dark:text-green-400">(You)</span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {entry.totalPlans} plan{entry.totalPlans !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Tasks + Level */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/80">
                  <Star className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">{entry.completedTasks}</span>
                </div>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  Lv.{entry.level}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {currentUserRank > 20 && (
        <div className="border-t border-border/60 px-5 py-3 bg-green-500/5">
          <p className="text-xs text-muted-foreground text-center">
            Your rank: <span className="font-semibold text-green-600 dark:text-green-400">#{currentUserRank}</span>
          </p>
        </div>
      )}
    </div>
  );
}
