"use client";

import { useRouter } from "next/navigation"
import { useAuth } from "./AuthProvider"
import Hero from "./Hero"
import Features from "./Features"
import HowItWorks from "./HowItWorks"
import Testimonials from "./Testimonials"
import Faq from "./Faq"
import CTA from "./CTA"
import Footer from "./Footer"
import HeroNavbar from './heroNavbar';

export default function LandingPage() {
  const router = useRouter()
  const { user } = useAuth()

  const handleGetStarted = () => {
    if (user) {
      // User is logged in, go to dashboard
      router.push("/dashboard")
    } else {
      // User not logged in, go to signup
      router.push("/auth/signup")
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HeroNavbar handleGetStarted={handleGetStarted} />
      <Hero handleGetStarted={handleGetStarted} />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Faq />
      <CTA handleGetStarted={handleGetStarted} />
      <Footer />
    </div>
  );
}