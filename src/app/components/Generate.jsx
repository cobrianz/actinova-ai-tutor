"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Sparkles,
  BookOpen,
  FileText,
  ChevronDown,
  Lightbulb,
  AlertTriangle,
  ScrollText,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import ActinovaLoader from "./ActinovaLoader";
import QuizInterface from "./QuizInterface";

export default function Generate({ setActiveContent }) {
  const [topic, setTopic] = useState("");
  const [localTopic, setLocalTopic] = useState("");
  const [format, setFormat] = useState("course");
  const [difficulty, setDifficulty] = useState("beginner");
  const [questionsCount, setQuestionsCount] = useState(10);
  const [showLoader, setShowLoader] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

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

  // Hide overlay when route changes
  const pathname = usePathname();
  React.useEffect(() => {
    setShowLoader(false);
  }, [pathname]);

  // Listen for global 'loading-done' event
  React.useEffect(() => {
    const onDone = () => {
      if (showLoader) {
        setShowLoader(false);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("actinova:loading-done", onDone);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("actinova:loading-done", onDone);
      }
    };
  }, [showLoader]);

  const isPremium =
    !!(
      (user?.subscription?.plan === "pro" || user?.subscription?.plan === "enterprise") &&
      user?.subscription?.status === "active"
    ) || !!user?.isPremium;

  const atLimit = !!(
    user?.usage?.isAtLimit ||
    (!isPremium && user?.usage?.remaining === 0)
  );

  const handleGenerate = async () => {
    if (!topic.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const subject = topic.trim();

    const cacheKey = `generated_${subject}_${format}_${difficulty}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        router.push(`/learn/${encodeURIComponent(subject)}?format=${format}&difficulty=${difficulty}`);
        return;
      }
    } catch { }

    if (format === "flashcards") {
      setShowLoader(true);
      try {
        const response = await fetch("/api/generate-flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ topic: subject, difficulty }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 429) {
            toast.error("Monthly limit reached. Upgrade to Pro for more!");
            return;
          }
          throw new Error(errorData.error || "Failed to generate flashcards");
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("usageUpdated"));
        }
        toast.success("Flashcards generated successfully!");
        setActiveContent("flashcards");
      } catch (error) {
        console.error("Flashcard generation failed:", error);
        toast.error(error.message || "Failed to generate flashcards");
      } finally {
        setShowLoader(false);
        setIsSubmitting(false);
      }
      return;
    }

    if (format === "quiz") {
      setShowLoader(true);
      try {
        const response = await fetch("/api/generate-course", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            topic: subject,
            difficulty,
            format: "quiz",
            questions: questionsCount,
          }),
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
        setGeneratedQuiz({ _id: data.quizId, ...data.content });
        toast.success("Quiz generated successfully!");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("usageUpdated"));
        }
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

    router.push(`/learn/${encodeURIComponent(subject)}?format=${format}&difficulty=${difficulty}`);
  };

  React.useEffect(() => {
    if (generatedQuiz) {
      setActiveContent("quizzes");
    }
  }, [generatedQuiz, setActiveContent]);

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
    <div className="space-y-10">
      {showLoader && (
        <div data-actinova-loader-overlay="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-md">
          <ActinovaLoader text={format} />
        </div>
      )}

      <div className="bg-card text-card-foreground p-8 rounded-3xl border border-border/40 shadow-xl shadow-primary/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl transition-transform group-hover:scale-150 duration-700" />
        
        <div className="relative z-10 text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            What can I help you learn today?
          </h2>
          <p className="text-muted-foreground">
            Enter a topic below to generate a personalized course or flashcards
          </p>
          {!isPremium && atLimit && (
            <div className="mt-4 mx-auto max-w-md p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-sm font-medium">
              You hit free limits. Upgrade to get more generations.
            </div>
          )}
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground px-1">
              Topic Description
            </label>
            <div className="relative group/input">
              <textarea
                value={localTopic}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocalTopic(value);
                  setTopic(value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
                }}
                placeholder="Describe what you want to learn in detail... (e.g., I want to learn Python programming from scratch)"
                className="w-full px-4 py-4 text-lg border border-border/40 rounded-2xl bg-background/50 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 resize-none min-h-[120px] shadow-sm hover:shadow-md"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                autoFocus
                rows={4}
                maxLength={500}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-3">
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${localTopic.length > 450 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                  {localTopic.length}/500
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground px-1">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
              <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded border border-border/60 bg-muted">Ctrl + Enter</kbd> to generate</span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground px-1">
              Select Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'course', name: 'Course', icon: BookOpen, desc: 'Full learning path' },
                { id: 'flashcards', name: 'Flashcards', icon: FileText, desc: 'Quick review' },
                { id: 'quiz', name: 'Quiz', icon: HelpCircle, desc: 'Test knowledge' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFormat(item.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 group/card ${format === item.id
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                    : "border-border/40 bg-background/50 hover:border-border hover:bg-muted/30"
                    }`}
                >
                  <item.icon className={`w-6 h-6 mb-3 transition-colors ${format === item.id ? 'text-primary' : 'text-muted-foreground group-hover/card:text-foreground'}`} />
                  <div className="font-bold text-sm mb-1">{item.name}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {format === "quiz" && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              <label className="text-sm font-semibold text-foreground px-1">
                Number of questions
              </label>
              <input
                type="number"
                value={questionsCount}
                onChange={(e) => setQuestionsCount(Math.min(50, parseInt(e.target.value, 10) || 10))}
                className="w-full px-4 py-3 border border-border/40 rounded-xl bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                max="50"
              />
            </motion.div>
          )}

          <div className="space-y-3">
            <label className="flex items-center justify-between text-sm font-semibold text-foreground px-1">
              <span>Difficulty Level</span>
              {!isPremium && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">
                  Free users: Beginner only
                </span>
              )}
            </label>
            <div className="relative group/select">
              <select
                value={difficulty}
                onChange={(e) => {
                  const selectedDifficulty = e.target.value;
                  if (!isPremium && selectedDifficulty !== "beginner") {
                    toast.error("Intermediate and Advanced levels require Pro subscription.");
                    setActiveContent("upgrade");
                    return;
                  }
                  setDifficulty(selectedDifficulty);
                }}
                className="w-full px-4 py-3.5 border border-border/40 rounded-xl bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all cursor-pointer"
              >
                <option value="beginner">Beginner {!isPremium && "(Free)"}</option>
                <option value="intermediate" disabled={!isPremium}>Intermediate {!isPremium && "(Pro Only)"}</option>
                <option value="advanced" disabled={!isPremium}>Advanced {!isPremium && "(Pro Only)"}</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none transition-transform group-hover/select:translate-y-[-40%]" />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || (!!user && !isPremium && atLimit)}
            className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-2xl font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group/btn overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]" />
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span>
              {!isPremium && atLimit
                ? "Unlock more with Pro"
                : "Start Learning"}
            </span>
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center gap-3 mb-6 px-1">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold tracking-tight">
            Popular Learning Tracks
          </h3>
        </div>
        <PopularTopics setTopic={setTopic} setLocalTopic={setLocalTopic} />
      </div>
    </div>
  );
}

function PopularTopics({ setTopic, setLocalTopic }) {
  const [topics, setTopics] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchTopics() {
      try {
        const res = await fetch("/api/popular-topics", {
          credentials: "include",
        });
        const data = await res.json();
        setTopics(data.topics || []);
      } catch (error) {
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-muted/50 border border-border/40 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {topics.map((topicOption) => (
        <button
          key={topicOption}
          onClick={() => {
            setTopic(topicOption);
            setLocalTopic(topicOption);
          }}
          className="p-4 text-left bg-card hover:bg-muted/50 border border-border/40 rounded-2xl hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all group/topic"
        >
          <span className="text-sm font-semibold text-foreground line-clamp-2 group-hover/topic:text-primary transition-colors">
            {topicOption}
          </span>
        </button>
      ))}
    </div>
  );
}
