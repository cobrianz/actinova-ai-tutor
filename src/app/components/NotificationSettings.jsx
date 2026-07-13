"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Clock, TestTube } from "lucide-react";
import {
  requestNotificationPermission,
  sendNotification,
  scheduleDailyReminder,
  startDueCheckInterval,
  stopDueCheckInterval,
} from "@/lib/notifications";

const STORAGE_KEY = "notification_settings";

function loadSettings() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function saveSettings(settings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export default function NotificationSettings() {
  const [enabled, setEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(9);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [permission, setPermission] = useState("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    const saved = loadSettings();
    if (saved) {
      setEnabled(saved.enabled ?? false);
      setReminderHour(saved.reminderHour ?? 9);
      setReminderMinute(saved.reminderMinute ?? 0);
    }
  }, []);

  useEffect(() => {
    if (enabled && permission === "granted") {
      scheduleDailyReminder(reminderHour, reminderMinute);
      startDueCheckInterval();
    } else {
      stopDueCheckInterval();
    }

    return () => stopDueCheckInterval();
  }, [enabled, permission, reminderHour, reminderMinute]);

  const handleToggle = async () => {
    if (!enabled) {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result !== "granted") return;
    }
    const next = !enabled;
    setEnabled(next);
    saveSettings({ enabled: next, reminderHour, reminderMinute });
  };

  const handleTimeChange = (type, value) => {
    const num = parseInt(value, 10);
    const hour = type === "hour" ? num : reminderHour;
    const minute = type === "minute" ? num : reminderMinute;
    setReminderHour(hour);
    setReminderMinute(minute);
    saveSettings({ enabled, reminderHour: hour, reminderMinute: minute });
  };

  const handleTest = () => {
    sendNotification(
      "Test notification",
      "If you see this, notifications are working!"
    );
  };

  const permissionLabel =
    permission === "granted"
      ? "Granted"
      : permission === "denied"
      ? "Blocked"
      : "Not set";

  const permissionColor =
    permission === "granted"
      ? "text-green-600"
      : permission === "denied"
      ? "text-red-500"
      : "text-muted-foreground";

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        {enabled ? (
          <Bell className="w-4 h-4 text-blue-500" />
        ) : (
          <BellOff className="w-4 h-4 text-muted-foreground" />
        )}
        Study Reminders
      </h3>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Enable notifications</span>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            enabled ? "bg-blue-600" : "bg-secondary"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
              enabled ? "translate-x-4.5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Permission</span>
        <span className={permissionColor}>{permissionLabel}</span>
      </div>

      {enabled && (
        <>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Daily at</span>
            <select
              value={reminderHour}
              onChange={(e) => handleTimeChange("hour", e.target.value)}
              className="text-xs bg-secondary border border-border rounded px-1.5 py-0.5 text-foreground"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {String(i).padStart(2, "0")}
                </option>
              ))}
            </select>
            <span className="text-muted-foreground">:</span>
            <select
              value={reminderMinute}
              onChange={(e) => handleTimeChange("minute", e.target.value)}
              className="text-xs bg-secondary border border-border rounded px-1.5 py-0.5 text-foreground"
            >
              {[0, 15, 30, 45].map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTest}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 rounded-lg hover:bg-secondary/50"
          >
            <TestTube className="w-3.5 h-3.5" />
            Test Notification
          </button>
        </>
      )}
    </div>
  );
}
