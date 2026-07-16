"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { apiClient } from "@/lib/csrfClient";
import { createSafeHTMLFragment } from "@/../lib/sanitizer";
import UpgradeModal from "./UpgradeModal";
import ConfirmModal from "./ConfirmModal";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Send, FileText, Upload, X, Trash2, AlertCircle, CheckCircle, Loader2, UploadCloud, Lock } from "lucide-react";
import { extractPdfText, PdfExtractorError } from "@/lib/pdfExtractor";

// ─── Render markdown-like formatting to HTML (mirrors Chat.jsx) ───────────────
const renderFormattedContent = (content) => {
  if (!content) return "";
  let html = content;
  html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-slate-100">$1</strong>');
  html = html.replace(/__([^_]+?)__/g, '<strong class="font-semibold text-slate-900 dark:text-slate-100">$1</strong>');
  html = html.replace(/\*([^*\n]+?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[13px] font-mono text-green-600 dark:text-green-400">$1</code>');
  html = html.replace(/\n/g, "<br />");
  return html;
};

export default function ChatWithPDF() {
  // ─── Auth ──────────────────────────────────────────────────────────────────
  const { user, loading: authLoading, hasPurchased } = useAuth();

  // ─── Phase ─────────────────────────────────────────────────────────────────
  // "upload" | "extracting" | "chat"
  const [phase, setPhase] = useState("upload");

  // ─── Upload phase ──────────────────────────────────────────────────────────
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  // uploadError shape: { type: "mime"|"size"|"password"|"corrupt"|"empty"|"page_limit", message: string } | null

  // ─── File metadata ─────────────────────────────────────────────────────────
  const [fileName, setFileName] = useState("");
  const [fileSizeMB, setFileSizeMB] = useState(0);

  // ─── Extraction phase ──────────────────────────────────────────────────────
  const [extractionProgress, setExtractionProgress] = useState({ current: 0, total: 0, mode: "text" });
  // mode: "text" | "ocr"

  // ─── Chat phase ────────────────────────────────────────────────────────────
  const [extractedText, setExtractedText] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showTruncationBanner, setShowTruncationBanner] = useState(false);
  const [showLowTextBanner, setShowLowTextBanner] = useState(false);

  // ─── Modals ────────────────────────────────────────────────────────────────
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

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

  // ─── Effect: persist session whenever extractedText or messages change ─────
  useEffect(() => {
    if (!extractedText && messages.length === 0) return;
    const payload = JSON.stringify({
      sessionId,
      fileName,
      fileSizeMB,
      extractedText,
      messages,
      savedAt: new Date().toISOString(),
    });
    sessionStorage.setItem(sessionId, payload);
  }, [extractedText, messages, sessionId, fileName, fileSizeMB]);

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
      } = JSON.parse(raw);
      if (savedText) setExtractedText(savedText);
      if (savedMessages) setMessages(savedMessages);
      if (savedFileName) setFileName(savedFileName);
      if (savedSize !== undefined) setFileSizeMB(savedSize);
    } catch {
      // ignore malformed session data
    }
  }, [phase, sessionId]);

  // ─── startExtraction (task 5.3) ───────────────────────────────────────────
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
        onComplete: (text) => {
          if (cancelRef.current) return;
          setExtractedText(text);
          if (text.length < 50) setShowLowTextBanner(true);
          if (text.length > 12000) setShowTruncationBanner(true);
          setPhase("chat");
          // Focus the chat input after transition
          setTimeout(() => {
            document.querySelector('[data-id="chat-input"]')?.focus();
          }, 100);
        },
      });
    } catch (err) {
      if (cancelRef.current) return; // cancelled — no error to show
      const errorMessages = {
        password: "This PDF is password-protected and cannot be processed.",
        corrupt: "The PDF file could not be read. Please try a different file.",
        page_limit: "This PDF exceeds the 500-page limit.",
      };
      const message = (err instanceof PdfExtractorError && errorMessages[err.type])
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
    // Size validation (50 MB)
    if (file.size > 50 * 1024 * 1024) {
      setUploadError({ type: "size", message: "File exceeds the 50 MB limit." });
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

    if (!hasPurchased('course_generation')) {
      setShowUpgradeModal(true);
      return;
    }

    const userMessage = { role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsSending(true);

    try {
      const conversationHistory = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await apiClient.post("/api/chat/pdf", {
        message: userMessage.content,
        conversationHistory,
        extractedText: extractedText.slice(0, 12000),
      });
      const data = await response.json();
      if (response.ok) {
        addMessage({ role: "assistant", content: data.response, timestamp: data.timestamp });
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
      {/* Dotted background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(15,23,42,0.22)_1px,_transparent_1px)] [background-size:20px_20px] opacity-100 dark:hidden" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(255,255,255,0.65),_rgba(255,255,255,0.18))] dark:hidden" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.07)_1px,_transparent_1px)] [background-size:20px_20px] opacity-0 dark:opacity-100 hidden dark:block" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(0,0,0,0.3),_rgba(0,0,0,0.05))] opacity-0 dark:opacity-100 hidden dark:block" />
      </div>
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
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 flex flex-col gap-6">

            {/* Drop zone */}
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
              className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-12 cursor-pointer transition-colors
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900
                ${dragOver
                  ? "border-green-500 bg-green-50 dark:bg-green-900/10"
                  : "border-slate-300 dark:border-slate-700 hover:border-green-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
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

              {/* Drop zone content */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${dragOver ? "bg-green-100 dark:bg-green-900/30" : "bg-slate-100 dark:bg-slate-800"}`}>
                <UploadCloud size={28} className={dragOver ? "text-green-600" : "text-slate-400"} />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                  Drop your PDF here
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  or <span className="text-green-600 font-medium">click to browse</span>
                </p>
              </div>
              <p className="text-xs text-slate-400">PDF files only · Max 50 MB</p>
            </div>

            {/* Error banner */}
            {uploadError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3">
                <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-red-700 dark:text-red-400">{uploadError.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadError(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
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

            {/* Privacy notice */}
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <Lock size={12} className="shrink-0" />
              <p>
                Your PDF and chat history are stored locally in this browser tab only and are not saved to any server.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Extracting phase */}
      {phase === "extracting" && (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 flex flex-col items-center gap-6">
            
            {/* Spinner */}
            <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <Loader2 size={28} className="text-green-600 animate-spin" />
            </div>

            {/* File info */}
            <div className="text-center">
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-300 truncate max-w-xs">{fileName}</p>
              <p className="text-xs text-slate-400 mt-1">{fileSizeMB} MB</p>
            </div>

            {/* Progress — aria-live="polite" for screen reader announcements */}
            <div
              aria-live="polite"
              aria-atomic="true"
              className="text-center space-y-2 w-full"
            >
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {extractionProgress.mode === "ocr"
                  ? `OCR processing page ${extractionProgress.current} of ${extractionProgress.total}`
                  : extractionProgress.total > 0
                    ? `Extracting: ${extractionProgress.current} / ${extractionProgress.total} pages`
                    : "Reading PDF…"
                }
              </p>
              {/* Progress bar */}
              {extractionProgress.total > 0 && (
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((extractionProgress.current / extractionProgress.total) * 100)}%` }}
                  />
                </div>
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
      )}

      {/* Chat phase */}
      {phase === "chat" && (
        <div className="flex flex-1 flex-col h-full min-h-0">

          {/* ── Header: file info bar ── */}
          <div className="h-14 flex items-center justify-between px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center shrink-0">
                <FileText size={14} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate max-w-[200px] md:max-w-md">{fileName}</p>
                <p className="text-[10px] text-slate-400">{fileSizeMB} MB · PDF Chat</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Clear chat */}
              <button
                type="button"
                onClick={() => setMessages([])}
                title="Clear chat"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-1"
              >
                <Trash2 size={16} />
              </button>
              {/* Change PDF */}
              <button
                type="button"
                onClick={() => {
                  setPendingFile(null);
                  setShowReplaceModal(true);
                }}
                title="Change PDF"
                className="p-2 rounded-xl text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
              >
                <Upload size={16} />
              </button>
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
            className="flex-1 overflow-y-auto"
          >
            {messages.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center h-full min-h-[40vh] p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
                  <Bot size={22} className="text-green-600" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Ready to answer questions</p>
                <p className="text-xs text-slate-400">Ask anything about your PDF document</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 pb-36 space-y-8">
                <AnimatePresence>
                  {messages.map((message, idx) => {
                    const isUser = message.role === "user";
                    const isLast = idx === messages.length - 1;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 md:gap-5"
                        ref={isLast ? latestMessageRef : null}
                        tabIndex={isLast ? -1 : undefined}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isUser ? "bg-slate-200 dark:bg-slate-700" : "bg-green-600"}`}>
                          {isUser
                            ? <User size={16} className="text-slate-600 dark:text-slate-300" />
                            : <Bot size={16} className="text-white" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-400 mb-1.5">
                            {isUser ? "You" : "Actinova AI"}
                            {message.timestamp && (
                              <span className="ml-2 font-normal">
                                {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                          </div>
                          <div
                            className="text-[15px] leading-7 text-slate-700 dark:text-slate-300"
                            dangerouslySetInnerHTML={createSafeHTMLFragment(renderFormattedContent(message.content))}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Three-dot loading indicator (identical to Chat.jsx) */}
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
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ── Input bar ── */}
          <div className="sticky bottom-0 left-0 w-full p-3 md:p-5 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-lg ring-1 ring-transparent focus-within:ring-green-400/20 focus-within:border-green-300 transition-all">
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
