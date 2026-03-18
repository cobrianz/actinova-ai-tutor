"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Check,
    Zap,
    Crown,
    Sparkles,
    ArrowRight,
    ShieldCheck,
    ZapOff
} from "lucide-react";
import { useRouter } from "next/navigation";

const UpgradeModal = ({ isOpen, onClose, featureName, description, limitData }) => {
    const router = useRouter();

    const handleUpgrade = () => {
        onClose();
        router.push("/pricing");
    };

    const defaultBenefits = [
        "Unlimited AI Course generations",
        "Priority processing for faster results",
        "Access to all 20+ modules & labs",
        "Advanced Career & Skill gap tools",
        "Exclusive premium curriculum access"
    ];

    const benefits = limitData?.benefits || defaultBenefits;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2.5rem] font-sans">
                {/* Premium Banner/Header */}
                <div className="relative h-48 bg-slate-900 overflow-hidden">
                    {/* Abstract Background Shapes */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-600/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3" />
                    
                    {/* Animated Particles/Gradient Mesh */}
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.5),transparent)]" />
                    
                    <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", duration: 0.8 }}
                            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-[2px] shadow-[0_0_40px_rgba(245,158,11,0.3)] mb-4"
                        >
                            <div className="w-full h-full rounded-[1.4rem] bg-slate-900 flex items-center justify-center">
                                <Crown className="w-10 h-10 text-amber-500 fill-amber-500/20" />
                            </div>
                        </motion.div>
                        
                        <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-1">
                            {limitData ? "Limit Reached" : "Upgrade to Pro"}
                        </h2>
                        <div className="h-1 w-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" />
                    </div>
                </div>

                <div className="relative p-8 pt-6">
                    <DialogHeader className="p-0 text-center mb-8">
                        <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight leading-tight">
                            {limitData ? "Unlock Unlimited Generations" : `Master ${featureName || "Premium Features"}`}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            {limitData ? (
                                <>You've used <span className="text-primary font-bold">{limitData.used} out of {limitData.limit}</span> free generations. Join Pro for infinite learning power.</>
                            ) : (
                                description || "Elevate your learning experience with our most advanced AI tools and professional-grade curricula."
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Features/Benefits Grid */}
                    <div className="space-y-3 mb-8">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Included in Pro Plan</p>
                        {benefits.slice(0, 4).map((benefit, i) => (
                            <motion.div 
                                key={i}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-colors hover:border-primary/20 group"
                            >
                                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                                    <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{benefit}</span>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleUpgrade}
                            className="group relative h-16 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                        >
                            {/* Inner Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            
                            <Crown size={20} className="fill-current text-amber-500" />
                            <span className="uppercase tracking-widest text-xs">Unlock Pro Now</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            onClick={onClose}
                            className="h-12 w-full text-xs font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest transition-colors cursor-pointer"
                        >
                            Return to Explore
                        </button>
                    </div>
                </div>

                {/* Footer Security Badge */}
                <div className="px-8 py-5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2">
                    <div className="flex -space-x-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 40}`} alt="User" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Trusted by 2,000+ AI Students</span>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UpgradeModal;
