"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QuizInterface from "@/components/QuizInterface";
import {
  BookOpen, Calendar, Clock, MapPin, GraduationCap, Layers, Megaphone,
  ChevronDown, ChevronUp, Target, FileText, Lock, Unlock, ExternalLink,
  Award, Sparkles, Loader2, Link2, Trash2, Plus, Settings, Info,
  Eye, EyeOff, MessageSquare, ClipboardList, ExternalLink as LinkIcon,
  Check, Paperclip,
} from "lucide-react";
import { TYPE_CONFIG } from "../constants";
import ForkContentPanel from "../ForkContentPanel";
import { renderLessonBlocks } from "@/lib/contentRenderer";
import LessonChart from "@/components/LessonChart";
import LessonTable from "@/components/LessonTable";
import ConfirmModal from "@/components/ConfirmModal";
import { apiClient } from "@/lib/csrfClient";
import { toast } from "sonner";

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
    assignments, setSelectedAssignment,
  } = classroomState;

  const [editingFork, setEditingFork] = useState(null);
  const [expandedFork, setExpandedFork] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, title: "", message: "", onConfirm: null, confirmColor: "red" });
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);

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

  const levelLabels = { highschool: "High School", undergraduate: "Undergraduate", graduate: "Graduate", phd: "PhD", professional: "Professional" };
  const gradeLabels = { percentage: "Percentage (0–100%)", letter: "Letter Grades (A–F)", passfail: "Pass / Fail", gpa: "GPA Scale (0.0–4.0)" };

  const scheduleDays = classroom.schedule?.days?.length
    ? classroom.schedule.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")
    : null;

  const maxWeeks = classroom.durationWeeks || 12;

  return (
    <>
    <div className="space-y-4">
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
          <button
            onClick={() => setShowForkPanel(!showForkPanel)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              showForkPanel
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-purple-300 hover:text-purple-600"
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            {showForkPanel ? "Close Fork" : "Fork Content"}
          </button>
          {classroom.durationWeeks > 0 && !courseModules?.length && (
            <button
              onClick={handleGenerateCourseStructure}
              disabled={courseGenLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-green-500/20"
            >
              {courseGenLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Generate Course Structure
            </button>
          )}
        </div>
      )}

      {/* Fork Panel */}
      {showForkPanel && isInstructor && (
        <ForkContentPanel
          classroom={classroom}
          onClose={() => setShowForkPanel(false)}
          onForkContent={handleForkContent}
          browseResults={browseResults}
          browseLoading={browseLoading}
          browseQuery={browseQuery}
          setBrowseQuery={setBrowseQuery}
          browseType={browseType}
          setBrowseType={setBrowseType}
          onBrowse={fetchBrowseContent}
          forking={forking}
          forkedIdSet={forkedIdSet}
          browseError={browseError}
        />
      )}

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
            <p className="text-xs text-slate-400 italic">Not set</p>
          )}
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grading</h3>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{gradeLabels[classroom.gradingScheme] || "Percentage"}</p>
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
              </p>
              {classroom.durationWeeks > 0 && (
                <p className="text-xs text-slate-500 mt-0.5">{classroom.durationWeeks} weeks</p>
              )}
            </div>
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
      {classroom.syllabus && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-teal-500" />
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Syllabus</h3>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{classroom.syllabus}</div>
        </div>
      )}



      {/* Forked Content */}
      {forkedContent?.length > 0 && (
        <div className="rounded-2xl">
          {isInstructor && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Content ({forkedContent.length})</h3>
              </div>
              <button
                onClick={() => setShowForkPanel(true)}
                className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add More
              </button>
            </div>
          )}
          <div className="space-y-4">
            {forkedContent.map((fc, i) => {
              const cfg = TYPE_CONFIG[fc.contentType] || TYPE_CONFIG.custom;
              const Icon = cfg.icon;
              const locked = isInstructor ? !fc.unlocked : isForkedContentLocked?.(fc);
              const isEditing = editingFork === `${fc.contentType}-${fc.contentId}`;
              const isExpanded = expandedFork === `${fc.contentType}-${fc.contentId}`;
              const hasModules = fc.contentType === "course" && fc.meta?.modules?.length > 0;
              return (
                <div key={i}>
                  <div className="rounded-lg overflow-hidden">
                    {/* Header row */}
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#E8E6DF] dark:bg-slate-700/50">
                      {hasModules ? (
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{fc.title}</p>
                            {fc.description && <p className="text-[10px] text-slate-400 truncate">{fc.description}</p>}
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {fc.weekNumber > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 font-semibold">Week {fc.weekNumber}</span>}
                              {locked ? (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 font-semibold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Locked</span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 font-semibold flex items-center gap-0.5"><Unlock className="w-2.5 h-2.5" /> Active</span>
                              )}
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-semibold">{fc.meta.modules.length} modules</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => {
                          const key = `${fc.contentType}-${fc.contentId}`;
                          const next = expandedFork === key ? null : key;
                          setExpandedFork(next);
                          setQuizData(null);
                          if (next && fc.contentType === "quiz") {
                            fetchQuizContent(fc.contentId);
                          }
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
                              {fc.meta?.questionCount > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-semibold">{fc.meta.questionCount} questions</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                          </div>
                        </button>
                      )}
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

                    {/* Expanded: inline quiz */}
                    {!hasModules && isExpanded && fc.contentType === "quiz" && (
                      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                        {quizLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                          </div>
                        ) : quizData?.questions?.length > 0 ? (
                          <QuizInterface
                            topic={quizData.course || classroom.subject || classroom.name}
                            quizData={quizData}
                            onBack={() => { setExpandedQuiz(null); setQuizData(null); }}
                            onQuizComplete={(results) => {
                              if (results) toast.success(`Quiz completed! Score: ${results.score}%`);
                            }}
                            allowRetake={quizData.allowRetake !== false}
                            allowReview={quizData.allowReview !== false}
                            allowDownload={quizData.allowDownload !== false}
                          />
                        ) : (
                          <p className="text-xs text-slate-400 text-center py-4">No questions available</p>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Instructor Edit Panel */}
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
            })}
          </div>
        </div>
      )}

      {/* Class Structure — merged modules from all course forks */}
      {(() => {
        const courseForks = (forkedContent || []).filter((fc) => fc.contentType === "course" && fc.meta?.modules?.length > 0);
        const modulesFromCourse = courseModules?.length > 0 ? courseModules : [];
        const allModules = [];
        for (const fc of courseForks) {
          for (const mod of fc.meta.modules) {
            allModules.push({ ...mod, _contentId: fc.contentId });
          }
        }
        if (allModules.length === 0 && modulesFromCourse.length > 0) {
          for (const mod of modulesFromCourse) {
            allModules.push({ ...mod, _contentId: null });
          }
        }
        const mergedHiddenModules = [];
        const mergedHiddenLessons = [];
        for (const fc of courseForks) {
          for (const idx of (fc.meta?.hiddenModules || [])) {
            mergedHiddenModules.push({ contentId: fc.contentId, idx });
          }
          for (const key of (fc.meta?.hiddenLessons || [])) {
            mergedHiddenLessons.push({ contentId: fc.contentId, key });
          }
        }
        const flatHiddenModules = mergedHiddenModules.map((h) => h.idx);
        const flatHiddenLessons = mergedHiddenLessons.map((h) => h.key);
        if (allModules.length > 0) {
          return (
            <div className="pt-4">
              {courseModules.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Class Structure ({courseModules.length} weeks)</h4>
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
                        setForkedContent={setForkedContent}
                        materials={materials}
                        discussions={discussions}
                        handleAttachMaterial={handleAttachMaterial}
                        handleAttachDiscussion={handleAttachDiscussion}
                        setActiveTab={setActiveTab}
                        handleGenerateModuleAssignments={handleGenerateModuleAssignments}
                        assignments={assignments}
                        setSelectedAssignment={setSelectedAssignment}
                      />
                    ))}
                  </div>
                </>
              )}
              <WeekGroupedCourse
                modules={allModules}
                durationWeeks={classroom.durationWeeks}
                courseId={courseForks.length === 1 ? courseForks[0].contentId : null}
                courseName={courseForks.length === 1 ? courseForks[0].title : classroom.name}
                courseTopic={classroom.subject || classroom.name}
                difficulty={classroom.academicLevel || "intermediate"}
                classroomId={classroom.id}
                isInstructor={isInstructor}
                hiddenModules={flatHiddenModules}
                hiddenLessons={flatHiddenLessons}
                forkEntry={courseForks.length === 1 ? courseForks[0] : null}
                onToggleHideModule={(modIdx) => {
                  const src = allModules[modIdx]?._contentId;
                  if (!src) return;
                  const fc = courseForks.find((f) => f.contentId === src);
                  if (!fc) return;
                  const current = fc.meta?.hiddenModules || [];
                  const next = current.includes(modIdx) ? current.filter((i) => i !== modIdx) : [...current, modIdx];
                  handleUpdateFork(fc.contentType, fc.contentId, { hiddenModules: next });
                }}
                onToggleHideLesson={(lessonKey) => {
                  const parts = lessonKey.split(":");
                  const modIdx = parseInt(parts[0], 10);
                  const src = allModules[modIdx]?._contentId;
                  if (!src) return;
                  const fc = courseForks.find((f) => f.contentId === src);
                  if (!fc) return;
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
                materials={materials}
                discussions={discussions}
                handleAttachMaterial={handleAttachMaterial}
                handleAttachDiscussion={handleAttachDiscussion}
                handleUpdateFork={handleUpdateFork}
                setForkedContent={setForkedContent}
                setActiveTab={setActiveTab}
              />
            </div>
          );
        }
        if (isInstructor) {
          return (
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Structure</h3>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">No course structure yet. Generate modules or fork a course to get started.</p>
                <button onClick={handleGenerateCourseStructure} disabled={courseGenLoading || !classroom.durationWeeks} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors">
                  {courseGenLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {courseGenLoading ? "Generating..." : "Generate Course Structure"}
                </button>
                {!classroom.durationWeeks && <p className="text-[10px] text-slate-400 mt-1.5">Set course duration first in Settings</p>}
              </div>
            </div>
          );
        }
        return null;
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
  setAnnouncements, setDiscussions, forkedContent, materials, discussions,
  handleAttachMaterial, handleAttachDiscussion,
  handleUpdateFork, setForkedContent, setActiveTab,
}) {
  const [addMenuWeek, setAddMenuWeek] = useState(null);
  const [attachTab, setAttachTab] = useState("quiz");
  const [attachLoading, setAttachLoading] = useState(null);
  const weekGroups = groupModulesByWeek(modules, durationWeeks);

  const handleAttachQuiz = async (fc, weekNumber) => {
    setAttachLoading(`${fc.contentId}`);
    try {
      handleUpdateFork(fc.contentType, fc.contentId, { weekNumber });
      toast.success(`"${fc.title}" attached to Week ${weekNumber}`);
      setAddMenuWeek(null);
    } catch { toast.error("Failed to attach quiz"); }
    setAttachLoading(null);
  };

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
                   <button
                    onClick={() => setAddMenuWeek(addMenuWeek === wg.week ? null : wg.week)}
                    className="flex items-center gap-1 text-[9px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <Paperclip className="w-2.5 h-2.5" /> Attach
                  </button>
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

            {/* Weekly Attach Dropdown */}
            {isInstructor && addMenuWeek === wg.week && (() => {
              const weekQuizzes = (forkedContent || []).filter((fc) => fc.contentType === "quiz" && (!fc.weekNumber || fc.weekNumber === 0));
              const weekMaterials = (materials || []).filter((m) => !m.weekNumber || m.weekNumber === 0);
              const weekDiscussions = (discussions || []).filter((d) => !d.weekNumber || d.weekNumber === 0);
              const tabs = [
                { id: "quiz", label: "Quizzes", icon: ClipboardList, count: weekQuizzes.length, active: "bg-purple-500/15 text-purple-700" },
                { id: "material", label: "Materials", icon: FileText, count: weekMaterials.length, active: "bg-green-500/15 text-green-700" },
                { id: "discussion", label: "Discussions", icon: MessageSquare, count: weekDiscussions.length, active: "bg-blue-500/15 text-blue-700" },
              ];
              return (
                <div className="ml-7 p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Attach to Week {wg.week}</p>
                  <div className="flex gap-1">
                    {tabs.map((t) => (
                      <button key={t.id} onClick={() => setAttachTab(attachTab === t.id ? null : t.id)} className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-[9px] font-semibold transition-colors ${attachTab === t.id ? t.active : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"}`}>
                        <t.icon className="w-2.5 h-2.5" /> {t.label}
                        {t.count > 0 && <span className="ml-0.5 px-1 py-0 rounded-full bg-slate-300/50 dark:bg-slate-600/50 text-[8px]">{t.count}</span>}
                      </button>
                    ))}
                  </div>
                  {attachTab === "quiz" && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {weekQuizzes.length === 0 ? (
                        <p className="text-[9px] text-slate-400 py-1">No unassigned quizzes</p>
                      ) : weekQuizzes.map((fc) => (
                        <button key={fc.contentId} onClick={() => handleAttachQuiz(fc, wg.week)} disabled={attachLoading === `${fc.contentId}`} className="flex items-center gap-2 w-full px-2 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors text-left disabled:opacity-50">
                          <ClipboardList className="w-3 h-3 text-purple-500 flex-shrink-0" />
                          <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-300 truncate flex-1">{fc.title}</span>
                          {attachLoading === `${fc.contentId}` ? <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-400" /> : <Plus className="w-2.5 h-2.5 text-slate-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                  {attachTab === "material" && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {weekMaterials.length === 0 ? (
                        <p className="text-[9px] text-slate-400 py-1">No unassigned materials</p>
                      ) : weekMaterials.map((mat) => (
                        <button key={mat._id || mat.id} onClick={() => { handleAttachMaterial(mat, wg.week); setAddMenuWeek(null); }} disabled={attachLoading === (mat._id || mat.id)} className="flex items-center gap-2 w-full px-2 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-500/50 transition-colors text-left disabled:opacity-50">
                          <FileText className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-300 truncate flex-1">{mat.title}</span>
                          {attachLoading === (mat._id || mat.id) ? <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-400" /> : <Plus className="w-2.5 h-2.5 text-slate-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                  {attachTab === "discussion" && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {weekDiscussions.length === 0 ? (
                        <p className="text-[9px] text-slate-400 py-1">No unassigned discussions</p>
                      ) : weekDiscussions.map((disc) => (
                        <button key={disc._id || disc.id} onClick={() => { handleAttachDiscussion(disc, wg.week); setAddMenuWeek(null); }} disabled={attachLoading === (disc._id || disc.id)} className="flex items-center gap-2 w-full px-2 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors text-left disabled:opacity-50">
                          <MessageSquare className="w-3 h-3 text-blue-500 flex-shrink-0" />
                          <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-300 truncate flex-1">{disc.title}</span>
                          {attachLoading === (disc._id || disc.id) ? <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-400" /> : <Plus className="w-2.5 h-2.5 text-slate-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

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

            {/* Attached materials & discussions for this week */}
            {isOpen && (() => {
              const weekMats = (materials || []).filter((m) => m.weekNumber === wg.week);
              const weekDiscs = (discussions || []).filter((d) => d.weekNumber === wg.week);
              if (weekMats.length === 0 && weekDiscs.length === 0) return null;
              return (
                <div className="ml-7 space-y-1.5">
                  {weekMats.map((mat) => (
                    <a key={mat._id || mat.id} href={mat.url || "#"} target={mat.url ? "_blank" : undefined} rel="noopener noreferrer" className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors group">
                      <FileText className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-[10px] font-semibold text-green-700 dark:text-green-300 truncate">{mat.title}</span>
                      {mat.url && <ExternalLink className="w-2.5 h-2.5 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
                    </a>
                  ))}
                  {weekDiscs.map((disc) => (
                    <button key={disc._id || disc.id} onClick={() => { setAnnouncements && setActiveTab && setActiveTab("discussions"); }} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors w-full text-left">
                      <MessageSquare className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 truncate">{disc.title}</span>
                    </button>
                  ))}
                </div>
              );
            })()}
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
                              href={`/dashboard?tab=library&q=${encodeURIComponent(courseName)}`}
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

function ModuleCard({ mod, index, classroomId, isInstructor, setCourseModules, setForkedContent, materials, discussions, handleAttachMaterial, handleAttachDiscussion, setActiveTab, handleGenerateModuleAssignments, assignments, setSelectedAssignment }) {
  const [expanded, setExpanded] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [lessonContent, setLessonContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showAssignmentType, setShowAssignmentType] = useState(false);
  const [generatingAssignments, setGeneratingAssignments] = useState(false);

  const typeColors = {
    lecture: "bg-blue-500/10 text-blue-600",
    lab: "bg-orange-500/10 text-orange-600",
    reading: "bg-teal-500/10 text-teal-600",
    video: "bg-purple-500/10 text-purple-600",
    activity: "bg-green-500/10 text-green-600",
  };

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

  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const res = await apiClient.post(`/api/classrooms/${classroomId}/module-quiz`, { moduleIdx: index });
      const data = await res.json();
      if (res.ok && data.quiz) {
        setForkedContent?.((prev) => [...prev, {
          contentType: "quiz",
          contentId: data.quiz._id,
          title: data.quiz.title,
          description: `Auto-generated quiz for ${mod.title}`,
          weekNumber: mod.weekNumber || 0,
          unlocked: true,
          meta: { course: mod.title, questionCount: data.quiz.questionCount },
        }]);
        toast.success(`Quiz generated: ${data.quiz.questionCount} questions`);
      } else {
        toast.error(data.error || "Failed to generate quiz");
      }
    } catch { toast.error("Failed to generate quiz"); }
    setGeneratingQuiz(false);
  };

  const hasQuiz = false;

  return (
    <div className="overflow-hidden">
      <div className="flex items-center gap-3 w-full p-3 text-left bg-blue-50 dark:bg-blue-950/50">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-green-600">W{mod.weekNumber}</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate text-left">{mod.title}</p>
            {mod.description && <p className="text-[10px] text-slate-400 truncate text-left">{mod.description}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[9px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{mod.lessons?.length || 0} lessons</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </div>
        </button>
        {isInstructor && (
          <div className="flex items-center gap-1 flex-shrink-0 relative">
            <button onClick={handleGenerateQuiz} disabled={generatingQuiz} className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-semibold bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors disabled:opacity-50" title="Generate quiz from module">
              {generatingQuiz ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <ClipboardList className="w-2.5 h-2.5" />}
              <span className="hidden sm:inline">Quiz</span>
            </button>
            <button onClick={() => setShowAttach(!showAttach)} className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-semibold bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors" title="Attach materials or discussions">
              <Paperclip className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">Attach</span>
            </button>
            <AnimatePresence>
              {showAttach && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-2 max-h-60 overflow-y-auto">
                  {materials?.filter((m) => !m.weekNumber || m.weekNumber === 0).length > 0 && (
                    <div className="mb-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Materials</p>
                      {materials.filter((m) => !m.weekNumber || m.weekNumber === 0).map((m) => (
                        <button key={m._id || m.id} onClick={() => { handleAttachMaterial?.(m._id || m.id, mod.weekNumber); setShowAttach(false); }} className="w-full text-left px-2 py-1.5 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 truncate transition-colors">{m.title}</button>
                      ))}
                    </div>
                  )}
                  {discussions?.filter((d) => !d.weekNumber || d.weekNumber === 0).length > 0 && (
                    <div className="mb-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Discussions</p>
                      {discussions.filter((d) => !d.weekNumber || d.weekNumber === 0).map((d) => (
                        <button key={d._id || d.id} onClick={() => { handleAttachDiscussion?.(d._id || d.id, mod.weekNumber); setShowAttach(false); }} className="w-full text-left px-2 py-1.5 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 truncate transition-colors">{d.title}</button>
                      ))}
                    </div>
                  )}
                  {(!materials?.filter((m) => !m.weekNumber || m.weekNumber === 0).length && !discussions?.filter((d) => !d.weekNumber || d.weekNumber === 0).length) && (
                    <p className="text-[10px] text-slate-400 text-center py-2">No unassigned items to attach</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      {expanded && (
        <div className="pt-3 pb-3 space-y-1.5 border-t border-slate-100 dark:border-slate-800">
          {(mod.lessons || []).map((lesson, li) => {
            const isActive = activeLesson === li;
            const hasContent = !!lesson.content;
            return (
              <div key={li}>
                <button onClick={() => handleLessonClick(li)} className={`flex items-center gap-2.5 w-full py-2 px-3 transition-colors text-left ${isActive ? "bg-green-500/10 dark:bg-green-500/10" : "bg-[#E8E6DF] dark:bg-slate-800/50 hover:bg-[#dddbd4] dark:hover:bg-slate-800"}`}>
                  <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-slate-500">{li + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">{lesson.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${typeColors[lesson.type] || "bg-slate-500/10 text-slate-600"}`}>{lesson.type}</span>
                      {lesson.duration && <span className="text-[9px] text-slate-400">{lesson.duration}min</span>}
                      {hasContent && <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600">Content</span>}
                    </div>
                  </div>
                  {isActive ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
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
        </div>
      )}
      {expanded && (() => {
        const moduleAssignments = (assignments || []).filter((a) => (a.weekNumber || 0) === mod.weekNumber);
        if (moduleAssignments.length === 0) return null;
        return (
          <div className="px-3 pt-1 pb-2 space-y-1.5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assignments</p>
            {moduleAssignments.map((a) => (
              <button key={a.id || a._id} onClick={() => { setSelectedAssignment?.(a); setActiveTab?.("assignments"); }} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer transition-colors w-full text-left">
                <ClipboardList className="w-3 h-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 truncate">{a.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] capitalize text-amber-500">{a.type}</span>
                    {a.maxScore && <span className="text-[8px] text-amber-400">/{a.maxScore}pts</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        );
      })()}
      {expanded && isInstructor && (mod.lessons?.length || 0) > 0 && (
        <div className="px-3 pb-3 mt-1">
          {generatingAssignments ? (
            <div className="flex items-center justify-center gap-2 py-3 bg-green-50 dark:bg-green-500/10 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-green-600" />
              <span className="text-[11px] font-bold text-green-600 dark:text-green-400">Generating assignments...</span>
            </div>
          ) : showAssignmentType ? (
            <div className="flex items-center justify-center gap-1.5 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
              <span className="text-[9px] font-semibold text-slate-500 mr-1">Type:</span>
              {["quiz", "assignment", "discussion"].map((t) => (
                <button key={t} onClick={async () => { setGeneratingAssignments(true); setShowAssignmentType(false); try { await handleGenerateModuleAssignments?.({ ...mod, assignmentType: t }); } finally { setGeneratingAssignments(false); } }} className="px-2 py-1 rounded-md text-[9px] font-semibold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors capitalize">{t}</button>
              ))}
              <button onClick={() => setShowAssignmentType(false)} className="ml-auto text-[9px] text-slate-400 hover:text-slate-600">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowAssignmentType(true)} className="flex items-center justify-center gap-1.5 w-full py-2 text-[11px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20 cursor-pointer transition-all duration-300">
              <svg className="w-3 h-3 animate-[spin_3s_linear_infinite]" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="currentColor" />
              </svg>
              Generate Assignment
            </button>
          )}
        </div>
      )}
      {(() => {
        const weekMats = (materials || []).filter((m) => m.weekNumber === mod.weekNumber && mod.weekNumber > 0);
        const weekDiscs = (discussions || []).filter((d) => d.weekNumber === mod.weekNumber && mod.weekNumber > 0);
        if (weekMats.length === 0 && weekDiscs.length === 0) return null;
        return (
          <div className="px-3 pt-3 pb-3 space-y-1.5">
            {weekMats.map((mat) => (
              <a key={mat._id || mat.id} href={mat.url || "#"} target={mat.url ? "_blank" : undefined} rel="noopener noreferrer" className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors group">
                <FileText className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-[10px] font-semibold text-green-700 dark:text-green-300 truncate">{mat.title}</span>
                {mat.url && <ExternalLink className="w-2.5 h-2.5 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
              </a>
            ))}
            {weekDiscs.map((disc) => (
              <button key={disc._id || disc.id} onClick={() => { setActiveTab && setActiveTab("discussions"); }} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors w-full text-left">
                <MessageSquare className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 truncate">{disc.title}</span>
              </button>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
