"use client";

import { motion } from "framer-motion";
import { Search, X, Layers, BookOpen, CheckCircle2, FileText, Loader2 } from "lucide-react";

function ForkContentPanel({ classroom, onClose, onForkContent, browseResults, browseLoading, browseQuery, setBrowseQuery, browseType, setBrowseType, onBrowse, forking }) {
  const forkedIds = (classroom.forkedContent || []).map((fc) => `${fc.contentType}-${fc.contentId}`);
  const contentTypes = [
    { value: "all", label: "All", icon: Layers },
    { value: "course", label: "Courses", icon: BookOpen },
    { value: "quiz", label: "Quizzes", icon: CheckCircle2 },
    { value: "flashcard", label: "Flashcards", icon: FileText },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Layers className="w-4 h-4 text-purple-500" /> Fork Content to Classroom</h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={browseQuery} onChange={(e) => setBrowseQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onBrowse()} placeholder="Search courses, quizzes, flashcards..." className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30" />
        </div>
        <button onClick={onBrowse} disabled={browseLoading} className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors">{browseLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}</button>
      </div>
      <div className="flex gap-1.5">
        {contentTypes.map(({ value, label, icon: Icon }) => (
          <button key={value} onClick={() => { setBrowseType(value); onBrowse(); }} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${browseType === value ? "bg-purple-500/10 text-purple-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
            <Icon className="w-3 h-3" /> {label}
          </button>
        ))}
      </div>
      <div className="max-h-[400px] overflow-y-auto space-y-2" style={{ scrollbarWidth: "thin" }}>
        {browseLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="animate-pulse bg-slate-50 dark:bg-slate-800 rounded-lg p-3"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2" /><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/3" /></div>)}</div>
        ) : (
          <>
            {browseResults.courses?.map((c) => {
              const isForked = forkedIds.includes(`course-${c.id}`);
              return (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0"><BookOpen className="w-4 h-4 text-blue-500" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.title}</p>
                    <p className="text-[10px] text-slate-400">{c.totalModules || 0} modules · {c.totalLessons || 0} lessons · {c.level}</p>
                  </div>
                  <button onClick={() => onForkContent("course", c.id, c.title)} disabled={isForked || forking === c.id} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${isForked ? "bg-green-50 dark:bg-green-500/10 text-green-500 cursor-default" : "bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"}`}>
                    {isForked ? "Forked" : forking === c.id ? "..." : "Fork"}
                  </button>
                </div>
              );
            })}
            {browseResults.quizzes?.map((q) => {
              const isForked = forkedIds.includes(`quiz-${q.id}`);
              return (
                <div key={q.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-4 h-4 text-amber-500" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{q.title}</p>
                    <p className="text-[10px] text-slate-400">{q.questionCount} questions · {q.course}</p>
                  </div>
                  <button onClick={() => onForkContent("quiz", q.id, q.title)} disabled={isForked || forking === q.id} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${isForked ? "bg-green-50 dark:bg-green-500/10 text-green-500 cursor-default" : "bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"}`}>
                    {isForked ? "Forked" : forking === q.id ? "..." : "Fork"}
                  </button>
                </div>
              );
            })}
            {browseResults.flashcards?.map((fc) => {
              const isForked = forkedIds.includes(`flashcard-${fc.id}`);
              return (
                <div key={fc.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-purple-500" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{fc.title}</p>
                    <p className="text-[10px] text-slate-400">{fc.totalCards} cards · {fc.difficulty}</p>
                  </div>
                  <button onClick={() => onForkContent("flashcard", fc.id, fc.title)} disabled={isForked || forking === fc.id} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${isForked ? "bg-green-50 dark:bg-green-500/10 text-green-500 cursor-default" : "bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"}`}>
                    {isForked ? "Forked" : forking === fc.id ? "..." : "Fork"}
                  </button>
                </div>
              );
            })}
            {!browseLoading && browseResults.courses?.length === 0 && browseResults.quizzes?.length === 0 && browseResults.flashcards?.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No content found. Create courses, quizzes, or flashcards first to fork them here.</p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

export default ForkContentPanel;
