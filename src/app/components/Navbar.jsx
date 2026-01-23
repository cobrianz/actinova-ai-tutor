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
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  User,
  LogOut,
  Settings,
  CreditCard
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [usageStats, setUsageStats] = useState(null);

  // Check usage stats
  useEffect(() => {
    const checkUsageStats = async () => {
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
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <nav className="hidden sm:flex items-center space-x-3 md:space-x-4">
              {pathname !== "/" && (
                <Link
                  href="/"
                  className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                  aria-label="Home"
                >
                  <Home className="w-4 h-4" />
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

            {/* Auth Buttons */}
            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveContent && setActiveContent("profile")}
                  className="relative h-10 w-10 rounded-2xl overflow-hidden border-2 border-primary/20 hover:border-primary hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 group overflow-hidden"
                  aria-label="View profile"
                >
                  <Avatar className="h-full w-full">
                    <AvatarImage src={user.profile?.avatar} alt={user.firstName} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                </button>
                <button
                  onClick={() => logout()}
                  className="p-2 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/10 transition-all"
                  aria-label="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </header>
    </>
  );
}
