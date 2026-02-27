"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, FileText, ChevronDown, Lightbulb, AlertTriangle, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import ActirovaLoader from "./ActirovaLoader";

export default function Reports({ setActiveContent }) {
    const [topic, setTopic] = useState("");
    const [type, setType] = useState("report"); // report or essay
    const [length, setLength] = useState("medium");
    const [difficulty, setDifficulty] = useState("beginner");
    const [citationStyle, setCitationStyle] = useState("APA");
    const [showLoader, setShowLoader] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { user, loading } = useAuth();

    const isPremium = !!((user?.subscription?.plan === "pro" || user?.subscription?.plan === "enterprise") && user?.subscription?.status === "active") || !!user?.isPremium;

    const handleGenerateOutline = async () => {
        if (!topic.trim()) {
            toast.error("Please enter a topic");
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);
        setShowLoader(true);

        try {
            const response = await fetch("/api/generate-report-outline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ topic, type, length, difficulty, citationStyle }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate outline");
            }

            const data = await response.json();
            toast.success("Outline generated!");
            // Redirect to editor with the new report ID
            if (data.reportId) {
                router.push(`/reports/${data.reportId}`);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setShowLoader(false);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            {showLoader && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <ActirovaLoader text="report outline" />
                </div>
            )}

            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                    Professional Reports & Essays
                </h1>
                <p className="text-muted-foreground text-lg">
                    Generate structured outlines and comprehensive content for your academic or professional needs.
                </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">What is your topic?</label>
                        <textarea
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., The Impact of Renewable Energy on Global Economics..."
                            className="w-full h-32 p-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary outline-none resize-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Content Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full p-3 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary transition-all"
                            >
                                <option value="report">Formal Report</option>
                                <option value="essay">Academic Essay</option>
                                <option value="article">Technical Article</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Target Length</label>
                            <select
                                value={length}
                                onChange={(e) => setLength(e.target.value)}
                                className="w-full p-3 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary transition-all"
                            >
                                <option value="short">Short (3-5 Sections)</option>
                                <option value="medium">Medium (6-10 Sections)</option>
                                <option value="long">Long (11-15 Sections)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Citation Style</label>
                            <select
                                value={citationStyle}
                                onChange={(e) => setCitationStyle(e.target.value)}
                                className="w-full p-3 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary transition-all"
                            >
                                <option value="APA">APA Style</option>
                                <option value="MLA">MLA Style</option>
                                <option value="Harvard">Harvard Style</option>
                                <option value="IEEE">IEEE Style</option>
                                <option value="Chicago">Chicago Style</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateOutline}
                        disabled={!topic.trim() || isSubmitting}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                        <Sparkles className="w-5 h-5" />
                        Generate Report Outline
                    </button>
                </div>
            </div>
        </div>
    );
}
