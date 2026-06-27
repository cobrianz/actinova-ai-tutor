"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Check,
    Crown,
    ArrowRight,
    Coins
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/csrfClient";
import { PRODUCTS, CREDIT_PACKS } from "@/lib/planLimits";
import { useAuth } from "./AuthProvider";

const featureToProduct = {
    course: "course_generation",
    report: "report_generation",
    career: "career_tools",
    exam: "exam_generation",
    flashcard: "flashcard_generation",
};

const UpgradeModal = ({ isOpen, onClose, featureName, description, limitData }) => {
    const router = useRouter();
    const { credits, fetchUser } = useAuth();
    const [processing, setProcessing] = useState(null);

    const productId = featureToProduct[featureName?.toLowerCase()] || "course_generation";
    const product = PRODUCTS.find((p) => p.id === productId) || PRODUCTS[0];
    const creditCost = limitData?.creditCost || product.creditCost;
    const userCredits = credits || 0;
    const canUseCredits = userCredits >= creditCost;

    const handleBuy = async (packId) => {
        setProcessing(packId);
        try {
            const response = await apiClient.post("/api/billing/create-session", {
                purchaseType: "credit-purchase",
                packId,
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

    const handleUseCredits = async () => {
        if (!canUseCredits) return;
        setProcessing("credits");
        try {
            const response = await apiClient.post("/api/billing/use-credits", {
                itemType: product.id,
            });
            const data = await response.json();
            if (response.ok && data.success) {
                await fetchUser();
                onClose();
            } else {
                setProcessing(null);
            }
        } catch (error) {
            console.error("Credit usage error:", error);
            setProcessing(null);
        }
    };

    const defaultBenefits = [
        `${product.name} — pay per use with credits`,
        "No subscription required",
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
                                <Coins className="w-7 h-7 text-lime-500" />
                            </div>
                        </motion.div>
                        <h2 className="text-lg font-black text-white uppercase tracking-[0.18em] mb-1">
                            {canUseCredits ? "Unlock Feature" : "Insufficient Credits"}
                        </h2>
                        <div className="h-1 w-10 bg-gradient-to-r from-lime-400 to-lime-500 rounded-full" />
                    </div>
                </div>

                <div className="relative p-6 pt-5">
                    <DialogHeader className="p-0 text-center mb-6">
                        <DialogTitle className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight leading-tight">
                            {product.name}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            {limitData ? (
                                <>This requires <span className="text-primary font-bold">{creditCost} credits</span>. {userCredits > 0 ? `You have ${userCredits} credits.` : "Purchase a credit pack to continue."}</>
                            ) : (
                                description || `Use ${creditCost} credits to generate ${product.name.toLowerCase()}.`
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {userCredits > 0 && (
                        <div className="flex items-center justify-center gap-2 mb-4 py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                            <Coins size={16} className="text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                {userCredits} credits available
                            </span>
                            <span className="text-xs text-amber-500 dark:text-amber-400">
                                ({creditCost} needed)
                            </span>
                        </div>
                    )}

                    {canUseCredits && (
                        <button
                            onClick={handleUseCredits}
                            disabled={processing === "credits"}
                            className="w-full mb-4 group relative h-13 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl overflow-hidden shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                        >
                            <Coins size={18} />
                            <span className="uppercase tracking-widest text-[11px]">
                                {processing === "credits" ? "Processing..." : `Use ${creditCost} Credits`}
                            </span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}

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

                    <div className="flex flex-col gap-2.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 text-center">Buy Credits</p>
                        <div className="grid grid-cols-3 gap-2">
                            {CREDIT_PACKS.map((pack) => (
                                <button
                                    key={pack.id}
                                    onClick={() => handleBuy(pack.id)}
                                    disabled={processing === pack.id}
                                    className={`group relative py-3 px-2 rounded-xl font-black overflow-hidden shadow-lg transition-all hover:scale-[1.03] active:scale-95 flex flex-col items-center gap-0.5 cursor-pointer disabled:opacity-60 ${pack.popular
                                        ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-500/30 ring-2 ring-amber-400"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                                    }`}
                                >
                                    <span className="text-[9px] uppercase tracking-wider opacity-80">
                                        {pack.credits} credits
                                    </span>
                                    <span className="text-base">${pack.price}</span>
                                    {pack.popular && (
                                        <span className="text-[7px] uppercase tracking-widest bg-white/20 px-1.5 rounded-full mt-0.5">
                                            Best value
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-4">
                        <button
                            onClick={onClose}
                            className="h-9 w-full text-[11px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest transition-colors cursor-pointer"
                        >
                            Return
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UpgradeModal;
