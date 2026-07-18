"use client";

import { BarChart2, FileText } from "lucide-react";

/**
 * @param {object} props.classroomState
 * @param {boolean} props.classroomState.isInstructor
 * @param {Array} props.classroomState.assignments
 * @param {Array} props.classroomState.grades
 * @param {boolean} props.classroomState.gradesLoading
 * @param {Function} props.classroomState.handleExportGrades
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

export default function GradesTab({ classroomState }) {
  const { isInstructor, assignments, grades, gradesLoading, handleExportGrades } = classroomState;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Grades</h3>
        {isInstructor && <button onClick={handleExportGrades} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"><FileText className="w-3.5 h-3.5" /> Export CSV</button>}
      </div>
      {gradesLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" /><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2" /></div>)}</div>
      ) : grades.length === 0 ? (
        <EmptyState icon={BarChart2} title="No grades yet" description="Grades will appear once students complete assignments" />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Student</th>
                  {assignments.slice(0, 6).map((a) => (
                    <th key={a.id} className="text-center px-3 py-3 font-bold text-slate-500 uppercase tracking-wider max-w-[100px] truncate" title={a.title}>{a.title}</th>
                  ))}
                  <th className="text-center px-3 py-3 font-bold text-green-600 uppercase tracking-wider">Avg</th>
                  <th className="text-center px-3 py-3 font-bold text-green-600 uppercase tracking-wider">Grade</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((student, i) => (
                  <tr key={student.id || i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">{student.name?.charAt(0)?.toUpperCase()}</div>
                        <div className="min-w-0"><p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{student.name}</p><p className="text-[10px] text-slate-400 truncate">{student.email}</p></div>
                      </div>
                    </td>
                    {assignments.slice(0, 6).map((a) => {
                      const g = student.grades?.[a.id];
                      const pct = g?.score != null && a.maxScore ? Math.round((g.score / a.maxScore) * 100) : null;
                      return (
                        <td key={a.id} className="text-center px-3 py-3">
                          {g?.score != null ? (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${pct >= 90 ? "bg-green-50 dark:bg-green-500/10 text-green-600" : pct >= 70 ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600" : pct >= 60 ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600" : "bg-red-50 dark:bg-red-500/10 text-red-600"}`}>{g.score}/{a.maxScore}</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center px-3 py-3"><span className="text-xs font-bold text-slate-900 dark:text-white">{student.weightedAverage ?? 0}%</span></td>
                    <td className="text-center px-3 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${student.letterGrade === "A" ? "bg-green-50 dark:bg-green-500/10 text-green-600" : student.letterGrade === "B" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600" : student.letterGrade === "C" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600" : "bg-red-50 dark:bg-red-500/10 text-red-600"}`}>{student.letterGrade || "—"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {assignments.length > 6 && <p className="text-[10px] text-slate-400 text-center py-2">Showing 6 of {assignments.length} assignments. Export CSV for full data.</p>}
        </div>
      )}
    </div>
  );
}
