"use client";

import { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  ClipboardList,
  MessageSquare,
  StickyNote,
  Layers,
  Settings,
  MoreHorizontal,
  X,
  MessagesSquare,
} from "lucide-react";

// Always visible in the bottom bar (max 4 + More)
const PRIMARY_TABS = [
  { id: "course",       label: "Course",    icon: BookOpen },
  { id: "assignments",  label: "Tasks",     icon: ClipboardList },
  { id: "chat",         label: "Chat",      icon: MessageSquare },
  { id: "discussions",  label: "Discuss",   icon: MessagesSquare },
];

// Shown inside the More modal
const SECONDARY_TABS = [
  { id: "notes",     label: "Notes",     icon: StickyNote },
  { id: "materials", label: "Materials", icon: Layers },
];

const INSTRUCTOR_TAB = { id: "settings", label: "Settings", icon: Settings };

function NavBtn({ icon: Icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
      className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] px-2 py-1 rounded-lg transition-all duration-200 ${
        isActive
          ? "text-green-600 dark:text-green-400"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon
        className={`w-6 h-6 transition-all duration-200 ${
          isActive ? "stroke-[2.5]" : "stroke-[1.5]"
        }`}
        fill={isActive ? "currentColor" : "none"}
      />
      <span
        className={`text-[10px] leading-tight whitespace-nowrap transition-all duration-200 ${
          isActive ? "font-bold" : "font-medium"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function ClassroomMobileNav({ activeTab, setActiveTab, isInstructor }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef(null);

  const secondaryTabs = isInstructor
    ? [...SECONDARY_TABS, INSTRUCTOR_TAB]
    : SECONDARY_TABS;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    if (moreOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreOpen]);

  const handleTabClick = (id) => {
    setActiveTab(id);
    setMoreOpen(false);
  };

  // "More" button is active when the current tab is one of the secondary ones
  const moreIsActive =
    moreOpen || secondaryTabs.some((t) => t.id === activeTab);

  return (
    <>
      {/* More modal */}
      {moreOpen && (
        <div className="fixed inset-0 z-[95] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />

          {/* Sheet */}
          <div
            ref={menuRef}
            className="absolute bottom-20 left-4 right-4 bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-bold text-foreground">More</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid of extra tabs */}
            <div className="p-2">
              <div className="grid grid-cols-3 gap-1">
                {secondaryTabs.map(({ id, label, icon: Icon }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => handleTabClick(id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <Icon
                        className="w-6 h-6"
                        fill={isActive ? "currentColor" : "none"}
                      />
                      <span className="text-[11px] font-medium leading-tight text-center">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[90] bg-card border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", touchAction: "manipulation" }}
      >
        <div className="flex items-center justify-around h-16 px-1">
          {PRIMARY_TABS.map(({ id, label, icon }) => (
            <NavBtn
              key={id}
              icon={icon}
              label={label}
              isActive={activeTab === id}
              onClick={() => handleTabClick(id)}
            />
          ))}

          <NavBtn
            icon={MoreHorizontal}
            label="More"
            isActive={moreIsActive}
            onClick={() => setMoreOpen((prev) => !prev)}
          />
        </div>
      </nav>
    </>
  );
}

export default ClassroomMobileNav;
