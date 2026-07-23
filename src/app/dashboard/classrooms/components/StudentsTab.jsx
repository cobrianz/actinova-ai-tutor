"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  UserPlus, Users, CheckCircle2, Clock, ArrowLeft, BarChart2,
  TrendingUp, Mail, Eye, Loader2, Trash2, Search, ChevronUp, ChevronDown,
  Layers, Megaphone, Plus, Sparkles,
} from "lucide-react";
import EmptyState from "./EmptyState";
import InvitePanel from "./InvitePanel";
import ForkContentPanel from "./ForkContentPanel";

function getGradeInfo(progress) {
  if (progress >= 90) return { label: "A", cls: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400" };
  if (progress >= 75) return { label: "B", cls: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" };
  if (progress >= 60) return { label: "C", cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400" };
  return { label: "D", cls: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400" };
}

function formatLastActive(lastActivityAt) {
  if (!lastActivityAt) return "—";
  const d = Math.floor((Date.now() - new Date(lastActivityAt)) / 86400000);
  return d === 0 ? "Today" : `${d}d ago`;
}

function ProgressBar({ value }) {
  const color = value >= 75 ? "bg-green-500" : value >= 50 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground w-7 text-right">{value}%</span>
    </div>
  );
}

// ── Student profile slide-in panel ───────────────────────────────────────────

function StudentProfilePanel({ student, onBack }) {
  const progress = student.avgProgress || 0;
  const grade = getGradeInfo(progress);

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Students
      </button>

      {/* Profile header */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="h-20 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-8 mb-4">
            <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 flex items-center justify-center">
              <span className="text-2xl font-black text-slate-700 dark:text-slate-200">
                {student.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${grade.cls}`}>{grade.label}</span>
          </div>
          <h3 className="text-base font-bold text-foreground">{student.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Mail className="w-3 h-3" /> {student.email}
          </p>
        </div>
      </div>

      {/* Stats table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <tbody className="divide-y divide-border">
            {[
              { label: "Progress", value: <ProgressBar value={progress} /> },
              { label: "Completed", value: `${student.completed || 0} / ${student.totalAssignments || 0}` },
              { label: "Avg Score", value: `${student.avgScore || 0}%` },
              { label: "Time Spent", value: `${student.totalTimeMinutes || 0} min` },
              { label: "Last Active", value: formatLastActive(student.lastActivityAt) },
            ].map(({ label, value }) => (
              <tr key={label} className="hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-2.5 font-semibold text-muted-foreground w-32">{label}</td>
                <td className="px-4 py-2.5 text-foreground">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ── Main StudentsTab ──────────────────────────────────────────────────────────

export default function StudentsTab({ classroomState }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [showForkPanel, setShowForkPanel] = useState(false);

  const {
    classroom, isInstructor, students, studentStats,
    loading, showInvite, setShowInvite, handleRemoveStudent,
    handlePostAnnouncement, handleForkContent, forkedIdSet,
    showNewAnnouncement, setShowNewAnnouncement,
    newAnnTitle, setNewAnnTitle, newAnnContent, setNewAnnContent,
  } = classroomState;

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = students
    .filter((s) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let av = a[sortKey] ?? "";
      let bv = b[sortKey] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  if (selectedStudent) {
    return <StudentProfilePanel student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
  }

  function SortIcon({ col }) {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-green-500" />
      : <ChevronDown className="w-3 h-3 text-green-500" />;
  }

  return (
    <div className="space-y-4">
      {isInstructor && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowInvite(!showInvite); setShowForkPanel(false); }} className={`flex items-center gap-2 flex-1 p-3 border-2 rounded-xl text-sm transition-colors ${showInvite ? "border-green-400 bg-green-50 dark:bg-green-500/10 text-green-600" : "border-dashed border-green-200 dark:border-green-500/30 text-green-600 hover:border-green-400 bg-white dark:bg-slate-900"}`}><UserPlus className="w-4 h-4" /> Invite</button>
            <button onClick={() => { setShowForkPanel(!showForkPanel); setShowInvite(false); }} className={`flex items-center gap-2 flex-1 p-3 border-2 rounded-xl text-sm transition-colors ${showForkPanel ? "border-purple-400 bg-purple-50 dark:bg-purple-500/10 text-purple-600" : "border-dashed border-purple-200 dark:border-purple-500/30 text-purple-600 hover:border-purple-400 bg-white dark:bg-slate-900"}`}><Layers className="w-4 h-4" /> Fork</button>
            <button onClick={() => setShowNewAnnouncement(!showNewAnnouncement)} className={`flex items-center gap-2 flex-1 p-3 border-2 rounded-xl text-sm transition-colors ${showNewAnnouncement ? "border-amber-400 bg-amber-50 dark:bg-amber-500/10 text-amber-600" : "border-dashed border-amber-200 dark:border-amber-500/30 text-amber-600 hover:border-amber-400 bg-white dark:bg-slate-900"}`}><Megaphone className="w-4 h-4" /> Announce</button>
          </div>
          {showInvite && <InvitePanel classroom={classroom} onClose={() => setShowInvite(false)} />}
          {showForkPanel && <ForkContentPanel classroom={classroom} onClose={() => setShowForkPanel(false)} browseResults={classroomState.browseResults} browseLoading={classroomState.browseLoading} browseQuery={classroomState.browseQuery} setBrowseQuery={classroomState.setBrowseQuery} browseType={classroomState.browseType} setBrowseType={classroomState.setBrowseType} onBrowse={classroomState.fetchBrowseContent} forking={classroomState.forking} forkedIdSet={forkedIdSet} browseError={classroomState.browseError} />}
        </div>
      )}

      {isInstructor && showNewAnnouncement && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Title</label><input value={newAnnTitle} onChange={(e) => setNewAnnTitle(e.target.value)} placeholder="Announcement title" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30" /></div>
          <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Content</label><textarea value={newAnnContent} onChange={(e) => setNewAnnContent(e.target.value)} placeholder="What do you want to announce?" rows={3} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 resize-none" /></div>
          <div className="flex gap-2"><button onClick={handlePostAnnouncement} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors">Post</button><button onClick={() => setShowNewAnnouncement(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button></div>
        </motion.div>
      )}

      {/* Stats row */}
      {students.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: studentStats.totalStudents || students.length, icon: Users, color: "text-blue-500" },
            { label: "Active", value: studentStats.activeStudents ?? "—", icon: TrendingUp, color: "text-green-500" },
            { label: "Avg Progress", value: `${studentStats.avgCompletion || 0}%`, icon: BarChart2, color: "text-purple-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="border border-border rounded-xl p-3 text-center bg-card">
              <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
              <p className="text-base font-bold text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      {students.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30" />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-border">
              {[1, 2, 3, 4].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-secondary" /><div className="h-3 bg-secondary rounded w-24" /></div></td>
                  <td className="px-4 py-3"><div className="h-2.5 bg-secondary rounded w-32" /></td>
                  <td className="px-4 py-3"><div className="h-2.5 bg-secondary rounded w-16" /></td>
                  <td className="px-4 py-3"><div className="h-2.5 bg-secondary rounded w-12" /></td>
                  <td className="px-4 py-3"><div className="h-2.5 bg-secondary rounded w-14" /></td>
                  <td className="px-4 py-3" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : students.length === 0 ? (
        <EmptyState icon={Users} title="No students yet"
          description="Share the invite code to get students enrolled"
          action="Invite Students" onAction={() => setShowInvite(true)} />
      ) : filtered.length === 0 ? (
        <p className="text-xs text-center text-muted-foreground py-8">No students match your search.</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  {[
                    { key: "name", label: "Student" },
                    { key: "email", label: "Email" },
                    { key: "avgProgress", label: "Progress" },
                    { key: "completed", label: "Done" },
                    { key: "lastActivityAt", label: "Last Active" },
                  ].map(({ key, label }) => (
                    <th key={key}
                      onClick={() => handleSort(key)}
                      className="px-4 py-2.5 text-left font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
                      <div className="flex items-center gap-1">{label}<SortIcon col={key} /></div>
                    </th>
                  ))}
                  <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((student, idx) => {
                  const progress = student.avgProgress || 0;
                  const grade = getGradeInfo(progress);
                  return (
                    <tr key={student.id} className={`transition-colors hover:bg-green-50/50 dark:hover:bg-green-500/5 ${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/70 dark:bg-slate-800/30"}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {student.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{student.name}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${grade.cls}`}>{grade.label}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[160px]">{student.email}</td>
                      <td className="px-4 py-3"><ProgressBar value={progress} /></td>
                      <td className="px-4 py-3 text-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          {student.completed || 0}/{student.totalAssignments || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatLastActive(student.lastActivityAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setSelectedStudent(student)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors">
                            <Eye className="w-3 h-3" /> View
                          </button>
                          {isInstructor && handleRemoveStudent && (
                            <button onClick={() => handleRemoveStudent(student.id, student.name)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-border bg-secondary/20 text-[10px] text-muted-foreground">
            {filtered.length} student{filtered.length !== 1 ? "s" : ""}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        </div>
      )}
    </div>
  );
}
