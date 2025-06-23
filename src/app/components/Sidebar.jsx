"use client";

import {
  BookOpen,
  Star,
  Users,
  Sparkles,
  Search,
  CreditCard,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function Sidebar({
  setActiveContent,
  sidebarOpen,
  setSidebarOpen,
  activeContent,
}) {
  const [screenSize, setScreenSize] = useState("large");
  const [activeItem, setActiveItem] = useState(activeContent || "generate");

  const navigation = [
    { name: "New", id: "generate", icon: Plus },
    { name: "Explore", id: "explore", icon: Search },
    { name: "My Roadmap", id: "roadmap", icon: BookOpen },
    { name: "Library", id: "library", icon: BookOpen },
    { name: "Staff Picks", id: "staff-picks", icon: Star },
    { name: "Community", id: "community", icon: Users },
    { name: "Upgrade", id: "upgrade", icon: CreditCard },
  ];

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
    setActiveItem(activeContent);
  }, [activeContent]);

  const handleItemClick = (id) => {
    setActiveItem(id);
    setActiveContent(id);

    // Close on small and medium screens
    if (screenSize === "small" || screenSize === "medium") {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="relative flex">
      {screenSize === "small" && sidebarOpen && (
        <div
          className="fixed inset-0 bg-opacity-50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <motion.div
        animate={{
          width: sidebarOpen ? 256 : 0,
          opacity: sidebarOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className={`fixed top-[64px] left-0 h-[calc(100vh-64px)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 overflow-hidden`}
        style={{
          pointerEvents: sidebarOpen ? "auto" : "none",
          display: sidebarOpen ? "flex" : "none",
          flexDirection: "column",
        }}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Actinova AI Tutor
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
            Your personalized learning companion for any topic
          </p>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto scrollbar-hide">
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <ul className="space-y-2">
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
                    className={`flex items-center w-full space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 ${
                      isActive
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
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
      </motion.div>
    </div>
  );
}
