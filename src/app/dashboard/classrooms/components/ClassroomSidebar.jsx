"use client";

import { motion } from "framer-motion";
import {
  ChevronRight, GraduationCap, UserPlus, MessageSquare, Layers, ClipboardList, BookOpen,
  Calendar, BarChart2, TrendingUp, Users, Settings, Plus, Search,
} from "lucide-react";

const TAB_ICONS = {
  course: BookOpen,
  calendar: Calendar,
  assignments: ClipboardList,
  grades: BarChart2,
  analytics: TrendingUp,
  discussions: MessageSquare,
  materials: Layers,
  students: Users,
  chat: MessageSquare,
  settings: Settings,
};

export default function ClassroomSidebar({
  classroom,
  tabs,
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  isInstructor,
  setShowCreateAssignment,
  setShowInvite,
}) {
  return (
    <div
      className={`${sidebarCollapsed ? "w-14" : "w-[240px]"} shrink-0 transition-all duration-300 hidden lg:flex flex-col h-full`}
      style={{ background: "var(--sidebar-bg, var(--card))", borderRight: "1px solid var(--border)" }}
    >
      {/* Classroom header */}
      {!sidebarCollapsed && (
        <div className="px-3 pt-4 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-500/15 text-green-600 dark:text-green-400 flex-shrink-0">
              <GraduationCap className="w-4.5 h-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold truncate text-foreground leading-tight" style={{ fontFamily: "var(--font-fraunces)" }}>
                {classroom.name}
              </p>
              <p className="text-xs text-muted-foreground leading-none mt-1 truncate">
                {classroom.subject || "Classroom"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {tabs.map(({ id, label }, index) => {
          const Icon = TAB_ICONS[id] || BookOpen;
          const isActive = activeTab === id;
          return (
            <motion.div key={id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} className="relative">
              <button
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center w-full gap-2 rounded-lg transition-all duration-200 group ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-2.5 py-2"} text-xs font-medium ${isActive ? "bg-green-500/10 text-green-700 dark:text-green-400" : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="classroom-active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-green-500"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className={`flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 transition-all duration-200 ${isActive ? "bg-green-500/15 text-green-600 dark:text-green-400" : "bg-secondary/60 text-muted-foreground group-hover:bg-secondary group-hover:text-foreground"}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left truncate text-[12px]" style={{ fontFamily: "var(--font-fraunces)" }}>{label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-green-500/70 flex-shrink-0" />}
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </nav>

      {/* Quick Add — instructor only */}
      {!sidebarCollapsed && isInstructor && (
        <div className="px-2 pb-3 pt-2 border-t border-border/60 space-y-0.5">
          <p className="px-2 mb-1 text-[8px] font-semibold tracking-widest uppercase text-muted-foreground/60 select-none" style={{ fontFamily: "var(--font-fraunces)" }}>
            Quick Add
          </p>
          {[
            { label: "Assignment", color: "text-green-600 dark:text-green-400", hoverBg: "hover:bg-green-500/10", icon: ClipboardList, action: () => setShowCreateAssignment(true) },
            { label: "Discussion", color: "text-blue-600 dark:text-blue-400", hoverBg: "hover:bg-blue-500/10", icon: MessageSquare, action: () => { setActiveTab("discussions"); /* setShowNewDiscussion handled by caller */ } },
            { label: "Material", color: "text-purple-600 dark:text-purple-400", hoverBg: "hover:bg-purple-500/10", icon: Layers, action: () => { setActiveTab("materials"); } },
            { label: "Invite", color: "text-muted-foreground", hoverBg: "hover:bg-secondary/80", icon: UserPlus, action: () => setShowInvite(true) },
          ].map(({ label, color, hoverBg, icon: Icon, action }) => (
            <button
              key={label}
              onClick={action}
              className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${color} ${hoverBg}`}
            >
              <span className="flex items-center justify-center w-5 h-5 flex-shrink-0"><Plus className="w-3 h-3" /></span>
              <span style={{ fontFamily: "var(--font-fraunces)" }}>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
