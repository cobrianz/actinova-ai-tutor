"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthProvider";
import { apiClient } from "@/lib/csrfClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Copy, Check, ChevronRight, Calendar, BookOpen,
  Clock, BarChart2, Trash2, Settings, ArrowLeft, ArrowRight, X, Search,
  AlertCircle, CheckCircle2, TrendingUp, UserPlus, Mail, Link2,
  GraduationCap, ListOrdered, Timer, FileText, Edit3, Eye,
  Play, Circle, Sparkles, Loader2, MessageSquare, Pin, Unlock,
  StickyNote, Upload, Hash, ExternalLink, Video, Code, Presentation,
  Megaphone, ChevronDown, ChevronUp, Send, Tag, Star, Archive,
  AlertTriangle, Bookmark, MoreVertical, PanelLeftOpen, PanelLeftClose,
  Bell, ClipboardList, BookMarked, Layers, Info, Globe, ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

const ASSIGNMENT_TYPES = [
  { value: "course", label: "Course", icon: BookOpen },
  { value: "flashcards", label: "Flashcards", icon: FileText },
  { value: "quiz", label: "Quiz", icon: CheckCircle2 },
  { value: "report", label: "Report", icon: Edit3 },
  { value: "essay", label: "Essay", icon: Edit3 },
  { value: "project", label: "Project", icon: Layers },
  { value: "discussion", label: "Discussion", icon: MessageSquare },
  { value: "lab", label: "Lab", icon: Code },
  { value: "presentation", label: "Presentation", icon: Presentation },
  { value: "custom", label: "Custom", icon: Settings },
];

const MATERIAL_TYPES = [
  { value: "document", label: "Document", icon: FileText },
  { value: "video", label: "Video", icon: Video },
  { value: "link", label: "Link", icon: ExternalLink },
  { value: "slides", label: "Slides", icon: Presentation },
  { value: "code", label: "Code", icon: Code },
  { value: "other", label: "Other", icon: Layers },
];

const TYPE_CONFIG = {
  course: { icon: BookOpen, color: "bg-blue-500/10 text-blue-600" },
  flashcards: { icon: FileText, color: "bg-purple-500/10 text-purple-600" },
  quiz: { icon: CheckCircle2, color: "bg-amber-500/10 text-amber-600" },
  report: { icon: Edit3, color: "bg-rose-500/10 text-rose-600" },
  essay: { icon: Edit3, color: "bg-pink-500/10 text-pink-600" },
  project: { icon: Layers, color: "bg-indigo-500/10 text-indigo-600" },
  discussion: { icon: MessageSquare, color: "bg-teal-500/10 text-teal-600" },
  lab: { icon: Code, color: "bg-orange-500/10 text-orange-600" },
  presentation: { icon: Presentation, color: "bg-cyan-500/10 text-cyan-600" },
  custom: { icon: Settings, color: "bg-slate-500/10 text-slate-600" },
};

const MATERIAL_ICON_MAP = {
  document: FileText, video: Video, link: ExternalLink,
  slides: Presentation, code: Code, other: Layers,
};

const CREATOR_STEPS = ["Basic Info", "Course Settings", "Duration", "Content", "Syllabus", "Review"];

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

function InviteModal({ classroom, onClose }) {
  const [copied, setCopied] = useState(false);
  const inviteLink = typeof window !== "undefined"
    ? `${window.location.origin}/dashboard?tab=classrooms&join=${classroom.inviteCode}` : "";
  const handleCopy = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Invite Students</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Invite Code</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-lg font-bold text-slate-900 dark:text-white tracking-wider text-center">{classroom.inviteCode}</div>
              <button onClick={() => handleCopy(classroom.inviteCode)} className="p-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Invite Link</label>
            <div className="flex items-center gap-2">
              <input readOnly value={inviteLink} className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-400 truncate" />
              <button onClick={() => handleCopy(inviteLink)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Link2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center">Share this code or link with students to join <strong>{classroom.name}</strong></p>
        </div>
      </motion.div>
    </div>
  );
}

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
                      <input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className={inputCls} />
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

function CreateAssignmentModal({ classroomId, classroomName, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "", description: "", instructions: "", type: "course", dueDate: "", maxScore: 100,
    courseId: "", category: "", availableFrom: "", availableUntil: "", passingScore: 60,
    weight: 0, maxAttempts: 1, rubric: [],
  });
  const [courses, setCourses] = useState([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [aiInstrLoading, setAiInstrLoading] = useState(false);
  const [aiRubricLoading, setAiRubricLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try { const res = await apiClient.get("/api/library/courses"); const data = await res.json(); if (data.courses) setCourses(data.courses); } catch {} finally { setLoadingCourses(false); }
    };
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((c) => c.title?.toLowerCase().includes(courseSearch.toLowerCase()));

  const handleGenerateInstructions = async () => {
    if (!form.title.trim()) { toast.error("Enter assignment title first"); return; }
    setAiInstrLoading(true);
    try {
      const res = await apiClient.post("/api/classrooms/ai-generate", { task: "assignment_instructions", assignmentTitle: form.title, classroomName: classroomName || "", name: form.type, content: form.description });
      const data = await res.json();
      if (data.result) { setForm((prev) => ({ ...prev, instructions: data.result })); toast.success("Instructions generated!"); }
      else { toast.error("Failed to generate instructions"); }
    } catch { toast.error("Failed to generate instructions"); } finally { setAiInstrLoading(false); }
  };

  const handleGenerateRubric = async () => {
    if (!form.title.trim()) { toast.error("Enter assignment title first"); return; }
    setAiRubricLoading(true);
    try {
      const res = await apiClient.post("/api/classrooms/ai-generate", { task: "rubric", assignmentTitle: form.title, classroomName: classroomName || "" });
      const data = await res.json();
      if (data.result) { setForm((prev) => ({ ...prev, rubric: data.result })); toast.success("Rubric generated!"); }
      else { toast.error("Failed to generate rubric"); }
    } catch { toast.error("Failed to generate rubric"); } finally { setAiRubricLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("Assignment title is required"); return; }
    setLoading(true);
    try {
      const payload = { ...form, courseId: form.courseId || undefined, rubric: form.rubric.length > 0 ? form.rubric : undefined };
      const res = await apiClient.post(`/api/classrooms/${classroomId}/assignments`, payload);
      const data = await res.json();
      if (data.success) { toast.success("Assignment created!"); onCreated(data.assignment); onClose(); }
      else { toast.error(data.error || "Failed to create assignment"); }
    } catch { toast.error("Failed to create assignment"); } finally { setLoading(false); }
  };

  const inputCls = "w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30";
  const labelCls = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">New Assignment</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className={labelCls}>Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chapter 1 Review" className={inputCls} /></div>
          <div>
            <label className={labelCls}>Type</label>
            <div className="grid grid-cols-5 gap-1.5">
              {ASSIGNMENT_TYPES.map(({ value, label, icon: Icon }) => (
                <button key={value} onClick={() => setForm({ ...form, type: value })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium transition-all ${form.type === value ? "bg-green-500/10 text-green-600 border border-green-500/30" : "bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Category</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Homework" className={inputCls} /></div>
            <div><label className={labelCls}>Max Score</label><input type="number" min={0} value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: parseInt(e.target.value) || 100 })} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Passing Score</label><input type="number" min={0} value={form.passingScore} onChange={(e) => setForm({ ...form, passingScore: parseInt(e.target.value) || 60 })} className={inputCls} /></div>
            <div><label className={labelCls}>Weight (%)</label><input type="number" min={0} max={100} value={form.weight} onChange={(e) => setForm({ ...form, weight: parseInt(e.target.value) || 0 })} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Available From</label><input type="datetime-local" value={form.availableFrom} onChange={(e) => setForm({ ...form, availableFrom: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Available Until</label><input type="datetime-local" value={form.availableUntil} onChange={(e) => setForm({ ...form, availableUntil: e.target.value })} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Due Date</label><input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Max Attempts</label><input type="number" min={1} max={100} value={form.maxAttempts} onChange={(e) => setForm({ ...form, maxAttempts: parseInt(e.target.value) || 1 })} className={inputCls} /></div>
          <div><label className={labelCls}>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." rows={2} className={inputCls + " resize-none"} /></div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls}>Instructions</label>
              <button type="button" onClick={handleGenerateInstructions} disabled={aiInstrLoading || !form.title.trim()} className="flex items-center gap-1 text-[10px] font-semibold text-green-600 hover:text-green-700 disabled:opacity-40 transition-colors">
                {aiInstrLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {aiInstrLoading ? "Generating..." : "Generate with AI"}
              </button>
            </div>
            <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="Detailed assignment instructions..." rows={4} className={inputCls + " resize-none"} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls}>Rubric</label>
              <button type="button" onClick={handleGenerateRubric} disabled={aiRubricLoading || !form.title.trim()} className="flex items-center gap-1 text-[10px] font-semibold text-green-600 hover:text-green-700 disabled:opacity-40 transition-colors">
                {aiRubricLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {aiRubricLoading ? "Generating..." : "Generate Rubric with AI"}
              </button>
            </div>
            {form.rubric.length > 0 ? (
              <div className="space-y-2">
                {form.rubric.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex-1 min-w-0"><p className="text-xs font-bold text-slate-900 dark:text-white">{r.criterion}</p><p className="text-[10px] text-slate-500">{r.description}</p></div>
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded">{r.maxPoints}pts</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-[11px] text-slate-400 italic">No rubric yet. Click the AI button to generate one.</p>}
          </div>
          <div>
            <label className={labelCls}>Link Course (optional)</label>
            {loadingCourses ? <div className="h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg animate-pulse" /> : courses.length > 0 ? (
              <div className="space-y-1.5">
                <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} placeholder="Search your courses..." className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30" /></div>
                <div className="max-h-32 overflow-y-auto space-y-1 scrollbar-hide">
                  {filteredCourses.map((course) => (
                    <button key={course._id || course.id} onClick={() => setForm({ ...form, courseId: form.courseId === (course._id || course.id) ? "" : (course._id || course.id) })}
                      className={`flex items-center gap-2 w-full p-2 rounded-lg text-left transition-all ${form.courseId === (course._id || course.id) ? "bg-green-50 dark:bg-green-500/10 border border-green-300 dark:border-green-600" : "bg-slate-50 dark:bg-slate-800 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /><span className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1">{course.title}</span>
                      {form.courseId === (course._id || course.id) && <Check className="w-3.5 h-3.5 text-green-500" />}
                    </button>
                  ))}
                  {filteredCourses.length === 0 && <p className="text-[10px] text-slate-400 text-center py-2">No courses found</p>}
                </div>
              </div>
            ) : <p className="text-[11px] text-slate-400">No courses in library yet</p>}
          </div>
          <button onClick={handleCreate} disabled={loading || !form.title.trim()} className="w-full py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors">
            {loading ? "Creating..." : "Create Assignment"}
          </button>
        </div>
      </motion.div>
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
    <motion.div whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }} onClick={onClick}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:border-green-300 dark:hover:border-green-600 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-4.5 h-4.5 text-green-600" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{classroom.name}</h4>
        </div>
        <button onClick={handleDelete} disabled={deleting} className="p-1 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-50">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {classroom.subject && <p className="text-[11px] text-slate-500 mb-2 line-clamp-1">{classroom.subject}</p>}
      <div className="flex items-center gap-3 flex-wrap mb-3">
        {role === "instructor" && (
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /><Users className="w-3 h-3" /><span className="font-medium">{classroom.studentCount}</span> Students
          </span>
        )}
        <span className="flex items-center gap-1 text-[10px] text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" /><BookOpen className="w-3 h-3" /><span className="font-medium">{classroom.assignmentCount}</span> Assignments
          <span className="ml-0.5 px-1.5 py-0.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[9px] font-bold rounded-full uppercase tracking-wider">{classroom.semester || "Active"}</span>
        </span>
        {role !== "instructor" && (
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className={`w-1.5 h-1.5 rounded-full ${isOverdue ? "bg-amber-400" : "bg-green-400"}`} /><Clock className={`w-3 h-3 ${isOverdue ? "text-amber-500" : ""}`} /><span className="font-medium">{classroom.dueAssignments || 0}</span> Due Soon
          </span>
        )}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400">{new Date(classroom.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          {classroom.durationWeeks > 0 && <span className="text-[10px] text-slate-400">{classroom.durationWeeks} weeks</span>}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="text-green-600 dark:text-green-400 text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all px-2 py-1 rounded-lg hover:bg-green-50 dark:hover:bg-green-500/10">
          Open <ArrowRight className="w-3 h-3 -rotate-45" />
        </button>
      </div>
    </motion.div>
  );
}

function ClassroomMobileNav({ activeTab, setActiveTab, isInstructor }) {
  const tabs = [
    { id: "assignments", label: "Tasks", icon: ClipboardList },
    { id: "discussions", label: "Discuss", icon: MessageSquare },
    { id: "notes", label: "Notes", icon: StickyNote },
    { id: "materials", label: "Materials", icon: Layers },
    ...(isInstructor ? [{ id: "settings", label: "Settings", icon: Settings }] : []),
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[90] border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-2 py-2">
      <div className={`grid gap-1 ${tabs.length <= 4 ? "grid-cols-4" : "grid-cols-5"}`}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors bg-transparent ${
              activeTab === id ? "text-green-600 dark:text-green-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}>
            <Icon className={`w-4 h-4 ${activeTab === id ? "stroke-[2.5]" : "stroke-[1.5]"}`} fill={activeTab === id ? "currentColor" : "none"} />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RefreshIcon() {
  return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
}

function ClassroomDetail({ classroom, onBack, user }) {
  const [activeTab, setActiveTab] = useState("assignments");
  const [assignments, setAssignments] = useState(classroom.assignments || []);
  const [students, setStudents] = useState([]);
  const [studentStats, setStudentStats] = useState({ totalStudents: 0, activeStudents: 0, avgCompletion: 0 });
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isInstructor = classroom.isInstructor;

  const [discussions, setDiscussions] = useState([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [discussionPosts, setDiscussionPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newDiscTitle, setNewDiscTitle] = useState("");
  const [newDiscDesc, setNewDiscDesc] = useState("");
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [discAiLoading, setDiscAiLoading] = useState(false);

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteTags, setNewNoteTags] = useState("");
  const [noteAiLoading, setNoteAiLoading] = useState(false);
  const [noteSummaryLoading, setNoteSummaryLoading] = useState(null);

  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [showNewMaterial, setShowNewMaterial] = useState(false);
  const [newMat, setNewMat] = useState({ title: "", description: "", type: "document", url: "", weekNumber: 0, category: "", isRequired: false });

  const [announcements, setAnnouncements] = useState(classroom.announcements || []);
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnContent, setNewAnnContent] = useState("");

  const [settingsForm, setSettingsForm] = useState({
    name: classroom.name || "", subject: classroom.subject || "", description: classroom.description || "",
    semester: classroom.semester || "", academicLevel: classroom.academicLevel || "undergraduate",
    gradingScheme: classroom.gradingScheme || "percentage", syllabus: classroom.syllabus || "",
    schedule: classroom.schedule || { days: [], startTime: "", endTime: "", location: "" },
    prerequisites: classroom.prerequisites || [],
    settings: classroom.settings || {
      allowStudentPosts: true, requireApproval: false, showGradesToStudents: true,
      allowLateSubmissions: true, latePenaltyPercent: 10, maxFileSizeMB: 50,
      enableDiscussions: true, enableNotes: true, enableMaterials: true,
    },
    newPrereq: "",
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  const fetchDiscussions = useCallback(async () => { setDiscussionsLoading(true); try { const res = await apiClient.get(`/api/classrooms/${classroom.id}/discussions`); const data = await res.json(); if (data.success) setDiscussions(data.discussions); } catch {} finally { setDiscussionsLoading(false); } }, [classroom.id]);
  const fetchPosts = useCallback(async (discussionId) => { setPostsLoading(true); try { const res = await apiClient.get(`/api/classrooms/${classroom.id}/discussions/${discussionId}/posts`); const data = await res.json(); if (data.success) setDiscussionPosts(data.posts); } catch {} finally { setPostsLoading(false); } }, [classroom.id]);
  const fetchNotes = useCallback(async () => { setNotesLoading(true); try { const res = await apiClient.get(`/api/classrooms/${classroom.id}/notes`); const data = await res.json(); if (data.success) setNotes(data.notes); } catch {} finally { setNotesLoading(false); } }, [classroom.id]);
  const fetchMaterials = useCallback(async () => { setMaterialsLoading(true); try { const res = await apiClient.get(`/api/classrooms/${classroom.id}/materials`); const data = await res.json(); if (data.success) setMaterials(data.materials); } catch {} finally { setMaterialsLoading(false); } }, [classroom.id]);
  const fetchStudents = useCallback(async () => { if (!isInstructor) return; setLoading(true); try { const res = await apiClient.get(`/api/classrooms/${classroom.id}/students`); const data = await res.json(); if (data.success) { setStudents(data.students); setStudentStats(data.stats); } } catch {} finally { setLoading(false); } }, [classroom.id, isInstructor]);

  useEffect(() => {
    if (activeTab === "discussions") fetchDiscussions();
    if (activeTab === "notes") fetchNotes();
    if (activeTab === "materials") fetchMaterials();
    if (activeTab === "students" && isInstructor) fetchStudents();
  }, [activeTab, fetchDiscussions, fetchNotes, fetchMaterials, fetchStudents, isInstructor]);

  useEffect(() => { if (isInstructor) fetchStudents(); }, [isInstructor, fetchStudents]);

  useEffect(() => { if (selectedDiscussion) fetchPosts(selectedDiscussion._id || selectedDiscussion.id); }, [selectedDiscussion, fetchPosts]);

  const handleMarkComplete = async (assignmentId) => {
    try { const res = await apiClient.put(`/api/classrooms/${classroom.id}/progress`, { assignmentId, status: "completed", progress: 100 }); const data = await res.json(); if (data.success) { setAssignments((prev) => prev.map((a) => a.id === assignmentId ? { ...a, myProgress: { ...a.myProgress, status: "completed", progress: 100, completedAt: new Date().toISOString() } } : a)); toast.success("Assignment marked as complete!"); } else { toast.error(data.error || "Failed"); } } catch { toast.error("Failed to update progress"); }
  };
  const handleStartAssignment = async (assignmentId) => {
    try { const res = await apiClient.put(`/api/classrooms/${classroom.id}/progress`, { assignmentId, status: "in_progress", progress: 10 }); const data = await res.json(); if (data.success) { setAssignments((prev) => prev.map((a) => a.id === assignmentId ? { ...a, myProgress: { ...a.myProgress, status: "in_progress", progress: 10 } } : a)); toast.success("Assignment started!"); } } catch { toast.error("Failed to start assignment"); }
  };
  const handleCreateDiscussion = async () => {
    if (!newDiscTitle.trim()) { toast.error("Title required"); return; }
    try { const res = await apiClient.post(`/api/classrooms/${classroom.id}/discussions`, { title: newDiscTitle, description: newDiscDesc }); const data = await res.json(); if (data.success) { setDiscussions([data.discussion, ...discussions]); setNewDiscTitle(""); setNewDiscDesc(""); setShowNewDiscussion(false); toast.success("Discussion created!"); } else { toast.error(data.error || "Failed"); } } catch { toast.error("Failed to create discussion"); }
  };
  const handleCreatePost = async () => {
    if (!replyContent.trim() || !selectedDiscussion) return;
    try { const res = await apiClient.post(`/api/classrooms/${classroom.id}/discussions/${selectedDiscussion._id || selectedDiscussion.id}/posts`, { content: replyContent, parentPostId: replyingTo || undefined }); const data = await res.json(); if (data.success) { setDiscussionPosts([...discussionPosts, data.post]); setReplyContent(""); setReplyingTo(null); setDiscussions((prev) => prev.map((d) => (d._id || d.id) === (selectedDiscussion._id || selectedDiscussion.id) ? { ...d, postCount: (d.postCount || 0) + 1, lastActivityAt: new Date().toISOString() } : d)); } else { toast.error(data.error || "Failed"); } } catch { toast.error("Failed to post"); }
  };
  const handleGenerateDiscussionPrompt = async () => {
    setDiscAiLoading(true);
    try { const res = await apiClient.post("/api/classrooms/ai-generate", { task: "discussion_prompt", name: newDiscTitle || "general topic", subject: classroom.subject, classroomName: classroom.name }); const data = await res.json(); if (data.result) { setNewDiscTitle(newDiscTitle || "Discussion"); setNewDiscDesc(data.result); toast.success("Prompt generated!"); } } catch { toast.error("Failed to generate prompt"); } finally { setDiscAiLoading(false); }
  };
  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) { toast.error("Title required"); return; }
    try { const res = await apiClient.post(`/api/classrooms/${classroom.id}/notes`, { title: newNoteTitle, content: newNoteContent, tags: newNoteTags.split(",").map((t) => t.trim()).filter(Boolean) }); const data = await res.json(); if (data.success) { setNotes([data.note, ...notes]); setNewNoteTitle(""); setNewNoteContent(""); setNewNoteTags(""); setShowNewNote(false); toast.success("Note created!"); } } catch { toast.error("Failed to create note"); }
  };
  const handleGenerateNote = async () => {
    if (!newNoteTitle.trim()) { toast.error("Enter a topic first"); return; }
    setNoteAiLoading(true);
    try { const res = await apiClient.post("/api/classrooms/ai-generate", { task: "generate_note", name: newNoteTitle, subject: classroom.subject, classroomName: classroom.name }); const data = await res.json(); if (data.result) { setNewNoteContent(data.result); toast.success("Note generated!"); } } catch { toast.error("Failed to generate note"); } finally { setNoteAiLoading(false); }
  };
  const handleSummarizeNote = async (note) => {
    setNoteSummaryLoading(note._id || note.id);
    try { const res = await apiClient.post("/api/classrooms/ai-generate", { task: "note_summary", content: note.content, classroomName: classroom.name }); const data = await res.json(); if (data.result) { setNotes((prev) => prev.map((n) => (n._id || n.id) === (note._id || note.id) ? { ...n, content: data.result } : n)); toast.success("Note summarized!"); } } catch { toast.error("Failed to summarize"); } finally { setNoteSummaryLoading(null); }
  };
  const handleCreateMaterial = async () => {
    if (!newMat.title.trim()) { toast.error("Title required"); return; }
    try { const res = await apiClient.post(`/api/classrooms/${classroom.id}/materials`, newMat); const data = await res.json(); if (data.success) { setMaterials([data.material, ...materials]); setNewMat({ title: "", description: "", type: "document", url: "", weekNumber: 0, category: "", isRequired: false }); setShowNewMaterial(false); toast.success("Material added!"); } } catch { toast.error("Failed to add material"); }
  };
  const handlePostAnnouncement = async () => {
    if (!newAnnTitle.trim() || !newAnnContent.trim()) { toast.error("Title and content required"); return; }
    try { const res = await apiClient.post(`/api/classrooms/${classroom.id}/announcements`, { title: newAnnTitle, content: newAnnContent }); const data = await res.json(); if (data.success) { setAnnouncements([...announcements, data.announcement]); setNewAnnTitle(""); setNewAnnContent(""); setShowNewAnnouncement(false); toast.success("Announcement posted!"); } } catch { toast.error("Failed to post announcement"); }
  };
  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try { const payload = { name: settingsForm.name, subject: settingsForm.subject, description: settingsForm.description, semester: settingsForm.semester, academicLevel: settingsForm.academicLevel, gradingScheme: settingsForm.gradingScheme, syllabus: settingsForm.syllabus, schedule: settingsForm.schedule, prerequisites: settingsForm.prerequisites, settings: settingsForm.settings }; const res = await apiClient.patch(`/api/classrooms/${classroom.id}`, payload); const data = await res.json(); if (data.success) toast.success("Settings saved!"); else toast.error(data.error || "Failed to save"); } catch { toast.error("Failed to save settings"); } finally { setSettingsSaving(false); }
  };
  const handleDeleteClassroom = async () => {
    if (!confirm("Are you absolutely sure? This will archive the classroom and all its data.")) return;
    try { const res = await apiClient.delete(`/api/classrooms/${classroom.id}`); const data = await res.json(); if (data.success) { toast.success("Classroom archived"); onBack(); } } catch { toast.error("Failed to delete"); }
  };

  const getDueStatus = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date(); const due = new Date(dueDate); const hoursLeft = (due - now) / (1000 * 60 * 60);
    if (hoursLeft < 0) return { label: "Overdue", color: "text-red-500 bg-red-50 dark:bg-red-500/10" };
    if (hoursLeft < 24) return { label: `${Math.round(hoursLeft)}h left`, color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" };
    if (hoursLeft < 72) return { label: `${Math.round(hoursLeft / 24)}d left`, color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10" };
    return { label: `${Math.round(hoursLeft / 24)}d left`, color: "text-slate-500 bg-slate-50 dark:bg-slate-800" };
  };

  const getWeeks = () => {
    if (!classroom.startDate || !classroom.durationWeeks) return [];
    const start = new Date(classroom.startDate);
    const weeks = [];
    for (let i = 0; i < classroom.durationWeeks; i++) {
      const weekStart = new Date(start.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(start.getTime() + ((i + 1) * 7 * 24 * 60 * 60 * 1000) - 1);
      const weekAssignments = assignments.filter((a) => { if (!a.dueDate) return false; const due = new Date(a.dueDate); return due >= weekStart && due <= weekEnd; });
      const weekMaterials = materials.filter((m) => (m.weekNumber || 0) === i + 1);
      const weekDiscussions = discussions.filter((d) => { if (!d.createdAt) return false; const created = new Date(d.createdAt); return created >= weekStart && created <= weekEnd; });
      weeks.push({ number: i + 1, startDate: weekStart, endDate: weekEnd, assignments: weekAssignments, materials: weekMaterials, discussions: weekDiscussions });
    }
    return weeks;
  };

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const inputCls = "w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30";
  const labelCls = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block";
  const sectionCls = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4";
  const toggleCls = (on) => `relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"}`;
  const toggleDot = (on) => `inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${on ? "translate-x-4.5" : "translate-x-0.5"}`;

  const instructorTabs = [
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "assignments", label: "Assignments", icon: ClipboardList },
    { id: "discussions", label: "Discussions", icon: MessageSquare },
    { id: "notes", label: "Notes", icon: StickyNote },
    { id: "materials", label: "Materials", icon: Layers },
    { id: "students", label: "Students", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  const studentTabs = [
    { id: "assignments", label: "Assignments", icon: ClipboardList },
    { id: "discussions", label: "Discussions", icon: MessageSquare },
    { id: "notes", label: "Notes", icon: StickyNote },
    { id: "materials", label: "Materials", icon: Layers },
  ];
  const tabs = isInstructor ? instructorTabs : studentTabs;

  return (
    <div className="flex gap-4 min-h-[70vh] pb-16 lg:pb-0">
      {/* Sidebar - Desktop only */}
      <div className={`${sidebarCollapsed ? "w-14" : "w-52"} shrink-0 transition-all duration-300 hidden lg:block`}>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 h-[calc(100vh-64px)] sticky top-4 flex flex-col overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
            {!sidebarCollapsed && (
              <button onClick={onBack} className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors truncate">
                <ArrowLeft size={12} /> Back
              </button>
            )}
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto">
              {sidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>
          </div>
          {!sidebarCollapsed && (
            <div className="px-2 py-2 mb-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">{classroom.name}</h3>
              <p className="text-[10px] text-slate-500 truncate">{classroom.subject || "No subject"}</p>
            </div>
          )}
          <div className="space-y-0.5">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 w-full rounded-lg transition-all ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"} text-[11px] font-medium ${activeTab === id ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                <Icon size={sidebarCollapsed ? 16 : 14} className="flex-shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{label}</span>}
              </button>
            ))}
          </div>
          {!sidebarCollapsed && isInstructor && (
            <div className="border-t border-slate-100 dark:border-slate-800 mt-auto pt-2 space-y-1">
              <button onClick={() => setShowCreateAssignment(true)} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[11px] font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-950/40 transition-colors"><Plus size={14} /> Add Assignment</button>
              <button onClick={() => { setActiveTab("discussions"); setShowNewDiscussion(true); }} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[11px] font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"><Plus size={14} /> New Discussion</button>
              <button onClick={() => { setActiveTab("notes"); setShowNewNote(true); }} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[11px] font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"><Plus size={14} /> New Note</button>
              <button onClick={() => { setActiveTab("materials"); setShowNewMaterial(true); }} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[11px] font-medium text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"><Plus size={14} /> Add Material</button>
              <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[11px] font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><UserPlus size={14} /> Invite Students</button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <ClassroomMobileNav activeTab={activeTab} setActiveTab={setActiveTab} isInstructor={isInstructor} />

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {announcements.length > 0 && activeTab !== "settings" && (
          <div className="space-y-2">
            {announcements.slice(-3).reverse().map((ann, i) => (
              <div key={i} className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Megaphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{ann.title}</span>
                  {ann.createdAt && <span className="text-[10px] text-amber-600/60">{new Date(ann.createdAt).toLocaleDateString()}</span>}
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 ml-5">{ann.content}</p>
              </div>
            ))}
          </div>
        )}

        {isInstructor && (activeTab === "assignments" || activeTab === "schedule") && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Students", value: studentStats.totalStudents || classroom.studentCount, icon: Users, color: "text-blue-500" },
              { label: "Active", value: studentStats.activeStudents, icon: TrendingUp, color: "text-green-500" },
              { label: "Avg Progress", value: `${studentStats.avgCompletion || 0}%`, icon: BarChart2, color: "text-purple-500" },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1"><Icon className={`w-3.5 h-3.5 ${color}`} /><span className="text-[10px] font-medium text-slate-500 uppercase">{label}</span></div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "schedule" && isInstructor && (
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
        )}

        {activeTab === "assignments" && (
          <div className="space-y-3">
            {isInstructor && (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowCreateAssignment(true)} className="flex items-center gap-2 flex-1 p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 hover:border-green-400 hover:text-green-600 transition-colors"><Plus className="w-4 h-4" /> Add Assignment</button>
                <button onClick={() => setShowNewAnnouncement(!showNewAnnouncement)} className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-amber-200 dark:border-amber-500/30 rounded-xl text-sm text-amber-600 hover:border-amber-400 transition-colors"><Megaphone className="w-4 h-4" /> Announce</button>
              </div>
            )}
            {isInstructor && showNewAnnouncement && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={sectionCls}>
                <div><label className={labelCls}>Title</label><input value={newAnnTitle} onChange={(e) => setNewAnnTitle(e.target.value)} placeholder="Announcement title" className={inputCls} /></div>
                <div><label className={labelCls}>Content</label><textarea value={newAnnContent} onChange={(e) => setNewAnnContent(e.target.value)} placeholder="What do you want to announce?" rows={3} className={inputCls + " resize-none"} /></div>
                <div className="flex gap-2"><button onClick={handlePostAnnouncement} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors">Post</button><button onClick={() => setShowNewAnnouncement(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button></div>
              </motion.div>
            )}
            {assignments.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No assignments yet" description={isInstructor ? "Create your first assignment to get started" : "No assignments have been posted yet"} action={isInstructor ? "Create Assignment" : undefined} onAction={() => setShowCreateAssignment(true)} />
            ) : assignments.map((assignment) => {
              const due = getDueStatus(assignment.dueDate); const tc = TYPE_CONFIG[assignment.type] || TYPE_CONFIG.custom; const TypeIcon = tc.icon; const progress = assignment.myProgress;
              return (
                <motion.div key={assignment.id} whileHover={{ y: -1 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-green-300 dark:hover:border-green-600 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${tc.color} flex items-center justify-center flex-shrink-0`}><TypeIcon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{assignment.title}</h4>
                        {due && <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${due.color}`}>{due.label}</span>}
                        {assignment.weight > 0 && <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{assignment.weight}%</span>}
                      </div>
                      {assignment.description && <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">{assignment.description}</p>}
                      <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        <span className="capitalize">{assignment.type}</span>
                        {assignment.category && <span className="flex items-center gap-0.5"><Tag className="w-3 h-3" />{assignment.category}</span>}
                        {assignment.dueDate && <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{new Date(assignment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                        {progress && <span className="flex items-center gap-0.5"><span className={`w-1.5 h-1.5 rounded-full ${progress.status === "completed" ? "bg-green-400" : progress.status === "in_progress" ? "bg-amber-400" : "bg-slate-300"}`} />{progress.status === "completed" ? "Done" : progress.status === "in_progress" ? `${progress.progress}%` : "Not started"}</span>}
                      </div>
                    </div>
                    {!isInstructor ? (
                      <div className="flex-shrink-0 mt-1">
                        {progress?.status === "completed" ? <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-lg"><CheckCircle2 className="w-3 h-3" /> Done</span>
                          : progress?.status === "in_progress" ? <button onClick={(e) => { e.stopPropagation(); handleMarkComplete(assignment.id); }} className="flex items-center gap-1 text-[10px] font-semibold text-white bg-green-500 hover:bg-green-600 px-2 py-1 rounded-lg transition-colors"><Check className="w-3 h-3" /> Mark Complete</button>
                          : <button onClick={(e) => { e.stopPropagation(); handleStartAssignment(assignment.id); }} className="flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20 px-2 py-1 rounded-lg transition-colors"><Play className="w-3 h-3" /> Start</button>}
                      </div>
                    ) : <ArrowRight className="w-4 h-4 text-slate-300 -rotate-45 flex-shrink-0 mt-1" />}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {activeTab === "discussions" && (
          <div className="space-y-3">
            {selectedDiscussion ? (
              <div className="space-y-3">
                <button onClick={() => { setSelectedDiscussion(null); setDiscussionPosts([]); }} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-[11px] font-medium transition-colors"><ArrowLeft size={14} /> Back to Discussions</button>
                <div className={sectionCls}>
                  <div className="flex items-start justify-between">
                    <div><div className="flex items-center gap-2 mb-1">{selectedDiscussion.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}<h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedDiscussion.title}</h3></div>
                      {selectedDiscussion.description && <p className="text-xs text-slate-500 mt-1">{selectedDiscussion.description}</p>}</div>
                    {isInstructor && <div className="flex items-center gap-1">
                      <button onClick={async () => { try { await apiClient.patch(`/api/classrooms/${classroom.id}/discussions/${selectedDiscussion._id || selectedDiscussion.id}`, { isPinned: !selectedDiscussion.isPinned }); setSelectedDiscussion({ ...selectedDiscussion, isPinned: !selectedDiscussion.isPinned }); fetchDiscussions(); } catch {} }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors"><Pin className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { try { await apiClient.patch(`/api/classrooms/${classroom.id}/discussions/${selectedDiscussion._id || selectedDiscussion.id}`, { isClosed: !selectedDiscussion.isClosed }); setSelectedDiscussion({ ...selectedDiscussion, isClosed: !selectedDiscussion.isClosed }); } catch {} }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors">{selectedDiscussion.isClosed ? <Unlock className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}</button>
                    </div>}
                  </div>
                </div>
                {postsLoading ? <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" /><div className="flex-1 space-y-2"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" /><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-3/4" /></div></div></div>)}</div>
                  : <div className="space-y-2">{discussionPosts.map((post) => (
                    <div key={post._id || post.id} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 ${post.parentPostId ? "ml-8 border-l-2 border-l-green-400" : ""}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">{post.authorId?.name?.charAt(0)?.toUpperCase() || "?"}</div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{post.authorId?.name || "Unknown"}</span>
                        <span className="text-[10px] text-slate-400">{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        {post.isEdited && <span className="text-[10px] text-slate-400 italic">(edited)</span>}
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{post.content}</p>
                      {!selectedDiscussion.isClosed && <button onClick={() => setReplyingTo(post._id || post.id)} className="mt-2 text-[10px] font-semibold text-green-600 hover:text-green-700 transition-colors">Reply</button>}
                      {replyingTo === (post._id || post.id) && (
                        <div className="mt-3 flex gap-2">
                          <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Write a reply..." rows={2} className={inputCls + " resize-none flex-1"} />
                          <div className="flex flex-col gap-1"><button onClick={handleCreatePost} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"><Send className="w-3.5 h-3.5" /></button><button onClick={() => { setReplyingTo(null); setReplyContent(""); }} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X className="w-3.5 h-3.5" /></button></div>
                        </div>
                      )}
                    </div>
                  ))}{discussionPosts.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No posts yet. Start the conversation!</p>}</div>}
                {!selectedDiscussion.isClosed && <div className="flex gap-2"><textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Write a post..." rows={2} className={inputCls + " resize-none flex-1"} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCreatePost(); }} /><button onClick={handleCreatePost} disabled={!replyContent.trim()} className="self-end px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"><Send className="w-4 h-4" /></button></div>}
                {selectedDiscussion.isClosed && <p className="text-xs text-slate-400 text-center italic">This discussion is closed.</p>}
              </div>
            ) : (<>
              {isInstructor && <div className="flex gap-2">
                <button onClick={() => setShowNewDiscussion(!showNewDiscussion)} className="flex items-center gap-2 flex-1 p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 hover:border-green-400 hover:text-green-600 transition-colors"><Plus className="w-4 h-4" /> New Discussion</button>
                <button onClick={handleGenerateDiscussionPrompt} disabled={discAiLoading} className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-green-200 dark:border-green-500/30 rounded-xl text-sm text-green-600 hover:border-green-400 transition-colors disabled:opacity-50">{discAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI Prompt</button>
              </div>}
              {showNewDiscussion && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={sectionCls}>
                  <div><label className={labelCls}>Title</label><input value={newDiscTitle} onChange={(e) => setNewDiscTitle(e.target.value)} placeholder="Discussion title" className={inputCls} /></div>
                  <div><div className="flex items-center justify-between mb-1.5"><label className={labelCls}>Description</label><button onClick={handleGenerateDiscussionPrompt} disabled={discAiLoading} className="flex items-center gap-1 text-[10px] font-semibold text-green-600 hover:text-green-700 disabled:opacity-40 transition-colors">{discAiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} Generate Prompt</button></div><textarea value={newDiscDesc} onChange={(e) => setNewDiscDesc(e.target.value)} placeholder="Description or prompt..." rows={3} className={inputCls + " resize-none"} /></div>
                  <div className="flex gap-2"><button onClick={handleCreateDiscussion} className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors">Create Discussion</button><button onClick={() => setShowNewDiscussion(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button></div>
                </motion.div>
              )}
              {discussionsLoading ? <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" /><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2" /></div>)}</div>
                : discussions.length === 0 ? <EmptyState icon={MessageSquare} title="No discussions yet" description={isInstructor ? "Start a discussion for your students" : "No discussions have been posted yet"} action={isInstructor ? "New Discussion" : undefined} onAction={() => setShowNewDiscussion(true)} />
                : discussions.map((disc) => (
                  <motion.div key={disc._id || disc.id} whileHover={{ y: -1 }} onClick={() => setSelectedDiscussion(disc)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-green-300 dark:hover:border-green-600 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1">{disc.isPinned && <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" />}<h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{disc.title}</h4>{disc.isClosed && <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full">Closed</span>}</div>
                        {disc.description && <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">{disc.description}</p>}
                        <div className="flex items-center gap-3 text-[10px] text-slate-500"><span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" /> {disc.postCount || 0} posts</span>{disc.lastActivityAt && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {new Date(disc.lastActivityAt).toLocaleDateString()}</span>}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                    </div>
                  </motion.div>
                ))}
            </>)}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-3">
            {isInstructor && <button onClick={() => setShowNewNote(!showNewNote)} className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 hover:border-green-400 hover:text-green-600 transition-colors"><Plus className="w-4 h-4" /> New Note</button>}
            {showNewNote && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={sectionCls}>
                <div><label className={labelCls}>Title</label><input value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} placeholder="Note title" className={inputCls} /></div>
                <div><div className="flex items-center justify-between mb-1.5"><label className={labelCls}>Content</label><button onClick={handleGenerateNote} disabled={noteAiLoading || !newNoteTitle.trim()} className="flex items-center gap-1 text-[10px] font-semibold text-green-600 hover:text-green-700 disabled:opacity-40 transition-colors">{noteAiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} Generate Note with AI</button></div><textarea value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} placeholder="Write your notes..." rows={8} className={inputCls + " resize-none"} /></div>
                <div><label className={labelCls}>Tags (comma-separated)</label><input value={newNoteTags} onChange={(e) => setNewNoteTags(e.target.value)} placeholder="e.g. midterm, chapter-3" className={inputCls} /></div>
                <div className="flex gap-2"><button onClick={handleCreateNote} className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors">Save Note</button><button onClick={() => setShowNewNote(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button></div>
              </motion.div>
            )}
            {notesLoading ? <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" /><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-2/3" /></div>)}</div>
              : notes.length === 0 ? <EmptyState icon={StickyNote} title="No notes yet" description="Create notes to help organize study material" action="New Note" onAction={() => setShowNewNote(true)} />
              : notes.map((note) => (
                <motion.div key={note._id || note.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">{note.isPinned && <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" />}<h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{note.title}</h4>{note.isAiGenerated && <span className="text-[9px] font-bold text-purple-500 bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">AI</span>}</div>
                    <button onClick={() => handleSummarizeNote(note)} disabled={noteSummaryLoading === (note._id || note.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-green-500 transition-colors disabled:opacity-50">{noteSummaryLoading === (note._id || note.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}</button>
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap line-clamp-6 mb-2">{note.content}</div>
                  <div className="flex items-center justify-between"><div className="flex items-center gap-1.5 flex-wrap">{(note.tags || []).map((tag, i) => <span key={i} className="text-[9px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">#{tag}</span>)}</div><div className="flex items-center gap-2 text-[10px] text-slate-400">{note.authorId?.name && <span>by {note.authorId.name}</span>}<span>{new Date(note.createdAt).toLocaleDateString()}</span></div></div>
                </motion.div>
              ))}
          </div>
        )}

        {activeTab === "materials" && (
          <div className="space-y-3">
            {isInstructor && <button onClick={() => setShowNewMaterial(!showNewMaterial)} className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 hover:border-green-400 hover:text-green-600 transition-colors"><Plus className="w-4 h-4" /> Add Material</button>}
            {showNewMaterial && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={sectionCls}>
                <div className="grid grid-cols-2 gap-3"><div><label className={labelCls}>Title *</label><input value={newMat.title} onChange={(e) => setNewMat({ ...newMat, title: e.target.value })} placeholder="Material title" className={inputCls} /></div><div><label className={labelCls}>Type</label><select value={newMat.type} onChange={(e) => setNewMat({ ...newMat, type: e.target.value })} className={inputCls + " appearance-none"}>{MATERIAL_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></div></div>
                <div><label className={labelCls}>Description</label><textarea value={newMat.description} onChange={(e) => setNewMat({ ...newMat, description: e.target.value })} placeholder="Description..." rows={2} className={inputCls + " resize-none"} /></div>
                <div><label className={labelCls}>URL</label><input value={newMat.url} onChange={(e) => setNewMat({ ...newMat, url: e.target.value })} placeholder="https://..." className={inputCls} /></div>
                <div className="grid grid-cols-3 gap-3"><div><label className={labelCls}>Week #</label><input type="number" min={0} max={classroom.durationWeeks || 52} value={newMat.weekNumber} onChange={(e) => setNewMat({ ...newMat, weekNumber: parseInt(e.target.value) || 0 })} className={inputCls} /></div><div><label className={labelCls}>Category</label><input value={newMat.category} onChange={(e) => setNewMat({ ...newMat, category: e.target.value })} placeholder="e.g. Reading" className={inputCls} /></div><div className="flex items-end pb-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newMat.isRequired} onChange={(e) => setNewMat({ ...newMat, isRequired: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-green-500 focus:ring-green-500" /><span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Required</span></label></div></div>
                <div className="flex gap-2"><button onClick={handleCreateMaterial} className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors">Add Material</button><button onClick={() => setShowNewMaterial(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button></div>
              </motion.div>
            )}
            {materialsLoading ? <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" /><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2" /></div>)}</div>
              : materials.length === 0 ? <EmptyState icon={Layers} title="No materials yet" description="Upload course materials, links, and resources" action="Add Material" onAction={() => setShowNewMaterial(true)} />
              : Object.entries(materials.reduce((acc, mat) => { const wk = mat.weekNumber || 0; if (!acc[wk]) acc[wk] = []; acc[wk].push(mat); return acc; }, {})).sort(([a], [b]) => Number(a) - Number(b)).map(([week, mats]) => (
                <div key={week} className="space-y-2">
                  {Number(week) > 0 && <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Week {week}</h4>}
                  {mats.map((mat) => { const MIcon = MATERIAL_ICON_MAP[mat.type] || Layers; return (
                    <motion.div key={mat._id || mat.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                      <div className="flex items-start gap-3"><div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0"><MIcon className="w-4 h-4 text-slate-500" /></div>
                        <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-0.5"><h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{mat.title}</h4>{mat.isRequired && <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full">Required</span>}{mat.category && <span className="text-[9px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{mat.category}</span>}</div>
                          {mat.description && <p className="text-[11px] text-slate-500 line-clamp-2 mb-1">{mat.description}</p>}
                          <div className="flex items-center gap-2 mt-1">{mat.url && <a href={mat.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-green-600 hover:text-green-700 flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>Open <ExternalLink className="w-3 h-3" /></a>}</div>
                        </div>
                      </div>
                    </motion.div>
                  );})}
                </div>
              ))}
          </div>
        )}

        {activeTab === "students" && isInstructor && (
          <div className="space-y-3">
            {loading ? <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700" /><div className="flex-1 space-y-2"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" /><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/4" /></div></div></div>)}</div>
              : students.length === 0 ? <EmptyState icon={Users} title="No students yet" description="Share the invite code to get students enrolled" action="Invite Students" onAction={() => setShowInvite(true)} />
              : students.map((student) => (
                <div key={student.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{student.name?.charAt(0)?.toUpperCase() || "?"}</div>
                    <div className="flex-1 min-w-0"><h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{student.name}</h4><p className="text-[10px] text-slate-500 truncate">{student.email}</p></div>
                    <div className="text-right"><p className="text-xs font-bold text-slate-900 dark:text-white">{student.completed}/{student.totalAssignments}</p><p className="text-[10px] text-slate-500">completed</p></div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500" style={{ width: `${student.avgProgress}%` }} /></div>
                  <div className="flex items-center justify-between mt-1.5"><span className="text-[10px] text-slate-500">{student.avgProgress}% avg progress</span><span className="text-[10px] text-slate-500">{student.totalTimeMinutes}min spent</span></div>
                </div>
              ))}
          </div>
        )}

        {activeTab === "settings" && isInstructor && (
          <div className="space-y-4">
            <div className={sectionCls}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Info className="w-4 h-4 text-green-500" /> Classroom Info</h3>
              <div><label className={labelCls}>Name</label><input value={settingsForm.name} onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Subject</label><input value={settingsForm.subject} onChange={(e) => setSettingsForm({ ...settingsForm, subject: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Description</label><textarea value={settingsForm.description} onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })} rows={3} className={inputCls + " resize-none"} /></div>
            </div>
            <div className={sectionCls}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" /> Schedule</h3>
              <div><label className={labelCls}>Days</label><div className="flex gap-1.5">{daysOfWeek.map((day) => <button key={day} onClick={() => { const days = settingsForm.schedule.days || []; const newDays = days.includes(day) ? days.filter((d) => d !== day) : [...days, day]; setSettingsForm({ ...settingsForm, schedule: { ...settingsForm.schedule, days: newDays } }); }} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${(settingsForm.schedule.days || []).includes(day) ? "bg-green-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>{day}</button>)}</div></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={labelCls}>Start Time</label><input type="time" value={settingsForm.schedule.startTime || ""} onChange={(e) => setSettingsForm({ ...settingsForm, schedule: { ...settingsForm.schedule, startTime: e.target.value } })} className={inputCls} /></div>
                <div><label className={labelCls}>End Time</label><input type="time" value={settingsForm.schedule.endTime || ""} onChange={(e) => setSettingsForm({ ...settingsForm, schedule: { ...settingsForm.schedule, endTime: e.target.value } })} className={inputCls} /></div>
                <div><label className={labelCls}>Location</label><input value={settingsForm.schedule.location || ""} onChange={(e) => setSettingsForm({ ...settingsForm, schedule: { ...settingsForm.schedule, location: e.target.value } })} placeholder="Room / Link" className={inputCls} /></div>
              </div>
            </div>
            <div className={sectionCls}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><GraduationCap className="w-4 h-4 text-purple-500" /> Academic</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Semester</label><input value={settingsForm.semester} onChange={(e) => setSettingsForm({ ...settingsForm, semester: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Academic Level</label><select value={settingsForm.academicLevel} onChange={(e) => setSettingsForm({ ...settingsForm, academicLevel: e.target.value })} className={inputCls + " appearance-none"}><option value="highschool">High School</option><option value="undergraduate">Undergraduate</option><option value="graduate">Graduate</option><option value="phd">PhD</option><option value="professional">Professional</option></select></div>
              </div>
              <div><label className={labelCls}>Grading Scheme</label><select value={settingsForm.gradingScheme} onChange={(e) => setSettingsForm({ ...settingsForm, gradingScheme: e.target.value })} className={inputCls + " appearance-none"}><option value="percentage">Percentage</option><option value="letter">Letter Grades</option><option value="passfail">Pass/Fail</option><option value="gpa">GPA Scale</option></select></div>
            </div>
            <div className={sectionCls}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Bookmark className="w-4 h-4 text-amber-500" /> Prerequisites</h3>
              <div className="flex gap-2"><input value={settingsForm.newPrereq || ""} onChange={(e) => setSettingsForm({ ...settingsForm, newPrereq: e.target.value })} placeholder="Add prerequisite..." className={inputCls + " flex-1"} onKeyDown={(e) => { if (e.key === "Enter" && settingsForm.newPrereq?.trim()) { setSettingsForm({ ...settingsForm, prerequisites: [...(settingsForm.prerequisites || []), settingsForm.newPrereq.trim()], newPrereq: "" }); } }} /><button onClick={() => { if (settingsForm.newPrereq?.trim()) setSettingsForm({ ...settingsForm, prerequisites: [...(settingsForm.prerequisites || []), settingsForm.newPrereq.trim()], newPrereq: "" }); }} className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"><Plus className="w-4 h-4" /></button></div>
              <div className="flex flex-wrap gap-1.5">{(settingsForm.prerequisites || []).map((prereq, i) => <span key={i} className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-300">{prereq}<button onClick={() => setSettingsForm({ ...settingsForm, prerequisites: settingsForm.prerequisites.filter((_, idx) => idx !== i) })} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button></span>)}{(!settingsForm.prerequisites || settingsForm.prerequisites.length === 0) && <p className="text-[11px] text-slate-400 italic">No prerequisites</p>}</div>
            </div>
            <div className={sectionCls}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500" /> Syllabus</h3>
              <textarea value={settingsForm.syllabus} onChange={(e) => setSettingsForm({ ...settingsForm, syllabus: e.target.value })} rows={8} className={inputCls + " resize-none"} placeholder="Course syllabus..." />
            </div>
            <div className={sectionCls}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Globe className="w-4 h-4 text-teal-500" /> Feature Toggles</h3>
              {[{ key: "enableDiscussions", label: "Discussions" }, { key: "enableNotes", label: "Notes" }, { key: "enableMaterials", label: "Materials" }].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span><button onClick={() => setSettingsForm({ ...settingsForm, settings: { ...settingsForm.settings, [key]: !settingsForm.settings[key] } })} className={toggleCls(settingsForm.settings[key])}><span className={toggleDot(settingsForm.settings[key])} /></button></div>
              ))}
            </div>
            <div className={sectionCls}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Student Settings</h3>
              {[{ key: "allowStudentPosts", label: "Allow Student Posts" }, { key: "requireApproval", label: "Require Approval" }, { key: "showGradesToStudents", label: "Show Grades to Students" }, { key: "allowLateSubmissions", label: "Allow Late Submissions" }].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span><button onClick={() => setSettingsForm({ ...settingsForm, settings: { ...settingsForm.settings, [key]: !settingsForm.settings[key] } })} className={toggleCls(settingsForm.settings[key])}><span className={toggleDot(settingsForm.settings[key])} /></button></div>
              ))}
              <div><label className={labelCls}>Late Penalty (%)</label><input type="number" min={0} max={100} value={settingsForm.settings.latePenaltyPercent || 0} onChange={(e) => setSettingsForm({ ...settingsForm, settings: { ...settingsForm.settings, latePenaltyPercent: parseInt(e.target.value) || 0 } })} className={inputCls} /></div>
              <div><label className={labelCls}>Max File Size (MB)</label><input type="number" min={1} max={100} value={settingsForm.settings.maxFileSizeMB || 50} onChange={(e) => setSettingsForm({ ...settingsForm, settings: { ...settingsForm.settings, maxFileSizeMB: parseInt(e.target.value) || 50 } })} className={inputCls} /></div>
            </div>
            <div className={sectionCls}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Link2 className="w-4 h-4 text-slate-500" /> Invite Code</h3>
              <div className="flex items-center gap-2"><code className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-sm font-bold tracking-wider">{classroom.inviteCode}</code><button onClick={() => { navigator.clipboard.writeText(classroom.inviteCode); toast.success("Copied!"); }} className="p-2 text-slate-400 hover:text-green-500 transition-colors"><Copy className="w-4 h-4" /></button></div>
            </div>
            <button onClick={handleSaveSettings} disabled={settingsSaving} className="w-full py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors">{settingsSaving ? "Saving..." : "Save Settings"}</button>
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Danger Zone</h3>
              <p className="text-xs text-red-500/70">Archiving a classroom will hide it from all users and remove student enrollments.</p>
              <button onClick={handleDeleteClassroom} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"><Archive className="w-3.5 h-3.5" /> Archive Classroom</button>
            </div>
          </div>
        )}
      </div>

      {showCreateAssignment && <CreateAssignmentModal classroomId={classroom.id} classroomName={classroom.name} onClose={() => setShowCreateAssignment(false)} onCreated={(a) => setAssignments([a, ...assignments])} />}
      {showInvite && <InviteModal classroom={classroom} onClose={() => setShowInvite(false)} />}
    </div>
  );
}

export default function ClassroomDashboard({ setHideDashboardNav }) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
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
      setHideDashboardNav(!!(selectedClassroom || showCreate || showJoin));
    }
  }, [selectedClassroom, showCreate, showJoin, setHideDashboardNav]);

  if (selectedClassroom) {
    return <ClassroomDetail classroom={selectedClassroom} onBack={() => setSelectedClassroom(null)} user={user} />;
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
          {!isInstructor && <button onClick={() => setShowJoin(!showJoin)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${showJoin ? "bg-green-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}><UserPlus className="w-3.5 h-3.5" /> Join</button>}
          {isInstructor && <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"><Plus className="w-3.5 h-3.5" /> New Classroom</button>}
        </div>
      </div>

      {!isInstructor && upcomingDeadlines.length > 0 && !loading && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" /><span className="text-xs font-bold text-amber-700 dark:text-amber-400">Upcoming Deadlines</span></div>
          <div className="space-y-1.5">{upcomingDeadlines.map((d) => { const hoursLeft = (new Date(d.dueDate) - new Date()) / (1000 * 60 * 60); const urgent = hoursLeft < 24; return (
            <button key={d.id} onClick={() => { const cls = classrooms.find((c) => c.id === d.classroomId); if (cls) setSelectedClassroom(cls); }} className="flex items-center gap-2 w-full text-left group">
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
            <div className="w-full max-w-xs">
              <button onClick={() => setShowJoin(!showJoin)} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-green-500 text-white hover:bg-green-600">{showJoin ? "Close" : "Join Classroom"}</button>
              <AnimatePresence>{showJoin && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mt-3 flex items-end gap-2">
                    <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Invite code" maxLength={8} className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-mono text-sm font-bold text-slate-900 dark:text-white tracking-widest placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/30 uppercase" />
                    <button onClick={handleJoinClassroom} disabled={joining || joinCode.trim().length < 4} className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors flex-shrink-0">{joining ? "..." : "Join"}</button>
                  </div>
                </motion.div>
              )}</AnimatePresence>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {classrooms.map((classroom) => (
            <ClassroomCard key={classroom.id} classroom={classroom} role={isInstructor ? "instructor" : "student"} onClick={() => setSelectedClassroom(classroom)} onDelete={handleDeleteClassroom} />
          ))}
        </div>
      )}
    </div>
  );
}
