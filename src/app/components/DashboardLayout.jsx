"use client";

import Navbar from "./Navbar";
import { ThemeProvider } from "./ThemeProvider";
import ProtectedRoute from "./ProtectedRoute";

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute>
      <ThemeProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          <div className="flex-1 flex flex-col overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </ThemeProvider>
    </ProtectedRoute>
  );
}
