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
import ActinovaLoader from "./ActinovaLoader";
import { toast } from "sonner";

export default function PremiumCourses() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <ActinovaLoader />;
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

  // Check if user is Pro
  const isPro =
    user &&
    ((user.subscription &&
      (user.subscription.plan === "pro" || user.subscription.plan === "enterprise") &&
      user.subscription.status === "active") ||
      user.isPremium);

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
      const response = await fetch("/api/premium-courses");
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
      const response = await fetch("/api/premium-courses/trending", {
        credentials: "include",
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
      const response = await fetch("/api/premium-courses/personalized", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

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
      const response = await fetch("/api/generate-course", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: course.title,
          format: "course",
          difficulty: course.difficulty || "beginner",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle monthly limit reached error
        if (response.status === 429) {
          toast.dismiss("generating");
          // This shouldn't happen for premium users, but handle it gracefully
          toast.error(
            `Monthly limit reached (${errorData.used || 0}/${errorData.limit || 2}). Please try again next month.`,
            {
              id: "generating",
            }
          );
          return;
        }

        throw new Error(errorData.error || "Failed to generate course");
      }

      // Track that user generated this premium course (so it won't be deleted)
      try {
        await fetch("/api/profile/update", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            generatedPremiumCourse: {
              courseId: course.id,
              courseTitle: course.title,
              generatedAt: new Date().toISOString(),
            },
          }),
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
      const response = await fetch("/api/billing/create-session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

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
    <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
      {/* Header */}
      <motion.div
        className="text-center mb-16 lg:mb-24"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="inline-flex items-center justify-center space-x-3 mb-6 px-4 py-2 bg-primary/5 rounded-2xl border border-primary/10">
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Curated Excellence</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-foreground mb-8 tracking-tight">
          <span className="bg-gradient-to-r from-primary via-blue-600 to-accent bg-clip-text text-transparent">Premium Courses</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
          Professional-grade curricula designed for deep mastery. Experience advanced AI tutoring, expert instruction, and comprehensive materials tailored to your learning goals.
        </p>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search curricula, topics, or skills..."
            className="w-full pl-12 pr-4 py-4 border border-border rounded-2xl bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
          />
        </div>
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-foreground text-background rounded-2xl shadow-xl">
            <Crown className="w-6 h-6" />
          </div>
        </div>
      </motion.div>

      {/* Pro User Required Message */}
      {!isPro && (
        <motion.div
          className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 mb-12 text-white text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Crown className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
          <h2 className="text-2xl font-bold mb-4">
            Unlock Premium Trending Courses
          </h2>
          <p className="text-orange-100 mb-6 max-w-2xl mx-auto">
            Get access to the latest trending courses generated by AI,
            personalized to your interests. Upgrade to Pro to discover
            cutting-edge topics and stay ahead in your learning journey.
          </p>
          <button
            onClick={() => handleUpgradePlan("pro")}
            className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Upgrade to Pro
          </button>
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
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Latest Trending Courses
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingCourses.slice(1).map((course, index) => (
              <motion.div
                key={course.id || index}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group bg-card/60 backdrop-blur-xl border border-border rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 flex flex-col h-full"
              >
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 transition-transform duration-700 group-hover:scale-110">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TrendingUp size={64} className="text-white/20 transform -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                  </div>
                  <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 border border-white/20 ring-1 ring-white/10">
                    <TrendingUp className="w-3 h-3" />
                    <span>Trending Now</span>
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-1">
                  <h3 className="text-xl font-black text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 line-clamp-3 leading-relaxed font-medium">
                    {course.description}
                  </p>

                  <div className="mt-auto space-y-6">
                    {course.whyTrending && (
                      <div className="p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                        <p className="text-[10px] text-orange-600 dark:text-orange-400 font-black uppercase tracking-[0.1em] leading-relaxed">
                          <span className="opacity-60 mr-1">Status:</span> {course.whyTrending}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span className="text-xs font-bold text-foreground">{course.estimatedDuration || "6 weeks"}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-xs font-bold text-muted-foreground uppercase">{course.category || "General"}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleGenerateCourse(course)}
                      disabled={
                        generatingCourse === course.id ||
                        preparingCourse === course.id
                      }
                      className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black rounded-2xl hover:shadow-xl hover:shadow-orange-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-3 text-xs uppercase tracking-widest cursor-pointer"
                    >
                      {generatingCourse === course.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                          <span>Generating...</span>
                        </>
                      ) : preparingCourse === course.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                          <span>Preparing Curriculum</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Course</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Featured Course */}
      {featured && (
        <motion.div
          className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card/40 backdrop-blur-xl shadow-2xl shadow-primary/5 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-background to-purple-600/10 opacity-50 dark:opacity-20" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]" />

          <div className="relative z-10 p-8 md:p-12 lg:p-16">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              {/* Left Column - Content */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-600/20">
                    <Crown className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-black text-xs uppercase tracking-[0.2em]">
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
                  <div className="flex items-center space-x-2 text-foreground/80 font-bold bg-secondary/50 px-4 py-2 rounded-xl border border-border">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm">{featured.duration}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-secondary/50 px-4 py-2 rounded-xl border border-border">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 text-yellow-500 fill-yellow-500"
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
                <div className="bg-card/80 border border-border rounded-3xl p-8 relative group hover:border-primary/30 transition-colors shadow-xl shadow-primary/5">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
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
                      Actinova Premium Team
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  {isPro ? (
                    <button
                      onClick={() => handleStartLearning(featured)}
                      disabled={preparingCourse === featured.id}
                      className="w-full py-5 bg-primary text-primary-foreground font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center space-x-3"
                    >
                      {preparingCourse === featured.id ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground"></div>
                          <span>Preparing Curriculum</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-6 h-6" />
                          <span>Start Learning Now</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgradePlan("premium-course")}
                      className="w-full py-5 bg-foreground text-background font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-foreground/10"
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
      )}

      {/* Premium Courses Grid */}
      {isDataLoading || generatingPersonalized ? (
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
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative bg-card/60 backdrop-blur-xl border border-border rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 flex flex-col h-full"
              >
                {/* Visual Header */}
                <div className="relative h-48 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br transition-transform duration-700 group-hover:scale-110 ${index % 3 === 0 ? "from-blue-600 to-indigo-700" :
                    index % 3 === 1 ? "from-purple-600 to-indigo-700" :
                      "from-blue-700 to-purple-600"
                    }`}>
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                  </div>

                  {/* Floating Icons for context */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity">
                    <BookOpen size={64} className="text-white transform -rotate-12" />
                  </div>

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-md ${getBadgeColor(course.badge)}`}>
                      {getBadgeIcon(course.badge)}
                      {course.badge}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
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
                                className="bg-primary h-1.5 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(var(--primary),0.5)]"
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
                        className="w-full py-3.5 px-6 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn"
                      >
                        {preparingCourse === course.id ? (
                          <><div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground"></div> Preparing...</>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 group-hover/btn:animate-pulse" />
                            <span>Start Learning Now</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgradePlan("premium-course")}
                        className="w-full py-3.5 px-6 rounded-2xl bg-foreground text-background font-bold shadow-lg hover:shadow-foreground/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2"
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


        </>
      )}
    </div>
  );
}
