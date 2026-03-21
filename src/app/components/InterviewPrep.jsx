"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    MessageSquare, Sparkles, Award, CheckCircle, ChevronRight,
    Loader2, Play, Send, RefreshCw, AlertCircle, Clock, X,
    Star, Zap, Brain, Trophy, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";

function InputField({ label, value, onChange, placeholder, rows }) {
    const base = "w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400 transition-all";
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</label>
            {rows
                ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} className={`${base} resize-none`} />
                : <input value={value} onChange={onChange} placeholder={placeholder} className={base} />}
        </div>
    );
}

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const scoreColor = (s) => s >= 80 ? 'text-emerald-500' : s >= 60 ? 'text-lime-500' : 'text-rose-500';
const scoreBg = (s) => s >= 80 ? 'bg-emerald-50 border-emerald-200' : s >= 60 ? 'bg-lime-50 border-lime-200' : 'bg-rose-50 border-rose-200';

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

    React.useEffect(() => { fetchHistory(); }, []);

    const fetchHistory = async () => {
        try {
            const res = await apiClient.get("/api/career/history?type=interview");
            if (res.ok) setPersistentHistory(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleStart = async () => {
        if (!role.trim()) { toast.error("Please enter the role you're interviewing for"); return; }
        setLoading(true); setError(null);
        try {
            const res = await apiClient.post("/api/career/interview/questions", { role, difficulty });
            if (res.ok) {
                const data = await res.json();
                if (data.questions?.length > 0) {
                    setQuestions(data.questions); setIsStarted(true);
                    setCurrentQuestionIdx(0); setHistory([]); setFeedback(null);
                } else throw new Error("Invalid questions format");
            } else {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to generate questions");
            }
        } catch (e) {
            setError(e.message); toast.error(e.message);
        } finally { setLoading(false); }
    };

    const handleSubmitAnswer = async () => {
        if (!currentAnswer.trim()) { toast.error("Please provide an answer"); return; }
        setLoading(true); setError(null);
        try {
            const res = await apiClient.post("/api/career/interview/feedback", {
                role, question: questions[currentQuestionIdx], answer: currentAnswer, difficulty
            });
            if (res.ok) {
                const data = await res.json();
                setFeedback(data);
                const item = { question: questions[currentQuestionIdx], answer: currentAnswer, feedback: data };
                setHistory(prev => [...prev, item]);
                await apiClient.post("/api/career/history", {
                    type: "interview",
                    title: `${role} Interview — Q${currentQuestionIdx + 1}`,
                    data: item,
                    metadata: { role, difficulty, questionIdx: currentQuestionIdx }
                });
                fetchHistory();
                toast.success("Answer evaluated!");
            } else {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to evaluate answer");
            }
        } catch (e) {
            setError(e.message); toast.error(e.message);
        } finally { setLoading(false); }
    };

    const handleNext = () => {
        if (currentQuestionIdx < questions.length - 1) {
            setCurrentQuestionIdx(i => i + 1);
            setCurrentAnswer(""); setFeedback(null); setError(null);
        } else {
            toast.success("Interview session complete! Check your history below.");
            setIsStarted(false);
        }
    };

    const handleReset = () => {
        setIsStarted(false); setRole(""); setHistory([]); setFeedback(null);
        setCurrentAnswer(""); setCurrentQuestionIdx(0); setError(null);
    };

    const loadHistoryItem = (item) => {
        setRole(item.metadata?.role || ""); setDifficulty(item.metadata?.difficulty || "intermediate");
        setQuestions([item.data.question]); setCurrentQuestionIdx(0);
        setHistory([item.data]); setFeedback(item.data.feedback);
        setCurrentAnswer(item.data.answer); setIsStarted(true);
    };

    const deleteHistoryItem = async (id, e) => {
        e.stopPropagation();
        const res = await apiClient.delete(`/api/career/history?id=${id}`);
        if (res.ok) { toast.success("Deleted"); setPersistentHistory(prev => prev.filter(i => i._id !== id)); }
    };

    /* ── Setup screen ── */
    if (!isStarted) return (
        <div className="w-full max-w-full md:max-w-7xl mx-auto px-2 sm:px-4 py-6 md:py-10 min-h-screen bg-slate-50 dark:bg-slate-950">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white">AI Mock Interview</h1>
                <p className="text-slate-500 mt-2">Practice with AI-powered feedback tailored to your desired role</p>
            </motion.div>

            <div className="w-full max-w-full md:max-w-2xl mx-auto">
                <div className="w-full bg-white dark:bg-slate-900 rounded-none md:rounded-3xl border-x-0 md:border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-4 sm:p-6 md:p-8 space-y-6">
                        <InputField label="What role are you applying for? *" value={role} onChange={e => { setRole(e.target.value); setError(null); }} placeholder="e.g. Senior Software Engineer, Product Manager" />

                        <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Difficulty Level</label>
                            <div className="grid grid-cols-3 gap-3">
                                {DIFFICULTIES.map(d => (
                                    <button key={d} onClick={() => setDifficulty(d)}
                                        className={`py-3 rounded-2xl text-sm font-bold capitalize border-2 transition-all ${difficulty === d ? 'bg-green-600 text-white border-green-600 shadow-lg' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-green-300'}`}>
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-5 border border-green-100 dark:border-green-800">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={14} className="text-green-500" />
                                <span className="text-xs font-bold text-green-700 dark:text-green-300">Interview Tips</span>
                            </div>
                            <ul className="space-y-1.5">
                                {["Use the STAR method for behavioral questions.", "Be specific about your contributions and outcomes.", "It's okay to take a moment before answering."].map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-green-600 dark:text-green-400">
                                        <CheckCircle size={12} className="mt-0.5 shrink-0" />{tip}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <Button onClick={handleStart} disabled={!role.trim() || loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-6 rounded-2xl font-bold text-base">
                            {loading ? <><Loader2 className="animate-spin mr-2 w-5 h-5" /> Generating AI Questions...</> : <><Play className="mr-2 w-5 h-5 fill-current" /> Start Practice Session</>}
                        </Button>
                    </div>
                </div>

                {/* History */}
                {persistentHistory.length > 0 && (
                    <div className="mt-10">
                        <div className="flex items-center gap-2 mb-5">
                            <Clock size={16} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Past Sessions</span>
                            <span className="ml-auto text-xs font-bold text-slate-400">{persistentHistory.length} results</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {persistentHistory.map(item => (
                                <div key={item._id} onClick={() => loadHistoryItem(item)}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl p-4 md:p-5 hover:border-green-300 hover:shadow-lg transition-all cursor-pointer group relative">
                                    <button onClick={e => deleteHistoryItem(item._id, e)} className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-rose-500 opacity-100 transition-all"><X size={14} /></button>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center"><MessageSquare size={16} className="text-green-600" /></div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</div>
                                            <div className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleDateString()} · {item.metadata?.difficulty}</div>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${scoreBg(item.data?.feedback?.score || 0)}`}>
                                        Score: {item.data?.feedback?.score || 'N/A'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    /* ── Interview session screen ── */
    return (
        <div className="w-full max-w-full md:max-w-7xl mx-auto px-2 sm:px-4 py-6 md:py-10 min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main area */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Progress */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500">Question {currentQuestionIdx + 1} of {questions.length}</span>
                            <span className="text-[10px] font-black px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full capitalize">{difficulty}</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-green-600 transition-all duration-500 rounded-full" style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }} />
                        </div>
                    </div>

                    {/* Question */}
                    <div className="bg-white dark:bg-slate-900 rounded-none md:rounded-3xl border-x-0 md:border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-green-50 dark:bg-green-900/10">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed">{questions[currentQuestionIdx]}</h2>
                        </div>
                        <div className="p-6">
                            <textarea value={currentAnswer} onChange={e => setCurrentAnswer(e.target.value)} disabled={!!feedback || loading}
                                placeholder="Type your response here... Be specific and use examples from your experience."
                                className="w-full h-48 bg-transparent resize-none outline-none text-sm leading-relaxed text-slate-700 dark:text-slate-300 placeholder:text-slate-400" />
                        </div>
                        <div className="px-6 pb-6 flex justify-end gap-3">
                            {!feedback ? (
                                <Button onClick={handleSubmitAnswer} disabled={loading || !currentAnswer.trim()} className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-8 py-5">
                                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Evaluating...</> : <><Send className="w-4 h-4 mr-2" /> Submit</>}
                                </Button>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={() => { setFeedback(null); setError(null); }} className="rounded-2xl px-6 border-slate-200">Retry</Button>
                                    <Button onClick={handleNext} className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-8">
                                        {currentQuestionIdx < questions.length - 1 ? 'Next Question' : 'Finish'} <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Feedback */}
                    <AnimatePresence>
                        {feedback && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="bg-white dark:bg-slate-900 rounded-none md:rounded-3xl border-x-0 md:border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={18} className="text-lime-500" />
                                            <h3 className="font-bold text-slate-900 dark:text-white">AI Evaluation</h3>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-slate-400">Score</div>
                                            <div className={`text-3xl font-black ${scoreColor(feedback.score || 0)}`}>{feedback.score || 0}</div>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <p className="text-sm text-slate-600 dark:text-slate-400 italic border-l-4 border-green-400 pl-4 py-1">&ldquo;{feedback.feedback}&rdquo;</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                                                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-1.5"><CheckCircle size={13} /> Strengths</h4>
                                                <ul className="space-y-1.5">{(feedback.strengths || []).map((s, i) => <li key={i} className="text-xs text-emerald-700 dark:text-emerald-300">{s}</li>)}</ul>
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3">Communication Style</h4>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{feedback.communicationStyle}</p>
                                            </div>
                                        </div>
                                        {feedback.improvedAnswer && (
                                            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-800">
                                                <h4 className="text-xs font-bold text-green-600 dark:text-green-400 mb-2">Model Answer</h4>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{feedback.improvedAnswer}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                    {/* Session stats */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><Trophy size={16} className="text-lime-500" /> Session Progress</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-500">Completion</span>
                                    <span className="font-bold">{Math.round((currentQuestionIdx / questions.length) * 100)}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${(currentQuestionIdx / questions.length) * 100}%` }} />
                                </div>
                            </div>
                            <div className="space-y-2 pt-2">
                                {history.length === 0
                                    ? <p className="text-xs text-center py-6 text-slate-400 italic">No responses yet</p>
                                    : history.map((h, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${h.feedback?.score >= 80 ? 'bg-emerald-100 text-emerald-600' : 'bg-green-100 text-green-600'}`}>
                                                {h.feedback?.score || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-500">Q{i + 1}</p>
                                                <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{h.question}</p>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                        <Button variant="ghost" onClick={handleReset} className="w-full mt-4 text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl">
                            <RefreshCw size={12} className="mr-2" /> End Session
                        </Button>
                    </div>

                    {/* STAR tips */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={15} className="text-lime-500" />
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Interviewer's Advice</h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            For <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">{difficulty}</span> <span className="font-bold text-slate-700 dark:text-slate-300">{role}</span> interviews, use the <strong>STAR method</strong> — Situation, Task, Action, Result. Be specific about your contributions and measurable outcomes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewPrep;
