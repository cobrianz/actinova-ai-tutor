"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import ResumeBuilder from "./ResumeBuilder";
import InterviewPrep from "./InterviewPrep";
import SkillGapAnalysis from "./SkillGapAnalysis";
import NetworkAI from "./NetworkAI";
import {
    FileText,
    MessageSquare,
    ChevronLeft,
    Target,
    Users,
    Zap,
    ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CareerGrowth = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const subTab = searchParams.get("tool") || "overview";

    const setSubTab = (tool) => {
        const params = new URLSearchParams(searchParams);
        if (tool === "overview") {
            params.delete("tool");
        } else {
            params.set("tool", tool);
        }
        router.push(`/dashboard?${params.toString()}`);
    };

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

    if (subTab !== "overview") {
        return (
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-[80vh]">
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
        <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] -z-10" />

            <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-20"
                >
                    <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-6 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent italic">
                        Skyrocket Your Career
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
                        Four specialized AI agents working in harmony to optimize your professional presence and unlock your full potential.
                    </p>
                </motion.div>

                {/* Bento Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-12 gap-6"
                >
                    {/* Primary Tool: Resume Optimizer */}
                    <motion.div
                        variants={itemVariants}
                        onClick={() => setSubTab("resume")}
                        className="md:col-span-8 group relative cursor-pointer overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900 text-white p-10 transition-all hover:scale-[1.01] shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between h-full gap-8">
                            <div className="max-w-sm">
                                <div className="mb-6 inline-flex p-4 rounded-2xl bg-white/10 text-white border border-white/20">
                                    <FileText size={32} />
                                </div>
                                <h2 className="text-3xl font-black mb-4">Resume Optimizer</h2>
                                <p className="text-slate-400 mb-8 font-medium leading-relaxed">
                                    AI-driven ATS optimization to ensure your resume reaches human eyes. Precise keyword matching and impact analysis.
                                </p>
                                <div className="flex items-center gap-4 text-white font-black group-hover:gap-6 transition-all text-lg">
                                    Optimize Resume
                                    <ArrowRight size={24} />
                                </div>
                            </div>

                            <div className="shrink-0 bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 hidden md:block w-64 shadow-2xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <Zap className="text-amber-400 fill-amber-400" size={16} />
                                    <span className="font-black uppercase tracking-[0.2em] text-[10px]">AI Powered</span>
                                </div>
                                <p className="font-bold text-sm text-slate-100 italic leading-snug">
                                    "Your resume is your first impression. Let AI guarantee it's a perfect one."
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Secondary Tool: Skill Gap */}
                    <motion.div
                        variants={itemVariants}
                        onClick={() => setSubTab("skillgap")}
                        className="md:col-span-4 group relative cursor-pointer overflow-hidden rounded-[2.5rem] border border-border/50 bg-card/40 backdrop-blur-xl p-8 transition-all hover:border-indigo-500/50 hover:shadow-[0_0_80px_-20px_rgba(99,102,241,0.2)]"
                    >
                        <div className="mb-6 inline-flex p-4 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                            <Target size={32} />
                        </div>
                        <h2 className="text-2xl font-black mb-3">Skill Analysis</h2>
                        <p className="text-muted-foreground mb-12 font-medium">
                            Identify the exact skills missing between you and your dream role.
                        </p>
                        <div className="flex items-center gap-2 text-indigo-500 font-bold group-hover:gap-4 transition-all">
                            Map Future
                            <ArrowRight size={20} />
                        </div>
                    </motion.div>

                    {/* Secondary Tool: Mock Interview */}
                    <motion.div
                        variants={itemVariants}
                        onClick={() => setSubTab("interview")}
                        className="md:col-span-4 group relative cursor-pointer overflow-hidden rounded-[2.5rem] border border-border/50 bg-card/40 backdrop-blur-xl p-8 transition-all hover:border-purple-500/50 hover:shadow-[0_0_80px_-20px_rgba(168,85,247,0.2)]"
                    >
                        <div className="mb-6 inline-flex p-4 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                            <MessageSquare size={32} />
                        </div>
                        <h2 className="text-2xl font-black mb-3">Mock Interview</h2>
                        <p className="text-muted-foreground mb-12 font-medium">
                            Pressure-test your knowledge with personalized AI interviewers.
                        </p>
                        <div className="flex items-center gap-2 text-purple-500 font-bold group-hover:gap-4 transition-all">
                            Start Session
                            <ArrowRight size={20} />
                        </div>
                    </motion.div>

                    {/* Special Tool: Network AI */}
                    <motion.div
                        variants={itemVariants}
                        onClick={() => setSubTab("network")}
                        className="md:col-span-8 group relative cursor-pointer overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900 text-white p-10 transition-all hover:scale-[1.01] shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between h-full gap-8">
                            <div className="max-w-sm">
                                <div className="mb-6 inline-flex p-4 rounded-2xl bg-white/10 text-white border border-white/20">
                                    <Users size={32} />
                                </div>
                                <h2 className="text-3xl font-black mb-4">Network AI</h2>
                                <p className="text-slate-400 mb-8 font-medium leading-relaxed">
                                    Unlock back-channel opportunities. Draft perfect outreach and find ideal mentors instantly.
                                </p>
                                <div className="flex items-center gap-4 text-white font-black group-hover:gap-6 transition-all text-lg">
                                    Expand Reach
                                    <ArrowRight size={24} />
                                </div>
                            </div>

                            <div className="shrink-0 bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 hidden md:block w-64 shadow-2xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <Zap className="text-amber-400 fill-amber-400" size={16} />
                                    <span className="font-black uppercase tracking-[0.2em] text-[10px]">Active Networking</span>
                                </div>
                                <p className="font-bold text-sm text-slate-100 italic leading-snug">
                                    "Your network is your net worth. Let AI craft the connections that matter."
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

            </main>
        </div>
    );
};

export default CareerGrowth;
