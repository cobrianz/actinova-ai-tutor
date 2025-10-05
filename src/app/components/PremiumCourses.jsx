"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Star, BookOpen, Clock, Users, Award, TrendingUp, Crown, Zap, Search, Filter, Bookmark, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function PremiumCourses() {
  const [courses, setCourses] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Courses");
  const coursesPerPage = 6;

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/premium-courses');
      if (response.ok) {
        const data = await response.json();
        setFeatured(data.featured);
        setCourses(data.courses);
      }
    } catch (error) {
      console.error('Error fetching premium courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = async (plan) => {
    try {
      const response = await fetch('/api/billing/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        console.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const handleBookmark = async (courseId) => {
    // TODO: Implement bookmark functionality
    console.log('Bookmark course:', courseId);
  };

  const handleDelete = async (courseId) => {
    // TODO: Implement delete functionality
    console.log('Delete course:', courseId);
  };

  // Filter and search logic
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Courses" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const startIndex = (currentPage - 1) * coursesPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + coursesPerPage);

  const categories = [
    { name: "All Courses", count: courses.length, active: selectedCategory === "All Courses" },
    { name: "Programming", count: courses.filter(c => c.category.includes("Programming") || c.category.includes("Frontend") || c.category.includes("Full-Stack")).length },
    { name: "AI/ML", count: courses.filter(c => c.category.includes("AI") || c.category.includes("ML")).length },
    { name: "Data Science", count: courses.filter(c => c.category.includes("Data")).length },
    { name: "Cloud", count: courses.filter(c => c.category.includes("Cloud")).length },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const getBadgeIcon = (badge) => {
    switch (badge) {
      case "Trending":
        return <TrendingUp className="w-3 h-3" />
      case "Expert Level":
        return <Crown className="w-3 h-3" />
      case "Industry Favorite":
        return <Award className="w-3 h-3" />
      case "Creative Choice":
        return <Star className="w-3 h-3" />
      case "High Demand":
        return <Zap className="w-3 h-3" />
      case "Visual Excellence":
        return <Star className="w-3 h-3" />
      default:
        return <Star className="w-3 h-3" />
    }
  }

  const getBadgeColor = (badge) => {
    switch (badge) {
      case "Trending":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "Expert Level":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "Industry Favorite":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "Creative Choice":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
      case "High Demand":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "Visual Excellence":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Star className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Premium Courses</h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          High-quality courses with advanced features, expert instruction, and comprehensive learning materials.
        </p>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search premium courses..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        className="flex flex-wrap justify-center gap-2 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {categories.map((category, index) => (
          <motion.button
            key={category.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(category.name)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category.active
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {category.name} ({category.count})
          </motion.button>
        ))}
      </motion.div>

      {/* Featured Course */}
      {featured && (
        <motion.div
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-12 text-white"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Crown className="w-6 h-6 text-yellow-300" />
            <span className="text-yellow-300 font-semibold">Featured Premium Course</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">{featured.title}</h2>
              <p className="text-blue-100 mb-6">{featured.description}</p>

              <div className="flex items-center space-x-6 mb-6 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{featured.students?.toLocaleString()} students</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{featured.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-300" />
                  <span>{featured.rating}</span>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-4 mb-6">
                <p className="text-sm italic">"{featured.premiumNote || featured.staffNote}"</p>
                <p className="text-xs text-blue-200 mt-2">- Premium Team</p>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <div className="text-3xl font-bold">${featured.price}</div>
                {featured.originalPrice && (
                  <div className="text-lg text-blue-200 line-through">${featured.originalPrice}</div>
                )}
              </div>

              <button
                onClick={() => handleUpgradePlan('premium-course')}
                className="mt-4 w-full py-3 px-4 rounded-lg font-medium transition-all bg-white text-blue-600 hover:bg-gray-100 shadow-lg"
              >
                Purchase Premium Course
              </button>
            </div>

            <div className="relative">
              <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg shadow-2xl flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400">Course Preview</span>
              </div>
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                Premium
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Premium Courses Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading premium courses...</p>
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
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white opacity-80" />
                  </div>
                  <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold">
                    Premium
                  </div>
                  {course.badge && (
                    <div
                      className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getBadgeColor(course.badge)}`}
                    >
                      {getBadgeIcon(course.badge)}
                      <span>{course.badge}</span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{course.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{course.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">by {course.instructor}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleBookmark(course.id)}
                        className="p-1 text-gray-400 hover:text-yellow-500"
                        title="Bookmark course"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{course.students?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{course.rating}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{course.premiumNote || course.staffNote}"</p>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">${course.price}</span>
                      {course.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">${course.originalPrice}</span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/learn/${encodeURIComponent(course.title)}`}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block"
                  >
                    Start Learning
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              className="flex items-center justify-center space-x-2 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </>
      )}

      {/* CTA Section */}
      <motion.div
        className="text-center mt-16 bg-gray-50 dark:bg-gray-800 rounded-2xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Want to see your course featured?</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Create exceptional learning experiences and get noticed by our education team.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <span>Contact Our Team</span>
        </Link>
      </motion.div>
    </div>
  )
}
