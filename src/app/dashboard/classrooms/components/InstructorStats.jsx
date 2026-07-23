"use client";

import { Users, TrendingUp, BarChart2 } from "lucide-react";
import { useClassroomContext } from "./ClassroomContext";

export default function InstructorStats() {
  const { isInstructor, activeTab, studentStats, classroom } = useClassroomContext();

  if (!isInstructor || (activeTab !== "assignments" && activeTab !== "calendar")) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Students", value: studentStats.totalStudents || classroom.studentCount, icon: Users, color: "text-blue-500" },
        { label: "Active", value: studentStats.activeStudents, icon: TrendingUp, color: "text-green-500" },
        { label: "Avg Progress", value: `${studentStats.avgCompletion || 0}%`, icon: BarChart2, color: "text-purple-500" },
      ].map(({ label, value, icon: Icon, color }, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            <span className="text-[10px] font-medium text-slate-500 uppercase">{label}</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      ))}
    </div>
  );
}
