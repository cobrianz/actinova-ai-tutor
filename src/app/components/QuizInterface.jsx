"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  Eye,
  Download,
  Clock,
  FileText,
  Target,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trophy,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { downloadQuizPdfFromServer } from "@/lib/quizPdfDownload";
import { apiClient } from "@/lib/csrfClient";

const QuizInterface = ({ quizData, topic, onBack, existingQuizId }) => {
  const { user, loading: authLoading, isEnterprise, hasPurchased } = useAuth();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedQuestions, setLoadedQuestions] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [questionsVisible, setQuestionsVisible] = useState(false);

  const questionsPerPage = 10;

  // Check if quiz was already completed
  useEffect(() => {
    const quizId = existingQuizId || quizData._id;
    if (quizId) {
      const completedKey = `quiz_completed_${quizId}`;
      const savedScore = localStorage.getItem(completedKey);
      if (savedScore) {
        setScore(parseInt(savedScore));
        setSubmitted(true);
        setIsReviewMode(true);
      }
    }
    setLoaded(true);
  }, [quizData._id, existingQuizId]);

  // Initialize questions and timer
  useEffect(() => {
    if (quizData.questions && quizData.questions.length > 0) {
      const initialQuestions = quizData.questions.slice(0, questionsPerPage);
      setLoadedQuestions(initialQuestions);
      setTotalQuestions(quizData.questions.length);

      const totalTime = quizData.questions.length * 2 * 60;
      setTimeRemaining(totalTime);
      setTimerActive(true);
    }
  }, [quizData.questions]);

  // Timer countdown
  useEffect(() => {
    let interval;
    if (timerActive && timeRemaining > 0 && !submitted) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining, submitted]);

  // Fade in questions when loaded
  useEffect(() => {
    if (loadedQuestions.length > 0) {
      setQuestionsVisible(false);
      const timer = setTimeout(() => setQuestionsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loadedQuestions]);

  const handleAnswerChange = (cardId, answer) => {
    setAnswers((prev) => ({ ...prev, [cardId]: answer }));
  };

  const loadQuestionsForPage = async (page) => {
    const startIndex = (page - 1) * questionsPerPage;
    const endIndex = Math.min(startIndex + questionsPerPage, totalQuestions);

    if (loadedQuestions.length >= endIndex) {
      return;
    }

    if (quizData.questions && quizData.questions.length >= endIndex) {
      setIsLoadingQuestions(true);
      await new Promise((resolve) => setTimeout(resolve, 600));

      const newQuestions = quizData.questions.slice(
        loadedQuestions.length,
        endIndex
      );
      setLoadedQuestions((prev) => [...prev, ...newQuestions]);
      setIsLoadingQuestions(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    loadQuestionsForPage(newPage);
  };

  const getCurrentPageQuestions = () => {
    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    return loadedQuestions.slice(startIndex, endIndex);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDownloadExam = async () => {
    const quizId = existingQuizId || quizData?._id;
    if (!quizId) {
      toast.error("Missing quiz id");
      return;
    }

    try {
      await downloadQuizPdfFromServer({
        quizId,
        title: quizData?.title || topic || "Assessment",
      });
    } catch (e) {
      toast.error(e?.message || "Failed to download exam");
    }
  };

  const handleSubmit = async () => {
    const unansweredCount = loadedQuestions.filter((q) => !answers[q._id]).length;
    if (unansweredCount > 0 && !submitted) {
      const proceed = window.confirm(
        `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? "s" : ""}. Are you sure you want to submit?`
      );
      if (!proceed) return;
    }

    let totalScore = 0;
    loadedQuestions.forEach((card) => {
      const userAnswer = answers[card._id];
      if (JSON.stringify(userAnswer) === JSON.stringify(card.correctAnswer)) {
        totalScore += card.points;
      }
    });
    setScore(totalScore);
    setSubmitted(true);
    setIsReviewMode(true);
    setTimerActive(false);

    const quizId = existingQuizId || quizData._id;
    if (quizId) {
      const completedKey = `quiz_completed_${quizId}`;
      localStorage.setItem(completedKey, totalScore.toString());
    }

    if (
      quizId &&
      typeof quizId === "string" &&
      quizId.length > 0 &&
      /^[a-f\d]{24}$/i.test(quizId)
    ) {
      apiClient
        .post(`/api/quizzes/${quizId}/performance`, {
          score: totalScore,
          totalMarks: loadedQuestions.reduce(
            (acc, card) => acc + card.points,
            0
          ),
          answers,
        })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(
              "Failed to save performance data:",
              response.status,
              errorData
            );
          }
        })
        .catch((error) => {
          console.error("Error saving performance:", error);
        });
    }

    toast.success(`Test completed! Your score is ${totalScore}.`);
  };

  const handleRetake = () => {
    setAnswers({});
    setSubmitted(false);
    setIsReviewMode(false);
    setScore(0);
    setCurrentPage(1);
    setLoadedQuestions(quizData.questions.slice(0, questionsPerPage));
    setTotalQuestions(quizData.questions.length);
    const totalTime = quizData.questions.length * 2 * 60;
    setTimeRemaining(totalTime);
    setTimerActive(true);
    if (quizData._id) {
      const completedKey = `quiz_completed_${quizData._id}`;
      localStorage.removeItem(completedKey);
    }
  };

  if (!quizData || !quizData.questions) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/30 border-t-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  const totalMarks = quizData.questions.reduce((acc, q) => acc + q.points, 0);
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / loadedQuestions.length) * 100);
  const totalPagesCount = Math.ceil(totalQuestions / questionsPerPage);
  const percentageScore = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  return (
    <div
      className={`min-h-screen bg-background text-foreground transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
    >
      {/* Sticky Header Bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Back button */}
            {onBack ? (
              <button
                onClick={onBack}
                className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </button>
            ) : (
              <Link
                href="/dashboard?tab=quizzes"
                className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Link>
            )}

            {/* Title - truncated on mobile */}
            <h1 className="text-sm sm:text-base font-semibold text-foreground truncate flex-1 text-center">
              {quizData.title}
            </h1>

            {/* Download button - always visible */}
            <Button
              onClick={handleDownloadExam}
              variant="outline"
              size="sm"
              className="shrink-0 border-border hover:bg-muted"
            >
              <Download className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <FileText className="w-5 h-5 text-primary mx-auto mb-1.5" />
            <div className="text-xl font-bold text-foreground">
              {totalQuestions}
            </div>
            <p className="text-xs text-muted-foreground">Questions</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <Target className="w-5 h-5 text-primary mx-auto mb-1.5" />
            <div className="text-xl font-bold text-foreground">
              {totalMarks}
            </div>
            <p className="text-xs text-muted-foreground">Total Points</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <CheckCircle className="w-5 h-5 text-primary mx-auto mb-1.5" />
            <div className="text-xl font-bold text-foreground">
              {answeredCount}/{loadedQuestions.length}
            </div>
            <p className="text-xs text-muted-foreground">Answered</p>
          </div>

          <div
            className={`rounded-xl p-4 text-center ${
              timeRemaining < 300
                ? "bg-destructive/10 text-destructive"
                : "bg-muted/50"
            }`}
          >
            <Clock
              className={`w-5 h-5 mx-auto mb-1.5 ${
                timeRemaining < 300 ? "text-destructive" : "text-primary"
              }`}
            />
            <div
              className={`text-xl font-bold font-mono ${
                timeRemaining < 300 ? "text-destructive" : "text-foreground"
              }`}
            >
              {formatTime(timeRemaining)}
            </div>
            <p className="text-xs text-muted-foreground">Time Left</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>
              Page {currentPage} of {totalPagesCount}
            </span>
            <span>{progressPercent}% complete</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Questions Card */}
        <Card className="bg-card">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-6">
              {getCurrentPageQuestions().map((q, index) => {
                const globalIndex =
                  (currentPage - 1) * questionsPerPage + index;
                return (
                  <div
                    key={`question-${globalIndex}`}
                    className={`p-4 sm:p-5 rounded-xl bg-muted/30 transition-all duration-300 ${
                      questionsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    }`}
                    style={{ transitionDelay: `${index * 30}ms` }}
                  >
                    {/* Question Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-9 h-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-sm">
                        {globalIndex + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-foreground leading-relaxed">
                          {q.text}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs font-medium">
                            {q.points} pt{q.points !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Answer Options */}
                    {q.type === "multiple-choice" || q.type === "true-false" ? (
                      <RadioGroup
                        onValueChange={(value) => handleAnswerChange(q._id, value)}
                        disabled={submitted}
                        className="space-y-2 ml-12"
                      >
                        {q.options.map((option, optIndex) => {
                          const isSelected = answers[q._id] === option;
                          const isCorrect = submitted && JSON.stringify(q.correctAnswer) === JSON.stringify(option);
                          const isWrong = submitted && isSelected && !isCorrect;

                          return (
                            <label
                              key={option}
                              htmlFor={`${q._id}-${option}`}
                              className={`flex items-center gap-3 p-3 sm:p-3.5 rounded-lg border-2 transition-all duration-150 cursor-pointer ${
                                isCorrect
                                  ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                                  : isWrong
                                    ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                                    : isSelected
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                              } ${submitted ? "cursor-default" : ""}`}
                            >
                              <RadioGroupItem
                                value={option}
                                id={`${q._id}-${option}`}
                                className="w-4 h-4"
                              />
                              <span className="flex-1 text-sm text-foreground">
                                <span className="font-medium text-muted-foreground mr-1.5">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                {option}
                              </span>
                              {isCorrect && (
                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                              )}
                              {isWrong && (
                                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                              )}
                            </label>
                          );
                        })}
                      </RadioGroup>
                    ) : (
                      <div className="space-y-2 ml-12">
                        {q.options.map((option, optIndex) => {
                          const selectedAnswers = answers[q._id] || [];
                          const isSelected = selectedAnswers.includes(option);
                          const isCorrect = submitted && Array.isArray(q.correctAnswer) && q.correctAnswer.includes(option);
                          const isWrong = submitted && isSelected && !isCorrect;

                          return (
                            <label
                              key={option}
                              htmlFor={`${q._id}-${option}`}
                              className={`flex items-center gap-3 p-3 sm:p-3.5 rounded-lg border-2 transition-all duration-150 cursor-pointer ${
                                isCorrect
                                  ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                                  : isWrong
                                    ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                                    : isSelected
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                              } ${submitted ? "cursor-default" : ""}`}
                            >
                              <Checkbox
                                id={`${q._id}-${option}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  const currentAnswers = answers[q._id] || [];
                                  const newAnswers = checked
                                    ? [...currentAnswers, option]
                                    : currentAnswers.filter((a) => a !== option);
                                  handleAnswerChange(q._id, newAnswers);
                                }}
                                disabled={submitted}
                                className="w-4 h-4"
                              />
                              <span className="flex-1 text-sm text-foreground">
                                <span className="font-medium text-muted-foreground mr-1.5">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                {option}
                              </span>
                              {isCorrect && (
                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                              )}
                              {isWrong && (
                                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Correct Answer Display (after submit) */}
                    {submitted && (
                      <div className="mt-3 ml-12">
                        {JSON.stringify(answers[q._id]) !==
                        JSON.stringify(q.correctAnswer) ? (
                          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            <span>
                              Correct answer:{" "}
                              <strong>
                                {Array.isArray(q.correctAnswer)
                                  ? q.correctAnswer.join(", ")
                                  : q.correctAnswer}
                              </strong>
                            </span>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Loading skeleton */}
            {isLoadingQuestions && (
              <div className="space-y-6 mt-6">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="p-5 rounded-xl bg-muted/30 animate-pulse"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-9 h-9 bg-muted rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="flex gap-2">
                          <div className="h-5 w-12 bg-muted rounded"></div>
                          <div className="h-5 w-16 bg-muted rounded"></div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 ml-12">
                      {[...Array(4)].map((_, optIndex) => (
                        <div
                          key={optIndex}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className="w-4 h-4 bg-muted rounded"></div>
                          <div className="flex-1 h-3 bg-muted rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Controls */}
        <div className="mt-6">
          {submitted ? (
            <div className="bg-card rounded-xl p-6 sm:p-8">
              {/* Score Display */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-3">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Assessment Complete
                </h2>
                <p className="text-muted-foreground">
                  Here&apos;s how you performed
                </p>
              </div>

              {/* Score Card */}
              <div className="max-w-sm mx-auto mb-6">
                <div className="bg-muted/50 rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold text-foreground mb-1">
                    {score}<span className="text-lg text-muted-foreground font-normal">/{totalMarks}</span>
                  </div>
                  <div className={`text-lg font-semibold ${percentageScore >= 70 ? "text-green-600 dark:text-green-400" : percentageScore >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>
                    {percentageScore}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {percentageScore >= 70 ? "Great job!" : percentageScore >= 50 ? "Good effort!" : "Keep practicing!"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleRetake}
                  variant="outline"
                  className="border-border"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake Test
                </Button>
                <Button
                  onClick={handleDownloadExam}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Exam
                </Button>
                <Button
                  onClick={() => setIsReviewMode(!isReviewMode)}
                  variant="outline"
                  className="border-border"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {isReviewMode ? "Hide Review" : "Review Answers"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl p-4 sm:p-6 space-y-4">
              {/* Pagination */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoadingQuestions}
                  variant="outline"
                  size="icon"
                  className="border-border h-9 w-9 shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex gap-1 flex-wrap justify-center">
                  {Array.from(
                    { length: totalPagesCount },
                    (_, i) => i + 1
                  ).map((page) => (
                    <Button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      disabled={isLoadingQuestions}
                      className={`h-9 w-9 shrink-0 ${currentPage === page ? "" : "border-border"}`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPagesCount || isLoadingQuestions}
                  variant="outline"
                  size="icon"
                  className="border-border h-9 w-9 shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                <Link href="/dashboard?tab=quizzes" className="w-full sm:w-auto">
                  <Button variant="outline" className="border-border w-full">
                    Cancel
                  </Button>
                </Link>
                <Button
                  onClick={handleSubmit}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto sm:px-8"
                >
                  Submit Assessment
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizInterface;
