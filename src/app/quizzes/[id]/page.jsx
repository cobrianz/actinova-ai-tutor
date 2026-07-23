"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  Download,
  Trophy,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/csrfClient";
import { downloadQuizPdfFromServer } from "@/lib/quizPdfDownload";

const TakeQuizPage = ({ params }) => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await apiClient.get(`/api/quizzes/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setQuiz(data);
        } else {
          toast.error("Failed to load quiz.");
        }
      } catch (error) {
        toast.error("An error occurred while fetching the quiz.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [params.id]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleDownloadExam = async () => {
    if (!quiz?._id) {
      toast.error("Missing quiz id");
      return;
    }
    try {
      await downloadQuizPdfFromServer({
        quizId: quiz._id,
        title: quiz?.title || "Assessment",
      });
    } catch (e) {
      toast.error(e?.message || "Failed to download exam");
    }
  };

  const handleSubmit = () => {
    const unansweredCount = quiz.questions.filter((q) => !answers[q._id]).length;
    if (unansweredCount > 0) {
      const proceed = window.confirm(
        `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? "s" : ""}. Are you sure you want to submit?`
      );
      if (!proceed) return;
    }

    let totalScore = 0;
    quiz.questions.forEach((q) => {
      const userAnswer = answers[q._id];
      const isTextBased = q.type === "fill_blank" || q.type === "short_answer";
      const isCorrect = isTextBased
        ? String(userAnswer || "").trim().toLowerCase() === String(q.correctAnswer || "").trim().toLowerCase()
        : JSON.stringify(userAnswer) === JSON.stringify(q.correctAnswer);
      if (isCorrect) {
        totalScore += q.points;
      }
    });
    setScore(totalScore);
    setSubmitted(true);
    toast.success(`Quiz submitted! Your score is ${totalScore}.`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/30 border-t-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">Could not load the quiz.</p>
          <Link href="/dashboard/quizzes">
            <Button variant="outline">Back to Quizzes</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalMarks = quiz.questions.reduce((acc, q) => acc + q.points, 0);
  const percentageScore = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/dashboard/quizzes"
              className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Link>

            <h1 className="text-sm sm:text-base font-semibold text-foreground truncate flex-1 text-center">
              {quiz.title}
            </h1>

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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Quiz Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="text-sm text-muted-foreground">
            {quiz.course} &middot; {quiz.questions.length} questions &middot; {totalMarks} total points
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-semibold uppercase">
              {quiz.difficulty || "Medium"}
            </span>
          </div>
        </div>

        {/* Questions */}
        <Card className="bg-card">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-6">
              {quiz.questions.map((q, index) => (
                <div
                  key={q._id}
                  className="p-4 sm:p-5 rounded-xl bg-muted/30"
                >
                  {/* Question Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-9 h-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-sm">
                      {index + 1}
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
                  {(q.type === "multiple-choice" || q.type === "multiple_choice" || q.type === "true-false" || q.type === "true_false") ? (
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
                  ) : (q.type === "fill_blank" || q.type === "short_answer") ? (
                    <div className="ml-12 space-y-2">
                      <Input
                        type="text"
                        placeholder="Type your answer..."
                        value={answers[q._id] || ""}
                        onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                        disabled={submitted}
                        className={`w-full max-w-md ${
                          submitted
                            ? JSON.stringify(answers[q._id]?.trim().toLowerCase()) === JSON.stringify(q.correctAnswer?.trim().toLowerCase())
                              ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                              : "border-red-500 bg-red-50 dark:bg-red-950/30"
                            : ""
                        }`}
                      />
                      {submitted && (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          <span>
                            Expected answer: <strong>{q.correctAnswer}</strong>
                          </span>
                        </div>
                      )}
                    </div>
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

                  {/* Correct Answer Display */}
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
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bottom Controls */}
        <div className="mt-6">
          {submitted ? (
            <div className="bg-card rounded-xl p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-3">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Quiz Complete
                </h2>
                <p className="text-muted-foreground">
                  Here&apos;s how you performed
                </p>
              </div>

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

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={handleDownloadExam}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Quiz
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                <Link href="/dashboard/quizzes" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button
                  onClick={handleSubmit}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto sm:px-8"
                >
                  Submit Quiz
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TakeQuizPage;
