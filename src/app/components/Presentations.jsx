"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Sparkles,
  FileText,
  ChevronDown,
  Lightbulb,
  AlertTriangle,
  Presentation,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import ActirovaLoader from "./ActirovaLoader";

export default function Presentations({ setActiveContent }) {
  const [topic, setTopic] = useState("");
  const [localTopic, setLocalTopic] = useState("");
  const [slides, setSlides] = useState(10);
  const [style, setStyle] = useState("professional");
  const [difficulty, setDifficulty] = useState("beginner");
  const [showLoader, setShowLoader] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user, loading, refreshToken } = useAuth();
  const pathname = usePathname();

  React.useEffect(() => {
    setShowLoader(false);
  }, [pathname]);

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

  const isPremium =
    !!((user?.subscription?.plan === "pro" || user?.subscription?.plan === "enterprise") &&
      user?.subscription?.status === "active") || !!user?.isPremium;

  const atLimit = !!(
    user?.usage?.isAtLimit ||
    (!isPremium && user?.usage?.remaining === 0)
  );

  const friendlyName =
    !loading && user ? user.firstName || user.name || "" : "";

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    const subject = topic.trim();

    setShowLoader(true);

    try {
      const response = await fetch("/api/generate-presentations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          topic: subject,
          difficulty,
          slides,
          style,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          toast.error("Monthly limit reached. Upgrade to Pro for more!");
          router.push("/pricing");
          return;
        }
        throw new Error(errorData.error || "Failed to generate presentation");
      }

      const data = await response.json();
      toast.success("Presentation generated successfully!");

      // Dispatch usage update event
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("usageUpdated"));
      }

      // Redirect to presentations library
      setActiveContent("presentations");
    } catch (error) {
      console.error("Presentation generation failed:", error);
      toast.error(error.message || "Failed to generate presentation");
    } finally {
      setShowLoader(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {showLoader && (
        <div
          data-actirova-loader-overlay="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs"
        >
          <ActirovaLoader text="presentation" />
        </div>
      )}

      <div className="mb-12 relative text-center pt-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-32 bg-primary/20 blur-[100px] -z-10 rounded-full"></div>
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-primary mb-4 tracking-tight">
          {friendlyName
            ? `Welcome back, ${friendlyName}`
            : "Professional AI Presentations"}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Create beautiful, modern presentations powered by AI. Generate stunning slides with professional graphics, layouts, and colors in seconds.
        </p>
      </div>

      <div className="bg-card p-8 mb-10 border border-border/50 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="text-center mb-10 relative z-10">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Design Your Next Masterpiece
          </h2>
          <p className="text-muted-foreground text-lg">
            Enter a topic and let AI craft a comprehensive, stunning presentation
          </p>
          {!isPremium && atLimit && (
            <div className="mt-4 mx-auto max-w-md p-3 rounded-lg border border-destructive bg-destructive/10 text-destructive text-sm">
              You hit free limits. Upgrade to get more generations.
            </div>
          )}
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {/* Topic Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 text-left px-1">
              What would you like to present?
            </label>
            <textarea
              value={localTopic}
              onChange={(e) => {
                const value = e.target.value;
                setLocalTopic(value);
                setTopic(value);
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 200) + "px";
              }}
              placeholder="Describe your presentation topic... (e.g., Introduction to Cloud Computing, History of Modern Art, Data Science for Beginners)"
              className="w-full px-3 sm:px-4 py-3 sm:py-4 text-base sm:text-lg border border-input rounded-lg sm:rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none min-h-[100px] sm:min-h-[120px] max-h-[200px] shadow-sm hover:shadow-md"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              autoFocus
              rows={4}
              maxLength={500}
              dir="ltr"
              style={{ direction: "ltr", unicodeBidi: "plaintext" }}
            />
            <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground px-1">
              <span className="flex items-center">
                <Lightbulb className="w-4 h-4 mr-1" />
                Tip: Press Ctrl + Enter to generate your presentation
              </span>
              <span
                className={localTopic.length > 450 ? "text-orange-500" : ""}
              >
                {localTopic.length}/500
              </span>
            </div>
          </div>

          {/* Style Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 sm:mb-3 text-left px-1">
              Presentation Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <button
                onClick={() => setStyle("professional")}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-colors text-left ${style === "professional"
                    ? "border-primary bg-accent"
                    : "border-border hover:border-foreground/30"
                  }`}
              >
                <span className="font-medium text-sm text-foreground">
                  Professional
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Clean, corporate style
                </p>
              </button>
              <button
                onClick={() => setStyle("creative")}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-colors text-left ${style === "creative"
                    ? "border-primary bg-accent"
                    : "border-border hover:border-foreground/30"
                  }`}
              >
                <span className="font-medium text-sm text-foreground">
                  Creative
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Colorful, engaging design
                </p>
              </button>
              <button
                onClick={() => setStyle("minimal")}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-colors text-left ${style === "minimal"
                    ? "border-primary bg-accent"
                    : "border-border hover:border-foreground/30"
                  }`}
              >
                <span className="font-medium text-sm text-foreground">
                  Minimal
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Simple, focused approach
                </p>
              </button>
            </div>
          </div>

          {/* Slides Count */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 text-left px-1">
              Number of Slides
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="50"
                value={slides}
                onChange={(e) => setSlides(parseInt(e.target.value))}
                className="flex-grow h-2 bg-input rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-lg font-semibold text-foreground min-w-[40px]">
                {slides}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 px-1">
              More slides = more detailed content
            </p>
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 text-left px-1">
              Content Level
              {!isPremium && (
                <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                  (Free users: Beginner only)
                </span>
              )}
            </label>
            <div className="relative">
              <select
                value={difficulty}
                onChange={(e) => {
                  const selectedDifficulty = e.target.value;
                  if (!isPremium && selectedDifficulty !== "beginner") {
                    toast.error(
                      "Intermediate and Advanced levels require Pro subscription. Please upgrade to continue."
                    );
                    router.push("/pricing");
                    return;
                  }
                  setDifficulty(selectedDifficulty);
                }}
                className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-10"
              >
                <option value="beginner">
                  Beginner {!isPremium ? "(Free)" : ""}
                </option>
                <option value="intermediate" disabled={!isPremium}>
                  Intermediate {isPremium ? "(Pro)" : "(Pro Only)"}
                </option>
                <option value="advanced" disabled={!isPremium}>
                  Advanced {isPremium ? "(Pro)" : "(Pro Only)"}
                </option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {!isPremium && difficulty !== "beginner" && (
              <div className="mt-2 p-3 bg-accent/30 border border-accent rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-200 flex items-start">
                  <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  Intermediate and Advanced levels require a Pro subscription.
                  <button
                    onClick={() => router.push("/pricing")}
                    className="ml-1 font-semibold underline hover:text-orange-900 dark:hover:text-orange-100"
                  >
                    Upgrade to Pro
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={
              !topic.trim() || (!!user && !isPremium && atLimit)
            }
            className="w-full bg-primary text-primary-foreground py-2.5 sm:py-3 px-4 rounded-lg font-medium text-sm sm:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>
              {!isPremium && atLimit
                ? "You hit free limits — upgrade to get more generations"
                : "Generate Presentation"}
            </span>
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <Presentation className="w-12 h-12 text-primary mb-4" />
          <h3 className="font-semibold text-foreground mb-2">
            Professional Design
          </h3>
          <p className="text-sm text-muted-foreground">
            Beautiful, modern presentation templates ready to use and customize.
          </p>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <Sparkles className="w-12 h-12 text-primary mb-4" />
          <h3 className="font-semibold text-foreground mb-2">
            AI-Powered Content
          </h3>
          <p className="text-sm text-muted-foreground">
            Smart content generation tailored to your topic and audience level.
          </p>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <FileText className="w-12 h-12 text-primary mb-4" />
          <h3 className="font-semibold text-foreground mb-2">
            Easy Download
          </h3>
          <p className="text-sm text-muted-foreground">
            Download as PowerPoint (.pptx) ready for editing and sharing.
          </p>
        </div>
      </div>
    </div>
  );
}
