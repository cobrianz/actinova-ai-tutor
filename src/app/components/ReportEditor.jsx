"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Save, Download, FileText, ChevronRight,
    Sparkles, Loader2, CheckCircle2, ChevronDown,
    LetterText, Minus, Plus, PanelRight, X,
    RefreshCcw, ArrowLeftRight, Maximize2, Minimize2, Activity,
    ShieldCheck, AlertTriangle, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { saveAs } from "file-saver";
import { useTheme } from "./ThemeProvider";
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType
} from "docx";

export default function ReportEditor({ reportId }) {
    const { theme } = useTheme();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generatingSection, setGeneratingSection] = useState(null);
    const [generatingAbstract, setGeneratingAbstract] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedFontFamily, setSelectedFontFamily] = useState("Inter");
    const [selectedFontSize, setSelectedFontSize] = useState("3");
    const [selectedLineHeight, setSelectedLineHeight] = useState("2.0");
    const [authorName, setAuthorName] = useState("Research Author");
    const [institution, setInstitution] = useState("Actinova University");
    const [courseName, setCourseName] = useState("Advanced Academic Writing");
    const [studentName, setStudentName] = useState("Actinova Student");
    const [submissionDate, setSubmissionDate] = useState(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    const [allReferences, setAllReferences] = useState([]);
    const [sectionLengths, setSectionLengths] = useState({});
    const [zoom, setZoom] = useState(100);
    const [headerOffsets, setHeaderOffsets] = useState({});
    const [showOutline, setShowOutline] = useState(true);
    const [lastSaved, setLastSaved] = useState(null);
    const editorRef = useRef(null);
    const titlePageRef = useRef(null);
    const referencesRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const saveTimeoutRef = useRef(null);
    const loadedRef = useRef(false);
    const [toolbar, setToolbar] = useState({ visible: false, x: 0, y: 0, text: '', range: null });
    const [isRewriting, setIsRewriting] = useState(false);
    const [validationResults, setValidationResults] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const pendingContentRef = useRef(null); // holds fullContent until editor mounts
    const pendingTitlePageContentRef = useRef(null); // holds titlePageContent until editor mounts
    const pendingReportRef = useRef(null);  // holds report data until editor mounts
    const router = useRouter();

    useEffect(() => {
        fetchReport();
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [reportId]);

    const fetchReport = async () => {
        try {
            const res = await fetch(`/api/reports/${reportId}`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                const r = data.report;
                setReport(r);
                pendingReportRef.current = r; // save for after editor mounts
                // Restore metadata from DB
                if (r.authorName) setAuthorName(r.authorName);
                if (r.institution) setInstitution(r.institution);
                if (r.courseName) setCourseName(r.courseName);
                if (r.studentName) setStudentName(r.studentName);
                if (r.submissionDate) setSubmissionDate(r.submissionDate);
                // Restore section length preferences
                if (r.sectionLengths) setSectionLengths(r.sectionLengths);
                // Store content to be applied after the editor mounts
                if (r.fullContent) {
                    pendingContentRef.current = r.fullContent;
                }
                if (r.titlePageContent) {
                    pendingTitlePageContentRef.current = r.titlePageContent;
                }
                if (r.references) {
                    setAllReferences(r.references);
                }
            } else {
                toast.error("Report not found");
                router.push("/dashboard?tab=reports-library");
            }
        } catch (error) {
            console.error("Fetch report error:", error);
        } finally {
            setLoading(false); // triggers re-render → editor mounts → useEffect below fires
        }
    };

    // After loading finishes, the editor div is now in the DOM.
    // Apply the pending content and generate the title page if needed.
    useEffect(() => {
        if (loading) return; // editor not yet mounted
        if (!editorRef.current) return;

        const r = pendingReportRef.current;
        const content = pendingContentRef.current;

        if (content) {
            // Clean up content if it still has the title-page (migration)
            const temp = document.createElement('div');
            temp.innerHTML = content;
            const existingTitlePage = temp.querySelector('#title-page');
            const existingBreak = temp.querySelector('.title-page-break');
            if (existingTitlePage) existingTitlePage.remove();
            if (existingBreak) existingBreak.remove();

            editorRef.current.innerHTML = temp.innerHTML;
            pendingContentRef.current = null;
        }

        if (r && titlePageRef.current) {
            if (pendingTitlePageContentRef.current) {
                titlePageRef.current.innerHTML = pendingTitlePageContentRef.current;
                pendingTitlePageContentRef.current = null;
            } else {
                titlePageRef.current.innerHTML = getTitlePageHTML(r);
            }
        }

        if (r && r.references && referencesRef.current && referencesRef.current.innerHTML === '') {
            referencesRef.current.innerHTML = r.references.map(ref => `<p style="font-size: 0.95rem; margin-bottom: 1rem; padding-left: 2rem; text-indent: -2rem; line-height: 1.7; text-align: left; color: var(--report-text-color, #475569); font-family: Inter, system-ui, sans-serif;">${ref}</p>`).join('');
        }

        // Mark as fully loaded — autosave is now safe
        loadedRef.current = true;
    }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelection = useCallback(() => {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            const container = range.commonAncestorContainer.parentElement;
            const isInsideEditor = editorRef.current?.contains(container) ||
                titlePageRef.current?.contains(container) ||
                referencesRef.current?.contains(container);

            if (isInsideEditor && text.length > 2) {
                setToolbar({
                    visible: true,
                    x: rect.left + (rect.width / 2),
                    y: rect.top - 10,
                    text: text,
                    range: range.cloneRange()
                });
            }
        }
    }, []);

    const handleRewrite = async (action) => {
        if (!toolbar.text || isRewriting) return;
        setIsRewriting(true);
        try {
            const res = await fetch('/api/rewrite-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: toolbar.text,
                    action,
                    topic: report?.title,
                    citationStyle: report?.citationStyle
                }),
                credentials: 'include'
            });

            if (res.ok) {
                const { data } = await res.json();
                if (toolbar.range) {
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(toolbar.range);
                    document.execCommand('insertText', false, data);
                    handleEditorInput();
                    toast.success(`Content ${action}ed`);
                }
            } else {
                toast.error("Failed to rewrite content");
            }
        } catch (error) {
            console.error("Rewrite error:", error);
            toast.error("An error occurred during rewrite");
        } finally {
            setIsRewriting(false);
            setToolbar(prev => ({ ...prev, visible: false }));
        }
    };

    useEffect(() => {
        const handleMouseUp = () => {
            setTimeout(handleSelection, 0);
        };

        const handleMouseDown = (e) => {
            if (!e.target.closest('.selection-toolbar-container')) {
                setToolbar(prev => ({ ...prev, visible: false }));
            }
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, [handleSelection]);

    const saveReport = useCallback(async (contentOverride = null, sectionsOverride = null, referencesOverride = null) => {
        if (!editorRef.current && !contentOverride) return;
        setSaving(true);
        try {
            const content = contentOverride || editorRef.current.innerHTML;
            const titlePageContent = titlePageRef.current ? titlePageRef.current.innerHTML : '';
            const sections = sectionsOverride || report?.sections;
            const references = referencesOverride || (referencesRef.current ? Array.from(referencesRef.current.querySelectorAll('p')).map(p => p.innerText) : allReferences);

            const res = await fetch(`/api/reports/${reportId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    fullContent: content,
                    titlePageContent,
                    sections,
                    references,
                    abstract: report?.abstract,
                    title: report?.title,
                    outline: report?.outline,
                    sectionLengths,
                    // metadata
                    authorName,
                    institution,
                    courseName,
                    studentName,
                    submissionDate,
                }),
            });

            if (res.ok) {
                setLastSaved(new Date());
            }
        } catch (error) {
            console.error("Auto-save failed:", error);
        } finally {
            setSaving(false);
        }
    }, [reportId, report, allReferences, authorName, institution, courseName, studentName, submissionDate]);

    const handleEditorInput = useCallback(() => {
        if (!loadedRef.current) return; // skip saves during initial content restore
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            saveReport();
        }, 2000); // 2s debounce autosave
    }, [saveReport]);

    const handleCommand = useCallback((command, value = null) => {
        if (!editorRef.current) return;

        // Ensure editor has focus
        editorRef.current.focus();

        // Apply command
        document.execCommand(command, false, value);

        // Force an input event to trigger auto-save if content changed
        handleEditorInput();
    }, [handleEditorInput]);

    const handleLineHeightChange = (lineHeight) => {
        setSelectedLineHeight(lineHeight);
        if (!editorRef.current) return;

        editorRef.current.focus();

        // Apply line height using execCommand with styleWithCSS
        try {
            document.execCommand('styleWithCSS', false, true);
            // We use <div> and <span> to apply line height to selection
            document.execCommand('formatBlock', false, 'div');
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const parent = range.commonAncestorContainer.parentElement;
                if (parent) parent.style.lineHeight = lineHeight;
            }
        } catch (e) {
            // Fallback: apply to editor style if nothing selected
            editorRef.current.style.lineHeight = lineHeight;
        }

        handleEditorInput();
    };

    // Logic to track header positions for the floating outline
    const updateHeaderOffsets = useCallback(() => {
        if (!editorRef.current || !report?.outline) return;

        const offsets = {};

        // Track the "Cover/Title" position (top of document)
        offsets['cover'] = 0;

        // Track "Abstract" position if it exists
        const abstractHeader = Array.from(editorRef.current.querySelectorAll('h2')).find(h => h.innerText.toLowerCase() === 'abstract');
        if (abstractHeader) {
            offsets['abstract'] = abstractHeader.offsetTop;
        }

        // Track each outline section
        report.outline.forEach(section => {
            const header = editorRef.current.querySelector(`h2[data-section-id="${section.id}"]`) ||
                Array.from(editorRef.current.querySelectorAll('h2')).find(h => h.innerText.toLowerCase() === section.title.toLowerCase());

            if (header) {
                offsets[section.id] = header.offsetTop;
                // Ensure it has the data attribute for future tracking
                if (!header.hasAttribute('data-section-id')) {
                    header.setAttribute('data-section-id', section.id);
                }
            }
        });

        setHeaderOffsets(offsets);
    }, [report?.outline]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleUpdate = () => {
            requestAnimationFrame(updateHeaderOffsets);
        };

        container.addEventListener('scroll', handleUpdate);
        window.addEventListener('resize', handleUpdate);

        // Initial update and periodic update for dynamic content
        const timer = setTimeout(updateHeaderOffsets, 1000);
        const interval = setInterval(updateHeaderOffsets, 3000);

        return () => {
            container.removeEventListener('scroll', handleUpdate);
            window.removeEventListener('resize', handleUpdate);
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [updateHeaderOffsets]);

    const getTitlePageHTML = (reportData = report) => {
        if (!reportData) return '';

        const style = (reportData.citationStyle || "APA").toUpperCase();
        const isAPA = style.includes('APA');
        const isMLA = style.includes('MLA');
        const isChicago = style.includes('CHICAGO');

        // CSS for theme awareness in injected HTML
        const textColor = "var(--report-text-color, #1e293b)";

        if (isAPA) {
            return `
                <div id="title-page" style="text-align: center; display: flex; flex-direction: column; justify-content: center; min-height: 20cm; padding-top: 5cm; color: ${textColor};">
                    <h1 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 2rem; line-height: 2;">${reportData.title || "Untitled Report"}</h1>
                    <div style="line-height: 2;">
                        <p style="font-size: 1rem; margin-bottom: 0px;">${studentName || "Student Name"}</p>
                        <p style="font-size: 1rem; margin-bottom: 0px;">${institution || "Institution Name"}</p>
                        <p style="font-size: 1rem; margin-bottom: 0px;">${courseName || "Course Name"}</p>
                        <p style="font-size: 1rem; margin-bottom: 0px;">${authorName || "Instructor Name"}</p>
                        <p style="font-size: 1rem; margin-bottom: 0px;">${submissionDate}</p>
                    </div>
                </div>
            `;
        } else if (isMLA) {
            return `
                <div id="title-page" style="text-align: left; padding-top: 1cm; line-height: 2; color: ${textColor};">
                    <p style="margin-bottom: 0px;">${studentName || "Student Name"}</p>
                    <p style="margin-bottom: 0px;">${authorName || "Instructor Name"}</p>
                    <p style="margin-bottom: 0px;">${courseName || "Course Name"}</p>
                    <p style="margin-bottom: 2rem;">${submissionDate}</p>
                    <h1 style="font-size: 1.25rem; font-weight: normal; text-align: center; margin-top: 3rem; margin-bottom: 2rem;">${reportData.title || "Untitled Report"}</h1>
                </div>
            `;
        } else if (isChicago) {
            return `
                <div id="title-page" style="text-align: center; display: flex; flex-direction: column; justify-content: space-between; min-height: 22cm; padding: 4cm 0; color: ${textColor};">
                    <h1 style="font-size: 1.35rem; font-weight: bold; margin-bottom: 4rem; line-height: 2;">${reportData.title || "Untitled Report"}</h1>
                    <div style="line-height: 2; margin-top: auto;">
                        <p style="font-size: 1.1rem; margin-bottom: 0px;">${studentName || "Student Name"}</p>
                        <p style="font-size: 1.1rem; margin-bottom: 0.px;">${courseName || "Course Name"}</p>
                        <p style="font-size: 1.1rem; margin-bottom: 0px;">${submissionDate}</p>
                    </div>
                </div>
            `;
        } else {
            return `
                <div id="title-page" style="text-align: center; padding-top: 5cm; line-height: 2; color: ${textColor};">
                    <h1 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 2rem;">${reportData.title || "Untitled Report"}</h1>
                    <div style="width: 60px; height: 2px; background: #6366f1; margin: 2rem auto;"></div>
                    <p style="font-weight: bold; margin-bottom: 0px;">${studentName}</p>
                    <p style="margin-bottom: 0px;">${institution}</p>
                    <p style="margin-top: 2rem;">${submissionDate}</p>
                </div>
            `;
        }
    };

    const generateTitlePage = (reportData = report) => {
        if (!titlePageRef.current || !reportData) return;
        const html = getTitlePageHTML(reportData);
        titlePageRef.current.innerHTML = html;
    };

    // Keep the title page DOM synced with state changes
    useEffect(() => {
        if (!titlePageRef.current || !report) return;
        const titlePageNode = titlePageRef.current.querySelector('#title-page');
        if (titlePageNode) {
            const html = getTitlePageHTML(report);

            // Create a temporary container to extract just the title-page part
            const temp = document.createElement('div');
            temp.innerHTML = html;
            const newTitleNode = temp.querySelector('#title-page');

            if (newTitleNode && newTitleNode.innerHTML !== titlePageNode.innerHTML) {
                titlePageNode.innerHTML = newTitleNode.innerHTML;
                handleEditorInput();
            }
        }
    }, [studentName, authorName, courseName, institution, submissionDate, report?.title, report?.citationStyle]);

    // Keyboard shortcuts handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle shortcuts when editor is focused
            if (!editorRef.current || !editorRef.current.contains(document.activeElement)) return;

            // Ctrl/Cmd + B for Bold
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                handleCommand('bold');
            }
            // Ctrl/Cmd + I for Italic
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                handleCommand('italic');
            }
            // Ctrl/Cmd + U for Underline
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                handleCommand('underline');
            }
            // Ctrl/Cmd + S for Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveReport();
                toast.success("Saved!");
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveReport, handleCommand]);


    const generateAbstract = async () => {
        if (generatingAbstract) return;
        setGeneratingAbstract(true);
        const toastId = toast.loading("Synthesizing abstract...");

        try {
            const res = await fetch("/api/generate-report-section", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    reportId,
                    sectionId: "abstract",
                    sectionTitle: "Abstract",
                    sectionDescription: `Generate a comprehensive abstract (150-250 words) summarizing the ${report.type} on "${report.topic}". Include key findings, methodology, and conclusions.`,
                    topic: report.topic,
                    type: report.type,
                    difficulty: report.academicLevel || "Undergraduate",
                    citationStyle: report.citationStyle || "APA 7",
                    criticalDepth: report.criticalDepth || "Moderate",
                    requestedPages: 1,
                    existingContent: editorRef.current.innerHTML,
                    existingReferences: allReferences
                }),
            });

            if (!res.ok) throw new Error("Abstract generation failed");

            const data = await res.json();
            const abstractData = data.data;

            if (editorRef.current && abstractData) {
                // Extract abstract text from paragraphs
                const abstractText = abstractData.paragraphs && Array.isArray(abstractData.paragraphs)
                    ? abstractData.paragraphs.join(' ')
                    : abstractData.content || '';

                // Create abstract HTML
                let html = `<h2 style="font-weight: bold; font-size: 1.75rem; margin-top: 2rem; margin-bottom: 1.25rem;">Abstract</h2>`;
                if (abstractData.paragraphs && Array.isArray(abstractData.paragraphs)) {
                    html += abstractData.paragraphs.map(p => `<p style="margin-bottom: 1.75rem; text-align: justify;">${p}</p>`).join('');
                } else if (abstractData.content) {
                    html += `<p style="margin-bottom: 1.75rem; text-align: justify;">${abstractData.content}</p>`;
                }

                // Check if abstract already exists in editor
                const existingAbstract = editorRef.current.querySelector('h2');
                if (existingAbstract && existingAbstract.textContent.trim().toLowerCase() === 'abstract') {
                    // Replace existing abstract section
                    const abstractSection = existingAbstract.parentElement || existingAbstract;
                    const nextSibling = abstractSection.nextElementSibling;
                    abstractSection.outerHTML = html;
                } else {
                    // Insert abstract at the beginning of the editor content
                    const div = document.createElement('div');
                    div.innerHTML = html;
                    if (editorRef.current.firstChild) {
                        editorRef.current.insertBefore(div, editorRef.current.firstChild);
                    } else {
                        editorRef.current.appendChild(div);
                    }
                }

                // Update report abstract field
                const updatedReport = { ...report, abstract: abstractText };
                setReport(updatedReport);

                // Save abstract to database
                await fetch(`/api/reports/${reportId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        abstract: abstractText,
                        fullContent: editorRef.current.innerHTML
                    }),
                });

                await saveReport(editorRef.current.innerHTML, report.sections);
                toast.success("Abstract generated successfully!", { id: toastId });
            }
        } catch (error) {
            toast.error(error.message || "Failed to generate abstract", { id: toastId });
        } finally {
            setGeneratingAbstract(false);
        }
    };

    const generateSection = async (section) => {
        if (generatingSection) return;
        setGeneratingSection(section.id);
        const toastId = toast.loading(`Drafting "${section.title}"...`);

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
                    difficulty: report.academicLevel || "Undergraduate",
                    citationStyle: report.citationStyle || "APA 7",
                    criticalDepth: report.criticalDepth || "Moderate",
                    requestedPages: sectionLengths[section.id] || 1,
                    existingContent: editorRef.current.innerHTML,
                    existingReferences: allReferences
                }),
            });

            if (!res.ok) throw new Error("Generation failed");

            const data = await res.json();
            const sectionData = data.data;

            if (editorRef.current && sectionData) {
                const isTitlePage = section.title.toLowerCase().includes('title') || section.title.toLowerCase().includes('cover');

                if (isTitlePage) {
                    // Match generated text to metadata fields if possible
                    if (sectionData.title) setReport(prev => ({ ...prev, title: sectionData.title }));
                    if (sectionData.author) setStudentName(sectionData.author);
                    if (sectionData.institution) setInstitution(sectionData.institution);
                    if (sectionData.course) setCourseName(sectionData.course);
                    if (sectionData.date) setSubmissionDate(sectionData.date);

                    toast.success("Cover metadata updated!");
                } else {
                    const div = document.createElement('div');
                    // Convert JSON content to HTML
                    let html = `<h2 data-section-id="${section.id}" style="font-weight: bold; font-size: 1.75rem; margin-top: 2rem; margin-bottom: 1.25rem;">${sectionData.heading}</h2>`;
                    if (sectionData.paragraphs && Array.isArray(sectionData.paragraphs)) {
                        html += sectionData.paragraphs.map(p => `<p style="margin-bottom: 1.75rem; text-align: justify;">${p}</p>`).join('');
                    } else if (sectionData.content) {
                        html += sectionData.content.split('\n\n').map(p => `<p style="margin-bottom: 1.75rem; text-align: justify;">${p}</p>`).join('');
                    }
                    div.innerHTML = html;
                    editorRef.current.appendChild(div);
                }

                // Immediately update offsets
                updateHeaderOffsets();

                // Global Reference Aggregation
                let finalRefs = allReferences;
                if (sectionData.references && sectionData.references.length > 0) {
                    const newRefs = [...allReferences];
                    sectionData.references.forEach(ref => {
                        if (!newRefs.includes(ref)) newRefs.push(ref);
                    });
                    finalRefs = newRefs;
                    setAllReferences(newRefs);
                }

                const updatedSections = { ...report.sections, [section.id]: true };
                setReport({ ...report, sections: updatedSections });

                await saveReport(editorRef.current.innerHTML, updatedSections, finalRefs);
                toast.success(`"${section.title}" completed`, { id: toastId });
            }
        } catch (error) {
            toast.error(error.message || "Generation failed", { id: toastId });
        } finally {
            setGeneratingSection(null);
        }
    };


    const exportAsLaTeX = async () => {
        try {
            const res = await fetch("/api/latex-converter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    structuredContent: {
                        title: report.title,
                        author: authorName,
                        institution: institution,
                        course: courseName,
                        name: studentName,
                        date: submissionDate,
                        abstract: report.abstract || "",
                        titlePageContent: titlePageRef.current ? titlePageRef.current.innerText : "",
                        sections: [{ title: "Content", content: editorRef.current.innerText }],
                        references: referencesRef.current ? Array.from(referencesRef.current.querySelectorAll('p')).map(p => p.innerText) : allReferences
                    }
                })
            });
            const data = await res.json();
            if (data.success) {
                const blob = new Blob([data.latex], { type: "text/plain" });
                saveAs(blob, `${report.title || "Report"}.tex`);
                toast.success("LaTeX Exported");
            }
        } catch (error) {
            toast.error("LaTeX Export failed");
        }
    };

    const exportAsDOCX = async () => {
        if (!editorRef.current) return;

        try {
            // Server-side docx generation using docxtemplater
            const res = await fetch("/api/generate-doc", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: report.title,
                    author: authorName,
                    institution: institution,
                    course: courseName,
                    name: studentName,
                    date: submissionDate,
                    citationStyle: report.citationStyle,
                    abstract: report.abstract || "",
                    titlePageContent: titlePageRef.current ? titlePageRef.current.innerHTML : "",
                    // Parse the current HTML into multiple sections and paragraphs for the template
                    sections: Array.from(editorRef.current.querySelectorAll('h2')).map(h2 => {
                        let paragraphs = [];
                        let next = h2.nextElementSibling;
                        while (next && next.tagName !== 'H2') {
                            if (next.tagName === 'P') {
                                paragraphs.push(next.innerText);
                            }
                            next = next.nextElementSibling;
                        }
                        return {
                            Heading: h2.innerText,
                            paragraphs: paragraphs
                        };
                    }).filter(s => s.Heading),
                    references: referencesRef.current ? Array.from(referencesRef.current.querySelectorAll('p')).map(p => p.innerText) : allReferences
                })
            });

            if (!res.ok) throw new Error("Failed to generate DOCX");

            const blob = await res.blob();
            saveAs(blob, `${report.title || "Report"}.docx`);
            toast.success("DOCX Exported (Template Layout)");
        } catch (error) {
            console.error("DOCX Error:", error);
            toast.error("Failed to export Word Document");
        }
    };

    // Helper to prevent focus loss on button clicks
    const preventFocus = (e) => e.preventDefault();

    // Professional Loading Screen Component
    const LoadingScreen = () => {
        const [statusIndex, setStatusIndex] = useState(0);
        const statuses = [
            "Authenticating session...",
            "Connecting to research database...",
            "Retrieving document structure...",
            "Fetching latest drafts...",
            "Applying academic formatting...",
            "Preparing your workspace..."
        ];

        useEffect(() => {
            const interval = setInterval(() => {
                setStatusIndex((prev) => (prev + 1) % statuses.length);
            }, 2000);
            return () => clearInterval(interval);
        }, []);

        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-all duration-500 animate-in fade-in">
                <div className="flex flex-col items-center text-center max-w-xs w-full px-6">

                    <div className="mb-6 relative">
                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                            <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="absolute -inset-2 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                    </div>

                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Actinova AI Tutor</h2>

                    <div className="h-5 mb-8">
                        <p className="text-sm text-slate-500 dark:text-slate-400 animate-in fade-in duration-300" key={statusIndex}>
                            {statuses[statusIndex]}
                        </p>
                    </div>

                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full animate-progress-loading" />
                    </div>
                </div>
            </div>
        );
    };

    const runStructuralValidation = async () => {
        setIsValidating(true);
        try {
            // First save to ensure we validate latest content
            await saveReport();

            const res = await fetch(`/api/reports/${reportId}/validate`, { credentials: "include" });
            if (res.ok) {
                const { results } = await res.json();
                setValidationResults(results);
                toast.success(`Structure validated: Score ${results.structureScore}/100`);
            } else {
                toast.error("Structural validation failed");
            }
        } catch (error) {
            console.error("Validation error:", error);
            toast.error("Could not complete structural validation");
        } finally {
            setIsValidating(false);
        }
    };

    if (loading || !report) {
        return <LoadingScreen />;
    }

    return (
        <div className="flex w-full h-[calc(100vh-68px)] bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden font-inter">

            {/* Professional Metadata Sidebar */}
            <div className="hidden xl:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">Document Metadata</h3>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Title</label>
                            <input
                                type="text"
                                value={report?.title || ''}
                                onChange={(e) => setReport({ ...report, title: e.target.value })}
                                placeholder="Report title"
                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Student Name</label>
                            <input
                                type="text"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                placeholder="Student name"
                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Institution</label>
                            <input
                                type="text"
                                value={institution}
                                onChange={(e) => setInstitution(e.target.value)}
                                placeholder="Institution"
                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Course</label>
                            <input
                                type="text"
                                value={courseName}
                                onChange={(e) => setCourseName(e.target.value)}
                                placeholder="Course name"
                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Author</label>
                            <input
                                type="text"
                                value={authorName}
                                onChange={(e) => setAuthorName(e.target.value)}
                                placeholder="Author name"
                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Date</label>
                            <input
                                type="text"
                                value={submissionDate}
                                onChange={(e) => setSubmissionDate(e.target.value)}
                                placeholder="Submission date"
                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Progress</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium">{Object.values(report?.sections || {}).filter(Boolean).length}</span>
                        <span>of</span>
                        <span className="font-medium">{report?.outline?.length || 0}</span>
                        <span>sections drafted</span>
                    </div>
                    <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                            style={{ width: `${report?.outline ? (Object.values(report?.sections || {}).filter(Boolean).length / report.outline.length) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div ref={scrollContainerRef} className="flex-1 flex flex-col items-center overflow-y-auto overflow-x-hidden relative scrollbar-hide h-full pb-40 w-full px-2 md:px-0">

                {/* Floating Action Buttons */}
                <div className="fixed bottom-4 md:bottom-6 right-4 md:right-6 z-[60] flex flex-col md:flex-row items-center gap-2 no-print">
                    <button
                        onClick={() => setShowOutline(v => !v)}
                        className={`p-3 rounded-full transition-all shadow-lg hover:shadow-xl xl:hidden ${showOutline ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
                        title={showOutline ? 'Hide Outline' : 'Show Outline'}
                    >
                        <PanelRight className="w-5 h-5" />
                    </button>

                    <button onClick={() => saveReport()} disabled={saving} className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all shadow-lg hover:shadow-xl disabled:opacity-50" title="Save Changes">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    </button>

                    <button onClick={exportAsDOCX} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full transition-all shadow-lg hover:shadow-xl" title="Download Word (.docx)">
                        <Download className="w-5 h-5" />
                    </button>
                </div>

                {/* Document Page Wrapper */}
                <div className="w-full flex-1 flex flex-col items-center pt-6 md:pt-12">

                    {/* Multi-page visualization container */}
                    <div className="document-container relative bg-transparent w-full max-w-full md:max-w-[260mm] mb-32 p-0 md:p-4 lg:p-10 flex flex-col items-center">

                        {/* Title Page */}
                        <div
                            className="document-page bg-white dark:bg-slate-900 relative rounded-lg overflow-hidden transition-all duration-300 pointer-events-auto border border-slate-300 dark:border-slate-700 w-full max-w-full md:max-w-[260mm] mb-8"
                            style={{
                                boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)',
                                padding: 'clamp(1rem, 5vw, 1.5cm)',
                                minHeight: '29.7cm'
                            }}
                        >
                            <div
                                ref={titlePageRef}
                                contentEditable="true"
                                onInput={handleEditorInput}
                                suppressContentEditableWarning={true}
                                className="prose dark:prose-invert prose-slate max-w-none outline-none relative z-0 h-full"
                                style={{
                                    fontFamily: 'Inter, system-ui, sans-serif'
                                }}
                            />
                        </div>

                        {/* Visual Page Gap */}
                        <div className="h-4 w-full no-print" />

                        {/* Main Content Page - Professional Design */}
                        <div
                            className="document-page bg-white dark:bg-slate-900 relative rounded-lg overflow-hidden transition-all duration-300 pointer-events-auto border border-slate-300 dark:border-slate-700 w-full max-w-full md:max-w-[260mm]"
                            style={{
                                boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)',
                                padding: 'clamp(1rem, 5vw, 1.5cm)'
                            }}
                        >
                            <div className="prose dark:prose-invert prose-slate max-w-none outline-none relative z-0 min-h-[29.7cm]"
                                style={{
                                    fontFamily: 'Inter, system-ui, sans-serif',
                                    fontSize: {
                                        "1": "10px",
                                        "2": "12px",
                                        "3": "16px",
                                        "4": "18px",
                                        "5": "24px"
                                    }[selectedFontSize] || "16px",
                                    lineHeight: selectedLineHeight,
                                    wordSpacing: '0.05em'
                                }}
                                ref={editorRef}
                                contentEditable="true"
                                onInput={(e) => {
                                    handleEditorInput();
                                    updateHeaderOffsets();
                                }}
                                suppressContentEditableWarning={true}
                                placeholder="Start typing your research report..."
                            />
                        </div>

                        {/* Visual Page Gap */}
                        <div className="h-8 w-full no-print" />

                        {/* References Page */}
                        <div
                            className="document-page bg-white dark:bg-slate-900 relative rounded-lg overflow-hidden transition-all duration-300 pointer-events-auto border border-slate-300 dark:border-slate-700 w-full max-w-full md:max-w-[260mm]"
                            style={{
                                boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)',
                                padding: 'clamp(1rem, 5vw, 1.5cm)',
                                minHeight: '29.7cm'
                            }}
                        >
                            <div className="relative z-10 w-full h-full flex flex-col">
                                <div className="flex items-center gap-4 mb-8 md:mb-16">
                                    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />
                                    <span className="px-6 text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">References</span>
                                    <div className="flex-1 h-px bg-gradient-to-l from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />
                                </div>

                                <div
                                    ref={referencesRef}
                                    contentEditable="true"
                                    onInput={handleEditorInput}
                                    suppressContentEditableWarning={true}
                                    className="space-y-6 prose dark:prose-invert max-w-none flex-1 outline-none min-h-[500px]"
                                >
                                    {allReferences.length > 0 ? (
                                        allReferences.map((ref, i) => (
                                            <p key={i} style={{
                                                fontSize: '0.95rem',
                                                marginBottom: '1rem',
                                                paddingLeft: '2rem',
                                                textIndent: '-2rem',
                                                lineHeight: '1.7',
                                                textAlign: 'left',
                                                color: 'var(--report-text-color)',
                                                fontFamily: 'Inter, system-ui, sans-serif'
                                            }}>
                                                {ref}
                                            </p>
                                        ))
                                    ) : (
                                        <div contentEditable="false" className="text-center py-16 flex items-center justify-center h-full no-references-placeholder">
                                            <div className="flex flex-col items-center">
                                                <FileText className="w-12 h-12 text-slate-300 mb-3" />
                                                <p className="text-sm text-slate-400 font-medium">Citations will be automatically compiled here</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar Outline Panel - Desktop Only */}
            {showOutline && (
                <div className="hidden xl:flex flex-col w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-800 dark:to-slate-800/50">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Outline & Content</h3>
                            </div>
                            <button
                                onClick={runStructuralValidation}
                                disabled={isValidating}
                                className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 transition-colors"
                                title="Run Structural Validation"
                            >
                                {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                            </button>
                        </div>
                        <button onClick={() => setShowOutline(false)} className="absolute top-6 right-6 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all">
                            <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </button>
                    </div>

                    {/* Validation Results Panel */}
                    {validationResults && (
                        <div className="mx-4 mt-4 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-900/10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-indigo-600" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Structure Score</span>
                                </div>
                                <span className={`text-sm font-black ${validationResults.structureScore > 80 ? 'text-emerald-500' : validationResults.structureScore > 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                    {validationResults.structureScore}%
                                </span>
                            </div>

                            <div className="space-y-2">
                                {validationResults.missingSections.length > 0 && (
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-[10px] text-rose-600 leading-tight">Missing: {validationResults.missingSections.join(', ')}</p>
                                    </div>
                                )}
                                {validationResults.emptySections.length > 0 && (
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-[10px] text-amber-600 leading-tight">Empty: {validationResults.emptySections.join(', ')}</p>
                                    </div>
                                )}
                                {validationResults.distributionWarnings.map((warn, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-[10px] text-amber-600 leading-tight">{warn}</p>
                                    </div>
                                ))}
                                {validationResults.structuralDrift.length > 0 && (
                                    <div className="flex items-start gap-2">
                                        <RefreshCcw className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-[10px] text-indigo-600 leading-tight">Structure drift detected in {validationResults.structuralDrift.length} sections.</p>
                                    </div>
                                )}
                                {validationResults.structureScore === 100 && (
                                    <div className="flex items-center gap-2 py-1">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        <p className="text-[10px] text-emerald-600 font-bold">Perfect academic structure!</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setValidationResults(null)}
                                className="w-full mt-3 py-1 text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                        <div className="p-4 space-y-3">
                            {/* Abstract Card */}
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-800/50 dark:to-slate-800/30 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Abstract</span>
                                    {report.abstract && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Summary</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">Concise overview of the entire document</p>
                                <button
                                    onClick={generateAbstract}
                                    disabled={generatingAbstract}
                                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${generatingAbstract ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400' :
                                        report.abstract ? 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600' :
                                            'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                        }`}
                                >
                                    {generatingAbstract ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    <span>{generatingAbstract ? 'Generating...' : report.abstract ? 'Regenerate' : 'Generate'}</span>
                                </button>
                            </div>

                            {/* Section Cards */}
                            {report.outline.map((section, idx) => {
                                const isGenerating = generatingSection === section.id;
                                const isDone = report.sections?.[section.id];
                                const currentTargetLength = sectionLengths[section.id] || 1;

                                return (
                                    <div
                                        key={section.id}
                                        className={`p-4 rounded-xl border transition-all group ${isDone
                                            ? 'bg-gradient-to-br from-emerald-50/50 to-emerald-50/30 dark:from-emerald-900/20 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-800/50'
                                            : 'bg-gradient-to-br from-slate-50 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-800/30 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Section {idx + 1}</span>
                                            {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                                        </div>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 line-clamp-2">{section.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">{section.description}</p>

                                        {!isDone && (
                                            <div className="mb-3 flex items-center gap-1 bg-white dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
                                                {[1, 2, 3].map(pages => (
                                                    <button
                                                        key={pages}
                                                        onClick={() => setSectionLengths({ ...sectionLengths, [section.id]: pages })}
                                                        className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${currentTargetLength === pages
                                                            ? 'bg-indigo-600 text-white shadow-sm'
                                                            : 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-500'
                                                            }`}
                                                    >{pages}p</button>
                                                ))}
                                            </div>
                                        )}

                                        <button
                                            onClick={() => generateSection(section)}
                                            disabled={isGenerating}
                                            className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${isGenerating
                                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400' :
                                                isDone
                                                    ? 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                                }`}
                                        >
                                            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                            <span>{isGenerating ? 'Drafting...' : isDone ? 'Regenerate' : 'Draft'}</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Outline Drawer — slides up from bottom on small screens when toggled */}
            {showOutline && (
                <div className="xl:hidden fixed inset-0 z-[80] flex flex-col justify-end">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowOutline(false)} />

                    {/* Drawer panel - Professional bottom sheet */}
                    <div className="relative bg-white dark:bg-slate-900 rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto shadow-2xl border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="font-bold text-slate-900 dark:text-white">Document Settings</h3>
                            </div>
                            <button onClick={() => setShowOutline(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </button>
                        </div>

                        {/* Mobile Metadata Inputs */}
                        <div className="mb-8 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Metadata</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={report?.title || ''}
                                        onChange={(e) => setReport({ ...report, title: e.target.value })}
                                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={studentName}
                                        onChange={(e) => setStudentName(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Institution</label>
                                    <input
                                        type="text"
                                        value={institution}
                                        onChange={(e) => setInstitution(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Course</label>
                                    <input
                                        type="text"
                                        value={courseName}
                                        onChange={(e) => setCourseName(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">AI Outline</h4>
                        </div>

                        {/* Abstract card */}
                        <div className="mb-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-800/50 dark:to-slate-800/30">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Abstract</span>
                                {report.abstract && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            </div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Summary</h4>
                            <button
                                onClick={() => { generateAbstract(); setShowOutline(false); }}
                                disabled={generatingAbstract}
                                className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all mt-3 ${generatingAbstract ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400' :
                                    report.abstract ? 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600' :
                                        'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                            >
                                {generatingAbstract ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                <span>{generatingAbstract ? 'Generating...' : report.abstract ? 'Regenerate' : 'Generate'}</span>
                            </button>
                        </div>

                        {/* Section Cards */}
                        <div className="space-y-3">
                            {report.outline.map((section, idx) => {
                                const isGenerating = generatingSection === section.id;
                                const isDone = report.sections?.[section.id];
                                const currentTargetLength = sectionLengths[section.id] || 1;

                                return (
                                    <div
                                        key={section.id}
                                        className={`p-4 rounded-lg border transition-all ${isDone
                                            ? 'bg-gradient-to-br from-emerald-50/50 to-emerald-50/30 dark:from-emerald-900/20 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-800/50'
                                            : 'bg-gradient-to-br from-slate-50 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-800/30 border-slate-200 dark:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Section {idx + 1}</span>
                                            {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                        </div>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{section.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{section.description}</p>

                                        {!isDone && (
                                            <div className="mb-3 flex items-center gap-1 bg-white dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
                                                {[1, 2, 3].map(pages => (
                                                    <button
                                                        key={pages}
                                                        onClick={() => setSectionLengths({ ...sectionLengths, [section.id]: pages })}
                                                        className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${currentTargetLength === pages
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-500'
                                                            }`}
                                                    >{pages}p</button>
                                                ))}
                                            </div>
                                        )}

                                        <button
                                            onClick={() => { generateSection(section); setShowOutline(false); }}
                                            disabled={isGenerating}
                                            className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${isGenerating
                                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400' :
                                                isDone
                                                    ? 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                }`}
                                        >
                                            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                            <span>{isGenerating ? 'Drafting...' : isDone ? 'Regenerate' : 'Draft'}</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Selection AI Toolbar */}
            {toolbar.visible && (
                <div
                    className="fixed z-[100] -translate-x-1/2 -translate-y-full mb-2 selection-toolbar-container flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl p-1 animate-in fade-in zoom-in duration-200"
                    style={{ left: toolbar.x, top: toolbar.y }}
                >
                    <div className="flex items-center gap-0.5">
                        <button
                            onClick={() => handleRewrite('regenerate')}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 flex flex-col items-center gap-1 group transition-colors"
                            title="Regenerate"
                        >
                            <RefreshCcw className="w-3.5 h-3.5 group-hover:text-indigo-600" />
                            <span className="text-[10px] font-medium">Regen</span>
                        </button>
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
                        <button
                            onClick={() => handleRewrite('reparaphrase')}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 flex flex-col items-center gap-1 group transition-colors"
                            title="Paraphrase"
                        >
                            <ArrowLeftRight className="w-3.5 h-3.5 group-hover:text-emerald-600" />
                            <span className="text-[10px] font-medium">Paraphrase</span>
                        </button>
                        <button
                            onClick={() => handleRewrite('expand')}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 flex flex-col items-center gap-1 group transition-colors"
                            title="Expand"
                        >
                            <Maximize2 className="w-3.5 h-3.5 group-hover:text-amber-600" />
                            <span className="text-[10px] font-medium">Expand</span>
                        </button>
                        <button
                            onClick={() => handleRewrite('shorten')}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 flex flex-col items-center gap-1 group transition-colors"
                            title="Shorten"
                        >
                            <Minimize2 className="w-3.5 h-3.5 group-hover:text-rose-600" />
                            <span className="text-[10px] font-medium">Shorten</span>
                        </button>
                    </div>

                    {isRewriting && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-lg flex items-center justify-center backdrop-blur-sm">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        </div>
                    )}
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
        :root {
          --report-text-color: #1e293b;
        }
        .dark {
          --report-text-color: #cbd5e1;
        }

        @media print {
          .no-print, nav, .fixed, .absolute, button, [role="toolbar"], [role="region"], svg {
            display: none !important;
          }
          body, html {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .document-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 2.54cm !important;
            page-break-after: always;
            break-after: page;
            background: white !important;
            color: #1e293b !important;
          }
          .document-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
        
        .document-page * {
          page-break-inside: avoid;
        }

        @keyframes progress-loading {
          0% { width: 0%; }
          100% { width: 90%; }
        }

        .animate-progress-loading {
          animation: progress-loading 4s ease-out forwards;
        }

        .document-page h1, .document-page h2 {
          page-break-after: avoid;
        }

        [contenteditable]:focus {
          outline: none;
        }

        [contenteditable]:empty:before {
          content: attr(placeholder);
          color: #94a3b8;
          cursor: text;
        }

        /* Professional Typography Presets */
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          font-weight: 700 !important;
          color: var(--report-text-color) !important;
          font-family: 'Inter', system-ui, sans-serif !important;
          letter-spacing: -0.01em;
        }

        .prose h1 { 
          font-size: 2.5rem; 
          margin-top: 3rem; 
          margin-bottom: 1.5rem; 
          border-bottom: 3px solid #e2e8f0;
          padding-bottom: 1.5rem;
          line-height: 1.2;
        }
        
        .dark .prose h1 {
           border-bottom-color: #334155;
        }

        .prose h2 { 
          font-size: 1.875rem; 
          margin-top: 2.5rem; 
          margin-bottom: 1.25rem; 
          border-left: 5px solid #6366f1;
          padding-left: 1.5rem;
          line-height: 1.25;
        }
        
        .prose h3 { 
          font-size: 1.5rem; 
          margin-top: 2rem; 
          margin-bottom: 1rem;
          color: #334155;
        }

        .dark .prose h3 {
           color: #94a3b8;
        }
        
        .prose h4 { 
          font-size: 1.125rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .prose p { 
          margin-bottom: 1.5rem; 
          color: var(--report-text-color); 
          text-align: justify;
          line-height: 2;
          font-size: 1rem;
        }

        @media (max-width: 640px) {
          .prose h1 { font-size: 1.5rem; margin-top: 1.5rem; padding-bottom: 0.75rem; }
          .prose h2 { font-size: 1.25rem; margin-top: 1.25rem; padding-left: 0.75rem; }
          .prose h3 { font-size: 1.1rem; margin-top: 1rem; }
          .prose p { font-size: 12px; line-height: 2; margin-bottom: 1rem; }
          .document-page { 
            border-radius: 0 !important; 
            border-left: none !important;
            border-right: none !important;
            padding: 1rem !important;
            box-shadow: none !important;
          }
        }

        .prose ul, .prose ol { 
          margin-bottom: 1.5rem; 
          padding-left: 2.5rem;
        }

        .prose li { 
          margin-bottom: 0.75rem; 
          color: var(--report-text-color);
          line-height: 1.6;
        }

        .prose blockquote {
          border-left: 4px solid #6366f1;
          padding-left: 1.5rem;
          color: #64748b;
          font-style: italic;
          margin: 1.5rem 0;
        }

        .prose a {
          color: #6366f1;
          text-decoration: none;
          border-bottom: 1px solid rgba(99, 102, 241, 0.2);
          transition: all 0.2s ease;
        }

        .prose a:hover {
          border-bottom-color: #6366f1;
        }

        .dark.prose h1, .dark.prose h2, .dark.prose h3, .dark.prose h4 {
          color: #f1f5f9 !important;
        }

        .dark.prose h1 { 
          border-bottom-color: #334155;
        }
        
        .dark.prose h2 { 
          color: #e2e8f0 !important;
          border-left-color: #6366f1;
        }

        .dark.prose p, .dark.prose li {
          color: #cbd5e1;
        }

        .dark.prose blockquote {
          border-left-color: #6366f1;
          color: #94a3b8;
        }

        /* Selection styling */
        ::selection {
          background-color: rgba(99, 102, 241, 0.25);
          color: inherit;
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .dark ::-webkit-scrollbar-thumb {
          background: #475569;
        }

        .dark ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
    ` }} />
        </div >
    );
}
