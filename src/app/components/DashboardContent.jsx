"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, BookOpen, FileText, ChevronDown } from "lucide-react"

export default function DashboardContent() {
  const [topic, setTopic] = useState("")
  const [format, setFormat] = useState("course")
  const [difficulty, setDifficulty] = useState("beginner")
  const [explainMore, setExplainMore] = useState(false)
  const router = useRouter()

  const handleGenerate = () => {
    if (topic.trim()) {
      router.push(
        `/learn/${encodeURIComponent(topic.trim())}?format=${format}&difficulty=${difficulty}&explain=${explainMore}`,
      )
    }
  }

  const recentCourses = [
    { title: "JavaScript Fundamentals", progress: 75, lastAccessed: "2 hours ago" },
    { title: "React Development", progress: 40, lastAccessed: "1 day ago" },
    { title: "Node.js Backend", progress: 10, lastAccessed: "3 days ago" },
  ]

  const featuredTopics = [
    "Artificial Intelligence",
    "Frontend Development",
    "Backend Development",
    "Data Science",
    "Machine Learning",
    "Web Development",
    "Mobile Development",
    "DevOps",
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome back, John! 👋</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Ready to continue your learning journey? Let's create something amazing today.
            </p>
          </div>

          {/* AI Tutor Interface */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                What can I help you learn today?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Enter a topic below to generate a personalized course for it
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                  What can I help you learn?
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter a topic"
                  className="input-field"
                  onKeyPress={(e) => e.key === "Enter" && handleGenerate()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-left">
                  Choose the format
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFormat("course")}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      format === "course"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <BookOpen className="w-6 h-6 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                    <span className="font-medium">Course</span>
                  </button>
                  <button
                    onClick={() => setFormat("guide")}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      format === "guide"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <FileText className="w-6 h-6 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                    <span className="font-medium">Guide</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                  Choose difficulty level
                </label>
                <div className="relative">
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="input-field appearance-none pr-10"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center space-x-3 text-left">
                <input
                  type="checkbox"
                  id="explain-more"
                  checked={explainMore}
                  onChange={(e) => setExplainMore(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="explain-more" className="text-sm text-gray-700 dark:text-gray-300">
                  Explain more for a better result
                </label>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!topic.trim()}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>Generate</span>
              </button>
            </div>
          </div>

          {/* Quick Topics */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Popular Learning Tracks</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {featuredTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setTopic(topic)}
                  className="p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{topic}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Courses */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Continue Learning</h3>
            <div className="space-y-4">
              {recentCourses.map((course, index) => (
                <div
                  key={index}
                  className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0"
                >
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{course.title}</h4>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{course.progress}% complete</span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">{course.lastAccessed}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Limit */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Daily Usage</h3>
              <span className="text-sm text-blue-600 dark:text-blue-400">4% used</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: "4%" }}></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              You have plenty of AI generations left today!
            </p>
            <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:from-blue-700 hover:to-purple-700 transition-all">
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
