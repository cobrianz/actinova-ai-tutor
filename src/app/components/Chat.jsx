"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  X,
  Trash2,
  Plus,
  MessageSquare,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import { useSearchParams } from "next/navigation";
import ConfirmModal from "./ConfirmModal";
import ActinovaLoader from "./ActinovaLoader";
import SessionGuard, { useEnsureSession } from "./SessionGuard";

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

  // Handle underline (using <u> tag, markdown doesn't have underline by default)
  html = html.replace(
    /<u>([^<]+?)<\/u>/g,
    '<u class="underline decoration-2">$1</u>'
  );
  html = html.replace(
    /\[u\]([^\[]+?)\[\/u\]/g,
    '<u class="underline decoration-2">$1</u>'
  );

  // Handle inline code `code`
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-sm font-mono text-blue-600 dark:text-blue-400">$1</code>'
  );

  // Handle line breaks
  html = html.replace(/\n/g, "<br />");

  return html;
};

export default function Chat({ topic: propTopic }) {
  const searchParams = useSearchParams();
  const urlTopic = searchParams.get("topic");

  // Initialize topic from prop, URL params, or null
  const [topic, setTopic] = useState(() => {
    if (propTopic) return propTopic;
    if (urlTopic) return decodeURIComponent(urlTopic);
    return null;
  });
  const [topicInput, setTopicInput] = useState("");
  const [showTopicInput, setShowTopicInput] = useState(!propTopic && !urlTopic);
  const messagesEndRef = useRef(null);
  const { user, authLoading } = useEnsureSession();

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
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [chatTopics, setChatTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
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

  // Load history when topic changes or component mounts
  useEffect(() => {
    if (topic && user) {
      setLoadingHistory(true);
      // Clear messages first
      setMessages([]);
      loadChatHistory(topic).then((history) => {
        setMessages(history);
        setLoadingHistory(false);
      });
    } else {
      setMessages([]);
    }
  }, [topic, user]);

  // Load topics on mount
  useEffect(() => {
    if (user) {
      loadChatTopics();
    }
  }, [user]);

  // Reload topics when messages change
  useEffect(() => {
    if (messages.length > 0 && user) {
      loadChatTopics();
    }
  }, [messages.length, user]);

  // Save history whenever messages change (debounced)
  useEffect(() => {
    if (messages.length > 0 && topic && user) {
      const timeoutId = setTimeout(() => {
        saveChatHistory(messages, topic);
      }, 1000); // Debounce by 1 second

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
      toast.info("New chat started. Enter a topic to begin.");
    }
  };

  const confirmNewChat = () => {
    setTopic(null);
    setMessages([]);
    setShowTopicInput(true);
    setInput("");
    setShowNewChatModal(false);
    toast.info("New chat started. Enter a topic to begin.");
  };

  const handleLoadTopic = async (topicName) => {
    // Clear current messages first to prevent showing wrong content
    setMessages([]);
    setLoadingHistory(true);
    setTopic(topicName);
    setShowTopicInput(false);

    // Small delay to ensure state is cleared
    await new Promise((resolve) => setTimeout(resolve, 100));

    const history = await loadChatHistory(topicName);
    setMessages(history);
    setLoadingHistory(false);
    toast.success(`Loaded chat: ${topicName}`);
  };

  const handleClearTopic = () => {
    setTopic(null);
    setMessages([]);
    setShowTopicInput(true);
    toast.info("Topic cleared. You can set a new topic.");
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
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        setMessages([]);
        setShowClearHistoryModal(false);
        toast.success("Chat history cleared");
        // Reload topics
        loadChatTopics();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to clear chat history");
      }
    } catch (error) {
      console.error("Error clearing chat history:", error);
      toast.error("Failed to clear chat history");
    }
  };

  const handleDeleteTopic = (topicName, e) => {
    e.stopPropagation(); // Prevent loading the topic
    setTopicToDelete(topicName);
    setShowDeleteModal(true);
  };

  const confirmDeleteTopic = async () => {
    if (!topicToDelete) return;

    try {
      const response = await fetch(
        `/api/chat/history?topic=${encodeURIComponent(topicToDelete)}&action=delete`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        toast.success(`Chat "${topicToDelete}" deleted`);
        // If deleted topic is currently active, clear it
        if (topic === topicToDelete) {
          setTopic(null);
          setMessages([]);
          setShowTopicInput(true);
        }
        // Reload topics
        loadChatTopics();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to delete chat");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    } finally {
      setShowDeleteModal(false);
      setTopicToDelete(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Check if user is Pro
    if (!isPro) {
      toast.error(
        "Premium subscription required for AI tutor chat. Please upgrade to Pro."
      );
      return;
    }

    // Check if topic is set
    if (!topic) {
      toast.error("Please set a topic first to start the conversation");
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
    setLoading(true);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
          topic: topic, // Pass topic to API for topic-guided responses
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

        // Save to database
        await saveChatHistory(finalMessages, topic);
      } else {
        // Remove user message if API call failed
        setMessages((prev) => prev.slice(0, -1));
        toast.error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Remove user message on error
      setMessages((prev) => prev.slice(0, -1));
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Check if user is Pro: (subscription.plan === "pro" && status === "active") || isPremium
  const isPro =
    user &&
    ((user.subscription &&
      user.subscription.plan === "pro" &&
      user.subscription.status === "active") ||
      user.isPremium);

  return (
    <div className="flex w-full h-[calc(100vh-12rem)] min-h-[800px] max-h-[1000px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Chat History Sidebar */}
      <div
        className={`${sidebarOpen ? (sidebarMinimized ? "w-16" : "w-64") : "w-0"} transition-all duration-300 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden`}
      >
        {sidebarOpen && (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              {!sidebarMinimized ? (
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>Chat History</span>
                  </h3>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSidebarMinimized(true)}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Minimize"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={() => setSidebarMinimized(false)}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Expand"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
              )}
            </div>
            {!sidebarMinimized && (
              <div className="flex-1 overflow-y-auto p-2">
                {loadingTopics ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Loading...
                    </p>
                  </div>
                ) : chatTopics.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No chat history</p>
                    <p className="text-xs mt-1">
                      Start a conversation to see it here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {chatTopics.map((chat) => (
                      <div
                        key={chat.id || chat.topic}
                        className={`group relative w-full rounded-xl transition-all duration-200 ${topic === chat.topic
                          ? "bg-blue-600 text-white"
                          : "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                          }`}
                      >
                        <button
                          onClick={() => handleLoadTopic(chat.topic)}
                          className="w-full text-left p-3 pr-10"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium truncate ${topic === chat.topic
                                  ? "text-white dark:text-white"
                                  : "text-gray-900 dark:text-gray-100"
                                  }`}
                              >
                                {chat.topic}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span
                                  className={`text-xs ${topic === chat.topic
                                    ? "text-blue-100 dark:text-blue-200"
                                    : "text-gray-500 dark:text-gray-400"
                                    }`}
                                >
                                  {chat.messageCount} messages
                                </span>
                                {chat.lastMessageAt && (
                                  <span
                                    className={`text-xs flex items-center ${topic === chat.topic
                                      ? "text-blue-100 dark:text-blue-200"
                                      : "text-gray-400 dark:text-gray-500"
                                      }`}
                                  >
                                    <Clock className="w-3 h-3 mr-1" />
                                    {new Date(
                                      chat.lastMessageAt
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={(e) => handleDeleteTopic(chat.topic, e)}
                          className={`absolute top-2 right-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${topic === chat.topic
                            ? "hover:bg-blue-600 text-white"
                            : "hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                            }`}
                          title="Delete chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                  AI Tutor
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your personal learning assistant
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                title={sidebarOpen ? "Hide chat history" : "Show chat history"}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button
                onClick={handleNewChat}
                className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                title="Start new chat"
              >
                <Plus className="w-4 h-4" />
              </button>
              {messages.length > 0 && topic && (
                <button
                  onClick={handleClearHistory}
                  className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Clear chat history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {topic && (
                <button
                  onClick={handleClearTopic}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Clear topic"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Topic Input or Display */}
          {showTopicInput ? (
            <div className="flex items-center space-x-2 mt-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSetTopic();
                  }
                }}
                placeholder="Enter topic to discuss..."
                className="flex-1 px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <button
                onClick={handleSetTopic}
                disabled={!topicInput.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold"
              >
                Set Topic
              </button>
            </div>
          ) : topic ? (
            <div className="flex items-center space-x-2 mt-2 px-4 py-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Topic: <span className="font-bold text-blue-600 dark:text-blue-400">{topic}</span>
              </span>
            </div>
          ) : null}
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-transparent"
          style={{ scrollbarWidth: "thin" }}
        >
          {loadingHistory && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading chat history...</p>
            </div>
          )}
          {!loadingHistory && messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start a conversation with your AI tutor!</p>
              <p className="text-sm mt-2">
                {topic
                  ? `Ask questions about ${topic}. I'll help you learn and stay focused on this topic!`
                  : "Please set a topic above to start the conversation."}
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-300`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 transition-all duration-300 ${message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                  }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className={`p-1.5 rounded-full ${message.role === "user"
                      ? "bg-blue-500"
                      : "bg-gradient-to-r from-blue-500 to-purple-500"
                      }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <span className="text-xs font-semibold opacity-90">
                    {message.role === "user" ? "You" : "AI Tutor"}
                  </span>
                </div>
                <div
                  className={`prose prose-sm dark:prose-invert max-w-none ${message.role === "user"
                    ? "prose-invert text-white"
                    : "text-gray-900 dark:text-gray-100"
                    }`}
                  dangerouslySetInnerHTML={{
                    __html: renderFormattedContent(message.content),
                  }}
                />
                <p
                  className={`text-xs mt-2 ${message.role === "user"
                    ? "text-blue-100 opacity-80"
                    : "text-gray-500 dark:text-gray-400"
                    }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 max-w-[85%] sm:max-w-[75%] shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    AI Tutor is typing...
                  </span>
                </div>
                <div className="flex space-x-1.5 mt-3 ml-6">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 sm:p-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 backdrop-blur-xl">
          {isPro ? (
            <div className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  topic
                    ? `Ask about ${topic}...`
                    : "Set a topic first to start chatting..."
                }
                className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm sm:text-base"
                disabled={loading || !topic}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading || !topic}
                className="px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 transition-all font-bold"
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          ) : (
            <div className="text-center">
              <Sparkles className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Upgrade to Pro for AI Tutor Chat
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get unlimited access to our AI tutor for personalized learning
                assistance.
              </p>
              <button
                onClick={() => (window.location.href = "/pricing")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
              >
                Upgrade to Pro
              </button>
            </div>
          )}
          {isPro && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
              Use <strong>**bold**</strong>, <em>*italics*</em>, or{" "}
              <u>[u]underline[/u]</u> in your messages
            </p>
          )}
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onConfirm={confirmNewChat}
        title="Start New Chat"
        message="Start a new chat? Current conversation will be saved."
        confirmText="Start New Chat"
        cancelText="Cancel"
        confirmColor="blue"
      />

      <ConfirmModal
        isOpen={showClearHistoryModal}
        onClose={() => setShowClearHistoryModal(false)}
        onConfirm={confirmClearHistory}
        title="Clear Chat History"
        message={`Are you sure you want to clear all chat history for "${topic}"? This action cannot be undone.`}
        confirmText="Clear History"
        cancelText="Cancel"
        confirmColor="red"
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTopicToDelete(null);
        }}
        onConfirm={confirmDeleteTopic}
        title="Delete Chat"
        message={`Are you sure you want to delete "${topicToDelete}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
      />
    </div>
  );
}
