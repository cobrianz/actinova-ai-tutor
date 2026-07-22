"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ArrowLeft, ArrowRight, Layers, ClipboardList,
  Loader2, Sparkles, BookOpen, ChevronUp, ChevronDown, Lock,
  Unlock, Trash2, CheckCircle2, Tag, Calendar, Check, Play, FileText,
} from "lucide-react";
import { TYPE_CONFIG } from "../constants";
import EmptyState from "../EmptyState";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/csrfClient";

function SubmissionsView({ assignment, classroomId }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [gradeInputs, setGradeInputs] = useState({});
  const [feedbackInputs, setFeedbackInputs] = useState({});
  const [gradingId, setGradingId] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get(`/api/classrooms/${classroomId}/assignments/${assignment.id}`);
        const data = await res.json();
        if (data.success && data.assignment?.studentProgress) setSubmissions(data.assignment.studentProgress);
      } catch (err) { console.error("SubmissionsView fetch:", err); } finally { setLoading(false); }
    };
    fetch();
  }, [classroomId, assignment.id]);

  const handleGrade = async (studentId) => {
    const score = gradeInputs[studentId];
    const feedback = feedbackInputs[studentId] || "";
    if (score === undefined || score === "") return;
    setGradingId(studentId);
    try {
      const res = await apiClient.put(`/api/classrooms/${classroomId}/progress`, {
        assignmentId: assignment.id,
        studentId,
        score: Number(score),
        feedback,
      });
      const data = await res.json();
      if (data.success) {
        setSubmissions((prev) => prev.map((s) => s.id === studentId ? { ...s, score: Number(score), feedback } : s));
      }
    } catch (err) { console.error("handleGrade:", err); } finally { setGradingId(null); }
  };

  const tc = TYPE_CONFIG[assignment.type] || TYPE_CONFIG._default;
  const TypeIcon = tc.icon;

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-lg ${tc.color} flex items-center justify-center`}><TypeIcon className="w-4 h-4" /></div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{assignment.title}</h3>
            <p className="text-[10px] text-slate-400">{submissions.length} submission{submissions.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>
      {submissions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No submissions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map((s) => {
            const isExpanded = expandedId === s.id;
            return (
              <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button onClick={() => setExpandedId(isExpanded ? null : s.id)} className="flex items-center gap-3 p-3 w-full text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-green-600">{(s.studentName || "S").charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{s.studentName || "Student"}</p>
                    <p className="text-[10px] text-slate-400">{s.studentEmail}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      s.status === "completed" ? "bg-green-500/10 text-green-600" :
                      s.status === "in_progress" ? "bg-amber-500/10 text-amber-600" :
                      "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}>{s.status === "completed" ? "Submitted" : s.status === "in_progress" ? "In Progress" : "Not Started"}</span>
                    {s.score != null && <p className="text-[10px] font-bold text-slate-900 dark:text-white mt-0.5">{s.score}/{assignment.maxScore}</p>}
                  </div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-3 pb-3 space-y-3 border-t border-slate-100 dark:border-slate-800">
                        {s.submissionText && (
                          <div className="mt-3">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Submission Text</p>
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{s.submissionText}</p>
                            </div>
                          </div>
                        )}
                        {s.submissionFiles?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Submitted Files</p>
                            <div className="space-y-1.5">
                              {s.submissionFiles.map((f, i) => (
                                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                                  <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                  <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{f.name}</span>
                                  <span className="text-[9px] text-slate-400 flex-shrink-0">{(f.size / 1024).toFixed(0)}KB</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Score (/{assignment.maxScore})</label>
                              <input
                                type="number"
                                min={0}
                                max={assignment.maxScore}
                                value={gradeInputs[s.id] ?? s.score ?? ""}
                                onChange={(e) => setGradeInputs((prev) => ({ ...prev, [s.id]: e.target.value }))}
                                className="w-full mt-1 px-2 py-1.5 bg-white dark:bg-slate-900 border border-green-200 dark:border-green-500/30 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Feedback</label>
                            <textarea
                              value={feedbackInputs[s.id] ?? s.feedback ?? ""}
                              onChange={(e) => setFeedbackInputs((prev) => ({ ...prev, [s.id]: e.target.value }))}
                              placeholder="Provide feedback..."
                              rows={2}
                              className="w-full mt-1 px-2 py-1.5 bg-white dark:bg-slate-900 border border-green-200 dark:border-green-500/30 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30"
                            />
                          </div>
                          <button
                            onClick={() => handleGrade(s.id)}
                            disabled={gradingId === s.id || (gradeInputs[s.id] ?? s.score ?? "") === ""}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-[10px] font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
                          >
                            {gradingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            {gradingId === s.id ? "Saving..." : "Save Grade"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * @param {object} props.classroomState
 * @param {object|null} props.classroomState.selectedAssignment
 * @param {Function} props.classroomState.setSelectedAssignment
 * @param {boolean} props.classroomState.isInstructor
 * @param {object} props.classroomState.classroom
 * @param {Array} props.classroomState.assignments
 * @param {Function} props.classroomState.setAssignments
 * @param {Function} props.classroomState.handleStartAssignment
 * @param {Function} props.classroomState.handleMarkComplete
 * @param {boolean} props.classroomState.showCreateAssignment
 * @param {Function} props.classroomState.setShowCreateAssignment
 * @param {boolean} props.classroomState.showForkPanel
 * @param {Function} props.classroomState.setShowForkPanel
 * @param {boolean} props.classroomState.showNewAnnouncement
 * @param {Function} props.classroomState.setShowNewAnnouncement
 * @param {boolean} props.classroomState.showInvite
 * @param {Function} props.classroomState.setShowInvite
 * @param {Array} props.classroomState.courseModules
 * @param {boolean} props.classroomState.courseGenLoading
 * @param {Function} props.classroomState.handleGenerateCourseStructure
 * @param {Function} props.classroomState.handleGenerateModuleAssignments
 * @param {number|null} props.classroomState.expandedModule
 * @param {Function} props.classroomState.setExpandedModule
 * @param {Array} props.classroomState.forkedContent
 * @param {Function} props.classroomState.isForkedContentLocked
 * @param {Function} props.classroomState.handleToggleForkUnlock
 * @param {Function} props.classroomState.handleUnforkContent
 * @param {Function} props.classroomState.handleForkContent
 * @param {Function} props.classroomState.getDueStatus
 * @param {string} props.classroomState.newAnnTitle
 * @param {Function} props.classroomState.setNewAnnTitle
 * @param {string} props.classroomState.newAnnContent
 * @param {Function} props.classroomState.setNewAnnContent
 * @param {Function} props.classroomState.handlePostAnnouncement
 * @param {object} props.classroomState.assignmentForm
 * @param {object} props.classroomState.studentStats
 * @param {string} props.classroomState.inputCls
 * @param {string} props.classroomState.labelCls
 * @param {string} props.classroomState.sectionCls
 */
export default function AssignmentsTab({ classroomState }) {
  const {
    selectedAssignment, setSelectedAssignment, editingAssignment, setEditingAssignment,
    submissionsAssignment, setSubmissionsAssignment,
    isInstructor, classroom,
    assignments, setAssignments, handleStartAssignment, handleMarkComplete,
    handleEditAssignment, handleViewSubmissions, handleAssignmentSaved, handleSubmitAssignment,
    showCreateAssignment, setShowCreateAssignment, showForkPanel, setShowForkPanel,
    showNewAnnouncement, setShowNewAnnouncement, showInvite, setShowInvite,
    courseModules, courseGenLoading, handleGenerateCourseStructure,
    handleGenerateModuleAssignments, expandedModule, setExpandedModule,
    forkedContent, isForkedContentLocked, handleToggleForkUnlock,
    handleUnforkContent, handleForkContent, getDueStatus,
    newAnnTitle, setNewAnnTitle, newAnnContent, setNewAnnContent,
    handlePostAnnouncement, assignmentForm, studentStats,
    CreateAssignmentPanel, AssignmentDetailPanel,
    inputCls, labelCls, sectionCls,
    materials, discussions, focusedDiscussionId, setFocusedDiscussionId, setActiveTab,
  } = classroomState;

  return (
    <div className="space-y-3">
      {submissionsAssignment ? (<>
        <button onClick={() => setSubmissionsAssignment(null)} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-[11px] font-medium transition-colors"><ArrowLeft size={14} /> Back to Assignments</button>
        <SubmissionsView assignment={submissionsAssignment} classroomId={classroom.id} />
      </>) : selectedAssignment ? (<>
        <button onClick={() => setSelectedAssignment(null)} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-[11px] font-medium transition-colors"><ArrowLeft size={14} /> Back to Assignments</button>
        <AssignmentDetailPanel
          assignment={selectedAssignment}
          isInstructor={isInstructor}
          classroomId={classroom.id}
          onBack={() => setSelectedAssignment(null)}
          onStart={() => handleStartAssignment(selectedAssignment.id)}
          onComplete={() => handleMarkComplete(selectedAssignment.id)}
          onEdit={() => handleEditAssignment(selectedAssignment)}
          onSubmissions={() => handleViewSubmissions(selectedAssignment)}
          onSubmit={handleSubmitAssignment}
          setActiveTab={setActiveTab}
          setFocusedDiscussionId={setFocusedDiscussionId}
        />
      </>) : (<>
        {isInstructor && !showCreateAssignment && (
          <div className="flex items-center gap-2">
            <button onClick={() => { setEditingAssignment(null); setShowCreateAssignment(true); }} className="flex items-center gap-2 flex-1 p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 hover:border-green-400 hover:text-green-600 transition-colors bg-white dark:bg-slate-900"><Plus className="w-4 h-4" /> Add Assignment</button>
          </div>
        )}
        {isInstructor && classroom.durationWeeks > 0 && courseModules.length === 0 && (
          <button onClick={handleGenerateCourseStructure} disabled={courseGenLoading} className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-purple-200 dark:border-purple-500/30 rounded-xl text-sm text-purple-600 hover:border-purple-400 transition-colors bg-white dark:bg-slate-900 disabled:opacity-50">
            {courseGenLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {courseGenLoading ? "Generating Course Structure..." : "Generate Full Course Structure with AI"}
          </button>
        )}
        {isInstructor && showCreateAssignment && (
          <CreateAssignmentPanel classroomId={classroom.id} classroomName={classroom.name} onClose={() => { setShowCreateAssignment(false); setEditingAssignment(null); }} onCreated={handleAssignmentSaved} initialForm={assignmentForm} editAssignment={editingAssignment} forkedContent={forkedContent || []} materials={materials || []} discussions={discussions || []} courseModules={courseModules || []} durationWeeks={classroom.durationWeeks || 12} />
        )}
        {assignments.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No assignments yet" description={isInstructor ? "Create your first assignment or generate a course structure with AI" : "No assignments have been posted yet"} action={isInstructor ? "Create Assignment" : undefined} onAction={() => setShowCreateAssignment(true)} />
        ) : <>
        {/* Forked Content */}
        {forkedContent.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Class Content ({forkedContent.length})</h4>
              {isInstructor && (
                <button onClick={() => setShowForkPanel(!showForkPanel)} className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  <Plus className="w-3 h-3" /> {showForkPanel ? "Close" : "Add"}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {forkedContent.map((fc, i) => {
                const isLocked = isForkedContentLocked(fc);
                const cfg = TYPE_CONFIG[fc.contentType] || TYPE_CONFIG._default;
                const TypeIcon = cfg.icon;
                const typeColor = cfg.color;
                return (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isLocked ? "bg-slate-50 dark:bg-slate-800/30 opacity-60" : "bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                    <div className={`w-8 h-8 rounded-lg ${typeColor} flex items-center justify-center flex-shrink-0`}>
                      {isLocked ? <Lock className="w-4 h-4" /> : <TypeIcon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{fc.title}</p>
                        {fc.weekNumber > 0 && <span className="text-[9px] font-medium text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-full">Week {fc.weekNumber}</span>}
                      </div>
                      {fc.description && <p className="text-[10px] text-slate-400 truncate">{fc.description}</p>}
                      {fc.instructions && <p className="text-[10px] text-slate-500 mt-0.5 italic">{fc.instructions}</p>}
                    </div>
                    {isLocked ? (
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 flex-shrink-0"><Lock className="w-3 h-3" /> Locked</span>
                    ) : isInstructor ? (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => handleToggleForkUnlock(fc.contentType, fc.contentId)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-green-500 transition-colors" title={fc.unlocked ? "Lock" : "Unlock"}>
                          {fc.unlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleUnforkContent(fc.contentType, fc.contentId, fc.title)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors" title="Remove">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-medium text-green-500 flex items-center gap-1 flex-shrink-0"><CheckCircle2 className="w-3 h-3" /> Available</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(() => {
          const grouped = {};
          assignments.forEach((a) => {
            const wk = a.weekNumber || 0;
            if (!grouped[wk]) grouped[wk] = [];
            grouped[wk].push(a);
          });
          const sortedWeeks = Object.keys(grouped).map(Number).sort((a, b) => a - b);
          return sortedWeeks.map((wk) => (
            <div key={wk} className="space-y-2">
              {sortedWeeks.length > 1 && (
                <div className="flex items-center gap-2 px-1 pt-1">
                  <div className="w-5 h-5 rounded-md bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] font-bold text-indigo-600">{wk > 0 ? `W${wk}` : "—"}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{wk > 0 ? `Week ${wk}` : "Unassigned"}</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                </div>
              )}
              {grouped[wk].map((assignment) => {
                const due = getDueStatus(assignment.dueDate); const tc = TYPE_CONFIG[assignment.type] || TYPE_CONFIG._default; const TypeIcon = tc.icon; const progress = assignment.myProgress;
                return (
                  <motion.div key={assignment.id} whileHover={{ y: -1 }} onClick={() => {
                    if (assignment.type === "discussion" && assignment.meta?.discussionId) {
                      setFocusedDiscussionId?.(assignment.meta.discussionId);
                      setActiveTab?.("discussions");
                    } else {
                      setSelectedAssignment(assignment);
                    }
                  }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-green-300 dark:hover:border-green-600 transition-colors cursor-pointer">
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
          ));
        })()}
      </>}
    </>)}
    </div>
  );
}
