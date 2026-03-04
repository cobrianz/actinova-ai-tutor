"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, FileText, MoreVertical, Trash2, ExternalLink, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import { apiClient } from "@/lib/csrfClient";

export default function ReportsLibrary({ setActiveContent }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await apiClient.get("/api/reports");
            if (res.ok) {
                const data = await res.json();
                setReports(data.reports || []);
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const deleteReport = async (id) => {
        if (!confirm("Are you sure you want to delete this report?")) return;
        try {
            const res = await apiClient.delete(`/api/reports/${id}`);
            if (res.ok) {
                setReports(reports.filter(r => r._id !== id));
                toast.success("Report deleted");
            }
        } catch (error) {
            toast.error("Failed to delete report");
        }
    };

    const filteredReports = reports.filter(r =>
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.topic?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Your Reports & Essays</h1>
                    <p className="text-muted-foreground">Manage and edit your AI-generated documents</p>
                </div>
                <button
                    onClick={() => setActiveContent("reports")}
                    className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all border border-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    Create New
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search by title or topic..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-input bg-card outline-none focus:ring-2 focus:ring-primary transition-all"
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-accent animate-pulse rounded-2xl border border-border"></div>
                    ))}
                </div>
            ) : filteredReports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredReports.map((report) => (
                        <div
                            key={report._id}
                            className="group relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[32px] p-6 hover:border-primary/50 hover:-translate-y-1 transition-all duration-500 cursor-pointer overflow-hidden"
                            onClick={() => router.push(`/reports/${report._id}`)}
                        >
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-500" />

                            {/* Abstract Background SVG Pattern */}
                            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none overflow-hidden">
                                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path d="M0 100 C 20 0, 50 100, 100 0" stroke="currentColor" fill="transparent" strokeWidth="0.5" />
                                    <path d="M0 0 C 50 100, 80 0, 100 100" stroke="currentColor" fill="transparent" strokeWidth="0.5" />
                                </svg>
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-blue-500/10 dark:from-primary/30 dark:to-blue-500/20 rounded-2xl flex items-center justify-center text-primary shadow-inner border border-white/50 dark:border-slate-700/50">
                                        <ScrollText className="w-7 h-7" />
                                    </div>
                                </div>

                                <h3 className="font-bold text-xl mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-300">
                                    {report.title || "Untitled Research"}
                                </h3>

                                <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-6 font-medium leading-relaxed">
                                    {report.topic}
                                </p>

                                <div className="flex flex-col gap-4 pt-5 border-t border-gray-100/50 dark:border-slate-800/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-full text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                {report.type || "Report"}
                                            </span>
                                            {report.citationStyle && (
                                                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary/10">
                                                    {report.citationStyle}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[11px] font-semibold text-muted-foreground/60">{new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-[11px] font-bold text-primary group-hover:translate-x-1 transition-transform duration-300">
                                        Open Document <ExternalLink className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-accent/20 rounded-3xl border-2 border-dashed border-border">
                    <ScrollText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <h2 className="text-xl font-bold mb-2">No documents found</h2>
                    <p className="text-muted-foreground mb-6">Start by generating your first report or essay</p>
                    <button
                        onClick={() => setActiveContent("reports")}
                        className="text-primary font-bold hover:underline"
                    >
                        Create your first document →
                    </button>
                </div>
            )}
        </div>
    );
}
