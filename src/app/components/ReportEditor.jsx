"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Save, Download, FileText,
    Sparkles, Loader2, CheckCircle2,
    Plus, PanelRight, X, Table2
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import UpgradeModal from "./UpgradeModal";

const stripHtmlText = (value = "") =>
    String(value || "")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

export default function ReportEditor({ reportId }) {
    const { user, isPro, isEnterprise } = useAuth();
    const loggedInUserName =
        user?.name ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
        (user?.email ? user.email.split("@")[0] : "");
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generatingSection, setGeneratingSection] = useState(null);
    const [generatingAbstract, setGeneratingAbstract] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedFontFamily, setSelectedFontFamily] = useState("Inter, system-ui, sans-serif");
    const [selectedFontSize, setSelectedFontSize] = useState("3");
    const [selectedLineHeight, setSelectedLineHeight] = useState("2.0");
    const [authorName, setAuthorName] = useState("");
    const [institution, setInstitution] = useState("");
    const [courseName, setCourseName] = useState("");
    const [studentName, setStudentName] = useState("");
    const [submissionDate, setSubmissionDate] = useState("");
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
    const saveInFlightRef = useRef(false);
    const loadedRef = useRef(false);
    const [toolbar, setToolbar] = useState({ visible: false, x: 0, y: 0, text: '', range: null });
    const [isRewriting, setIsRewriting] = useState(false);
    const [citationStyle, setCitationStyle] = useState("APA 7");
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [customSectionTitle, setCustomSectionTitle] = useState("");
    const [customSectionDescription, setCustomSectionDescription] = useState("");
    const [customSectionPages, setCustomSectionPages] = useState(1);
    const [customSectionPlacement, setCustomSectionPlacement] = useState("end");
    const pendingContentRef = useRef(null); // holds fullContent until editor mounts
    const pendingTitlePageContentRef = useRef(null); // holds titlePageContent until editor mounts
    const pendingReportRef = useRef(null);  // holds report data until editor mounts
    const activeEditableRef = useRef(null);
    const router = useRouter();

    const saveBlob = useCallback(async (blob, fileName) => {
        const fileSaverModule = await import("file-saver");
        const saveFile =
            fileSaverModule.saveAs ||
            fileSaverModule.default?.saveAs ||
            fileSaverModule.default;

        if (typeof saveFile !== "function") {
            throw new Error("File saver is unavailable");
        }

        saveFile(blob, fileName);
    }, []);

    const setActiveEditable = useCallback((node) => {
        if (node) {
            activeEditableRef.current = node;
        }
    }, []);

    const getActiveEditable = useCallback(() => {
        if (activeEditableRef.current?.isConnected) {
            return activeEditableRef.current;
        }
        return editorRef.current || titlePageRef.current || referencesRef.current;
    }, []);

    const fetchReport = useCallback(async () => {
        try {
            const res = await apiClient.get(`/api/reports/${reportId}`);
            if (res.ok) {
                const data = await res.json();
                const r = data.report;
                setReport(r);
                pendingReportRef.current = r; // save for after editor mounts
                // Restore metadata from DB
                if (r.authorName && r.authorName !== "Research Author") setAuthorName(r.authorName);
                if (r.institution && r.institution !== "Actinova University") setInstitution(r.institution);
                if (r.courseName && r.courseName !== "Advanced Academic Writing") setCourseName(r.courseName);
                if (r.studentName && r.studentName !== "Actinova Student") {
                    setStudentName(r.studentName);
                } else if (loggedInUserName) {
                    setStudentName(loggedInUserName);
                }
                if (r.submissionDate) setSubmissionDate(r.submissionDate);
                if (r.citationStyle) setCitationStyle(r.citationStyle);
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
    }, [reportId, router, loggedInUserName]);

    useEffect(() => {
        fetchReport();
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [fetchReport]);

    useEffect(() => {
        const needsLoggedInName = studentName === "" || studentName === "Actinova Student";
        if (!loggedInUserName || !needsLoggedInName) return;
        setStudentName(loggedInUserName);
    }, [loggedInUserName, studentName]);

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
            referencesRef.current.innerHTML = r.references.map(ref => `<p class="report-reference">${ref}</p>`).join('');
        }

        // Mark as fully loaded — autosave is now safe
        loadedRef.current = true;
    }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!referencesRef.current || loading) return;
        if (document.activeElement === referencesRef.current) return;

        if (allReferences.length > 0) {
            referencesRef.current.innerHTML = allReferences
                .map((ref) => `<p class="report-reference">${ref}</p>`)
                .join("");
        } else {
            referencesRef.current.innerHTML = `
                <div contenteditable="false" class="text-center py-16 flex items-center justify-center h-full no-references-placeholder">
                    <div class="flex flex-col items-center">
                        <p class="text-sm text-slate-400 font-medium">Citations will be automatically compiled here</p>
                    </div>
                </div>
            `;
        }
    }, [allReferences, loading]);

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
        if (!editorRef.current && !contentOverride) return false;
        if (saveInFlightRef.current) return false;

        saveInFlightRef.current = true;
        setSaving(true);
        try {
            const content = contentOverride || editorRef.current.innerHTML;
            const titlePageContent = titlePageRef.current ? titlePageRef.current.innerHTML : '';
            const sections = sectionsOverride || report?.sections;
            const references = referencesOverride || (
                referencesRef.current
                    ? Array.from(referencesRef.current.querySelectorAll('p.report-reference'))
                        .map((p) => p.innerText.trim())
                        .filter(Boolean)
                    : allReferences
            );

            const res = await apiClient.patch(`/api/reports/${reportId}`, {
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
                citationStyle,
            });

            if (res.ok) {
                setLastSaved(new Date());
                return true;
            }
            return false;
        } catch (error) {
            console.error("Auto-save failed:", error);
            return false;
        } finally {
            saveInFlightRef.current = false;
            setSaving(false);
        }
    }, [reportId, report, allReferences, authorName, institution, courseName, studentName, submissionDate, citationStyle, sectionLengths]);

    const handleManualSave = useCallback(async () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        const didSave = await saveReport();

        if (didSave) {
            toast.success("Saved");
        }
    }, [saveReport]);

    const handleEditorInput = useCallback(() => {
        if (!loadedRef.current) return; // skip saves during initial content restore
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            saveReport();
        }, 2000); // 2s debounce autosave
    }, [saveReport]);

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

    const applySelectionCommand = useCallback((command, value = null) => {
        if (!toolbar.range) return;

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(toolbar.range);
        document.execCommand(command, false, value);
        handleEditorInput();
        updateHeaderOffsets();
        setToolbar((prev) => ({ ...prev, visible: false }));
    }, [toolbar.range, handleEditorInput, updateHeaderOffsets]);

    const handleCommand = useCallback((command, value = null) => {
        const target = getActiveEditable();
        if (!target) return;

        target.focus();

        // Apply command
        document.execCommand(command, false, value);

        // Force an input event to trigger auto-save if content changed
        handleEditorInput();
    }, [getActiveEditable, handleEditorInput]);

    const buildSectionHTML = useCallback((section, sectionData) => {
        let html = `<h2 data-section-id="${section.id}" style="font-weight: bold; font-size: 1.75rem; margin-top: 2rem; margin-bottom: 1.25rem;">${sectionData.heading}</h2>`;
        if (sectionData.paragraphs && Array.isArray(sectionData.paragraphs)) {
            html += sectionData.paragraphs.map(p => `<p style="margin-bottom: 1.75rem; text-align: justify;">${p}</p>`).join('');
        } else if (sectionData.content) {
            html += sectionData.content.split('\n\n').map(p => `<p style="margin-bottom: 1.75rem; text-align: justify;">${p}</p>`).join('');
        }

        return `<div data-generated-section-id="${section.id}">${html}</div>`;
    }, []);

    const insertSectionIntoEditor = useCallback((section, sectionHtml, outline = []) => {
        if (!editorRef.current) return;

        const editor = editorRef.current;
        const existingWrapper = editor.querySelector(`[data-generated-section-id="${section.id}"]`);
        if (existingWrapper) {
            existingWrapper.remove();
        } else {
            const existingHeading = editor.querySelector(`h2[data-section-id="${section.id}"]`);
            existingHeading?.parentElement?.remove();
        }

        const temp = document.createElement("div");
        temp.innerHTML = sectionHtml;
        const sectionNode = temp.firstElementChild;
        if (!sectionNode) return;

        const currentIndex = outline.findIndex((item) => item.id === section.id);
        const nextSection = currentIndex >= 0
            ? outline.slice(currentIndex + 1).find((item) => editor.querySelector(`[data-generated-section-id="${item.id}"], h2[data-section-id="${item.id}"]`))
            : null;

        if (nextSection) {
            const nextNode = editor.querySelector(`[data-generated-section-id="${nextSection.id}"]`) ||
                editor.querySelector(`h2[data-section-id="${nextSection.id}"]`)?.parentElement;
            if (nextNode) {
                editor.insertBefore(sectionNode, nextNode);
                return;
            }
        }

        editor.appendChild(sectionNode);
    }, []);

    const serializeEditorBlocks = useCallback((root) => {
        const blocks = [];
        const normalizeInlineText = (text) => String(text || "").replace(/\s+/g, " ");
        const getNodeAlignment = (node, inheritedAlignment = "justify") => {
            if (!node || node.nodeType !== Node.ELEMENT_NODE) return inheritedAlignment;

            const explicitAlignment =
                node.style?.textAlign ||
                node.getAttribute?.("align") ||
                "";

            const normalizedAlignment = String(explicitAlignment).toLowerCase();
            if (["left", "center", "right", "justify"].includes(normalizedAlignment)) {
                return normalizedAlignment;
            }

            return inheritedAlignment;
        };

        const collectRuns = (node, inherited = { bold: false, italics: false, underline: false }) => {
            if (!node) return [];

            if (node.nodeType === Node.TEXT_NODE) {
                const value = normalizeInlineText(node.textContent);
                if (!value.trim()) return [];
                return [{ text: value, ...inherited }];
            }

            if (node.nodeType !== Node.ELEMENT_NODE) return [];

            const tag = node.tagName.toUpperCase();
            const style = node.style || {};
            const nextStyle = {
                bold: inherited.bold || tag === "B" || tag === "STRONG" || style.fontWeight === "bold" || Number(style.fontWeight) >= 600,
                italics: inherited.italics || tag === "I" || tag === "EM" || style.fontStyle === "italic",
                underline: inherited.underline || tag === "U" || style.textDecoration?.includes("underline"),
            };

            if (tag === "BR") {
                return [{ text: "\n", ...nextStyle }];
            }

            return Array.from(node.childNodes).flatMap((child) => collectRuns(child, nextStyle));
        };

        const cleanRuns = (runs = []) =>
            runs
                .map((run) => ({
                    ...run,
                    text: String(run.text || "").replace(/\s+/g, run.text?.includes("\n") ? "\n" : " "),
                }))
                .filter((run) => run.text && run.text.trim());

        const walk = (node, inheritedAlignment = "justify") => {
            if (!node) return;

            if (node.nodeType === Node.TEXT_NODE) {
                const value = String(node.textContent || "").replace(/\s+/g, " ").trim();
                if (value) {
                    blocks.push({ type: "paragraph", runs: [{ text: value }], alignment: inheritedAlignment });
                }
                return;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) return;

            const tag = node.tagName.toUpperCase();
            const blockAlignment = getNodeAlignment(node, inheritedAlignment);

            if (tag === "TABLE") {
                const rows = Array.from(node.querySelectorAll("tr"))
                    .map((row) =>
                        Array.from(row.querySelectorAll("th,td"))
                            .map((cell) => ({
                                runs: cleanRuns(collectRuns(cell)),
                                alignment: getNodeAlignment(cell, blockAlignment),
                            }))
                    )
                    .filter((row) => row.some((cell) => cell.runs?.length));

                if (rows.length > 0) blocks.push({ type: "table", rows, alignment: blockAlignment });
                return;
            }

            if (tag === "UL" || tag === "OL") {
                const items = Array.from(node.querySelectorAll(":scope > li"))
                    .map((item) => ({
                        runs: cleanRuns(collectRuns(item)),
                        alignment: getNodeAlignment(item, blockAlignment),
                    }))
                    .filter((item) => item.runs?.length);
                if (items.length > 0) {
                    blocks.push({ type: "list", ordered: tag === "OL", items, alignment: blockAlignment });
                }
                return;
            }

            if (/^H[1-6]$/.test(tag)) {
                const runs = cleanRuns(collectRuns(node));
                if (runs.length > 0) {
                    blocks.push({ type: "heading", level: Number(tag[1]), runs, alignment: blockAlignment });
                }
                return;
            }

            if (tag === "P" || tag === "BLOCKQUOTE") {
                const runs = cleanRuns(collectRuns(node));
                if (runs.length > 0) {
                    blocks.push({ type: "paragraph", runs, alignment: blockAlignment });
                }
                return;
            }

            if (tag === "DIV" || tag === "SECTION" || tag === "ARTICLE") {
                Array.from(node.childNodes).forEach((child) => walk(child, blockAlignment));
                return;
            }

            const runs = cleanRuns(collectRuns(node));
            if (runs.length > 0) {
                blocks.push({ type: "paragraph", runs, alignment: blockAlignment });
            }
        };

        Array.from(root?.childNodes || []).forEach(walk);
        return blocks;
    }, []);

    const handleLineHeightChange = (lineHeight) => {
        setSelectedLineHeight(lineHeight);
        const target = getActiveEditable();
        if (!target) return;

        target.focus();

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
            target.style.lineHeight = lineHeight;
        }

        handleEditorInput();
    };

    const handleInsertTable = useCallback(() => {
        const target = getActiveEditable();
        if (!target) return;

        const requestedRows = typeof window !== "undefined" ? window.prompt("Number of rows", "3") : "3";
        const requestedCols = typeof window !== "undefined" ? window.prompt("Number of columns", "3") : "3";
        const rows = Math.max(1, Math.min(12, Number.parseInt(requestedRows || "3", 10) || 3));
        const cols = Math.max(1, Math.min(8, Number.parseInt(requestedCols || "3", 10) || 3));

        target.focus();
        const tableHtml = `
            <table style="width: 100%; border-collapse: collapse; margin: 1.5rem 0;">
                <tbody>
                    ${Array.from({ length: rows }).map(() => `
                        <tr>
                            ${Array.from({ length: cols }).map(() => `
                                <td style="border: 1px solid #cbd5e1; padding: 0.75rem; min-width: 96px;">Cell</td>
                            `).join("")}
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
        document.execCommand("insertHTML", false, tableHtml);
        handleEditorInput();
    }, [getActiveEditable, handleEditorInput]);

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

    const getTitlePageHTML = useCallback((reportData = report) => {
        if (!reportData) return '';

        const style = (citationStyle || reportData.citationStyle || "APA").toUpperCase();
        const isAPA = style.includes('APA');
        const isMLA = style.includes('MLA');
        const isChicago = style.includes('CHICAGO');

        // CSS for theme awareness in injected HTML
        const textColor = "var(--report-text-color, #1e293b)";

        if (isAPA) {
            return `
                <div id="title-page" style="text-align: center; display: flex; flex-direction: column; justify-content: center; min-height: 20cm; padding-top: 5cm; color: ${textColor};">
                    <h1 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 2rem; line-height: 2; text-align: center;">${reportData.title || "Untitled Report"}</h1>
                    <div style="line-height: 2;">
                        <p style="font-size: 1rem; margin-bottom: 0px;">${studentName || loggedInUserName || "Student Name"}</p>
                        <p style="font-size: 1rem; margin-bottom: 0px;">${institution || "University Name"}</p>
                        <p style="font-size: 1rem; margin-bottom: 0px;">${courseName || "Course Title"}</p>
                        <p style="font-size: 1rem; margin-bottom: 0px;">${authorName || "Instructor"}</p>
                        <p style="font-size: 1rem; margin-bottom: 0px;">${submissionDate || "Date"}</p>
                    </div>
                </div>
            `;
        } else if (isMLA) {
            return `
                <div id="title-page" style="text-align: left; padding-top: 1cm; line-height: 2; color: ${textColor};">
                    <p style="margin-bottom: 0px;">${studentName || loggedInUserName || "Student Name"}</p>
                    <p style="margin-bottom: 0px;">${authorName || "Instructor"}</p>
                    <p style="margin-bottom: 0px;">${courseName || "Course Title"}</p>
                    <p style="margin-bottom: 2rem;">${submissionDate || "Date"}</p>
                    <h1 style="font-size: 1.25rem; font-weight: normal; text-align: center; margin-top: 3rem; margin-bottom: 2rem;">${reportData.title || "Untitled Report"}</h1>
                </div>
            `;
        } else if (isChicago) {
            return `
                <div id="title-page" style="text-align: center; display: flex; flex-direction: column; justify-content: space-between; min-height: 22cm; padding: 4cm 0; color: ${textColor};">
                    <h1 style="font-size: 1.35rem; font-weight: bold; margin-bottom: 4rem; line-height: 2; text-align: center;">${reportData.title || "Untitled Report"}</h1>
                    <div style="line-height: 2; margin-top: auto;">
                        <p style="font-size: 1.1rem; margin-bottom: 0px;">${studentName || loggedInUserName || "Student Name"}</p>
                        <p style="font-size: 1.1rem; margin-bottom: 0.px;">${courseName || "Course Title"}</p>
                        <p style="font-size: 1.1rem; margin-bottom: 0px;">${submissionDate || "Date"}</p>
                    </div>
                </div>
            `;
        } else {
            return `
                <div id="title-page" style="text-align: center; padding-top: 5cm; line-height: 2; color: ${textColor};">
                    <h1 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 2rem; text-align: center;">${reportData.title || "Untitled Report"}</h1>
                    <p style="font-weight: bold; margin-bottom: 0px;">${studentName || loggedInUserName || "Student Name"}</p>
                    <p style="margin-bottom: 0px;">${institution || "University Name"}</p>
                    <p style="margin-bottom: 0px;">${courseName || "Course Title"}</p>
                    <p style="margin-bottom: 0px;">${authorName || "Instructor"}</p>
                    <p style="margin-top: 2rem;">${submissionDate || "Date"}</p>
                </div>
            `;
        }
    }, [report, citationStyle, studentName, loggedInUserName, institution, courseName, authorName, submissionDate]);

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
    }, [report, getTitlePageHTML, handleEditorInput]);

    // Keyboard shortcuts handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle shortcuts when editor is focused
            const activeElement = document.activeElement;
            const isEditableFocused =
                editorRef.current?.contains(activeElement) ||
                titlePageRef.current?.contains(activeElement) ||
                referencesRef.current?.contains(activeElement);
            if (!isEditableFocused) return;

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
                handleManualSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleManualSave, handleCommand]);


    const generateAbstract = async () => {
        if (generatingAbstract) return;
        setGeneratingAbstract(true);
        const toastId = toast.loading("Synthesizing abstract...");

        try {
            const res = await apiClient.post("/api/generate-report-section", {
                reportId,
                sectionId: "abstract",
                sectionTitle: "Abstract",
                sectionDescription: `Generate a comprehensive abstract (150-250 words) summarizing the ${report.type} on "${report.topic}". Include key findings, methodology, and conclusions.`,
                topic: report.topic,
                type: report.type,
                difficulty: report.academicLevel || "Undergraduate",
                citationStyle: citationStyle || "APA 7",
                criticalDepth: report.criticalDepth || "Moderate",
                requestedPages: 1,
                existingContent: editorRef.current.innerHTML,
                existingReferences: allReferences
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
                await apiClient.patch(`/api/reports/${reportId}`, {
                    abstract: abstractText,
                    fullContent: editorRef.current.innerHTML
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
            const res = await apiClient.post("/api/generate-report-section", {
                reportId,
                sectionId: section.id,
                sectionTitle: section.title,
                sectionDescription: section.description,
                topic: report.topic,
                type: report.type,
                difficulty: report.academicLevel || "Undergraduate",
                citationStyle: citationStyle || "APA 7",
                criticalDepth: report.criticalDepth || "Moderate",
                requestedPages: sectionLengths[section.id] || 1,
                existingContent: editorRef.current.innerHTML,
                existingReferences: allReferences
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
                    const html = buildSectionHTML(section, sectionData);
                    insertSectionIntoEditor(section, html, report.outline || []);
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

    const applyEditorFontFamily = (fontFamily) => {
        setSelectedFontFamily(fontFamily);
        const target = getActiveEditable();
        if (!target) return;
        target.style.fontFamily = fontFamily;
        handleEditorInput();
    };

    const applyEditorFontSize = (fontSize) => {
        setSelectedFontSize(fontSize);
        const target = getActiveEditable();
        if (!target) return;
        target.style.fontSize = {
            "1": "10px",
            "2": "12px",
            "3": "16px",
            "4": "18px",
            "5": "24px"
        }[fontSize] || "16px";
        handleEditorInput();
    };

    const handleGenerateCustomSection = async () => {
        const title = customSectionTitle.trim();
        const description = customSectionDescription.trim();
        const existingOutline = report.outline || [];

        if (!title) {
            toast.error("Add a section title first");
            return;
        }

        const id = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || `section-${Date.now()}`;
        const section = {
            id,
            title,
            description: description || `Generate a well-structured ${title} section for this report.`,
        };
        const insertIndex = customSectionPlacement === "start"
            ? 0
            : customSectionPlacement === "end"
                ? existingOutline.length
                : Math.max(existingOutline.findIndex((item) => item.id === customSectionPlacement) + 1, existingOutline.length);
        const updatedOutline = [...existingOutline];
        updatedOutline.splice(insertIndex, 0, section);
        const updatedLengths = { ...sectionLengths, [id]: customSectionPages };

        setReport((prev) => ({ ...prev, outline: updatedOutline }));
        setSectionLengths(updatedLengths);
        setCustomSectionTitle("");
        setCustomSectionDescription("");
        setCustomSectionPages(1);
        setCustomSectionPlacement("end");

        await apiClient.patch(`/api/reports/${reportId}`, {
            outline: updatedOutline,
            sectionLengths: updatedLengths,
        });

        await generateSection(section);
    };

    const handleRewriteSelection = useCallback(async (action) => {
        if (!toolbar.range || isRewriting) return;

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(toolbar.range);

        const selectedText = selection.toString().trim();
        if (!selectedText) return;

        setIsRewriting(true);
        try {
            const res = await apiClient.post("/api/rewrite-content", {
                text: selectedText,
                action,
                topic: report?.topic,
                citationStyle,
            });

            if (!res.ok) {
                throw new Error("Failed to rewrite selection");
            }

            const data = await res.json();
            const rewrittenText = String(data?.data || "").trim();
            if (!rewrittenText) {
                throw new Error("Empty rewrite response");
            }

            selection.removeAllRanges();
            selection.addRange(toolbar.range);

            const inserted = document.execCommand("insertText", false, rewrittenText);
            if (!inserted && toolbar.range) {
                const range = toolbar.range.cloneRange();
                range.deleteContents();
                range.insertNode(document.createTextNode(rewrittenText));
            }

            handleEditorInput();
            setToolbar((prev) => ({ ...prev, visible: false }));
            toast.success("Selection updated");
        } catch (error) {
            console.error("Rewrite selection error:", error);
            toast.error(error.message || "Failed to rewrite selection");
        } finally {
            setIsRewriting(false);
        }
    }, [toolbar.range, isRewriting, report?.topic, citationStyle, handleEditorInput]);

    const scrollToSection = useCallback((sectionId) => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const targetOffset = headerOffsets[sectionId];
        if (typeof targetOffset === "number") {
            container.scrollTo({
                top: Math.max(targetOffset - 80, 0),
                behavior: "smooth",
            });
            return;
        }

        if (sectionId === "abstract") {
            const abstractHeading = Array.from(editorRef.current?.querySelectorAll("h2") || []).find(
                (heading) => heading.textContent?.trim().toLowerCase() === "abstract"
            );
            abstractHeading?.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }

        const sectionHeading = editorRef.current?.querySelector(`h2[data-section-id="${sectionId}"]`);
        sectionHeading?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [headerOffsets]);


    const exportAsDOCX = async () => {
        if (!editorRef.current) return;

        // Premium Gating
        if (!isPro && !isEnterprise) {
            setShowUpgradeModal(true);
            return;
        }

        try {
            const contentBlocks = serializeEditorBlocks(editorRef.current);
            const titlePageBlocks = titlePageRef.current ? serializeEditorBlocks(titlePageRef.current) : [];
            const res = await apiClient.post("/api/generate-doc", {
                title: report.title,
                author: authorName,
                institution: institution,
                course: courseName,
                name: studentName,
                date: submissionDate,
                citationStyle: citationStyle,
                titlePageContent: titlePageRef.current ? titlePageRef.current.innerHTML : "",
                titlePageBlocks,
                contentBlocks,
                references: referencesRef.current
                    ? Array.from(referencesRef.current.querySelectorAll('p.report-reference')).map((p) => p.innerText)
                    : allReferences
            });

            if (!res.ok) throw new Error("Failed to generate DOCX");

            const blob = await res.blob();
            const fileName = (report.title || "Report").replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, "_").substring(0, 100);
            await saveBlob(blob, `${fileName}.docx`);
            toast.success("DOCX Exported");
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
        }, [statuses.length]);

        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-all duration-500 animate-in fade-in">
                <div className="flex flex-col items-center text-center max-w-xs w-full px-6">

                    <div className="mb-6 relative">
                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                            <FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="absolute -inset-2 border-2 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
                    </div>

                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Actinova AI Tutor</h2>

                    <div className="h-5 mb-8">
                        <p className="text-sm text-slate-500 dark:text-slate-400 animate-in fade-in duration-300" key={statusIndex}>
                            {statuses[statusIndex]}
                        </p>
                    </div>

                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full animate-progress-loading" />
                    </div>
                </div>
            </div>
        );
    };

    if (loading || !report) {
        return <LoadingScreen />;
    }

    const referenceCount = Array.isArray(allReferences) ? allReferences.length : 0;
    const customSectionPositionOptions = [
        { value: "start", label: "At the beginning" },
        ...(report.outline || []).map((section) => ({
            value: section.id,
            label: `After ${section.title}`,
        })),
        { value: "end", label: "At the end" },
    ];
    const outlineItems = [
        {
            id: "abstract",
            title: "Abstract",
            description: "Summary of the document",
            generating: generatingAbstract,
            hasContent: !!report.abstract,
            onGenerate: () => generateAbstract(),
        },
        ...(report.outline || []).map((section) => ({
            id: section.id,
            title: section.title,
            description: section.description,
            generating: generatingSection === section.id,
            hasContent: !!report.sections?.[section.id],
            onGenerate: () => generateSection(section),
        })),
        {
            id: "references",
            title: "References",
            description: `${referenceCount} reference${referenceCount === 1 ? "" : "s"} in the document`,
            generating: false,
            hasContent: referenceCount > 0,
            onGenerate: () => {
                referencesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                referencesRef.current?.focus();
            },
        },
    ];

    return (
        <div className="flex w-full h-[calc(100vh-68px)] bg-[#1f2430] overflow-hidden font-inter">

            {/* Main Content Area */}
            <div ref={scrollContainerRef} className="flex-1 flex flex-col items-center overflow-y-auto overflow-x-hidden relative scrollbar-hide h-full pb-40 w-full px-2 md:px-0 bg-[#d1d5db]">

                {/* Document Page Wrapper */}
                <div className="w-full flex-1 flex flex-col items-center pt-6 md:pt-8" >
                    <div className="mb-4 flex w-full max-w-[1600px] justify-end px-3 md:px-4 lg:px-10 xl:hidden">
                        <button
                            onClick={() => setShowOutline(true)}
                            className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                        >
                            <PanelRight className="h-4 w-4" />
                            <span>Outline</span>
                        </button>
                    </div>

                    <div className="flex w-full max-w-[1600px] items-start justify-center gap-6 px-0 md:px-4 lg:px-10">
                        {/* Multi-page visualization container */}
                        <div className="document-container relative bg-transparent w-full max-w-full md:max-w-[280mm] mb-32 flex flex-col items-center gap-7" >

                        <div
                            className="document-page bg-white dark:bg-slate-900 relative overflow-hidden transition-all duration-300 pointer-events-auto border border-slate-200 dark:border-slate-700 w-full max-w-full md:max-w-[260mm]"
                            style={{
                                boxShadow: '0 30px 100px rgba(15,23,42,0.14), 0 0 1px rgba(15,23,42,0.15)',
                                padding: 'clamp(1rem, 5vw, 1.5cm)',
                                minHeight: '29.7cm'
                            }
                            }
                        >
                            <div
                                ref={titlePageRef}
                                contentEditable="true"
                                onFocus={() => setActiveEditable(titlePageRef.current)}
                                onInput={handleEditorInput}
                                suppressContentEditableWarning={true}
                                className="prose dark:prose-invert prose-slate max-w-none outline-none relative z-0 h-full"
                                style={{
                                    fontFamily: selectedFontFamily
                                }}
                            />
                        </div>
                        <div
                            className="document-page bg-white dark:bg-slate-900 relative overflow-hidden transition-all duration-300 pointer-events-auto border border-slate-200 dark:border-slate-700 w-full max-w-full md:max-w-[260mm]"
                            style={{
                                boxShadow: '0 30px 100px rgba(15,23,42,0.14), 0 0 1px rgba(15,23,42,0.15)',
                                padding: 'clamp(1rem, 5vw, 1.5cm)'
                            }}
                        >
                            <div className="prose dark:prose-invert prose-slate max-w-none outline-none relative z-0 min-h-[29.7cm]"
                                style={{
                                    fontFamily: selectedFontFamily,
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
                                onFocus={() => setActiveEditable(editorRef.current)}
                                onInput={(e) => {
                                    handleEditorInput();
                                    updateHeaderOffsets();
                                }}
                                suppressContentEditableWarning={true}
                                placeholder="Start typing your research report..."
                            />
                        </div>
                        <div
                            className="document-page bg-white dark:bg-slate-900 relative overflow-hidden transition-all duration-300 pointer-events-auto border border-slate-200 dark:border-slate-700 w-full max-w-full md:max-w-[260mm]"
                            style={{
                                boxShadow: '0 30px 100px rgba(15,23,42,0.14), 0 0 1px rgba(15,23,42,0.15)',
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
                                    onFocus={() => setActiveEditable(referencesRef.current)}
                                    onInput={handleEditorInput}
                                    suppressContentEditableWarning={true}
                                    className="space-y-6 prose dark:prose-invert max-w-none flex-1 outline-none min-h-[500px] references-container"
                                />
                            </div>
                        </div>
                        </div>

                        <aside className="hidden xl:block sticky top-16 w-[280px] border border-slate-300 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-4 py-3 bg-slate-50">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Outline</h3>
                                        <p className="mt-1 text-xs text-slate-500">Open sections or generate missing content.</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={handleManualSave}
                                            disabled={saving}
                                            className="flex h-8 w-8 items-center justify-center border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                            title="Save Changes"
                                        >
                                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        </button>
                                        <button
                                            onClick={exportAsDOCX}
                                            className="flex h-8 w-8 items-center justify-center border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-100"
                                            title="Download Word (.docx)"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="max-h-[70vh] overflow-y-auto bg-white outline-scrollbar">
                                <div className="border-b border-slate-200 px-4 py-4">
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Custom Section</span>
                                            <p className="mt-1 text-xs leading-5 text-slate-500">Describe the section and choose where it should appear in the outline.</p>
                                        </div>
                                        <input
                                            type="text"
                                            value={customSectionTitle}
                                            onChange={(e) => setCustomSectionTitle(e.target.value)}
                                            placeholder="Section title"
                                            className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                                        />
                                        <textarea
                                            value={customSectionDescription}
                                            onChange={(e) => setCustomSectionDescription(e.target.value)}
                                            placeholder="What should this section include?"
                                            rows={3}
                                            className="w-full resize-none border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                                        />
                                        <select
                                            value={customSectionPlacement}
                                            onChange={(e) => setCustomSectionPlacement(e.target.value)}
                                            className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                                        >
                                            {customSectionPositionOptions.map((option) => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3].map((pages) => (
                                                <button
                                                    key={pages}
                                                    onClick={() => setCustomSectionPages(pages)}
                                                    className={`flex-1 border px-2 py-1.5 text-xs font-semibold transition-all ${customSectionPages === pages ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-emerald-50"}`}
                                                >
                                                    {pages}p
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={handleGenerateCustomSection}
                                            disabled={!!generatingSection}
                                            className="flex w-full items-center justify-center gap-2 bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-60"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Generate Section
                                        </button>
                                    </div>
                                </div>
                                {outlineItems.map((item, index) => (
                                    <div key={item.id} className="border-b border-slate-200 px-4 py-4 last:border-b-0">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 h-2.5 w-2.5 flex-shrink-0 ${item.hasContent ? "bg-emerald-500" : "bg-slate-300"}`} />
                                            <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                            {item.id === "abstract" ? "Abstract" : `Section ${index}`}
                                        </p>
                                        <h4 className="mt-1 text-sm font-medium text-slate-900">{item.title}</h4>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    if (item.id === "references") {
                                                        referencesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                                        return;
                                                    }
                                                    scrollToSection(item.id);
                                                }}
                                                className="border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50"
                                            >
                                                Open
                                            </button>
                                            <button
                                                onClick={item.onGenerate}
                                                disabled={item.generating}
                                                className={`ml-auto px-3 py-1.5 text-xs font-semibold text-white transition-all ${item.generating
                                                    ? "bg-slate-400"
                                                    : item.hasContent
                                                        ? "bg-slate-700 hover:bg-slate-800"
                                                        : "bg-emerald-600 hover:bg-emerald-700"
                                                    }`}
                                            >
                                                {item.id === "references" ? "Open" : item.generating ? "Generating..." : item.hasContent ? "Regenerate" : "Generate"}
                                            </button>
                                        </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </aside>
                    </div>
                </div>
            </div>


            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                feature="Report Export"
                description="Exporting reports as Word Documents (.docx) is a premium feature."
            />
            {/* Mobile Outline Drawer — slides up from bottom on small screens when toggled */}
            {
                showOutline && (
                    <div className="xl:hidden fixed inset-0 z-[80] flex flex-col justify-end">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowOutline(false)} />

                        {/* Drawer panel - Professional bottom sheet */}
                        <div className="relative bg-white dark:bg-slate-900 rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto shadow-2xl border-t border-slate-200 dark:border-slate-700 outline-scrollbar">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    <h3 className="font-bold text-slate-900 dark:text-white">Document Settings</h3>
                                </div>
                                <button onClick={() => setShowOutline(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                    <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </button>
                            </div>

                            {/* Mobile Metadata Inputs */}
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-4 h-4 text-emerald-600" />
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">AI Outline</h4>
                            </div>

                            <div className="mb-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 space-y-3">
                                <input
                                    type="text"
                                    value={customSectionTitle}
                                    onChange={(e) => setCustomSectionTitle(e.target.value)}
                                    placeholder="Custom section title"
                                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <textarea
                                    value={customSectionDescription}
                                    onChange={(e) => setCustomSectionDescription(e.target.value)}
                                    placeholder="What should the AI cover?"
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                />
                                <select
                                    value={customSectionPlacement}
                                    onChange={(e) => setCustomSectionPlacement(e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    {customSectionPositionOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={async () => { await handleGenerateCustomSection(); setShowOutline(false); }}
                                    className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Generate Section
                                </button>
                            </div>

                            {/* Abstract card */}
                            <div className="mb-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-slate-800/50 dark:to-slate-800/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Abstract</span>
                                    {report.abstract && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Summary</h4>
                                <button
                                    onClick={() => { generateAbstract(); setShowOutline(false); }}
                                    disabled={generatingAbstract}
                                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all mt-3 ${generatingAbstract ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400' :
                                        report.abstract ? 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600' :
                                            'bg-emerald-600 text-white hover:bg-emerald-700'
                                        }`}
                                >
                                    {generatingAbstract ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    <span>{generatingAbstract ? 'Generating...' : report.abstract ? 'Regenerate' : 'Generate'}</span>
                                </button>
                            </div>

                            {/* Section Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Section {idx + 1}</span>
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
                                                                ? 'bg-emerald-600 text-white'
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
                                                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
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
                )
            }

            {/* Selection AI Toolbar */}
            {
                toolbar.visible && (
                    <div
                        className="fixed z-[100] -translate-x-1/2 -translate-y-full mb-2 selection-toolbar-container flex flex-wrap items-center gap-0.5 rounded-md bg-white border border-slate-300 shadow-xl p-1 animate-in fade-in zoom-in duration-200 max-w-[min(90vw,520px)]"
                        style={{ left: toolbar.x, top: toolbar.y }}
                    >
                        <div className="flex items-center gap-0.5">
                            <button
                                onMouseDown={preventFocus}
                                onClick={() => applySelectionCommand("bold")}
                                className="flex h-7 w-7 items-center justify-center border border-transparent text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                                title="Bold"
                            >
                                <Bold className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onMouseDown={preventFocus}
                                onClick={() => applySelectionCommand("italic")}
                                className="flex h-7 w-7 items-center justify-center border border-transparent text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                                title="Italic"
                            >
                                <Italic className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onMouseDown={preventFocus}
                                onClick={() => applySelectionCommand("underline")}
                                className="flex h-7 w-7 items-center justify-center border border-transparent text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                                title="Underline"
                            >
                                <Underline className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onMouseDown={preventFocus}
                                onClick={() => applySelectionCommand("formatBlock", "h2")}
                                className="flex h-7 items-center justify-center border border-transparent px-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                                title="Heading"
                            >
                                H
                            </button>
                            <button
                                onMouseDown={preventFocus}
                                onClick={() => applySelectionCommand("justifyLeft")}
                                className="flex h-7 w-7 items-center justify-center border border-transparent text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                                title="Align Left"
                            >
                                <AlignLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onMouseDown={preventFocus}
                                onClick={() => applySelectionCommand("justifyCenter")}
                                className="flex h-7 w-7 items-center justify-center border border-transparent text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                                title="Align Center"
                            >
                                <AlignCenter className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onMouseDown={preventFocus}
                                onClick={() => applySelectionCommand("justifyRight")}
                                className="flex h-7 w-7 items-center justify-center border border-transparent text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                                title="Align Right"
                            >
                                <AlignRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="mx-0.5 h-5 w-px bg-slate-200" />
                        <div className="flex items-center gap-0.5">
                            <button
                                onMouseDown={preventFocus}
                                onClick={() => handleRewriteSelection("regenerate")}
                                disabled={isRewriting}
                                className="flex h-7 items-center justify-center border border-transparent px-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                title="Regenerate"
                            >
                                {isRewriting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Redo"}
                            </button>
                            <button
                                onMouseDown={preventFocus}
                                onClick={() => handleRewriteSelection("shorten")}
                                disabled={isRewriting}
                                className="flex h-7 items-center justify-center border border-transparent px-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                title="Shorten"
                            >
                                Short
                            </button>
                            <button
                                onMouseDown={preventFocus}
                                onClick={() => handleRewriteSelection("expand")}
                                disabled={isRewriting}
                                className="flex h-7 items-center justify-center border border-transparent px-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                title="Expand"
                            >
                                Expand
                            </button>
                            <button
                                onMouseDown={preventFocus}
                                onClick={() => handleRewriteSelection("reparaphrase")}
                                disabled={isRewriting}
                                className="flex h-7 items-center justify-center border border-transparent px-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                title="Rephrase"
                            >
                                Reword
                            </button>
                        </div>
                    </div>
                )
            }

            <style dangerouslySetInnerHTML={{
                __html: `
        :root {
          --report-text-color: #1e293b;
        }
        .dark {
          --report-text-color: #cbd5e1;
        }

        .outline-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #10b981 rgba(148, 163, 184, 0.18);
        }

        .outline-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .outline-scrollbar::-webkit-scrollbar-track {
          background: rgba(148, 163, 184, 0.14);
        }

        .outline-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #34d399, #059669);
          border-radius: 999px;
        }

        .outline-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #10b981, #047857);
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
          line-height: 1.2;
        }

        .prose h2 { 
          font-size: 1.875rem; 
          margin-top: 2.5rem; 
          margin-bottom: 1.25rem; 
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

        .no-references-placeholder p {
          text-align: center !important;
        }

        .references-container p {
          font-size: 0.95rem;
        }

        @media (max-width: 640px) {
          .references-container p {
            font-size: 10px !important;
            line-height: 1.5 !important;
            margin-bottom: 0.5rem !important;
          }
          .prose h1 { font-size: 1.5rem; margin-top: 1.5rem; }
          .prose h2 { font-size: 1.25rem; margin-top: 1.25rem; }
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

        .dark.prose h2 { 
          color: #e2e8f0 !important;
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



