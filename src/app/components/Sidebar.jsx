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
import { useEnsureSession } from "./SessionGuard";

export default function Sidebar({
  setActiveContent,
  sidebarOpen,
  setSidebarOpen,
  activeContent,
}) {
  const [screenSize, setScreenSize] = useState("large");
  const [activeItem, setActiveItem] = useState(activeContent || "generate");
  const [usage, setUsage] = useState({ used: 0, limit: 5, percentage: 0 });

  const { user, logout } = useAuth();
  const { authLoading } = useEnsureSession();

  const isPro =
    !authLoading &&
    user &&
    ((user.subscription &&
      user.subscription.plan === "pro" &&
      user.subscription.status === "active") ||
      user.isPremium);

  const navigation = [
    { name: "New", id: "generate", icon: Plus },
    { name: "Explore", id: "explore", icon: Search },
    { name: "Library", id: "library", icon: BookOpen },
    { name: "Flashcards", id: "flashcards", icon: FileText },
    { name: "Test Yourself", id: "quizzes", icon: HelpCircle },
    { name: "AI Chat", id: "chat", icon: MessageCircle },
    { name: "Premium", id: "staff-picks", icon: Star },
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
    <div className="flex">
      <motion.div
        animate={{
          width: sidebarOpen ? 256 : 0,
        }}
        transition={{ duration: 0.3 }}
        className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden`}
      >
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

        <nav className="p-4 overflow-y-auto scrollbar-hide">
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
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom sections with 2rem from bottom */}
        <div className="absolute bottom-8 left-0 right-0 px-4 space-y-0">
          {/* Profile Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
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
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-700 dark:text-blue-300" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Usage This Month
                  </span>
                </div>
                <span className="text-xs text-blue-700 dark:text-blue-300">
                  {usage.isPremium ? "Pro Plan" : "Free Plan"}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                  <span>AI Generations</span>
                  <span>
                    {usage.used}/{usage.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${usage.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
