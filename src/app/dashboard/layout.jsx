"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/dashboard/components/Navbar";
import Sidebar from "@/dashboard/components/Sidebar";
import DashboardMobileNav from "@/dashboard/components/DashboardMobileNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import dynamic from "next/dynamic";

const DailyLoginBonus = dynamic(() => import("@/dashboard/components/DailyLoginBonus"), { ssr: false });

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
  const isClassroomDetail = pathname.startsWith("/dashboard/classrooms/") && pathname.split("/").length > 3;
  const isChat = activeContent === "chat" || activeContent === "chat-pdf";
  const isLearn = segment === "learn";
  const isFullscreen = isChat || isLearn;

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
            {!isFullscreen && <Navbar toggleSidebar={toggleSidebar} setActiveContent={setActiveContent} />}
            <div className="flex flex-1 overflow-hidden relative z-10">
            {!hideDashboardNav && !isClassroomDetail && !isFullscreen && (
              <div className="hidden lg:block flex-shrink-0 w-[240px] h-full z-50 overflow-hidden">
                <Sidebar
                  setActiveContent={setActiveContent}
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                  activeContent={activeContent}
                />
              </div>
            )}
            <main className={`flex-1 min-w-0 min-h-0 relative ${(hideDashboardNav || isClassroomDetail) ? "overflow-hidden" : isFullscreen ? "overflow-hidden" : "overflow-auto pb-16 md:pb-0"}`}>
              <div className="absolute inset-0 -z-10 pointer-events-none bg-[radial-gradient(circle,_rgba(15,23,42,0.12)_1px,_transparent_1px)] dark:bg-[radial-gradient(circle,_rgba(255,255,255,0.06)_1px,_transparent_1px)] bg-[size:20px_20px]" />
              {isClassroomDetail || isFullscreen ? (
                React.Children.map(children, (child) =>
                  React.isValidElement(child)
                    ? React.cloneElement(child, {
                        classroomSidebarCollapsed,
                        setClassroomSidebarCollapsed,
                        setHideDashboardNav,
                        hideDashboardNav,
                        setActiveContent,
                      })
                    : child
                )
              ) : (
                <div className="max-w-[110rem] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 sm:pt-8 lg:pt-12 pb-16 space-y-4">
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
                </div>
              )}
            </main>
          </div>
          {activeContent !== "career" && !hideDashboardNav && !isClassroomDetail && !isFullscreen && <DashboardMobileNav />}
        </div>
      </ThemeProvider>
    </ProtectedRoute>
  );
}
