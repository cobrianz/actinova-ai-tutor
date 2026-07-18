"use client";

import { motion } from "framer-motion";
import { Calendar, Layers, MessageSquare, ClipboardList } from "lucide-react";

/**
 * @param {object} props
 * @param {object} props.classroom - Classroom object with startDate, durationWeeks, etc.
 * @param {Function} props.getWeeks - Function returning array of week objects
 * @param {boolean} props.isInstructor - Whether current user is instructor
 * @param {Array} props.materials - Materials array
 * @param {Array} props.discussions - Discussions array
 * @param {Array} props.assignments - Assignments array
 */
function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-green-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>
      {action && (
        <button onClick={onAction} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
          {action}
        </button>
      )}
    </div>
  );
}

export default function ScheduleTab({ classroomState }) {
  const { classroom, getWeeks, materials, discussions, assignments } = classroomState;

  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Course Schedule</h3>
        {classroom.startDate && classroom.durationWeeks ? (
          <p className="text-[11px] text-slate-500">{classroom.durationWeeks} weeks starting {new Date(classroom.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        ) : (
          <p className="text-[11px] text-slate-400">No schedule set. Edit classroom settings to add duration and start date.</p>
        )}
      </div>
      {getWeeks().map((week) => (
        <div key={week.number} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0"><span className="text-sm font-bold text-green-600">W{week.number}</span></div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Week {week.number}</h4>
              <p className="text-[10px] text-slate-500">{week.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {week.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
            </div>
          </div>
          <div className="space-y-2">
            {week.materials.length > 0 && <div className="flex items-center gap-2 text-[11px] text-slate-500"><Layers className="w-3 h-3 text-purple-500" /><span className="font-medium">{week.materials.length} material{week.materials.length !== 1 ? "s" : ""}</span><span className="text-slate-400">— {week.materials.map((m) => m.title).join(", ")}</span></div>}
            {week.discussions.length > 0 && <div className="flex items-center gap-2 text-[11px] text-slate-500"><MessageSquare className="w-3 h-3 text-blue-500" /><span className="font-medium">{week.discussions.length} discussion{week.discussions.length !== 1 ? "s" : ""}</span><span className="text-slate-400">— {week.discussions.map((d) => d.title).join(", ")}</span></div>}
            {week.assignments.length > 0 && <div className="flex items-center gap-2 text-[11px] text-slate-500"><ClipboardList className="w-3 h-3 text-green-500" /><span className="font-medium">{week.assignments.length} assignment{week.assignments.length !== 1 ? "s" : ""}</span><span className="text-slate-400">— {week.assignments.map((a) => a.title).join(", ")}</span></div>}
            {week.materials.length === 0 && week.discussions.length === 0 && week.assignments.length === 0 && <p className="text-[11px] text-slate-400 italic">No content yet for this week</p>}
          </div>
        </div>
      ))}
      {getWeeks().length === 0 && <EmptyState icon={Calendar} title="No schedule" description="Set a start date and duration in settings to see a weekly course breakdown" />}
    </div>
  );
}
