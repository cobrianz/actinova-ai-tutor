"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ClipboardList, X, Search, BookOpen, Check, Loader2, Sparkles } from "lucide-react";
import { ASSIGNMENT_TYPES } from "./constants";
import { apiClient } from "@/lib/csrfClient";
import { toast } from "sonner";

export default function CreateAssignmentPanel({ classroomId, classroomName, onClose, onCreated, initialForm, editAssignment }) {
  const [form, setForm] = useState(() => {
    if (editAssignment) {
      return {
        title: editAssignment.title || "", description: editAssignment.description || "", instructions: editAssignment.instructions || "",
        type: editAssignment.type || "course", dueDate: editAssignment.dueDate ? new Date(editAssignment.dueDate).toISOString().slice(0, 16) : "",
        maxScore: editAssignment.maxScore ?? 100, courseId: editAssignment.courseId || "", category: editAssignment.category || "",
        availableFrom: editAssignment.availableFrom ? new Date(editAssignment.availableFrom).toISOString().slice(0, 16) : "",
        availableUntil: editAssignment.availableUntil ? new Date(editAssignment.availableUntil).toISOString().slice(0, 16) : "",
        passingScore: editAssignment.passingScore ?? 60, weight: editAssignment.weight ?? 1,
        maxAttempts: editAssignment.maxAttempts ?? 0, rubric: editAssignment.rubric || [],
      };
    }
    return initialForm || {
      title: "", description: "", instructions: "", type: "course", dueDate: "", maxScore: 100,
      courseId: "", category: "", availableFrom: "", availableUntil: "", passingScore: 60,
      weight: 1, maxAttempts: 0, rubric: [],
    };
  });
  const [courses, setCourses] = useState([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [aiInstrLoading, setAiInstrLoading] = useState(false);
  const [aiRubricLoading, setAiRubricLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try { const res = await apiClient.get("/api/library?type=course&limit=50"); const data = await res.json(); if (data.items) setCourses(data.items.filter((i) => i.type === "course").map((c) => ({ id: c.courseId || c._id || c.id, title: c.title || c.topic || "Untitled" }))); } catch {} finally { setLoadingCourses(false); }
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
      const isEdit = !!editAssignment;
      const res = isEdit
        ? await apiClient.put(`/api/classrooms/${classroomId}/assignments/${editAssignment.id}`, payload)
        : await apiClient.post(`/api/classrooms/${classroomId}/assignments`, payload);
      const data = await res.json();
      if (data.success) { toast.success(isEdit ? "Assignment updated!" : "Assignment created!"); onCreated(data.assignment, isEdit); onClose(); }
      else { toast.error(data.error || "Failed to save assignment"); }
    } catch { toast.error("Failed to save assignment"); } finally { setLoading(false); }
  };

  const inputCls = "w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30";
  const labelCls = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block";

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><ClipboardList className="w-4 h-4 text-green-500" /> {editAssignment ? "Edit Assignment" : "New Assignment"}</h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-4 space-y-4">
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
          {loading ? "Saving..." : editAssignment ? "Update Assignment" : "Create Assignment"}
        </button>
      </div>
    </motion.div>
  );
}
