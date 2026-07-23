"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Coins,
  Award,
  CreditCard,
  Smartphone,
  GraduationCap,
  Users,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import NotificationSettings from "./NotificationSettings";
import BadgesPage from "./BadgesPage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";
import { CREDIT_PACKS } from "@/lib/planLimits";
import { getUsdToKesRate } from "@/lib/currency";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

export default function ProfileContent() {
  const router = useRouter();
  const { user, logout, refreshToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [editData, setEditData] = useState({ firstName: "", lastName: "" });
  const [payMethod, setPayMethod] = useState("card");
  const [activeTab, setActiveTab] = useState("overview");
  const [kesRate, setKesRate] = useState(155);
  const [kesRateLoading, setKesRateLoading] = useState(true);
  const [teachingStats, setTeachingStats] = useState(null);
  const isInstructor = user?.role === "instructor" || user?.role === "admin";

  useEffect(() => {
    fetchProfileData();
    fetchAnalytics();
    fetchKesRate();
    if (isInstructor) fetchTeachingStats();
  }, []);

  const fetchKesRate = async () => {
    try {
      const rate = await getUsdToKesRate();
      if (typeof rate === "number" && rate > 0) {
        setKesRate(rate);
      }
    } catch (err) {
      console.error("KES rate fetch error:", err);
    } finally {
      setKesRateLoading(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/profile");
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

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics/overview");
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
    }
  };

  const fetchTeachingStats = async () => {
    try {
      const res = await apiClient.get("/api/classrooms");
      const data = await res.json();
      if (data.success && data.classrooms) {
        const classrooms = data.classrooms;
        const totalStudents = classrooms.reduce((sum, c) => sum + (c.studentCount || 0), 0);
        const activeClassrooms = classrooms.filter((c) => c.isActive).length;
        setTeachingStats({
          totalClassrooms: classrooms.length,
          activeClassrooms,
          totalStudents,
          recentClassrooms: classrooms.slice(0, 3),
        });
      }
    } catch (err) {
      console.error("Teaching stats fetch error:", err);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setUpdating(true);
      setError(null);
      const formData = new FormData();
      formData.append("firstName", editData.firstName);
      formData.append("lastName", editData.lastName);
      const response = await apiClient.put("/api/profile", formData);
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setShowUserInfoModal(false);
        toast.success("Profile updated successfully!");
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

  const ModalOverlay = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-card border border-border rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-card">
            <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-fraunces)" }}>{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg transition-colors hover:bg-secondary text-muted-foreground">
              <X size={20} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full bg-background text-foreground">
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">

          {/* ── Premium Profile Header ── */}
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-green-500/[0.03] p-8">
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="w-24 h-24 ring-4 ring-green-500/20 ring-offset-2 ring-offset-background">
                <AvatarImage src={profileData?.user?.avatar || user?.avatar} alt={profileData?.user?.firstName || user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xl font-bold">
                  {profileData?.user?.firstName?.[0] || user?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-fraunces)" }}>
                  {profileData?.user?.firstName ? `${profileData.user.firstName} ${profileData.user.lastName}` : (user?.name || "User")}
                </h1>
                <p className="text-sm text-muted-foreground mb-4">{profileData?.user?.email || user?.email}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600 border border-green-500/20">
                    <Award size={12} />
                    Active Member
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                    <Calendar size={12} />
                    Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    <Coins size={12} />
                    {(profileData?.user?.credits || 0)} credits
                  </span>
                </div>
              </div>
              <div className="flex gap-6 px-6 py-4 rounded-xl bg-muted/50 border border-border/50">
                {isInstructor && teachingStats ? (
                  <>
                    <div className="text-center">
                      <div className="text-base font-bold text-green-600">{teachingStats.totalClassrooms}</div>
                      <div className="text-xs text-muted-foreground">Classrooms</div>
                    </div>
                    <div className="w-px bg-border" />
                    <div className="text-center">
                      <div className="text-base font-bold text-blue-600">{teachingStats.totalStudents}</div>
                      <div className="text-xs text-muted-foreground">Students</div>
                    </div>
                    <div className="w-px bg-border" />
                    <div className="text-center">
                      <div className="text-base font-bold text-purple-600">{profileData?.usage?.used || 0}</div>
                      <div className="text-xs text-muted-foreground">Generations</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="text-base font-bold text-foreground">{profileData?.usage?.used || 0}</div>
                      <div className="text-xs text-muted-foreground">Generations</div>
                    </div>
                    <div className="w-px bg-border" />
                    <div className="text-center">
                      <div className="text-base font-bold text-foreground">{profileData?.usage?.details?.courses?.used || 0}</div>
                      <div className="text-xs text-muted-foreground">Courses</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Loading / Error ── */}
          {loading ? (
            <div className="flex items-center justify-center py-16 rounded-2xl border border-border/50 bg-card">
              <Loader2 className="w-6 h-6 animate-spin text-green-500" />
              <span className="ml-3 text-muted-foreground">Loading profile...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 rounded-2xl border border-border/50 bg-card">
              <AlertCircle className="w-6 h-6 text-destructive mr-2" />
              <span className="text-destructive">{error}</span>
              <button onClick={fetchProfileData} className="ml-4 px-5 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors">Retry</button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl w-fit">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === "overview"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("achievements")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === "achievements"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Achievements
                </button>
              </div>

              {activeTab === "overview" && (
                <div className="space-y-8">
                  {/* ── Teaching Stats (Instructors) ── */}
                  {isInstructor && teachingStats && (
                    <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-sm font-bold text-foreground flex items-center gap-2" style={{ fontFamily: "var(--font-fraunces)" }}>
                            <GraduationCap size={16} className="text-green-500" /> Teaching Overview
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1">Your classroom activity at a glance</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        {[
                          { label: "Classrooms", value: teachingStats.totalClassrooms, icon: BookOpen, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
                          { label: "Active", value: teachingStats.activeClassrooms, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
                          { label: "Students", value: teachingStats.totalStudents, icon: Users, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
                        ].map(({ label, value, icon: Icon, color, bg }, i) => (
                          <div key={i} className={`${bg} rounded-xl p-4 text-center`}>
                            <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
                            <p className={`text-xl font-bold ${color}`}>{value}</p>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                          </div>
                        ))}
                      </div>
                      {teachingStats.recentClassrooms?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recent Classrooms</p>
                          {teachingStats.recentClassrooms.map((c) => (
                            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/classrooms/${c.id}`)}>
                              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0"><GraduationCap className="w-4 h-4 text-green-500" /></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                                <p className="text-[10px] text-muted-foreground">{c.studentCount || 0} students · {c.subject || "No subject"}</p>
                              </div>
                              <span className={`w-2 h-2 rounded-full ${c.isActive ? "bg-green-400" : "bg-slate-300"}`} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Personal Info ── */}
              <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-fraunces)" }}>Personal Info</h2>
                    <p className="text-sm text-muted-foreground mt-1">Your account details</p>
                  </div>
                  <button
                    onClick={() => { setEditData({ firstName: profileData?.user?.firstName || "", lastName: profileData?.user?.lastName || "" }); setShowUserInfoModal(true); }}
                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/30">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">First Name</span>
                    <p className="mt-1 font-medium text-foreground">{profileData?.user?.firstName || user?.firstName || "—"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Last Name</span>
                    <p className="mt-1 font-medium text-foreground">{profileData?.user?.lastName || user?.lastName || "—"}</p>
                  </div>
                  <div className="md:col-span-2 p-4 rounded-xl bg-muted/30">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</span>
                    <p className="mt-1 font-medium text-foreground">{profileData?.user?.email || user?.email || "—"}</p>
                  </div>
                </div>
              </div>

              {/* ── Notification Settings ── */}
              <NotificationSettings />

              {/* ── Usage Analytics ── */}
              <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-fraunces)" }}>Usage Analytics</h2>
                    <p className="text-sm text-muted-foreground mt-1">Your learning activity breakdown</p>
                  </div>
                </div>
                <div className="h-72">
                  <Bar
                    data={{
                      labels: ["Courses", "Quizzes", "Reports", "Chats", "Flashcards"],
                      datasets: [{
                        label: "All-Time Usage",
                        data: [
                          analyticsData?.summary?.totalCourses || 0,
                          analyticsData?.summary?.totalQuizzes || 0,
                          analyticsData?.summary?.totalReports || 0,
                          analyticsData?.summary?.totalChats || 0,
                          analyticsData?.summary?.totalFlashcards || 0,
                        ],
                        backgroundColor: [
                          "rgba(34,197,94,0.8)",
                          "rgba(34,197,94,0.65)",
                          "rgba(34,197,94,0.5)",
                          "rgba(34,197,94,0.4)",
                          "rgba(34,197,94,0.3)",
                        ],
                        borderColor: "rgba(34,197,94,1)",
                        borderWidth: 1,
                        borderRadius: 8,
                        borderSkipped: false,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      animation: {
                        duration: 1000,
                        easing: "easeOutQuart",
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: "hsl(222.2 84% 4.9%)",
                          titleColor: "hsl(210 40% 98%)",
                          bodyColor: "hsl(210 40% 98%)",
                          cornerRadius: 8,
                          padding: 12,
                          callbacks: {
                            label: function(context) {
                              return `${context.parsed.y} total`;
                            },
                          },
                        },
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: { color: "hsl(215.4 16.3% 46.9%)" },
                        },
                        y: {
                          beginAtZero: true,
                          grid: { color: "hsl(215.4 16.3% 46.9% / 0.15)" },
                          ticks: {
                            color: "hsl(215.4 16.3% 46.9%)",
                            precision: 0,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* ── Credits & Billing ── */}
              <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 space-y-8">
                {/* Credits */}
                <div className="rounded-xl bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-amber-500/10">
                        <Coins size={20} className="text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-amber-900 dark:text-amber-200" style={{ fontFamily: "var(--font-fraunces)" }}>Credits</h3>
                        <p className="text-xs text-amber-600 dark:text-amber-400">Use credits to generate content</p>
                      </div>
                    </div>
                    <span className="text-lg font-black text-amber-700 dark:text-amber-300">{profileData?.user?.credits || 0}</span>
                  </div>
                  {/* Payment Method Toggle */}
                  <div className="flex items-center gap-2 mb-4 p-1 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg w-fit">
                    <button
                      onClick={() => setPayMethod("card")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        payMethod === "card"
                          ? "bg-white dark:bg-amber-950 text-amber-800 dark:text-amber-200"
                          : "text-amber-600 dark:text-amber-400 hover:text-amber-800"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Card (USD)
                    </button>
                    <button
                      onClick={() => setPayMethod("mpesa")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        payMethod === "mpesa"
                          ? "bg-white dark:bg-amber-950 text-amber-800 dark:text-amber-200"
                          : "text-amber-600 dark:text-amber-400 hover:text-amber-800"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      M-Pesa (KES)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {CREDIT_PACKS.map((pack) => {
                      let kesPrice = Math.ceil(Math.ceil(pack.price * 155) / 10) * 10;
                      if (!kesRateLoading && kesRate > 0) {
                        kesPrice = Math.ceil(Math.ceil(pack.price * kesRate) / 10) * 10;
                      }
                      return (
                        <button
                          key={pack.id}
                          onClick={async () => {
                            try {
                              const res = await apiClient.post("/api/billing/create-session", {
                                purchaseType: "credit-purchase",
                                packId: pack.id,
                                paymentMethod: payMethod,
                              });
                              const data = await res.json();
                              if (res.ok && data.sessionUrl) {
                                window.location.href = data.sessionUrl;
                              }
                            } catch (err) {
                              console.error("Credit purchase error:", err);
                            }
                          }}
                          className={`relative p-3 rounded-xl border text-center transition-all hover:scale-[1.02] active:scale-95 ${
                            pack.popular
                              ? "border-amber-500 bg-amber-100 dark:bg-amber-900/40"
                              : "border-amber-200/50 dark:border-amber-700/30 bg-white/50 dark:bg-amber-950/30"
                          }`}
                        >
                          {pack.popular && (
                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                              Popular
                            </span>
                          )}
                          <div className="text-sm font-black text-amber-800 dark:text-amber-200 mt-1">{pack.credits}</div>
                          <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Credits</div>
                          <div className="mt-2 text-sm font-bold text-amber-900 dark:text-amber-100">
                            {payMethod === "mpesa" ? `KES ${kesPrice.toLocaleString()}` : `$${pack.price}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Billing History */}
                <div>
                  <h3 className="font-bold flex items-center gap-2 mb-4 text-foreground">
                    <Clock size={18} /> Billing History
                  </h3>
                  {profileData?.user?.billingHistory?.length > 0 ? (
                    <div className="space-y-3">
                      {[...profileData.user.billingHistory].reverse().map((entry, i) => {
                        const date = entry.paidAt || entry.date;
                        return (
                          <div
                            key={entry._id ? String(entry._id) : `${entry.reference || "billing"}-${i}`}
                            className="flex items-center justify-between p-4 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className={`p-2 rounded-lg shrink-0 ${
                                entry.status === "success"
                                  ? "bg-green-500/10 text-green-600"
                                  : entry.status === "failed"
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-amber-500/10 text-amber-600"
                              }`}>
                                {entry.status === "success"
                                  ? <CheckCircle size={16} />
                                  : entry.status === "failed"
                                    ? <AlertCircle size={16} />
                                    : <Clock size={16} />
                                }
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">{entry.description || entry.plan || "Transaction"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {date ? new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                                  {entry.paymentMethod ? ` · ${entry.paymentMethod}` : ""}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              <p className={`font-bold ${entry.status === "success" ? "text-foreground" : entry.status === "failed" ? "text-destructive" : "text-amber-600"}`}>
                                {entry.currency || "NGN"} {entry.amount?.toLocaleString() || "—"}
                              </p>
                              <p className={`text-[10px] font-semibold uppercase tracking-wider ${
                                entry.status === "success" ? "text-green-600" : entry.status === "failed" ? "text-destructive" : "text-amber-600"
                              }`}>
                                {entry.status || "unknown"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No billing history yet.</p>
                  )}
                </div>
              </div>

            </div>
              )}
              {activeTab === "achievements" && <BadgesPage />}
            </div>
          )}
        </div>

        {/* Edit Profile Modal */}
        <ModalOverlay isOpen={showUserInfoModal} onClose={() => setShowUserInfoModal(false)} title="Edit Profile">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">First Name</label>
              <input
                type="text"
                value={editData.firstName}
                onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-green-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Last Name</label>
              <input
                type="text"
                value={editData.lastName}
                onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-green-500/30"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowUserInfoModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button
                onClick={handleProfileUpdate}
                disabled={updating}
                className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all disabled:opacity-50"
              >
                {updating ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </ModalOverlay>

        {/* Logout Button */}
        <div className="mt-8 pt-6 border-t border-border/50">
          <button
            onClick={logout}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            Log Out
          </button>
        </div>
      </main>
    </div>
  );
}
