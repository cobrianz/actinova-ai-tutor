"use client";

let dueCheckInterval = null;
let dailyReminderTimeout = null;

export function requestNotificationPermission() {
  if (typeof window === "undefined") return "denied";
  if (!("Notification" in window)) return "denied";
  return Notification.requestPermission();
}

export function sendNotification(title, body, icon = "/favicon.ico") {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, { body, icon, badge: icon });
  } catch (err) {
    console.error("Notification failed:", err);
  }
}

export function scheduleDailyReminder(hour = 9, minute = 0) {
  if (typeof window === "undefined") return;

  if (dailyReminderTimeout) {
    clearTimeout(dailyReminderTimeout);
    dailyReminderTimeout = null;
  }

  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();

  dailyReminderTimeout = setTimeout(() => {
    sendNotification(
      "Time to study!",
      "Don't break your streak — review your flashcards today."
    );
    scheduleDailyReminder(hour, minute);
  }, delay);
}

export async function checkDueCardsAndNotify() {
  try {
    const res = await fetch("/api/srs/due");
    if (!res.ok) return;

    const data = await res.json();
    const totalDue = data.totalDue || 0;

    if (totalDue > 0) {
      const flashcardsDue = data.cards?.length || 0;
      const quizzesDue = data.quizzes?.length || 0;
      const parts = [];
      if (flashcardsDue > 0) parts.push(`${flashcardsDue} flashcard${flashcardsDue !== 1 ? "s" : ""}`);
      if (quizzesDue > 0) parts.push(`${quizzesDue} quiz${quizzesDue !== 1 ? "zes" : ""}`);

      sendNotification(
        "Cards due for review!",
        `You have ${parts.join(" and ")} waiting for you.`
      );
    }

    return totalDue;
  } catch (err) {
    console.error("Failed to check due cards:", err);
    return 0;
  }
}

export function startDueCheckInterval(intervalMs = 30 * 60 * 1000) {
  stopDueCheckInterval();
  checkDueCardsAndNotify();
  dueCheckInterval = setInterval(checkDueCardsAndNotify, intervalMs);
}

export function stopDueCheckInterval() {
  if (dueCheckInterval) {
    clearInterval(dueCheckInterval);
    dueCheckInterval = null;
  }
}
