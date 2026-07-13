"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Star,
  Clock,
  Users,
  TrendingUp,
  Crown,
  Search,
  Sparkles,
  Share2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";
import confetti from "canvas-confetti";

export default function PremiumCourses() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightedCourseSlug = searchParams.get("courseSlug");
  const sharedCourseTitle = searchParams.get("courseTitle") || "";
  const [courses, setCourses] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [busyCourseId, setBusyCourseId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 9;

  useEffect(() => {
    let mounted = true;

    async function fetchCourses() {
      try {
        // Fetch both marketplace and trending courses
        const [marketplaceRes, trendingRes] = await Promise.allSettled([
          apiClient.get("/api/premium-courses"),
          apiClient.get("/api/premium-courses/trending"),
        ]);

        let marketplaceCourses = [];
        if (marketplaceRes.status === "fulfilled" && marketplaceRes.value.ok) {
          const data = await marketplaceRes.value.json();
          marketplaceCourses = data.courses || [];
        }

        let trendingCourses = [];
        if (trendingRes.status === "fulfilled" && trendingRes.value.ok) {
          const data = await trendingRes.value.json();
          trendingCourses = (data.courses || []).map((c) => ({
            ...c,
            id: c.id || `trending-${Date.now()}`,
            isTrending: true,
            badge: "Trending",
            featured: false,
            price: 0,
            access: { hasAccess: true, source: "subscription" },
            students: 0,
            rating: 0,
            totalModules: 20,
            totalLessons: 100,
          }));
        }

        if (!mounted) return;

        // Combine: trending first, then marketplace
        const list = [...trendingCourses, ...marketplaceCourses];
        setCourses(list);
        setFeatured(list.find((course) => course.featured) || list[0] || null);
      } catch (error) {
        toast.error(error.message || "Failed to load premium courses");
      } finally {
        if (mounted) {
          setIsDataLoading(false);
        }
      }
    }

    fetchCourses();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      const purchaseType = searchParams.get("purchaseType");
      const ref = searchParams.get("reference") || searchParams.get("trxref") || searchParams.get("ref");
      if (purchaseType === "marketplace-course") {
        toast.success("Course unlocked. Your 30-day access is now active.");
        confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 }, colors: ["#FFD700", "#FF6B6B", "#4ECDC4"] });
        if (ref) {
          apiClient.get(`/api/billing/verify-payment?ref=${encodeURIComponent(ref)}`).catch(() => {});
        }
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!sharedCourseTitle) return;
    setSearchQuery((current) => current || sharedCourseTitle);
  }, [sharedCourseTitle]);

  useEffect(() => {
    if (!courses.length || !highlightedCourseSlug) return;

    const matchedCourse = courses.find((course) => course.slug === highlightedCourseSlug);
    if (matchedCourse) {
      setFeatured(matchedCourse);
    }
  }, [courses, highlightedCourseSlug]);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return courses;

    return courses.filter((course) => {
      return (
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        String(course.category || "").toLowerCase().includes(query)
      );
    });
  }, [courses, searchQuery]);

  // Calculate pagination - only for marketplace courses
  const marketplaceCourses = useMemo(() => filteredCourses.filter((c) => !c.isTrending), [filteredCourses]);
  const totalPages = Math.ceil(marketplaceCourses.length / coursesPerPage);
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * coursesPerPage;
    const end = start + coursesPerPage;
    return marketplaceCourses.slice(start, end);
  }, [marketplaceCourses, currentPage]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getBadgeIcon = (badge) => {
    switch (badge) {
      case "Trending":
        return <TrendingUp className="w-3 h-3" />;
      default:
        return <Star className="w-3 h-3" />;
    }
  };

  const getBadgeColor = (badge) => {
    switch (badge) {
      case "Trending":
        return "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200";
      case "Hot Skill":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
  };

  const getCourseExpiryInfo = (course) => {
    const access = course.access || {};
    if (!access.hasAccess) {
      return { daysLeft: 0, progress: 0 };
    }

    if (access.source === "subscription") {
      const usage = access.usage;
      const limit = usage?.limit;
      if (limit === null || limit === undefined) {
        return { daysLeft: 30, progress: 100 };
      }

      const remaining = usage?.remaining ?? Math.max(0, limit - (usage?.used || 0));
      const progress = limit > 0 ? Math.max(0, Math.min(100, (remaining / limit) * 100)) : 0;
      return { daysLeft: remaining, progress };
    }

    const daysLeft = access.daysLeft || 0;
    const progress = Math.max(0, Math.min(100, (daysLeft / 30) * 100));
    return { daysLeft, progress };
  };

  const getCourseAccessLabel = (course) => {
    const access = course.access || {};
    if (access.source === "subscription") {
      if (access.limitReached) {
        return "Monthly limit reached";
      }
      if (access.usage?.limit === null || access.usage?.limit === undefined) {
        return "Unlimited plan access";
      }
      return `${access.usage?.remaining ?? 0} premium starts left`;
    }

    return access.hasAccess ? `${access.daysLeft} days left` : access.actionLabel;
  };

  const buildShareLink = (course) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/premium-courses/${course.slug}`;
  };

  const copyShareLink = async (course) => {
    try {
      await navigator.clipboard.writeText(buildShareLink(course));
      toast.success("Share link copied");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  async function handleUnlock(course) {
    try {
      setBusyCourseId(course.id);
      const response = await apiClient.post("/api/billing/create-session", {
        purchaseType: "marketplace-course",
        courseId: course.id,
      });
      const data = await response.json();

      if (!response.ok || !data.sessionUrl) {
        throw new Error(data.error || "Failed to start checkout");
      }

      window.location.href = data.sessionUrl;
    } catch (error) {
      toast.error(error.message || "Failed to start checkout");
      setBusyCourseId(null);
    }
  }

  async function handleStartLearning(course) {
    try {
      setBusyCourseId(course.id);

      // For trending courses (AI-generated, not in DB), go directly to learn
      if (course.isTrending && !course.id?.startsWith("trending-")) {
        const nextParams = new URLSearchParams({
          format: "course",
          difficulty: course.difficulty || "advanced",
          originalTopic: course.title,
          premiumRequested: "true",
        });
        router.push(`/learn/${encodeURIComponent(course.title)}?${nextParams.toString()}`);
        return;
      }

      // For trending courses without DB ID, generate directly
      if (course.isTrending) {
        const nextParams = new URLSearchParams({
          format: "course",
          difficulty: course.difficulty || "advanced",
          originalTopic: course.title,
          premiumRequested: "true",
          forceRegenerate: "true",
        });
        router.push(`/learn/${encodeURIComponent(course.title)}?${nextParams.toString()}`);
        return;
      }

      const response = await apiClient.post(`/api/premium-courses/${course.id}/start`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open course");
      }

      const nextParams = new URLSearchParams({
        format: "course",
        difficulty: data.difficulty,
        originalTopic: data.originalTopic,
        premiumRequested: "true",
        marketplaceCourseId: data.marketplaceCourseId || course.id,
      });

      if (data.forceRegenerate) {
        nextParams.set("forceRegenerate", "true");
      }

      router.push(`/learn/${encodeURIComponent(data.topic)}?${nextParams.toString()}`);
    } catch (error) {
      toast.error(error.message || "Failed to open course");
      setBusyCourseId(null);
    }
  }

  const featuredActionLabel = featured?.access?.hasAccess
    ? featured?.hasGenerated
      ? "Continue Learning"
      : "Start Learning"
    : featured?.access?.actionLabel || `Unlock for $${featured?.price || 8}`;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <motion.div
        className="text-center mb-12 lg:mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
          <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
            Premium Courses
          </span>
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
          Get access to what you want easily and cheaply.
        </p>
      </motion.div>

      <motion.div
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search curricula, topics, or skills..."
            className="w-full pl-12 pr-4 py-3.5 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-lime-400 to-lime-500 text-white rounded-xl">
            <Crown className="w-6 h-6" />
          </div>
        </div>
      </motion.div>

      {featured && (
        <motion.div
          className={`relative overflow-hidden rounded-3xl border mb-16 shadow-2xl shadow-primary/5 ${
            highlightedCourseSlug === featured.slug
              ? "border-green-600/40 bg-card"
              : "border-primary/20 bg-card"
          }`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 via-transparent to-emerald-600/5 dark:from-green-900/10 dark:to-emerald-900/10" />
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-primary/10 to-transparent opacity-50" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]" />

          <div className="relative z-10 p-8 md:p-12 lg:p-16">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                    <Crown className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-primary font-black text-xs uppercase tracking-[0.2em]">
                      Featured Curriculum
                    </span>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">
                      Marketplace Course
                    </p>
                  </div>
                </div>

                <h2 className="text-xl md:text-2xl font-black text-foreground mb-6 leading-tight tracking-tight">
                  {featured.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed font-medium">
                  {featured.description}
                </p>

                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-8 max-w-xl">
                  <p className="text-primary text-xs font-bold leading-relaxed flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {featured.access?.source === "subscription"
                        ? getCourseAccessLabel(featured)
                        : featured.access?.hasAccess
                        ? `${featured.access.daysLeft} days left in your current access window.`
                        : "Unlock this course for $8 and start learning immediately."}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-8 mb-8">
                  <div className="flex items-center space-x-2 text-foreground font-bold bg-secondary/50 px-4 py-2 rounded-xl border border-border">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm">{featured.duration}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-secondary/50 px-4 py-2 rounded-xl border border-border">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-lime-500 fill-lime-500" />
                      ))}
                      <span className="ml-2 font-black text-sm text-foreground">
                        {featured.rating}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground font-bold">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{featured.students?.toLocaleString() || "0"} Learners</span>
                  </div>
                </div>

                <div className="flex items-baseline space-x-3 mb-8">
                  <span className="text-lg font-black text-foreground">
                    ${featured.price || 8}
                  </span>
                  <span className="text-sm text-muted-foreground">per unlock / renew</span>
                </div>
              </div>

              <div className="w-full lg:w-1/3 flex flex-col gap-6">
                <div className="bg-secondary/30 border border-border rounded-3xl p-8 relative group hover:bg-secondary/50 transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
                    <Crown className="w-12 h-12" />
                  </div>
                  <p className="text-foreground font-bold italic text-sm leading-relaxed relative mb-4">
                    "Unlock once, learn for 30 days, then renew only when you need more time."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">
                      Actirova Premium Team
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        featured.access?.hasAccess
                          ? handleStartLearning(featured)
                          : handleUnlock(featured)
                      }
                      disabled={busyCourseId === featured.id || featured.access?.limitReached}
                      className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-3"
                    >
                      {busyCourseId === featured.id ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground"></div>
                          <span>Preparing Curriculum</span>
                        </>
                      ) : (
                        <span>{featuredActionLabel}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyShareLink(featured)}
                      className="rounded-xl border border-border px-4 py-3 text-foreground transition hover:bg-secondary/50"
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-center text-[10px] text-muted-foreground mt-4 font-bold uppercase tracking-[0.2em]">
                    {featured.access?.hasAccess
                      ? getCourseAccessLabel(featured)
                      : "Checkout Powered by Paystack"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {isDataLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading premium courses...
          </p>
        </div>
      ) : (
        <>
          {/* Trending Courses Section */}
          {filteredCourses.some((c) => c.isTrending) && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-lime-400 to-emerald-500 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Trending For You</h2>
                  <p className="text-sm text-muted-foreground">Advanced courses based on your library</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.filter((c) => c.isTrending).map((course, index) => {
                  const actionLabel = "Start Learning";
                  return (
                    <motion.div
                      key={course.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -4 }}
                      className="group relative bg-card rounded-xl overflow-hidden transition-all duration-300 flex flex-col h-full"
                    >
                      <div className="px-6 pt-6 flex justify-between items-start">
                        <div className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200">
                          <TrendingUp className="w-3 h-3" />
                          Trending
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          {course.category || "General"}
                        </span>
                      </div>
                      <div className="px-6 pt-4 pb-2 flex-1">
                        <h3 className="text-sm font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {course.estimatedDuration || course.duration || "8 weeks"}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            course.difficulty === "expert"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                          }`}>
                            {course.difficulty}
                          </span>
                        </div>
                        {course.learningOutcomes && (
                          <div className="space-y-1">
                            {course.learningOutcomes.slice(0, 3).map((outcome, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <Sparkles className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                                <span className="line-clamp-1">{outcome}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="px-6 pb-6 pt-4">
                        <button
                          onClick={() => handleStartLearning(course)}
                          disabled={busyCourseId === course.id}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                        >
                          {busyCourseId === course.id ? "Loading..." : actionLabel}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Marketplace Courses Section */}
          {filteredCourses.some((c) => !c.isTrending) && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Marketplace Courses</h2>
                  <p className="text-sm text-muted-foreground">Curated courses from Actirova Academy</p>
                </div>
              </div>
              <motion.div
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {paginatedCourses.filter((c) => !c.isTrending).map((course, index) => {
                const { daysLeft, progress } = getCourseExpiryInfo(course);
                const actionLabel = course.access?.hasAccess
                  ? course.hasGenerated
                    ? "Continue Learning"
                    : "Start Learning"
                  : course.access?.actionLabel || `Unlock for $${course.price || 8}`;

            return (
              <motion.div
                key={course.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className={`group relative bg-card border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col h-full ${
                  highlightedCourseSlug === course.slug
                    ? "border-green-600/40"
                    : "border-border"
                }`}
              >
                <div className="px-6 pt-6 flex justify-between items-start">
                  <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border ${getBadgeColor(course.badge)}`}>
                    {getBadgeIcon(course.badge)}
                    {course.badge || "Premium"}
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    {course.category || "General"}
                  </span>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-6 border-y border-border py-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Users size={14} className="text-green-500" />
                        <span className="text-[10px] font-medium">Students</span>
                      </div>
                      <span className="text-sm font-bold">
                        {course.students?.toLocaleString() || "1.2k"}
                      </span>
                    </div>
                    <div className="text-center border-x border-border">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Clock size={14} className="text-lime-500" />
                        <span className="text-[10px] font-medium">Duration</span>
                      </div>
                      <span className="text-sm font-bold">{course.duration || "30 days"}</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-[10px] font-medium">Rating</span>
                      </div>
                      <span className="text-sm font-bold">{course.rating || "4.8"}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5 font-bold uppercase tracking-wider">
                      <span>Course Access</span>
                      <span className="text-primary">
                        {course.access?.hasAccess ? getCourseAccessLabel(course) : actionLabel}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          course.access?.hasAccess
                            ? handleStartLearning(course)
                            : handleUnlock(course)
                        }
                        disabled={busyCourseId === course.id || course.access?.limitReached}
                        className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn"
                      >
                        {busyCourseId === course.id ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground"></div>
                            Preparing...
                          </>
                        ) : (
                          <span>{actionLabel}</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyShareLink(course)}
                        className="rounded-xl border border-border px-4 py-3 text-foreground transition hover:bg-secondary/50"
                      >
                        <Share2 className="h-5 w-5" />
                      </button>
                    </div>

                    <p className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-[0.1em]">
                      {course.access?.hasAccess
                        ? getCourseAccessLabel(course)
                        : `Unlock for $${course.price || 8}`}
                    </p>
                  </div>
                </div>
                </motion.div>
              );
            })}
              </motion.div>
            </div>
          )}

          {/* Pagination - only for marketplace courses */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-3 py-1 rounded border transition-colors ${
                    currentPage === i + 1
                      ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                      : "bg-card text-foreground hover:bg-secondary border-border"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
