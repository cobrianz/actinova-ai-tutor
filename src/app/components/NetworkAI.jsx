"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    Users,
    Mail,
    Linkedin,
    Copy,
    Check,
    Sparkles,
    Target,
    UserCircle,
    Compass,
    Loader2,
    ArrowRight,
    MessageSquare,
    Clock,
    X,
    AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";

const Field = ({ label, children, description }) => (
    <div className="space-y-2">
        <div>
            <p className="text-xs font-black text-slate-500 dark:text-slate-400 ml-1">{label}</p>
            {description && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 ml-1">{description}</p>
            )}
        </div>
        {children}
    </div>
);

const inputClass =
    "w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:border-violet-400 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500";

const textareaClass =
    "w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:border-violet-400 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none";

const HistoryCard = ({ entry, onOpen, onDelete }) => (
    <div
        onClick={onOpen}
        className="relative bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border-2 border-violet-200 dark:border-violet-800 rounded-2xl sm:rounded-3xl p-6 flex flex-col gap-4 hover:border-violet-400 dark:hover:border-violet-600 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full shadow-lg hover:shadow-xl shadow-violet-500/10"
    >
        <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-violet-500/10 transition-colors" />

        <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="absolute top-4 right-4 w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center hidden group-hover:flex hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors z-10"
        >
            <X size={13} />
        </button>

        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0 relative z-10">
            {entry.mode === "outreach"
                ? <MessageSquare size={18} className="text-violet-600 dark:text-violet-400" />
                : <Compass size={18} className="text-violet-600 dark:text-violet-400" />}
        </div>
        <div className="relative z-10">
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">
                {entry.mode === "outreach" ? `Outreach — ${entry.label}` : `Mentorship — ${entry.label}`}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{entry.timestamp}</p>
        </div>
        <div className="flex items-center gap-2 relative z-10">
            <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${entry.mode === "outreach"
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30"
                : "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/30"
                }`}>
                {entry.mode === "outreach" ? entry.inputs.platform : "Mentorship"}
            </span>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                {entry.mode === "outreach"
                    ? `${entry.results.messages?.length ?? 0} messages`
                    : `${entry.results.mentorArchetypes?.length ?? 0} archetypes`}
            </span>
        </div>
    </div>
);

const NetworkAI = () => {
    const [subMode, setSubMode] = useState("outreach");
    const [platform, setPlatform] = useState("linkedin");
    const [targetPerson, setTargetPerson] = useState({ name: "", role: "", company: "", context: "" });
    const [userSkills, setUserSkills] = useState("");
    const [careerGoals, setCareerGoals] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);

    // Fetch history from DB
    React.useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await apiClient.get("/api/career/history?type=network");
            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            }
        } catch (err) {
            console.error("Failed to fetch history:", err);
        }
    };

    const handleGenerate = async () => {
        if (subMode === "outreach" && (!targetPerson.name || !targetPerson.role)) {
            toast.error("Please provide the target person's name and role");
            setError("Target person's name and role are required");
            return;
        }
        if (subMode === "mentorship" && (!userSkills.trim() || !careerGoals.trim())) {
            toast.error("Please provide your skills and career goals");
            setError("Skills and career goals are required");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.post("/api/career/network", {
                action: subMode,
                targetPerson: subMode === "outreach" ? targetPerson : undefined,
                userSkills: subMode === "mentorship" ? userSkills : undefined,
                careerGoals: subMode === "mentorship" ? careerGoals : undefined,
                platform: subMode === "outreach" ? platform : undefined
            });

            if (response.ok) {
                const data = await response.json();

                if (!data || typeof data !== 'object') {
                    throw new Error("Invalid response from server");
                }

                setResults(data);
                const label = subMode === "outreach" ? (targetPerson.name || "Contact") : (careerGoals || "Career Goal");

                // Save to persistent history
                await apiClient.post("/api/career/history", {
                    type: "network",
                    title: label,
                    data: data,
                    metadata: {
                        subMode,
                        targetPerson: { ...targetPerson },
                        userSkills,
                        careerGoals,
                        platform
                    }
                });
                fetchHistory(); // Refresh list

                toast.success("Network strategy generated!");
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || "Failed to generate content";
                setError(errorMessage);
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("Network AI error:", error);
            const errorMessage = error.message || "An error occurred. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const restoreEntry = (item) => {
        const entry = {
            mode: item.metadata?.subMode || "outreach",
            inputs: {
                targetPerson: item.metadata?.targetPerson || { name: "", role: "", company: "", context: "" },
                platform: item.metadata?.platform || "linkedin",
                userSkills: item.metadata?.userSkills || "",
                careerGoals: item.metadata?.careerGoals || ""
            },
            results: item.data
        };

        setSubMode(entry.mode);
        if (entry.mode === "outreach") {
            setTargetPerson(entry.inputs.targetPerson);
            setPlatform(entry.inputs.platform);
        } else {
            setUserSkills(entry.inputs.userSkills);
            setCareerGoals(entry.inputs.careerGoals);
        }
        setResults(entry.results);
        setError(null);
    };

    const copyToClipboard = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const deleteHistoryEntry = async (id, e) => {
        e.stopPropagation();
        try {
            const response = await apiClient.delete(`/api/career/history?id=${id}`);
            if (response.ok) {
                toast.success("History item deleted");
                setHistory(prev => prev.filter(item => item._id !== id));
            }
        } catch (err) {
            toast.error("Failed to delete history item");
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
    };

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 space-y-6 sm:space-y-8 md:space-y-10 bg-gradient-to-br from-violet-50/50 via-purple-50/50 to-pink-50/50 dark:from-violet-950 dark:via-purple-950/50 dark:to-pink-950/50 min-h-screen">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
                            Network AI
                        </h1>
                        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
                            Craft high-conversion outreach and discover the right mentors
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Error Display */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3"
                >
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-red-900 dark:text-red-200">Error</p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}

            {/* Mode Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1.5 w-fit border-2 border-slate-200 dark:border-slate-700">
                {[
                    { id: "outreach", label: "Professional Outreach", icon: MessageSquare },
                    { id: "mentorship", label: "Mentorship Matching", icon: Compass }
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => {
                            setSubMode(id);
                            setResults(null);
                            setError(null);
                        }}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${subMode === id
                            ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-800 dark:to-purple-800 text-violet-700 dark:text-violet-300 border-2 border-violet-300 dark:border-violet-600 shadow-lg shadow-violet-500/20"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                    >
                        <Icon size={15} />
                        {label}
                    </button>
                ))}
            </div>

            <div>
                <AnimatePresence mode="wait">
                    {!results ? (
                        <motion.div
                            key="form"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, y: -12 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8"
                        >
                            {/* Form */}
                            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                                <AnimatePresence mode="wait">
                                    {subMode === "outreach" ? (
                                        <motion.div
                                            key="outreach-form"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="space-y-6"
                                        >
                                            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-rose-950/30 border-2 border-purple-200 dark:border-purple-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg shadow-purple-500/10">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                                        <Target size={16} className="text-violet-600 dark:text-violet-400" />
                                                    </div>
                                                    <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100">Target Contact</h2>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Field label="Full Name" description="The person's full name">
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Jane Doe"
                                                            className={inputClass}
                                                            value={targetPerson.name}
                                                            onChange={e => {
                                                                setTargetPerson({ ...targetPerson, name: e.target.value });
                                                                setError(null);
                                                            }}
                                                        />
                                                    </Field>
                                                    <Field label="Current Role" description="Their job title and company">
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. CTO at TechCorp"
                                                            className={inputClass}
                                                            value={targetPerson.role}
                                                            onChange={e => {
                                                                setTargetPerson({ ...targetPerson, role: e.target.value });
                                                                setError(null);
                                                            }}
                                                        />
                                                    </Field>
                                                </div>
                                                <Field label="Connection Context" description="Why you're reaching out">
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Saw your talk on AI, Read your Forbes article..."
                                                        className={inputClass}
                                                        value={targetPerson.context}
                                                        onChange={e => {
                                                            setTargetPerson({ ...targetPerson, context: e.target.value });
                                                            setError(null);
                                                        }}
                                                    />
                                                </Field>
                                            </div>

                                            <Field label="Outreach Platform">
                                                <div className="flex gap-3 mt-1">
                                                    {[
                                                        { id: "linkedin", label: "LinkedIn", icon: Linkedin },
                                                        { id: "email", label: "Email", icon: Mail }
                                                    ].map(({ id, label, icon: Icon }) => (
                                                        <button
                                                            key={id}
                                                            onClick={() => {
                                                                setPlatform(id);
                                                                setError(null);
                                                            }}
                                                            className={`flex-1 flex items-center justify-center gap-2.5 h-14 rounded-2xl border-2 text-sm font-bold transition-all ${platform === id
                                                                ? "border-violet-400 dark:border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 shadow-sm"
                                                                : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                                                                }`}
                                                        >
                                                            <Icon size={18} />
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </Field>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="mentorship-form"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border-2 border-violet-200 dark:border-violet-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg shadow-violet-500/10"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                                    <Compass size={16} className="text-violet-600 dark:text-violet-400" />
                                                </div>
                                                <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100">Your Career Compass</h2>
                                            </div>
                                            <Field label="Key Skills & Experience" description="What you're good at">
                                                <textarea
                                                    placeholder="Tell us what you're good at..."
                                                    className={`${textareaClass} h-32`}
                                                    value={userSkills}
                                                    onChange={e => {
                                                        setUserSkills(e.target.value);
                                                        setError(null);
                                                    }}
                                                />
                                            </Field>
                                            <Field label="Dream Career Milestone" description="Where you want to be">
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Become a Principal Engineer, pivot into Product..."
                                                    className={inputClass}
                                                    value={careerGoals}
                                                    onChange={e => {
                                                        setCareerGoals(e.target.value);
                                                        setError(null);
                                                    }}
                                                />
                                            </Field>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Sidebar */}
                            <motion.div variants={itemVariants} className="space-y-5">
                                <div className="bg-gradient-to-br from-violet-100 via-indigo-100 to-purple-100 dark:from-violet-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 border-2 border-violet-300 dark:border-violet-700 rounded-2xl sm:rounded-3xl p-6 sm:p-7 space-y-5 shadow-lg shadow-violet-500/10">
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={15} className="text-violet-500" />
                                        <span className="text-xs font-black text-violet-600 dark:text-violet-400">Pro Tips</span>
                                    </div>
                                    <ul className="space-y-4">
                                        {[
                                            "Mention a specific detail to show you've done your research.",
                                            "Keep LinkedIn messages under 300 chars for higher response rates.",
                                            "A great mentor is often just 2–3 steps ahead of you, not 10."
                                        ].map((tip, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                                                    {i + 1}
                                                </span>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <Button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-base font-black flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} />
                                            Generate Strategy
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0 }}
                            className="space-y-8"
                        >
                            {subMode === "outreach" ? (
                                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                                    {(results.messages || []).map((msg, i) => (
                                        <div key={i} className="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border-2 border-violet-200 dark:border-violet-800 rounded-2xl sm:rounded-3xl p-6 sm:p-7 flex flex-col gap-5 hover:border-violet-400 dark:hover:border-violet-600 transition-all shadow-lg hover:shadow-xl shadow-violet-500/10 group">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-violet-600 dark:text-violet-400">{msg.title || 'Message'}</span>
                                                <button
                                                    onClick={() => copyToClipboard(msg.content, i)}
                                                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 transition-colors"
                                                >
                                                    {copiedIndex === i ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                                </button>
                                            </div>
                                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors whitespace-pre-wrap flex-1">
                                                {msg.content || 'No content available'}
                                            </p>
                                        </div>
                                    ))}
                                    {(!results.messages || results.messages.length === 0) && (
                                        <div className="col-span-3 text-center py-8">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 italic">No messages generated</p>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                                    {(results.mentorArchetypes || []).map((type, i) => (
                                        <div key={i} className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-rose-950/30 border-2 border-purple-200 dark:border-purple-800 rounded-2xl sm:rounded-3xl p-6 sm:p-7 hover:border-purple-400 dark:hover:border-purple-600 transition-all shadow-lg hover:shadow-xl shadow-purple-500/10">
                                            <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-5">
                                                <UserCircle size={26} />
                                            </div>
                                            <h3 className="text-xl font-black mb-1 text-slate-900 dark:text-white">{type.persona || 'Mentor Type'}</h3>
                                            <p className="text-xs font-black text-violet-500 mb-4">{type.expertise || 'Expertise'}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5 italic">"{type.valueAdd || 'No value add description'}"</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(type.searchKeywords || []).map((kw, j) => (
                                                    <span key={j} className="text-xs font-black bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg">
                                                        #{kw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {(!results.mentorArchetypes || results.mentorArchetypes.length === 0) && (
                                        <div className="col-span-3 text-center py-8">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 italic">No mentor archetypes generated</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            <motion.div variants={itemVariants} className="flex justify-center md:justify-end">
                                <button
                                    onClick={() => {
                                        setResults(null);
                                        setError(null);
                                    }}
                                    className="flex items-center gap-3 h-12 px-8 rounded-2xl bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 border-2 border-violet-300 dark:border-violet-700 text-sm font-black text-violet-700 dark:text-violet-300 hover:border-violet-500 hover:text-violet-800 dark:hover:text-violet-200 transition-all shadow-lg shadow-violet-500/20 hover:shadow-xl"
                                >
                                    Refine Inputs <ArrowRight size={16} />
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* History Section */}
            {history.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-8 border-t border-slate-200 dark:border-slate-700 space-y-5"
                >
                    <div className="flex items-center gap-2">
                        <Clock size={15} className="text-slate-400 dark:text-slate-500" />
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400">Session History</span>
                        <span className="ml-auto text-xs font-bold text-slate-400 dark:text-slate-500">{history.length} {history.length === 1 ? "result" : "results"}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {history.map((item) => {
                            const entry = {
                                mode: item.metadata?.subMode || "outreach",
                                label: item.title,
                                timestamp: new Date(item.createdAt).toLocaleDateString(),
                                inputs: { platform: item.metadata?.platform || "linkedin" },
                                results: item.data
                            };
                            return (
                                <HistoryCard
                                    key={item._id}
                                    entry={entry}
                                    onOpen={() => restoreEntry(item)}
                                    onDelete={(e) => deleteHistoryEntry(item._id, e)}
                                />
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default NetworkAI;
