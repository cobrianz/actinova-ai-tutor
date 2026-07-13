"use client";

import React from "react";
import { useState } from "react";
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

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <ProtectedRoute>
      <ThemeProvider>
        <DailyLoginBonus />
        <div className="h-screen bg-background flex flex-col">
          <Navbar toggleSidebar={toggleSidebar} setActiveContent={setActiveContent} />
          <div className="flex flex-1 overflow-hidden">
            <div className="hidden lg:flex flex-shrink-0 relative h-full z-50">
              <Sidebar
                setActiveContent={setActiveContent}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                activeContent={activeContent}
              />
            </div>
            <main className="flex-1 overflow-auto pb-16 md:pb-0">
              {React.Children.map(children, (child) =>
                React.cloneElement(child, { sidebarOpen, setSidebarOpen })
              )}
            </main>
          </div>
          <DashboardMobileNav />
        </div>
      </ThemeProvider>
    </ProtectedRoute>
  );
}
