"use client";

import {
  Moon,
  Sun,
  Menu,
  Home,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import { isFlutterApp } from "@/lib/appBridge";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiClient } from "@/lib/csrfClient";

export default function Navbar({ toggleSidebar }) {
  const { user, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [usageStats, setUsageStats] = useState(null);

  // Check usage stats
  useEffect(() => {
    const checkUsageStats = async () => {
      try {
        const response = await apiClient.get("/api/user/usage");

        if (response.ok) {
          const data = await response.json();
          setUsageStats(data);
        }
      } catch (error) {
        console.error("Error checking usage stats:", error);
      }
    };

    checkUsageStats();
  }, []);

  return (
    <>
      <header className="bg-card border-b border-border px-3 sm:px-6 py-3 sm:py-4 sticky top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleSidebar}
              className="hidden lg:inline-flex p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {!isFlutterApp() && (
              <Link href="/" className="flex items-center group/logo hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#D2D7F8]/30 flex items-center justify-center overflow-hidden p-1 shadow-none">
                  <img src="/logo.png" alt="Actirova Logo" className="w-full h-full object-contain" />
                </div>
              </Link>
            )}

            <nav className="hidden sm:flex items-center space-x-3 md:space-x-4">
              <Link
                href="/dashboard"
                className={`text-sm font-medium hover:text-primary transition-colors ${pathname === "/dashboard"
                  ? "text-primary"
                  : "text-foreground"
                  }`}
              >
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            {/* Auth Buttons - Hide while loading to prevent flicker */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
            ) : !user ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/login"
                  className="text-sm font-bold text-foreground hover:text-primary transition-colors px-3 py-2"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm font-bold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            ) : (
              <Link
                href="/dashboard?tab=profile"
                className="p-1 rounded-lg hover:opacity-80 transition-opacity"
              >
                <Avatar className="w-8 h-8 border border-border">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
