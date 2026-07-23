"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList, X, Loader2, Sparkles, Plus, Trash2, CheckCircle2,
  Edit3, Layers, MessageSquare, Code, Presentation, CircleDot,
  Download, Upload, RefreshCw, Clock,
} from "lucide-react";
import { apiClient } from "@/lib/csrfClient";
import { toast } from "sonner";

const TYPES = [
  { value: "quiz", label: "Quiz", icon: CheckCircle2 },
  { value: "essay", label: "Essay", icon: Edit3 },
  { value: "report", label: "Report", icon: Edit3 },
  { value: "exam", label: "Exam", icon: CheckCircle2 },
  { value: "project", label: "Project", icon: Layers },
  { value: "discussion", label: "Discussion", icon: MessageSquare },
  { value: "lab", label: "Lab", icon: Code },
  { value: "presentation", label: "Presentation", icon: Presentation },
];

function getWeekTopics(weekNumber, courseModules, forkedContent) {
  const topics = [];
  for (const mod of courseModules || []) {
    if (mod.weekNumber === weekNumber) {
      topics.push(mod.title);
      for (const lesson of mod.lessons || []) topics.push(lesson.title);
    }
  }
  for (const fc of forkedContent || []) {
    if (fc.contentType === "course" && fc.meta?.modules) {
      for (const mod of fc.meta.modules) {
        if (mod.weekNumber === weekNumber) {
          topics.push(mod.title);
          for (const lesson of mod.lessons || []) topics.push(lesson.title);
        }
      }
    }
  }
  return topics;
}

function getAllTopicsUpToWeek(weekNumber, courseModules, forkedContent) {
  const topics = [];
  for (const mod of courseModules || []) {
    if (mod.weekNumber <= weekNumber) {
      topics.push(mod.title);
      for (const lesson of mod.lessons || []) topics.push(lesson.title);
    }
  }
  for (const fc of forkedContent || []) {
    if (fc.contentType === "course" && fc.meta?.modules) {
      for (const mod of fc.meta.modules) {
        if (mod.weekNumber <= weekNumber) {
          topics.push(mod.title);
          for (const lesson of mod.lessons || []) topics.push(lesson.title);
        }
      }
    }
  }
  return topics;
}

export default function CreateAssignmentPanel({
  classroomId, classroomName, onClose, onCreated, editAssignment,
  courseModules = [], forkedContent = [], durationWeeks = 12,
}) {
  const isEdit = !!editAssignment;
  const [form, setForm] = useState(() => {
    if (editAssignment) {
      return {
        title: editAssignment.title || "",
        instructions: editAssignment.instructions || "",
        type: editAssignment.type || "essay",
        weekNumber: editAssignment.weekNumber || 1,
        maxScore: editAssignment.maxScore ?? 100,
        passingScore: editAssignment.passingScore ?? 60,
        maxAttempts: editAssignment.maxAttempts ?? 1,
        rubric: editAssignment.rubric || [],
        quizQuestions: editAssignment.quizQuestions || [],
        questionCount: editAssignment.meta?.questionCount || 20,
        difficulty: editAssignment.meta?.difficulty || "medium",
        timeLimitMinutes: editAssignment.meta?.timeLimitMinutes || 30,
      };
    }
    try {
      const saved = localStorage.getItem(`assignment_draft_${classroomId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      title: "", instructions: "", type: "essay",
      weekNumber: 1, maxScore: 100, passingScore: 60,
      maxAttempts: 1, rubric: [], quizQuestions: [],
      questionCount: 20, difficulty: "medium", timeLimitMinutes: 30,
    };
  });
  const [loading, setLoading] = useState(false);
  const [aiInstrLoading, setAiInstrLoading] = useState(false);
  const [aiRubricLoading, setAiRubricLoading] = useState(false);
  const [aiQuizLoading, setAiQuizLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      try { localStorage.setItem(`assignment_draft_${classroomId}`, JSON.stringify(form)); } catch {}
    }
  }, [form, isEdit, classroomId]);

  const isExam = form.type === "exam" || (form.type === "quiz" && (form.weekNumber === "midterm" || form.weekNumber === "final"));
  const weekNum = typeof form.weekNumber === "number" ? form.weekNumber : 0;

  const handleGenerateInstructions = async () => {
    if (!form.title.trim()) { toast.error("Enter assignment title first"); return; }
    setAiInstrLoading(true);
    try {
      const weekTopics = isExam
        ? getAllTopicsUpToWeek(form.weekNumber === "midterm" ? Math.floor(durationWeeks / 2) : durationWeeks, courseModules, forkedContent)
        : getWeekTopics(weekNum, courseModules, forkedContent);
      const contextStr = weekTopics.length > 0 ? `This assignment covers these topics: ${weekTopics.join(", ")}` : "";
      const res = await apiClient.post("/api/classrooms/ai-generate", {
        task: "assignment_instructions",
        assignmentTitle: form.title,
        classroomName: classroomName || "",
        name: form.type,
        content: `${contextStr}. Max score: ${form.maxScore}.`,
      });
      const data = await res.json();
      if (data.result) { setForm((p) => ({ ...p, instructions: data.result })); toast.success("Instructions generated!"); }
      else toast.error("Failed to generate instructions");
    } catch { toast.error("Failed to generate instructions"); } finally { setAiInstrLoading(false); }
  };

  const handleGenerateRubric = async () => {
    if (!form.title.trim()) { toast.error("Enter assignment title first"); return; }
    setAiRubricLoading(true);
    try {
      const weekTopics = isExam
        ? getAllTopicsUpToWeek(form.weekNumber === "midterm" ? Math.floor(durationWeeks / 2) : durationWeeks, courseModules, forkedContent)
        : getWeekTopics(weekNum, courseModules, forkedContent);
      const contextStr = weekTopics.length > 0 ? `Topics covered: ${weekTopics.join(", ")}.` : "";
      const res = await apiClient.post("/api/classrooms/ai-generate", {
        task: "rubric",
        assignmentTitle: form.title,
        classroomName: classroomName || "",
        name: form.type,
        content: `${contextStr} Max total points: ${form.maxScore}. Assignment type: ${form.type}.`,
      });
      const data = await res.json();
      if (data.result) {
        let rubric = data.result;
        if (typeof rubric === "string") { try { rubric = JSON.parse(rubric); } catch { rubric = []; } }
        setForm((p) => ({ ...p, rubric }));
        toast.success("Rubric generated!");
      } else toast.error("Failed to generate rubric");
    } catch { toast.error("Failed to generate rubric"); } finally { setAiRubricLoading(false); }
  };

  const handleGenerateQuiz = async () => {
    if (!form.title.trim()) { toast.error("Enter assignment title first"); return; }
    setAiQuizLoading(true);
    try {
      const weekTopics = isExam
        ? getAllTopicsUpToWeek(form.weekNumber === "midterm" ? Math.floor(durationWeeks / 2) : durationWeeks, courseModules, forkedContent)
        : getWeekTopics(weekNum, courseModules, forkedContent);
      const contextStr = weekTopics.length > 0 ? `Topics: ${weekTopics.join(", ")}.` : "";
      const res = await apiClient.post("/api/classrooms/ai-generate", {
        task: "quiz_questions",
        name: form.title,
        subject: classroomName || "",
        content: `${contextStr} Generate ${form.questionCount} questions with difficulty "${form.difficulty}". Assignment type: ${form.type}. Max score: ${form.maxScore}.`,
      });
      const data = await res.json();
      if (data.result?.questions?.length > 0) {
        const questions = data.result.questions.map((q, i) => ({
          id: i,
          text: q.text || "",
          type: q.type || "multiple-choice",
          points: q.points || 2,
          options: q.options || [],
          correctAnswer: q.correctAnswer ?? "",
        }));
        setForm((p) => ({ ...p, quizQuestions: questions }));
        toast.success(`${questions.length} questions generated!`);
      } else toast.error("No questions generated");
    } catch { toast.error("Failed to generate quiz questions"); } finally { setAiQuizLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("Assignment title is required"); return; }
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        instructions: form.instructions,
        type: form.type,
        maxScore: form.maxScore,
        category: form.category,
        passingScore: form.passingScore,
        weight: form.weight,
        maxAttempts: form.maxAttempts,
        rubric: form.rubric.length > 0 ? form.rubric : undefined,
        weekNumber: typeof form.weekNumber === "string" ? 0 : form.weekNumber,
        meta: (form.type === "quiz" || form.type === "exam") ? { questionCount: form.questionCount, difficulty: form.difficulty, timeLimitMinutes: form.timeLimitMinutes } : undefined,
        quizQuestions: (form.type === "quiz" || form.type === "exam") && form.quizQuestions.length > 0 ? form.quizQuestions : undefined,
      };
      const res = isEdit
        ? await apiClient.put(`/api/classrooms/${classroomId}/assignments/${editAssignment.id || editAssignment._id}`, payload)
        : await apiClient.post(`/api/classrooms/${classroomId}/assignments`, payload);
      const data = await res.json();
      if (data.success) {
        try { localStorage.removeItem(`assignment_draft_${classroomId}`); } catch {}
        toast.success(isEdit ? "Assignment updated!" : "Assignment created!"); onCreated?.(data.assignment, isEdit); onClose();
      }
      else toast.error(data.error || "Failed to save assignment");
    } catch { toast.error("Failed to save assignment"); } finally { setLoading(false); }
  };

  const inputCls = "w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30";
  const labelCls = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block";

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-green-500" /> {isEdit ? "Edit Assignment" : "New Assignment"}
        </h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-4 h-4" /></button>
      </div>

      <div className="p-4 space-y-4">
        {/* Title */}
        <div>
          <label className={labelCls}>Title *</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Chapter 1 Review" className={inputCls} />
        </div>

        {/* Type */}
        <div>
          <label className={labelCls}>Type</label>
          <div className="grid grid-cols-4 gap-1.5">
            {TYPES.map(({ value, label, icon: Icon }) => (
              <button key={value} onClick={() => setForm({ ...form, type: value })}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium transition-all ${form.type === value ? "bg-green-500/10 text-green-600 border border-green-500/30" : "bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Week + Max Score */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Week</label>
            <select value={form.weekNumber} onChange={(e) => {
              const val = e.target.value;
              setForm({ ...form, weekNumber: isNaN(Number(val)) ? val : Number(val) });
            }} className={inputCls}>
              {Array.from({ length: durationWeeks || 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Week {i + 1}</option>
              ))}
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Max Score</label>
            <input type="number" min={0} value={form.maxScore}
              onChange={(e) => setForm({ ...form, maxScore: parseInt(e.target.value) || 100 })} className={inputCls} />
          </div>
        </div>

        {/* Passing Score + Max Attempts */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Passing Score</label>
            <input type="number" min={0} value={form.passingScore}
              onChange={(e) => setForm({ ...form, passingScore: parseInt(e.target.value) || 60 })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Max Attempts</label>
            <input type="number" min={1} max={100} value={form.maxAttempts}
              onChange={(e) => setForm({ ...form, maxAttempts: parseInt(e.target.value) || 1 })} className={inputCls} />
          </div>
        </div>

        {/* Quiz-specific: question count + difficulty + time limit */}
        {(form.type === "quiz" || form.type === "exam") && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Questions</label>
              <input type="number" min={5} max={50} value={form.questionCount}
                onChange={(e) => setForm({ ...form, questionCount: parseInt(e.target.value) || 20 })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Difficulty</label>
              <select value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className={inputCls}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Time (min)</label>
              <input type="number" min={1} max={180} value={form.timeLimitMinutes}
                onChange={(e) => setForm({ ...form, timeLimitMinutes: parseInt(e.target.value) || 30 })} className={inputCls} />
            </div>
          </div>
        )}

        {/* Instructions + AI generate */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls}>Instructions</label>
            <button type="button" onClick={handleGenerateInstructions} disabled={aiInstrLoading || !form.title.trim()}
              className="flex items-center gap-1 text-[10px] font-semibold text-green-600 hover:text-green-700 disabled:opacity-40 transition-colors">
              {aiInstrLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
              {aiInstrLoading ? "Generating..." : "Generate with AI"}
            </button>
          </div>
          <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            placeholder="Detailed instructions..." rows={4} className={inputCls + " resize-none"} />
        </div>

        {/* Rubric */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls}>Rubric</label>
            <button type="button" onClick={handleGenerateRubric} disabled={aiRubricLoading || !form.title.trim()}
              className="flex items-center gap-1 text-[10px] font-semibold text-green-600 hover:text-green-700 disabled:opacity-40 transition-colors">
              {aiRubricLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
              {aiRubricLoading ? "Generating..." : "Generate Rubric with AI"}
            </button>
          </div>
          {form.rubric.length > 0 ? (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider w-[30%]">Criterion</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="px-3 py-2 text-center font-semibold text-slate-500 uppercase tracking-wider w-[80px]">Points</th>
                    <th className="px-3 py-2 w-[40px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.rubric.map((r, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-slate-700/50">
                      <td className="px-2 py-1.5">
                        <input value={r.criterion} onChange={(e) => {
                          const next = [...form.rubric]; next[i] = { ...next[i], criterion: e.target.value };
                          setForm({ ...form, rubric: next });
                        }} placeholder="Criterion"
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-green-500/30" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={r.description || ""} onChange={(e) => {
                          const next = [...form.rubric]; next[i] = { ...next[i], description: e.target.value };
                          setForm({ ...form, rubric: next });
                        }} placeholder="Description"
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-green-500/30" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" min={0} value={r.maxPoints} onChange={(e) => {
                          const next = [...form.rubric]; next[i] = { ...next[i], maxPoints: parseInt(e.target.value) || 0 };
                          setForm({ ...form, rubric: next });
                        }}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white text-center focus:outline-none focus:ring-1 focus:ring-green-500/30" />
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <button onClick={() => setForm({ ...form, rubric: form.rubric.filter((_, j) => j !== i) })}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <td colSpan={2} className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase">Total</td>
                    <td className="px-3 py-1.5 text-center text-xs font-bold text-slate-900 dark:text-white">
                      {form.rubric.reduce((sum, r) => sum + (r.maxPoints || 0), 0)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : <p className="text-[11px] text-slate-400 italic mb-2">No rubric yet.</p>}
          <button type="button" onClick={() => setForm({ ...form, rubric: [...form.rubric, { criterion: "", description: "", maxPoints: 10 }] })}
            className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors mt-1.5">
            <Plus className="w-3 h-3" /> Add Criterion
          </button>
        </div>

        {/* Quiz Questions — editable */}
        {(form.type === "quiz" || form.type === "exam") && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls}>Quiz Questions ({form.quizQuestions.length})</label>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => {
                  const json = JSON.stringify(form.quizQuestions, null, 2);
                  const blob = new Blob([json], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = `${form.title || "quiz"}-questions.json`; a.click(); URL.revokeObjectURL(url);
                  toast.success("Quiz exported!");
                }} disabled={form.quizQuestions.length === 0}
                  className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-40 transition-colors">
                  <Download size={11} /> Export
                </button>
                <button type="button" onClick={() => {
                  const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
                  input.onchange = (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const parsed = JSON.parse(ev.target.result);
                        if (Array.isArray(parsed)) {
                          const questions = parsed.map((q, i) => ({
                            id: i, text: q.text || "", type: q.type || "multiple-choice",
                            points: q.points || 2, options: q.options || [], correctAnswer: q.correctAnswer ?? "",
                          }));
                          setForm((p) => ({ ...p, quizQuestions: questions }));
                          toast.success(`Imported ${questions.length} questions!`);
                        } else toast.error("Invalid format — expected array of questions");
                      } catch { toast.error("Invalid JSON file"); }
                    };
                    reader.readAsText(file);
                  };
                  input.click();
                }} className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700 transition-colors">
                  <Upload size={11} /> Import
                </button>
                <button type="button" onClick={handleGenerateQuiz} disabled={aiQuizLoading || !form.title.trim()}
                  className="flex items-center gap-1 text-[10px] font-semibold text-green-600 hover:text-green-700 disabled:opacity-40 transition-colors">
                  {aiQuizLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  {aiQuizLoading ? "Generating..." : isEdit && form.quizQuestions.length > 0 ? "Regenerate All" : "Generate with AI"}
                </button>
              </div>
            </div>
            {form.quizQuestions.length > 0 ? (
              <div className="space-y-3">
                {form.quizQuestions.map((q, qi) => (
                  <div key={qi} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10 text-green-600 text-[10px] font-bold flex-shrink-0 mt-0.5">{qi + 1}</span>
                      <div className="flex-1 space-y-2">
                        <input value={q.text} onChange={(e) => {
                          const next = [...form.quizQuestions]; next[qi] = { ...next[qi], text: e.target.value };
                          setForm({ ...form, quizQuestions: next });
                        }} placeholder="Question text"
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-green-500/30" />
                        <div className="grid grid-cols-3 gap-2">
                          <select value={q.type} onChange={(e) => {
                            const next = [...form.quizQuestions]; next[qi] = { ...next[qi], type: e.target.value, options: e.target.value === "true-false" ? ["True", "False"] : next[qi].options };
                            setForm({ ...form, quizQuestions: next });
                          }} className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500/30">
                            <option value="multiple-choice">Multiple Choice</option>
                            <option value="true-false">True/False</option>
                            <option value="short-answer">Short Answer</option>
                          </select>
                          <input type="number" min={1} value={q.points} onChange={(e) => {
                            const next = [...form.quizQuestions]; next[qi] = { ...next[qi], points: parseInt(e.target.value) || 1 };
                            setForm({ ...form, quizQuestions: next });
                          }} placeholder="Pts"
                            className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-900 dark:text-white text-center focus:outline-none focus:ring-1 focus:ring-green-500/30" />
                          <input value={q.correctAnswer ?? ""} onChange={(e) => {
                            const next = [...form.quizQuestions]; next[qi] = { ...next[qi], correctAnswer: e.target.value };
                            setForm({ ...form, quizQuestions: next });
                          }} placeholder="Correct answer"
                            className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-green-500/30" />
                        </div>
                        {q.type === "multiple-choice" && (
                          <div className="space-y-1.5 ml-1">
                            {(q.options || []).map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-1.5">
                                <CircleDot className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <input value={opt} onChange={(e) => {
                                  const next = [...form.quizQuestions]; const opts = [...next[qi].options]; opts[oi] = e.target.value;
                                  next[qi] = { ...next[qi], options: opts };
                                  setForm({ ...form, quizQuestions: next });
                                }} placeholder={`Option ${oi + 1}`}
                                  className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-green-500/30" />
                                <button type="button" onClick={() => {
                                  const next = [...form.quizQuestions]; const opts = next[qi].options.filter((_, j) => j !== oi);
                                  next[qi] = { ...next[qi], options: opts };
                                  setForm({ ...form, quizQuestions: next });
                                }} className="p-0.5 text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            ))}
                            <button type="button" onClick={() => {
                              const next = [...form.quizQuestions]; next[qi] = { ...next[qi], options: [...(next[qi].options || []), ""] };
                              setForm({ ...form, quizQuestions: next });
                            }} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700">
                              <Plus className="w-3 h-3" /> Add Option
                            </button>
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={() => setForm({ ...form, quizQuestions: form.quizQuestions.filter((_, j) => j !== qi) })}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-[11px] text-slate-400 italic mb-2">No questions yet. Generate with AI, import, or add manually.</p>}
            <button type="button" onClick={() => setForm({ ...form, quizQuestions: [...form.quizQuestions, { id: form.quizQuestions.length, text: "", type: "multiple-choice", points: 2, options: ["", "", "", ""], correctAnswer: "" }] })}
              className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors mt-1.5">
              <Plus className="w-3 h-3" /> Add Question
            </button>
          </div>
        )}

        {/* Submit */}
        <button onClick={handleCreate} disabled={loading || !form.title.trim()}
          className="w-full py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors">
          {loading ? "Saving..." : isEdit ? "Update Assignment" : "Create Assignment"}
        </button>
      </div>
    </motion.div>
  );
}
