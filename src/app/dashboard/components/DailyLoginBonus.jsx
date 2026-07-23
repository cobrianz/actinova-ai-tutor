"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Flame, Trophy } from "lucide-react";
import { apiClient } from "@/lib/csrfClient";
import confetti from "canvas-confetti";

export default function DailyLoginBonus() {
  const [bonusData, setBonusData] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkDailyBonus = async () => {
      try {
        const res = await apiClient.post("/api/daily-login");
        if (res.ok) {
          const data = await res.json();
          if (data.claimed) {
            setBonusData(data);
            setIsVisible(true);
            
            // Trigger confetti
            const duration = 3000;
            const end = Date.now() + duration;
            
            const frame = () => {
              confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#22c55e', '#10b981', '#fbbf24']
              });
              confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#22c55e', '#10b981', '#fbbf24']
              });
              if (Date.now() < end) {
                requestAnimationFrame(frame);
              }
            };
            frame();

            // Auto dismiss
            setTimeout(() => setIsVisible(false), 4000);
          }
        }
      } catch (error) {
        console.error("Failed to check daily bonus:", error);
      }
    };
    
    // Slight delay to allow layout to settle
    const timeoutId = setTimeout(checkDailyBonus, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  if (!bonusData) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 15 }}
            className="bg-card border border-green-500/30 rounded-2xl shadow-2xl p-6 md:p-8 max-w-sm w-full text-center relative overflow-hidden pointer-events-auto"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-green-500/30 mb-4 rotate-12">
                <Zap className="w-8 h-8 text-white -rotate-12" />
              </div>
              
              <h2 className="text-2xl font-black text-foreground mb-1 tracking-tight">
                Daily Bonus!
              </h2>
              <p className="text-muted-foreground font-medium mb-6">
                Thanks for logging in today
              </p>
              
              <div className="flex items-center justify-center gap-4 mb-2">
                <div className="bg-secondary/50 rounded-xl p-3 flex-1">
                  <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-1">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <div className="text-xl font-black text-foreground">
                    +{bonusData.xpAwarded} XP
                  </div>
                </div>
                
                <div className="bg-secondary/50 rounded-xl p-3 flex-1">
                  <div className="flex items-center justify-center gap-1.5 text-orange-500 mb-1">
                    <Flame className="w-4 h-4 fill-current" />
                  </div>
                  <div className="text-xl font-black text-foreground">
                    {bonusData.streak} {bonusData.streak === 1 ? 'Day' : 'Days'}
                  </div>
                </div>
              </div>
              
              {bonusData.levelUp && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 py-2 px-4 bg-green-500/10 rounded-lg flex items-center justify-center gap-2 border border-green-500/20"
                >
                  <Trophy className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    Level Up! You reached Level {bonusData.newLevel}
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
