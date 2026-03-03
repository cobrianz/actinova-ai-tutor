/**
 * Academic Engine Utility
 * Handles conversion between structured JSON, Markdown, HTML, and LaTeX.
 */

export const jsonToMarkdown = (data) => {
    if (!data) return "";

    let md = "";

    if (data.title) md += `# ${data.title}\n\n`;
    if (data.author) md += `**Author:** ${data.author}\n`;
    if (data.institution) md += `**Institution:** ${data.institution}\n`;
    if (data.course) md += `**Course:** ${data.course}\n`;
    if (data.name) md += `**Student:** ${data.name}\n`;
    if (data.date) md += `**Date:** ${data.date}\n\n`;
    if (data.abstract) md += `## Abstract\n\n${data.abstract}\n\n`;

    if (data.sections && Array.isArray(data.sections)) {
        data.sections.forEach(section => {
            md += `## ${section.heading || section.title}\n\n`;
            if (Array.isArray(section.paragraphs)) {
                md += section.paragraphs.join('\n\n') + '\n\n';
            } else if (section.content) {
                md += section.content + '\n\n';
            }
        });
    } else if (data.content) {
        // Single section case
        if (data.title) md += `## ${data.title}\n\n`;
        md += `${data.content}\n\n`;
    }

    if (data.references && data.references.length > 0) {
        md += `## References\n\n`;
        data.references.forEach(ref => {
            md += `- ${ref}\n`;
        });
    }

    return md;
};

export const jsonToHtml = (data) => {
    if (!data) return "";

    // Simple markdown-ish to HTML converter for the editor
    // Note: In production, use a library like 'marked' or 'remark'
    let html = "";

    if (data.title) html += `<h1 style="text-align: center; font-weight: bold;">${data.title}</h1>`;
    if (data.author) html += `<p style="text-align: center;">${data.author}</p>`;
    if (data.institution) html += `<p style="text-align: center;">${data.institution}</p>`;
    if (data.course) html += `<p style="text-align: center;">${data.course}</p>`;
    if (data.name) html += `<p style="text-align: center;">${data.name}</p>`;
    if (data.date) html += `<p style="text-align: center; margin-bottom: 2rem;">${data.date}</p>`;
    if (data.abstract) html += `<h2 style="font-weight: bold;">Abstract</h2><p>${data.abstract}</p>`;

    if (data.sections && Array.isArray(data.sections)) {
        data.sections.forEach(section => {
            html += `<h2 style="font-weight: bold;">${section.heading || section.title}</h2>`;
            if (Array.isArray(section.paragraphs)) {
                html += section.paragraphs.map(p => `<p>${p}</p>`).join('');
            } else if (section.content) {
                html += section.content.split('\n\n').map(p => `<p>${p}</p>`).join('');
            }
        });
    } else if (data.content) {
        // Single section
        if (data.title) html += `<h2 style="font-weight: bold;">${data.title}</h2>`;
        html += data.content.split('\n\n').map(p => `<p>${p}</p>`).join('');
    }

    if (data.references && data.references.length > 0) {
        html += `<h2 style="font-weight: bold;">References</h2><ul>`;
        data.references.forEach(ref => {
            html += `<li>${ref}</li>`;
        });
        html += `</ul>`;
    }

    return html;
};

export const jsonToLatex = (data) => {
    if (!data) return "";

    const escapeLatex = (text) => {
        if (!text) return "";
        return text
            .replace(/&/g, '\\&')
            .replace(/%/g, '\\%')
            .replace(/\$/g, '\\$')
            .replace(/#/g, '\\#')
            .replace(/_/g, '\\_')
            .replace(/{/g, '\\{')
            .replace(/}/g, '\\}')
            .replace(/~/g, '\\textasciitilde{}')
            .replace(/\^/g, '\\textasciicircum{}')
            .replace(/\\/g, '\\textbackslash{}');
    };

    let latex = `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{setspace}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\doublespacing

\\title{${escapeLatex(data.title || "Academic Paper")}}
\\author{${escapeLatex(data.author || "Research Author")}}
\\date{${escapeLatex(data.date || "\\today")}}

\\begin{document}

\\maketitle

\\begin{center}
${data.institution ? `${escapeLatex(data.institution)}\\\\` : ""}
${data.course ? `${escapeLatex(data.course)}\\\\` : ""}
${data.name ? `${escapeLatex(data.name)}\\\\` : ""}
\\end{center}
\\newpage

\\tableofcontents
\\newpage

`;

    if (data.abstract) {
        latex += `\\begin{abstract}\n${escapeLatex(data.abstract)}\n\\end{abstract}\n\n`;
    }

    if (data.sections && Array.isArray(data.sections)) {
        data.sections.forEach(section => {
            latex += `\\section{${escapeLatex(section.heading || section.title)}}\n`;
            if (Array.isArray(section.paragraphs)) {
                latex += section.paragraphs.map(p => escapeLatex(p)).join('\n\n') + '\n\n';
            } else if (section.content) {
                latex += escapeLatex(section.content) + '\n\n';
            }
        });
    }

    if (data.references && data.references.length > 0) {
        latex += `\\section*{References}\n\\begin{itemize}\n`;
        data.references.forEach(ref => {
            latex += `\\item ${escapeLatex(ref)}\n`;
        });
        latex += `\\end{itemize}\n`;
    }

    latex += `\\end{document}`;

    return latex;
};
