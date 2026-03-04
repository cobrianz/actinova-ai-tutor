"use client";

import React, { useState } from "react";
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
    RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";

const sampleQuestions = [
    "Tell me about a time you had to handle a difficult situation with a coworker.",
    "What is your greatest professional achievement and how did you achieve it?",
    "How do you handle pressure and tight deadlines?",
    "Why should we hire you for this position?",
    "Tell me about a mistake you made and what you learned from it."
];

const InterviewPrep = () => {
    const [role, setRole] = useState("");
    const [difficulty, setDifficulty] = useState("intermediate");
    const [isStarted, setIsStarted] = useState(false);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [history, setHistory] = useState([]);

    const handleStart = () => {
        if (!role.trim()) {
            toast.error("Please enter the role you're interviewing for");
            return;
        }
        setIsStarted(true);
        setCurrentQuestionIdx(0);
        setHistory([]);
        setFeedback(null);
    };

    const handleSubmitAnswer = async () => {
        if (!currentAnswer.trim()) {
            toast.error("Please provide an answer");
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post("/api/career/interview/feedback", {
                role,
                question: sampleQuestions[currentQuestionIdx],
                answer: currentAnswer,
                difficulty
            });

            if (response.ok) {
                const data = await response.json();
                setFeedback(data);
                setHistory([...history, {
                    question: sampleQuestions[currentQuestionIdx],
                    answer: currentAnswer,
                    feedback: data
                }]);
                toast.success("Answer evaluated!");
            } else {
                toast.error("Failed to evaluate answer");
            }
        } catch (error) {
            toast.error("An error occurred during evaluation");
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentQuestionIdx < sampleQuestions.length - 1) {
            setCurrentQuestionIdx(currentQuestionIdx + 1);
            setCurrentAnswer("");
            setFeedback(null);
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
    };

    if (!isStarted) {
        return (
            <div className="max-w-3xl mx-auto py-12 px-4">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold mb-3">AI Mock Interview</h1>
                    <p className="text-lg text-muted-foreground">
                        Practice your interview skills with AI-powered feedback tailored to your desired role.
                    </p>
                </div>

                <Card className="border-border shadow-xl">
                    <CardContent className="p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">What role are you applying for?</label>
                            <input
                                type="text"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="e.g. Senior Software Engineer, Product Manager"
                                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Difficulty Level</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['beginner', 'intermediate', 'advanced'].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficulty(d)}
                                        className={`py-3 rounded-xl border text-sm font-medium capitalize transition-all ${difficulty === d
                                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                                : "hover:bg-muted border-border text-muted-foreground"
                                            }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={handleStart}
                            className="w-full py-6 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 mt-4"
                        >
                            <Play className="w-5 h-5 mr-2 fill-current" />
                            Start Practice Session
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden">
                    <CardHeader className="bg-primary/10 border-b border-primary/20">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Question {currentQuestionIdx + 1} of {sampleQuestions.length}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded">{difficulty}</span>
                        </div>
                        <CardTitle className="text-xl font-bold mt-2 leading-relaxed">
                            {sampleQuestions[currentQuestionIdx]}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <textarea
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            placeholder="Type your response here..."
                            className="w-full h-48 bg-transparent border-none focus:ring-0 resize-none outline-none text-base leading-relaxed"
                            disabled={!!feedback || loading}
                        />
                    </CardContent>
                    <footer className="p-4 bg-muted/30 border-t border-border flex justify-end">
                        {!feedback ? (
                            <Button
                                onClick={handleSubmitAnswer}
                                disabled={loading || !currentAnswer.trim()}
                                className="rounded-xl px-8"
                            >
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                Submit for Feedback
                            </Button>
                        ) : (
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setFeedback(null)}
                                    className="rounded-xl px-6"
                                >
                                    Refine Answer
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    className="rounded-xl px-8"
                                >
                                    {currentQuestionIdx < sampleQuestions.length - 1 ? "Next Question" : "Complete Session"}
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        )}
                    </footer>
                </Card>

                {feedback && (
                    <Card className="border-border animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border py-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    AI Evaluation
                                </CardTitle>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground leading-none">Score</span>
                                    <span className={`text-2xl font-black ${feedback.score >= 80 ? "text-green-500" : feedback.score >= 60 ? "text-amber-500" : "text-destructive"
                                        }`}>{feedback.score}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <p className="text-sm font-medium leading-relaxed italic text-muted-foreground border-l-4 border-primary/20 pl-4 py-1">
                                "{feedback.feedback}"
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                        Strengths
                                    </h4>
                                    <div className="space-y-1">
                                        {feedback.strengths.map((s, i) => (
                                            <div key={i} className="text-xs p-2 rounded bg-green-500/5 border border-green-500/10">
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expert Tip</h4>
                                    <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border">
                                        {feedback.communicationStyle}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Model Answer</h4>
                                <div className="text-sm p-4 rounded-xl border border-primary/20 bg-primary/5 leading-relaxed">
                                    {feedback.improvedAnswer}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="space-y-6">
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-500" />
                            Session Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Completion</span>
                                <span className="font-bold">{Math.round((currentQuestionIdx) / sampleQuestions.length * 100)}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-primary h-full transition-all duration-500"
                                    style={{ width: `${(currentQuestionIdx) / sampleQuestions.length * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="pt-4 space-y-3">
                            {history.length === 0 ? (
                                <p className="text-xs text-center py-8 text-muted-foreground italic">No responses yet</p>
                            ) : (
                                history.map((h, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${h.feedback.score >= 80 ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary"
                                            }`}>
                                            {h.feedback.score}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">Question {i + 1}</p>
                                            <p className="text-[11px] truncate text-foreground">{h.question}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-6">
                            <Button
                                variant="ghost"
                                onClick={handleReset}
                                className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg"
                            >
                                <RefreshCw className="w-3 h-3 mr-2" />
                                End and Reset Session
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border bg-amber-500/5 border-amber-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            Interviewer's Advice
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            For {difficulty} {role} interviews, focus on using the **STAR** method (Situation, Task, Action, Result) for behavioral questions. Be specific about your contributions and the outcomes you delivered.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default InterviewPrep;
