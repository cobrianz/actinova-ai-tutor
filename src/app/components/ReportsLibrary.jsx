"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Search, Plus, ScrollText, ExternalLink, Filter, FileText, Clock,
    ChevronDown, ArrowLeft, Sparkles, Loader2, ScrollText as ScrollTextIcon,
    BookOpen, AlignLeft, Quote,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import { apiClient } from "@/lib/csrfClient";
import { motion, AnimatePresence } from "framer-motion";
import UpgradeModal from "./UpgradeModal";
import ActirovaLoader from "./ActirovaLoader";

const TYPE_COLORS = {
    report: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
    essay: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
    default: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" }
};

const STORAGE_KEY = "report_creator_draft";

function ReportCreator({ onCreated, onBack }) {
    const { user, hasPurchased } = useAuth();
    const router = useRouter();

    // Restore draft from sessionStorage on mount
    const getInitialDraft = () => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch { /* ignore */ }
        return null;
    };

    const draft = getInitialDraft();

    const [topic, setTopic] = useState(draft?.topic ?? "");
    const [reportType, setReportType] = useState(draft?.reportType ?? "report");
    const [reportLength, setReportLength] = useState(draft?.reportLength ?? "medium");
    const [citationStyle, setCitationStyle] = useState(draft?.citationStyle ?? "APA");
    const [difficulty, setDifficulty] = useState(draft?.difficulty ?? "beginner");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showLoader, setShowLoader] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Persist draft to sessionStorage whenever fields change
    useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ topic, reportType, reportLength, citationStyle, difficulty }));
        } catch { /* ignore */ }
    }, [topic, reportType, reportLength, citationStyle, difficulty]);

    const clearDraft = () => {
        try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    };

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        if (isSubmitting) return;
        setIsSubmitting(true);
        setShowLoader(true);

        try {
            const response = await apiClient.post("/api/generate-report-outline", {
                topic: topic.trim(),
                type: reportType,
                length: reportLength,
                difficulty,
                citationStyle,
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 429) {
                    toast.error(
                        `Monthly report limit reached (${errorData.used || 0}/${errorData.limit || 1}). Upgrade to Pro for more reports.`,
                        { duration: 6000 }
                    );
                    setShowUpgradeModal(true);
                    setShowLoader(false);
                    setIsSubmitting(false);
                    return;
                }
                throw new Error(errorData.error || "Failed to generate report outline");
            }

            const data = await response.json();
            if (typeof window !== "undefined") window.dispatchEvent(new Event("usageUpdated"));
            toast.success("Report outline generated!");
            clearDraft();
            if (data.reportId) {
                router.push(`/reports/${data.reportId}`);
            }
        } catch (error) {
            console.error("Report generation failed:", error);
            toast.error(error.message || "Failed to generate report");
            setShowLoader(false);
            setIsSubmitting(false);
        }
    };

    const optionGroups = [
        {
            label: "TYPE", value: reportType, setter: setReportType,
            icon: BookOpen,
            options: [
                { v: "report", l: "Formal Report" },
                { v: "essay", l: "Academic Essay" },
                { v: "article", l: "Technical Article" },
            ]
        },
        {
            label: "LENGTH", value: reportLength, setter: setReportLength,
            icon: AlignLeft,
            options: [
                { v: "short", l: "Short (3–5 sections)" },
                { v: "medium", l: "Medium (6–10 sections)" },
                { v: "long", l: "Long (11–15 sections)" },
            ]
        },
        {
            label: "CITATION STYLE", value: citationStyle, setter: setCitationStyle,
            icon: Quote,
            options: [
                { v: "APA", l: "APA Style" },
                { v: "MLA", l: "MLA Style" },
                { v: "Chicago", l: "Chicago Style" },
            ]
        },
    ];

    return (
        <div className="px-0 py-6">
            {showLoader && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs">
                    <ActirovaLoader text="report" />
                </div>
            )}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName="report"
            />

            {/* Back button — top-left */}
            <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={onBack}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-[11px] font-medium transition-colors mb-6 group"
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to Reports
            </motion.button>

            <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-2xl">
                {/* Centered header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="text-center mb-10"
                >
                    {/* Icon badge */}
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 mb-5">
                        <ScrollTextIcon size={26} className="text-green-600 dark:text-green-400" />
                    </div>
                    <h1
                        className="text-3xl font-black text-slate-900 dark:text-white mb-2"
                        style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                        New Report
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Generate an AI-structured research document
                    </p>
                </motion.div>

                {/* Topic textarea */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-5"
                >
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-widest px-1 mb-2">
                        TOPIC / ASSIGNMENT PROMPT
                    </label>
                    <textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Paste your assignment prompt or research topic here..."
                        rows={5}
                        maxLength={5000}
                        className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400 transition-all resize-none"
                        onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleGenerate(); }}
                        autoFocus
                    />
                    <div className="flex items-center justify-between mt-1.5 px-1">
                        <span className="text-[10px] text-slate-400">Press Ctrl+Enter to generate</span>
                        <span className={`text-[10px] font-medium ${topic.length > 4500 ? "text-amber-500" : "text-slate-400"}`}>
                            {topic.length}/5000
                        </span>
                    </div>
                </motion.div>

                {/* Options grid */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
                >
                    {optionGroups.map((group, i) => (
                        <motion.div
                            key={group.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.18 + i * 0.06 }}
                            className="flex flex-col gap-1.5"
                        >
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest px-1">
                                <group.icon size={10} />
                                {group.label}
                            </label>
                            <div className="relative">
                                <select
                                    value={group.value}
                                    onChange={(e) => group.setter(e.target.value)}
                                    className="w-full appearance-none bg-white dark:bg-slate-900 font-semibold text-xs text-slate-700 dark:text-slate-300 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 pr-10 focus:outline-none focus:ring-2 focus:ring-green-400/20 focus:border-green-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                >
                                    {group.options.map(o => (
                                        <option key={o.v} value={o.v}>{o.l}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Generate button */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.38 }}
                    className="flex justify-center"
                >
                    <button
                        onClick={handleGenerate}
                        disabled={!topic.trim() || isSubmitting}
                        className="relative flex items-center gap-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-3 rounded-2xl font-bold text-sm transition-all overflow-hidden shadow-lg shadow-green-500/20 hover:shadow-green-500/30 active:scale-[0.98]"
                    >
                        {/* Shimmer on hover */}
                        {!isSubmitting && topic.trim() && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] hover:translate-x-[200%] transition-transform duration-700" />
                        )}
                        {isSubmitting ? (
                            <>
                                <Loader2 size={15} className="animate-spin" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles size={15} />
                                <span>Generate Report</span>
                            </>
                        )}
                    </button>
                </motion.div>
            </div>
            </div>
        </div>
    );
}

export default function ReportsLibrary({ setActiveContent }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    // Sync view with URL param ?view=creator so refresh stays on the creator
    const urlView = searchParams.get("view");
    const [view, setViewState] = useState(urlView === "creator" ? "creator" : "library");
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");

    const setView = useCallback((nextView) => {
        setViewState(nextView);
        const params = new URLSearchParams(searchParams.toString());
        if (nextView === "creator") {
            params.set("view", "creator");
        } else {
            params.delete("view");
        }
        router.replace(`/dashboard?${params.toString()}`);
    }, [router, searchParams]);

    useEffect(() => { fetchReports(); }, []);

    const fetchReports = async () => {
        try {
            const res = await apiClient.get("/api/reports");
            if (res.ok) {
                const data = await res.json();
                setReports(data.reports || []);
            }
        } catch (error) { console.error("Failed to fetch reports:", error); }
        finally { setLoading(false); }
    };

    const filtered = reports.filter(r => {
        const matchSearch = r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || r.topic?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchType = filterType === "all" || r.type?.toLowerCase() === filterType;
        return matchSearch && matchType;
    });

    const types = ["all", ...new Set(reports.map(r => r.type?.toLowerCase()).filter(Boolean))];

    // Creator view
    if (view === "creator") {
        return (
            <ReportCreator
                onBack={() => setView("library")}
                onCreated={() => {
                    setView("library");
                    fetchReports();
                }}
            />
        );
    }

    return (
        <div className="px-0 py-6 space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white" style={{ fontFamily: "var(--font-fraunces)" }}>Reports & Essays</h1>
                    <p className="text-slate-500 mt-1 text-[11px]">Your AI-generated research documents</p>
                </div>
                <button onClick={() => setView("creator")}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors">
                    <Plus size={14} /> Create New
                </button>
            </motion.div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search by title or topic..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-green-400/20 focus:border-green-400 transition-all" />
                </div>
                {types.length > 1 && (
                    <div className="flex items-center gap-1.5">
                        <Filter size={12} className="text-slate-400" />
                        {types.map(t => (
                            <button key={t} onClick={() => setFilterType(t)}
                                className={`px-3 py-2 rounded-lg text-[10px] font-bold capitalize transition-all ${filterType === t ? "bg-green-600 text-white" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-green-300 hover:text-green-600"}`}>
                                {t === "all" ? "All" : t}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : filtered.length > 0 ? (
                <AnimatePresence mode="wait">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map((report, i) => {
                            const typeKey = report.type?.toLowerCase() || "default";
                            const colors = TYPE_COLORS[typeKey] || TYPE_COLORS.default;
                            return (
                                <motion.div key={report._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                    onClick={() => router.push(`/reports/${report._id}`)}
                                    className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-green-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden">

                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={`w-9 h-9 ${colors.bg} rounded-lg flex items-center justify-center shrink-0`}>
                                            <ScrollText size={16} className={colors.text} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors" style={{ fontFamily: "var(--font-fraunces)" }}>
                                                {report.title || "Untitled Research"}
                                            </h3>
                                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                                {report.topic}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                            <span className="text-[10px] font-bold text-slate-500 capitalize">{report.type || "Report"}</span>
                                            {report.citationStyle && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-full">{report.citationStyle}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                            <Clock size={10} />
                                            {new Date(report.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                        </div>
                                    </div>

                                    <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform">
                                        Open Document <ExternalLink size={10} />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <FileText size={24} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1" style={{ fontFamily: "var(--font-fraunces)" }}>
                        {searchQuery ? "No results found" : "No documents yet"}
                    </h2>
                    <p className="text-slate-500 text-[11px] mb-4">
                        {searchQuery ? `Try searching with different keywords` : "Create your first research report or essay"}
                    </p>
                    <button onClick={() => setView("creator")}
                        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors">
                        <Plus size={14} /> Create Document
                    </button>
                </div>
            )}
        </div>
    );
}
