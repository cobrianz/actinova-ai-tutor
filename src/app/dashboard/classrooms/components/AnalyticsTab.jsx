"use client";

import { useEffect, useRef, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend } from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { Users, ClipboardList, TrendingUp, BarChart2, AlertTriangle, Target, GraduationCap, BookOpen } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend);

const chartColors = {
  green: { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,1)", solid: "rgba(34,197,94,0.8)" },
  blue: { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,1)", solid: "rgba(59,130,246,0.8)" },
  purple: { bg: "rgba(168,85,247,0.15)", border: "rgba(168,85,247,1)", solid: "rgba(168,85,247,0.8)" },
  amber: { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,1)", solid: "rgba(245,158,11,0.8)" },
  red: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,1)", solid: "rgba(239,68,68,0.8)" },
  teal: { bg: "rgba(20,184,166,0.15)", border: "rgba(20,184,166,1)", solid: "rgba(20,184,166,0.8)" },
  pink: { bg: "rgba(236,72,153,0.15)", border: "rgba(236,72,153,1)", solid: "rgba(236,72,153,0.8)" },
  orange: { bg: "rgba(249,115,22,0.15)", border: "rgba(249,115,22,1)", solid: "rgba(249,115,22,0.8)" },
};

const colorPalette = [chartColors.green, chartColors.blue, chartColors.purple, chartColors.amber, chartColors.teal, chartColors.pink, chartColors.orange, chartColors.red];

const cardCls = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5";

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-green-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-3xl opacity-20" style={{ background: color === "text-blue-500" ? "#3b82f6" : color === "text-green-500" ? "#22c55e" : color === "text-purple-500" ? "#a855f7" : "#f59e0b" }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-white" style={{ fontFamily: "var(--font-fraunces)" }}>{value}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default function AnalyticsTab({ classroomState }) {
  const { isInstructor, analytics, analyticsLoading, assignments } = classroomState;

  if (analyticsLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse">
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3" />
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 animate-pulse">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
              <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <EmptyState icon={TrendingUp} title="No analytics yet" description="Analytics will appear once students start engaging with assignments" />;
  }

  const overview = analytics.overview || {};
  const assignmentAnalytics = analytics.assignmentAnalytics || [];
  const engagement = analytics.engagementMetrics || {};
  const completionByType = engagement.completionByType || {};
  const atRisk = analytics.atRisk || [];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: "var(--font-fraunces)" }}>Analytics Overview</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Performance insights and student engagement data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Students" value={overview.totalStudents || classroomState?.students?.length || 0} sub={`${overview.activeStudents || 0} active this week`} icon={Users} color="text-blue-500" />
        <StatCard label="Assignments" value={overview.totalAssignments || assignments.length} sub={`${assignmentAnalytics.length} graded`} icon={ClipboardList} color="text-green-500" />
        <StatCard label="Avg Completion" value={`${overview.avgCompletionRate || 0}%`} sub="across all students" icon={Target} color="text-purple-500" />
        <StatCard label="Class Average" value={`${overview.avgScore || 0}%`} sub="average score" icon={GraduationCap} color="text-amber-500" />
      </div>

      {/* Feature Breakdown Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">{classroomState?.courseModules?.length || 0} Modules</p>
            <p className="text-[10px] text-muted-foreground">Course structure</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">{classroomState?.materials?.length || 0} Materials</p>
            <p className="text-[10px] text-muted-foreground">Attached resources</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
            <BarChart2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">{classroomState?.discussions?.length || 0} Discussions</p>
            <p className="text-[10px] text-muted-foreground">Active threads</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">{classroomState?.announcements?.length || 0} Announcements</p>
            <p className="text-[10px] text-muted-foreground">Posted notices</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Score Distribution */}
        {assignmentAnalytics.length > 0 && (
          <div className={cardCls}>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5" /> Assignment Scores</h4>
            <div className="h-56">
              <Bar
                data={{
                  labels: assignmentAnalytics.map((a) => a.title?.length > 12 ? a.title.slice(0, 12) + "..." : a.title),
                  datasets: [{
                    label: "Avg Score (%)",
                    data: assignmentAnalytics.map((a) => a.avgScore || 0),
                    backgroundColor: assignmentAnalytics.map((_, i) => colorPalette[i % colorPalette.length].solid),
                    borderColor: assignmentAnalytics.map((_, i) => colorPalette[i % colorPalette.length].border),
                    borderWidth: 1.5,
                    borderRadius: 6,
                    maxBarThickness: 40,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1e293b", titleFont: { size: 11 }, bodyFont: { size: 11 }, padding: 10, cornerRadius: 8 } },
                  scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: "rgba(148,163,184,0.08)" }, ticks: { font: { size: 10 }, color: "#94a3b8" } },
                    x: { grid: { display: false }, ticks: { font: { size: 9 }, color: "#94a3b8", maxRotation: 45 } },
                  },
                  animation: { duration: 800, easing: "easeOutQuart" },
                }}
              />
            </div>
          </div>
        )}

        {/* Completion by Type - Doughnut */}
        {Object.keys(completionByType).length > 0 && (
          <div className={cardCls}>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Completion by Type</h4>
            <div className="h-56 flex items-center justify-center">
              <Doughnut
                data={{
                  labels: Object.keys(completionByType).map((t) => t.charAt(0).toUpperCase() + t.slice(1)),
                  datasets: [{
                    data: Object.values(completionByType).map((d) => d.count || 0),
                    backgroundColor: Object.keys(completionByType).map((_, i) => colorPalette[i % colorPalette.length].solid),
                    borderColor: Object.keys(completionByType).map((_, i) => colorPalette[i % colorPalette.length].border),
                    borderWidth: 2,
                    hoverOffset: 8,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "65%",
                  plugins: {
                    legend: { position: "bottom", labels: { padding: 12, usePointStyle: true, pointStyleWidth: 8, font: { size: 10 } } },
                    tooltip: { backgroundColor: "#1e293b", titleFont: { size: 11 }, bodyFont: { size: 11 }, padding: 10, cornerRadius: 8 },
                  },
                  animation: { animateRotate: true, duration: 1000, easing: "easeOutQuart" },
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Trend Line Chart - simulated weekly trend from assignment data */}
      {assignmentAnalytics.length > 1 && (
        <div className={cardCls}>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Score Trends</h4>
          <div className="h-52">
            <Line
              data={{
                labels: assignmentAnalytics.map((a) => a.title?.length > 10 ? a.title.slice(0, 10) + "..." : a.title),
                datasets: [
                  {
                    label: "Average Score",
                    data: assignmentAnalytics.map((a) => a.avgScore || 0),
                    borderColor: chartColors.green.border,
                    backgroundColor: chartColors.green.bg,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: chartColors.green.border,
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                  },
                  {
                    label: "Completion Rate",
                    data: assignmentAnalytics.map((a) => a.completionRate || 0),
                    borderColor: chartColors.blue.border,
                    backgroundColor: chartColors.blue.bg,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: chartColors.blue.border,
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                  legend: { position: "top", align: "end", labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8, font: { size: 10 } } },
                  tooltip: { backgroundColor: "#1e293b", titleFont: { size: 11 }, bodyFont: { size: 11 }, padding: 10, cornerRadius: 8, mode: "index" },
                },
                scales: {
                  y: { beginAtZero: true, max: 100, grid: { color: "rgba(148,163,184,0.08)" }, ticks: { font: { size: 10 }, color: "#94a3b8" } },
                  x: { grid: { display: false }, ticks: { font: { size: 9 }, color: "#94a3b8" } },
                },
                animation: { duration: 1000, easing: "easeOutQuart" },
              }}
            />
          </div>
        </div>
      )}

      {/* Engagement Heatmap-style bars */}
      {assignmentAnalytics.length > 0 && (
        <div className={cardCls}>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Submission Activity</h4>
          <div className="space-y-3">
            {assignmentAnalytics.map((a, i) => {
              const c = colorPalette[i % colorPalette.length];
              const submissions = a.submissionCount || 0;
              const maxSubs = Math.max(...assignmentAnalytics.map((x) => x.submissionCount || 1));
              return (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{a.title}</span>
                    <span className="text-[10px] text-slate-400">{submissions} submissions · {a.avgScore ?? 0}% avg</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${(submissions / maxSubs) * 100}%`, background: `linear-gradient(90deg, ${c.border}, ${c.solid})` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* At-Risk Students */}
      {atRisk.length > 0 && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-5">
          <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> At-Risk Students ({atRisk.length})</h4>
          <div className="space-y-2">
            {atRisk.map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-lg p-3 border border-red-100 dark:border-red-500/10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm">{s.name?.charAt(0)?.toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{s.name}</p>
                  <p className="text-[10px] text-slate-400">{s.avgProgress}% avg progress</p>
                </div>
                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex-shrink-0">
                  <div className="h-full rounded-full bg-red-400" style={{ width: `${s.avgProgress || 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
