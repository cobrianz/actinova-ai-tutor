"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    MessageSquare,
    Sparkles,
    User,
    Award,
    CheckCircle,
    ChevronRight,
    Loader2,
    Play,
    Send,
    RefreshCw,
    AlertCircle,
    TrendingUp,
    Clock,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";



const InterviewPrep = () => {
    const [role, setRole] = useState("");
    const [difficulty, setDifficulty] = useState("intermediate");
    const [isStarted, setIsStarted] = useState(false);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [persistentHistory, setPersistentHistory] = useState([]);

    // Fetch history from DB
    React.useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await apiClient.get("/api/career/history?type=interview");
            if (response.ok) {
                const data = await response.json();
                setPersistentHistory(data);
            }
        } catch (err) {
            console.error("Failed to fetch history:", err);
        }
    };

    const handleStart = async () => {
        if (!role.trim()) {
            toast.error("Please enter the role you're interviewing for");
            setError("Role is required");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.post("/api/career/interview/questions", { role, difficulty });
            if (response.ok) {
                const data = await response.json();
                if (data.questions && data.questions.length > 0) {
                    setQuestions(data.questions);
                    setIsStarted(true);
                    setCurrentQuestionIdx(0);
                    setHistory([]);
                    setFeedback(null);
                } else {
                    throw new Error("Received invalid questions format");
                }
            } else {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to generate AI questions. Please try again.");
            }
        } catch (err) {
            console.error("Failed to start session:", err);
            setError(err.message || "An unexpected error occurred compiling your questions");
            toast.error(err.message || "Failed to start interview");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!currentAnswer.trim()) {
            toast.error("Please provide an answer");
            setError("Answer is required");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.post("/api/career/interview/feedback", {
                role,
                question: questions[currentQuestionIdx],
                answer: currentAnswer,
                difficulty
            });

            if (response.ok) {
                const data = await response.json();

                if (!data || typeof data !== 'object') {
                    throw new Error("Invalid response from server");
                }

                setFeedback(data);
                const newHistoryItem = {
                    question: questions[currentQuestionIdx],
                    answer: currentAnswer,
                    feedback: data
                };
                setHistory([...history, newHistoryItem]);

                // Save to persistent history
                await apiClient.post("/api/career/history", {
                    type: "interview",
                    title: `${role} Interview - Q${currentQuestionIdx + 1}`,
                    data: newHistoryItem,
                    metadata: { role, difficulty, questionIdx: currentQuestionIdx }
                });
                fetchHistory(); // Refresh list

                toast.success("Answer evaluated!");
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || "Failed to evaluate answer";
                setError(errorMessage);
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("Interview feedback error:", error);
            const errorMessage = error.message || "An error occurred during evaluation. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentQuestionIdx < questions.length - 1) {
            setCurrentQuestionIdx(currentQuestionIdx + 1);
            setCurrentAnswer("");
            setFeedback(null);
            setError(null);
        } else {
            toast.success("Interview session completed!");
        }
    };

    const handleReset = () => {
        setIsStarted(false);
        setRole("");
        setHistory([]);
        setFeedback(null);
        setCurrentAnswer("");
        setCurrentQuestionIdx(0);
        setError(null);
    };

    const loadHistoryItem = (item) => {
        setRole(item.metadata?.role || "");
        setDifficulty(item.metadata?.difficulty || "intermediate");
        setQuestions([item.data.question]);
        setCurrentQuestionIdx(0);
        setHistory([item.data]);
        setFeedback(item.data.feedback);
        setCurrentAnswer(item.data.answer);
        setIsStarted(true);
    };

    const deleteHistoryItem = async (id, e) => {
        e.stopPropagation();
        try {
            const response = await apiClient.delete(`/api/career/history?id=${id}`);
            if (response.ok) {
                toast.success("History item deleted");
                setPersistentHistory(prev => prev.filter(item => item._id !== id));
            }
        } catch (err) {
            toast.error("Failed to delete history item");
        }
    };

    if (!isStarted) {
        return (
            <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12 bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-rose-50/50 dark:from-purple-950 dark:via-pink-950/50 dark:to-rose-950/50 min-h-screen">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10 sm:mb-12"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25">
                        <MessageSquare className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4 text-slate-900 dark:text-white">
                        AI Mock Interview
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Practice your interview skills with AI-powered feedback tailored to your desired role.
                    </p>
                </motion.div>

                <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-rose-950/30 shadow-xl shadow-purple-500/10">
                    <CardContent className="p-6 sm:p-8 lg:p-10 space-y-6">
                        <div>
                            <label className="block text-sm font-bold mb-3 text-slate-900 dark:text-white">
                                What role are you applying for?
                            </label>
                            <input
                                type="text"
                                value={role}
                                onChange={(e) => {
                                    setRole(e.target.value);
                                    setError(null);
                                }}
                                placeholder="e.g. Senior Software Engineer, Product Manager"
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-base"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-3 text-slate-900 dark:text-white">
                                Difficulty Level
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {['beginner', 'intermediate', 'advanced'].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => {
                                            setDifficulty(d);
                                            setError(null);
                                        }}
                                        className={`py-3.5 rounded-xl border-2 text-sm font-bold capitalize transition-all ${difficulty === d
                                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-600 shadow-lg shadow-purple-500/25"
                                            : "hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                                            }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        )}

                        <Button
                            onClick={handleStart}
                            disabled={!role.trim() || loading}
                            className="w-full py-6 rounded-xl text-base sm:text-lg font-bold shadow-lg shadow-purple-500/25 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Generating AI Questions...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5 mr-2 fill-current" />
                                    Start Practice Session
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* History Section */}
                {persistentHistory.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12 space-y-6"
                    >
                        <div className="flex items-center gap-2 px-1">
                            <Clock size={16} className="text-slate-400 dark:text-slate-500" />
                            <span className="text-xs font-black text-slate-500 dark:text-slate-400">Past Sessions</span>
                            <span className="ml-auto text-xs font-bold text-slate-400 dark:text-slate-500">{persistentHistory.length} results</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {persistentHistory.map((item) => (
                                <div
                                    key={item._id}
                                    onClick={() => loadHistoryItem(item)}
                                    className="group relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-purple-400 dark:hover:border-purple-600 transition-all cursor-pointer shadow-lg shadow-purple-500/5"
                                >
                                    <button
                                        onClick={(e) => deleteHistoryItem(item._id, e)}
                                        className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <X size={14} />
                                    </button>
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                                            <Award size={18} className="text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div className="min-w-0 pr-6">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mb-1">
                                                {item.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/30">
                                                    {item.metadata?.difficulty || 'N/A'}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                                                "{item.data.question}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8 bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-rose-50/50 dark:from-purple-950 dark:via-pink-950/50 dark:to-rose-950/50 min-h-screen">
            {/* Main Interview Area */}
            <div className="lg:col-span-2 space-y-6">
                {/* Progress Indicator */}
                <div className="bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                            Question {currentQuestionIdx + 1} of {questions.length}
                        </span>
                        <span className="text-xs font-black bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-lg">
                            {difficulty}
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full transition-all duration-500"
                            style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Question Card */}
                <Card className="border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-rose-900/30 shadow-xl shadow-purple-500/20 overflow-hidden">
                    <CardHeader className="bg-purple-100 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
                        <CardTitle className="text-xl sm:text-2xl font-bold leading-relaxed text-slate-900 dark:text-white">
                            {questions[currentQuestionIdx]}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <textarea
                            value={currentAnswer}
                            onChange={(e) => {
                                setCurrentAnswer(e.target.value);
                                setError(null);
                            }}
                            placeholder="Type your response here... Be specific and use examples from your experience."
                            className="w-full h-48 sm:h-56 bg-transparent border-none focus:ring-0 resize-none outline-none text-base leading-relaxed text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            disabled={!!feedback || loading}
                        />
                    </CardContent>
                    <footer className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                        {!feedback ? (
                            <Button
                                onClick={handleSubmitAnswer}
                                disabled={loading || !currentAnswer.trim()}
                                className="rounded-xl px-6 sm:px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Evaluating...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Submit for Feedback
                                    </>
                                )}
                            </Button>
                        ) : (
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setFeedback(null);
                                        setError(null);
                                    }}
                                    className="rounded-xl px-6"
                                >
                                    Refine Answer
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    className="rounded-xl px-6 sm:px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                >
                                    {currentQuestionIdx < questions.length - 1 ? "Next Question" : "Complete Session"}
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        )}
                    </footer>
                </Card>

                {/* Error Display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3"
                    >
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </motion.div>
                )}

                {/* Feedback Card */}
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-b border-amber-200 dark:border-amber-800 py-4">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                        <Sparkles className="w-5 h-5 text-amber-500" />
                                        AI Evaluation
                                    </CardTitle>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 leading-none">Score</span>
                                        <span className={`text-3xl font-black ${feedback.score >= 80 ? "text-emerald-500" :
                                            feedback.score >= 60 ? "text-amber-500" :
                                                "text-red-500"
                                            }`}>
                                            {feedback.score || 0}
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <p className="text-sm font-medium leading-relaxed italic text-slate-600 dark:text-slate-400 border-l-4 border-purple-500 pl-4 py-1">
                                    "{feedback.feedback || 'No feedback available'}"
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                            Strengths
                                        </h4>
                                        <div className="space-y-2">
                                            {(feedback.strengths || []).map((s, i) => (
                                                <div key={i} className="text-xs p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 text-slate-700 dark:text-slate-300">
                                                    {s}
                                                </div>
                                            ))}
                                            {(!feedback.strengths || feedback.strengths.length === 0) && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 italic">No strengths identified</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">Communication Style</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 leading-relaxed">
                                            {feedback.communicationStyle || 'No communication feedback available'}
                                        </p>
                                    </div>
                                </div>

                                {feedback.improvedAnswer && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400">Model Answer</h4>
                                        <div className="text-sm p-4 rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10 leading-relaxed text-slate-700 dark:text-slate-300">
                                            {feedback.improvedAnswer}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                {/* Progress Card */}
                <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-rose-950/30 shadow-lg shadow-purple-500/10">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <Award className="w-5 h-5 text-amber-500" />
                            Session Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500 dark:text-slate-400">Completion</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {Math.round((currentQuestionIdx / questions.length) * 100)}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full transition-all duration-500"
                                    style={{ width: `${(currentQuestionIdx / questions.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="pt-4 space-y-3">
                            {history.length === 0 ? (
                                <p className="text-xs text-center py-8 text-slate-500 dark:text-slate-400 italic">No responses yet</p>
                            ) : (
                                history.map((h, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${h.feedback.score >= 80 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                            "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                            }`}>
                                            {h.feedback.score || 'N/A'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">Question {i + 1}</p>
                                            <p className="text-xs truncate text-slate-700 dark:text-slate-300">{h.question}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-4">
                            <Button
                                variant="ghost"
                                onClick={handleReset}
                                className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg"
                            >
                                <RefreshCw className="w-3 h-3 mr-2" />
                                End and Reset Session
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Tips Card */}
                <Card className="border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100 dark:from-amber-900/30 dark:via-orange-900/30 dark:to-yellow-900/30 shadow-lg shadow-amber-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            Interviewer's Advice
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            For <span className="font-bold">{difficulty}</span> <span className="font-bold">{role || 'role'}</span> interviews, focus on using the <span className="font-bold">STAR</span> method (Situation, Task, Action, Result) for behavioral questions. Be specific about your contributions and the outcomes you delivered.
                        </p>
                    </CardContent>
                </Card>
            </div>
            {/* History Section */}
            {!isStarted && !feedback && persistentHistory.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 pt-12 border-t border-slate-200 dark:border-slate-700 space-y-6"
                >
                    <div className="flex items-center gap-2 px-1">
                        <Clock size={16} className="text-slate-400 dark:text-slate-500" />
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400">Interview History</span>
                        <span className="ml-auto text-xs font-bold text-slate-400 dark:text-slate-500">{persistentHistory.length} sessions</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {persistentHistory.map((item) => (
                            <div
                                key={item._id}
                                onClick={() => {
                                    setRole(item.metadata?.role || "");
                                    setDifficulty(item.metadata?.difficulty || "intermediate");
                                    setFeedback(item.data.feedback);
                                    setQuestions([item.data.question]);
                                    setCurrentQuestionIdx(0);
                                    setIsStarted(true);
                                }}
                                className="group relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-purple-400 dark:hover:border-purple-600 transition-all cursor-pointer shadow-lg shadow-purple-500/5"
                            >
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            const response = await apiClient.delete(`/api/career/history?id=${item._id}`);
                                            if (response.ok) {
                                                toast.success("History item deleted");
                                                setPersistentHistory(prev => prev.filter(h => h._id !== item._id));
                                            }
                                        } catch (err) {
                                            toast.error("Failed to delete history item");
                                        }
                                    }}
                                    className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all z-10"
                                >
                                    <X size={14} />
                                </button>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                                        <MessageSquare size={18} className="text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="min-w-0 pr-6">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mb-1">
                                            {item.title}
                                        </h4>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/30">
                                                Score: {item.data.feedback.score}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                            {item.data.question}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default InterviewPrep;
