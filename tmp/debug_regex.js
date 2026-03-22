
const blockRegex = /^\s*```(\w+)?\s*([\s\S]*?)```/gm;

const content = `# Module: Intro
## Lesson: History

Some text.

\`\`\`javascript
const x = 1;
\`\`\`

More text.

\`\`\`chart
{"type": "bar"}
\`\`\`

Final text.`;

let match;
let lastIndex = 0;
while ((match = blockRegex.exec(content)) !== null) {
    console.log("Found Match at", match.index);
    const textBefore = content.substring(lastIndex, match.index);
    console.log("Text Before (length):", textBefore.length);
    console.log("Text Before (start):", JSON.stringify(textBefore.substring(0, 20)));
    
    console.log("Lang:", match[1]);
    console.log("Code:", JSON.stringify(match[2]));
    
    lastIndex = blockRegex.lastIndex;
}

const final = content.substring(lastIndex);
console.log("Final Text (length):", final.length);
console.log("Final Text (start):", JSON.stringify(final.substring(0, 20)));
