"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import Hero from "./Hero";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import Testimonials from "./Testimonials";
import CTA from "./CTA";
import Footer from "./Footer";
import HeroNavbar from './heroNavbar';
import { apiClient } from "@/lib/csrfClient";

export default function LandingPage({ initialNotice = null }) {
  const router = useRouter();
  const { user } = useAuth();

  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator?.standalone === true);

  useEffect(() => {
    if (isStandalone) {
      router.replace("/dashboard");
      return;
    }

    apiClient.get("/api/visitor-counter").catch(() => {
      // Ignore errors for visitor counter in production
    });
  }, [router]);

  const handleGetStarted = (redirectPath = "/dashboard") => {
    if (user) {
      router.push(redirectPath);
    } else {
      router.push(`/auth/signup?callbackUrl=${encodeURIComponent(redirectPath)}`);
    }
  };

  if (isStandalone) return null;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10 selection:text-primary flex flex-col">
      <HeroNavbar handleGetStarted={handleGetStarted} />
      <main className="flex-1">
        <Hero handleGetStarted={handleGetStarted} initialNotice={initialNotice} />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTA handleGetStarted={handleGetStarted} />
      </main>
      <Footer />
    </div>
  );
}
