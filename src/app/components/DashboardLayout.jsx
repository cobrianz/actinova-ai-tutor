"use client";

import React from "react";
import { useState } from "react";
import Navbar from "./Navbar";
import { ThemeProvider } from "./ThemeProvider";
import ProtectedRoute from "./ProtectedRoute";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <ProtectedRoute>
      <ThemeProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          <div className="flex-1 flex flex-col overflow-hidden">
            <Navbar toggleSidebar={toggleSidebar} />
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
