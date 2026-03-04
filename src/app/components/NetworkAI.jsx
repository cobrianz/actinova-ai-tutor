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
    X
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";

const Field = ({ label, children }) => (
    <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 ml-1">{label}</p>
        {children}
    </div>
);

const inputClass =
    "w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:border-violet-400 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500";

const textareaClass =
    "w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:border-violet-400 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none";



const HistoryCard = ({ entry, onOpen, onDelete }) => (
    <div
        onClick={onOpen}
        className="relative bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 flex flex-col gap-4 hover:border-violet-300 dark:hover:border-violet-700 transition-colors cursor-pointer group"
    >
        {/* Delete button */}
        <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="absolute top-4 right-4 w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center hidden group-hover:flex hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
        >
            <X size={13} />
        </button>

        <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
            {entry.mode === "outreach"
                ? <MessageSquare size={18} className="text-violet-600 dark:text-violet-400" />
                : <Compass size={18} className="text-violet-600 dark:text-violet-400" />}
        </div>
        <div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">
                {entry.mode === "outreach" ? `Outreach — ${entry.label}` : `Mentorship — ${entry.label}`}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">{entry.timestamp}</p>
        </div>
        <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${entry.mode === "outreach"
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                : "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
                }`}>
                {entry.mode === "outreach" ? entry.inputs.platform : "Mentorship"}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
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

    const handleGenerate = async () => {
        if (subMode === "outreach" && (!targetPerson.name || !targetPerson.role)) {
            toast.error("Please provide the target person's name and role");
            return;
        }
        setLoading(true);
        try {
            const response = await apiClient.post("/api/career/network", {
                action: subMode,
                targetPerson,
                userSkills,
                careerGoals,
                platform
            });
            if (response.ok) {
                const data = await response.json();
                setResults(data);
                const label = subMode === "outreach" ? (targetPerson.name || "Contact") : (careerGoals || "Career Goal");
                setHistory(prev => [{
                    mode: subMode,
                    label,
                    timestamp: new Date().toLocaleString(),
                    results: data,
                    inputs: { targetPerson: { ...targetPerson }, userSkills, careerGoals, platform }
                }, ...prev]);
                toast.success("Network strategy generated!");
            } else {
                toast.error("Failed to generate content");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const restoreEntry = (entry) => {
        setSubMode(entry.mode);
        if (entry.mode === "outreach") {
            setTargetPerson(entry.inputs.targetPerson);
            setPlatform(entry.inputs.platform);
        } else {
            setUserSkills(entry.inputs.userSkills);
            setCareerGoals(entry.inputs.careerGoals);
        }
        setResults(entry.results);
    };

    const copyToClipboard = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const deleteHistoryEntry = (index) => {
        setHistory(prev => prev.filter((_, i) => i !== index));
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
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">

            {/* Header */}
            <div>
                <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">Network AI</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mt-3 max-w-xl font-medium leading-relaxed">
                    Craft high-conversion outreach and discover the right mentors to accelerate your career trajectory.
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1.5 w-fit">
                {[
                    { id: "outreach", label: "Professional Outreach", icon: MessageSquare },
                    { id: "mentorship", label: "Mentorship Matching", icon: Compass }
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => { setSubMode(id); setResults(null); }}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${subMode === id
                            ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 border border-slate-200 dark:border-slate-600"
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
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                        >
                            {/* Form */}
                            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                                <AnimatePresence mode="wait">
                                    {subMode === "outreach" ? (
                                        <motion.div key="outreach-form" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 space-y-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                                        <Target size={16} className="text-violet-600 dark:text-violet-400" />
                                                    </div>
                                                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Target Contact</h2>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Field label="Full Name">
                                                        <input type="text" placeholder="e.g. Jane Doe" className={inputClass}
                                                            value={targetPerson.name}
                                                            onChange={e => setTargetPerson({ ...targetPerson, name: e.target.value })} />
                                                    </Field>
                                                    <Field label="Current Role">
                                                        <input type="text" placeholder="e.g. CTO at TechCorp" className={inputClass}
                                                            value={targetPerson.role}
                                                            onChange={e => setTargetPerson({ ...targetPerson, role: e.target.value })} />
                                                    </Field>
                                                </div>
                                                <Field label="Connection Context">
                                                    <input type="text"
                                                        placeholder="e.g. Saw your talk on AI, Read your Forbes article..."
                                                        className={inputClass}
                                                        value={targetPerson.context}
                                                        onChange={e => setTargetPerson({ ...targetPerson, context: e.target.value })} />
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
                                                            onClick={() => setPlatform(id)}
                                                            className={`flex-1 flex items-center justify-center gap-2.5 h-14 rounded-2xl border-2 text-sm font-bold transition-all ${platform === id
                                                                ? "border-violet-400 dark:border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
                                                                : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300"
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
                                        <motion.div key="mentorship-form" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                            className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 space-y-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                                    <Compass size={16} className="text-violet-600 dark:text-violet-400" />
                                                </div>
                                                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Your Career Compass</h2>
                                            </div>
                                            <Field label="Key Skills & Experience">
                                                <textarea placeholder="Tell us what you're good at..." className={`${textareaClass} h-32`}
                                                    value={userSkills} onChange={e => setUserSkills(e.target.value)} />
                                            </Field>
                                            <Field label="Dream Career Milestone">
                                                <input type="text" placeholder="e.g. Become a Principal Engineer, pivot into Product..."
                                                    className={inputClass} value={careerGoals} onChange={e => setCareerGoals(e.target.value)} />
                                            </Field>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Sidebar */}
                            <motion.div variants={itemVariants} className="space-y-5">
                                <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30 rounded-3xl p-7 space-y-5">
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={15} className="text-violet-500" />
                                        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">Pro Tips</span>
                                    </div>
                                    <ul className="space-y-4">
                                        {[
                                            "Mention a specific detail to show you've done your research.",
                                            "Keep LinkedIn messages under 300 chars for higher response rates.",
                                            "A great mentor is often just 2–3 steps ahead of you, not 10."
                                        ].map((tip, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
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
                                    className="w-full h-14 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-base font-black flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                    {loading ? "Generating..." : "Generate Strategy"}
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
                                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {results.messages.map((msg, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-7 flex flex-col gap-5 hover:border-violet-300 dark:hover:border-violet-700 transition-colors group">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">{msg.title}</span>
                                                <button
                                                    onClick={() => copyToClipboard(msg.content, i)}
                                                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 transition-colors"
                                                >
                                                    {copiedIndex === i ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                                </button>
                                            </div>
                                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors whitespace-pre-wrap flex-1">
                                                {msg.content}
                                            </p>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                    {results.mentorArchetypes.map((type, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-7 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
                                            <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-5">
                                                <UserCircle size={26} />
                                            </div>
                                            <h3 className="text-xl font-black mb-1 text-slate-900 dark:text-white">{type.persona}</h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-500 mb-4">{type.expertise}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5 italic">"{type.valueAdd}"</p>
                                            <div className="flex flex-wrap gap-2">
                                                {type.searchKeywords.map((kw, j) => (
                                                    <span key={j} className="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg">
                                                        #{kw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            <motion.div variants={itemVariants}
                                className="flex justify-center md:justify-end"
                            >
                                <button
                                    onClick={() => setResults(null)}
                                    className="flex items-center gap-3 h-12 px-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-700 dark:text-slate-300 hover:border-violet-400 hover:text-violet-600 transition-all"
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
                        <Clock size={15} className="text-slate-400" />
                        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Session History</span>
                        <span className="ml-auto text-[11px] font-bold text-slate-400">{history.length} {history.length === 1 ? "result" : "results"}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {history.map((entry, i) => (
                            <HistoryCard
                                key={i}
                                entry={entry}
                                onOpen={() => restoreEntry(entry)}
                                onDelete={() => deleteHistoryEntry(i)}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default NetworkAI;
