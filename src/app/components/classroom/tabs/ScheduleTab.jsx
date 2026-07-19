"use client";

import { useState, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Plus, X, Layers,
  MessageSquare, ClipboardList, Calendar, Clock, Tag, Trash2,
} from "lucide-react";
import { apiClient } from "@/lib/csrfClient";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const EVENT_COLORS = [
  { label: "Green", value: "green", cls: "bg-green-500" },
  { label: "Blue", value: "blue", cls: "bg-blue-500" },
  { label: "Amber", value: "amber", cls: "bg-amber-500" },
  { label: "Red", value: "red", cls: "bg-red-500" },
  { label: "Purple", value: "purple", cls: "bg-purple-500" },
];

function colorDot(color) {
  switch (color) {
    case "blue":   return "bg-blue-500";
    case "amber":  return "bg-amber-500";
    case "red":    return "bg-red-500";
    case "purple": return "bg-purple-500";
    default:       return "bg-green-500";
  }
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// ── Add Event Modal ───────────────────────────────────────────────────────────

function AddEventModal({ date, classroomId, onSave, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("09:00");
  const [color, setColor] = useState("green");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const res = await apiClient.post(`/api/classrooms/${classroomId}/schedule-events`, {
        title: title.trim(),
        description: description.trim(),
        date: isoDate(date),
        time,
        color,
      });
      const data = await res.json();
      if (data.success) {
        onSave(data.event);
        toast.success("Event added!");
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-foreground">Add Event</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Class session, Assignment due..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-green-500/30" />
          </div>

          {/* Time */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Time</label>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-green-500/30" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-green-500/30 resize-none" />
          </div>

          {/* Color */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <Tag className="inline w-3 h-3 mr-1" />Color
            </label>
            <div className="flex gap-2">
              {EVENT_COLORS.map((c) => (
                <button key={c.value} onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full ${c.cls} transition-all ${color === c.value ? "ring-2 ring-offset-2 ring-offset-background ring-current scale-110" : "opacity-70 hover:opacity-100"}`}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose}
            className="flex-1 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !title.trim()}
            className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : "Add Event"}
          </button>
        </div>
      </div>
    </div>
  );
}
