"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Clock, Star, Search, Grid, List, Play, Bookmark, MoreHorizontal } from "lucide-react"
import Link from "next/link"

export default function LibraryPage() {
  const [viewMode, setViewMode] = useState("grid") // "grid" or "list"
  const [filterBy, setFilterBy] = useState("all") // "all", "completed", "in-progress", "bookmarked"
  const [searchQuery, setSearchQuery] = useState("")

  const savedCourses = [
    {
      id: 1,
      title: "JavaScript Fundamentals",
      description: "Master the core concepts of JavaScript programming",
      progress: 75,
      totalLessons: 24,
      completedLessons: 18,
      lastAccessed: "2 hours ago",
      estimatedTime: "3 weeks",
      difficulty: "beginner",
      category: "Programming",
      isBookmarked: true,
      thumbnail: "/placeholder.svg?height=200&width=300",
      instructor: "John Smith",
      rating: 4.8,
    },
    {
      id: 2,
      title: "React Development",
      description: "Build modern web applications with React",
      progress: 40,
      totalLessons: 32,
      completedLessons: 13,
      lastAccessed: "1 day ago",
      estimatedTime: "5 weeks",
      difficulty: "intermediate",
      category: "Frontend",
      isBookmarked: false,
      thumbnail: "/placeholder.svg?height=200&width=300",
      instructor: "Sarah Johnson",
      rating: 4.9,
    },
    {
      id: 3,
      title: "Node.js Backend",
      description: "Create scalable backend applications",
      progress: 10,
      totalLessons: 28,
      completedLessons: 3,
      lastAccessed: "3 days ago",
      estimatedTime: "4 weeks",
      difficulty: "intermediate",
      category: "Backend",
      isBookmarked: true,
      thumbnail: "/placeholder.svg?height=200&width=300",
      instructor: "Mike Chen",
      rating: 4.7,
    },
    {
      id: 4,
      title: "Python for Data Science",
      description: "Analyze data and build ML models with Python",
      progress: 100,
      totalLessons: 36,
      completedLessons: 36,
      lastAccessed: "1 week ago",
      estimatedTime: "6 weeks",
      difficulty: "beginner",
      category: "Data Science",
      isBookmarked: false,
      thumbnail: "/placeholder.svg?height=200&width=300",
      instructor: "Dr. Emily Rodriguez",
      rating: 4.9,
    },
    {
      id: 5,
      title: "UI/UX Design Principles",
      description: "Create beautiful and functional user interfaces",
      progress: 60,
      totalLessons: 20,
      completedLessons: 12,
      lastAccessed: "2 days ago",
      estimatedTime: "4 weeks",
      difficulty: "beginner",
      category: "Design",
      isBookmarked: true,
      thumbnail: "/placeholder.svg?height=200&width=300",
      instructor: "Alex Kim",
      rating: 4.6,
    },
  ]

  const filteredCourses = savedCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())

    switch (filterBy) {
      case "completed":
        return matchesSearch && course.progress === 100
      case "in-progress":
        return matchesSearch && course.progress > 0 && course.progress < 100
      case "bookmarked":
        return matchesSearch && course.isBookmarked
      default:
        return matchesSearch
    }
  })

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
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
        >
          {filteredCourses.map((course) => (
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
                  <img
                    src={course.thumbnail || "/placeholder.svg"}
                    alt={course.title}
                    className={`w-full object-cover ${viewMode === "list" ? "h-32" : "h-48"}`}
                  />
                </div>

                {/* Content */}
                <div className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{course.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{course.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">by {course.instructor}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1 text-gray-400 hover:text-yellow-500"
                      >
                        <Bookmark
                          className={`w-4 h-4 ${course.isBookmarked ? "fill-yellow-500 text-yellow-500" : ""}`}
                        />
                      </motion.button>
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
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

      {/* Empty State */}
      {filteredCourses.length === 0 && (
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
