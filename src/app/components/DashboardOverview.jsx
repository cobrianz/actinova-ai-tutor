"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Trophy, Brain, Flame, Zap, Clock,
  TrendingUp, BarChart3, ChevronRight, Target,
  Sparkles,
  ArrowRight,
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
  const [dateRange, setDateRange] = useState({ start: null, end: null, label: 'All time' });

  useEffect(() => {
    fetchOverview();
  }, [dateRange]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.start) params.set('start', dateRange.start.toISOString());
      if (dateRange.end) params.set('end', dateRange.end.toISOString());
      
      const res = await fetch(`/api/analytics/overview?${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch overview:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Unable to load dashboard data.</p>
      </div>
    );
  }

  const { summary, recentActivity = [], courseProgress = [], quizTrends = [], adaptiveInsights } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-foreground">Analytics</h2>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Courses"
          value={summary.completedCourses}
          sub={`${summary.totalCourses} enrolled`}
          color="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
          onClick={() => router.push("/dashboard?tab=library")}
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Avg Quiz Score"
          value={`${summary.averageQuizScore}%`}
          sub={`${summary.totalQuizzes} quizzes`}
          color="text-purple-600 bg-purple-50 dark:bg-purple-900/20"
          onClick={() => router.push("/dashboard?tab=quizzes")}
        />
        <StatCard
          icon={<Brain className="w-5 h-5" />}
          label="Cards Mastered"
          value={summary.masteredFlashcards}
          sub={`${summary.totalFlashcards} total`}
          color="text-green-600 bg-green-50 dark:bg-green-900/20"
          onClick={() => router.push("/dashboard?tab=flashcards")}
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Study Streak"
          value={`${summary.streakCurrent}d`}
          sub={`Best: ${summary.streakLongest}d`}
          color="text-orange-600 bg-orange-50 dark:bg-orange-900/20"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* XP Widget + Study Goals - Full width on mobile */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Your Progress
            </h3>
            <XPWidget />
          </div>
          <StudyGoals />
        </div>

        {/* Activity Heatmap */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-green-500" />
              Activity
            </h3>
            <ActivityHeatmap />
          </div>
        </div>
      </div>

      {/* Adaptive insights */}
      {adaptiveInsights && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Adaptive Insights
            </h3>
            <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {adaptiveInsights.overallMasteryScore}% mastery
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
            <div className="rounded-lg border border-border/60 bg-background/70 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Next best action</p>
                <div className="text-xs text-muted-foreground">Suggested</div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{adaptiveInsights.nextBestAction?.title}</p>
                <p className="text-sm text-muted-foreground">{adaptiveInsights.nextBestAction?.description}</p>
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/70 p-3 space-y-3">
              <p className="text-sm font-semibold text-foreground">Focus areas</p>
              <div className="space-y-2">
                {adaptiveInsights.focusAreas?.length > 0 ? adaptiveInsights.focusAreas.map((area, index) => {
                  const key = `${area.title || "focus"}-${index}-${area.progress || 0}`;
                  return (
                    <div key={key} className="flex items-center justify-between gap-2 rounded-lg bg-secondary/50 px-2.5 py-2">
                      <span className="text-sm text-foreground truncate">{area.title}</span>
                      <span className="text-xs font-medium text-muted-foreground">{area.progress}%</span>
                    </div>
                  );
                }) : <p className="text-sm text-muted-foreground">No weak areas detected yet.</p>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {adaptiveInsights.recommendations?.slice(0, 3).map((item) => (
              <button
                key={item.title}
                onClick={() => router.push("/dashboard?tab=study-plans")}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/60 px-3 py-1.5 text-xs text-foreground transition hover:bg-secondary"
              >
                <ArrowRight className="w-3 h-3" />
                {item.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Course Progress + Quiz Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              Course Progress
            </h3>
            <button
              onClick={() => router.push("/dashboard?tab=library")}
              className="text-xs text-primary hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {courseProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No courses in progress
            </p>
          ) : (
            <div className="space-y-3">
              {courseProgress.slice(0, 4).map((course) => (
                <div key={course.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate pr-2">
                      {course.title}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {course.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        course.progress >= 80
                          ? "bg-green-500"
                          : course.progress >= 40
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {course.completedLessons} of {course.totalLessons} lessons
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quiz Score Trend */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Quiz Scores
            </h3>
            <button
              onClick={() => router.push("/dashboard?tab=quizzes")}
              className="text-xs text-primary hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {quizTrends.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No quiz data yet
            </p>
          ) : (
            <div className="space-y-2">
              {quizTrends.slice(0, 5).map((quiz, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                      quiz.score >= 80
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : quiz.score >= 60
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {quiz.score}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {quiz.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {quiz.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            Recent Activity
          </h3>
          <div className="space-y-1">
            {recentActivity.slice(0, 8).map((activity, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50"
              >
                <ActivityIcon type={activity.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {activity.description}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {activity.timeAgo}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          Leaderboard
        </h3>
        <Leaderboard compact />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl border border-border bg-card text-left transition-all hover:border-foreground/20 ${
        onClick ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-base font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </button>
  );
}

function ActivityIcon({ type }) {
  const styles = {
    lesson_completed: "bg-green-100 text-green-600 dark:bg-green-900/30",
    quiz_taken: "bg-purple-100 text-purple-600 dark:bg-purple-900/30",
    course_completed: "bg-amber-100 text-amber-600 dark:bg-amber-900/30",
    flashcard_review: "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
    xp_earned: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30",
  };

  const icons = {
    lesson_completed: <BookOpen className="w-3.5 h-3.5" />,
    quiz_taken: <Brain className="w-3.5 h-3.5" />,
    course_completed: <Trophy className="w-3.5 h-3.5" />,
    flashcard_review: <Brain className="w-3.5 h-3.5" />,
    xp_earned: <Zap className="w-3.5 h-3.5" />,
  };

  return (
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        styles[type] || "bg-gray-100 text-gray-600"
      }`}
    >
      {icons[type] || <Clock className="w-3.5 h-3.5" />}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-secondary/50 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-48 bg-secondary/50 rounded-xl" />
        <div className="h-48 bg-secondary/50 rounded-xl lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-secondary/50 rounded-xl" />
        <div className="h-64 bg-secondary/50 rounded-xl" />
      </div>
    </div>
  );
}
