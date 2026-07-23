"use client";

import { useState, useEffect } from "react";
import { Trophy, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/csrfClient";
import GamificationBadge from "./GamificationBadge";
import { motion } from "framer-motion";

const ALL_BADGES = [
  { badgeId: 'first_lesson', name: 'First Step', description: 'Complete your first lesson', icon: '1', rarity: 'common' },
  { badgeId: 'streak_3', name: '3-Day Streak', description: 'Study 3 days in a row', icon: '2', rarity: 'common' },
  { badgeId: 'streak_7', name: 'Week Warrior', description: 'Study 7 days in a row', icon: '3', rarity: 'rare' },
  { badgeId: 'streak_30', name: 'Monthly Master', description: 'Study 30 days in a row', icon: '4', rarity: 'epic' },
  { badgeId: 'streak_100', name: 'Century Streak', description: 'Study 100 days in a row', icon: '5', rarity: 'legendary' },
  { badgeId: 'quiz_10', name: 'Quiz Starter', description: 'Complete 10 quizzes', icon: '6', rarity: 'common' },
  { badgeId: 'quiz_50', name: 'Quiz Pro', description: 'Complete 50 quizzes', icon: '7', rarity: 'rare' },
  { badgeId: 'quiz_perfect', name: 'Perfect Score', description: 'Score 100% on a quiz', icon: '8', rarity: 'epic' },
  { badgeId: 'course_1', name: 'Graduate', description: 'Complete your first course', icon: '9', rarity: 'common' },
  { badgeId: 'course_5', name: 'Scholar', description: 'Complete 5 courses', icon: '10', rarity: 'rare' },
  { badgeId: 'course_10', name: 'Expert', description: 'Complete 10 courses', icon: '11', rarity: 'epic' },
  { badgeId: 'flashcard_50', name: 'Card Collector', description: 'Review 50 flashcards', icon: '12', rarity: 'common' },
  { badgeId: 'flashcard_200', name: 'Card Master', description: 'Review 200 flashcards', icon: '13', rarity: 'rare' },
  { badgeId: 'flashcard_500', name: 'Card Legend', description: 'Review 500 flashcards', icon: '14', rarity: 'epic' },
  { badgeId: 'xp_100', name: 'Rising Star', description: 'Earn 100 XP', icon: '15', rarity: 'common' },
  { badgeId: 'xp_500', name: 'XP Hunter', description: 'Earn 500 XP', icon: '16', rarity: 'rare' },
  { badgeId: 'xp_1000', name: 'XP Legend', description: 'Earn 1000 XP', icon: '17', rarity: 'epic' },
  { badgeId: 'level_5', name: 'Level 5', description: 'Reach Level 5', icon: '18', rarity: 'common' },
  { badgeId: 'level_10', name: 'Level 10', description: 'Reach Level 10', icon: '19', rarity: 'rare' },
  { badgeId: 'level_20', name: 'Level 20', description: 'Reach Level 20', icon: '20', rarity: 'legendary' },
  { badgeId: 'daily_7', name: 'Weekly Login', description: 'Login 7 days total', icon: '21', rarity: 'common' },
];

export default function BadgesPage() {
  const [loading, setLoading] = useState(true);
  const [userAchievements, setUserAchievements] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchXPData = async () => {
      try {
        const res = await apiClient.get("/api/xp");
        if (res.ok) {
          const data = await res.json();
          setUserAchievements(data.achievements || []);
        }
      } catch (error) {
        console.error("Failed to fetch achievements:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchXPData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 rounded-2xl border border-border/50 bg-card">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        <span className="ml-3 text-muted-foreground">Loading achievements...</span>
      </div>
    );
  }

  const earnedBadgesCount = ALL_BADGES.filter(b => userAchievements.some(a => a.badgeId === b.badgeId)).length;

  const processedBadges = ALL_BADGES.map(badge => ({
    ...badge,
    earned: userAchievements.some(a => a.badgeId === badge.badgeId)
  }));

  const filteredBadges = filter === 'all' 
    ? processedBadges 
    : processedBadges.filter(b => b.rarity === filter);

  const earnedBadges = filteredBadges.filter(b => b.earned);
  const lockedBadges = filteredBadges.filter(b => !b.earned);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'common', label: 'Common' },
    { id: 'rare', label: 'Rare' },
    { id: 'epic', label: 'Epic' },
    { id: 'legendary', label: 'Legendary' }
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-fraunces)" }}>Achievements</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {earnedBadgesCount} / {ALL_BADGES.length} unlocked
              </p>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors ${
                  filter === f.id 
                    ? "bg-green-500 text-white" 
                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {earnedBadges.length > 0 && (
          <div className="mb-10">
            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Earned</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
              {earnedBadges.map((badge, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  key={badge.badgeId} 
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <GamificationBadge badge={badge} size="md" />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {lockedBadges.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Locked</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
              {lockedBadges.map((badge, idx) => (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={badge.badgeId} 
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <GamificationBadge badge={badge} size="md" />
                </motion.div>
              ))}
            </div>
          </div>
        )}
        
        {filteredBadges.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No badges found in this category.
          </div>
        )}
      </div>
    </div>
  );
}
