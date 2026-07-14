"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, ScrollText, ExternalLink, Filter, FileText, Clock } from "lucide-react";
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

    const filtered = reports.filter(r => {
        const matchSearch = r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || r.topic?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchType = filterType === "all" || r.type?.toLowerCase() === filterType;
        return matchSearch && matchType;
    });

    const types = ["all", ...new Set(reports.map(r => r.type?.toLowerCase()).filter(Boolean))];

    return (
        <div className="px-0 py-6 space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white" style={{ fontFamily: "var(--font-fraunces)" }}>Reports & Essays</h1>
                    <p className="text-slate-500 mt-1 text-[11px]">Your AI-generated research documents</p>
                </div>
                <button onClick={() => setActiveContent("reports")}
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
                    <button onClick={() => setActiveContent("reports")}
                        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors">
                        <Plus size={14} /> Create Document
                    </button>
                </div>
            )}
        </div>
    );
}
