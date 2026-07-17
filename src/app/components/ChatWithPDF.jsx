"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { apiClient } from "@/lib/csrfClient";
import { createSafeHTMLFragment } from "@/../lib/sanitizer";
import UpgradeModal from "./UpgradeModal";
import ConfirmModal from "./ConfirmModal";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Send, FileText, X, Trash2, AlertCircle, CheckCircle, Loader2, UploadCloud, Lock, BookOpen, ArrowLeft, ArrowRight, Bookmark } from "lucide-react";
import { extractPdfText, PdfExtractorError } from "@/lib/pdfExtractor";
import { highlightToHtml } from "@/lib/syntaxHighlighter";

// ─── Simple SHA-256 hash of a string (client-side, for dedup) ─────────────────
async function sha256(str) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

// ─── Parse per-page text from the pdfExtractor output ──────────────────────
// pdfExtractor inserts "\n\n--- Page N ---\n\n" markers between pages.
function parsePages(fullText) {
  const pages = [];
  const parts = fullText.split(/\n\n---\s*Page\s+(\d+)\s*---\n\n/);
  if (parts.length > 1) {
    for (let i = 1; i < parts.length; i += 2) {
      const pageNum = parseInt(parts[i], 10);
      const text = (parts[i + 1] || "").trim();
      if (!isNaN(pageNum)) pages.push({ page: pageNum, text });
    }
  } else {
    // No markers (e.g. single-page or OCR-only) — treat as page 1
    pages.push({ page: 1, text: fullText.trim() });
  }
  return pages;
}

// ─── Render markdown-like formatting to HTML (mirrors Chat.jsx) ───────────────
const renderFormattedContent = (content) => {
  if (!content) return "";
  let html = content;
  const codeBlocks = [];

  // Fenced code blocks — extract first, replace with placeholders
  html = html.replace(/```(\w+)?\s*([\s\S]*?)```/g, (_match, lang, code) => {
    const pureCode = (code || "").trim();
    const highlighted = highlightToHtml(pureCode, lang || "javascript");
    const encodedCode = btoa(encodeURIComponent(pureCode).replace(/%([0-9A-F]{2})/g,
      (_m, p1) => String.fromCharCode("0x" + p1)));
    const block = `<div class="relative group my-4">
      <div class="absolute right-2 top-2 z-10">
        <button class="copy-code-btn p-1.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-white dark:hover:bg-slate-700 transition-colors" data-code="${encodedCode}" title="Copy code">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        </button>
      </div>
      <pre class="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-200 dark:border-slate-700 font-mono m-0"><code class="text-[13px] font-mono language-${lang || "plaintext"}">${highlighted}</code></pre>
    </div>`;
    codeBlocks.push(block);
    return `\x00CODEBLOCK_${codeBlocks.length - 1}\x00`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[13px] font-mono text-green-600 dark:text-green-400">$1</code>');

  // Bold
  html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-slate-100">$1</strong>');
  html = html.replace(/__([^_]+?)__/g, '<strong class="font-semibold text-slate-900 dark:text-slate-100">$1</strong>');

  // Italic
  html = html.replace(/\*([^*\n]+?)\*/g, '<em class="italic">$1</em>');

  // Line breaks (outside code blocks)
  html = html.replace(/\n/g, "<br />");

  // Restore code blocks
  html = html.replace(/\x00CODEBLOCK_(\d+)\x00/g, (_m, i) => codeBlocks[parseInt(i)]);

  return html;
};

export default function ChatWithPDF() {
  // ─── Auth ──────────────────────────────────────────────────────────────────
  const { user, loading: authLoading, hasPurchased } = useAuth();

  // ─── Phase ─────────────────────────────────────────────────────────────────
  // "upload" | "extracting" | "saving" | "chat"
  const [phase, setPhase] = useState("upload");

  // ─── Upload phase ──────────────────────────────────────────────────────────
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // ─── File metadata ─────────────────────────────────────────────────────────
  const [fileName, setFileName] = useState("");
  const [fileSizeMB, setFileSizeMB] = useState(0);

  // ─── Extraction phase ──────────────────────────────────────────────────────
  const [extractionProgress, setExtractionProgress] = useState({ current: 0, total: 0, mode: "text" });

  // ─── Chat phase ────────────────────────────────────────────────────────────
  const [extractedText, setExtractedText] = useState("");
  const [documentId, setDocumentId] = useState(null);   // backend document ID
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showTruncationBanner, setShowTruncationBanner] = useState(false);
  const [showLowTextBanner, setShowLowTextBanner] = useState(false);

  // ─── Modals ────────────────────────────────────────────────────────────────
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  // ─── Recent sessions ──────────────────────────────────────────────────────
  const [recentSessions, setRecentSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const [bookmarked, setBookmarked] = useState(new Set());

  // ─── Session ───────────────────────────────────────────────────────────────
  const [sessionId] = useState(() => crypto.randomUUID());

  // ─── Refs ──────────────────────────────────────────────────────────────────
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const latestMessageRef = useRef(null);
  const errorRegionRef = useRef(null);
  const cancelRef = useRef(false);

  // ─── Message helper: cap messages array at 50 items ────────────────────────
  const addMessage = (msg) => {
    setMessages((prev) => {
      const next = [...prev, msg];
      return next.length > 50 ? next.slice(next.length - 50) : next;
    });
  };

  // ─── Effect: scroll to bottom and focus latest message on new messages ─────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    latestMessageRef.current?.focus();
  }, [messages]);

  // ─── Effect: focus error region when an upload error is set ───────────────
  useEffect(() => {
    if (uploadError) {
      errorRegionRef.current?.focus();
    }
  }, [uploadError]);

  // ─── Effect: register beforeunload → clear session on tab close/refresh ───
  useEffect(() => {
    const clearSession = () => sessionStorage.removeItem(sessionId);
    window.addEventListener("beforeunload", clearSession);
    return () => window.removeEventListener("beforeunload", clearSession);
  }, [sessionId]);

  // ─── Effect: fetch recent sessions on mount ─────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await apiClient.get("/api/chat/pdf-history?action=sessions");
        const data = await resp.json();
        if (!cancelled && resp.ok && data.sessions) {
          setRecentSessions(data.sessions);
        }
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setLoadingSessions(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ─── Load a recent session ──────────────────────────────────────────────
  const loadSession = async (session) => {
    try {
      // Fetch document text
      const docResp = await apiClient.get(`/api/pdf-documents?id=${session.documentId}`);
      const docData = await docResp.json();
      if (!docResp.ok || !docData.document) {
        toast.error("Could not load document.");
        return;
      }
      setFileName(docData.document.fileName);
      setFileSizeMB(docData.document.fileSizeMB);
      setDocumentId(session.documentId);

      // Reconstruct fullText from pages
      const fullText = (docData.document.pages || [])
        .map((p) => `\n\n--- Page ${p.page} ---\n\n${p.text}`)
        .join("");
      setExtractedText(fullText);

      // Fetch chat history
      const histResp = await apiClient.get(`/api/chat/pdf-history?documentId=${session.documentId}`);
      const histData = await histResp.json();
      if (histResp.ok && histData.messages?.length > 0) {
        setMessages(histData.messages);
      } else {
        setMessages([]);
      }

      setPhase("chat");
    } catch {
      toast.error("Failed to load session.");
    }
  };

  // ─── Delete a session ───────────────────────────────────────────────────
  const deleteSession = async (e, session) => {
    e.stopPropagation();
    setDeletingSessionId(session.documentId);
    try {
      await apiClient.delete(`/api/chat/pdf-history?documentId=${session.documentId}&action=delete`);
      await apiClient.delete(`/api/pdf-documents?id=${session.documentId}`);
      setRecentSessions((prev) => prev.filter((s) => s.documentId !== session.documentId));
      toast.success("Session deleted.");
    } catch {
      toast.error("Failed to delete session.");
    } finally {
      setDeletingSessionId(null);
    }
  };

  // ─── Toggle bookmark (local only) ──────────────────────────────────────
  const toggleBookmark = (e, docId) => {
    e.stopPropagation();
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      localStorage.setItem("pdfChatBookmarks", JSON.stringify([...next]));
      return next;
    });
  };

  // ─── Load bookmarks from localStorage on mount ────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem("pdfChatBookmarks");
      if (raw) setBookmarked(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, []);

  // ─── Effect: persist session whenever extractedText or messages change ─────
  useEffect(() => {
    if (!extractedText && messages.length === 0) return;
    const payload = JSON.stringify({
      sessionId,
      fileName,
      fileSizeMB,
      extractedText,
      documentId,
      messages,
      savedAt: new Date().toISOString(),
    });
    sessionStorage.setItem(sessionId, payload);
  }, [extractedText, messages, sessionId, fileName, fileSizeMB, documentId]);

  // ─── Effect: restore session when phase transitions to "chat" ─────────────
  useEffect(() => {
    if (phase !== "chat") return;
    const raw = sessionStorage.getItem(sessionId);
    if (!raw) return;
    try {
      const {
        extractedText: savedText,
        messages: savedMessages,
        fileName: savedFileName,
        fileSizeMB: savedSize,
        documentId: savedDocId,
      } = JSON.parse(raw);
      if (savedText) setExtractedText(savedText);
      if (savedMessages) setMessages(savedMessages);
      if (savedFileName) setFileName(savedFileName);
      if (savedSize !== undefined) setFileSizeMB(savedSize);
      if (savedDocId) setDocumentId(savedDocId);
    } catch {
      // ignore malformed session data
    }
  }, [phase, sessionId]);

  // ─── Effect: copy-to-clipboard for code blocks ────────────────────────
  useEffect(() => {
    const handleCopy = async (e) => {
      const btn = e.target.closest(".copy-code-btn");
      if (!btn) return;
      const encodedCode = btn.getAttribute("data-code");
      if (!encodedCode) return;
      try {
        const code = decodeURIComponent(
          atob(encodedCode)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        await navigator.clipboard.writeText(code);
        const original = btn.innerHTML;
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><path d="M20 6 9 17l-5-5"/></svg>`;
        toast.success("Code copied!");
        setTimeout(() => { btn.innerHTML = original; }, 2000);
      } catch {
        toast.error("Failed to copy code");
      }
    };
    document.addEventListener("click", handleCopy);
    return () => document.removeEventListener("click", handleCopy);
  }, []);

  // ─── startExtraction ──────────────────────────────────────────────────────
  const startExtraction = async (file) => {
    setFileName(file.name);
    setFileSizeMB((file.size / (1024 * 1024)).toFixed(2));
    setPhase("extracting");
    setExtractionProgress({ current: 0, total: 0, mode: "text" });
    cancelRef.current = false;

    try {
      await extractPdfText(file, {
        onTextProgress: (current, total) => {
          if (cancelRef.current) return;
          setExtractionProgress({ current, total, mode: "text" });
        },
        onOcrProgress: (pageIndex, total) => {
          if (cancelRef.current) return;
          setExtractionProgress({ current: pageIndex, total, mode: "ocr" });
        },
        onComplete: async (text) => {
          if (cancelRef.current) return;
          setExtractedText(text);
          if (text.length < 50) setShowLowTextBanner(true);
          if (text.length > 12000) setShowTruncationBanner(true);

          // ── Save extracted text to backend ──────────────────────────────
          setPhase("saving");
          try {
            const pages = parsePages(text);
            const contentHash = await sha256(text);
            const saveResp = await apiClient.post("/api/pdf-documents", {
              fileName: file.name,
              fileSizeMB: (file.size / (1024 * 1024)).toFixed(2),
              pages,
              fullText: text,
              contentHash,
            });
            const saveData = await saveResp.json();
            if (saveResp.ok && saveData.documentId) {
              setDocumentId(saveData.documentId);
              // Load previous chat history for this document
              try {
                const histResp = await apiClient.get(
                  `/api/chat/pdf-history?documentId=${saveData.documentId}`
                );
                const histData = await histResp.json();
                if (histResp.ok && histData.messages?.length > 0) {
                  setMessages(histData.messages);
                }
              } catch {
                // non-fatal — just start fresh
              }
            }
          } catch (saveErr) {
            // Non-fatal — chat still works with local extractedText fallback
            console.warn("PDF save failed:", saveErr);
          }

          setPhase("chat");
          setTimeout(() => {
            document.querySelector('[data-id="chat-input"]')?.focus();
          }, 100);
        },
      });
    } catch (err) {
      if (cancelRef.current) return;
      const errorMessages = {
        password: "This PDF is password-protected and cannot be processed.",
        corrupt: "The PDF file could not be read. Please try a different file.",
        page_limit: "This PDF exceeds the 500-page limit.",
      };
      const message =
        err instanceof PdfExtractorError && errorMessages[err.type]
          ? errorMessages[err.type]
          : "The PDF file could not be read. Please try a different file.";
      setUploadError({ type: err.type || "corrupt", message });
      setPhase("upload");
    }
  };

  // ─── File validation and selection ────────────────────────────────────────
  const handleFileSelect = (file) => {
    if (!file) return;
    // MIME validation
    if (file.type !== "application/pdf") {
      setUploadError({ type: "mime", message: "Only PDF files are supported." });
      return;
    }
    // Size validation (20 MB)
    if (file.size > 20 * 1024 * 1024) {
      setUploadError({ type: "size", message: "File exceeds the 20 MB limit." });
      return;
    }
    setUploadError(null);
    // If active session exists, ask for confirmation
    if (extractedText) {
      setPendingFile(file);
      setShowReplaceModal(true);
    } else {
      startExtraction(file);
    }
  };

  // ─── Drag handlers ────────────────────────────────────────────────────────
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragOver(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  // ─── handleSend ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMessage = { role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    addMessage(userMessage);
    setInput("");
    setIsSending(true);

    try {
      const conversationHistory = messages.map((m) => ({ role: m.role, content: m.content }));
      const body = documentId
        ? { message: userMessage.content, conversationHistory, documentId }
        : { message: userMessage.content, conversationHistory, extractedText: extractedText.slice(0, 12000) };

      const response = await apiClient.post("/api/chat/pdf", body);
      const data = await response.json();

      if (response.ok) {
        const aiMsg = {
          role: "assistant",
          content: data.response,
          citedPages: data.citedPages || [],
          timestamp: data.timestamp,
        };
        addMessage(aiMsg);

        // Persist history to backend (fire-and-forget)
        if (documentId) {
          const updatedMessages = [
            ...messages,
            userMessage,
            aiMsg,
          ].slice(-50);
          apiClient
            .post("/api/chat/pdf-history", {
              documentId,
              fileName,
              fileSizeMB,
              messages: updatedMessages.map((m) => ({
                role: m.role,
                content: m.content,
                citedPages: m.citedPages || [],
                timestamp: m.timestamp,
              })),
            })
            .catch(() => {}); // non-fatal
        }
      } else if (response.status === 429 && data.code === "INSUFFICIENT_CREDITS") {
        setMessages((prev) => prev.slice(0, -1));
        setShowUpgradeModal(true);
      } else {
        setMessages((prev) => prev.slice(0, -1));
        toast.error(data.error || "Failed to get response.");
      }
    } catch (error) {
      console.error("PDF chat error:", error);
      setMessages((prev) => prev.slice(0, -1));
      toast.error("Request timed out. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative flex w-full h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Dotted background — only shown during chat phase where there is no full white surface */}
      {phase === "chat" && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(15,23,42,0.22)_1px,_transparent_1px)] [background-size:20px_20px] opacity-100 dark:hidden" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(255,255,255,0.65),_rgba(255,255,255,0.18))] dark:hidden" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.07)_1px,_transparent_1px)] [background-size:20px_20px] opacity-0 dark:opacity-100 hidden dark:block" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(0,0,0,0.3),_rgba(0,0,0,0.05))] opacity-0 dark:opacity-100 hidden dark:block" />
        </div>
      )}
      {/* Upgrade modal — rendered at root level */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Chat with PDF"
        description="Upload and chat with any PDF document using our advanced AI tutor. Pro members get unlimited PDF chat sessions."
      />

      {/* Replace session confirmation modal */}
      <ConfirmModal
        isOpen={showReplaceModal}
        onClose={() => { setShowReplaceModal(false); setPendingFile(null); }}
        onConfirm={() => {
          setShowReplaceModal(false);
          if (pendingFile) {
            startExtraction(pendingFile);
            setPendingFile(null);
          }
        }}
        title="Replace Current PDF?"
        message="This will replace your current PDF and clear the chat history."
        confirmText="Replace"
        cancelText="Cancel"
        confirmColor="red"
      />

      {/* Upload phase */}
      {phase === "upload" && (
        <div className="flex flex-1 flex-col w-full h-full overflow-y-auto">
          {/* Full-width top header bar */}
          <div className="w-full px-6 sm:px-10 lg:px-16 pt-10 pb-6 shrink-0">
            <div className="flex items-center gap-4 mb-1">
              <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center shrink-0">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Chat with PDF
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Upload any PDF and ask the AI tutor questions about its content
                </p>
              </div>
            </div>
          </div>

          {/* Main content area — full width, generous padding */}
          <div className="flex-1 px-6 sm:px-10 lg:px-16 pb-10 flex flex-col gap-6">

            {/* Drop zone — full width, tall */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload PDF file for chat"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full flex flex-col items-center justify-center gap-6 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950
                relative z-10 min-h-[420px] sm:min-h-[520px]
                ${dragOver
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20 scale-[1.005]"
                  : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-green-400 hover:bg-green-50 dark:hover:bg-slate-900"
                }`}
            >
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-colors ${dragOver ? "bg-green-100 dark:bg-green-900/40" : "bg-slate-100 dark:bg-slate-800"}`}>
                <UploadCloud size={48} className={`transition-colors ${dragOver ? "text-green-600" : "text-slate-400 dark:text-slate-500"}`} />
              </div>

              <div className="text-center space-y-2 px-4">
                <p className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-200">
                  {dragOver ? "Release to upload" : "Drop your PDF here"}
                </p>
                <p className="text-base text-slate-500 dark:text-slate-400">
                  or{" "}
                  <span className="text-green-600 dark:text-green-400 font-semibold underline underline-offset-2 cursor-pointer">
                    click to browse files
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-5 py-2 relative z-10">
                <FileText size={14} />
                <span>PDF files only · Max 20 MB · Up to 500 pages</span>
              </div>
            </div>

            {/* Error banner */}
            {uploadError && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-5 py-4">
                <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">{uploadError.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadError(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    fileInputRef.current?.focus();
                  }}
                  className="shrink-0 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 rounded"
                >
                  Try Another File
                </button>
              </div>
            )}

            {/* Accessible error region — always in DOM, screen-reader only */}
            <div
              ref={errorRegionRef}
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
              className="sr-only"
            >
              {uploadError?.message}
            </div>

            {/* Feature highlights row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: FileText, title: "Any PDF", desc: "Textbooks, papers, notes, reports — any document works" },
                { icon: Bot, title: "AI-Powered Answers", desc: "Get accurate answers grounded entirely in your document" },
                { icon: Lock, title: "Private by Default", desc: "Your PDF never leaves your browser — processed locally" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="relative z-10 flex items-start gap-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Privacy notice */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500 pb-2">
              <Lock size={11} className="shrink-0" />
              <p>Your PDF and chat history are stored locally in this browser tab only and are not saved to any server.</p>
            </div>

            {/* Recent Chats */}
            {loadingSessions ? (
              <div className="relative z-10">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white" style={{ fontFamily: "var(--font-fraunces)" }}>Recent Chats</h3>
                    <p className="text-[11px] text-slate-500">Continue where you left off</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse">
                      <div className="flex items-center justify-between gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0" />
                        <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                          <div className="w-16 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                          <div className="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                          <div className="w-20 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                        <div className="w-10 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : recentSessions.length > 0 && (
              <div className="relative z-10">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white" style={{ fontFamily: "var(--font-fraunces)" }}>Recent Chats</h3>
                    <p className="text-[11px] text-slate-500">Continue where you left off</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {recentSessions.map((session) => (
                    <div
                      key={session.documentId}
                      onClick={() => loadSession(session)}
                      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200 cursor-pointer flex flex-col"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                          <FileText size={16} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div className="min-w-0 flex-1 text-right">
                          <p className="font-semibold text-sm text-slate-500 dark:text-slate-400 line-clamp-1 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">{session.fileName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleBookmark(e, session.documentId)}
                          className="shrink-0 p-1 rounded-md transition-colors"
                          title={bookmarked.has(session.documentId) ? "Remove bookmark" : "Bookmark"}
                        >
                          <Bookmark size={13} className={bookmarked.has(session.documentId) ? "text-amber-500 fill-amber-500" : "text-slate-400 hover:text-amber-500"} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => deleteSession(e, session)}
                          disabled={deletingSessionId === session.documentId}
                          className="shrink-0 p-1 rounded-md text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-50"
                          title="Delete session"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span className="font-medium">{session.fileSizeMB} MB</span>
                          <span>·</span>
                          <span>{session.messageCount} msgs</span>
                          <span>·</span>
                          <span>{new Date(session.lastMessageAt).toLocaleDateString()}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600 dark:text-green-400">
                          Open <ArrowRight className="w-3 h-3 -rotate-45" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extracting phase */}
      {phase === "extracting" && (
        <div className="flex flex-1 flex-col w-full h-full overflow-y-auto">
          {/* Header — matches upload phase */}
          <div className="w-full px-6 sm:px-10 lg:px-16 pt-10 pb-6 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center shrink-0">
                <Loader2 size={24} className="text-white animate-spin" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Processing PDF
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Extracting text from your document — this may take a moment
                </p>
              </div>
            </div>
          </div>

          {/* Main content — centered progress card spanning most of the area */}
          <div className="flex-1 px-6 sm:px-10 lg:px-16 pb-10 flex flex-col gap-6">
            <div className="w-full flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-8 p-10 min-h-[340px]">

              {/* Spinner */}
              <div className="w-24 h-24 rounded-3xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <Loader2 size={48} className="text-green-600 animate-spin" />
              </div>

              {/* File info */}
              <div className="text-center">
                <p className="font-semibold text-base text-slate-700 dark:text-slate-300 truncate max-w-sm">{fileName}</p>
                <p className="text-sm text-slate-400 mt-1">{fileSizeMB} MB</p>
              </div>

              {/* Progress — aria-live="polite" for screen reader announcements */}
              <div
                aria-live="polite"
                aria-atomic="true"
                className="text-center space-y-3 w-full max-w-md"
              >
                <p className="text-base font-medium text-slate-700 dark:text-slate-300">
                  {extractionProgress.mode === "ocr"
                    ? `OCR processing page ${extractionProgress.current} of ${extractionProgress.total}`
                    : extractionProgress.total > 0
                      ? `Extracting: ${extractionProgress.current} / ${extractionProgress.total} pages`
                      : "Reading PDF…"
                  }
                </p>
                {extractionProgress.total > 0 && (
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((extractionProgress.current / extractionProgress.total) * 100)}%` }}
                    />
                  </div>
                )}
                {extractionProgress.total > 0 && (
                  <p className="text-sm text-slate-400">
                    {Math.round((extractionProgress.current / extractionProgress.total) * 100)}% complete
                  </p>
                )}
              </div>

              {/* Cancel button */}
              <button
                type="button"
                onClick={() => {
                  cancelRef.current = true;
                  setPhase("upload");
                  setExtractionProgress({ current: 0, total: 0, mode: "text" });
                }}
                className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saving phase — uploading extracted text to backend */}
      {phase === "saving" && (
        <div className="flex flex-1 flex-col w-full h-full overflow-y-auto">
          <div className="w-full px-6 sm:px-10 lg:px-16 pt-10 pb-6 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center shrink-0">
                <Loader2 size={24} className="text-white animate-spin" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Saving document
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Storing your PDF so you can pick up any previous conversations
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1 px-6 sm:px-10 lg:px-16 pb-10 flex flex-col gap-6">
            <div className="w-full flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-6 p-10 min-h-[340px]">
              <div className="w-24 h-24 rounded-3xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <BookOpen size={48} className="text-green-600" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-base font-semibold text-slate-700 dark:text-slate-200 truncate max-w-sm">{fileName}</p>
                <p className="text-sm text-slate-400">Saving to your document library…</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {phase === "chat" && (
        <div className="flex flex-1 flex-col h-full min-h-0">

          {/* ── Top bar — floating, centered, minimal (matches ReportEditor) ── */}
          <div className="fixed top-[68px] left-0 lg:left-[240px] right-0 z-50 flex items-center justify-center h-10 mt-2">
            <div className="flex items-center justify-between gap-3 w-full max-w-[800px] px-6 py-1 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm rounded-b-xl">
              <button
                type="button"
                onClick={() => setPhase("upload")}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-md bg-green-600 flex items-center justify-center shrink-0">
                  <FileText size={12} className="text-white" />
                </div>
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200 min-w-0">{fileName}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] text-slate-400">{fileSizeMB} MB</span>
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  title="Clear chat"
                  className="inline-flex items-center justify-center h-6 w-6 rounded-md text-rose-500 transition-colors hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  <Trash2 size={13} className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Banners ── */}
          {showTruncationBanner && (
            <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 shrink-0">
              <AlertCircle size={14} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Large document — AI is working from the beginning of the document.
              </p>
              <button type="button" onClick={() => setShowTruncationBanner(false)} className="ml-auto text-amber-400 hover:text-amber-600 focus:outline-none">
                <X size={14} />
              </button>
            </div>
          )}
          {showLowTextBanner && (
            <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 px-4 py-2.5 shrink-0">
              <AlertCircle size={14} className="text-orange-500 shrink-0" />
              <p className="text-xs text-orange-700 dark:text-orange-400">
                Very little text was extracted. Results may be limited.
              </p>
              <button type="button" onClick={() => setShowLowTextBanner(false)} className="ml-auto text-orange-400 hover:text-orange-600 focus:outline-none">
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── Messages area ── */}
          <div
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
            className="flex-1 overflow-y-auto pt-14 bg-white dark:bg-slate-900 relative z-10"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[40vh] p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
                  <Bot size={22} className="text-green-600" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Ready to answer questions</p>
                <p className="text-xs text-slate-400">Ask anything about your PDF document</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 pb-36 space-y-4">
                <AnimatePresence>
                  {messages.map((message, idx) => {
                    const isUser = message.role === "user";
                    const isLast = idx === messages.length - 1;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        ref={isLast ? latestMessageRef : null}
                        tabIndex={isLast ? -1 : undefined}
                      >
                        {/* AI avatar — left side only */}
                        {!isUser && (
                          <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center shrink-0 mt-1 mr-2.5">
                            <Bot size={14} className="text-white" />
                          </div>
                        )}

                        <div className={`max-w-[75%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                          {/* Bubble */}
                          <div className={`px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed ${
                            isUser
                              ? "bg-green-600 text-white rounded-br-sm"
                              : "bg-gradient-to-br from-[#FAFAF7] to-slate-100 dark:from-slate-800 dark:to-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-sm"
                          }`}>
                            <div
                              dangerouslySetInnerHTML={createSafeHTMLFragment(renderFormattedContent(message.content))}
                            />
                          </div>
                          {/* Page citations — only on AI messages */}
                          {!isUser && message.citedPages?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5 px-1">
                              {message.citedPages.map((p) => (
                                <span
                                  key={p}
                                  className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full px-2 py-0.5"
                                >
                                  <FileText size={9} />
                                  p.{p}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Timestamp */}
                          {message.timestamp && (
                            <span className="text-[10px] text-slate-400 mt-1 px-1">
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>

                        {/* User avatar — right side only */}
                        {isUser && (
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-1 ml-2.5">
                            <User size={14} className="text-slate-600 dark:text-slate-300" />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Three-dot loader */}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center shrink-0 mt-1 mr-2.5">
                      <Bot size={14} className="text-white" />
                    </div>
                    <div className="bg-gradient-to-br from-[#FAFAF7] to-slate-100 dark:from-slate-800 dark:to-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ── Input bar ── */}
          <div className="sticky bottom-0 left-0 w-full px-4 pb-4 pt-2 bg-gradient-to-t from-slate-50 dark:from-slate-950 via-slate-50/90 dark:via-slate-950/90 to-transparent shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-lg ring-1 ring-transparent focus-within:ring-green-400/30 focus-within:border-green-300 dark:focus-within:border-green-700 transition-all">
                <textarea
                  data-id="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask a question about your PDF…"
                  rows={1}
                  disabled={isSending}
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-40 min-h-[32px] py-2 px-2 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 text-sm outline-none"
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || isSending}
                  className={`p-2.5 rounded-xl transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${
                    input.trim() && !isSending
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-center text-[11px] text-slate-400 mt-2">AI answers are based on your PDF only. Always verify important information.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
