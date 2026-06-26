import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { JETBRAINS_MONO_BASE64 } from "./jetbrains-mono-base64";
import { tokenizeCode } from "./syntaxHighlighter";
import { parseContentIntoBlocks } from "./contentBlocks";
import { isFlutterApp, downloadViaFlutter, saveBlobViaFlutter } from "./appBridge";

function savePdf(pdf, filename) {
  if (isFlutterApp()) {
    downloadViaFlutter(pdf.output('datauristring'), filename);
  } else {
    pdf.save(filename);
  }
}

/**
 * Enhanced PDF Generation Utility for Actirova AI Tutor
 * 
 * This utility generates professional, visually appealing PDFs for courses and notes.
 * It handles markdown-like formatting including bold, italics, headers, and lists.
 */

// Brand Colors
const COLORS = {
    primary: [37, 99, 235],    // Blue
    primaryLight: [239, 246, 255],
    secondary: [99, 102, 241],  // Purple
    text: [31, 41, 55],       // Dark Gray
    textLight: [107, 114, 128], // Light Gray
    divider: [229, 231, 235],   // Border color
    white: [255, 255, 255]
};

const PLACEHOLDER_PATTERNS = [
    "content for this lesson is coming soon",
    "lesson content is being generated",
    "lesson content unavailable",
];

const hasGeneratedLessonContent = (lesson) => {
    const rawContent = typeof lesson === "string" ? "" : String(lesson?.content || "").trim();
    if (!rawContent) return false;
    const normalized = rawContent.toLowerCase();
    return !PLACEHOLDER_PATTERNS.some((pattern) => normalized.includes(pattern));
};

const getCourseModules = (data) => {
    const modules = Array.isArray(data?.modules)
        ? data.modules
        : Array.isArray(data?.courseData?.modules)
            ? data.courseData.modules
            : [];
    return modules.map((module, moduleIndex) => ({
        ...module,
        id: module?.id ?? moduleIndex + 1,
        title: module?.title || `Module ${moduleIndex + 1}`,
        lessons: Array.isArray(module?.lessons) ? module.lessons : [],
    }));
};

const getPrintableLessons = (lessons) => {
    const safe = Array.isArray(lessons) ? lessons : [];
    return safe.filter((lesson) => {
        if (!lesson || typeof lesson === "string") return false;
        return hasGeneratedLessonContent(lesson);
    });
};

const getModuleDisplayTitle = (title, idx) => {
    const t = String(title || "").trim();
    if (!t) return `Module ${idx + 1}`;
    if (/^\s*module\s*\d+\s*[:\-]/i.test(t)) return t;
    return `Module ${idx + 1}: ${t}`;
};

const getLessonDisplayTitle = (title, moduleIdx, lessonIdx) => {
    const t = String(title || "").trim();
    if (!t) return `${moduleIdx + 1}.${lessonIdx + 1} Lesson ${lessonIdx + 1}`;
    if (/^\d+(\.\d+)*\s+/.test(t) || /^\s*lesson\s*\d+\s*[:\-]/i.test(t)) return t;
    return `${moduleIdx + 1}.${lessonIdx + 1} ${t}`;
};

/**
 * Shared utility to render text with markdown support
 */
const renderTextWithMarkdown = (pdf, text, xPos, y, contentWidth, margin, checkNewPage, size = 11) => {
    pdf.setFontSize(size);
    pdf.setFont("times", "normal");
    pdf.setTextColor(...COLORS.text);

    text = typeof cleanLatex === "function" ? cleanLatex(text) : text;
    const lines = pdf.splitTextToSize(text, contentWidth - (xPos - margin));

    lines.forEach((line) => {
        if (typeof checkNewPage === 'function') checkNewPage(8);

        let currentX = xPos;
        // Robust splitting for bold-italic (***), bold (**), italic (* or _), code (`)
        const segments = line.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|___.*?___|__.*?__|_.*?_|`[^`]+`)/g);

        segments.forEach(segment => {
            if (!segment) return;

            let style = "normal";
            let cleanText = segment;
            let isCode = false;

            if (segment.startsWith("***") && segment.endsWith("***")) {
                style = "bolditalic";
                cleanText = segment.substring(3, segment.length - 3);
            } else if (segment.startsWith("**") && segment.endsWith("**")) {
                style = "bold";
                cleanText = segment.substring(2, segment.length - 2);
            } else if ((segment.startsWith("*") && segment.endsWith("*")) ||
                (segment.startsWith("_") && segment.endsWith("_"))) {
                style = "italic";
                cleanText = segment.substring(1, segment.length - 1);
            } else if (segment.startsWith("`") && segment.endsWith("`")) {
                style = "normal";
                cleanText = segment.substring(1, segment.length - 1);
                isCode = true;
            }

            if (isCode) {
                pdf.setFont("courier", "normal");
                pdf.setTextColor(50, 50, 50);
            } else {
                pdf.setFont("times", style);
                pdf.setTextColor(...COLORS.text);
            }

            pdf.text(cleanText, currentX, y);
            const w = pdf.getTextWidth(cleanText);
            currentX += w;

            if (isCode) {
                pdf.setFont("times", "normal");
                pdf.setTextColor(...COLORS.text);
            }
        });
        y += 7;
    });
    return y;
};

/**
 * Strips markdown formatting markers for bold/italic
 */
const stripMarkdown = (text) => {
    return text.replace(/(\*\*\*|\*\*|\*|___|__|__|`)/g, "");
};

/**
 * Parses and cleans LaTeX math expressions to readable plaintext symbols
 */
const cleanLatex = (text) => {
    if (!text || typeof text !== "string") return text;
    
    // First, handle display math blocks which might span multiple lines if they were somehow preserved
    let cleaned = text;
    
    // Expand the symbol mapping significantly
    const symbolMap = {
        '\\\\': '\n',             // Newline
        '\\times': '×',
        '\\cdot': '·',
        '\\div': '÷',
        '\\pm': '±',
        '\\mp': '∓',
        '\\approx': '≈',
        '\\neq': '≠',
        '\\leq': '≤',
        '\\geq': '≥',
        '\\ll': '≪',
        '\\gg': '≫',
        '\\in': '∈',
        '\\notin': '∉',
        '\\subset': '⊂',
        '\\supset': '⊃',
        '\\subseteq': '⊆',
        '\\supseteq': '⊇',
        '\\forall': '∀',
        '\\exists': '∃',
        '\\partial': '∂',
        '\\nabla': '∇',
        '\\infty': '∞',
        '\\propto': '∝',
        '\\angle': '∠',
        '\\parallel': '∥',
        '\\perp': '⊥',
        '\\rightarrow': '→',
        '\\Rightarrow': '⇒',
        '\\leftarrow': '←',
        '\\Leftarrow': '⇐',
        '\\leftrightarrow': '↔',
        '\\Leftrightarrow': '⇔',
        '\\pi': 'π',
        '\\alpha': 'α',
        '\\beta': 'β',
        '\\gamma': 'γ',
        '\\delta': 'δ',
        '\\epsilon': 'ε',
        '\\zeta': 'ζ',
        '\\eta': 'η',
        '\\theta': 'θ',
        '\\iota': 'ι',
        '\\kappa': 'κ',
        '\\lambda': 'λ',
        '\\mu': 'μ',
        '\\nu': 'ν',
        '\\xi': 'ξ',
        '\\omicron': 'ο',
        '\\rho': 'ρ',
        '\\sigma': 'σ',
        '\\tau': 'τ',
        '\\upsilon': 'υ',
        '\\phi': 'φ',
        '\\chi': 'χ',
        '\\psi': 'ψ',
        '\\omega': 'ω',
        '\\Delta': 'Δ',
        '\\Gamma': 'Γ',
        '\\Theta': 'Θ',
        '\\Lambda': 'Λ',
        '\\Xi': 'Ξ',
        '\\Pi': 'Π',
        '\\Sigma': 'Σ',
        '\\Phi': 'Φ',
        '\\Psi': 'Ψ',
        '\\Omega': 'Ω'
    };

    // Replace known symbols first
    Object.entries(symbolMap).forEach(([latex, unicode]) => {
        const regex = new RegExp(latex.replace(/\\/g, '\\\\') + '\\b', 'g');
        cleaned = cleaned.replace(regex, unicode);
    });

    return cleaned
        // Math wrappers
        .replace(/\\\[([\s\S]*?)\\\]/g, "$1")
        .replace(/\\\(([\s\S]*?)\\\)/g, "$1")
        .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
        .replace(/\$([^\$\n]+?)\$/g, "$1")
        // Formatting commands with braces
        .replace(/\\text\s*\{([^{}]+)\}/g, "$1")
        .replace(/\\textbf\s*\{([^{}]+)\}/g, "$1")
        .replace(/\\textit\s*\{([^{}]+)\}/g, "$1")
        .replace(/\\mathrm\s*\{([^{}]+)\}/g, "$1")
        .replace(/\\mathbf\s*\{([^{}]+)\}/g, "$1")
        .replace(/\\mathcal\s*\{([^{}]+)\}/g, "$1")
        // Fractions & Roots
        .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "($1)/($2)")
        .replace(/\\sqrt\s*\{([^{}]+)\}/g, "√($1)")
        .replace(/\\sqrt\[([0-9]+)\]\{([^{}]+)\}/g, "($2)^(1/$1)")
        // Superscript/Subscript with braces
        .replace(/\^\{([^{}]+)\}/g, "^($1)")
        .replace(/_\{([^{}]+)\}/g, "_($1)")
        // Superscript/Subscript without braces (single char or digits)
        .replace(/\^([a-zA-Z0-9])/g, "^$1")
        .replace(/_([a-zA-Z0-9])/g, "_$1")
        // Clean up common leftovers
        .replace(/\\text\{([^{}]+)\}/g, "$1")
        .replace(/\\mathrm\{([^{}]+)\}/g, "$1")
        // Remove any remaining backslashes from commands
        .replace(/\\[a-zA-Z]+/g, "")
        // Sized delimiters
        .replace(/\\left[({[\\]|\\right[)}\]\\]/g, "")
        // Escaped characters
        .replace(/\\([%&$#_{}]) /g, "$1")
        .replace(/\\{/g, "{")
        .replace(/\\}/g, "}")
        .trim();
};

export const downloadCourseAsPDF = async (data, mode = "course", visuals = []) => {
    if (!data) throw new Error("No data provided");
    const courseModules = mode === "course" ? getCourseModules(data) : [];

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    // Register JetBrains Mono font
    try {
        pdf.addFileToVFS("JetBrainsMono.ttf", JETBRAINS_MONO_BASE64);
        pdf.addFont("JetBrainsMono.ttf", "JetBrainsMono", "normal");
    } catch (fontErr) {
        console.error("Failed to add JetBrains Mono font:", fontErr);
    }

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const HEADER_LINE_Y = 12;
    const CONTENT_START_Y = 20;
    let y = CONTENT_START_Y;
    const pageBottom = pageHeight - 22;

    // Header & Footer Helper
    const addPageDecoration = (pageNum, totalPages) => {
        // Header line
        pdf.setDrawColor(...COLORS.divider);
        pdf.setLineWidth(0.2);
        pdf.line(margin, HEADER_LINE_Y, pageWidth - margin, HEADER_LINE_Y);

        // Footer
        pdf.setDrawColor(...COLORS.divider);
        pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        pdf.setFont("times", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...COLORS.textLight);
        pdf.text("Actirova AI Tutor - Personalized Learning", margin, pageHeight - 10);
        pdf.text(`Copyright (c) Actirova AI Tutor. All rights reserved.`, pageWidth / 2, pageHeight - 10, { align: "center" });
        pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    };

    // Check Page Overflow
    const checkNewPage = (neededSpace) => {
        if (y + neededSpace > pageBottom) {
            pdf.addPage();
            y = CONTENT_START_Y;
            return true;
        }
        return false;
    };

    const renderEquationBlock = (latex, { displayMode = true } = {}) => {
        const cleaned = cleanLatex(String(latex || ""));
        if (!cleaned.trim()) return;

        const paddingX = 3;
        const paddingY = 2.5;
        const usableWidth = Math.max(10, contentWidth - (paddingX * 2));
        const fontSize = displayMode ? 12 : 11;
        const lineHeight = displayMode ? 6 : 5.5;

        try {
            pdf.setFont("JetBrainsMono", "normal");
        } catch (_) {
            pdf.setFont("courier", "normal");
        }
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...COLORS.text);

        const lines = pdf.splitTextToSize(cleaned, usableWidth);
        const blockHeight = (lines.length * lineHeight) + (paddingY * 2);

        checkNewPage(blockHeight + 10);

        pdf.setFillColor(247, 248, 250);
        pdf.setDrawColor(...COLORS.divider);
        pdf.setLineWidth(0.25);
        pdf.rect(margin, y, contentWidth, blockHeight, "FD");

        pdf.text(lines, margin + paddingX, y + paddingY + (lineHeight - 1.5));
        y += blockHeight + 8;

        pdf.setFont("times", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(...COLORS.text);
    };

    const fitImageToPage = (sourceWidth, sourceHeight, maxWidth) => {
        const safeWidth = Math.max(1, Number(sourceWidth) || 1);
        const safeHeight = Math.max(1, Number(sourceHeight) || 1);
        let width = maxWidth;
        let height = (safeHeight * width) / safeWidth;

        // Fit to a full page canvas (not the remaining page space). If the image doesn't fit the
        // remaining space, we will page-break instead of shrinking the visual.
        const maxHeight = pageBottom - CONTENT_START_Y - 6;
        if (height > maxHeight) {
            height = Math.max(20, maxHeight);
            width = (safeWidth * height) / safeHeight;
        }
        return { width, height };
    };

    const wrapCodeLine = (line, maxWidth) => {
        const segments = [];
        let current = "";

        for (const char of String(line || "")) {
            const next = current + char;
            if (pdf.getTextWidth(next) > maxWidth && current) {
                segments.push(current);
                current = char;
            } else {
                current = next;
            }
        }

        if (current || segments.length === 0) segments.push(current);
        return segments;
    };

    // --- COVER PAGE ---
    // No background gradient - keeping it clean as per user request
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    y = 34;
    try {
        // Add logo to cover page - letting jsPDF detect format from extension
        pdf.addImage("/logo.png", (pageWidth - 40) / 2, y, 40, 40);
        y += 45;
    } catch (e) {
        // Fallback if logo not found or errors
        try {
            pdf.addImage("/logo.png", (pageWidth - 40) / 2, y, 40, 40);
            y += 45;
        } catch (err) {
            y = 80; // Reset if no logo
        }
    }
    y += 16;

    pdf.setTextColor(...COLORS.text);
    pdf.setFont("times", "bold");
    pdf.setFontSize(48);
    pdf.text("ACTIROVA", pageWidth / 2, y, { align: "center" });

    y += 12;
    pdf.setFontSize(24);
    pdf.text("AI TUTOR PLATFORM", pageWidth / 2, y, { align: "center" });

    y = 150;
    // Box for title
    pdf.setDrawColor(...COLORS.primary);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(margin - 5, y - 15, contentWidth + 10, 80, 2, 2, "D");

    pdf.setTextColor(...COLORS.primary);
    pdf.setFontSize(14);
    pdf.text(mode.toUpperCase() === "NOTES" ? "PERSONALIZED STUDY NOTES" : "PERSONALIZED COURSE MATERIAL", pageWidth / 2, y, { align: "center" });

    y += 15;
    pdf.setTextColor(...COLORS.text);
    pdf.setFontSize(28);
    const titleLines = pdf.splitTextToSize(data.title || "Study Material", contentWidth - 10);
    pdf.text(titleLines, pageWidth / 2, y, { align: "center" });

    y += (titleLines.length * 10) + 10;

    // Add Module info if present (for lessons)
    if (data.module) {
        pdf.setFontSize(14);
        pdf.setTextColor(...COLORS.text);
        pdf.setFont("times", "bold");
        pdf.text(data.module, pageWidth / 2, y, { align: "center" });

        y += 8;
    }

    if (data.course && data.course !== data.title) {
        pdf.setFontSize(12);
        pdf.setTextColor(...COLORS.textLight);
        pdf.setFont("times", "normal");
        pdf.text(`Part of: ${data.course}`, pageWidth / 2, y, { align: "center" });
        y += 8;
    }

    pdf.setFontSize(12);
    pdf.setTextColor(...COLORS.textLight);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: "center" });

    // --- CONTENT PREPARATION ---
    pdf.addPage();
    y = 30;


    const renderCodeBlock = (text, xPos, lang = "javascript") => {
        if (!text) return;
        
        try {
            pdf.setFont("JetBrainsMono", "normal");
        } catch (e) {
            pdf.setFont("courier", "normal");
        }
        pdf.setFontSize(10);

        const lines = text.split("\n");
        const maxCodeWidth = contentWidth - ((Number(xPos) || margin) - margin) - 4;

        lines.forEach((line) => {
            const wrappedLines = wrapCodeLine(line, maxCodeWidth);

            wrappedLines.forEach((wrappedLine) => {
                if (typeof y !== 'number' || !isFinite(y)) y = CONTENT_START_Y;
                checkNewPage(7);

                const tokens = tokenizeCode(wrappedLine, lang);
                let currentX = Number(xPos) + 2;

                if (!tokens || tokens.length === 0) {
                    if (wrappedLine && wrappedLine.trim().length > 0) {
                        pdf.setTextColor(50, 50, 50);
                        pdf.text(
                            String(wrappedLine),
                            isFinite(currentX) ? currentX : 22,
                            isFinite(y) ? y : CONTENT_START_Y
                        );
                    }
                } else {
                    tokens.forEach(token => {
                        if (!token || !token.text || typeof token.text !== 'string') return;

                        pdf.setTextColor(...(token.color || [50, 50, 50]));
                        const textPart = token.text;
                        const partWidth = Number(pdf.getTextWidth(textPart)) || 0;

                        const drawX = isFinite(currentX) ? currentX : 22;
                        const drawY = isFinite(y) ? y : CONTENT_START_Y;

                        if (textPart.length > 0) {
                            try {
                                pdf.text(textPart, drawX, drawY);
                            } catch (e) {
                                pdf.setFont("courier", "normal");
                                pdf.text(textPart, drawX, drawY);
                            }
                        }
                        currentX = drawX + partWidth;
                    });
                }

                y += 6;
            });
        });
        pdf.setFont("times", "normal");
        pdf.setTextColor(...COLORS.text);
    };

    const processContent = async (content, ctx = {}) => {
        if (!content) return;
        // Normalize math blocks so we can detect and render them as text blocks in the PDF,
        // even when delimiters are inline or spanning multiple lines.
        const normalizedForMath = String(content || "")
            .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_m, inner) => `\\[\n${inner}\n\\]`)
            .replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_m, inner) => `$$\n${inner}\n$$`);
        const blocks = parseContentIntoBlocks(normalizedForMath);

        const courseTitleCtx = String(ctx.courseTitle || data.course || data.title || "").trim();
        const moduleTitleCtx = String(ctx.moduleTitle || data.module || "").trim();
        const lessonTitleCtx = String(ctx.lessonTitle || ctx.title || "").trim();
        const courseTitleLower = courseTitleCtx.toLowerCase();
        const moduleTitleLower = moduleTitleCtx.toLowerCase();
        const lessonTitleLower = lessonTitleCtx.toLowerCase();

        let chartIdx = 0;
        let tableIdx = 0;

        for (const block of blocks) {
            if (block.type === "chart" || block.type === "table") {
                const targetType = block.type;
                const targetIndex = targetType === "chart" ? chartIdx++ : tableIdx++;

                if (block.type === "table") {
                    // If we're too close to the bottom, start the table on a fresh page so the
                    // header + first rows aren't split awkwardly.
                    if (y + 40 > pageBottom) {
                        pdf.addPage();
                        y = CONTENT_START_Y;
                    } else {
                        checkNewPage(24);
                    }

                    const headers = Array.isArray(block.headers)
                        ? block.headers.map((cell) => cleanLatex(String(cell ?? "")).trim())
                        : [];
                    const rows = Array.isArray(block.rows)
                        ? block.rows.map((row) =>
                              Array.isArray(row)
                                  ? row.map((cell) => cleanLatex(String(cell ?? "")).trim())
                                  : []
                          )
                        : [];

                    autoTable(pdf, {
                        startY: y,
                        head: headers.length ? [headers] : [],
                        body: rows,
                        theme: "grid",
                        margin: { left: margin, right: margin },
                        styles: {
                            font: "times",
                            fontSize: 10,
                            cellPadding: 2.5,
                            overflow: "linebreak",
                            textColor: COLORS.text,
                            lineColor: COLORS.divider,
                            lineWidth: 0.2,
                        },
                        headStyles: {
                            fillColor: COLORS.primaryLight,
                            textColor: COLORS.primary,
                            fontStyle: "bold",
                        },
                        alternateRowStyles: {
                            fillColor: [250, 250, 252],
                        },
                    });

                    y = (pdf.lastAutoTable?.finalY || y) + 8;
                    continue;
                }

                const visualData = visuals.find(v => v.type === targetType && v.index === targetIndex);
                if (visualData && visualData.image) {
                    const fitted = fitImageToPage(visualData.width, visualData.height, contentWidth);
                    if (y + fitted.height + 10 > pageBottom) {
                        pdf.addPage();
                        y = CONTENT_START_Y;
                    } else {
                        checkNewPage(fitted.height + 10);
                    }
                    try {
                        pdf.addImage(visualData.image, margin, y, fitted.width, fitted.height);
                        y += fitted.height + 10;
                    } catch (imgErr) {
                        console.error(`Failed to add ${targetType} image to PDF:`, imgErr);
                        // Fallback fallback
                        if (block.type === "chart") {
                            renderCodeBlock(JSON.stringify({ type: block.chartType, data: block.data, title: block.title }, null, 2), margin + 4, "json");
                        } else {
                            renderCodeBlock(block.headers.join(" | "), margin + 4, "text");
                        }
                    }
                } else {
                    // Fallback to text if image missing
                    y += 2;
                    if (block.type === "chart") {
                        const fallbackContent = block.data ? JSON.stringify({ type: block.chartType, data: block.data, title: block.title }, null, 2) : "Chart Data Missing";
                        renderCodeBlock(fallbackContent, margin + 4, "json");
                    }
                }
            } else if (block.type === "code") {
                y += 2;
                renderCodeBlock(block.content, margin + 4, block.lang);
            } else if (block.type === "text") {
                const lines = block.content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const rawTrimmedLine = String(line || "").trim();

                    // Multi-line display math blocks:
                    // \[ ... \] or $$ ... $$ where delimiters are on their own lines.
                    if (rawTrimmedLine === "\\[" || rawTrimmedLine === "$$") {
                        const endMarker = rawTrimmedLine === "\\[" ? "\\]" : "$$";
                        const latexLines = [];
                        let j = i + 1;
                        for (; j < lines.length; j++) {
                            const t = String(lines[j] || "").trim();
                            if (t === endMarker) break;
                            latexLines.push(lines[j]);
                        }

                        if (j < lines.length) {
                            const latex = latexLines.join("\n").trim();
                            if (latex) {
                                renderEquationBlock(latex, { displayMode: true });
                            }

                            i = j;
                            continue;
                        }
                    }

                    // Render display-math as text blocks in PDFs.
                    // We only handle block-style math to avoid breaking prose lines.
                    const displayMatch =
                        rawTrimmedLine.match(/^\\\[\s*([\s\S]+?)\s*\\\]$/) ||
                        rawTrimmedLine.match(/^\$\$\s*([\s\S]+?)\s*\$\$$/) ||
                        rawTrimmedLine.match(/^\\\(\s*([\s\S]+?)\s*\\\)$/);
                    if (displayMatch) {
                        const latex = displayMatch[1];
                        renderEquationBlock(latex, { displayMode: true });
                        continue;
                    }

                    // Handle single-line $...$ that actually looks like math (not currency)
                    const dollarMath = rawTrimmedLine.match(/^\$\s*([^\$\n]+?)\s*\$$/);
                    if (dollarMath) {
                        const inner = dollarMath[1];
                        const looksMath = /\\[a-zA-Z]+|\^|_|\=|\\frac|\\sqrt/.test(inner);
                        if (looksMath) {
                            renderEquationBlock(inner, { displayMode: true });
                            continue;
                        }
                    }

                    let trimmedLine = rawTrimmedLine;
                    trimmedLine = typeof cleanLatex === "function" ? cleanLatex(trimmedLine) : trimmedLine;

                    const rawLine = stripMarkdown(trimmedLine).trim();
                    const rawLower = rawLine.toLowerCase();

                    // Handle horizontal rule
                    if (trimmedLine.match(/^\s*[-*_]{3,}\s*$/)) {
                        y += 5;
                        continue;
                    }

                    if (!trimmedLine) {
                        y += 3;
                        continue;
                    }

                    // Skip repeated context labels/titles that make course PDFs look messy.
                    const headingMatch = /^#{1,6}\s+(.+)$/.exec(trimmedLine);
                    if (headingMatch) {
                        const headingText = stripMarkdown(headingMatch[1]).trim().toLowerCase();
                        if (
                            (lessonTitleLower && headingText === lessonTitleLower) ||
                            (moduleTitleLower && headingText === moduleTitleLower) ||
                            (courseTitleLower && headingText === courseTitleLower) ||
                            /^((lesson|module|course|topic)\s*[:\-])/.test(headingText)
                        ) {
                            continue;
                        }
                    }

                    const isLabelLine = /^(lesson|module|course|topic)\s*[:\-]/i.test(rawLine);
                    if (isLabelLine) continue;

                    // e.g. "1.1 What is Financial Literacy?" duplicated under lesson header
                    if (lessonTitleLower && /^\d+(\.\d+)*\s+/.test(rawLine)) {
                        const withoutNums = rawLower.replace(/^\d+(\.\d+)*\s+/, "").trim();
                        if (withoutNums === lessonTitleLower) continue;
                    }

                    const cleanLine = stripMarkdown(trimmedLine).toLowerCase().replace(/^(course|module|lesson|topic):\s*/, "").trim();
                    const isRedundant =
                        cleanLine === data.title?.toLowerCase() ||
                        (data.course && cleanLine === data.course.toLowerCase()) ||
                        (data.module && cleanLine === data.module.toLowerCase()) ||
                        (courseTitleLower && cleanLine === courseTitleLower) ||
                        (moduleTitleLower && cleanLine === moduleTitleLower) ||
                        (lessonTitleLower && cleanLine === lessonTitleLower) ||
                        (data.course && cleanLine.includes(data.course.toLowerCase())) ||
                        (data.module && cleanLine.includes(data.module.toLowerCase())) ||
                        (data.title && (cleanLine.includes(data.title.toLowerCase()) || data.title.toLowerCase().includes(cleanLine))) ||
                        rawLower.startsWith("module:") ||
                        rawLower.startsWith("lesson:") ||
                        rawLower.startsWith("course:") ||
                        rawLower.startsWith("topic:");

                    if (isRedundant || (trimmedLine.match(/^[-*_]{3,}$/) && y < 65)) {
                        continue;
                    }

                    checkNewPage(12);

                    if (trimmedLine.startsWith("# ")) {
                        // In course PDFs we already print lesson headings, so skip H1 blocks from content
                        // to avoid messy "double title" pages.
                        if (String(ctx.renderMode || "").toLowerCase() === "course") {
                            continue;
                        }
                        const headerText = stripMarkdown(trimmedLine.substring(2).trim());
                        y += 2;
                        pdf.setFont("times", "bold");
                        pdf.setTextColor(...COLORS.text);

                        pdf.setFontSize(26);
                        pdf.text(headerText, pageWidth / 2, y, { align: "center" });
                        y += 10;
                    } else if (trimmedLine.startsWith("## ")) {
                        y += 2;
                        pdf.setFont("times", "bold");
                        pdf.setFontSize(20);
                        pdf.setTextColor(...COLORS.text);
                        const headerText = stripMarkdown(trimmedLine.substring(3).trim());
                        const lines = pdf.splitTextToSize(headerText, contentWidth);
                        pdf.text(lines, margin, y);
                        y += (lines.length * 7) + 3;
                    } else if (trimmedLine.startsWith("### ")) {
                        y += 2;
                        pdf.setFont("times", "bold");
                        pdf.setFontSize(15);
                        pdf.setTextColor(...COLORS.text);
                        const headerText = stripMarkdown(trimmedLine.substring(4));
                        const lines = pdf.splitTextToSize(headerText, contentWidth);
                        pdf.text(lines, margin, y);
                        y += (lines.length * 7) + 1;
                    } else if (trimmedLine.startsWith("#### ")) {
                        y += 2;
                        pdf.setFont("times", "bold");
                        pdf.setFontSize(13);
                        pdf.setTextColor(...COLORS.text);
                        const headerText = stripMarkdown(trimmedLine.substring(5));
                        const lines = pdf.splitTextToSize(headerText, contentWidth);
                        pdf.text(lines, margin, y);
                        y += (lines.length * 6) + 2;
                    } else if (trimmedLine.startsWith("##### ")) {
                        y += 2;
                        pdf.setFont("times", "bold");
                        pdf.setFontSize(11);
                        pdf.setTextColor(...COLORS.text);
                        const headerText = stripMarkdown(trimmedLine.substring(6));
                        const lines = pdf.splitTextToSize(headerText, contentWidth);
                        pdf.text(lines, margin, y);
                        y += (lines.length * 6) + 1;
                    } else if (trimmedLine.startsWith("###### ")) {
                        y += 2;
                        pdf.setFont("times", "bold");
                        pdf.setFontSize(10);
                        pdf.setTextColor(...COLORS.textLight);
                        const headerText = stripMarkdown(trimmedLine.substring(7));
                        const lines = pdf.splitTextToSize(headerText, contentWidth);
                        pdf.text(lines, margin, y);
                        y += (lines.length * 5) + 1;
                    } else if (trimmedLine.startsWith("> ")) {
                        const quoteText = trimmedLine.substring(2).trim();
                        pdf.setFont("times", "italic");
                        pdf.setTextColor(...COLORS.textLight);
                        const lines = pdf.splitTextToSize(quoteText, contentWidth - 10);
                        checkNewPage(lines.length * 6 + 4);
                        pdf.setDrawColor(...COLORS.divider);
                        pdf.setLineWidth(1);
                        pdf.line(margin + 2, y - 4, margin + 2, y + (lines.length * 6) - 4);
                        pdf.text(lines, margin + 8, y);
                        y += (lines.length * 6) + 4;
                        pdf.setFont("times", "normal");
                    } else if (trimmedLine.match(/^[-*•]\s/)) {
                        pdf.setFont("times", "bold");
                        pdf.setTextColor(...COLORS.primary);
                        pdf.text("•", margin + 2, y);
                        const txt = trimmedLine.replace(/^[-*•]\s/, "");
                        y = renderTextWithMarkdown(pdf, txt, margin + 8, y, contentWidth, margin, checkNewPage, 11);
                    } else if (trimmedLine.match(/^\d+\.\s/)) {
                        const n = trimmedLine.match(/^\d+\./)[0];
                        pdf.setFont("times", "bold");
                        pdf.setTextColor(...COLORS.primary);
                        pdf.text(n, margin, y);
                        const txt = trimmedLine.replace(/^\d+\.\s/, "");
                        y = renderTextWithMarkdown(pdf, txt, margin + 10, y, contentWidth, margin, checkNewPage, 11);
                    } else {
                        pdf.setTextColor(...COLORS.text);
                        y = renderTextWithMarkdown(pdf, trimmedLine, margin, y, contentWidth, margin, checkNewPage, 11);
                    }
                }
            }
        }
    };

    if (mode === "course") {
        const modules = courseModules;

        // Add Table of Contents
        pdf.setFont("times", "bold");
        pdf.setFontSize(24);
        pdf.setTextColor(...COLORS.primary);
        pdf.text("Table of Contents", margin, y);
        y += 15;

        modules.forEach((mod, idx) => {
            checkNewPage(10);
            pdf.setFontSize(12);
            pdf.setFont("times", "normal");
            pdf.setTextColor(...COLORS.text);
            pdf.text(getModuleDisplayTitle(mod.title, idx), margin, y);
            y += 8;
        });

        // Process Modules
        for (let idx = 0; idx < modules.length; idx++) {
            const mod = modules[idx];
            pdf.addPage();
            y = 30;

            // Module Title
            pdf.setFillColor(...COLORS.primaryLight);
            pdf.setFont("times", "bold");
            pdf.setFontSize(20);
            pdf.setTextColor(...COLORS.primary);
            const moduleTitle = getModuleDisplayTitle(mod.title, idx);
            const moduleTitleLines = pdf.splitTextToSize(moduleTitle, contentWidth - 10);
            const boxHeight = Math.max(15, (moduleTitleLines.length * 7) + 8);
            pdf.rect(margin, y - 8, contentWidth, boxHeight, "F");
            pdf.text(moduleTitleLines, margin + 5, y + 2);
            y += boxHeight + 7;

            const lessons = getPrintableLessons(mod.lessons);
            for (let lIdx = 0; lIdx < lessons.length; lIdx++) {
                const lesson = lessons[lIdx];
                checkNewPage(20);
                pdf.setFont("times", "bold");
                pdf.setFontSize(16);
                pdf.setTextColor(...COLORS.text);
                pdf.text(getLessonDisplayTitle(lesson.title || lesson, idx, lIdx), margin, y);
                y += 10;

                if (lesson && lesson.content) {
                    await processContent(lesson.content, {
                        courseTitle: data.title,
                        moduleTitle: moduleTitle,
                        lessonTitle: lesson.title || lesson,
                        renderMode: "course",
                    });
                }
                y += 10;
            }
        }
    } else {
        // Mode is "notes"
        await processContent(data.content, {
            courseTitle: data.course,
            moduleTitle: data.module,
            lessonTitle: data.title,
            renderMode: "notes",
        });
    }

    // --- FINAL DECORATION ---
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addPageDecoration(i, totalPages);
    }

    const title = data.title || data.topic || "Actirova_Study";
    const fileName = `${title.replace(/\s+/g, "_").toLowerCase()}.pdf`;
    savePdf(pdf, fileName);
};



export const downloadQuizAsPDF = async (data) => {
    if (!data || !data.questions) throw new Error("No data provided");

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let y = 40;

    const addBranding = (pageNum, total) => {
        pdf.setDrawColor(...COLORS.divider);
        pdf.setLineWidth(0.2);
        pdf.line(margin, 15, pageWidth - margin, 15);
        pdf.setFont("times", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...COLORS.textLight);
        pdf.text(`Actirova AI Tutor - Assessment: ${data.title}`, margin, 12);
        if (pageNum) pdf.text(`Page ${pageNum} of ${total}`, pageWidth - margin, 12, { align: "right" });
    };

    addBranding();

    // Title Section
    pdf.setFont("times", "bold");
    pdf.setFontSize(24);
    pdf.setTextColor(...COLORS.primary);
    pdf.text("ASSESSMENT PAPER", pageWidth / 2, y, { align: "center" });

    y += 12;
    pdf.setFontSize(14);
    pdf.setTextColor(...COLORS.textLight);
    pdf.text(`Subject: ${data.topic || "General Knowledge"}`, pageWidth / 2, y, { align: "center" });

    y += 20;
    pdf.setDrawColor(...COLORS.primary);
    pdf.setLineWidth(1);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 15;

    // Check Page Overflow
    const checkNewPage = (neededSpace) => {
        if (y + neededSpace > pageHeight - 25) {
            pdf.addPage();
            y = 25;
            return true;
        }
        return false;
    };

    // Questions
    data.questions.forEach((q, index) => {
        checkNewPage(40);

        pdf.setFont("times", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(...COLORS.text);

        // Render question number and text with potential markdown
        const qNum = `${index + 1}. `;
        pdf.text(qNum, margin, y);
        y = renderTextWithMarkdown(pdf, q.text, margin + 8, y, contentWidth, margin, checkNewPage, 12);
        y += 5;

        if (q.options) {
            pdf.setFont("times", "normal");
            pdf.setFontSize(11);
            q.options.forEach((opt, optIdx) => {
                checkNewPage(12);
                const optPrefix = String.fromCharCode(65 + optIdx) + ")";
                pdf.setTextColor(...COLORS.textLight);
                pdf.text(optPrefix, margin + 5, y);
                y = renderTextWithMarkdown(pdf, opt, margin + 15, y, contentWidth - 20, margin, checkNewPage, 11);
                y += 1;
            });
        } else {
            // Space for written answer
            pdf.setDrawColor(...COLORS.divider);
            pdf.line(margin + 5, y + 5, pageWidth - margin - 5, y + 5);
            y += 15;
        }

        y += 5;
    });

    // Answer Key (on a new page)
    pdf.addPage();
    addBranding();
    y = 30;
    pdf.setFont("times", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(...COLORS.primary);
    pdf.text("ANSWER KEY", margin, y);
    y += 15;

    pdf.setFontSize(11);
    data.questions.forEach((q, index) => {
        if (y > pageHeight - 20) {
            pdf.addPage();
            addBranding();
            y = 25;
        }
        pdf.setFont("times", "bold");
        pdf.setTextColor(...COLORS.text);
        pdf.text(`${index + 1}: `, margin, y);
        pdf.setFont("times", "normal");
        pdf.setTextColor(...COLORS.primary);
        pdf.text(String(q.correctAnswer), margin + 10, y);
        y += 8;
    });

    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addBranding(i, totalPages);
    }

    const fileName = `assessment_${data.title?.replace(/\s+/g, "_").toLowerCase() || "exam"}.pdf`;
    savePdf(pdf, fileName);
};

/**
 * Generates an enterprise-grade payment receipt PDF.
 * Designed for auditability, print clarity, and corporate standards.
 */
export const downloadReceiptAsPDF = async (data) => {
    if (!data) throw new Error("Receipt data is required.");

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // --- Helpers (no external deps) ---
    const PAGE_W = 210;
    const PAGE_H = 297;
    const M = 18; // ~1.8cm
    const CONTENT_W = PAGE_W - (M * 2);
    const centerX = PAGE_W / 2;

    const COLORS = {
        deepGreen: [34, 139, 34],
        muted: [70, 70, 70],
        light: [240, 255, 240],
        black: [0, 0, 0],
    };

    const safeText = (v) => String(v ?? "").trim();
    const formatMoney = (amount) => {
        const n = typeof amount === "number" ? amount : Number(amount);
        if (!isFinite(n)) return "0";
        const isInt = Math.abs(n - Math.round(n)) < 1e-9;
        return n.toLocaleString("en-US", {
            minimumFractionDigits: isInt ? 0 : 2,
            maximumFractionDigits: isInt ? 0 : 2,
        });
    };

    const loadImageAsDataUrl = async (src) => {
        if (typeof window === "undefined" || typeof fetch === "undefined") return null;
        try {
            const res = await fetch(src);
            if (!res.ok) return null;
            const blob = await res.blob();
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            return typeof dataUrl === "string" ? dataUrl : null;
        } catch (_) {
            return null;
        }
    };

    const setOpacity = (opacity) => {
        try {
            if (pdf.GState) pdf.setGState(new pdf.GState({ opacity }));
        } catch (_) {}
    };

    // Use classic receipt/typewriter font everywhere.
    const setTT = (style = "normal", size = 11, color = COLORS.black) => {
        pdf.setFont("courier", style);
        pdf.setFontSize(size);
        pdf.setTextColor(...color);
    };

    const logoDataUrl = await loadImageAsDataUrl("/logo.png");
    // Optional subtle logo watermark
    if (logoDataUrl) {
        try {
            setOpacity(0.09);
            const w = 110;
            const h = 110;
            pdf.addImage(logoDataUrl, "PNG", (PAGE_W - w) / 2, (PAGE_H - h) / 2 - 5, w, h);
            setOpacity(1);
        } catch (_) {
            setOpacity(1);
        }
    }

    let y = 18;

    // Header
    setTT("bold", 18, COLORS.deepGreen);
    pdf.text("ACTIROVA AI TUTOR", centerX, y, { align: "center" });
    y += 6;
    setTT("italic", 9, COLORS.muted);
    pdf.text("Your AI Learning Journey Begins Here", centerX, y, { align: "center" });
    y += 9;
    pdf.setDrawColor(...COLORS.deepGreen);
    pdf.setLineWidth(0.6);
    pdf.line(M + (CONTENT_W * 0.075), y, PAGE_W - M - (CONTENT_W * 0.075), y);
    y += 8;

    setTT("bold", 16, COLORS.deepGreen);
    pdf.text("SUBSCRIPTION RECEIPT", centerX, y, { align: "center" });
    y += 6;
    setTT("normal", 8.5, COLORS.muted);
    const receiptNo = safeText(data.receiptNumber || "N/A");
    const dateShort = safeText(data.transactionDate || "");
    pdf.text(`${receiptNo}${dateShort ? "  |  " + dateShort : ""}`, centerX, y, { align: "center" });
    y += 12;

    // Meta block (centered 2-col table)
    const metaRows = [
        ["Customer", safeText(data.customerName || "—")],
        ["Email", safeText(data.customerEmail || "—")],
        ["Payment", safeText(data.method || "—")],
        ["Date/Time", safeText(data.timestamp || data.transactionDate || "—")],
    ];

    const tableW = 105; // centered like the LaTeX example
    const x0 = centerX - tableW / 2;
    const labelW = 42;
    const valueW = tableW - labelW;
    const rowH = 6.2;

    setTT("bold", 9.5, COLORS.black);
    for (let i = 0; i < metaRows.length; i++) {
        const [label, value] = metaRows[i];
        const yy = y + (i * rowH);
        setTT("bold", 9.5, COLORS.black);
        pdf.text(label, x0, yy);
        setTT("normal", 9.5, COLORS.black);
        pdf.text(value, x0 + tableW, yy, { align: "right", maxWidth: valueW });
    }
    y += metaRows.length * rowH + 10;

    // Line item table (receipt style)
    const items = Array.isArray(data.items) && data.items.length
        ? data.items
        : [{ description: safeText(data.plan || "Premium AI Tutor Subscription"), amount: data.amount }];

    const descX = centerX - 52;
    const amtX = centerX + 52;

    // Table header background
    pdf.setFillColor(...COLORS.light);
    pdf.rect(descX, y - 5.5, (amtX - descX), 8.5, "F");
    pdf.setDrawColor(...COLORS.deepGreen);
    pdf.setLineWidth(0.3);
    pdf.line(descX, y + 3, amtX, y + 3);

    setTT("bold", 10, COLORS.black);
    pdf.text("Description", descX + 2, y);
    pdf.text(`Amount (${safeText(data.currency || "USD")})`, amtX - 2, y, { align: "right" });
    y += 10;

    setTT("normal", 10, COLORS.black);
    for (const it of items) {
        const desc = safeText(it?.description || "Item");
        const amt = formatMoney(it?.amount);
        const lines = pdf.splitTextToSize(desc, (amtX - descX) - 34);
        pdf.text(lines, descX + 2, y);
        pdf.text(amt, amtX - 2, y, { align: "right" });
        y += Math.max(6.5, lines.length * 5.2);
    }

    // Total
    pdf.setDrawColor(...COLORS.deepGreen);
    pdf.setLineWidth(0.4);
    pdf.line(descX, y, amtX, y);
    y += 8;

    setTT("bold", 12, COLORS.deepGreen);
    pdf.text("TOTAL PAID", descX + 2, y);
    setTT("bold", 12, COLORS.deepGreen);
    pdf.text(formatMoney(data.amount), amtX - 2, y, { align: "right" });
    y += 14;

    // Reference / plan notes
    setTT("normal", 8.5, COLORS.muted);
    const ref = safeText(data.reference || "");
    const validFrom = safeText(data.validFrom || "");
    const notes = [
        ref ? `Subscription Reference: ${ref}` : null,
        validFrom ? `Subscription Starts: ${validFrom}` : null,
        safeText(data.planDetails || ""),
    ].filter(Boolean);
    if (notes.length) {
        for (const line of notes) {
            pdf.text(line, centerX, y, { align: "center", maxWidth: CONTENT_W });
            y += 5.2;
        }
        y += 6;
    } else {
        y += 6;
    }

    // QR code block (bottom center)
    try {
        const { generateQrPngDataUrl } = await import("./qrCode");
        const qrText = safeText(data.verifyUrl || data.reference || data.receiptNumber || "actirova");
        const qrDataUrl = await generateQrPngDataUrl(qrText, { sizePx: 260 });
        if (qrDataUrl) {
            const qrSize = 28;
            const qrX = centerX - qrSize / 2;
            pdf.addImage(qrDataUrl, "PNG", qrX, y, qrSize, qrSize);
            y += qrSize + 6;
            setTT("bold", 9, COLORS.black);
            pdf.text("Scan QR to view details", centerX, y, { align: "center" });
            y += 10;
        }
    } catch (_) {}

    // Thank you + footer rule/legal
    setTT("italic", 12, COLORS.deepGreen);
    pdf.text("Thank you for choosing Actirova AI Tutor!", centerX, Math.min(y, 258), { align: "center" });
    setTT("normal", 9, COLORS.muted);
    pdf.text("We can't wait to accelerate your learning journey.", centerX, Math.min(y + 6, 264), { align: "center" });

    const fy = 272;
    pdf.setDrawColor(...COLORS.deepGreen);
    pdf.setLineWidth(0.4);
    pdf.line(M + (CONTENT_W * 0.075), fy, PAGE_W - M - (CONTENT_W * 0.075), fy);

    setTT("normal", 7.5, COLORS.muted);
    pdf.text("This is your official receipt. Keep for records.", centerX, fy + 10, { align: "center" });
    pdf.text("No cash refunds. Terms & conditions apply.", centerX, fy + 14, { align: "center" });

    savePdf(pdf, `Actirova_Receipt_${receiptNo || Date.now()}.pdf`);
};

export const downloadResumeAsPDF = async (resumeData, fileName = "Resume") => {
    if (!resumeData) throw new Error("Resume data is required.");

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const PAGE_WIDTH = pdf.internal.pageSize.getWidth();
    const PAGE_HEIGHT = pdf.internal.pageSize.getHeight();
    const MARGIN = 16;
    const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
    const COLORS = {
        text: [26, 26, 46],
        muted: [100, 116, 139],
        line: [226, 232, 240],
        accent: [34, 197, 94],
        accentSoft: [240, 253, 244],
        headerAlign: "center",
        sectionStyle: "pill",
        summaryStyle: "plain",
        entryStyle: "plain",
        nameSize: 25,
    };
    const BASE_LINE_HEIGHT = 5.8;

    const data = {
        personalInfo: resumeData.personalInfo || {},
        summary: resumeData.summary || "",
        experience: resumeData.experience || [],
        education: resumeData.education || [],
        skills: resumeData.skills || [],
        projects: resumeData.projects || [],
        certifications: resumeData.certifications || [],
        awards: resumeData.awards || [],
        languages: resumeData.languages || [],
        customSections: resumeData.customSections || [],
    };

    let y = 20;

    const textValue = (value) => {
        if (value === null || value === undefined) return "";
        if (Array.isArray(value)) {
            return value.filter(Boolean).join(", ");
        }
        return String(value).trim();
    };

    const normalizeList = (value) => {
        if (Array.isArray(value)) {
            return value
                .map((item) => textValue(item))
                .filter(Boolean);
        }

        return textValue(value)
            .split(/\r?\n/)
            .map((item) => item.replace(/^[-*]\s*/, "").trim())
            .filter(Boolean);
    };

    const ensureSpace = (needed = 12) => {
        if (y + needed <= PAGE_HEIGHT - 18) {
            return;
        }

        pdf.addPage();
        y = 18;
    };

    const writeWrappedText = (text, x, width, options = {}) => {
        const {
            size = 11,
            color = COLORS.text,
            style = "normal",
            lineHeight = BASE_LINE_HEIGHT,
            align = "left",
        } = options;

        const value = textValue(text);
        if (!value) return;

        pdf.setFont("times", style);
        pdf.setFontSize(size);
        pdf.setTextColor(...color);

        const lines = pdf.splitTextToSize(value, width);
        ensureSpace(lines.length * lineHeight + 2);
        pdf.text(lines, x, y, { align });
        y += lines.length * lineHeight;
    };

    const drawSectionTitle = (title) => {
        ensureSpace(14);
        y += 2;
        const label = textValue(title).toUpperCase();
        pdf.setFont("times", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(...COLORS.muted);

        if (COLORS.sectionStyle === "rule") {
            pdf.setDrawColor(...COLORS.line);
            pdf.setLineWidth(0.5);
            pdf.line(MARGIN, y + 2.5, PAGE_WIDTH - MARGIN, y + 2.5);
            pdf.text(label, MARGIN, y + 1.4);
        } else if (COLORS.sectionStyle === "block") {
            pdf.setFillColor(...COLORS.accent);
            pdf.roundedRect(MARGIN, y - 4, CONTENT_WIDTH, 8.5, 2, 2, "F");
            pdf.setTextColor(255, 255, 255);
            pdf.text(label, MARGIN + 4, y + 1.4);
        } else {
            pdf.setDrawColor(...COLORS.line);
            pdf.setLineWidth(0.35);
            pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
            const labelWidth = pdf.getTextWidth(label) + 12;
            const labelX = (PAGE_WIDTH - labelWidth) / 2;
            pdf.setFillColor(...COLORS.accentSoft);
            pdf.roundedRect(labelX, y - 4, labelWidth, 8, 3, 3, "F");
            pdf.setDrawColor(...COLORS.line);
            pdf.roundedRect(labelX, y - 4, labelWidth, 8, 3, 3, "S");
            pdf.text(label, PAGE_WIDTH / 2, y + 1.4, { align: "center" });
        }
        y += 10;
    };

    const drawMetaRow = (left, right) => {
        const leftText = textValue(left);
        const rightText = textValue(right);
        if (!leftText && !rightText) return;

        ensureSpace(8);
        pdf.setFont("times", "normal");
        pdf.setFontSize(10.5);
        pdf.setTextColor(...COLORS.muted);
        if (leftText) {
            const leftLines = pdf.splitTextToSize(leftText, CONTENT_WIDTH * 0.62);
            pdf.text(leftLines, MARGIN, y);
        }
        if (rightText) {
            const rightLines = pdf.splitTextToSize(rightText, CONTENT_WIDTH * 0.32);
            pdf.text(rightLines, PAGE_WIDTH - MARGIN, y, { align: "right" });
        }
        y += BASE_LINE_HEIGHT;
    };

    const drawBulletList = (items) => {
        items.forEach((item) => {
            const value = textValue(item);
            if (!value) return;
            ensureSpace(7);
            pdf.setFont("times", "bold");
            pdf.setFontSize(10);
            pdf.setTextColor(...COLORS.accent);
            pdf.text("-", MARGIN + 1, y);
            pdf.setFont("times", "normal");
            pdf.setFontSize(10.5);
            pdf.setTextColor(...COLORS.text);
            const lines = pdf.splitTextToSize(value, CONTENT_WIDTH - 8);
            pdf.text(lines, MARGIN + 5, y);
            y += lines.length * BASE_LINE_HEIGHT + 1.2;
        });
    };

    const drawEntry = (entry, config = {}) => {
        const title = textValue(config.title(entry));
        const subtitle = textValue(config.subtitle ? config.subtitle(entry) : "");
        const right = textValue(config.right ? config.right(entry) : "");
        const details = config.details ? config.details(entry) : [];
        const bullets = config.bullets ? config.bullets(entry) : [];

        if (!title && !subtitle && !right && details.length === 0 && bullets.length === 0) {
            return;
        }

        ensureSpace(16);
        const entryX = COLORS.entryStyle === "indent" ? MARGIN + 4 : MARGIN;
        const entryWidth = COLORS.entryStyle === "indent" ? CONTENT_WIDTH - 4 : CONTENT_WIDTH;

        if (COLORS.entryStyle === "card") {
            pdf.setFillColor(...COLORS.accentSoft);
            pdf.roundedRect(MARGIN, y - 4, CONTENT_WIDTH, 10, 2, 2, "F");
        } else if (COLORS.entryStyle === "rule") {
            pdf.setDrawColor(...COLORS.line);
            pdf.setLineWidth(0.35);
            pdf.line(MARGIN, y - 2, PAGE_WIDTH - MARGIN, y - 2);
        } else if (COLORS.entryStyle === "indent") {
            pdf.setDrawColor(...COLORS.accent);
            pdf.setLineWidth(0.8);
            pdf.line(MARGIN, y - 3, MARGIN, y + 12);
        }

        pdf.setFont("times", "bold");
        pdf.setFontSize(13);
        pdf.setTextColor(...COLORS.text);
        const titleWidth = right ? entryWidth * 0.64 : entryWidth;
        const titleLines = title ? pdf.splitTextToSize(title, titleWidth) : [];
        if (titleLines.length > 0) {
            pdf.text(titleLines, entryX, y);
        }

        if (right) {
            pdf.setFont("times", "italic");
            pdf.setFontSize(10.5);
            pdf.setTextColor(...COLORS.muted);
            const rightLines = pdf.splitTextToSize(right, entryWidth * 0.3);
            pdf.text(rightLines, PAGE_WIDTH - MARGIN, y, { align: "right" });
        }

        if (titleLines.length > 0) {
            y += titleLines.length * BASE_LINE_HEIGHT;
        }

        if (subtitle) {
            pdf.setFont("times", "italic");
            pdf.setFontSize(11);
            pdf.setTextColor(...COLORS.muted);
            const subtitleLines = pdf.splitTextToSize(subtitle, entryWidth);
            pdf.text(subtitleLines, entryX, y);
            y += subtitleLines.length * BASE_LINE_HEIGHT;
        }

        details
            .map((detail) => textValue(detail))
            .filter(Boolean)
            .forEach((detail) => {
                pdf.setFont("times", "normal");
                pdf.setFontSize(10.2);
                pdf.setTextColor(...COLORS.text);
                const detailLines = pdf.splitTextToSize(detail, entryWidth);
                ensureSpace(detailLines.length * 4.7 + 1);
                pdf.text(detailLines, entryX, y);
                y += detailLines.length * BASE_LINE_HEIGHT;
            });

        drawBulletList(bullets);
        y += COLORS.entryStyle === "card" ? 4 : 2;
    };

    const buildDateRange = (startDate, endDate, dateRange) => {
        const combined = textValue(dateRange);
        if (combined) return combined;
        const start = textValue(startDate);
        const end = textValue(endDate);
        if (start && end) return `${start} - ${end}`;
        return start || end;
    };

    const personalInfo = data.personalInfo;
    const fullName = textValue(personalInfo.fullName || personalInfo.name || "Your Name");
    const jobTitle = textValue(personalInfo.jobTitle);
    const summary = textValue(personalInfo.summary || data.summary);
    const contacts = [
        personalInfo.email,
        personalInfo.phone,
        personalInfo.location,
        personalInfo.website,
        personalInfo.linkedin,
        personalInfo.github,
    ]
        .map((item) => textValue(item))
        .filter(Boolean);

    pdf.setFont("times", "bold");
    pdf.setFontSize(COLORS.nameSize);
    pdf.setTextColor(...COLORS.text);
    const headerX = COLORS.headerAlign === "left" ? MARGIN : PAGE_WIDTH / 2;
    const headerAlign = COLORS.headerAlign === "left" ? "left" : "center";
    pdf.text(fullName, headerX, y, { align: headerAlign });
    y += 8;

    if (jobTitle) {
        pdf.setFont("times", "italic");
        pdf.setFontSize(13);
        pdf.setTextColor(...COLORS.muted);
        pdf.text(jobTitle, headerX, y, { align: headerAlign });
        y += 7;
    }

    if (contacts.length > 0) {
        const contactLine = contacts.join("  |  ");
        writeWrappedText(contactLine, headerX, CONTENT_WIDTH, {
            size: 10.2,
            color: COLORS.muted,
            align: headerAlign,
            lineHeight: BASE_LINE_HEIGHT,
        });
        y += 2;
    }

    if (summary) {
        drawSectionTitle("Summary");
        if (COLORS.summaryStyle === "box") {
            const summaryLines = pdf.splitTextToSize(summary, CONTENT_WIDTH - 10);
            const summaryHeight = Math.max(14, summaryLines.length * BASE_LINE_HEIGHT + 6);
            ensureSpace(summaryHeight + 2);
            pdf.setFillColor(...COLORS.accentSoft);
            pdf.roundedRect(MARGIN, y - 3, CONTENT_WIDTH, summaryHeight, 2, 2, "F");
            pdf.setDrawColor(...COLORS.line);
            pdf.roundedRect(MARGIN, y - 3, CONTENT_WIDTH, summaryHeight, 2, 2, "S");
            writeWrappedText(summary, MARGIN + 5, CONTENT_WIDTH - 10, {
                size: 11,
                color: COLORS.text,
                lineHeight: BASE_LINE_HEIGHT,
            });
        } else {
            writeWrappedText(summary, MARGIN, CONTENT_WIDTH, {
                size: 11,
                color: COLORS.text,
                lineHeight: BASE_LINE_HEIGHT,
            });
        }
        y += 2;
    }

    if (data.experience.length > 0) {
        drawSectionTitle("Experience");
        data.experience.forEach((item) => {
            drawEntry(item, {
                title: (entry) => entry.title,
                subtitle: (entry) => [entry.company, entry.location].filter(Boolean).join(" | "),
                right: (entry) => buildDateRange(entry.startDate, entry.endDate, entry.dateRange),
                bullets: (entry) => normalizeList(entry.description),
            });
        });
    }

    if (data.education.length > 0) {
        drawSectionTitle("Education");
        data.education.forEach((item) => {
            drawEntry(item, {
                title: (entry) => entry.degree,
                subtitle: (entry) => [entry.school, entry.location].filter(Boolean).join(" | "),
                right: (entry) => buildDateRange(entry.startDate, entry.endDate, entry.dateRange),
                details: (entry) => normalizeList(entry.description),
            });
        });
    }

    if (false && data.skills.length > 0) {
        drawSectionTitle("Skills");
        writeWrappedText(normalizeList(data.skills).join(" - "), MARGIN, CONTENT_WIDTH, {
            size: 10.8,
            color: COLORS.text,
            lineHeight: BASE_LINE_HEIGHT,
        });
        y += 2;
    }

    if (data.projects.length > 0) {
        drawSectionTitle("Projects");
        data.projects.forEach((item) => {
            drawEntry(item, {
                title: (entry) => entry.name,
                subtitle: (entry) => entry.technologies,
                right: (entry) => buildDateRange(entry.startDate, entry.endDate, entry.dateRange),
                bullets: (entry) => normalizeList(entry.description),
            });
        });
    }

    if (data.certifications.length > 0) {
        drawSectionTitle("Certifications");
        data.certifications.forEach((item) => {
            drawEntry(item, {
                title: (entry) => entry.name,
                subtitle: (entry) => entry.issuer,
                right: (entry) => entry.date,
                details: (entry) => normalizeList(entry.url),
            });
        });
    }

    if (data.awards.length > 0) {
        drawSectionTitle("Awards");
        data.awards.forEach((item) => {
            drawEntry(item, {
                title: (entry) => entry.title,
                subtitle: (entry) => entry.org,
                right: (entry) => entry.date,
                details: (entry) => normalizeList(entry.description),
            });
        });
    }

    if (data.languages.length > 0) {
        drawSectionTitle("Languages");
        const languageText = data.languages
            .map((item) => {
                if (typeof item === "string") return item;
                const language = textValue(item.language);
                const level = textValue(item.level);
                return [language, level].filter(Boolean).join(" - ");
            })
            .filter(Boolean)
            .join(" - ");

        writeWrappedText(languageText, MARGIN, CONTENT_WIDTH, {
            size: 10.8,
            color: COLORS.text,
            lineHeight: BASE_LINE_HEIGHT,
        });
        y += 2;
    }

    if (data.skills.length > 0) {
        drawSectionTitle("Skills");
        writeWrappedText(normalizeList(data.skills).join(" - "), MARGIN, CONTENT_WIDTH, {
            size: 10.8,
            color: COLORS.text,
            lineHeight: BASE_LINE_HEIGHT,
        });
        y += 2;
    }

    data.customSections.forEach((section) => {
        const title = textValue(section.title || section.name);
        const content = normalizeList(section.items || section.content || section.description);
        if (!title || content.length === 0) return;

        drawSectionTitle(title);
        drawBulletList(content);
    });

    const totalPages = pdf.internal.pages.length - 1;
    for (let page = 1; page <= totalPages; page++) {
        pdf.setPage(page);
        pdf.setDrawColor(...COLORS.line);
        pdf.setLineWidth(0.25);
        pdf.line(MARGIN, PAGE_HEIGHT - 12, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 12);
        pdf.setFont("times", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...COLORS.muted);
        pdf.text("Actirova Resume Builder", MARGIN, PAGE_HEIGHT - 8);
        pdf.text(`Page ${page} of ${totalPages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 8, {
            align: "right",
        });
    }

    savePdf(pdf, `${fileName}.pdf`);
};

export const downloadResumeAsDOCX = async (resumeData, fileName = "Resume") => {
    if (!resumeData) throw new Error("Resume data is required.");

    const [{ Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Tab, TabStopPosition, TabStopType, LeaderType, Table, TableRow, TableCell, WidthType }, fileSaverModule] = await Promise.all([
        import("docx"),
        import("file-saver"),
    ]);
    const saveAs =
        fileSaverModule.saveAs ||
        fileSaverModule.default?.saveAs ||
        fileSaverModule.default;

    if (typeof saveAs !== "function") {
        throw new Error("File saver is unavailable");
    }

    const data = {
        personalInfo: resumeData.personalInfo || {},
        summary: resumeData.summary || "",
        experience: resumeData.experience || [],
        education: resumeData.education || [],
        skills: resumeData.skills || [],
        projects: resumeData.projects || [],
        certifications: resumeData.certifications || [],
        awards: resumeData.awards || [],
        languages: resumeData.languages || [],
        customSections: resumeData.customSections || [],
    };

    const textValue = (value) => {
        if (value === null || value === undefined) return "";
        if (Array.isArray(value)) return value.filter(Boolean).join(", ");
        return String(value).trim();
    };

    const normalizeList = (value) => {
        if (Array.isArray(value)) {
            return value.map((item) => textValue(item)).filter(Boolean);
        }

        return textValue(value)
            .split(/\r?\n/)
            .map((item) => item.replace(/^[-*]\s*/, "").trim())
            .filter(Boolean);
    };

    const buildDateRange = (startDate, endDate, dateRange) => {
        const combined = textValue(dateRange);
        if (combined) return combined;
        const start = textValue(startDate);
        const end = textValue(endDate);
        if (start && end) return `${start} - ${end}`;
        return start || end;
    };

    const sectionHeading = (label) =>
        new Paragraph({
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { before: 280, after: 120 },
            border: {
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "D1D5DB" },
            },
            children: [
                new TextRun({
                    text: textValue(label).toUpperCase(),
                    bold: true,
                    color: "166534",
                    size: 24,
                }),
            ],
        });

    const bulletParagraphs = (items) =>
        items
            .map((item) => textValue(item))
            .filter(Boolean)
            .map(
                (item) =>
                    new Paragraph({
                        text: item,
                        bullet: { level: 0 },
                        spacing: { after: 80, line: 360 },
                    })
            );

    const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

    const twoColumnTable = (leftParagraphs = [], rightParagraphs = [], options = {}) =>
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: noBorder,
                bottom: noBorder,
                left: noBorder,
                right: noBorder,
                insideHorizontal: noBorder,
                insideVertical: noBorder,
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: options.leftWidth || 78, type: WidthType.PERCENTAGE },
                            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                            margins: { top: 0, bottom: 0, left: 0, right: 120 },
                            children: leftParagraphs,
                        }),
                        new TableCell({
                            width: { size: options.rightWidth || 22, type: WidthType.PERCENTAGE },
                            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                            margins: { top: 0, bottom: 0, left: 120, right: 0 },
                            children: rightParagraphs.length > 0 ? rightParagraphs : [new Paragraph({ text: "" })],
                        }),
                    ],
                }),
            ],
        });

    const entryHeaderTable = (leftText, rightText, options = {}) =>
        twoColumnTable(
            [
                new Paragraph({
                    spacing: options.spacing || { before: 120, after: 40 },
                    children: [
                        new TextRun({
                            text: textValue(leftText),
                            bold: options.bold ?? true,
                            italics: options.italicsLeft ?? false,
                            size: options.leftSize || 24,
                            color: options.leftColor || "111827",
                        }),
                    ],
                }),
            ],
            rightText ? [
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    spacing: options.spacing || { before: 120, after: 40 },
                    children: [
                        new TextRun({
                            text: textValue(rightText),
                            bold: options.boldRight ?? false,
                            italics: options.italicsRight ?? true,
                            size: options.rightSize || 20,
                            color: options.rightColor || "64748B",
                        }),
                    ],
                }),
            ] : [],
            options
        );

    const content = [];
    const fullName = textValue(data.personalInfo.fullName || data.personalInfo.name || "Your Name");
    const jobTitle = textValue(data.personalInfo.jobTitle);
    const contactLine = [
        data.personalInfo.email,
        data.personalInfo.phone,
        data.personalInfo.location,
        data.personalInfo.website,
        data.personalInfo.linkedin,
        data.personalInfo.github,
    ]
        .map((item) => textValue(item))
        .filter(Boolean)
        .join(" | ");

    content.push(
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
                new TextRun({
                    text: fullName,
                    bold: true,
                    size: 34,
                    color: "111827",
                }),
            ],
        })
    );

    if (jobTitle) {
        content.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
                children: [
                    new TextRun({
                        text: jobTitle,
                        italics: true,
                        size: 24,
                        color: "475569",
                    }),
                ],
            })
        );
    }

    if (contactLine) {
        content.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [
                    new TextRun({
                        text: contactLine,
                        size: 20,
                        color: "64748B",
                    }),
                ],
            })
        );
    }

    const summary = textValue(data.personalInfo.summary || data.summary);
    if (summary) {
        content.push(sectionHeading("Summary"));
        content.push(
            new Paragraph({
                text: summary,
                spacing: { after: 120, line: 360 },
            })
        );
    }

    if (data.experience.length > 0) {
        content.push(sectionHeading("Experience"));
        data.experience.forEach((item) => {
            const title = textValue(item.title);
            const subtitle = [item.company, item.location].map((value) => textValue(value)).filter(Boolean).join(" | ");
            const dateRange = buildDateRange(item.startDate, item.endDate, item.dateRange);
            if (title) {
                content.push(entryHeaderTable(title, dateRange));
            }
            if (subtitle) {
                content.push(new Paragraph({ text: subtitle, spacing: { after: 80 }, thematicBreak: false }));
            }
            content.push(...bulletParagraphs(normalizeList(item.description)));
        });
    }

    if (data.education.length > 0) {
        content.push(sectionHeading("Education"));
        data.education.forEach((item) => {
            const title = textValue(item.degree);
            const subtitle = [item.school, item.location].map((value) => textValue(value)).filter(Boolean).join(" | ");
            const dateRange = buildDateRange(item.startDate, item.endDate, item.dateRange);
            if (title) {
                content.push(entryHeaderTable(title, dateRange));
            }
            if (subtitle) {
                content.push(new Paragraph({ text: subtitle, spacing: { after: 80 } }));
            }
            normalizeList(item.description).forEach((line) => {
                content.push(new Paragraph({ text: line, spacing: { after: 80, line: 360 } }));
            });
        });
    }

    if (false && data.skills.length > 0) {
        content.push(sectionHeading("Skills"));
        content.push(
            new Paragraph({
                text: normalizeList(data.skills).join(" - "),
                spacing: { after: 120, line: 360 },
            })
        );
    }

    if (data.projects.length > 0) {
        content.push(sectionHeading("Projects"));
        data.projects.forEach((item) => {
            const title = textValue(item.name);
            const subtitle = textValue(item.technologies);
            const dateRange = buildDateRange(item.startDate, item.endDate, item.dateRange);
            if (title) {
                content.push(entryHeaderTable(title, dateRange));
            }
            if (subtitle) {
                content.push(new Paragraph({ text: subtitle, spacing: { after: 80 } }));
            }
            content.push(...bulletParagraphs(normalizeList(item.description)));
        });
    }

    if (data.certifications.length > 0) {
        content.push(sectionHeading("Certifications"));
        data.certifications.forEach((item) => {
            const leftLine = [item.name, item.issuer].map((value) => textValue(value)).filter(Boolean).join(" | ");
            if (leftLine || item.date) {
                content.push(entryHeaderTable(leftLine, item.date, { spacing: { after: 100 }, bold: true, rightSize: 20 }));
            }
            normalizeList(item.url).forEach((value) => {
                content.push(new Paragraph({ text: value, spacing: { after: 80, line: 360 } }));
            });
        });
    }

    if (data.awards.length > 0) {
        content.push(sectionHeading("Awards"));
        data.awards.forEach((item) => {
            const leftLine = [item.title, item.org].map((value) => textValue(value)).filter(Boolean).join(" | ");
            if (leftLine || item.date) {
                content.push(entryHeaderTable(leftLine, item.date, { spacing: { after: 80 }, bold: true, rightSize: 20 }));
            }
            normalizeList(item.description).forEach((value) => {
                content.push(new Paragraph({ text: value, spacing: { after: 80, line: 360 } }));
            });
        });
    }

    if (data.languages.length > 0) {
        content.push(sectionHeading("Languages"));
        content.push(
            new Paragraph({
                text: data.languages
                    .map((item) => {
                        if (typeof item === "string") return item;
                        return [textValue(item.language), textValue(item.level)].filter(Boolean).join(" - ");
                    })
                    .filter(Boolean)
                    .join(" - "),
                spacing: { after: 120, line: 360 },
            })
        );
    }

    if (data.skills.length > 0) {
        content.push(sectionHeading("Skills"));
        content.push(
            new Paragraph({
                text: normalizeList(data.skills).join(" - "),
                spacing: { after: 120, line: 360 },
            })
        );
    }

    data.customSections.forEach((section) => {
        const title = textValue(section.title || section.name);
        const items = normalizeList(section.items || section.content || section.description);
        if (!title || items.length === 0) return;
        content.push(sectionHeading(title));
        content.push(...bulletParagraphs(items));
    });

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: content,
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    if (isFlutterApp()) {
        await saveBlobViaFlutter(blob, `${fileName}.docx`);
    } else {
        saveAs(blob, `${fileName}.docx`);
    }
};

const resolveSaveAs = async () => {
    const fileSaverModule = await import("file-saver");
    const saveAs =
        fileSaverModule.saveAs ||
        fileSaverModule.default?.saveAs ||
        fileSaverModule.default;

    if (typeof saveAs !== "function") {
        throw new Error("File saver is unavailable");
    }

    return saveAs;
};

const normalizeLetterParagraphs = (content) =>
    String(content || "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

const normalizeLetterLines = (block = "") =>
    String(block || "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\]\s+(?=\[)/g, "]\n")
        .replace(/\s+\|\s+/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

const buildLetterLayout = ({ content, company = "", personalInfo = {} }) => {
    const paragraphs = normalizeLetterParagraphs(content);
    const senderName = String(personalInfo.fullName || personalInfo.name || "Applicant").trim();
    const senderRole = String(personalInfo.jobTitle || "").trim();
    const senderLines = [
        senderName,
        senderRole,
        personalInfo.email,
        personalInfo.phone,
        personalInfo.location,
    ]
        .map((value) => String(value || "").trim())
        .filter(Boolean);

    const normalizedSenderLineSet = new Set(
        senderLines.map((line) => line.toLowerCase())
    );

    const contentLines = paragraphs.flatMap((paragraph) => normalizeLetterLines(paragraph));
    const filteredLines = contentLines.filter((line) => {
        const normalized = line.toLowerCase();
        if (normalizedSenderLineSet.has(normalized)) return false;
        if (personalInfo.email && normalized.includes(String(personalInfo.email).toLowerCase())) return false;
        if (personalInfo.phone && normalized.includes(String(personalInfo.phone).toLowerCase())) return false;
        return true;
    });

    const salutationIndex = filteredLines.findIndex((line) => /^dear\b/i.test(line));
    const dateIndex = filteredLines.findIndex((line) =>
        /^\[date\]$/i.test(line) ||
        /^date[:\s]/i.test(line) ||
        /\b\d{4}\b/.test(line)
    );

    const dateLine = dateIndex >= 0 ? filteredLines[dateIndex] : "";
    const recipientLines = filteredLines.filter((line, index) => {
        if (index === dateIndex) return false;
        if (salutationIndex >= 0 && index >= salutationIndex) return false;
        return true;
    });
    const salutationLine = salutationIndex >= 0 ? filteredLines[salutationIndex] : "";
    const bodyLines = filteredLines.slice(salutationIndex >= 0 ? salutationIndex + 1 : 0);
    const bodyParagraphs = normalizeLetterParagraphs(bodyLines.join("\n\n"));

    return {
        senderLines,
        dateLine,
        recipientLines: recipientLines.length > 0 ? recipientLines : company ? [company] : [],
        salutationLine,
        bodyParagraphs,
    };
};

export const downloadLetterAsPDF = async (
    { content, type = "cover-letter", company = "", personalInfo = {} },
    fileName = "Letter"
) => {
    if (!content?.trim()) {
        throw new Error("Letter content is required.");
    }

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    const letterData = buildLetterLayout({ content, company, personalInfo });
    const senderName = letterData.senderLines[0] || "Applicant";
    let y = 24;

    const ensureSpace = (spaceNeeded = 10) => {
        if (y + spaceNeeded <= pageHeight - 18) return;
        pdf.addPage();
        y = 24;
    };

    pdf.setFont("times", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(17, 24, 39);
    pdf.text(senderName, margin, y);
    y += 7;

    letterData.senderLines.slice(1).forEach((line, index) => {
        ensureSpace(8);
        pdf.setFont("times", index === 0 ? "italic" : "normal");
        pdf.setFontSize(index === 0 ? 11 : 10);
        pdf.setTextColor(index === 0 ? 71 : 100, index === 0 ? 85 : 116, index === 0 ? 105 : 139);
        pdf.text(line, margin, y);
        y += 6;
    });

    if (letterData.senderLines.length > 1) {
        y += 1;
    }

    if (letterData.dateLine) {
        pdf.setFont("times", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(31, 41, 55);
        pdf.text(letterData.dateLine, margin, y);
        y += 8;
    }

    if (letterData.recipientLines.length > 0) {
        pdf.setFont("times", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(31, 41, 55);
        letterData.recipientLines.forEach((line) => {
            ensureSpace(8);
            pdf.text(line, margin, y);
            y += 6;
        });
        y += 2;
    }

    if (letterData.salutationLine) {
        pdf.setFont("times", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(31, 41, 55);
        pdf.text(letterData.salutationLine, margin, y);
        y += 8;
    }

    pdf.setFont("times", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(31, 41, 55);

    letterData.bodyParagraphs.forEach((paragraph) => {
        const lines = pdf.splitTextToSize(paragraph, contentWidth);
        ensureSpace(lines.length * 6 + 6);
        pdf.text(lines, margin, y);
        y += lines.length * 6 + 4;
    });

    const totalPages = pdf.internal.pages.length - 1;
    for (let page = 1; page <= totalPages; page++) {
        pdf.setPage(page);
        pdf.setFont("times", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(senderName, margin, pageHeight - 8);
        pdf.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 8, {
            align: "right",
        });
    }

    savePdf(pdf, `${fileName}.pdf`);
};

export const downloadLetterAsDOCX = async (
    { content, type = "cover-letter", company = "", personalInfo = {} },
    fileName = "Letter"
) => {
    if (!content?.trim()) {
        throw new Error("Letter content is required.");
    }

    const [{ Document, Packer, Paragraph, TextRun, AlignmentType }, saveAs] = await Promise.all([
        import("docx"),
        resolveSaveAs(),
    ]);
    const letterData = buildLetterLayout({ content, company, personalInfo });
    const senderName = letterData.senderLines[0] || "Applicant";
    const children = [
        new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 120 },
            children: [new TextRun({ text: senderName, bold: true, size: 30 })],
        }),
    ];

    if (letterData.senderLines[1]) {
        children.push(
            new Paragraph({
                spacing: { after: 80 },
                children: [new TextRun({ text: letterData.senderLines[1], italics: true, color: "475569", size: 22 })],
            })
        );
    }

    letterData.senderLines.slice(2).forEach((line, index, list) => {
        children.push(
            new Paragraph({
                spacing: { after: index === list.length - 1 ? 160 : 80 },
                children: [new TextRun({ text: line, color: "64748B", size: 20 })],
            })
        );
    });

    if (letterData.dateLine) {
        children.push(
            new Paragraph({
                spacing: { after: 160 },
                children: [new TextRun({ text: letterData.dateLine, size: 22 })],
            })
        );
    }

    letterData.recipientLines.forEach((line, index) => {
        children.push(
            new Paragraph({
                spacing: { after: index === letterData.recipientLines.length - 1 ? 160 : 80 },
                children: [new TextRun({ text: line, size: 22 })],
            })
        );
    });

    if (letterData.salutationLine) {
        children.push(
            new Paragraph({
                spacing: { after: 160, line: 360 },
                children: [new TextRun({ text: letterData.salutationLine, size: 22 })],
            })
        );
    }

    letterData.bodyParagraphs.forEach((paragraph) => {
        children.push(
            new Paragraph({
                spacing: { after: 160, line: 360 },
                children: [new TextRun({ text: paragraph, size: 22 })],
            })
        );
    });

    const doc = new Document({
        sections: [
            {
                properties: {},
                children,
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    if (isFlutterApp()) {
        await saveBlobViaFlutter(blob, `${fileName}.docx`);
    } else {
        saveAs(blob, `${fileName}.docx`);
    }
};
