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

export default function Sidebar({ setActiveContent }) {
  const [isSmallScreen, setIsSmallScreen] = useState(true);
  const [activeItem, setActiveItem] = useState("new");

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
      setIsSmallScreen(window.innerWidth < 1200);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleItemClick = (id) => {
    setActiveItem(id);
    setActiveContent(id);
  };

  return (
    <div className="relative flex">
      <motion.div
        className={`fixed top-[64px] left-0 h-[calc(100vh-64px)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden z-30 ${
          isSmallScreen ? "w-16" : "w-64"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!isSmallScreen && (
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Actinova AI Tutor
              </span>
            )}
          </div>
          {!isSmallScreen && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
              Your personalized learning companion for any topic
            </p>
          )}
        </div>

        <nav
          className="flex-1 p-4 overflow-y-auto scrollbar-hide"
          style={{
            scrollbarWidth: "none" /* Firefox */,
            msOverflowStyle: "none" /* IE and Edge */,
          }}
        >
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none; /* Chrome, Safari, and Edge */
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
                    className={`flex items-center w-full ${
                      isSmallScreen ? "justify-center" : "space-x-3 px-3"
                    } py-2 rounded-lg text-sm font-medium transition-all duration-200 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 ${
                      isActive
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="relative"
                    >
                      <Icon className="w-5 h-5" />
                      {isSmallScreen && (
                        <div className="absolute left-10 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50">
                          {item.name}
                        </div>
                      )}
                    </motion.div>
                    {!isSmallScreen && <span>{item.name}</span>}
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
