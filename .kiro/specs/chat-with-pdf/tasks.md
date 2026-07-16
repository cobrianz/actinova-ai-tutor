# Implementation Plan: Chat with PDF

## Overview

Implement the Chat with PDF feature as a new `chat-pdf` dashboard tab. The work breaks down into six concrete deliverables: installing dependencies and configuring the pdf.js worker in `next.config.mjs`; building the `pdfExtractor.js` extraction library; creating the `/api/chat/pdf` route; building the `ChatWithPDF.jsx` UI component; wiring the component into `DashboardContent.jsx`; and adding the nav item to `Sidebar.jsx`.

The design uses JavaScript (matching the existing codebase — `Chat.jsx`, `route.js`, etc.), so no language selection is required.

---

## Tasks

- [x] 1. Install dependencies and configure pdf.js worker
  - [x] 1.1 Install `pdfjs-dist` and `tesseract.js` packages
    - Run `npm install pdfjs-dist tesseract.js` in the project root
    - Verify both packages appear in `package.json` dependencies
    - _Requirements: 2.1, 3.1_

  - [x] 1.2 Configure `next.config.mjs` to copy the pdf.js worker to `/public`
    - Convert `next.config.mjs` to use a `webpack` function (keep existing `turbopack` and `serverExternalPackages`)
    - Add `copy-webpack-plugin` (install with `npm install --save-dev copy-webpack-plugin`) to copy `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` → `../public/pdf.worker.min.js`
    - Ensure the plugin only runs on the client bundle (check `!isServer` guard)
    - _Requirements: 2.1_ — pdf.js GlobalWorkerOptions.workerSrc must resolve to `/pdf.worker.min.js`

- [x] 2. Create `src/app/lib/pdfExtractor.js`
  - [x] 2.1 Implement the `PdfExtractorError` class and module-level pdf.js worker setup
    - Export `class PdfExtractorError extends Error` with a `type` field (`"password" | "corrupt" | "page_limit" | "ocr_runtime"`)
    - Set `pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js"` at module top level (import from `pdfjs-dist`)
    - _Requirements: 4.1, 4.2_

  - [x] 2.2 Implement text-layer extraction pass (steps 1–5 of the algorithm in design §3)
    - `extractPdfText(file, callbacks)`: read `ArrayBuffer`, call `pdfjsLib.getDocument`, catch `PasswordException` → `PdfExtractorError("password")` and `InvalidPDFException` → `PdfExtractorError("corrupt")`
    - Enforce 500-page limit: `if (pdf.numPages > 500) throw new PdfExtractorError("page_limit")`
    - Loop pages 1–N: call `page.getTextContent()`, join `items.map(i => i.str)`, call `callbacks.onTextProgress?.(pageNum, total)`
    - Pages with `text.length < 20` → push to `ocrQueue`; others → store with `\n\n--- Page N ---\n\n` prefix
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.3 Implement OCR pass via Tesseract.js (steps 6–10 of the algorithm in design §3)
    - Module-level `_workerPromise` singleton (`getWorker()` helper using `Tesseract.createWorker("eng")`)
    - For each page in `ocrQueue`: call `callbacks.onOcrProgress?.(pageNum, total)`, render page to a canvas at scale 2.08, call `worker.recognize(canvas)`
    - If `result.data.confidence < 30` → insert `[Page N: could not be read]`; otherwise insert OCR text
    - Wrap in try/catch; on any error insert `[Page N: could not be read]`
    - After all OCR pages: terminate worker, join `pageTexts`, truncate to 10 000 000 chars, call `callbacks.onComplete?.(fullText)`, return `fullText`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 2.4 Write unit tests for `pdfExtractor.js`
    - Test `PdfExtractorError` type values for password, corrupt, and page-limit inputs (mock `pdfjsLib.getDocument`)
    - Test `< 20 char` page → OCR queue routing
    - Test confidence `< 30` → placeholder insertion
    - Test 10 MB truncation of full text output
    - _Requirements: 2.4, 3.4, 4.1, 4.2_

- [x] 3. Create `src/app/api/chat/pdf/route.js`
  - [x] 3.1 Implement request validation and `buildSystemPrompt` helper
    - Import `openai`, `NextResponse`, `combineMiddleware`, `withErrorHandling`, `withCsrf`, `withAuth`, `withAPIRateLimit`, `trackAPIUsage` (same imports as `src/app/api/chat/route.js`)
    - Validate `message` (required, trimmed), `conversationHistory` (must be array), `extractedText` (required) — return 400 with `code: "VALIDATION_ERROR"` on failure
    - Implement `buildSystemPrompt(extractedText)`: truncate to 12 000 chars server-side, append truncation note when applicable, embed text between `--- DOCUMENT CONTENT START ---` / `--- DOCUMENT CONTENT END ---` markers
    - _Requirements: 5.1, 5.2, 6.1_

  - [x] 3.2 Implement `handlePost` and export `POST` with the middleware stack
    - Cap `conversationHistory` at last 6 items server-side
    - Call `openai.chat.completions.create` with `model: "gpt-4o-mini"`, `temperature: 0.7`, `max_tokens: 600`, `presence_penalty: 0.2`, `frequency_penalty: 0.2`
    - Return `{ success: true, response, timestamp, usage }` on success
    - Call `await trackAPIUsage(user._id, "pdf-chat")` after a successful response
    - Export `POST = combineMiddleware(withErrorHandling, withCsrf, withAuth, (h) => withAPIRateLimit(h, "pdf-chat"))(handlePost)`
    - _Requirements: 5.1, 5.2, 6.1_

  - [ ]* 3.3 Write unit tests for the PDF Chat API route
    - Test 400 validation errors for missing `message`, non-array history, missing `extractedText`
    - Test server-side 12 000-char truncation of `extractedText`
    - Test `conversationHistory` capping at 6 items
    - Mock OpenAI call; verify system prompt contains `--- DOCUMENT CONTENT START ---`
    - _Requirements: 5.1, 6.1_

- [x] 4. Checkpoint — verify extraction and API independently
  - Run `npm run build` (or `npm run dev` briefly) to confirm no import errors in `pdfExtractor.js` and the new route
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Create `src/app/components/ChatWithPDF.jsx`
  - [x] 5.1 Scaffold component state, session setup, and `beforeunload` cleanup
    - `"use client"` directive; import `useAuth`, `apiClient`, `createSafeHTMLFragment`, `UpgradeModal`, `ConfirmModal`, `toast` (sonner)
    - Declare all state variables per design §2 state shape: `phase`, `dragOver`, `uploadError`, `fileName`, `fileSizeMB`, `extractionProgress`, `extractedText`, `messages`, `input`, `isSending`, `showTruncationBanner`, `showLowTextBanner`, `showUpgradeModal`, `showReplaceModal`, `pendingFile`
    - `const [sessionId] = useState(() => crypto.randomUUID())`
    - `useEffect` on mount: register `beforeunload` → `sessionStorage.removeItem(sessionId)`
    - `useEffect` watching `[extractedText, messages]`: persist `{extractedText, messages, fileName, fileSizeMB, savedAt}` to `sessionStorage[sessionId]`
    - `useEffect` on `phase === "chat"` transition: restore from `sessionStorage[sessionId]` if present
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 5.2 Implement upload phase UI — drop zone, file validation, and error display
    - Render drop zone `div` with `role="button"`, `tabIndex={0}`, `aria-label="Upload PDF file for chat"`, `onKeyDown` (Enter/Space → `fileInputRef.current?.click()`), `onDragOver`, `onDrop`, `onClick`; apply `focus:ring-2 focus:ring-green-500` focus ring
    - Hidden `<input ref={fileInputRef} type="file" accept="application/pdf" className="sr-only" />`
    - On file selection: validate MIME (`application/pdf`) → set `uploadError({type:"mime", …})`; validate size ≤ 50 MB → set `uploadError({type:"size", …})`; if active session + new file → set `pendingFile`, `showReplaceModal(true)`; otherwise call `startExtraction(file)`
    - Display `ErrorBanner` with error message and "Try Another File" button; on click: clear error, reset to upload phase, `fileInputRef.current?.focus()`
    - Render privacy notice: "Your PDF and chat history are stored locally in this browser tab only and are not saved to any server."
    - `useEffect` watching `uploadError`: `errorRegionRef.current?.focus()`; hidden `role="alert" aria-live="assertive"` div for screen reader announcement
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.4, 9.1, 9.2_

  - [x] 5.3 Implement extraction phase — call `pdfExtractor.js` and show progress
    - `startExtraction(file)`: set `phase("extracting")`, `fileName(file.name)`, `fileSizeMB((file.size/1024/1024).toFixed(2))`
    - Call `extractPdfText(file, { onTextProgress, onOcrProgress, onComplete })` inside a try/catch
    - `onTextProgress(current, total)`: `setExtractionProgress({current, total, mode:"text"})`
    - `onOcrProgress(pageIndex, total)`: `setExtractionProgress({current:pageIndex, total, mode:"ocr"})`
    - `onComplete(text)`: `setExtractedText(text)`, check `text.length < 50` → `setShowLowTextBanner(true)`, check `text.length > 12000` → `setShowTruncationBanner(true)`, `setPhase("chat")`, focus chat input
    - Catch `PdfExtractorError`: map `type` to error message per design §9 error table → `setUploadError(...)`, `setPhase("upload")`
    - Render `aria-live="polite"` progress region: "Extracting: N / M pages" (text mode) or "OCR processing page N of M" (ocr mode)
    - Render "Cancel" button: abort extraction (via AbortController or flag), reset to upload phase
    - _Requirements: 2.2, 3.2, 4.1, 4.2, 4.4, 9.3_

  - [x] 5.4 Implement chat phase UI — file info bar, message list, and input bar
    - Copy `renderFormattedContent` verbatim from `Chat.jsx` (bold, italic, inline code, `\n → <br>`)
    - Render `FileInfoBar`: filename, size, "Change PDF" button → set `pendingFile(null)`, `showReplaceModal(true)`
    - Render `TruncationBanner` (when `showTruncationBanner`): "Large document — AI is working from the beginning of the document."
    - Render `LowTextBanner` (when `showLowTextBanner`): "Very little text was extracted. Results may be limited."
    - Render messages area: `role="log"`, `aria-live="polite"`, `aria-label="Chat messages"`; map `messages` to user/AI bubbles with `dangerouslySetInnerHTML={createSafeHTMLFragment(renderFormattedContent(msg.content))}`; last message gets `ref={latestMessageRef}` and `tabIndex={-1}`
    - Render `EmptyState` when `messages.length === 0`
    - Render three-dot loader when `isSending` (identical markup to `Chat.jsx`)
    - `useEffect` watching `messages`: `messagesEndRef.current?.scrollIntoView({behavior:"smooth"})` + `latestMessageRef.current?.focus()`
    - `addMessage(msg)` helper: cap messages array at 50 items (`slice(-50)`)
    - Render `InputBar`: `<textarea data-id="chat-input">` + Send button + "Clear Chat" button; Enter (no Shift) submits; Clear Chat → `setMessages([])`, display empty state
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 6.3, 9.1, 9.4_

  - [x] 5.5 Implement `handleSend` — credit gate, API call, and error handling
    - Check `hasPurchased('course_generation')` → `setShowUpgradeModal(true)` if not purchased
    - Append user message to `messages` via `addMessage`, clear `input`, set `isSending(true)`
    - POST to `/api/chat/pdf` via `apiClient.post` with `{ message, conversationHistory: messages.slice(-6).map(m=>({role:m.role,content:m.content})), extractedText: extractedText.slice(0,12000) }`
    - On success: `addMessage({role:"assistant", content:data.response, timestamp:data.timestamp})`
    - On API error: remove last user message, `toast.error(data.error || "Failed to get response.")`
    - On network timeout (> 30 s): `toast.error("Request timed out. Please try again.")`, reset `isSending`
    - Finally: `setIsSending(false)`
    - _Requirements: 5.1, 5.2, 5.4, 7.3_

  - [~] 5.6 Wire `ConfirmModal` (replace-session) and `UpgradeModal`
    - `ConfirmModal` for replace-session: `isOpen={showReplaceModal}`, on confirm → call `startExtraction(pendingFile)`, close modal; on cancel → clear `pendingFile`, close modal
    - `UpgradeModal` for credit gate: `isOpen={showUpgradeModal}`, `featureName="Chat with PDF"`, `description="Upload PDFs and chat with an AI tutor about their content."`
    - _Requirements: 1.6, 7.3_

  - [ ]* 5.7 Write unit tests for `ChatWithPDF.jsx`
    - Test MIME validation error renders correct inline error message
    - Test file-size validation error renders correct message
    - Test session restore from `sessionStorage` on phase transition
    - Test `handleSend` credit-gate path shows `UpgradeModal`
    - Test `messages` capped at 50 entries via `addMessage`
    - _Requirements: 1.2, 1.3, 1.5, 5.5, 7.3, 8.2_

- [~] 6. Checkpoint — UI smoke test
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Modify `src/app/components/DashboardContent.jsx`
  - [x] 7.1 Add `ChatWithPDF` import and `chat-pdf` route mapping
    - Add `import ChatWithPDF from "./ChatWithPDF";` alongside the existing component imports
    - Add `"chat-pdf": ChatWithPDF,` to the `routeComponents` object
    - _Requirements: 7.1_

  - [x] 7.2 Add `isPdfChat` flag and extend full-height layout conditions
    - Add `const isPdfChat = activeContent === "chat-pdf";` immediately after the `isChat` declaration
    - Replace every `isChat` boolean guard that controls the full-height / overflow-hidden layout with `(isChat || isPdfChat)` — specifically:
      - Root `div` `className` conditional
      - Dot-grid background `{!isChat && ...}` guard
      - Inner wrapper `className` conditional
      - `style` prop conditional
      - `<style jsx>` scrollbar-hide conditional
      - Inner grid wrapper `className` conditional
    - _Requirements: 7.1, 7.4_

- [ ] 8. Modify `src/app/components/Sidebar.jsx`
  - [x] 8.1 Add "Chat with PDF" nav item to the "Create" group
    - In `NAV_GROUPS`, inside the `"Create"` group `items` array, insert after the `"AI Chat"` entry:
      `{ name: "Chat with PDF", id: "chat-pdf", icon: FileText, premium: true }`
    - `FileText` is already imported from `lucide-react` (used for Flashcards) — no new import needed
    - _Requirements: 7.2_

- [~] 9. Final checkpoint — end-to-end validation
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements from `requirements.md` for full traceability
- The design has no "Correctness Properties" section, so no property-based tests are included — unit tests cover the critical paths
- `pdfExtractor.js` must run client-side only; never import it from a server component or API route
- The `copy-webpack-plugin` step in task 1.2 is needed only when _not_ using the Turbopack dev server — for production builds `next build` uses Webpack and the copy will execute correctly
- `next.config.mjs` currently sets `turbopack: {}` for dev; the webpack config will apply only during `next build`

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["2.3", "3.1"] },
    { "id": 4, "tasks": ["2.4", "3.2"] },
    { "id": 5, "tasks": ["3.3", "5.1"] },
    { "id": 6, "tasks": ["5.2", "5.3"] },
    { "id": 7, "tasks": ["5.4", "5.5"] },
    { "id": 8, "tasks": ["5.6"] },
    { "id": 9, "tasks": ["5.7", "7.1"] },
    { "id": 10, "tasks": ["7.2", "8.1"] }
  ]
}
```
