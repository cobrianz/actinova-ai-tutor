"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import Hero from "./Hero";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import Testimonials from "./Testimonials";
import Faq from "./Faq";
import CTA from "./CTA";
import Footer from "./Footer";
import HeroNavbar from './heroNavbar';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/auth/signup");
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
        <Faq />
        <CTA handleGetStarted={handleGetStarted} />
      </main>
      <Footer />
    </div>
  );
}
