"use client";


import {
  BookOpen,
  Star,
  Search,
  Plus,
  MessageCircle,
  FileText,
  ScrollText,
  HelpCircle,
  User,
  LogOut,
  Briefcase,
  Coins,
  Home,
  CalendarCheck,
  ChevronRight,
  BarChart2,
  GraduationCap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import XPWidget from "./XPWidget";

const NAV_GROUPS = [
  {
    label: "Create",
    items: [
      { name: "New Session", id: "generate", icon: Plus },
      { name: "AI Chat", id: "chat", icon: MessageCircle, premium: true },
      { name: "Chat with PDF", id: "chat-pdf", icon: FileText, premium: true },
    ],
  },
  {
    label: "Discover",
    items: [
      { name: "Explore", id: "explore", icon: Search },
      { name: "Library", id: "library", icon: BookOpen },
      { name: "Premium", id: "premium-courses", icon: Star, premium: true, showLock: false },
    ],
  },
  {
    label: "Learn",
    items: [
      { name: "Study Plans", id: "study-plans", icon: CalendarCheck },
      { name: "Flashcards", id: "flashcards", icon: FileText },
      { name: "Test Yourself", id: "quizzes", icon: HelpCircle },
    ],
  },
  {
    label: "Grow",
    items: [
      { name: "Reports & Essays", id: "reports-library", icon: ScrollText, premium: true },
      { name: "Career Growth", id: "career", icon: Briefcase, premium: true, showLock: false },
      { name: "Analytics", id: "analytics", icon: BarChart2 },
    ],
  },
  {
    label: "Team",
    items: [
      { name: "Classrooms", id: "classrooms", icon: GraduationCap },
    ],
  },
];

export default function Sidebar({
  setActiveContent,
  sidebarOpen,
  setSidebarOpen,
  activeContent,
}) {
  const router = useRouter();
  const [screenSize, setScreenSize] = useState("large");
  const [activeItem, setActiveItem] = useState(activeContent || "generate");
  const { user, logout, loading: authLoading, isEnterprise, credits } = useAuth();
  const activeSub = user?.subscription?.status === "active";
  const planTier = user?.subscription?.tier;
  const planLabel = isEnterprise
    ? "Enterprise"
    : activeSub && (planTier === "pro" || planTier === "enterprise")
    ? "Pro"
    : "Free";

  const isPro = planLabel !== "Free";

  const isMobile = screenSize === "small" || screenSize === "medium";
  const bottomNavIds = ["analytics", "generate", "chat", "explore", "library"];

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
    if (screenSize === "large") setSidebarOpen(true);
    else setSidebarOpen(false);
  }, [screenSize, setSidebarOpen]);

  useEffect(() => {
    if (activeContent) setActiveItem(activeContent);
  }, [activeContent]);

  const handleItemClick = (id) => {
    if (id === "upgrade") {
      router.push("/dashboard");
      return;
    }
    setActiveItem(id);
    router.push(`/dashboard/${id}`);
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

  // Filter mobile bottom-nav items from groups
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: isMobile
      ? group.items.filter((item) => !bottomNavIds.includes(item.id))
      : group.items,
  })).filter((g) => g.items.length > 0);

  const creditPercent = Math.min(100, (credits / 120) * 100);

  const sidebarInner = (
    <div className="w-[240px] h-full flex flex-col"
      style={{
        background: "var(--sidebar-bg, var(--card))",
        borderRight: "1px solid var(--border)",
      }}
    >
      <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 py-3 space-y-4">
        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { scrollbar-width: none; }
        `}</style>

        {visibleGroups.map((group, gi) => (
          <div key={group.label}>
            <p className="px-2 mb-1 text-[8px] font-semibold tracking-widest uppercase text-muted-foreground/60 select-none" style={{ fontFamily: "var(--font-fraunces)" }}>
              {group.label}
            </p>

            <ul className="space-y-0.5">
              {group.items.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeItem === item.id;

                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: gi * 0.05 + index * 0.04 }}
                    className="relative"
                  >
                    <button
                      onClick={() => handleItemClick(item.id)}
                      className={`
                        relative flex items-center w-full gap-2 px-2.5 py-2 rounded-lg
                        text-xs font-medium transition-all duration-200 group
                        ${isActive
                          ? "bg-green-500/10 text-green-700 dark:text-green-400"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                        }
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-indicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-green-500"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}

                      <span
                        className={`
                          flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0
                          transition-all duration-200
                          ${isActive
                            ? "bg-green-500/15 text-green-600 dark:text-green-400"
                            : "bg-secondary/60 text-muted-foreground group-hover:bg-secondary group-hover:text-foreground"
                          }
                        `}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>

                      <span className="flex-1 text-left truncate text-[12px]" style={{ fontFamily: "var(--font-fraunces)" }}>
                        {item.name}
                      </span>

                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 text-green-500/70 flex-shrink-0" />
                      )}
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-4 pt-2 space-y-2.5 border-t border-border/60">
        <XPWidget />

        <div className="px-3 py-2.5 rounded-xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/15 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Coins className="w-3 h-3 text-green-600 dark:text-green-400" />
              <span className="text-[10px] font-semibold text-green-700 dark:text-green-400">
                Credits
              </span>
            </div>
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400">
              {credits} left
            </span>
          </div>
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${creditPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleItemClick("profile")}
            className={`
              flex items-center gap-2 flex-1 text-left px-2.5 py-1.5 rounded-lg
              text-xs font-medium transition-all duration-200
              ${activeItem === "profile"
                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }
            `}
          >
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
              <User className="w-3.5 h-3.5" />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold truncate text-foreground leading-none" style={{ fontFamily: "var(--font-fraunces)" }}>
                {user?.name || user?.email?.split("@")[0] || "Account"}
              </span>
              <span className="text-[9px] text-muted-foreground leading-none mt-0.5 truncate">
                {planLabel} plan
              </span>
            </div>
          </button>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200 flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  if (screenSize === "large") {
    return sidebarInner;
  }

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="sidebar"
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ duration: 0.3, type: "spring", damping: 28, stiffness: 220 }}
            className="fixed top-0 left-0 h-screen z-[100]"
          >
            {sidebarInner}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
