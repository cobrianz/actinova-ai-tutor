"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  FileText,
  Clock,
  HelpCircle,
  BrainCircuit,
  CheckCircle,
  Award,
  Trash2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import QuizInterface from "./QuizInterface";

const TestYourself = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const itemsPerPage = 6;
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetch("/api/quizzes", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setQuizzes(data);

          // Calculate overall performance stats
          let totalTests = data.length;
          let totalAttempts = 0;
          let totalScore = 0;
          let completedTests = 0;

          data.forEach((quiz) => {
            if (quiz.performances && quiz.performances.length > 0) {
              completedTests++;
              totalAttempts += quiz.performances.length;
              // Get the best score for each user across all attempts
              const userBestScores = {};
              quiz.performances.forEach((p) => {
                const userId = p.userId.toString();
                if (
                  !userBestScores[userId] ||
                  p.percentage > userBestScores[userId]
                ) {
                  userBestScores[userId] = p.percentage;
                }
              });
              totalScore += Object.values(userBestScores).reduce(
                (sum, score) => sum + score,
                0
              );
            }
          });

          const averageScore =
            completedTests > 0 ? Math.round(totalScore / completedTests) : 0;

          setPerformanceStats({
            totalTests,
            completedTests,
            totalAttempts,
            averageScore,
          });
        } else {
          toast.error("Failed to fetch quizzes");
        }
      } catch (error) {
        toast.error("An error occurred while fetching quizzes");
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    };
    fetchQuizzes();
  }, []);

  const handleDeleteQuiz = async (quizId) => {
    if (
      !confirm(
        "Are you sure you want to delete this quiz? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Quiz deleted successfully");
        // Refresh the quizzes list
        const response = await fetch("/api/quizzes");
        if (response.ok) {
          const data = await response.json();
          setQuizzes(data);
        }
      } else {
        toast.error("Failed to delete quiz");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the quiz");
    }
  };

  const getFilteredQuizzes = () => {
    return quizzes.filter((quiz) => {
      // Filter by difficulty
      if (filterDifficulty !== "all" && quiz.difficulty !== filterDifficulty) {
        return false;
      }

      // Filter by completion status
      if (filterStatus !== "all") {
        const completedKey = `quiz_completed_${quiz._id}`;
        const isCompleted =
          typeof window !== "undefined" && localStorage.getItem(completedKey);

        if (filterStatus === "completed" && !isCompleted) {
          return false;
        }
        if (filterStatus === "pending" && isCompleted) {
          return false;
        }
      }

      return true;
    });
  };

  if (selectedQuiz) {
    return (
      <QuizInterface
        quizData={selectedQuiz}
        topic={selectedQuiz.course}
        onBack={() => setSelectedQuiz(null)}
      />
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-background text-foreground min-h-full">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight flex items-center">
          <BrainCircuit className="w-8 h-8 mr-3 text-blue-500" />
          Test Your Knowledge
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Challenge yourself with quizzes on various topics.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card
          className={`bg-muted/50 border-border shadow-none py-3 gap-3 transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tests
            </CardTitle>
            <HelpCircle className="w-6 h-6 text-primary/60" />
          </CardHeader>
          <CardContent className="flex flex-row items-center justify-between">
            <div className="text-2xl font-bold text-foreground">
              {loading ? "..." : quizzes.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Assignments & Quizzes
            </p>
          </CardContent>
        </Card>
        <Card
          className={`bg-muted/50 border-border shadow-none py-3 gap-3 transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="w-6 h-6 text-amber-500/60" />
          </CardHeader>
          <CardContent className="flex flex-row items-center justify-between">
            <div className="text-2xl font-bold text-foreground">
              {loading ? "..." : quizzes.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need completion
            </p>
          </CardContent>
        </Card>
        <Card
          className={`bg-muted/50 border-border shadow-none py-3 gap-3 transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Tests
            </CardTitle>
            <CheckCircle className="w-6 h-6 text-green-500/60" />
          </CardHeader>
          <CardContent className="flex flex-row items-center justify-between">
            <div className="text-2xl font-bold text-foreground">
              {loading ? "..." : performanceStats?.completedTests || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {performanceStats?.totalTests || 0} tests
            </p>
          </CardContent>
        </Card>
        <Card
          className={`bg-muted/50 border-border shadow-none py-3 gap-3 transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Score
            </CardTitle>
            <Award className="w-6 h-6 text-purple-500/60" />
          </CardHeader>
          <CardContent className="flex flex-row items-center justify-between">
            <div className="text-2xl font-bold text-foreground">
              {loading ? "..." : `${performanceStats?.averageScore || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all completed tests
            </p>
          </CardContent>
        </Card>
      </div>

      <div
        className={`bg-card p-6 rounded-3xl border border-border transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-2xl font-bold">Available Quizzes</h2>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="mt-2 sm:mt-0 rounded-xl"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-muted/30 rounded-2xl border border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Difficulty
                </label>
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="all">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="all">All Tests</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            {(filterDifficulty !== "all" || filterStatus !== "all") && (
              <div className="mt-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterDifficulty("all");
                    setFilterStatus("all");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary mx-auto mb-4"></div>
            Loading quizzes...
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 opacity-20" />
            </div>
            <p className="mb-2">No quizzes available yet.</p>
            <p>
              Go to the{" "}
              <Link
                href="/dashboard?tab=generate"
                className="text-primary hover:underline font-medium"
              >
                Generate
              </Link>{" "}
              page to create one.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const filteredQuizzes = getFilteredQuizzes();
              const totalPages = Math.ceil(
                filteredQuizzes.length / itemsPerPage
              );
              const startIndex = (currentPage - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const currentQuizzes = filteredQuizzes.slice(
                startIndex,
                endIndex
              );
              return (
                <>
                  {currentQuizzes.map((quiz) => {
                    return (
                      <div
                        key={quiz._id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border border-border bg-card/50 hover:bg-muted/30 transition-all group"
                      >
                        <div className="mb-4 sm:mb-0">
                          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                            {quiz.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {quiz.course}
                          </p>
                          <div className="flex items-center space-x-6 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-blue-500" />
                              {quiz.questions.length} questions
                            </span>
                            {quiz.createdAt && (
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-orange-500" />
                                {new Date(quiz.createdAt).toLocaleDateString()}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${quiz.difficulty === 'easy' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                quiz.difficulty === 'medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                                  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                              }`}>
                              {quiz.difficulty}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            variant="default"
                            onClick={() => setSelectedQuiz(quiz)}
                            className="w-full sm:w-auto rounded-xl px-8 py-2 font-bold shadow-lg shadow-primary/20"
                          >
                            {(() => {
                              const completedKey = `quiz_completed_${quiz._id}`;
                              const isCompleted =
                                typeof window !== "undefined" &&
                                localStorage.getItem(completedKey);
                              return isCompleted ? "Review Test" : "Take Test";
                            })()}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-10 gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl border border-border bg-card hover:bg-muted disabled:opacity-30 transition-all text-muted-foreground"
                      >
                        <ChevronLeft size={20} />
                      </button>

                      <div className="flex gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                          (page) => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === page
                                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
                                }`}
                            >
                              {page}
                            </button>
                          )
                        )}
                      </div>

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl border border-border bg-card hover:bg-muted disabled:opacity-30 transition-all text-muted-foreground"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestYourself;
