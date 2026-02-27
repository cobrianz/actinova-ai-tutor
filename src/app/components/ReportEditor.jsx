"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered, Save, Download, FileText, ChevronRight,
    Sparkles, Loader2, ArrowLeft, Printer, Type, Palette,
    Minus, Plus, Heading1, Heading2, CheckCircle2, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ReportEditor({ reportId }) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generatingSection, setGeneratingSection] = useState(null);
    const [saving, setSaving] = useState(false);
    const [outlineOpen, setOutlineOpen] = useState(true);
    const [selectedFontFamily, setSelectedFontFamily] = useState("Inter");
    const [selectedFontSize, setSelectedFontSize] = useState("12");
    const [sectionLengths, setSectionLengths] = useState({}); // Tracking requested pages per section
    const editorRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        fetchReport();
    }, [reportId]);

    const fetchReport = async () => {
        try {
            const res = await fetch(`/api/reports/${reportId}`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setReport(data.report);
                if (editorRef.current && data.report.fullContent) {
                    editorRef.current.innerHTML = data.report.fullContent;
                }
            } else {
                toast.error("Report not found");
                router.push("/dashboard?tab=reports-library");
            }
        } catch (error) {
            console.error("Fetch report error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const saveReport = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const content = editorRef.current.innerHTML;
            const res = await fetch(`/api/reports/${reportId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    fullContent: content,
                    // We could also track which sections are "done" here
                }),
            });
            if (res.ok) {
                toast.success("Saved successfully");
            }
        } catch (error) {
            toast.error("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const generateSection = async (section) => {
        if (generatingSection) return;
        setGeneratingSection(section.id);

        try {
            const res = await fetch("/api/generate-report-section", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    reportId,
                    sectionId: section.id,
                    sectionTitle: section.title,
                    sectionDescription: section.description,
                    topic: report.topic,
                    type: report.type,
                    difficulty: report.difficulty,
                    citationStyle: report.citationStyle || "APA",
                    requestedPages: sectionLengths[section.id] || 1,
                    existingContent: editorRef.current.innerHTML
                }),
            });

            if (!res.ok) throw new Error("Generation failed");

            const data = await res.json();

            // Insert generated HTML at the end of the editor
            if (editorRef.current) {
                const div = document.createElement('div');
                div.innerHTML = data.html;
                editorRef.current.appendChild(div);

                // Update local state to show section as "done"
                const updatedSections = { ...report.sections, [section.id]: true };
                setReport({ ...report, sections: updatedSections });

                // Auto-save after generation
                setTimeout(saveReport, 500);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setGeneratingSection(null);
        }
    };

    const exportAsPDF = () => {
        window.print(); // Native print to PDF for best fidelity
    };

    if (loading || !report) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse">
                    {loading ? "Opening your document..." : "Document not found or failed to load."}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-68px)] bg-slate-100 dark:bg-slate-950 overflow-hidden">
            {/* Toolbar */}
            <div className="bg-white dark:bg-slate-900 border-b border-border p-3 sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4 shadow-md px-6">
                <div className="flex items-center gap-2">
                    <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-muted-foreground transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-[px] bg-border mx-1" />

                    {/* Font controls common in Presentation editor */}
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
                        <select
                            value={selectedFontFamily}
                            onChange={(e) => {
                                handleCommand('fontName', e.target.value);
                                setSelectedFontFamily(e.target.value);
                            }}
                            className="bg-transparent text-xs font-medium outline-none px-2 py-1 border-r border-border"
                        >
                            <option value="Inter">Inter</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Arial">Arial</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Courier New">Courier New</option>
                        </select>
                        <select
                            value={selectedFontSize}
                            onChange={(e) => {
                                handleCommand('fontSize', e.target.value);
                                setSelectedFontSize(e.target.value);
                            }}
                            className="bg-transparent text-xs font-medium outline-none px-2 py-1"
                        >
                            {[8, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
                        <button onClick={() => handleCommand('bold')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded transition-all shadow-sm" title="Bold"><Bold className="w-4 h-4" /></button>
                        <button onClick={() => handleCommand('italic')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded transition-all shadow-sm" title="Italic"><Italic className="w-4 h-4" /></button>
                        <button onClick={() => handleCommand('underline')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded transition-all shadow-sm" title="Underline"><Underline className="w-4 h-4" /></button>
                    </div>

                    <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
                        <button onClick={() => handleCommand('justifyLeft')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded transition-all shadow-sm"><AlignLeft className="w-4 h-4" /></button>
                        <button onClick={() => handleCommand('justifyCenter')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded transition-all shadow-sm"><AlignCenter className="w-4 h-4" /></button>
                        <button onClick={() => handleCommand('justifyRight')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded transition-all shadow-sm"><AlignRight className="w-4 h-4" /></button>
                    </div>

                    <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
                        <button onClick={() => handleCommand('insertUnorderedList')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded transition-all shadow-sm"><List className="w-4 h-4" /></button>
                        <button onClick={() => handleCommand('insertOrderedList')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded transition-all shadow-sm"><ListOrdered className="w-4 h-4" /></button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-xs font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full hidden sm:block">
                        {report.citationStyle || "APA"} Format
                    </div>
                    <button onClick={saveReport} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all group shadow-lg shadow-green-600/20 active:scale-95">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                        Save Changes
                    </button>
                    <button onClick={exportAsPDF} className="flex items-center gap-2 px-6 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95">
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Editor Area */}
                <div className="flex-1 overflow-y-auto p-8 flex justify-center scrollbar-hide">
                    <div className="w-full max-w-[816px] (A4 size approximation) bg-white dark:bg-slate-900 shadow-2xl min-h-[1056px] p-[2cm] outline-none prose dark:prose-invert prose-slate max-w-none rounded-sm border border-border"
                        ref={editorRef}
                        contentEditable="true"
                        onBlur={saveReport}
                        style={{
                            boxShadow: '0 0 50px rgba(0,0,0,0.1)',
                            fontFamily: 'Inter, sans-serif'
                        }}
                    />
                </div>

                {/* Sidebar Outline */}
                <div className={`transition-all duration-300 border-l border-border bg-white dark:bg-slate-900 overflow-hidden flex flex-col ${outlineOpen ? 'w-80' : 'w-0'}`}>
                    <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            <span className="font-bold text-sm">Document Outline</span>
                        </div>
                        <button onClick={() => setOutlineOpen(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {report.outline.map((section, idx) => {
                            const isGenerating = generatingSection === section.id;
                            const isDone = report.sections?.[section.id];
                            const currentTargetLength = sectionLengths[section.id] || 1;

                            return (
                                <div key={section.id} className={`p-4 rounded-xl border transition-all ${isDone ? 'border-green-200 bg-green-50/30 dark:border-green-900/30 dark:bg-green-900/10' : 'border-border bg-slate-50 dark:bg-slate-800/30'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Section {section.id}</span>
                                        {isDone && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                    </div>
                                    <h4 className="font-bold text-sm mb-1 leading-tight">{section.title}</h4>
                                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">{section.description}</p>

                                    {!isDone && (
                                        <div className="mb-3">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Target Length</label>
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 5].map(pages => (
                                                    <button
                                                        key={pages}
                                                        onClick={() => setSectionLengths({ ...sectionLengths, [section.id]: pages })}
                                                        className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${currentTargetLength === pages ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'}`}
                                                    >
                                                        {pages}p
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => generateSection(section)}
                                        disabled={isGenerating}
                                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${isGenerating ? 'bg-slate-200 dark:bg-slate-700' :
                                            isDone ? 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-primary hover:text-white' :
                                                'bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20'
                                            }`}
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-3 h-3" />
                                        )}
                                        {isGenerating ? 'Writing...' : isDone ? 'Regenerate' : 'Generate Content'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Floating Toggle for Sidebar */}
                {!outlineOpen && (
                    <button
                        onClick={() => setOutlineOpen(true)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 border border-r-0 border-border p-2 rounded-l-xl shadow-xl hover:text-primary transition-all z-50"
                    >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                )}
            </div>

            <style jsx global>{`
        @media print {
          .no-print, nav, .bg-slate-100, .sticky, .w-80, .absolute {
            display: none !important;
          }
          .flex-1 {
            overflow: visible !important;
            padding: 0 !important;
            background: white !important;
          }
          .bg-white {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            width: 100% !important;
          }
          body {
            background: white !important;
          }
        }
        
        [contenteditable]:empty:before {
          content: attr(placeholder);
          color: #94a3b8;
          cursor: text;
        }

        .prose h1 { font-size: 2.5rem; margin-top: 1.5rem; margin-bottom: 1rem; font-weight: 800; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; word-break: break-word; }
        .prose h2 { font-size: 1.875rem; margin-top: 1.25rem; margin-bottom: 0.75rem; font-weight: 700; color: #1e293b; word-break: break-word; }
        .prose h3 { font-size: 1.5rem; margin-top: 1rem; margin-bottom: 0.5rem; font-weight: 600; word-break: break-word; }
        .prose p { margin-bottom: 1rem; line-height: 1.8; color: #334155; word-break: break-word; overflow-wrap: break-word; }
        .prose ul, .prose ol { margin-bottom: 1rem; padding-left: 1.5rem; word-break: break-word; }
        .prose li { margin-bottom: 0.25rem; word-break: break-word; }
        
        .dark .prose h1 { border-bottom-color: #334155; color: #f1f5f9; }
        .dark .prose h2 { color: #f1f5f9; }
        .dark .prose p { color: #cbd5e1; }
      `}</style>
        </div>
    );
}
