"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    Target,
    Sparkles,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    BookOpen,
    Map,
    ChevronRight,
    Loader2,
    Briefcase,
    AlertCircle,
    X,
    ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";

const SkillGapAnalysis = () => {
    const [currentSkills, setCurrentSkills] = useState("");
    const [targetRole, setTargetRole] = useState("");
    const [careerGoals, setCareerGoals] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleAnalyze = async () => {
        if (!currentSkills.trim() || !targetRole.trim()) {
            toast.error("Please provide both current skills and target role");
            setError("Current skills and target role are required");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.post("/api/career/skill-gap", {
                currentSkills,
                targetRole,
                careerGoals: careerGoals || undefined
            });

            if (response.ok) {
                const data = await response.json();
                
                if (!data || typeof data !== 'object') {
                    throw new Error("Invalid response from server");
                }

                setResult(data);
                toast.success("Skill gap analysis complete!");
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || "Failed to perform analysis";
                setError(errorMessage);
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("Skill gap analysis error:", error);
            const errorMessage = error.message || "An error occurred during analysis. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 space-y-6 sm:space-y-8 md:space-y-10 bg-gradient-to-br from-indigo-50/50 via-blue-50/50 to-cyan-50/50 dark:from-indigo-950 dark:via-blue-950/50 dark:to-cyan-950/50 min-h-screen">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
                            Skill Gap Analysis
                        </h1>
                        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
                            Bridge the gap between where you are and where you want to be
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

            {!result ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                    <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                        {/* Current Skills */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-950/30 dark:via-blue-950/30 dark:to-cyan-950/30 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col gap-5 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all shadow-lg hover:shadow-xl shadow-indigo-500/10"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
                                    <Briefcase size={20} className="text-white" />
                                </div>
                                <div>
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Current Skills & Experience</span>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">List your technical skills, certifications, and achievements</p>
                                </div>
                            </div>
                            <textarea
                                value={currentSkills}
                                onChange={(e) => {
                                    setCurrentSkills(e.target.value);
                                    setError(null);
                                }}
                                placeholder="List your technical skills, certifications, and key work achievements...&#10;&#10;Example:&#10;• JavaScript, React, Node.js&#10;• AWS Certified Solutions Architect&#10;• Led team of 5 developers&#10;• 5 years of full-stack development"
                                className="w-full h-48 sm:h-56 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                            />
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>{currentSkills.length} characters</span>
                                {currentSkills.length > 0 && (
                                    <button
                                        onClick={() => {
                                            setCurrentSkills("");
                                            setError(null);
                                        }}
                                        className="text-red-500 hover:text-red-600 dark:hover:text-red-400"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </motion.div>

                        {/* Target Role and Career Goals */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-2 border-purple-200 dark:border-purple-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col gap-5 hover:border-purple-400 dark:hover:border-purple-600 transition-all shadow-lg hover:shadow-xl shadow-purple-500/10"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/25">
                                        <TrendingUp size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Target Role</span>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Your dream position</p>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={targetRole}
                                    onChange={(e) => {
                                        setTargetRole(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="e.g. Senior Data Scientist, Tech Lead"
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-purple-400 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col gap-5 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-lg hover:shadow-xl shadow-blue-500/10"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                        <Sparkles size={20} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Career Goals</span>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Optional: Your aspirations</p>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={careerGoals}
                                    onChange={(e) => {
                                        setCareerGoals(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="e.g. Lead a team, Move to Tech, Start a company"
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                            </motion.div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 border-2 border-indigo-300 dark:border-indigo-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg shadow-indigo-500/10"
                        >
                            <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-100 mb-6 uppercase tracking-wider">Why use this?</h3>
                            <ul className="space-y-5">
                                {[
                                    "Discover exactly what recruiters in your target field are looking for.",
                                    "Prioritize your learning budget and time on high-impact skills.",
                                    "Get an AI-generated learning path tailored to your specific background."
                                ].map((tip, i) => (
                                    <li key={i} className="flex gap-4 items-start">
                                        <div className="w-6 h-6 rounded-full bg-indigo-200 dark:bg-indigo-800/50 flex items-center justify-center shrink-0 mt-0.5">
                                            <CheckCircle size={14} className="text-indigo-700 dark:text-indigo-300" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <Button
                            onClick={handleAnalyze}
                            disabled={loading || !currentSkills.trim() || !targetRole.trim()}
                            className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-base shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                                    Analyzing Gaps...
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="w-5 h-5 mr-3" />
                                    Perform Analysis
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8 sm:space-y-10 border-t border-slate-200 dark:border-slate-700 pt-8 sm:pt-10"
                >
                    {/* Match Percentage and Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
                        <motion.div variants={itemVariants} className="lg:col-span-1">
                            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center h-full shadow-xl shadow-indigo-500/25 relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_white_10%,_transparent_70%)] opacity-10" />
                                <div className="relative z-10 w-full">
                                    <div className="text-xs font-black uppercase tracking-wider text-indigo-200 mb-3">Market Sync</div>
                                    <div className="text-6xl sm:text-7xl font-black mb-4 tracking-tighter">
                                        {result.matchPercentage || 0}%
                                    </div>
                                    <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden mb-4">
                                        <div
                                            className="h-full bg-white transition-all duration-1000"
                                            style={{ width: `${Math.min(result.matchPercentage || 0, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                                        Your profile is <span className="font-bold">{result.matchPercentage || 0}%</span> aligned with the market requirements for <span className="font-bold">{targetRole}</span>.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="lg:col-span-3">
                            <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-950/30 dark:via-blue-950/30 dark:to-purple-950/30 border-2 border-indigo-200 dark:border-indigo-800 rounded-3xl p-8 sm:p-10 h-full shadow-lg shadow-indigo-500/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                        <TrendingUp size={20} className="text-white" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Market Analysis</span>
                                </div>
                                <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-300 leading-relaxed font-semibold border-l-4 border-indigo-500 pl-6 py-1">
                                    {result.analysis || "No analysis available"}
                                </p>
                                {result.marketInsights && (
                                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700/50">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Sparkles size={16} className="text-indigo-500" />
                                            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Market Insights</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                            {result.marketInsights}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Skill Gaps and Learning Path */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                        {/* Critical Skill Gaps */}
                        <motion.div variants={itemVariants}>
                            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-red-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-3xl overflow-hidden h-full flex flex-col shadow-lg shadow-amber-500/10">
                                <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                            <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Critical Skill Gaps</span>
                                    </div>
                                </div>
                                <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-700/50 overflow-y-auto">
                                    {(result.topGaps || []).map((gap, i) => (
                                        <div key={i} className="p-6 sm:p-8 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">{gap.skill || 'Unknown Skill'}</h4>
                                                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                                                    gap.priority === 'critical' 
                                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/30' 
                                                        : gap.priority === 'high'
                                                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30'
                                                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30'
                                                }`}>
                                                    {gap.priority || 'medium'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                                {gap.description || 'No description available'}
                                            </p>
                                        </div>
                                    ))}
                                    {(!result.topGaps || result.topGaps.length === 0) && (
                                        <div className="p-8 text-center">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 italic">No skill gaps identified</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Learning Path */}
                        <motion.div variants={itemVariants}>
                            <div className="bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 border-2 border-indigo-300 dark:border-indigo-700 rounded-3xl p-8 sm:p-10 h-full shadow-lg shadow-indigo-500/10">
                                <div className="flex items-center gap-3 mb-8 sm:mb-10">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                        <Map size={20} className="text-white" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Learning Path</span>
                                </div>
                                <div className="space-y-8 sm:space-y-10 relative ml-4">
                                    <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-indigo-200 dark:bg-indigo-800/30" />
                                    {(result.learningPath || []).map((step, i) => (
                                        <div key={i} className="relative pl-12 sm:pl-14 group">
                                            <div className="absolute -left-2 top-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 border-2 border-indigo-300 dark:border-indigo-700 flex items-center justify-center text-xs font-black text-indigo-700 dark:text-indigo-300 z-10 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-lg shadow-indigo-500/25">
                                                {i + 1}
                                            </div>
                                            <div className="pt-2">
                                                <div className="text-xs font-black text-indigo-500 uppercase tracking-wider mb-1">{step.topic || 'General'}</div>
                                                <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 mb-2">{step.step || 'Step'}</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                                    {step.rationale || 'No rationale provided'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!result.learningPath || result.learningPath.length === 0) && (
                                        <div className="pl-12 sm:pl-14">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 italic">No learning path available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Foundational Skills */}
                    {result.foundationalSkills && result.foundationalSkills.length > 0 && (
                        <motion.div variants={itemVariants}>
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border-2 border-emerald-200 dark:border-emerald-800/30 rounded-3xl p-8 sm:p-10">
                                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Foundational Strengths</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {result.foundationalSkills.map((skill, i) => (
                                        <span key={i} className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 border-2 border-emerald-300 dark:border-emerald-700 font-bold text-xs text-emerald-700 dark:text-emerald-300 shadow-lg shadow-emerald-500/20">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Reset Button */}
                    <motion.div variants={itemVariants} className="flex justify-center pt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setResult(null);
                                setError(null);
                            }}
                            className="flex items-center gap-3 h-12 px-8 rounded-2xl bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 border-2 border-indigo-300 dark:border-indigo-700 text-sm font-bold text-indigo-700 dark:text-indigo-300 hover:border-indigo-500 hover:text-indigo-800 dark:hover:text-indigo-200 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            Reset Analysis <ArrowRight size={16} />
                        </Button>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default SkillGapAnalysis;
