/**
 * Shared parser to identify structural blocks (charts, tables, code, text)
 *
 * Kept separate from pdfUtils so normal lesson rendering does not pull heavy PDF assets.
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
      const lines = tableContent.split("\n").filter((l) => l.trim().startsWith("|"));
      if (lines.length >= 3) {
        const headers = lines[0]
          .split("|")
          .filter((s) => s.trim())
          .map((s) => s.trim());
        const rows = lines
          .slice(2)
          .map((line) => line.split("|").filter((s) => s.trim()).map((s) => s.trim()));
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
          const data = pairs.map((p) => {
            const parts = p.match(/\((-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\)/);
            return { x: parseFloat(parts[1]), y: parseFloat(parts[2]) };
          });
          datasets.push({
            label:
              datasets.length === 0
                ? ylabelMatch
                  ? ylabelMatch[1]
                  : "Y-Axis"
                : `Plot ${datasets.length + 1}`,
            data: data.map((d) => d.y),
            labels: data.map((d) => d.x),
          });
        }
      }
      if (datasets.length > 0) {
        blocks.push({
          type: "chart",
          chartType: "line",
          data: {
            labels: datasets[0].labels,
            datasets: datasets.map((d) => ({ label: d.label, data: d.data })),
          },
          title: xlabelMatch
            ? `${xlabelMatch[1]} vs ${ylabelMatch ? ylabelMatch[1] : ""}`
            : "Tactical Data Visualization",
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

    const visualMatches = [];

    const tikzRegex = /\\begin\{tikzpicture\}([\s\S]*?)\\end\{tikzpicture\}/g;
    let m;
    while ((m = tikzRegex.exec(text)) !== null) {
      visualMatches.push({ type: "tikz", content: m[1], full: m[0], index: m.index });
    }

    const startRegex = /(?:^|\n)[ \t]*(?:chart\s*\n+)?([ \t]*\{)/g;
    let nMatch;
    while ((nMatch = startRegex.exec(text)) !== null) {
      const startIndex = nMatch.index + (nMatch[0].length - nMatch[1].length);
      let balance = 0;
      let foundEnd = false;
      let i = startIndex;

      for (; i < text.length; i++) {
        if (text[i] === "{") balance++;
        else if (text[i] === "}") {
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
        if (
          potentialJson.includes('"type"') &&
          (potentialJson.includes('"data"') || potentialJson.includes('"datasets"'))
        ) {
          visualMatches.push({
            type: "nakedChart",
            content: potentialJson,
            full: text.substring(nMatch.index, i),
            index: nMatch.index,
          });
          startRegex.lastIndex = i;
        }
      }
    }

    visualMatches.sort((a, b) => a.index - b.index);
    let lastIdx = 0;
    visualMatches.forEach((vMatch) => {
      const beforeText = text.substring(lastIdx, vMatch.index);
      if (beforeText.trim()) extractTablesFromText(beforeText);

      if (vMatch.type === "tikz") {
        processTikzBlock(vMatch.content, vMatch.full);
      } else if (vMatch.type === "nakedChart") {
        try {
          const code = vMatch.content.trim();
          let cleanedCode = code;
          cleanedCode = cleanedCode.replace(/,\s*([\}\]])/g, "$1");
          const sanitizedCode = cleanedCode.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
          const chartData = JSON.parse(sanitizedCode);
          blocks.push({
            type: "chart",
            chartType: chartData.type || "bar",
            data: chartData.data,
            title: chartData.title || "Interactive Data Chart",
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

    if (lang === "chart") {
      try {
        let cleanedCode = code.trim();
        cleanedCode = cleanedCode.replace(/,\s*([\}\]])/g, "$1");
        const sanitizedCode = cleanedCode.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
        const chartData = JSON.parse(sanitizedCode);
        blocks.push({
          type: "chart",
          chartType: chartData.type || "bar",
          data: chartData.data,
          title: chartData.title || "Interactive Data Chart",
        });
      } catch (e) {
        // During generation/streaming, chart JSON can be incomplete. Avoid noisy console errors;
        // callers may choose to hide these fallback blocks until the JSON is complete.
        blocks.push({ type: "code", lang: "chart", content: code });
      }
    } else if (lang === "table") {
      try {
        const tableData = JSON.parse(code);
        blocks.push({
          type: "table",
          headers: tableData.headers,
          rows: tableData.rows,
          title: tableData.title,
        });
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
