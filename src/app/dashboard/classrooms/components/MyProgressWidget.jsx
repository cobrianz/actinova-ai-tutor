"use client";

import { useMemo } from "react";
import { CheckCircle2, Clock, Award, Target, BookOpen, AlertCircle } from "lucide-react";

export default function MyProgressWidget({ classroom, assignments = [], progress = [] }) {
  const stats = useMemo(() => {
    const totalAssignments = assignments.length;
    const completedAssignments = progress.filter((p) => p.status === "completed").length;
    const progressPct = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

    const scored = progress.filter((p) => p.score != null);
    const avgScore = scored.length > 0 ? Math.round(scored.reduce((acc, p) => acc + (p.score || 0), 0) / scored.length) : null;

    const upcoming = assignments
      .filter((a) => a.dueDate && new Date(a.dueDate) > new Date())
      .filter((a) => {
        const prog = progress.find((p) => p.assignmentId === a.id || p.assignmentId === a._id);
        return prog?.status !== "completed";
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

    return { totalAssignments, completedAssignments, progressPct, avgScore, upcoming };
  }, [assignments, progress]);

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Progress Bar & Status */}
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-secondary" />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3.5"
                strokeDasharray={`${stats.progressPct} ${100 - stats.progressPct}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xs font-bold text-foreground">{stats.progressPct}%</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">My Academic Progress</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Completed {stats.completedAssignments} of {stats.totalAssignments} assignments
            </p>
          </div>
        </div>

        {/* Quick Stats & Next Deadline */}
        <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
          {stats.avgScore !== null && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Average</span>
              <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">{stats.avgScore}%</span>
            </div>
          )}

          {stats.upcoming ? (
            <div className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-left">
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                <Clock className="w-3 h-3" /> Next Due
              </div>
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 truncate max-w-[120px] block" title={stats.upcoming.title}>
                {stats.upcoming.title}
              </span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-center">
              <span className="text-[10px] font-medium block">Deadlines</span>
              <span className="text-xs font-semibold text-foreground">All caught up</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
