"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "../components/DashboardLayout";
import DashboardContent from "../components/DashboardContent";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useEffect } from "react";

function DashboardInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeContent = searchParams.get("tab") || "generate";

  const setActiveContent = (tab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.push(`/dashboard?${params.toString()}`);
  };

  useEffect(() => {
    const celebrate = searchParams.get("celebrate");
    if (celebrate === "true") {
      // Fire celebration
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      toast.success("Welcome to Premium! Your account has been upgraded.", {
        description: "Enjoy unlimited access to all AI-driven features.",
        duration: 8000,
      });

      // Clear the param after a short delay so it doesn't re-fire
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("celebrate");
      const newUrl = `/dashboard${newParams.toString() ? '?' + newParams.toString() : ''}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [searchParams]);

  return (
    <DashboardLayout
      activeContent={activeContent}
      setActiveContent={setActiveContent}
    >
      <DashboardContent />
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading dashboard...</div>}>
      <DashboardInner />
    </Suspense>
  );
}
