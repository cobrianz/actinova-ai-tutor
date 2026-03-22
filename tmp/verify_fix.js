
const fs = require('fs');

function parseContentIntoBlocks(content) {
    const normalizedContent = (content || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    const blocks = [];
    const blockRegex = /^[ \t]*```(\w+)?\s*([\s\S]*?)```[ \t]*/gm;
    let lastIndex = 0;
    let match;

    const extractTablesFromText = (text) => {
        if (!text.trim()) return;
        blocks.push({ type: "text", content: text.trim() });
    };

    const processTextAndTables = (text) => {
        if (!text.trim()) return;
        
        const visualMatches = [];
        
        // Balanced brace matching from updated pdfUtils.js
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
                        i++;
                        break;
                    }
                }
            }
            
            if (foundEnd) {
                const potentialJson = text.substring(startIndex, i).trim();
                if (potentialJson.includes('"type"') && (potentialJson.includes('"data"') || potentialJson.includes('"datasets"'))) {
                    visualMatches.push({ 
                        type: 'nakedChart', 
                        content: potentialJson, 
                        full: text.substring(nMatch.index, i), 
                        index: nMatch.index 
                    });
                    startRegex.lastIndex = i;
                }
            }
        }
        
        visualMatches.sort((a, b) => a.index - b.index);
        let lastIdx = 0;
        visualMatches.forEach(vMatch => {
            const beforeText = text.substring(lastIdx, vMatch.index);
            if (beforeText.trim()) extractTablesFromText(beforeText);
            
            try {
                const chartData = JSON.parse(vMatch.content.trim().replace(/,\s*([\}\]])/g, '$1').replace(/\\(?!["\\/bfnrtu])/g, "\\\\"));
                blocks.push({ type: "chart", data: chartData });
            } catch (e) {
                blocks.push({ type: "code", lang: "chart", content: vMatch.content });
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
        if (lang === "chart") {
            try {
                const chartData = JSON.parse(code.replace(/,\s*([\}\]])/g, '$1').replace(/\\(?!["\\/bfnrtu])/g, "\\\\"));
                blocks.push({ type: "chart", data: chartData });
            } catch (e) {
                blocks.push({ type: "code", lang: "chart", content: code });
            }
        } else {
            blocks.push({ type: "code", lang, content: code });
        }
        lastIndex = blockRegex.lastIndex;
    }
    processTextAndTables(normalizedContent.substring(lastIndex));
    return blocks;
}

const tests = [
    {
        name: "User Screenshot Case (Nested & Gaps)",
        content: "Consumer Behavior Influenced by Behavioral Insights:\n\n{\n\n\"type\": \"pie\",\n\n\"title\": \"Influences on Consumer Decision-Making\",\n\n\"data\": {\n\n\"labels\": [\"Price Anchoring\", \"Loss Aversion\", \"Social Proof\", \"Scarcity\"],\n\n\"datasets\": [{\n\n\"label\": \"Influence %\",\n\n\"data\": [25, 30, 20, 25]\n\n}]\n\n}\n\n}"
    }
];

let output = "";
tests.forEach(test => {
    output += `--- ${test.name} ---\n`;
    const blocks = parseContentIntoBlocks(test.content);
    blocks.forEach(block => {
        output += `Type: ${block.type}\n`;
        if (block.type === "text") output += `Content: ${JSON.stringify(block.content)}\n`;
        if (block.type === "chart") output += `Data Title: ${block.data.title}\n`;
    });
    output += "\n";
});

fs.writeFileSync('f:/Actinova/actinova-ai-tutor/tmp/verify_fix_results.txt', output);
console.log("Verification results written to tmp/verify_fix_results.txt");
