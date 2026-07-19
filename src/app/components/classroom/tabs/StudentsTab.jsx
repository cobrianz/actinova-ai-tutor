"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Users, CheckCircle2, Clock, ArrowLeft, BarChart2,
  BookOpen, TrendingUp, Mail, Calendar, Award, Eye, Loader2,
  Trash2, Search,
} from "lucide-react";
import EmptyState from "../EmptyState";
import InvitePanel from "../InvitePanel";

function getGradeInfo(progress) {
  if (progress >= 90) return { label: "A", color: "#22c55e", bg: "bg-green-50 dark:bg-green-500/10", text: "text-green-600" };
  if (progress >= 75) return { label: "B", color: "#3b82f6", bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600" };
  if (progress >= 60) return { label: "C", color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600" };
  return { label: "D", color: "#ef4444", bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-600" };
}

function formatLastActive(lastActivityAt) {
  if (!lastActivityAt) return null;
  const d = Math.floor((Date.now() - new Date(lastActivityAt)) / 86400000);
  return d === 0 ? "Active today" : `${d}d ago`;
}

function StudentProfilePanel({ student, classroomId, onBack }) {
  const progress = student.avgProgress || 0;
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (progress / 100) * circumference;
  const grade = getGradeInfo(progress);
  const isActive = student.totalTimeMinutes > 60;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-[11px] font-medium transition-colors">
        <ArrowLeft size={14} /> Back to Students
      </button>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 relative">
          <div className="absolute -bottom-10 left-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 flex items-center justify-center overflow-hidden">
                <span className="text-2xl font-black text-slate-700 dark:text-slate-200">{student.name?.charAt(0)?.toUpperCase() || "?"}</span>
              </div>
              {isActive && (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-400 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="pt-13 px-6 pb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{student.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Mail className="w-3 h-3 text-slate-400" />
                <p className="text-xs text-slate-500">{student.email}</p>
              </div>
              {student.lastActivityAt && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${formatLastActive(student.lastActivityAt) === "Active today" ? "bg-green-400" : "bg-slate-300"}`} />
                  <span className="text-[10px] text-slate-400">{formatLastActive(student.lastActivityAt)}</span>
                </div>
              )}
            </div>
            <div className={`px-3 py-1.5 rounded-lg ${grade.bg}`}>
              <span className={`text-sm font-black ${grade.text}`}>{grade.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <svg width="64" height="64" className="-rotate-90">
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-slate-800" />
                <circle cx="32" cy="32" r="28" fill="none" stroke={grade.color} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{progress}%</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Overall Progress</p>
              <p className="text-xs text-slate-500">{student.completed || 0} of {student.totalAssignments || 0} assignments completed</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-md bg-green-500/10 flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-green-500" /></div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Completed</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">{student.completed || 0}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center"><Clock className="w-3 h-3 text-blue-500" /></div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Time Spent</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">{student.totalTimeMinutes || 0}<span className="text-xs font-medium text-slate-400 ml-0.5">min</span></p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center"><BookOpen className="w-3 h-3 text-amber-500" /></div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Remaining</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">{(student.totalAssignments || 0) - (student.completed || 0)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center"><TrendingUp className="w-3 h-3 text-purple-500" /></div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Avg Score</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">{student.avgScore || 0}%</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function StudentsTab({ classroomState }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    classroom, isInstructor, students, studentStats,
    loading, showInvite, setShowInvite, onRemoveStudent,
  } = classroomState;

  const filteredStudents = students.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
  });

  if (selectedStudent) {
    return <StudentProfilePanel student={selectedStudent} classroomId={classroom.id} onBack={() => setSelectedStudent(null)} />;
  }

  return (
    <div className="space-y-3">
      {showInvite && (
        <InvitePanel classroom={classroom} onClose={() => setShowInvite(false)} />
      )}
      {!showInvite && (
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-green-200 dark:border-green-500/30 rounded-xl text-sm text-green-600 hover:border-green-400 transition-colors bg-white dark:bg-slate-900">
          <UserPlus className="w-4 h-4" /> Invite Students
        </button>
      )}
      {students.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Total", value: studentStats.totalStudents || students.length, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
            { label: "Active", value: studentStats.activeStudents, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
            { label: "Avg Progress", value: `${studentStats.avgCompletion || 0}%`, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
          ].map(({ label, value, color, bg }, i) => (
            <div key={i} className={`${bg} rounded-xl p-3 text-center`}>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-[10px] font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}
      {students.length > 0 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30"
          />
        </div>
      )}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : students.length === 0 ? (
        <EmptyState icon={Users} title="No students yet" description="Share the invite code to get students enrolled" action="Invite Students" onAction={() => setShowInvite(true)} />
      ) : filteredStudents.length === 0 && searchQuery ? (
        <p className="text-xs text-center text-slate-400 py-6">No students match your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredStudents.map((student) => {
            const progress = student.avgProgress || 0;
            const circumference = 2 * Math.PI * 20;
            const offset = circumference - (progress / 100) * circumference;
            const grade = getGradeInfo(progress);
            const isActive = student.totalTimeMinutes > 60;

            return (
              <motion.div key={student.id} whileHover={{ y: -2 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 hover:border-green-300 dark:hover:border-green-600 transition-all">
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                      <span className="text-lg font-black text-white">{student.name?.charAt(0)?.toUpperCase() || "?"}</span>
                    </div>
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{student.name}</h4>
                      <div className={`px-1.5 py-0.5 rounded-md ${grade.bg} ${grade.text}`}>
                        <span className="text-[10px] font-black">{grade.label}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mb-2">{student.email}</p>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mb-2">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, backgroundColor: grade.color }} />
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> {student.completed}/{student.totalAssignments}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {student.totalTimeMinutes}m</span>
                    </div>
                  </div>

                  <div className="relative flex-shrink-0">
                    <svg width="44" height="44" className="-rotate-90">
                      <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100 dark:text-slate-800" />
                      <circle cx="22" cy="22" r="18" fill="none" stroke={grade.color} strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-900 dark:text-white">{progress}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {student.lastActivityAt && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span className={`w-1.5 h-1.5 rounded-full ${formatLastActive(student.lastActivityAt) === "Active today" ? "bg-green-400" : "bg-slate-300"}`} />
                        {formatLastActive(student.lastActivityAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSelectedStudent(student)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-green-600 hover:text-green-700 transition-colors px-2 py-1 rounded-lg hover:bg-green-50 dark:hover:bg-green-500/10">
                      <Eye className="w-3 h-3" /> View Profile
                    </button>
                    {isInstructor && onRemoveStudent && (
                      <button
                        onClick={() => onRemoveStudent(student.id, student.name)}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                        title="Remove student"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
