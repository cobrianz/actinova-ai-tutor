"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, ListOrdered, CheckCircle2, Check, Play, Edit3, Eye, Send, Loader2, MessageSquare, Save } from "lucide-react";
import { TYPE_CONFIG } from "./constants";
import { apiClient } from "@/lib/csrfClient";
import AssignmentEditor from "./AssignmentEditor";

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
  const [instructorComment, setInstructorComment] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
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
    } catch (err) { console.error("AssignmentDetailPanel:handleSubmit", err); } finally {
      setSubmitting(false);
    }
  };

  const handleStartQuiz = async () => {
    setQuizLoading(true);
    try {
      const res = await apiClient.post(`/api/classrooms/${classroomId}/ai-generate`, {
        task: "course_assignments",
        name: assignment.title,
        subject: assignment.category,
        content: assignment.instructions,
        durationWeeks: assignment.weekNumber || 1,
        classroomName: "",
        assignmentType: "quiz",
      });
      const data = await res.json();
      if (data.result && data.result[0]?.rubric) {
        const questions = (data.result[0].rubric || []).map((r, i) => ({
          id: i,
          text: r.criterion,
          description: r.description,
          points: r.maxPoints || 10,
        }));
        setQuizQuestions(questions);
      }
    } catch (err) { console.error("Quiz generation failed:", err); }
    setQuizLoading(false);
  };

  const handleQuizSubmit = async () => {
    setSubmitting(true);
    let score = 0;
    let total = 0;
    if (quizQuestions) {
      quizQuestions.forEach((q) => {
        total += q.points;
        if (quizAnswers[q.id]) score += q.points;
      });
    }
    const percentage = total > 0 ? Math.round((score / total) * assignment.maxScore) : 0;
    setQuizScore({ score: percentage, total: assignment.maxScore });
    setQuizSubmitted(true);
    try {
      const res = await apiClient.post(`/api/classrooms/${classroomId}/submissions`, {
        assignmentId: assignment.id,
        text: `Quiz completed. Score: ${percentage}/${assignment.maxScore}`,
      });
      const data = await res.json();
      if (data.success && onSubmit) onSubmit(data.progress);
    } catch (err) { console.error("Quiz submit failed:", err); }
    setSubmitting(false);
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

          {isInstructor && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Student Comment</p>
              </div>
              <textarea
                value={instructorComment}
                onChange={(e) => setInstructorComment(e.target.value)}
                placeholder="Add a comment for the student to see..."
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <button
                onClick={async () => {
                  if (!instructorComment.trim()) return;
                  setSavingComment(true);
                  try {
                    await apiClient.put(`/api/classrooms/${classroomId}/progress`, {
                      assignmentId: assignment.id,
                      studentId: progress?.studentId,
                      feedback: instructorComment,
                    });
                  } catch (err) { console.error(err); }
                  setSavingComment(false);
                }}
                disabled={savingComment || !instructorComment.trim()}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {savingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save Comment
              </button>
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
              {quizSubmitted && quizScore ? (
                <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-green-700 dark:text-green-400">Quiz Complete!</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-300 mt-1">{quizScore.score}/{quizScore.total}</p>
                </div>
              ) : quizQuestions ? (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quiz Questions ({quizQuestions.length})</p>
                  {quizQuestions.map((q, i) => (
                    <div key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2">{i + 1}. {q.text}</p>
                      {q.description && <p className="text-[10px] text-slate-500 mb-2">{q.description}</p>}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-400">Points:</span>
                        <span className="text-[9px] font-bold text-green-600">{q.points}</span>
                      </div>
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!quizAnswers[q.id]}
                          onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.id]: e.target.checked })}
                          className="rounded border-slate-300 text-green-500 focus:ring-green-500"
                        />
                        <span className="text-[10px] text-slate-600 dark:text-slate-400">I understand this concept</span>
                      </label>
                    </div>
                  ))}
                  <button
                    onClick={handleQuizSubmit}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {submitting ? "Submitting..." : "Submit Quiz"}
                  </button>
                </div>
              ) : progress?.status === "completed" && !isSubmitted ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600"><CheckCircle2 className="w-4 h-4" /> Assignment Completed</span>
              ) : progress?.status === "in_progress" || (!progress && assignment.type !== "quiz") ? (
                <>
                  {!isSubmitted && assignment.type === "quiz" ? (
                    <button
                      onClick={handleStartQuiz}
                      disabled={quizLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      {quizLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      {quizLoading ? "Generating Quiz..." : "Start Quiz"}
                    </button>
                  ) : !isSubmitted ? (
                    <div className="space-y-3">
                      <AssignmentEditor
                        value={text}
                        onChange={setText}
                        placeholder="Type your submission here..."
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
                  ) : (
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
