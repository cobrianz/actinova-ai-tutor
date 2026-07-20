"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthProvider";
import { apiClient } from "@/lib/csrfClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Copy, Check, ChevronRight, Clock, Trash2,
  AlertCircle, UserPlus, GraduationCap, ArrowRight, ChevronLeft,
  Sparkles, Loader2, ClipboardList, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import ClassroomDetail from "./classroom/ClassroomDetail";

const CREATOR_STEPS = ["Basic Info", "Course Settings", "Duration", "Content", "Syllabus", "Review"];

function CreateClassroomForm({ onClose, onCreated }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("create_classroom_draft") : null;
    if (saved) { try { const parsed = JSON.parse(saved); return parsed._step ?? 0; } catch {} }
    return 0;
  });

  const [form, setForm] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("create_classroom_draft");
      if (saved) { try { const parsed = JSON.parse(saved); delete parsed._step; return parsed; } catch {} }
    }
    return {
      name: "", description: "", subject: "", maxStudents: 50, semester: "",
      academicLevel: "undergraduate", gradingScheme: "percentage",
      prerequisites: "", syllabus: "", durationWeeks: 8, startDate: "",
    };
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSyllabusLoading, setAiSyllabusLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("create_classroom_draft", JSON.stringify({ ...form, _step: step }));
  }, [form, step]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") !== "creator") {
      params.set("view", "creator");
      router.replace(`/dashboard?${params.toString()}`);
    }
  }, [router, searchParams]);

  const handleGenerateDescription = async () => {
    if (!form.name.trim()) { toast.error("Enter a classroom name first"); return; }
    setAiLoading(true);
    try {
      const res = await apiClient.post("/api/classrooms/generate-description", { name: form.name, subject: form.subject });
      const data = await res.json();
      if (data.description) { setForm((prev) => ({ ...prev, description: data.description })); toast.success("Description generated!"); }
      else { toast.error(data.error || "Failed to generate description"); }
    } catch { toast.error("Failed to generate description"); } finally { setAiLoading(false); }
  };

  const handleGenerateSyllabus = async () => {
    if (!form.name.trim()) { toast.error("Enter a classroom name first"); return; }
    setAiSyllabusLoading(true);
    try {
      const res = await apiClient.post("/api/classrooms/ai-generate", { task: "syllabus", name: form.name, subject: form.subject, content: form.description, durationWeeks: form.durationWeeks });
      const data = await res.json();
      if (data.result) { setForm((prev) => ({ ...prev, syllabus: data.result })); toast.success("Syllabus generated!"); }
      else { toast.error("Failed to generate syllabus"); }
    } catch { toast.error("Failed to generate syllabus"); } finally { setAiSyllabusLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("Classroom name is required"); return; }
    setLoading(true);
    try {
      const payload = {
        name: form.name, description: form.description, subject: form.subject,
        maxStudents: parseInt(form.maxStudents) || 50, semester: form.semester,
        academicLevel: form.academicLevel, gradingScheme: form.gradingScheme,
        prerequisites: form.prerequisites ? form.prerequisites.split(",").map((s) => s.trim()).filter(Boolean) : [],
        syllabus: form.syllabus,
        durationWeeks: parseInt(form.durationWeeks) || 0,
        startDate: form.startDate || null,
      };
      const res = await apiClient.post("/api/classrooms", payload);
      const data = await res.json();
      if (data.success) {
        toast.success("Classroom created!");
        localStorage.removeItem("create_classroom_draft");
        router.replace("/dashboard?tab=classrooms");
        onCreated(data.classroom);
      } else { toast.error(data.error || "Failed to create classroom"); }
    } catch { toast.error("Failed to create classroom"); } finally { setLoading(false); }
  };

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const inputCls = "w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30";
  const labelCls = "text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block";
  const selectCls = inputCls + " appearance-none";

  const weekOptions = [2, 4, 6, 8, 10, 12, 14, 16];

  return (
    <div className="space-y-4">
      <button onClick={() => { localStorage.removeItem("create_classroom_draft"); router.replace("/dashboard?tab=classrooms"); onClose(); }} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-[11px] font-medium transition-colors group">
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />Back to Classrooms
      </button>
      <div className="min-h-[50vh] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 mb-5">
              <Users size={26} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">New Classroom</h2>
            <p className="text-sm text-slate-500">Set up your classroom step by step</p>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <nav className="md:w-44 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
              {CREATOR_STEPS.map((label, index) => (
                <button key={label} type="button" onClick={() => setStep(index)}
                  className={`flex items-center gap-2 text-left whitespace-nowrap rounded-lg px-2.5 py-2 text-[11px] transition-colors ${step === index ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                  <span className={`grid h-5 w-5 place-items-center rounded-full border text-[9px] font-bold ${step === index ? "border-green-600 bg-white text-green-700" : step > index ? "border-green-600 bg-green-600 text-white" : "border-slate-200 text-slate-400 dark:border-slate-700"}`}>{step > index ? <Check size={11} /> : index + 1}</span>
                  {label}
                </button>
              ))}
            </nav>

            <div className="min-w-0 flex-1">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
                {step === 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div>
                      <label className={labelCls}>Classroom Name *</label>
                      <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. CS 101 — Intro to Programming" className={inputCls} autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Subject</label>
                        <input value={form.subject} onChange={(e) => update("subject", e.target.value)} placeholder="e.g. Computer Science" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Semester</label>
                        <input value={form.semester} onChange={(e) => update("semester", e.target.value)} placeholder="e.g. Fall 2026" className={inputCls} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Academic Level</label>
                        <select value={form.academicLevel} onChange={(e) => update("academicLevel", e.target.value)} className={selectCls}>
                          <option value="highschool">High School</option>
                          <option value="undergraduate">Undergraduate</option>
                          <option value="graduate">Graduate</option>
                          <option value="phd">PhD</option>
                          <option value="professional">Professional</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Grading Scheme</label>
                        <select value={form.gradingScheme} onChange={(e) => update("gradingScheme", e.target.value)} className={selectCls}>
                          <option value="percentage">Percentage</option>
                          <option value="letter">Letter Grades</option>
                          <option value="passfail">Pass/Fail</option>
                          <option value="gpa">GPA Scale</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Max Students</label>
                      <input type="number" min={2} max={500} value={form.maxStudents} onChange={(e) => update("maxStudents", parseInt(e.target.value) || 50)} className={inputCls} />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div>
                      <label className={labelCls}>Course Duration *</label>
                      <p className="text-[10px] text-slate-400 mb-2">This structures weekly resources, assignments, and discussions</p>
                      <div className="grid grid-cols-4 gap-2">
                        {weekOptions.map((w) => (
                          <button key={w} type="button" onClick={() => update("durationWeeks", w)}
                            className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${form.durationWeeks === w ? "bg-green-500 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-green-300"}`}>
                            {w} weeks
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Start Date</label>
                      <input type="date" value={form.startDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => update("startDate", e.target.value)} className={inputCls} />
                      <p className="text-[10px] text-slate-400 mt-1">Week 1 begins on this date</p>
                    </div>
                    {form.startDate && form.durationWeeks > 0 && (
                      <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-3">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                          {form.durationWeeks} weeks: {new Date(form.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {new Date(new Date(form.startDate).getTime() + (form.durationWeeks * 7 * 24 * 60 * 60 * 1000)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={labelCls}>Description</label>
                        <button type="button" onClick={handleGenerateDescription} disabled={aiLoading || !form.name.trim()} className="flex items-center gap-1 text-[10px] font-semibold text-green-600 hover:text-green-700 disabled:opacity-40 transition-colors">
                          {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                          {aiLoading ? "Generating..." : "Generate with AI"}
                        </button>
                      </div>
                      <textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Optional description..." rows={3} className={inputCls + " resize-none"} />
                    </div>
                    <div>
                      <label className={labelCls}>Prerequisites (comma-separated)</label>
                      <input value={form.prerequisites} onChange={(e) => update("prerequisites", e.target.value)} placeholder="e.g. CS 100, MATH 201" className={inputCls} />
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={labelCls}>Syllabus</label>
                        <button type="button" onClick={handleGenerateSyllabus} disabled={aiSyllabusLoading || !form.name.trim()} className="flex items-center gap-1 text-[10px] font-semibold text-green-600 hover:text-green-700 disabled:opacity-40 transition-colors">
                          {aiSyllabusLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                          {aiSyllabusLoading ? "Generating..." : "Generate with AI"}
                        </button>
                      </div>
                      <textarea value={form.syllabus} onChange={(e) => update("syllabus", e.target.value)} placeholder="Course syllabus..." rows={8} className={inputCls + " resize-none"} />
                    </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="rounded-xl border border-green-200 bg-green-50/60 p-5 dark:border-green-900 dark:bg-green-950/20">
                      <p className="text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-300 mb-3">Review & Create</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-slate-400 w-28">Name</span><span className="text-sm font-semibold text-slate-900 dark:text-white">{form.name || "Not set"}</span></div>
                        {form.subject && <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-slate-400 w-28">Subject</span><span className="text-sm text-slate-700 dark:text-slate-300">{form.subject}</span></div>}
                        {form.semester && <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-slate-400 w-28">Semester</span><span className="text-sm text-slate-700 dark:text-slate-300">{form.semester}</span></div>}
                        <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-slate-400 w-28">Level</span><span className="text-sm text-slate-700 dark:text-slate-300 capitalize">{form.academicLevel}</span></div>
                        <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-slate-400 w-28">Grading</span><span className="text-sm text-slate-700 dark:text-slate-300 capitalize">{form.gradingScheme}</span></div>
                        <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-slate-400 w-28">Duration</span><span className="text-sm text-slate-700 dark:text-slate-300">{form.durationWeeks} weeks</span></div>
                        {form.startDate && <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-slate-400 w-28">Start Date</span><span className="text-sm text-slate-700 dark:text-slate-300">{new Date(form.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span></div>}
                        <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-slate-400 w-28">Max Students</span><span className="text-sm text-slate-700 dark:text-slate-300">{form.maxStudents}</span></div>
                      </div>
                      {form.description && <div className="mt-3 pt-3 border-t border-green-200/50 dark:border-green-900/50"><p className="text-[10px] font-bold text-slate-400 mb-1">Description</p><p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">{form.description}</p></div>}
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 disabled:opacity-0 transition-colors">
                    <ChevronLeft size={15} /> Back
                  </button>
                  {step < CREATOR_STEPS.length - 1 ? (
                    <button type="button" onClick={() => setStep((current) => current + 1)}
                      disabled={(step === 0 && !form.name.trim())}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-green-500/20 hover:shadow-green-500/30 active:scale-[0.98]">
                      Continue <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button onClick={handleCreate} disabled={loading || !form.name.trim()}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-green-500/20 hover:shadow-green-500/30 active:scale-[0.98]">
                      {loading ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : "Create Classroom"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClassroomCard({ classroom, role, onClick, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const isOverdue = classroom.dueAssignments > 0;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm("Delete this classroom? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await apiClient.delete(`/api/classrooms/${classroom.id}`);
      const data = await res.json();
      if (data.success) { toast.success("Classroom deleted"); onDelete(classroom.id); }
      else { toast.error(data.error || "Failed to delete"); }
    } catch { toast.error("Failed to delete classroom"); } finally { setDeleting(false); }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}
      className="text-left w-full rounded-xl border p-4 transition-all border-slate-200 bg-white hover:border-green-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-400/30 cursor-pointer"
    >
      {/* Top row: icon + name + delete */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <GraduationCap size={16} className="text-green-600 dark:text-green-400 shrink-0" />
          <span className="text-[13px] font-semibold text-slate-800 dark:text-white truncate">{classroom.name}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {classroom.semester && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 uppercase tracking-wider">
              {classroom.semester}
            </span>
          )}
          {role === "instructor" && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
        {classroom.description || classroom.subject || "No description yet."}
      </p>

      {/* Stats row */}
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        {role === "instructor" && (
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Users className="w-3 h-3" />
            <span className="font-semibold text-slate-600 dark:text-slate-300">{classroom.studentCount}</span> students
          </span>
        )}
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <ClipboardList className="w-3 h-3" />
          <span className="font-semibold text-slate-600 dark:text-slate-300">{classroom.assignmentCount}</span> assignments
        </span>
        {role !== "instructor" && (
          <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? "text-amber-500" : "text-slate-400"}`}>
            <Clock className="w-3 h-3" />
            <span className="font-semibold">{classroom.dueAssignments || 0}</span> due soon
          </span>
        )}
        {classroom.durationWeeks > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Calendar className="w-3 h-3" />
            <span className="font-semibold text-slate-600 dark:text-slate-300">{classroom.durationWeeks}w</span>
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          {new Date(classroom.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <span className="text-[11px] font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
          Open <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </motion.div>
  );
}

export default function ClassroomDashboard({ setHideDashboardNav, sidebarCollapsed, setSidebarCollapsed }) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const setSidebarCollapsedRef = useRef(setSidebarCollapsed);
  setSidebarCollapsedRef.current = setSidebarCollapsed;
  const [joining, setJoining] = useState(false);
  const isInstructor = user?.role === "instructor" || user?.role === "admin";

  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "creator" && isInstructor) {
      setShowCreate(true);
    } else if (!view) {
      setShowCreate(false);
    }
  }, [searchParams, isInstructor]);

  const upcomingDeadlines = !isInstructor
    ? classrooms.flatMap((c) => (c.assignments || []).map((a) => ({ ...a, classroomName: c.name, classroomId: c.id })))
        .filter((a) => a.dueDate && new Date(a.dueDate) > new Date() && a.myProgress?.status !== "completed")
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 3)
    : [];

  const handleJoinClassroom = async () => {
    if (!joinCode.trim()) { toast.error("Please enter an invite code"); return; }
    setJoining(true);
    try {
      const res = await apiClient.post("/api/classrooms/join", { inviteCode: joinCode.trim() });
      const data = await res.json();
      if (data.success) { toast.success(`Joined ${data.classroom.name}!`); setJoinCode(""); setShowJoin(false); fetchClassrooms(); }
      else { toast.error(data.error || "Invalid invite code"); }
    } catch { toast.error("Failed to join classroom"); } finally { setJoining(false); }
  };

  const fetchClassrooms = useCallback(async () => {
    setLoading(true);
    try { const res = await apiClient.get("/api/classrooms"); const data = await res.json(); if (data.success) setClassrooms(data.classrooms); } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClassrooms(); }, [fetchClassrooms]);

  useEffect(() => {
    const classroomId = searchParams?.get("classroom");
    if (!classroomId) return;
    // Already restored
    if (selectedClassroom?.id === classroomId) return;

    const tryRestore = async () => {
      // Try from already-loaded list first
      if (classrooms.length > 0) {
        const found = classrooms.find((c) => c.id === classroomId);
        if (found) { setSelectedClassroom(found); return; }
      }
      // Otherwise fetch fresh
      try {
        const res = await apiClient.get("/api/classrooms");
        const data = await res.json();
        if (data.success) {
          setClassrooms(data.classrooms);
          const found = (data.classrooms || []).find((c) => c.id === classroomId);
          if (found) setSelectedClassroom(found);
        }
      } catch {}
    };
    tryRestore();
  // Re-run when classrooms load so a refresh that fetches classrooms late still restores
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, classrooms.length]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCodeParam = params.get("join");
    if (joinCodeParam && !isInstructor) { setJoinCode(joinCodeParam.toUpperCase()); setShowJoin(true); }
  }, [isInstructor]);

  const handleDeleteClassroom = (id) => { setClassrooms((prev) => prev.filter((c) => c.id !== id)); };

  const openCreate = () => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", "creator");
    router.push(`/dashboard?${params.toString()}`);
    setShowCreate(true);
  };

  const closeCreate = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("view");
    router.replace(`/dashboard?${params.toString()}`);
    setShowCreate(false);
  };

  useEffect(() => {
    if (setHideDashboardNav) {
      const entering = !!(selectedClassroom || showCreate || showJoin);
      setHideDashboardNav(entering);
    }
  }, [selectedClassroom, showCreate, showJoin, setHideDashboardNav]);

  useEffect(() => {
    return () => {
      if (setHideDashboardNav) setHideDashboardNav(false);
    };
  }, []);

  if (selectedClassroom) {
    return (
      <ClassroomDetail
        classroom={selectedClassroom}
        onBack={() => {
          setSelectedClassroom(null);
          router.replace("/dashboard?tab=classrooms");
        }}
        user={user}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        searchParams={searchParams}
        router={router}
      />
    );
  }

  if (showCreate) {
    return <CreateClassroomForm onClose={closeCreate} onCreated={(c) => { setClassrooms([c, ...classrooms]); closeCreate(); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{isInstructor ? "My Classrooms" : "My Classes"}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{isInstructor ? "Manage your classes and track student progress" : "View assignments and track your progress"}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isInstructor && <button onClick={() => setShowJoin(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"><UserPlus className="w-3.5 h-3.5" /> Join</button>}
          {isInstructor && <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"><Plus className="w-3.5 h-3.5" /> New Classroom</button>}
        </div>
      </div>

      {!isInstructor && upcomingDeadlines.length > 0 && !loading && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" /><span className="text-xs font-bold text-amber-700 dark:text-amber-400">Upcoming Deadlines</span></div>
          <div className="space-y-1.5">{upcomingDeadlines.map((d) => { const hoursLeft = (new Date(d.dueDate) - new Date()) / (1000 * 60 * 60); const urgent = hoursLeft < 24; return (
            <button key={d.id} onClick={() => { const cls = classrooms.find((c) => c.id === d.classroomId); if (cls) { setSelectedClassroom(cls); router.push(`/dashboard?tab=classrooms&classroom=${cls.id}`); } }} className="flex items-center gap-2 w-full text-left group">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urgent ? "bg-red-400 animate-pulse" : "bg-amber-400"}`} /><span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium truncate flex-1 group-hover:underline">{d.title}</span><span className="text-[10px] text-amber-600 dark:text-amber-500 flex-shrink-0">{urgent ? `${Math.round(hoursLeft)}h` : `${Math.round(hoursLeft / 24)}d`}</span>
            </button>
          );})}</div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">{[1, 2, 3].map((i) => <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse"><div className="flex items-start justify-between mb-3"><div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700" /><div className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700" /></div><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2" /><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3" /><div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800"><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-16" /><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-16" /></div></div>)}</div>
      ) : classrooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4"><GraduationCap className="w-8 h-8 text-green-500" /></div>
          <h3 className="text-lg font-semibold text-foreground mb-1">{isInstructor ? "No classrooms yet" : "No classes yet"}</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-4">{isInstructor ? "Create your first classroom and invite students to start teaching" : "Ask your instructor for an invite code to join a classroom"}</p>
          {isInstructor ? (
            <button onClick={openCreate} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">Create Classroom</button>
          ) : (
            <button onClick={() => setShowJoin(true)} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-green-500 text-white hover:bg-green-600">Join Classroom</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {classrooms.map((classroom) => (
            <ClassroomCard key={classroom.id} classroom={classroom} role={isInstructor ? "instructor" : "student"} onClick={() => { setSelectedClassroom(classroom); router.push(`/dashboard?tab=classrooms&classroom=${classroom.id}`); }} onDelete={handleDeleteClassroom} />
          ))}
        </div>
      )}

      {/* Join Modal */}
      <AnimatePresence>
        {showJoin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowJoin(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 8 }} transition={{ duration: 0.15, ease: "easeOut" }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 w-full max-w-[300px] shadow-2xl">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0"><UserPlus className="w-4 h-4 text-green-500" /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Join Class</h3>
                  <p className="text-[10px] text-slate-400">Enter invite code</p>
                </div>
              </div>
              <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="XXXX" maxLength={8} autoFocus className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono text-base font-bold text-slate-900 dark:text-white tracking-[0.25em] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/30 uppercase mb-3" />
              <div className="flex items-center gap-2">
                <button onClick={() => setShowJoin(false)} className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button onClick={handleJoinClassroom} disabled={joining || joinCode.trim().length < 4} className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5">{joining ? <Loader2 className="w-3 h-3 animate-spin" /> : null} {joining ? "Joining..." : "Join"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
