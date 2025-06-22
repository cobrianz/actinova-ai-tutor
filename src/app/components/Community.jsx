"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  MessageCircle,
  Heart,
  BookOpen,
  Award,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Plus,
  ThumbsUp,
  MessageSquare,
  Eye,
} from "lucide-react"
import CreateDiscussion from "./CreateDiscussion"
import JoinGroup from "./JoinGroup"

export default function Community() {
  const [activeTab, setActiveTab] = useState("discussions") // "discussions", "study-groups", "achievements"
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDiscussion, setShowCreateDiscussion] = useState(false)
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [allDiscussions, setAllDiscussions] = useState([
    {
      id: 1,
      title: "Best practices for learning React in 2024?",
      author: "Sarah Chen",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      category: "Frontend Development",
      replies: 23,
      likes: 45,
      views: 234,
      timeAgo: "2 hours ago",
      isHot: true,
      tags: ["React", "JavaScript", "Frontend"],
      preview: "I'm starting my React journey and wondering what the current best practices are...",
    },
    {
      id: 2,
      title: "Study group for Machine Learning fundamentals",
      author: "Mike Rodriguez",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      category: "AI/ML",
      replies: 12,
      likes: 28,
      views: 156,
      timeAgo: "4 hours ago",
      isHot: false,
      tags: ["Machine Learning", "Python", "Study Group"],
      preview: "Looking for motivated learners to join a weekly ML study group...",
    },
    {
      id: 3,
      title: "How to transition from frontend to full-stack?",
      author: "Emma Thompson",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      category: "Career",
      replies: 34,
      likes: 67,
      views: 445,
      timeAgo: "6 hours ago",
      isHot: true,
      tags: ["Career", "Full-Stack", "Backend"],
      preview: "I've been doing frontend for 2 years and want to expand to backend...",
    },
    {
      id: 4,
      title: "Free resources for learning TypeScript",
      author: "Alex Kim",
      authorAvatar: "/placeholder.svg?height=40&width=40",
      category: "Resources",
      replies: 18,
      likes: 52,
      views: 289,
      timeAgo: "8 hours ago",
      isHot: false,
      tags: ["TypeScript", "Resources", "Free"],
      preview: "Compiled a list of the best free TypeScript learning resources...",
    },
  ])

  const handleCreateDiscussion = (newDiscussion) => {
    setAllDiscussions([newDiscussion, ...allDiscussions])
  }

  const handleJoinGroup = (groupId) => {
    console.log(`Joined group ${groupId}`)
  }

  const openJoinGroup = (group) => {
    setSelectedGroup(group)
    setShowJoinGroup(true)
  }

  const studyGroups = [
    {
      id: 1,
      name: "JavaScript Fundamentals Study Circle",
      description: "Weekly meetups to discuss JS concepts and solve coding challenges together",
      members: 24,
      nextMeeting: "Tomorrow, 7:00 PM",
      difficulty: "Beginner",
      tags: ["JavaScript", "Beginner", "Weekly"],
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 2,
      name: "React Advanced Patterns Workshop",
      description: "Deep dive into advanced React patterns and best practices",
      members: 16,
      nextMeeting: "Friday, 6:00 PM",
      difficulty: "Advanced",
      tags: ["React", "Advanced", "Patterns"],
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 3,
      name: "Data Science Project Team",
      description: "Collaborative projects using Python, pandas, and machine learning",
      members: 31,
      nextMeeting: "Sunday, 3:00 PM",
      difficulty: "Intermediate",
      tags: ["Data Science", "Python", "Projects"],
      image: "/placeholder.svg?height=200&width=300",
    },
  ]

  const achievements = [
    {
      id: 1,
      user: "Sarah Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      achievement: "Completed 10 courses",
      badge: "Learning Enthusiast",
      timeAgo: "1 hour ago",
      likes: 12,
    },
    {
      id: 2,
      user: "Mike Rodriguez",
      avatar: "/placeholder.svg?height=40&width=40",
      achievement: "Helped 50 community members",
      badge: "Community Helper",
      timeAgo: "3 hours ago",
      likes: 28,
    },
    {
      id: 3,
      user: "Emma Thompson",
      avatar: "/placeholder.svg?height=40&width=40",
      achievement: "30-day learning streak",
      badge: "Consistency Champion",
      timeAgo: "5 hours ago",
      likes: 19,
    },
  ]

  const stats = [
    { label: "Active Members", value: "12,450", icon: Users },
    { label: "Discussions", value: "3,240", icon: MessageCircle },
    { label: "Study Groups", value: "156", icon: BookOpen },
    { label: "Achievements", value: "8,920", icon: Award },
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Users className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Community</h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Connect with fellow learners, share knowledge, and grow together in our vibrant learning community.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center"
            >
              <Icon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        className="border-b border-gray-200 dark:border-gray-700 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "discussions", label: "Discussions", icon: MessageCircle },
            { id: "study-groups", label: "Study Groups", icon: BookOpen },
            { id: "achievements", label: "Achievements", icon: Award },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </motion.div>

      {/* Search and Actions */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab.replace("-", " ")}...`}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button
            onClick={() => setShowCreateDiscussion(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === "discussions"
                ? "New Discussion"
                : activeTab === "study-groups"
                  ? "Create Group"
                  : "Share Achievement"}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "discussions" && (
            <div className="space-y-4">
              {allDiscussions.map((discussion) => (
                <motion.div
                  key={discussion.id}
                  whileHover={{ y: -2 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src={discussion.authorAvatar || "/placeholder.svg"}
                      alt={discussion.author}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{discussion.title}</h3>
                        {discussion.isHot && (
                          <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Hot</span>
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-3">{discussion.preview}</p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {discussion.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>by {discussion.author}</span>
                          <span>{discussion.timeAgo}</span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{discussion.views}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ThumbsUp className="w-4 h-4" />
                            <span>{discussion.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{discussion.replies}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "study-groups" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studyGroups.map((group) => (
                <motion.div
                  key={group.id}
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <img src={group.image || "/placeholder.svg"} alt={group.name} className="w-full h-48 object-cover" />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{group.name}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          group.difficulty === "Beginner"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : group.difficulty === "Intermediate"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {group.difficulty}
                      </span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-4">{group.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {group.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{group.members} members</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{group.nextMeeting}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => openJoinGroup(group)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Join Group
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "achievements" && (
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  whileHover={{ x: 5 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={achievement.avatar || "/placeholder.svg"}
                      alt={achievement.user}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{achievement.user}</span>
                        <span className="text-gray-600 dark:text-gray-400">{achievement.achievement}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                          <Award className="w-3 h-3" />
                          <span>{achievement.badge}</span>
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{achievement.timeAgo}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">{achievement.likes}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <CreateDiscussion
        isOpen={showCreateDiscussion}
        onClose={() => setShowCreateDiscussion(false)}
        onSubmit={handleCreateDiscussion}
      />

      <JoinGroup
        group={selectedGroup}
        isOpen={showJoinGroup}
        onClose={() => setShowJoinGroup(false)}
        onJoin={handleJoinGroup}
      />
    </div>
  )
}
