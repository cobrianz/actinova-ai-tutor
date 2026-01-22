"use client";

import {
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  Menu,
  Home,
  BookOpen,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "./AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export default function Navbar({ toggleSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false);
  const [usageStats, setUsageStats] = useState(null);
  const userMenuRef = useRef(null);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      logout();
      toast.success("Successfully logged out");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      logout();
      router.push("/");
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check if user has generated content and usage stats
  useEffect(() => {
    const checkGeneratedContent = async () => {
      if (!user) return;

      try {
        const response = await fetch("/api/library?limit=1", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          // Check if user has any generated courses
          const hasGenerated =
            data.courses?.some((course) => course.isGenerated) || false;
          setHasGeneratedContent(hasGenerated);
        }
      } catch (error) {
        console.error("Error checking generated content:", error);
      }
    };

    const checkUsageStats = async () => {
      if (!user) return;

      try {
        const response = await fetch("/api/user/usage", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUsageStats(data);
        }
      } catch (error) {
        console.error("Error checking usage stats:", error);
      }
    };

    checkGeneratedContent();
    checkUsageStats();
  }, [user]);

  return (
    <>
      <header className="bg-card border-b border-border px-3 sm:px-6 py-3 sm:py-4 sticky top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <nav className="hidden sm:flex items-center space-x-3 md:space-x-4">
              {(!user || pathname !== "/") && (
                <Link
                  href="/"
                  className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                  aria-label="Home"
                >
                  <Home className="w-4 h-4" />
                  {/* Home text removed; icon remains */}
                </Link>
              )}
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

            {/* User dropdown */}
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1.5 sm:p-2 rounded-lg hover:bg-secondary transition-colors"
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary text-primary-foreground">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  {/* Remove email/name; keep theme-styled user icon only */}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-border">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.firstName || user.email || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (pathname.startsWith("/dashboard")) {
                            // If on dashboard, navigate to profile tab
                            const params = new URLSearchParams(
                              window.location.search
                            );
                            params.set("tab", "profile");
                            router.push(`/dashboard?${params.toString()}`);
                          } else {
                            // Otherwise, go to dashboard with profile tab
                            router.push("/dashboard?tab=profile");
                          }
                          setShowUserMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
