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
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import { cn } from "../lib/utils";
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
  const { user, loading, refreshToken } = useAuth();

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
      window.addEventListener("actinova:loading-done", onDone);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("actinova:loading-done", onDone);
      }
    };
  }, [showLoader]);

  // Strict check for Premium access (Pro or Enterprise)
  const isPremium =
    !!(
      (user?.subscription?.plan === "pro" || user?.subscription?.plan === "enterprise") &&
      user?.subscription?.status === "active"
    ) || !!user?.isPremium;

  const atLimit = !!(
    user?.usage?.isAtLimit ||
    (!isPremium && user?.usage?.remaining === 0)
  );

  const friendlyName =
    !loading && user ? user.firstName || user.name || "" : "";

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    const subject = topic.trim();

    const cacheKey = `generated_${subject}_${format}_${difficulty}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        router.push(
          `/learn/${encodeURIComponent(subject)}?format=${format}&difficulty=${difficulty}`
        );
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
        toast.error(error.message || "Failed to generate quiz");
      } finally {
        setShowLoader(false);
        setIsSubmitting(false);
      }
      return;
    }

    router.push(
      `/learn/${encodeURIComponent(subject)}?format=${format}&difficulty=${difficulty}`
    );
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
        <div data-actinova-loader-overlay="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <ActinovaLoader text={format} />
        </div>
      )}

      {/* Greeting Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
          {friendlyName ? `Welcome back, ${friendlyName}!` : "Welcome to Actinova AI"}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          What would you like to master today? Our AI will create a personalized learning journey just for you.
        </p>
      </div>

      {/* Main Generation Card */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Create New Learning Path</h2>
            <p className="text-muted-foreground">Describe your goal and we'll handle the rest</p>
            {!isPremium && atLimit && (
              <div className="mt-4 p-3 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm font-medium">
                You've reached your free limit. Upgrade to Pro for unlimited generations!
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Topic Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 px-1">What can I help you learn?</label>
              <textarea
                value={localTopic}
                onChange={(e) => {
                  setLocalTopic(e.target.value);
                  setTopic(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
                }}
                placeholder="e.g. Master React.js hooks, Learn Python for Data Science, Advanced Chess strategies..."
                className="w-full px-5 py-4 text-lg border border-border rounded-2xl bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none min-h-[120px] shadow-sm"
                onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && handleGenerate()}
                maxLength={500}
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                <span className="flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Tip: Ctrl + Enter to generate</span>
                <span className={cn(localTopic.length > 450 && "text-destructive")}>{localTopic.length}/500</span>
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground/80 px-1">Choose your preferred format</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: "course", label: "Full Course", icon: BookOpen, desc: "Structured lessons" },
                  { id: "flashcards", label: "Flashcards", icon: FileText, desc: "Quick recall" },
                  { id: "quiz", label: "Assessment", icon: HelpCircle, desc: "Test knowledge" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFormat(item.id)}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all flex flex-col items-start text-left gap-2",
                      format === item.id
                        ? "border-primary bg-primary/5 ring-4 ring-primary/5"
                        : "border-border hover:border-border-accent bg-background"
                    )}
                  >
                    <div className={cn("p-2 rounded-xl", format === item.id ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty & Quiz Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80 px-1">Difficulty Level</label>
                <div className="relative">
                  <select
                    value={difficulty}
                    onChange={(e) => {
                      if (!isPremium && e.target.value !== "beginner") {
                        toast.error("Pro subscription required for this level");
                        setActiveContent("upgrade");
                        return;
                      }
                      setDifficulty(e.target.value);
                    }}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background appearance-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="beginner">Beginner {!isPremium && "(Free)"}</option>
                    <option value="intermediate" disabled={!isPremium}>Intermediate {!isPremium && "(Pro Only)"}</option>
                    <option value="advanced" disabled={!isPremium}>Advanced {!isPremium && "(Pro Only)"}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {format === "quiz" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80 px-1">Questions Count</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={questionsCount}
                    onChange={(e) => setQuestionsCount(Math.min(50, parseInt(e.target.value) || 10))}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
            </div>

            {/* CTA Button */}
            <button
              onClick={handleGenerate}
              disabled={!topic.trim() || isSubmitting || (!isPremium && atLimit)}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" />
              <span>{isSubmitting ? "Crafting your content..." : "Start Learning Now"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Popular Tracks Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-bold">Explore Popular Topics</h3>
          <button onClick={() => setActiveContent("explore")} className="text-sm font-semibold text-primary hover:underline">View all</button>
        </div>
        <PopularTopics setTopic={setTopic} setLocalTopic={setLocalTopic} />
      </div>
    </div>
  );
}

function PopularTopics({ setTopic, setLocalTopic }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function fetchTopics() {
      try {
        const res = await fetch("/api/popular-topics", { credentials: "include" });
        const data = await res.json();
        setTopics(data.topics || ["AI", "Coding", "Science", "Business", "History", "Math", "Design", "Marketing"]);
      } catch (error) {
        setTopics(["AI", "Coding", "Science", "Business", "History", "Math", "Design", "Marketing"]);
      } finally {
        setLoading(false);
      }
    }
    fetchTopics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {topics.map((t) => (
        <button
          key={t}
          onClick={() => { setTopic(t); setLocalTopic(t); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="p-4 text-left bg-card border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
        >
          <span className="text-sm font-semibold group-hover:text-primary transition-colors">{t}</span>
        </button>
      ))}
    </div>
  );
}
