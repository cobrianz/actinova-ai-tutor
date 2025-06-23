"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, ArrowRight, Search, Tag, TrendingUp, Sparkles } from "lucide-react"
import Link from "next/link"
import HeroNavbar from "../components/heroNavbar"

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const featuredPost = {
    id: 1,
    title: "The Future of AI-Powered Education: Trends to Watch in 2024",
    excerpt:
      "Explore how artificial intelligence is revolutionizing the way we learn and teach, from personalized learning paths to intelligent tutoring systems.",
    author: "Sarah Chen",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    date: "December 15, 2024",
    readTime: "8 min read",
    category: "AI & Technology",
    image: "/placeholder.svg?height=400&width=800",
    tags: ["AI", "Education", "Technology", "Future"],
    featured: true,
  }

  const blogPosts = [
    {
      id: 2,
      title: "10 Effective Study Techniques Backed by Science",
      excerpt:
        "Discover evidence-based learning strategies that can help you retain information better and study more efficiently.",
      author: "Dr. Michael Rodriguez",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      date: "December 12, 2024",
      readTime: "6 min read",
      category: "Learning Tips",
      image: "/placeholder.svg?height=300&width=400",
      tags: ["Study Tips", "Science", "Learning"],
      trending: true,
    },
    {
      id: 3,
      title: "Building a Successful Remote Learning Environment",
      excerpt:
        "Tips and strategies for creating an optimal learning space at home that promotes focus and productivity.",
      author: "Emma Thompson",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      date: "December 10, 2024",
      readTime: "5 min read",
      category: "Remote Learning",
      image: "/placeholder.svg?height=300&width=400",
      tags: ["Remote Learning", "Productivity", "Environment"],
    },
    {
      id: 4,
      title: "The Psychology of Motivation in Online Learning",
      excerpt: "Understanding what drives learners and how to maintain motivation throughout your educational journey.",
      author: "Dr. Lisa Park",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      date: "December 8, 2024",
      readTime: "7 min read",
      category: "Psychology",
      image: "/placeholder.svg?height=300&width=400",
      tags: ["Psychology", "Motivation", "Online Learning"],
    },
    {
      id: 5,
      title: "Mastering JavaScript: A Beginner's Roadmap",
      excerpt: "A comprehensive guide to learning JavaScript from scratch, including resources and project ideas.",
      author: "Alex Kim",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      date: "December 5, 2024",
      readTime: "10 min read",
      category: "Programming",
      image: "/placeholder.svg?height=300&width=400",
      tags: ["JavaScript", "Programming", "Beginner"],
    },
    {
      id: 6,
      title: "The Rise of Microlearning: Learning in Small Chunks",
      excerpt: "How breaking down complex topics into bite-sized lessons can improve retention and engagement.",
      author: "James Wilson",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      date: "December 3, 2024",
      readTime: "4 min read",
      category: "Learning Methods",
      image: "/placeholder.svg?height=300&width=400",
      tags: ["Microlearning", "Education", "Methods"],
    },
    {
      id: 7,
      title: "Career Transition: From Beginner to Professional Developer",
      excerpt: "Real stories and practical advice from developers who successfully transitioned into tech careers.",
      author: "Maria Garcia",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      date: "November 30, 2024",
      readTime: "9 min read",
      category: "Career",
      image: "/placeholder.svg?height=300&width=400",
      tags: ["Career", "Development", "Transition"],
    },
  ]

  const categories = [
    { name: "All", value: "all", count: blogPosts.length + 1 },
    { name: "AI & Technology", value: "ai-technology", count: 2 },
    { name: "Learning Tips", value: "learning-tips", count: 3 },
    { name: "Programming", value: "programming", count: 2 },
    { name: "Career", value: "career", count: 1 },
  ]

  const allPosts = [featuredPost, ...blogPosts]
  const filteredPosts = allPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" ||
      post.category.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "") === selectedCategory
    return matchesSearch && matchesCategory
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HeroNavbar/>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Learning Insights & Tips
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Discover the latest trends in education, learning strategies, and insights from our community of educators
            and learners.
          </p>
        </motion.div>

        {/* Search and Categories */}
        <motion.div
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12"
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
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <motion.button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {category.name} ({category.count})
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Featured Post */}
        {filteredPosts.includes(featuredPost) && (
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">Featured Article</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-4">{featuredPost.title}</h2>
                  <p className="text-blue-100 mb-6">{featuredPost.excerpt}</p>

                  <div className="flex items-center space-x-6 mb-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <img
                        src={featuredPost.authorAvatar || "/placeholder.svg"}
                        alt={featuredPost.author}
                        className="w-6 h-6 rounded-full"
                      />
                      <span>{featuredPost.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{featuredPost.date}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{featuredPost.readTime}</span>
                    </div>
                  </div>

                  <Link
                    href={`/blog/${featuredPost.id}`}
                    className="inline-flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="relative">
                  <img
                    src={featuredPost.image || "/placeholder.svg"}
                    alt={featuredPost.title}
                    className="rounded-lg shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Blog Posts Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory + searchQuery}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredPosts
              .filter((post) => !post.featured)
              .map((post) => (
                <motion.article
                  key={post.id}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative">
                    <img src={post.image || "/placeholder.svg"} alt={post.title} className="w-full h-48 object-cover" />
                    {post.trending && (
                      <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Trending</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-xs">
                      {post.category}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{post.excerpt}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs flex items-center space-x-1"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={post.authorAvatar || "/placeholder.svg"}
                          alt={post.author}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{post.author}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{post.date}</span>
                            <span>•</span>
                            <span>{post.readTime}</span>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/blog/${post.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm flex items-center space-x-1"
                      >
                        <span>Read</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No articles found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery
                ? `No articles match "${searchQuery}" in the selected category.`
                : "No articles found in the selected category."}
            </p>
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("all")
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* Newsletter Signup */}
        <motion.div
          className="mt-20 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Stay Updated with Learning Insights</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Get the latest articles, learning tips, and educational insights delivered to your inbox weekly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Subscribe
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
