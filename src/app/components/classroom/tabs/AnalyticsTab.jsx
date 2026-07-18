"use client";

import { Users, ClipboardList, TrendingUp, BarChart2, AlertTriangle } from "lucide-react";

const TYPE_CONFIG = {
  course: { icon: ClipboardList, color: "bg-blue-500/10 text-blue-600" },
  flashcards: { icon: ClipboardList, color: "bg-purple-500/10 text-purple-600" },
  quiz: { icon: ClipboardList, color: "bg-amber-500/10 text-amber-600" },
  report: { icon: ClipboardList, color: "bg-rose-500/10 text-rose-600" },
  essay: { icon: ClipboardList, color: "bg-pink-500/10 text-pink-600" },
  project: { icon: ClipboardList, color: "bg-indigo-500/10 text-indigo-600" },
  discussion: { icon: ClipboardList, color: "bg-teal-500/10 text-teal-600" },
  lab: { icon: ClipboardList, color: "bg-orange-500/10 text-orange-600" },
  presentation: { icon: ClipboardList, color: "bg-cyan-500/10 text-cyan-600" },
  custom: { icon: ClipboardList, color: "bg-slate-500/10 text-slate-600" },
};

/**
 * @param {object} props.classroomState
 * @param {boolean} props.classroomState.isInstructor
 * @param {object|null} props.classroomState.analytics
 * @param {boolean} props.classroomState.analyticsLoading
 * @param {Array} props.classroomState.assignments
 */
function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-green-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>
      {action && (
        <button onClick={onAction} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
          {action}
        </button>
      )}
    </div>
  );
}

export default function AnalyticsTab({ classroomState }) {
  const { isInstructor, analytics, analyticsLoading, assignments } = classroomState;

  return (
    <div className="space-y-4">
      {analyticsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4].map((i) => <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse"><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2" /><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" /></div>)}</div>
      ) : analytics ? (<>
        {/* Overview stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Students", value: analytics.overview?.totalStudents || 0, sub: `${analytics.overview?.activeStudents || 0} active`, icon: Users, color: "text-blue-500" },
            { label: "Assignments", value: analytics.overview?.totalAssignments || 0, sub: `${assignments.length} total`, icon: ClipboardList, color: "text-green-500" },
            { label: "Avg Completion", value: `${analytics.overview?.avgCompletionRate || 0}%`, sub: "across all students", icon: TrendingUp, color: "text-purple-500" },
            { label: "Avg Score", value: `${analytics.overview?.avgScore || 0}%`, sub: "class average", icon: BarChart2, color: "text-amber-500" },
          ].map(({ label, value, sub, icon: Icon, color }, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1"><Icon className={`w-3.5 h-3.5 ${color}`} /><span className="text-[10px] font-medium text-slate-500 uppercase">{label}</span></div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
              <p className="text-[10px] text-slate-400">{sub}</p>
            </div>
          ))}
        </div>

        {/* Assignment analytics */}
        {analytics.assignmentAnalytics?.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Assignment Performance</h4>
            <div className="space-y-2">
              {analytics.assignmentAnalytics.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{a.title}</span>
                      <span className="text-[9px] font-medium text-slate-400 capitalize">{a.type}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${a.completionRate || 0}%` }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{a.avgScore ?? 0}%</p>
                    <p className="text-[9px] text-slate-400">{a.submissionCount || 0} submits</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Engagement by type */}
        {analytics.engagementMetrics?.completionByType && Object.keys(analytics.engagementMetrics.completionByType).length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Completion by Type</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(analytics.engagementMetrics.completionByType).map(([type, data]) => {
                const tc = TYPE_CONFIG[type] || TYPE_CONFIG.custom; const TypeIcon = tc.icon;
                return (
                  <div key={type} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1"><TypeIcon className="w-3 h-3 text-slate-500" /><span className="text-[10px] font-semibold text-slate-500 capitalize">{type}</span></div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{data.avgScore ?? 0}%</p>
                    <p className="text-[9px] text-slate-400">{data.count || 0} assignments</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* At-risk students */}
        {analytics.atRisk?.length > 0 && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
            <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> At-Risk Students ({analytics.atRisk.length})</h4>
            <div className="space-y-2">
              {analytics.atRisk.map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-lg p-2">
                  <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-500 text-[10px] font-bold">{s.name?.charAt(0)?.toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{s.name}</p><p className="text-[10px] text-slate-400">{s.avgProgress}% avg progress</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>) : (
        <EmptyState icon={TrendingUp} title="No analytics yet" description="Analytics will appear once students start engaging with assignments" />
      )}
    </div>
  );
}
