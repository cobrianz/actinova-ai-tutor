"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import DashboardMobileNav from "@/app/components/DashboardMobileNav";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import dynamic from "next/dynamic";

const DailyLoginBonus = dynamic(() => import("@/app/components/DailyLoginBonus"), { ssr: false });

const PATH_TO_TAB = {
  "generate": "generate",
  "chat": "chat",
  "chat-pdf": "chat-pdf",
  "explore": "explore",
  "library": "library",
  "premium-courses": "premium-courses",
  "study-plans": "study-plans",
  "flashcards": "flashcards",
  "quizzes": "quizzes",
  "reports-library": "reports-library",
  "career": "career",
  "analytics": "analytics",
  "profile": "profile",
  "classrooms": "classrooms",
};

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const segment = pathname.split("/dashboard/")[1]?.split("/")[0] || "generate";
  const activeContent = PATH_TO_TAB[segment] || "generate";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hideDashboardNav, setHideDashboardNav] = useState(false);
  const [classroomSidebarCollapsed, setClassroomSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (activeContent !== "classrooms") {
      setHideDashboardNav(false);
    }
  }, [activeContent]);

  const setActiveContent = () => {};

  const toggleSidebar = () => {
    if (hideDashboardNav) {
      setClassroomSidebarCollapsed((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  return (
    <ProtectedRoute>
      <ThemeProvider>
        <DailyLoginBonus />
        <div className="h-screen bg-background flex flex-col relative">
          {!hideDashboardNav && (
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(255,255,255,0.65),_rgba(255,255,255,0.18))] dark:hidden" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(0,0,0,0.3),_rgba(0,0,0,0.05))] opacity-0 dark:opacity-100 hidden dark:block" />
            </div>
          )}
          <Navbar toggleSidebar={toggleSidebar} setActiveContent={setActiveContent} />
          <div className="flex flex-1 overflow-hidden relative z-10">
            {!hideDashboardNav && (
              <div className="hidden lg:flex flex-shrink-0 relative h-full z-50">
                <Sidebar
                  setActiveContent={setActiveContent}
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                  activeContent={activeContent}
                />
              </div>
            )}
            <main className={`flex-1 min-h-0 ${hideDashboardNav ? "overflow-hidden" : "overflow-auto pb-16 md:pb-0"}`}>
              {React.Children.map(children, (child) =>
                React.isValidElement(child)
                  ? React.cloneElement(child, {
                      classroomSidebarCollapsed,
                      setClassroomSidebarCollapsed,
                      setHideDashboardNav,
                      hideDashboardNav,
                      setActiveContent,
                    })
                  : child
              )}
            </main>
          </div>
          {activeContent !== "career" && !hideDashboardNav && <DashboardMobileNav />}
        </div>
      </ThemeProvider>
    </ProtectedRoute>
  );
}
