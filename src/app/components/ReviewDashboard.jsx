"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Zap,
    RotateCcw,
    CheckCircle,
    ChevronRight,
    Loader2,
    BookOpen,
    Trophy,
    Calendar,
    Brain
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";

const ReviewDashboard = () => {
    const [dueItems, setDueItems] = useState({ cards: [], quizzes: [], totalDue: 0 });
    const [loading, setLoading] = useState(true);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [stats, setStats] = useState({ reviewed: 0, streak: 0 });

    useEffect(() => {
        fetchDueItems();
    }, []);

    const fetchDueItems = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get("/api/srs/due");
            if (response.ok) {
                const data = await response.json();
                setDueItems(data);
            }
        } catch (error) {
            toast.error("Failed to load review items");
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (quality) => {
        const item = dueItems.cards[currentIdx];
        if (!item) return;

        try {
            const response = await apiClient.post("/api/srs/review", {
                type: "flashcard",
                id: item.cardId,
                setId: item.setId,
                quality
            });

            if (response.ok) {
                setStats(prev => ({ ...prev, reviewed: prev.reviewed + 1 }));
                if (currentIdx < dueItems.cards.length - 1) {
                    setCurrentIdx(prev => prev + 1);
                    setShowAnswer(false);
                } else {
                    // All cards done, check for quizzes or finish
                    setDueItems(prev => ({ ...prev, cards: [] }));
                    setCurrentIdx(0);
                }
            }
        } catch (error) {
            toast.error("Failed to submit review");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground font-medium">Syncing your learning progress...</p>
            </div>
        );
    }

    const itemsToReview = dueItems.cards; // Starting with cards for now
    const currentItem = itemsToReview[currentIdx];

    if (!currentItem && dueItems.quizzes.length === 0) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="text-5xl font-black mb-4">You're All Caught Up!</h1>
                <p className="text-xl text-muted-foreground mb-12">
                    Excellent work. You've completed all your scheduled reviews for today.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                    <Card className="p-6 bg-muted/30 border-none rounded-3xl">
                        <div className="text-3xl font-black mb-1">{stats.reviewed}</div>
                        <div className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Reviewed Today</div>
                    </Card>
                    <Card className="p-6 bg-muted/30 border-none rounded-3xl">
                        <div className="text-3xl font-black mb-1">0</div>
                        <div className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Pending</div>
                    </Card>
                    <Card className="p-6 bg-primary/10 border-none rounded-3xl border border-primary/20">
                        <div className="text-3xl font-black text-primary mb-1">100%</div>
                        <div className="text-sm text-primary/70 font-bold uppercase tracking-widest">Ready</div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        <Brain className="text-primary w-10 h-10" />
                        Daily Review Sessions
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">
                        Strengthen your long-term memory with evidence-based active recall.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-muted px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm border border-border">
                        <Zap className="text-amber-500 fill-amber-500" size={20} />
                        <span className="font-black text-lg">{dueItems.totalDue - stats.reviewed} Remaining</span>
                    </div>
                </div>
            </header>

            <div className="relative">
                {/* Progress Bar */}
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-12 shadow-inner">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                        style={{ width: `${(stats.reviewed / dueItems.totalDue) * 100}%` }}
                    />
                </div>

                {currentItem && (
                    <div className="perspective-1000">
                        <div className={`relative transition-all duration-700 transform-style-3d ${showAnswer ? '[transform:rotateY(180deg)]' : ''}`}>
                            {/* Front Side */}
                            <Card className={`w-full min-h-[400px] flex flex-col items-center justify-center p-12 rounded-[3rem] border-2 border-border bg-card shadow-2xl transition-all ${showAnswer ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
                                <div className="absolute top-8 left-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    <BookOpen size={14} />
                                    {currentItem.setTitle}
                                </div>
                                <h3 className="text-3xl md:text-4xl font-black text-center leading-tight">
                                    {currentItem.question}
                                </h3>
                                {!showAnswer && (
                                    <Button
                                        onClick={() => setShowAnswer(true)}
                                        className="mt-16 h-16 px-12 rounded-2xl text-lg font-black gap-2 shadow-xl shadow-primary/20"
                                    >
                                        Reveal Answer
                                        <ChevronRight size={20} />
                                    </Button>
                                )}
                            </Card>

                            {/* Back Side */}
                            <Card className={`absolute inset-0 w-full min-h-[400px] flex flex-col items-center justify-center p-12 rounded-[3rem] border-2 border-primary/30 bg-card shadow-2xl [transform:rotateY(180deg)] transition-all ${showAnswer ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                                <div className="absolute top-8 left-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                                    <CheckCircle size={14} />
                                    The Answer
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center w-full">
                                    <p className="text-3xl md:text-4xl font-black text-center text-primary mb-6">
                                        {currentItem.answer}
                                    </p>
                                    <p className="text-lg text-muted-foreground text-center max-w-2xl leading-relaxed">
                                        {currentItem.explanation}
                                    </p>
                                </div>

                                <div className="mt-12 w-full">
                                    <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">
                                        How well did you know this?
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        {[
                                            { val: 1, label: "Forgot", color: "bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white" },
                                            { val: 2, label: "Hard", color: "bg-orange-500/10 text-orange-600 hover:bg-orange-500 hover:text-white" },
                                            { val: 3, label: "Good", color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white" },
                                            { val: 4, label: "Easy", color: "bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white" },
                                            { val: 5, label: "Perfect", color: "bg-primary/10 text-primary hover:bg-primary hover:text-white" },
                                        ].map((btn) => (
                                            <Button
                                                key={btn.val}
                                                onClick={() => handleReview(btn.val)}
                                                variant="ghost"
                                                className={`h-16 rounded-2xl font-black transition-all border border-transparent hover:scale-105 active:scale-95 ${btn.color}`}
                                            >
                                                {btn.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>

            <footer className="mt-20 border-t border-border pt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <Card className="rounded-3xl p-8 border-none bg-muted/20">
                        <h4 className="flex items-center gap-2 font-black mb-4">
                            <Brain size={18} className="text-primary" />
                            SPACED REPETITION ENGINE
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Our AI uses the SM-2 algorithm to predict when you're about to forget a concept. Reviewing items exactly at this point maximizes your long-term retention.
                        </p>
                    </Card>
                    <Card className="rounded-3xl p-8 border-none bg-primary/5">
                        <h4 className="flex items-center gap-2 font-black mb-4">
                            <Trophy size={18} className="text-amber-500" />
                            WEEKLY GOAL
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            You've maintained your knowledge base for 5 days in a row. Reach 7 days to earn the "Master Recall" badge.
                        </p>
                    </Card>
                </div>
            </footer>

            <style jsx>{`
                .perspective-1000 {
                    perspective: 1500px;
                }
                .transform-style-3d {
                    transform-style: preserve-3d;
                }
                [transform:rotateY(180deg)] {
                    transform: rotateY(180deg);
                }
            `}</style>
        </div>
    );
};

export default ReviewDashboard;
