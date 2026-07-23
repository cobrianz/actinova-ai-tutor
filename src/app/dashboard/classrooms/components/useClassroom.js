"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";
import { inputCls, labelCls, sectionCls, toggleCls, toggleDot } from "./constants";

export default function useClassroom(classroom, searchParams, onBack) {
  const initialTab = (typeof window !== "undefined" && searchParams?.get("classroomTab")) || "course";
  const [activeTab, setActiveTabState] = useState(initialTab);

  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
  }, []);

  const isInstructor = classroom.isInstructor ?? false;

  // ── Assignment state ──
  const [assignments, setAssignments] = useState(classroom.assignments || []);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [submissionsAssignment, setSubmissionsAssignment] = useState(null);
  const [showCreateAssignment, setShowCreateAssignment] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(`classroom_${classroom.id}_show_asgn`) === "true";
  });

  // ── Students ──
  const [students, setStudents] = useState([]);
  const [studentStats, setStudentStats] = useState({ totalStudents: 0, activeStudents: 0, avgCompletion: 0 });

  // ── Discussions ──
  const [discussions, setDiscussions] = useState([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [focusedDiscussionId, setFocusedDiscussionId] = useState(null);
  const [discussionPosts, setDiscussionPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newDiscTitle, setNewDiscTitle] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem(`classroom_${classroom.id}_disc_title`) || "";
  });
  const [newDiscDesc, setNewDiscDesc] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem(`classroom_${classroom.id}_disc_desc`) || "";
  });
  const [showNewDiscussion, setShowNewDiscussion] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(`classroom_${classroom.id}_show_disc`) === "true";
  });
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [discAiLoading, setDiscAiLoading] = useState(false);

  // ── Materials ──
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [showNewMaterial, setShowNewMaterial] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(`classroom_${classroom.id}_show_mat`) === "true";
  });
  const [newMat, setNewMat] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(`classroom_${classroom.id}_new_mat`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error("Failed to parse saved material form:", e); }
      }
    }
    return { title: "", description: "", type: "document", url: "", weekNumber: 0, category: "", isRequired: false };
  });

  // ── Announcements ──
  const [announcements, setAnnouncements] = useState(classroom.announcements || []);
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(`classroom_${classroom.id}_show_ann`) === "true";
  });
  const [newAnnTitle, setNewAnnTitle] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem(`classroom_${classroom.id}_ann_title`) || "";
  });
  const [newAnnContent, setNewAnnContent] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem(`classroom_${classroom.id}_ann_content`) || "";
  });

  // ── Grades & Analytics ──
  const [grades, setGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ── Course structure ──
  const [courseModules, setCourseModules] = useState(classroom.modules || []);
  const [courseGenLoading, setCourseGenLoading] = useState(false);
  const [expandedModule, setExpandedModule] = useState(null);

  // ── Forked content ──
  const [forkedContent, setForkedContent] = useState(classroom.forkedContent || []);
  const [forkedIdSet, setForkedIdSet] = useState(
    () => new Set(
      (classroom.forkedContent || []).map(
        (fc) => `${fc.contentType}-${fc.contentId?.toString()}`
      )
    )
  );
  const [showForkPanel, setShowForkPanel] = useState(false);
  const [browseType, setBrowseType] = useState("all");
  const [browseResults, setBrowseResults] = useState({ courses: [], quizzes: [], flashcards: [], reports: [] });
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseQuery, setBrowseQuery] = useState("");
  const [browseError, setBrowseError] = useState(null);
  const [forking, setForking] = useState(null);

  // ── Weeks / lessons ──
  const [openedWeeks, setOpenedWeeks] = useState(classroom.openedWeeks || []);
  const [completedLessons, setCompletedLessons] = useState([]);

  // ── UI toggles ──
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Settings ──
  const [settingsForm, setSettingsForm] = useState({
    name: classroom.name || "",
    subject: classroom.subject || "",
    description: classroom.description || "",
    semester: classroom.semester || "",
    academicLevel: classroom.academicLevel || "undergraduate",
    gradingScheme: classroom.gradingScheme || "percentage",
    syllabus: classroom.syllabus || "",
    officeHours: classroom.officeHours || "",
    schedule: classroom.schedule || { days: [], startTime: "", endTime: "", location: "" },
    prerequisites: classroom.prerequisites || [],
    settings: classroom.settings || {
      allowStudentPosts: true, requireApproval: false, showGradesToStudents: true,
      allowLateSubmissions: true, latePenaltyPercent: 10, maxFileSizeMB: 50,
      enableDiscussions: true, enableMaterials: true,
    },
    newPrereq: "",
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  const assignmentForm = {
    title: "", description: "", instructions: "", type: "course", dueDate: "", maxScore: 100,
    courseId: "", category: "", availableFrom: "", availableUntil: "", passingScore: 60,
    weight: 0, maxAttempts: 1, rubric: [],
  };

  // ────────────────────────────────
  // Fetch functions
  // ────────────────────────────────

  const fetchDiscussions = useCallback(async () => {
    setDiscussionsLoading(true);
    try {
      const res = await apiClient.get(`/api/classrooms/${classroom.id}/discussions`);
      const data = await res.json();
      if (data.success) setDiscussions(data.discussions);
    } catch (e) { console.error("Failed to fetch discussions:", e); }
    finally { setDiscussionsLoading(false); }
  }, [classroom.id]);

  const fetchPosts = useCallback(async (discussionId) => {
    setPostsLoading(true);
    try {
      const res = await apiClient.get(`/api/classrooms/${classroom.id}/discussions/${discussionId}/posts`);
      const data = await res.json();
      if (data.success) setDiscussionPosts(data.posts);
    } catch (e) { console.error("Failed to fetch discussion posts:", e); }
    finally { setPostsLoading(false); }
  }, [classroom.id]);

  const fetchMaterials = useCallback(async () => {
    setMaterialsLoading(true);
    try {
      const res = await apiClient.get(`/api/classrooms/${classroom.id}/materials`);
      const data = await res.json();
      if (data.success) setMaterials(data.materials);
    } catch (e) { console.error("Failed to fetch materials:", e); }
    finally { setMaterialsLoading(false); }
  }, [classroom.id]);

  const fetchStudents = useCallback(async () => {
    if (!isInstructor) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/classrooms/${classroom.id}/students`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        setStudentStats(data.stats);
      }
    } catch (e) { console.error("Failed to fetch students:", e); }
    finally { setLoading(false); }
  }, [classroom.id, isInstructor]);

  const fetchGrades = useCallback(async () => {
    setGradesLoading(true);
    try {
      const res = await apiClient.get(`/api/classrooms/${classroom.id}/grades`);
      const data = await res.json();
      if (data.success) setGrades(data.students || []);
    } catch (e) { console.error("Failed to fetch grades:", e); }
    finally { setGradesLoading(false); }
  }, [classroom.id]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await apiClient.get(`/api/classrooms/${classroom.id}/analytics`);
      const data = await res.json();
      if (data.success) setAnalytics(data);
    } catch (e) { console.error("Failed to fetch analytics:", e); }
    finally { setAnalyticsLoading(false); }
  }, [classroom.id]);

  const fetchBrowseContent = useCallback(async (overrideType, overrideQuery) => {
    setBrowseLoading(true);
    setBrowseError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const t = overrideType || browseType;
      const qVal = overrideQuery !== undefined ? overrideQuery : browseQuery;
      const q = qVal ? `&q=${encodeURIComponent(qVal)}` : "";
      const res = await apiClient.get(`/api/classrooms/${classroom.id}/browse?type=${t}${q}`, { signal: controller.signal });
      if (!res.ok) { setBrowseError("fetch_failed"); return; }
      const data = await res.json();
      if (data.success) setBrowseResults({ courses: data.courses || [], quizzes: data.quizzes || [], flashcards: data.flashcards || [], reports: data.reports || [] });
      else setBrowseError("fetch_failed");
    } catch (e) {
      if (e.name === "AbortError") setBrowseError("timeout");
      else setBrowseError("fetch_failed");
    } finally {
      clearTimeout(timeout);
      setBrowseLoading(false);
    }
  }, [classroom.id]);

  const fetchForkedContent = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/classrooms/${classroom.id}/fork`);
      const data = await res.json();
      if (data.success && data.forkedContent) {
        setForkedContent(data.forkedContent);
        setForkedIdSet(new Set(data.forkedContent.map((fc) => `${fc.contentType}-${fc.contentId?.toString() || fc.contentId}`)));
      }
    } catch (e) { console.error("Failed to fetch forked content:", e); }
  }, [classroom.id]);

  const fetchCompletedLessons = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/classrooms/${classroom.id}/lesson-complete`);
      const data = await res.json();
      if (data.success) setCompletedLessons(data.completed || []);
    } catch (e) { console.error("Failed to fetch completed lessons:", e); }
  }, [classroom.id]);

  // ────────────────────────────────
  // Effects
  // ────────────────────────────────

  useEffect(() => { fetchCompletedLessons(); }, [fetchCompletedLessons]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get(`/api/classrooms/${classroom.id}/opened-weeks`);
        const data = await res.json();
        if (data.success) setOpenedWeeks(data.openedWeeks || []);
      } catch (e) { console.error("Failed to poll opened weeks:", e); }
    }, 60000);
    return () => clearInterval(interval);
  }, [classroom.id]);

  useEffect(() => {
    if (activeTab === "discussions") fetchDiscussions();
    if (activeTab === "materials") fetchMaterials();
    if (activeTab === "students" && isInstructor) fetchStudents();
    if (activeTab === "grades") fetchGrades();
    if (activeTab === "analytics" && isInstructor) fetchAnalytics();
  }, [activeTab, fetchDiscussions, fetchMaterials, fetchStudents, fetchGrades, fetchAnalytics, isInstructor, classroom.id]);

  useEffect(() => {
    if (showForkPanel && isInstructor) fetchBrowseContent("all", "");
  }, [showForkPanel, isInstructor, fetchBrowseContent]);

  useEffect(() => { if (isInstructor) fetchStudents(); }, [isInstructor, fetchStudents]);
  useEffect(() => { fetchMaterials(); fetchDiscussions(); }, [fetchMaterials, fetchDiscussions]);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await apiClient.get(`/api/classrooms/${classroom.id}/assignments`);
        const data = await res.json();
        if (data.success) setAssignments(data.assignments || []);
      } catch (e) { console.error("Failed to fetch assignments:", e); }
    };
    if (!classroom.assignments?.length) fetchAssignments();
  }, [classroom.id, classroom.assignments?.length]);

  useEffect(() => {
    if (selectedDiscussion) fetchPosts(selectedDiscussion._id || selectedDiscussion.id);
  }, [selectedDiscussion, fetchPosts]);

  // ────────────────────────────────
  // Lesson completion
  // ────────────────────────────────

  const toggleLessonComplete = async (lessonKey, complete) => {
    try {
      const res = await apiClient.post(`/api/classrooms/${classroom.id}/lesson-complete`, { lessonKey, completed: complete });
      const data = await res.json();
      if (data.success) {
        setCompletedLessons((prev) => complete ? [...prev, lessonKey] : prev.filter((k) => k !== lessonKey));
      }
    } catch (e) { console.error("Failed to toggle lesson completion:", e); }
  };

  const handleToggleWeek = async (weekNumber) => {
    const wasOpen = openedWeeks.includes(weekNumber);
    const next = wasOpen
      ? openedWeeks.filter((w) => w !== weekNumber)
      : [...openedWeeks, weekNumber];
    setOpenedWeeks(next);
    try {
      const res = await apiClient.patch(`/api/classrooms/${classroom.id}`, { openedWeeks: next });
      const data = await res.json();
      if (!data.success) {
        setOpenedWeeks(wasOpen ? [...openedWeeks, weekNumber] : openedWeeks.filter((w) => w !== weekNumber));
        toast.error("Failed to save week visibility");
      }
    } catch {
      setOpenedWeeks(wasOpen ? [...openedWeeks, weekNumber] : openedWeeks.filter((w) => w !== weekNumber));
      toast.error("Failed to save week visibility");
    }
  };

  // ────────────────────────────────
  // Fork content handlers
  // ────────────────────────────────

  const getCurrentWeekNumber = () => {
    if (!classroom.startDate || !classroom.durationWeeks) return 0;
    const now = new Date();
    const start = new Date(classroom.startDate);
    const diffWeeks = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(diffWeeks + 1, classroom.durationWeeks));
  };

  const isForkedContentLocked = (entry) => {
    if (!isInstructor && !entry.unlocked) return true;
    if (entry.weekNumber && !(openedWeeks || []).includes(entry.weekNumber)) return true;
    return false;
  };

  const handleForkContent = async (contentType, contentId, title) => {
    setForking(contentId);
    try {
      const currentWeek = getCurrentWeekNumber();
      const res = await apiClient.post(`/api/classrooms/${classroom.id}/fork`, { contentType, contentId, weekNumber: currentWeek });
      if (res.status === 409) {
        setForkedIdSet((prev) => new Set([...prev, `${contentType}-${contentId}`]));
        return;
      }
      const data = await res.json();
      if (data.success) {
        setForkedContent((prev) => [...prev, data.forked]);
        setForkedIdSet((prev) => new Set([...prev, `${contentType}-${contentId}`]));
        setShowForkPanel(false);
        toast.success(`"${title}" forked to classroom!`);
        fetchForkedContent();
      } else { toast.error(data.error || "Failed to fork"); }
    } catch {
      toast.error("Failed to fork content");
    } finally { setForking(null); }
  };

  const handleUnforkContent = async (contentType, contentId, title) => {
    try {
      const res = await apiClient.delete(`/api/classrooms/${classroom.id}/fork`, { contentType, contentId });
      const data = await res.json();
      if (data.success) {
        setForkedContent((prev) => prev.filter((fc) => !(String(fc.contentId) === String(contentId) && fc.contentType === contentType)));
        setForkedIdSet((prev) => {
          const next = new Set(prev);
          next.delete(`${contentType}-${contentId}`);
          return next;
        });
        toast.success(`"${title}" removed from classroom`);
      } else {
        toast.error(data.error || "Failed to remove content");
      }
    } catch {
      toast.error("Failed to remove content. Please try again.");
    }
  };

  const handleToggleForkUnlock = async (contentType, contentId) => {
    try {
      const cid = String(contentId);
      const entry = forkedContent.find((fc) => String(fc.contentId) === cid && fc.contentType === contentType);
      if (!entry) return;
      const res = await apiClient.patch(`/api/classrooms/${classroom.id}/fork`, { contentType, contentId, unlocked: !entry.unlocked });
      const data = await res.json();
      if (data.success) {
        setForkedContent((prev) => prev.map((fc) => (String(fc.contentId) === cid && fc.contentType === contentType) ? { ...fc, unlocked: !fc.unlocked } : fc));
      }
    } catch { toast.error("Failed to update"); }
  };

  const handleUpdateFork = async (contentType, contentId, updates) => {
    try {
      const res = await apiClient.patch(`/api/classrooms/${classroom.id}/fork`, { contentType, contentId, ...updates });
      const data = await res.json();
      if (data.success) {
        const cid = String(contentId);
        setForkedContent((prev) => prev.map((fc) => (String(fc.contentId) === cid && fc.contentType === contentType) ? { ...fc, ...updates } : fc));
        toast.success("Updated");
      }
    } catch { toast.error("Failed to update"); }
  };

  // ────────────────────────────────
  // Course structure / modules
  // ────────────────────────────────

  const handleGenerateCourseStructure = async () => {
    if (!classroom.durationWeeks) { toast.error("Set a course duration first"); return; }
    setCourseGenLoading(true);
    try {
      const res = await apiClient.post("/api/classrooms/ai-generate", {
        task: "course_structure", name: classroom.name, subject: classroom.subject,
        content: classroom.description, durationWeeks: classroom.durationWeeks,
        academicLevel: classroom.academicLevel,
      });
      const data = await res.json();
      if (data.result) {
        setCourseModules(data.result);
        await apiClient.patch(`/api/classrooms/${classroom.id}`, { modules: data.result });
        toast.success("Course structure generated!");
      } else { toast.error("Failed to generate course structure"); }
    } catch { toast.error("Failed to generate course structure"); }
    finally { setCourseGenLoading(false); }
  };

  const handleGenerateModuleAssignments = async (module) => {
    setCourseGenLoading(true);
    let generated = 0;
    try {
      const res = await apiClient.post("/api/classrooms/ai-generate", {
        task: "course_assignments", name: module.title, subject: classroom.subject,
        content: module.description, durationWeeks: module.weekNumber,
        classroomName: classroom.name, assignmentType: module.assignmentType || "all",
      });
      const data = await res.json();
      if (data.result) {
        for (const a of data.result) {
          if (a.type === "quiz") {
            try {
              const quizRes = await apiClient.post(`/api/classrooms/${classroom.id}/module-quiz`, {
                moduleIdx: classroom.modules?.findIndex((m) => m.title === module.title) ?? 0,
              });
              const quizData = await quizRes.json();
              if (quizData.success) {
                await apiClient.post(`/api/classrooms/${classroom.id}/assignments`, {
                  title: a.title, description: a.description, instructions: a.instructions || "",
                  type: "quiz", category: a.category || "Quiz",
                  maxScore: a.maxScore, passingScore: a.passingScore, weight: a.weight,
                  rubric: a.rubric || [], weekNumber: module.weekNumber,
                });
                generated++;
                continue;
              }
            } catch (e) { console.error("Failed to create module quiz:", e); }
          }
          if (a.type === "discussion") {
            try {
              const discRes = await apiClient.post(`/api/classrooms/${classroom.id}/discussions`, {
                title: a.title, description: a.description || a.instructions || "",
              });
              if (discRes.ok) {
                const discData = await discRes.json();
                a._discussionId = discData.discussion?._id || discData.discussion?.id;
                fetchDiscussions();
              }
            } catch (e) { console.error("Failed to create module discussion:", e); }
          }
          const assignRes = await apiClient.post(`/api/classrooms/${classroom.id}/assignments`, {
            title: a.title, description: a.description, instructions: a.instructions || "",
            type: a.type, category: a.category,
            maxScore: a.maxScore, passingScore: a.passingScore, weight: a.weight,
            rubric: a.rubric || [], weekNumber: module.weekNumber,
            meta: a._discussionId ? { discussionId: a._discussionId } : undefined,
          });
          const assignData = await assignRes.json();
          if (assignData.success) { setAssignments((prev) => [assignData.assignment, ...prev]); generated++; }
        }
        fetchForkedContent();
        toast.success(`${generated} assignments generated for ${module.title}!`);
      } else { toast.error("Failed to generate assignments"); }
    } catch { toast.error("Failed to generate assignments"); }
    finally { setCourseGenLoading(false); }
  };

  // ────────────────────────────────
  // Assignment handlers
  // ────────────────────────────────

  const handleRemoveStudent = async (studentId, studentName) => {
    try {
      const res = await apiClient.delete(`/api/classrooms/${classroom.id}/enrollment?studentId=${studentId}`);
      const data = await res.json();
      if (data.success) {
        setStudents((prev) => prev.filter((s) => s.id !== studentId));
        toast.success(`${studentName} removed from classroom`);
      } else {
        toast.error(data.error || "Failed to remove student");
      }
    } catch {
      toast.error("Failed to remove student. Please try again.");
    }
  };

  const handleMarkComplete = async (assignmentId) => {
    try {
      const res = await apiClient.put(`/api/classrooms/${classroom.id}/progress`, { assignmentId, status: "completed", progress: 100 });
      const data = await res.json();
      if (data.success) {
        setAssignments((prev) => prev.map((a) => a.id === assignmentId ? { ...a, myProgress: { ...a.myProgress, status: "completed", progress: 100, completedAt: new Date().toISOString() } } : a));
        toast.success("Assignment marked as complete!");
      } else { toast.error(data.error || "Failed"); }
    } catch { toast.error("Failed to update progress"); }
  };

  const handleStartAssignment = async (assignmentId) => {
    try {
      const res = await apiClient.put(`/api/classrooms/${classroom.id}/progress`, { assignmentId, status: "in_progress", progress: 10 });
      const data = await res.json();
      if (data.success) {
        setAssignments((prev) => prev.map((a) => a.id === assignmentId ? { ...a, myProgress: { ...a.myProgress, status: "in_progress", progress: 10 } } : a));
        toast.success("Assignment started!");
      }
    } catch { toast.error("Failed to start assignment"); }
  };

  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(null);
    setEditingAssignment(assignment);
    setShowCreateAssignment(true);
  };

  const handleViewSubmissions = (assignment) => {
    setSelectedAssignment(null);
    setSubmissionsAssignment(assignment);
  };

  const handleSubmitAssignment = (progress) => {
    setAssignments((prev) => prev.map((a) => {
      if (a.id !== progress.assignmentId) return a;
      return { ...a, myProgress: { ...a.myProgress, ...progress, status: "completed", progress: 100, completedAt: new Date().toISOString() } };
    }));
    toast.success("Assignment submitted!");
  };

  const handleAssignmentSaved = (saved, isEdit) => {
    if (isEdit) {
      setAssignments((prev) => prev.map((a) => a.id === saved.id ? { ...a, ...saved } : a));
    } else {
      setAssignments((prev) => [saved, ...prev]);
    }
    setEditingAssignment(null);
  };

  const handleExportGrades = async () => {
    try {
      const res = await apiClient.get(`/api/classrooms/${classroom.id}/grades?format=csv`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grades-${classroom.name.replace(/\s+/g, "-")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Grades exported!");
    } catch { toast.error("Failed to export grades"); }
  };

  // ────────────────────────────────
  // Discussion handlers
  // ────────────────────────────────

  const handleCreateDiscussion = async () => {
    if (!newDiscTitle.trim()) { toast.error("Title required"); return; }
    try {
      const res = await apiClient.post(`/api/classrooms/${classroom.id}/discussions`, { title: newDiscTitle, description: newDiscDesc });
      const data = await res.json();
      if (data.success) {
        setDiscussions([data.discussion, ...discussions]);
        setNewDiscTitle("");
        setNewDiscDesc("");
        setShowNewDiscussion(false);
        toast.success("Discussion created!");
      } else { toast.error(data.error || "Failed"); }
    } catch { toast.error("Failed to create discussion"); }
  };

  const handleCreatePost = async () => {
    if (!replyContent.trim() || !selectedDiscussion) return;
    try {
      const res = await apiClient.post(`/api/classrooms/${classroom.id}/discussions/${selectedDiscussion._id || selectedDiscussion.id}/posts`, { content: replyContent, parentPostId: replyingTo || undefined });
      const data = await res.json();
      if (data.success) {
        setDiscussionPosts([...discussionPosts, data.post]);
        setReplyContent("");
        setReplyingTo(null);
        setDiscussions((prev) => prev.map((d) => (d._id || d.id) === (selectedDiscussion._id || selectedDiscussion.id) ? { ...d, postCount: (d.postCount || 0) + 1, lastActivityAt: new Date().toISOString() } : d));
      } else { toast.error(data.error || "Failed"); }
    } catch { toast.error("Failed to post"); }
  };

  const handleGenerateDiscussionPrompt = async () => {
    setDiscAiLoading(true);
    try {
      const res = await apiClient.post("/api/classrooms/ai-generate", {
        task: "discussion_prompt", name: newDiscTitle || "general topic",
        subject: classroom.subject, classroomName: classroom.name,
      });
      const data = await res.json();
      if (data.result) {
        setNewDiscTitle(newDiscTitle || "Discussion");
        setNewDiscDesc(data.result);
        toast.success("Prompt generated!");
      }
    } catch { toast.error("Failed to generate prompt"); }
    finally { setDiscAiLoading(false); }
  };

  // ────────────────────────────────
  // Material handlers
  // ────────────────────────────────

  const handleAttachMaterial = async (materialId, weekNumber) => {
    try {
      const res = await apiClient.patch(`/api/classrooms/${classroom.id}/materials`, { materialId, weekNumber });
      const data = await res.json();
      if (data.success) {
        setMaterials((prev) => prev.map((m) => (m._id || m.id) === materialId ? { ...m, weekNumber } : m));
        toast.success("Material attached!");
      } else { toast.error(data.error || "Failed"); }
    } catch { toast.error("Failed to attach material"); }
  };

  const handleAttachDiscussion = async (discussionId, weekNumber) => {
    try {
      const res = await apiClient.patch(`/api/classrooms/${classroom.id}/discussions`, { discussionId, weekNumber });
      const data = await res.json();
      if (data.success) {
        setDiscussions((prev) => prev.map((d) => (d._id || d.id) === discussionId ? { ...d, weekNumber } : d));
        toast.success("Discussion attached!");
      } else { toast.error(data.error || "Failed"); }
    } catch { toast.error("Failed to attach discussion"); }
  };

  const handleCreateMaterial = async () => {
    if (!newMat.title.trim()) { toast.error("Title required"); return; }
    try {
      const res = await apiClient.post(`/api/classrooms/${classroom.id}/materials`, newMat);
      const data = await res.json();
      if (data.success) {
        setMaterials([data.material, ...materials]);
        setNewMat({ title: "", description: "", type: "document", url: "", weekNumber: 0, category: "", isRequired: false });
        setShowNewMaterial(false);
        toast.success("Material added!");
      }
    } catch { toast.error("Failed to add material"); }
  };

  // ────────────────────────────────
  // Announcement handlers
  // ────────────────────────────────

  const handlePostAnnouncement = async () => {
    if (!newAnnTitle.trim() || !newAnnContent.trim()) { toast.error("Title and content required"); return; }
    try {
      const res = await apiClient.post(`/api/classrooms/${classroom.id}/announcements`, { title: newAnnTitle, content: newAnnContent });
      const data = await res.json();
      if (data.success) {
        setAnnouncements([...announcements, data.announcement]);
        setNewAnnTitle("");
        setNewAnnContent("");
        setShowNewAnnouncement(false);
        toast.success("Announcement posted!");
      }
    } catch { toast.error("Failed to post announcement"); }
  };

  // ────────────────────────────────
  // Settings handlers
  // ────────────────────────────────

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const payload = {
        name: settingsForm.name, subject: settingsForm.subject, description: settingsForm.description,
        semester: settingsForm.semester, academicLevel: settingsForm.academicLevel,
        gradingScheme: settingsForm.gradingScheme, syllabus: settingsForm.syllabus,
        officeHours: settingsForm.officeHours, schedule: settingsForm.schedule,
        prerequisites: settingsForm.prerequisites, settings: settingsForm.settings,
      };
      const res = await apiClient.patch(`/api/classrooms/${classroom.id}`, payload);
      const data = await res.json();
      if (data.success) toast.success("Settings saved!");
      else toast.error(data.error || "Failed to save");
    } catch { toast.error("Failed to save settings"); }
    finally { setSettingsSaving(false); }
  };

  const handleDeleteClassroom = async () => {
    if (!confirm("Are you absolutely sure? This will archive the classroom and all its data.")) return;
    try {
      const res = await apiClient.delete(`/api/classrooms/${classroom.id}`);
      const data = await res.json();
      if (data.success) { toast.success("Classroom archived"); onBack?.(); }
    } catch { toast.error("Failed to delete"); }
  };

  // ────────────────────────────────
  // Helpers
  // ────────────────────────────────

  const getWeeks = () => {
    if (!classroom.startDate || !classroom.durationWeeks) return [];
    const start = new Date(classroom.startDate);
    const weeks = [];
    for (let i = 0; i < classroom.durationWeeks; i++) {
      const weekStart = new Date(start.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(start.getTime() + ((i + 1) * 7 * 24 * 60 * 60 * 1000) - 1);
      const weekAssignments = assignments.filter((a) => {
        if (!a.dueDate) return false;
        const due = new Date(a.dueDate);
        return due >= weekStart && due <= weekEnd;
      });
      const weekMaterials = materials.filter((m) => (m.weekNumber || 0) === i + 1);
      const weekDiscussions = discussions.filter((d) => {
        if (!d.createdAt) return false;
        const created = new Date(d.createdAt);
        return created >= weekStart && created <= weekEnd;
      });
      weeks.push({ number: i + 1, startDate: weekStart, endDate: weekEnd, assignments: weekAssignments, materials: weekMaterials, discussions: weekDiscussions });
    }
    return weeks;
  };

  // ────────────────────────────────
  // Tabs
  // ────────────────────────────────

  const instructorTabs = [
    { id: "course", label: "Course" },
    { id: "calendar", label: "Calendar" },
    { id: "assignments", label: "Assignments" },
    { id: "grades", label: "Grades" },
    { id: "analytics", label: "Analytics" },
    { id: "attendance", label: "Attendance" },
    { id: "discussions", label: "Discussions" },
    { id: "materials", label: "Materials" },
    { id: "students", label: "Students" },
    { id: "chat", label: "Chat" },
    { id: "settings", label: "Settings" },
  ];

  const studentTabs = [
    { id: "course", label: "Course" },
    { id: "assignments", label: "Assignments" },
    { id: "grades", label: "Grades" },
    { id: "discussions", label: "Discussions" },
    { id: "materials", label: "Materials" },
    { id: "chat", label: "Chat" },
  ];

  const tabs = isInstructor ? instructorTabs : studentTabs;

  // ────────────────────────────────
  // Return everything
  // ────────────────────────────────

  return {
    // Tab
    activeTab, setActiveTab, tabs,
    // Assignments
    assignments, setAssignments, selectedAssignment, setSelectedAssignment,
    editingAssignment, setEditingAssignment, submissionsAssignment, setSubmissionsAssignment,
    showCreateAssignment, setShowCreateAssignment,
    handleStartAssignment, handleMarkComplete, handleEditAssignment,
    handleViewSubmissions, handleSubmitAssignment, handleAssignmentSaved,
    assignmentForm,
    // Students
    students, studentStats, handleRemoveStudent,
    // Discussions
    discussions, discussionsLoading, selectedDiscussion, setSelectedDiscussion,
    focusedDiscussionId, setFocusedDiscussionId,
    discussionPosts, postsLoading,
    newDiscTitle, setNewDiscTitle, newDiscDesc, setNewDiscDesc,
    showNewDiscussion, setShowNewDiscussion,
    replyContent, setReplyContent, replyingTo, setReplyingTo,
    discAiLoading, handleCreateDiscussion, handleCreatePost,
    handleGenerateDiscussionPrompt, fetchDiscussions, fetchPosts,
    // Materials
    materials, materialsLoading, showNewMaterial, setShowNewMaterial,
    newMat, setNewMat, handleCreateMaterial, handleAttachMaterial,
    // Announcements
    announcements, setAnnouncements,
    showNewAnnouncement, setShowNewAnnouncement,
    newAnnTitle, setNewAnnTitle, newAnnContent, setNewAnnContent,
    handlePostAnnouncement,
    // Grades
    grades, gradesLoading, handleExportGrades, fetchGrades,
    // Analytics
    analytics, analyticsLoading,
    // Course structure
    courseModules, setCourseModules, courseGenLoading, expandedModule, setExpandedModule,
    handleGenerateCourseStructure, handleGenerateModuleAssignments,
    // Forked content
    forkedContent, forkedIdSet, showForkPanel, setShowForkPanel,
    isForkedContentLocked, handleForkContent, handleUnforkContent,
    handleToggleForkUnlock, handleUpdateFork, fetchForkedContent,
    browseResults, browseLoading, browseQuery, setBrowseQuery,
    browseType, setBrowseType, fetchBrowseContent, browseError, forking,
    handleAttachDiscussion,
    // Weeks
    openedWeeks, handleToggleWeek, completedLessons, toggleLessonComplete, getWeeks,
    // Settings
    settingsForm, setSettingsForm, settingsSaving,
    handleSaveSettings, handleDeleteClassroom,
    // UI
    showInvite, setShowInvite, loading, isInstructor, setActiveTab,
    // Setters needed by child components
    setDiscussions, setForkedContent,
    // Styling constants
    inputCls, labelCls, sectionCls,
    toggleCls, toggleDot,
  };
}
