"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot, User, X, Loader2, RefreshCw, HelpCircle, BookOpen, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiClient } from "@/lib/csrfClient";
import { toast } from "sonner";

export default function ClassroomAIPanel({ classroom, user, activeTab, isInstructor, isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello! I am your AI Teaching Assistant for **${classroom?.name || "this classroom"}**. How can I assist you with course content, assignments, or study strategies today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!classroom?.id) return;
    try {
      const saved = localStorage.getItem(`classroom_ai_chat_${classroom.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {}
  }, [classroom?.id]);

  useEffect(() => {
    if (!classroom?.id || messages.length <= 1) return;
    try {
      localStorage.setItem(`classroom_ai_chat_${classroom.id}`, JSON.stringify(messages));
    } catch {}
  }, [messages, classroom?.id]);

  const getDynamicPrompts = () => {
    if (isInstructor) {
      switch (activeTab) {
        case "assignments":
          return [
            "Help me generate 3 assignment instructions",
            "Suggest grading rubric criteria for a project",
            "Draft a feedback template for students",
          ];
        case "grades":
          return [
            "Analyze class grade distribution",
            "How can I help students failing this course?",
            "Draft an email to students with low scores",
          ];
        case "attendance":
          return [
            "Summarize student attendance trends",
            "Draft attendance warning email for at-risk students",
            "What strategies improve class attendance?",
          ];
        case "materials":
          return [
            "Suggest supplementary reading list for this subject",
            "Create a study guide outline for Module 1",
            "Generate lecture summary notes",
          ];
        default:
          return [
            "Suggest a quick quiz topic for next week",
            "Draft a class announcement for upcoming deadlines",
            "How can I structure next week's lesson plan?",
          ];
      }
    } else {
      switch (activeTab) {
        case "assignments":
          return [
            "How should I structure my upcoming assignment?",
            "Give me a study plan to finish my assignments on time",
            "Explain common mistakes to avoid on quizzes",
          ];
        case "grades":
          return [
            "How can I improve my weighted average score?",
            "What assignments have the highest weight in my grade?",
            "Help me set target scores for remaining work",
          ];
        case "attendance":
          return [
            "What is the class attendance requirement?",
            "How does attendance impact my final grade?",
            "Help me write an absence excuse note",
          ];
        case "calendar":
          return [
            "What are all my upcoming due dates this month?",
            "How should I schedule my weekly study hours?",
            "Remind me of major exam and project dates",
          ];
        default:
          return [
            "Explain core concepts in this course step by step",
            "Give me 5 practice questions for this subject",
            "Summarize what I need to focus on this week",
          ];
      }
    }
  };

  const quickPrompts = getDynamicPrompts();

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMessage = { role: "user", content: query.trim() };
    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const endpoint = classroom?.id ? `/api/classrooms/${classroom.id}/chat` : "/api/chat";
      const payload = classroom?.id
        ? { message: query.trim(), activeTab, conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })) }
        : { message: query.trim(), topic: `${classroom?.name || "Classroom"} - ${classroom?.subject || "Course"}`, conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })) };
      
      const res = await apiClient.post(endpoint, payload);
      const data = await res.json();
      if (data.response) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      } else {
        toast.error(data.error || "Failed to get AI response");
      }
    } catch (err) {
      console.error("AI Assistant Error:", err);
      toast.error("An error occurred while connecting to AI assistant");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-background border-l border-border h-full flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-card">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">AI Classroom Assistant</h3>
                <p className="text-[10px] text-muted-foreground">{classroom?.name || "Academic Assistant"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (confirm("Clear conversation history?")) {
                    const initial = [
                      {
                        role: "assistant",
                        content: `Hello! I am your AI Teaching Assistant for **${classroom?.name || "this classroom"}**. How can I assist you with course content, assignments, or study strategies today?`,
                      },
                    ];
                    setMessages(initial);
                    if (classroom?.id) {
                      localStorage.removeItem(`classroom_ai_chat_${classroom.id}`);
                    }
                  }
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Clear Chat History"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-green-500" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl p-3 leading-relaxed ${
                    msg.role === "user"
                      ? "bg-green-600 text-white rounded-tr-none whitespace-pre-wrap"
                      : "bg-card border border-border text-foreground rounded-tl-none prose prose-xs dark:prose-invert max-w-none"
                  }`}
                >
                  {msg.role === "user" ? (
                    msg.content
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-xs">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 text-xs pl-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 text-xs pl-1">{children}</ol>,
                        li: ({ children }) => <li className="text-xs leading-normal">{children}</li>,
                        h1: ({ children }) => <h1 className="text-sm font-bold mt-2 mb-1 text-foreground">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xs font-bold mt-2 mb-1 text-foreground">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xs font-semibold mt-1.5 mb-1 text-foreground">{children}</h3>,
                        code: ({ inline, children }) =>
                          inline ? (
                            <code className="bg-secondary px-1.5 py-0.5 rounded text-[11px] font-mono text-green-600 dark:text-green-400">
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-secondary p-2 rounded-lg text-[11px] font-mono overflow-x-auto my-2 border border-border">
                              <code>{children}</code>
                            </pre>
                          ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-green-500 pl-2.5 my-2 italic text-muted-foreground text-xs">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 items-center text-muted-foreground">
                <div className="w-7 h-7 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-green-500" />
                </div>
                <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-green-500" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length < 4 && !loading && (
            <div className="px-4 py-2 border-t border-border bg-secondary/30">
              <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-500" /> Suggested Prompts
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="text-[10px] bg-card hover:bg-secondary border border-border px-2.5 py-1 rounded-full text-foreground transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 border-t border-border bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your AI assistant..."
                disabled={loading}
                className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30 text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl disabled:opacity-40 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
