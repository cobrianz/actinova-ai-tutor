import { useState, useEffect } from "react"
import { BookOpen, Users, Clock, Star, TrendingUp, Search, Filter, ChevronLeft, ChevronRight, Bookmark } from "lucide-react"
import Link from "next/link"

export default function Explore() {
  const [categories, setCategories] = useState([])
  const [trendingTopics, setTrendingTopics] = useState([])
  const [featuredPaths, setFeaturedPaths] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState("")
  const [isPremium, setIsPremium] = useState("")
  const [pagination, setPagination] = useState({})
  const coursesPerPage = 12

  useEffect(() => {
    fetchExploreData()
  }, [])

  useEffect(() => {
    if (searchQuery || selectedCategory || selectedDifficulty || isPremium !== "") {
      fetchCourses()
    }
  }, [currentPage, searchQuery, selectedCategory, selectedDifficulty, isPremium])

  const fetchExploreData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/explore')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
        setTrendingTopics(data.trendingTopics)
        setFeaturedPaths(data.featuredPaths)
      }
    } catch (error) {
      console.error('Error fetching explore data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: coursesPerPage.toString(),
        search: searchQuery,
        category: selectedCategory,
        difficulty: selectedDifficulty,
        isPremium: isPremium
      })
      
      const response = await fetch(`/api/courses?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPagination(data.pagination)
        // You can set courses state here if you want to show them in a grid
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleBookmark = async (itemId, type, itemData) => {
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, type, itemData })
      })
      
      if (response.ok) {
        // Show success message or update UI
        console.log('Bookmarked successfully')
      }
    } catch (error) {
      console.error('Error bookmarking item:', error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Explore Learning Paths</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Discover curated learning paths and trending topics across various fields
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses, topics, or instructors..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <select
              value={isPremium}
              onChange={(e) => setIsPremium(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Courses</option>
              <option value="true">Premium Only</option>
              <option value="false">Free Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Browse by Category</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="h-6 w-20 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <div
                key={index}
                onClick={() => setSelectedCategory(category.name)}
                className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer ${
                  selectedCategory === category.name ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{category.name}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{category.count} courses</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{category.description}</p>
                <div className="flex flex-wrap gap-2">
                  {category.topics.slice(0, 4).map((topic, topicIndex) => (
                    <span
                      key={topicIndex}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                  {category.topics.length > 4 && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                      +{category.topics.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trending Topics */}
      <div className="mb-16">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trending This Week</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 animate-pulse">
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                <div className="flex space-x-4">
                  <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 w-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trendingTopics.map((topic, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow relative group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">{topic.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        topic.level === "Beginner"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : topic.level === "Intermediate"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {topic.level}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleBookmark(topic.title, 'course', topic);
                      }}
                      className="p-1 text-gray-400 hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{topic.description}</p>

                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{topic.students?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>{topic.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{topic.duration}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {topic.tags?.slice(0, 2).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    {topic.isPremium && (
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
                        Premium
                      </span>
                    )}
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      ${topic.price}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/learn/${encodeURIComponent(topic.title)}`}
                  className="absolute inset-0"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Learning Paths */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Featured Learning Paths</h2>

        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                <div className="flex space-x-6">
                  <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {featuredPaths.map((path, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{path.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{path.description}</p>

                    <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{path.modules} modules</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{path.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{path.students?.toLocaleString()} students</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {path.tags?.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          ${path.price}
                        </span>
                        {path.isPremium && (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
                            Premium
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-6">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleBookmark(path.title, 'learning-path', path);
                      }}
                      className="p-2 text-gray-400 hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <Link href={`/learn/${encodeURIComponent(path.title)}`} className="btn-primary">
                      Start Learning
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={!pagination.hasPrev}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
            const page = i + 1;
            return (
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
            );
          })}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
            disabled={!pagination.hasNext}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
