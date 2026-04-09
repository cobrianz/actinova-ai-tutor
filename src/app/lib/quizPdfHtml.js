import fs from "fs";
import path from "path";
import { parseContentIntoBlocks } from "@/lib/contentBlocks";

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function loadKatexAssets() {
  const root = process.cwd();
  const katexCss = safeRead(
    path.join(root, "node_modules", "katex", "dist", "katex.min.css")
  );
  const katexJs = safeRead(
    path.join(root, "node_modules", "katex", "dist", "katex.min.js")
  );
  const autoRenderJs = safeRead(
    path.join(
      root,
      "node_modules",
      "katex",
      "dist",
      "contrib",
      "auto-render.min.js"
    )
  );

  return { katexCss, katexJs, autoRenderJs };
}

function mdToHtml(markdown) {
  // Lightweight markdown renderer (no react-dom/server; safe for Next.js route bundles).
  const src = String(markdown || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
  if (!src) return "";

  const lines = src.split("\n");
  const out = [];
  let listMode = null; // "ul" | "ol"

  const closeList = () => {
    if (listMode) out.push(`</${listMode}>`);
    listMode = null;
  };

  const inline = (text) => {
    let html = escapeHtml(text);

    // Inline code first
    html = html.replace(/`([^`]+)`/g, (_m, code) => {
      return `<code class="md-inline-code">${escapeHtml(code)}</code>`;
    });

    // Bold/italics
    html = html.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^\*\n\s][^\*\n]*?)\*/g, "<em>$1</em>");

    return html;
  };

  for (const raw of lines) {
    const line = String(raw || "");
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      closeList();
      out.push(`<hr class="md-hr" />`);
      continue;
    }

    const h3 = /^###\s+(.+)$/.exec(trimmed);
    if (h3) {
      closeList();
      out.push(`<h3 class="md-h3">${inline(h3[1])}</h3>`);
      continue;
    }

    const h2 = /^##\s+(.+)$/.exec(trimmed);
    if (h2) {
      closeList();
      out.push(`<h2 class="md-h2">${inline(h2[1])}</h2>`);
      continue;
    }

    const h1 = /^#\s+(.+)$/.exec(trimmed);
    if (h1) {
      closeList();
      out.push(`<h1 class="md-h1">${inline(h1[1])}</h1>`);
      continue;
    }

    const ul = /^[-*]\s+(.+)$/.exec(trimmed);
    if (ul) {
      if (listMode !== "ul") {
        closeList();
        listMode = "ul";
        out.push(`<ul class="md-ul">`);
      }
      out.push(`<li class="md-li">${inline(ul[1])}</li>`);
      continue;
    }

    const ol = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (ol) {
      if (listMode !== "ol") {
        closeList();
        listMode = "ol";
        out.push(`<ol class="md-ol">`);
      }
      out.push(`<li class="md-li">${inline(ol[1])}</li>`);
      continue;
    }

    closeList();
    out.push(`<p class="md-p">${inline(line)}</p>`);
  }

  closeList();
  return out.join("\n");
}

function renderTableBlock({ headers = [], rows = [], title = "" }) {
  const head =
    headers && headers.length
      ? `<thead><tr>${headers
          .map((h) => `<th>${escapeHtml(h)}</th>`)
          .join("")}</tr></thead>`
      : "";
  const body =
    rows && rows.length
      ? `<tbody>${rows
          .map(
            (r) =>
              `<tr>${(r || [])
                .map((c) => `<td>${escapeHtml(c)}</td>`)
                .join("")}</tr>`
          )
          .join("")}</tbody>`
      : "";

  return `
    <div class="block table-block">
      ${title ? `<div class="block-title">${escapeHtml(title)}</div>` : ""}
      <table class="data-table">
        ${head}
        ${body}
      </table>
    </div>
  `;
}

function renderChartAsTable(chartBlock) {
  const labels = Array.isArray(chartBlock?.data?.labels)
    ? chartBlock.data.labels
    : [];
  const datasets = Array.isArray(chartBlock?.data?.datasets)
    ? chartBlock.data.datasets
    : [];
  if (!labels.length || !datasets.length) {
    return `
      <div class="block code-block">
        <div class="block-title">Chart</div>
        <pre><code>${escapeHtml(JSON.stringify(chartBlock || {}, null, 2))}</code></pre>
      </div>
    `;
  }

  const headers = [
    "Label",
    ...datasets.map((d, i) => String(d?.label || `Series ${i + 1}`)),
  ];
  const rows = labels.map((lbl, i) => {
    const row = [String(lbl)];
    datasets.forEach((d) => {
      const val = Array.isArray(d?.data) ? d.data[i] : "";
      row.push(val == null ? "" : String(val));
    });
    return row;
  });

  return renderTableBlock({
    headers,
    rows,
    title: chartBlock?.title || "Chart (Tabular View)",
  });
}

function renderCodeBlock({ lang = "text", content = "" }) {
  return `
    <div class="block code-block">
      <div class="code-lang">${escapeHtml(lang)}</div>
      <pre><code class="language-${escapeHtml(lang)}">${escapeHtml(
    content
  )}</code></pre>
    </div>
  `;
}

function renderRichText(value) {
  const blocks = parseContentIntoBlocks(String(value || ""));

  return blocks
    .map((block) => {
      if (block.type === "chart") return renderChartAsTable(block);
      if (block.type === "table") return renderTableBlock(block);
      if (block.type === "code") return renderCodeBlock(block);
      return `<div class="block text-block">${mdToHtml(block.content)}</div>`;
    })
    .join("\n");
}

function fileSafeName(name) {
  return String(name || "assessment")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getQuizPdfFileName(quiz) {
  const title = quiz?.title || quiz?.course || "assessment";
  return `assessment_${fileSafeName(title)}.pdf`;
}

export function buildQuizPdfHtml({ quiz, userLabel = "" }) {
  const { katexCss, katexJs, autoRenderJs } = loadKatexAssets();

  const title = quiz?.title || "Assessment Paper";
  const subject = quiz?.course || "General Knowledge";
  const questionCount = Array.isArray(quiz?.questions) ? quiz.questions.length : 0;
  const createdAt = quiz?.createdAt ? new Date(quiz.createdAt) : null;

  const totalMarks = Array.isArray(quiz?.questions)
    ? quiz.questions.reduce((sum, q) => sum + Number(q?.points || 0), 0)
    : 0;

  const questionsHtml = (quiz?.questions || [])
    .map((q, idx) => {
      const points = Number(q?.points || 0);
      const options = Array.isArray(q?.options) ? q.options : [];

      return `
        <section class="question">
          <div class="q-row">
            <div class="q-num">${idx + 1}.</div>
            <div class="q-text">
              ${renderRichText(q?.text || "")}
            </div>
          </div>
          ${
            points
              ? `<div class="q-points">(${points} point${points === 1 ? "" : "s"})</div>`
              : ""
          }
          ${
            options.length
              ? `<ol class="options" type="A">
                   ${options
                     .map(
                       (opt) => `
                         <li class="opt">
                           <div class="opt-text">${renderRichText(opt)}</div>
                         </li>
                       `
                     )
                     .join("")}
                 </ol>`
              : ""
          }
        </section>
      `;
    })
    .join("\n");

  const answerKeyHtml = (quiz?.questions || [])
    .map((q, idx) => {
      const answer = Array.isArray(q?.correctAnswer)
        ? q.correctAnswer.join(", ")
        : String(q?.correctAnswer ?? "");
      return `<div class="ak-row"><span class="ak-q">${idx + 1}.</span><span class="ak-a">${escapeHtml(
        answer
      )}</span></div>`;
    })
    .join("\n");

  const createdLine = createdAt ? createdAt.toLocaleDateString() : "";
  const ownerLine = userLabel ? `${escapeHtml(userLabel)}` : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      ${katexCss || ""}
      :root {
        --primary: rgb(37, 99, 235);
        --primaryLight: rgb(239, 246, 255);
        --text: rgb(31, 41, 55);
        --textLight: rgb(107, 114, 128);
        --line: rgb(229, 231, 235);
      }
      html, body { padding: 0; margin: 0; }
      body {
        font-family: "Times New Roman", Times, serif;
        color: var(--text);
        font-size: 12.5px;
        line-height: 1.45;
        background: white;
      }
      .content {
        padding: 0;
      }
      .title {
        text-align: center;
        font-weight: 700;
        font-size: 24px;
        color: var(--primary);
        margin: 0 0 6px 0;
      }
      .subject {
        text-align: center;
        color: var(--textLight);
        font-size: 14px;
        margin: 0 0 10px 0;
      }
      .divider {
        height: 0;
        border: none;
        border-top: 1px solid var(--primary);
        margin: 0 0 14px 0;
      }
      .question {
        margin: 0 0 12px 0;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .q-row {
        display: grid;
        grid-template-columns: 18px 1fr;
        gap: 6px;
        align-items: start;
      }
      .q-num { font-weight: 700; }
      .q-text { font-weight: 700; }
      /* Keep rich blocks readable even inside bold question stems */
      .q-text .code-block,
      .q-text pre,
      .q-text code,
      .q-text .data-table,
      .q-text .block-title,
      .q-text .md-inline-code {
        font-weight: 400;
      }
      .q-points { color: var(--textLight); font-size: 11px; margin-left: 24px; margin-top: 2px; }
      .options {
        margin: 6px 0 0 24px;
        padding: 0;
      }
      .opt {
        margin: 4px 0;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .block { margin: 0; }
      .text-block :first-child { margin-top: 0; }
      .text-block :last-child { margin-bottom: 0; }
      .md-h1 { font-size: 18px; margin: 10px 0 8px 0; }
      .md-h2 { font-size: 16px; margin: 10px 0 8px 0; }
      .md-h3 { font-size: 14px; margin: 10px 0 6px 0; }
      .md-p { margin: 0 0 8px 0; }
      .md-ul, .md-ol { margin: 0 0 8px 18px; padding: 0; }
      .md-li { margin: 3px 0; }
      .md-inline-code {
        font-family: "Courier New", Courier, monospace;
        background: var(--primaryLight);
        padding: 1px 6px;
        border-radius: 6px;
        font-size: 12px;
      }
      .md-hr { border: 0; border-top: 1px solid var(--line); margin: 10px 0; }
      .code-block {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #ffffff;
        color: var(--text);
        padding: 8px 10px;
        margin: 10px 0;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .code-block pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
      .code-block code { font-family: "Courier New", Courier, monospace; font-size: 11px; }
      .code-lang {
        font-size: 10px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--textLight);
        margin-bottom: 6px;
      }
      .table-block { margin: 10px 0; break-inside: avoid; page-break-inside: avoid; }
      .block-title { font-weight: 700; color: var(--textLight); margin-bottom: 6px; }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid var(--line);
        background: white;
        border-radius: 8px;
        overflow: hidden;
      }
      .data-table th, .data-table td {
        border: 1px solid var(--line);
        padding: 6px 8px;
        text-align: left;
        vertical-align: top;
      }
      .data-table th {
        background: var(--primaryLight);
        color: var(--primary);
        font-weight: 700;
      }
      .answer-key {
        margin-top: 18px;
        padding-top: 14px;
        border-top: 1px solid var(--line);
        break-before: page;
        page-break-before: always;
      }
      .ak-grid {
        column-count: 2;
        column-gap: 20px;
      }
      .ak-row {
        break-inside: avoid;
        page-break-inside: avoid;
        display: grid;
        grid-template-columns: 28px 1fr;
        gap: 8px;
        padding: 4px 0;
        border-bottom: 1px dotted #e2e8f0;
      }
      .ak-q { font-weight: 700; color: var(--text); }
      .ak-a { font-weight: 700; color: var(--primary); }
    </style>
  </head>
  <body>
    <div class="content">
      <h1 class="title">ASSESSMENT PAPER</h1>
      <div class="subject">Subject: ${escapeHtml(subject)}</div>
      <hr class="divider" />

      ${questionsHtml || `<div class="subject">No questions found.</div>`}

      <div class="answer-key">
        <div class="subject" style="font-weight:700; color: var(--primary); font-size: 18px; margin-bottom: 10px;">ANSWER KEY</div>
        <div class="ak-grid">
          ${answerKeyHtml}
        </div>
      </div>
    </div>

    <script>${katexJs || ""}</script>
    <script>${autoRenderJs || ""}</script>
    <script>
      window.__katexDone = false;
      try {
        if (typeof renderMathInElement === "function") {
          renderMathInElement(document.body, {
            delimiters: [
              {left: "\\\\[", right: "\\\\]", display: true},
              {left: "$$", right: "$$", display: true},
              {left: "\\\\(", right: "\\\\)", display: false},
              {left: "$", right: "$", display: false}
            ],
            throwOnError: false,
            strict: false,
            ignoredTags: ["script","noscript","style","textarea","pre","code"]
          });
        }
      } catch (e) {}
      window.__katexDone = true;
    </script>
  </body>
</html>`;
}
