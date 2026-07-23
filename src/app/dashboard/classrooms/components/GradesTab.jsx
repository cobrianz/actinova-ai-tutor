"use client";

import { useState, useMemo } from "react";
import { BarChart2, FileText, Download, TrendingUp, Search, UserCheck, Award, Edit, Check, X } from "lucide-react";
import { apiClient } from "@/lib/csrfClient";
import { toast } from "sonner";

function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-green-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>
      {action && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function GradeBadge({ grade }) {
  const styles = {
    A: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
    B: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
    C: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
    D: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30",
    F: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30",
    Pass: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
    Fail: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30",
  };
  const cls = styles[grade] || "bg-secondary text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      {grade || "N/A"}
    </span>
  );
}

export default function GradesTab({ classroomState }) {
  const { isInstructor, assignments = [], grades = [], gradesLoading, handleExportGrades, user, classroom } = classroomState;
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const visibleGrades = useMemo(() => {
    let list = isInstructor ? grades : grades.filter((g) => g.id?.toString() === user?._id?.toString() || g.studentId?.toString() === user?._id?.toString());
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q));
    }
    return list;
  }, [grades, isInstructor, user, searchQuery]);

  const filteredAssignments = useMemo(() => {
    if (typeFilter === "all") return assignments;
    return assignments.filter((a) => a.type === typeFilter);
  }, [assignments, typeFilter]);

  // Calculate grade distribution metrics
  const gradeStats = useMemo(() => {
    if (!grades.length) return null;
    const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    let totalScoreSum = 0;
    let studentCount = 0;

    grades.forEach((s) => {
      if (s.letterGrade && counts[s.letterGrade] !== undefined) {
        counts[s.letterGrade]++;
      }
      if (s.weightedAverage != null) {
        totalScoreSum += s.weightedAverage;
        studentCount++;
      }
    });

    const classAverage = studentCount > 0 ? Math.round((totalScoreSum / studentCount) * 10) / 10 : 0;
    return { counts, classAverage, totalStudents: grades.length };
  }, [grades]);

  const assignmentTypes = useMemo(() => {
    const types = new Set(assignments.map((a) => a.type).filter(Boolean));
    return Array.from(types);
  }, [assignments]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Gradebook</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isInstructor ? "Manage student grades, performance, and transcripts" : "View your academic performance and grades"}
          </p>
        </div>
        {isInstructor && (
          <button
            onClick={handleExportGrades}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors self-start sm:self-auto"
          >
            <FileText className="w-3.5 h-3.5" /> Export CSV
          </button>
        )}
      </div>

      {/* Grade distribution cards (Instructor View) */}
      {isInstructor && gradeStats && gradeStats.totalStudents > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl border border-border bg-card">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Class Avg</span>
            <span className="text-lg font-black text-foreground">{gradeStats.classAverage}%</span>
          </div>
          {["A", "B", "C", "D", "F"].map((gradeKey) => {
            const count = gradeStats.counts[gradeKey] || 0;
            const pct = Math.round((count / gradeStats.totalStudents) * 100);
            return (
              <div key={gradeKey} className="p-3 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Grade {gradeKey}</span>
                  <GradeBadge grade={gradeKey} />
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-black text-foreground">{count}</span>
                  <span className="text-[10px] text-muted-foreground">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {isInstructor && (
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30"
            />
          </div>
        )}

        {assignmentTypes.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                typeFilter === "all"
                  ? "bg-green-500 text-white font-semibold"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              All Types ({assignments.length})
            </button>
            {assignmentTypes.map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  typeFilter === type
                    ? "bg-green-500 text-white font-semibold"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Table Content */}
      {gradesLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="h-3 bg-secondary rounded w-1/3 mb-2" />
              <div className="h-2 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : visibleGrades.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No grades available"
          description={isInstructor ? "Grades will appear once students submit assignments" : "No grade entries recorded yet for your account"}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">
                    {isInstructor ? "Student" : "Course Record"}
                  </th>
                  {filteredAssignments.slice(0, 8).map((a) => (
                    <th
                      key={a.id}
                      className="text-center px-3 py-3 font-bold text-muted-foreground uppercase tracking-wider max-w-[120px] truncate"
                      title={a.title}
                    >
                      {a.title}
                    </th>
                  ))}
                  <th className="text-center px-3 py-3 font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                    Average
                  </th>
                  <th className="text-center px-3 py-3 font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleGrades.map((student, i) => (
                  <tr key={student.id || i} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {student.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{student.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    {filteredAssignments.slice(0, 8).map((a) => {
                      const g = student.grades?.[a.id];
                      const pct = g?.score != null && a.maxScore ? Math.round((g.score / a.maxScore) * 100) : null;
                      return (
                        <td key={a.id} className="text-center px-3 py-3">
                          {g?.score != null ? (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                pct >= 90
                                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : pct >= 75
                                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                  : pct >= 60
                                  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                              }`}
                            >
                              {g.score}/{a.maxScore}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center px-3 py-3">
                      <span className="text-xs font-bold text-foreground">
                        {student.weightedAverage != null ? `${student.weightedAverage}%` : "—"}
                      </span>
                    </td>
                    <td className="text-center px-3 py-3">
                      <GradeBadge grade={student.letterGrade} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredAssignments.length > 8 && (
            <p className="text-[10px] text-muted-foreground text-center py-2 bg-secondary/20">
              Showing 8 of {filteredAssignments.length} assignments. Export CSV for full transcript.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
