"use client";

import {
  Search, Plus, MessageCircle, MoreHorizontal,
  FileText, ScrollText, Briefcase, HelpCircle, Star,
  User, LogOut, X, TrendingUp, Coins, CalendarCheck, GraduationCap, BookOpen, Home
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { apiClient } from "@/lib/csrfClient";


const secondaryItems = [
  { name: "AI Chat", id: "chat", icon: MessageCircle },
  { name: "Chat with PDF", id: "chat-pdf", icon: FileText },
  { name: "Flashcards", id: "flashcards", icon: FileText },
  { name: "Reports & Essays", id: "reports-library", icon: ScrollText },
  { name: "Career Growth", id: "career", icon: Briefcase },
  { name: "Test Yourself", id: "quizzes", icon: HelpCircle },
  { name: "Premium", id: "premium-courses", icon: Star },
  { name: "Planner", id: "study-plans", icon: CalendarCheck },
];

function NavBtn({ icon: Icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
      className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] px-2 py-1 rounded-lg transition-all duration-200 ${
        isActive ? "text-green-600 dark:text-green-400" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon
        className={`w-6 h-6 transition-all duration-200 ${
          isActive ? "stroke-[2.5]" : "stroke-[1.5]"
        }`}
        fill={isActive ? "currentColor" : "none"}
      />
      <span
        className={`text-[10px] leading-tight whitespace-nowrap transition-all duration-200 ${
          isActive ? "font-bold" : "font-medium"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export default function DashboardMobileNav() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, credits } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [usage, setUsage] = useState({ used: 0, limit: 5, percentage: 0 });
  const menuRef = useRef(null);

  const activeContent = searchParams.get("tab") || "generate";
  const courseUsage = usage?.details?.courses || null;
  const generationUsed = courseUsage?.used ?? usage?.used ?? 0;
  const generationLimit = courseUsage?.limit ?? usage?.limit ?? null;
  const generationPercent = courseUsage?.percent ?? usage?.percentage ?? 0;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    if (moreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreOpen]);

  useEffect(() => {
    if (!user) return;
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
    fetchUsage();
  }, [user]);

  const navigate = (id) => {
    setMoreOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div
            ref={menuRef}
            className="absolute bottom-24 left-4 right-4 bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-sm font-bold text-foreground">More</span>
              <button onClick={() => setMoreOpen(false)} className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2">
              <div className="grid grid-cols-3 gap-1">
                {secondaryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeContent === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-6 h-6" fill={isActive ? "currentColor" : "none"} />
                      <span className="text-[10px] font-medium leading-tight text-center">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-4 pb-2">
              <div className="p-3 bg-accent/30 rounded-lg border border-border">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-700 dark:text-green-300" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Usage</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-accent-foreground">
                      <span>Generations</span>
                      <span>{generationUsed}/{generationLimit === null ? "∞" : generationLimit}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${generationLimit === null ? 100 : generationPercent}%` }}
                      />
                    </div>
                  </div>
                  {(credits || 0) > 0 && (
                    <div className="flex items-center gap-2 pt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      <Coins size={14} />
                      <span>{credits} credits</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-border p-2 flex gap-2">
              <button
                onClick={() => navigate("profile")}
                className={`flex items-center justify-center gap-2 flex-1 p-3 rounded-xl transition-all duration-200 ${
                  activeContent === "profile"
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="w-5 h-5" fill={activeContent === "profile" ? "currentColor" : "none"} />
                <span className="text-sm font-medium">Account</span>
              </button>
              <button
                onClick={() => { logout(); setMoreOpen(false); }}
                className="flex items-center justify-center gap-2 flex-1 p-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", touchAction: "manipulation" }}>
        <div className="flex items-center justify-around h-16 px-1">
            <NavBtn
              icon={Home}
              label="Home"
              isActive={activeContent === "generate"}
              onClick={() => navigate("generate")}
            />

            <NavBtn
              icon={GraduationCap}
              label="Classes"
              isActive={activeContent === "classrooms"}
              onClick={() => navigate("classrooms")}
            />

            <button
              onClick={() => navigate("generate")}
              style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
              className="flex items-center justify-center -mt-3 w-12 h-12 rounded-full bg-green-500 text-white hover:bg-green-600 active:scale-95 transition-all duration-200"
            >
              <Plus className="w-7 h-7 stroke-[2.5]" />
            </button>

            <NavBtn
              icon={BookOpen}
              label="Library"
              isActive={activeContent === "library"}
              onClick={() => navigate("library")}
            />

            <NavBtn
              icon={MoreHorizontal}
              label="More"
              isActive={moreOpen}
              onClick={() => setMoreOpen((prev) => !prev)}
            />
          </div>
        </nav>
    </>
  );
}
