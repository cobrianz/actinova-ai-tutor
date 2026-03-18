"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Star,
  BookOpen,
  Clock,
  Users,
  Award,
  TrendingUp,
  Crown,
  Zap,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import ActirovaLoader from "./ActirovaLoader";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";
import UpgradeModal from "./UpgradeModal";

export default function PremiumCourses() {
  const router = useRouter();
  const { user, loading: authLoading, isPro } = useAuth();

  if (authLoading) return <ActirovaLoader />;
  if (!user) return null;
  const [courses, setCourses] = useState([]);
  const [trendingCourses, setTrendingCourses] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingCourse, setGeneratingCourse] = useState(null);
  const [personalizedCourses, setPersonalizedCourses] = useState([]);
  const [generatingPersonalized, setGeneratingPersonalized] = useState(false);
  const [preparingCourse, setPreparingCourse] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const coursesPerPage = 6;

  // Calculate course expiry progress
  const getCourseExpiryInfo = (createdAt) => {
    if (!createdAt) return { daysLeft: 30, progress: 100 };

    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = now - created;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, 30 - diffDays);
    const progress = Math.max(0, (daysLeft / 30) * 100);

    return { daysLeft, progress };
  };


  useEffect(() => {
    if (isPro) {
      fetchPersonalizedCourses();
    } else {
      fetchCourses();
    }
    fetchTrendingCourses();
  }, [isPro]);

  // Ensure there's always one featured course
  useEffect(() => {
    if (!featured && !isDataLoading) {
      // If no featured course is set and we're not loading, pick one
      if (personalizedCourses.length > 0) {
        const featuredCourse =
          personalizedCourses.find((course) => course.featured) ||
          personalizedCourses[0];
        setFeatured(featuredCourse);
      } else if (courses.length > 0) {
        const featuredCourse =
          courses.find((course) => course.featured) || courses[0];
        setFeatured(featuredCourse);
      } else if (trendingCourses.length > 0) {
        setFeatured(trendingCourses[0]);
      }
    }
  }, [featured, isDataLoading, personalizedCourses, courses, trendingCourses]);

  const fetchCourses = async () => {
    try {
      const response = await apiClient.get("/api/premium-courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses);

        // Check if there's a featured course
        const featuredCourse = data.courses.find((course) => course.featured);
        if (featuredCourse) {
          setFeatured(featuredCourse);
        }
      }
    } catch (error) {
      console.error("Error fetching premium courses:", error);
    } finally {
      setIsDataLoading(false);
    }
  };

  const fetchTrendingCourses = async () => {
    try {
      const response = await apiClient.get("/api/premium-courses/trending", {
        headers: {
          "x-user-id": user?._id || user?.id || "",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTrendingCourses(data.courses || []);

        // Only set featured if no featured course is already set
        if (data.courses && data.courses.length > 0 && !featured) {
          setFeatured(data.courses[0]);
        }
      } else if (response.status === 403) {
        // User is not pro, don't show trending courses
        setTrendingCourses([]);
        if (!featured) {
          setFeatured(null);
        }
      }
    } catch (error) {
      console.error("Error fetching trending courses:", error);
      // If there's an error, don't show trending courses
      setTrendingCourses([]);
      if (!featured) {
        setFeatured(null);
      }
    }
  };

  const fetchPersonalizedCourses = async () => {
    try {
      setGeneratingPersonalized(true);

      // Check localStorage first
      const cached = localStorage.getItem("personalizedPremiumCourses");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (
          parsed.generatedAt &&
          new Date() - new Date(parsed.generatedAt) < 24 * 60 * 60 * 1000
        ) {
          // 24 hours
          setPersonalizedCourses(parsed.courses);
          setIsDataLoading(false);
          setGeneratingPersonalized(false);
          return;
        }
      }

      // Fetch from API (auth via HttpOnly cookie)
      const response = await apiClient.post("/api/premium-courses/personalized");

      if (response.ok) {
        const data = await response.json();

        // Store in localStorage
        if (data.localStorage) {
          localStorage.setItem(
            "personalizedPremiumCourses",
            JSON.stringify(data.localStorage)
          );
        }

        setPersonalizedCourses(data.courses);

        // Check if there's a featured course among personalized courses
        const featuredCourse = data.courses.find((course) => course.featured);
        if (featuredCourse && !featured) {
          setFeatured(featuredCourse);
        }

        toast.success("Your personalized premium courses are ready!");
      } else {
        throw new Error("Failed to generate personalized courses");
      }
    } catch (error) {
      console.error("Error fetching personalized courses:", error);
      toast.error(
        "Failed to load personalized courses. Using default courses."
      );
      // Fallback to regular courses
      fetchCourses();
    } finally {
      setIsDataLoading(false);
      setGeneratingPersonalized(false);
    }
  };

  const handleGenerateCourse = async (course) => {
    // Check if this is a personalized course
    const isPersonalized =
      course.personalized ||
      personalizedCourses.some((pc) => pc.id === course.id);

    if (isPersonalized) {
      // For personalized courses, show preparing and navigate
      setPreparingCourse(course.id);
      setTimeout(() => {
        const safeTopic = course.title
          .replace(/[^a-zA-Z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-");
        router.push(
          `/learn/${encodeURIComponent(safeTopic)}?format=course&difficulty=${course.difficulty || "intermediate"}&personalized=true&originalTopic=${encodeURIComponent(course.title)}`
        );
      }, 1500);
      return;
    }

    if (generatingCourse) return;

    setGeneratingCourse(course.id);
    toast.loading(`Generating course: ${course.title}...`, {
      id: "generating",
    });

    try {
      // Generate the course (auth via HttpOnly cookie)
      const response = await apiClient.post("/api/generate-course", {
        topic: course.title,
        format: "course",
        difficulty: course.difficulty || "beginner",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle monthly limit reached error
        if (response.status === 429) {
          toast.dismiss("generating");
          setShowUpgradeModal(true);
          return;
        }

        throw new Error(errorData.error || "Failed to generate course");
      }

      // Track that user generated this premium course (so it won't be deleted)
      try {
        await apiClient.post("/api/profile/update", {
          generatedPremiumCourse: {
            courseId: course.id,
            courseTitle: course.title,
            generatedAt: new Date().toISOString(),
          },
        });
      } catch (trackError) {
        console.error("Error tracking generated course:", trackError);
        // Don't fail the whole operation if tracking fails
      }

      const responseData = await response.json();

      toast.success(`Course "${course.title}" generated successfully!`, {
        id: "generating",
      });

      // Navigate to the learning page - course stays in the list
      if (responseData.courseId) {
        const safeTopic = course.title
          .replace(/[^a-zA-Z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-");
        router.push(
          `/learn/${encodeURIComponent(safeTopic)}?format=course&difficulty=${course.difficulty || "beginner"}&originalTopic=${encodeURIComponent(course.title)}`
        );
      }
    } catch (error) {
      console.error("Error generating course:", error);
      toast.error(error.message || "Failed to generate course", {
        id: "generating",
      });
    } finally {
      setGeneratingCourse(null);
    }
  };

  const handleUpgradePlan = async (plan) => {
    try {
      const response = await apiClient.post("/api/billing/create-session", { plan });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          toast.error("Please log in to upgrade.");
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 800);
        }
        const serverMessage =
          errorData.message || errorData.details || errorData.error;
        throw new Error(serverMessage || "Failed to create checkout session");
      }

      const data = await response.json();

      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error) {
      toast.error(
        error.message || "Failed to start upgrade process. Please try again."
      );
    }
  };

  const handleStartLearning = async (course) => {
    setPreparingCourse(course.id);
    // Simulate preparation time
    setTimeout(() => {
      const safeTopic = course.title
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      router.push(
        `/learn/${encodeURIComponent(safeTopic)}?format=course&difficulty=${course.difficulty || "intermediate"}&originalTopic=${encodeURIComponent(course.title)}`
      );
    }, 1500); // 1.5 seconds delay
  };

  const handleDelete = async (courseId) => {
    // TODO: Implement delete functionality

  };

  // Filter and search logic
  const coursesToDisplay =
    isPro && personalizedCourses.length > 0 ? personalizedCourses : courses;
  const filteredCourses = coursesToDisplay.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Display all filtered courses without pagination
  const paginatedCourses = filteredCourses;
  const totalPages = 1;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const getBadgeIcon = (badge) => {
    switch (badge) {
      case "Trending":
        return <TrendingUp className="w-3 h-3" />;
      case "Expert Level":
        return <Crown className="w-3 h-3" />;
      case "Industry Favorite":
        return <Award className="w-3 h-3" />;
      case "Creative Choice":
        return <Star className="w-3 h-3" />;
      case "High Demand":
        return <Zap className="w-3 h-3" />;
      case "Visual Excellence":
        return <Star className="w-3 h-3" />;
      default:
        return <Star className="w-3 h-3" />;
    }
  };

  const getBadgeColor = (badge) => {
    switch (badge) {
      case "Trending":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Expert Level":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "Industry Favorite":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Creative Choice":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      case "High Demand":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Visual Excellence":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      {/* Header */}
      <motion.div
        className="text-center mb-12 lg:mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="inline-flex items-center justify-center gap-3 mb-6 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl">
          <Sparkles className="w-5 h-5 text-white animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-white">Curated Excellence</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
          <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">Premium Courses</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
          Professional-grade curricula designed for deep mastery. Experience advanced AI tutoring, expert instruction, and comprehensive materials tailored to your learning goals.
        </p>
      </motion.div>

      {/* Search and Filter */}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search curricula, topics, or skills..."
            className="w-full pl-12 pr-4 py-3.5 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl">
            <Crown className="w-6 h-6" />
          </div>
        </div>
      </motion.div>

      {/* Free Plan Info Banner */}
      {!isPro && (
        <motion.div
          className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 md:p-8 mb-10 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Crown className="w-8 h-8 text-yellow-300" />
                <h2 className="text-xl font-bold">
                  Free Plan — 2 Premium Courses
                </h2>
              </div>
              <p className="text-violet-100 text-sm leading-relaxed">
                On the free plan you can generate up to <strong className="text-white">2 premium courses</strong>. Each course has <strong className="text-white">20 modules</strong> and <strong className="text-white">5 lessons</strong> per module — but you can only read the first <strong className="text-white">3 modules</strong>. Upgrade to Pro to unlock all 20 modules and generate up to 50 courses/month.
              </p>
            </div>
            <button
              onClick={() => handleUpgradePlan("pro")}
              className="shrink-0 bg-white text-primary px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Upgrade to Pro
            </button>
          </div>
        </motion.div>
      )}

      {/* Trending Courses Section */}
      {isPro && trendingCourses.length > 1 && (
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Latest Trending Courses
              </h2>
              <p className="text-sm text-slate-500">Hot topics gaining popularity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingCourses.slice(1).map((course, index) => (
              <motion.div
                key={course.id || index}
                whileHover={{ y: -4 }}
                className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 flex flex-col h-full"
              >
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-orange-500/20">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                      Trending
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{course.category || "General"}</span>
                  </div>
                  <h3 className="text-xl font-black text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 line-clamp-3 leading-relaxed font-medium">
                    {course.description}
                  </p>

                  <div className="mt-auto space-y-6">
                    {course.whyTrending && (
                      <div className="p-4 bg-orange-500/5 rounded-[1.5rem] border border-orange-500/10 group-hover:bg-orange-500/10 transition-colors">
                        <div className="flex items-center space-x-2 mb-1">
                          <Sparkles className="w-3 h-3 text-orange-500" />
                          <span className="text-[10px] text-orange-600 dark:text-orange-400 font-black uppercase tracking-widest">Why it's hot</span>
                        </div>
                        <p className="text-xs text-foreground/80 font-medium leading-relaxed italic">
                          "{course.whyTrending}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-5 border-t border-border">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 px-3 py-1 bg-secondary/50 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-orange-500" />
                          <span className="text-[11px] font-black text-foreground">{course.estimatedDuration || "6 weeks"}</span>
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{course.category || "General"}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleGenerateCourse(course)}
                      disabled={
                        generatingCourse === course.id ||
                        preparingCourse === course.id
                      }
                      className="group/btn relative w-full h-14 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black rounded-[1.25rem] overflow-hidden transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-3 text-[11px] uppercase tracking-[0.2em] cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                      <div className="relative flex items-center space-x-3">
                        {generatingCourse === course.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                            <span>Analyzing...</span>
                          </>
                        ) : preparingCourse === course.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                            <span>Synthesizing...</span>
                          </>
                        ) : (
                          <>
                            <span>Start Learning</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div >
      )
      }

      {/* Featured Course */}
      {
        isPro && featured && (
          <motion.div
            className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card mb-16 shadow-2xl shadow-primary/5"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Professional vibrant background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-indigo-600/5 dark:from-violet-900/10 dark:to-indigo-900/10" />
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-primary/10 to-transparent opacity-50" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />

            <div className="relative z-10 p-8 md:p-12 lg:p-16">
              <div className="flex flex-col lg:flex-row gap-12 items-center">
                {/* Left Column - Content */}
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
                        {isPro ? "Premium Exclusive" : "Upgrade to Access"}
                      </p>
                    </div>
                  </div>

                  <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6 leading-tight tracking-tight">
                    {featured.title}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed font-medium">
                    {featured.description}
                  </p>

                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-8 max-w-xl">
                    <p className="text-primary text-xs font-bold leading-relaxed flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Personalized for your learning goals. Refreshes monthly.</span>
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
                          <Star
                            key={i}
                            className="w-3 h-3 text-amber-500 fill-amber-500"
                          />
                        ))}
                        <span className="ml-2 font-black text-sm text-foreground">
                          {featured.rating}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground font-bold">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">10k+ Learners</span>
                    </div>
                  </div>

                  {!isPro && (
                    <div className="flex items-baseline space-x-3 mb-8">
                      <span className="text-3xl font-black text-foreground">
                        {featured.price}
                      </span>
                      {featured.originalPrice && (
                        <span className="text-xl text-muted-foreground line-through opacity-50">
                          {featured.originalPrice}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column - CTA & Premium Quote */}
                <div className="w-full lg:w-1/3 flex flex-col gap-6">
                  <div className="bg-secondary/30 border border-border rounded-3xl p-8 relative group hover:bg-secondary/50 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
                      <Crown className="w-12 h-12" />
                    </div>
                    <p className="text-foreground font-bold italic text-lg leading-relaxed relative mb-4">
                      "{featured.premiumNote || featured.staffNote}"
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
                    {isPro ? (
                      <button
                        onClick={() => handleStartLearning(featured)}
                        disabled={preparingCourse === featured.id}
                        className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-3"
                      >
                        {preparingCourse === featured.id ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground"></div>
                            <span>Preparing Curriculum</span>
                          </>
                        ) : (
                          <>
                            <span>Start Learning Now</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgradePlan("premium-course")}
                        className="w-full py-3 bg-foreground text-background font-bold rounded-xl transition-all"
                      >
                        Unlock Premium Now
                      </button>
                    )}
                    <p className="text-center text-[10px] text-muted-foreground mt-4 font-bold uppercase tracking-[0.2em]">
                      Instant Access to All Materials
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )
      }

      {/* Premium Courses Grid */}
      {
        isPro && (
        isDataLoading || generatingPersonalized ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {generatingPersonalized
                ? "Creating your personalized premium courses..."
                : "Loading premium courses..."}
            </p>
          </div>
        ) : (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {paginatedCourses.map((course, index) => (
                <motion.div
                  key={course.id || index}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col h-full"
                >
                  {/* Content Header */}
                  <div className="px-6 pt-6 flex justify-between items-start">
                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border ${getBadgeColor(course.badge)}`}>
                      {getBadgeIcon(course.badge)}
                      {course.badge}
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{course.category || "General"}</span>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-6 border-y border-border py-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                          <Users size={14} className="text-blue-500" />
                          <span className="text-[10px] font-medium">Students</span>
                        </div>
                        <span className="text-sm font-bold">{course.students?.toLocaleString() || "1.2k"}</span>
                      </div>
                      <div className="text-center border-x border-border">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                          <Clock size={14} className="text-orange-500" />
                          <span className="text-[10px] font-medium">Duration</span>
                        </div>
                        <span className="text-sm font-bold">{course.duration || "6w"}</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-[10px] font-medium">Rating</span>
                        </div>
                        <span className="text-sm font-bold">{course.rating || "4.8"}</span>
                      </div>
                    </div>

                    {/* Pricing/Access */}
                    {isPro && (
                      <div className="mb-6">
                        {(() => {
                          const { daysLeft, progress } = getCourseExpiryInfo(course.createdAt);
                          return (
                            <div className="w-full">
                              <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5 font-bold uppercase tracking-wider">
                                <span>Course Access</span>
                                <span className="text-primary">{daysLeft} days left</span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-auto space-y-3">
                      {isPro ? (
                        <button
                          onClick={() => handleStartLearning(course)}
                          disabled={preparingCourse === course.id}
                          className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn"
                        >
                          {preparingCourse === course.id ? (
                            <><div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground"></div> Preparing...</>
                          ) : (
                            <>
                              <span>Start Learning</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpgradePlan("premium-course")}
                          className="w-full py-3 px-6 rounded-xl bg-foreground text-background font-semibold hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <Crown className="w-5 h-5" />
                          <span>Get Premium Access</span>
                        </button>
                      )}

                      <p className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-[0.1em]">
                        AI-Powered Learning Experience
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-violet-300 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[40px] h-10 px-4 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${currentPage === page
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-primary/50"
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-violet-300 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

          </>
        )
      )}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Premium Courses"
        description="Free plan users are limited to 2 premium course generations per month. Upgrade to Pro to unlock unlimited access."
      />
    </div >
  );
}
