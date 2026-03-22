
const blockRegex = /```(\w+)?\s*\n([\s\S]*?)```/g;

const testContent1 = "Here is a chart:\n```chart\n{\"type\": \"bar\", \"data\": {}}\n```\nEnd.";
const testContent2 = "Here is a chart without newline:\n```chart{\"type\": \"bar\", \"data\": {}}\n```\nEnd.";
const testContent3 = "Here is a chart with space but no newline:\n```chart {\"type\": \"bar\", \"data\": {}}\n```\nEnd.";

console.log("Test 1 (Standard):", !!testContent1.match(blockRegex));
console.log("Test 2 (No newline):", !!testContent2.match(blockRegex));
console.log("Test 3 (Space, no newline):", !!testContent3.match(blockRegex));

const improvedRegex = /```(\w+)?\s*([\s\S]*?)```/g;
console.log("\nImproved Regex:");
console.log("Test 1:", !!testContent1.match(improvedRegex));
console.log("Test 2:", !!testContent2.match(improvedRegex));
console.log("Test 3:", !!testContent3.match(improvedRegex));

const match2 = improvedRegex.exec(testContent2);
if (match2) {
    console.log("Match 2 Lang:", match2[1]);
    console.log("Match 2 Code:", match2[2]);
}
