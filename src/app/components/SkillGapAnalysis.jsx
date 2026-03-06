"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    Target, Sparkles, CheckCircle, AlertTriangle, TrendingUp,
    BookOpen, Map, Loader2, Briefcase, AlertCircle, X,
    ArrowRight, Clock, ChevronRight, Star, Zap, Lock
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import UpgradeModal from "./UpgradeModal";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";

function InputField({ label, value, onChange, placeholder, rows, required }) {
    const baseClass = "w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all";
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {rows ? (
                <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} className={`${baseClass} resize-none`} />
            ) : (
                <input value={value} onChange={onChange} placeholder={placeholder} className={baseClass} />
            )}
        </div>
    );
}

const SkillGapAnalysis = () => {
    const [currentSkills, setCurrentSkills] = useState("");
    const [targetRole, setTargetRole] = useState("");
    const [careerGoals, setCareerGoals] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [persistentHistory, setPersistentHistory] = useState([]);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const { user, loading: authLoading } = useAuth();

    const isPro = !authLoading && user && (
        (user.subscription && (user.subscription.plan === "pro" || user.subscription.plan === "enterprise") && user.subscription.status === "active") ||
        user.isPremium
    );

    React.useEffect(() => { fetchHistory(); }, []);

    const fetchHistory = async () => {
        try {
            const response = await apiClient.get("/api/career/history?type=skill-gap");
            if (response.ok) {
                const data = await response.json();
                setPersistentHistory(data);
            }
        } catch (err) { console.error("Failed to fetch history:", err); }
    };

    const handleAnalyze = async () => {
        if (!currentSkills.trim() || !targetRole.trim()) {
            toast.error("Please provide both current skills and target role");
            return;
        }
        if (!isPro) {
            setShowUpgradeModal(true);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.post("/api/career/skill-gap", {
                currentSkills, targetRole,
                careerGoals: careerGoals || undefined
            });
            if (response.ok) {
                const data = await response.json();
                setResult(data);
                await apiClient.post("/api/career/history", {
                    type: "skill-gap",
                    title: `Skill Gap: ${targetRole}`,
                    data,
                    metadata: { currentSkills, targetRole, careerGoals }
                });
                fetchHistory();
                toast.success("Skill gap analysis complete!");
            } else {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || "Failed to perform analysis");
            }
        } catch (error) {
            setError(error.message);
            toast.error(error.message);
        } finally { setLoading(false); }
    };

    const loadHistoryItem = (item) => {
        setCurrentSkills(item.metadata?.currentSkills || "");
        setTargetRole(item.metadata?.targetRole || "");
        setCareerGoals(item.metadata?.careerGoals || "");
        setResult(item.data);
        setError(null);
    };

    const deleteHistoryItem = async (id, e) => {
        e.stopPropagation();
        try {
            const response = await apiClient.delete(`/api/career/history?id=${id}`);
            if (response.ok) {
                toast.success("Deleted");
                setPersistentHistory(prev => prev.filter(item => item._id !== id));
            }
        } catch (err) { toast.error("Failed to delete"); }
    };

    return (
        <div className="w-full px-2 sm:px-4 py-6 sm:py-10 min_h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white">Skill Gap Analysis</h1>
                <p className="text-slate-500 mt-2">Bridge the gap between where you are and where you want to be</p>
            </motion.header>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 flex-1">{error}</p>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tab Navigation */}
            <nav className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 w-fit mx-auto mb-8">
                {[
                    { id: 'analyze', label: 'Analyze Gap', icon: Target },
                    { id: 'results', label: 'Results', icon: TrendingUp, disabled: !result },
                ].map(tab => (
                    <button key={tab.id} disabled={tab.disabled}
                        onClick={() => { }}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${!result && tab.id === 'results' ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-900'}`}>
                        <tab.icon size={16} />{tab.label}
                    </button>
                ))}
            </nav>

            <div className="flex flex-col items-center gap-6">
                {!result ? (
                    /* Input Form */
                    <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-10 space-y-6">
                            <InputField
                                label="Current Skills & Experience" required
                                value={currentSkills} onChange={e => setCurrentSkills(e.target.value)} rows={5}
                                placeholder={"List your skills, certifications, and achievements...\n\nExample:\n• JavaScript, React, Node.js\n• AWS Certified Solutions Architect\n• 5 years of full-stack development"}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Target Role" required value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Senior Data Scientist" />
                                <InputField label="Career Goals (Optional)" value={careerGoals} onChange={e => setCareerGoals(e.target.value)} placeholder="e.g. Lead a team, Move to AI" />
                            </div>
                            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-5 border border-violet-100 dark:border-violet-800">
                                <h4 className="text-sm font-bold text-violet-700 dark:text-violet-300 mb-3 flex items-center gap-2">
                                    <Sparkles size={16} /> Why use this?
                                </h4>
                                <ul className="space-y-2">
                                    {["Discover exactly what recruiters look for in your target field.", "Prioritize learning on high-impact skills.", "Get an AI-generated learning path tailored to your background."].map((tip, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-violet-600 dark:text-violet-400">
                                            <CheckCircle size={14} className="mt-0.5 shrink-0" />{tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Button onClick={handleAnalyze} disabled={loading || !currentSkills.trim() || !targetRole.trim()}
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-6 rounded-2xl font-bold text-base">
                                {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-3" /> Analyzing Gaps...</> : <><TrendingUp className="w-5 h-5 mr-3" /> Perform Analysis</>}
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* Results */
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl space-y-6">
                        {/* Score Card */}
                        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <div className="text-sm font-bold text-violet-200 mb-1">Skill Match Score</div>
                                    <div className="text-6xl font-black">{result.matchPercentage || 0}%</div>
                                </div>
                                <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center">
                                    <Target size={48} className="text-white/80" />
                                </div>
                            </div>
                            <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-4">
                                <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.min(result.matchPercentage || 0, 100)}%` }} />
                            </div>
                            <p className="text-violet-100 text-sm font-medium">{result.analysis}</p>
                        </div>

                        {/* Skill Gaps & Learning Path */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Skill Gaps */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200">Critical Skill Gaps</h3>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {(result.topGaps || []).map((gap, i) => (
                                        <div key={i} className="p-5">
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{gap.skill}</span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${gap.priority === 'critical' ? 'bg-red-100 text-red-600' :
                                                    gap.priority === 'high' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>{gap.priority}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{gap.description}</p>
                                        </div>
                                    ))}
                                    {(!result.topGaps || result.topGaps.length === 0) && (
                                        <div className="p-8 text-center text-sm text-slate-400 italic">No skill gaps identified</div>
                                    )}
                                </div>
                            </div>

                            {/* Learning Path */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                        <Map size={18} className="text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200">Learning Path</h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    {(result.learningPath || []).map((step, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-black text-violet-600 dark:text-violet-400 shrink-0">{i + 1}</div>
                                                {i < (result.learningPath?.length || 0) - 1 && <div className="w-0.5 h-full bg-slate-100 dark:bg-slate-800 mt-2" />}
                                            </div>
                                            <div className="pb-4">
                                                <div className="text-[10px] font-black text-violet-500 mb-0.5">{step.topic}</div>
                                                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{step.step}</div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.rationale}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!result.learningPath || result.learningPath.length === 0) && (
                                        <p className="text-sm text-slate-400 italic">No learning path available</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Foundational Strengths */}
                        {result.foundationalSkills?.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200">Foundational Strengths</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {result.foundationalSkills.map((skill, i) => (
                                        <span key={i} className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Market Insights */}
                        {result.marketInsights && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles size={14} className="text-violet-500" />
                                    <span className="text-xs font-bold text-slate-500">Market Insights</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{result.marketInsights}</p>
                            </div>
                        )}

                        <Button variant="outline" onClick={() => { setResult(null); setError(null); }}
                            className="w-full rounded-2xl py-5 border-slate-200 text-slate-600">
                            Start New Analysis <ArrowRight size={16} className="ml-2" />
                        </Button>
                    </motion.div>
                )}

                {/* History */}
                {!result && persistentHistory.length > 0 && (
                    <div className="w-full max-w-4xl mt-10">
                        <div className="flex items-center gap-2 mb-6">
                            <Clock size={16} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Past Analyses</span>
                            <span className="ml-auto text-xs font-bold text-slate-400">{persistentHistory.length} results</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {persistentHistory.map(item => (
                                <div key={item._id} onClick={() => loadHistoryItem(item)}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg transition-all cursor-pointer group relative">
                                    <button onClick={e => deleteHistoryItem(item._id, e)}
                                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 opacity-100 transition-all z-10">
                                        <X size={14} />
                                    </button>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                                            <Target size={16} className="text-violet-600" />
                                        </div>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
                                            {item.data.matchPercentage}% Match
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 truncate">{item.title}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.data.analysis}</p>
                                    <div className="mt-3 text-[10px] font-bold text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName="Skill Gap Analysis"
                description="Get deep insights into your professional standing. Pro members get unlimited career analysis and personalized learning paths."
            />
        </div>
    );
};

export default SkillGapAnalysis;
