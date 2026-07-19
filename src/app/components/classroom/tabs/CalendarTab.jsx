"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, BookOpen, ClipboardList, MessageSquare } from "lucide-react";

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function CalendarTab({ classroomState }) {
  const { classroom, assignments, discussions, announcements, getWeeks } = classroomState;

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const startDate = useMemo(() => (classroom.startDate ? new Date(classroom.startDate) : null), [classroom.startDate]);
  const durationWeeks = classroom.durationWeeks || 0;
  const scheduleDays = useMemo(() => classroom.schedule?.days || [], [classroom.schedule?.days]);
  const startTime = classroom.schedule?.startTime || "";
  const endTime = classroom.schedule?.endTime || "";
  const location = classroom.schedule?.location || "";

  const endDate = useMemo(() => {
    if (!startDate || !durationWeeks) return null;
    const d = new Date(startDate);
    d.setDate(d.getDate() + durationWeeks * 7);
    return d;
  }, [startDate, durationWeeks]);

  const [currentMonth, setCurrentMonth] = useState(startDate ? startDate.getMonth() : today.getMonth());
  const [currentYear, setCurrentYear] = useState(startDate ? startDate.getFullYear() : today.getFullYear());

  const weeks = useMemo(() => getWeeks(), [getWeeks]);

  // Map due dates to calendar days
  const eventsByDate = useMemo(() => {
    const map = {};
    if (assignments) {
      assignments.forEach((a) => {
        if (!a.dueDate) return;
        const d = new Date(a.dueDate);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!map[key]) map[key] = [];
        map[key].push({ type: "assignment", title: a.title, color: "bg-green-500" });
      });
    }
    if (discussions) {
      discussions.forEach((d) => {
        if (!d.createdAt) return;
        const dt = new Date(d.createdAt);
        const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
        if (!map[key]) map[key] = [];
        map[key].push({ type: "discussion", title: d.title, color: "bg-blue-500" });
      });
    }
    if (announcements) {
      announcements.forEach((a) => {
        if (!a.createdAt) return;
        const dt = new Date(a.createdAt);
        const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
        if (!map[key]) map[key] = [];
        map[key].push({ type: "announcement", title: a.title, color: "bg-amber-500" });
      });
    }
    return map;
  }, [assignments, discussions, announcements]);

  // Build week schedule class days
  const classDaysInMonth = useMemo(() => {
    const days = new Set();
    if (!scheduleDays.length) return days;
    const daysMap = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
    const targetDays = scheduleDays.map((d) => daysMap[d]).filter((d) => d !== undefined);
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(currentYear, currentMonth, d);
      if (targetDays.includes(dt.getDay())) {
        // Only include if within course date range
        if (startDate && endDate) {
          if (dt >= startDate && dt < endDate) days.add(d);
        } else {
          days.add(d);
        }
      }
    }
    return days;
  }, [currentYear, currentMonth, scheduleDays, startDate, endDate]);

  // Current course week
  const currentCourseWeek = useMemo(() => {
    if (!startDate || !durationWeeks) return null;
    const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return null;
    const weekNum = Math.floor(diffDays / 7) + 1;
    if (weekNum > durationWeeks) return null;
    return weekNum;
  }, [startDate, durationWeeks, today]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const navigateMonth = (dir) => {
    let newMonth = currentMonth + dir;
    let newYear = currentYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const isToday = (day) => {
    return today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;
  };

  const isInCourseRange = (day) => {
    if (!startDate || !endDate) return false;
    const dt = new Date(currentYear, currentMonth, day);
    return dt >= startDate && dt < endDate;
  };

  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  return (
    <div className="space-y-3">
      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigateMonth(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h3>
          <button onClick={() => navigateMonth(1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-slate-400 uppercase">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = `${currentYear}-${currentMonth}-${day}`;
            const dayEvents = eventsByDate[key] || [];
            const hasClass = classDaysInMonth.has(day);
            const inRange = isInCourseRange(day);
            const todayMatch = isToday(day);

            return (
              <div
                key={day}
                className={`relative rounded-lg p-1 min-h-[44px] text-center transition-colors ${
                  todayMatch
                    ? "bg-green-500/15 ring-1 ring-green-500/40"
                    : inRange
                      ? "bg-slate-50 dark:bg-slate-800/50"
                      : ""
                }`}
              >
                <span className={`text-[11px] font-semibold ${todayMatch ? "text-green-700 dark:text-green-400" : "text-slate-700 dark:text-slate-300"}`}>
                  {day}
                </span>
                {hasClass && (
                  <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-green-500" />
                )}
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 justify-center mt-0.5 flex-wrap">
                    {dayEvents.slice(0, 3).map((ev, j) => (
                      <div key={j} className={`w-1.5 h-1.5 rounded-full ${ev.color}`} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[9px] text-slate-500">Class Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[9px] text-slate-500">Assignment</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[9px] text-slate-500">Discussion</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[9px] text-slate-500">Announcement</span>
          </div>
        </div>
      </div>

      {/* Course Schedule Info */}
      {scheduleDays.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-green-500" />
            Weekly Schedule
          </h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Days:</span>
              <span>{scheduleDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}</span>
            </div>
            {startTime && endTime && (
              <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{startTime} — {endTime}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <MapPin className="w-3 h-3" />
                <span>{location}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Course Dates */}
      {startDate && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">Course Timeline</h4>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Start</span>
              <span className="font-semibold text-slate-900 dark:text-white">{startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            {endDate && (
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">End</span>
                <span className="font-semibold text-slate-900 dark:text-white">{endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            )}
            {durationWeeks > 0 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Duration</span>
                <span className="font-semibold text-slate-900 dark:text-white">{durationWeeks} weeks</span>
              </div>
            )}
            {currentCourseWeek && (
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Current</span>
                <span className="font-semibold text-green-600 dark:text-green-400">Week {currentCourseWeek} of {durationWeeks}</span>
              </div>
            )}
          </div>
          {/* Progress bar */}
          {currentCourseWeek && durationWeeks > 0 && (
            <div className="mt-3">
              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${Math.min(100, (currentCourseWeek / durationWeeks) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upcoming Events */}
      {(assignments?.length > 0 || discussions?.length > 0) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">Upcoming</h4>
          <div className="space-y-2">
            {assignments?.filter((a) => a.dueDate && new Date(a.dueDate) >= today).slice(0, 3).map((a) => (
              <div key={a._id} className="flex items-center gap-2 text-[11px]">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{a.title}</span>
                <span className="text-slate-400 flex-shrink-0">{new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
            ))}
            {discussions?.filter((d) => d.createdAt && new Date(d.createdAt) >= today).slice(0, 2).map((d) => (
              <div key={d._id} className="flex items-center gap-2 text-[11px]">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{d.title}</span>
                <span className="text-slate-400 flex-shrink-0">{new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!startDate && !scheduleDays.length && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No schedule set</h3>
          <p className="text-sm text-slate-500 max-w-xs">Set a start date and weekly schedule in Settings to see the calendar view.</p>
        </div>
      )}
    </div>
  );
}
