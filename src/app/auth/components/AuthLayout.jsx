"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Panel - Image (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="/hero.png"
          alt="Actirova"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/90 via-green-700/85 to-green-900/90" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-2.5 group/logo w-fit">
            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden p-1">
              <img src="/logo.png" alt="Actirova" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-fraunces)" }}>
              Actirova
            </span>
          </Link>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight" style={{ fontFamily: "var(--font-fraunces)" }}>
              {title || "Start your learning journey"}
            </h2>
            <p className="text-lg text-white/80 leading-relaxed max-w-md" style={{ fontFamily: "var(--font-fraunces)" }}>
              {subtitle || "Join thousands of students learning smarter with AI-powered tools."}
            </p>
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/60" />
                <span className="text-sm text-white/70 font-medium">AI-Powered Courses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/60" />
                <span className="text-sm text-white/70 font-medium">Smart Flashcards</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/60" />
                <span className="text-sm text-white/70 font-medium">Study Plans</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/50 font-medium">
            &copy; {new Date().getFullYear()} Actirova. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col bg-[#FAFAF7] lg:bg-white">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-6 pt-6 pb-2">
          <Link href="/" className="flex items-center gap-2 group/logo">
            <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden p-0.5">
              <img src="/logo.png" alt="Actirova" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#1a1a1a]" style={{ fontFamily: "var(--font-fraunces)" }}>
              Actirova
            </span>
          </Link>
          <div className="inline-flex items-center">
            <GraduationCap className="w-5 h-5 text-green-600" fill="currentColor" />
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:py-0">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
