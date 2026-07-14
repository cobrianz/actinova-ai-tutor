"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  RotateCcw,
  CheckCircle,
  XCircle,
  Zap,
  Clock,
  Trophy,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";

const ratingButtons = [
  {
    quality: 0,
    label: "Again",
    color: "bg-red-500 hover:bg-red-600 text-white",
    description: "Didn't remember",
    icon: XCircle,
  },
  {
    quality: 2,
    label: "Hard",
    color: "bg-amber-500 hover:bg-amber-600 text-white",
    description: "Remembered with difficulty",
    icon: Clock,
  },
  {
    quality: 4,
    label: "Good",
    color: "bg-green-500 hover:bg-green-600 text-white",
    description: "Remembered correctly",
    icon: CheckCircle,
  },
  {
    quality: 5,
    label: "Easy",
    color: "bg-emerald-500 hover:bg-emerald-600 text-white",
    description: "Remembered perfectly",
    icon: Zap,
  },
];

export default function SRSReview({ onComplete }) {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDueCards();
  }, []);

  const fetchDueCards = async () => {
    try {
      const response = await apiClient.get("/api/srs/due");
      if (response.ok) {
        const data = await response.json();
        setCards(data.cards || []);
      } else {
        toast.error("Failed to fetch due cards");
      }
    } catch (error) {
      console.error("Error fetching due cards:", error);
      toast.error("Error loading review session");
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (quality) => {
    if (submitting) return;
    setSubmitting(true);

    const card = cards[currentIndex];
    try {
      const response = await apiClient.post("/api/srs/review", {
        type: "flashcard",
        id: card.cardId,
        setId: card.setId,
        quality,
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Card rated! Next review: ${data.nextReview}`);

        // Update stats based on rating
        if (quality === 0) {
          setReviewStats((prev) => ({ ...prev, again: prev.again + 1 }));
        } else if (quality === 2) {
          setReviewStats((prev) => ({ ...prev, hard: prev.hard + 1 }));
        } else if (quality === 4) {
          setReviewStats((prev) => ({ ...prev, good: prev.good + 1 }));
        } else if (quality === 5) {
          setReviewStats((prev) => ({ ...prev, easy: prev.easy + 1 }));
        }

        // Move to next card or complete session
        if (currentIndex + 1 < cards.length) {
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);
        } else {
          setSessionComplete(true);
          if (onComplete) {
            onComplete({
              totalReviewed: cards.length,
              ...reviewStats,
            });
          }
        }
      } else {
        toast.error("Failed to submit rating");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Error submitting rating");
    } finally {
      setSubmitting(false);
    }
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionComplete(false);
    setReviewStats({
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
    });
    fetchDueCards();
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading review session...</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No cards due for review!
          </h3>
          <p className="text-muted-foreground mb-6">
            All caught up! Check back later for more cards to review.
          </p>
          <button
            onClick={onComplete}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const totalReviewed =
      reviewStats.again + reviewStats.hard + reviewStats.good + reviewStats.easy;
    const accuracy =
      totalReviewed > 0
        ? Math.round(((reviewStats.good + reviewStats.easy) / totalReviewed) * 100)
        : 0;

    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md w-full"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Session Complete!
          </h3>
          <p className="text-muted-foreground mb-6">
            You&apos;ve reviewed all {totalReviewed} cards
          </p>

          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{accuracy}%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{totalReviewed}</p>
                <p className="text-xs text-muted-foreground">Cards Reviewed</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  count: reviewStats.again,
                  color: "text-red-500",
                  bg: "bg-red-500/10",
                  label: "Again",
                },
                {
                  count: reviewStats.hard,
                  color: "text-amber-500",
                  bg: "bg-amber-500/10",
                  label: "Hard",
                },
                {
                  count: reviewStats.good,
                  color: "text-green-500",
                  bg: "bg-green-500/10",
                  label: "Good",
                },
                {
                  count: reviewStats.easy,
                  color: "text-emerald-600 dark:text-emerald-400",
                  bg: "bg-emerald-500/10",
                  label: "Easy",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`${stat.bg} rounded-xl p-3 text-center`}
                >
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.count}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetSession}
              className="flex-1 px-4 py-2 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              Review Again
            </button>
            <button
              onClick={onComplete}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Session Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-foreground">Review Session</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain size={16} />
            <span>
              {currentIndex + 1} of {cards.length}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-primary rounded-full"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mt-4">
          {[
            {
              count: reviewStats.again,
              color: "text-red-500",
              label: "Again",
            },
            {
              count: reviewStats.hard,
              color: "text-amber-500",
              label: "Hard",
            },
            {
              count: reviewStats.good,
              color: "text-green-500",
              label: "Good",
            },
            {
              count: reviewStats.easy,
              color: "text-emerald-600 dark:text-emerald-400",
              label: "Easy",
            },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className={`text-lg font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div
            onClick={() => !submitting && setIsFlipped(!isFlipped)}
            className="cursor-pointer h-80 perspective-[1000px]"
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 300, damping: 30 }}
              style={{ transformStyle: "preserve-3d" }}
              className="w-full h-full"
            >
              {/* Front (Question) */}
              <div
                className="absolute inset-0 rounded-2xl border border-border bg-card p-6 flex flex-col"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-4">
                      Question
                    </p>
                    <p className="text-xl font-medium text-foreground leading-relaxed">
                      {currentCard.question}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    Tap to reveal answer
                  </span>
                </div>
              </div>

              {/* Back (Answer) */}
              <div
                className="absolute inset-0 rounded-2xl border border-primary/30 bg-primary/5 p-6 flex flex-col"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div className="flex-1 overflow-y-auto">
                  <div className="text-center mb-6">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-4">
                      Answer
                    </p>
                    <p className="text-xl font-medium text-foreground leading-relaxed">
                      {currentCard.answer}
                    </p>
                  </div>

                  {currentCard.explanation && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Explanation
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {currentCard.explanation}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    Tap to see question
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Rating Buttons */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <p className="text-center text-sm text-muted-foreground mb-4">
              How well did you remember?
            </p>
            <div className="grid grid-cols-4 gap-3">
              {ratingButtons.map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.quality}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRating(btn.quality);
                    }}
                    disabled={submitting}
                    className={`${btn.color} rounded-xl py-3 px-2 font-medium text-sm transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-1`}
                  >
                    <Icon size={20} />
                    <span>{btn.label}</span>
                    <span className="text-[10px] opacity-80">{btn.description}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
