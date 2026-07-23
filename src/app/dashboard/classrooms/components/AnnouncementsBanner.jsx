"use client";

import { useState, useEffect } from "react";
import { Megaphone, X, Calendar, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useClassroomContext } from "./ClassroomContext";

export default function AnnouncementsBanner() {
  const { announcements = [], activeTab, classroom } = useClassroomContext();
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`dismissed_announcements_${classroom?.id}`);
      if (saved) setDismissed(JSON.parse(saved));
    } catch {}
  }, [classroom?.id]);

  const handleDismiss = (id) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    try {
      localStorage.setItem(`dismissed_announcements_${classroom?.id}`, JSON.stringify(updated));
    } catch {}
  };

  if (!announcements.length || activeTab === "settings" || activeTab === "chat") return null;

  const activeAnnouncements = announcements
    .filter((ann, index) => !dismissed.includes(ann._id || ann.id || index))
    .slice(-2)
    .reverse();

  if (!activeAnnouncements.length) return null;

  return (
    <div className="space-y-2 mb-4">
      <AnimatePresence>
        {activeAnnouncements.map((ann, i) => {
          const annId = ann._id || ann.id || i;
          return (
            <motion.div
              key={annId}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3.5 relative"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Megaphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300">{ann.title}</span>
                      {ann.createdAt && (
                        <span className="text-[10px] text-amber-700/60 dark:text-amber-400/60 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDismiss(annId)}
                  className="p-1 rounded-lg text-amber-700/60 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200/90 mt-1.5 pl-8 leading-relaxed">
                {ann.content}
              </p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
