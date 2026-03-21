"use client";

import React, { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Sparkles,
  BookOpen,
  FileText,
  ChevronDown,
  Lightbulb,
  AlertTriangle,
  ScrollText,
  HelpCircle,
  Lock,
  GraduationCap,
  ArrowRight,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import ActirovaLoader from "./ActirovaLoader";
import QuizInterface from "./QuizInterface";
import { apiClient } from "@/lib/csrfClient";
import { motion } from "framer-motion";

export default function Generate({ setActiveContent }) {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic") || "";

  const [topic, setTopic] = useState(initialTopic);
  const [localTopic, setLocalTopic] = useState(initialTopic);
  const [format, setFormat] = useState(searchParams.get("format") || "course");
  const [difficulty, setDifficulty] = useState("beginner");
  const [questionsCount, setQuestionsCount] = useState(10);
  const [reportType, setReportType] = useState("report");
  const [reportLength, setReportLength] = useState("medium");
  const [citationStyle, setCitationStyle] = useState("APA");
  const [showLoader, setShowLoader] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usageData, setUsageData] = useState(null);
  const router = useRouter();
  const { user, loading, refreshToken, isPro } = useAuth();

  // Sync state with URL params for reactivity
  React.useEffect(() => {
    const t = searchParams.get("topic");
    const f = searchParams.get("format");
    if (t) {
      setTopic(t);
      setLocalTopic(t);
    }
    if (f) setFormat(f);
  }, [searchParams]);

  // Fetch live usage data from the server
  const fetchUsage = React.useCallback(async () => {
    if (!user || loading) return;
    try {
      const res = await apiClient.get("/api/user/usage");
      if (res.ok) {
        const data = await res.json();
        setUsageData(data);
      }
    } catch (err) {
      // Silent error for usage fetch to avoid log noise on stale sessions
      console.debug("Usage fetch skipped or failed due to session state");
    }
  }, [user, loading]);

  // Fetch usage on mount and when user changes
  React.useEffect(() => {
    if (user && !loading) {
      fetchUsage();
    }
  }, [user, loading, fetchUsage]);

  // Refresh usage after usageUpdated event
  React.useEffect(() => {
    const onUpdate = () => fetchUsage();
    if (typeof window !== "undefined") {
      window.addEventListener("usageUpdated", onUpdate);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("usageUpdated", onUpdate);
      }
    };
  }, [fetchUsage]);

  // Ensure overlay loader is cleared when component unmounts
  React.useEffect(() => {
    return () => {
      if (showLoader) {

        try {
          setShowLoader(false);
        } catch (e) {
          console.warn("Failed to clear showLoader during cleanup", e);
        }
      }
    };
  }, []);

  // Hide overlay when route changes (user navigated away)
  const pathname = usePathname();
  React.useEffect(() => {
    setShowLoader(false);
  }, [pathname]);

  // Listen for global 'loading-done' event from LearnContent and other components
  React.useEffect(() => {
    const onDone = () => {
      if (showLoader) {

        setShowLoader(false);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("actirova:loading-done", onDone);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("actirova:loading-done", onDone);
      }
    };
  }, [showLoader]);

  // Strict check for Premium access (Pro or Enterprise)
  // Check tier (set by billing) and ensure status is active.
  const isPremium = isPro || !!user?.isPremium;

  // Per-format limit checks from live usage data
  const formatLimit = (formatKey) => {
    if (!usageData || !usageData.details) return { used: 0, limit: Infinity, atLimit: false };
    const detail = usageData.details[formatKey];
    if (!detail) return { used: 0, limit: Infinity, atLimit: false };
    const atLimit = detail.limit !== -1 && detail.limit !== null && detail.limit !== Infinity && detail.used >= detail.limit;
    return { used: detail.used, limit: detail.limit, atLimit };
  };

  const courseLimitInfo = formatLimit("courses");
  const flashcardsLimitInfo = formatLimit("flashcards");
  const quizzesLimitInfo = formatLimit("quizzes");
  const reportsLimitInfo = formatLimit("reports");

  const currentFormatAtLimit = () => {
    if (format === "course") return courseLimitInfo.atLimit;
    if (format === "flashcards") return flashcardsLimitInfo.atLimit;
    if (format === "quiz") return quizzesLimitInfo.atLimit;
    if (format === "report") return reportsLimitInfo.atLimit;
    return false;
  };

  const atLimit = currentFormatAtLimit();

  const friendlyName =
    !loading && user ? user.firstName || user.name || "" : "";

  // Auto-run generation if requested via URL
  const hasAutoRunRef = React.useRef(false);
  React.useEffect(() => {
    const autoRun = searchParams.get("autoRun") === "true";
    if (autoRun && topic && !isSubmitting && user && !loading && !hasAutoRunRef.current) {
      hasAutoRunRef.current = true;
      // Small delay to ensure all state is settled
      const timer = setTimeout(() => {
         handleGenerate();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchParams, topic, user, loading]);

  const handleGenerate = async (retryCount = 0) => {
    if (!topic.trim()) return;
    if (isSubmitting) return; // prevent double submissions

    // Per-format limit enforcement before generating
    if (currentFormatAtLimit()) {
      const formatLabel = format === "course" ? "course" : format === "flashcards" ? "flashcard set" : format === "quiz" ? "quiz" : "report";
      toast.error(
        isPremium
          ? `You have reached your monthly ${formatLabel} limit. It resets at the start of next month.`
          : `You've reached your free ${formatLabel} limit — upgrade to Pro for more.`
      );
      return;
    }

    setIsSubmitting(true);
    const subject = topic.trim();

    // Local cache key for previously generated courses
    const cacheKey = `generated_${subject}_${format}_${difficulty}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        // Route immediately to existing course
        router.push(
          `/learn/${encodeURIComponent(subject)}?format=${format}&difficulty=${difficulty}`
        );
        return;
      }
    } catch { }

    // Handle flashcard generation directly
    if (format === "flashcards") {

      setShowLoader(true);
      setIsSubmitting(true);

      try {
        const response = await apiClient.post("/api/generate-flashcards", {
          topic: subject,
          difficulty,
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 429) {
            toast.error("Monthly limit reached. Upgrade to Pro for more!");
            return;
          }
          throw new Error(errorData.error || "Failed to generate flashcards");
        }

        const data = await response.json();

        // Notify usage update
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("usageUpdated"));
        }

        toast.success("Flashcards generated successfully!");

        // Redirect to flashcards tab
        setActiveContent("flashcards");

      } catch (error) {
        console.error("Flashcard generation failed:", error);
        if (error.message?.includes("limit") || error.message?.includes("429")) {
          toast.error(isPremium ? "Monthly flashcard limit reached." : "Free flashcard limit reached. Upgrade to Pro for more!");
          setShowLoader(false);
          setIsSubmitting(false);
          fetchUsage(); // refresh usage display
          return;
        }
        toast.error(error.message || "Failed to generate flashcards");
        setShowLoader(false);
        setIsSubmitting(false);
      } finally {
        // Double check for cleanup
        setTimeout(() => {
          setShowLoader(false);
          setIsSubmitting(false);
        }, 500);
      }
      return;
    }

    // Handle quiz/test generation directly
    if (format === "quiz") {
      // For quiz, also show loader for consistency

      setShowLoader(true);

      try {
        // Generate quiz directly via API
        const response = await apiClient.post("/api/generate-course", {
          topic: subject,
          difficulty,
          format: "quiz",
          questions: questionsCount,
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 429) {
            toast.error("Monthly limit reached. Upgrade to Pro for more!");
            return;
          }
          throw new Error(errorData.error || "Failed to generate quiz");
        }

        const data = await response.json();

        // Success - show the quiz directly
        setGeneratedQuiz({
          _id: data.quizId,
          ...data.content,
        });
        toast.success("Quiz generated successfully!");

        // Update usage counter
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("usageUpdated"));
        }

        // Reset form
        setTopic("");
        setLocalTopic("");
      } catch (error) {
        console.error("Quiz generation failed:", error);
        toast.error(error.message || "Failed to generate quiz");
      } finally {

        setShowLoader(false);
        setIsSubmitting(false);
      }
      return;
    }

    // Handle report generation directly
    if (format === "report") {
      if (!isPremium) {
        toast.error("Report generation is a Pro feature. Please upgrade to continue.");
        router.push("/pricing");
        return;
      }
      setShowLoader(true);
      setIsSubmitting(true);

      try {
        const response = await apiClient.post("/api/generate-report-outline", {
          topic: subject,
          type: reportType,
          length: reportLength,
          difficulty: difficulty,
          citationStyle: citationStyle
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 429) {
            toast.error(
              `Monthly report limit reached (${errorData.used || 0}/${errorData.limit || 1}). Upgrade to Pro for more reports.`,
              { duration: 6000 }
            );
            setShowLoader(false);
            setIsSubmitting(false);
            return;
          }
          throw new Error(errorData.error || "Failed to generate report outline");
        }

        const data = await response.json();

        // Notify usage update
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("usageUpdated"));
        }

        toast.success("Report outline generated!");

        // Redirect to report editor with the new report ID
        if (data.reportId) {
          router.push(`/reports/${data.reportId}`);
        }

      } catch (error) {
        console.error("Report generation failed:", error);
        toast.error(error.message || "Failed to generate report");
        setShowLoader(false);
        setIsSubmitting(false);
      } finally {
        setTimeout(() => {
          setShowLoader(false);
          setIsSubmitting(false);
        }, 500);
      }
      return;
    }

    // Navigate to learn page where generation will happen
    // Loader will stay visible during navigation and be cleared by LearnContent
    setShowLoader(true);
    router.push(
      `/learn/${encodeURIComponent(subject)}?format=${format}&difficulty=${difficulty}`
    );

    // Safety fallback to clear loader after 5 seconds if navigation fails or hangs
    setTimeout(() => {
      setShowLoader(false);
      setIsSubmitting(false);
    }, 5000);
  };

  // Keep hook order stable: always call effect, conditionally act inside it
  React.useEffect(() => {
    if (generatedQuiz) {
      setActiveContent("quizzes");
    }
  }, [generatedQuiz, setActiveContent]);

  // If a quiz has been generated, show it directly
  if (generatedQuiz) {
    return (
      <QuizInterface
        quizData={generatedQuiz}
        topic={generatedQuiz.course}
        onBack={() => setGeneratedQuiz(null)}
        existingQuizId={generatedQuiz._id}
      />
    );
  }

  return (
    <div className="relative min-h-screen">
      {showLoader && (
        <div data-actirova-loader-overlay="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <ActirovaLoader text={format} />
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 py-10 relative z-10">
        <div className="text-center mb-12">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 dark:bg-white/10 border border-[#D2D7F8]/30 text-foreground text-[13px] font-medium mb-6 backdrop-blur-md"
          >
            <GraduationCap className="w-4 h-4 text-green-500" />
            <span>AI Learning Assistant</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {friendlyName
              ? `Welcome back, ${friendlyName}`
              : "What can I help you learn?"}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed"
          >
            Enter a topic below to generate a personalized course, flashcards, or quiz
          </motion.p>
          
          {/* Limit warning for non-premium users on current format */}
          {!isPremium && atLimit && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 mx-auto max-w-md p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-sm font-medium backdrop-blur-sm shadow-none"
            >
              {format === "course" && `Course limit reached (${courseLimitInfo.used}/${courseLimitInfo.limit}).`}
              {format === "flashcards" && `Flashcard limit reached (${flashcardsLimitInfo.used}/${flashcardsLimitInfo.limit}).`}
              {format === "quiz" && `Quiz limit reached (${quizzesLimitInfo.used}/${quizzesLimitInfo.limit}).`}
              {" "}<button onClick={() => router.push("/pricing")} className="underline font-bold hover:text-destructive/80 transition-colors">Upgrade to Pro</button> for more.
            </motion.div>
          )}
        </div>

        {/* Hero-style Main Prompt Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative max-w-2xl mx-auto mb-12 p-[2px] rounded-[32px] overflow-hidden"
        >
          {/* Animated Border Gradient - Smooth & Continuous Glowing Edge */}
          <div 
            className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,#86efac,#6DDF97,#22c55e,#4ade80,#86efac)] animate-spin-slow opacity-90" 
            style={{ filter: 'blur(3px)' }}
          />
          
          <div className="relative bg-green-50/95 dark:bg-[#020617] backdrop-blur-2xl rounded-[30.5px] p-2 h-full w-full flex flex-col border-2 border-[#D2D7F8]/70">
            <div className="relative p-4 flex-grow">
              <textarea
                value={localTopic}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocalTopic(value);
                  setTopic(value);
                  // Auto-resize
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
                }}
                placeholder={format === "report" ? "Paste your assignment prompt or research topic here..." : "What do you want to learn today?"}
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-lg text-foreground placeholder-foreground/30 resize-none h-20 hide-scrollbar"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                autoFocus
                maxLength={format === "report" ? 5000 : 500}
              />
              
              {/* Character Count/Limit indicator */}
              <div className="absolute top-4 right-4 text-[10px] sm:text-xs font-bold text-foreground/20">
                {localTopic.length}/{format === "report" ? 5000 : 500}
              </div>

              {/* Subject specific indicator if any */}
              <div className="mt-2 flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground font-medium">
                <Sparkles className="w-3 h-3 text-green-500" />
                <span>AI will prioritize detail for better {format === "report" ? "reports" : "courses"}.</span>
              </div>
            </div>

            {/* Bottom Row: Controls & Action */}
            <div className="flex items-center justify-between p-2 mt-auto border-t border-[#D2D7F8]/30">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Level Dropdown */}
                <div className="relative">
                  <select
                    value={difficulty}
                    onChange={(e) => {
                      const selectedDifficulty = e.target.value;
                      if (!isPremium && selectedDifficulty !== "beginner") {
                        toast.error("Pro subscription required for higher levels.");
                        router.push("/pricing");
                        return;
                      }
                      setDifficulty(selectedDifficulty);
                    }}
                    className="appearance-none flex items-center gap-2 px-4 py-2 pr-10 rounded-full border border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-white/60 transition-colors text-[13px] font-medium text-foreground outline-none cursor-pointer"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate {isPremium ? "" : " (Pro)"}</option>
                    <option value="advanced">Advanced {isPremium ? "" : " (Pro)"}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-50" />
                </div>

                {/* Extra Settings (Format Specific) */}
                {format === "quiz" && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/40 dark:bg-white/5 rounded-full border border-white/60 dark:border-white/10">
                    <HelpCircle className="w-3.5 h-3.5 text-foreground/40" />
                    <input
                      type="number"
                      value={questionsCount}
                      onChange={(e) => setQuestionsCount(Math.min(50, parseInt(e.target.value) || 10))}
                      className="w-8 bg-transparent text-[13px] font-bold text-foreground focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Circular Generate Button */}
              <div className="flex items-center gap-3 ml-auto">
                <button 
                  onClick={handleGenerate}
                  disabled={!topic.trim() || atLimit || isSubmitting}
                  className={`w-11 h-11 flex items-center justify-center rounded-full transition-all border border-[#D2D7F8]/60 ${topic.trim().length > 0 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-[#1a1a1a] dark:bg-white dark:text-[#1a1a1a] hover:bg-black dark:hover:bg-white/90 text-white'}`}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16 px-4 sm:px-0">
          {[
            { id: "course", label: "Course", sub: "Create a study plan to course", icon: BookOpen },
            { id: "flashcards", label: "Flashcards", sub: "Explain complex topic to flashcards", icon: Sparkles },
            { id: "quiz", label: "Practice Quiz", icon: Trophy, sub: "Test your knowledge with a quiz" },
            { id: "report", label: "Report", sub: "Professional report or essay", icon: FileText, pro: true },
          ].map((f) => (
            <motion.div
              key={f.id}
              whileHover={{ y: -5 }}
              onClick={() => {
                if (f.pro && !isPremium) {
                  toast.error("Pro subscription required.");
                  router.push("/pricing");
                  return;
                }
                setFormat(f.id);
              }}
              className={`backdrop-blur-lg border-2 p-4.5 rounded-2xl text-left transition-all cursor-pointer group relative overflow-hidden ${format === f.id 
                ? "bg-green-50/70 dark:bg-green-500/10 border-green-600/30" 
                : "bg-white/20 dark:bg-white/5 border-[#D2D7F8]/60 hover:bg-green-50/70 dark:hover:bg-white/10"}`}
            >
              {/* Shine effect */}
              <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 group-hover:left-[200%] transition-all duration-1000 ease-out" />
              
              <div className="relative z-10">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${format === f.id ? "bg-[#1a1a1a] dark:bg-white border-[#1a1a1a] dark:border-white" : "bg-white/80 dark:bg-white/10 border-[#D2D7F8]/60"} border shadow-none`}>
                  <f.icon className={`w-4.5 h-4.5 ${format === f.id ? "text-white" : "text-foreground"}`} />
                </div>
                <div className="text-[13px] font-bold text-foreground mb-1 leading-tight">{f.label}</div>
                <div className="text-[11px] text-muted-foreground font-medium leading-normal">{f.sub}</div>
              </div>
              {f.pro && !isPremium && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-3 h-3 text-[#1a1a1a]/30" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {format === "report" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 animate-fade-in max-w-4xl mx-auto">
            {[
              { label: "Type", value: reportType, setter: setReportType, options: [
                { v: "report", l: "Formal Report" },
                { v: "essay", l: "Academic Essay" },
                { v: "article", l: "Technical Article" },
              ]},
              { label: "Length", value: reportLength, setter: setReportLength, options: [
                { v: "short", l: "Short (3-5 sections)" },
                { v: "medium", l: "Medium (6-10 sections)" },
                { v: "long", l: "Long (11-15 sections)" },
              ]},
              { label: "Style", value: citationStyle, setter: setCitationStyle, options: [
                { v: "APA", l: "APA Style" },
                { v: "MLA", l: "MLA Style" },
                { v: "Chicago", l: "Chicago Style" },
              ]},
            ].map((group) => (
              <div key={group.label} className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#1a1a1a]/40 tracking-widest px-1">{group.label}</span>
                <div className="relative">
                  <select
                    value={group.value}
                    onChange={(e) => group.setter(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-white/5 font-bold text-xs text-foreground px-4 py-3 rounded-2xl border border-[#D2D7F8]/70 pr-10 focus:outline-none hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer shadow-none"
                  >
                    {group.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1a1a1a]/40 pointer-events-none" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

        <div>
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-500" />
            Popular Learning Tracks
          </h3>
          <PopularTopics setTopic={setTopic} setLocalTopic={setLocalTopic} />
        </div>
      </div>
    );
  }

// Separate component for popular topics with API fetch
function PopularTopics({ setTopic, setLocalTopic }) {
  const [topics, setTopics] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchTopics() {
      try {
        const res = await apiClient.get("/api/popular-topics");
        const data = await res.json();
        setTopics(data.topics || []);
      } catch (error) {
        // Fallback to defaults on error
        setTopics([
          "Artificial Intelligence",
          "Frontend Development",
          "Backend Development",
          "Data Science",
          "Machine Learning",
          "Web Development",
          "Mobile Development",
          "DevOps",
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchTopics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="p-3 sm:p-4 bg-muted border border-border rounded-lg animate-pulse"
          >
            <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
      {topics.map((topicOption) => (
        <button
          key={topicOption}
          onClick={() => {
            setTopic(topicOption);
            setLocalTopic(topicOption);
          }}
          className="p-3 sm:p-4 text-left bg-card border border-border rounded-lg hover:border-foreground/30 hover:shadow-md transition-all"
        >
          <span className="text-xs sm:text-sm font-medium text-foreground line-clamp-2">
            {topicOption}
          </span>
        </button>
      ))}
    </div>
  );
}
