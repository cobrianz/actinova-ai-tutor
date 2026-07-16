# Design Document: Chat with PDF

## Overview

The "Chat with PDF" feature lets users upload a PDF document directly in the browser, extract its text client-side (using pdf.js for native text-layer PDFs and Tesseract.js for scanned/image-only pages), and have a grounded AI conversation about that content. No binary PDF data or raw extracted text is ever persisted server-side beyond the single API call that forwards a truncated excerpt for context. The feature integrates into the existing dashboard as a new `chat-pdf` tab, following every visual and architectural convention already established by `Chat.jsx`.

---

## 1. Architecture Overview

### Component Diagram

```mermaid
graph TD
    subgraph Browser
        UI[ChatWithPDF.jsx<br/>PDF_Chat_UI]
        EXT[pdfExtractor.js<br/>PDF_Extractor]
        SS[(sessionStorage<br/>PDF_Session)]
        PDFJS[pdfjs-dist<br/>Text_Layer_Parser]
        TESS[tesseract.js<br/>OCR_Engine]
    end

    subgraph Next.js Server
        API[/api/chat/pdf<br/>PDF_Chat_API]
        MW[combineMiddleware<br/>withErrorHandling · withCsrf · withAuth]
        AI[OpenAI gpt-4o-mini]
    end

    USER((User)) -->|drag-drop / pick file| UI
    UI -->|File object| EXT
    EXT -->|pdf.js getDocument| PDFJS
    PDFJS -->|text per page| EXT
    EXT -->|low-char pages → canvas| TESS
    TESS -->|OCR text per page| EXT
    EXT -->|progress callbacks| UI
    EXT -->|Extracted_Text| UI
    UI -->|persist session| SS
    SS -->|restore on tab return| UI

    UI -->|POST {message, history, extractedText}| MW
    MW --> API
    API -->|system prompt + messages| AI
    AI -->|response text| API
    API -->|{success, response}| UI
```

### Data Flow Summary

| Stage | Where it happens | What moves |
|---|---|---|
| File selection | Browser | `File` object (never leaves client) |
| Text extraction | Browser (`pdfExtractor.js`) | `Extracted_Text` string built in memory |
| Session persistence | Browser (`sessionStorage`) | `{extractedText, messages, fileName}` JSON |
| AI request | Client → `/api/chat/pdf` | `{message, conversationHistory[6], extractedText[≤12 000 chars]}` |
| AI response | Server → Client | `{success, response}` JSON |

**What stays client-only**: the binary PDF, full `Extracted_Text`, the full `messages` array, and all `sessionStorage` data.  
**What hits the server**: the user's chat message, last 6 conversation turns (role/content only), and a ≤ 12 000-char excerpt of `Extracted_Text`.

---

## 2. Component Design — `ChatWithPDF.jsx`

### File location
`src/app/components/ChatWithPDF.jsx`

### High-level layout

```
ChatWithPDF (root, "use client")
├── UpgradeModal          — credit gate, rendered at root level
├── ConfirmModal          — replace-session confirmation
│
├── [phase: upload]       — shown when no file loaded yet
│   ├── DropZone          — drag-and-drop + file picker button
│   ├── ErrorBanner       — MIME / size / corrupt / password errors
│   └── PrivacyNotice     — "stored locally only" disclosure
│
├── [phase: extracting]   — shown during pdf.js / OCR processing
│   ├── ProgressRegion    — aria-live="polite" extraction progress
│   └── CancelButton      — aborts extraction, resets to upload
│
├── [phase: chat]         — shown after successful extraction
│   ├── FileInfoBar       — filename, size, "Change PDF" button
│   ├── TruncationBanner  — shown when extractedText > 12 000 chars
│   ├── LowTextBanner     — shown when extractedText < 50 chars
│   ├── MessagesArea      — scrollable, aria-live="polite"
│   │   ├── EmptyState    — prompt when messages === []
│   │   └── Message[]     — user + AI bubbles via renderFormattedContent
│   ├── ThreeDotLoader    — shown while isSending
│   └── InputBar          — textarea + Send button + Clear Chat
│
└── aria-live="assertive" — extraction error announcements (hidden div)
```

### State shape

```javascript
// All state lives in React component state — nothing in Redux / context
const [phase, setPhase] = useState("upload");
// "upload" | "extracting" | "chat"

// --- Upload phase ---
const [dragOver, setDragOver] = useState(false);
const [uploadError, setUploadError] = useState(null);
// null | { type: "mime"|"size"|"password"|"corrupt"|"empty", message: string }

// --- File metadata (set once file is accepted) ---
const [fileName, setFileName] = useState("");
const [fileSizeMB, setFileSizeMB] = useState(0);

// --- Extraction phase ---
const [extractionProgress, setExtractionProgress] = useState({ current: 0, total: 0, mode: "text" });
// mode: "text" | "ocr"

// --- Chat phase ---
const [extractedText, setExtractedText] = useState("");
const [messages, setMessages] = useState([]);          // max 50 items
const [input, setInput] = useState("");
const [isSending, setIsSending] = useState(false);
const [showTruncationBanner, setShowTruncationBanner] = useState(false);
const [showLowTextBanner, setShowLowTextBanner] = useState(false);

// --- Modals ---
const [showUpgradeModal, setShowUpgradeModal] = useState(false);
const [showReplaceModal, setShowReplaceModal] = useState(false);
const [pendingFile, setPendingFile] = useState(null);  // File awaiting confirmation

// --- Session ---
const [sessionId] = useState(() => crypto.randomUUID());

// --- Refs ---
const fileInputRef = useRef(null);
const messagesEndRef = useRef(null);
const latestMessageRef = useRef(null);  // for focus on AI response
const errorRegionRef = useRef(null);    // for refocus on extraction error
```

### Key behaviour hooks

| Hook / effect | Trigger | Action |
|---|---|---|
| `useEffect` | `messages` changes | `messagesEndRef.current?.scrollIntoView({ behavior:"smooth" })` + `latestMessageRef.current?.focus()` |
| `useEffect` | `phase === "chat"` on mount | Restore session from `sessionStorage[sessionId]` if present |
| `useEffect` | `messages` or `extractedText` changes | Persist `{extractedText, messages, fileName}` to `sessionStorage[sessionId]` |
| `useEffect` | component mount | Register `beforeunload` listener → remove `sessionStorage[sessionId]` |
| `useEffect` | `uploadError` set | `errorRegionRef.current?.focus()` |

### Credit gate

```javascript
const { user, loading: authLoading, hasPurchased } = useAuth();

// At send time and on mount:
if (!hasPurchased('course_generation')) {
  setShowUpgradeModal(true);
  return;
}
```

### `renderFormattedContent` — reuse from Chat.jsx verbatim

The same inline function (bold, italic, inline code, newline → `<br>`) is copied into `ChatWithPDF.jsx` without modification. Output is injected via `dangerouslySetInnerHTML={createSafeHTMLFragment(...)}`.

### Three-dot loading indicator

```jsx
{isSending && (
  <div className="flex gap-5">
    <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center shrink-0">
      <Bot size={16} className="text-white" />
    </div>
    <div className="flex items-center gap-1.5 mt-3">
      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
    </div>
  </div>
)}
```

### Message cap

```javascript
const addMessage = (msg) => {
  setMessages(prev => {
    const next = [...prev, msg];
    return next.length > 50 ? next.slice(next.length - 50) : next;
  });
};
```

---

## 3. `pdfExtractor.js` Module Design

### File location
`src/app/lib/pdfExtractor.js`

### Exported API

```javascript
/**
 * Extract text from a PDF File object.
 *
 * @param {File}     file         - The PDF File from the file picker / drop zone
 * @param {object}   callbacks    - Progress and lifecycle callbacks (see below)
 * @returns {Promise<string>}     - Resolves with the full Extracted_Text string
 * @throws  {PdfExtractorError}   - Typed errors: "password", "corrupt", "page_limit"
 */
export async function extractPdfText(file, callbacks = {}) { ... }

/**
 * @typedef {object} ExtractCallbacks
 * @property {(current: number, total: number) => void} onTextProgress
 *   Called after each page processed by pdf.js.
 *   current = 1-based page index, total = document page count.
 *
 * @property {(pageIndex: number, total: number) => void} onOcrProgress
 *   Called before OCR starts on each image-only page.
 *   pageIndex = 1-based page number within the full document.
 *
 * @property {(extractedText: string) => void} onComplete
 *   Called once all pages are processed, with the full concatenated text.
 */

/**
 * Custom error class for typed extraction failures.
 * error.type: "password" | "corrupt" | "page_limit" | "ocr_runtime"
 */
export class PdfExtractorError extends Error { ... }
```

### Internal algorithm

```
extractPdfText(file, callbacks):

  1. ArrayBuffer ← file.arrayBuffer()
  2. pdf ← pdfjsLib.getDocument({ data: ArrayBuffer }).promise
       CATCH PasswordException → throw PdfExtractorError("password")
       CATCH InvalidPDFException  → throw PdfExtractorError("corrupt")

  3. IF pdf.numPages > 500 → throw PdfExtractorError("page_limit")

  4. pageTexts  ← new Array(pdf.numPages).fill("")
     ocrQueue   ← []                    // indices of image-only pages

  5. FOR pageNum = 1 TO pdf.numPages:
       page     ← await pdf.getPage(pageNum)
       textContent ← await page.getTextContent()
       text     ← textContent.items.map(i => i.str).join(" ").trim()

       callbacks.onTextProgress?.(pageNum, pdf.numPages)

       IF text.length < 20:
         ocrQueue.push(pageNum)
       ELSE:
         pageTexts[pageNum - 1] ← "\n\n--- Page " + pageNum + " ---\n\n" + text

  6. FOR EACH pageNum IN ocrQueue (sequential):
       callbacks.onOcrProgress?.(pageNum, pdf.numPages)
       TRY:
         page     ← await pdf.getPage(pageNum)
         viewport ← page.getViewport({ scale: 2.08 })   // ≈150 DPI from 72 DPI base
         canvas   ← document.createElement("canvas")
         canvas.width  = viewport.width
         canvas.height = viewport.height
         ctx ← canvas.getContext("2d")
         await page.render({ canvasContext: ctx, viewport }).promise

         worker   ← await createTesseractWorker()       // singleton or fresh
         result   ← await worker.recognize(canvas)

         IF result.data.confidence < 30:
           pageTexts[pageNum - 1] ← "[Page " + pageNum + ": could not be read]"
         ELSE:
           pageTexts[pageNum - 1] ← "\n\n--- Page " + pageNum + " ---\n\n" + result.data.text
       CATCH any error:
         pageTexts[pageNum - 1] ← "[Page " + pageNum + ": could not be read]"

  7. fullText ← pageTexts.join("").trim()

  8. // Enforce 10 MB client-side cap
     IF fullText.length > 10_000_000:
       fullText ← fullText.slice(0, 10_000_000)

  9. callbacks.onComplete?.(fullText)
  10. RETURN fullText
```

### Tesseract worker management

A module-level `workerPromise` singleton is initialised lazily and reused across pages within a single `extractPdfText` call to avoid repeated Worker startup overhead. The worker is terminated after all OCR pages are processed.

```javascript
// Internal, not exported
let _workerPromise = null;

async function getWorker() {
  if (!_workerPromise) {
    _workerPromise = Tesseract.createWorker("eng");
  }
  return _workerPromise;
}
```

### pdfjs worker configuration

Because the project uses Next.js App Router (client components), the pdf.js worker must be configured once at module top level:

```javascript
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
// The pdf.worker.min.js file must be copied to /public via next.config.js
```

---

## 4. API Route Design — `/api/chat/pdf`

### File location
`src/app/api/chat/pdf/route.js`

### Request schema

```javascript
// POST /api/chat/pdf
{
  message:             string,   // required, user's current message (trimmed)
  conversationHistory: [         // required, last ≤ 6 exchanges (role + content only)
    { role: "user"|"assistant", content: string }
  ],
  extractedText:       string    // required, ≤ 12 000 chars (client pre-truncated)
}
```

### Response schema

```javascript
// 200 OK
{
  success:   true,
  response:  string,      // AI reply, markdown formatted
  timestamp: string,      // ISO 8601
  usage: {
    prompt_tokens:     number,
    completion_tokens: number,
    total_tokens:      number
  }
}

// 400 Validation Error
{ error: string, code: "VALIDATION_ERROR" }

// 401 / 403  — standard auth errors from withAuth / withCsrf
// 429        — rate limit from withAPIRateLimit
// 500        — from withErrorHandling
```

### System prompt template

```javascript
function buildSystemPrompt(extractedText) {
  const truncated = extractedText.length >= 12000;
  const safeText  = truncated
    ? extractedText.slice(0, 12000)
    : extractedText;

  return `You are an expert AI tutor helping a student understand a PDF document they have uploaded.

Your ONLY knowledge source for answering questions is the document content provided below.

Rules:
- Answer questions using ONLY the information in the document.
- If the answer cannot be found in the document, respond exactly: "I couldn't find that in the document."
- Use markdown: **bold**, *italics*, \`code\`, and bullet lists.
- Keep answers concise but complete.
- Do not reference outside knowledge or make up information.${truncated ? "\n\nNote: [Document truncated for context] — only the first portion of the document is available." : ""}

--- DOCUMENT CONTENT START ---
${safeText}
--- DOCUMENT CONTENT END ---`;
}
```

### Context truncation logic

The server performs a second truncation as a safety net even if the client already capped the text, to guard against any client-side bypass:

```javascript
const safeTruncatedText = (extractedText || "").slice(0, 12000);
```

The `conversationHistory` is capped at 6 items server-side as well:

```javascript
const recentHistory = (conversationHistory || []).slice(-6);
```

### Middleware stack

```javascript
export const POST = combineMiddleware(
  withErrorHandling,
  withCsrf,
  withAuth,
  (handler) => withAPIRateLimit(handler, "pdf-chat")
)(handlePost);
```

### OpenAI call

```javascript
const completion = await openai.chat.completions.create({
  model:             "gpt-4o-mini",
  temperature:       0.7,
  max_tokens:        600,
  presence_penalty:  0.2,
  frequency_penalty: 0.2,
  messages: [
    { role: "system",  content: buildSystemPrompt(safeTruncatedText) },
    ...recentHistory,
    { role: "user",    content: message.trim() }
  ]
});
```

### Usage tracking

```javascript
await trackAPIUsage(user._id, "pdf-chat");
```

---

## 5. Session Persistence Design

### sessionStorage schema

```javascript
// Key: session UUID generated once via crypto.randomUUID() at component mount
// Value: JSON string
{
  "sessionId": "<uuid>",         // redundant but useful for debugging
  "fileName": "lecture-notes.pdf",
  "fileSizeMB": "1.24",
  "extractedText": "...",        // full client-side text (up to 10 MB)
  "messages": [                  // full in-memory message array
    {
      "role": "user" | "assistant",
      "content": "...",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "savedAt": "2024-01-15T10:30:00.000Z"
}
```

### Lifecycle

```
INIT (component mount)
  sessionId ← crypto.randomUUID()
  existing  ← sessionStorage.getItem(sessionId)   // always null on first load
  Register window.addEventListener("beforeunload", clearSession)

ON NAVIGATE AWAY (tab switch within SPA)
  sessionStorage.setItem(sessionId, JSON.stringify(sessionPayload))
  // triggered by useEffect watching [extractedText, messages]

ON RETURN TO TAB
  raw ← sessionStorage.getItem(sessionId)
  IF raw:
    { extractedText, messages, fileName, fileSizeMB } ← JSON.parse(raw)
    setExtractedText(extractedText)
    setMessages(messages)
    setFileName(fileName) / setFileSizeMB(fileSizeMB)
    setPhase("chat")

ON TAB CLOSE / REFRESH (beforeunload)
  sessionStorage.removeItem(sessionId)
```

### Privacy notice copy (displayed in UI)

> "Your PDF and chat history are stored locally in this browser tab only and are not saved to any server."

---

## 6. Navigation Integration

### 6.1 `DashboardContent.jsx` — exact changes

**Add import** (with other component imports at the top):
```javascript
import ChatWithPDF from "./ChatWithPDF";
```

**Add route mapping** (inside `routeComponents` object):
```javascript
"chat-pdf": ChatWithPDF,
```

**Add `isPdfChat` flag** (alongside `isChat`):
```javascript
const isChat    = activeContent === "chat";
const isPdfChat = activeContent === "chat-pdf";
```

**Extend layout condition** — anywhere `isChat` is used for the full-height overflow-hidden treatment, add `|| isPdfChat`:

```javascript
// className on root div:
className={`relative min-h-full bg-background ${
  (isChat || isPdfChat)
    ? "lg:h-[calc(100vh-64px)] h-[calc(100vh-128px)] overflow-hidden"
    : "overflow-hidden"
}`}

// Dot-grid background guard:
{!(isChat || isPdfChat) && (
  <div className="absolute inset-0 z-0 pointer-events-none">
    {/* ... existing gradient/dot background ... */}
  </div>
)}

// Inner wrapper className:
className={
  (isChat || isPdfChat)
    ? "w-full h-full relative z-10"
    : "max-w-[110rem] w-full mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-12 scrollbar-hide relative z-10"
}

// Grid/scroll style prop:
style={(isChat || isPdfChat) ? {} : { scrollbarWidth: "none", msOverflowStyle: "none" }}

// Scrollbar-hide style injection:
{!(isChat || isPdfChat) && (
  <style jsx>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
)}

// Inner grid wrapper:
<div className={(isChat || isPdfChat) ? "h-full" : "grid grid-cols-1 gap-4 sm:gap-6"}>
```

### 6.2 `Sidebar.jsx` — exact change

In `NAV_GROUPS`, inside the `"Create"` group's `items` array, add the new entry immediately after the `"AI Chat"` item:

```javascript
{
  label: "Create",
  items: [
    { name: "New Session",    id: "generate",  icon: Plus },
    { name: "AI Chat",        id: "chat",      icon: MessageCircle, premium: true },
    { name: "Chat with PDF",  id: "chat-pdf",  icon: FileText,      premium: true },
    //                                          ^ FileText is already imported
  ],
},
```

`FileText` is already imported from `lucide-react` in `Sidebar.jsx` (used for the "Flashcards" nav item), so no new import is needed.

---

## 7. Dependencies

Two new npm packages are required:

| Package | npm name | Purpose |
|---|---|---|
| PDF.js | `pdfjs-dist` | Client-side text-layer extraction (pdf.js) |
| Tesseract.js | `tesseract.js` | Client-side OCR for image-only/scanned pages |

**Installation:**
```bash
npm install pdfjs-dist tesseract.js
```

**pdf.js worker file** — the pdf.js build ships a pre-built worker bundle. It must be made available as a static asset. The simplest approach for Next.js App Router is to copy it to `/public` via `next.config.js`:

```javascript
// next.config.js  (add to existing config)
const CopyPlugin = require("copy-webpack-plugin");

webpack(config) {
  config.plugins.push(
    new CopyPlugin({
      patterns: [
        {
          from: "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
          to:   "../public/pdf.worker.min.js",
        },
      ],
    })
  );
  return config;
}
```

Alternatively, set `workerSrc` to the CDN URL for the matching pdfjs-dist version.

**Tesseract.js** loads its own worker and WASM automatically from its CDN by default; no additional static-asset configuration is needed unless a self-hosted setup is required.

---

## 8. Accessibility Implementation

### ARIA roles and regions

```jsx
{/* Drop zone */}
<div
  role="button"
  tabIndex={0}
  aria-label="Upload PDF file for chat"
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }}
  onDragOver={...}
  onDrop={...}
  onClick={() => fileInputRef.current?.click()}
  className="... focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
>
  ...
</div>

{/* Hidden file input */}
<input ref={fileInputRef} type="file" accept="application/pdf" className="sr-only" />

{/* Extraction progress — polite, non-disruptive */}
<div aria-live="polite" aria-atomic="true" className="...">
  {phase === "extracting" && (
    <p>Extracting: {extractionProgress.current} / {extractionProgress.total} pages</p>
  )}
  {phase === "chat" && fileName && (
    <p>Extraction complete. {fileName} is ready.</p>
  )}
</div>

{/* Extraction errors — assertive, immediately announced */}
<div
  ref={errorRegionRef}
  role="alert"
  aria-live="assertive"
  tabIndex={-1}
  className="sr-only"
>
  {uploadError?.message}
</div>

{/* Messages area */}
<div
  role="log"
  aria-live="polite"
  aria-label="Chat messages"
  className="flex-1 overflow-y-auto"
>
  {messages.map((msg, idx) => (
    <div
      key={idx}
      ref={idx === messages.length - 1 ? latestMessageRef : null}
      tabIndex={idx === messages.length - 1 ? -1 : undefined}
      {/* tabIndex=-1 allows programmatic focus without adding to tab order */}
    >
      ...
    </div>
  ))}
</div>
```

### Focus management

| Event | Focus action |
|---|---|
| AI response rendered | `latestMessageRef.current?.focus()` inside the `messages` useEffect |
| Extraction error set | `errorRegionRef.current?.focus()` inside the `uploadError` useEffect |
| "Try Another File" clicked | `fileInputRef.current?.focus()` after state reset |
| Phase transitions to "chat" | `document.querySelector('[data-id="chat-input"]')?.focus()` |

### Focus ring — Tailwind classes applied to all interactive elements

```
focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900
```

This produces a 2px solid green ring meeting the WCAG 2.1 AA 3:1 contrast ratio requirement against both light (`slate-50`) and dark (`slate-950`) backgrounds.

### Keyboard interaction summary

| Element | Key | Action |
|---|---|---|
| Drop zone | Enter / Space | Opens native file picker |
| Drop zone | Tab | Moves focus normally |
| Send button | Enter (in textarea, no Shift) | Submits message |
| Send button | Space / Enter (on button) | Submits message |
| "Try Another File" | Enter / Space | Resets to upload phase |
| "Clear Chat" | Enter / Space | Clears message history |
| "Change PDF" | Enter / Space | Triggers replace-session confirmation |

---

## 9. Error Handling Reference

| Error condition | Error type | UI message | UI action |
|---|---|---|---|
| Non-PDF file dropped/picked | `mime` | "Only PDF files are supported." | Inline error, refocus file input |
| File > 50 MB | `size` | "File exceeds the 50 MB limit." | Inline error, refocus file input |
| Password-protected PDF | `password` | "This PDF is password-protected and cannot be processed." | Error banner + "Try Another File" button |
| Corrupted / unreadable PDF | `corrupt` | "The PDF file could not be read. Please try a different file." | Error banner + "Try Another File" button |
| PDF > 500 pages | `page_limit` | "This PDF exceeds the 500-page limit." | Error banner + "Try Another File" button |
| Extracted_Text < 50 chars | `empty` | "Very little text was extracted. Results may be limited." | Warning banner (non-blocking, chat still enabled) |
| API timeout (> 30 s) | network | "Request timed out. Please try again." | Toast (sonner), isSending reset |
| API error response | server | `data.error` or "Failed to get response." | Toast (sonner), last user message removed |
| OCR confidence < 30% | (per page) | `[Page N: could not be read]` inserted inline | No UI banner; surfaced in extracted text |
