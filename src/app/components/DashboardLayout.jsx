"use client";

import React from "react";
import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { ThemeProvider } from "./ThemeProvider";
import ProtectedRoute from "./ProtectedRoute";

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
        <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
          <Navbar toggleSidebar={toggleSidebar} />
          <div className="flex flex-1 overflow-hidden">
            <div className="sticky top-0 h-full">
              <Sidebar
                setActiveContent={setActiveContent}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                activeContent={activeContent}
              />
            </div>
            <main className="flex-1 overflow-auto">
              {React.Children.map(children, (child) =>
                React.cloneElement(child, { sidebarOpen, setSidebarOpen })
              )}
            </main>
          </div>
        </div>
      </ThemeProvider>
    </ProtectedRoute>
  );
}
