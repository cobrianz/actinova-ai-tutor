"use client";

import { useEffect, useState } from "react";
import { Trophy, Flame, Zap, Medal, Crown, Award } from "lucide-react";

export default function Leaderboard({ compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse h-20 bg-secondary/50 rounded-xl" />
        <div className="animate-pulse flex justify-center gap-4 py-6">
          <div className="w-20 h-28 bg-secondary/50 rounded-t-xl" />
          <div className="w-20 h-32 bg-secondary/50 rounded-t-xl" />
          <div className="w-20 h-24 bg-secondary/50 rounded-t-xl" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-32 mb-1" />
              <div className="h-3 bg-muted rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  if (data.leaderboard.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No rankings yet. Start learning to earn XP!</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-1.5">
        {data.leaderboard.slice(0, 5).map((entry) => (
          <div
            key={entry.rank}
            className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
              entry.isCurrentUser
                ? "bg-primary/5 border border-primary/20"
                : "hover:bg-secondary/60"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                entry.isCurrentUser
                  ? "bg-primary/10 text-primary"
                  : entry.rank <= 3
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {entry.rank}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {entry.name}
                {entry.isCurrentUser && (
                  <span className="ml-1.5 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">YOU</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
              <span className="flex items-center gap-0.5">
                <Zap className="w-3 h-3 text-amber-500" />
                {entry.xp.toLocaleString()}
              </span>
              {entry.streak > 0 && (
                <span className="flex items-center gap-0.5 text-orange-500">
                  <Flame className="w-3 h-3" />
                  {entry.streak}d
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const top3 = data.leaderboard.slice(0, 3);
  const rest = data.leaderboard.slice(3);

  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder = [];
  if (top3.find((e) => e.rank === 2)) podiumOrder.push(top3.find((e) => e.rank === 2));
  if (top3.find((e) => e.rank === 1)) podiumOrder.push(top3.find((e) => e.rank === 1));
  if (top3.find((e) => e.rank === 3)) podiumOrder.push(top3.find((e) => e.rank === 3));

  const podiumColors = {
    1: { bg: "bg-gradient-to-b from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800/50", avatar: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" },
    2: { bg: "bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-800/60 dark:to-gray-800/30", text: "text-gray-600 dark:text-gray-400", border: "border-gray-200 dark:border-gray-700/50", avatar: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
    3: { bg: "bg-gradient-to-b from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-900/20", text: "text-orange-600 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800/50", avatar: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400" },
  };

  const podiumHeight = { 1: "h-28", 2: "h-22", 3: "h-18" };
  const podiumRank = { 1: 1, 2: 0, 3: 2 }; // index into podiumOrder after reordering

  return (
    <div className="space-y-5">
      {/* My rank card */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Medal className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Your Rank</p>
              <p className="text-lg font-bold text-foreground">#{data.myRank}</p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-bold">{data.myXp.toLocaleString()} XP</span>
            </div>
            <p className="text-sm text-muted-foreground">Level {data.myLevel}</p>
          </div>
        </div>
      </div>

      {/* Top 3 podium */}
      {podiumOrder.length > 0 && (
        <div className="flex items-end justify-center gap-3 pt-2 pb-4 px-4">
          {podiumOrder.map((entry) => {
            const rank = entry.rank;
            const colors = podiumColors[rank];
            const isFirst = rank === 1;

            return (
              <div key={rank} className="flex flex-col items-center gap-1.5">
                {/* Avatar + crown */}
                <div className="relative">
                  {isFirst && (
                    <Crown className="w-5 h-5 text-amber-500 absolute -top-4 left-1/2 -translate-x-1/2" />
                  )}
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-white dark:ring-gray-900 ${colors.avatar}`}
                  >
                    {rank}
                  </div>
                </div>

                {/* Name */}
                <p className="text-xs font-semibold text-foreground truncate max-w-[72px] text-center leading-tight">
                  {entry.name.split(" ")[0]}
                </p>

                {/* Podium bar */}
                <div
                  className={`w-[72px] ${podiumHeight[rank]} rounded-t-xl flex flex-col items-center justify-center gap-0.5 ${colors.bg} border ${colors.border} border-b-0 ${isFirst ? "mb-0" : ""}`}
                >
                  <span className={`text-sm font-bold ${colors.text}`}>{entry.xp.toLocaleString()}</span>
                  <span className="text-[10px] text-muted-foreground">XP</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Divider */}
      {rest.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Rankings</span>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}

      {/* Rest of the list */}
      <div className="space-y-1.5">
        {rest.map((entry) => {
          const isFirst = entry.rank === 1;
          return (
            <div
              key={entry.rank}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                entry.isCurrentUser
                  ? "bg-primary/5 border border-primary/20 ring-1 ring-primary/10"
                  : "hover:bg-secondary/60"
              }`}
            >
              {/* Rank number */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                  entry.isCurrentUser
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {entry.rank}
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {entry.name}
                  {entry.isCurrentUser && (
                    <span className="ml-1.5 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">YOU</span>
                  )}
                </p>
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-0.5">
                    <Zap className="w-3 h-3 text-amber-500" />
                    {entry.xp.toLocaleString()} XP
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Award className="w-3 h-3 text-purple-500" />
                    Lv.{entry.level}
                  </span>
                  {entry.streak > 0 && (
                    <span className="flex items-center gap-0.5 text-orange-500">
                      <Flame className="w-3 h-3" />
                      {entry.streak}d
                    </span>
                  )}
                </div>
              </div>

              {/* Badge count */}
              {entry.badgeCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/80 px-2 py-1 rounded-full shrink-0">
                  <Trophy className="w-3 h-3 text-amber-500" />
                  {entry.badgeCount}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {data.leaderboard.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No rankings yet. Start learning to earn XP!</p>
        </div>
      )}
    </div>
  );
}
