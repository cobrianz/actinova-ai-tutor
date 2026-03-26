"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    Users, Mail, Linkedin, Copy, Check, Sparkles, Target,
    UserCircle, Compass, Loader2, ArrowRight, MessageSquare,
    Clock, X, AlertCircle, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";
import { useAuth } from "./AuthProvider";
import UpgradeModal from "./UpgradeModal";

function InputField({ label, value, onChange, placeholder, rows, description }) {
    const base = "w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400 transition-all";
    return (
        <div className="flex flex-col gap-1.5">
            <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</label>
                {description && <p className="text-[10px] text-slate-400 mt-0.5">{description}</p>}
            </div>
            {rows
                ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} className={`${base} resize-none`} />
                : <input value={value} onChange={onChange} placeholder={placeholder} className={base} />}
        </div>
    );
}

const MODES = [
    { id: "outreach", label: "Professional Outreach", icon: MessageSquare },
    { id: "mentorship", label: "Mentorship Matching", icon: Compass },
];

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
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const { user, loading: authLoading } = useAuth();

    const isPro = !authLoading && user && (
        (user.subscription && (user.subscription.plan === "pro" || user.subscription.plan === "enterprise") && user.subscription.status === "active") ||
        user.isPremium
    );

    React.useEffect(() => { fetchHistory(); }, []);

    const fetchHistory = async () => {
        try {
            const res = await apiClient.get("/api/career/history?type=network");
            if (res.ok) setHistory(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleGenerate = async () => {
        if (subMode === "outreach" && (!targetPerson.name || !targetPerson.role)) {
            toast.error("Please provide the contact's name and role"); return;
        }
        if (subMode === "mentorship" && (!userSkills.trim() || !careerGoals.trim())) {
            toast.error("Please provide your skills and career goals"); return;
        }
        if (!isPro) {
            setShowUpgradeModal(true);
            return;
        }
        setLoading(true); setError(null);
        try {
            const res = await apiClient.post("/api/career/network", {
                action: subMode,
                targetPerson: subMode === "outreach" ? targetPerson : undefined,
                userSkills: subMode === "mentorship" ? userSkills : undefined,
                careerGoals: subMode === "mentorship" ? careerGoals : undefined,
                platform: subMode === "outreach" ? platform : undefined,
            });
            if (res.ok) {
                const data = await res.json();
                setResults(data);
                fetchHistory();
                toast.success("Network strategy generated!");
            } else {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to generate content");
            }
        } catch (e) {
            setError(e.message); toast.error(e.message);
        } finally { setLoading(false); }
    };

    const restoreEntry = (item) => {
        setSubMode(item.metadata?.subMode || "outreach");
        setTargetPerson(item.metadata?.targetPerson || { name: "", role: "", company: "", context: "" });
        setPlatform(item.metadata?.platform || "linkedin");
        setUserSkills(item.metadata?.userSkills || "");
        setCareerGoals(item.metadata?.careerGoals || "");
        setResults(item.data);
        setError(null);
    };

    const copyToClipboard = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        toast.success("Copied!"); setTimeout(() => setCopiedIndex(null), 2000);
    };

    const deleteEntry = async (id, e) => {
        e.stopPropagation();
        const res = await apiClient.delete(`/api/career/history?id=${id}`);
        if (res.ok) { toast.success("Deleted"); setHistory(prev => prev.filter(i => i._id !== id)); }
    };

    return (
        <div className="w-full px-2 sm:px-4 py-6 sm:py-10 min_h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white">Network AI</h1>
                <p className="text-slate-500 mt-2">Craft high-conversion outreach and discover the right mentors</p>
            </motion.header>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                        <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 flex-1">{error}</p>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mode toggle */}
            <nav className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 w-fit mx-auto mb-8">
                {MODES.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => { setSubMode(id); setResults(null); setError(null); }}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${subMode === id ? 'bg-green-600 text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <Icon size={15} />{label}
                    </button>
                ))}
            </nav>

            <AnimatePresence mode="wait">
                {!results ? (
                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Form */}
                        <div className="lg:col-span-2">
                            <AnimatePresence mode="wait">
                                {subMode === "outreach" ? (
                                    <motion.div key="outreach" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                        className="w-full bg-white dark:bg-slate-900 rounded-none md:rounded-3xl border-x-0 md:border border-slate-200 dark:border-slate-800 p-4 sm:p-6 md:p-8 space-y-5">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center"><Target size={16} className="text-green-600" /></div>
                                            <h2 className="font-bold text-slate-800 dark:text-slate-200">Target Contact</h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <InputField label="Full Name *" description="The person's full name" value={targetPerson.name} onChange={e => setTargetPerson({ ...targetPerson, name: e.target.value })} placeholder="e.g. Jane Doe" />
                                            <InputField label="Current Role *" description="Their job title" value={targetPerson.role} onChange={e => setTargetPerson({ ...targetPerson, role: e.target.value })} placeholder="e.g. CTO at TechCorp" />
                                        </div>
                                        <InputField label="Connection Context" description="Why you're reaching out" value={targetPerson.context} onChange={e => setTargetPerson({ ...targetPerson, context: e.target.value })} placeholder="e.g. Saw your talk on AI, Read your Forbes article..." />
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">Platform</label>
                                            <div className="flex gap-3">
                                                {[{ id: "linkedin", label: "LinkedIn", icon: Linkedin }, { id: "email", label: "Email", icon: Mail }].map(({ id, label, icon: Icon }) => (
                                                    <button key={id} onClick={() => setPlatform(id)}
                                                        className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl border-2 text-sm font-bold transition-all ${platform === id ? 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-600' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-green-200'}`}>
                                                        <Icon size={16} />{label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="mentorship" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                        className="w-full bg-white dark:bg-slate-900 rounded-none md:rounded-3xl border-x-0 md:border border-slate-200 dark:border-slate-800 p-4 sm:p-6 md:p-8 space-y-5">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center"><Compass size={16} className="text-green-600" /></div>
                                            <h2 className="font-bold text-slate-800 dark:text-slate-200">Your Career Compass</h2>
                                        </div>
                                        <InputField label="Your Skills & Experience *" description="What you're good at" value={userSkills} onChange={e => setUserSkills(e.target.value)} rows={4} placeholder="e.g. React, Node.js, 3 years full-stack development, led a team of 4" />
                                        <InputField label="Dream Career Milestone *" description="Where you want to be" value={careerGoals} onChange={e => setCareerGoals(e.target.value)} placeholder="e.g. Become a Principal Engineer, Pivot into Product Management" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-5">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={14} className="text-green-500" />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Pro Tips</span>
                                </div>
                                <ul className="space-y-3">
                                    {["Mention a specific detail to show you've done your research.", "Keep LinkedIn messages under 300 characters for higher response rates.", "Great mentors are often 2–3 steps ahead, not 10."].map((tip, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                            <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i + 1}</span>
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Button onClick={handleGenerate} disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 rounded-2xl font-bold">
                                {loading ? <><Loader2 className="animate-spin mr-2" size={18} /> Generating...</> : <><Sparkles size={18} className="mr-2" /> Generate Strategy</>}
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {subMode === "outreach" ? "Generated Messages" : "Mentor Archetypes"}
                            </h2>
                            <Button variant="outline" onClick={() => { setResults(null); setError(null); }} className="rounded-2xl border-slate-200 gap-2">
                                Refine Inputs <ArrowRight size={14} />
                            </Button>
                        </div>

                        {subMode === "outreach" ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {(results.messages || []).map((msg, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900 rounded-none md:rounded-3xl border-x-0 md:border border-slate-200 dark:border-slate-800 p-4 sm:p-5 md:p-6 flex flex-col gap-4 hover:border-green-300 transition-all group">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-green-600 dark:text-green-400">{msg.title || `Message ${i + 1}`}</span>
                                            <button onClick={() => copyToClipboard(msg.content, i)}
                                                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-green-100 hover:text-green-600 transition-colors">
                                                {copiedIndex === i ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-500" />}
                                            </button>
                                        </div>
                                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap flex-1">{msg.content}</p>
                                    </div>
                                ))}
                                {(!results.messages || results.messages.length === 0) && (
                                    <div className="col-span-3 text-center py-10 text-sm text-slate-400 italic">No messages generated</div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                {(results.mentorArchetypes || []).map((type, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900 rounded-none md:rounded-3xl border-x-0 md:border border-slate-200 dark:border-slate-800 p-4 sm:p-5 md:p-6 hover:border-green-300 transition-all">
                                        <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                                            <UserCircle size={24} className="text-green-600 dark:text-green-400" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-0.5">{type.persona}</h3>
                                        <p className="text-xs font-bold text-green-500 mb-3">{type.expertise}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4 italic">&ldquo;{type.valueAdd}&rdquo;</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(type.searchKeywords || []).map((kw, j) => (
                                                <span key={j} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg">#{kw}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* History */}
            {history.length > 0 && (
                <div className="mt-12 pt-10 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-5">
                        <Clock size={15} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Session History</span>
                        <span className="ml-auto text-xs text-slate-400">{history.length} result{history.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {history.map(item => (
                            <div key={item._id} onClick={() => restoreEntry(item)}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl p-4 md:p-5 hover:border-green-300 hover:shadow-lg transition-all cursor-pointer group relative">
                                <button onClick={e => deleteEntry(item._id, e)} className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 opacity-100 transition-all"><X size={13} /></button>
                                <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-3">
                                    {item.metadata?.subMode === "outreach" ? <MessageSquare size={16} className="text-green-600" /> : <Compass size={16} className="text-green-600" />}
                                </div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white mb-1 truncate">{item.title}</div>
                                <div className="text-[10px] text-slate-400 mb-2">{new Date(item.createdAt).toLocaleDateString()}</div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${item.metadata?.subMode === "outreach" ? 'bg-green-50 text-green-600' : 'bg-green-50 text-green-600'}`}>
                                    {item.metadata?.subMode === "outreach" ? (item.metadata?.platform || "linkedin") : "Mentorship"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName="Network AI"
                description="Master the art of professional outreach. Pro members get unlimited message templates and mentor archetype analysis."
            />
        </div>
    );
};

export default NetworkAI;
