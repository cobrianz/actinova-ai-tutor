"use client";

import { useState } from "react";
import {
  BookOpen, Calendar, Clock, MapPin, GraduationCap, Layers, Megaphone,
  ChevronDown, ChevronUp, Target, FileText, Lock, Unlock, ExternalLink,
  Award, Sparkles, Loader2, Link2, Trash2, Plus,
} from "lucide-react";
import { TYPE_CONFIG } from "../constants";
import ForkContentPanel from "../ForkContentPanel";

export default function CourseTab({ classroomState }) {
  const {
    classroom, announcements, forkedContent, isForkedContentLocked,
    handleToggleForkUnlock, handleUnforkContent, isInstructor,
    showForkPanel, setShowForkPanel, browseResults, browseLoading,
    browseQuery, setBrowseQuery, browseType, setBrowseType,
    fetchBrowseContent, browseError, forking, handleForkContent, forkedIdSet,
    browseMyContent, setBrowseMyContent,
    courseModules, courseGenLoading, handleGenerateCourseStructure,
  } = classroomState;

  const [showForkSection, setShowForkSection] = useState(false);

  const levelLabels = { highschool: "High School", undergraduate: "Undergraduate", graduate: "Graduate", phd: "PhD", professional: "Professional" };
  const gradeLabels = { percentage: "Percentage (0–100%)", letter: "Letter Grades (A–F)", passfail: "Pass / Fail", gpa: "GPA Scale (0.0–4.0)" };

  const scheduleDays = classroom.schedule?.days?.length
    ? classroom.schedule.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")
    : null;

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10 p-6">
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
          browseMyContent={browseMyContent}
          setBrowseMyContent={setBrowseMyContent}
        />
      )}

      {/* Quick Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Schedule */}
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

        {/* Grading */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grading</h3>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{gradeLabels[classroom.gradingScheme] || "Percentage"}</p>
        </div>

        {/* Duration */}
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

      {/* Course Modules */}
      {courseModules?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-green-500" />
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course Modules ({courseModules.length})</h3>
          </div>
          <div className="space-y-2">
            {courseModules.map((mod, i) => (
              <ModuleCard key={i} mod={mod} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Forked Content */}
      {forkedContent?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Linked Content ({forkedContent.length})</h3>
            </div>
            {isInstructor && (
              <button
                onClick={() => setShowForkPanel(true)}
                className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add More
              </button>
            )}
          </div>
          <div className="space-y-2">
            {forkedContent.map((fc, i) => {
              const cfg = TYPE_CONFIG[fc.contentType] || TYPE_CONFIG.custom;
              const Icon = cfg.icon;
              const locked = isForkedContentLocked?.(fc);
              return (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{fc.title}</p>
                    {fc.description && <p className="text-[10px] text-slate-400 truncate">{fc.description}</p>}
                  </div>
                  {isInstructor && handleToggleForkUnlock && (
                    <button onClick={() => handleToggleForkUnlock(fc.contentType, fc.contentId)} className="flex-shrink-0 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      {locked ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : <Unlock className="w-3.5 h-3.5 text-green-500" />}
                    </button>
                  )}
                  {isInstructor && handleUnforkContent && (
                    <button onClick={() => handleUnforkContent(fc.contentType, fc.contentId, fc.title)} className="flex-shrink-0 p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Announcements */}
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
  );
}

function ModuleCard({ mod, index }) {
  const [expanded, setExpanded] = useState(false);
  const typeColors = {
    lecture: "bg-blue-500/10 text-blue-600",
    lab: "bg-orange-500/10 text-orange-600",
    reading: "bg-teal-500/10 text-teal-600",
    video: "bg-purple-500/10 text-purple-600",
    activity: "bg-green-500/10 text-green-600",
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-3 w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-green-600">W{mod.weekNumber}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{mod.title}</p>
          {mod.description && <p className="text-[10px] text-slate-400 truncate">{mod.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{mod.lessons?.length || 0} lessons</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-slate-100 dark:border-slate-800">
          {(mod.lessons || []).map((lesson, li) => (
            <div key={li} className="flex items-center gap-2.5 py-2 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-slate-500">{li + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">{lesson.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${typeColors[lesson.type] || "bg-slate-500/10 text-slate-600"}`}>{lesson.type}</span>
                  {lesson.duration && <span className="text-[9px] text-slate-400">{lesson.duration}min</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
