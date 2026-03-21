"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import Hero from "./Hero";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import Testimonials from "./Testimonials";
import CTA from "./CTA";
import Footer from "./Footer";
import HeroNavbar from './heroNavbar';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleGetStarted = (redirectPath = "/dashboard") => {
    if (user) {
      router.push(redirectPath);
    } else {
      router.push(`/auth/signup?callbackUrl=${encodeURIComponent(redirectPath)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10 selection:text-primary">
      <HeroNavbar handleGetStarted={handleGetStarted} />
      <main>
        <Hero handleGetStarted={handleGetStarted} />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTA handleGetStarted={handleGetStarted} />
      </main>
      <Footer />
    </div>
  );
}
