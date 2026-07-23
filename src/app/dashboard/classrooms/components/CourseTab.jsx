"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QuizInterface from "@/components/QuizInterface";
import {
  BookOpen, Calendar, Clock, MapPin, GraduationCap, Layers, Megaphone,
  ChevronDown, ChevronUp, Target, FileText, Lock, Unlock, ExternalLink,
  Award, Sparkles, Loader2, Link2, Trash2, Plus, Settings, Info,
  Eye, EyeOff, MessageSquare, ClipboardList, ClipboardCheck, ExternalLink as LinkIcon,
  Check, Paperclip, GitFork,
} from "lucide-react";
import { TYPE_CONFIG } from "./constants";
import { renderLessonBlocks } from "@/lib/contentRenderer";
import LessonChart from "@/dashboard/learn/components/LessonChart";
import LessonTable from "@/dashboard/learn/components/LessonTable";
import ConfirmModal from "@/components/ConfirmModal";
import ForkContentPanel from "./ForkContentPanel";
import MyProgressWidget from "./MyProgressWidget";
import { apiClient } from "@/lib/csrfClient";
import { toast } from "sonner";

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^#{1,3}\s+/.test(line)) {
      const level = line.match(/^(#{1,3})/)[1].length;
      const txt = line.replace(/^#{1,3}\s+/, "");
      const cls = level === 1 ? "text-lg font-bold mt-4 mb-2" : level === 2 ? "text-base font-bold mt-3 mb-1.5" : "text-sm font-bold mt-2 mb-1";
      elements.push(<p key={key++} className={`${cls} text-slate-900 dark:text-white`}>{txt}</p>);
      i++;
    } else if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={key++} className="my-3 border-slate-200 dark:border-slate-700" />);
      i++;
    } else if (line.trim().startsWith("|") && i + 1 < lines.length && /^\|[\s:-]+\|/.test(lines[i + 1].trim())) {
      const headerCells = line.split("|").filter((c) => c.trim()).map((c) => c.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(lines[i].split("|").filter((c) => c.trim()).map((c) => c.trim()));
        i++;
      }
      elements.push(
        <div key={key++} className="overflow-x-auto my-3">
          <table className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                {headerCells.map((cell, ci) => (
                  <th key={ci} className="px-3 py-2 text-left font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">{renderInline(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-slate-600 dark:text-slate-400">{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={key++} className="list-disc list-outside ml-6 space-y-1 my-2">
          {items.map((item, j) => <li key={j} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{renderInline(item)}</li>)}
        </ul>
      );
    } else if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={key++} className="list-decimal list-outside ml-6 space-y-1 my-2">
          {items.map((item, j) => <li key={j} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{renderInline(item)}</li>)}
        </ol>
      );
    } else if (line.trim() === "") {
      i++;
    } else {
      elements.push(<p key={key++} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{renderInline(line)}</p>);
      i++;
    }
  }
  return elements;
}

function renderInline(text) {
  const parts = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/\*(.+?)\*/);
    const firstBold = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity;
    const firstItalic = italicMatch ? remaining.indexOf(italicMatch[0]) : Infinity;
    if (firstBold <= firstItalic && boldMatch) {
      if (firstBold > 0) parts.push(<span key={key++}>{remaining.slice(0, firstBold)}</span>);
      parts.push(<strong key={key++} className="font-bold text-slate-900 dark:text-white">{boldMatch[1]}</strong>);
      remaining = remaining.slice(firstBold + boldMatch[0].length);
    } else if (italicMatch) {
      if (firstItalic > 0) parts.push(<span key={key++}>{remaining.slice(0, firstItalic)}</span>);
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(firstItalic + italicMatch[0].length);
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }
  return parts;
}

function groupModulesByWeek(modules, durationWeeks) {
  if (!modules?.length) return [];
  const weeks = durationWeeks || Math.ceil(modules.length / 2);
  const perWeek = Math.ceil(modules.length / weeks);
  const result = [];
  for (let w = 0; w < weeks; w++) {
    const start = w * perWeek;
    const weekMods = modules.slice(start, start + perWeek);
    if (weekMods.length > 0) result.push({ week: w + 1, modules: weekMods });
  }
  return result;
}

export default function CourseTab({ classroomState }) {
  const {
    classroom, announcements, forkedContent, isForkedContentLocked,
    handleToggleForkUnlock, handleUnforkContent, handleUpdateFork, isInstructor,
    showForkPanel, setShowForkPanel, browseResults, browseLoading,
    browseQuery, setBrowseQuery, browseType, setBrowseType,
    fetchBrowseContent, browseError, forking, handleForkContent, forkedIdSet,
    courseModules, courseGenLoading, handleGenerateCourseStructure, setCourseModules,
    handleGenerateModuleAssignments, expandedModule, setExpandedModule,
    openedWeeks, handleToggleWeek,
    completedLessons, toggleLessonComplete,
    setAnnouncements, setDiscussions, setForkedContent,
    materials, discussions, handleAttachMaterial, handleAttachDiscussion,
    inputCls, labelCls, sectionCls, setActiveTab,
    assignments, setSelectedAssignment, focusedDiscussionId, setFocusedDiscussionId,
    user,
  } = classroomState;

  const [editingFork, setEditingFork] = useState(null);
  const [expandedFork, setExpandedFork] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, title: "", message: "", onConfirm: null, confirmColor: "red" });
  const [quizData, setQuizData] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [syllabusLoading, setSyllabusLoading] = useState(false);
  const [editingSyllabus, setEditingSyllabus] = useState(false);
  const [syllabusDraft, setSyllabusDraft] = useState("");

  const fetchQuizContent = useCallback(async (contentId) => {
    setQuizLoading(true);
    try {
      const res = await apiClient.get(`/api/classrooms/${classroom.id}/quiz-content?contentId=${contentId}`);
      const data = await res.json();
      if (res.ok && data.questions) {
        setQuizData(data);
      } else {
        toast.error(data.error || "Failed to load quiz");
      }
    } catch {
      toast.error("Failed to load quiz");
    } finally {
      setQuizLoading(false);
    }
  }, [classroom.id]);

  const handleGenerateSyllabus = useCallback(async () => {
    const courseForks = (forkedContent || []).filter((fc) => fc.contentType === "course" && fc.meta?.modules?.length > 0);
    const hasModules = courseModules?.length > 0 || courseForks.length > 0;
    if (!hasModules) { toast.error("Generate course structure or fork a course first"); return; }
    setSyllabusLoading(true);
    try {
      const start = classroom.startDate ? new Date(classroom.startDate) : new Date();
      const weeks = classroom.durationWeeks || 12;
      const end = new Date(start.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
      const mid = new Date(start.getTime() + Math.floor(weeks / 2) * 7 * 24 * 60 * 60 * 1000);

      const modulesForSyllabus = courseForks.length > 0
        ? courseForks.flatMap((fc) => (fc.meta.modules || []).map((m) => ({ weekNumber: m.weekNumber, title: m.title, description: m.description })))
        : courseModules.map((m) => ({ weekNumber: m.weekNumber, title: m.title, description: m.description }));

      const res = await apiClient.post("/api/classrooms/ai-generate", {
        task: "syllabus_gen",
        name: classroom.name,
        subject: classroom.subject,
        content: classroom.description,
        durationWeeks: weeks,
        academicLevel: classroom.academicLevel,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        midtermDate: mid.toISOString(),
        instructorName: user?.name || "",
        instructorEmail: user?.email || "",
        officeHours: classroom.officeHours || "",
        modules: modulesForSyllabus,
        gradingScheme: classroom.gradingScheme || "percentage",
        schedule: classroom.schedule || {},
        prerequisites: classroom.prerequisites || [],
      });
      const data = await res.json();
      if (data.result) {
        await apiClient.patch(`/api/classrooms/${classroom.id}`, { syllabus: data.result });
        toast.success("Syllabus generated!");
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to generate syllabus");
      }
    } catch {
      toast.error("Failed to generate syllabus");
    } finally {
      setSyllabusLoading(false);
    }
  }, [classroom, courseModules, forkedContent, user]);

  const handleSaveSyllabus = useCallback(async () => {
    try {
      await apiClient.patch(`/api/classrooms/${classroom.id}`, { syllabus: syllabusDraft });
      toast.success("Syllabus saved");
      setEditingSyllabus(false);
      window.location.reload();
    } catch {
      toast.error("Failed to save syllabus");
    }
  }, [classroom.id, syllabusDraft]);

  const levelLabels = { highschool: "High School", undergraduate: "Undergraduate", graduate: "Graduate", phd: "PhD", professional: "Professional" };
  const gradingLabels = { percentage: "Percentage", letter: "Letter Grades", passfail: "Pass / Fail", gpa: "GPA Scale" };

  const scheduleDays = classroom.schedule?.days?.length
    ? classroom.schedule.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")
    : null;

  const maxWeeks = classroom.durationWeeks || 12;

  return (
    <>
    <div className="space-y-4">
      {!isInstructor && (
        <MyProgressWidget
          classroom={classroom}
          assignments={assignments}
          progress={classroomState.progress || []}
        />
      )}
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "var(--font-fraunces)" }}>{classroom.name}</h1>
              {classroom.subject && <p className="text-xs text-slate-500 dark:text-slate-400">{classroom.subject}</p>}
            </div>
          </div>
          {classroom.description && (
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2 w-full">{classroom.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            {classroom.academicLevel && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 text-[10px] font-semibold">
                <Award className="w-3 h-3" /> {levelLabels[classroom.academicLevel] || classroom.academicLevel}
              </span>
            )}
            {classroom.semester && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] font-semibold">
                <Calendar className="w-3 h-3" /> {classroom.semester}
              </span>
            )}
            {classroom.durationWeeks > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[10px] font-semibold">
                <Clock className="w-3 h-3" /> {classroom.durationWeeks} weeks
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Instructor Actions */}
      {isInstructor && (
        <div className="flex gap-2 flex-wrap">
          {(() => {
            const hasForkedCourse = (forkedContent || []).some((fc) => fc.contentType === "course" && fc.meta?.modules?.length > 0);
            return (
              <button
                onClick={() => setShowForkPanel(!showForkPanel)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  showForkPanel
                    ? "bg-green-500/15 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-600"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                <GitFork className="w-3.5 h-3.5" />
                {showForkPanel ? "Close" : hasForkedCourse ? "Fork More Content" : "Fork Course"}
              </button>
            );
          })()}
          {classroom.durationWeeks > 0 && !courseModules?.length && !(forkedContent || []).some((fc) => fc.contentType === "course" && fc.meta?.modules?.length > 0) && (
            <button
              onClick={handleGenerateCourseStructure}
              disabled={courseGenLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {courseGenLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Generate Structure
            </button>
          )}
        </div>
      )}
      {showForkPanel && <ForkContentPanel classroom={classroom} onClose={() => setShowForkPanel(false)} browseResults={browseResults} browseLoading={browseLoading} browseQuery={browseQuery} setBrowseQuery={setBrowseQuery} browseType={browseType} setBrowseType={setBrowseType} onBrowse={fetchBrowseContent} forking={forking} forkedIdSet={forkedIdSet} browseError={browseError} />}

      {/* Quick Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Schedule</h3>
          </div>
          {scheduleDays ? (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{scheduleDays}</p>
              {classroom.schedule?.startTime && classroom.schedule?.endTime && (
                <p className="text-xs text-slate-500">{classroom.schedule.startTime} – {classroom.schedule.endTime}</p>
              )}
              {classroom.schedule?.location && (
                <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {classroom.schedule.location}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No schedule set</p>
          )}
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grading</h3>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{gradingLabels[classroom.gradingScheme] || "Percentage"}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-purple-500" />
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</h3>
          </div>
          {classroom.startDate ? (
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {new Date(classroom.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                {classroom.durationWeeks > 0 && ` — ${classroom.durationWeeks} weeks`}
              </p>
            </div>
          ) : classroom.durationWeeks > 0 ? (
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{classroom.durationWeeks} weeks</p>
          ) : (
            <p className="text-xs text-slate-400 italic">Not set</p>
          )}
        </div>
      </div>

      {/* Prerequisites */}
      {classroom.prerequisites?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-orange-500" />
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prerequisites</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {classroom.prerequisites.map((prereq, i) => (
              <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-400 text-[10px] font-semibold">{prereq}</span>
            ))}
          </div>
        </div>
      )}

      {/* Syllabus */}
      {isInstructor && !classroom.syllabus && (courseModules?.length > 0 || (forkedContent || []).some((fc) => fc.contentType === "course" && fc.meta?.modules?.length > 0)) && (
        <button
          onClick={handleGenerateSyllabus}
          disabled={syllabusLoading}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-center gap-2 text-sm font-semibold text-teal-600 hover:border-teal-300 hover:bg-teal-50 dark:hover:bg-teal-500/5 transition-all disabled:opacity-50"
        >
          {syllabusLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {syllabusLoading ? "Generating Syllabus..." : "Generate Syllabus"}
        </button>
      )}
      {classroom.syllabus && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-500" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Syllabus</h3>
            </div>
            {isInstructor && (
              <div className="flex items-center gap-2">
                {editingSyllabus ? (
                  <>
                    <button onClick={handleSaveSyllabus} className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-semibold hover:bg-teal-600 transition-colors">
                      <Check className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => setEditingSyllabus(false)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setSyllabusDraft(classroom.syllabus); setEditingSyllabus(true); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Settings className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={handleGenerateSyllabus}
                      disabled={syllabusLoading}
                      className="flex items-center gap-1 px-3 py-1.5 bg-teal-100 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 rounded-lg text-xs font-semibold hover:bg-teal-200 dark:hover:bg-teal-500/25 transition-colors disabled:opacity-50"
                    >
                      {syllabusLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Regenerate
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {editingSyllabus ? (
            <textarea
              value={syllabusDraft}
              onChange={(e) => setSyllabusDraft(e.target.value)}
              rows={20}
              className="w-full text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-4 font-mono resize-y leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Syllabus content (markdown)..."
            />
          ) : (
            <div className="prose-sm max-w-none">{renderMarkdown(classroom.syllabus)}</div>
          )}
        </div>
      )}



      {/* Class Structure — AI-generated learning modules */}
      {(() => {
        const hasModules = courseModules?.length > 0;
        if (!hasModules && !isInstructor) return null;
        if (!hasModules) {
          if (showForkPanel) return null;
          return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
              <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">No class structure yet</p>
              <p className="text-xs text-slate-400 mb-4">Generate a structure with AI or fork a course from the library</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setShowForkPanel(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors">
                  <GitFork className="w-3.5 h-3.5" /> Fork Course
                </button>
                {classroom.durationWeeks > 0 && (
                  <button onClick={handleGenerateCourseStructure} disabled={courseGenLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors">
                    {courseGenLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Generate Structure
                  </button>
                )}
              </div>
              {!classroom.durationWeeks && <p className="text-[10px] text-slate-400 mt-2">Set course duration first in Settings</p>}
            </div>
          );
        }
        return (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Class Structure ({courseModules.length} weeks)
              </h4>
              {isInstructor && (
                <button onClick={handleGenerateCourseStructure} disabled={courseGenLoading} className="flex items-center gap-1 text-[10px] font-semibold text-green-600 hover:text-green-700 disabled:opacity-40 transition-colors">
                  {courseGenLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  {courseGenLoading ? "Generating..." : "Regenerate"}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {courseModules.map((mod, i) => (
                <ModuleCard
                  key={i}
                  mod={mod}
                  index={i}
                  classroomId={classroom.id}
                  isInstructor={isInstructor}
                  setCourseModules={setCourseModules}
                  setActiveTab={setActiveTab}
                  startDate={classroom.startDate}
                  weekAssignments={(assignments || []).filter((a) => a.weekNumber === mod.weekNumber)}
                  onOpenAssignment={(a) => { setSelectedAssignment(a); setActiveTab("assignments"); }}
                  onOpenDiscussion={(discId) => { setFocusedDiscussionId(discId); setActiveTab("discussions"); }}
                />
              ))}
            </div>
          </div>
        );
      })()}

      {/* Course Modules — forked courses, each under its own course name */}
      {(() => {
        const courseForks = (forkedContent || []).filter((fc) => fc.contentType === "course" && fc.meta?.modules?.length > 0);
        if (courseForks.length === 0) return null;

        return (
          <div className="space-y-4">
            {isInstructor && (
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <GitFork className="w-3.5 h-3.5 text-indigo-500" /> Course Modules ({courseForks.length} {courseForks.length === 1 ? "course" : "courses"})
                </h4>
                <button onClick={() => setShowForkPanel(true)} className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  <Plus className="w-3 h-3" /> Add More
                </button>
              </div>
            )}
            {courseForks.map((fc, forkIdx) => {
              const forkModules = (fc.meta?.modules || []).map((m) => ({ ...m, _contentId: fc.contentId }));
              const hiddenModules = (fc.meta?.hiddenModules || []).map((idx) => idx);
              const hiddenLessons = (fc.meta?.hiddenLessons || []).map((key) => key);
              return (
                <div key={forkIdx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{fc.title}</p>
                      {fc.description && <p className="text-[10px] text-slate-400 truncate">{fc.description}</p>}
                    </div>
                  </div>
                  <WeekGroupedCourse
                    modules={forkModules}
                    durationWeeks={classroom.durationWeeks}
                    courseId={fc.contentId}
                    courseName={fc.title}
                    courseTopic={classroom.subject || classroom.name}
                    difficulty={classroom.academicLevel || "intermediate"}
                    classroomId={classroom.id}
                    isInstructor={isInstructor}
                    hiddenModules={hiddenModules}
                    hiddenLessons={hiddenLessons}
                    forkEntry={fc}
                    onToggleHideModule={(modIdx) => {
                      const current = fc.meta?.hiddenModules || [];
                      const next = current.includes(modIdx) ? current.filter((i) => i !== modIdx) : [...current, modIdx];
                      handleUpdateFork(fc.contentType, fc.contentId, { hiddenModules: next });
                    }}
                    onToggleHideLesson={(lessonKey) => {
                      const current = fc.meta?.hiddenLessons || [];
                      const next = current.includes(lessonKey) ? current.filter((k) => k !== lessonKey) : [...current, lessonKey];
                      handleUpdateFork(fc.contentType, fc.contentId, { hiddenLessons: next });
                    }}
                    openedWeeks={openedWeeks}
                    handleToggleWeek={handleToggleWeek}
                    setConfirmModal={setConfirmModal}
                    completedLessons={completedLessons}
                    toggleLessonComplete={toggleLessonComplete}
                    setAnnouncements={setAnnouncements}
                    setDiscussions={setDiscussions}
                    forkedContent={forkedContent}
                    handleUpdateFork={handleUpdateFork}
                    setForkedContent={setForkedContent}
                    setActiveTab={setActiveTab}
                    startDate={classroom.startDate}
                    weekAssignments={assignments || []}
                    onOpenAssignment={(a) => { setSelectedAssignment(a); setActiveTab("assignments"); }}
                    onOpenDiscussion={(discId) => { setFocusedDiscussionId(discId); setActiveTab("discussions"); }}
                  />
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Materials — only if forked non-quiz content exists */}
      {(() => {
        const otherForks = (forkedContent || []).filter((fc) => fc.contentType !== "course" || !fc.meta?.modules?.length);
        const otherMaterialForks = otherForks.filter((fc) => !["quiz"].includes(fc.contentType));
        if (otherMaterialForks.length === 0) return null;

        const renderForkItem = (fc, i) => {
          const cfg = TYPE_CONFIG[fc.contentType] || TYPE_CONFIG._default;
          const Icon = cfg.icon;
          const locked = isInstructor ? !fc.unlocked : isForkedContentLocked?.(fc);
          const isEditing = editingFork === `${fc.contentType}-${fc.contentId}`;
          const isExpanded = expandedFork === `${fc.contentType}-${fc.contentId}`;
          return (
            <div key={i}>
              <div className="rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#E8E6DF] dark:bg-slate-700/50">
                  <button onClick={() => {
                    const key = `${fc.contentType}-${fc.contentId}`;
                    const next = expandedFork === key ? null : key;
                    setExpandedFork(next);
                    setQuizData(null);
                  }} className="flex items-center gap-3 flex-1 min-w-0 text-left group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{fc.title}</p>
                      {fc.description && <p className="text-[10px] text-slate-400 truncate">{fc.description}</p>}
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {fc.weekNumber > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 font-semibold">Week {fc.weekNumber}</span>}
                        {locked ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 font-semibold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Locked</span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 font-semibold flex items-center gap-0.5"><Unlock className="w-2.5 h-2.5" /> Active</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  </button>
                  {isInstructor && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button onClick={() => setEditingFork(isEditing ? null : `${fc.contentType}-${fc.contentId}`)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Settings">
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button onClick={() => setConfirmModal({ open: true, title: locked ? "Unlock Content" : "Lock Content", message: locked ? "Students will be able to access this content. Continue?" : "Students won't be able to access this content. Continue?", confirmColor: locked ? "blue" : "red", onConfirm: () => handleToggleForkUnlock(fc.contentType, fc.contentId) })} className={`p-1 rounded transition-colors ${locked ? "bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20" : "bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20"}`} title={locked ? "Unlock" : "Lock"}>
                        {locked ? <Lock className="w-3.5 h-3.5 text-red-500" /> : <Unlock className="w-3.5 h-3.5 text-green-500" />}
                      </button>
                      <button onClick={() => setConfirmModal({ open: true, title: "Remove Content", message: `Remove "${fc.title}" from this classroom? This cannot be undone.`, confirmColor: "red", onConfirm: () => handleUnforkContent(fc.contentType, fc.contentId, fc.title) })} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors" title="Remove">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {!isInstructor && locked && (
                    <Lock className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                  )}
                </div>
              </div>

              {isInstructor && isEditing && (
                <ForkEditPanel
                  fork={fc}
                  maxWeeks={maxWeeks}
                  onSave={(updates) => {
                    handleUpdateFork(fc.contentType, fc.contentId, updates);
                    setEditingFork(null);
                  }}
                  onCancel={() => setEditingFork(null)}
                />
              )}
            </div>
          );
        };

        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Materials ({otherMaterialForks.length})</h3>
              </div>
              {isInstructor && (
                <button onClick={() => setShowForkPanel(true)} className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  <Plus className="w-3 h-3" /> Add More
                </button>
              )}
            </div>
            <div className="space-y-2">
              {otherMaterialForks.map((fc, i) => renderForkItem(fc, i))}
            </div>
          </div>
        );
      })()}

      {/* Assignments — always visible, instructor can generate or fork */}
      {(() => {
        const examForks = (forkedContent || []).filter((fc) => fc.contentType === "quiz");

        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck className="w-4 h-4 text-purple-500" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assignments</h3>
            </div>

            {/* Existing assignments list */}
            {(() => {
              const allItems = [
                ...examForks.map((fc) => ({ ...fc, _source: "fork" })),
                ...(assignments || []).map((a) => ({ ...a, _source: "api", _id: a.id || a._id })),
              ].sort((a, b) => (a.weekNumber || 0) - (b.weekNumber || 0));

              if (allItems.length === 0) {
                return <p className="text-xs text-slate-400 italic text-center py-4">No assignments yet. Generate one above or fork from the library.</p>;
              }

              const grouped = {};
              allItems.forEach((item) => {
                const wk = item.weekNumber || 0;
                if (!grouped[wk]) grouped[wk] = [];
                grouped[wk].push(item);
              });
              const sortedWeeks = Object.keys(grouped).map(Number).sort((a, b) => a - b);

              return sortedWeeks.map((wk) => (
                <div key={wk} className="space-y-2 mb-3">
                  {sortedWeeks.length > 1 && (
                    <div className="flex items-center gap-2 px-1 pt-1">
                      <div className="w-5 h-5 rounded-md bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[8px] font-bold text-purple-600">{wk > 0 ? `W${wk}` : "—"}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{wk > 0 ? `Week ${wk}` : "Unassigned"}</span>
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    </div>
                  )}
                  {grouped[wk].map((item, i) => {
                    const isFork = item._source === "fork";
                    const itemType = isFork ? item.contentType : item.type;
                    const cfg = TYPE_CONFIG[itemType] || TYPE_CONFIG._default;
                    const Icon = cfg?.icon || FileText;
                    const locked = isFork ? (isInstructor ? !item.unlocked : isForkedContentLocked?.(item)) : false;
                    const isExpanded = isFork ? expandedFork === `${item.contentType}-${item.contentId}` : false;
                    const isDiscussion = itemType === "discussion" || item.meta?.discussionId;

                    return (
                      <div key={i}>
                        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#E8E6DF] dark:bg-slate-700/50 hover:bg-[#dedbd4] dark:hover:bg-slate-700/70 transition-colors">
                          <button onClick={() => {
                            if (isFork) {
                              const key = `${item.contentType}-${item.contentId}`;
                              setExpandedFork(expandedFork === key ? null : key);
                              setQuizData(null);
                              if (expandedFork !== key && item.contentType === "quiz") fetchQuizContent(item.contentId);
                            } else if (isDiscussion) {
                              setFocusedDiscussionId?.(item.meta?.discussionId);
                              setActiveTab?.("discussions");
                            } else {
                              setSelectedAssignment(item);
                              setActiveTab?.("assignments");
                            }
                          }} className="flex items-center gap-3 flex-1 min-w-0 text-left group">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color || "bg-slate-500/10"}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{item.title}</p>
                              {item.description && <p className="text-[10px] text-slate-400 truncate">{item.description}</p>}
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {item.weekNumber > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-semibold">Week {item.weekNumber}</span>}
                                {isFork && locked && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 font-semibold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Locked</span>}
                                {isFork && !locked && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 font-semibold flex items-center gap-0.5"><Unlock className="w-2.5 h-2.5" /> Active</span>}
                                {!isFork && item.maxScore > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-semibold">Max {item.maxScore} pts</span>}
                                {item.meta?.questionCount > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-semibold">{item.meta.questionCount} questions</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {isFork ? (isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />) : <ExternalLink className="w-3.5 h-3.5 text-slate-300" />}
                            </div>
                          </button>
                          {isFork && isInstructor && (
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <button onClick={() => setEditingFork(editingFork === `${item.contentType}-${item.contentId}` ? null : `${item.contentType}-${item.contentId}`)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Settings">
                                <Settings className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                              <button onClick={() => setConfirmModal({ open: true, title: "Remove Content", message: `Remove "${item.title}" from this classroom?`, confirmColor: "red", onConfirm: () => handleUnforkContent(item.contentType, item.contentId, item.title) })} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors" title="Remove">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          {!isFork && !isInstructor && (
                            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 flex-shrink-0">View <ExternalLink className="w-3 h-3" /></span>
                          )}
                        </div>
                        {isFork && isExpanded && item.contentType === "quiz" && (
                          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                            {quizLoading ? (
                              <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-purple-500" /></div>
                            ) : quizData?.questions?.length > 0 ? (
                              <QuizInterface topic={quizData.course || classroom.subject || classroom.name} quizData={quizData} onBack={() => { setExpandedFork(null); setQuizData(null); }} onQuizComplete={(results) => { if (results) toast.success(`Quiz completed! Score: ${results.score}%`); }} allowRetake={quizData.allowRetake !== false} allowReview={quizData.allowReview !== false} allowDownload={quizData.allowDownload !== false} />
                            ) : (
                              <p className="text-xs text-slate-400 text-center py-4">No questions available</p>
                            )}
                          </div>
                        )}
                        {isFork && isInstructor && editingFork === `${item.contentType}-${item.contentId}` && (
                          <ForkEditPanel fork={item} maxWeeks={maxWeeks} onSave={(updates) => { handleUpdateFork(item.contentType, item.contentId, updates); setEditingFork(null); }} onCancel={() => setEditingFork(null)} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        );
      })()}

      {/* Empty state for students */}
      {!isInstructor && (forkedContent || []).length === 0 && courseModules.length === 0 && (!announcements || announcements.length === 0) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">No content yet</p>
          <p className="text-xs text-slate-400">Your instructor hasn't posted any course content yet. Check back soon!</p>
        </div>
      )}

      {announcements?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Announcements</h3>
          </div>
          <div className="space-y-2">
            {announcements.slice(-3).reverse().map((ann, i) => (
              <div key={i} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{ann.title}</span>
                  {ann.createdAt && <span className="text-[10px] text-amber-600/50">{new Date(ann.createdAt).toLocaleDateString()}</span>}
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
    <ConfirmModal
      isOpen={confirmModal.open}
      onClose={() => setConfirmModal({ open: false, title: "", message: "", onConfirm: null, confirmColor: "red" })}
      onConfirm={confirmModal.onConfirm}
      title={confirmModal.title}
      message={confirmModal.message}
      confirmColor={confirmModal.confirmColor}
    />
    </>
  );
}

function ForkEditPanel({ fork, maxWeeks, onSave, onCancel }) {
  const [weekNumber, setWeekNumber] = useState(fork.weekNumber || 0);
  const [instructions, setInstructions] = useState(fork.instructions || "");
  const [availableFrom, setAvailableFrom] = useState(fork.availableFrom ? new Date(fork.availableFrom).toISOString().slice(0, 16) : "");
  const [availableUntil, setAvailableUntil] = useState(fork.availableUntil ? new Date(fork.availableUntil).toISOString().slice(0, 16) : "");
  const [allowRetake, setAllowRetake] = useState(fork.allowRetake !== false);
  const [allowReview, setAllowReview] = useState(fork.allowReview !== false);
  const [allowDownload, setAllowDownload] = useState(fork.allowDownload !== false);
  const isQuiz = fork.contentType === "quiz";

  const toggleCls = (on) => `relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"}`;
  const toggleDot = (on) => `inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`;

  return (
    <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Info className="w-3.5 h-3.5 text-indigo-500" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Content Settings</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Week Number</label>
          <select
            value={weekNumber}
            onChange={(e) => setWeekNumber(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
          >
            <option value={0}>Not assigned</option>
            {Array.from({ length: maxWeeks }, (_, i) => (
              <option key={i + 1} value={i + 1}>Week {i + 1}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Visible From</label>
          <input
            type="datetime-local"
            value={availableFrom}
            onChange={(e) => setAvailableFrom(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Visible Until</label>
          <input
            type="datetime-local"
            value={availableUntil}
            onChange={(e) => setAvailableUntil(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Instructions / Notes</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Add instructions for students..."
          rows={2}
          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 resize-none"
        />
      </div>
      {isQuiz && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student Permissions</p>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => setAllowRetake(!allowRetake)} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className={toggleCls(allowRetake)}><span className={toggleDot(allowRetake)} /></span>
              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Retake</span>
            </button>
            <button type="button" onClick={() => setAllowReview(!allowReview)} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className={toggleCls(allowReview)}><span className={toggleDot(allowReview)} /></span>
              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Review</span>
            </button>
            <button type="button" onClick={() => setAllowDownload(!allowDownload)} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className={toggleCls(allowDownload)}><span className={toggleDot(allowDownload)} /></span>
              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Download</span>
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
        <button onClick={() => onSave({ weekNumber, instructions, availableFrom: availableFrom || null, availableUntil: availableUntil || null, ...(isQuiz ? { allowRetake, allowReview, allowDownload } : {}) })} className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors">Save</button>
      </div>
    </div>
  );
}

function WeekGroupedCourse({
  modules, durationWeeks, courseId, courseName, courseTopic, difficulty, classroomId,
  isInstructor, hiddenModules, hiddenLessons, onToggleHideModule, onToggleHideLesson,
  openedWeeks, handleToggleWeek, setConfirmModal, completedLessons, toggleLessonComplete,
  setAnnouncements, setDiscussions, forkedContent,
  handleUpdateFork, setForkedContent, setActiveTab, startDate,
  weekAssignments, onOpenAssignment, onOpenDiscussion,
}) {
  const weekGroups = groupModulesByWeek(modules, durationWeeks);

  return (
    <div className="space-y-4 pt-4">
      {/* Course Modules header */}
      {modules?.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <Layers className="w-4 h-4 text-green-500" />
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Course Modules ({modules.length})</h3>
        </div>
      )}
      {weekGroups.map((wg) => {
        const isWeekOpen = (openedWeeks || []).includes(wg.week);
        const isOpen = isInstructor || isWeekOpen;
        return (
          <div key={wg.week} className="space-y-2.5">
            {/* Week Header */}
        <div className="flex items-center gap-2 px-1 mt-4">
              <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-indigo-600">W{wg.week}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Week {wg.week}</span>
              <span className="text-[9px] text-slate-400">{getWeekDates(wg.week, startDate) || ""}</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              {isInstructor && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleWeek(wg.week)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isWeekOpen ? "bg-green-500" : "bg-red-400 dark:bg-red-500"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isWeekOpen ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                  <span className={`text-[9px] font-semibold ${isWeekOpen ? "text-green-600" : "text-red-500"}`}>{isWeekOpen ? "Open" : "Closed"}</span>
                </div>
              )}
            </div>

            {/* Locked week message for students */}
            {!isInstructor && !isOpen && (
              <div className="ml-7 flex items-center gap-2 py-3 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-600">
                <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <p className="text-[10px] text-slate-500 font-medium">Week {wg.week} is not yet open. Your instructor will unlock it soon.</p>
              </div>
            )}

            {/* Modules in this week */}
            {isOpen && wg.modules.map((mod) => {
              const globalIdx = modules.indexOf(mod);
              const isHidden = hiddenModules.includes(globalIdx);
              return (
                <div key={globalIdx}>
                  <ForkedModuleCard
                    mod={mod}
                    modIndex={globalIdx}
                    courseId={courseId}
                    courseName={courseName}
                    courseTopic={courseTopic}
                    difficulty={difficulty}
                    classroomId={classroomId}
                    isInstructor={isInstructor}
                    isHidden={isHidden}
                    hiddenLessons={hiddenLessons}
                    onToggleHideModule={() => onToggleHideModule(globalIdx)}
                    onToggleHideLesson={onToggleHideLesson}
                    completedLessons={completedLessons}
                    toggleLessonComplete={toggleLessonComplete}
                  />
                </div>
              );
            })}
            {isOpen && weekAssignments && weekAssignments.filter((a) => a.weekNumber === wg.week).length > 0 && (
              <div className="ml-7 mt-1 space-y-1">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Week Assignments</p>
                {weekAssignments.filter((a) => a.weekNumber === wg.week).map((a) => {
                  const isQuiz = a.type === "quiz";
                  const isDiscussion = a.type === "discussion" || a.meta?.discussionId;
                  return (
                    <button key={a.id || a._id} onClick={() => {
                      if (isQuiz) onOpenAssignment?.(a);
                      else if (isDiscussion) onOpenDiscussion?.(a.meta?.discussionId);
                      else onOpenAssignment?.(a);
                    }} className="flex items-center gap-2 w-full py-1.5 px-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors text-left">
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${isQuiz ? "bg-purple-500/10" : isDiscussion ? "bg-blue-500/10" : "bg-amber-500/10"}`}>
                        {isQuiz ? <ClipboardCheck className="w-3 h-3 text-purple-500" /> : isDiscussion ? <MessageSquare className="w-3 h-3 text-blue-500" /> : <FileText className="w-3 h-3 text-amber-500" />}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate flex-1">{a.title}</span>
                      <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${isQuiz ? "bg-purple-500/10 text-purple-600" : isDiscussion ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"}`}>
                        {isQuiz ? "Quiz" : isDiscussion ? "Discussion" : "Assignment"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ForkedModuleCard({
  mod, modIndex, courseId, courseName, courseTopic, difficulty, classroomId,
  isInstructor, isHidden, hiddenLessons, onToggleHideModule, onToggleHideLesson,
  completedLessons, toggleLessonComplete,
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeLessonIdx, setActiveLessonIdx] = useState(null);
  const [lessonContent, setLessonContent] = useState("");
  const [contentChecked, setContentChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const typeColors = {
    lecture: "bg-blue-500/10 text-blue-600",
    lab: "bg-orange-500/10 text-orange-600",
    reading: "bg-teal-500/10 text-teal-600",
    video: "bg-purple-500/10 text-purple-600",
    activity: "bg-green-500/10 text-green-600",
  };

  const makeLessonKey = (li) => `${courseId}-${modIndex}-${li}`;

  const isLessonCompleted = (li) => (completedLessons || []).includes(makeLessonKey(li));

  const handleLessonClick = async (lesson, li) => {
    if (activeLessonIdx === li && contentChecked) {
      setActiveLessonIdx(null);
      setLessonContent("");
      setContentChecked(false);
      return;
    }
    setActiveLessonIdx(li);
    setLessonContent("");
    setContentChecked(false);
    setLoading(true);

    try {
      const res = await apiClient.get(
        `/api/classrooms/${classroomId}/lesson-content?contentId=${courseId}&moduleIdx=${modIndex}&lessonIdx=${li}`
      );
      const data = await res.json();
      setLessonContent(data.content || "");
      setContentChecked(true);

      if (!isInstructor && data.hasContent) {
        const key = makeLessonKey(li);
        if (!isLessonCompleted(li)) {
          toggleLessonComplete(key, true);
        }
      }
    } catch (_) {
      setLessonContent("");
      setContentChecked(true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLesson = (li) => {
    const key = `${modIndex}-${li}`;
    onToggleHideLesson(key);
  };

  const isLessonHidden = (li) => hiddenLessons.includes(`${modIndex}-${li}`);
  const visibleLessons = mod.lessons?.filter((_, li) => !isLessonHidden(li)) || [];
  const lessonCount = visibleLessons.length;
  const completedCount = mod.lessons?.filter((_, li) => isLessonCompleted(li)).length || 0;

  return (
    <div className={`rounded-lg overflow-hidden transition-opacity ${isHidden ? "opacity-40" : ""}`}>
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/50">
        {isInstructor && (
          <button onClick={onToggleHideModule} className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0" title={isHidden ? "Show module" : "Hide module"}>
            {isHidden ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
          </button>
        )}
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-green-600">{mod.weekNumber ? `W${mod.weekNumber}` : `M${modIndex + 1}`}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{mod.title}</p>
            {mod.description && <p className="text-[9px] text-slate-400 truncate">{mod.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {!isInstructor && completedCount > 0 && (
              <span className="text-[9px] font-medium text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-full">{completedCount}/{lessonCount}</span>
            )}
            <span className="text-[9px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{lessonCount} lessons</span>
            {expanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
          </div>
        </button>
      </div>
      {expanded && mod.lessons?.length > 0 && (
        <div className="pb-2.5 space-y-2 pt-2">
          {mod.lessons.map((lesson, li) => {
            const isActive = activeLessonIdx === li;
            const hidden = isLessonHidden(li);
            const completed = isLessonCompleted(li);
            return (
              <div key={li} className={hidden ? "opacity-30" : ""}>
                <div className="flex items-center gap-1">
                  {isInstructor && (
                    <button onClick={() => handleToggleLesson(li)} className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0" title={hidden ? "Show lesson" : "Hide lesson"}>
                      {hidden ? <EyeOff className="w-2.5 h-2.5 text-slate-400" /> : <Eye className="w-2.5 h-2.5 text-slate-400" />}
                    </button>
                  )}
                  <button
                    onClick={() => !hidden && handleLessonClick(lesson, li)}
                    disabled={hidden}
                    className={`flex items-center gap-2 flex-1 py-2 px-2 rounded-lg text-left transition-all ${
                      hidden ? "cursor-not-allowed" :
                      isActive
                        ? completed
                          ? "bg-green-500/10 ring-1 ring-green-500/30"
                          : "bg-[#EDECE8] dark:bg-slate-800 ring-1 ring-slate-300/50 dark:ring-slate-600/50"
                        : "bg-[#EDECE8] dark:bg-slate-800"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${completed ? "bg-green-500" : isActive ? "bg-green-500" : "bg-slate-200 dark:bg-slate-700"}`}>
                      {loading && isActive ? (
                        <Loader2 className="w-3 h-3 text-white animate-spin" />
                      ) : completed ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <span className={`text-[8px] font-bold ${isActive ? "text-white" : "text-slate-500"}`}>{li + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-semibold truncate ${isActive ? "text-green-700 dark:text-green-400" : "text-slate-900 dark:text-white"}`}>{lesson.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {lesson.type && <span className={`text-[8px] font-semibold px-1 py-0.5 rounded-full ${typeColors[lesson.type] || "bg-slate-500/10 text-slate-600"}`}>{lesson.type}</span>}
                        {lesson.duration && <span className="text-[8px] text-slate-400">{lesson.duration}min</span>}
                      </div>
                    </div>
                    {isActive && <ChevronUp className="w-3 h-3 text-green-500 flex-shrink-0" />}
                  </button>
                  {!isInstructor && !hidden && completed && (
                    <button
                      onClick={() => toggleLessonComplete(makeLessonKey(li), false)}
                      className="p-1 rounded hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors flex-shrink-0"
                      title="Mark incomplete"
                    >
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    </button>
                  )}
                  {!isInstructor && !hidden && !completed && contentChecked && isActive && lessonContent && (
                    <button
                      onClick={() => toggleLessonComplete(makeLessonKey(li), true)}
                      className="p-1 rounded hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors flex-shrink-0"
                      title="Mark complete"
                    >
                      <div className="w-3.5 h-3.5 rounded border-2 border-slate-300 dark:border-slate-600" />
                    </button>
                  )}
                  {hidden && <Lock className="w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0 ml-1" />}
                </div>

                {/* Lesson Content Area */}
                  {isActive && !hidden && (
                  <div className="mt-6 overflow-hidden bg-white dark:bg-slate-900">
                    {loading && !contentChecked ? (
                      <div className="py-6 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-700 dark:text-green-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs font-semibold">Loading lesson content...</span>
                        </div>
                      </div>
                    ) : contentChecked && lessonContent ? (
                      <div className="bg-white dark:bg-slate-900">
                        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none break-words leading-relaxed" style={{ "--tw-prose-body": "#1e293b", "--tw-prose-headings": "#0f172a" }}>
                          <div className="space-y-6" id="lesson-content-container">
                            {renderLessonBlocks(lessonContent, { LessonChart, LessonTable })}
                          </div>
                        </div>
                      </div>
                    ) : contentChecked ? (
                      <div className="py-4">
                        {isInstructor ? (
                          <div className="flex flex-col items-center gap-2 py-3 px-4 border border-amber-200/60 dark:border-amber-500/20">
                            <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-amber-600" />
                            </div>
                            <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 text-center">This lesson has no content yet.</p>
                            <a
                              href={`/dashboard/library?q=${encodeURIComponent(courseName)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-semibold hover:bg-amber-500/20 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" /> Go to Library to Generate
                            </a>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 py-3 px-4 border border-slate-200 dark:border-slate-700">
                            <Lock className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                            <p className="text-[10px] font-medium text-slate-400 text-center">Lesson content has not been added yet. Please check back later.</p>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {expanded && lessonCount === 0 && (
        <div className="px-2.5 pb-2.5">
          <p className="text-[9px] text-slate-400 italic py-1.5">No visible lessons</p>
        </div>
      )}
    </div>
  );
}

function getWeekDates(weekNumber, startDate) {
  if (!startDate || !weekNumber) return null;
  const start = new Date(startDate);
  const weekStart = new Date(start.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
}

function ModuleCard({ mod, index, classroomId, isInstructor, setCourseModules, setActiveTab, startDate, weekAssignments, onOpenAssignment, onOpenDiscussion }) {
  const [expanded, setExpanded] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [lessonContent, setLessonContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  const handleLessonClick = (li) => {
    if (activeLesson === li) {
      setActiveLesson(null);
      setLessonContent("");
      setEditing(false);
      return;
    }
    setActiveLesson(li);
    setLessonContent(mod.lessons[li].content || "");
    setEditing(false);
  };

  const handleGenerateContent = async (li) => {
    setGenerating(true);
    try {
      const res = await apiClient.post(`/api/classrooms/${classroomId}/module-lesson-content`, { moduleIdx: index, lessonIdx: li });
      const data = await res.json();
      if (res.ok && data.content) {
        setLessonContent(data.content);
        setCourseModules((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], lessons: [...next[index].lessons] };
          next[index].lessons[li] = { ...next[index].lessons[li], content: data.content };
          return next;
        });
        toast.success("Lesson content generated!");
      } else {
        toast.error(data.error || "Failed to generate");
      }
    } catch { toast.error("Failed to generate content"); }
    setGenerating(false);
  };

  const handleSaveEdit = async (li) => {
    try {
      const res = await apiClient.put(`/api/classrooms/${classroomId}/module-lesson-content`, { moduleIdx: index, lessonIdx: li, content: editContent });
      const data = await res.json();
      if (res.ok) {
        setLessonContent(editContent);
        setEditing(false);
        setCourseModules((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], lessons: [...next[index].lessons] };
          next[index].lessons[li] = { ...next[index].lessons[li], content: editContent };
          return next;
        });
        toast.success("Content saved!");
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch { toast.error("Failed to save"); }
  };

  return (
    <div className="overflow-hidden">
      <div className="flex items-center gap-3 w-full p-3 text-left bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors cursor-pointer group">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">W{mod.weekNumber}</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold text-white truncate text-left">{mod.title}</p>
            {mod.description && <p className="text-[10px] text-white/70 truncate text-left">{mod.description}</p>}
            <p className="text-[9px] text-white/60 mt-0.5">{getWeekDates(mod.weekNumber, startDate) || `Week ${mod.weekNumber}`}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[9px] font-medium text-white/80 bg-white/20 px-1.5 py-0.5 rounded-full">{mod.lessons?.length || 0} lessons</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-white/70" /> : <ChevronDown className="w-3.5 h-3.5 text-white/70" />}
          </div>
        </button>
      </div>
      {expanded && (
        <div className="pt-3 pb-3 space-y-1.5 border-t border-slate-100 dark:border-slate-800">
          {(mod.lessons || []).map((lesson, li) => {
            const isActive = activeLesson === li;
            const hasContent = !!lesson.content;
            return (
              <div key={li}>
                <button onClick={() => handleLessonClick(li)} className={`flex items-center gap-2.5 w-full py-2 px-3 rounded-lg transition-colors text-left ${isActive ? "bg-green-600 text-white" : "bg-green-600 text-white hover:bg-green-500"}`}>
                  <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-white">{li + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-white truncate">{lesson.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-white/20 text-white">lecture</span>
                      {lesson.duration && <span className="text-[9px] text-white/70">{lesson.duration}min</span>}
                      {hasContent && <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-white/20 text-white">Content</span>}
                    </div>
                  </div>
                  {isActive ? <ChevronUp className="w-3 h-3 text-white/70" /> : <ChevronDown className="w-3 h-3 text-white/70" />}
                </button>
                {isActive && (
                  <div className="mt-1 p-2 overflow-hidden bg-white dark:bg-slate-900">
                    {generating ? (
                      <div className="py-6 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-700 dark:text-green-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs font-semibold">Generating lesson content...</span>
                        </div>
                      </div>
                    ) : editing ? (
                      <div className="p-3 space-y-2">
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={12} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-mono resize-y focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => setEditing(false)} className="px-2.5 py-1 rounded text-[10px] font-semibold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">Cancel</button>
                          <button onClick={() => handleSaveEdit(li)} className="px-2.5 py-1 rounded bg-green-500 text-white text-[10px] font-semibold hover:bg-green-600">Save</button>
                        </div>
                      </div>
                    ) : hasContent ? (
                      <div className="bg-white dark:bg-slate-900 relative group">
                        {isInstructor && (
                          <button onClick={() => { setEditing(true); setEditContent(lessonContent); }} className="absolute top-2 right-2 p-1.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 dark:hover:bg-slate-700" title="Edit content">
                            <FileText className="w-3 h-3 text-slate-500" />
                          </button>
                        )}
                        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none break-words leading-relaxed" style={{ "--tw-prose-body": "#1e293b", "--tw-prose-headings": "#0f172a" }}>
                          <div className="space-y-6" id="lesson-content-container">
                            {renderLessonBlocks(lessonContent, { LessonChart, LessonTable })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 flex flex-col items-center gap-2">
                        {isInstructor ? (
                          <>
                            <FileText className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                            <p className="text-[10px] font-medium text-slate-400">No content yet</p>
                            <button onClick={() => handleGenerateContent(li)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 text-[10px] font-semibold hover:bg-green-500/20 transition-colors">
                              <Sparkles className="w-3 h-3" /> Generate with AI
                            </button>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                            <p className="text-[10px] font-medium text-slate-400">Content not available yet</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {weekAssignments && weekAssignments.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-1">Week Assignments</p>
              {weekAssignments.map((a) => {
                const isQuiz = a.type === "quiz";
                const isDiscussion = a.type === "discussion" || a.meta?.discussionId;
                return (
                  <button key={a.id || a._id} onClick={() => {
                    if (isQuiz) { onOpenAssignment?.(a); }
                    else if (isDiscussion) { onOpenDiscussion?.(a.meta?.discussionId); }
                    else { onOpenAssignment?.(a); }
                  }} className="flex items-center gap-2 w-full py-1.5 px-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors text-left mb-1">
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${isQuiz ? "bg-purple-500/10" : isDiscussion ? "bg-blue-500/10" : "bg-amber-500/10"}`}>
                      {isQuiz ? <ClipboardCheck className="w-3 h-3 text-purple-500" /> : isDiscussion ? <MessageSquare className="w-3 h-3 text-blue-500" /> : <FileText className="w-3 h-3 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate">{a.title}</p>
                    </div>
                    <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${isQuiz ? "bg-purple-500/10 text-purple-600" : isDiscussion ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"}`}>
                      {isQuiz ? "Quiz" : isDiscussion ? "Discussion" : "Assignment"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
