"use client";

import { Bell, Check, Info, Zap, Trophy, Share, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/csrfClient";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await apiClient.patch("/api/notifications");
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return "Unknown";
    const diff = new Date() - new Date(date);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getIcon = (type, iconName) => {
    const defaultClasses = "w-4 h-4 text-green-600 dark:text-green-400";
    if (iconName === "zap" || type === "daily_bonus") return <Zap className={defaultClasses} />;
    if (iconName === "trophy" || type === "achievement") return <Trophy className={defaultClasses} />;
    if (iconName === "share" || type === "share") return <Share className={defaultClasses} />;
    return <Info className={defaultClasses} />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse border border-card" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
              <h3 className="text-sm font-bold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-green-600 dark:text-green-400 font-medium hover:underline flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-2">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-3 flex gap-3 hover:bg-secondary/50 transition-colors ${
                        !notif.read ? "bg-green-500/5" : ""
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        {getIcon(notif.type, notif.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-foreground leading-tight">
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/80 mt-1 font-medium">
                          {formatTimeAgo(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-2 border-t border-border bg-muted/10 text-center">
              <a href="/dashboard/profile" className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors flex items-center justify-center gap-1">
                <Settings className="w-3 h-3" /> Notification settings
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
