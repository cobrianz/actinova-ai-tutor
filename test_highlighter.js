const LANGUAGES = {
    javascript: {
        keywords: /\b(await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|if|import|in|instanceof|new|null|return|super|switch|this|throw|true|try|typeof|var|void|while|with|yield|let|static|async)\b/g,
        strings: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
        comments: /(\/\/.*|\/\*[\s\S]*?\*\/)/g,
        numbers: /\b(\d+(\.\d+)?)\b/g,
        functions: /\b(\w+)(?=\s*\()/g
    }
};

const THEME = {
    keyword: [0, 51, 179],
    string: [3, 106, 7],
    comment: [107, 114, 128],
    number: [194, 65, 12],
    function: [126, 34, 206],
    default: [31, 41, 55]
};

const tokenizeCode = (code, lang = "javascript") => {
    const langStr = (typeof lang === 'string' ? lang : 'javascript').toLowerCase();
    const language = LANGUAGES[langStr] || LANGUAGES.javascript;
    
    const tokens = [];
    let lastIndex = 0;
    
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
        if (match.index > lastIndex) {
            tokens.push({
                text: code.substring(lastIndex, match.index),
                color: THEME.default
            });
        }

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

    if (lastIndex < code.length) {
        tokens.push({
            text: code.substring(lastIndex),
            color: THEME.default
        });
    }

    return tokens;
};

const testCode = 'const x = 10;\n// comment\nfunction test() { return "hello"; }';
console.log(JSON.stringify(tokenizeCode(testCode), null, 2));
