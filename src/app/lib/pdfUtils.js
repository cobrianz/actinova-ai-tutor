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
