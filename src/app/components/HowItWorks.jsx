"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  User,
  Sparkles,
  BookOpen,
  Brain,
  Trophy,
  Rocket,
  Check,
  Play,
  Star,
  Zap,
  Target,
  Award,
  TrendingUp,
  Clock,
  Shield,
  ChevronRight,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    title: "Create Your Profile",
    description:
      "Set up your personalized learning profile with your goals, interests, and current skill level.",
    icon: User,
    color: "from-violet-500 to-purple-600",
    lightColor: "from-violet-100 to-purple-100",
    accentColor: "violet",
  },
  {
    number: "02",
    title: "AI Learning Path",
    description:
      "Our AI analyzes your profile and creates a customized curriculum tailored to your needs.",
    icon: Sparkles,
    color: "from-blue-500 to-cyan-500",
    lightColor: "from-blue-100 to-cyan-100",
    accentColor: "blue",
  },
  {
    number: "03",
    title: "Interactive Lessons",
    description:
      "Engage with bite-sized lessons featuring videos, quizzes, and hands-on exercises.",
    icon: BookOpen,
    color: "from-indigo-500 to-violet-500",
    lightColor: "from-indigo-100 to-violet-100",
    accentColor: "indigo",
  },
  {
    number: "04",
    title: "Practice & Apply",
    description:
      "Reinforce your learning with real-world projects and AI-powered coding challenges.",
    icon: Brain,
    color: "from-purple-500 to-pink-500",
    lightColor: "from-purple-100 to-pink-100",
    accentColor: "purple",
  },
  {
    number: "05",
    title: "Track Progress",
    description:
      "Monitor your growth with detailed analytics, streaks, and milestone achievements.",
    icon: TrendingUp,
    color: "from-cyan-500 to-blue-500",
    lightColor: "from-cyan-100 to-blue-100",
    accentColor: "cyan",
  },
  {
    number: "06",
    title: "Earn Certificates",
    description:
      "Complete courses and earn industry-recognized certificates to showcase your skills.",
    icon: Trophy,
    color: "from-amber-500 to-orange-500",
    lightColor: "from-amber-100 to-orange-100",
    accentColor: "amber",
  },
];

function BrowserWindow({ children, url, tiltDirection = "left", delay = 0 }) {
  const tiltClass =
    tiltDirection === "left" ? "rotate-[-2deg]" : "rotate-[2deg]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 10 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.02, rotate: 0 }}
      className={`perspective-1000 ${tiltClass} transition-transform duration-500`}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-slate-200/50 dark:border-primary/10">
        {/* Browser Chrome */}
        <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 px-4 py-3 flex items-center gap-3 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex gap-2">
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-sm shadow-[#FF5F56]/30"
            />
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-sm shadow-[#FFBD2E]/30"
            />
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="w-3 h-3 rounded-full bg-[#27C93F] shadow-sm shadow-[#27C93F]/30"
            />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-lg px-4 py-1.5 flex items-center gap-2 text-sm text-muted-foreground w-full max-w-md shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <Shield className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
              <span className="truncate text-xs font-medium">{url}</span>
            </div>
          </div>
          <div className="w-16" />
        </div>
        {/* Content */}
        <div className="bg-white dark:bg-slate-900/50 p-6">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

function ProfileMockup() {
  const [selectedSkills, setSelectedSkills] = useState(["React", "TypeScript"]);
  const skills = [
    "React",
    "TypeScript",
    "Node.js",
    "Python",
    "AI/ML",
    "Design",
  ];

  return (
    <BrowserWindow url="actirova.com/onboarding" tiltDirection="left">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
            className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30"
          >
            <User className="w-10 h-10 text-white" />
          </motion.div>
          <h3 className="font-heading text-xl font-semibold text-foreground">
            Welcome to Actirova
          </h3>
          <p className="text-sm text-muted-foreground">
            {"Let's"} personalize your learning journey
          </p>
        </div>

        {/* Skills Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Select your interests
          </label>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, i) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <motion.button
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setSelectedSkills((prev) =>
                      isSelected
                        ? prev.filter((s) => s !== skill)
                        : [...prev, skill]
                    )
                  }
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border-2 ${isSelected
                    ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white border-transparent shadow-md shadow-violet-500/30"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-800"
                    }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 inline mr-1" />}
                  {skill}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Experience Level */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Experience Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["Beginner", "Intermediate", "Advanced"].map((level, i) => (
              <motion.div
                key={level}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                whileHover={{ y: -2 }}
                className={`p-3 rounded-xl text-center cursor-pointer transition-all duration-300 border-2 ${i === 1
                  ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white border-transparent shadow-lg shadow-violet-500/30"
                  : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-800 text-slate-600 dark:text-slate-400"
                  }`}
              >
                <span className="text-sm font-medium">{level}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30">
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </BrowserWindow>
  );
}

function LearningPathMockup() {
  const modules = [
    { title: "Fundamentals", progress: 100, status: "complete" },
    { title: "Components", progress: 100, status: "complete" },
    { title: "State Management", progress: 65, status: "current" },
    { title: "API Integration", progress: 0, status: "locked" },
    { title: "Advanced Patterns", progress: 0, status: "locked" },
  ];

  return (
    <BrowserWindow
      url="actirova.com/learning-path"
      tiltDirection="right"
      delay={0.1}
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">
              React Mastery
            </h3>
            <p className="text-sm text-muted-foreground">
              Your personalized curriculum
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-white text-sm font-medium shadow-md shadow-blue-500/30">
            <Sparkles className="w-4 h-4" />
            AI Generated
          </div>
        </div>

        {/* Progress Overview */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Overall Progress
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              45%
            </span>
          </div>
          <div className="h-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "45%" }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </motion.div>
          </div>
        </div>

        {/* Module List */}
        <div className="space-y-3">
          {modules.map((module, i) => (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ x: 4 }}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${module.status === "current"
                ? "bg-blue-50/50 dark:bg-blue-500/20 border-2 border-blue-500/30"
                : module.status === "locked"
                  ? "bg-slate-50 dark:bg-slate-800/50 opacity-60"
                  : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm"
                }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${module.status === "complete"
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/30"
                  : module.status === "current"
                    ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/30"
                    : "bg-muted text-muted-foreground"
                  }`}
              >
                {module.status === "complete" ? (
                  <Check className="w-5 h-5" />
                ) : module.status === "locked" ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">
                  {module.title}
                </p>
                {module.status !== "locked" && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${module.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                        className={`h-full rounded-full ${module.status === "complete"
                          ? "bg-emerald-500"
                          : "bg-gradient-to-r from-blue-500 to-cyan-500"
                          }`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {module.progress}%
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </BrowserWindow>
  );
}

function LessonMockup() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <BrowserWindow
      url="actirova.com/lesson/react-hooks"
      tiltDirection="left"
      delay={0.2}
    >
      <div className="space-y-5">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="relative aspect-video rounded-xl bg-slate-100 dark:bg-indigo-950 overflow-hidden shadow-lg border border-slate-200 dark:border-indigo-900"
        >
          {/* Mock visual for video */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/50 dark:to-purple-900/50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/30"
            >
              {isPlaying ? (
                <div className="flex gap-1">
                  <div className="w-1.5 h-6 bg-white rounded-full" />
                  <div className="w-1.5 h-6 bg-white rounded-full" />
                </div>
              ) : (
                <Play className="w-7 h-7 ml-1" fill="white" />
              )}
            </motion.button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "30%" }}
                animate={isPlaying ? { width: "60%" } : { width: "30%" }}
                transition={{ duration: 3 }}
                className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full"
              />
            </div>
          </div>
          {/* Floating elements */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-4 right-4 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium border border-white/30"
          >
            12:34
          </motion.div>
        </motion.div>

        {/* Lesson Info */}
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            Understanding React Hooks
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Learn how to use useState and useEffect effectively
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20"
          >
            <BookOpen className="w-4 h-4" />
            Take Notes
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, border: '1px solid currentColor' }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 rounded-xl font-bold transition-all shadow-sm"
          >
            <Brain className="w-4 h-4" />
            Ask AI
          </motion.button>
        </div>
      </div>
    </BrowserWindow>
  );
}

function PracticeMockup() {
  const [selectedAnswer, setSelectedAnswer] = useState(1);

  return (
    <BrowserWindow
      url="actirova.com/practice/challenge-42"
      tiltDirection="right"
      delay={0.3}
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/30">
              <Brain className="w-4 h-4" />
            </div>
            <span className="font-medium text-foreground">Coding Challenge</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>5:00</span>
          </div>
        </div>

        {/* Question */}
        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800/40">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
            What is the correct way to update state based on the previous state
            in React?
          </p>
        </div>

        {/* Answer Options */}
        <div className="space-y-2">
          {[
            "setState(newValue)",
            "setState(prev => prev + 1)",
            "this.state = newValue",
            "state.update(newValue)",
          ].map((answer, i) => (
            <motion.button
              key={i}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedAnswer(i)}
              className={`w-full p-4 rounded-xl text-left flex items-center gap-3 transition-all duration-300 ${selectedAnswer === i
                ? "bg-purple-100/50 dark:bg-purple-500/20 border-2 border-purple-500/50"
                : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-100 dark:border-slate-700 shadow-sm"
                }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${selectedAnswer === i
                  ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                  : "bg-muted text-muted-foreground"
                  }`}
              >
                {String.fromCharCode(65 + i)}
              </div>
              <code className="text-sm text-foreground">{answer}</code>
              {selectedAnswer === i && i === 1 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto"
                >
                  <Check className="w-5 h-5 text-emerald-500" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Submit Button */}
        <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30">
          Submit Answer
        </Button>
      </div>
    </BrowserWindow>
  );
}

function ProgressMockup() {
  const stats = [
    { label: "Day Streak", value: "12", icon: Zap, color: "text-amber-500" },
    { label: "XP Earned", value: "2,450", icon: Star, color: "text-purple-500" },
    { label: "Lessons", value: "28", icon: BookOpen, color: "text-blue-500" },
    { label: "Rank", value: "#42", icon: Trophy, color: "text-emerald-500" },
  ];

  return (
    <BrowserWindow
      url="actirova.com/dashboard"
      tiltDirection="left"
      delay={0.4}
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">
              Your Progress
            </h3>
            <p className="text-sm text-muted-foreground">Keep up the momentum!</p>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <Star
                  className={`w-5 h-5 ${i < 4 ? "text-amber-400 fill-amber-400" : "text-slate-300"}`}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ y: -2, border: '1px solid #e2e8f0' }}
              className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm"
            >
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Weekly Activity */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border border-cyan-200/50 dark:border-cyan-800/50">
          <p className="text-sm font-medium text-foreground mb-3">This Week</p>
          <div className="flex items-end justify-between gap-2 h-20">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
              const heights = [60, 80, 45, 90, 70, 30, 0];
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: `${heights[i]}%` }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                    className={`w-full rounded-t-md ${i === 6
                      ? "bg-slate-200 dark:bg-slate-700"
                      : "bg-gradient-to-t from-cyan-500 to-blue-500"
                      }`}
                  />
                  <span className="text-[10px] text-muted-foreground">{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </BrowserWindow>
  );
}

function CertificateMockup() {
  return (
    <BrowserWindow
      url="actirova.com/certificates"
      tiltDirection="right"
      delay={0.5}
    >
      <div className="space-y-5">
        {/* Certificate Card */}
        <motion.div
          whileHover={{ scale: 1.02, rotateY: 5 }}
          className="relative p-6 rounded-2xl bg-gradient-to-br from-amber-50/50 via-white to-orange-50/50 dark:from-amber-950/20 dark:via-slate-900 dark:to-orange-950/20 border-2 border-amber-200/50 dark:border-amber-800/40 overflow-hidden shadow-lg shadow-amber-500/5"
        >
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)`,
              backgroundSize: '10px 10px'
            }} />
          </div>

          <div className="relative text-center space-y-4">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30"
            >
              <Award className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider">
                Certificate of Completion
              </p>
              <h3 className="font-heading text-xl font-bold text-foreground mt-1">
                React Developer
              </h3>
            </div>
            <div className="pt-2 border-t border-amber-200 dark:border-amber-800">
              <p className="text-sm text-muted-foreground">Awarded to</p>
              <p className="font-semibold text-foreground">John Doe</p>
            </div>
          </div>
        </motion.div>

        {/* Achievement Badges */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            Earned Badges
          </p>
          <div className="flex gap-3 flex-wrap">
            {[
              { icon: Zap, color: "from-amber-400 to-orange-500", label: "Fast Learner" },
              { icon: Target, color: "from-emerald-400 to-teal-500", label: "Sharpshooter" },
              { icon: Rocket, color: "from-purple-400 to-pink-500", label: "Trailblazer" },
            ].map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1, type: "spring" }}
                whileHover={{ y: -4, scale: 1.05 }}
                className="flex flex-col items-center gap-2"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-white shadow-lg`}>
                  <badge.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {badge.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Share Button */}
        <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-amber-500/30">
          <Rocket className="w-4 h-4 mr-2" />
          Share Achievement
        </Button>
      </div>
    </BrowserWindow>
  );
}

const mockups = [
  ProfileMockup,
  LearningPathMockup,
  LessonMockup,
  PracticeMockup,
  ProgressMockup,
  CertificateMockup,
];

export default function HowItWorks() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={containerRef}
      className="relative py-24 md:py-32 overflow-hidden bg-white dark:bg-transparent"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-violet-500/5 to-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-24"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Simple 6-Step Process
          </motion.div>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            How{" "}
            <span className="text-gradient">Actirova</span>{" "}
            Works
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your journey from beginner to expert, powered by AI and designed for
            real results.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-24 md:space-y-32">
          {steps.map((step, index) => {
            const MockupComponent = mockups[index];
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12 lg:gap-16`}
              >
                {/* Content */}
                <div className="flex-1 w-full lg:w-auto">
                  <motion.div
                    initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="max-w-lg mx-auto lg:mx-0"
                  >
                    {/* Step Number */}
                    <div className="flex items-center gap-4 mb-6">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg`}
                      >
                        <step.icon className="w-7 h-7" />
                      </motion.div>
                      <span className="text-5xl font-bold text-muted-foreground/20">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
                      {step.title}
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                      {step.description}
                    </p>

                    <motion.div
                      whileHover={{ x: 4 }}
                      className="inline-flex items-center gap-2 text-primary font-medium cursor-pointer group"
                    >
                      Learn more
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </motion.div>
                  </motion.div>
                </div>

                {/* Mockup */}
                <div className="flex-1 w-full lg:w-auto perspective-1000">
                  <MockupComponent />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-24 md:mt-32 text-center"
        >
          <div className="glass rounded-3xl p-8 md:p-12 max-w-3xl mx-auto">
            <h3 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to Start Learning?
            </h3>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of learners who have transformed their careers with
              Actirova.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30 px-8"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Get Started Free
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" variant="outline" className="bg-transparent px-8">
                  Watch Demo
                  <Play className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
