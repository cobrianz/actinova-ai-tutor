"use client";

import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import DashboardMobileNav from "./DashboardMobileNav";

import { ThemeProvider } from "./ThemeProvider";
import ProtectedRoute from "./ProtectedRoute";
import dynamic from 'next/dynamic';

const DailyLoginBonus = dynamic(() => import('./DailyLoginBonus'), { ssr: false });

export default function DashboardLayout({
  children,
  activeContent = "generate",
  setActiveContent,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hideDashboardNav, setHideDashboardNav] = useState(false);
  const [classroomSidebarCollapsed, setClassroomSidebarCollapsed] = useState(false);

  // When the user navigates away from classrooms, always restore the dashboard nav.
  // This guards against ClassroomDashboard leaving hideDashboardNav=true behind.
  useEffect(() => {
    if (activeContent !== "classrooms") {
      setHideDashboardNav(false);
    }
  }, [activeContent]);

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
          {/* Dotted editorial background */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(15,23,42,0.22)_1px,_transparent_1px)] [background-size:20px_20px] opacity-100 dark:hidden" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(255,255,255,0.65),_rgba(255,255,255,0.18))] dark:hidden" />
            <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.07)_1px,_transparent_1px)] [background-size:20px_20px] opacity-0 dark:opacity-100 hidden dark:block" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(0,0,0,0.3),_rgba(0,0,0,0.05))] opacity-0 dark:opacity-100 hidden dark:block" />
          </div>
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
                React.cloneElement(child, { classroomSidebarCollapsed, setClassroomSidebarCollapsed, setHideDashboardNav, hideDashboardNav })
              )}
            </main>
          </div>
          {activeContent !== 'career' && !hideDashboardNav && <DashboardMobileNav />}
        </div>
      </ThemeProvider>
    </ProtectedRoute>
  );
}
