"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Generate from "./Generate";
import Explore from "./Explore";
import Library from "./Library";
import PremiumCourses from "./PremiumCourses";
import Upgrade from "./Upgrade";
import Chat from "./Chat";
import FlashcardsLibrary from "./FlashcardsLibrary";
import TestYourself from "./TestYourself";
import ProfileContent from "./ProfileContent";
import { useAuth } from "./AuthProvider";
import { toast } from "sonner";

export default function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, fetchUser } = useAuth();

  // Handle payment success/failure messages
  useEffect(() => {
    const payment = searchParams.get("payment");
    const plan = searchParams.get("plan");

    if (payment === "success") {
      toast.success(
        `🎉 Payment successful! You now have ${plan || "Pro"} plan access.`
      );
      // Refresh user data to get updated subscription status
      if (fetchUser) {
        fetchUser();
      }
      // Remove query params
      router.replace("/dashboard");
    } else if (payment === "failed") {
      toast.error("Payment failed. Please try again.");
      router.replace("/dashboard");
    } else if (payment === "error") {
      toast.error("An error occurred during payment. Please contact support.");
      router.replace("/dashboard");
    }
  }, [searchParams, router, fetchUser]);

  const activeContent = searchParams.get("tab") || "generate";
  const isChat = activeContent === 'chat';

  const [greeting, setGreeting] = useState("");
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const setActiveContent = (tab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.push(`/dashboard?${params.toString()}`);
  };

  const routeComponents = {
    generate: Generate,
    explore: Explore,
    library: Library,
    flashcards: FlashcardsLibrary,
    quizzes: TestYourself,
    "staff-picks": PremiumCourses,
    upgrade: Upgrade,
    chat: Chat,
    profile: ProfileContent,
  };
  const ContentComponent =
    routeComponents[activeContent] || routeComponents.generate;

  const ComponentWrapper = isChat ? "div" : "div"; // Keep div for now

  return (
    <div className={`relative min-h-screen bg-background text-foreground ${isChat ? 'h-[calc(100vh-64px)] overflow-hidden' : ''}`}>
      {/* Decorative Background Elements */}
      {!isChat && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
          <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] bg-purple-500/5 rounded-full blur-[110px]" />
        </div>
      )}

      <div
        className={
          isChat
            ? "relative w-full h-full z-10"
            : "relative max-w-[90rem] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 z-10"
        }
      >
        {!isChat && (
          <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {greeting}, <span className="text-primary">{user?.firstName || "Learner"}</span>
                </h1>
                <p className="mt-2 text-muted-foreground text-lg">
                  What would you like to master today?
                </p>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 backdrop-blur-sm border border-border/40 p-1.5 rounded-2xl shadow-sm">
                <button 
                  onClick={() => setActiveContent('generate')}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${activeContent === 'generate' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Create
                </button>
                <button 
                  onClick={() => setActiveContent('explore')}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${activeContent === 'explore' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Explore
                </button>
              </div>
            </div>
          </header>
        )}

        <div className={isChat ? "h-full" : "relative"}>
          {ContentComponent ? (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <ContentComponent
                key={activeContent}
                setActiveContent={setActiveContent}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-medium">Curating your experience...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
