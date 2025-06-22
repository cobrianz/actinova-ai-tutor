"use client"

import { useState } from "react"
import { BookOpen, Clock, Target, Play, Bookmark, Share2 } from "lucide-react"
import Link from "next/link"

export default function Roadmap() {
  const [activeTab, setActiveTab] = useState("saved")

  // Mock saved roadmaps
  const savedRoadmaps = [
    {
      id: 1,
      title: "JavaScript Fundamentals",
      progress: 75,
      totalLessons: 24,
      completedLessons: 18,
      lastAccessed: "2 days ago",
      estimatedTime: "3 weeks",
    },
    {
      id: 2,
      title: "React Development",
      progress: 40,
      totalLessons: 32,
      completedLessons: 13,
      lastAccessed: "1 week ago",
      estimatedTime: "5 weeks",
    },
    {
      id: 3,
      title: "Node.js Backend",
      progress: 10,
      totalLessons: 28,
      completedLessons: 3,
      lastAccessed: "3 weeks ago",
      estimatedTime: "4 weeks",
    },
  ]

  const inProgressRoadmaps = savedRoadmaps.filter((roadmap) => roadmap.progress > 0 && roadmap.progress < 100)
  const completedRoadmaps = savedRoadmaps.filter((roadmap) => roadmap.progress === 100)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Learning Roadmaps</h1>
        <p className="text-gray-600 dark:text-gray-400">Track your progress and continue your learning journey</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "saved", label: "All Roadmaps", count: savedRoadmaps.length },
            { id: "progress", label: "In Progress", count: inProgressRoadmaps.length },
            { id: "completed", label: "Completed", count: completedRoadmaps.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Roadmap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(activeTab === "saved"
          ? savedRoadmaps
          : activeTab === "progress"
            ? inProgressRoadmaps
            : completedRoadmaps
        ).map((roadmap) => (
          <div
            key={roadmap.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Progress Bar */}
            <div className="h-2 bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                style={{ width: `${roadmap.progress}%` }}
              ></div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{roadmap.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span>
                        {roadmap.completedLessons}/{roadmap.totalLessons}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{roadmap.estimatedTime}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{roadmap.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${roadmap.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Last accessed {roadmap.lastAccessed}</span>
                <Link
                  href={`/learn/${encodeURIComponent(roadmap.title)}`}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Continue</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {(activeTab === "saved" ? savedRoadmaps : activeTab === "progress" ? inProgressRoadmaps : completedRoadmaps)
        .length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No roadmaps found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {activeTab === "completed"
              ? "You haven't completed any roadmaps yet."
              : activeTab === "progress"
                ? "You don't have any roadmaps in progress."
                : "Start learning by creating your first roadmap."}
          </p>
          <Link href="/" className="btn-primary">
            Create New Roadmap
          </Link>
        </div>
      )}
    </div>
  )
}
