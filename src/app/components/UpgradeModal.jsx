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

const UpgradeModal = ({ isOpen, onClose, featureName, description }) => {
    const router = useRouter();

    const handleUpgrade = () => {
        onClose();
        router.push("/pricing");
    };

    const benefits = [
        "10x higher usage limits",
        "Priority AI generations",
        "Advanced career & growth tools",
        "Premium course library access",
        "No ads & early access features"
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-3xl">
                <div className="relative p-8">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />

                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 animate-pulse">
                            <Crown size={32} />
                        </div>

                        <DialogHeader className="p-0">
                            <DialogTitle className="text-2xl font-black text-foreground mb-2 leading-tight">
                                Unlock {featureName || "Premium Features"}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                {description || "You've discovered a Pro feature. Upgrade to Actirova Pro to unlock your full potential."}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="w-full mt-8 space-y-3">
                            {benefits.map((benefit, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                        <Check size={12} className="text-emerald-600" />
                                    </div>
                                    <span className="text-xs font-bold text-foreground/80">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleUpgrade}
                            className="w-full mt-8 group relative flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <Zap size={20} className="fill-current" />
                            <span>Upgrade to Pro Now</span>
                            <ArrowRight size={18} />
                        </button>

                        <button
                            onClick={onClose}
                            className="mt-4 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Maybe later, keep exploring
                        </button>
                    </div>
                </div>

                <div className="px-8 py-4 bg-muted/50 border-t border-border flex items-center justify-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Secure Payment by Paystack</span>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UpgradeModal;
