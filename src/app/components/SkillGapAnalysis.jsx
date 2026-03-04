"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    Briefcase
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";

const SkillGapAnalysis = () => {
    const [currentSkills, setCurrentSkills] = useState("");
    const [targetRole, setTargetRole] = useState("");
    const [careerGoals, setCareerGoals] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleAnalyze = async () => {
        if (!currentSkills.trim() || !targetRole.trim()) {
            toast.error("Please provide both current skills and target role");
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post("/api/career/skill-gap", {
                currentSkills,
                targetRole,
                careerGoals
            });

            if (response.ok) {
                const data = await response.json();
                setResult(data);
                toast.success("Skill gap analysis complete!");
            } else {
                toast.error("Failed to perform analysis");
            }
        } catch (error) {
            toast.error("An error occurred during analysis");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
            <header>
                <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">Skill Gap Analysis</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mt-3 max-w-xl font-medium leading-relaxed">
                    Bridge the gap between where you are and where you want to be. Our AI analyzes market requirements to create your personal roadmap.
                </p>
            </header>

            {!result ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-7 flex flex-col gap-5 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                                    <Briefcase size={18} className="text-violet-600 dark:text-violet-400" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Current Skills & Experience</span>
                            </div>
                            <textarea
                                value={currentSkills}
                                onChange={(e) => setCurrentSkills(e.target.value)}
                                placeholder="List your technical skills, certifications, and key work achievements..."
                                className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-violet-400 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-7 flex flex-col gap-5 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                        <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Target Role</span>
                                </div>
                                <input
                                    type="text"
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    placeholder="e.g. Senior Data Scientist"
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                            </div>

                            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-7 flex flex-col gap-5 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                        <Sparkles size={18} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Career Goals</span>
                                </div>
                                <input
                                    type="text"
                                    value={careerGoals}
                                    onChange={(e) => setCareerGoals(e.target.value)}
                                    placeholder="e.g. Lead a team, Move to Tech"
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/30 rounded-3xl p-8">
                            <h3 className="text-sm font-black text-violet-900 dark:text-violet-100 mb-6 uppercase tracking-wider">Why use this?</h3>
                            <ul className="space-y-5">
                                <li className="flex gap-4 items-start">
                                    <div className="w-6 h-6 rounded-full bg-violet-200 dark:bg-violet-800/50 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle size={12} className="text-violet-700 dark:text-violet-300" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">Discover exactly what recruiters in your target field are looking for.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="w-6 h-6 rounded-full bg-violet-200 dark:bg-violet-800/50 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle size={12} className="text-violet-700 dark:text-violet-300" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">Prioritize your learning budget and time on high-impact skills.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="w-6 h-6 rounded-full bg-violet-200 dark:bg-violet-800/50 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle size={12} className="text-violet-700 dark:text-violet-300" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">Get an AI-generated learning path tailored to your specific background.</span>
                                </li>
                            </ul>
                        </div>

                        <Button
                            onClick={handleAnalyze}
                            disabled={loading || !currentSkills.trim() || !targetRole.trim()}
                            className="w-full h-14 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <TrendingUp className="w-5 h-5 mr-3" />}
                            {loading ? "Analyzing Gaps..." : "Perform Analysis"}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 border-t border-slate-200 dark:border-slate-700 pt-10">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1 bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-3xl p-10 flex flex-col items-center justify-center text-center h-full shadow-lg shadow-violet-500/10">
                            <div className="text-[10px] font-black uppercase tracking-widest text-violet-200 mb-3">Market Sync</div>
                            <div className="text-7xl font-black mb-4 tracking-tighter">{result.matchPercentage}%</div>
                            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden mb-6">
                                <div
                                    className="h-full bg-white transition-all duration-1000"
                                    style={{ width: `${result.matchPercentage}%` }}
                                />
                            </div>
                            <p className="text-xs text-violet-100 leading-relaxed font-medium">
                                Your profile is {result.matchPercentage}% aligned with the market requirements for **{targetRole}**.
                            </p>
                        </div>

                        <div className="lg:col-span-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                    <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Market Analysis</span>
                            </div>
                            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-bold border-l-2 border-indigo-500 pl-6 py-1">
                                {result.analysis}
                            </p>
                            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={14} className="text-violet-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Market Insights</span>
                                </div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {result.marketInsights}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden h-full flex flex-col">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Critical Skill Gaps</span>
                                </div>
                            </div>
                            <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-700/50">
                                {result.topGaps.map((gap, i) => (
                                    <div key={i} className="p-8 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{gap.skill}</h4>
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${gap.priority === 'critical' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/30' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30'
                                                }`}>
                                                {gap.priority}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                            {gap.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-violet-50/50 dark:bg-violet-900/5 border border-violet-100 dark:border-violet-800/20 rounded-3xl p-10 h-full">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                    <Map size={18} className="text-violet-600 dark:text-violet-400" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Recommendation Path</span>
                            </div>
                            <div className="space-y-10 relative ml-4">
                                <div className="absolute left-5 top-5 bottom-5 w-px bg-violet-200 dark:bg-violet-800/30" />
                                {result.learningPath.map((step, i) => (
                                    <div key={i} className="relative pl-14 group">
                                        <div className="absolute -left-2 top-0 w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800/50 flex items-center justify-center text-[11px] font-black text-violet-600 dark:text-violet-400 z-10 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 transition-all shadow-sm">
                                            {i + 1}
                                        </div>
                                        <div className="pt-2">
                                            <div className="text-[10px] font-black text-violet-500 uppercase tracking-[0.15em] mb-1">{step.topic}</div>
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">{step.step}</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                                {step.rationale}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-3xl p-10 mt-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">Foundational Strengths</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {result.foundationalSkills.map((skill, i) => (
                                <span key={i} className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-800/30 font-bold text-xs text-emerald-700 dark:text-emerald-400 shadow-sm">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-center pt-8">
                        <Button
                            variant="outline"
                            onClick={() => setResult(null)}
                            className="flex items-center gap-3 h-12 px-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-700 dark:text-slate-300 hover:border-violet-400 hover:text-violet-600 transition-all"
                        >
                            Reset Analysis
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillGapAnalysis;
