"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
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
import { useAuth } from "./AuthProvider";
import { toast } from "sonner";

export default function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchUser } = useAuth();

  useEffect(() => {
    const payment = searchParams.get("payment");
    const plan = searchParams.get("plan");
    const purchaseType = searchParams.get("purchaseType");

    if (payment === "success") {
      if (purchaseType === "marketplace-course") {
        toast.success("Marketplace course unlocked successfully.");
      } else if (purchaseType === "premium-generation") {
        toast.success("Payment received. Premium generation is continuing.");
      } else if (purchaseType === "resume-export") {
        // ResumeBuilder handles the post-payment download messaging.
      } else {
        toast.success(`Payment successful! You now have ${plan || "Pro"} plan access.`);
      }

      fetchUser?.();

      if (purchaseType === "premium-generation") {
        return;
      }

      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("payment");
      nextParams.delete("plan");
      nextParams.delete("purchaseType");
      nextParams.delete("ref");
      const nextUrl = `/dashboard${nextParams.toString() ? `?${nextParams.toString()}` : ""}`;
      router.replace(nextUrl);
    } else if (payment === "failed") {
      toast.error("Payment failed. Please try again.");
      router.replace("/dashboard");
    } else if (payment === "error") {
      toast.error("An error occurred during payment. Please contact support.");
      router.replace("/dashboard");
    }
  }, [fetchUser, router, searchParams]);

  const activeContent = searchParams.get("tab") || "generate";
  const isChat = activeContent === "chat";

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
    "reports-library": ReportsLibrary,
    "premium-courses": PremiumCourses,
    chat: Chat,
    profile: ProfileContent,
    career: CareerGrowth,
  };

  const ContentComponent = routeComponents[activeContent] || routeComponents.generate;

  return (
    <div
      className={`relative min-h-full bg-background ${
        isChat ? "lg:h-[calc(100vh-64px)] h-[calc(100vh-128px)] overflow-hidden" : ""
      }`}
    >
      <div
        className={
          isChat
            ? "w-full h-full"
            : "max-w-[90rem] w-full mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-12 scrollbar-hide"
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
    </div>
  );
}
