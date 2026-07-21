"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, ListOrdered, CheckCircle2, Check, Play, Edit3, Eye, Send, Loader2 } from "lucide-react";
import { TYPE_CONFIG } from "./constants";
import { apiClient } from "@/lib/csrfClient";

function renderInstructions(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  const isSectionHeader = (line) => {
    const t = line.trim();
    if (!t || t.length > 80) return false;
    return /^(Objectives?|Requirements?|Submission Guidelines?|Grading Criteria?|Important Notes?|Overview|Description|Deliverables?|Summary|Conclusion|Instructions?|Guidelines?|Steps?|Prerequisites?|Resources?|Format|Content|Time Limit|Access|Deadline|Criteria|Expectations|Tasks?|Notes?|Policies?|References?):?\s*$/i.test(t);
  };

  while (i < lines.length) {
    const line = lines[i];

    if (/^#{1,3}\s+/.test(line)) {
      elements.push(<p key={i} className="font-bold text-slate-900 dark:text-white text-sm mt-3 first:mt-0 mb-1">{line.replace(/^#{1,3}\s+/, "")}</p>);
      i++;
    } else if (isSectionHeader(line)) {
      elements.push(<p key={i} className="font-bold text-slate-900 dark:text-white text-sm mt-3 first:mt-0 mb-1">{line.replace(/:$/, "")}</p>);
      i++;
    } else if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-outside ml-8 space-y-1 text-sm my-2">
          {items.map((item, j) => <li key={j} className="text-slate-700 dark:text-slate-300">{item}</li>)}
        </ul>
      );
    } else if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-outside ml-8 space-y-1 text-sm my-2">
          {items.map((item, j) => <li key={j} className="text-slate-700 dark:text-slate-300">{item}</li>)}
        </ol>
      );
    } else if (line.trim() === "") {
      i++;
    } else {
      elements.push(<p key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{line}</p>);
      i++;
    }
  }

  return elements;
}

export default function AssignmentDetailPanel({ assignment, isInstructor, classroomId, onBack, onStart, onComplete, onEdit, onSubmissions, onSubmit }) {
  const [showRubric, setShowRubric] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState("");
  const tc = TYPE_CONFIG[assignment.type] || TYPE_CONFIG.custom;
  const TypeIcon = tc.icon;

  const due = (() => {
    if (!assignment.dueDate) return null;
    const now = new Date(); const due = new Date(assignment.dueDate); const hoursLeft = (due - now) / (1000 * 60 * 60);
    if (hoursLeft < 0) return { label: "Overdue", color: "text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30" };
    if (hoursLeft < 24) return { label: `${Math.round(hoursLeft)}h left`, color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30" };
    if (hoursLeft < 72) return { label: `${Math.round(hoursLeft / 24)}d left`, color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30" };
    return { label: `${Math.round(hoursLeft / 24)}d left`, color: "text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" };
  })();

  const progress = assignment.myProgress;
  const isSubmitted = progress?.status === "completed" && progress?.submissionText;
  const totalRubricPoints = (assignment.rubric || []).reduce((sum, r) => sum + (r.maxPoints || 0), 0);

  const handleSubmit = async () => {
    if (!text) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/api/classrooms/${classroomId}/submissions`, {
        assignmentId: assignment.id,
        text,
      });
      const data = await res.json();
      if (data.success) {
        if (onSubmit) onSubmit(data.progress);
        setText("");
      }
    } catch {} finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl ${tc.color} flex items-center justify-center flex-shrink-0`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{assignment.title}</h3>
                {due && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${due.color}`}>{due.label}</span>}
              </div>
              {assignment.description && <p className="text-sm text-slate-500 mt-1">{assignment.description}</p>}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Type</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white capitalize">{assignment.type}</p>
            </div>
            {assignment.category && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Category</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{assignment.category}</p>
              </div>
            )}
            {assignment.dueDate && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Due Date</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{new Date(assignment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            )}
            {assignment.maxScore > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Max Score</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{assignment.maxScore} pts</p>
              </div>
            )}
          </div>

          {(assignment.availableFrom || assignment.availableUntil) && (
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Availability Window</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {assignment.availableFrom && new Date(assignment.availableFrom).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                {assignment.availableFrom && assignment.availableUntil && " — "}
                {assignment.availableUntil && new Date(assignment.availableUntil).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          )}

          {assignment.instructions && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Instructions</h4>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="space-y-1">{renderInstructions(assignment.instructions)}</div>
              </div>
            </div>
          )}

          {assignment.rubric && assignment.rubric.length > 0 && (
            <div>
              <button onClick={() => setShowRubric(!showRubric)} className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <ListOrdered className="w-3.5 h-3.5" /> Rubric ({totalRubricPoints} pts)
                {showRubric ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <AnimatePresence>
                {showRubric && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="space-y-2">
                      {assignment.rubric.map((r, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold text-green-600">{i + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{r.criterion}</p>
                            {r.description && <p className="text-[11px] text-slate-500 mt-0.5">{r.description}</p>}
                          </div>
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full flex-shrink-0">{r.maxPoints}pts</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {!isInstructor && progress && (
            <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-green-700 dark:text-green-400">Your Progress</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${progress.status === "completed" ? "bg-green-500 text-white" : progress.status === "in_progress" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                  {progress.status === "completed" ? "Completed" : progress.status === "in_progress" ? "In Progress" : "Not Started"}
                </span>
              </div>
              {progress.score != null && (
                <p className="text-sm font-bold text-green-700 dark:text-green-400 mb-1">Score: {progress.score}/{assignment.maxScore}</p>
              )}
              {progress.feedback && (
                <div className="mt-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-green-200 dark:border-green-500/20">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Instructor Feedback</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{progress.feedback}</p>
                </div>
              )}
            </div>
          )}

          {!isInstructor && isSubmitted && (
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your Submission</p>
              <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{progress.submissionText}</p>
              </div>
              {progress.submittedAt && (
                <p className="text-[10px] text-slate-400 mt-2">Submitted {new Date(progress.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          {!isInstructor ? (
            <div className="space-y-3">
              {progress?.status === "completed" && !isSubmitted ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600"><CheckCircle2 className="w-4 h-4" /> Assignment Completed</span>
              ) : progress?.status === "in_progress" || (!progress && assignment.type !== "quiz") ? (
                <>
                  {!isSubmitted && (
                    <div className="space-y-3">
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type your submission here..."
                        rows={6}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
                      />
                      <button
                        onClick={handleSubmit}
                        disabled={submitting || !text}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
                      >
                        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {submitting ? "Submitting..." : "Submit Assignment"}
                      </button>
                    </div>
                  )}
                  {isSubmitted && (
                    <button onClick={onComplete} className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors">
                      <Check className="w-4 h-4" /> Mark Complete
                    </button>
                  )}
                </>
              ) : (
                <button onClick={onStart} className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors">
                  <Play className="w-4 h-4" /> Start Assignment
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
              <button onClick={onSubmissions} className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><Eye className="w-3.5 h-3.5" /> Submissions</button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
