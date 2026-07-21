"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, ChevronRight, Calendar, BookOpen, Clock, BarChart2,
  Settings, ArrowLeft, Search, AlertCircle, CheckCircle2, TrendingUp,
  UserPlus, GraduationCap, FileText, Sparkles, MessageSquare, Pin,
  ExternalLink, Presentation, Code, Layers, Megaphone,
  ChevronDown, ChevronUp, Send, Tag, AlertTriangle, Link2, Copy,
  Bell, ClipboardList, Lock, Unlock, Trash2, X, Plus,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";
import { TYPE_CONFIG, MATERIAL_TYPES, MATERIAL_ICON_MAP, getDueStatus, inputCls, labelCls, sectionCls, toggleCls, toggleDot } from "./constants";
import EmptyState from "./EmptyState";
import InvitePanel from "./InvitePanel";
import ForkContentPanel from "./ForkContentPanel";
import CreateAssignmentPanel from "./CreateAssignmentPanel";
import AssignmentDetailPanel from "./AssignmentDetailPanel";
import ClassroomMobileNav from "./ClassroomMobileNav";
import CalendarTab from "./tabs/CalendarTab";
import AssignmentsTab from "./tabs/AssignmentsTab";
import GradesTab from "./tabs/GradesTab";
import AnalyticsTab from "./tabs/AnalyticsTab";
import DiscussionsTab from "./tabs/DiscussionsTab";
import MaterialsTab from "./tabs/MaterialsTab";
import StudentsTab from "./tabs/StudentsTab";
import SettingsTab from "./tabs/SettingsTab";
import CourseTab from "./tabs/CourseTab";
import ClassroomChat from "./ClassroomChat";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ClassroomDetail({ classroom, onBack, user, sidebarCollapsed, setSidebarCollapsed, searchParams, router }) {
  const initialTab = (typeof window !== 'undefined' && searchParams?.get('classroomTab')) || 'course';
  const [activeTab, setActiveTabState] = useState(initialTab);

  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    const params = new URLSearchParams(window.location.search);
    params.set('classroomTab', tab);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  }, [router]);
  const [assignments, setAssignments] = useState(classroom.assignments || []);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [submissionsAssignment, setSubmissionsAssignment] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentStats, setStudentStats] = useState({ totalStudents: 0, activeStudents: 0, avgCompletion: 0 });
  const [showCreateAssignment, setShowCreateAssignment] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(`classroom_${classroom.id}_show_asgn`) === 'true';
  });
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(false);
  const isInstructor = classroom.isInstructor ?? false;

  // Participants for the chat sidebar — no longer needed (email-style inbox handles its own data)


  const [discussions, setDiscussions] = useState([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [discussionPosts, setDiscussionPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newDiscTitle, setNewDiscTitle] = useState(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(`classroom_${classroom.id}_disc_title`) || '';
  });
  const [newDiscDesc, setNewDiscDesc] = useState(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(`classroom_${classroom.id}_disc_desc`) || '';
  });
  const [showNewDiscussion, setShowNewDiscussion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(`classroom_${classroom.id}_show_disc`) === 'true';
  });
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [discAiLoading, setDiscAiLoading] = useState(false);

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteTags, setNewNoteTags] = useState("");
  const [noteAiLoading, setNoteAiLoading] = useState(false);

  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [showNewMaterial, setShowNewMaterial] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(`classroom_${classroom.id}_show_mat`) === 'true';
  });
  const [newMat, setNewMat] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`classroom_${classroom.id}_new_mat`);
      if (saved) { try { return JSON.parse(saved); } catch {} }
    }
    return { title: "", description: "", type: "document", url: "", weekNumber: 0, category: "", isRequired: false };
  });

  const [announcements, setAnnouncements] = useState(classroom.announcements || []);
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(`classroom_${classroom.id}_show_ann`) === 'true';
  });
  const [newAnnTitle, setNewAnnTitle] = useState(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(`classroom_${classroom.id}_ann_title`) || '';
  });
  const [newAnnContent, setNewAnnContent] = useState(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(`classroom_${classroom.id}_ann_content`) || '';
  });

  const assignmentForm = {
    title: "", description: "", instructions: "", type: "course", dueDate: "", maxScore: 100,
    courseId: "", category: "", availableFrom: "", availableUntil: "", passingScore: 60,
    weight: 0, maxAttempts: 1, rubric: [],
  };

  const [grades, setGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [courseModules, setCourseModules] = useState(classroom.modules || []);
  const [courseGenLoading, setCourseGenLoading] = useState(false);
  const [expandedModule, setExpandedModule] = useState(null);
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
  const [openedWeeks, setOpenedWeeks] = useState(classroom.openedWeeks || []);
  const [completedLessons, setCompletedLessons] = useState([]);

  const fetchCompletedLessons = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/classrooms/${classroom.id}/lesson-complete`);
      const data = await res.json();
      if (data.success) setCompletedLessons(data.completed || []);
    } catch {}
  }, [classroom.id]);

  useEffect(() => { fetchCompletedLessons(); }, [fetchCompletedLessons]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get(`/api/classrooms/${classroom.id}/opened-weeks`);
        const data = await res.json();
        if (data.success) setOpenedWeeks(data.openedWeeks || []);
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [classroom.id]);

  const toggleLessonComplete = async (lessonKey, complete) => {
    try {
      const res = await apiClient.post(`/api/classrooms/${classroom.id}/lesson-complete`, { lessonKey, completed: complete });
      const data = await res.json();
      if (data.success) {
        setCompletedLessons((prev) => complete ? [...prev, lessonKey] : prev.filter((k) => k !== lessonKey));
      }
    } catch {}
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

  const [settingsForm, setSettingsForm] = useState({
    name: classroom.name || "", subject: classroom.subject || "", description: classroom.description || "",
    semester: classroom.semester || "", academicLevel: classroom.academicLevel || "undergraduate",
    gradingScheme: classroom.gradingScheme || "percentage", syllabus: classroom.syllabus || "",
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

  const fetchDiscussions = useCallback(async () => { setDiscussionsLoading(true); try { const res = await apiClient.get(`/api/classrooms/${classroom.id}/discussions`); const data = await res.json(); if (data.success) setDiscussions(data.discussions); } catch {} finally { setDiscussionsLoading(false); } }, [classroom.id]);
  const fetchNotes = useCallback(async () => { setNotesLoading(true); try { const res = await apiClient.get(`/api/classrooms/${classroom.id}/notes`); const data = await res.json(); if (data.success) setNotes(data.notes); } catch {} finally { setNotesLoading(false); } }, [classroom.id]);
  const fetchPosts = useCallback(async (discussionId) => { setPostsLoading(true); try { const res = await apiClient.get(`/api/classrooms/${classroom.id}/discussions/${discussionId}/posts`); const data = await res.json(); if (data.success) setDiscussionPosts(data.posts); } catch {} finally { setPostsLoading(false); } }, [classroom.id]);
  const fetchMaterials = useCallback(async () => { setMaterialsLoading(true); try { const res = await apiClient.get(`/api/classrooms/${classroom.id}/materials`); const data = await res.json(); if (data.success) setMaterials(data.materials); } catch {} finally { setMaterialsLoading(false); } }, [classroom.id]);
  const fetchStudents = useCallback(async () => { if (!isInstructor) return; setLoading(true); try { const res = await apiClient.get(`/api/classrooms/${classroom.id}/students`); const data = await res.json(); if (data.success) { setStudents(data.students); setStudentStats(data.stats); } } catch {} finally { setLoading(false); } }, [classroom.id, isInstructor]);
  const fetchGrades = useCallback(async () => { setGradesLoading(true); try { const res = await apiClient.get(`/api/classrooms/${classroom.id}/grades`); const data = await res.json(); if (data.success) setGrades(data.students || []); } catch {} finally { setGradesLoading(false); } }, [classroom.id]);
  const fetchAnalytics = useCallback(async () => { setAnalyticsLoading(true); try { const res = await apiClient.get(`/api/classrooms/${classroom.id}/analytics`); const data = await res.json(); if (data.success) setAnalytics(data); } catch {} finally { setAnalyticsLoading(false); } }, [classroom.id]);

  const fetchBrowseContent = useCallback(async (overrideType, overrideQuery) => {
    setBrowseLoading(true);
    setBrowseError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const t = overrideType || browseType;
      const qVal = overrideQuery !== undefined ? overrideQuery : browseQuery;
      const q = qVal ? `&q=${encodeURIComponent(qVal)}` : "";
      const res = await fetch(`/api/classrooms/${classroom.id}/browse?type=${t}${q}`, { credentials: "include", signal: controller.signal });
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
    } catch {}
  }, [classroom.id]);

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
    } catch { toast.error("Failed to generate course structure"); } finally { setCourseGenLoading(false); }
  };

  const handleGenerateModuleAssignments = async (module) => {
    setCourseGenLoading(true);
    try {
      const res = await apiClient.post("/api/classrooms/ai-generate", {
        task: "course_assignments", name: module.title, subject: classroom.subject,
        content: module.description, durationWeeks: module.weekNumber,
        classroomName: classroom.name,
      });
      const data = await res.json();
      if (data.result) {
        for (const a of data.result) {
          const assignRes = await apiClient.post(`/api/classrooms/${classroom.id}/assignments`, {
            title: a.title, description: a.description, type: a.type, category: a.category,
            maxScore: a.maxScore, passingScore: a.passingScore, weight: a.weight,
            rubric: a.rubric || [], weekNumber: module.weekNumber,
          });
          const assignData = await assignRes.json();
          if (assignData.success) setAssignments((prev) => [assignData.assignment, ...prev]);
        }
        toast.success(`${data.result.length} assignments generated for ${module.title}!`);
      } else { toast.error("Failed to generate assignments"); }
    } catch { toast.error("Failed to generate assignments"); } finally { setCourseGenLoading(false); }
  };

  const handleExportGrades = async () => {
    try {
      const res = await fetch(`/api/classrooms/${classroom.id}/grades?format=csv`, { credentials: "include" });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `grades-${classroom.name.replace(/\s+/g, "-")}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success("Grades exported!");
    } catch { toast.error("Failed to export grades"); }
  };

  useEffect(() => {
    if (activeTab === "discussions") fetchDiscussions();
    if (activeTab === "materials") fetchMaterials();
    if (activeTab === "students" && isInstructor) fetchStudents();
    if (activeTab === "grades") fetchGrades();
    if (activeTab === "analytics" && isInstructor) fetchAnalytics();
  }, [activeTab, fetchDiscussions, fetchMaterials, fetchStudents, fetchGrades, fetchAnalytics, isInstructor, classroom.id]);

  useEffect(() => {
    if (showForkPanel && isInstructor) {
      fetchBrowseContent("all", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForkPanel]);

  useEffect(() => { if (isInstructor) fetchStudents(); }, [isInstructor, fetchStudents]);
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await apiClient.get(`/api/classrooms/${classroom.id}/assignments`);
        const data = await res.json();
        if (data.success) setAssignments(data.assignments || []);
      } catch {}
    };
    if (!classroom.assignments?.length) fetchAssignments();
  }, [classroom.id, classroom.assignments?.length]);
  useEffect(() => { if (selectedDiscussion) fetchPosts(selectedDiscussion._id || selectedDiscussion.id); }, [selectedDiscussion, fetchPosts]);

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
    try { const res = await apiClient.put(`/api/classrooms/${classroom.id}/progress`, { assignmentId, status: "completed", progress: 100 }); const data = await res.json(); if (data.success) { setAssignments((prev) => prev.map((a) => a.id === assignmentId ? { ...a, myProgress: { ...a.myProgress, status: "completed", progress: 100, completedAt: new Date().toISOString() } } : a)); toast.success("Assignment marked as complete!"); } else { toast.error(data.error || "Failed"); } } catch { toast.error("Failed to update progress"); }
  };
  const handleStartAssignment = async (assignmentId) => {
    try { const res = await apiClient.put(`/api/classrooms/${classroom.id}/progress`, { assignmentId, status: "in_progress", progress: 10 }); const data = await res.json(); if (data.success) { setAssignments((prev) => prev.map((a) => a.id === assignmentId ? { ...a, myProgress: { ...a.myProgress, status: "in_progress", progress: 10 } } : a)); toast.success("Assignment started!"); } } catch { toast.error("Failed to start assignment"); }
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
  const handleAssignmentSaved = (saved, isEdit) => {
    if (isEdit) {
      setAssignments((prev) => prev.map((a) => a.id === saved.id ? { ...a, ...saved } : a));
    } else {
      setAssignments((prev) => [saved, ...prev]);
    }
    setEditingAssignment(null);
  };
  const handleCreateDiscussion = async () => {
    if (!newDiscTitle.trim()) { toast.error("Title required"); return; }
    try { const res = await apiClient.post(`/api/classrooms/${classroom.id}/discussions`, { title: newDiscTitle, description: newDiscDesc }); const data = await res.json(); if (data.success) { setDiscussions([data.discussion, ...discussions]); setNewDiscTitle(""); setNewDiscDesc(""); setShowNewDiscussion(false); toast.success("Discussion created!"); } else { toast.error(data.error || "Failed"); } } catch { toast.error("Failed to create discussion"); }
  };
  const handleCreatePost = async () => {
    if (!replyContent.trim() || !selectedDiscussion) return;
    try { const res = await apiClient.post(`/api/classrooms/${classroom.id}/discussions/${selectedDiscussion._id || selectedDiscussion.id}/posts`, { content: replyContent, parentPostId: replyingTo || undefined }); const data = await res.json(); if (data.success) { setDiscussionPosts([...discussionPosts, data.post]); setReplyContent(""); setReplyingTo(null); setDiscussions((prev) => prev.map((d) => (d._id || d.id) === (selectedDiscussion._id || selectedDiscussion.id) ? { ...d, postCount: (d.postCount || 0) + 1, lastActivityAt: new Date().toISOString() } : d)); } else { toast.error(data.error || "Failed"); } } catch { toast.error("Failed to post"); }
  };
  const handleGenerateDiscussionPrompt = async () => {
    setDiscAiLoading(true);
    try { const res = await apiClient.post("/api/classrooms/ai-generate", { task: "discussion_prompt", name: newDiscTitle || "general topic", subject: classroom.subject, classroomName: classroom.name }); const data = await res.json(); if (data.result) { setNewDiscTitle(newDiscTitle || "Discussion"); setNewDiscDesc(data.result); toast.success("Prompt generated!"); } } catch { toast.error("Failed to generate prompt"); } finally { setDiscAiLoading(false); }
  };
  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) { toast.error("Title required"); return; }
    try { const res = await apiClient.post(`/api/classrooms/${classroom.id}/notes`, { title: newNoteTitle, content: newNoteContent, tags: newNoteTags.split(",").map((t) => t.trim()).filter(Boolean) }); const data = await res.json(); if (data.success) { setNotes([data.note, ...notes]); setNewNoteTitle(""); setNewNoteContent(""); setNewNoteTags(""); setShowNewNote(false); toast.success("Note created!"); } } catch { toast.error("Failed to create note"); }
  };
  const handleGenerateNote = async () => {
    if (!newNoteTitle.trim()) { toast.error("Enter a topic first"); return; }
    setNoteAiLoading(true);
    try { const res = await apiClient.post("/api/classrooms/ai-generate", { task: "generate_note", name: newNoteTitle, subject: classroom.subject, classroomName: classroom.name }); const data = await res.json(); if (data.result) { setNewNoteContent(data.result); toast.success("Note generated!"); } } catch { toast.error("Failed to generate note"); } finally { setNoteAiLoading(false); }
  };
  const handleCreateMaterial = async () => {
    if (!newMat.title.trim()) { toast.error("Title required"); return; }
    try { const res = await apiClient.post(`/api/classrooms/${classroom.id}/materials`, newMat); const data = await res.json(); if (data.success) { setMaterials([data.material, ...materials]); setNewMat({ title: "", description: "", type: "document", url: "", weekNumber: 0, category: "", isRequired: false }); setShowNewMaterial(false); toast.success("Material added!"); } } catch { toast.error("Failed to add material"); }
  };
  const handlePostAnnouncement = async () => {
    if (!newAnnTitle.trim() || !newAnnContent.trim()) { toast.error("Title and content required"); return; }
    try { const res = await apiClient.post(`/api/classrooms/${classroom.id}/announcements`, { title: newAnnTitle, content: newAnnContent }); const data = await res.json(); if (data.success) { setAnnouncements([...announcements, data.announcement]); setNewAnnTitle(""); setNewAnnContent(""); setShowNewAnnouncement(false); toast.success("Announcement posted!"); } } catch { toast.error("Failed to post announcement"); }
  };
  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try { const payload = { name: settingsForm.name, subject: settingsForm.subject, description: settingsForm.description, semester: settingsForm.semester, academicLevel: settingsForm.academicLevel, gradingScheme: settingsForm.gradingScheme, syllabus: settingsForm.syllabus, schedule: settingsForm.schedule, prerequisites: settingsForm.prerequisites, settings: settingsForm.settings }; const res = await apiClient.patch(`/api/classrooms/${classroom.id}`, payload); const data = await res.json(); if (data.success) toast.success("Settings saved!"); else toast.error(data.error || "Failed to save"); } catch { toast.error("Failed to save settings"); } finally { setSettingsSaving(false); }
  };
  const handleDeleteClassroom = async () => {
    if (!confirm("Are you absolutely sure? This will archive the classroom and all its data.")) return;
    try { const res = await apiClient.delete(`/api/classrooms/${classroom.id}`); const data = await res.json(); if (data.success) { toast.success("Classroom archived"); onBack(); } } catch { toast.error("Failed to delete"); }
  };

  const getWeeks = () => {
    if (!classroom.startDate || !classroom.durationWeeks) return [];
    const start = new Date(classroom.startDate);
    const weeks = [];
    for (let i = 0; i < classroom.durationWeeks; i++) {
      const weekStart = new Date(start.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(start.getTime() + ((i + 1) * 7 * 24 * 60 * 60 * 1000) - 1);
      const weekAssignments = assignments.filter((a) => { if (!a.dueDate) return false; const due = new Date(a.dueDate); return due >= weekStart && due <= weekEnd; });
      const weekMaterials = materials.filter((m) => (m.weekNumber || 0) === i + 1);
      const weekDiscussions = discussions.filter((d) => { if (!d.createdAt) return false; const created = new Date(d.createdAt); return created >= weekStart && created <= weekEnd; });
      weeks.push({ number: i + 1, startDate: weekStart, endDate: weekEnd, assignments: weekAssignments, materials: weekMaterials, discussions: weekDiscussions });
    }
    return weeks;
  };

  const instructorTabs = [
    { id: "course", label: "Course", icon: BookOpen },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "assignments", label: "Assignments", icon: ClipboardList },
    { id: "grades", label: "Grades", icon: BarChart2 },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "discussions", label: "Discussions", icon: MessageSquare },
    { id: "materials", label: "Materials", icon: Layers },
    { id: "students", label: "Students", icon: Users },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  const studentTabs = [
    { id: "course", label: "Course", icon: BookOpen },
    { id: "assignments", label: "Assignments", icon: ClipboardList },
    { id: "grades", label: "Grades", icon: BarChart2 },
    { id: "discussions", label: "Discussions", icon: MessageSquare },
    { id: "materials", label: "Materials", icon: Layers },
    { id: "chat", label: "Chat", icon: MessageSquare },
  ];
  const tabs = isInstructor ? instructorTabs : studentTabs;

  const classroomState = {
    selectedAssignment, setSelectedAssignment, editingAssignment, setEditingAssignment,
    submissionsAssignment, setSubmissionsAssignment, isInstructor, classroom, user,
    assignments, setAssignments, handleStartAssignment, handleMarkComplete,
    handleEditAssignment, handleViewSubmissions, handleAssignmentSaved,
    showCreateAssignment, setShowCreateAssignment, showForkPanel, setShowForkPanel,
    showNewAnnouncement, setShowNewAnnouncement, showInvite, setShowInvite,
    courseModules, courseGenLoading, handleGenerateCourseStructure, setCourseModules,
    handleGenerateModuleAssignments, expandedModule, setExpandedModule,
    forkedContent, forkedIdSet, isForkedContentLocked, handleToggleForkUnlock,
    handleUnforkContent, handleForkContent, handleUpdateFork, getDueStatus,
    newAnnTitle, setNewAnnTitle, newAnnContent, setNewAnnContent,
    handlePostAnnouncement, assignmentForm, studentStats,
    CreateAssignmentPanel, AssignmentDetailPanel,
    inputCls, labelCls, sectionCls,
    discussions, discussionsLoading, selectedDiscussion, setSelectedDiscussion,
    discussionPosts, postsLoading, newDiscTitle, setNewDiscTitle,
    newDiscDesc, setNewDiscDesc, showNewDiscussion, setShowNewDiscussion,
    replyContent, setReplyContent, replyingTo, setReplyingTo,
    discAiLoading, handleCreateDiscussion, handleCreatePost,
    handleGenerateDiscussionPrompt, fetchDiscussions,
    materials, materialsLoading, showNewMaterial, setShowNewMaterial,
    newMat, setNewMat, handleCreateMaterial,
    notes, notesLoading, showNewNote, setShowNewNote,
    newNoteTitle, setNewNoteTitle, newNoteContent, setNewNoteContent,
    newNoteTags, setNewNoteTags, noteAiLoading, handleCreateNote, handleGenerateNote, fetchNotes,
    grades, gradesLoading, handleExportGrades,
    analytics, analyticsLoading,
    students, loading, showInvite: showInvite,
    settingsForm, setSettingsForm, settingsSaving,
    handleSaveSettings, handleDeleteClassroom, daysOfWeek,
    toggleCls, toggleDot,
    browseResults, browseLoading, browseQuery, setBrowseQuery,
    browseType, setBrowseType, fetchBrowseContent, browseError, forking,
    getWeeks, announcements,
    openedWeeks, handleToggleWeek,
    completedLessons, toggleLessonComplete,
    handleRemoveStudent,
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden pb-16 lg:pb-0">
      {/* Sidebar — shows nav tabs normally, participants when on chat tab */}
      <div className={`${sidebarCollapsed ? "w-14" : "w-[240px]"} shrink-0 transition-all duration-300 hidden lg:flex flex-col h-full`}
        style={{ background: "var(--sidebar-bg, var(--card))", borderRight: "1px solid var(--border)" }}>

        {/* ── Classroom nav (same for all tabs) ── */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-4 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-500/15 text-green-600 dark:text-green-400 flex-shrink-0">
                <GraduationCap className="w-4.5 h-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold truncate text-foreground leading-tight" style={{ fontFamily: "var(--font-fraunces)" }}>{classroom.name}</p>
                <p className="text-xs text-muted-foreground leading-none mt-1 truncate">{classroom.subject || "Classroom"}</p>
              </div>
            </div>
          </div>
        )}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {tabs.map(({ id, label, icon: Icon }, index) => {
              const isActive = activeTab === id;
              return (
                <motion.div key={id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} className="relative">
                  <button onClick={() => setActiveTab(id)}
                    className={`relative flex items-center w-full gap-2 rounded-lg transition-all duration-200 group ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-2.5 py-2"} text-xs font-medium ${isActive ? "bg-green-500/10 text-green-700 dark:text-green-400" : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"}`}>
                    {isActive && <motion.div layoutId="classroom-active-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-green-500" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                    <span className={`flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 transition-all duration-200 ${isActive ? "bg-green-500/15 text-green-600 dark:text-green-400" : "bg-secondary/60 text-muted-foreground group-hover:bg-secondary group-hover:text-foreground"}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left truncate text-[12px]" style={{ fontFamily: "var(--font-fraunces)" }}>{label}</span>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-green-500/70 flex-shrink-0" />}
                      </>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </nav>
          {!sidebarCollapsed && isInstructor && (
            <div className="px-2 pb-3 pt-2 border-t border-border/60 space-y-0.5">
              <p className="px-2 mb-1 text-[8px] font-semibold tracking-widest uppercase text-muted-foreground/60 select-none" style={{ fontFamily: "var(--font-fraunces)" }}>Quick Add</p>
              {[
                { label: "Assignment", color: "text-green-600 dark:text-green-400", hoverBg: "hover:bg-green-500/10", icon: ClipboardList, action: () => setShowCreateAssignment(true) },
                { label: "Discussion", color: "text-blue-600 dark:text-blue-400", hoverBg: "hover:bg-blue-500/10", icon: MessageSquare, action: () => { setActiveTab("discussions"); setShowNewDiscussion(true); } },
                { label: "Material", color: "text-purple-600 dark:text-purple-400", hoverBg: "hover:bg-purple-500/10", icon: Layers, action: () => { setActiveTab("materials"); setShowNewMaterial(true); } },
                { label: "Invite", color: "text-muted-foreground", hoverBg: "hover:bg-secondary/80", icon: UserPlus, action: () => setShowInvite(true) },
              ].map(({ label, color, hoverBg, icon: Icon, action }) => (
                <button key={label} onClick={action} className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${color} ${hoverBg}`}>
                  <span className="flex items-center justify-center w-5 h-5 flex-shrink-0"><Plus className="w-3 h-3" /></span>
                  <span style={{ fontFamily: "var(--font-fraunces)" }}>{label}</span>
                </button>
              ))}
            </div>
          )}
      </div>

      <ClassroomMobileNav activeTab={activeTab} setActiveTab={setActiveTab} isInstructor={isInstructor} onBack={onBack} />

      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-[110rem] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 pt-6 sm:pt-8 lg:pt-12 pb-16 space-y-4">
        {announcements.length > 0 && activeTab !== "settings" && activeTab !== "chat" && (
          <div className="space-y-2">
            {announcements.slice(-3).reverse().map((ann, i) => (
              <div key={i} className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Megaphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{ann.title}</span>
                  {ann.createdAt && <span className="text-[10px] text-amber-600/60">{new Date(ann.createdAt).toLocaleDateString()}</span>}
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 ml-5">{ann.content}</p>
              </div>
            ))}
          </div>
        )}

        {isInstructor && (activeTab === "assignments" || activeTab === "calendar") && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Students", value: studentStats.totalStudents || classroom.studentCount, icon: Users, color: "text-blue-500" },
              { label: "Active", value: studentStats.activeStudents, icon: TrendingUp, color: "text-green-500" },
              { label: "Avg Progress", value: `${studentStats.avgCompletion || 0}%`, icon: BarChart2, color: "text-purple-500" },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1"><Icon className={`w-3.5 h-3.5 ${color}`} /><span className="text-[10px] font-medium text-slate-500 uppercase">{label}</span></div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "course" && (
          <CourseTab classroomState={classroomState} />
        )}

        {activeTab === "calendar" && (
          <CalendarTab classroomState={classroomState} />
        )}

        {activeTab === "assignments" && (
          <AssignmentsTab classroomState={classroomState} />
        )}

        {activeTab === "discussions" && (
          <DiscussionsTab classroomState={classroomState} />
        )}

        {activeTab === "materials" && (
          <MaterialsTab classroomState={classroomState} />
        )}

        {activeTab === "students" && isInstructor && (
          <StudentsTab classroomState={classroomState} />
        )}

        {activeTab === "grades" && (
          <GradesTab classroomState={classroomState} />
        )}

        {activeTab === "analytics" && isInstructor && (
          <AnalyticsTab classroomState={classroomState} />
        )}

        {activeTab === "settings" && isInstructor && (
          <SettingsTab classroomState={classroomState} />
        )}

        {activeTab === "chat" && (
          <ClassroomChat
            classroomId={classroom.id}
            user={user}
            classroom={classroom}
            isInstructor={isInstructor}
            students={students}
            announcements={announcements}
            onAnnouncementAdd={(ann) => setAnnouncements((prev) => [...prev, ann])}
            onAnnouncementDelete={(annId) => setAnnouncements((prev) => prev.filter((a) => (a._id || a.id) !== annId))}
          />
        )}
        </div>
      </div>
    </div>
  );
}
