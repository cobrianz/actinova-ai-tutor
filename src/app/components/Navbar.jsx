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

    const [greeting, setGreeting] = useState("");

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good morning");
        else if (hour < 17) setGreeting("Good afternoon");
        else setGreeting("Good evening");
    }, []);

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
      <header className="sticky top-0 left-0 right-0 z-[100] border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-background/50 text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground lg:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
                  <img src="/logo.png" alt="Logo" className="h-5 w-5 brightness-0 invert" />
                </div>
                <span className="hidden text-lg font-bold tracking-tight text-foreground sm:inline-block">
                  Actinova
                </span>
              </Link>
            </div>

            <nav className="hidden lg:ml-6 lg:flex lg:items-center lg:gap-4">
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/explore"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Explore
              </Link>
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-1 sm:flex">
              <span className="text-xs font-medium text-muted-foreground">{greeting},</span>
              <span className="text-xs font-semibold text-foreground">
                {user?.firstName || "Learner"}
              </span>
            </div>

            <button
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-background/50 text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>

            {/* User dropdown */}
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="group flex items-center gap-2 rounded-full border border-border/40 bg-background/50 p-1 pr-2 transition-colors hover:bg-accent"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
                    {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="hidden flex-col items-start gap-0 sm:flex">
                    <span className="text-[10px] font-medium leading-none text-muted-foreground group-hover:text-foreground">
                      Account
                    </span>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-border/40 bg-background/95 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2">
                      <p className="text-xs font-medium text-muted-foreground">Logged in as</p>
                      <p className="truncate text-sm font-semibold text-foreground">
                        {user.email}
                      </p>
                    </div>
                    <div className="my-1 h-px bg-border/40" />
                    <button
                      onClick={() => {
                        const params = new URLSearchParams(window.location.search);
                        params.set("tab", "profile");
                        router.push(`/dashboard?${params.toString()}`);
                        setShowUserMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        router.push("/help");
                        setShowUserMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Help & Support</span>
                    </button>
                    <div className="my-1 h-px bg-border/40" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
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
