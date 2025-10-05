"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  User,
  Mail,
  Calendar,
  CreditCard,
  Settings,
  LogOut,
  Edit3,
  Save,
  X,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "./AuthProvider"
import { useRouter } from "next/navigation"

export default function ProfileContent() {
  const [activeSection, setActiveSection] = useState("personal")
  const [isEditing, setIsEditing] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    joinDate: "",
    avatar: "/placeholder.svg?height=120&width=120",
    plan: "free",
    isPremium: false,
  })
  const [editedProfile, setEditedProfile] = useState(profile)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  // Update profile data when user data changes
  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "",
        avatar: user.avatar || "/placeholder.svg?height=120&width=120",
        plan: user.plan || "free",
        isPremium: user.isPremium || false,
      })
      setEditedProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "",
        avatar: user.avatar || "/placeholder.svg?height=120&width=120",
        plan: user.plan || "free",
        isPremium: user.isPremium || false,
      })
    }
  }, [user])

  const sidebarItems = [
    { id: "personal", label: "Personal Details", icon: User },
    { id: "premium", label: "Premium Status", icon: CreditCard },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "logout", label: "Logout", icon: LogOut, className: "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" },
  ]

  const handleEdit = () => {
    setIsEditing(true)
    setEditedProfile(profile)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedProfile(profile)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Get token from localStorage or cookies
      const token = localStorage.getItem('token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          firstName: editedProfile.firstName,
          lastName: editedProfile.lastName,
        }),
      })

      if (response.ok) {
        setProfile(editedProfile)
        setIsEditing(false)
        toast.success("Profile updated successfully!")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update profile")
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    setLoading(true)
    try {
      // Get token from localStorage or cookies
      const token = localStorage.getItem('token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers,
        body: JSON.stringify(passwordData),
      })

      if (response.ok) {
        toast.success("Password changed successfully!")
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
        setShowChangePassword(false)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to change password")
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error("Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
      logout()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error logging out:', error)
      logout()
      router.push('/auth/login')
    }
  }

  const handleUpgradePlan = async (plan) => {
    try {
      // Get token from localStorage or cookies
      const token = localStorage.getItem('token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/billing/create-session', {
        method: 'POST',
        headers,
        body: JSON.stringify({ plan }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        toast.error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast.error('Error creating checkout session')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Profile Settings
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Manage your account
                    </p>
                  </div>
                </div>

                <nav className="space-y-2">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => item.id === "logout" ? handleLogout() : setActiveSection(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === item.id
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      } ${item.className || ""}`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                {activeSection === "personal" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Personal Details
                      </h3>
                      {!isEditing && (
                        <button
                          onClick={handleEdit}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={editedProfile.firstName}
                            onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={editedProfile.lastName}
                            onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Email cannot be changed
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Join Date
                        </label>
                        <input
                          type="text"
                          value={profile.joinDate}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                        />
                      </div>

                      {/* Change Password Section */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            Change Password
                          </h4>
                          <button
                            onClick={() => setShowChangePassword(!showChangePassword)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <Lock className="w-4 h-4" />
                            <span>{showChangePassword ? "Cancel" : "Change Password"}</span>
                          </button>
                        </div>

                        {showChangePassword && (
                          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Current Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showCurrentPassword ? "text" : "password"}
                                  value={passwordData.currentPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                New Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showNewPassword ? "text" : "password"}
                                  value={passwordData.newPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confirm New Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showConfirmPassword ? "text" : "password"}
                                  value={passwordData.confirmPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            <div className="flex space-x-3">
                              <button
                                onClick={handleChangePassword}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                              >
                                {loading ? "Changing..." : "Change Password"}
                              </button>
                              <button
                                onClick={() => setShowChangePassword(false)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {isEditing && (
                        <div className="flex space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            <Save className="w-4 h-4" />
                            <span>{loading ? "Saving..." : "Save Changes"}</span>
                          </button>
                          <button
                            onClick={handleCancel}
                            className="flex items-center space-x-2 px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === "premium" && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                      Premium Status
                    </h3>

                    <div className="space-y-6">
                      {/* Current Plan Status */}
                      <div className={`rounded-lg p-6 ${profile.isPremium ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800' : 'bg-gray-50 dark:bg-gray-700'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                              Current Plan: {profile.plan === 'free' ? 'Free' : profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400">
                              {profile.isPremium 
                                ? 'You have access to all premium features and courses'
                                : 'Upgrade to unlock premium features and unlimited access'
                              }
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            profile.isPremium 
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' 
                              : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                          }`}>
                            {profile.isPremium ? 'Premium' : 'Free'}
                          </div>
                        </div>
                      </div>

                      {/* Premium Features */}
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                          Premium Features
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              profile.isPremium ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-600'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                profile.isPremium ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Unlimited AI-generated courses</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              profile.isPremium ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-600'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                profile.isPremium ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Premium course access</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              profile.isPremium ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-600'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                profile.isPremium ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Advanced AI tutor features</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              profile.isPremium ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-600'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                profile.isPremium ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Priority support</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              profile.isPremium ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-600'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                profile.isPremium ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Download course materials</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              profile.isPremium ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-600'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                profile.isPremium ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Certificates & achievements</span>
                          </div>
                        </div>
                      </div>

                      {/* Upgrade Button */}
                      {!profile.isPremium && (
                        <div className="text-center">
                          <button
                            onClick={() => handleUpgradePlan('pro')}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                          >
                            Upgrade to Premium
                          </button>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Start your premium journey today
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === "settings" && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                      Settings
                    </h3>

                    <div className="space-y-6">
                      {/* Notification Settings */}
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                          Notification Preferences
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">Email Notifications</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates via email</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">Course Updates</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about new course content</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">Marketing Emails</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Receive promotional content and tips</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Privacy Settings */}
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                          Privacy Settings
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">Public Profile</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Make your profile visible to other users</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">Show Learning Progress</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Allow others to see your course progress</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">Show Achievements</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Display your achievements publicly</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Learning Preferences */}
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                          Learning Preferences
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferred Difficulty Level</label>
                            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                              <option value="beginner">Beginner</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="advanced">Advanced</option>
                              <option value="mixed">Mixed</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Learning Style</label>
                            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                              <option value="visual">Visual</option>
                              <option value="auditory">Auditory</option>
                              <option value="kinesthetic">Kinesthetic</option>
                              <option value="reading">Reading/Writing</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Daily Learning Goal (minutes)</label>
                            <input 
                              type="number" 
                              min="15" 
                              max="300" 
                              defaultValue="30"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Save Settings Button */}
                      <div className="flex justify-end">
                        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Save Settings
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}