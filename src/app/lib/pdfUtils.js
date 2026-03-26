import jsPDF from "jspdf";
import { JETBRAINS_MONO_BASE64 } from "./jetbrains-mono-base64";
import { tokenizeCode } from "./syntaxHighlighter";

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

/**
 * Shared parser to identify structural blocks (charts, tables, code, text)
 */
export const parseContentIntoBlocks = (content) => {
    let normalizedContent = (content || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    
    // Strip outer triple backticks if they wrap the entire content
    // e.g., ```markdown\n# Header\n... ```
    const outerBacktickRegex = /^```(?:\w+)?\s*\n?([\s\S]+?)\n?```$/;
    const outerMatch = normalizedContent.match(outerBacktickRegex);
    if (outerMatch) {
        normalizedContent = outerMatch[1].trim();
    }
    const blocks = [];
    const blockRegex = /^[ \t]*```(\w+)?\s*([\s\S]*?)```[ \t]*/gm;
    let lastIndex = 0;
    let match;

    const extractTablesFromText = (text) => {
        const tableRegex = /((?:^|\n)\|.+(?:\|.+(?:(?:\n\|[\s\-|]+)+)(?:\n\|.+(?:\|.+)*)+))/g;
        let tLastIndex = 0;
        let tMatch;
        while ((tMatch = tableRegex.exec(text)) !== null) {
            const beforeTable = text.substring(tLastIndex, tMatch.index).trim();
            if (beforeTable) blocks.push({ type: "text", content: beforeTable });
            const tableContent = tMatch[0].trim();
            const lines = tableContent.split('\n').filter(l => l.trim().startsWith('|'));
            if (lines.length >= 3) {
                const headers = lines[0].split('|').filter(s => s.trim()).map(s => s.trim());
                const rows = lines.slice(2).map(line => line.split('|').filter(s => s.trim()).map(s => s.trim()));
                if (headers.length > 0 && rows.length > 0) {
                    blocks.push({ type: "table", headers, rows });
                } else {
                    blocks.push({ type: "text", content: tableContent });
                }
            } else {
                blocks.push({ type: "text", content: tableContent });
            }
            tLastIndex = tableRegex.lastIndex;
        }
        const finalRemaining = text.substring(tLastIndex).trim();
        if (finalRemaining) blocks.push({ type: "text", content: finalRemaining });
    };

    const processTikzBlock = (tikzContent, fullBlock) => {
        try {
            const xlabelMatch = /xlabel\s*=\s*\{([^}]*)\}/.exec(tikzContent);
            const ylabelMatch = /ylabel\s*=\s*\{([^}]*)\}/.exec(tikzContent);
            const coordRegex = /coordinates\s*\{\s*([\s\S]*?)\s*\}/g;
            let cMatch;
            const datasets = [];
            while ((cMatch = coordRegex.exec(tikzContent)) !== null) {
                const coordsStr = cMatch[1];
                const pairs = coordsStr.match(/\((-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\)/g);
                if (pairs) {
                    const data = pairs.map(p => {
                        const parts = p.match(/\((-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\)/);
                        return { x: parseFloat(parts[1]), y: parseFloat(parts[2]) };
                    });
                    datasets.push({
                        label: datasets.length === 0 ? (ylabelMatch ? ylabelMatch[1] : "Y-Axis") : `Plot ${datasets.length + 1}`,
                        data: data.map(d => d.y),
                        labels: data.map(d => d.x)
                    });
                }
            }
            if (datasets.length > 0) {
                blocks.push({
                    type: "chart",
                    chartType: "line",
                    data: {
                        labels: datasets[0].labels,
                        datasets: datasets.map(d => ({ label: d.label, data: d.data }))
                    },
                    title: xlabelMatch ? `${xlabelMatch[1]} vs ${ylabelMatch ? ylabelMatch[1] : ''}` : "Tactical Data Visualization"
                });
            } else {
                blocks.push({ type: "code", lang: "latex", content: fullBlock });
            }
        } catch (e) {
            blocks.push({ type: "code", lang: "latex", content: fullBlock });
        }
    };

    const processTextAndTables = (text) => {
        if (!text.trim()) return;
        
        // Can be preceded by optional "chart" keyword
        let processedText = text;
        const visualMatches = [];
        
        // We use a temporary replacement strategy to handle naked charts within text blocks
        // But since we want to return blocks, it's better to split the text
        
        const tikzRegex = /\\begin\{tikzpicture\}([\s\S]*?)\\end\{tikzpicture\}/g;
        // First, find TikZ blocks
        let m;
        while ((m = tikzRegex.exec(text)) !== null) {
            visualMatches.push({ type: 'tikz', content: m[1], full: m[0], index: m.index });
        }
        
        // THEN, find naked charts with nested brace support
        const startRegex = /(?:^|\n)[ \t]*(?:chart\s*\n+)?([ \t]*\{)/g;
        let nMatch;
        while ((nMatch = startRegex.exec(text)) !== null) {
            const startIndex = nMatch.index + (nMatch[0].length - nMatch[1].length);
            let balance = 0;
            let foundEnd = false;
            let i = startIndex;
            
            for (; i < text.length; i++) {
                if (text[i] === '{') balance++;
                else if (text[i] === '}') {
                    balance--;
                    if (balance === 0) {
                        foundEnd = true;
                        i++; // Include the closing brace
                        break;
                    }
                }
            }
            
            if (foundEnd) {
                const potentialJson = text.substring(startIndex, i).trim();
                // Verify it looks like our chart JSON
                if (potentialJson.includes('"type"') && (potentialJson.includes('"data"') || potentialJson.includes('"datasets"'))) {
                    visualMatches.push({ 
                        type: 'nakedChart', 
                        content: potentialJson, 
                        full: text.substring(nMatch.index, i), 
                        index: nMatch.index 
                    });
                    // Move the regex index forward
                    startRegex.lastIndex = i;
                }
            }
        }
        
        visualMatches.sort((a, b) => a.index - b.index);
        let lastIdx = 0;
        visualMatches.forEach(vMatch => {
            const beforeText = text.substring(lastIdx, vMatch.index);
            if (beforeText.trim()) extractTablesFromText(beforeText);
            
            if (vMatch.type === 'tikz') {
                processTikzBlock(vMatch.content, vMatch.full);
            } else if (vMatch.type === 'nakedChart') {
                try {
                    const code = vMatch.content.trim();
                    let cleanedCode = code;
                    cleanedCode = cleanedCode.replace(/,\s*([\}\]])/g, '$1');
                    const sanitizedCode = cleanedCode.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
                    const chartData = JSON.parse(sanitizedCode);
                    blocks.push({ 
                        type: "chart", 
                        chartType: chartData.type || "bar",
                        data: chartData.data,
                        title: chartData.title || "Interactive Data Chart"
                    });
                } catch (e) {
                    blocks.push({ type: "code", lang: "chart", content: vMatch.content });
                }
            }
            lastIdx = vMatch.index + vMatch.full.length;
        });
        const remainingText = text.substring(lastIdx);
        if (remainingText.trim()) extractTablesFromText(remainingText);
    };

    while ((match = blockRegex.exec(normalizedContent)) !== null) {
        const textBefore = normalizedContent.substring(lastIndex, match.index);
        processTextAndTables(textBefore);
        
        const lang = (match[1] || "").toLowerCase().trim();
        const code = match[2].trim();
        
        // ... (rest of the block handling remains the same)
        if (lang === "chart") {
            try {
                // More robust JSON cleaning for AI-generated code blocks
                let cleanedCode = code.trim();
                // Handle potential trailing commas in JSON (common with AI)
                cleanedCode = cleanedCode.replace(/,\s*([\}\]])/g, '$1');
                // Ensure backslashes are escaped properly for JSON.parse
                const sanitizedCode = cleanedCode.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
                const chartData = JSON.parse(sanitizedCode);
                blocks.push({ 
                    type: "chart", 
                    chartType: chartData.type || "bar",
                    data: chartData.data,
                    title: chartData.title || "Interactive Data Chart"
                });
            } catch (e) {
                console.error("Chart JSON parse error:", e, code);
                // Fallback to code block instead of raw text to prevent double-rendering issues
                blocks.push({ type: "code", lang: "chart", content: code });
            }
        } else if (lang === "table") {
            try {
                const tableData = JSON.parse(code);
                blocks.push({ type: "table", headers: tableData.headers, rows: tableData.rows, title: tableData.title });
            } catch (e) {
                blocks.push({ type: "code", lang: "table", content: code });
            }
        } else {
            blocks.push({ type: "code", lang, content: code });
        }
        lastIndex = blockRegex.lastIndex;
    }
    processTextAndTables(normalizedContent.substring(lastIndex));
    return blocks;
};

export const downloadCourseAsPDF = async (data, mode = "course", visuals = []) => {
    if (!data) throw new Error("No data provided");

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

        lines.forEach((line) => {
            if (typeof y !== 'number' || !isFinite(y)) y = 25;
            checkNewPage(7);
            
            const tokens = tokenizeCode(line, lang);
            let currentX = Number(xPos) + 2;

            if (!tokens || tokens.length === 0) {
                if (line && line.trim().length > 0) {
                    pdf.setTextColor(50, 50, 50);
                    pdf.text(String(line), isFinite(currentX) ? currentX : 22, isFinite(y) ? y : 25);
                }
            } else {
                tokens.forEach(token => {
                    if (!token || !token.text || typeof token.text !== 'string') return;
                    
                    pdf.setTextColor(...(token.color || [50, 50, 50]));
                    const textPart = token.text;
                    const partWidth = Number(pdf.getTextWidth(textPart)) || 0;
                    
                    const drawX = isFinite(currentX) ? currentX : 22;
                    const drawY = isFinite(y) ? y : 25;

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
        pdf.setFont("times", "normal");
        pdf.setTextColor(...COLORS.text);
    };

    const processContent = (content) => {
        if (!content) return;
        const blocks = parseContentIntoBlocks(content);

        let chartIdx = 0;
        let tableIdx = 0;

        blocks.forEach(block => {
            if (block.type === "chart" || block.type === "table") {
                const targetType = block.type;
                const targetIndex = targetType === "chart" ? chartIdx++ : tableIdx++;

                const visualData = visuals.find(v => v.type === targetType && v.index === targetIndex);
                if (visualData && visualData.image) {
                    const imgWidth = contentWidth;
                    const imgHeight = (visualData.height * imgWidth) / visualData.width;
                    checkNewPage(imgHeight + 10); // Ensure space for image
                    try {
                        pdf.addImage(visualData.image, margin, y, imgWidth, imgHeight);
                        y += imgHeight + 10;
                    } catch (imgErr) {
                        console.error(`Failed to add ${targetType} image to PDF:`, imgErr);
                        // Fallback fallback
                        if (block.type === "chart") {
                            renderCodeBlock(JSON.stringify({ type: block.chartType, data: block.data, title: block.title }, null, 2), margin + 4);
                        } else {
                            renderCodeBlock(block.headers.join(" | "), margin + 4);
                        }
                    }
                } else {
                    // Fallback to text if image missing
                    y += 2;
                    if (block.type === "chart") {
                        const fallbackContent = block.data ? JSON.stringify({ type: block.chartType, data: block.data, title: block.title }, null, 2) : "Chart Data Missing";
                        renderCodeBlock(fallbackContent, margin + 4);
                    } else if (block.type === "table") {
                        const tableText = (block.headers?.join(" | ") || "") + "\n" + (block.rows?.map(r => r.join(" | ")).join("\n") || "");
                        renderCodeBlock(tableText || "Table Data Missing", margin + 4);
                    }
                }
            } else if (block.type === "code") {
                y += 2;
                renderCodeBlock(block.content, block.lang, margin + 4);
            } else if (block.type === "text") {
                const lines = block.content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    let trimmedLine = line.trim();

                    trimmedLine = typeof cleanLatex === "function" ? cleanLatex(trimmedLine) : trimmedLine;

                    // Handle horizontal rule
                    if (trimmedLine.match(/^\s*[-*_]{3,}\s*$/)) {
                        y += 5;
                        continue;
                    }

                    if (!trimmedLine) {
                        y += 3;
                        continue;
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

                    if (isRedundant || (trimmedLine.match(/^[-*_]{3,}$/) && y < 65)) {
                        continue;
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
        pdf.addImage("/logo.png", MARGIN, y, 22, 22);
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
            .map((item) => item.replace(/^[-*•]\s*/, "").trim())
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
            pdf.text("•", MARGIN + 1, y);
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
        writeWrappedText(normalizeList(data.skills).join(" • "), MARGIN, CONTENT_WIDTH, {
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
            .join(" • ");

        writeWrappedText(languageText, MARGIN, CONTENT_WIDTH, {
            size: 10.8,
            color: COLORS.text,
            lineHeight: BASE_LINE_HEIGHT,
        });
        y += 2;
    }

    if (data.skills.length > 0) {
        drawSectionTitle("Skills");
        writeWrappedText(normalizeList(data.skills).join(" • "), MARGIN, CONTENT_WIDTH, {
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

    pdf.save(`${fileName}.pdf`);
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
            .map((item) => item.replace(/^[-*•]\s*/, "").trim())
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
                text: normalizeList(data.skills).join(" • "),
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
                    .join(" • "),
                spacing: { after: 120, line: 360 },
            })
        );
    }

    if (data.skills.length > 0) {
        content.push(sectionHeading("Skills"));
        content.push(
            new Paragraph({
                text: normalizeList(data.skills).join(" • "),
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
    saveAs(blob, `${fileName}.docx`);
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

    pdf.save(`${fileName}.pdf`);
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
    saveAs(blob, `${fileName}.docx`);
};
