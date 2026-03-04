"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
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
    Trash2,
    X,
    Download,
    Copy,
    Check,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";

const ResumeBuilder = () => {
    const searchParams = useSearchParams();
    const initialRole = searchParams.get("role") || "";

    const [resumeText, setResumeText] = useState("");
    const [jobDescription, setJobDescription] = useState(initialRole);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);

    const loadHistoryItem = (item) => {
        setResumeText(item.resumeText);
        setJobDescription(item.jobDescription);
        setFeedback(item.feedback);
        setError(null);
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
            setError("Resume text is required");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.post("/api/career/resume/optimize", {
                resumeText,
                jobDescription: jobDescription || undefined
            });

            if (response.ok) {
                const data = await response.json();

                // Validate response structure
                if (!data || typeof data !== 'object') {
                    throw new Error("Invalid response from server");
                }

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
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || "Failed to optimize resume";
                setError(errorMessage);
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("Resume optimization error:", error);
            const errorMessage = error.message || "An error occurred during optimization. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 space-y-6 sm:space-y-8 md:space-y-10 bg-gradient-to-br from-violet-50/50 via-indigo-50/50 to-purple-50/50 dark:from-slate-950 dark:via-indigo-950/50 dark:to-violet-950/50 min-h-screen">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 sm:space-y-3"
            >
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
                            Resume Optimizer
                        </h1>
                        <p className="text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
                            AI-powered ATS optimization and professional enhancement
                        </p>
                    </div>
                </div>
            </motion.header>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3"
                >
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-red-900 dark:text-red-200">Error</p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}

            {!feedback ? (
                <React.Fragment>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                        {/* Resume Input */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 dark:from-violet-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-2 border-violet-200 dark:border-violet-800 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-5 hover:border-violet-400 dark:hover:border-violet-600 transition-all shadow-lg hover:shadow-xl shadow-violet-500/10"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                                    <FileText size={20} className="text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Your Resume</span>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Paste your resume content</p>
                                </div>
                            </div>
                            <textarea
                                value={resumeText}
                                onChange={(e) => {
                                    setResumeText(e.target.value);
                                    setError(null);
                                }}
                                placeholder="Paste your raw resume text here...&#10;&#10;Include:&#10;• Contact information&#10;• Work experience&#10;• Education&#10;• Skills&#10;• Achievements"
                                className="w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-violet-400 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                            />
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>{resumeText.length} characters</span>
                                {resumeText.length > 0 && (
                                    <button
                                        onClick={() => {
                                            setResumeText("");
                                            setError(null);
                                        }}
                                        className="text-red-500 hover:text-red-600 dark:hover:text-red-400"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </motion.div>

                        {/* Job Description Input */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-950/30 dark:via-blue-950/30 dark:to-cyan-950/30 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col gap-5 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all shadow-lg hover:shadow-xl shadow-indigo-500/10"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                    <Target size={20} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Target Role (Optional)</span>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Job description for tailored analysis</p>
                                </div>
                            </div>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => {
                                    setJobDescription(e.target.value);
                                    setError(null);
                                }}
                                placeholder="Paste the job description to tailor the analysis...&#10;&#10;This helps us:&#10;• Match keywords&#10;• Identify skill gaps&#10;• Optimize for ATS&#10;• Provide targeted suggestions"
                                className="w-full h-[400px] sm:h-[450px] p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                            />
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>{jobDescription.length} characters</span>
                                {jobDescription.length > 0 && (
                                    <button
                                        onClick={() => {
                                            setJobDescription("");
                                            setError(null);
                                        }}
                                        className="text-red-500 hover:text-red-600 dark:hover:text-red-400"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-center pt-2 sm:pt-4">
                        <Button
                            onClick={handleOptimize}
                            disabled={loading || !resumeText.trim()}
                            className="h-12 sm:h-14 px-6 sm:px-8 md:px-10 rounded-xl sm:rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2 sm:mr-3" />
                                    <span className="text-xs sm:text-base">Analyzing Resume...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                                    <span className="text-xs sm:text-base">Optimize Resume</span>
                                </>
                            )}
                        </Button>
                    </div>

                    {/* History Section */}
                    {history.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pt-8 sm:pt-10 md:pt-12 border-t border-slate-200 dark:border-slate-700/50 mt-8 sm:mt-10 md:mt-12"
                        >
                            <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 flex-wrap">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center shrink-0">
                                    <Clock size={16} className="sm:w-[18px] sm:h-[18px] text-slate-500 dark:text-slate-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Previous Optimizations</h3>
                                <span className="ml-auto text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                                    {history.length} {history.length === 1 ? "result" : "results"}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                                {history.map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={() => loadHistoryItem(item)}
                                        className="bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-lg transition-all group relative overflow-hidden flex flex-col h-full"
                                    >
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-violet-500/10 transition-colors" />

                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                                                    <Target size={14} className="text-violet-600 dark:text-violet-400" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Target Role</span>
                                            </div>
                                            <button
                                                onClick={(e) => deleteHistoryItem(e, idx)}
                                                className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 line-clamp-1 border-b border-slate-100 dark:border-slate-700/50 pb-4 relative z-10">
                                            {item.jobDescription.split('\n')[0].substring(0, 50) || 'General Optimization'}
                                        </h4>

                                        <div className="flex-1 relative z-10">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="flex-1 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-violet-100 dark:border-violet-800/30">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">ATS Score</div>
                                                    <div className="text-3xl font-black text-violet-600 dark:text-violet-400 leading-none">{item.feedback?.score || 'N/A'}</div>
                                                </div>
                                                <div className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Keywords</div>
                                                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{item.feedback?.atsKeywords?.found?.length || 0}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2">
                                                <Sparkles size={12} className="text-violet-500 shrink-0" />
                                                {item.feedback?.summary?.substring(0, 70) || 'No summary available'}...
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 font-medium relative z-10">
                                            <span>{new Date(item.date).toLocaleDateString()}</span>
                                            <span className="text-violet-500 font-black uppercase tracking-widest text-[10px] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                View Report <ArrowRight size={10} />
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </React.Fragment>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8 sm:space-y-10 border-t border-slate-200 dark:border-slate-700 pt-8 sm:pt-10"
                >
                    {/* Score and Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                        <motion.div variants={itemVariants}>
                            <div className="bg-gradient-to-br from-violet-500 via-indigo-600 to-purple-600 text-white rounded-2xl sm:rounded-3xl h-full flex flex-col items-center justify-center p-6 sm:p-8 md:p-10 text-center relative overflow-hidden shadow-xl shadow-violet-500/25">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_white_10%,_transparent_70%)] opacity-10" />
                                <div className="relative z-10 w-full">
                                    <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                                        <TrendingUp size={16} className="sm:w-[18px] sm:h-[18px] text-violet-200" />
                                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-violet-200">ATS Score</span>
                                    </div>
                                    <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-2 sm:mb-3">
                                        {feedback?.score || 0}
                                    </div>
                                    <div className="h-1.5 sm:h-2 w-full bg-white/20 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white transition-all duration-1000"
                                            style={{ width: `${Math.min(feedback?.score || 0, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="md:col-span-3">
                            <div className="bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 dark:from-violet-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-2 border-violet-200 dark:border-violet-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-10 h-full flex flex-col justify-center shadow-lg shadow-violet-500/10">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                                        <BrainCircuit size={18} className="sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">AI Insight Summary</span>
                                </div>
                                <p className="text-base sm:text-lg md:text-xl text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                                    {feedback?.summary || "No summary available"}
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Strengths and Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                        <motion.div variants={itemVariants}>
                            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30 border-2 border-emerald-200 dark:border-emerald-800 rounded-3xl p-8 h-full shadow-lg shadow-emerald-500/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                        <CheckCircle size={20} className="text-white" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Key Strengths</span>
                                </div>
                                <div className="space-y-3">
                                    {(feedback?.strengths || []).map((s, i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s}</p>
                                        </div>
                                    ))}
                                    {(!feedback?.strengths || feedback.strengths.length === 0) && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">No strengths identified</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 dark:from-rose-950/30 dark:via-pink-950/30 dark:to-orange-950/30 border-2 border-rose-200 dark:border-rose-800 rounded-3xl p-8 h-full shadow-lg shadow-rose-500/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/25">
                                        <AlertCircle size={20} className="text-white" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">Areas for Improvement</span>
                                </div>
                                <div className="space-y-3">
                                    {(feedback?.weaknesses || []).map((w, i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30">
                                            <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0" />
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{w}</p>
                                        </div>
                                    ))}
                                    {(!feedback?.weaknesses || feedback.weaknesses.length === 0) && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">No weaknesses identified</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Optimizations */}
                    {feedback?.optimizations && feedback.optimizations.length > 0 && (
                        <motion.div variants={itemVariants}>
                            <div className="bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 dark:from-violet-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-2 border-violet-200 dark:border-violet-800 rounded-3xl overflow-hidden shadow-lg shadow-violet-500/10">
                                <div className="p-6 sm:p-8 border-b border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                                            <TrendingUp size={20} className="text-white" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Optimization Recommendations</span>
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {feedback.optimizations.map((opt, i) => (
                                        <div key={i} className="p-6 sm:p-8 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <div className="mb-4">
                                                <span className="px-3 py-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-black uppercase tracking-wider rounded-lg">
                                                    {opt.section || 'General'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                                                <div className="space-y-2">
                                                    <div className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Current</div>
                                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 italic text-sm text-slate-600 dark:text-slate-400">
                                                        "{opt.current || 'N/A'}"
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="text-xs font-black text-violet-500 uppercase tracking-wider ml-1">AI Suggestion</div>
                                                    <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/30 text-slate-900 dark:text-white font-semibold text-sm">
                                                        {opt.suggestion || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                            {opt.impact && (
                                                <div className="mt-4 flex items-center gap-2">
                                                    <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                                                    <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Impact: </span>
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{opt.impact}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Keywords */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        <motion.div variants={itemVariants}>
                            <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-3xl p-8 h-full shadow-lg shadow-blue-500/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                                        <Search size={20} className="text-white" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">Keywords & Skills</span>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <div className="text-xs font-black text-emerald-500 mb-3 tracking-wider uppercase ml-1">Matches Found</div>
                                        <div className="flex flex-wrap gap-2">
                                            {(feedback?.atsKeywords?.found || []).map((k, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                                                    {k}
                                                </span>
                                            ))}
                                            {(!feedback?.atsKeywords?.found || feedback.atsKeywords.found.length === 0) && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400 italic">No keywords found</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-rose-500 mb-3 tracking-wider uppercase ml-1">Missing Critical Keywords</div>
                                        <div className="flex flex-wrap gap-2">
                                            {(feedback?.atsKeywords?.missing || []).map((k, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider rounded-lg border border-rose-100 dark:border-rose-800/30">
                                                    {k}
                                                </span>
                                            ))}
                                            {(!feedback?.atsKeywords?.missing || feedback.atsKeywords.missing.length === 0) && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400 italic">All keywords matched!</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Action Items */}
                        <motion.div variants={itemVariants}>
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 h-full relative overflow-hidden shadow-xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                            <ArrowRight size={20} className="text-white" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-300">Action Items</span>
                                    </div>
                                    <div className="space-y-3">
                                        {(feedback?.actionItems || []).map((item, i) => (
                                            <div key={i} className="flex items-start gap-4">
                                                <div className="w-6 h-6 rounded-lg bg-white/10 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                                                    {i + 1}
                                                </div>
                                                <p className="text-sm font-medium text-slate-200 leading-relaxed">
                                                    {item}
                                                </p>
                                            </div>
                                        ))}
                                        {(!feedback?.actionItems || feedback.actionItems.length === 0) && (
                                            <p className="text-sm text-slate-400 italic">No action items available</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Reset Button */}
                    <motion.div variants={itemVariants} className="flex justify-center pt-2 sm:pt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setFeedback(null);
                                setError(null);
                            }}
                            className="flex items-center gap-2 sm:gap-3 h-11 sm:h-12 px-6 sm:px-8 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all w-full sm:w-auto"
                        >
                            <span className="text-xs sm:text-sm">Analyze Another Resume</span>
                            <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                        </Button>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default ResumeBuilder;
