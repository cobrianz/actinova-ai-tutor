"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, FileText, MoreVertical, Trash2, ExternalLink, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";

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
            const res = await fetch("/api/reports", { credentials: "include" });
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
            const res = await fetch(`/api/reports/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
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
                    className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReports.map((report) => (
                        <div
                            key={report._id}
                            className="group bg-card border border-border rounded-2xl p-5 hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer relative"
                            onClick={() => router.push(`/reports/${report._id}`)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                    <ScrollText className="w-6 h-6" />
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteReport(report._id);
                                    }}
                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                                {report.title || "Untitled Document"}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                {report.topic}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                                <div className="flex gap-2">
                                    <span className="bg-accent px-2 py-1 rounded-md capitalize">{report.type || "Report"}</span>
                                    {report.citationStyle && (
                                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-md font-medium uppercase tracking-wider">{report.citationStyle}</span>
                                    )}
                                </div>
                                <span>{new Date(report.createdAt).toLocaleDateString()}</span>
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
