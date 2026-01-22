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
      <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 left-0 right-0 z-40">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary transition-all"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="h-4 w-[1px] bg-border hidden sm:block" />
            <nav className="hidden sm:flex items-center space-x-1">
              <Link
                href="/"
                className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg"
                aria-label="Home"
              >
                <Home className="w-5 h-5" />
              </Link>
              <Link
                href="/dashboard"
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                  pathname === "/dashboard"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
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
              className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary transition-all"
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
                  className="flex items-center space-x-2 p-1 rounded-xl hover:bg-secondary transition-all border border-transparent hover:border-border"
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary text-primary-foreground shadow-sm">
                    <User className="w-5 h-5" />
                  </div>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-popover text-popover-foreground rounded-2xl shadow-xl border border-border z-50 overflow-hidden"
                    >
                      <div className="p-2">
                        <div className="px-3 py-3 border-b border-border/50 mb-1">
                          <p className="text-sm font-semibold truncate">
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
                              const params = new URLSearchParams(window.location.search);
                              params.set("tab", "profile");
                              router.push(`/dashboard?${params.toString()}`);
                            } else {
                              router.push("/dashboard?tab=profile");
                            }
                            setShowUserMenu(false);
                          }}
                          className="flex items-center space-x-3 w-full px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Profile Settings</span>
                        </button>
                        <div className="h-[1px] bg-border/50 my-1" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
