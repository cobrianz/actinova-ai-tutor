"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, CheckCircle2, XCircle, Clock, AlertCircle, Download,
  ChevronLeft, ChevronRight, Save, Loader2, Search, TrendingDown,
  Calendar, BarChart2, Sparkles,
} from "lucide-react";
import { apiClient } from "@/lib/csrfClient";
import { toast } from "sonner";

const STATUS_CONFIG = {
  present: {
    label: "Present",
    short: "P",
    color: "bg-emerald-500",
    textColor: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-200 dark:border-emerald-500/30",
    icon: CheckCircle2,
  },
  absent: {
    label: "Absent",
    short: "A",
    color: "bg-red-500",
    textColor: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-500/10",
    border: "border-red-200 dark:border-red-500/30",
    icon: XCircle,
  },
  late: {
    label: "Late",
    short: "L",
    color: "bg-amber-500",
    textColor: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-200 dark:border-amber-500/30",
    icon: Clock,
  },
  excused: {
    label: "Excused",
    short: "E",
    color: "bg-blue-400",
    textColor: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    border: "border-blue-200 dark:border-blue-500/30",
    icon: AlertCircle,
  },
};

const STATUSES = ["present", "absent", "late", "excused"];

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isoDate(date) {
  return new Date(date).toISOString().split("T")[0];
}

function getAttendanceRate(records, studentId) {
  if (!records.length) return null;
  const mine = records.filter((r) => r.studentId === studentId || r.studentId?.toString?.() === studentId);
  if (!mine.length) return null;
  const present = mine.filter((r) => r.status === "present" || r.status === "late").length;
  return Math.round((present / mine.length) * 100);
}

// Generate class session dates based on classroom schedule or weekly defaults
function generateSessionDates(classroom, weeksBack = 4) {
  const dates = [];
  const now = new Date();
  const start = classroom.startDate ? new Date(classroom.startDate) : new Date(now.getTime() - weeksBack * 7 * 24 * 60 * 60 * 1000);
  const scheduleDays = classroom.schedule?.days || ["mon", "wed", "fri"];
  const dayMap = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const targetDays = scheduleDays.map((d) => dayMap[d] ?? 1);

  let cursor = new Date(start);
  while (cursor <= now) {
    if (targetDays.includes(cursor.getDay())) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates.slice(-30); // cap at 30 sessions
}

// ── Instructor view: attendance grid ─────────────────────────────────────────

function InstructorAttendance({ classroom, students, attendance, onSave, saving }) {
  const [sessions, setSessions] = useState(() => generateSessionDates(classroom));
  const [selectedSession, setSelectedSession] = useState(null);
  const [draft, setDraft] = useState({});
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [atRisk, setAtRisk] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionIdx, setSessionIdx] = useState(0);

  // Show last 7 sessions in the grid header
  const visibleSessions = sessions.slice(-7);

  const filtered = students.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
  });

  // Compute which students are at risk (< 70% attendance)
  useEffect(() => {
    const risks = students.filter((s) => {
      const rate = getAttendanceRate(attendance, s.id);
      return rate !== null && rate < 70;
    });
    setAtRisk(risks.map((s) => s.id));
  }, [attendance, students]);

  const getRecord = (studentId, date) => {
    const d = isoDate(date);
    return attendance.find((r) => {
      const rDate = isoDate(r.date);
      const rid = r.studentId?.toString?.() ?? r.studentId;
      return rDate === d && rid === studentId;
    });
  };

  const getDraftStatus = (studentId, date) => {
    const key = `${studentId}|${isoDate(date)}`;
    return draft[key] ?? getRecord(studentId, date)?.status ?? null;
  };

  const cycleStatus = (studentId, date) => {
    const current = getDraftStatus(studentId, date);
    const idx = STATUSES.indexOf(current);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    const key = `${studentId}|${isoDate(date)}`;
    setDraft((prev) => ({ ...prev, [key]: next }));
  };

  const handleSaveSession = async (date) => {
    const d = isoDate(date);
    const records = students.map((s) => ({
      studentId: s.id,
      status: getDraftStatus(s.id, date) || "absent",
    }));
    await onSave(d, records);
    // Clear draft for this session
    setDraft((prev) => {
      const next = { ...prev };
      students.forEach((s) => delete next[`${s.id}|${d}`]);
      return next;
    });
  };

  const exportCSV = () => {
    const header = ["Student", "Email", ...sessions.map((s) => isoDate(s)), "Rate"];
    const rows = students.map((s) => [
      s.name,
      s.email,
      ...sessions.map((sess) => getRecord(s.id, sess)?.status ?? "—"),
      `${getAttendanceRate(attendance, s.id) ?? "—"}%`,
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${classroom.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Attendance</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sessions.length} sessions tracked &middot; {students.length} students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-semibold hover:bg-secondary/80 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* At-risk alert */}
      {atRisk.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl"
        >
          <TrendingDown className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-700 dark:text-red-400">
              {atRisk.length} student{atRisk.length > 1 ? "s" : ""} below 70% attendance
            </p>
            <p className="text-[11px] text-red-600 dark:text-red-500 mt-0.5">
              {students.filter((s) => atRisk.includes(s.id)).map((s) => s.name).join(", ")}
            </p>
          </div>
        </motion.div>
      )}

      {/* Session selector tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No sessions yet. Set a start date and schedule in Settings.</p>
        ) : (
          sessions.slice(-7).map((s, i) => {
            const d = isoDate(s);
            const isSelected = selectedSession && isoDate(selectedSession) === d;
            const hasDraft = students.some((st) => draft[`${st.id}|${d}`]);
            return (
              <button
                key={d}
                onClick={() => setSelectedSession(isSelected ? null : s)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-green-500 text-white border-green-500 shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-green-300 hover:text-foreground"
                }`}
              >
                {formatDate(s)}
                {hasDraft && !isSelected && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <span key={s} className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
              <span className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
              {cfg.label}
            </span>
          );
        })}
        <span className="text-[10px] text-muted-foreground ml-auto">Click cell to cycle status</span>
      </div>

      {/* Search */}
      {students.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30"
          />
        </div>
      )}

      {/* Grid */}
      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No students enrolled</h3>
          <p className="text-xs text-muted-foreground">Invite students first to track attendance</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-48">Student</th>
                  {visibleSessions.map((s) => {
                    const d = isoDate(s);
                    const isSelected = selectedSession && isoDate(selectedSession) === d;
                    return (
                      <th
                        key={d}
                        className={`px-3 py-3 text-center font-semibold text-muted-foreground whitespace-nowrap transition-colors ${
                          isSelected ? "bg-green-50 dark:bg-green-500/5 text-green-700 dark:text-green-400" : ""
                        }`}
                      >
                        <div className="text-[9px] uppercase tracking-wider">
                          {new Date(s).toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                        <div>{new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                      </th>
                    );
                  })}
                  <th className="px-3 py-3 text-center font-semibold text-muted-foreground">Rate</th>
                  {selectedSession && (
                    <th className="px-3 py-3 text-right font-semibold text-green-600">Save</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((student, si) => {
                  const rate = getAttendanceRate(attendance, student.id);
                  const isAtRisk = atRisk.includes(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={`transition-colors hover:bg-secondary/20 ${si % 2 === 0 ? "" : "bg-secondary/10"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                            {student.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate flex items-center gap-1">
                              {student.name}
                              {isAtRisk && (
                                <span className="text-[9px] px-1 py-0.5 rounded bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold">
                                  At Risk
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      {visibleSessions.map((sess) => {
                        const d = isoDate(sess);
                        const isSelected = selectedSession && isoDate(selectedSession) === d;
                        const status = getDraftStatus(student.id, sess);
                        const cfg = status ? STATUS_CONFIG[status] : null;
                        return (
                          <td
                            key={d}
                            className={`px-3 py-3 text-center transition-colors ${isSelected ? "bg-green-50/50 dark:bg-green-500/5 cursor-pointer" : ""}`}
                            onClick={isSelected ? () => cycleStatus(student.id, sess) : undefined}
                          >
                            {status ? (
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-black border ${cfg.bg} ${cfg.textColor} ${cfg.border} ${isSelected ? "ring-2 ring-green-400/30" : ""}`}
                                title={cfg.label}
                              >
                                {cfg.short}
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground/30 border border-dashed border-border ${isSelected ? "ring-2 ring-green-400/20 text-muted-foreground/60" : ""}`}
                              >
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-center">
                        {rate !== null ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rate >= 80
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : rate >= 70
                                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                            }`}
                          >
                            {rate}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 text-[10px]">—</span>
                        )}
                      </td>
                      {selectedSession && (
                        <td className="px-3 py-3" />
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selectedSession && (
            <div className="px-4 py-3 border-t border-border bg-green-50/50 dark:bg-green-500/5 flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">
                Session: <span className="font-semibold text-foreground">{formatDate(selectedSession)}</span>
                {" "}&mdash; click cells to mark status
              </p>
              <button
                onClick={() => handleSaveSession(selectedSession)}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? "Saving..." : "Save Session"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Summary stats */}
      {students.length > 0 && attendance.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const count = attendance.filter((r) => r.status === s).length;
            const pct = attendance.length > 0 ? Math.round((count / attendance.length) * 100) : 0;
            return (
              <div key={s} className={`rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}>
                <p className={`text-xs font-bold ${cfg.textColor}`}>{cfg.label}</p>
                <p className="text-xl font-black text-foreground mt-0.5">{count}</p>
                <p className="text-[10px] text-muted-foreground">{pct}% of all records</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Student view: personal attendance record ─────────────────────────────────

function StudentAttendance({ attendance }) {
  const sorted = [...attendance].sort((a, b) => new Date(b.date) - new Date(a.date));
  const present = attendance.filter((r) => r.status === "present" || r.status === "late").length;
  const rate = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-foreground">My Attendance</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Your attendance record for this class</p>
      </div>

      {/* Rate card */}
      {rate !== null && (
        <div className="flex items-center gap-5 p-5 bg-card border border-border rounded-xl">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-secondary" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={rate >= 80 ? "#22c55e" : rate >= 70 ? "#f59e0b" : "#ef4444"}
                strokeWidth="3"
                strokeDasharray={`${rate} ${100 - rate}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black text-foreground">{rate}%</span>
            </div>
          </div>
          <div>
            <p className="text-base font-bold text-foreground">
              {rate >= 80 ? "Good standing" : rate >= 70 ? "Needs improvement" : "At risk"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {present} of {attendance.length} sessions attended
            </p>
            {rate < 80 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
                Attendance below 80% may affect your grade
              </p>
            )}
          </div>
        </div>
      )}

      {/* Record list */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-foreground">No attendance records yet</p>
          <p className="text-xs text-muted-foreground mt-1">Records will appear after your instructor marks sessions</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {sorted.map((r, i) => {
              const cfg = STATUS_CONFIG[r.status];
              const Icon = cfg.icon;
              return (
                <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg} ${cfg.border} border`}>
                      <Icon className={`w-4 h-4 ${cfg.textColor}`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{formatDate(r.date)}</p>
                      {r.note && <p className="text-[10px] text-muted-foreground mt-0.5">{r.note}</p>}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${cfg.bg} ${cfg.textColor} ${cfg.border}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function AttendanceTab({ classroomState }) {
  const { classroom, isInstructor, students } = classroomState;
  const [attendance, setAttendance] = useState([]);
  const [apiStudents, setApiStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/classrooms/${classroom.id}/attendance`);
      const data = await res.json();
      if (data.success) {
        setAttendance(data.attendance || []);
        if (data.students) setApiStudents(data.students);
      }
    } catch (e) {
      console.error("Failed to fetch attendance:", e);
    } finally {
      setLoading(false);
    }
  }, [classroom.id]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleSave = async (date, records) => {
    setSaving(true);
    try {
      const res = await apiClient.post(`/api/classrooms/${classroom.id}/attendance`, { date, records });
      const data = await res.json();
      if (data.success) {
        toast.success(`Attendance saved for ${records.length} students`);
        await fetchAttendance();
      } else {
        toast.error(data.error || "Failed to save attendance");
      }
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-secondary rounded-lg w-40 animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-secondary rounded-xl animate-pulse" />
      </div>
    );
  }

  const displayStudents = isInstructor
    ? (apiStudents.length > 0 ? apiStudents : students.map((s) => ({ id: s.id, name: s.name, email: s.email })))
    : [];

  return isInstructor ? (
    <InstructorAttendance
      classroom={classroom}
      students={displayStudents}
      attendance={attendance}
      onSave={handleSave}
      saving={saving}
    />
  ) : (
    <StudentAttendance attendance={attendance} />
  );
}
