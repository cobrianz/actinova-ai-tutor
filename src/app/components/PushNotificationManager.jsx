"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Download, X } from "lucide-react";
import { toast } from "sonner";
import { isFlutterApp, requestStoragePermission } from "@/lib/appBridge";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((ch) => ch.charCodeAt(0)));
}

export default function PushNotificationManager() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [subscribed, setSubscribed] = useState(false);
  const [storageGranted, setStorageGranted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const notifSupported = "Notification" in window && "PushManager" in window && "serviceWorker" in navigator;
    setSupported(notifSupported);
    if (notifSupported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
    if (isFlutterApp()) {
      setStorageGranted(false);
    } else {
      setStorageGranted(true);
    }
  }, []);

  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      }
    } catch {
      // service worker not registered yet
    }
  }

  async function registerSw() {
    if (!("serviceWorker" in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register("/notification-sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      return reg;
    } catch (err) {
      console.error("SW registration failed:", err);
      return null;
    }
  }

  async function handleSubscribe() {
    if (permission !== "granted") {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        toast.error("Notification permission denied");
        return;
      }
    }

    const reg = await registerSw();
    if (!reg) {
      toast.error("Failed to register service worker");
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      toast.error("VAPID public key not configured");
      return;
    }

    try {
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });

      if (res.ok) {
        setSubscribed(true);
        toast.success("Notifications enabled");
      } else {
        toast.error("Failed to save subscription");
      }
    } catch (err) {
      toast.error("Failed to subscribe to push notifications");
      console.error(err);
    }
  }

  async function handleUnsubscribe() {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const endpoint = sub.endpoint;
          await sub.unsubscribe();
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint }),
          });
        }
      }
      setSubscribed(false);
      toast.success("Notifications disabled");
    } catch (err) {
      console.error("Unsubscribe failed:", err);
    }
  }

  async function handleRequestStorage() {
    const granted = await requestStoragePermission();
    setStorageGranted(granted);
    if (granted) {
      toast.success("Storage permission granted");
    } else {
      toast.error("Storage permission denied — downloads may not work");
    }
  }

  const needsNotification = supported && permission === "granted" && !subscribed;
  const needsStorage = isFlutterApp() && !storageGranted;
  const hasAnyPrompt = needsNotification || needsStorage;

  if (!hasAnyPrompt || dismissed) {
    if (subscribed) {
      return (
        <button
          onClick={handleUnsubscribe}
          className="fixed bottom-4 right-4 z-50 rounded-full border bg-card p-2 shadow-lg hover:bg-muted"
          title="Disable notifications"
        >
          <BellOff className="h-5 w-5 text-muted-foreground" />
        </button>
      );
    }
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 rounded-lg border bg-card px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Permissions</span>
        <button
          onClick={() => setDismissed(true)}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {needsNotification && (
          <button
            onClick={handleSubscribe}
            className="flex items-center gap-2 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Bell className="h-4 w-4" />
            Enable notifications
          </button>
        )}
        {needsStorage && (
          <button
            onClick={handleRequestStorage}
            className="flex items-center gap-2 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Allow storage for downloads
          </button>
        )}
      </div>
    </div>
  );
}
