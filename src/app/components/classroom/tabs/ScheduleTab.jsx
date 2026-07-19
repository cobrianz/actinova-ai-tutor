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

// ── Main ScheduleTab ──────────────────────────────────────────────────────────

export default function ScheduleTab({ classroomState }) {
  const { classroom, assignments, materials, discussions, isInstructor } = classroomState;

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [events, setEvents] = useState(classroom.scheduleEvents || []);

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  // Collect all events for a given day (custom + assignments/materials with dates)
  const getDayItems = useCallback((date) => {
    if (!date) return [];
    const items = [];

    // Custom schedule events
    events.forEach((e) => {
      if (e.date === isoDate(date)) {
        items.push({ type: "event", color: e.color || "green", title: e.title, time: e.time, id: e._id || e.id });
      }
    });

    // Assignments with due dates
    (assignments || []).forEach((a) => {
      if (a.dueDate && isSameDay(new Date(a.dueDate), date)) {
        items.push({ type: "assignment", color: "amber", title: a.title });
      }
    });

    // Materials by week (if classroom has startDate)
    return items;
  }, [events, assignments]);

  const selectedItems = selectedDate ? getDayItems(selectedDate) : [];

  const handleAddEvent = (newEvent) => {
    setEvents((prev) => [...prev, newEvent]);
    setShowAddModal(false);
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const res = await apiClient.delete(`/api/classrooms/${classroom.id}/schedule-events/${eventId}`);
      const data = await res.json();
      if (data.success) {
        setEvents((prev) => prev.filter((e) => (e._id || e.id) !== eventId));
        toast.success("Event deleted");
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-bold text-foreground">{MONTHS[viewMonth]} {viewYear}</h3>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold text-muted-foreground">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="h-14 border-r border-b border-border/40 bg-secondary/20" />;

            const isToday = isSameDay(date, today);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const dayItems = getDayItems(date);
            const hasItems = dayItems.length > 0;

            return (
              <button key={i} onClick={() => setSelectedDate(date)}
                className={`relative h-14 p-1.5 border-r border-b border-border/40 text-left transition-colors hover:bg-green-50 dark:hover:bg-green-500/5 ${
                  isSelected ? "bg-green-50 dark:bg-green-500/10 ring-inset ring-1 ring-green-500" : ""
                } ${isToday ? "bg-blue-50/50 dark:bg-blue-500/5" : ""}`}
              >
                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? "bg-green-500 text-white" : "text-foreground"
                }`}>
                  {date.getDate()}
                </span>
                {hasItems && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap">
                    {dayItems.slice(0, 3).map((item, j) => (
                      <span key={j} className={`w-1.5 h-1.5 rounded-full ${colorDot(item.color)}`} />
                    ))}
                    {dayItems.length > 3 && <span className="text-[8px] text-muted-foreground">+{dayItems.length - 3}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day panel */}
      {selectedDate && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div>
              <h4 className="text-sm font-bold text-foreground">
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {selectedItems.length === 0 ? "No events" : `${selectedItems.length} event${selectedItems.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            {isInstructor && (
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Event
              </button>
            )}
          </div>

          {selectedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Calendar className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No events on this day</p>
              {isInstructor && (
                <button onClick={() => setShowAddModal(true)}
                  className="mt-2 text-xs text-green-600 hover:text-green-700 font-semibold">
                  + Add an event
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {selectedItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3 group">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${colorDot(item.color)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.time && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" /> {item.time}
                        </span>
                      )}
                      {item.type === "assignment" && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-500">
                          <ClipboardList className="w-3 h-3" /> Due
                        </span>
                      )}
                    </div>
                  </div>
                  {item.type === "event" && isInstructor && (
                    <button onClick={() => handleDeleteEvent(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Course weeks summary */}
      {classroom.startDate && classroom.durationWeeks > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Course Duration</p>
          <p className="text-sm text-foreground">
            {classroom.durationWeeks} weeks — {new Date(classroom.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })} to{" "}
            {new Date(new Date(classroom.startDate).getTime() + classroom.durationWeeks * 7 * 86400000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      )}

      {/* Add event modal */}
      {showAddModal && selectedDate && (
        <AddEventModal
          date={selectedDate}
          classroomId={classroom.id}
          onSave={handleAddEvent}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
