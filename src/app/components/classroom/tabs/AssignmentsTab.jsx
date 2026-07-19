"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ArrowLeft, ArrowRight, X, Layers, ClipboardList, Megaphone,
  UserPlus, Loader2, Sparkles, BookOpen, ChevronUp, ChevronDown, Lock,
  Unlock, Trash2, CheckCircle2, Tag, Calendar, Check, Play, FileText,
} from "lucide-react";
import { TYPE_CONFIG } from "../constants";
import EmptyState from "../EmptyState";
import InvitePanel from "../InvitePanel";
import ForkContentPanel from "../ForkContentPanel";

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
    selectedAssignment, setSelectedAssignment, isInstructor, classroom,
    assignments, setAssignments, handleStartAssignment, handleMarkComplete,
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
  } = classroomState;

  return (
    <div className="space-y-3">
      {selectedAssignment ? (<>
        <button onClick={() => setSelectedAssignment(null)} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-[11px] font-medium transition-colors"><ArrowLeft size={14} /> Back to Assignments</button>
        <AssignmentDetailPanel
          assignment={selectedAssignment}
          isInstructor={isInstructor}
          classroomId={classroom.id}
          onBack={() => setSelectedAssignment(null)}
          onStart={() => handleStartAssignment(selectedAssignment.id)}
          onComplete={() => handleMarkComplete(selectedAssignment.id)}
        />
      </>) : (<>
        {isInstructor && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCreateAssignment(!showCreateAssignment)} className={`flex items-center gap-2 flex-1 p-3 border-2 border-dashed rounded-xl text-sm transition-colors bg-white dark:bg-slate-900 ${showCreateAssignment ? "border-green-400 text-green-600" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-green-400 hover:text-green-600"}`}><Plus className="w-4 h-4" /> {showCreateAssignment ? "Close Form" : "Add Assignment"}</button>
            <button onClick={() => setShowForkPanel(!showForkPanel)} className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl text-sm transition-colors bg-white dark:bg-slate-900 ${showForkPanel ? "border-purple-400 text-purple-600" : "border-purple-200 dark:border-purple-500/30 text-purple-600 hover:border-purple-400"}`}><Layers className="w-4 h-4" /> {showForkPanel ? "Close" : "Fork"}</button>
            <button onClick={() => setShowNewAnnouncement(!showNewAnnouncement)} className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-amber-200 dark:border-amber-500/30 rounded-xl text-sm text-amber-600 hover:border-amber-400 transition-colors bg-white dark:bg-slate-900"><Megaphone className="w-4 h-4" /> Announce</button>
            <button onClick={() => setShowInvite(!showInvite)} className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl text-sm transition-colors bg-white dark:bg-slate-900 ${showInvite ? "border-green-400 text-green-600" : "border-green-200 dark:border-green-500/30 text-green-600 hover:border-green-400"}`}><UserPlus className="w-4 h-4" /> {showInvite ? "Close" : "Invite"}</button>
          </div>
        )}
        {isInstructor && classroom.durationWeeks > 0 && courseModules.length === 0 && (
          <button onClick={handleGenerateCourseStructure} disabled={courseGenLoading} className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-purple-200 dark:border-purple-500/30 rounded-xl text-sm text-purple-600 hover:border-purple-400 transition-colors bg-white dark:bg-slate-900 disabled:opacity-50">
            {courseGenLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {courseGenLoading ? "Generating Course Structure..." : "Generate Full Course Structure with AI"}
          </button>
        )}
        {isInstructor && showInvite && (
          <InvitePanel classroom={classroom} onClose={() => setShowInvite(false)} />
        )}
        {isInstructor && showForkPanel && (
          <ForkContentPanel
            classroom={classroom}
            onClose={() => setShowForkPanel(false)}
            onForkContent={handleForkContent}
            browseResults={classroomState.browseResults}
            browseLoading={classroomState.browseLoading}
            browseQuery={classroomState.browseQuery}
            setBrowseQuery={classroomState.setBrowseQuery}
            browseType={classroomState.browseType}
            setBrowseType={classroomState.setBrowseType}
            onBrowse={classroomState.fetchBrowseContent}
            forking={classroomState.forking}
            forkedIdSet={classroomState.forkedIdSet}
            browseError={classroomState.browseError}
          />
        )}
        {isInstructor && showCreateAssignment && (
          <CreateAssignmentPanel classroomId={classroom.id} classroomName={classroom.name} onClose={() => setShowCreateAssignment(false)} onCreated={(a) => setAssignments([a, ...assignments])} initialForm={assignmentForm} />
        )}
        {isInstructor && showNewAnnouncement && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={sectionCls}>
            <div><label className={labelCls}>Title</label><input value={newAnnTitle} onChange={(e) => setNewAnnTitle(e.target.value)} placeholder="Announcement title" className={inputCls} /></div>
            <div><label className={labelCls}>Content</label><textarea value={newAnnContent} onChange={(e) => setNewAnnContent(e.target.value)} placeholder="What do you want to announce?" rows={3} className={inputCls + " resize-none"} /></div>
            <div className="flex gap-2"><button onClick={handlePostAnnouncement} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors">Post</button><button onClick={() => setShowNewAnnouncement(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button></div>
          </motion.div>
        )}
        {assignments.length === 0 && courseModules.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No assignments yet" description={isInstructor ? "Create your first assignment or generate a course structure with AI" : "No assignments have been posted yet"} action={isInstructor ? "Create Assignment" : undefined} onAction={() => setShowCreateAssignment(true)} />
        ) : <>
        {/* Course Structure (AI-generated modules) */}
        {isInstructor && courseModules.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Course Structure ({courseModules.length} modules)</h4>
              <button onClick={handleGenerateCourseStructure} disabled={courseGenLoading} className="flex items-center gap-1 text-[10px] font-semibold text-green-600 hover:text-green-700 disabled:opacity-40 transition-colors">
                {courseGenLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {courseGenLoading ? "Generating..." : "Regenerate"}
              </button>
            </div>
            <div className="space-y-2">
              {courseModules.map((mod, i) => (
                <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <button onClick={() => setExpandedModule(expandedModule === i ? null : i)} className="flex items-center gap-3 w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold text-green-600">W{mod.weekNumber}</span></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{mod.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{mod.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{mod.lessons?.length || 0} lessons</span>
                      {expandedModule === i ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedModule === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-3 pb-3 space-y-1.5 border-t border-slate-100 dark:border-slate-800">
                          {(mod.lessons || []).map((lesson, li) => (
                            <div key={li} className="flex items-center gap-2.5 py-2 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                              <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <span className="text-[9px] font-bold text-slate-500">{li + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">{lesson.title}</p>
                                <p className="text-[9px] text-slate-400">{lesson.type} · {lesson.duration}min</p>
                              </div>
                            </div>
                          ))}
                          <button onClick={() => handleGenerateModuleAssignments(mod)} disabled={courseGenLoading} className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 border border-dashed border-green-300 dark:border-green-600/30 rounded-lg text-[10px] font-semibold text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors disabled:opacity-40">
                            {courseGenLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                            {courseGenLoading ? "Generating..." : "Generate Assignments for This Week"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        )}

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
                const cfg = TYPE_CONFIG[fc.contentType] || TYPE_CONFIG.custom;
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

        {assignments.map((assignment) => {
          const due = getDueStatus(assignment.dueDate); const tc = TYPE_CONFIG[assignment.type] || TYPE_CONFIG.custom; const TypeIcon = tc.icon; const progress = assignment.myProgress;
          return (
            <motion.div key={assignment.id} whileHover={{ y: -1 }} onClick={() => setSelectedAssignment(assignment)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-green-300 dark:hover:border-green-600 transition-colors cursor-pointer">
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
      </>}
    </>)}
    </div>
  );
}
