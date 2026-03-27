"use client";

import { GraduationCap, Play, ArrowRight, BookOpen, Trophy, Star, FileText, ChevronDown, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { data } from "../lib/landingData";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";

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

  // Social Proof Notifications
  const [activeNotifications, setActiveNotifications] = useState([]);
  const socialMessages = useMemo(() => [
    "Grace created a Chinese course",
    "Alex just subscribed to Pro",
    "Sarah generated a Math practice quiz",
    "David created an account",
    "Emma is learning Quantum Physics",
    "Michael shared a History study plan",
    "Chris upgraded to Pro",
    "Jessica created a Spanish course"
  ], []);

  useEffect(() => {
    const addNotification = () => {
      const id = Date.now();
      const side = Math.random() > 0.5 ? "left" : "right";
      // Position them on the far left/right edges to avoid main content
      const pos = {
        top: `${10 + Math.random() * 70}%`,
        [side]: `${1 + Math.random() * 4}%`,
      };
      const msg = socialMessages[Math.floor(Math.random() * socialMessages.length)];
      
      setActiveNotifications(prev => [...prev.slice(-2), { id, msg, pos }]);
      
      setTimeout(() => {
        setActiveNotifications(prev => prev.filter(n => n.id !== id));
      }, 6000);
    };

    // Initial delay then random interval
    const timeout = setTimeout(() => {
      const interval = setInterval(addNotification, 7000);
      addNotification(); // Show first one
      return () => clearInterval(interval);
    }, 1500);

    return () => clearTimeout(timeout);
  }, [socialMessages]);

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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20 bg-transparent">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/hero.png" 
          alt="Hero Background" 
          className="w-full h-full object-cover opacity-60"
        />
        {/* Extremely soft overlay just to ensure base readability */}
        <div className="absolute inset-0 bg-white/10" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative w-full z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50/60 border border-white/60 text-[#1a1a1a] text-[13px] font-medium mb-8 backdrop-blur-md"
          >
            <GraduationCap className="w-4 h-4 text-green-500" />
            <span>Smart AI Study Assistant</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight text-[#1a1a1a]"
          >
            Master any skill with<br />
            <span className="text-green-500">AI-Powered Intelligence</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-base md:text-lg text-[#1a1a1a]/60 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Generate courses, flashcards, quizzes, reports, premium learning tracks, AI chat sessions,
            and career tools from one workspace built to help you learn and grow faster.
          </motion.p>

          {/* Main Prompt Box with Animated Border */}
          <motion.form
            onSubmit={handleCTAClick}
            variants={itemVariants}
            className="relative max-w-2xl mx-auto mb-16 p-[1.5px] rounded-[32px] overflow-hidden"
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
                  className="w-full bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-lg text-[#1a1a1a] placeholder-[#1a1a1a]/40 resize-none h-20 hide-scrollbar"
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
              { label: "Course", sub: "Create a study plan to course", icon: BookOpen, format: "course" },
              { label: "Practice Quiz", sub: "Test your knowledge with a quiz", icon: Trophy, format: "quiz" },
              { label: "Flashcards", sub: "Explain complex topic to flashcards", icon: Sparkles, format: "flashcards" },
              { label: "Report or Essay", sub: "Summarize textbook to report or essay", icon: FileText, format: "report" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="bg-green-50/40 backdrop-blur-lg border-2 border-white p-6 rounded-2xl text-left hover:bg-green-50/70 transition-all cursor-pointer group relative overflow-hidden"
                onClick={(e) => handleCTAClick(e, feature.format)}
              >
                {/* Subtle shine effect */}
                <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 group-hover:left-[200%] transition-all duration-1000 ease-out" />
                
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/80 border border-white flex items-center justify-center mb-4 group-hover:bg-[#1a1a1a] transition-colors">
                    <feature.icon className="w-5 h-5 text-[#1a1a1a] group-hover:text-white" />
                  </div>
                  <div className="text-[14px] font-bold text-[#1a1a1a] mb-1 leading-tight">{feature.label}</div>
                  <div className="text-[12px] text-[#1a1a1a]/50 font-medium">{feature.sub}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Social Proof Notifications */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <AnimatePresence>
          {activeNotifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                position: "absolute",
                ...n.pos,
              }}
              className="bg-white/80 backdrop-blur-md border border-white px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-800 tracking-tight">
                {n.msg}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
