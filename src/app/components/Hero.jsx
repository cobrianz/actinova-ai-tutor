"use client";

import { GraduationCap, ArrowRight, BookOpen, Trophy, FileText, ChevronDown, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

function AnimatedCounter({ target, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const end = target;
    const stepTime = duration / end;
    const timer = setInterval(() => {
      start += Math.ceil(end / (duration / 16));
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [hasStarted, target, duration]);

  const formatted = count.toLocaleString();
  return <span ref={ref}>{formatted}{suffix}</span>;
}

export default function Hero({ handleGetStarted }) {
  const { user } = useAuth();
  const router = useRouter();

  // Interactive States
  const [prompt, setPrompt] = useState("");
  const levels = ["Beginner", "Intermediate", "Advanced"];
  const [levelIdx, setLevelIdx] = useState(0);
  const subjects = ["Any Subject", "Math", "Science", "Coding", "Languages", "History"];
  const [subjectIdx, setSubjectIdx] = useState(0);
  const [isEnhanced, setIsEnhanced] = useState(false);


  const handleCTAClick = (e, forcedFormat = null) => {
    e?.preventDefault();
    const finalPrompt = prompt.trim();
    const selectedFormat = forcedFormat || "course";
    
    let queryParams = `?format=${selectedFormat}`;
    if (finalPrompt) {
      const selectedDifficulty = levels[levelIdx].toLowerCase();
      queryParams += `&topic=${encodeURIComponent(finalPrompt)}&autoRun=true&difficulty=${selectedDifficulty}`;
      if (isEnhanced) queryParams += "&enhanced=true";
    }

    const dashboardUrl = `/dashboard${queryParams}`;

    if (user) {
      router.push(dashboardUrl);
    } else {
      handleGetStarted(dashboardUrl);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden pt-24 md:pt-20 pb-0 bg-[#FAFAF7] dark:bg-slate-950">
      {/* Dotted editorial background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(15,23,42,0.22)_1px,_transparent_1px)] [background-size:20px_20px] opacity-100 dark:hidden" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(255,255,255,0.65),_rgba(255,255,255,0.18))] dark:hidden" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.07)_1px,_transparent_1px)] [background-size:20px_20px] opacity-0 dark:opacity-100 hidden dark:block" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(0,0,0,0.3),_rgba(0,0,0,0.05))] opacity-0 dark:opacity-100 hidden dark:block" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative w-full z-10 flex-1 flex items-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold mb-4 leading-[1.1] tracking-tight text-[#0f172a]"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Master any skill with<br />
            <span className="text-green-500">AI-Powered Intelligence</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-sm md:text-base text-[#0f172a]/75 mb-6 max-w-3xl mx-auto leading-relaxed"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Generate courses, flashcards, quizzes, reports, premium marketplace tracks, AI chat sessions,
            and career tools from one workspace built to help you learn, practice, and move faster.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="max-w-4xl mx-auto mb-8"
          >
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { label: "Create courses from prompts", icon: GraduationCap },
                { label: "Practice with AI quizzes", icon: Trophy },
                { label: "Turn notes into polished reports", icon: FileText },
                { label: "Build flashcards in seconds", icon: Sparkles },
                { label: "Study with structured AI plans", icon: BookOpen },
                { label: "Ship career-ready content faster", icon: FileText },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-xs text-[#0f172a]/80 shadow-[0_6px_20px_rgba(15,23,42,0.05)] backdrop-blur"
                  >
                    <Icon className="w-4 h-4 text-green-600" />
                    <span style={{ fontFamily: "var(--font-fraunces)" }}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Main Prompt Box with Animated Border */}
          <motion.form
            onSubmit={handleCTAClick}
            variants={itemVariants}
            className="relative max-w-2xl mx-auto mb-8 p-[1.5px] rounded-[32px] overflow-hidden"
          >
            {/* Animated Border Gradient - Greenish */}
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,#86efac,#4ade80,#22c55e,#86efac)] animate-spin-slow opacity-80" />
            
            <div className="relative bg-green-50/40 backdrop-blur-2xl rounded-[30.5px] p-2 h-full w-full flex flex-col border-2 border-white">
              <div className="relative p-4 flex-grow">
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCTAClick(e);
                    }
                  }}
                  placeholder="What do you want to learn today?"
                  className="w-full bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-lg text-[#0f172a] placeholder-[#0f172a]/45 resize-none h-20 hide-scrollbar"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                />
              </div>
              
              <div className="flex items-center justify-between p-2 mt-auto">
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <div className="relative">
                    <select
                      value={subjectIdx}
                      onChange={(e) => setSubjectIdx(parseInt(e.target.value))}
                      className="appearance-none flex items-center gap-2 px-4 py-2 pr-10 rounded-full border border-white/60 bg-white/40 hover:bg-white/60 transition-colors text-[13px] font-medium text-[#1a1a1a]/80 outline-none cursor-pointer"
                    >
                      {subjects.map((subject, idx) => (
                        <option key={subject} value={idx}>{subject}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-50" />
                  </div>

                  <div className="relative">
                    <select
                      value={levelIdx}
                      onChange={(e) => setLevelIdx(parseInt(e.target.value))}
                      className="appearance-none flex items-center gap-2 px-4 py-2 pr-10 rounded-full border border-white/60 bg-white/40 hover:bg-white/60 transition-colors text-[13px] font-medium text-[#1a1a1a]/80 outline-none cursor-pointer"
                    >
                      {levels.map((level, idx) => (
                        <option key={level} value={idx}>{level}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-50" />
                  </div>
                </div>
                
                <div className="flex items-center gap-3 ml-auto">
                  <button 
                    type="submit"
                    className={`w-11 h-11 flex items-center justify-center rounded-full transition-all border border-white/20 ${prompt.trim().length > 0 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-[#1a1a1a] hover:bg-black text-white'}`}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.form>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {[
              { label: "Course", sub: "Create a full course from one prompt", icon: BookOpen, format: "course" },
              { label: "Practice Quiz", sub: "Test your knowledge with a quiz", icon: Trophy, format: "quiz" },
              { label: "Flashcards", sub: "Turn any topic into flashcards", icon: Sparkles, format: "flashcards" },
              { label: "Report or Essay", sub: "Draft structured writing with AI", icon: FileText, format: "report" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="bg-green-50/40 backdrop-blur-lg border-2 border-white p-4 rounded-2xl text-left hover:bg-green-50/70 transition-all cursor-pointer group relative overflow-hidden"
                onClick={(e) => handleCTAClick(e, feature.format)}
              >
                {/* Subtle shine effect */}
                <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 group-hover:left-[200%] transition-all duration-1000 ease-out" />
                
                <div className="relative z-10 flex items-start gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-white/80 border border-white flex items-center justify-center group-hover:bg-[#1a1a1a] transition-colors">
                    <feature.icon className="w-5 h-5 text-[#1a1a1a] group-hover:text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold text-[#1a1a1a] leading-tight">{feature.label}</div>
                    <div className="text-[12px] text-[#1a1a1a]/50 font-medium mt-1 leading-snug">{feature.sub}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </motion.div>
      </div>

      {/* Stats Strip - Full Width */}
      <div className="w-full border-t border-black/5 bg-[#F2F1EC] relative z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-6">
              {[
                { value: 840, suffix: "+", label: "Active Students" },
                { value: 120, suffix: "+", label: "Courses Created" },
                { value: 4600, suffix: "+", label: "Quizzes Taken" },
                { value: 32, suffix: "", label: "Countries" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-lg md:text-xl font-bold text-[#0f172a]" style={{ fontFamily: "var(--font-fraunces)" }}>
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                <div className="text-[11px] text-[#0f172a]/50 font-medium mt-0.5" style={{ fontFamily: "var(--font-fraunces)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}
