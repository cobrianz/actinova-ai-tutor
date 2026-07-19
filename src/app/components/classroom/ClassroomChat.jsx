"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { Send, MessageSquare, Loader2, AlertCircle, RefreshCw } from "lucide-react";

const MAX_CHARS = 2000;
const TYPING_THROTTLE_MS = 2000;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";

function formatTimestamp(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ClassroomChat({ classroomId, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [connectionState, setConnectionState] = useState("connecting");
  const [authError, setAuthError] = useState(null);
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);
  const lastTypingEmit = useRef(0);
  const socketRef = useRef(null);
  const typingUsersRef = useRef({});

  useEffect(() => {
    const socket = io(SOCKET_URL || window.location.origin, {
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3,
    });
    socketRef.current = socket;

    let retryCount = 0;

    socket.on("connect", () => {
      setConnectionState("connected");
      setAuthError(null);
      socket.emit("join_room", { classroomId });
    });

    socket.on("connect_error", () => {
      retryCount++;
      if (retryCount < 3) {
        setConnectionState("retrying");
      } else {
        setConnectionState("failed");
      }
    });

    socket.on("message_history", (history) => {
      setMessages(history);
    });

    socket.on("new_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("user_typing", ({ userId, userName }) => {
      setTypingUsers((prev) => {
        const exists = prev.find((u) => u.userId === userId);
        if (exists) return prev;
        return [...prev, { userId, userName }];
      });
      if (typingUsersRef.current[userId]) {
        clearTimeout(typingUsersRef.current[userId]);
      }
      typingUsersRef.current[userId] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        delete typingUsersRef.current[userId];
      }, 3000);
    });

    socket.on("authorization_error", ({ message }) => {
      setAuthError(message);
    });

    const timers = typingUsersRef.current;
    return () => {
      socket.disconnect();
      Object.values(timers).forEach(clearTimeout);
    };
  }, [classroomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      setInputError("Message cannot be empty");
      return;
    }
    if (trimmed.length > MAX_CHARS) {
      setInputError(`Message too long (max ${MAX_CHARS} chars)`);
      return;
    }
    setInputError("");
    socketRef.current?.emit("send_message", { classroomId, content: trimmed });
    setInput("");
  }, [input, classroomId]);

  const handleInputChange = useCallback(
    (e) => {
      setInput(e.target.value);
      const now = Date.now();
      if (now - lastTypingEmit.current > TYPING_THROTTLE_MS) {
        socketRef.current?.emit("typing", { classroomId });
        lastTypingEmit.current = now;
      }
    },
    [classroomId]
  );

  const isOwnMessage = (msg) => {
    const senderId = msg.senderId?.toString?.() || msg.senderId;
    const myId = user?._id?.toString?.() || user?._id || user?.id;
    return senderId === myId;
  };

  if (connectionState === "failed" && !authError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Chat unavailable
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-4">
          Could not connect to the chat server.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[400px]">
      {/* Connection status bar */}
      {(connectionState === "connecting" || connectionState === "retrying") && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Connection failed. Retrying...
        </div>
      )}

      {authError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 border-b border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5" />
          {authError}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.length === 0 && connectionState === "connected" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs text-slate-400">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const mine = isOwnMessage(msg);
          return (
            <div
              key={msg._id}
              className={`flex ${mine ? "justify-end" : "justify-start"} mb-2`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-3 py-2 ${
                  mine
                    ? "bg-green-500 text-white rounded-br-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm"
                }`}
              >
                {!mine && (
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold">
                      {msg.senderName}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                        msg.senderRole === "instructor"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                      }`}
                    >
                      {msg.senderRole === "instructor"
                        ? "Instructor"
                        : "Student"}
                    </span>
                  </div>
                )}
                <p className="text-xs leading-relaxed break-words">
                  {msg.content}
                </p>
                <p
                  className={`text-[9px] mt-0.5 ${
                    mine
                      ? "text-green-100"
                      : "text-slate-400"
                  }`}
                >
                  {formatTimestamp(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-[10px] text-slate-400">
          {typingUsers.map((u) => u.userName).join(", ")}{" "}
          {typingUsers.length === 1 ? "is" : "are"} typing...
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            disabled={connectionState !== "connected"}
            className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || connectionState !== "connected"}
            className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {inputError && (
          <p className="text-[10px] text-red-500 mt-1">{inputError}</p>
        )}
      </div>
    </div>
  );
}
