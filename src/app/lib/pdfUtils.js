import jsPDF from "jspdf";

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
    return text
        // Math wrappers
        .replace(/\\\[/g, "")
        .replace(/\\\]/g, "")
        .replace(/\$\$/g, "")
        .replace(/\\\(/g, "")
        .replace(/\\\)/g, "")
        // Handle $ inline math (match pairs)
        .replace(/\$([^\$\n]+)\$/g, "$1")
        // Subscripts and superscripts with brackets (e.g. x_{i} -> x_i)
        .replace(/_\{([^{}]+)\}/g, "_$1")
        .replace(/\^\{([^{}]+)\}/g, "^$1")
        // Formatting
        .replace(/\\text\s*\{([^{}]+)\}/g, "$1")
        .replace(/\\mathbf\s*\{([^{}]+)\}/g, "$1")
        .replace(/\\mathit\s*\{([^{}]+)\}/g, "$1")
        .replace(/\\mathrm\s*\{([^{}]+)\}/g, "$1")
        // Sums and Integrals
        .replace(/\\sum_\{([^{}]+)\}\^\{([^{}]+)\}/g, "Σ (from $1 to $2)")
        .replace(/\\int_\{([^{}]+)\}\^\{([^{}]+)\}/g, "∫ (from $1 to $2)")
        .replace(/\\sum/g, "Σ")
        .replace(/\\int/g, "∫")
        // Common fractions and roots
        .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "($1)/($2)")
        .replace(/\\sqrt\s*\{([^{}]+)\}/g, "√($1)")
        // Operators & Relations
        .replace(/\\times\b/g, "×")
        .replace(/\\cdot\b/g, "·")
        .replace(/\\div\b/g, "÷")
        .replace(/\\pm\b/g, "±")
        .replace(/\\approx\b/g, "≈")
        .replace(/\\neq\b/g, "≠")
        .replace(/\\leq\b/g, "≤")
        .replace(/\\geq\b/g, "≥")
        // Arrows
        .replace(/\\rightarrow\b/g, "→")
        .replace(/\\Rightarrow\b/g, "⇒")
        // Greek letters
        .replace(/\\pi\b/g, "π")
        .replace(/\\alpha\b/g, "α")
        .replace(/\\beta\b/g, "β")
        .replace(/\\gamma\b/g, "γ")
        .replace(/\\delta\b/g, "δ")
        .replace(/\\theta\b/g, "θ")
        .replace(/\\lambda\b/g, "λ")
        .replace(/\\mu\b/g, "μ")
        .replace(/\\sigma\b/g, "σ")
        .replace(/\\omega\b/g, "ω")
        .replace(/\\Delta\b/g, "Δ")
        .replace(/\\Sigma\b/g, "Σ")
        .replace(/\\infty\b/g, "∞")
        // Strip out generic commands (like \left \right)
        .replace(/\\[a-zA-Z]+\b/g, "")
        // Escaped delimiters
        .replace(/\\{/g, "{")
        .replace(/\\}/g, "}");
};

export const downloadCourseAsPDF = async (data, mode = "course") => {
    if (!data) throw new Error("No data provided");

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let y = 25;

    // Header & Footer Helper
    const addPageDecoration = (pageNum, totalPages) => {
        // Header line
        pdf.setDrawColor(...COLORS.divider);
        pdf.setLineWidth(0.2);
        pdf.line(margin, 15, pageWidth - margin, 15);

        // Footer
        pdf.setDrawColor(...COLORS.divider);
        pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        pdf.setFont("times", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...COLORS.textLight);
        pdf.text("Actirova AI Tutor - Personalized Learning", margin, pageHeight - 10);
        pdf.text(`Copyright © Actirova AI Tutor. All rights reserved.`, pageWidth / 2, pageHeight - 10, { align: "center" });
        pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    };

    // Check Page Overflow
    const checkNewPage = (neededSpace) => {
        if (y + neededSpace > pageHeight - 25) {
            pdf.addPage();
            y = 25;
            return true;
        }
        return false;
    };

    // --- COVER PAGE ---
    // No background gradient - keeping it clean as per user request
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    y = 40;
    try {
        // Add logo to cover page - path relative to public folder in Next.js
        pdf.addImage("/logo.png", "PNG", (pageWidth - 40) / 2, y, 40, 40);
        y += 45;
    } catch (e) {
        // Fallback if logo-white not found
        try {
            pdf.addImage("/logo.png", "PNG", (pageWidth - 40) / 2, y, 40, 40);
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


    const renderCodeLine = (text, xPos) => {
        pdf.setFont("courier", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(50, 50, 50);

        const lines = pdf.splitTextToSize(text, contentWidth - (xPos - margin + 4));

        lines.forEach((line) => {
            checkNewPage(7);

            // Draw code background
            pdf.setFillColor(245, 245, 245);
            pdf.rect(margin + 2, y - 4, contentWidth - 4, 6, "F");

            pdf.text(line, xPos + 2, y);
            y += 6;
        });
        pdf.setFont("times", "normal"); // Reset
    };

    const processContent = (content) => {
        if (!content) return;
        const lines = content.split('\n');
        let isInCodeBlock = false;

        lines.forEach(line => {
            let trimmedLine = line.trim();

            // Handle code block toggle
            if (trimmedLine.startsWith("```")) {
                isInCodeBlock = !isInCodeBlock;
                y += 2; // Small padding
                return;
            }

            if (isInCodeBlock) {
                renderCodeLine(line, margin + 4);
                return;
            }

            trimmedLine = typeof cleanLatex === "function" ? cleanLatex(trimmedLine) : trimmedLine;

            // Handle horizontal rule (bypass rendering but keep spacing if needed)
            if (trimmedLine.match(/^\s*[-*_]{3,}\s*$/)) {
                y += 5;
                return;
            }

            if (!trimmedLine) {
                y += 3;
                return;
            }

            const cleanLine = stripMarkdown(trimmedLine).toLowerCase().replace(/^(course|module|lesson|topic):\s*/, "").trim();
            const isRedundant =
                cleanLine === data.title?.toLowerCase() ||
                (data.course && cleanLine === data.course.toLowerCase()) ||
                (data.module && cleanLine === data.module.toLowerCase()) ||
                (data.course && cleanLine.includes(data.course.toLowerCase())) ||
                (data.module && cleanLine.includes(data.module.toLowerCase())) ||
                (data.title && (cleanLine.includes(data.title.toLowerCase()) || data.title.toLowerCase().includes(cleanLine))) ||
                trimmedLine.toLowerCase().startsWith("module:") ||
                trimmedLine.toLowerCase().startsWith("lesson:") ||
                trimmedLine.toLowerCase().startsWith("course:") ||
                trimmedLine.toLowerCase().startsWith("topic:");

            // Skip redundant titles, and skip early dividers/empty lines that often follow them
            if (isRedundant || (trimmedLine.match(/^[-*_]{3,}$/) && y < 65)) {
                return;
            }

            if (!trimmedLine && y < 65) {
                return;
            }

            checkNewPage(12);

            if (trimmedLine.startsWith("# ")) {
                const headerText = stripMarkdown(trimmedLine.substring(2).trim());
                y += 2;
                pdf.setFont("times", "bold");
                pdf.setFontSize(26);
                pdf.setTextColor(...COLORS.text);
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

                const lastLineW = pdf.getTextWidth(lines[lines.length - 1]);
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
            } else if (trimmedLine.startsWith("> ")) {
                const quoteText = trimmedLine.substring(2).trim();
                pdf.setFont("times", "italic");
                pdf.setTextColor(...COLORS.textLight);
                const lines = pdf.splitTextToSize(quoteText, contentWidth - 10);

                checkNewPage(lines.length * 6 + 4);

                // Draw quote vertical bar
                pdf.setDrawColor(...COLORS.divider);
                pdf.setLineWidth(1);
                pdf.line(margin + 2, y - 4, margin + 2, y + (lines.length * 6) - 4);

                pdf.text(lines, margin + 8, y);
                y += (lines.length * 6) + 4;
                pdf.setFont("times", "normal"); // Reset
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
        });
    };

    if (mode === "course") {
        const modules = data.modules || data.courseData?.modules || [];

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
            pdf.text(`Module ${idx + 1}: ${mod.title}`, margin, y);
            y += 8;
        });

        // Process Modules
        modules.forEach((mod, idx) => {
            pdf.addPage();
            y = 30;

            // Module Title
            pdf.setFillColor(...COLORS.primaryLight);
            pdf.rect(margin, y - 8, contentWidth, 15, "F");
            pdf.setFont("times", "bold");
            pdf.setFontSize(20);
            pdf.setTextColor(...COLORS.primary);
            pdf.text(`Module ${idx + 1}: ${mod.title}`, margin + 5, y + 2);
            y += 20;

            mod.lessons?.forEach((lesson, lIdx) => {
                checkNewPage(20);
                pdf.setFont("times", "bold");
                pdf.setFontSize(16);
                pdf.setTextColor(...COLORS.text);
                pdf.text(`${idx + 1}.${lIdx + 1} ${lesson.title || lesson}`, margin, y);
                y += 10;

                if (lesson.content) {
                    processContent(lesson.content);
                }
                y += 10;
            });
        });
    } else {
        // Mode is "notes"
        processContent(data.content);
    }

    // --- FINAL DECORATION ---
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addPageDecoration(i, totalPages);
    }

    const title = data.title || data.topic || "Actirova_Study";
    const fileName = `${title.replace(/\s+/g, "_").toLowerCase()}.pdf`;
    pdf.save(fileName);
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
    pdf.save(fileName);
};

/**
 * Generates an enterprise-grade payment receipt PDF.
 * Designed for auditability, print clarity, and corporate standards.
 */
export const downloadReceiptAsPDF = async (data) => {
    if (!data) throw new Error("Receipt data is required.");

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    /* ------------------------------------------------------------------
       LAYOUT CONSTANTS
    ------------------------------------------------------------------ */
    const PAGE_WIDTH = 210;
    const MARGIN = 25;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
    let y = 20;

    /* ------------------------------------------------------------------
       CORPORATE THEME
    ------------------------------------------------------------------ */
    const COLORS = {
        text: [0, 0, 0],
        muted: [90, 90, 90],
        border: [200, 200, 200],
        accent: [0, 70, 140], // conservative enterprise blue
        success: [0, 120, 60]
    };

    const BRAND = {
        name: "Actirova AI Tutor Ltd.",
        website: "www.actirova.com",
        support: "support@actirova.com"
    };

    /* ------------------------------------------------------------------
       HEADER (LOGO + COMPANY INFO)
    ------------------------------------------------------------------ */
    try {
        pdf.addImage("/logo.png", "PNG", MARGIN, y, 22, 22);
    } catch { }

    pdf.setFont("times", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...COLORS.text);
    pdf.text(BRAND.name, MARGIN + 30, y + 8);

    pdf.setFont("times", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.muted);
    pdf.text(BRAND.website, MARGIN + 30, y + 14);
    pdf.text(`Support: ${BRAND.support}`, MARGIN + 30, y + 19);

    pdf.setFont("times", "bold");
    pdf.setFontSize(14);
    pdf.text("RECEIPT", PAGE_WIDTH - MARGIN, y + 10, { align: "right" });

    y += 30;

    /* ------------------------------------------------------------------
       DIVIDER
    ------------------------------------------------------------------ */
    pdf.setDrawColor(...COLORS.border);
    pdf.setLineWidth(0.5);
    pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 12;

    /* ------------------------------------------------------------------
       RECEIPT META (LEFT / RIGHT BLOCK)
    ------------------------------------------------------------------ */
    const drawMetaRow = (label, value, x, yPos) => {
        pdf.setFont("times", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(...COLORS.muted);
        pdf.text(label, x, yPos);

        pdf.setFont("times", "normal");
        pdf.setTextColor(...COLORS.text);
        pdf.text(String(value || "N/A"), x + 40, yPos);
    };

    const LEFT_X = MARGIN;
    const RIGHT_X = PAGE_WIDTH / 2 + 5;

    let metaY = y;
    drawMetaRow("Receipt No.", data.receiptNumber, LEFT_X, metaY);
    metaY += 6;
    drawMetaRow("Transaction Date", data.transactionDate, LEFT_X, metaY);
    metaY += 6;
    drawMetaRow("Reference", data.reference, LEFT_X, metaY);

    let metaYR = y;
    drawMetaRow("Payment Method", data.method || "Card", RIGHT_X, metaYR);
    metaYR += 6;
    drawMetaRow("Account Status", data.accountStatus || "Active", RIGHT_X, metaYR);
    metaYR += 6;
    drawMetaRow("Auto-Renewal", data.autoRenew || "Enabled", RIGHT_X, metaYR);

    y = Math.max(metaY, metaYR) + 14;

    /* ------------------------------------------------------------------
       LINE ITEM TABLE
    ------------------------------------------------------------------ */
    pdf.setFont("times", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...COLORS.text);

    pdf.text("Description", MARGIN, y);
    pdf.text("Period", PAGE_WIDTH - MARGIN - 60, y);
    pdf.text("Amount", PAGE_WIDTH - MARGIN, y, { align: "right" });

    y += 4;
    pdf.setDrawColor(...COLORS.border);
    pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 8;

    pdf.setFont("times", "normal");
    pdf.setFontSize(10);

    pdf.text(data.plan || "Pro Subscription", MARGIN, y);
    pdf.text(
        data.validFrom || data.transactionDate || "—",
        PAGE_WIDTH - MARGIN - 60,
        y
    );

    pdf.text(
        `$ ${data.amount || "0.00"}`,
        PAGE_WIDTH - MARGIN,
        y,
        { align: "right" }
    );

    y += 12;

    /* ------------------------------------------------------------------
       TOTAL
    ------------------------------------------------------------------ */
    pdf.setDrawColor(...COLORS.border);
    pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 10;

    pdf.setFont("times", "bold");
    pdf.setFontSize(12);
    pdf.text("Total Paid", PAGE_WIDTH - MARGIN - 60, y);
    pdf.text(
        `$ ${data.amount || "0.00"}`,
        PAGE_WIDTH - MARGIN,
        y,
        { align: "right" }
    );

    y += 16;

    /* ------------------------------------------------------------------
       PAYMENT STATUS
    ------------------------------------------------------------------ */
    pdf.setFontSize(10);
    pdf.setTextColor(...COLORS.success);
    pdf.text(
        `Payment Status: ${data.status || "SUCCESS"}`,
        MARGIN,
        y
    );

    y += 10;
    pdf.setFont("times", "normal");
    pdf.setTextColor(...COLORS.muted);
    pdf.text(
        `Processed on ${data.timestamp || "N/A"}`,
        MARGIN,
        y
    );

    /* ------------------------------------------------------------------
       FOOTER (LEGAL / NOTICE)
    ------------------------------------------------------------------ */
    y = 270;
    pdf.setDrawColor(...COLORS.border);
    pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 8;

    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.muted);
    pdf.text(
        "This document is electronically generated and is valid without a signature.",
        PAGE_WIDTH / 2,
        y,
        { align: "center" }
    );

    pdf.save(`Actirova_Receipt_${data.receiptNumber || Date.now()}.pdf`);
};
