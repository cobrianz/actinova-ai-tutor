"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, ScrollText, ExternalLink, Trash2, Filter, FileText, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import { apiClient } from "@/lib/csrfClient";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_COLORS = {
    report: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
    essay: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
    default: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" }
};

export default function ReportsLibrary({ setActiveContent }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");
    const router = useRouter();
    const { user } = useAuth();

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

    const deleteReport = async (e, id) => {
        e.stopPropagation();
        if (!confirm("Delete this document?")) return;
        try {
            const res = await apiClient.delete(`/api/reports/${id}`);
            if (res.ok) { setReports(p => p.filter(r => r._id !== id)); toast.success("Deleted"); }
        } catch { toast.error("Failed to delete"); }
    };

    const filtered = reports.filter(r => {
        const matchSearch = r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || r.topic?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchType = filterType === "all" || r.type?.toLowerCase() === filterType;
        return matchSearch && matchType;
    });

    const types = ["all", ...new Set(reports.map(r => r.type?.toLowerCase()).filter(Boolean))];

    return (
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Reports & Essays</h1>
                    <p className="text-slate-500 mt-1 text-sm">Your AI-generated research documents</p>
                </div>
                <button onClick={() => setActiveContent("reports")}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-colors shadow shadow-green-600/20">
                    <Plus size={17} /> Create New
                </button>
            </motion.div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search by title or topic..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-green-400/20 focus:border-green-400 transition-all" />
                </div>
                {types.length > 1 && (
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-slate-400" />
                        {types.map(t => (
                            <button key={t} onClick={() => setFilterType(t)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${filterType === t ? "bg-green-600 text-white" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-green-300 hover:text-green-600"}`}>
                                {t === "all" ? "All" : t}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
                    ))}
                </div>
            ) : filtered.length > 0 ? (
                <AnimatePresence mode="wait">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map((report, i) => {
                            const typeKey = report.type?.toLowerCase() || "default";
                            const colors = TYPE_COLORS[typeKey] || TYPE_COLORS.default;
                            return (
                                <motion.div key={report._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                    onClick={() => router.push(`/reports/${report._id}`)}
                                    className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 hover:border-green-300 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden">

                                    {/* Background glow */}
                                    <div className="absolute top-0 right-0 w-28 h-28 bg-green-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-green-500/10 transition-colors" />

                                    <div className="relative z-10">
                                        {/* Icon + delete */}
                                        <div className="flex items-start justify-between mb-5">
                                            <div className={`w-12 h-12 ${colors.bg} rounded-2xl flex items-center justify-center`}>
                                                <ScrollText size={22} className={colors.text} />
                                            </div>
                                            <button onClick={e => deleteReport(e, report._id)}
                                                className="opacity-100 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2 leading-snug mb-2 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
                                            {report.title || "Untitled Research"}
                                        </h3>
                                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-5">
                                            {report.topic}
                                        </p>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                                                <span className="text-xs font-bold text-slate-500 capitalize">{report.type || "Report"}</span>
                                                {report.citationStyle && (
                                                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-full">{report.citationStyle}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                                <Clock size={11} />
                                                {new Date(report.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform">
                                            Open Document <ExternalLink size={12} />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6">
                        <FileText size={36} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {searchQuery ? "No results found" : "No documents yet"}
                    </h2>
                    <p className="text-slate-500 text-sm mb-6">
                        {searchQuery ? `Try searching with different keywords` : "Create your first research report or essay"}
                    </p>
                    <button onClick={() => setActiveContent("reports")}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-colors">
                        <Plus size={16} /> Create Document
                    </button>
                </div>
            )}
        </div>
    );
}
