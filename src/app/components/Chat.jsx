"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send, Bot, User, Sparkles, Plus, MessageSquare, X,
  Trash2, Search, Loader2, Hash
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import ConfirmModal from "./ConfirmModal";
import { useAuth } from "./AuthProvider";
import ActirovaLoader from "./ActirovaLoader";
import { apiClient } from "@/lib/csrfClient";
import { motion, AnimatePresence } from "framer-motion";

// Render markdown-like formatting to HTML
const renderFormattedContent = (content) => {
  if (!content) return "";
  let html = content;
  html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-slate-100">$1</strong>');
  html = html.replace(/__([^_]+?)__/g, '<strong class="font-semibold text-slate-900 dark:text-slate-100">$1</strong>');
  html = html.replace(/\*([^*\n]+?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[13px] font-mono text-violet-600 dark:text-violet-400">$1</code>');
  html = html.replace(/\n/g, "<br />");
  return html;
};

const SUGGESTED_TOPICS = [
  "JavaScript fundamentals", "React hooks", "Python for beginners",
  "Machine learning basics", "Data structures & algorithms", "CSS animations",
  "SQL queries", "API design", "System design"
];

export default function Chat({ topic: propTopic }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTopic = searchParams.get("topic");

  const [topic, setTopic] = useState(() => {
    if (propTopic) return propTopic;
    if (urlTopic) return decodeURIComponent(urlTopic);
    return null;
  });
  const [topicInput, setTopicInput] = useState("");
  const [showTopicInput, setShowTopicInput] = useState(!propTopic && !urlTopic);
  const messagesEndRef = useRef(null);
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <ActirovaLoader />;
  if (!user) return null;

  const loadChatHistory = async (currentTopic) => {
    if (!currentTopic || !user) return [];
    try {
      const response = await apiClient.get(`/api/chat/history?topic=${encodeURIComponent(currentTopic)}`);
      if (response.ok) {
        const data = await response.json();
        return data.messages || [];
      }
    } catch (error) { console.error("Error loading chat history:", error); }
    return [];
  };

  const saveChatHistory = async (messagesToSave, currentTopic) => {
    if (!currentTopic || !user || messagesToSave.length === 0) return;
    try {
      await apiClient.post("/api/chat/history", { topic: currentTopic, messages: messagesToSave });
    } catch (error) { console.error("Error saving chat history:", error); }
  };

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [chatTopics, setChatTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [topicSearch, setTopicSearch] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);

  const loadChatTopics = async () => {
    if (!user) return;
    setLoadingTopics(true);
    try {
      const response = await apiClient.get("/api/chat/history?action=topics");
      if (response.ok) {
        const data = await response.json();
        setChatTopics(data.topics || []);
      }
    } catch (error) { console.error("Error loading chat topics:", error); }
    finally { setLoadingTopics(false); }
  };

  useEffect(() => {
    if (topic && user) {
      setLoadingHistory(true);
      setMessages([]);
      loadChatHistory(topic).then(history => { setMessages(history); setLoadingHistory(false); });
    } else { setMessages([]); }
  }, [topic, user]);

  useEffect(() => { if (user) loadChatTopics(); }, [user]);
  useEffect(() => { if (messages.length > 0 && user) loadChatTopics(); }, [messages.length, user]);

  useEffect(() => {
    if (messages.length > 0 && topic && user) {
      const t = setTimeout(() => saveChatHistory(messages, topic), 1000);
      return () => clearTimeout(t);
    }
  }, [messages, topic, user]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSetTopic = (t) => {
    const val = (t || topicInput).trim();
    if (!val) { toast.error("Please enter a topic"); return; }
    setTopic(val);
    setTopicInput("");
    setShowTopicInput(false);
  };

  const handleNewChat = () => {
    if (messages.length > 0) setShowNewChatModal(true);
    else { setTopic(null); setMessages([]); setShowTopicInput(true); setInput(""); }
  };

  const confirmNewChat = () => { setTopic(null); setMessages([]); setShowTopicInput(true); setInput(""); setShowNewChatModal(false); };

  const handleLoadTopic = async (topicName) => {
    setMessages([]); setLoadingHistory(true); setTopic(topicName); setShowTopicInput(false);
    await new Promise(r => setTimeout(r, 100));
    const history = await loadChatHistory(topicName);
    setMessages(history); setLoadingHistory(false);
  };

  const handleClearHistory = () => { if (topic) setShowClearHistoryModal(true); };
  const confirmClearHistory = async () => {
    if (!topic) return;
    try {
      const response = await apiClient.delete(`/api/chat/history?topic=${encodeURIComponent(topic)}`);
      if (response.ok) { setMessages([]); setShowClearHistoryModal(false); toast.success("Chat cleared"); loadChatTopics(); }
    } catch (error) { console.error(error); }
  };

  const handleDeleteTopic = (topicName, e) => { e.stopPropagation(); setTopicToDelete(topicName); setShowDeleteModal(true); };
  const confirmDeleteTopic = async () => {
    if (!topicToDelete) return;
    try {
      const response = await apiClient.delete(`/api/chat/history?topic=${encodeURIComponent(topicToDelete)}&action=delete`);
      if (response.ok) {
        toast.success(`Deleted "${topicToDelete}"`);
        if (topic === topicToDelete) { setTopic(null); setMessages([]); setShowTopicInput(true); }
        loadChatTopics();
      }
    } catch (error) { console.error(error); }
    finally { setShowDeleteModal(false); setTopicToDelete(null); }
  };

  const isPro = user && ((user.subscription && (user.subscription.plan === "pro" || user.subscription.plan === "enterprise") && user.subscription.status === "active") || user.isPremium);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!isPro) { toast.error("Premium subscription required for AI tutor chat."); router.push("/pricing"); return; }
    if (!topic) { toast.error("Please set a topic first."); return; }

    const userMessage = { role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsSending(true);

    try {
      const conversationHistory = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await apiClient.post("/api/chat", { message: userMessage.content, conversationHistory, topic });
      const data = await response.json();
      if (response.ok) {
        const aiMessage = { role: "assistant", content: data.response, timestamp: data.timestamp };
        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);
        await saveChatHistory(finalMessages, topic);
      } else { setMessages(prev => prev.slice(0, -1)); toast.error(data.error || "Failed to get response"); }
    } catch (error) { console.error("Chat error:", error); setMessages(prev => prev.slice(0, -1)); }
    finally { setIsSending(false); }
  };

  const filteredTopics = chatTopics.filter(c => c.topic?.toLowerCase().includes(topicSearch.toLowerCase()));

  return (
    <div className="flex w-full h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-[268px]" : "w-0"} transition-all duration-300 flex-shrink-0 overflow-hidden bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col absolute md:relative z-30 h-full`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">AI Tutor</span>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 md:hidden"><X size={14} /></button>
          </div>
          <button onClick={handleNewChat} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 text-sm font-semibold hover:bg-violet-100 transition-colors">
            <Plus size={15} /> New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <Search size={13} className="text-slate-400" />
            <input value={topicSearch} onChange={e => setTopicSearch(e.target.value)} placeholder="Search topics..." className="flex-1 bg-transparent text-xs text-slate-600 dark:text-slate-400 outline-none placeholder:text-slate-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loadingTopics ? (
            <div className="flex items-center justify-center py-8"><Loader2 size={16} className="animate-spin text-slate-300" /></div>
          ) : filteredTopics.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8 italic">No chat history yet</p>
          ) : filteredTopics.map(chat => (
            <div key={chat.id || chat.topic} onClick={() => { handleLoadTopic(chat.topic); if (window.innerWidth < 768) setSidebarOpen(false); }}
              className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${topic === chat.topic ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
              <MessageSquare size={14} className="shrink-0" />
              <span className="truncate flex-1 text-sm">{chat.topic}</span>
              <button onClick={e => handleDeleteTopic(chat.topic, e)} className="opacity-100 p-1 text-slate-300 hover:text-rose-500 rounded-lg transition-all"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Chat */}
      <div className="flex-1 flex flex-col relative w-full h-full min-w-0">

        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <MessageSquare size={18} className={sidebarOpen ? "text-violet-600" : ""} />
            </button>
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate max-w-[200px] md:max-w-md">{topic || "New Chat"}</p>
              {topic && <p className="text-[10px] text-slate-400">Actinova AI Study Companion</p>}
            </div>
          </div>
          {topic && (
            <button onClick={handleClearHistory} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors" title="Clear chat context">
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {showTopicInput ? (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-600/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">How can I help you learn?</h2>
              <p className="text-slate-500 mb-8 text-sm">Enter a topic below or choose from common subjects</p>

              {/* Suggested topics */}
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {SUGGESTED_TOPICS.map(t => (
                  <button key={t} onClick={() => handleSetTopic(t)} className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-400 hover:border-violet-400 hover:text-violet-600 transition-all">
                    <Hash size={10} className="inline mr-1" />{t}
                  </button>
                ))}
              </div>

              <div className="w-full max-w-md relative">
                <input type="text" value={topicInput} onChange={e => setTopicInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSetTopic()} placeholder="Or type your own topic..." autoFocus
                  className="w-full px-5 py-4 pr-24 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm shadow-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none transition-all" />
                <button onClick={() => handleSetTopic()} className="absolute right-2 top-2 bottom-2 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition-colors">Start</button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 pb-36 space-y-8">
              {loadingHistory && (
                <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-slate-300" /></div>
              )}
              <AnimatePresence>
                {messages.map((message, idx) => {
                  const isUser = message.role === "user";
                  return (
                    <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 md:gap-5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isUser ? "bg-slate-200 dark:bg-slate-700" : "bg-violet-600"}`}>
                        {isUser ? <User size={16} className="text-slate-600 dark:text-slate-300" /> : <Bot size={16} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-400 mb-1.5">
                          {isUser ? "You" : "Actinova AI"}
                          <span className="ml-2 font-normal">{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div className="text-[15px] leading-7 text-slate-700 dark:text-slate-300"
                          dangerouslySetInnerHTML={{ __html: renderFormattedContent(message.content) }} />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {isSending && (
                <div className="flex gap-5">
                  <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shrink-0"><Bot size={16} className="text-white" /></div>
                  <div className="flex items-center gap-1.5 mt-3">
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        {!showTopicInput && (
          <div className="sticky bottom-0 left-0 w-full p-3 md:p-5 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-lg ring-1 ring-transparent focus-within:ring-violet-400/20 focus-within:border-violet-300 transition-all">
                <textarea value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={isPro ? "Message Actinova AI..." : "Upgrade to Pro to start chatting"}
                  rows={1} disabled={!isPro || isSending}
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-40 min-h-[32px] py-2 px-2 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 text-sm outline-none"
                  onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                />
                <button onClick={handleSend} disabled={!input.trim() || !isPro || isSending}
                  className={`p-2.5 rounded-xl transition-all shrink-0 ${input.trim() && isPro && !isSending ? "bg-violet-600 hover:bg-violet-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                  <Send size={16} />
                </button>
              </div>
              <p className="text-center text-[11px] text-slate-400 mt-2">Actinova can make mistakes. Verify important information.</p>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal isOpen={showNewChatModal} onClose={() => setShowNewChatModal(false)} onConfirm={confirmNewChat} title="Start New Chat" message="Current conversation will be saved." confirmText="Start New" cancelText="Cancel" confirmColor="black" />
      <ConfirmModal isOpen={showClearHistoryModal} onClose={() => setShowClearHistoryModal(false)} onConfirm={confirmClearHistory} title="Clear Chat" message="Clear this conversation's history?" confirmText="Clear" cancelText="Cancel" confirmColor="red" />
      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDeleteTopic} title="Delete Chat" message={`Delete "${topicToDelete}"?`} confirmText="Delete" cancelText="Cancel" confirmColor="red" />
    </div>
  );
}
