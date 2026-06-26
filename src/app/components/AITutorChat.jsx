"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, Send, Trash2, Bot, User, Copy, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { renderContent } from "@/lib/contentRenderer";
import LessonChart from "./LessonChart";
import LessonTable from "./LessonTable";

export default function AITutorChat({
  isRightPanelOpen,
  setIsRightPanelOpen,
  courseId,
  aiTutorEnabled,
  activeLesson,
  currentLesson,
  courseData,
}) {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const chatInitialized = useRef(false);

  useEffect(() => {
    if (!chatInitialized.current) {
      chatInitialized.current = true;
      const saved = sessionStorage.getItem(`chat_${courseId}`);
      if (saved) {
        try {
          setChatMessages(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
    }
  }, [courseId]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      sessionStorage.setItem(`chat_${courseId}`, JSON.stringify(chatMessages));
    }
  }, [chatMessages, courseId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (isRightPanelOpen && chatInputRef.current) {
      setTimeout(() => chatInputRef.current?.focus(), 100);
    }
  }, [isRightPanelOpen]);

  const clearChat = useCallback(() => {
    setChatMessages([]);
    sessionStorage.removeItem(`chat_${courseId}`);
    toast.success("Chat cleared");
  }, [courseId]);

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isChatLoading || !aiTutorEnabled) return;
    const userMessage = chatInput.trim();
    setChatInput("");

    const newMessages = [
      ...chatMessages,
      { role: "user", content: userMessage },
    ];
    setChatMessages(newMessages);

    setIsChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          courseId,
          lessonTitle: currentLesson?.title || "",
          moduleTitle:
            courseData?.modules?.find((m) => m.id === activeLesson.moduleId)
              ?.title || "",
        }),
      });
      if (!res.ok) throw new Error("Chat API error");
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply?.content || data.reply || "", lessonTitle: currentLesson?.title },
      ]);
    } catch (err) {
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, isChatLoading, aiTutorEnabled, chatMessages, courseId, currentLesson, courseData, activeLesson]);

  const copyMessage = useCallback(async (id, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div
      className={`${isRightPanelOpen ? "translate-x-0" : "translate-x-full"
        } w-full lg:w-96 bg-card border-l border-border flex flex-col fixed lg:sticky top-0 right-0 h-full z-[80] transition-transform duration-300 shadow-xl`}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">AI Tutor</h3>
          {isChatLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearChat}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsRightPanelOpen(false);
              setChatInput("");
            }}
            className="text-xs text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-secondary transition-all"
          >
            ✕
          </button>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4"
      >
        {chatMessages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-primary/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Ask questions about your lesson
            </p>
          </div>
        )}
        {chatMessages.map((msg, idx) => (
          <div key={idx} className="space-y-1">
            <div
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`flex space-x-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                    }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                    }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed" dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
                  ) : (
                    msg.content
                  )}
                  {msg.lessonTitle && (
                    <div className="mt-2 pt-2 border-t border-border/30 text-xs text-muted-foreground">
                      About: {msg.lessonTitle}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} px-10`}>
              <button
                onClick={() => copyMessage(idx, msg.content)}
                className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors flex items-center space-x-1"
              >
                {copiedMessageId === idx ? (
                  <>
                    <CheckCheck className="w-3 h-3" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
        {isChatLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-2 max-w-[85%]">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-secondary">
                <Bot className="w-4 h-4" />
              </div>
              <div className="rounded-2xl px-3.5 py-2.5 bg-secondary">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-border">
        {aiTutorEnabled ? (
          <div className="flex space-x-2">
            <input
              ref={chatInputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask about this lesson..."
              className="flex-1 px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              disabled={isChatLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isChatLoading}
              className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
            <p className="text-xs text-amber-600 font-medium">
              AI Tutor is not available for shared courses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
