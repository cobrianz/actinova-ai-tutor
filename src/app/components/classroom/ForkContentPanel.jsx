"use client";

import { motion } from "framer-motion";
import { Search, X, BookOpen, Loader2 } from "lucide-react";

function ForkContentPanel({ classroom, onClose, onForkContent, browseResults, browseLoading, browseQuery, setBrowseQuery, onBrowse, forking }) {
  const forkedIds = (classroom.forkedContent || []).map((fc) => fc.contentId?.toString?.() || fc.contentId);

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-500" /> Fork a Course</h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-4 h-4" /></button>
      </div>
      <p className="text-[11px] text-slate-400 -mt-2">Import your own courses into this classroom for students to access.</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={browseQuery} onChange={(e) => setBrowseQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onBrowse()} placeholder="Search your courses..." className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
        <button onClick={onBrowse} disabled={browseLoading} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors">
          {browseLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
        </button>
      </div>
      <div className="max-h-[400px] overflow-y-auto space-y-2" style={{ scrollbarWidth: "thin" }}>
        {browseLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (browseResults.courses || []).length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            {browseQuery ? "No courses match your search." : "No courses found. Create a course first to fork it here."}
          </p>
        ) : (
          browseResults.courses.map((c) => {
            const isForked = forkedIds.includes(c.id);
            return (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.title}</p>
                  <p className="text-[10px] text-slate-400">{c.totalModules || 0} modules · {c.totalLessons || 0} lessons · {c.level}</p>
                </div>
                <button
                  onClick={() => onForkContent("course", c.id, c.title)}
                  disabled={isForked || forking === c.id}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                    isForked
                      ? "bg-green-50 dark:bg-green-500/10 text-green-500 cursor-default"
                      : "bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                  }`}
                >
                  {isForked ? "Forked" : forking === c.id ? "..." : "Fork"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

export default ForkContentPanel;
