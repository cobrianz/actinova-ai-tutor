"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  ChevronDown,
  Clock,
  Target,
  Sparkles,
  ArrowRight,
  BookOpen,
  Check,
  X,
  Library,
  Briefcase,
  TrendingUp,
  Award,
  Wrench,
  Heart,
  Rocket,
  GraduationCap,
  FlaskConical,
  Zap,
  Lightbulb,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import { apiClient } from "@/lib/csrfClient";
import ActirovaLoader from "./ActirovaLoader";
import { motion, AnimatePresence } from "framer-motion";
import { getAdaptiveActionContext } from "@/lib/adaptiveActions";

const GOALS = [
  { value: "career-change", label: "Career Change", Icon: Briefcase },
  { value: "skill-upgrade", label: "Skill Upgrade", Icon: TrendingUp },
  { value: "certification", label: "Certification", Icon: Award },
  { value: "personal-project", label: "Project", Icon: Wrench },
  { value: "hobby", label: "Hobby", Icon: Heart },
  { value: "startup", label: "Startup", Icon: Rocket },
  { value: "teaching", label: "Teaching", Icon: GraduationCap },
  { value: "research", label: "Research", Icon: FlaskConical },
];

const DURATIONS = [
  { value: 2, label: "2w", sub: "Intensive" },
  { value: 4, label: "4w", sub: "Standard" },
  { value: 8, label: "8w", sub: "Comprehensive" },
  { value: 12, label: "12w", sub: "Deep Dive" },
];

const DIFFICULTY_COLORS = {
  beginner: "from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  intermediate: "from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  advanced: "from-purple-500/20 to-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/30",
};

export default function StudyPlanGenerator({ onGenerated, setActiveContent }) {
  const { user, loading, refreshToken, hasPurchased } = useAuth();
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("skill-upgrade");
  const [weeks, setWeeks] = useState(4);
  const [difficulty, setDifficulty] = useState(user?.skillLevel || "beginner");
  const [isGenerating, setIsGenerating] = useState(false);
  const [usageData, setUsageData] = useState(null);
  const [libraryCourses, setLibraryCourses] = useState([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showCoursePicker, setShowCoursePicker] = useState(false);
  const [adaptiveContext, setAdaptiveContext] = useState(null);

  useEffect(() => {
    if (user?.skillLevel) setDifficulty(user.skillLevel);
  }, [user]);

  useEffect(() => {
    async function fetchUsage() {
      if (!user || loading) return;
      try {
        const res = await apiClient.get("/api/user/usage");
        if (res.ok) setUsageData(await res.json());
      } catch (err) { /* silent */ }
    }
    if (user && !loading) fetchUsage();
  }, [user, loading]);

  useEffect(() => {
    async function fetchAdaptiveContext() {
      try {
        const res = await apiClient.get("/api/analytics/overview");
        if (!res.ok) return;
        const data = await res.json();
        setAdaptiveContext(getAdaptiveActionContext({
          adaptiveInsights: data.adaptiveInsights,
          quizTrends: data.quizTrends || [],
          courseProgress: data.courseProgress || [],
        }));
      } catch (err) {
        console.debug("Adaptive context unavailable", err);
      }
    }
    fetchAdaptiveContext();
  }, []);

  const fetchLibraryCourses = async () => {
    if (libraryCourses.length > 0) return;
    setLoadingCourses(true);
    try {
      const res = await apiClient.get("/api/library?type=course&limit=50");
      if (res.ok) {
        const data = await res.json();
        setLibraryCourses(data.items || []);
      }
    } catch (err) {
      console.debug("Failed to fetch library courses");
    } finally {
      setLoadingCourses(false);
    }
  };

  const toggleCoursePicker = () => {
    if (!showCoursePicker) fetchLibraryCourses();
    setShowCoursePicker(!showCoursePicker);
  };

  const toggleCourse = (courseId) => {
    setSelectedCourseIds((prev) => {
      if (prev.includes(courseId)) return prev.filter((id) => id !== courseId);
      if (prev.length >= 5) {
        toast.error("Maximum 5 courses can be selected");
        return prev;
      }
      return [...prev, courseId];
    });
  };

  const studyPlanLimit = usageData?.details?.studyPlans || null;
  const atLimit = studyPlanLimit && studyPlanLimit.limit !== -1 && studyPlanLimit.limit <= 0;

  const handleGenerate = async () => {
    const topicOrCourse = topic.trim() || (selectedCourses.length > 0 ? selectedCourses.map((c) => c.topic || c.title).join(", ") : "");
    if (!topicOrCourse) { toast.error("Enter a topic or select a course to get started"); return; }
    if (topic.trim().length < 2) { toast.error("Topic should be at least 2 characters long"); return; }
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const response = await apiClient.post("/api/study-plan", {
        topic: topicOrCourse,
        goal,
        weeks,
        difficulty,
        selectedCourseIds,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          toast.error(errorData.message || "You need more credits to generate a study plan.");
          setIsGenerating(false);
          return;
        }
        throw new Error(errorData.error || "Failed to generate study plan");
      }

      const data = await response.json();
      if (typeof window !== "undefined") window.dispatchEvent(new Event("usageUpdated"));
      toast.success("Study plan generated successfully!");
      if (onGenerated) onGenerated(data.plan, data.studyPlanId);
    } catch (error) {
      toast.error(error.message || "Failed to generate study plan");
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedCourses = libraryCourses.filter((c) => selectedCourseIds.includes(c.id));
  const hasSelectedCourses = selectedCourseIds.length > 0;

  return (
    <div className="relative">
      {isGenerating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <ActirovaLoader text="study plan" />
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Premium Header */}
        <div className="relative text-center mb-10 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-green-500/8 via-emerald-500/5 to-transparent rounded-full blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold mb-5 backdrop-blur-sm"
          >
            <div className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CalendarCheck className="w-3.5 h-3.5" />
            </div>
            AI Study Planner
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Create Your Study Plan
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-sm md:text-base max-w-md mx-auto leading-relaxed"
          >
            Get a personalized weekly schedule tailored to your goals, pace, and existing courses
          </motion.p>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap items-center justify-center gap-2 mt-4"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/5 border border-green-500/15 text-[11px] text-green-600 dark:text-green-400">
              <Zap className="w-3 h-3" />
              AI-powered plans
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/15 text-[11px] text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-3 h-3" />
              Build around courses
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/5 border border-purple-500/15 text-[11px] text-purple-600 dark:text-purple-400">
              <Target className="w-3 h-3" />
              Personalized pace
            </span>
          </motion.div>
        </div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative p-[1px] rounded-3xl overflow-hidden mb-8"
        >
          {/* Animated border */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 via-emerald-500/20 to-green-500/10 opacity-60" />

          <div className="relative bg-card/95 backdrop-blur-xl rounded-[22px] p-6 md:p-8 space-y-7">
            {/* Topic Input */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <div className="w-6 h-6 rounded-md bg-green-500/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-green-500" />
                </div>
                What do you want to learn?
                {!hasSelectedCourses && <span className="text-[10px] font-normal text-muted-foreground ml-1">(required)</span>}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={hasSelectedCourses ? "Optional — topic auto-fills from selected courses" : "e.g., Machine Learning, Web Development, Spanish..."}
                className="w-full px-5 py-3.5 rounded-2xl border border-border/60 bg-background/80 text-foreground placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/40 transition-all text-[15px]"
                onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
                autoFocus
              />
              {adaptiveContext?.weakTopic && !topic.trim() && (
                <p className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400">
                  Suggested focus: {adaptiveContext.weakTopic}
                </p>
              )}
              {hasSelectedCourses && !topic.trim() && (
                <p className="text-[11px] text-green-600 dark:text-green-400 mt-2 flex items-center gap-1.5">
                  <Check className="w-3 h-3" />
                  Plan will be built around: {selectedCourses.map((c) => c.topic || c.title).join(", ")}
                </p>
              )}
              {!hasSelectedCourses && !topic.trim() && (
                <p className="text-[10px] text-muted-foreground/60 mt-2 flex items-center gap-1.5">
                  <Lightbulb className="w-3 h-3" />
                  Tip: Be specific for better results. Try "Python for data analysis" instead of just "Python"
                </p>
              )}
            </div>

            {/* Goal Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <div className="w-6 h-6 rounded-md bg-green-500/10 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5 text-green-500" />
                </div>
                Learning Goal
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    className={`group relative px-3 py-2.5 rounded-xl text-xs font-medium transition-all border overflow-hidden ${
                      goal === g.value
                        ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400 shadow-sm shadow-green-500/10"
                        : "bg-background/50 border-border/50 text-muted-foreground hover:border-green-500/20 hover:text-foreground"
                    }`}
                  >
                    {goal === g.value && (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
                    )}
                    <span className="relative flex items-center justify-center gap-1.5"><g.Icon className="w-3.5 h-3.5" />{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <div className="w-6 h-6 rounded-md bg-green-500/10 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-green-500" />
                </div>
                Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setWeeks(d.value)}
                    className={`relative px-3 py-3.5 rounded-xl text-center transition-all border overflow-hidden ${
                      weeks === d.value
                        ? "bg-green-500/10 border-green-500/30 shadow-sm shadow-green-500/10"
                        : "bg-background/50 border-border/50 hover:border-green-500/20"
                    }`}
                  >
                    {weeks === d.value && (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
                    )}
                    <div className={`relative text-sm font-bold ${weeks === d.value ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
                      {d.label}
                    </div>
                    <div className="relative text-[10px] text-muted-foreground mt-0.5">{d.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <div className="w-6 h-6 rounded-md bg-green-500/10 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-green-500">L</span>
                </div>
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["beginner", "intermediate", "advanced"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`relative px-4 py-3 rounded-xl text-center transition-all border font-medium text-sm capitalize overflow-hidden ${
                      difficulty === d
                        ? `bg-gradient-to-b ${DIFFICULTY_COLORS[d]} border shadow-sm`
                        : "bg-background/50 border-border/50 text-muted-foreground hover:border-green-500/20"
                    }`}
                  >
                    {difficulty === d && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Course Picker */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <div className="w-6 h-6 rounded-md bg-green-500/10 flex items-center justify-center">
                  <Library className="w-3.5 h-3.5 text-green-500" />
                </div>
                Build Around Existing Courses
                <span className="text-[10px] font-normal text-muted-foreground ml-1">(optional)</span>
              </label>

              {/* Selected courses chips */}
              <AnimatePresence>
                {selectedCourseIds.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-3 overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-2">
                      {selectedCourses.map((course) => (
                        <motion.span
                          key={course.id}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium"
                        >
                          <BookOpen className="w-3 h-3" />
                          {course.title}
                          <button
                            onClick={() => toggleCourse(course.id)}
                            className="ml-0.5 p-0.5 rounded-full hover:bg-green-500/20 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={toggleCoursePicker}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all text-sm ${
                  showCoursePicker
                    ? "bg-green-500/5 border-green-500/30 text-green-600 dark:text-green-400"
                    : "bg-background/50 border-border/50 text-muted-foreground hover:border-green-500/20"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Library className="w-4 h-4" />
                  {selectedCourseIds.length > 0
                    ? `${selectedCourseIds.length} course${selectedCourseIds.length > 1 ? "s" : ""} selected`
                    : "Select courses from your library"}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showCoursePicker ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showCoursePicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 max-h-64 overflow-y-auto rounded-2xl border border-border/50 bg-background/50 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
                      {loadingCourses ? (
                        <div className="p-4 space-y-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                              <div className="w-8 h-8 rounded-lg bg-muted" />
                              <div className="flex-1">
                                <div className="h-3 bg-muted rounded w-2/3 mb-1" />
                                <div className="h-2 bg-muted rounded w-1/3" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : libraryCourses.length === 0 ? (
                        <div className="p-6 text-center">
                          <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">No courses in your library yet</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">Generate a course first, then build a study plan around it</p>
                        </div>
                      ) : (
                        <div className="p-1.5">
                          {libraryCourses.map((course) => {
                            const isSelected = selectedCourseIds.includes(course.id);
                            return (
                              <button
                                key={course.id}
                                onClick={() => toggleCourse(course.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                                  isSelected
                                    ? "bg-green-500/10 border border-green-500/20"
                                    : "hover:bg-accent/50 border border-transparent"
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                  isSelected ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground"
                                }`}>
                                  {isSelected ? <Check className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-foreground truncate">{course.title}</div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-muted-foreground capitalize">{course.difficulty || "beginner"}</span>
                                    {course.modules > 0 && (
                                      <span className="text-[10px] text-muted-foreground">{course.modules} modules</span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-2 px-1">
                      Select up to 5 courses. The AI will build your study plan around their content and structure.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Generate Button */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-green-500" />
                <span>
                  <strong className="text-foreground">25 credits</strong> per plan
                </span>
              </div>
              <button
                onClick={handleGenerate}
                disabled={(!topic.trim() && !hasSelectedCourses) || isGenerating}
                className={`relative flex items-center gap-2.5 px-7 py-3 rounded-2xl font-semibold text-sm transition-all overflow-hidden ${
                  (topic.trim() || hasSelectedCourses) && !isGenerating
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {(topic.trim() || hasSelectedCourses) && !isGenerating && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] hover:translate-x-[200%] transition-transform duration-700" />
                )}
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="relative">Generating...</span>
                  </>
                ) : (
                  <>
                    <span className="relative">Generate Plan</span>
                    <ArrowRight className="w-4 h-4 relative" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
