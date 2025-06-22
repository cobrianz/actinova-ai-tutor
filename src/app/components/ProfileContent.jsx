"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Edit3,
  Save,
  X,
  Award,
  BookOpen,
  Target,
  TrendingUp,
  Download,
  Share2,
  Trophy,
} from "lucide-react"
import { toast } from "sonner"
import AchievementCertificate from "./AchievementCertificate"

export default function ProfileContent() {
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [showCertificate, setShowCertificate] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [profile, setProfile] = useState({
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    bio: "Passionate learner exploring the world of technology and programming. Always eager to take on new challenges and expand my skillset.",
    location: "San Francisco, CA",
    joinDate: "January 2024",
    avatar: "/placeholder.svg?height=120&width=120",
    title: "Full Stack Developer",
    company: "Tech Innovations Inc.",
  })

  const [editedProfile, setEditedProfile] = useState(profile)

  // Mock certificates data
  const certificates = [
    {
      id: 1,
      title: "JavaScript Fundamentals",
      recipient: profile.name,
      date: "2024-12-10",
      level: "Beginner",
      score: "95%",
      skills: ["JavaScript", "Programming", "Web Development"],
      status: "completed",
      courseProgress: 100,
    },
    {
      id: 2,
      title: "React Development",
      recipient: profile.name,
      date: "2024-12-08",
      level: "Intermediate",
      score: "92%",
      skills: ["React", "JSX", "State Management", "Component Architecture"],
      status: "completed",
      courseProgress: 100,
    },
    {
      id: 3,
      title: "Node.js Backend Development",
      recipient: profile.name,
      date: "2024-12-05",
      level: "Intermediate",
      score: "88%",
      skills: ["Node.js", "Express", "API Development", "Database Integration"],
      status: "completed",
      courseProgress: 100,
    },
    {
      id: 4,
      title: "TypeScript Advanced Concepts",
      recipient: profile.name,
      date: "2024-12-01",
      level: "Advanced",
      score: "94%",
      skills: ["TypeScript", "Advanced Types", "Generics", "Decorators"],
      status: "completed",
      courseProgress: 100,
    },
  ]

  const stats = [
    { label: "Courses Completed", value: "12", icon: BookOpen, color: "blue" },
    { label: "Certificates Earned", value: certificates.length.toString(), icon: Award, color: "yellow" },
    { label: "Learning Streak", value: "45 days", icon: TrendingUp, color: "green" },
    { label: "Goals Achieved", value: "8", icon: Target, color: "purple" },
  ]

  const recentActivity = [
    { type: "course_completed", title: "Completed JavaScript Fundamentals", date: "2 days ago" },
    { type: "certificate_earned", title: "Earned React Development Certificate", date: "5 days ago" },
    { type: "goal_achieved", title: "Achieved 30-day learning streak", date: "1 week ago" },
    { type: "course_started", title: "Started Advanced TypeScript", date: "2 weeks ago" },
  ]

  const handleSave = () => {
    setProfile(editedProfile)
    setIsEditing(false)
    toast.success("Profile updated successfully!")
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setIsEditing(false)
  }

  const handleViewCertificate = (certificate) => {
    setSelectedCertificate(certificate)
    setShowCertificate(true)
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "certificates", label: "Certificates", icon: Award },
    { id: "activity", label: "Activity", icon: TrendingUp },
  ]

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Profile Header */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <div className="relative">
            <img
              src={profile.avatar || "/placeholder.svg"}
              alt={profile.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 dark:border-blue-900"
            />
            <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editedProfile.name}
                  onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                  className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  value={editedProfile.title}
                  onChange={(e) => setEditedProfile({ ...editedProfile, title: e.target.value })}
                  className="text-lg bg-transparent border-b border-gray-300 focus:outline-none text-gray-600 dark:text-gray-400"
                />
                <textarea
                  value={editedProfile.bio}
                  onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={3}
                />
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{profile.name}</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{profile.title}</p>
                <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl">{profile.bio}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{profile.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {profile.joinDate}</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <motion.button
                  onClick={handleSave}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </motion.button>
                <motion.button
                  onClick={handleCancel}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </motion.button>
              </>
            ) : (
              <motion.button
                onClick={() => setIsEditing(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className={`bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-600 text-white rounded-2xl p-6 text-center`}
            >
              <Icon className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className={`text-${stat.color}-100`}>{stat.label}</div>
            </div>
          )
        })}
      </motion.div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">{activity.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Goals */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Current Goals</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">Complete TypeScript Course</span>
                    <span className="text-sm text-blue-600 dark:text-blue-400">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "75%" }}></div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">Build Portfolio Project</span>
                    <span className="text-sm text-green-600 dark:text-green-400">40%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "40%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "certificates" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">My Certificates</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Trophy className="w-4 h-4" />
                <span>{certificates.length} certificates earned</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.map((certificate) => (
                <motion.div
                  key={certificate.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{certificate.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Level: {certificate.level}</p>
                      </div>
                    </div>
                    <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs font-medium">
                      Completed
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Completion Date:</span>
                      <span className="text-gray-900 dark:text-white">{certificate.date}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Final Score:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{certificate.score}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {certificate.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                      {certificate.skills.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{certificate.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewCertificate(certificate)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Learning Activity</h3>
            <div className="space-y-6">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg"
                >
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-1"></div>
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Certificate Modal */}
      <AchievementCertificate
        achievement={selectedCertificate}
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
      />
    </div>
  )
}
