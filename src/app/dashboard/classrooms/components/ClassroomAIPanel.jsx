"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot, User, X, Loader2, RefreshCw, HelpCircle, BookOpen, Lightbulb } from "lucide-react";
import { apiClient } from "@/lib/csrfClient";
import { toast } from "sonner";

export default function ClassroomAIPanel({ classroom, user, activeTab, isInstructor, isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello! I am your AI Teaching Assistant for ${classroom?.name || "this classroom"}. How can I assist you with course content, assignments, or study strategies today?`,
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

  const quickPrompts = isInstructor
    ? [
        "Suggest a quick quiz topic for next week",
        "How can I help struggling students?",
        "Draft an announcement for upcoming assignment",
      ]
    : [
        "Explain key topics in this course",
        "How should I prepare for upcoming assignments?",
        "Give me study tips for this subject",
      ];

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMessage = { role: "user", content: query.trim() };
    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const topicContext = `${classroom?.name || "Classroom"} - ${classroom?.subject || "Course"} (${activeTab} section)`;
      const res = await apiClient.post("/api/chat", {
        message: query.trim(),
        topic: topicContext,
        conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })),
      });

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
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
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
                  className={`max-w-[80%] rounded-xl p-3 leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-green-600 text-white rounded-tr-none"
                      : "bg-card border border-border text-foreground rounded-tl-none"
                  }`}
                >
                  {msg.content}
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
