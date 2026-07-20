import katex from "katex";
import "katex/dist/katex.min.css";
import { parseContentIntoBlocks } from "@/lib/contentBlocks";
import { highlightToHtml } from "@/lib/syntaxHighlighter";

const mathCommandPattern =
  /\\(?:frac|sum|int|lim|alpha|beta|gamma|delta|pi|theta|phi|omega|sqrt|cdot|times|le|ge|approx|neq|pm|mp|infty|partial|left|right|text|begin|end|overline|underline|vec|hat|bar)/i;
const mathSymbolPattern = /(?:\^|_|=|[+\-*/]=?|[<>]=?|\\%|\\times|\\cdot|\\div|\\pm|\\mp)/;
const plainSentencePattern = /[A-Za-z]{3,}\s+[A-Za-z]{3,}/;
const currencyLikePattern = /(?:^|[\s,(])\d{1,3}(?:,\d{3})+(?:\.\d+)?(?:[\s,.)]|$)/;

const shouldRenderAsMath = (equation, { displayMode = false } = {}) => {
  const trimmed = equation.trim();
  if (!trimmed) return false;

  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const hasMathCommands = mathCommandPattern.test(trimmed);
  const hasMathSymbols = mathSymbolPattern.test(trimmed);
  const hasStructuredMath =
    /[{}[\]]/.test(trimmed) ||
    /(?:^|[^A-Za-z])\d+\s*(?:[+\-*/=<>^_]|\\times|\\cdot|\\div)/.test(trimmed) ||
    /(?:[+\-*/=<>^_]|\\times|\\cdot|\\div)\s*\d+/.test(trimmed);
  const looksLikeSentence = plainSentencePattern.test(trimmed);
  const isMostlyWords = !/\d/.test(trimmed) && wordCount > 2;
  const isCurrencyOrNumberPhrase =
    currencyLikePattern.test(trimmed) && !hasMathCommands && !hasMathSymbols;

  if (hasMathCommands) return true;
  if (!hasMathSymbols && !hasStructuredMath) return false;
  if (!displayMode && looksLikeSentence && wordCount > 3 && !hasMathCommands) return false;
  if (isMostlyWords || isCurrencyOrNumberPhrase) return false;
  return true;
};

const escapeHtmlText = (text) => {
  if (!text) return "";
  return String(text)
    .replace(/&(?!(?:[a-zA-Z]+|#\d+);)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

export function renderContent(content) {
  if (!content) return "";

  let html = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  const rawNlCount = (html.match(/\n/g) || []).length;
  const escapedNlCount = (html.match(/\\n/g) || []).length;
  if (escapedNlCount > 3 && escapedNlCount > rawNlCount * 2) {
    html = html
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t");
  }

  const fenceCount = (html.match(/```/g) || []).length;
  if (fenceCount % 2 === 1) {
    const lastOpenIdx = html.lastIndexOf("```");
    const fenceLineEnd =
      lastOpenIdx >= 0 ? html.indexOf("\n", lastOpenIdx) : -1;
    const codeStartIdx =
      fenceLineEnd === -1 ? html.length : Math.min(html.length, fenceLineEnd + 1);
    const afterFence = html.slice(codeStartIdx);

    const markerRegex = /(?:\r?\n|^)[ \t]*(#{1,6}\s+|-{3,}\s*$)/m;
    const marker = markerRegex.exec(afterFence);

    const isProbablyProseLine = (line) => {
      if (!line) return false;
      if (/^\s/.test(line)) return false;
      const t = line.trim();
      if (!t) return false;
      if (/^```/.test(t)) return false;
      if (/^(#{1,6}\s+|[-*]\s+|\d+\.\s+|>\s+)/.test(t)) return false;
      if (/^(import|package|public|private|protected|class|interface|enum|return|for|while|if|else|try|catch|finally|switch)\b/i.test(t)) return false;
      if (/^(\/\/|\/\*|\*\/|\*)/.test(t)) return false;
      if (/[{};=()<>[\]]/.test(t)) return false;
      return /[A-Za-z]{3,}/.test(t);
    };

    let insertAt = null;
    {
      const lines = afterFence.split("\n");
      let offset = 0;
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        const next = lines[i + 1];
        offset += line.length + 1;
        if (line.trim() === "" && isProbablyProseLine(next)) {
          insertAt = codeStartIdx + offset;
          break;
        }
      }
    }

    if (insertAt == null && marker) {
      insertAt = codeStartIdx + marker.index;
    }

    if (insertAt != null && lastOpenIdx >= 0) {
      html = `${html.slice(0, insertAt)}\n\`\`\`\n${html.slice(insertAt)}`;
    } else {
      html += "\n```";
    }
  }

  const codeBlocks = [];
  html = html.replace(/```(\w+)?\s*([\s\S]*?)```/g, (match, lang, code) => {
    if (lang === "math" || lang === "latex" || lang === "tex") {
      try {
        const rendered = katex.renderToString(code.trim(), {
          displayMode: true,
          throwOnError: false,
          output: "html"
        });
        return `<div class="my-6 p-4 text-foreground overflow-x-auto font-sans">${rendered}</div>`;
      } catch (e) {
        return `<div class="my-4 p-4 bg-destructive/10 rounded-lg text-destructive">LaTeX Error: ${code.trim()}</div>`;
      }
    }

    const placeholder = `___CODEBLOCK_${codeBlocks.length}___`;
    const pureCode = code.trim();
    const encodedCode = btoa(encodeURIComponent(pureCode).replace(/%([0-9A-F]{2})/g,
      (match, p1) => String.fromCharCode('0x' + p1)));

    const highlightedCode = highlightToHtml(pureCode, lang || "javascript");
    codeBlocks.push(
      `<div class="relative group my-6">
         <div class="absolute right-3 top-3 z-10">
           <button class="copy-code-btn p-1.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-border shadow-sm hover:bg-white dark:hover:bg-slate-700 transition-colors" data-code="${encodedCode}" title="Copy code">
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
           </button>
         </div>
         <pre class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg overflow-x-auto border border-border font-mono m-0"><code class="text-sm font-mono language-${lang || "plaintext"}">${highlightedCode}</code></pre>
       </div>`
    );
    return placeholder;
  });

  const inlineCodes = [];
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    const placeholder = `___INLINECODE_${inlineCodes.length}___`;
    inlineCodes.push(
      `<code class="bg-muted px-2 py-0.5 rounded text-sm font-mono text-primary">${escapeHtmlText(code)}</code>`
    );
    return placeholder;
  });

  html = escapeHtmlText(html);

  html = html.replace(
    /!\[([^\]]*)\]\(([^)\s]+(?:\([^)]*\)[^)\s]*)*)\)/g,
    (match, alt, url) => {
      const cleanUrl = url.trim();
      return `<div class="my-4 flex justify-center"><img src="${cleanUrl}" alt="${alt}" class="max-w-full h-auto rounded-lg shadow-md" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\"text-destructive p-4 bg-destructive/10 rounded-lg\\">Failed to load image: ${alt}</div>'" /></div>`;
    }
  );

  html = html.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (match, equation) => {
      const trimmed = equation.trim();
      if (!shouldRenderAsMath(trimmed, { displayMode: true })) {
        const plainText = trimmed.replace(/\\\$/g, '$');
        return `<div class="my-4 font-serif text-lg leading-relaxed">${plainText}</div>`;
      }
      try {
        const rendered = katex.renderToString(trimmed, {
          displayMode: true,
          throwOnError: false,
          output: 'html'
        });
        return `<div class="my-6 p-4 text-foreground overflow-x-auto font-sans">${rendered}</div>`;
      } catch (e) {
        return `<div class="my-4 p-4 bg-destructive/10 rounded-lg text-destructive">LaTeX Error: ${equation}</div>`;
      }
    }
  );

  html = html.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (match, equation) => {
      const trimmed = equation.trim();
      if (!shouldRenderAsMath(trimmed)) {
        const plainText = trimmed.replace(/\\\$/g, '$');
        return `<span>${plainText}</span>`;
      }
      try {
        const rendered = katex.renderToString(trimmed, {
          displayMode: false,
          throwOnError: false,
          output: 'html',
          strict: false
        });
        return `<span class="inline-block align-middle mx-1">${rendered}</span>`;
      } catch (e) {
        return `<span class="text-destructive text-xs">LaTeX Error: ${equation}</span>`;
      }
    }
  );

  html = html.replace(
    /\$\$([\s\S]*?)\$\$/g,
    (match, equation) => {
      const trimmed = equation.trim();
      if (!shouldRenderAsMath(trimmed, { displayMode: true })) {
        const plainText = trimmed.replace(/\\\$/g, "$");
        return `<div class="my-4 font-serif text-lg leading-relaxed">${plainText}</div>`;
      }
      try {
        const rendered = katex.renderToString(trimmed, {
          displayMode: true,
          throwOnError: false,
          output: 'html'
        });
        return `<div class="my-6 p-4 text-foreground overflow-x-auto font-sans">${rendered}</div>`;
      } catch (e) {
        return `<div class="my-4 p-4 bg-destructive/10 rounded-lg text-destructive">LaTeX Error: ${equation}</div>`;
      }
    }
  );

  html = html.replace(
    /\$([^\$\n]+?)\$/g,
    (match, equation) => {
      const trimmed = equation.trim();
      if (/^\d+(?:\.\d{2})?$/.test(trimmed)) return match;
      if (!shouldRenderAsMath(trimmed)) return match;
      try {
        const rendered = katex.renderToString(trimmed, {
          displayMode: false,
          throwOnError: false,
          output: 'html',
          strict: false
        });
        return `<span class="inline-block align-middle mx-1">${rendered}</span>`;
      } catch (e) {
        return `<span class="text-destructive text-xs">LaTeX Error: ${equation}</span>`;
      }
    }
  );

  html = html.replace(/^\s*#+\s+(?:Module|Lesson|Course|Topic)\s*:\s*$/gim, "");
  html = html.replace(/^\s*(?:Module|Lesson|Course|Topic)\s*:\s*$/gim, "");
  html = html.replace(/^([ \t]*#)\s+(?:Module|Lesson|Course|Topic)\s+\d+\s*:\s*(.+)$/gim, "$1 $2");
  html = html.replace(/^([ \t]*)(?:Module|Lesson|Course|Topic)\s+\d+\s*:\s*(.+)$/gim, "$1$2");

  html = html.replace(
    /^[ \t]*# (.+)$/gm,
    '<h1 class="text-3xl lg:text-5xl font-black font-serif text-foreground mb-4 mt-4">$1</h1>'
  );
  html = html.replace(
    /^[ \t]*## (.*$)/gm,
    '<h2 class="text-2xl lg:text-4xl font-bold font-serif text-foreground mb-3 mt-3">$1</h2>'
  );
  html = html.replace(
    /^[ \t]*### (.*$)/gm,
    '<h3 class="text-xl lg:text-3xl font-bold font-serif text-foreground/90 mb-2 mt-3">$1</h3>'
  );
  html = html.replace(
    /^[ \t]*#### (.*$)/gm,
    '<h4 class="text-lg lg:text-2xl font-bold font-serif text-foreground/90 mb-2 mt-2.5">$1</h4>'
  );
  html = html.replace(
    /^[ \t]*##### (.*$)/gm,
    '<h5 class="text-md lg:text-xl font-bold font-serif text-foreground/90 mb-1 mt-2">$1</h5>'
  );
  html = html.replace(
    /^[ \t]*###### (.*$)/gm,
    '<h6 class="text-sm lg:text-lg font-bold font-serif text-foreground/80 mb-1 mt-2">$1</h6>'
  );

  html = html.replace(
    /^> (.*$)/gm,
    '<blockquote class="border-l-4 border-primary pl-4 py-2 my-6 bg-secondary font-serif italic rounded-r text-foreground/80 lg:text-xl">$1</blockquote>'
  );

  html = html.replace(
    /\*\*([\s\S]+?)\*\*/g,
    '<strong class="font-bold font-serif text-foreground">$1</strong>'
  );
  html = html.replace(
    /<b>([\s\S]+?)<\/b>/g,
    '<b class="font-bold font-serif text-foreground">$1</b>'
  );

  html = html.replace(
    /\*([^\*\n\s][^\*\n]*?)\*/g,
    '<em class="italic font-serif text-foreground/90">$1</em>'
  );

  const lines = html.split("\n");
  let processedHtml = [];
  let listStack = [];
  const blankSpacer = '<div class="h-1"></div>';

  const closeList = () => {
    if (listStack.length > 0) {
      const type = listStack.pop();
      processedHtml.push(type === 'ol' ? '</ol>' : '</ul>');
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      let nextMeaningfulLine = "";
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim()) {
          nextMeaningfulLine = lines[j].trim();
          break;
        }
      }
      const nextIsList = /^(\d+\.\s+|[-•*]\s+)/.test(nextMeaningfulLine);
      if (!nextIsList) closeList();
      if (processedHtml[processedHtml.length - 1] !== blankSpacer) {
        processedHtml.push(blankSpacer);
      }
      continue;
    }

    const olMatch = line.match(/^(\d+)\.\s+(.*)$/);
    const ulMatch = line.match(/^([-•*])\s+(.*)$/);

    if (olMatch) {
      if (listStack[listStack.length - 1] !== 'ol') {
        closeList();
        processedHtml.push('<ol class="list-decimal list-outside mb-6 space-y-4 font-serif text-[1.05rem] lg:text-xl text-foreground/80 ml-10">');
        listStack.push('ol');
      }
      processedHtml.push(`<li class="pl-3">${olMatch[2]}</li>`);
    } else if (ulMatch) {
      if (listStack[listStack.length - 1] !== 'ul') {
        closeList();
        processedHtml.push('<ul class="list-disc list-outside mb-6 space-y-3 font-serif text-[1.05rem] lg:text-xl text-foreground/80 ml-10">');
        listStack.push('ul');
      }
      processedHtml.push(`<li class="pl-3">${ulMatch[2]}</li>`);
    } else {
      if (line.match(/^\s*[-*_]{3,}\s*$/)) {
        closeList();
        processedHtml.push('<hr class="my-8 border-t-2 border-primary/20 hidden" />');
      } else if (listStack.length > 0) {
        processedHtml.push(`<div class="mt-2 mb-4 pl-3 opacity-90 font-serif text-[1.02rem] lg:text-lg leading-relaxed">${line}</div>`);
      } else if (line.startsWith('<h') || line.startsWith('<blockquote') || line.startsWith('<hr')) {
        processedHtml.push(line);
      } else {
        processedHtml.push(`<p class="mb-5 text-foreground/90 leading-relaxed font-serif text-[1.05rem] lg:text-xl lg:leading-loose">${line}</p>`);
      }
    }
  }
  closeList();
  html = processedHtml.join("\n");

  codeBlocks.forEach((block, i) => {
    html = html.replace(`___CODEBLOCK_${i}___`, block);
  });

  inlineCodes.forEach((code, i) => {
    html = html.replace(`___INLINECODE_${i}___`, code);
  });

  return html;
}

function lessonBlockToJSX(block, idx, opts = {}) {
  const { LessonChart, LessonTable, streaming } = opts;

  if (streaming && block.type === "code" && (block.lang === "chart" || block.lang === "table")) {
    return null;
  }
  if (block.type === "chart") {
    return (
      <div key={`chart-${idx}`} id={`visual-chart-${idx}`} className="visual-block-wrapper">
        <LessonChart type={block.chartType} data={block.data} title={block.title} />
      </div>
    );
  }
  if (block.type === "table") {
    return (
      <div key={`table-${idx}`} id={`visual-table-${idx}`} className="visual-block-wrapper">
        <LessonTable headers={block.headers} rows={block.rows} title={block.title} />
      </div>
    );
  }
  return (
    <div
      key={`block-${idx}`}
      dangerouslySetInnerHTML={{
        __html: renderContent(
          block.type === "code"
            ? `\`\`\`${block.lang}\n${block.content}\n\`\`\``
            : block.content
        ),
      }}
    />
  );
}

export function renderLessonBlocks(content, { streaming = false, LessonChart, LessonTable } = {}) {
  return parseContentIntoBlocks(content).flatMap((block, idx) => {
    return [lessonBlockToJSX(block, idx, { streaming, LessonChart, LessonTable })].filter(Boolean);
  });
}
