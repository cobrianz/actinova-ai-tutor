"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../components/DashboardLayout";
import DashboardContent from "../components/DashboardContent";
import confetti from "canvas-confetti";
import { toast } from "sonner";

function useQueryParams() {
  const [params, setParams] = useState(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams()
  );

  useEffect(() => {
    const sync = () => setParams(new URLSearchParams(window.location.search));
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("pushstate", sync);
    window.addEventListener("replacestate", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("pushstate", sync);
      window.removeEventListener("replacestate", sync);
    };
  }, []);

  return params;
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useQueryParams();
  const activeContent = searchParams.get("tab") || "generate";

  const setActiveContent = useCallback((tab) => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    router.push(`/dashboard?${params.toString()}`);
  }, [router]);

  useEffect(() => {
    const celebrate = searchParams.get("celebrate");
    if (celebrate === "true") {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      toast.success("Welcome to Premium! Your account has been upgraded.", {
        description: "Enjoy unlimited access to all AI-driven features.",
        duration: 8000,
      });

      const newParams = new URLSearchParams(window.location.search);
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
