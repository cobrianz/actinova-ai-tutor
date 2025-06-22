"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Award, Trophy, Star, Share2, Lock, CheckCircle } from "lucide-react"
import AchievementCertificate from "../components/AchievementCertificate"

export default function AchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showCertificate, setShowCertificate] = useState(false)
  const [selectedAchievement, setSelectedAchievement] = useState(null)

  const achievements = [
    {
      id: 1,
      title: "JavaScript Fundamentals",
      description: "Completed the JavaScript Fundamentals course with excellence",
      type: "course",
      status: "earned",
      date: "2024-12-10",
      score: "95%",
      level: "Beginner",
      skills: ["JavaScript", "Programming", "Web Development"],
      badge: "🏆",
      color: "yellow",
    },
    {
      id: 2,
      title: "React Development",
      description: "Built 5 React projects and mastered component-based architecture",
      type: "project",
      status: "earned",
      date: "2024-12-08",
      score: "92%",
      level: "Intermediate",
      skills: ["React", "JSX", "State Management"],
      badge: "⚛️",
      color: "blue",
    },
    {
      id: 3,
      title: "Learning Streak Champion",
      description: "Maintained a 30-day learning streak",
      type: "milestone",
      status: "earned",
      date: "2024-12-05",
      score: "100%",
      level: "Special",
      skills: ["Consistency", "Dedication"],
      badge: "🔥",
      color: "red",
    },
    {
      id: 4,
      title: "Community Helper",
      description: "Helped 50+ community members with their questions",
      type: "community",
      status: "earned",
      date: "2024-12-01",
      score: "N/A",
      level: "Community",
      skills: ["Teaching", "Communication", "Leadership"],
      badge: "🤝",
      color: "green",
    },
    {
      id: 5,
      title: "TypeScript Master",
      description: "Complete the advanced TypeScript course",
      type: "course",
      status: "in-progress",
      progress: 75,
      level: "Advanced",
      skills: ["TypeScript", "Advanced Programming"],
      badge: "📘",
      color: "purple",
    },
    {
      id: 6,
      title: "Full-Stack Developer",
      description: "Build and deploy a full-stack application",
      type: "project",
      status: "locked",
      requirements: "Complete Frontend and Backend courses",
      level: "Expert",
      skills: ["Full-Stack", "Deployment", "Architecture"],
      badge: "🚀",
      color: "indigo",
    },
  ]

  const categories = [
    { name: "All", value: "all", count: achievements.length },
    { name: "Courses", value: "course", count: achievements.filter((a) => a.type === "course").length },
    { name: "Projects", value: "project", count: achievements.filter((a) => a.type === "project").length },
    { name: "Milestones", value: "milestone", count: achievements.filter((a) => a.type === "milestone").length },
    { name: "Community", value: "community", count: achievements.filter((a) => a.type === "community").length },
  ]

  const filteredAchievements = achievements.filter(
    (achievement) => selectedCategory === "all" || achievement.type === selectedCategory,
  )

  const earnedCount = achievements.filter((a) => a.status === "earned").length
  const totalPoints = earnedCount * 100 // Simple point system

  const handleViewCertificate = (achievement) => {
    setSelectedAchievement({
      ...achievement,
      recipient: "Student Name",
    })
    setShowCertificate(true)
  }

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
          <Trophy className="w-8 h-8 text-yellow-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Achievements</h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Track your learning progress and celebrate your accomplishments
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-2xl p-6 text-center">
          <Trophy className="w-8 h-8 mx-auto mb-2" />
          <div className="text-3xl font-bold">{earnedCount}</div>
          <div className="text-yellow-100">Achievements Earned</div>
        </div>
        <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-2xl p-6 text-center">
          <Star className="w-8 h-8 mx-auto mb-2" />
          <div className="text-3xl font-bold">{totalPoints}</div>
          <div className="text-blue-100">Total Points</div>
        </div>
        <div className="bg-gradient-to-r from-green-400 to-green-600 text-white rounded-2xl p-6 text-center">
          <Award className="w-8 h-8 mx-auto mb-2" />
          <div className="text-3xl font-bold">{Math.round((earnedCount / achievements.length) * 100)}%</div>
          <div className="text-green-100">Completion Rate</div>
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        className="flex flex-wrap gap-2 mb-8 justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
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
      </motion.div>

      {/* Achievements Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredAchievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow ${
              achievement.status === "locked" ? "opacity-60" : ""
            }`}
          >
            {/* Achievement Header */}
            <div
              className={`bg-gradient-to-r from-${achievement.color}-400 to-${achievement.color}-600 text-white p-6 text-center relative`}
            >
              {achievement.status === "locked" && (
                <div className="absolute top-4 right-4">
                  <Lock className="w-5 h-5" />
                </div>
              )}
              {achievement.status === "earned" && (
                <div className="absolute top-4 right-4">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}

              <div className="text-4xl mb-2">{achievement.badge}</div>
              <h3 className="text-xl font-bold mb-2">{achievement.title}</h3>
              <p className="text-sm opacity-90">{achievement.description}</p>
            </div>

            {/* Achievement Body */}
            <div className="p-6">
              {achievement.status === "in-progress" && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{achievement.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-blue-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${achievement.progress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
              )}

              {achievement.status === "locked" && (
                <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Requirements:</strong> {achievement.requirements}
                  </p>
                </div>
              )}

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Level:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{achievement.level}</span>
                </div>
                {achievement.date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Earned:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{achievement.date}</span>
                  </div>
                )}
                {achievement.score && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Score:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{achievement.score}</span>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {achievement.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {achievement.status === "earned" && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewCertificate(achievement)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Award className="w-4 h-4" />
                    <span>Certificate</span>
                  </button>
                  <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Certificate Modal */}
      <AchievementCertificate
        achievement={selectedAchievement}
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
      />
    </div>
  )
}
