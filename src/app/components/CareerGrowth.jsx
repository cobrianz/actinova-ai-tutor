"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ResumeBuilder from "./ResumeBuilder";
import InterviewPrep from "./InterviewPrep";
import SkillGapAnalysis from "./SkillGapAnalysis";
import NetworkAI from "./NetworkAI";
import UpgradeModal from "./UpgradeModal";
import {
    FileText,
    MessageSquare,
    ChevronLeft,
    Target,
    Users,
    Zap,
    ArrowRight,
    Sparkles,
    TrendingUp,
    CheckCircle2,
    Loader2,
    Briefcase,
    BookOpen,
    DollarSign,
    Building2,
    AlertCircle,
    BrainCircuit,
    Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "./AuthProvider";
import { apiClient } from "@/lib/csrfClient";
import { toast } from "sonner";

const CareerGrowth = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const subTab = searchParams.get("tool") || "overview";
    const { user, loading: authLoading } = useAuth();
    const isPro = !authLoading && user && (
        (user.subscription &&
            (user.subscription.plan === "pro" || user.subscription.plan === "enterprise") &&
            user.subscription.status === "active") ||
        user.isPremium
    );

    const setSubTab = (tool, extraParams = {}) => {
        if (tool !== "overview" && !isPro) {
            setShowPremiumModal(true);
            return;
        }
        const params = new URLSearchParams(searchParams);
        if (tool === "overview") {
            params.delete("tool");
            // Clear extra params like role
            params.delete("role");
        } else {
            params.set("tool", tool);
            Object.entries(extraParams).forEach(([key, value]) => {
                params.set(key, value);
            });
        }
        router.push(`/dashboard?${params.toString()}`);
    };

    const [trendingData, setTrendingData] = useState(null);
    const [loadingTrends, setLoadingTrends] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    const renderHeader = () => (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center mb-8 px-2"
        >
            <Button
                variant="ghost"
                onClick={() => setSubTab("overview")}
                className="group flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-transparent p-0 transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <ChevronLeft size={18} />
                </div>
                <span className="font-bold tracking-tight">Back to Hub</span>
            </Button>
        </motion.div>
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    useEffect(() => {
        const fetchTrending = async () => {
            setLoadingTrends(true);
            console.log("[CareerGrowth] Fetching trending data...");
            try {
                const response = await apiClient.get("/api/career/trending");
                console.log("[CareerGrowth] Response status:", response.status, response.ok);

                if (response.ok) {
                    const data = await response.json();
                    console.log("[CareerGrowth] Received data:", {
                        hasCareers: !!data.trendingCareers?.length,
                        hasSkills: !!data.trendingSkills?.length,
                        hasInsights: !!data.marketInsights
                    });

                    // Validate data structure
                    if (data && (data.trendingCareers || data.trendingSkills || data.marketInsights)) {
                        setTrendingData(data);
                        console.log("[CareerGrowth] Data set successfully");
                    } else {
                        console.error("[CareerGrowth] Invalid data structure:", data);
                        setTrendingData(null);
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.error("[CareerGrowth] Failed to fetch trending data:", response.status, errorData);
                    setTrendingData(null);
                }
            } catch (error) {
                console.error("[CareerGrowth] Error fetching trending data:", error);
                setTrendingData(null);
            } finally {
                setLoadingTrends(false);
            }
        };

        if (subTab === "overview") {
            fetchTrending();
        }
    }, [subTab]);

    if (subTab !== "overview" && isPro) {
        return (
            <div className="w-full max-w-7xl mx-auto py-4 sm:py-8 px-0 sm:px-6 lg:px-8 min-h-[80vh]">
                {renderHeader()}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    {subTab === "resume" && <ResumeBuilder />}
                    {subTab === "interview" && <InterviewPrep />}
                    {subTab === "skillgap" && <SkillGapAnalysis />}
                    {subTab === "network" && <NetworkAI />}
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-white dark:bg-slate-950">

            <main className="max-w-7xl mx-auto py-8 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 md:px-6 lg:px-8">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12 sm:mb-16 md:mb-20"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-6"
                    >
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                        <span className="text-[10px] sm:text-xs font-bold text-primary">AI-Powered Career Suite</span>
                    </motion.div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-4 sm:mb-6 px-2 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">
                        Skyrocket Your Career
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium px-4">
                        Four specialized AI tools working in harmony to optimize your professional presence and unlock your full potential.
                    </p>
                </motion.div>

                {/* Bento Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 md:gap-6"
                >
                    {/* Primary Tool: Resume Optimizer */}
                    <motion.div
                        variants={itemVariants}
                        className="md:col-span-8 group relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white p-6 sm:p-8 md:p-10 transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-500/50"
                    >
                        {!isPro && (
                            <div className="absolute top-4 right-4 z-20">
                                <div className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-amber-950" />
                                    PRO
                                </div>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-violet-500/10 opacity-50" />
                        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:20px_20px]" />
                        <div className="absolute -bottom-12 -right-12 w-32 sm:w-48 h-32 sm:h-48 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors" />

                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between h-full gap-5 sm:gap-6 md:gap-8">
                            <div className="flex-1 max-w-md w-full">
                                <div className="mb-4 sm:mb-6 inline-flex p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/10 text-white border border-white/20 backdrop-blur-sm">
                                    <FileText size={24} className="sm:w-7 sm:h-7" />
                                </div>
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-black mb-2 sm:mb-3 leading-tight">Resume Accelerator</h2>
                                <p className="text-slate-300 mb-6 sm:mb-8 font-medium leading-relaxed text-xs sm:text-sm md:text-base">
                                    Craft a job-winning resume from scratch or optimize your existing one for ATS systems using advanced AI.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSubTab("resume");
                                        }}
                                        className="bg-white text-slate-900 hover:bg-white/90 font-bold px-6 py-2 rounded-xl h-auto w-full sm:w-auto"
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Launch Resume Builder
                                    </Button>
                                </div>
                            </div>

                            <div className="shrink-0 bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 hidden md:block w-48 lg:w-56 shadow-xl">
                                <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
                                    <Zap className="text-amber-400 fill-amber-400 sm:w-3.5 sm:h-3.5" size={12} />
                                    <span className="font-black text-[8px] sm:text-[9px] text-amber-400">AI Powered</span>
                                </div>
                                <p className="font-semibold text-[10px] sm:text-xs text-slate-200 italic leading-relaxed">
                                    "Your resume is your first impression. Let AI guarantee it's a perfect one."
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Secondary Tool: Skill Gap */}
                    <motion.div
                        variants={itemVariants}
                        className="md:col-span-4 group relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-950/50 dark:via-blue-950/50 dark:to-cyan-950/50 backdrop-blur-sm p-5 sm:p-6 md:p-8 transition-all hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-500/20"
                    >
                        {!isPro && (
                            <div className="absolute top-4 right-4 z-20">
                                <div className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-amber-950" />
                                    PRO
                                </div>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 via-blue-400/5 to-cyan-400/10 opacity-100 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="mb-4 sm:mb-5 inline-flex p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                <Target size={24} className="sm:w-7 sm:h-7" />
                            </div>
                            <h2 className="text-lg sm:text-xl md:text-2xl font-black mb-2 sm:mb-3 text-slate-900 dark:text-white leading-tight">Skill Gap Analysis</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-6 sm:mb-8 font-medium text-xs sm:text-sm leading-relaxed">
                                Identify the exact skills missing between you and your dream role.
                            </p>
                            <Button
                                onClick={() => setSubTab("skillgap")}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 shadow-lg shadow-indigo-500/20"
                            >
                                Analyze Skills
                                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </motion.div>

                    {/* Secondary Tool: Mock Interview */}
                    <motion.div
                        variants={itemVariants}
                        className="md:col-span-4 group relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/50 dark:via-pink-950/50 dark:to-rose-950/50 backdrop-blur-sm p-5 sm:p-6 md:p-8 transition-all hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-xl hover:shadow-purple-500/20"
                    >
                        {!isPro && (
                            <div className="absolute top-4 right-4 z-20">
                                <div className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-amber-950" />
                                    PRO
                                </div>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 via-pink-400/5 to-rose-400/10 opacity-100 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="mb-4 sm:mb-5 inline-flex p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                <MessageSquare size={24} className="sm:w-7 sm:h-7" />
                            </div>
                            <h2 className="text-lg sm:text-xl md:text-2xl font-black mb-2 sm:mb-3 text-slate-900 dark:text-white leading-tight">Mock Interview</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-6 sm:mb-8 font-medium text-xs sm:text-sm leading-relaxed">
                                Pressure-test your knowledge with personalized AI interviewers.
                            </p>
                            <Button
                                onClick={() => setSubTab("interview")}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl h-10 shadow-lg shadow-purple-500/20"
                            >
                                Practice Now
                                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </motion.div>

                    {/* Special Tool: Network AI */}
                    <motion.div
                        variants={itemVariants}
                        className="md:col-span-8 group relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-900 via-emerald-900 to-teal-800 text-white p-6 sm:p-8 md:p-10 transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-emerald-500/20 hover:border-emerald-500/50"
                    >
                        {!isPro && (
                            <div className="absolute top-4 right-4 z-20">
                                <div className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-amber-950" />
                                    PRO
                                </div>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 opacity-50" />
                        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:20px_20px]" />
                        <div className="absolute -bottom-12 -right-12 w-32 sm:w-48 h-32 sm:h-48 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-colors" />

                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between h-full gap-5 sm:gap-6 md:gap-8">
                            <div className="flex-1 max-w-md w-full">
                                <div className="mb-4 sm:mb-6 inline-flex p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/10 text-white border border-white/20 backdrop-blur-sm">
                                    <Users size={24} className="sm:w-7 sm:h-7" />
                                </div>
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-black mb-2 sm:mb-3 leading-tight">Network AI</h2>
                                <p className="text-slate-300 mb-4 sm:mb-6 font-medium leading-relaxed text-xs sm:text-sm md:text-base">
                                    Unlock back-channel opportunities. Draft perfect outreach and find ideal mentors instantly.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Button
                                        onClick={() => setSubTab("network")}
                                        className="bg-white text-emerald-900 hover:bg-white/90 font-bold px-6 py-2 rounded-xl h-auto shadow-lg shadow-white/10"
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        Expand Reach
                                        <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </div>

                            <div className="shrink-0 bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 hidden md:block w-48 lg:w-56 shadow-xl">
                                <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
                                    <Zap className="text-amber-400 fill-amber-400 sm:w-3.5 sm:h-3.5" size={12} />
                                    <span className="font-black text-[8px] sm:text-[9px] text-amber-400">Active Networking</span>
                                </div>
                                <p className="font-semibold text-[10px] sm:text-xs text-slate-200 italic leading-relaxed">
                                    "Your network is your net worth. Let AI craft the connections that matter."
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Trending Careers and Skills Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 sm:mt-16 md:mt-20"
                >
                    <div className="text-center mb-8 sm:mb-10">

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-3 sm:mb-4 text-slate-900 dark:text-white">
                            Trending Careers & Skills {new Date().getFullYear()}
                        </h2>
                        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Discover the most in-demand careers and skills this year, powered by AI market analysis
                        </p>
                    </div>

                    {loadingTrends ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-600 mb-4" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">Loading trending careers and skills...</p>
                        </div>
                    ) : trendingData ? (
                        <div className="space-y-8 sm:space-y-10">
                            {/* Trending Careers */}
                            {trendingData.trendingCareers && trendingData.trendingCareers.length > 0 && (
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                                        <Briefcase className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                                        Trending Careers
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                                        {trendingData.trendingCareers.slice(0, 6).map((career, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 * idx }}
                                                className="bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 dark:from-violet-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-2 border-violet-200 dark:border-violet-800 rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:shadow-xl transition-all hover:scale-[1.02]"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex-1">
                                                        {career.title}
                                                    </h4>
                                                    <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black">
                                                        {career.growth || "Growing"}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                                                    {career.description}
                                                </p>
                                                <div className="space-y-3">
                                                    {career.averageSalary && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{career.averageSalary}</span>
                                                        </div>
                                                    )}
                                                    {career.industry && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                            <span className="text-slate-600 dark:text-slate-400">{career.industry}</span>
                                                        </div>
                                                    )}
                                                    {career.skills && career.skills.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 pt-2">
                                                            {career.skills.slice(0, 3).map((skill, i) => (
                                                                <span key={i} className="px-2.5 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-5 pt-5 border-t border-violet-100 dark:border-violet-800/50 flex gap-3">
                                                    <Button
                                                        variant="default"
                                                        className="flex-1 bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                                                        onClick={() => {
                                                            toast.loading("Preparing your personalized curriculum...");
                                                            setTimeout(() => {
                                                                router.push(`/dashboard?tab=generate&topic=${encodeURIComponent(career.title)}&autoRun=true`);
                                                            }, 1000);
                                                        }}
                                                    >
                                                        <BookOpen className="w-4 h-4 mr-2" />
                                                        Course
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        className="flex-1 bg-violet-100 hover:bg-violet-200 text-violet-700 dark:bg-violet-900/50 dark:hover:bg-violet-900 dark:text-violet-300 shadow-sm"
                                                        onClick={() => {
                                                            toast.loading(`Generating professional resume for ${career.title}...`);
                                                            setTimeout(() => {
                                                                setSubTab("resume", { role: career.title, autoGenerate: "true", mode: "build" });
                                                            }, 1000);
                                                        }}
                                                    >
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        Resume
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Trending Skills */}
                            {trendingData.trendingSkills && trendingData.trendingSkills.length > 0 && (
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                                        <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                        Trending Skills to Learn
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                                        {trendingData.trendingSkills.slice(0, 6).map((skill, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 * idx }}
                                                className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-950/30 dark:via-blue-950/30 dark:to-cyan-950/30 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:shadow-xl transition-all hover:scale-[1.02]"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex-1">
                                                        {skill.skill}
                                                    </h4>
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${skill.demand === 'critical' ? 'bg-red-500 text-white' :
                                                        skill.demand === 'high' ? 'bg-orange-500 text-white' :
                                                            'bg-yellow-500 text-white'
                                                        }`}>
                                                        {skill.demand || 'Medium'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                                                    {skill.description}
                                                </p>
                                                {skill.relatedCareers && skill.relatedCareers.length > 0 && (
                                                    <div className="pt-3 border-t border-indigo-200 dark:border-indigo-800 mb-4">
                                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Related Careers</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {skill.relatedCareers.slice(0, 2).map((career, i) => (
                                                                <span key={i} className="px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                                                                    {career}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-between items-center bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-800/50"
                                                    onClick={() => {
                                                        toast.loading(`Generating course for ${skill.skill}...`);
                                                        setTimeout(() => {
                                                            router.push(`/dashboard?tab=generate&topic=${encodeURIComponent(skill.skill)}&autoRun=true`);
                                                        }, 1000);
                                                    }}
                                                >
                                                    Start Learning
                                                    <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Market Insights */}
                            {trendingData.marketInsights && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl p-6 sm:p-8"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                                        <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Market Insights</h3>
                                    </div>
                                    <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {trendingData.marketInsights}
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                            <p className="text-slate-600 dark:text-slate-400 mb-4">Unable to load trending data.</p>
                            <Button
                                onClick={() => {
                                    setLoadingTrends(true);
                                    setTrendingData(null);
                                    const fetchTrending = async () => {
                                        try {
                                            const response = await apiClient.get("/api/career/trending");
                                            if (response.ok) {
                                                const data = await response.json();
                                                if (data && (data.trendingCareers || data.trendingSkills || data.marketInsights)) {
                                                    setTrendingData(data);
                                                } else {
                                                    setTrendingData(null);
                                                }
                                            } else {
                                                setTrendingData(null);
                                            }
                                        } catch (error) {
                                            console.error("Error fetching trending data:", error);
                                            setTrendingData(null);
                                        } finally {
                                            setLoadingTrends(false);
                                        }
                                    };
                                    fetchTrending();
                                }}
                                variant="outline"
                                className="mt-4"
                            >
                                <Loader2 className="w-4 h-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    )}
                </motion.div>
            </main>


            <UpgradeModal
                isOpen={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
                featureName="Career Growth Suite"
                description="Unlock the full power of our AI-driven Career Accelerator. Get unlimited resume optimizations, expert interview prep, and deep skill gap analysis."
            />
        </div>
    );
};

export default CareerGrowth;
