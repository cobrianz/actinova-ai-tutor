"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  X,
  Sun,
  Moon,
  Menu,
  XIcon,
  CreditCard,
  Calendar,
  DollarSign,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Bell,
  Shield,
  Palette,
  Globe,
  BookOpen,
  Clock,
  Target,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Settings as SettingsIcon,
  ChevronRight,
  Crown,
  Star,
  Zap,
  Receipt,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";
import { toast } from "sonner";

const defaultSettings = {
  difficulty: "adaptive",
  studyGoal: "balanced",
  sessionLength: 25,
  breakLength: 5,
};

export default function ProfileContent() {
  const router = useRouter();
  const { user, refreshToken } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("my-profile");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [editData, setEditData] = useState({ firstName: "", lastName: "" });
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [userData, setUserData] = useState(null);
  const [settings, setSettings] = useState({
    ...defaultSettings,
    emailNotifications: true,
  });


  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (profileData?.user?.settings) {
      const { preferences, notifications } = profileData.user.settings;
      setSettings((prev) => ({
        ...prev,
        difficulty: preferences?.difficulty || defaultSettings.difficulty,
        // studyGoal: preferences?.studyGoal || defaultSettings.studyGoal, 
        sessionLength: preferences?.dailyGoal || defaultSettings.sessionLength,
        theme: preferences?.theme || "system",
        language: preferences?.language || "en",

        emailNotifications: notifications?.email ?? true,
        marketingEmails: notifications?.marketing ?? true,
        studyReminders: notifications?.courseUpdates ?? true,
      }));
    }
  }, [profileData]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/profile", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      } else {
        setError("Failed to load profile");
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setUpdating(true);
      setError(null);

      const formData = new FormData();
      formData.append("firstName", editData.firstName);
      formData.append("lastName", editData.lastName);
      // bio and location removed from profile updates

      const response = await fetch("/api/profile", {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setShowUserInfoModal(false);
        toast.success("Profile updated successfully!");
        // Refresh user data in auth context
        await refreshToken();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to update profile");
        toast.error(errorData.error || "Failed to update profile");
      }
    } catch (err) {
      setError("Failed to update profile");
      toast.error("Failed to update profile");
      console.error("Profile update error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const getPasswordErrors = (pwd) => {
    const errors = [];
    if (pwd.length < 8) errors.push("Must be at least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("Must contain an uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("Must contain a lowercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("Must contain a number");
    if (!/[@$!%*?&]/.test(pwd))
      errors.push("Must contain a special character (@$!%*?&)");
    if (pwd.toLowerCase().includes("password"))
      errors.push("Cannot contain the word 'password'");
    return errors;
  };

  const handlePasswordChange = async () => {
    if (passwordData.new !== passwordData.confirm) {
      setPasswordErrors(["Passwords do not match"]);
      toast.error("Passwords do not match");
      return;
    }

    const clientErrors = getPasswordErrors(passwordData.new);
    if (clientErrors.length) {
      setPasswordErrors(clientErrors);
      toast.error(clientErrors.join("; "));
      return;
    }

    try {
      setUpdating(true);

      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordData.current,
          newPassword: passwordData.new,
          confirmPassword: passwordData.confirm,
        }),
      });

      if (response.ok) {
        setPasswordData({ current: "", new: "", confirm: "" });
        setPasswordErrors([]);
        toast.success("Password changed successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        const serverDetails = Array.isArray(errorData?.details)
          ? errorData.details.map((d) => d.message).filter(Boolean)
          : [];
        const messages = serverDetails.length
          ? serverDetails
          : [errorData.error || "Failed to change password"];
        setPasswordErrors(messages);
        toast.error(messages.join("; "));
      }
    } catch (err) {
      toast.error("Failed to change password");
      console.error("Password change error:", err);
    } finally {
      setUpdating(false);
    }
  };


  const handleSaveUserInfo = () => {
    setUserData(editData);
    setShowUserInfoModal(false);
  };

  const tabItems = [
    { id: "my-profile", label: "Overview", icon: User },
    { id: "password", label: "Security", icon: Shield },
    { id: "settings", label: "Preferences", icon: SettingsIcon },
    { id: "billing", label: "Billing & Plan", icon: CreditCard },
  ];

  const handleSaveSettings = async () => {
    try {
      setUpdating(true);
      const payload = {
        notifications: {
          email: !!settings.emailNotifications,
          marketing: !!settings.marketingEmails,
          courseUpdates: !!settings.studyReminders,
          push: false,
        },
        preferences: {
          theme: settings.theme || "system",
          language: settings.language || "en",
          difficulty: settings.difficulty || "adaptive",
          dailyGoal: Number(settings.sessionLength) || 25,
        },
        privacy: {
          profileVisible: true,
          progressVisible: false,
          achievementsVisible: false,
        },
      };

      const response = await fetch("/api/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "Settings saved successfully");
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.error || "Failed to save settings");
      }
    } catch (e) {
      console.error("Save settings error:", e);
      toast.error("Failed to save settings");
    } finally {
      setUpdating(false);
    }
  };

  const ModalOverlay = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ">
        <div
          className={`${theme === 'dark' ? "bg-slate-500 border-slate-800" : "bg-white border-slate-200"} border rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto`}
        >
          <div
            className={`sticky top-0 flex items-center justify-between p-6 border-b ${theme === 'dark' ? "border-slate-800" : "border-slate-200"} ${theme === 'dark' ? "bg-slate-900" : "bg-white"}`}
          >
            <h2 className="text-xl font-bold">{title}</h2>
            <button
              onClick={onClose}
              className={`p-1 rounded-lg transition-colors ${theme === 'dark' ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? "dark text-white" : "bg-slate-50 text-slate-900"}`}
      >
        <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Professional Profile Header */}
            <div className={`mb-8 p-6 rounded-2xl ${theme === 'dark' ? "bg-slate-800 text-white" : "bg-white text-slate-900 shadow-sm border border-slate-200"}`}>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold flex-shrink-0 ${theme === 'dark' ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"}`}>
                  {profileData?.user?.firstName?.[0] || user?.name?.[0] || "U"}
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-1">
                    {profileData?.user?.firstName ? `${profileData.user.firstName} ${profileData.user.lastName}` : (user?.name || "User")}
                  </h1>
                  <p className={`text-sm mb-4 ${theme === 'dark' ? "text-slate-400" : "text-slate-500"}`}>
                    {profileData?.user?.email || user?.email}
                  </p>

                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${profileData?.usage?.isPremium
                      ? "bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      }`}>
                      {profileData?.usage?.isPremium ? <Crown size={12} /> : <Star size={12} />}
                      {profileData?.usage?.isPremium ? "Pro Member" : "Free Plan"}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${theme === 'dark' ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                      <Calendar size={12} />
                      Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className={`flex gap-6 px-6 py-4 rounded-xl ${theme === 'dark' ? "bg-slate-700/50" : "bg-slate-50"}`}>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{profileData?.usage?.used || 0}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Generations</div>
                  </div>
                  <div className="w-px bg-slate-200 dark:bg-slate-600"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{profileData?.usage?.details?.courses?.used || 0}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Courses</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Tab Navigation */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {tabItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : theme === 'dark'
                        ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                        : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className={`p-6 rounded-2xl ${theme === 'dark' ? "bg-slate-800 text-white" : "bg-white text-slate-900 shadow-sm border border-slate-200"}`}>
              {activeTab === "my-profile" && (
                <div className="space-y-10">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="ml-2">Loading profile...</span>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center py-12">
                      <AlertCircle className="w-8 h-8 text-red-500 mr-2" />
                      <span className="text-red-500">{error}</span>
                      <button onClick={fetchProfileData} className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h2 className="text-xl font-bold mb-2">Personal Info</h2>
                        <p className={`text-sm mb-6 ${theme === 'dark' ? "text-slate-400" : "text-slate-600"}`}>
                          Your account details and interests
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">First Name</label>
                            <div className={`px-4 py-2 rounded-lg border ${theme === 'dark' ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                              {profileData?.user?.firstName || user?.firstName || "N/A"}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Last Name</label>
                            <div className={`px-4 py-2 rounded-lg border ${theme === 'dark' ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                              {profileData?.user?.lastName || user?.lastName || "N/A"}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
                            <div className={`px-4 py-2 rounded-lg border ${theme === 'dark' ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                              {profileData?.user?.email || user?.email || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                        <h2 className="text-xl font-bold mb-6">Usage Statistics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Course Generation Usage */}
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Course Generations</span>
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                {profileData?.usage?.details?.courses?.used || 0} / {profileData?.usage?.details?.courses?.limit || 0}
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 transition-all duration-700 ease-out"
                                style={{ width: `${profileData?.usage?.details?.courses?.percent || 0}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500">Monthly course creation limit</p>
                          </div>

                          {/* Flashcard Generation Usage */}
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Flashcard Sets</span>
                              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                                {profileData?.usage?.details?.flashcards?.used || 0} / {profileData?.usage?.details?.flashcards?.limit || 0}
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-600 transition-all duration-700 ease-out"
                                style={{ width: `${profileData?.usage?.details?.flashcards?.percent || 0}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500">Monthly flashcard set limit</p>
                          </div>

                          {/* Quiz Generation Usage */}
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Test / Exam Sets</span>
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                {profileData?.usage?.details?.quizzes?.used || 0} / {profileData?.usage?.details?.quizzes?.limit || 0}
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-600 transition-all duration-700 ease-out"
                                style={{ width: `${profileData?.usage?.details?.quizzes?.percent || 0}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500">Monthly assessment paper limit</p>
                          </div>
                        </div>
                        <div className="mt-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 flex items-center gap-4">
                          <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0" size={20} />
                          <p className="text-xs text-blue-800 dark:text-blue-300">
                            Your usage resets on the <span className="font-bold">{profileData?.usage?.resetDate || "1st"}</span> of every month.
                            {!profileData?.usage?.isPremium && " Upgrade to Pro for 10x higher limits and unlimited access."}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === "password" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold mb-2">Security Settings</h2>
                    <p className={`text-sm mb-6 ${theme === 'dark' ? "text-slate-400" : "text-slate-600"}`}>
                      Maintain your account security by updating your password
                    </p>
                  </div>
                  <div className="space-y-6 max-w-md">
                    <div>
                      <label className="block text-sm font-medium mb-2">Current Password</label>
                      <input
                        type="password"
                        value={passwordData.current}
                        onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordData.new}
                        onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirm}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                        placeholder="••••••••"
                      />
                    </div>
                    <button
                      onClick={handlePasswordChange}
                      disabled={updating}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
                    >
                      {updating && <Loader2 size={16} className="animate-spin" />}
                      Update Password
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold mb-2">App Preferences</h2>
                    <p className={`text-sm mb-6 ${theme === 'dark' ? "text-slate-400" : "text-slate-600"}`}>
                      Personalize your experience with Actinova
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <BookOpen size={18} /> Learning
                      </h3>
                      <div className="space-y-3">
                        <label className="block text-sm font-medium">Difficulty Level</label>
                        <select
                          value={settings.difficulty}
                          onChange={(e) => setSettings({ ...settings, difficulty: e.target.value })}
                          className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="adaptive">Adaptive</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Bell size={18} /> Notifications
                      </h3>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                        <span className="text-sm">Email Reminders</span>
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                          className="w-5 h-5 accent-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                    <button
                      onClick={handleSaveSettings}
                      disabled={updating}
                      className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-indigo-500/30 transition-all"
                    >
                      {updating ? "Saving..." : "Save Preferences"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "billing" && (
                <div className="space-y-8">
                  <div className={`p-8 rounded-3xl relative overflow-hidden ${profileData?.usage?.isPremium ? "bg-gradient-to-br from-indigo-600 to-blue-700 text-white" : "bg-slate-50 dark:bg-slate-900 border dark:border-slate-700"}`}>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] ${profileData?.usage?.isPremium ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"}`}>Current Plan</span>
                          <h2 className="text-4xl font-black mt-8">{profileData?.usage?.isPremium ? "PRO PLAN" : "FREE PLAN"}</h2>
                        </div>
                        {profileData?.usage?.isPremium ? <Crown className="text-amber-300" size={48} /> : <Star className="text-blue-500" size={48} />}
                      </div>

                      <p className={`max-w-md text-sm mb-2 ${profileData?.usage?.isPremium ? "text-indigo-100" : "text-slate-500"}`}>
                        {profileData?.usage?.isPremium
                          ? "You have full access to all premium features, high-resolution PDF exports, and priority AI generation."
                          : "You are currently on the free plan with limited generations. Upgrade to unlock the full potential of AI-powered learning."}
                      </p>

                      <div className="flex flex-wrap gap-4">
                        {!profileData?.usage?.isPremium && (
                          <button
                            onClick={() => router.push("/dashboard?tab=upgrade")}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700"
                          >
                            Upgrade to Pro
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Billing History Section */}
                  <div className="space-y-6">
                    <h3 className="font-bold flex items-center gap-2 text-lg">
                      <Receipt size={20} /> Billing History
                    </h3>

                    <div className={`overflow-hidden rounded-xl border ${theme === 'dark' ? "border-slate-700" : "border-slate-200"}`}>
                      {profileData?.user?.billingHistory?.length > 0 ? (
                        <table className="w-full text-sm text-left">
                          <thead className={`text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b ${theme === 'dark' ? "border-slate-700" : "border-slate-200"}`}>
                            <tr>
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4">Amount</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-right">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {profileData.user.billingHistory.map((tx, i) => (
                              <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}>
                                <td className="px-6 py-4 font-medium">
                                  {new Date(tx.date || tx.paidAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                  {tx.currency} {(tx.amount).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.status === 'success' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                    tx.status === 'failed' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    }`}>
                                    {tx.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {tx.status === 'success' && (
                                    <button
                                      onClick={async () => {
                                        const id = tx.transactionId || tx.reference;
                                        if (!id) {
                                          toast.error("Receipt unavailable");
                                          return;
                                        }

                                        try {
                                          const toastId = toast.loading("Generating receipt...");

                                          // Dynamically import react-pdf to avoid build-time issues
                                          const { pdf } = await import("@react-pdf/renderer");
                                          const { default: ReceiptDocument } = await import("./ReceiptDocument");

                                          // Generate PDF blob client-side
                                          const blob = await pdf(
                                            <ReceiptDocument
                                              transaction={tx}
                                              user={{
                                                name: profileData?.user?.firstName ? `${profileData.user.firstName} ${profileData.user.lastName}` : (user?.name || "Valued Customer"),
                                                email: profileData?.user?.email || user?.email
                                              }}
                                            />
                                          ).toBlob();

                                          const url = window.URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = `receipt-${id}.pdf`;
                                          document.body.appendChild(a);
                                          a.click();
                                          a.remove();
                                          window.URL.revokeObjectURL(url);

                                          toast.dismiss(toastId);
                                          toast.success("Receipt downloaded");
                                        } catch (e) {
                                          toast.error("Failed to generate receipt");
                                          console.error(e);
                                        }
                                      }}
                                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline font-semibold text-xs"
                                    >
                                      <Download size={14} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-center py-12 text-slate-500">
                          <Receipt size={48} className="mx-auto mb-4 opacity-20" />
                          <p>No billing history available yet.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`p-6 rounded-2xl border ${theme === 'dark' ? "border-slate-700 bg-slate-900/50" : "border-slate-100 bg-slate-50"}`}>
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                      <Zap size={18} /> Pro Benefits
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> 1000+ words lesson detail</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Branded PDF Exports</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Advanced Quiz Generation</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Priority Support</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
