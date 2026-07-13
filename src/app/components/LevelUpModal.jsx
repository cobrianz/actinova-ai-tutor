"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { celebrateLevelUp } from "@/lib/confetti";
import { BADGES, getRarityColor } from "@/lib/gamification";

const BADGE_ICONS = {
  "1": "📖", "2": "🔥", "3": "🔥", "4": "🔥", "5": "🔥",
  "6": "🧠", "7": "🧠", "8": "🧠",
  "9": "🏆", "10": "🏆", "11": "🏆",
  "12": "💾", "13": "💾", "14": "💾",
  "15": "⭐", "16": "⭐", "17": "⭐",
  "18": "⚡", "19": "⚡", "20": "⚡",
  "21": "📅",
};

export default function LevelUpModal({ show, level, newBadges = [], onClose }) {
  const [confettiFired, setConfettiFired] = useState(false);

  useEffect(() => {
    if (show && !confettiFired) {
      celebrateLevelUp();
      setConfettiFired(true);
    }
    if (!show) {
      setConfettiFired(false);
    }
  }, [show, confettiFired]);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="bg-card rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 10 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
            >
              <Zap className="w-10 h-10 text-amber-500" />
            </motion.div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              Level Up!
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              You reached{" "}
              <span className="font-bold text-amber-600 dark:text-amber-400">
                Level {level}
              </span>
            </p>

            {newBadges.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  New badges earned:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {newBadges.map((badge) => {
                    const badgeDef = BADGES[badge.badgeId];
                    return (
                      <div
                        key={badge.badgeId}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${getRarityColor(
                          badge.rarity
                        )}`}
                      >
                        <span>{BADGE_ICONS[badge.icon] || "🎖"}</span>
                        <span className="text-xs font-medium">{badge.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
