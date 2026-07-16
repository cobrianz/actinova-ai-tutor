"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Explore from "./Explore";
import Generate from "./Generate";
import Library from "./Library";
import PremiumCourses from "./PremiumCourses";
import Chat from "./Chat";
import FlashcardsLibrary from "./FlashcardsLibrary";
import TestYourself from "./TestYourself";
import ReportsLibrary from "./ReportsLibrary";
import ProfileContent from "./ProfileContent";
import CareerGrowth from "./CareerGrowth";
import DashboardOverview from "./DashboardOverview";
import StudyPlanLibrary from "./StudyPlanLibrary";
import { useAuth } from "./AuthProvider";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";
import confetti from "canvas-confetti";

function fireCelebration() {
  const duration = 3000;
  const end = Date.now() + duration;
  const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96E6A1", "#DDA0DD"];

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();

  // Big burst from center
  confetti({
    particleCount: 100,
    spread: 100,
    origin: { y: 0.6 },
    colors,
  });
}

export default function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchUser } = useAuth();
  const [showCelebration, setShowCelebration] = useState(false);
  const verifiedRef = useRef(null);

  useEffect(() => {
    const payment = searchParams.get("payment");
    const purchaseType = searchParams.get("purchaseType");
    const ref = searchParams.get("reference") || searchParams.get("trxref") || searchParams.get("ref");

    if (payment !== "success") return;
    if (!ref) return;
    if (verifiedRef.current === ref) return;
    verifiedRef.current = ref;

    (async () => {
      try {
        const res = await apiClient.get(`/api/billing/verify-payment?ref=${encodeURIComponent(ref)}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          toast.success(
            purchaseType === "credit-purchase" ? "Credits added to your account!" :
            purchaseType === "marketplace-course" ? "Course unlocked successfully!" :
            purchaseType === "premium-generation" ? "Premium access activated!" :
            "Payment successful!"
          );
          fireCelebration();
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 4000);
        } else {
          console.error("Verify failed:", data);
          toast.error(data.error || "Payment verification failed. Contact support.");
        }
      } catch (err) {
        console.error("Verify request failed:", err);
        toast.error("Could not verify payment. Contact support.");
      }

      // Refresh user data to reflect new credits
      await fetchUser?.();

      // Clean up URL params
      if (purchaseType !== "premium-generation") {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("payment");
        nextParams.delete("plan");
        nextParams.delete("purchaseType");
        nextParams.delete("ref");
        nextParams.delete("reference");
        nextParams.delete("trxref");
        const nextUrl = `/dashboard${nextParams.toString() ? `?${nextParams.toString()}` : ""}`;
        router.replace(nextUrl);
      }
    })();
  }, [searchParams, fetchUser, router]);

  useEffect(() => {
    if (searchParams.get("payment") === "failed") {
      toast.error("Payment failed. Please try again.");
      router.replace("/dashboard");
    } else if (searchParams.get("payment") === "error") {
      toast.error("An error occurred during payment. Please contact support.");
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  const activeContent = searchParams.get("tab") || "generate";
  const isChat = activeContent === "chat";

  const setActiveContent = (tab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.push(`/dashboard?${params.toString()}`);
  };

  const routeComponents = {
    analytics: DashboardOverview,
    generate: Generate,
    explore: Explore,
    library: Library,
    flashcards: FlashcardsLibrary,
    quizzes: TestYourself,
    "reports-library": ReportsLibrary,
    "premium-courses": PremiumCourses,
    chat: Chat,
    profile: ProfileContent,
    career: CareerGrowth,
    "study-plans": StudyPlanLibrary,
  };

  const ContentComponent = routeComponents[activeContent] || routeComponents.home;

  return (
    <div
      className={`relative min-h-full bg-background ${
        isChat ? "lg:h-[calc(100vh-64px)] h-[calc(100vh-128px)] overflow-hidden" : "overflow-hidden"
      }`}
    >
      {!isChat && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(15,23,42,0.22)_1px,_transparent_1px)] [background-size:20px_20px] opacity-100 dark:hidden" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(255,255,255,0.65),_rgba(255,255,255,0.18))] dark:hidden" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.07)_1px,_transparent_1px)] [background-size:20px_20px] opacity-0 dark:opacity-100 hidden dark:block" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(0,0,0,0.3),_rgba(0,0,0,0.05))] opacity-0 dark:opacity-100 hidden dark:block" />
        </div>
      )}
      <div
        className={
          isChat
            ? "w-full h-full relative z-10"
            : "max-w-[110rem] w-full mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-12 scrollbar-hide relative z-10"
        }
        style={
          isChat
            ? {}
            : {
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }
        }
      >
        {!isChat && (
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        )}

        <div className={isChat ? "h-full" : "grid grid-cols-1 gap-4 sm:gap-6"}>
          <div className="w-full h-full">
            {ContentComponent ? (
              <ContentComponent
                key={`${activeContent}-${searchParams.get("tool") || ""}`}
                setActiveContent={setActiveContent}
              />
            ) : (
              <div className="text-center text-gray-600 dark:text-gray-400">
                Loading content...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Purchase Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center">
          <div className="text-center animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-lg font-black text-foreground drop-shadow-lg" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Payment Successful!
            </p>
            <p className="text-sm text-muted-foreground mt-2">Your credits have been added</p>
          </div>
        </div>
      )}
    </div>
  );
}
