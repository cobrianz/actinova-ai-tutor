"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Clock, Star, Search, Grid, List, Play, Bookmark, MoreHorizontal, Trash2, ChevronLeft, ChevronRight, Filter, Trophy, Flame } from "lucide-react"
import Link from "next/link"

export default function Library() {
  const [viewMode, setViewMode] = useState("grid") // "grid" or "list"
  const [filterBy, setFilterBy] = useState("all") // "all", "completed", "in-progress", "bookmarked"
  const [searchQuery, setSearchQuery] = useState("")
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [stats, setStats] = useState({})
  const [achievements, setAchievements] = useState([])
  const coursesPerPage = 6

  useEffect(() => {
    fetchLibraryData();
  }, [currentPage, filterBy, searchQuery]);

  const fetchLibraryData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: coursesPerPage.toString(),
        filter: filterBy,
        search: searchQuery
      });
      
      const response = await fetch(`/api/library?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses);
        setPagination(data.pagination);
        setStats(data.stats);
        setAchievements(data.achievements);
      }
    } catch (error) {
      console.error('Error fetching library data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (courseId) => {
    try {
      const response = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bookmark', courseId })
      });
      
      if (response.ok) {
        fetchLibraryData(); // Refresh data
      }
    } catch (error) {
      console.error('Error bookmarking course:', error);
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to remove this course from your library?')) {
      try {
        const response = await fetch('/api/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', courseId })
        });
        
        if (response.ok) {
          fetchLibraryData(); // Refresh data
        }
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Library</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your personal collection of saved courses and learning materials
        </p>
      </motion.div>

      {/* Stats */}
      {stats && Object.keys(stats).length > 0 && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
            <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalCourses}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Courses</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
            <Trophy className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.completedCourses}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
            <Bookmark className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.bookmarkedCourses}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Bookmarked</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
            <Flame className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.streak}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
          </div>
        </motion.div>
      )}

      {/* Achievements */}
      {achievements && achievements.length > 0 && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Achievements</h3>
          <div className="flex flex-wrap gap-2">
            {achievements.slice(0, 3).map((achievement) => (
              <div
                key={achievement.id}
                className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1"
              >
                <Trophy className="w-3 h-3" />
                <span>{achievement.title}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your library..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-4">
          {/* Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Courses</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="bookmarked">Bookmarked</option>
          </select>

          {/* View Mode */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${viewMode === "grid" ? "bg-white dark:bg-gray-600 shadow-sm" : ""}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${viewMode === "list" ? "bg-white dark:bg-gray-600 shadow-sm" : ""}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Course Grid/List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your library...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
          >
            {courses.map((course) => (
            <motion.div
              key={course.id}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${
                viewMode === "list" ? "flex" : ""
              }`}
            >
              {/* Progress Bar */}
              <div className="h-2 bg-gray-200 dark:bg-gray-700">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${course.progress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>

              <div className={`${viewMode === "list" ? "flex flex-1" : ""}`}>
                {/* Thumbnail */}
                <div className={`${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className={`w-full object-cover ${viewMode === "list" ? "h-32" : "h-48"}`}
                    />
                  ) : course.isGenerated ? (
                    <div className={`w-full ${viewMode === "list" ? "h-32" : "h-48"} bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center`}>
                      <BookOpen className="w-12 h-12 text-white opacity-80" />
                    </div>
                  ) : (
                    <img
                      src="/placeholder.svg"
                      alt={course.title}
                      className={`w-full object-cover ${viewMode === "list" ? "h-32" : "h-48"}`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{course.title}</h3>
                        {course.isGenerated && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                            AI Generated
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{course.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">by {course.instructor}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleBookmark(course.id)}
                        className="p-1 text-gray-400 hover:text-yellow-500"
                      >
                        <Bookmark
                          className={`w-4 h-4 ${course.isBookmarked ? "fill-yellow-500 text-yellow-500" : ""}`}
                        />
                      </motion.button>
                      {!course.isGenerated && (
                        <button 
                          onClick={() => handleDelete(course.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span>
                        {course.completedLessons}/{course.totalLessons}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.estimatedTime}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{course.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          className="bg-blue-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>

                    <Link
                      href={`/learn/${encodeURIComponent(course.title)}`}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      <span>{course.progress === 100 ? "Review" : "Continue"}</span>
                    </Link>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">Last accessed {course.lastAccessed}</p>
                </div>
              </div>
            </motion.div>
          ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <motion.div
          className="flex items-center justify-center space-x-2 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!pagination.hasPrev}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
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
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!pagination.hasNext}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && courses.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {searchQuery ? "No courses found" : "Your library is empty"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery ? `No courses match "${searchQuery}"` : "Start learning by adding courses to your library."}
          </p>
          <Link href="/explore" className="btn-primary">
            Explore Courses
          </Link>
        </motion.div>
      )}
    </div>
  )
}
