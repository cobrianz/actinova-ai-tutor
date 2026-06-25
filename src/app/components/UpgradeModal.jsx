"use client";

import React, { useState } from "react";
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
    ArrowRight,
    X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/csrfClient";
import { PRODUCTS } from "@/lib/planLimits";

const featureToProduct = {
    course: "course_generation",
    report: "report_generation",
    career: "career_tools",
    exam: "exam_generation",
    flashcard: "flashcard_generation",
};

const UpgradeModal = ({ isOpen, onClose, featureName, description, limitData }) => {
    const router = useRouter();
    const [processing, setProcessing] = useState(null);

    const productId = featureToProduct[featureName?.toLowerCase()] || "course_generation";
    const product = PRODUCTS.find((p) => p.id === productId) || PRODUCTS[0];

    const handleBuy = async () => {
        setProcessing(product.id);
        try {
            const response = await apiClient.post("/api/billing/create-session", {
                purchaseType: "item",
                itemType: product.id,
                paymentMethod: "card",
            });
            const data = await response.json();
            if (response.ok && data.sessionUrl) {
                window.location.href = data.sessionUrl;
            } else {
                setProcessing(null);
            }
        } catch (error) {
            console.error("Payment error:", error);
            setProcessing(null);
        }
    };

    const defaultBenefits = [
        `${product.name} — unlimited access`,
        "No recurring fees, pay once",
        "Access on all your devices",
        "Priority processing",
    ];

    const benefits = limitData?.benefits || defaultBenefits;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2rem] font-sans">
                <div className="relative h-36 bg-slate-900 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-600/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3" />
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.5),transparent)]" />

                    <div className="relative h-full flex flex-col items-center justify-center text-center px-5">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", duration: 0.8 }}
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lime-400 via-lime-500 to-lime-600 p-[2px] shadow-[0_0_28px_rgba(245,158,11,0.3)] mb-3"
                        >
                            <div className="w-full h-full rounded-[1rem] bg-slate-900 flex items-center justify-center">
                                <Crown className="w-7 h-7 text-lime-500 fill-lime-500/20" />
                            </div>
                        </motion.div>
                        <h2 className="text-lg font-black text-white uppercase tracking-[0.18em] mb-1">
                            {limitData ? "Limit Reached" : "Unlock Feature"}
                        </h2>
                        <div className="h-1 w-10 bg-gradient-to-r from-lime-400 to-lime-500 rounded-full" />
                    </div>
                </div>

                <div className="relative p-6 pt-5">
                    <DialogHeader className="p-0 text-center mb-6">
                        <DialogTitle className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight leading-tight">
                            {limitData ? `Unlock ${product.name}` : `Master ${featureName || "Premium Features"}`}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            {limitData ? (
                                <>You've used <span className="text-primary font-bold">{limitData.used || 0} out of {limitData.limit || "your"}</span> free uses. Purchase once and own it forever.</>
                            ) : (
                                description || `Unlock ${product.name} with a one-time purchase. No subscription needed.`
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2.5 mb-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">What you get</p>
                        {benefits.slice(0, 4).map((benefit, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-colors hover:border-primary/20 group"
                            >
                                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                                    <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{benefit}</span>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleBuy}
                            disabled={processing === product.id}
                            className="group relative h-13 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black rounded-xl overflow-hidden shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <Crown size={18} className="fill-current text-lime-500" />
                            <span className="uppercase tracking-widest text-[11px]">
                                {processing === product.id ? "Processing..." : `Buy ${product.name} $${product.price}`}
                            </span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            onClick={onClose}
                            className="h-10 w-full text-[11px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest transition-colors cursor-pointer"
                        >
                            Return to Explore
                        </button>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2">
                    <div className="flex -space-x-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 40}`} alt="User" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-2">One-time payment, own it forever</span>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UpgradeModal;
