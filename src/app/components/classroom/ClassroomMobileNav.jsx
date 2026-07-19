"use client";

import { BookOpen, ClipboardList, MessageSquare, StickyNote, Layers, Settings } from "lucide-react";

function ClassroomMobileNav({ activeTab, setActiveTab, isInstructor }) {
  const tabs = [
    { id: "course", label: "Course", icon: BookOpen },
    { id: "assignments", label: "Tasks", icon: ClipboardList },
    { id: "discussions", label: "Discuss", icon: MessageSquare },
    { id: "notes", label: "Notes", icon: StickyNote },
    { id: "materials", label: "Materials", icon: Layers },
    ...(isInstructor ? [{ id: "settings", label: "Settings", icon: Settings }] : []),
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[90] border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-2 py-2">
      <div className={`grid gap-1 ${tabs.length <= 5 ? "grid-cols-5" : "grid-cols-6"}`}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors bg-transparent ${
              activeTab === id ? "text-green-600 dark:text-green-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}>
            <Icon className={`w-4 h-4 ${activeTab === id ? "stroke-[2.5]" : "stroke-[1.5]"}`} fill={activeTab === id ? "currentColor" : "none"} />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ClassroomMobileNav;
