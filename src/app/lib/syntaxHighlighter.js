/**
 * Simple Syntax Highlighter for PDF segments
 * This provides tokenization for common languages.
 */

const THEME = {
    keyword: [0, 51, 179],    // Blue
    string: [3, 106, 7],      // Green
    comment: [107, 114, 128], // Gray
    number: [194, 65, 12],    // Orange/Red
    function: [126, 34, 206], // Purple
    default: [31, 41, 55]     // Dark Gray
};

const LANGUAGES = {
    javascript: {
        keywords: /\b(await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|if|import|in|instanceof|new|null|return|super|switch|this|throw|true|try|typeof|var|void|while|with|yield|let|static|async)\b/g,
        strings: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
        comments: /(\/\/.*|\/\*[\s\S]*?\*\/)/g,
        numbers: /\b(\d+(\.\d+)?)\b/g,
        functions: /\b(\w+)(?=\s*\()/g
    },
    python: {
        keywords: /\b(False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/g,
        strings: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|"""[\s\S]*?"""|'''[\s\S]*?''')/g,
        comments: /(#.*)/g,
        numbers: /\b(\d+(\.\d+)?)\b/g,
        functions: /\b(\w+)(?=\s*\()/g
    }
};

/**
 * Tokenize code into segments with colors
 */
export const tokenizeCode = (code, lang = "javascript") => {
    // Ensure lang is a string
    const langStr = (typeof lang === 'string' ? lang : 'javascript').toLowerCase();
    const language = LANGUAGES[langStr] || LANGUAGES.javascript;
    
    // This is a very basic one-pass tokenizer for demonstration
    // In a real scenario, we'd use a more robust parser.
    const tokens = [];
    let lastIndex = 0;
    
    // Combine all regexes into one to find matches in order
    const combinedRegex = new RegExp(
        `(?<comment>${language.comments.source})|` +
        `(?<string>${language.strings.source})|` +
        `(?<keyword>${language.keywords.source})|` +
        `(?<function>${language.functions.source})|` +
        `(?<number>${language.numbers.source})`,
        "g"
    );

    let match;
    while ((match = combinedRegex.exec(code)) !== null) {
        // Add preceding default text
        if (match.index > lastIndex) {
            tokens.push({
                text: code.substring(lastIndex, match.index),
                color: THEME.default
            });
        }

        // Determine token type
        let type = "default";
        if (match.groups.comment) type = "comment";
        else if (match.groups.string) type = "string";
        else if (match.groups.keyword) type = "keyword";
        else if (match.groups.function) type = "function";
        else if (match.groups.number) type = "number";

        tokens.push({
            text: match[0],
            color: THEME[type]
        });

        lastIndex = combinedRegex.lastIndex;
    }


    // Add remaining text
    if (lastIndex < code.length) {
        tokens.push({
            text: code.substring(lastIndex),
            color: THEME.default
        });
    }

    return tokens;
};

export const highlightToHtml = (code, lang = "javascript") => {
    const tokens = tokenizeCode(code, lang);
    return tokens.map(token => {
        const color = `rgb(${token.color.join(",")})`;
        // Escape HTML
        const escapedText = token.text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        
        return `<span style="color: ${color}">${escapedText}</span>`;
    }).join("");
};
