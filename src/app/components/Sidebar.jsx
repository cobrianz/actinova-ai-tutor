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
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";

export default function Sidebar({
  setActiveContent,
  sidebarOpen,
  setSidebarOpen,
  activeContent,
}) {
  const [screenSize, setScreenSize] = useState("large");
  const [activeItem, setActiveItem] = useState(activeContent || "generate");
  const [usage, setUsage] = useState({ used: 0, limit: 5, percentage: 0 });

  const { user, logout, loading: authLoading } = useAuth();

  const isPro =
    !authLoading &&
    user &&
    ((user.subscription &&
      (user.subscription.plan === "pro" || user.subscription.plan === "enterprise") &&
      user.subscription.status === "active") ||
      user.isPremium);

  const navigation = [
    { name: "New", id: "generate", icon: Plus, color: "text-blue-500" },
    { name: "Explore", id: "explore", icon: Search, color: "text-purple-500" },
    { name: "Library", id: "library", icon: BookOpen, color: "text-emerald-500" },
    { name: "Flashcards", id: "flashcards", icon: FileText, color: "text-orange-500" },
    { name: "Test Yourself", id: "quizzes", icon: HelpCircle, color: "text-red-500" },
    { name: "AI Chat", id: "chat", icon: MessageCircle, color: "text-indigo-500" },
    { name: "Premium", id: "staff-picks", icon: Star, color: "text-yellow-500" },
    // Only show upgrade when auth has finished loading and user is not pro
    !authLoading && !isPro && { name: "Upgrade", id: "upgrade", icon: CreditCard, color: "text-pink-500" },
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
    setActiveItem(id);
    setActiveContent(id);

    // Close on small and medium screens
    if (screenSize === "small" || screenSize === "medium") {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      logout();
    } catch (error) {
      console.error("Logout error:", error);
      logout(); // Fallback
    }
  };

  const fetchUsage = async () => {
    try {
      const res = await fetch("/api/user/usage", {
        credentials: "include",
      });
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      <div className="flex relative items-start h-full">
        <motion.div
          animate={{
            width: sidebarOpen ? 256 : 0,
            x: sidebarOpen ? 0 : -256,
          }}
          transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 200 }}
          className={`absolute lg:static top-0 left-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden z-[60] lg:z-auto shadow-2xl lg:shadow-none`}
        >
          {/* Main Sidebar Content Wrapper to maintain width while animating */}
          <div className="w-64 h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="Actinova AI Tutor"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Actinova AI Tutor
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                Your personalized learning companion for any topic
              </p>
            </div>

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
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative group"
                      >
                        <button
                          onClick={() => handleItemClick(item.id)}
                          className={`flex items-center w-full space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${isActive
                            ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : item.color || 'text-gray-500'}`} />
                          <span className="flex-1 text-left">{item.name}</span>
                          {isActive && (
                            <motion.div
                              layoutId="active-pill"
                              className="w-1.5 h-1.5 rounded-full bg-primary"
                            />
                          )}
                        </button>
                      </motion.li>
                    );
                  })}
              </ul>
            </nav>

            {/* Bottom sections */}
            <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
              {/* Profile Section */}
              <div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleItemClick("profile")}
                    className={`flex items-center space-x-3 flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeItem === "profile"
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                  >
                    <User className="w-5 h-5" />
                    <span>Account</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer ml-2"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

                {/* Usage Section */}
                <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10 shadow-sm overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500" />
                  <div className="relative space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                          Usage
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                        {user?.subscription?.plan === 'enterprise' ? "Enterprise" : (usage.isPremium ? "Pro" : "Free")}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
                        <span>Generations</span>
                        <span>
                          {usage.used}/{usage.limit === null ? "∞" : usage.limit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${usage.limit === null ? 100 : usage.percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="bg-primary h-1.5 rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                        ></motion.div>
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
