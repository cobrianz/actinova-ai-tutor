# Requirements Document

## Introduction

The "Chat with PDF" feature allows users of the Actinova AI Tutor to upload a PDF document directly in the browser, extract its text content client-side (using pdf.js for text-layer PDFs and Tesseract.js for scanned/image-based PDFs), and then chat with an AI tutor about that extracted content. No PDF data is sent to or stored on any server — all extraction happens in-browser. The AI receives only the extracted text as context and responds via the existing OpenAI-backed chat API. The feature is surfaced as a new dashboard tab ("Chat with PDF") consistent with the existing navigation and theming conventions.

---

## Glossary

- **PDF_Extractor**: The browser-side module responsible for extracting readable text from an uploaded PDF file.
- **Text_Layer_Parser**: The pdf.js-based sub-component of PDF_Extractor that extracts text from PDFs containing a native text layer.
- **OCR_Engine**: The Tesseract.js-based sub-component of PDF_Extractor that extracts text from image-only or scanned PDF pages by performing optical character recognition.
- **PDF_Chat_UI**: The React component that provides the upload interface, extraction progress display, and chat interface for interacting with extracted PDF content.
- **PDF_Chat_API**: The Next.js API route (`/api/chat/pdf`) that accepts extracted text plus user messages and returns AI-generated responses grounded in that text.
- **Extracted_Text**: The plain-text content produced by PDF_Extractor from a user-uploaded PDF file.
- **PDF_Session**: A single in-browser session scoping a user's PDF upload, its Extracted_Text, and the resulting chat history; it is never persisted to the server.
- **Context_Window**: The maximum number of characters of Extracted_Text forwarded to the AI per request, subject to token-limit constraints.
- **Credit_System**: The existing Actinova credit-based gating mechanism defined in `planLimits.js`.

---

## Requirements

### Requirement 1: PDF Upload and Validation

**User Story:** As a student, I want to upload a PDF file from my device, so that I can start a conversation about its contents.

#### Acceptance Criteria

1. THE PDF_Chat_UI SHALL accept PDF file uploads via a drag-and-drop area and a file-picker button.
2. WHEN a user selects or drops a file, THE PDF_Chat_UI SHALL verify the file is of type `application/pdf` before passing it to PDF_Extractor.
3. IF a user uploads a file that is not of type `application/pdf`, THEN THE PDF_Chat_UI SHALL display an inline error message reading "Only PDF files are supported."
4. WHEN a valid PDF file is selected, THE PDF_Chat_UI SHALL display the file name and size to the user before extraction begins.
5. THE PDF_Chat_UI SHALL enforce a maximum file size of 50 MB and, IF the uploaded file exceeds 50 MB, THEN THE PDF_Chat_UI SHALL display an error message reading "File exceeds the 50 MB limit."
6. WHEN a new PDF is uploaded during an active PDF_Session, THE PDF_Chat_UI SHALL prompt the user to confirm replacement of the current session before proceeding.

---

### Requirement 2: Client-Side Text Extraction — Text-Layer PDFs

**User Story:** As a student, I want text extracted automatically from standard PDFs, so that I can chat about the content without any server upload.

#### Acceptance Criteria

1. THE PDF_Extractor SHALL use Text_Layer_Parser (pdf.js) to attempt text extraction on every page of an uploaded PDF before falling back to OCR_Engine.
2. WHEN text extraction begins, THE PDF_Chat_UI SHALL display a progress indicator showing the number of pages processed out of total pages (e.g., "Extracting: 3 / 12 pages").
3. WHEN Text_Layer_Parser successfully extracts text from all pages, THE PDF_Extractor SHALL return the concatenated Extracted_Text to PDF_Chat_UI without invoking OCR_Engine.
4. IF Text_Layer_Parser extracts fewer than 20 characters from a page, THEN THE PDF_Extractor SHALL classify that page as image-only and queue it for OCR_Engine processing.
5. THE PDF_Extractor SHALL preserve page-break boundaries in Extracted_Text by inserting a `\n\n--- Page N ---\n\n` marker between pages.

---

### Requirement 3: Client-Side Text Extraction — OCR for Scanned PDFs

**User Story:** As a student, I want scanned or image-based PDFs to also be readable, so that I can chat about physical textbooks or notes I've photographed.

#### Acceptance Criteria

1. WHEN at least one page is classified as image-only, THE PDF_Extractor SHALL render each such page to a canvas element and pass the resulting image data to OCR_Engine (Tesseract.js).
2. THE OCR_Engine SHALL process image-only pages sequentially and emit per-page progress events that PDF_Chat_UI displays to the user.
3. WHEN OCR_Engine completes recognition for a page, THE PDF_Extractor SHALL insert the OCR result into the correct position in Extracted_Text, preserving document order.
4. IF OCR_Engine fails to recognize text on a page (confidence below 30%), THEN THE PDF_Extractor SHALL insert a placeholder `[Page N: could not be read]` for that page in Extracted_Text.
5. WHEN all pages have been processed by either Text_Layer_Parser or OCR_Engine, THE PDF_Extractor SHALL emit a completion event containing the full Extracted_Text.

---

### Requirement 4: Extraction Error Handling

**User Story:** As a student, I want clear feedback when a PDF cannot be processed, so that I understand what went wrong and what to do next.

#### Acceptance Criteria

1. IF PDF_Extractor encounters a password-protected PDF, THEN THE PDF_Chat_UI SHALL display the error message "This PDF is password-protected and cannot be processed."
2. IF PDF_Extractor encounters a corrupted or unreadable PDF file, THEN THE PDF_Chat_UI SHALL display the error message "The PDF file could not be read. Please try a different file."
3. IF Extracted_Text contains fewer than 50 characters after processing all pages, THEN THE PDF_Chat_UI SHALL display a warning: "Very little text was extracted. Results may be limited."
4. WHEN an extraction error occurs, THE PDF_Chat_UI SHALL provide a "Try Another File" button to reset the upload state without reloading the page.

---

### Requirement 5: AI Chat Grounded in PDF Content

**User Story:** As a student, I want to ask questions about my uploaded PDF and receive accurate, context-aware answers, so that I can understand and study the material effectively.

#### Acceptance Criteria

1. WHEN the user sends a message in PDF_Chat_UI, THE PDF_Chat_API SHALL receive the user message, the conversation history (last 6 exchanges), and a truncated excerpt of Extracted_Text not exceeding 12,000 characters as the AI context.
2. THE PDF_Chat_API SHALL instruct the AI model to answer only from the provided PDF content and, WHEN a question cannot be answered from that content, THE PDF_Chat_API SHALL return a response indicating the answer is not found in the document.
3. WHEN the AI response is received, THE PDF_Chat_UI SHALL render it using the existing markdown rendering pipeline (bold, italics, code, lists) consistent with the Chat component.
4. WHILE a response is loading, THE PDF_Chat_UI SHALL display the existing three-dot animated loading indicator.
5. THE PDF_Chat_UI SHALL display a per-session chat history of up to 50 messages in the current PDF_Session and store it only in browser memory (not persisted to any API).
6. WHEN a user clears the chat, THE PDF_Chat_UI SHALL remove all messages from memory and display the empty-state prompt.

---

### Requirement 6: Context Window Management

**User Story:** As a student, I want the AI to use the most relevant parts of my PDF when answering, so that large documents don't degrade response quality.

#### Acceptance Criteria

1. WHEN Extracted_Text exceeds 12,000 characters, THE PDF_Chat_API SHALL truncate the context to the first 12,000 characters and append a note "[Document truncated for context]" to the system prompt.
2. WHERE a future keyword-search or chunking strategy is enabled, THE PDF_Chat_API SHALL select the most relevant 12,000-character window from Extracted_Text based on the user's question.
3. THE PDF_Chat_UI SHALL inform the user when document truncation is active by displaying a banner: "Large document — AI is working from the beginning of the document."

---

### Requirement 7: Navigation and Feature Access

**User Story:** As a user, I want the Chat with PDF feature to be discoverable in the dashboard and consistent with the rest of the app, so that I can find it quickly.

#### Acceptance Criteria

1. THE PDF_Chat_UI SHALL be accessible as a new dashboard tab with the identifier `chat-pdf`, registered in the `DashboardContent` routing map alongside existing tabs.
2. THE Sidebar SHALL include a "Chat with PDF" navigation item with a `FileText`-style icon in the "Create" group, positioned after "AI Chat".
3. WHEN a user without sufficient credits navigates to the `chat-pdf` tab, THE PDF_Chat_UI SHALL display the existing `UpgradeModal` component.
4. THE PDF_Chat_UI SHALL apply the same Tailwind CSS design tokens (colors, typography, spacing, dark-mode classes) as the existing Chat component.

---

### Requirement 8: PDF Session Lifecycle

**User Story:** As a student, I want my PDF session to be isolated to my browser tab, so that my document is never stored on any server.

#### Acceptance Criteria

1. THE PDF_Chat_UI SHALL hold Extracted_Text and chat messages exclusively in React component state and SHALL NOT transmit the binary PDF data to any server endpoint.
2. WHEN the user navigates away from the `chat-pdf` tab and returns within the same browser session, THE PDF_Chat_UI SHALL retain the Extracted_Text and chat history in `sessionStorage` keyed by a client-generated session identifier.
3. WHEN the browser tab is closed or refreshed, THE PDF_Session SHALL be discarded and sessionStorage entries for the session SHALL be cleared.
4. THE PDF_Chat_UI SHALL display a notice: "Your PDF and chat history are stored locally in this browser tab only and are not saved to any server."

---

### Requirement 9: Accessibility and Usability

**User Story:** As a user with accessibility needs, I want all interactive elements of the PDF chat feature to be keyboard-navigable and screen-reader-friendly.

#### Acceptance Criteria

1. THE PDF_Chat_UI SHALL provide a visible focus ring on all interactive elements (file input, send button, clear button) compliant with WCAG 2.1 AA contrast requirements.
2. THE drag-and-drop upload area SHALL include an `aria-label` attribute describing its purpose and SHALL respond to keyboard activation (Enter/Space).
3. THE PDF_Chat_UI SHALL announce extraction progress and completion events to screen readers via `aria-live="polite"` regions.
4. WHEN the AI response is rendered, THE PDF_Chat_UI SHALL set focus to the latest message or scroll it into view so keyboard users can read it without manual navigation.
