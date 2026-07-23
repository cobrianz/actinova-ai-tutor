"use client";

import { Megaphone } from "lucide-react";
import { useClassroomContext } from "./ClassroomContext";

export default function AnnouncementsBanner() {
  const { announcements, activeTab } = useClassroomContext();

  if (!announcements.length || activeTab === "settings" || activeTab === "chat") return null;

  return (
    <div className="space-y-2">
      {announcements.slice(-3).reverse().map((ann, i) => (
        <div key={i} className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{ann.title}</span>
            {ann.createdAt && <span className="text-[10px] text-amber-600/60">{new Date(ann.createdAt).toLocaleDateString()}</span>}
          </div>
          <p className="text-[11px] text-amber-800 dark:text-amber-300 ml-5">{ann.content}</p>
        </div>
      ))}
    </div>
  );
}
