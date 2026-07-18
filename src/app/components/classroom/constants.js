import { BookOpen, FileText, CheckCircle2, Edit3, Layers, MessageSquare, Code, Presentation, Settings, Video, ExternalLink } from "lucide-react";

export const ASSIGNMENT_TYPES = [
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

export const MATERIAL_TYPES = [
  { value: "document", label: "Document", icon: FileText },
  { value: "video", label: "Video", icon: Video },
  { value: "link", label: "Link", icon: ExternalLink },
  { value: "slides", label: "Slides", icon: Presentation },
  { value: "code", label: "Code", icon: Code },
  { value: "other", label: "Other", icon: Layers },
];

export const TYPE_CONFIG = {
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

export const MATERIAL_ICON_MAP = {
  document: FileText, video: Video, link: ExternalLink,
  slides: Presentation, code: Code, other: Layers,
};

export const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const inputCls = "w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30";
export const labelCls = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block";
export const sectionCls = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4";
export const toggleCls = (on) => `relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"}`;
export const toggleDot = (on) => `inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${on ? "translate-x-4.5" : "translate-x-0.5"}`;

export function getDueStatus(dueDate) {
  if (!dueDate) return null;
  const now = new Date(); const due = new Date(dueDate); const hoursLeft = (due - now) / (1000 * 60 * 60);
  if (hoursLeft < 0) return { label: "Overdue", color: "text-red-500 bg-red-50 dark:bg-red-500/10" };
  if (hoursLeft < 24) return { label: `${Math.round(hoursLeft)}h left`, color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" };
  if (hoursLeft < 72) return { label: `${Math.round(hoursLeft / 24)}d left`, color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10" };
  return { label: `${Math.round(hoursLeft / 24)}d left`, color: "text-slate-500 bg-slate-50 dark:bg-slate-800" };
}

export function getWeeks(classroom, assignments, materials, discussions) {
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
}
