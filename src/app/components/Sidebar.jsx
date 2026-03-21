"use client";

import {
  BookOpen,
  Star,
  Sparkles,
  Search,
  CreditCard,
  Plus,
  MessageCircle,
  FileText,
  ScrollText,
  HelpCircle,
  User,
  LogOut,
  TrendingUp,
  Briefcase,
  Brain,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { apiClient } from "@/lib/csrfClient";

export default function Sidebar({
  setActiveContent,
  sidebarOpen,
  setSidebarOpen,
  activeContent,
}) {
  const router = useRouter();
  const [screenSize, setScreenSize] = useState("large");
  const [activeItem, setActiveItem] = useState(activeContent || "generate");
  const [usage, setUsage] = useState({ used: 0, limit: 5, percentage: 0 });

  const { user, logout, loading: authLoading, isPro, isEnterprise } = useAuth();


  const navigation = [
    { name: "New", id: "generate", icon: Plus },
    { name: "AI Chat", id: "chat", icon: MessageCircle, premium: true },
    { name: "Explore", id: "explore", icon: Search },
    { name: "Library", id: "library", icon: BookOpen },
    { name: "Reports & Essays", id: "reports-library", icon: ScrollText, premium: true },
    { name: "Career Growth", id: "career", icon: Briefcase, premium: true },
    { name: "Flashcards", id: "flashcards", icon: FileText },
    { name: "Test Yourself", id: "quizzes", icon: HelpCircle },
    { name: "Premium", id: "premium-courses", icon: Star, premium: true },
    // Only show upgrade when auth has finished loading and user is not pro
    !authLoading && !isPro && { name: "Upgrade", id: "upgrade", icon: CreditCard },
  ].filter(Boolean);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setScreenSize("small");
      else if (width < 1200) setScreenSize("medium");
      else setScreenSize("large");
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (screenSize === "large") {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [screenSize]);

  useEffect(() => {
    if (activeContent) setActiveItem(activeContent);
  }, [activeContent]);

  useEffect(() => {
    if (user) {
      fetchUsage();
    }
  }, [user]);

  // Listen for global usage updates (e.g., after course generation)
  useEffect(() => {
    const handler = () => {
      fetchUsage();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("usageUpdated", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("usageUpdated", handler);
      }
    };
  }, []);

  const handleItemClick = (id) => {
    if (id === "upgrade") {
      router.push("/pricing");
      return;
    }

    const item = navigation.find(n => n.id === id);
    // Allow navigation but keep locks as indicators

    setActiveItem(id);
    if (setActiveContent) {
      setActiveContent(id);
    } else {
      router.push(`/dashboard?tab=${id}`);
    }

    // Close on small and medium screens
    if (screenSize === "small" || screenSize === "medium") {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const fetchUsage = async () => {
    try {
      const res = await apiClient.get("/api/user/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {sidebarOpen && screenSize !== "large" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-[90] lg:hidden"
        />
      )}

      <div className="flex relative items-start h-full">
        <motion.div
          animate={{
            width: sidebarOpen ? 256 : 0,
            x: sidebarOpen ? 0 : -256,
          }}
          transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 200 }}
          className={`fixed lg:static top-0 left-0 h-screen lg:h-full bg-card border-r border-border overflow-hidden z-[100] lg:z-auto shadow-2xl lg:shadow-none`}
        >
          {/* Main Sidebar Content Wrapper to maintain width while animating */}
          <div className="w-64 h-full flex flex-col">
            {/* Removed Branding Section - Minimalist Mode */}

            <nav className="p-4 overflow-y-auto scrollbar-hide flex-1">
              <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <ul className="space-y-4">
                {navigation.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = activeItem === item.id;

                  return (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative group"
                    >
                      <button
                        onClick={() => handleItemClick(item.id)}
                        className={`flex items-center w-full space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                          ? "bg-accent text-accent-foreground border border-green-200 dark:border-green-800"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                          }`}
                      >
                        <div className="relative">
                          <Icon className="w-5 h-5" />
                          {item.premium && !isPro && (
                            <div className="absolute -top-1 -right-1 bg-lime-400 rounded-full p-0.5 border border-white dark:border-slate-900 shadow-sm">
                              <Lock size={8} className="text-lime-950" />
                            </div>
                          )}
                        </div>
                        <span className="flex-1 text-left">{item.name}</span>
                        {item.premium && !isPro && (
                          <Lock size={12} className="text-muted-foreground/40" />
                        )}
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            </nav>

            {/* Bottom sections */}
            <div className="p-4 space-y-4 border-t border-border">
              {/* Profile Section */}
              <div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleItemClick("profile")}
                    className={`flex items-center space-x-3 flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeItem === "profile"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                  >
                    <User className="w-5 h-5" />
                    <span>Account</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer ml-2"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Usage Section */}
              <div className="p-4 bg-accent/30 rounded-lg border border-border">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-700 dark:text-green-300" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Usage
                      </span>
                    </div>
                    <span className="text-xs text-green-700 dark:text-green-300">
                      {isEnterprise ? "Enterprise" : (isPro ? "Pro" : "Free")}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-accent-foreground">
                      <span>Generations</span>
                      <span>
                        {usage.used}/{usage.limit === null ? "∞" : usage.limit}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${usage.limit === null ? 100 : usage.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
