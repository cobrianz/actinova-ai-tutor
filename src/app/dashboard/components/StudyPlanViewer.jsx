"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  BookOpen,
  Lightbulb,
  PenTool,
  CheckSquare,
  Rocket,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Trophy,
  Zap,
  GraduationCap,
  ExternalLink,
  Star,
  TrendingUp,
  Edit3,
  Plus,
  Sparkles,
  Save,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const TASK_ICONS = {
  lesson: BookOpen,
  practice: PenTool,
  review: Lightbulb,
  quiz: CheckSquare,
  project: Rocket,
};

const TASK_STYLES = {
  lesson: { icon: "text-green-500", bg: "bg-green-500/10", ring: "ring-green-500/20" },
  practice: { icon: "text-orange-500", bg: "bg-orange-500/10", ring: "ring-orange-500/20" },
  review: { icon: "text-purple-500", bg: "bg-purple-500/10", ring: "ring-purple-500/20" },
  quiz: { icon: "text-emerald-500", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
  project: { icon: "text-rose-500", bg: "bg-rose-500/10", ring: "ring-rose-500/20" },
};

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getCurrentDayIndex() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday=0 to 6, Monday=1 to 0
}

function findNextIncompleteDay(weeks) {
  const currentDayIdx = getCurrentDayIndex();
  for (const week of weeks || []) {
    for (let di = 0; di < (week.days || []).length; di++) {
      const day = week.days[di];
      const allComplete = (day.tasks || []).every((t) => t.completed);
      if (!allComplete) {
        return { weekNumber: week.weekNumber, dayIndex: di };
      }
    }
  }
  return null;
}

const WEEK_COLORS = [
  "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20",
];

export default function StudyPlanViewer({ plan, studyPlanId, onBack, onDelete, setActiveContent }) {
  const router = useRouter();
  const [localPlan, setLocalPlan] = useState(plan);
  const [viewMode, setViewMode] = useState("timeline");
  const [completing, setCompleting] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [editingTasks, setEditingTasks] = useState([]);
  const [savingDay, setSavingDay] = useState(false);
  const [regeneratingDay, setRegeneratingDay] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const { downloadStudyPlanAsPDF } = await import("@/lib/pdfUtils");
      await downloadStudyPlanAsPDF(localPlan);
      toast.success("Study plan downloaded successfully");
    } catch (err) {
      console.error("PDF Download error:", err);
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const currentDayIdx = getCurrentDayIndex();
  const nextIncomplete = useMemo(() => findNextIncompleteDay(localPlan?.weeks), [localPlan]);

  const [expandedWeek, setExpandedWeek] = useState(() => {
    if (nextIncomplete) {
      const idx = localPlan?.weeks?.findIndex((w) => w.weekNumber === nextIncomplete.weekNumber);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const [expandedDays, setExpandedDays] = useState(() => {
    if (nextIncomplete) {
      const weekIdx = localPlan?.weeks?.findIndex((w) => w.weekNumber === nextIncomplete.weekNumber) ?? 0;
      return { [`${weekIdx}-${nextIncomplete.dayIndex}`]: true };
    }
    return {};
  });

  const toggleWeek = (idx) => setExpandedWeek(expandedWeek === idx ? -1 : idx);
  const toggleDay = (weekIdx, dayIdx) => {
    const key = `${weekIdx}-${dayIdx}`;
    setExpandedDays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandCurrentDay = () => {
    if (nextIncomplete) {
      const weekIdx = localPlan?.weeks?.findIndex((w) => w.weekNumber === nextIncomplete.weekNumber) ?? 0;
      setExpandedWeek(weekIdx);
      setExpandedDays({ [`${weekIdx}-${nextIncomplete.dayIndex}`]: true });
    }
  };

  const handleCompleteTask = useCallback(
    async (weekNumber, dayIndex, taskIndex) => {
      const task = localPlan?.weeks
        ?.find((w) => w.weekNumber === weekNumber)
        ?.days?.[dayIndex]?.tasks?.[taskIndex];
      const newCompleted = !task?.completed;
      const taskKey = `${weekNumber}-${dayIndex}-${taskIndex}`;
      setCompleting(taskKey);

      // Optimistic update: deep-clone only the changed path
      setLocalPlan((prev) => {
        const newWeeks = prev.weeks.map((w) => {
          if (w.weekNumber !== weekNumber) return w;
          const newDays = w.days.map((d, di) => {
            if (di !== dayIndex) return d;
            const newTasks = d.tasks.map((t, ti) => {
              if (ti !== taskIndex) return t;
              return { ...t, completed: newCompleted };
            });
            return { ...d, tasks: newTasks };
          });
          return { ...w, days: newDays };
        });
        return { ...prev, weeks: newWeeks };
      });

      try {
        const response = await apiClient.patch("/api/study-plan/complete-task", {
          studyPlanId, weekNumber, dayIndex, taskIndex, completed: newCompleted,
        });
        if (!response.ok) throw new Error((await response.json()).error || "Failed to update");
        const data = await response.json();

        setLocalPlan((prev) => ({
          ...prev,
          completedTasks: data.completedTasks,
          totalTasks: data.totalTasks,
          progress: data.progress,
          completed: data.completed,
        }));

        if (data.completed) toast.success("Congratulations! You completed the entire study plan!");
      } catch (error) {
        // Revert optimistic update on failure
        setLocalPlan((prev) => {
          const newWeeks = prev.weeks.map((w) => {
            if (w.weekNumber !== weekNumber) return w;
            const newDays = w.days.map((d, di) => {
              if (di !== dayIndex) return d;
              const newTasks = d.tasks.map((t, ti) => {
                if (ti !== taskIndex) return t;
                return { ...t, completed: !newCompleted };
              });
              return { ...d, tasks: newTasks };
            });
            return { ...w, days: newDays };
          });
          return { ...prev, weeks: newWeeks };
        });
        toast.error(error.message || "Failed to update task");
      } finally {
        setCompleting(null);
      }
    },
    [studyPlanId, localPlan]
  );

  const handleDelete = async () => {
    if (!confirm("Delete this study plan?")) return;
    try {
      const res = await apiClient.delete(`/api/study-plan/${studyPlanId}`);
      if (res.ok) { toast.success("Study plan deleted"); onDelete?.(); onBack?.(); }
    } catch { toast.error("Failed to delete"); }
  };

  const startEditDay = (weekIdx, dayIdx) => {
    const day = localPlan.weeks[weekIdx].days[dayIdx];
    const tasks = (day.tasks || []).map((t) => ({ ...t }));
    setEditingDay({ weekIdx, dayIdx });
    setEditingTasks(tasks);
  };

  const cancelEditDay = () => {
    setEditingDay(null);
    setEditingTasks([]);
  };

  const updateEditingTask = (taskIdx, field, value) => {
    setEditingTasks((prev) => prev.map((t, i) => (i === taskIdx ? { ...t, [field]: value } : t)));
  };

  const addEditingTask = () => {
    setEditingTasks((prev) => [
      ...prev,
      { type: "practice", title: "", description: "", estimatedMinutes: 30, completed: false },
    ]);
  };

  const removeEditingTask = (taskIdx) => {
    setEditingTasks((prev) => prev.filter((_, i) => i !== taskIdx));
  };

  const saveDayTasks = async () => {
    if (!editingDay) return;
    const { weekIdx, dayIdx } = editingDay;
    const weekNumber = localPlan.weeks[weekIdx].weekNumber;
    setSavingDay(true);

    try {
      const res = await apiClient.put("/api/study-plan/save-day", {
        planId: studyPlanId,
        weekIndex: weekIdx,
        dayIndex,
        tasks: editingTasks,
      });

      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");

      const data = await res.json();

      // Update local plan with saved tasks and recalculated totals
      setLocalPlan((prev) => {
        const newWeeks = prev.weeks.map((w) => {
          if (w.weekNumber !== weekNumber) return w;
          const newDays = w.days.map((d, di) => {
            if (di !== dayIdx) return d;
            return { ...d, tasks: data.tasks };
          });
          return { ...w, days: newDays };
        });
        return { ...prev, weeks: newWeeks, completedTasks: data.completedTasks, totalTasks: data.totalTasks, progress: data.progress, completed: data.completed };
      });

      setEditingDay(null);
      setEditingTasks([]);
      toast.success("Day tasks saved");
    } catch (error) {
      toast.error(error.message || "Failed to save");
    } finally {
      setSavingDay(false);
    }
  };

  const regenerateDayTasks = async () => {
    if (!editingDay) return;
    const { weekIdx, dayIdx } = editingDay;
    setRegeneratingDay(true);

    try {
      const res = await apiClient.post("/api/study-plan/regenerate-day", {
        planId: studyPlanId,
        weekIndex: weekIdx,
        dayIndex: dayIdx,
        topic: localPlan.originalTopic || localPlan.topic,
        difficulty: localPlan.difficulty,
        context: localPlan.weeks[weekIdx].title,
        existingTasks: editingTasks.map((t) => ({ title: t.title, type: t.type, estimatedMinutes: t.estimatedMinutes })),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Failed to regenerate");

      const data = await res.json();
      setEditingTasks(data.tasks);
      toast.success("New tasks generated — review and save");
    } catch (error) {
      toast.error(error.message || "Failed to regenerate");
    } finally {
      setRegeneratingDay(false);
    }
  };

  const getWeekProgress = (week) => {
    let completed = 0, total = 0;
    for (const day of week.days || []) for (const task of day.tasks || []) { total++; if (task.completed) completed++; }
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getPlanStartDate = () => {
    if (localPlan.createdAt) return new Date(localPlan.createdAt);
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  if (!localPlan) return null;
  const progress = localPlan.progress || 0;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="w-full">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Library
      </button>

      {/* Header Card */}
      <div className="relative mb-6 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="relative p-4 sm:p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 sm:gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 uppercase tracking-wide">
                  {localPlan.difficulty}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-secondary text-muted-foreground border border-border/50">
                  {localPlan.durationWeeks} weeks
                </span>
                {localPlan.totalEstimatedHours > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-secondary text-muted-foreground border border-border/50 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ~{localPlan.totalEstimatedHours}h
                  </span>
                )}
                {localPlan.completed && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Completed
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {localPlan.title}
              </h1>
              {localPlan.overview && (
                <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">{localPlan.overview}</p>
              )}
              {localPlan.totalEstimatedHours > 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  ~{localPlan.totalEstimatedHours}h total ({Math.round(localPlan.totalEstimatedHours / localPlan.durationWeeks)}h/week)
                </div>
              )}
              {localPlan.selectedCourseNames?.length > 0 && (
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                  {localPlan.selectedCourseNames.map((name, i) => (
                    <span key={i} className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Circular Progress */}
            <div className="flex-shrink-0">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
                  <motion.circle
                    cx="40" cy="40" r="36" fill="none" stroke="#22c55e" strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg md:text-xl font-bold text-foreground">{progress}%</span>
                  <span className="text-[9px] text-muted-foreground font-medium">DONE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-5 pt-4 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span><strong className="text-foreground">{localPlan.completedTasks || 0}</strong>/{localPlan.totalTasks || 0} tasks</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span><strong className="text-foreground">{localPlan.durationWeeks}</strong> weeks</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="w-3.5 h-3.5" />
              <span><strong className="text-foreground">{localPlan.weeks?.length || 0}</strong> modules</span>
            </div>
            {nextIncomplete && (
              <button
                onClick={expandCurrentDay}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-[10px] font-semibold text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors"
              >
                <Star className="w-3 h-3" />
                Continue where you left off
              </button>
            )}
            <button
              onClick={handleDelete}
              className="ml-auto p-1.5 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Delete plan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weeks - Timeline View */}
      {viewMode === "timeline" && (
      <div className="space-y-3">
        {localPlan.weeks?.map((week, weekIdx) => {
          const weekProgress = getWeekProgress(week);
          const isExpanded = expandedWeek === weekIdx;
          const gradient = WEEK_COLORS[weekIdx % WEEK_COLORS.length];
          const isCurrentWeek = nextIncomplete && week.weekNumber === nextIncomplete.weekNumber;
          const weekMinutes = (week.days || []).reduce((sum, day) =>
            sum + (day.tasks || []).reduce((dSum, task) => dSum + (task.estimatedMinutes || 0), 0), 0
          );
          const weekCompletedMinutes = (week.days || []).reduce((sum, day) =>
            sum + (day.tasks || []).reduce((dSum, task) => dSum + (task.completed ? (task.estimatedMinutes || 0) : 0), 0), 0
          );

          return (
            <motion.div
              key={week.weekNumber}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: weekIdx * 0.03 }}
              className={`rounded-2xl border overflow-hidden bg-card/80 backdrop-blur-sm ${
                isCurrentWeek ? "border-green-500/30 ring-1 ring-green-500/10" : "border-border/60"
              }`}
            >
              <button
                onClick={() => toggleWeek(weekIdx)}
                className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3.5 text-left">
                  <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
                    weekProgress === 100
                      ? "bg-green-500 text-white border-green-500 shadow-md shadow-green-500/30"
                      : isCurrentWeek
                      ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
                      : `${gradient} border`
                  }`}>
                    {weekProgress === 100 ? <CheckCircle2 className="w-5 h-5" /> : week.weekNumber}
                    {isCurrentWeek && weekProgress < 100 && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card animate-pulse" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{week.title}</span>
                      {isCurrentWeek && weekProgress < 100 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                          CURRENT
                        </span>
                      )}
                    </div>
                    {week.milestone && (
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 max-w-xs truncate">
                        <Trophy className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        <span className="truncate">{week.milestone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground font-semibold">{weekProgress}%</span>
                    <div className="w-20 bg-secondary/80 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className="bg-green-500 h-1.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${weekProgress}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    {/* Week Goals */}
                    {week.goals?.length > 0 && (
                      <div className="px-5 pb-3">
                        <div className="flex flex-wrap gap-1.5">
                          {week.goals.map((g, gi) => (
                            <span key={gi} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-green-500/8 text-green-600 dark:text-green-400 border border-green-500/15">
                              <Target className="w-2.5 h-2.5" />
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Days */}
                    <div className="px-4 pb-4 space-y-2">
                      {week.days?.map((day, dayIdx) => {
                        const dayKey = `${weekIdx}-${dayIdx}`;
                        const isDayExpanded = expandedDays[dayKey];
                        const dayCompleted = (day.tasks || []).filter((t) => t.completed).length;
                        const dayTotal = (day.tasks || []).length;
                        const dayPct = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;
                        const isToday = isCurrentWeek && dayIdx === currentDayIdx;
                        const dayMinutes = (day.tasks || []).reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
                        const dayCompletedMinutes = (day.tasks || []).reduce((sum, t) => sum + (t.completed ? (t.estimatedMinutes || 0) : 0), 0);
                        const allComplete = dayTotal > 0 && dayCompleted === dayTotal;

                        return (
                          <div key={dayIdx} className={`rounded-xl border overflow-hidden ${
                            isToday ? "border-green-500/30 bg-green-500/5" : "border-border/40"
                          }`}>
                            <button
                              onClick={() => toggleDay(weekIdx, dayIdx)}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/20 transition-colors"
                            >
                              <div className="flex items-center gap-3 text-left">
                                <span className={`text-xs font-bold min-w-[65px] ${isToday ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
                                  {day.day}
                                  {isToday && (
                                    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20">
                                      TODAY
                                    </span>
                                  )}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-muted-foreground font-medium">{dayCompleted}/{dayTotal}</span>
                                  {allComplete && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                </div>
                                {dayMinutes > 0 && (
                                  <span className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5">
                                    <Clock className="w-2 h-2" />
                                    {dayCompletedMinutes > 0 ? `${dayCompletedMinutes}/` : ""}{dayMinutes}m
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {!(editingDay?.weekIdx === weekIdx && editingDay?.dayIdx === dayIdx) && (
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => { e.stopPropagation(); startEditDay(weekIdx, dayIdx); }}
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); startEditDay(weekIdx, dayIdx); } }}
                                    className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-accent/40 transition-colors cursor-pointer"
                                    title="Edit Day"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </div>
                                )}
                                <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 ${isDayExpanded ? "rotate-90" : ""}`} />
                              </div>
                            </button>

                            <AnimatePresence>
                              {isDayExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-3 pb-3 space-y-1">
                                    {editingDay?.weekIdx === weekIdx && editingDay?.dayIdx === dayIdx && isDayExpanded ? (
                                      <div className="space-y-2">
                                        {/* Task list editor */}
                                        {editingTasks.map((task, etIdx) => {
                                          const Icon = TASK_ICONS[task.type] || BookOpen;
                                          return (
                                            <div key={etIdx} className="flex items-start gap-2 p-2.5 rounded-xl border border-border/50 bg-secondary/20 group/task">
                                              <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-md bg-secondary flex items-center justify-center text-muted-foreground/60">
                                                <Icon className="w-3 h-3" />
                                              </span>
                                              <div className="flex-1 min-w-0 space-y-1.5">
                                                <input
                                                  type="text"
                                                  value={task.title}
                                                  onChange={(e) => updateEditingTask(etIdx, "title", e.target.value)}
                                                  placeholder="Task title"
                                                  className="w-full text-[13px] font-semibold bg-transparent border-0 border-b border-border/40 p-0 pb-0.5 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-green-500/50 transition-colors"
                                                />
                                                <textarea
                                                  value={task.description || ""}
                                                  onChange={(e) => updateEditingTask(etIdx, "description", e.target.value)}
                                                  placeholder="Description (optional)"
                                                  rows={1}
                                                  className="w-full text-[11px] bg-transparent border-0 p-0 text-muted-foreground/70 placeholder:text-muted-foreground/30 focus:outline-none resize-none"
                                                />
                                                <div className="flex items-center gap-2">
                                                  <select
                                                    value={task.type}
                                                    onChange={(e) => updateEditingTask(etIdx, "type", e.target.value)}
                                                    className="text-[10px] font-medium bg-secondary/60 border border-border/40 rounded-md px-1.5 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-green-500/30 cursor-pointer"
                                                  >
                                                    <option value="lesson">Lesson</option>
                                                    <option value="practice">Practice</option>
                                                    <option value="review">Review</option>
                                                    <option value="quiz">Quiz</option>
                                                    <option value="project">Project</option>
                                                  </select>
                                                  <div className="flex items-center gap-0.5">
                                                    <Clock className="w-2.5 h-2.5 text-muted-foreground/50" />
                                                    <input
                                                      type="number"
                                                      min={5}
                                                      max={120}
                                                      step={5}
                                                      value={task.estimatedMinutes}
                                                      onChange={(e) => updateEditingTask(etIdx, "estimatedMinutes", parseInt(e.target.value) || 30)}
                                                      className="w-12 text-[10px] bg-secondary/60 border border-border/40 rounded-md px-1.5 py-0.5 text-foreground text-center focus:outline-none focus:ring-1 focus:ring-green-500/30"
                                                    />
                                                    <span className="text-[10px] text-muted-foreground/50">min</span>
                                                  </div>
                                                </div>
                                              </div>
                                              <button
                                                onClick={() => removeEditingTask(etIdx)}
                                                className="mt-0.5 p-1 rounded-md text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover/task:opacity-100"
                                                title="Remove task"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          );
                                        })}

                                        {/* Add Task button */}
                                        <button
                                          onClick={addEditingTask}
                                          className="flex items-center gap-1.5 w-full px-3 py-2 rounded-xl border border-dashed border-border/50 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-green-500/30 hover:bg-green-500/5 transition-colors"
                                        >
                                          <Plus className="w-3 h-3" />
                                          Add Task
                                        </button>

                                        {/* Editor action buttons */}
                                        <div className="flex items-center gap-2 pt-1">
                                          <button
                                            onClick={saveDayTasks}
                                            disabled={savingDay || editingTasks.some((t) => !t.title.trim())}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 text-white text-[11px] font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                          >
                                            <Save className="w-3 h-3" />
                                            {savingDay ? "Saving..." : "Save"}
                                          </button>
                                          <button
                                            onClick={regenerateDayTasks}
                                            disabled={regeneratingDay || savingDay}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-semibold hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                          >
                                            <Sparkles className="w-3 h-3" />
                                            {regeneratingDay ? "Generating..." : "Regenerate with AI"}
                                          </button>
                                          <button
                                            onClick={cancelEditDay}
                                            disabled={savingDay || regeneratingDay}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-[11px] font-semibold hover:bg-secondary/80 transition-colors"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      /* Normal task list (non-editing) */
                                      day.tasks?.map((task, taskIdx) => {
                                        const Icon = TASK_ICONS[task.type] || BookOpen;
                                      const style = TASK_STYLES[task.type] || TASK_STYLES.lesson;
                                      const taskKey = `${week.weekNumber}-${dayIdx}-${taskIdx}`;
                                      const isCompleting = completing === taskKey;

                                      return (
                                        <motion.div
                                          key={taskIdx}
                                          layout
                                          className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                                            task.completed
                                              ? "bg-green-500/5 border border-green-500/10"
                                              : "hover:bg-accent/20 border border-transparent"
                                          }`}
                                        >
                                          <button
                                            onClick={() => handleCompleteTask(week.weekNumber, dayIdx, taskIdx)}
                                            disabled={isCompleting}
                                            className="mt-0.5 flex-shrink-0"
                                          >
                                            {task.completed ? (
                                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                                                <CheckCircle2 className="w-[18px] h-[18px] text-green-500" />
                                              </motion.div>
                                            ) : (
                                              <Circle className="w-[18px] h-[18px] text-muted-foreground/50 hover:text-green-500 transition-colors cursor-pointer" />
                                            )}
                                          </button>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md ring-1 ${style.bg} ${style.ring}`}>
                                                <Icon className={`w-3 h-3 ${style.icon}`} />
                                              </span>
                                              {task.type === "lesson" && task.courseId ? (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dashboard/learn/${encodeURIComponent(task.relatedCourseTopic || "")}?format=course&difficulty=&module=${task.moduleId}&lesson=${(task.lessonIndex || 0) + 1}`);
                                                  }}
                                                  className={`text-[13px] font-semibold leading-tight text-left hover:underline decoration-green-500/50 underline-offset-2 transition-colors inline-flex items-center gap-1.5 ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}
                                                >
                                                  {task.title}
                                                  <ExternalLink className="w-3 h-3 text-green-500 flex-shrink-0" />
                                                </button>
                                              ) : (
                                                <span className={`text-[13px] font-semibold leading-tight ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                                  {task.title}
                                                </span>
                                              )}
                                            </div>
                                            {task.description && (
                                              <p className="text-[11px] text-muted-foreground/70 mt-1 ml-7 leading-relaxed">{task.description}</p>
                                            )}
                                            {task.relatedCourseTitle && (
                                              <div className="mt-1.5 ml-7">
                                                {task.courseId ? (
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      router.push(`/dashboard/learn/${encodeURIComponent(task.relatedCourseTopic || "")}?format=course&difficulty=&module=${task.moduleId}&lesson=${(task.lessonIndex || 0) + 1}`);
                                                    }}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/8 text-green-600 dark:text-green-400 text-[10px] font-medium border border-green-500/15 hover:bg-green-500/15 transition-colors"
                                                  >
                                                    <BookOpen className="w-2.5 h-2.5" />
                                                    {task.relatedCourseTitle}
                                                    <ExternalLink className="w-2 h-2" />
                                                  </button>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/8 text-green-600 dark:text-green-400 text-[10px] font-medium border border-green-500/15">
                                                    <BookOpen className="w-2.5 h-2.5" />
                                                    {task.relatedCourseTitle}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                          <span className="text-[10px] text-muted-foreground/60 font-medium flex-shrink-0 flex items-center gap-0.5 mt-0.5">
                                            <Clock className="w-2.5 h-2.5" />
                                            {task.estimatedMinutes}m
                                          </span>
                                        </motion.div>
                                      );
                                    }))}
                                  </div>

                                  {/* Day Summary */}
                                  {dayMinutes > 0 && (
                                    <div className="px-3 pb-3">
                                      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/30 border border-border/30">
                                        <div className="flex items-center gap-3">
                                          <span className="text-[10px] text-muted-foreground font-medium">
                                            <strong className="text-foreground">{dayCompleted}</strong>/{dayTotal} tasks
                                          </span>
                                          <span className="text-[10px] text-muted-foreground font-medium">
                                            <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                                            {dayMinutes} min total
                                          </span>
                                        </div>
                                        {allComplete && (
                                          <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Done!
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
      )}

      {/* Resources */}
      {localPlan.resources?.length > 0 && (
        <div className="mt-6 p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            </div>
            Recommended Resources
          </h3>
          <ul className="space-y-2">
            {localPlan.resources.map((resource, i) => {
              const isUrl = /^https?:\/\//.test(resource);
              return (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2.5 pl-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 mt-1.5 flex-shrink-0" />
                  {isUrl ? (
                    <a href={resource} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline decoration-green-500/50 underline-offset-2 break-all">
                      {resource}
                      <ExternalLink className="w-2.5 h-2.5 inline ml-1" />
                    </a>
                  ) : (
                    resource
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Next Up Card */}
      {!localPlan.completed && nextIncomplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-5 rounded-2xl bg-green-500/5 border border-green-500/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-green-500/15 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            </div>
            <span className="text-xs font-bold text-green-600 dark:text-green-400">Next Up</span>
          </div>
          {(() => {
            const week = localPlan.weeks?.find((w) => w.weekNumber === nextIncomplete.weekNumber);
            const day = week?.days?.[nextIncomplete.dayIndex];
            const nextTask = day?.tasks?.find((t) => !t.completed);
            if (!nextTask) return null;
            const Icon = TASK_ICONS[nextTask.type] || BookOpen;
            const style = TASK_STYLES[nextTask.type] || TASK_STYLES.lesson;
            return (
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ring-1 ${style.bg} ${style.ring}`}>
                  <Icon className={`w-4 h-4 ${style.icon}`} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{nextTask.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Week {nextIncomplete.weekNumber} &middot; {day?.day} &middot; {nextTask.estimatedMinutes || 30} min
                  </div>
                </div>
                <button
                  onClick={expandCurrentDay}
                  className="px-3 py-1.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 text-[11px] font-semibold hover:bg-green-500/20 transition-colors flex items-center gap-1"
                >
                  Go
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* Completion Celebration */}
      {localPlan.completed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 p-8 rounded-3xl bg-amber-500/5 border border-amber-500/20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Plan Completed!
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Outstanding achievement! You&apos;ve completed every task in this study plan. Ready for your next challenge?
          </p>
        </motion.div>
      )}
    </div>
  );
}
