"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Search, Plus, ScrollText, ExternalLink, Filter, FileText, Clock,
    ChevronDown, ArrowLeft, Sparkles, Loader2, ScrollText as ScrollTextIcon,
    BookOpen, AlignLeft, Quote, Check, ChevronLeft, ChevronRight, Building2,
    ListTree, GraduationCap, BriefcaseBusiness, Landmark, ClipboardCheck,
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

const DOCUMENT_TYPES = [
    { id: "research_project", name: "Research Project", pages: "20–70 pages", description: "Five-chapter academic project with findings and conclusion.", icon: BookOpen, sections: ["Introduction", "Literature Review", "Methodology", "Findings", "Conclusion"] },
    { id: "research_proposal", name: "Research Proposal", pages: "10–40 pages", description: "Pre-research proposal written in future tense.", icon: ClipboardCheck, sections: ["Introduction", "Literature Review", "Methodology", "Work Plan"] },
    { id: "academic_essay", name: "Academic Essay", pages: "2–25 pages", description: "A thesis argued paragraph by paragraph with evidence.", icon: AlignLeft, sections: ["Introduction", "Arguments and Evidence", "Conclusion"] },
    { id: "literature_review", name: "Literature Review", pages: "6–50 pages", description: "Theme-by-theme synthesis, debates, and research gaps.", icon: Quote, sections: ["Introduction", "Themes", "Debates", "Research Gaps", "Conclusion"] },
    { id: "term_paper", name: "Term Paper", pages: "5–40 pages", description: "Course paper balancing description and critical analysis.", icon: GraduationCap, sections: ["Introduction", "Background", "Analysis", "Conclusion"] },
    { id: "business_report", name: "Business Report", pages: "5–50 pages", description: "Decision-oriented report with an executive summary.", icon: BriefcaseBusiness, sections: ["Executive Summary", "Findings", "Analysis", "Recommendations"] },
    { id: "grant_proposal", name: "Grant Proposal", pages: "4–40 pages", description: "Funder-ready need statement, SMART objectives, and budget narrative.", icon: Landmark, sections: ["Need Statement", "Objectives", "Activities", "Evaluation", "Budget Narrative"] },
    { id: "case_study", name: "Case Study", pages: "4–40 pages", description: "Diagnose a case, compare options, and recommend an action plan.", icon: FileText, sections: ["Situation", "Diagnosis", "Options", "Recommendation", "Implementation"] },
    { id: "business_plan", name: "Business Plan", pages: "8–50 pages", description: "Investor-ready market, operations, and financial plan.", icon: Building2, sections: ["Executive Summary", "Market Analysis", "Operations", "Marketing", "Financial Projections"] },
    { id: "dissertation", name: "Dissertation", pages: "50–150 pages", description: "Extended original research with rigorous methods and contribution.", icon: GraduationCap, sections: ["Introduction", "Literature Review", "Methodology", "Results", "Discussion", "Conclusion"] },
    { id: "capstone_project", name: "Capstone Project", pages: "20–80 pages", description: "Applied final project linking research, design, delivery, and evaluation.", icon: ClipboardCheck, sections: ["Problem", "Research", "Solution Design", "Implementation", "Evaluation"] },
    { id: "policy_brief", name: "Policy Brief", pages: "2–12 pages", description: "Concise evidence-based options and recommendation for decision makers.", icon: Landmark, sections: ["Issue", "Evidence", "Policy Options", "Recommendation", "Implementation"] },
    { id: "white_paper", name: "White Paper", pages: "6–30 pages", description: "Authoritative analysis of a problem, approach, and supporting evidence.", icon: FileText, sections: ["Executive Summary", "Problem", "Evidence", "Approach", "Benefits", "Next Steps"] },
    { id: "feasibility_study", name: "Feasibility Study", pages: "8–40 pages", description: "Test market, technical, operational, legal, and financial viability.", icon: BriefcaseBusiness, sections: ["Project Overview", "Market", "Technical", "Operations", "Financials", "Recommendation"] },
    { id: "lab_report", name: "Laboratory Report", pages: "4–20 pages", description: "Scientific report with method, results, analysis, and limitations.", icon: BookOpen, sections: ["Abstract", "Introduction", "Method", "Results", "Discussion", "Conclusion"] },
    { id: "project_proposal", name: "Project Proposal", pages: "4–30 pages", description: "Scope, deliverables, timeline, resources, risks, and approval case.", icon: ListTree, sections: ["Problem", "Objectives", "Scope", "Deliverables", "Timeline", "Budget", "Risks"] },
    { id: "annotated_bibliography", name: "Annotated Bibliography", pages: "2–20 pages", description: "Source-by-source citations with critical summaries and relevance notes.", icon: BookOpen, sections: ["Introduction", "Annotations", "Conclusion"] },
    { id: "reflective_journal", name: "Reflective Journal", pages: "2–30 pages", description: "Personal critical reflection on experience, learning, and growth.", icon: ScrollTextIcon, sections: ["Experience", "Feelings", "Evaluation", "Analysis", "Conclusion", "Action Plan"] },
];

const CREATOR_STEPS = ["Document Type", "Research Brief", "Structure", "Institution", "Review"];

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
    const [reportType, setReportType] = useState(draft?.reportType ?? "research_project");
    const [reportLength, setReportLength] = useState(draft?.reportLength ?? "medium");
    const [citationStyle, setCitationStyle] = useState(draft?.citationStyle ?? "APA");
    const [difficulty, setDifficulty] = useState(draft?.difficulty ?? "beginner");
    const [step, setStep] = useState(draft?.step ?? 0);
    const [researchQuestion, setResearchQuestion] = useState(draft?.researchQuestion ?? "");
    const [requirements, setRequirements] = useState(draft?.requirements ?? "");
    const [institution, setInstitution] = useState(draft?.institution ?? "");
    const [academicLevel, setAcademicLevel] = useState(draft?.academicLevel ?? "Undergraduate");
    const [criticalDepth, setCriticalDepth] = useState(draft?.criticalDepth ?? "Moderate");
    const [includeToc, setIncludeToc] = useState(draft?.includeToc ?? true);
    const [includeFigures, setIncludeFigures] = useState(draft?.includeFigures ?? false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showLoader, setShowLoader] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Persist draft to sessionStorage whenever fields change
    useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ topic, reportType, reportLength, citationStyle, difficulty, step, researchQuestion, requirements, institution, academicLevel, criticalDepth, includeToc, includeFigures }));
        } catch { /* ignore */ }
    }, [topic, reportType, reportLength, citationStyle, difficulty, step, researchQuestion, requirements, institution, academicLevel, criticalDepth, includeToc, includeFigures]);

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
                academicLevel,
                criticalDepth,
                researchQuestion: researchQuestion.trim(),
                requirements: requirements.trim(),
                institution: institution.trim(),
                includeToc,
                includeFigures,
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
            <div className="w-full max-w-4xl">
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

                <div className="flex flex-col md:flex-row gap-6">
                    <nav className="md:w-44 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
                        {CREATOR_STEPS.map((label, index) => (
                            <button key={label} type="button" onClick={() => setStep(index)} className={`flex items-center gap-2 text-left whitespace-nowrap rounded-lg px-2.5 py-2 text-[11px] transition-colors ${step === index ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                                <span className={`grid h-5 w-5 place-items-center rounded-full border text-[9px] font-bold ${step === index ? "border-green-600 bg-white text-green-700" : step > index ? "border-green-600 bg-green-600 text-white" : "border-slate-200 text-slate-400 dark:border-slate-700"}`}>{step > index ? <Check size={11} /> : index + 1}</span>
                                {label}
                            </button>
                        ))}
                    </nav>
                    <div className="min-w-0 flex-1">
                {step === 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6 -mx-1">
                        {DOCUMENT_TYPES.map((type) => {
                            const Icon = type.icon;
                            const active = reportType === type.id;
                            return <button key={type.id} type="button" onClick={() => setReportType(type.id)} className={`text-left rounded-xl border p-4 transition-all ${active ? "border-green-500 bg-green-50/70 ring-1 ring-green-200 dark:border-green-500 dark:bg-green-950/20" : "border-slate-200 bg-white hover:border-green-300 dark:border-slate-700 dark:bg-slate-900"}`}>
                                <div className="mb-2 flex items-center justify-between"><Icon size={16} className={active ? "text-green-600 shrink-0" : "text-slate-400 shrink-0"} /><span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 text-right">{type.name}</span></div>
                                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{type.description}</p>
                            </button>;
                        })}
                    </div>
                )}

                {/* Topic textarea */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={step === 1 ? "mb-5" : "hidden"}
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
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-widest px-1 mt-5 mb-2">RESEARCH QUESTION OR OUTCOME</label>
                    <input value={researchQuestion} onChange={(e) => setResearchQuestion(e.target.value)} maxLength={800} placeholder="What should this document answer, prove, or enable?" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-widest px-1 mt-5 mb-2">ASSIGNMENT REQUIREMENTS</label>
                    <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3} maxLength={3000} placeholder="Paste marking criteria, required sources, constraints, or instructions..." className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
                </motion.div>

                {/* Options grid */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className={step === 2 ? "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6" : "hidden"}
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

                {step === 2 && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"><div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><ListTree size={15} className="text-green-600" /> Included structure</div><div className="mt-3 flex flex-wrap gap-2">{(DOCUMENT_TYPES.find((item) => item.id === reportType)?.sections || []).map((section) => <span key={section} className="rounded-md bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">{section}</span>)}</div><label className="mt-4 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" checked={includeToc} onChange={(e) => setIncludeToc(e.target.checked)} className="accent-green-600" /> Include a table of contents</label><label className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" checked={includeFigures} onChange={(e) => setIncludeFigures(e.target.checked)} className="accent-green-600" /> Plan tables and figures where they add value</label></div>}

                {step === 3 && <div className="space-y-4 mb-6"><div><label className="block text-[11px] font-bold tracking-widest text-slate-500 mb-2">INSTITUTION OR CLIENT</label><input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="e.g. University of Nairobi, Faculty of Business" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-400 dark:border-slate-700 dark:bg-slate-900" /></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><label className="text-[11px] font-bold tracking-widest text-slate-500">ACADEMIC LEVEL<select value={academicLevel} onChange={(e) => setAcademicLevel(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium normal-case tracking-normal dark:border-slate-700 dark:bg-slate-900"><option>Undergraduate</option><option>Masters</option><option>Doctoral</option><option>Professional</option></select></label><label className="text-[11px] font-bold tracking-widest text-slate-500">ANALYTICAL DEPTH<select value={criticalDepth} onChange={(e) => setCriticalDepth(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium normal-case tracking-normal dark:border-slate-700 dark:bg-slate-900"><option>Foundational</option><option>Moderate</option><option>Advanced</option></select></label></div></div>}

                {step === 4 && <div className="mb-6 rounded-2xl border border-green-200 bg-green-50/60 p-5 dark:border-green-900 dark:bg-green-950/20"><p className="text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-300">Ready to create</p><h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">{DOCUMENT_TYPES.find((item) => item.id === reportType)?.name}</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{topic || "Add a research brief before generating."}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-400">Citation style</dt><dd className="font-bold text-slate-700 dark:text-slate-200">{citationStyle}</dd></div><div><dt className="text-slate-400">Level</dt><dd className="font-bold text-slate-700 dark:text-slate-200">{academicLevel}</dd></div><div><dt className="text-slate-400">Contents</dt><dd className="font-bold text-slate-700 dark:text-slate-200">{includeToc ? "Included" : "Not included"}</dd></div><div><dt className="text-slate-400">Institution</dt><dd className="font-bold text-slate-700 dark:text-slate-200">{institution || "Not specified"}</dd></div></dl></div>}

                {/* Generate button */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.38 }}
                    className="flex items-center justify-between gap-3"
                >
                    <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="flex items-center gap-1.5 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 disabled:opacity-0"><ChevronLeft size={15} /> Back</button>
                    <button
                        onClick={() => step < CREATOR_STEPS.length - 1 ? setStep((current) => current + 1) : handleGenerate()}
                        disabled={(step === 1 && !topic.trim()) || (step === 4 && (!topic.trim() || isSubmitting))}
                        className="relative flex items-center gap-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all overflow-hidden shadow-md shadow-green-500/20 hover:shadow-green-500/30 active:scale-[0.98]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <span>{step === CREATOR_STEPS.length - 1 ? "Generate document" : "Continue"}</span>
                        )}
                    </button>
                </motion.div>
                    </div>
                </div>
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
