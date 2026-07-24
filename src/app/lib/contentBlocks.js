/**
 * Shared parser to identify structural blocks (charts, tables, code, text)
 *
 * Kept separate from pdfUtils so normal lesson rendering does not pull heavy PDF assets.
 */

/**
 * Parse YAML-style chart definitions into a chart block.
 * Handles formats like:
 *   Chart Title
 *   type: line
 *   data:
 *     labels: ["Jan", "Feb"]
 *     datasets:
 *       - label: "Series"
 *         data: [1, 2]
 */
function parseYamlChart(text) {
  const typeMatch = text.match(/\btype:\s*(line|bar|pie|doughnut|scatter)\b/i);
  if (!typeMatch) return null;
  const chartType = typeMatch[1].toLowerCase();

  // Title: line before "type:" that isn't a YAML key
  const lines = text.split("\n");
  const typeLineIdx = lines.findIndex((l) => /^\s*type:\s*/i.test(l));
  let title = "Chart";
  if (typeLineIdx > 0) {
    for (let i = typeLineIdx - 1; i >= 0; i--) {
      const candidate = lines[i].trim();
      if (!candidate) break;
      if (/^(type|data|labels|datasets):\s*/i.test(candidate)) break;
      title = candidate;
      break;
    }
  }

  // Labels
  const labelsMatch = text.match(/labels:\s*\[([^\]]*)\]/);
  const labels = labelsMatch ? labelsMatch[1].split(",").map((s) => s.trim().replace(/^"|"$/g, "")) : [];

  // Datasets
  const datasets = [];
  const dsMatches = [...text.matchAll(/- label:\s*"([^"]*)"\s*\ndata:\s*\[([^\]]*)\]/g)];
  for (const ds of dsMatches) {
    datasets.push({
      label: ds[1],
      data: ds[2].split(",").map((v) => parseFloat(v.trim()) || 0),
    });
  }

  // Simple labels + data (no datasets)
  if (datasets.length === 0 && labels.length > 0) {
    const dataMatch = text.match(/data:\s*\[([^\]]*)\]/);
    if (dataMatch) {
      datasets.push({
        label: title,
        data: dataMatch[1].split(",").map((v) => parseFloat(v.trim()) || 0),
      });
    }
  }

  if (labels.length === 0 || datasets.length === 0) return null;
  return { type: "chart", chartType, data: { labels, datasets }, title };
}

export const parseContentIntoBlocks = (content) => {
  let normalizedContent = (content || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  // Normalize escaped newlines (literal "\n" strings from DB)
  if ((normalizedContent.match(/\\n/g) || []).length > 0) {
    normalizedContent = normalizedContent.replace(/\\n/g, "\n");
  }

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

    // Detect YAML-style chart blocks by scanning line-by-line
    // Looks for "type: line|bar|..." lines and extracts the surrounding block
    const yamlTypeRegex = /\btype:\s*(line|bar|pie|doughnut|scatter)\b/gi;
    let ym;
    while ((ym = yamlTypeRegex.exec(text)) !== null) {
      const afterType = text.substring(ym.index);
      // Find the end of this YAML chart block (next blank line, heading, or end of text)
      const endMatch = afterType.match(/\n\n|\n#{1,6}\s/);
      const blockEnd = endMatch ? ym.index + endMatch.index + endMatch[0].length : text.length;
      // Look backwards for title
      const beforeType = text.substring(0, ym.index);
      const lastNewlineBefore = beforeType.lastIndexOf("\n");
      let blockStart = lastNewlineBefore + 1;
      if (blockStart > 0) {
        const prevLine = text.substring(text.lastIndexOf("\n", lastNewlineBefore - 1) + 1, lastNewlineBefore).trim();
        if (prevLine && !/^(type|data|labels|datasets):\s*/i.test(prevLine) && prevLine.length < 200) {
          blockStart = text.lastIndexOf("\n", lastNewlineBefore - 1) + 1;
        }
      }

      const fullBlock = text.substring(blockStart, blockEnd).trim();
      const chartType = ym[1].toLowerCase();
      const labelsMatch = fullBlock.match(/labels:\s*\[([^\]]*)\]/);
      const labels = labelsMatch ? labelsMatch[1].split(",").map((s) => s.trim().replace(/^"|"$/g, "")) : [];

      const datasets = [];
      const dsMatches = [...fullBlock.matchAll(/- label:\s*"([^"]*)"\s*\ndata:\s*\[([^\]]*)\]/g)];
      for (const ds of dsMatches) {
        datasets.push({
          label: ds[1],
          data: ds[2].split(",").map((v) => parseFloat(v.trim()) || 0),
        });
      }

      if (datasets.length === 0 && labels.length > 0) {
        const dataMatch = fullBlock.match(/data:\s*\[([^\]]*)\]/);
        if (dataMatch) {
          const lines = fullBlock.split("\n");
          const typeIdx = lines.findIndex((l) => /^\s*type:/i.test(l));
          const titleLine = typeIdx > 0 ? lines[typeIdx - 1]?.trim() : "";
          const title = titleLine && !/^(type|data|labels|datasets):/i.test(titleLine) ? titleLine : "Chart";
          datasets.push({ label: title, data: dataMatch[1].split(",").map((v) => parseFloat(v.trim()) || 0) });
        }
      }

      if (labels.length > 0 && datasets.length > 0) {
        const titleLine2 = fullBlock.split("\n").find((l) => l.trim() && !/^(type|data|labels|datasets|[\s]*-)/i.test(l.trim()));
        visualMatches.push({
          type: "yamlChart",
          chartType,
          data: { labels, datasets },
          title: titleLine2?.trim() || "Chart",
          full: fullBlock,
          index: blockStart,
          end: blockEnd,
        });
      }
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
      } else if (vMatch.type === "yamlChart") {
        blocks.push({
          type: "chart",
          chartType: vMatch.chartType,
          data: vMatch.data,
          title: vMatch.title,
        });
      }
      lastIdx = vMatch.end || (vMatch.index + (vMatch.full || "").length);
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
        // Try YAML-style chart parsing as fallback
        const yamlChart = parseYamlChart(code);
        if (yamlChart) {
          blocks.push(yamlChart);
        } else {
          blocks.push({ type: "code", lang: "chart", content: code });
        }
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
