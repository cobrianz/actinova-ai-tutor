"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  Star,
  Search,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Filter,
  Trophy,
  Flame,
  Download,
  Sparkles,
  FileText,
  Pin,
  BarChart3,
  TrendingUp,
  Crown,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

import { toast } from "sonner";
import { downloadCourseAsPDF } from "@/lib/pdfUtils";
import { useAuth } from "@/components/AuthProvider";
import { apiClient } from "@/lib/csrfClient";
import { PRODUCTS } from "@/lib/planLimits";

const CARD_ACCENTS = [
  { bg: "bg-violet-200/80 dark:bg-violet-900/50", card: "bg-violet-50 dark:bg-violet-950/25", border: "border-violet-200/80 dark:border-violet-800/40", footer: "border-violet-200/60 dark:border-violet-800/30", text: "text-violet-600 dark:text-violet-400", bar: "bg-violet-500" },
  { bg: "bg-blue-200/80 dark:bg-blue-900/50", card: "bg-blue-50 dark:bg-blue-950/25", border: "border-blue-200/80 dark:border-blue-800/40", footer: "border-blue-200/60 dark:border-blue-800/30", text: "text-blue-600 dark:text-blue-400", bar: "bg-blue-500" },
  { bg: "bg-emerald-200/80 dark:bg-emerald-900/50", card: "bg-emerald-50 dark:bg-emerald-950/25", border: "border-emerald-200/80 dark:border-emerald-800/40", footer: "border-emerald-200/60 dark:border-emerald-800/30", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
  { bg: "bg-amber-200/80 dark:bg-amber-900/50", card: "bg-amber-50 dark:bg-amber-950/25", border: "border-amber-200/80 dark:border-amber-800/40", footer: "border-amber-200/60 dark:border-amber-800/30", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
  { bg: "bg-rose-200/80 dark:bg-rose-900/50", card: "bg-rose-50 dark:bg-rose-950/25", border: "border-rose-200/80 dark:border-rose-800/40", footer: "border-rose-200/60 dark:border-rose-800/30", text: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500" },
  { bg: "bg-cyan-200/80 dark:bg-cyan-900/50", card: "bg-cyan-50 dark:bg-cyan-950/25", border: "border-cyan-200/80 dark:border-cyan-800/40", footer: "border-cyan-200/60 dark:border-cyan-800/30", text: "text-cyan-600 dark:text-cyan-400", bar: "bg-cyan-500" },
];

const DIFFICULTY_BADGES = {
  beginner: { label: "Beginner", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
  intermediate: { label: "Intermediate", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" },
  advanced: { label: "Advanced", className: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400" },
  expert: { label: "Expert", className: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400" },
};

function hashString(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getCardAccent(seed = "") {
  return CARD_ACCENTS[hashString(seed) % CARD_ACCENTS.length];
}

function LibraryCourseCard({
  course,
  viewMode,
  isPremium,
  isAtCourseUsageLimit,
  isEnterprise,
  onPin,
  onMakePremium,
  onDownload,
}) {
  const accent = getCardAccent(course.title || course.topic || course.id);
  const diff = (course.difficulty || "beginner").toLowerCase();
  const diffBadge = DIFFICULTY_BADGES[diff] || DIFFICULTY_BADGES.beginner;

  const showPremiumBtn =
    course.format === "course" &&
    !(
      course.premiumAccessExpiresAt &&
      new Date(course.premiumAccessExpiresAt) > new Date()
    ) &&
    (!isPremium || (isAtCourseUsageLimit && !isEnterprise));

  const canDownload =
    course.format !== "questions" &&
    course.format !== "flashcards";

  const isLocked = !isPremium && !course.isGenerated;
  const learnHref = `/dashboard/learn/${encodeURIComponent(course.topic)}?format=${course.format}&difficulty=${course.difficulty}`;
  const continueLabel = course.progress === 100 ? "Review" : "Continue";

  const continueButton = (
    <Link
      href={learnHref}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[10px] font-semibold shrink-0 transition-colors"
    >
      {continueLabel}
      <ArrowRight size={10} className="-rotate-45" />
    </Link>
  );

  const actionButtons = (
    <div className="flex items-center gap-0.5 shrink-0">
      <button
        onClick={() => onPin(course.id)}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
        title={course.isPinned ? "Unpin" : "Pin (max 3)"}
      >
        <Pin size={13} className={course.isPinned ? "fill-amber-500 text-amber-500" : ""} />
      </button>
      {showPremiumBtn && (
        <button
          onClick={() => onMakePremium(course)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          title="Make premium ($6)"
        >
          <Crown size={13} />
        </button>
      )}
      {canDownload && (
        <button
          onClick={() => {
            if (course.progress < 100) {
              toast.info("Please complete the course or wait for all lessons to generate before downloading.");
              return;
            }
            onDownload(course);
          }}
          className={`p-1.5 rounded-lg transition-colors ${
            isPremium && course.progress === 100
              ? "text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
              : "text-muted-foreground/40 cursor-not-allowed"
          }`}
          title={
            !isPremium
              ? "Pro Feature: Download PDF"
              : course.progress === 100
              ? "Download PDF"
              : "Complete course to download"
          }
        >
          <Download size={13} />
        </button>
      )}
    </div>
  );

  const footer = (
    <div className={`flex items-center justify-between text-[10px] text-muted-foreground pt-3 border-t ${accent.footer}`}>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${accent.bar}`} />
        <span className="font-medium">{course.completedLessons}/{course.totalLessons}</span>
        <span>·</span>
        <span>{course.estimatedTime}</span>
        <span>·</span>
        <span>{course.progress}%</span>
      </div>
      {isLocked ? (
        <span className="text-muted-foreground/50 shrink-0">Locked</span>
      ) : (
        continueButton
      )}
    </div>
  );

  if (viewMode === "list") {
    return (
      <motion.div
        layout
        variants={{
          hidden: { opacity: 0, scale: 0.98 },
          visible: { opacity: 1, scale: 1, y: 0 },
        }}
        className={`group flex items-center gap-4 rounded-xl border p-4 transition-colors ${accent.card} ${accent.border} hover:brightness-[0.98] dark:hover:brightness-110`}
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accent.bg}`}>
          <BookOpen size={18} className={accent.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-sm text-foreground line-clamp-1">{course.title}</h3>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium shrink-0 ${diffBadge.className}`}>
              {diffBadge.label}
            </span>
            {course.isPinned && <Pin size={11} className="fill-amber-500 text-amber-500 shrink-0" />}
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex-1 h-1 rounded-full overflow-hidden max-w-xs ${accent.bg}`}>
              <div className={`h-full rounded-full ${accent.bar}`} style={{ width: `${course.progress}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{course.progress}%</span>
          </div>
        </div>
        {actionButtons}
        {!isLocked && continueButton}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      variants={{
        hidden: { opacity: 0, scale: 0.98 },
        visible: { opacity: 1, scale: 1, y: 0 },
      }}
      whileHover={{ y: -2 }}
      className={`group rounded-xl border overflow-hidden transition-colors ${accent.card} ${accent.border} hover:brightness-[0.98] dark:hover:brightness-110`}
    >
      <div className={`h-1 ${accent.bg}`}>
        <div
          className={`h-full ${accent.bar} transition-all duration-500`}
          style={{ width: `${course.progress}%` }}
        />
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accent.bg}`}>
            <BookOpen size={16} className={accent.text} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${diffBadge.className}`}>
                {diffBadge.label}
              </span>
              {course.isPinned && (
                <span className="flex items-center gap-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400">
                  <Pin size={9} className="fill-current" />
                  Pinned
                </span>
              )}
            </div>
            <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">
              {course.title}
            </h3>
          </div>
          {actionButtons}
        </div>

        {course.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3 pl-12">
            {course.description}
          </p>
        )}

        {footer}
      </div>
    </motion.div>
  );
}

export default function Library({ setActiveContent }) {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState("grid");
  const [filterBy, setFilterBy] = useState("all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({});

  const [pinnedCourses, setPinnedCourses] = useState(new Set());
  const hasLoadedOnceRef = useRef(false);

  const { user, loading: authLoading, refreshToken, hasPurchased } = useAuth();

  const coursesPerPage = 12;

  // Fetch library data using httpOnly cookies only
  const fetchLibraryData = async (retryAfterRefresh = true, silent = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (!silent || courses.length === 0) {
        setLoading(true);
      }
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: coursesPerPage.toString(),
        type: "course",
        search: searchQuery,
      });

      const res = await apiClient.get(`/api/library?${params}`);

      if (!res.ok) {
        if (res.status === 401 && retryAfterRefresh) {
          // Try to refresh token and retry

          const refreshSuccess = await refreshToken();
          if (refreshSuccess) {
            // Retry the request after successful refresh
            return fetchLibraryData(false);
          } else {
            toast.error("Session expired. Please log in again.");
          }
        } else if (res.status === 401) {
          toast.error("Session expired. Please log in again.");
        } else {
          toast.error("Failed to load library");
        }
        setLoading(false);
        return;
      }

      const data = await res.json();

      const mappedCourses = (data.items || []).map((item) => {
        const _id = item.id.split("_")[1] || item.id;
        const hasModules = (item.modules || 0) > 0;

        return {
          id: item.id,
          _id,
          title: item.title,
          topic: item.topic,
          difficulty: item.difficulty,
          progress: item.progress || 0,
          totalLessons: item.totalLessons || item.totalCards || 0,
          completedLessons: Math.round(
            (item.progress / 100) * (item.totalLessons || item.totalCards || 0)
          ),
          premiumAccessExpiresAt: item.premiumAccessExpiresAt || null,
          isPinned: item.pinned || false,
          pinned: item.pinned || false,
          createdAt: item.createdAt,
          lastAccessed: item.lastAccessed || "Just now",
          description: item.description || `Learn ${item.topic || item.title}`,
          instructor: item.instructor || "AI Tutor",
          rating: item.rating || 4.8,
          estimatedTime: item.estimatedTime || "2-4 hours",
          format: item.type === "questions" ? "questions" : item.type === "flashcards" ? "flashcards" : "course",
          courseData: {
            topic: item.topic,
            format: item.type === "questions" ? "questions" : item.type === "flashcards" ? "flashcards" : "course",
            difficulty: item.difficulty,
          },
          isGenerated: hasModules,
          isPremium: item.isPremium || false,
          isEnrolled: item.isEnrolled || false,
          sharerName: item.sharerName || null
        };
      });

      setCourses(mappedCourses);
      setPagination(data.pagination || {});
      setStats(data.stats || {});
    } catch (err) {
      console.error("Error fetching library:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
    }
  };

  const prevDepsRef = useRef({ currentPage, searchQuery, filterBy });

  // Re-fetch when page, search, filter, or user changes
  useEffect(() => {
    if (!authLoading && user) {
      const depsChanged = 
        prevDepsRef.current.currentPage !== currentPage ||
        prevDepsRef.current.searchQuery !== searchQuery ||
        prevDepsRef.current.filterBy !== filterBy;
      
      fetchLibraryData(true, !depsChanged);
      
      prevDepsRef.current = { currentPage, searchQuery, filterBy };
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [currentPage, searchQuery, filterBy, user?._id || user?.id, authLoading]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterBy]);

  // Update pinned courses set
  useEffect(() => {
    if (courses.length > 0) {
      setPinnedCourses(
        new Set(courses.filter((c) => c.isPinned).map((c) => c.id))
      );
    }
  }, [courses]);

  const handlePin = async (courseId, retryAfterRefresh = true) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const willBePinned = !course.isPinned;
    const currentPinnedCount = stats.pinned || 0;

    if (willBePinned && currentPinnedCount >= 3) {
      toast.error("You can only pin up to 3 courses. Unpin one first.");
      return;
    }

    // Optimistic update
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? { ...c, isPinned: willBePinned, pinned: willBePinned }
          : c
      )
    );
    setStats((prev) => {
      const isCourse = course.type === "course" || (course.id && course.id.startsWith("course_"));
      return {
        ...prev,
        pinned: willBePinned ? (prev.pinned || 0) + 1 : Math.max(0, (prev.pinned || 0) - 1),
        pinnedCourses: isCourse
          ? (willBePinned ? (prev.pinnedCourses || 0) + 1 : Math.max(0, (prev.pinnedCourses || 0) - 1))
          : (prev.pinnedCourses || 0)
      };
    });

    try {
      const res = await apiClient.post("/api/library", { action: "pin", itemId: courseId }, {
        headers: {
          "x-user-id": user?._id || user?.id || "",
        }
      });

      if (res.status === 401 && retryAfterRefresh) {
        // Try to refresh token and retry
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
          return handlePin(courseId, false);
        }
      }

      if (!res.ok) {
        throw new Error("Failed to update pin");
      }

      toast.success(willBePinned ? "Course pinned" : "Course unpinned");
    } catch (err) {
      // Revert on error
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? { ...c, isPinned: !willBePinned, pinned: !willBePinned }
            : c
        )
      );
      setStats((prev) => ({ ...prev, pinned: currentPinnedCount }));
      toast.error("Failed to update pin status");
    }
  };



  const courseProduct = PRODUCTS.find(p => p.id === 'course_generation');
  const isPremium =
    hasPurchased('course_generation') ||
    !!(user?.credits >= (courseProduct?.creditCost || 40)) ||
    !!(
      user?.subscription &&
      (user.subscription.plan === "pro" || user.subscription.plan === "enterprise") &&
      user.subscription.status === "active"
    ) || !!user?.isPremium;

  const isEnterprise = Boolean(
    user?.subscription?.status === "active" &&
      (
        String(user?.subscription?.plan || "").toLowerCase() === "enterprise" ||
        String(user?.subscription?.tier || "").toLowerCase() === "enterprise"
      )
  );

  const isAtCourseUsageLimit = Boolean(
    user?.usage?.details?.courses &&
      user.usage.details.courses.limit !== null &&
      Number(user.usage.details.courses.remaining ?? 0) <= 0
  );

  const handleMakePremium = async (course) => {
    if (!course || course.format !== "course") return;

    const hasActiveCourseUnlock = Boolean(
      course.premiumAccessExpiresAt &&
        new Date(course.premiumAccessExpiresAt) > new Date()
    );
    if (hasActiveCourseUnlock) {
      toast.message("This course is already paid.");
      return;
    }

    // If the user has an active paid plan and isn't over the monthly limit, upgrade without checkout.
    if (isPremium && (!isAtCourseUsageLimit || isEnterprise)) {
      const params = new URLSearchParams({
        format: "course",
        difficulty: course.difficulty || "beginner",
        premiumRequested: "true",
      });
      window.location.href = `/dashboard/learn/${encodeURIComponent(course.topic)}?${params.toString()}`;
      return;
    }

    const toastId = toast.loading("Redirecting to checkout...");
    try {
      const res = await apiClient.post("/api/billing/create-session", {
        purchaseType: "premium-generation",
        topic: course.topic,
        difficulty: course.difficulty || "beginner",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Unable to start checkout");
      }

      const data = await res.json();
      if (!data?.sessionUrl) throw new Error("Invalid checkout session");

      toast.dismiss(toastId);
      window.location.href = data.sessionUrl;
    } catch (e) {
      toast.error(e?.message || "Checkout failed", { id: toastId });
    }
  };

  const handleDownload = async (course) => {
    if (!isPremium) {
      toast.error("PDF downloads are a Pro feature. Please upgrade to download courses.");
      return;
    }

    const toastId = toast.loading(`Preparing PDF for ${course.title}...`);
    try {
      const res = await apiClient.get(`/api/library?id=${course.id}`);

      if (!res.ok) throw new Error("Failed to fetch full course data");

      const data = await res.json();
      if (!data.item) throw new Error("Course data not found");

      // Use the full item (which contains modules/lessons) for PDF generation
      await downloadCourseAsPDF(data.item, course.format);
      toast.success("Download started!", { id: toastId });
    } catch (err) {
      console.error("Library download error:", err);
      toast.error("Failed to generate PDF. Please try again.", { id: toastId });
    }
  };

  const handlePageChange = (page) => setCurrentPage(page);

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "var(--font-fraunces)" }}>Please log in</h3>
        <p className="text-gray-600 mb-6">
          You need to be signed in to view your library.
        </p>
        <Link
          href="/auth/login"
          className="px-6 py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-black"
        >
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="px-0 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-fraunces)" }}>
          My Library
        </h1>
        <p className="text-muted-foreground">
          Your personal learning space
        </p>
      </motion.div>

      {/* Stats */}
      {stats && Object.keys(stats).length > 0 && (
        <motion.div
          className="bg-secondary rounded-xl p-6 my-8 border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4 text-center" style={{ fontFamily: "var(--font-fraunces)" }}>
            Your Learning Progress
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Streak Card */}
            <motion.div
              className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-3 border border-orange-400 flex items-center gap-3 text-white"
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div className="flex-1 flex items-center justify-around">
                <div className="text-base sm:text-lg font-bold">
                  {user?.streak || 0}
                </div>
                <div className="text-[10px] sm:text-xs font-medium opacity-90">
                  Day Streak
                </div>
              </div>
            </motion.div>
            <motion.div
              className="bg-card rounded-lg p-3 border border-border flex items-center gap-3"
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="bg-accent rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 flex items-center justify-around">
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {stats.courses || 0}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                  Total Courses
                </div>
              </div>
            </motion.div>
            <motion.div
              className="bg-card rounded-lg p-3 border border-border flex items-center gap-3"
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="bg-green-100 dark:bg-green-900 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 flex items-center justify-around">
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {stats.completedCourses || 0}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">
                  Completed
                </div>
              </div>
            </motion.div>
            <motion.div
              className="bg-card rounded-lg p-3 border border-border flex items-center gap-3"
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="bg-yellow-100 dark:bg-yellow-900 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                <Pin className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1 flex items-center justify-around">
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {stats.pinnedCourses || 0}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">
                  Pinned
                </div>
              </div>
            </motion.div>
            <motion.div
              className="bg-card rounded-lg p-3 border border-border flex items-center gap-3"
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="bg-lime-100 dark:bg-lime-900 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-lime-600 dark:text-lime-400" />
              </div>
              <div className="flex-1 flex items-center justify-around">
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {courses.length > 0
                    ? Math.round(
                      courses.reduce(
                        (sum, course) => sum + (course.progress || 0),
                        0
                      ) / courses.length
                    )
                    : 0}
                  %
                </div>
                <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">
                  Avg Progress
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Streak Calendar */}
      {user?.streakData?.activeDates?.length > 0 && (
        <motion.div
          className="bg-card rounded-xl p-4 my-6 border border-border"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--font-fraunces)" }}>Learning Activity</h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flame className="w-3 h-3 text-orange-500" />
              <span>{user.streakData.current || 0} day streak</span>
              {user.streakData.longest > 0 && (
                <span className="ml-2 text-orange-500">(Best: {user.streakData.longest})</span>
              )}
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {Array.from({ length: 30 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (29 - i));
              const dateStr = date.toISOString().split("T")[0];
              const isActive = user.streakData.activeDates?.includes(dateStr);
              const isToday = dateStr === new Date().toISOString().split("T")[0];
              return (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm flex-shrink-0 ${
                    isActive
                      ? "bg-orange-500"
                      : isToday
                      ? "bg-orange-200 dark:bg-orange-800"
                      : "bg-muted"
                  }`}
                  title={dateStr}
                />
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <motion.div
        className="flex flex-col md:flex-row gap-2 mb-5 justify-between items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="relative w-full md:w-auto md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your library..."
            className="w-full pl-9 pr-3 py-2 border border-input rounded-lg bg-background text-foreground text-[11px]"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end items-center">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="px-2.5 py-2 border border-input rounded-lg bg-background text-[11px]"
          >
            <option value="all">All</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="pinned">Pinned</option>
          </select>

          <div className="flex bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded ${viewMode === "grid" ? "bg-background" : ""}`}
            >
              <Grid className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded ${viewMode === "list" ? "bg-background" : ""}`}
            >
              <List className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Courses Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border overflow-hidden animate-pulse bg-white dark:bg-slate-900"
            >
              <div className="h-1 bg-slate-200 dark:bg-slate-700" />
              <div className="p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  </div>
                </div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <motion.div
          className="text-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-semibold mb-2 text-foreground" style={{ fontFamily: "var(--font-fraunces)" }}>
            {searchQuery ? "No courses found" : "Your library is empty"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : "Start learning by generating your first course!"}
          </p>
          <button
            onClick={() => setActiveContent("explore")}
            className="text-dark hover:underline cursor-pointer"
          >
            Explore Courses
          </button>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={viewMode + filterBy}
            initial={loading ? "hidden" : false}
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }
          >
            {courses
              .filter(course => {
                if (filterBy === "pinned") return course.isPinned;
                if (filterBy === "completed") return course.progress === 100;
                if (filterBy === "in-progress") return course.progress > 0 && course.progress < 100;
                return true;
              })
              .map((course) => (
                <LibraryCourseCard
                  key={course.id}
                  course={course}
                  viewMode={viewMode}
                  isPremium={isPremium}
                  isAtCourseUsageLimit={isAtCourseUsageLimit}
                  isEnterprise={isEnterprise}
                  onPin={handlePin}
                  onMakePremium={handleMakePremium}
                  onDownload={handleDownload}
                />
              ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-1.5 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-border disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {[...Array(pagination.pages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={`min-w-[28px] h-7 px-2 rounded-lg text-[10px] font-bold transition-colors ${currentPage === i + 1 ? "bg-[#1a1a1a] text-white" : "bg-card text-foreground hover:bg-secondary border border-border"}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.pages}
            className="p-1.5 rounded-lg border border-border disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}


    </div>
  );
}
