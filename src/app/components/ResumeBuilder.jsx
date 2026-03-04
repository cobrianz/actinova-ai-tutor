"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Sparkles,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    Search,
    BrainCircuit,
    ChevronRight,
    Loader2,
    ArrowRight,
    Target,
    Clock,
    Trash2
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";

const ResumeBuilder = () => {
    const [resumeText, setResumeText] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [history, setHistory] = useState([]);

    const loadHistoryItem = (item) => {
        setResumeText(item.resumeText);
        setJobDescription(item.jobDescription);
        setFeedback(item.feedback);
    };

    const deleteHistoryItem = (e, index) => {
        e.stopPropagation();
        const newHistory = [...history];
        newHistory.splice(index, 1);
        setHistory(newHistory);
    };

    const handleOptimize = async () => {
        if (!resumeText.trim()) {
            toast.error("Please provide your resume text");
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post("/api/career/resume/optimize", {
                resumeText,
                jobDescription
            });

            if (response.ok) {
                const data = await response.json();
                setFeedback(data);

                // Add to history
                setHistory(prev => [{
                    resumeText,
                    jobDescription,
                    feedback: data,
                    date: new Date().toISOString()
                }, ...prev]);

                toast.success("Resume optimized successfully!");
            } else {
                toast.error("Failed to optimize resume");
            }
        } catch (error) {
            toast.error("An error occurred during optimization");
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
            <header>
                <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">Resume Optimizer</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mt-3 max-w-xl font-medium leading-relaxed">
                    Bridge the gap between your experience and your dream job. Optimize for ATS and impress hiring managers.
                </p>
            </header>
            {!feedback ? (
                <React.Fragment>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-7 flex flex-col gap-5 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                                    <FileText size={18} className="text-violet-600 dark:text-violet-400" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Your Resume</span>
                            </div>
                            <textarea
                                value={resumeText}
                                onChange={(e) => setResumeText(e.target.value)}
                                placeholder="Paste your raw resume text here..."
                                className="w-full h-[450px] p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-violet-400 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                            />
                        </div>

                        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-7 flex flex-col gap-5 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                                    <Target size={18} className="text-violet-600 dark:text-violet-400" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Target Role</span>
                            </div>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the job description to tailor the analysis..."
                                className="w-full h-[450px] p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-violet-400 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                            />
                        </div>

                        <div className="lg:col-span-2 flex justify-center pt-2">
                            <Button
                                onClick={handleOptimize}
                                disabled={loading || !resumeText.trim()}
                                className="h-14 px-10 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-all"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Sparkles className="w-5 h-5 mr-3" />}
                                {loading ? "Analyzing..." : "Optimize Resume"}
                            </Button>
                        </div>
                    </div>

                    {history.length > 0 && (
                        <div className="pt-16 border-t border-slate-200 dark:border-slate-700/50 mt-16">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center">
                                    <Clock size={16} className="text-slate-500 dark:text-slate-400" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Previous Optimizations</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {history.map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => loadHistoryItem(item)}
                                        className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 cursor-pointer hover:border-violet-300 dark:hover:border-violet-700/50 hover:shadow-lg hover:shadow-violet-500/5 transition-all group relative overflow-hidden flex flex-col h-full"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                                                    <Target size={14} className="text-violet-600 dark:text-violet-400" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Role</span>
                                            </div>
                                            <button
                                                onClick={(e) => deleteHistoryItem(e, idx)}
                                                className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 line-clamp-1 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                                            {item.jobDescription.split('\n')[0].substring(0, 40) || 'General Optimization'}
                                        </h4>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">ATS Score</div>
                                                    <div className="text-2xl font-black text-violet-600 dark:text-violet-400 leading-none">{item.feedback.score}</div>
                                                </div>
                                                <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Keywords</div>
                                                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{item.feedback.atsKeywords.found.length}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2">
                                                <Sparkles size={12} className="text-violet-500 shrink-0" />
                                                {item.feedback.summary.substring(0, 60)}...
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs text-slate-400 font-medium">
                                            <span>{new Date(item.date).toLocaleDateString()}</span>
                                            <span className="text-violet-500 font-black uppercase tracking-widest text-[10px] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                View Report <ArrowRight size={10} />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </React.Fragment>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-10 border-t border-slate-200 dark:border-slate-700 pt-10"
                >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <motion.div variants={itemVariants}>
                            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/10 dark:to-indigo-900/10 border border-violet-200 dark:border-violet-800/30 rounded-3xl h-full flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
                                <div className="relative z-10 w-full">
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <TrendingUp size={16} className="text-violet-500" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-500">ATS Score</span>
                                    </div>
                                    <div className="text-7xl font-black text-slate-900 dark:text-white mb-2">
                                        {feedback.score}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="md:col-span-3">
                            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-10 h-full flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-4">
                                    <BrainCircuit size={16} className="text-violet-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">AI Insight Summary</span>
                                </div>
                                <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-bold">
                                    {feedback.summary}
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.div variants={itemVariants}>
                            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 h-full">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Key Strengths</span>
                                </div>
                                <div className="space-y-4">
                                    {feedback.strengths.map((s, i) => (
                                        <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{s}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 h-full">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                        <AlertCircle size={18} className="text-rose-600 dark:text-rose-400" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Bridge Gaps</span>
                                </div>
                                <div className="space-y-4">
                                    {feedback.weaknesses.map((w, i) => (
                                        <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{w}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div variants={itemVariants}>
                        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden">
                            <div className="p-8 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                        <TrendingUp size={18} className="text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Optimization Blueprint</span>
                                </div>
                            </div>                            <div className="p-0">
                                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {feedback.optimizations.map((opt, i) => (
                                        <div key={i} className="p-8 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <div className="mb-6">
                                                <span className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                    {opt.section}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Implementation</div>
                                                    <div className="p-5 rounded-2xl bg-slate-100 flex items-center justify-center dark:bg-slate-800/80 italic text-slate-500 text-sm">
                                                        "{opt.current}"
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="text-[10px] font-black text-violet-500 uppercase tracking-widest ml-1">AI Suggestion</div>
                                                    <div className="p-5 rounded-2xl bg-violet-50 dark:bg-violet-900/20 text-slate-900 dark:text-white font-bold text-sm">
                                                        {opt.suggestion}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-6 flex items-center gap-2">
                                                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Impact: </span>
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{opt.impact}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.div variants={itemVariants}>
                            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 h-full">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Search size={18} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Keywords & Skills</span>
                                </div>
                                <div className="space-y-8">
                                    <div>
                                        <div className="text-[10px] font-black text-emerald-500 mb-3 tracking-widest uppercase ml-1">Matches Found</div>
                                        <div className="flex flex-wrap gap-2">
                                            {feedback.atsKeywords.found.map((k, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase tracking-wider rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                                                    {k}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-rose-500 mb-3 tracking-widest uppercase ml-1">Missing Criticals</div>
                                        <div className="flex flex-wrap gap-2">
                                            {feedback.atsKeywords.missing.map((k, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 text-[11px] font-black uppercase tracking-wider rounded-lg border border-rose-100 dark:border-rose-800/30">
                                                    {k}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <div className="bg-slate-900 text-white rounded-3xl p-8 h-full relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                            <ArrowRight size={18} className="text-white" />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">Fast-Track Checklist</span>
                                    </div>
                                    <div className="space-y-4">
                                        {feedback.actionItems.map((item, i) => (
                                            <div key={i} className="flex items-start gap-4">
                                                <div className="w-6 h-6 rounded-lg bg-white/10 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                                                    {i + 1}
                                                </div>
                                                <p className="text-sm font-medium text-slate-300">
                                                    {item}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div variants={itemVariants} className="flex justify-center pt-8">
                        <Button
                            variant="outline"
                            onClick={() => setFeedback(null)}
                            className="flex items-center gap-3 h-12 px-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-700 dark:text-slate-300 hover:border-violet-400 hover:text-violet-600 transition-all"
                        >
                            Analyze Another Version <ArrowRight size={16} />
                        </Button>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default ResumeBuilder;

