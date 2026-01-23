"use client";

import React, { useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import {
  UserPlus,
  Compass,
  BookOpen,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Brain,
  Zap,
  Star,
  Trophy,
  Calendar,
  Clock,
  Award,
  Search,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Home,
  BarChart3,
  User,
  Folder,
  Share2,
  Download,
  Loader2,
  ArrowRight,
  Shield,
  Lock,
} from "lucide-react";
import { data } from "../lib/landingData";

// Animated Counter Hook
function useCounter(end  , duration   = 2000) {
  const [count, setCount] = useState(0);
  const ref = React.useRef  (null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    let startTime  ;
    const animate = (currentTime  ) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration, isInView]);

  return { count, ref };
}

// Floating particles with blue/purple colors
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${
            i % 3 === 0 
              ? "w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400" 
              : i % 3 === 1 
                ? "w-1.5 h-1.5 bg-gradient-to-r from-violet-400 to-purple-400"
                : "w-1 h-1 bg-gradient-to-r from-indigo-400 to-blue-400"
          }`}
          initial={{
            x: Math.random() * 100 + "%",
            y: "110%",
            opacity: 0,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: "-10%",
            opacity: [0, 0.8, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: Math.random() * 12 + 8,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

export default function HowItWorks() {
  const { steps } = data;
  const icons = [UserPlus, Compass, BookOpen, GraduationCap];

  return (
    <section id="how-it-works" className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, 50, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 right-1/4 w-[900px] h-[900px] bg-gradient-to-br from-blue-400/30 via-cyan-300/20 to-transparent rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1],
            x: [0, -30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-0 left-1/4 w-[700px] h-[700px] bg-gradient-to-tr from-violet-400/25 via-purple-300/20 to-transparent rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.18, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-300/20 to-blue-300/15 rounded-full blur-[100px]"
        />
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <FloatingParticles />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20 md:mb-28"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-100 to-violet-100 dark:from-blue-500/15 dark:to-violet-500/15 border border-blue-200/50 dark:border-blue-500/20 text-sm font-medium mb-8 shadow-lg shadow-blue-500/10"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <span className="bg-gradient-to-r from-blue-700 to-violet-700 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent font-semibold">
              Simple & Powerful
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-balance text-slate-900 dark:text-white">
            How it{" "}
            <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent bg-[size:200%] animate-gradient">
              Works
            </span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed text-pretty">
            Transform your learning journey in four simple steps. Our AI-powered
            platform makes mastering any skill effortless.
          </p>
        </motion.div>

        {/* Steps */}
        <StepOne step={steps[0]} icon={icons[0]} />
        <StepTwo step={steps[1]} icon={icons[1]} />
        <StepThree step={steps[2]} icon={icons[2]} />
        <StepFour step={steps[3]} icon={icons[3]} />
      </div>
    </section>
  );
}

// Beautiful Tilted Browser Window
function BrowserWindow({
  children,
  url = "actirova.com",
  className = "",
  tiltDirection = "left",
}: {
  children: any;
  url?  ;
  className?  ;
  tiltDirection? "left" | "right";
}) {
  const tilt = tiltDirection === "left" ? "rotate-[-2deg]" : "rotate-[2deg]";
  
  return (
    <motion.div
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        rotate: 0,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`${tilt} rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20 dark:shadow-violet-500/15 border border-blue-100 dark:border-white/10 bg-white dark:bg-gradient-to-b dark:from-slate-800 dark:to-slate-900 ${className}`}
    >
      {/* Title Bar - Light Theme */}
      <div className="bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-white/5 px-4 py-3 flex items-center gap-3">
        {/* Traffic Lights */}
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.3 }}
            className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-500 shadow-inner"
          />
          <motion.div
            whileHover={{ scale: 1.3 }}
            className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-inner"
          />
          <motion.div
            whileHover={{ scale: 1.3 }}
            className="w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-inner"
          />
        </div>
        {/* URL Bar */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-sm text-slate-500 dark:text-slate-400 max-w-sm w-full shadow-inner">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span className="truncate font-medium">{url}</span>
          </div>
        </div>
        {/* Right Icons */}
        <div className="flex items-center gap-3 text-slate-400">
          <Share2 className="w-4 h-4 hover:text-blue-500 transition-colors cursor-pointer" />
          <Download className="w-4 h-4 hover:text-blue-500 transition-colors cursor-pointer" />
        </div>
      </div>
      {/* Content */}
      <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">{children}</div>
    </motion.div>
  );
}

// App Window Chrome Component
function AppWindow({
  children,
  title = "Actirova",
  className = "",
  tiltDirection = "left",
}: {
  children: any;
  title?  ;
  className?  ;
  tiltDirection? "left" | "right";
}) {
  const tilt = tiltDirection === "left" ? "rotate-[-2deg]" : "rotate-[2deg]";
  
  return (
    <motion.div
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        rotate: 0,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`${tilt} rounded-2xl overflow-hidden shadow-2xl shadow-violet-500/20 dark:shadow-purple-500/15 border border-violet-100 dark:border-white/10 bg-white dark:bg-gradient-to-b dark:from-slate-800 dark:to-slate-900 ${className}`}
    >
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-white/5 px-4 py-3 flex items-center">
        {/* Traffic Lights */}
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.3 }}
            className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-500 shadow-inner"
          />
          <motion.div
            whileHover={{ scale: 1.3 }}
            className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-inner"
          />
          <motion.div
            whileHover={{ scale: 1.3 }}
            className="w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-inner"
          />
        </div>
        {/* Title */}
        <div className="flex-1 text-center">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</span>
        </div>
        {/* Spacer */}
        <div className="w-14" />
      </div>
      {/* Content */}
      <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">{children}</div>
    </motion.div>
  );
}

// Step 1: Profile Creation
function StepOne({
  step,
  icon: Icon,
}: {
  step: { title  ; description   };
  icon: React.ComponentType<{ className?   }>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-32 md:mb-44"
    >
      {/* Text Content */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-500/20 dark:to-cyan-500/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/20"
          >
            <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", delay: 0.2 }}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold shadow-lg shadow-blue-500/30"
          >
            Step 1
          </motion.div>
        </div>
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">{step.title}</h3>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
        <div className="space-y-4 pt-2">
          {["Set learning goals", "Choose skill level", "Personalize experience"].map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-4 group"
            >
              <motion.div
                whileHover={{ scale: 1.2 }}
                className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/30"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
              </motion.div>
              <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Profile Card Mockup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: 50 }}
        whileInView={{ opacity: 1, scale: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="relative"
      >
        <BrowserWindow url="actirova.com/onboarding" tiltDirection="left">
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="mb-8">
              <motion.h4
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-xl font-semibold text-slate-800 dark:text-white mb-2"
              >
                Complete Your Profile
              </motion.h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Help us personalize your learning experience</p>
            </div>

            {/* Profile Form Mock */}
            <div className="space-y-6">
              {/* Avatar Upload */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, type: "spring" }}
                className="flex items-center gap-4"
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(59, 130, 246, 0)",
                      "0 0 0 12px rgba(59, 130, 246, 0.1)",
                      "0 0 0 0 rgba(59, 130, 246, 0)",
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-blue-500/40"
                >
                  JD
                </motion.div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-800 dark:text-white">John Doe</div>
                  <div className="text-xs text-slate-400">john@example.com</div>
                  <button className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    Change photo
                  </button>
                </div>
              </motion.div>

              {/* Skills Selection */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">What do you want to learn?</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "JavaScript", selected: true },
                    { name: "React", selected: true },
                    { name: "Python", selected: false },
                    { name: "AI/ML", selected: false },
                  ].map((skill, i) => (
                    <motion.span
                      key={skill.name}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.6 + i * 0.05, type: "spring" }}
                      whileHover={{ scale: 1.08, y: -2 }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                        skill.selected
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30"
                          : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600"
                      }`}
                    >
                      {skill.name}
                    </motion.span>
                  ))}
                </div>
              </motion.div>

              {/* Experience Level */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Your experience level</label>
                <div className="grid grid-cols-3 gap-3">
                  {["Beginner", "Intermediate", "Advanced"].map((level, i) => (
                    <motion.div
                      key={level}
                      whileHover={{ scale: 1.03, y: -2 }}
                      className={`p-3 rounded-xl text-center text-sm font-medium cursor-pointer transition-all ${
                        i === 1
                          ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-500/20 dark:to-cyan-500/20 border-2 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-400 shadow-md shadow-blue-500/20"
                          : "bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500"
                      }`}
                    >
                      {level}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Weekly Goal Slider */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Weekly learning goal</label>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">10 hrs/week</span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "60%" }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.9, duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-400 rounded-full relative"
                  >
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-blue-500 shadow-lg shadow-blue-500/50"
                    />
                  </motion.div>
                </div>
              </motion.div>

              {/* CTA Button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 text-white font-semibold flex items-center justify-center gap-2 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-shadow"
              >
                Continue
                <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </motion.button>
            </div>
          </div>
        </BrowserWindow>

        {/* Glow Effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/30 via-cyan-400/20 to-blue-400/30 rounded-3xl blur-3xl -z-10" />
        <motion.div
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute -inset-10 bg-gradient-to-r from-blue-500/20 to-cyan-500/15 rounded-3xl blur-[80px] -z-20"
        />
      </motion.div>
    </motion.div>
  );
}

// Step 2: Path Generation
function StepTwo({
  step,
  icon: Icon,
}: {
  step: { title  ; description   };
  icon: React.ComponentType<{ className?   }>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-32 md:mb-44"
    >
      {/* Mockup First (Left on desktop) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: -50 }}
        whileInView={{ opacity: 1, scale: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="relative lg:order-1"
      >
        <BrowserWindow url="actirova.com/learning-path" tiltDirection="right">
          <div className="flex min-h-[450px]">
            {/* Sidebar */}
            <div className="w-16 border-r border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50 p-3 hidden md:flex flex-col items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center cursor-pointer shadow-sm border border-slate-200 dark:border-slate-600"
              >
                <Home className="w-5 h-5 text-slate-400" />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/40 cursor-pointer"
              >
                <Compass className="w-5 h-5 text-white" />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
              >
                <BarChart3 className="w-5 h-5 text-slate-400" />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
              >
                <Folder className="w-5 h-5 text-slate-400" />
              </motion.div>
              <div className="mt-auto">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center cursor-pointer shadow-md"
                >
                  <User className="w-5 h-5 text-white" />
                </motion.div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-slate-800 dark:text-white">Your Learning Path</h4>
                  <p className="text-sm text-slate-500">React Developer Journey</p>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30"
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400">Progress:</span>
                  <span className="font-bold text-violet-600 dark:text-violet-400">42%</span>
                </motion.div>
              </div>

              {/* Path Tree */}
              <div className="space-y-2">
                {[
                  { title: "Foundations", progress: 100, modules: 8, status: "completed" },
                  { title: "Core Concepts", progress: 65, modules: 12, status: "in-progress" },
                  { title: "Advanced Patterns", progress: 0, modules: 10, status: "locked" },
                  { title: "Real Projects", progress: 0, modules: 6, status: "locked" },
                ].map((module, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -40, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.15, type: "spring" }}
                    className="relative"
                  >
                    {/* Connector Line */}
                    {i < 3 && (
                      <motion.div
                        initial={{ height: 0 }}
                        whileInView={{ height: "24px" }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 + i * 0.15 }}
                        className={`absolute left-5 top-[52px] w-0.5 ${
                          module.status === "completed" || module.status === "in-progress"
                            ? "bg-gradient-to-b from-violet-500 to-violet-500/30"
                            : "bg-slate-200 dark:bg-slate-600"
                        }`}
                      />
                    )}

                    <motion.div
                      whileHover={{ scale: 1.02, x: 6 }}
                      className={`flex items-start gap-4 p-4 rounded-xl transition-all cursor-pointer ${
                        module.status === "in-progress"
                          ? "bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-500/15 dark:to-purple-500/15 border border-violet-200 dark:border-violet-500/30 shadow-md shadow-violet-500/10"
                          : module.status === "completed"
                            ? "bg-slate-50 dark:bg-slate-700/50"
                            : "bg-slate-50/50 dark:bg-slate-800/30 opacity-60"
                      }`}
                    >
                      {/* Status Circle */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          module.status === "completed"
                            ? "bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/40"
                            : module.status === "in-progress"
                              ? "bg-gradient-to-r from-violet-500 to-purple-500 shadow-lg shadow-violet-500/40"
                              : "bg-slate-200 dark:bg-slate-600"
                        }`}
                      >
                        {module.status === "completed" ? (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : module.status === "in-progress" ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2 className="w-5 h-5 text-white" />
                          </motion.div>
                        ) : (
                          <Lock className="w-4 h-4 text-slate-400" />
                        )}
                      </motion.div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`font-semibold ${module.status === "locked" ? "text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-white"}`}
                          >
                            {module.title}
                          </span>
                          <span className="text-xs text-slate-400">{module.modules} lessons</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${module.progress}%` }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6 + i * 0.15, duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              module.status === "completed"
                                ? "bg-gradient-to-r from-emerald-500 to-green-500"
                                : "bg-gradient-to-r from-violet-500 to-purple-500"
                            }`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </BrowserWindow>

        {/* Glow Effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-violet-400/30 via-purple-400/20 to-violet-400/30 rounded-3xl blur-3xl -z-10" />
        <motion.div
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute -inset-10 bg-gradient-to-r from-violet-500/20 to-purple-500/15 rounded-3xl blur-[80px] -z-20"
        />
      </motion.div>

      {/* Text Content (Right on desktop) */}
      <div className="space-y-8 lg:order-2">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-500/20 dark:to-purple-500/20 border border-violet-200 dark:border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-500/20"
          >
            <Icon className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", delay: 0.2 }}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-bold shadow-lg shadow-violet-500/30"
          >
            Step 2
          </motion.div>
        </div>
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">{step.title}</h3>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
        <div className="space-y-4 pt-2">
          {["Custom curriculum", "Adaptive difficulty", "Structured roadmap"].map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-4 group"
            >
              <motion.div
                whileHover={{ scale: 1.2 }}
                className="w-6 h-6 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center shadow-md shadow-violet-500/30"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
              </motion.div>
              <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Step 3: Learning - Quiz Interface
function StepThree({
  step,
  icon: Icon,
}: {
  step: { title  ; description   };
  icon: React.ComponentType<{ className?   }>;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-32 md:mb-44"
    >
      {/* Text Content */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-500/20 dark:to-blue-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/20"
          >
            <Icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", delay: 0.2 }}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/30"
          >
            Step 3
          </motion.div>
        </div>
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">{step.title}</h3>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
        <div className="space-y-4 pt-2">
          {["Interactive lessons", "Instant feedback", "AI-powered hints"].map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-4 group"
            >
              <motion.div
                whileHover={{ scale: 1.2 }}
                className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center shadow-md shadow-indigo-500/30"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
              </motion.div>
              <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quiz Interface Mockup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: 50 }}
        whileInView={{ opacity: 1, scale: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="relative"
      >
        <AppWindow title="Actirova - Interactive Quiz" tiltDirection="left">
          <div className="p-6">
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(99, 102, 241, 0)",
                      "0 0 0 12px rgba(99, 102, 241, 0.15)",
                      "0 0 0 0 rgba(99, 102, 241, 0)",
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/40"
                >
                  <Brain className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <div className="font-semibold text-slate-800 dark:text-white">React Hooks Quiz</div>
                  <div className="text-xs text-slate-500">Core Concepts - Lesson 5</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Question 3/10</div>
                <div className="text-xs text-slate-500">Score: 85%</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-6">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "30%" }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 1 }}
                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full relative overflow-hidden"
              >
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </motion.div>
            </div>

            {/* Question */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mb-6 p-5 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-700/30 border border-slate-200 dark:border-white/5"
            >
              <p className="font-medium leading-relaxed text-slate-800 dark:text-white">
                Which hook should you use when you need to perform side effects in a functional component?
              </p>
            </motion.div>

            {/* Answer Options */}
            <div className="space-y-3 mb-6">
              {[
                { text: "useState", correct: false },
                { text: "useEffect", correct: true },
                { text: "useContext", correct: false },
                { text: "useReducer", correct: false },
              ].map((option, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -30, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  whileHover={{ scale: 1.02, x: 6 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedAnswer(i)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    option.correct
                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 shadow-md shadow-emerald-500/20"
                      : "border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        option.correct
                          ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/40"
                          : "bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className={`font-medium ${option.correct ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>
                      {option.text}
                    </span>
                  </div>
                  {option.correct && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1, type: "spring" }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* AI Hint */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1 }}
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-500/15 dark:to-blue-500/15 border border-indigo-200 dark:border-indigo-500/30 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/40"
                >
                  <Zap className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <div className="text-sm font-medium text-indigo-700 dark:text-indigo-400">AI Hint Available</div>
                  <div className="text-xs text-slate-500">Need help? Get a personalized hint</div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/30"
              >
                Get Hint
              </motion.button>
            </motion.div>
          </div>
        </AppWindow>

        {/* Glow Effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-400/30 via-blue-400/20 to-indigo-400/30 rounded-3xl blur-3xl -z-10" />
        <motion.div
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 2 }}
          className="absolute -inset-10 bg-gradient-to-r from-indigo-500/20 to-blue-500/15 rounded-3xl blur-[80px] -z-20"
        />
      </motion.div>
    </motion.div>
  );
}

// Step 4: Achievement Dashboard
function StepFour({
  step,
  icon: Icon,
}: {
  step: { title  ; description   };
  icon: React.ComponentType<{ className?   }>;
}) {
  const scoreCounter = useCounter(98, 1500);
  const hoursCounter = useCounter(42, 1500);

  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center"
    >
      {/* Mockup First (Left on desktop) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: -50 }}
        whileInView={{ opacity: 1, scale: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="relative lg:order-1"
      >
        <BrowserWindow url="actirova.com/achievements" tiltDirection="right">
          <div className="p-6">
            {/* Certificate Card */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="relative p-8 rounded-2xl bg-gradient-to-br from-purple-50 via-violet-50/50 to-white dark:from-purple-500/15 dark:via-violet-500/10 dark:to-transparent border border-purple-200 dark:border-purple-500/20 mb-6 overflow-hidden"
            >
              {/* Decorative Pattern */}
              <div className="absolute inset-0 opacity-20 dark:opacity-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 right-0 w-40 h-40 border-4 border-purple-400 rounded-full -translate-y-1/2 translate-x-1/2"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-0 left-0 w-32 h-32 border-4 border-violet-400 rounded-full translate-y-1/2 -translate-x-1/2"
                />
              </div>

              <div className="relative text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600 mx-auto mb-4 flex items-center justify-center shadow-2xl shadow-purple-500/50"
                >
                  <motion.div
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Trophy className="w-10 h-10 text-white" />
                  </motion.div>
                </motion.div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Certificate of Completion
                </div>
                <div className="text-2xl font-bold text-slate-800 dark:text-white mb-1">React Developer</div>
                <div className="text-sm text-slate-500">Issued to John Doe - Jan 2026</div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { icon: Star, value: scoreCounter.count, suffix: "%", label: "Score", ref: scoreCounter.ref },
                { icon: Award, value: "Gold", label: "Rank" },
                { icon: Calendar, value: "4", suffix: " wks", label: "Duration" },
                { icon: Clock, value: hoursCounter.count, suffix: "h", label: "Time", ref: hoursCounter.ref },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.5, opacity: 0, y: 20 }}
                  whileInView={{ scale: 1, opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + i * 0.1, type: "spring" }}
                  whileHover={{ scale: 1.08, y: -4 }}
                  className="p-4 rounded-xl bg-gradient-to-b from-white to-slate-50 dark:from-slate-700/50 dark:to-slate-700/30 border border-slate-200 dark:border-white/5 text-center cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                >
                  <motion.div
                    whileHover={{ rotate: 10 }}
                    className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-500/20 dark:to-violet-500/20 mx-auto mb-2 flex items-center justify-center"
                  >
                    <stat.icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </motion.div>
                  <div className="text-lg font-bold text-slate-800 dark:text-white">
                    {typeof stat.value === "number" ? (
                      <span ref={stat.ref}>
                        {stat.value}
                        {stat.suffix}
                      </span>
                    ) : (
                      stat.value
                    )}
                    {stat.suffix && typeof stat.value !== "number" && stat.suffix}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Skills Mastered */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1 }}
              className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-700/50 dark:to-slate-700/30 border border-slate-200 dark:border-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </motion.div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">Skills Mastered</span>
                </div>
                <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
              </div>
              <div className="flex flex-wrap gap-2">
                {["React Hooks", "State Management", "TypeScript", "Testing", "Performance"].map((skill, i) => (
                  <motion.span
                    key={skill}
                    initial={{ scale: 0, rotate: -10 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.1 + i * 0.08, type: "spring" }}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-500/20 dark:to-violet-500/20 text-purple-700 dark:text-purple-400 text-xs font-medium border border-purple-200 dark:border-purple-500/20 cursor-pointer shadow-sm"
                  >
                    {skill}
                  </motion.span>
                ))}
                <motion.span
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.5, type: "spring" }}
                  whileHover={{ scale: 1.1 }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  12 more
                </motion.span>
              </div>
            </motion.div>
          </div>
        </BrowserWindow>

        {/* Glow Effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-purple-400/30 via-violet-400/20 to-purple-400/30 rounded-3xl blur-3xl -z-10" />
        <motion.div
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 3 }}
          className="absolute -inset-10 bg-gradient-to-r from-purple-500/20 to-violet-500/15 rounded-3xl blur-[80px] -z-20"
        />
      </motion.div>

      {/* Text Content (Right on desktop) */}
      <div className="space-y-8 lg:order-2">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-500/20 dark:to-violet-500/20 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20"
          >
            <Icon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", delay: 0.2 }}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 text-white text-sm font-bold shadow-lg shadow-purple-500/30"
          >
            Step 4
          </motion.div>
        </div>
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">{step.title}</h3>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
        <div className="space-y-4 pt-2">
          {["Earn certificates", "Track progress", "Showcase skills"].map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-4 group"
            >
              <motion.div
                whileHover={{ scale: 1.2 }}
                className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center shadow-md shadow-purple-500/30"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
              </motion.div>
              <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
