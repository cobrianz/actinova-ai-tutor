"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Plus,
  MessageSquare,
  X,
  Trash2,
  ChevronLeft,
  Search,
  MoreVertical,
  Paperclip
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import { useSearchParams } from "next/navigation";
import ConfirmModal from "./ConfirmModal";
import ActinovaLoader from "./ActinovaLoader";

// Function to render markdown/rich text formatting
const renderFormattedContent = (content) => {
  if (!content) return "";

  let html = content;

  // Handle bold **text** or __text__
  html = html.replace(
    /\*\*([^*]+?)\*\*/g,
    '<strong class="font-bold text-gray-900 dark:text-gray-100">$1</strong>'
  );
  html = html.replace(
    /__([^_]+?)__/g,
    '<strong class="font-bold text-gray-900 dark:text-gray-100">$1</strong>'
  );

  // Handle italics *text* or _text_
  html = html.replace(
    /\*([^*\n]+?)\*/g,
    '<em class="italic text-gray-800 dark:text-gray-200">$1</em>'
  );
  html = html.replace(
    /_([^_\n]+?)_/g,
    '<em class="italic text-gray-800 dark:text-gray-200">$1</em>'
  );

  // Handle underline
  html = html.replace(
    /<u>([^<]+?)<\/u>/g,
    '<u class="underline decoration-2">$1</u>'
  );

  // Handle inline code `code`
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-red-500 dark:text-red-400 border border-gray-200 dark:border-gray-700">$1</code>'
  );

  // Handle line breaks
  html = html.replace(/\n/g, "<br />");

  return html;
};

export default function Chat({ topic: propTopic }) {
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

  if (authLoading) return <ActinovaLoader />;
  if (!user) return null;

  // Load chat history from database
  const loadChatHistory = async (currentTopic) => {
    if (!currentTopic || !user) return [];

    try {
      const response = await fetch(
        `/api/chat/history?topic=${encodeURIComponent(currentTopic)}`,
        {
          credentials: "include",
          headers: {
            "x-user-id": user?._id || user?.id || "",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.messages || [];
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
    return [];
  };

  // Save chat history to database
  const saveChatHistory = async (messagesToSave, currentTopic) => {
    if (!currentTopic || !user || messagesToSave.length === 0) return;

    try {
      await fetch("/api/chat/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?._id || user?.id || "",
        },
        body: JSON.stringify({
          topic: currentTopic,
          messages: messagesToSave,
        }),
        credentials: "include",
      });
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  };

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [chatTopics, setChatTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);

  // Load chat topics list
  const loadChatTopics = async () => {
    if (!user) return;

    setLoadingTopics(true);
    try {
      const response = await fetch("/api/chat/history?action=topics", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setChatTopics(data.topics || []);
      }
    } catch (error) {
      console.error("Error loading chat topics:", error);
    } finally {
      setLoadingTopics(false);
    }
  };

  useEffect(() => {
    if (topic && user) {
      setLoadingHistory(true);
      setMessages([]);
      loadChatHistory(topic).then((history) => {
        setMessages(history);
        setLoadingHistory(false);
      });
    } else {
      setMessages([]);
    }
  }, [topic, user]);

  useEffect(() => {
    if (user) {
      loadChatTopics();
    }
  }, [user]);

  useEffect(() => {
    if (messages.length > 0 && user) {
      loadChatTopics();
    }
  }, [messages.length, user]);

  useEffect(() => {
    if (messages.length > 0 && topic && user) {
      const timeoutId = setTimeout(() => {
        saveChatHistory(messages, topic);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, topic, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSetTopic = () => {
    if (!topicInput.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    setTopic(topicInput.trim());
    setTopicInput("");
    setShowTopicInput(false);
    toast.success(`Topic set to: ${topicInput.trim()}`);
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      setShowNewChatModal(true);
    } else {
      setTopic(null);
      setMessages([]);
      setShowTopicInput(true);
      setInput("");
    }
  };

  const confirmNewChat = () => {
    setTopic(null);
    setMessages([]);
    setShowTopicInput(true);
    setInput("");
    setShowNewChatModal(false);
  };

  const handleLoadTopic = async (topicName) => {
    setMessages([]);
    setLoadingHistory(true);
    setTopic(topicName);
    setShowTopicInput(false);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const history = await loadChatHistory(topicName);
    setMessages(history);
    setLoadingHistory(false);
  };

  const handleClearTopic = () => {
    setTopic(null);
    setMessages([]);
    setShowTopicInput(true);
  };

  const handleClearHistory = () => {
    if (!topic) return;
    setShowClearHistoryModal(true);
  };

  const confirmClearHistory = async () => {
    if (!topic) return;
    try {
      const response = await fetch(
        `/api/chat/history?topic=${encodeURIComponent(topic)}`,
        { method: "DELETE", credentials: "include" }
      );
      if (response.ok) {
        setMessages([]);
        setShowClearHistoryModal(false);
        toast.success("Chat history cleared");
        loadChatTopics();
      }
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  };

  const handleDeleteTopic = (topicName, e) => {
    e.stopPropagation();
    setTopicToDelete(topicName);
    setShowDeleteModal(true);
  };

  const confirmDeleteTopic = async () => {
    if (!topicToDelete) return;
    try {
      const response = await fetch(
        `/api/chat/history?topic=${encodeURIComponent(topicToDelete)}&action=delete`,
        { method: "DELETE", credentials: "include" }
      );
      if (response.ok) {
        toast.success(`Chat "${topicToDelete}" deleted`);
        if (topic === topicToDelete) {
          setTopic(null);
          setMessages([]);
          setShowTopicInput(true);
        }
        loadChatTopics();
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    } finally {
      setShowDeleteModal(false);
      setTopicToDelete(null);
    }
  };

  const isPro =
    user &&
    ((user.subscription &&
      (user.subscription.plan === "pro" || user.subscription.plan === "enterprise") &&
      user.subscription.status === "active") ||
      user.isPremium);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!isPro) {
      toast.error("Premium subscription required for AI tutor chat. Please upgrade.");
      return;
    }
    if (!topic) {
      toast.error("Please set a topic first.");
      return;
    }

    const userMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessagesWithUser = [...messages, userMessage];
    setMessages(updatedMessagesWithUser);
    setInput("");
    setIsSending(true);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
          topic: topic,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        const aiMessage = {
          role: "assistant",
          content: data.response,
          timestamp: data.timestamp,
        };
        const finalMessages = [...updatedMessagesWithUser, aiMessage];
        setMessages(finalMessages);
        await saveChatHistory(finalMessages, topic);
      } else {
        setMessages((prev) => prev.slice(0, -1));
        toast.error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  // Modern "Tools" Chat Layout: Neutral, No Bubbles, Centered, Clean
  return (
    <div className="flex w-full h-full bg-white dark:bg-gray-950 overflow-hidden relative">

      {/* Sidebar - Collapsible, Dark/Light */}
      <div
        className={`${sidebarOpen ? "translate-x-0 w-[260px]" : "-translate-x-full w-0"} transition-all duration-300 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#171717] flex flex-col absolute md:relative z-20 h-full`}
      >
        <div className="p-3 mb-2 flex items-center justify-between">
          <button onClick={handleNewChat} className="flex-1 flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">New chat</span>
          </button>
          <button onClick={() => setSidebarOpen(false)} className="ml-2 p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white md:hidden">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <div className="text-xs font-medium text-gray-400 px-2 py-2">History</div>
          {chatTopics.length === 0 ? (
            <div className="text-xs text-gray-400 px-2">No previous chats</div>
          ) : (
            chatTopics.map((chat) => (
              <div
                key={chat.id || chat.topic}
                onClick={() => { handleLoadTopic(chat.topic); if (window.innerWidth < 768) setSidebarOpen(false); }}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm mb-1 ${topic === chat.topic
                    ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate flex-1">{chat.topic}</span>
                <button
                  onClick={(e) => handleDeleteTopic(chat.topic, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area - Minimalist Stream */}
      <div className="flex-1 flex flex-col relative w-full h-full bg-white dark:bg-[#0f0f0f]">

        {/* Header - Minimal */}
        <div className="h-14 flex items-center justify-between px-4 fixed top-0 w-full md:relative bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur z-10">
          <div className="flex items-center">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg">
                <ChevronLeft className="w-5 h-5 mx-auto md:hidden" />
                <MessageSquare className="w-5 h-5 hidden md:block" />
              </button>
            )}
            <span className="font-medium text-gray-700 dark:text-gray-200 ml-2">{topic || "New Chat"}</span>
          </div>
          <div className="flex items-center gap-1">
            {topic && (
              <button onClick={handleClearHistory} className="p-2 text-gray-400 hover:text-red-500 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          {showTopicInput && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto text-center px-4">
              <div className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-white dark:text-black" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">How can I help you learn today?</h2>
              <div className="w-full mt-8 relative">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSetTopic()}
                  placeholder="Enter a topic to start..."
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-gray-400 dark:focus:border-gray-500 focus:ring-0 outline-none text-lg"
                  autoFocus
                />
                <button
                  onClick={handleSetTopic}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium"
                >
                  Start
                </button>
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto space-y-8 pb-32">
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              return (
                <div key={index} className="flex gap-4 md:gap-6 animate-in fade-in duration-300">
                  {/* Avatar */}
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-sm mt-1">
                    {isUser ? (
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-sm flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-black dark:bg-white rounded-sm flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white dark:text-black" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                      {isUser ? "You" : "Actinova AI"}
                      <span className="text-xs font-normal text-gray-400 ml-2">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div
                      className="prose prose-base dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-7"
                      dangerouslySetInnerHTML={{ __html: renderFormattedContent(message.content) }}
                    />
                  </div>
                </div>
              );
            })}
            {isSending && (
              <div className="flex gap-4 md:gap-6">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-sm flex items-center justify-center mt-1">
                  <Bot className="w-5 h-5 text-white dark:text-black" />
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce mr-1"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce mr-1 delay-75"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Floating Input Area */}
        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-white dark:from-[#0f0f0f] via-white dark:via-[#0f0f0f] to-transparent pt-10">
          <div className="max-w-3xl mx-auto relative">
            <div className="relative flex items-end gap-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Attach (Demo)">
                <Plus className="w-5 h-5" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isPro ? "Send a message..." : "Upgrade to Pro to chat"}
                className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-48 min-h-[24px] py-2 text-gray-900 dark:text-white placeholder-gray-500"
                rows={1}
                disabled={!topic || !isPro || isSending}
                style={{ height: 'auto' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />
              <button
                onClick={handleSend}
                disabled={authLoading || !input.trim()}
                className={`p-1.5 rounded-lg transition-all ${input.trim()
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                  }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center mt-2">
              <p className="text-xs text-gray-400">Actinova can make mistakes. Verify important info.</p>
            </div>
          </div>
        </div>

      </div>

      <ConfirmModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onConfirm={confirmNewChat}
        title="Start New Chat"
        message="Start a new chat? Current conversation will be saved."
        confirmText="Start New Chat"
        cancelText="Cancel"
        confirmColor="black"
      />

      <ConfirmModal isOpen={showClearHistoryModal} onClose={() => setShowClearHistoryModal(false)} onConfirm={confirmClearHistory} title="Clear Context" message="Clear chat context?" confirmText="Clear" cancelText="Cancel" confirmColor="red" />
      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDeleteTopic} title="Delete Chat" message="Delete this chat?" confirmText="Delete" cancelText="Cancel" confirmColor="red" />

    </div>
  );
}
