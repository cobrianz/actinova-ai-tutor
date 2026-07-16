"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Trophy, Brain, Flame, Zap, Clock,
  TrendingUp, BarChart3, ChevronRight, Target,
  Sparkles, ArrowRight,
} from "lucide-react";
import XPWidget from "./XPWidget";
import ActivityHeatmap from "./ActivityHeatmap";
import Leaderboard from "./Leaderboard";
import StudyGoals from "./StudyGoals";
import DateRangePicker from "./DateRangePicker";

export default function DashboardOverview() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: null, end: null, label: "All time" });

  useEffect(() => {
    fetchOverview();
  }, [dateRange]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.start) params.set("start", dateRange.start.toISOString());
      if (dateRange.end) params.set("end", dateRange.end.toISOString());
      const res = await fetch(`/api/analytics/overview?${params}`);
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error("Failed to fetch overview:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (!data) return (
    <div className="text-center py-12 text-muted-foreground">
      <p>Unable to load dashboard data.</p>
    </div>
  );

  const { summary, recentActivity = [], courseProgress = [], quizTrends = [], adaptiveInsights } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Analytics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Track your learning progress</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Courses"
          value={summary.completedCourses}
          sub={`${summary.totalCourses} enrolled`}
          iconColor="text-blue-500"
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          onClick={() => router.push("/dashboard?tab=library")}
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Avg Quiz Score"
          value={`${summary.averageQuizScore}%`}
          sub={`${summary.totalQuizzes} quizzes`}
          iconColor="text-violet-500"
          iconBg="bg-violet-50 dark:bg-violet-900/20"
          onClick={() => router.push("/dashboard?tab=quizzes")}
        />
        <StatCard
          icon={<Brain className="w-5 h-5" />}
          label="Cards Mastered"
          value={summary.masteredFlashcards}
          sub={`${summary.totalFlashcards} total`}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          onClick={() => router.push("/dashboard?tab=flashcards")}
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Study Streak"
          value={`${summary.streakCurrent}d`}
          sub={`Best: ${summary.streakLongest}d`}
          iconColor="text-orange-500"
          iconBg="bg-orange-50 dark:bg-orange-900/20"
        />
      </div>

      {/* Progress + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* XP + Goals */}
        <div className="lg:col-span-1 space-y-5">
          <SectionCard
            icon={<Zap className="w-4 h-4 text-amber-500" />}
            title="Your Progress"
            accent="amber"
          >
            <XPWidget />
          </SectionCard>
          <StudyGoals />
        </div>

        {/* Activity Heatmap */}
        <div className="lg:col-span-2">
          <SectionCard
            icon={<BarChart3 className="w-4 h-4 text-green-500" />}
            title="Activity"
            accent="green"
            className="h-full"
          >
            <ActivityHeatmap />
          </SectionCard>
        </div>
      </div>

      {/* Adaptive Insights */}
      {adaptiveInsights && (
        <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Adaptive Insights
            </h3>
            <div className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
              {adaptiveInsights.overallMasteryScore}% mastery
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
            <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-700/30 bg-white/70 dark:bg-white/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Next best action</p>
                <span className="text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  Suggested
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{adaptiveInsights.nextBestAction?.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{adaptiveInsights.nextBestAction?.description}</p>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-700/30 bg-white/70 dark:bg-white/5 p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Focus areas</p>
              <div className="space-y-2">
                {adaptiveInsights.focusAreas?.length > 0
                  ? adaptiveInsights.focusAreas.map((area, index) => (
                    <div key={`${area.title || "focus"}-${index}`} className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2">
                      <span className="text-xs font-medium text-foreground truncate">{area.title}</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{area.progress}%</span>
                    </div>
                  ))
                  : <p className="text-xs text-muted-foreground">No weak areas detected yet.</p>
                }
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {adaptiveInsights.recommendations?.slice(0, 3).map((item) => (
              <button
                key={item.title}
                onClick={() => router.push("/dashboard?tab=study-plans")}
                className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-white/10 border border-emerald-200 dark:border-emerald-700/40 px-3 py-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
              >
                <ArrowRight className="w-3 h-3" />
                {item.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Course Progress + Quiz Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Course Progress */}
        <SectionCard
          icon={<BookOpen className="w-4 h-4 text-blue-500" />}
          title="Course Progress"
          accent="blue"
          action={
            <button onClick={() => router.push("/dashboard?tab=library")} className="text-xs font-medium text-blue-500 hover:text-blue-600 flex items-center gap-0.5 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          }
        >
          {courseProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No courses in progress</p>
          ) : (
            <div className="space-y-4">
              {courseProgress.slice(0, 4).map((course) => (
                <div key={course.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate pr-2">{course.title}</span>
                    <span className="text-xs font-bold text-muted-foreground">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${
                        course.progress >= 80 ? "bg-green-500"
                        : course.progress >= 40 ? "bg-amber-500"
                        : "bg-blue-500"
                      }`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{course.completedLessons} of {course.totalLessons} lessons</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Quiz Score Trend */}
        <SectionCard
          icon={<TrendingUp className="w-4 h-4 text-violet-500" />}
          title="Quiz Scores"
          accent="violet"
          action={
            <button onClick={() => router.push("/dashboard?tab=quizzes")} className="text-xs font-medium text-violet-500 hover:text-violet-600 flex items-center gap-0.5 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          }
        >
          {quizTrends.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No quiz data yet</p>
          ) : (
            <div className="space-y-2">
              {quizTrends.slice(0, 5).map((quiz, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    quiz.score >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : quiz.score >= 60 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {quiz.score}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{quiz.title}</p>
                    <p className="text-[10px] text-muted-foreground">{quiz.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <SectionCard
          icon={<Clock className="w-4 h-4 text-sky-500" />}
          title="Recent Activity"
          accent="sky"
        >
          <div className="space-y-1">
            {recentActivity.slice(0, 8).map((activity, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                <ActivityIcon type={activity.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{activity.description}</p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{activity.timeAgo}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Leaderboard */}
      <SectionCard
        icon={<Trophy className="w-4 h-4 text-amber-500" />}
        title="Leaderboard"
        accent="amber"
      >
        <Leaderboard compact />
      </SectionCard>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function StatCard({ icon, label, value, sub, iconColor, iconBg, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl border border-border bg-card text-left transition-all hover:border-foreground/20 hover:shadow-sm w-full ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-xl font-black text-foreground leading-tight">{value}</p>
          <p className="text-[10px] text-muted-foreground">{sub}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] font-semibold text-foreground">{label}</p>
        </div>
      </div>
    </button>
  );
}

const accentBorders = {
  amber:  "border-amber-200/60  dark:border-amber-800/30",
  green:  "border-green-200/60  dark:border-green-800/30",
  blue:   "border-blue-200/60   dark:border-blue-800/30",
  violet: "border-violet-200/60 dark:border-violet-800/30",
  sky:    "border-sky-200/60    dark:border-sky-800/30",
  emerald:"border-emerald-200/60 dark:border-emerald-800/30",
};

function SectionCard({ icon, title, accent = "blue", action, children, className = "" }) {
  return (
    <div className={`rounded-2xl border ${accentBorders[accent] || "border-border"} bg-card p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function ActivityIcon({ type }) {
  const config = {
    lesson_completed: { bg: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",    icon: <BookOpen className="w-3.5 h-3.5" /> },
    quiz_taken:       { bg: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400", icon: <Brain className="w-3.5 h-3.5" /> },
    course_completed: { bg: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",    icon: <Trophy className="w-3.5 h-3.5" /> },
    flashcard_review: { bg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <Brain className="w-3.5 h-3.5" /> },
    xp_earned:        { bg: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400", icon: <Zap className="w-3.5 h-3.5" /> },
  };
  const { bg, icon } = config[type] || { bg: "bg-gray-100 text-gray-500 dark:bg-gray-800/30", icon: <Clock className="w-3.5 h-3.5" /> };
  return (
    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
      {icon}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-secondary/50 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="h-48 bg-secondary/50 rounded-2xl" />
        <div className="h-48 bg-secondary/50 rounded-2xl lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-64 bg-secondary/50 rounded-2xl" />
        <div className="h-64 bg-secondary/50 rounded-2xl" />
      </div>
    </div>
  );
}
