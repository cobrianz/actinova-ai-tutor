"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import Link from "next/link";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  BookOpen,
  Play,
  ChevronDown,
  ChevronUp,
  Send,
  Bot,
  FileText,
  MessageCircle,
  Download,
  Award,
  Menu,
  Sparkles,
  X,
  CheckCircle,
  Home,
  Pin,
  Lock,
  BarChart3,
  TrendingUp,
  Share2,
} from "lucide-react";

import { toast } from "sonner";
import { downloadCourseAsPDF, parseContentIntoBlocks } from "@/lib/pdfUtils";
import { highlightToHtml } from "@/lib/syntaxHighlighter";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
// D3 visualizations removed per policy: no interactive D3 visuals
import ActirovaLoader from "./ActirovaLoader";
import Flashcards from "./Flashcards";
import QuizInterface from "./QuizInterface";
import { apiClient } from "@/lib/csrfClient";
import LessonChart from "./LessonChart";
import LessonTable from "./LessonTable";
import html2canvas from "html2canvas";

export default function LearnContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refreshToken, fetchUser, loading } = useAuth();

  const shareId = searchParams.get("shareId") || params.shareId;
  // Retrieve topic from either path params or query params
  const topicParam = params.topic || searchParams.get("topic") || "";
  const topic = decodeURIComponent(topicParam);
  const originalTopic = searchParams.get("originalTopic");
  const format = searchParams.get("format") || "course";
  const difficulty = searchParams.get("difficulty") || "beginner";
  const existingQuizId = searchParams.get("existing");
  // Use original topic if provided, otherwise use the URL topic
  const actualTopic = originalTopic ? decodeURIComponent(originalTopic) : topic;
  const [activeView, setActiveView] = useState("outline");
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [expandedModules, setExpandedModules] = useState(new Set([1]));
  // Initialize lesson from URL or default
  const [activeLesson, setActiveLesson] = useState(() => {
    if (typeof window === "undefined") return { moduleId: 1, lessonIndex: 0 };
    
    // Check URL first
    const urlModule = new URLSearchParams(window.location.search).get("module");
    const urlLesson = new URLSearchParams(window.location.search).get("lesson");
    
    const m = parseInt(urlModule);
    const l = parseInt(urlLesson);
    
    if (!isNaN(m) && !isNaN(l)) {
      // Internal lessonIndex is 0-based, URL parameter is 1-based
      return { moduleId: m, lessonIndex: Math.max(0, l - 1) };
    }
    
    return { moduleId: 1, lessonIndex: 0 };
  });
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      type: "ai",
      message:
        "Hi! I'm your AI tutor. I'm here to help you understand the concepts better. Feel free to ask me any questions about the lesson!",
      timestamp: new Date(),
    },
  ]);

  const [courseData, setCourseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lessonContentLoading, setLessonContentLoading] = useState(false);
  const [generatingLessons, setGeneratingLessons] = useState(new Set()); // Track lessons being generated in background
  const [typingContent, setTypingContent] = useState("");
  const initialFetchDone = useRef(false); // Fixes navigation loop bug
  const fetchInProgressRef = useRef(false); // Prevent duplicate API calls
  const lastShareUpdateRef = useRef(0); // Timestamp of last personal share toggle
  const initializedCoursesRef = useRef(new Set()); // Track initialized courses
  const contentRef = useRef(null);
  const lastWidthRef = useRef(typeof window !== "undefined" ? window.innerWidth : 0);
  const chatContainerRef = useRef(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalData, setLimitModalData] = useState(null);


  const [currentNotes, setCurrentNotes] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [lessonQuestions, setLessonQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showQuestionResults, setShowQuestionResults] = useState(false);

  const isPro = (() => {
    // 1. Direct Pro/Enterprise/Premium
    const hasOwnPremium = user && (
      (user.subscription?.plan === "pro" || user.subscription?.plan === "enterprise" || user.subscription?.tier === "pro" || user.subscription?.tier === "enterprise") || 
      user.isPremium
    );
    if (hasOwnPremium) return true;
    
    // 2. Owner check
    if (user && courseData?.userId && String(user._id || user.id) === String(courseData.userId)) return true;

    // 3. Chain of Inheritance (Enrolled users)
    if (user && Array.isArray(courseData?.enrolled)) {
      const myEnrollment = courseData.enrolled.find(e => String(e.userId || e) === String(user._id || user.id));
      if (myEnrollment) {
        // A. Hierarchical Config (New)
        if (myEnrollment.invitedByShareId && Array.isArray(courseData.shareConfigs)) {
          const config = courseData.shareConfigs.find(c => c.shareId === myEnrollment.invitedByShareId);
          if (config && config.isActive && config.tier !== "free") return true;
        }
        
        // B. Legacy/Owner Fallback
        // If the root owner has sharing enabled and is/was a premium user
        if (courseData.isShared && (courseData.sharerTier !== "free" && courseData.sharePlan !== "free")) {
           // We assume legacy sharerTier/sharePlan being anything other than null/free means Pro/Enterprise inherited
           if (courseData.sharerTier || courseData.sharePlan) return true;
        }
      }
    }

    // 4. Public Viewing (Via Share Link)
    if (shareId) {
      // Check the specific link config first
      if (Array.isArray(courseData?.shareConfigs)) {
        const config = courseData.shareConfigs.find(c => c.shareId === shareId);
        if (config && config.isActive && config.tier !== "free") return true;
      }
      // Fallback for legacy shareId or direct sharerTier presence
      if (courseData?.isShared && (courseData?.sharerTier !== "free" || courseData?.sharePlan !== "free")) {
         if (courseData.sharerTier || courseData.sharePlan) return true;
      }
    }

    return false;
  })();
  // Free users can read modules 1-3; modules 4+ are padlocked
  const FREE_READABLE_MODULES = 3;
  const freeReadableModules = isPro ? Infinity : FREE_READABLE_MODULES;

  const myShareConfig = Array.isArray(courseData?.shareConfigs)
    ? courseData.shareConfigs.find(c => String(c.sharerId) === String(user?._id || user?.id))
    : null;
  const isMyShareActive = !!(myShareConfig?.isActive);
  const myShareId = myShareConfig?.shareId;

  // Use a stable ID for persistence keys to avoid changes when courseData._id loads
  const stableId = `${actualTopic}-${format}-${difficulty}`;

  const conversationKey = () => `conversation_${stableId}`;
  const progressKey = () => `progress_${stableId}`;
  const lastLessonKey = () => `last_lesson_${stableId}`;
  const expandedModulesKey = () => `expanded_modules_${stableId}`;

  const saveConversation = (messages) => {
    try {
      localStorage.setItem(conversationKey(), JSON.stringify(messages));
    } catch (e) {
      // Silent fail for conversation persistence
    }
    // Also persist to backend library for reloads
    try {
      apiClient.post("/api/library", {
        action: "saveConversation",
        courseId: courseData?._id || null,
        topic: actualTopic,
        difficulty,
        format,
        messages,
      }).catch(() => { });
    } catch (e) {
      // Silent fail for backend conversation persistence
    }
  };

  // Handle Copy to Clipboard for code blocks
  useEffect(() => {
    const handleCopy = async (e) => {
      const btn = e.target.closest('.copy-code-btn');
      if (!btn) return;
      
      const encodedCode = btn.getAttribute('data-code');
      if (!encodedCode) return;
      
      try {
        // Decode from UTF-8 safe base64
        const code = decodeURIComponent(atob(encodedCode).split('').map(c => 
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        
        await navigator.clipboard.writeText(code);
        
        const originalIcon = btn.innerHTML;
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check text-green-500"><path d="M20 6 9 17l-5-5"/></svg>`;
        
        const parent = btn.parentElement;
        if (parent) parent.classList.add('copy-success');
        
        setTimeout(() => {
          btn.innerHTML = originalIcon;
          if (parent) parent.classList.remove('copy-success');
        }, 2000);
        
        toast.success("Code copied!");
      } catch (err) {
        console.error("Copy failed", err);
        toast.error("Failed to copy code");
      }
    };
    
    document.addEventListener('click', handleCopy);
    return () => document.removeEventListener('click', handleCopy);
  }, []);

  // Persist active lesson and expanded modules
  useEffect(() => {
    if (activeLesson) {
      try {
        localStorage.setItem(lastLessonKey(), JSON.stringify(activeLesson));
        
        // Update URL query parameters without full page reload
        const newParams = new URLSearchParams(window.location.search);
        newParams.set("module", activeLesson.moduleId);
        // Save as 1-based index in the URL
        newParams.set("lesson", activeLesson.lessonIndex + 1);
        router.replace(`${window.location.pathname}?${newParams.toString()}`, { scroll: false });
      } catch (e) {}
    }
  }, [activeLesson]);

  useEffect(() => {
    if (expandedModules && courseData) {
      try {
        localStorage.setItem(expandedModulesKey(), JSON.stringify(Array.from(expandedModules)));
      } catch (e) {}
    }
  }, [expandedModules, courseData]);

  // Restore lesson state on load (if not already in URL)
  useEffect(() => {
    const urlModule = searchParams.get("module");
    const urlLesson = searchParams.get("lesson");
    
    // Only restore from localStorage if NOT in URL
    if (!urlModule && !urlLesson) {
      try {
        const savedLesson = localStorage.getItem(lastLessonKey());
        if (savedLesson) {
          setActiveLesson(JSON.parse(savedLesson));
        }
      } catch (e) {}
    }

    // Restore expanded modules when courseData is available
    if (courseData) {
      try {
        const savedExpanded = localStorage.getItem(expandedModulesKey());
        if (savedExpanded) {
          setExpandedModules(new Set(JSON.parse(savedExpanded)));
        }
      } catch (e) {}
    }
  }, [courseData]);

  // Sidebar Auto-Scroll to Active Lesson
  useEffect(() => {
    if (activeLesson) {
      // Small delay to ensure the element is rendered if a module just expanded
      const timer = setTimeout(() => {
        const activeEl = document.getElementById(`sidebar-lesson-${activeLesson.moduleId}-${activeLesson.lessonIndex}`);
        if (activeEl) {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeLesson]);

  // Initial lesson fetch trigger
  useEffect(() => {
    if (courseData && !isLoading && activeLesson && !initialFetchDone.current) {
      initialFetchDone.current = true;
      // Small delay to ensure state consistency
      const timer = setTimeout(() => {
        selectLesson(activeLesson.moduleId, activeLesson.lessonIndex);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [courseData, isLoading]);

  const restoreConversation = async () => {
    try {
      const stored = localStorage.getItem(conversationKey());
      if (stored) {
        setChatMessages(JSON.parse(stored));
        return;
      }
    } catch { }
    // Try backend
    try {
      const res = await apiClient.post("/api/library", {
        action: "getConversation",
        courseId: courseData?._id || null,
        topic: actualTopic,
        difficulty,
        format,
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages) && data.messages.length) {
          setChatMessages(data.messages);
          try {
            localStorage.setItem(
              conversationKey(),
              JSON.stringify(data.messages)
            );
          } catch { }
        }
      }
    } catch { }
  };

  useEffect(() => {
    if (courseData?._id) {
      restoreConversation();
      // Restore progress from local storage
      const savedProgress = localStorage.getItem(progressKey());
      if (savedProgress) {
        setCompletedLessons(new Set(JSON.parse(savedProgress)));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseData?._id]);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const [activeRightPanel, setActiveRightPanel] = useState("notes");

  // Handle responsive sidebar defaults
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const wasSmall = lastWidthRef.current < 768;
      const isSmallNow = width < 768;
      
      if (width >= 1024) { // Large
        setIsSidebarOpen(true);
        setIsRightPanelOpen(true);
      } else if (width >= 768) { // Medium
        setIsSidebarOpen(true);
        setIsRightPanelOpen(false);
      } else if (isSmallNow && !wasSmall) { // Only set default when CROSSING into small screen
        setIsSidebarOpen(true); // Open by default once when entering mobile view
        setIsRightPanelOpen(false);
      }
      
      lastWidthRef.current = width;
    };

    // Set initial state
    handleResize();

    // We only want to set the defaults once on mount or when the user hasn't manually toggled them?
    // Actually, usually users expect themes/layouts to react to resize but manual toggles to persist.
    // For now, let's just do it on mount to satisfy the "defaults" requirement.
  }, []);

  const toggleModule = (moduleId) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const goToNextLesson = () => {
    if (!courseData || !activeLesson) return;

    const { moduleId, lessonIndex } = activeLesson;
    const currentModuleIndex = courseData.modules.findIndex(m => m.id === moduleId);
    if (currentModuleIndex === -1) return;

    const currentModule = courseData.modules[currentModuleIndex];
    
    // Check if there's another lesson in the current module
    if (lessonIndex + 1 < currentModule.lessons.length) {
      selectLesson(moduleId, lessonIndex + 1);
    } 
    // Otherwise, try to go to the first lesson of the next module
    else if (currentModuleIndex + 1 < courseData.modules.length) {
      const nextModule = courseData.modules[currentModuleIndex + 1];
      
      // Check if next module is locked for free users
      if (!isPro && currentModuleIndex + 1 >= FREE_READABLE_MODULES) {
        toast.error("Next modules are locked. Upgrade to Pro to continue.", {
          action: {
            label: "Upgrade",
            onClick: () => router.push("/pricing"),
          },
        });
        return;
      }
      
      toggleModule(nextModule.id); // Ensure it's expanded
      selectLesson(nextModule.id, 0);
    } else {
      toast.success("Congratulations! You've finished the course.");
    }
  };

  const selectLesson = async (moduleId, lessonIndex) => {
    // Check if module is locked for free users (moduleId is 1-based)
    if (!isPro && moduleId > FREE_READABLE_MODULES) {
      toast.error(" This module is locked. Upgrade to Pro to unlock all 20 modules.", {
        action: {
          label: "Upgrade",
          onClick: () => router.push("/pricing"),
        },
      });
      return;
    }

    setActiveLesson({ moduleId, lessonIndex });

    // Only auto-close sidebar on smaller screens
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }

    // Fetch lesson content if not already loaded
    const module = courseData?.modules?.find((m) => m.id === moduleId);
    const lesson = module?.lessons?.[lessonIndex];

    // Check local storage first
    const localStorageKey = `lesson_${actualTopic}_${difficulty}_${moduleId}_${lessonIndex}`;
    const cachedContent = localStorage.getItem(localStorageKey);

    if (
      cachedContent &&
      cachedContent.trim() !== "" &&
      cachedContent.trim() !== "Content for this lesson is coming soon..."
    ) {
      // Update course data with cached content
      setCourseData((prevData) => {
        const newData = { ...prevData };
        if (newData.modules && newData.modules[moduleId - 1]) {
          if (newData.modules[moduleId - 1].lessons[lessonIndex]) {
            newData.modules[moduleId - 1].lessons[lessonIndex].content =
              cachedContent;
          }
        }
        return newData;
      });
      return;
    }

    // Only fetch if content doesn't exist or is empty
    if (
      lesson &&
      (!lesson.content ||
        lesson.content.trim() === "" ||
        lesson.content ===
        "Content will be generated when you start the lesson.")
    ) {
      // Trigger background generation without blocking navigation
      fetchLessonContent(
        moduleId,
        lessonIndex,
        lesson.title,
        module.title
      );
    }
  };

  const fetchLessonContent = async (
    moduleId,
    lessonIndex,
    lessonTitle,
    moduleTitle
  ) => {
    const lessonKey = `${moduleId}-${lessonIndex}`;

    // Prevent duplicate background generations for the same lesson
    if (generatingLessons.has(lessonKey)) return;

    try {
      setGeneratingLessons((prev) => new Set(prev).add(lessonKey));
      setLessonContentLoading(true); // Still used for initial active lesson loading if desired, or we can use it more granularly
      setTypingContent("");

      const response = await apiClient.post("/api/course-agent", {
        action: "generateLesson",
        courseId: courseData?._id || null,
        shareId: searchParams.get("shareId"),
        moduleId,
        lessonIndex,
        lessonTitle,
        moduleTitle,
        courseTopic: topic,
        difficulty,
      });

      if (!response.ok) {
        throw new Error("Failed to generate lesson content");
      }

      const data = await response.json();

      // Update course data with the new content
      setCourseData((prevData) => {
        const newData = { ...prevData };
        if (newData.modules && newData.modules[moduleId - 1]) {
          if (newData.modules[moduleId - 1].lessons[lessonIndex]) {
            newData.modules[moduleId - 1].lessons[lessonIndex].content =
              data.content;
          }
        }
        return newData;
      });

      // Save to local storage for faster future access (both cached and newly generated content)
      const localStorageKey = `lesson_${actualTopic}_${difficulty}_${moduleId}_${lessonIndex}`;
      try {
        localStorage.setItem(localStorageKey, data.content);
        // Trigger usage update in sidebar
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("usageUpdated"));
        }
      } catch (storageError) {
        // Silent fail for localStorage
      }

      // Auto-mark lesson as completed now that content has been generated
      const moduleArr = courseData?.modules || [];
      const currentModule = moduleArr[moduleId - 1]; // Use direct index for safety matching fetch
      const lesson = currentModule?.lessons?.[lessonIndex];
      const lessonId = lesson?.id || `${moduleId}-${lessonIndex}`;
      const courseId = courseData?._id ? String(courseData._id) : null;

      // Update local completion state
      let updatedCompletedSet;
      setCompletedLessons((prev) => {
        const next = new Set(prev);
        next.add(lessonId);
        updatedCompletedSet = next;
        // Persist to localStorage
        try {
          localStorage.setItem(progressKey(), JSON.stringify(Array.from(next)));
        } catch (_) {}
        return next;
      });

      // Also mark completed on the courseData lesson object (for UI consistency)
      setCourseData((prevData) => {
        const newData = { ...prevData };
        if (newData.modules?.[moduleId - 1]?.lessons?.[lessonIndex]) {
          newData.modules[moduleId - 1].lessons[lessonIndex].completed = true;
        }
        return newData;
      });

      // Persist completed flag to backend DB
      if (courseId) {
        try {
          const totalLessonsCnt = courseData?.totalLessons || 100;
          const progress = Math.round((updatedCompletedSet.size / totalLessonsCnt) * 100);

          await apiClient.post("/api/course-progress", {
            courseId,
            progress,
            completed: progress >= 100,
            isLessonCompleted: true,
            lessonId,
            userId: String(user?._id || user?.id || ""),
          });
        } catch (progressErr) {
          // Silent fail — don't block the user from reading content
          console.warn("Failed to auto-save lesson completion:", progressErr);
        }
      }

      // Show typing animation
      setTypingContent(data.content);
    } catch (error) {
      toast.error("Failed to load lesson content");
      // Set a fallback message
      setCourseData((prevData) => {
        const newData = { ...prevData };
        if (newData.modules && newData.modules[moduleId - 1]) {
          if (newData.modules[moduleId - 1].lessons[lessonIndex]) {
            newData.modules[moduleId - 1].lessons[lessonIndex].content =
              "Failed to load content. Please try again.";
          }
        }
        return newData;
      });
    } finally {
      setGeneratingLessons((prev) => {
        const next = new Set(prev);
        next.delete(lessonKey);
        return next;
      });
      setLessonContentLoading(false);
    }
  };

  const toggleLessonCompletion = async (moduleId, lessonIndex) => {
    const mod = courseData?.modules?.find(m => m.id === moduleId);
    const lesson = mod?.lessons?.[lessonIndex];
    const lessonId = lesson?.id || `${moduleId}-${lessonIndex}`;
    const newCompleted = new Set(completedLessons);

    if (newCompleted.has(lessonId)) {
      newCompleted.delete(lessonId);
    } else {
      newCompleted.add(lessonId);
    }
    setCompletedLessons(newCompleted);

    // --- Save progress ---
    try {
      const isNowCompleted = newCompleted.has(lessonId);

      // 1. Update lesson.completed on courseData in memory for instant UI feedback
      setCourseData((prevData) => {
        const newData = { ...prevData };
        const mod = newData.modules?.find((m) => m.id === moduleId);
        if (mod?.lessons?.[lessonIndex]) {
          mod.lessons[lessonIndex].completed = isNowCompleted;
        }
        return newData;
      });

      // 2. Save to Local Storage for immediate persistence
      localStorage.setItem(
        progressKey(),
        JSON.stringify(Array.from(newCompleted))
      );

      // 3. Save to backend database
      const courseId = courseData?._id ? String(courseData._id) : null;
      if (courseId) {
        const totalLessons = courseData?.totalLessons || 0;
        const progress =
          totalLessons > 0
            ? Math.round((newCompleted.size / totalLessons) * 100)
            : 0;

        const response = await apiClient.post("/api/course-progress", {
          courseId,
          progress,
          completed: progress === 100,
          isLessonCompleted: isNowCompleted,
          userId: String(user?._id || user?.id || ""),
          lessonId: lessonId,
        }, {
          headers: {
            "x-user-id": String(user?._id || user?.id || ""),
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Attempt a silent token refresh if we get a 401
            await refreshToken?.();
          }
          throw new Error(`Server returned ${response.status}`);
        }
      }
    } catch (err) {
      console.error("Progress save error:", err);
      toast.error("Failed to save progress to the cloud.");
    }
  };

  const handleDownloadLesson = async () => {
    if (!currentLesson?.content || lessonContentLoading) return;

    const isPro = user && ((user.subscription?.plan === "pro" && user.subscription?.status === "active") || user.isPremium);
    if (!isPro) {
      toast.error("Lesson PDF downloads are a Pro feature. Please upgrade.");
      router.push("/pricing");
      return;
    }

    const toastId = toast.loading("Preparing lesson PDF...");
    try {
      const activeModule = courseData?.modules?.find(m => m.id === activeLesson.moduleId);
      
      // Prepare visuals
      const visualBlocks = parseContentIntoBlocks(currentLesson.content);
      const visuals = [];
      let chartIndex = 0;
      let tableIndex = 0;

      // Ensure visuals are rendered and give some time for charts to animate/render
      document.body.setAttribute('data-exporting', 'true');
      toast.loading("Capturing visuals...", { id: toastId });

      try {
        // Increase timeout to ensure all charts are fully rendered
        await new Promise(resolve => setTimeout(resolve, 2000));

        for (let i = 0; i < visualBlocks.length; i++) {
          const block = visualBlocks[i];
          if (block.type === "chart" || block.type === "table") {
            const elementId = `visual-${block.type}-${i}`;
            const element = document.getElementById(elementId);

            if (element) {
              try {
                const canvas = await html2canvas(element, {
                  scale: 2,
                  useCORS: true,
                  logging: false,
                  backgroundColor: "#ffffff",
                  onclone: (clonedDoc) => {
                    const clonedEl = clonedDoc.getElementById(elementId);
                    if (clonedEl) {
                      clonedEl.style.visibility = 'visible';
                      clonedEl.style.opacity = '1';
                      clonedEl.style.display = 'block';
                    }
                  }
                });

                const imgData = canvas.toDataURL("image/png");
                if (imgData && imgData.startsWith("data:image/png;base64,") && imgData.length > 30) {
                  visuals.push({
                    type: block.type,
                    index: block.type === "chart" ? chartIndex : tableIndex,
                    image: imgData,
                    width: canvas.width,
                    height: canvas.height
                  });
                } else {
                  console.warn(`Failed to capture valid image for ${elementId}`);
                }
              } catch (err) {
                console.error(`Error capturing ${elementId}:`, err);
              }
            } else {
              console.warn(`Element not found for capture: ${elementId}`);
            }
            
            // Always increment indices to stay in sync with PDF parser
            if (block.type === "chart") chartIndex++;
            else if (block.type === "table") tableIndex++;
          }
        }
      } finally {
        document.body.removeAttribute('data-exporting');
      }

      const lessonData = {
        ...currentLesson,
        course: courseData?.title,
        module: activeModule?.title
      };
      await downloadCourseAsPDF(lessonData, "notes", visuals);
      toast.success("Download started!", { id: toastId });
    } catch (error) {
      console.error("Lesson download error:", error);
      toast.error("Failed to download lesson PDF", { id: toastId });
    }
  };

  const [isSharingToggle, setIsSharingToggle] = useState(false);

  const handleShare = async () => {
    if (!courseData?._id || isSharingToggle) return;
    
    const toastId = toast.loading(isMyShareActive ? "Disabling share..." : "Enabling share...");
    try {
      setIsSharingToggle(true);
      const res = await apiClient.post("/api/library/share", { 
        courseId: courseData._id,
        action: isMyShareActive ? "disable" : "enable"
      });
      
      if (!res.ok) throw new Error("Failed to toggle sharing");
      
      const data = await res.json();
      
      // Update local shareConfigs array
      lastShareUpdateRef.current = Date.now();
      setCourseData(prev => {
        const newConfigs = [...(prev.shareConfigs || [])];
        const userIdentifier = String(user?._id || user?.id || "");
        const index = newConfigs.findIndex(c => String(c.sharerId) === userIdentifier);
        
        // Match the API's behavior: data.isShared is false on disable
        // However, for personal isActive state, we should use the inverse of the previous action
        const nowActive = !isMyShareActive;

        const updatedConfig = {
          shareId: data.shareId,
          sharerId: user?._id || user?.id,
          tier: user?.subscription?.plan || "free",
          isActive: nowActive,
          createdAt: new Date()
        };

        if (index >= 0) {
          newConfigs[index] = updatedConfig;
        } else {
          newConfigs.push(updatedConfig);
        }

        return { 
          ...prev, 
          shareConfigs: newConfigs,
          // Legacy fields for backward compatibility
          isShared: nowActive, 
          shareId: data.shareId 
        };
      });
      
      if (!isMyShareActive) { // Was not active, now is active
        const shareId = data.shareId;
        const shareUrl = `${window.location.origin}/share/${shareId}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Sharing enabled! Link copied to clipboard.", {
          id: toastId,
          description: `Anyone with this link can now view this course (${isPro ? "Full Access" : "3-Module Preview"}).`,
          duration: 5000,
        });
      } else {
        toast.success("Sharing disabled.", { id: toastId });
      }
    } catch (err) {
      console.error("Share error:", err);
      toast.error("Failed to update sharing status", { id: toastId });
    } finally {
      setIsSharingToggle(false);
    }
  };

  const sendAiQuestion = async () => {
    if (!aiQuestion.trim()) return;

    // Ask backend to classify relevance to the course before generating

    const isPro =
      !!(
        user?.subscription &&
        (user.subscription.plan === "pro" || user.subscription.plan === "enterprise") &&
        user.subscription.status === "active"
      ) || !!user?.isPremium;

    if (!isPro) {
      const key = `ai_responses_${new Date().toDateString()}`;
      const used = parseInt(localStorage.getItem(key) || "0", 10);
      if (used >= 3) {
        toast.error(
          "Daily AI tutor limit reached (3 responses of ≤50 words). Upgrade to Pro for unlimited responses."
        );
        return;
      }
      localStorage.setItem(key, String(used + 1));
    }

    const userMessage = {
      type: "user",
      message: aiQuestion,
      timestamp: new Date(),
    };

    // Add user message immediately
    setChatMessages((prev) => {
      const next = [...prev, userMessage];
      saveConversation(next);
      return next;
    });
    setAiQuestion("");

    // Add loading message
    const loadingMessage = {
      type: "ai",
      message: "Thinking...",
      timestamp: new Date(),
      isLoading: true,
    };
    setChatMessages((prev) => {
      const next = [...prev, loadingMessage];
      saveConversation(next);
      return next;
    });

    try {
      // Step 1: Check if question is relevant to the course
      const allCourseContent =
        courseData?.modules
          ?.flatMap(
            (module) =>
              module.lessons?.map((lesson) => ({
                moduleTitle: module.title,
                lessonTitle: lesson.title,
                content: lesson.content || "",
              })) || []
          )
          .map(
            (lesson) =>
              `Module: ${lesson.moduleTitle}\nLesson: ${lesson.lessonTitle}\nContent: ${lesson.content}`
          )
          .join("\n\n---\n\n") || "";

      const relevanceCheck = await apiClient.post("/api/course-agent", {
        action: "checkRelevance",
        question: userMessage.message,
        messages: chatMessages, // Include history
        courseContent: allCourseContent,
        lessonTitle: currentLesson?.title || "",
        context: `Course: ${courseData?.title || ""
          }, Level: ${courseData?.level || ""}, Topic: ${topic}. Module: ${courseData?.modules?.find((m) => m.id === activeLesson.moduleId)
            ?.title || ""
          }`,
      });

      if (!relevanceCheck.ok) {
        throw new Error("Failed to check question relevance");
      }

      const relevanceData = await relevanceCheck.json();

      if (!relevanceData.relevant) {
        // Question is not related to the course
        const courseTitle = courseData?.title || "this course";
        setChatMessages((prev) => {
          const withoutLoading = prev.filter((msg) => !msg.isLoading);
          const next = [
            ...withoutLoading,
            {
              type: "ai",
              message: `I'm here to help with this course on **${courseTitle}**. What would you like to know about it?`,
              timestamp: new Date(),
            },
          ];
          saveConversation(next);
          return next;
        });
        return;
      }

      // Step 2: Question is relevant, get the answer
      const response = await apiClient.post("/api/course-agent", {
        action: "answer",
        question: userMessage.message,
        messages: chatMessages, // Include history
        courseContent: allCourseContent,
        lessonTitle: currentLesson?.title || "",
        context: `Course: ${courseData?.title || ""
          }, Level: ${courseData?.level || ""}, Topic: ${topic}. Module: ${courseData?.modules?.find((m) => m.id === activeLesson.moduleId)
            ?.title || ""
          }`,
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      // Remove loading message and add real response (agent instructed to <=50 words)
      setChatMessages((prev) => {
        const withoutLoading = prev.filter((msg) => !msg.isLoading);
        const formattedHtml = renderContent(data.response || "");
        const next = [
          ...withoutLoading,
          {
            type: "ai",
            message: formattedHtml,
            html: true,
            timestamp: new Date(),
          },
        ];
        saveConversation(next);
        return next;
      });
    } catch (error) {

      // Remove loading message and add error response
      setChatMessages((prev) => {
        const withoutLoading = prev.filter((msg) => !msg.isLoading);
        const next = [
          ...withoutLoading,
          {
            type: "ai",
            message:
              "I'm sorry, I'm having trouble responding right now. Please try again later.",
            timestamp: new Date(),
          },
        ];
        saveConversation(next);
        return next;
      });
    }
  };

  // Interactive D3 visualizations removed. If needed later, replace with static
  // images or links to externally hosted diagrams.


  const renderContent = (content) => {
    if (!content) return "";
    
    // Normalize line endings to \n
    let html = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

    // First, escape any HTML that might be in the content
    const escapeHtml = (text) => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
      };
      // Don't escape if it's already part of our formatted output
      return text;
    };

    // Handle code blocks FIRST (before other replacements) - CRITICAL
    const codeBlocks = [];
    html = html.replace(/```(\w+)?\s*([\s\S]*?)```/g, (match, lang, code) => {
      // If the code block is explicitly marked as math or latex, render with KaTeX
      if (lang === "math" || lang === "latex" || lang === "tex") {
        try {
          const rendered = katex.renderToString(code.trim(), {
            displayMode: true,
            throwOnError: false,
            output: "html"
          });
          return `<div class="my-6 p-4 text-foreground overflow-x-auto font-sans">${rendered}</div>`;
        } catch (e) {
          return `<div class="my-4 p-4 bg-destructive/10 rounded-lg text-destructive">LaTeX Error: ${code.trim()}</div>`;
        }
      }
      
      const placeholder = `___CODEBLOCK_${codeBlocks.length}___`;
      const pureCode = code.trim();
      // UTF-8 safe base64 encoding
      const encodedCode = btoa(encodeURIComponent(pureCode).replace(/%([0-9A-F]{2})/g, 
        (match, p1) => String.fromCharCode('0x' + p1)));
        
      const highlightedCode = highlightToHtml(pureCode, lang || "javascript");
      codeBlocks.push(
        `<div class="relative group my-6">
           <div class="absolute right-3 top-3 z-10">
             <button class="copy-code-btn p-1.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-border shadow-sm hover:bg-white dark:hover:bg-slate-700 transition-colors" data-code="${encodedCode}" title="Copy code">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
             </button>
           </div>
           <pre class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg overflow-x-auto border border-border font-mono m-0"><code class="text-sm font-mono language-${lang || "plaintext"}">${highlightedCode}</code></pre>
         </div>`
      );
      return placeholder;
    });

    // Handle inline code
    const inlineCodes = [];
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      const placeholder = `___INLINECODE_${inlineCodes.length}___`;
      inlineCodes.push(
        `<code class="bg-muted px-2 py-0.5 rounded text-sm font-mono text-primary">${code}</code>`
      );
      return placeholder;
    });

    // Handle images - ![alt text](url)
    // Use a more robust pattern that handles URLs with parentheses and special characters
    html = html.replace(
      /!\[([^\]]*)\]\(([^)\s]+(?:\([^)]*\)[^)\s]*)*)\)/g,
      (match, alt, url) => {
        // Decode URL if it contains encoded characters
        const cleanUrl = url.trim();
        return `<div class="my-4 flex justify-center"><img src="${cleanUrl}" alt="${alt}" class="max-w-full h-auto rounded-lg shadow-md" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\"text-destructive p-4 bg-destructive/10 rounded-lg\\">Failed to load image: ${alt}</div>'" /></div>`;
      }
    );

    // Handle LaTeX with \\[ \\] delimiters (display mode)
    html = html.replace(
      /\\\[([\s\S]*?)\\\]/g,
      (match, equation) => {
        const trimmed = equation.trim();
        const wordCount = trimmed.split(/\s+/).length;
        const hasMathCommands = /\\(?:frac|sum|int|lim|alpha|beta|gamma|delta|pi|theta|phi|omega|sqrt|cdot|times|le|ge|approx|neq|pm|mp|infty|partial|left|right)/i.test(trimmed);
        
        // Sanitization: If it's mostly text (many spaces, few symbols), don't render as raw math
        if (wordCount > 3 && !hasMathCommands) {
          const plainText = trimmed.replace(/\\\$/g, '$');
          return `<div class="my-4 font-serif text-lg leading-relaxed">${plainText}</div>`;
        }
        try {
          const rendered = katex.renderToString(trimmed, {
            displayMode: true,
            throwOnError: false,
            output: 'html'
          });
          return `<div class="my-6 p-4 text-foreground overflow-x-auto font-sans">${rendered}</div>`;
        } catch (e) {
          return `<div class="my-4 p-4 bg-destructive/10 rounded-lg text-destructive">LaTeX Error: ${equation}</div>`;
        }
      }
    );

    // Handle LaTeX with \\( \\) delimiters (inline mode)
    html = html.replace(
      /\\\(([\s\S]*?)\\\)/g,
      (match, equation) => {
        const trimmed = equation.trim();
        const wordCount = trimmed.split(/\s+/).length;
        const hasMathCommands = /\\(?:frac|sum|int|lim|alpha|beta|gamma|delta|pi|theta|phi|omega|sqrt|cdot|times|le|ge|approx|neq|pm|mp|infty|partial|left|right)/i.test(trimmed);
        
        // Sanitization: If it's mostly text, don't render as math
        if (wordCount > 3 && !hasMathCommands) {
          const plainText = trimmed.replace(/\\\$/g, '$');
          return `<span>${plainText}</span>`;
        }
        try {
          const rendered = katex.renderToString(trimmed, {
            displayMode: false,
            throwOnError: false,
            output: 'html',
            strict: false
          });
          return `<span class="inline-block align-middle mx-1">${rendered}</span>`;
        } catch (e) {
          return `<span class="text-destructive text-xs">LaTeX Error: ${equation}</span>`;
        }
      }
    );

    // Handle equations - display mode $$...$$
    html = html.replace(
      /\$\$([\s\S]*?)\$\$/g,
      (match, equation) => {
        try {
          const rendered = katex.renderToString(equation.trim(), {
            displayMode: true,
            throwOnError: false,
            output: 'html'
          });
          return `<div class="my-6 p-4 text-foreground overflow-x-auto font-sans">${rendered}</div>`;
        } catch (e) {
          return `<div class="my-4 p-4 bg-destructive/10 rounded-lg text-destructive">LaTeX Error: ${equation}</div>`;
        }
      }
    );

    // Handle equations - inline mode $...$
    html = html.replace(
      /\$([^\$\n]+?)\$/g,
      (match, equation) => {
        // Skip if it looks like a price ($100 or $5.99)
        if (/^\d+(\.\d{2})?$/.test(equation.trim())) {
          return match;
        }
        try {
          const rendered = katex.renderToString(equation.trim(), {
            displayMode: false,
            throwOnError: false,
            output: 'html',
            strict: false
          });
          return `<span class="inline-block align-middle mx-1">${rendered}</span>`;
        } catch (e) {
          return `<span class="text-destructive text-xs">LaTeX Error: ${equation}</span>`;
        }
      }
    );

    // Remove Module and Lesson labels early and more aggressively
    html = html.replace(/^\s*#+ (?:Module|Lesson|Course|Topic):\s*.*$/gim, "");
    html = html.replace(/^\s*(?:Module|Lesson|Course|Topic):\s*.*$/gim, "");

    // Handle headers (removed main title as per user request)
    // EXTREME ROBUSTNESS: Allow optional leading whitespace and ensure we match even if line endings are weird
    html = html.replace(/^[ \t]*# (?!Module|Lesson|Course|Topic)(.*)$/gm, "");
    html = html.replace(
      /^[ \t]*## (.*$)/gm,
      '<h2 class="text-2xl lg:text-4xl font-bold font-serif text-foreground mb-4 mt-8">$1</h2>'
    );
    html = html.replace(
      /^[ \t]*### (.*$)/gm,
      '<h3 class="text-xl lg:text-3xl font-bold font-serif text-foreground/90 mb-3 mt-6">$1</h3>'
    );
    html = html.replace(
      /^[ \t]*#### (.*$)/gm,
      '<h4 class="text-lg lg:text-2xl font-bold font-serif text-foreground/90 mb-2 mt-4">$1</h4>'
    );

    // Handle blockquotes
    html = html.replace(
      /^> (.*$)/gm,
      '<blockquote class="border-l-4 border-primary pl-4 py-2 my-6 bg-secondary font-serif italic rounded-r text-foreground/80 lg:text-xl">$1</blockquote>'
    );

    // Handle bold - must come before italics
    html = html.replace(
      /\*\*([\s\S]+?)\*\*/g,
      '<strong class="font-bold font-serif text-foreground">$1</strong>'
    );
    html = html.replace(
      /<b>([\s\S]+?)<\/b>/g,
      '<b class="font-bold font-serif text-foreground">$1</b>'
    );

    // Handle italics
    html = html.replace(
      /\*([^\*\n\s][^\*\n]*?)\*/g,
      '<em class="italic font-serif text-foreground/90">$1</em>'
    );

    // Handle lists and paragraphs in a single pass to avoid mid-list resets
    const lines = html.split("\n");
    let processedHtml = [];
    let listStack = [];

    const closeList = () => {
      if (listStack.length > 0) {
        const type = listStack.pop();
        processedHtml.push(type === 'ol' ? '</ol>' : '</ul>');
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        // Check if next meaningful line is a list item to preserve state
        let nextMeaningfulLine = "";
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim()) {
            nextMeaningfulLine = lines[j].trim();
            break;
          }
        }
        const nextIsList = /^(\d+\.\s+|[-•*]\s+)/.test(nextMeaningfulLine);
        if (!nextIsList) {
          closeList();
        }
        processedHtml.push('<div class="h-2"></div>');
        continue;
      }

      // List regexes
      const olMatch = line.match(/^(\d+)\.\s+(.*)$/);
      const ulMatch = line.match(/^([-•*])\s+(.*)$/);

      if (olMatch) {
        if (listStack[listStack.length - 1] !== 'ol') {
          closeList();
          processedHtml.push('<ol class="list-decimal list-outside mb-6 space-y-4 font-serif text-[1.05rem] lg:text-xl text-foreground/80 ml-10">');
          listStack.push('ol');
        }
        processedHtml.push(`<li class="pl-3">${olMatch[2]}</li>`);
      } else if (ulMatch) {
        if (listStack[listStack.length - 1] !== 'ul') {
          closeList();
          processedHtml.push('<ul class="list-disc list-outside mb-6 space-y-3 font-serif text-[1.05rem] lg:text-xl text-foreground/80 ml-10">');
          listStack.push('ul');
        }
        processedHtml.push(`<li class="pl-3">${ulMatch[2]}</li>`);
      } else {
        // Not a list item prefix
        if (line.match(/^\s*[-*_]{3,}\s*$/)) {
          // Horizontal rule handling - clean it up before list/paragraph wrapping
          closeList();
          processedHtml.push('<hr class="my-8 border-t-2 border-primary/20 hidden" />');
        } else if (listStack.length > 0) {
          // Continuation of a list item
          processedHtml.push(`<div class="mt-2 mb-4 pl-3 opacity-90 font-serif text-[1.02rem] lg:text-lg leading-relaxed">${line}</div>`);
        } else if (line.startsWith('<h') || line.startsWith('<blockquote') || line.startsWith('<hr')) {
          // Structural HTML elements that don't need paragraph wrapping
          processedHtml.push(line);
        } else {
          // Regular paragraph or formatted text starting with <strong or <em or <code
          processedHtml.push(`<p class="mb-5 text-foreground/90 leading-relaxed font-serif text-[1.05rem] lg:text-xl lg:leading-loose">${line}</p>`);
        }
      }
    }
    closeList();
    html = processedHtml.join("\n");

    // Restore code blocks
    codeBlocks.forEach((block, i) => {
      html = html.replace(`___CODEBLOCK_${i}___`, block);
    });

    // Restore inline codes
    inlineCodes.forEach((code, i) => {
      html = html.replace(`___INLINECODE_${i}___`, code);
    });

    return html;
  };

  // Knowledge-check removed: lessons will no longer include an embedded quiz

  const getCurrentLesson = () => {
    if (!courseData || !courseData.modules) return null;

    const module = courseData.modules.find(
      (m) => m.id === activeLesson.moduleId
    );
    if (!module) return null;

    const lesson = module.lessons[activeLesson.lessonIndex];
    if (typeof lesson === "string") {
      return {
        title: lesson,
        content: "Content for this lesson is coming soon...",
      };
    }

    return lesson;
  };

  const totalLessons =
    courseData && courseData.modules
      ? courseData.modules.reduce(
        (acc, module) => acc + module.lessons.length,
        0
      )
      : 0;
  const completedCount = completedLessons.size;
  const progressPercentage =
    totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  const currentLesson = getCurrentLesson();

  const saveNotes = async (notesContent) => {
    if (!notesContent.trim()) return;

    try {
      setIsSavingNotes(true);

      const response = await apiClient.post("/api/notes", {
        itemId: `course_${courseData?._id}`,
        lessonId: `${activeLesson.moduleId}-${activeLesson.lessonIndex}`,
        content: notesContent,
        title: currentLesson?.title || "Lesson Notes",
      });

      if (!response.ok) {
        throw new Error("Failed to save notes");
      }

      const data = await response.json();

      toast.success("Notes saved");
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDownloadNotes = async () => {
    if (!notes || !notes.trim()) {
      toast.error("No notes to download");
      return;
    }

    const notesData = {
      title: currentLesson?.title || "Lesson Notes",
      content: notes,
      date: new Date().toLocaleDateString(),
      course: courseData.title,
      tags: ["Learning", courseData?.level || "General"],
    };

    toast.loading("Preparing your study notes PDF...", { id: "downloading-notes" });
    try {
      await downloadCourseAsPDF(notesData, "notes");
      toast.success("Notes downloaded successfully!", { id: "downloading-notes" });
    } catch (err) {
      console.error("PDF download error:", err);
      toast.error("Failed to generate PDF. Please try again.", { id: "downloading-notes" });
    }
  };

  // Auto-save notes when they change
  useEffect(() => {
    if (notes.trim() && courseData) {
      const timeoutId = setTimeout(() => {
        saveNotes(notes);
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [notes, courseData, activeLesson]);

  // Clean up old local storage entries to prevent storage bloat
  const cleanupLocalStorage = () => {
    try {
      const keys = Object.keys(localStorage);
      const lessonKeys = keys.filter((key) => key.startsWith("lesson_"));

      // Keep only the most recent 50 lesson entries
      if (lessonKeys.length > 50) {
        // Sort by when they were last accessed (we'll use a simple approach)
        const sortedKeys = lessonKeys.sort((a, b) => {
          // For now, just remove oldest ones. In a more sophisticated approach,
          // we could track access times, but this is sufficient for now.
          return Math.random() - 0.5; // Random order for cleanup
        });

        const keysToRemove = sortedKeys.slice(50);
        keysToRemove.forEach((key) => {
          localStorage.removeItem(key);
        });


      }
    } catch (error) {
      console.warn("Failed to cleanup localStorage:", error);
    }
  };

  // Fetch course data on component mount
  const courseKey = `${actualTopic}/${format}/${difficulty}`;

  // Clear initialized set when topic/format/difficulty changes
  useEffect(() => {
    initializedCoursesRef.current.clear();
  }, [courseKey]);

  let globalSafetyTimeout = null;

  const fetchCourseData = useCallback(async (silent = false) => {
    const shareId = searchParams.get("shareId") || params.shareId;

    // Guard against empty topic ONLY if NOT using a shareId
    if (!actualTopic && !shareId) {
      console.warn("No topic or shareId provided, skipping fetch.");
      setIsLoading(false);
      fetchInProgressRef.current = false;
      return;
    }

    // Prevent multiple simultaneous calls (guards StrictMode double-effect)
    if (fetchInProgressRef.current) {
      console.warn("Fetch already in progress, skipping...");
      return;
    }

    fetchInProgressRef.current = true;
    if (!silent || !courseData) {
      setIsLoading(true);
    }

    // Reset error state
    setError(null);

    if (!loading && !user && shareId) {
      if (typeof window !== "undefined") {
        const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);
        fetchInProgressRef.current = false;
        setIsLoading(false);
        router.push(`/auth/login?callbackUrl=${callbackUrl}`);
      }
      return;
    }

    // First, try to get from library (saves tokens!) or shared link
    try {
      let existingCourse = null;

      // 1. ALWAYS check library as primary source (even if shareId is present)
      const libraryResponse = await apiClient.get("/api/library", {
        headers: {
          "x-user-id": user?._id || user?.id || user?.idString || "",
        },
      });

      if (libraryResponse.ok) {
        const libraryData = await libraryResponse.json();
        
        // Search by shareId first if provided
        if (shareId) {
          existingCourse = libraryData.items?.find((c) => {
            const id = (c.id || "").replace(/^(course|guide|cards)_/, "");
            return id === shareId || c.shareId === shareId || c.originalShareId === shareId;
          });
        }

        // Fallback to searching by topic/format/difficulty if not found by shareId
        if (!existingCourse && actualTopic) {
          existingCourse = libraryData.items?.find((c) => {
            if (c.type !== "course") return false;
            const matchesTopic =
              c.topic?.toLowerCase() === actualTopic.toLowerCase() ||
              c.originalTopic?.toLowerCase() === actualTopic.toLowerCase() ||
              c.courseData?.topic?.toLowerCase() === actualTopic.toLowerCase();
            const matchesDifficulty =
              c.difficulty?.toLowerCase() === difficulty.toLowerCase() ||
              c.level?.toLowerCase() === difficulty.toLowerCase() ||
              c.courseData?.difficulty?.toLowerCase() ===
              difficulty.toLowerCase() ||
              c.courseData?.level?.toLowerCase() === difficulty.toLowerCase();

            return matchesTopic && matchesDifficulty;
          });
        }
      }

      // 2. If not in library and we have a shareId, try to enroll
      if (!existingCourse && shareId && user) {
        console.log("Course not in library, attempting shared enrollment:", shareId);

        // Enroll (backend handles if already enrolled)
        const enrollRes = await apiClient.post("/api/library/share", { action: "enroll", shareId });
        
        if (!enrollRes.ok) {
          const errorData = await enrollRes.json().catch(() => ({}));
          if (enrollRes.status === 403 && errorData.isDisabled) {
            setError({ message: errorData.error, type: "disabled" });
            setIsLoading(false);
            fetchInProgressRef.current = false;
            return;
          }
          throw new Error(errorData.error || "Failed to fetch shared course");
        }
        
        const enrollData = await enrollRes.json();
        console.log("Enrollment success, courseId:", enrollData.courseId);

        // Refresh library to get the newly enrolled course data
        const refreshResponse = await apiClient.get("/api/library", {
          headers: {
            "x-user-id": user?._id || user?.id || user?.idString || "",
          },
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          existingCourse = refreshData.items?.find((c) => {
            const id = (c.id || "").replace(/^(course|guide|cards)_/, "");
            return id === String(enrollData.courseId) || c.shareId === shareId || c.originalShareId === shareId;
          });
          
          if (existingCourse && enrollData.sharerName) {
            existingCourse.sharerName = enrollData.sharerName;
          }
        }
      }

      // If we found a summary item in the library list, fetch the FULL course data
      if (existingCourse &&
        !(existingCourse.modules && existingCourse.modules.length > 0) &&
        !(existingCourse.courseData?.modules && existingCourse.courseData.modules.length > 0)
      ) {
        console.log("Fetching full course details for:", existingCourse.id);
        const fullId = (existingCourse.id || "").replace(/^(course|guide|cards)_/, "");
        if (fullId) {
          const fullResponse = await apiClient.get(`/api/library?id=${fullId}`);
          if (fullResponse.ok) {
            const fullData = await fullResponse.json();
            if (fullData.success && fullData.item) {
              existingCourse = fullData.item;
            }
          }
        }
      }

      if (
        existingCourse &&
        ((existingCourse.modules && existingCourse.modules.length > 0) ||
          (existingCourse.courseData?.modules &&
            existingCourse.courseData.modules.length > 0))
      ) {
        // Course exists - use it!
        console.log(
          "✅ Found course:",
          existingCourse.title || existingCourse.courseData?.title
        );

        // Extract course data from the correct location
        const courseData = existingCourse.courseData || existingCourse;

        // SYNC LOCK: If we recently toggled share locally, don't let stale server
        // shareConfigs overwrite our optimistic state (MongoDB eventual consistency)
        const isRecentlyUpdated = (Date.now() - lastShareUpdateRef.current) < 5000;

        setCourseData(prev => {
          const courseDataWithProgress = {
            ...courseData,
            // Preserve sharing metadata if present
            isShared: isRecentlyUpdated ? prev?.isShared : (existingCourse.isShared || courseData.isShared),
            shareId: existingCourse.shareId || courseData.shareId,
            sharerTier: existingCourse.sharerTier || courseData.sharerTier,
            sharerName: existingCourse.sharerName || courseData.sharerName,
            // Merge shareConfigs carefully if recently updated
            shareConfigs: isRecentlyUpdated ? prev?.shareConfigs : (courseData.shareConfigs || [])
          };

          if (isRecentlyUpdated && prev) {
            return {
              ...courseDataWithProgress,
              shareConfigs: prev.shareConfigs,
              isShared: prev.isShared,
              shareId: prev.shareId
            };
          }
          return courseDataWithProgress;
        });

        // Restore completed lessons from database/library first
        const completedLessonsFromDB = new Set();
        if (courseData.modules) {
          courseData.modules.forEach((module) => {
            if (module.lessons) {
              module.lessons.forEach((lesson, lessonIndex) => {
                if (lesson.completed) {
                  const lessonId = lesson.id || `${module.id}-${lessonIndex}`;
                  completedLessonsFromDB.add(lessonId);
                }
              });
            }
          });
        }

        // Then check user profile for matching course progress (Per-user progress storage)
        const userCourseItem = user?.courses?.find(c => String(c.courseId) === String(courseData._id));
        if (userCourseItem?.completedLessons) {
          userCourseItem.completedLessons.forEach(lId => completedLessonsFromDB.add(lId));
        }

        // Then check localStorage for any additional progress
        const courseId =
          courseData._id || (shareId ? `shared_${shareId}` : `${actualTopic}-${format}-${difficulty}`);
        const progressStorageKey = `progress_${courseId}`;
        const savedProgress = localStorage.getItem(progressStorageKey);
        if (savedProgress) {
          try {
            const parsed = JSON.parse(savedProgress);
            // Merge DB and localStorage progress
            parsed.forEach((lessonId) => completedLessonsFromDB.add(lessonId));
          } catch (e) {
            console.warn("Failed to parse saved progress:", e);
          }
        }

        setCompletedLessons(completedLessonsFromDB);

        setIsLoading(false);
        // Notify other components that loading finished
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("actirova:loading-done"));
        }

        fetchInProgressRef.current = false;
        initializedCoursesRef.current.add(courseKey);
        clearTimeout(globalSafetyTimeout);
        return;
      }
    } catch (e) {
      console.error("Error checking course source:", e);
      // If the error is already structured with type, use it. Otherwise, default.
      setError(e.type ? e : { message: e.message, type: "general" });
      toast.error(`Failed to load course: ${e.message}`);
      setIsLoading(false);
      fetchInProgressRef.current = false;
      clearTimeout(globalSafetyTimeout);
      return;
    }

    // For flashcards, check the flashcards collection
    if (format === "flashcards") {
      try {
        const cardsResponse = await apiClient.get("/api/flashcards", {
          cache: "no-store",
        });

        if (cardsResponse.ok) {
          const cardsData = await cardsResponse.json();
          console.log("Flashcards data received:", cardsData);

          // Find existing flashcard set matching this topic and difficulty
          const existingCardSet = cardsData.find((cardSet) => {
            const matchesTopic =
              cardSet.topic?.toLowerCase() === actualTopic.toLowerCase() ||
              cardSet.originalTopic?.toLowerCase() ===
              actualTopic.toLowerCase();
            const matchesDifficulty =
              cardSet.difficulty?.toLowerCase() ===
              difficulty.toLowerCase() ||
              cardSet.level?.toLowerCase() === difficulty.toLowerCase();

            console.log("Checking card set:", cardSet.title, {
              matchesTopic,
              matchesDifficulty,
              cardTopic: cardSet.topic || cardSet.originalTopic,
              cardDifficulty: cardSet.difficulty || cardSet.level,
            });

            return matchesTopic && matchesDifficulty;
          });

          if (existingCardSet) {
            console.log(
              "✅ Loading existing questions:",
              existingCardSet.title,
              "Cards:",
              existingCardSet.totalCards
            );
            setCourseData(existingCardSet);
            console.log(
              "✅ Found questions in library, setting isLoading to false"
            );
            setIsLoading(false);
            fetchInProgressRef.current = false;
            initializedCoursesRef.current.add(courseKey);
            return;
          } else {
            console.log("❌ Question set not found in cards collection");
          }
        }
      } catch (cardsError) {
        console.log("Cards check error:", cardsError);
      }
    }

    // Handle existing quiz loading
    if (format === "quiz" && existingQuizId) {
      try {
        const quizResponse = await apiClient.get(`/api/quizzes/${existingQuizId}`);
        if (quizResponse.ok) {
          const quizData = await quizResponse.json();
          setCourseData(quizData);
          console.log("✅ Loaded existing quiz:", quizData.title);
          setIsLoading(false);
          fetchInProgressRef.current = false;
          initializedCoursesRef.current.add(courseKey);
          return;
        }
      } catch (quizError) {
        console.log("Error loading existing quiz:", quizError);
      }
    }

    if (!isPro && difficulty !== "beginner") {
      toast.error(
        "Intermediate and Advanced levels require Pro subscription. Redirecting to upgrade..."
      );
      router.push("/pricing");
      console.log(
        "✅ Free user trying non-beginner difficulty, setting isLoading to false and redirecting"
      );
      console.log("Setting isLoading to false (free user redirect)");
      setIsLoading(false);
      fetchInProgressRef.current = false;
      initializedCoursesRef.current.add(courseKey);
      return;
    }

    // Course not in library - generate new one
    if (!actualTopic) {
      console.error("Course not found in library and no topic provided for generation.");
      setError({ message: "Course not found. Please check your link or try searching for the topic.", type: "general" });
      setIsLoading(false);
      fetchInProgressRef.current = false;
      return;
    }

    let apiEndpoint;
    let requestBody;

    if (format === "quiz") {
      // Quiz generation uses the same endpoint but with different logic
      apiEndpoint = "/api/generate-course";
      requestBody = {
        topic: actualTopic,
        format: "quiz",
        difficulty: isPro ? difficulty : "beginner",
        questions: parseInt(searchParams.get("questions")) || 10,
      };
    } else if (format === "flashcards") {
      apiEndpoint = "/api/generate-flashcards";
      requestBody = {
        topic: actualTopic,
        format,
        difficulty: isPro ? difficulty : "beginner",
      };
    } else {
      // Course generation
      apiEndpoint = "/api/generate-course";
      requestBody =
        format === "guide"
          ? {
            topic: actualTopic,
            difficulty: (isPro ? difficulty : "beginner").toLowerCase(),
          }
          : {
            topic: actualTopic,
            format,
            difficulty: (isPro ? difficulty : "beginner").toLowerCase(),
          };
    }

    try {
      const response = await apiClient.post(apiEndpoint, requestBody);

      if (!response.ok) {
        if (response.status === 429) {
          const errorData = await response.json();
          setLimitModalData({
            used: errorData.used || 0,
            limit: errorData.limit || 2,
            isPremium: errorData.isPremium || false,
          });
          setShowLimitModal(true);
          setIsLoading(false);
          fetchInProgressRef.current = false;
          // Notify global listeners that loading is officially "done" (even if it's a limit error)
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("actirova:loading-done"));
          }
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate course");
      }

      const data = await response.json();

      // Extract course data - API can return in different formats
      let courseDataToSet;
      if (data.content) {
        courseDataToSet = data.content;
      } else if (data.modules) {
        // Data is at root level
        courseDataToSet = data;
      } else {
        // Fallback - use the whole data object
        courseDataToSet = data;
      }

      // Only validate modules for course format, not quiz
      if (format === "course") {
        const hasModules =
          (Array.isArray(courseDataToSet.modules) && courseDataToSet.modules.length > 0) ||
          (Array.isArray(courseDataToSet.topics) && courseDataToSet.topics.length > 0);

        if (!hasModules) {
          // Log for debugging but don't expose full data
          console.error("Course generation failed: Invalid structure");
          throw new Error(
            "Generated course structure is invalid. Please try again."
          );
        }
      } else if (format === "quiz") {
        // For quiz format, validate questions exist
        const hasQuestions =
          Array.isArray(courseDataToSet.questions) &&
          courseDataToSet.questions.length > 0;
        if (!hasQuestions) {
          throw new Error(
            "Generated quiz has no questions. Please try again."
          );
        }
      }

      // Add the courseId to the course data for lesson content saving
      if (data.courseId) {
        courseDataToSet._id = data.courseId;
      }
      setCourseData(courseDataToSet);
      setIsLoading(false); // Ensure loader disappears immediately when course data is set

      // Notify other components and check for lingering loaders (dev safeguard)
      if (typeof window !== "undefined") {
        // Dispatch event immediately and with a small delay to ensure listeners catch it
        window.dispatchEvent(new CustomEvent("Actirova:loading-done"));
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("Actirova:loading-done"));
        }, 50);
        setTimeout(() => {
          const leftovers = document.querySelectorAll(
            "[data-actirova-loader-overlay], [data-actirova-loader]"
          );
          if (leftovers.length) {
            console.warn("Detected leftover loaders after generation, removing...", leftovers.length);
            leftovers.forEach((n) => n.remove());
          }
        }, 1000);
      }

      // Persist generated course to library (no-op on server if already saved)
      try {
        const libRes = await apiClient.post("/api/library", {
          action: "add",
          course: {
            isGenerated: true,
            courseData: courseDataToSet,
            title: courseDataToSet.title,
            topic: courseDataToSet.topic || actualTopic,
            level: courseDataToSet.level || difficulty,
            format,
          },
        }, {
          headers: {
            "x-user-id": user?._id || user?.id || user?.idString || "",
          }
        });
        if (!libRes.ok) {
          console.warn("Failed to store course in library");
        }
      } catch (libErr) {
        console.warn("Error storing course in library:", libErr);
      }

      // Refresh user profile/usage so sidebar & upgrade reflect new quotas
      try {
        await fetchUser();
        // Also emit a lightweight event for any listeners
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("usageUpdated"));
        }
      } catch (e) {
        console.warn("Failed to refresh user usage after generation", e);
      }
      initializedCoursesRef.current.add(courseKey);
      console.log("Course data set successfully");
    } catch (err) {
      console.error("Error fetching course data:", err);
      setError({ message: err.message, type: "general" });
      toast.error(`Failed to load course: ${err.message}`);
    } finally {
      console.log("Finally block executed, setting isLoading to false");
      setIsLoading(false);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("Actirova:loading-done"));
        setTimeout(() => {
          const leftovers = document.querySelectorAll(
            "[data-actirova-loader-overlay], [data-actirova-loader]"
          );
          if (leftovers.length) {
            console.warn("Detected leftover loaders in finally block, removing...", leftovers.length);
            leftovers.forEach((n) => n.remove());
          }
        }, 1000);
      }
      fetchInProgressRef.current = false;
      if (globalSafetyTimeout) clearTimeout(globalSafetyTimeout);
    }

    // Safety timeout to ensure loading state is cleared
    globalSafetyTimeout = setTimeout(() => {
      if (fetchInProgressRef.current) {
        console.log("Safety timeout: forcing isLoading to false");
        setIsLoading(false);
        fetchInProgressRef.current = false;

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("Actirova:loading-done"));
          setTimeout(() => {
            const leftovers = document.querySelectorAll(
              "[data-Actirova-loader-overlay], [data-Actirova-loader]"
            );
            if (leftovers.length) {
              console.warn("Detected leftover loaders from safety timeout, removing...", leftovers.length);
              leftovers.forEach((n) => n.remove());
            }
          }, 1000);
        }
      }
    }, 30000); // 30 seconds timeout
  }, [actualTopic, format, difficulty, user?._id, user?.id, loading, searchParams.get("shareId"), searchParams.get("questions"), params.shareId, isPro, existingQuizId, router, courseData, fetchUser, courseKey]);

  const prevParamsRef = useRef({ actualTopic, format, difficulty, shareId: searchParams.get("shareId") || params.shareId });

  // Fetch course data on component mount
  useEffect(() => {
    const isTopicValid = actualTopic && actualTopic.trim().length > 0;
    const currentShareId = searchParams.get("shareId") || params.shareId;
    const isShareValid = currentShareId && currentShareId.trim().length > 0;

    if (!isTopicValid && !isShareValid) {
      if (!isShareValid) {
        setIsLoading(false);
      }
      return;
    }

    // Determine if we should show the loader
    const paramsChanged =
      prevParamsRef.current.actualTopic !== actualTopic ||
      prevParamsRef.current.format !== format ||
      prevParamsRef.current.difficulty !== difficulty ||
      prevParamsRef.current.shareId !== currentShareId;

    fetchCourseData(!paramsChanged);

    prevParamsRef.current = { actualTopic, format, difficulty, shareId: currentShareId };

    // Cleanup function
    return () => {
      fetchInProgressRef.current = false;
      if (globalSafetyTimeout) clearTimeout(globalSafetyTimeout);
    };
  }, [actualTopic, format, difficulty, user?._id || user?.id, loading, searchParams.get("shareId"), params.shareId]);

  useEffect(() => {
    if (!courseData) return;

    const modules = courseData.modules || courseData.courseData?.modules || [];
    let totalLessons = 0;
    let completedCount = 0;

    modules.forEach((module) => {
      if (module.lessons) {
        totalLessons += module.lessons.length;
        module.lessons.forEach((lesson, index) => {
          const lessonId = lesson.id || `${module.id}-${index}`;
          if (completedLessons.has(lessonId)) {
            completedCount++;
          }
        });
      }
    });

    const progressPercentage = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

    if (progressPercentage === 100 && completedCount > 0) {
      const achievement = {
        id: Date.now(),
        title: courseData.title,
        recipient: "Student Name",
        date: new Date().toLocaleDateString(),
        level: courseData.level,
        score: "95%",
        skills: ["TypeScript", "JavaScript", "Programming", "Problem Solving"],
        status: "completed",
        courseProgress: 100,
      };

      toast.success("🎉 Congratulations! You've completed the course!");
    }
  }, [completedLessons, courseData]);

  // Ensure loader disappears when course data is available
  useLayoutEffect(() => {
    if (courseData && isLoading) {
      setIsLoading(false);
    }
  }, [courseData, isLoading]);

  // MANDATORY: Conditional returns for Auth/Loading MUST come after ALL hooks
  if (loading) return <ActirovaLoader />;
  if (!user && !shareId) return null;

  // No knowledge-check parsing: nothing to do when content changes

  // Show loading state only if no course data yet and no limit modal
  if (isLoading && !courseData && !showLimitModal) {
    return (
      <ActirovaLoader
        text={
          format === "quiz"
            ? "Generating your test"
            : format === "guide"
              ? "Generating your questions"
              : "Generating your course"
        }
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        {error?.type === "disabled" ? (
          <>
            <div className="w-20 h-20 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-lime-600 dark:text-lime-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Share Link Inactive</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              {error.message || "This sharing link has been disabled by the owner. You can no longer access this course via this link."}
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-foreground">Error Loading Course</h2>
            <p className="text-muted-foreground mb-6">{error?.message || String(error)}</p>
          </>
        )}
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80"
          >
            Go to Library
          </Link>
        </div>
      </div>
    );
  }

  // Ensure courseData exists or we're showing a limit modal
  if (!courseData && !showLimitModal) {
    return (
      <div className="h-[calc(100vh-6rem)] flex flex-col bg-background overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">
              No course data available
            </p>
          </div>
        </div>
      </div>
    );
  }

  // For flashcards, render the Flashcards component
  if (format === "flashcards") {
    return <Flashcards cardData={courseData} />;
  }

  // For quiz format, render the quiz interface
  if (format === "quiz") {
    return (
      <QuizInterface
        quizData={courseData}
        topic={topic}
        existingQuizId={existingQuizId}
      />
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background font-serif overflow-hidden">
      {/* Permanent Navbar Header */}
      <div className="bg-card backdrop-blur-md border-b border-border p-3 sm:p-4 z-50 shadow-sm relative">
        <div className="flex items-center justify-between w-full px-2 sm:px-4 lg:px-6">
          {/* Left Group - Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-foreground text-background hover:opacity-90 transition-all font-bold shadow-lg"
            >
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs sm:text-sm rounded-lg border transition-all font-bold ${isSidebarOpen
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary"
                }`}
            >
              <Menu className="w-4 h-4" />
              <span className="hidden md:inline">Modules</span>
            </button>
          </div>

          {/* Right Group - Controls (Always visible for easy access) */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleShare}
              disabled={!courseData?._id || isSharingToggle}
              className={`p-1.5 sm:p-2 rounded-lg border transition-all ${isSharingToggle ? "opacity-50 cursor-not-allowed" : ""} ${
                isMyShareActive 
                  ? "bg-green-500/10 text-green-500 border-green-500/20 shadow-sm" 
                  : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary"
              }`}
              title={isSharingToggle ? "Updating share status..." : (isMyShareActive ? "Shared by me (Click to disable)" : (courseData?.isShared ? "Reshare course" : "Share course"))}
            >
              {isSharingToggle ? (
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Share2 className={`w-4 h-4 ${isMyShareActive ? "fill-green-500/10" : ""}`} />
              )}
            </button>
            <button
              onClick={handleDownloadLesson}
              className="p-1.5 sm:p-2 rounded-lg border bg-secondary/50 text-muted-foreground border-border hover:bg-secondary transition-all"
              title="Download Lesson PDF"
              disabled={!currentLesson?.content || lessonContentLoading}
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={async () => {
                if (!activeLesson || lessonContentLoading) return;
                const lessonId = currentLesson?.id || `${activeLesson.moduleId}-${activeLesson.lessonIndex}`;
                const isCurrentlyCompleted = completedLessons.has(lessonId);
                const action = isCurrentlyCompleted ? "incomplete" : "complete";
                toast.loading(`Marking lesson as ${action}...`, { id: "mark-complete" });

                try {
                  await toggleLessonCompletion(activeLesson.moduleId, activeLesson.lessonIndex);
                  toast.success(`Lesson marked as ${action}!`, { id: "mark-complete" });
                } catch (error) {
                  toast.error(`Error: ${error.message}`, { id: "mark-complete" });
                }
              }}
              className={`flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-all font-bold border ${completedLessons.has(currentLesson?.id || `${activeLesson.moduleId}-${activeLesson.lessonIndex}`)
                ? "bg-green-500/10 text-green-500 border-green-500/20"
                : "bg-primary/10 text-primary border-primary/20"
                }`}
              disabled={!currentLesson?.content || lessonContentLoading}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">
                {completedLessons.has(`${activeLesson.moduleId}-${activeLesson.lessonIndex}`)
                  ? "Done"
                  : "Complete"}
              </span>
            </button>
            <button
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              className={`flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg border transition-all font-bold ${isRightPanelOpen
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/50 text-muted-foreground border-border"
                }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">AI Tutor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Area below navbar */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Backdrops - moved outside to fix blur and hidden on large screens */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        {isRightPanelOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsRightPanelOpen(false)}
          />
        )}

        {/* Left Sidebar - Course Navigation */}
        <div
          className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } w-full lg:w-80 bg-card border-r border-border flex flex-col absolute z-40 transition-transform duration-300 max-w-[90vw] md:max-w-[400px] h-full overflow-y-auto hide-scrollbar shadow-xl`}
        >

          <div className="p-4 lg:p-6 border-b border-border">
            <div className="flex justify-between flex-wrap flex-col">
              <h2 className="font-bold text-lg text-foreground mb-1">
                {courseData.title}
              </h2>
              {courseData.sharerName && (
                <p className="text-[11px] text-primary font-medium italic mb-2">
                  Shared by {courseData.sharerName.split(' ')[0]}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {courseData.totalModules} modules • {courseData.totalLessons}{" "}
              lessons
            </p>
            <button
              onClick={() => {
                const isPro =
                  user &&
                  ((user.subscription &&
                    user.subscription.plan === "pro" &&
                    user.subscription.status === "active") ||
                    user.isPremium);
                if (!isPro) {
                  toast.error(
                    "PDF downloads are a Pro feature. Please upgrade."
                  );
                  router.push("/pricing");
                  return;
                }
                try {
                  downloadCourseAsPDF(courseData, format);
                  toast.success("PDF download started!");
                } catch (error) {
                  console.error("Error downloading PDF:", error);
                  toast.error("Failed to download PDF");
                }
              }}
              disabled={
                !(
                  user &&
                  ((user.subscription &&
                    user.subscription.plan === "pro" &&
                    user.subscription.status === "active") ||
                    user.isPremium)
                )
              }
              className={
                user &&
                  ((user.subscription &&
                    user.subscription.plan === "pro" &&
                    user.subscription.status === "active") ||
                    user.isPremium)
                  ? "w-full mb-4 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/20"
                  : "w-full mb-4 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium bg-secondary text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              }
            >
              <Download className="w-4 h-4" />
              <span>
                {user &&
                  ((user.subscription &&
                    user.subscription.plan === "pro" &&
                    user.subscription.status === "active") ||
                    user.isPremium)
                  ? `Download ${format === "flashcards" ? "Flashcards" : "Course"} as PDF`
                  : "Upgrade to Pro for PDF"}
              </span>
            </button>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center text-sm font-semibold">
                {Math.round(progressPercentage)}%
              </div>
              <span className="text-sm text-muted-foreground">
                Completed
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="flex-1">
            {Array.isArray(courseData.modules) &&
              courseData.modules.map((module, moduleIndex) => (
                <div
                  key={module?.id ?? moduleIndex}
                  className="border-b border-border last:border-b-0"
                >
                  <button
                    onClick={() => {
                      if (!isPro && moduleIndex >= FREE_READABLE_MODULES) {
                        toast.error("Upgrade to Pro to unlock all 20 modules.", {
                          action: {
                            label: "Upgrade",
                            onClick: () => router.push("/pricing"),
                          },
                        });
                        return;
                      }
                      toggleModule(module.id);
                    }}
                    className={`w-full p-4 flex items-center justify-between transition-colors ${
                      !isPro && moduleIndex >= FREE_READABLE_MODULES
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        !isPro && moduleIndex >= FREE_READABLE_MODULES
                          ? "bg-muted text-muted-foreground"
                          : "bg-green-500/10 text-green-600"
                      }`}>
                        {!isPro && moduleIndex >= FREE_READABLE_MODULES ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          moduleIndex + 1
                        )}
                      </div>
                      <span className={`text-sm font-medium text-left ${
                        !isPro && moduleIndex >= FREE_READABLE_MODULES
                          ? "text-muted-foreground"
                          : "text-foreground"
                      }`}>
                        {module.title}
                      </span>
                    </div>
                    {!isPro && moduleIndex >= FREE_READABLE_MODULES ? (
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                    ) : expandedModules.has(module.id) ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedModules.has(module.id) && (
                    <div className="bg-secondary/30">
                      {module.lessons.map((lesson, lessonIndex) => {
                        const lessonTitle =
                          typeof lesson === "string" ? lesson : lesson.title;
                        const lessonId =
                          (typeof lesson !== "string" && lesson.id) ||
                          `${module.id}-${lessonIndex}`;
                        const isCompleted = completedLessons.has(lessonId);
                        const isActive =
                          activeLesson.moduleId === module.id &&
                          activeLesson.lessonIndex === lessonIndex;
                        return (
                          <button
                            key={lessonIndex}
                            id={`sidebar-lesson-${module.id}-${lessonIndex}`}
                            onClick={() => selectLesson(module.id, lessonIndex)}
                            className={`w-full p-3 pl-12 flex items-center justify-between hover:bg-secondary/20 transition-colors ${isActive
                              ? "bg-primary/5 border-r-2 border-primary"
                              : ""
                              }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${isCompleted
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "border-border text-muted-foreground"
                                  }`}
                              >
                                {isCompleted ? "✓" : lessonIndex + 1}
                              </div>
                              <span
                                className={`text-sm text-left flex-1 ${isActive
                                  ? "text-primary font-medium"
                                  : "text-foreground/80"
                                  }`}
                              >
                                {lessonTitle}
                              </span>
                              {generatingLessons.has(lessonId) && (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 ml-2"></div>
                              )}
                            </div>
                            {!isCompleted && !generatingLessons.has(lessonId) && (
                              <Play className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
          </div>

          {/* Free user upgrade CTA at the bottom of the sidebar */}
          {!isPro && (
            <div className="p-4 border-t border-border bg-gradient-to-r from-primary/5 to-green-500/5">
              <div className="flex items-center space-x-2 mb-2">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">
                  {courseData.totalModules - FREE_READABLE_MODULES} modules locked
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                You can read modules 1–3 for free. Upgrade to Pro to unlock all 20 modules.
              </p>
              <button
                onClick={() => router.push("/pricing")}
                className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto hide-scrollbar bg-background cursor-pointer lg:cursor-default"
          >
            <div className={`mx-auto p-4 sm:p-6 lg:p-8 transition-all duration-300 ${isRightPanelOpen && isSidebarOpen ? "max-w-4xl" : "max-w-5xl"}`}>
              {generatingLessons.has(`${activeLesson.moduleId}-${activeLesson.lessonIndex}`) ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Generating lesson content...
                  </h3>
                  <p className="text-muted-foreground">
                    Please wait while we create personalized content for you
                  </p>
                </div>
              ) : currentLesson?.content ? (
                <div>
                  <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none">
                    {/* Visualizations removed: use images or links in content */}
                    <div className="space-y-6" id="lesson-content-container">
                      {parseContentIntoBlocks(currentLesson.content).map((block, idx) => {
                        if (block.type === "chart") {
                          return (
                            <div key={idx} id={`visual-chart-${idx}`} className="visual-block-wrapper">
                              <LessonChart type={block.chartType} data={block.data} title={block.title} />
                            </div>
                          );
                        }
                        if (block.type === "table") {
                          return (
                            <div key={idx} id={`visual-table-${idx}`} className="visual-block-wrapper">
                              <LessonTable headers={block.headers} rows={block.rows} title={block.title} />
                            </div>
                          );
                        }
                        return (
                          <div
                            key={idx}
                            dangerouslySetInnerHTML={{
                              __html: renderContent(
                                block.type === "code" 
                                  ? `\`\`\`${block.lang}\n${block.content}\n\`\`\``
                                  : block.content
                              ),
                            }}
                          />
                        );
                      })}
                    </div>
                    
                    {/* Next Lesson Navigation Button */}
                    <div className="mt-12 pt-8 border-t border-border flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Lesson {activeLesson.lessonIndex + 1} of {
                          courseData.modules.find(m => m.id === activeLesson.moduleId)?.lessons.length || 0
                        }
                      </div>
                      <button
                        onClick={() => {
                          // Mark current as complete if not already
                          const lessonId = currentLesson?.id || `${activeLesson.moduleId}-${activeLesson.lessonIndex}`;
                          if (!completedLessons.has(lessonId)) {
                             toggleLessonCompletion(activeLesson.moduleId, activeLesson.lessonIndex);
                          }
                          goToNextLesson();
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                      >
                        <span>Next Lesson</span>
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>


                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Select a lesson to start learning
                  </h3>
                  <p className="text-muted-foreground">
                    Choose a lesson from the sidebar to begin
                  </p>
                </div>
              )}
            </div>
            {/* Mobile controls removed as requested */}
          </div>
        </div>

        {/* Right Panel - Notes & AI Tutor */}
        <div
          className={`${isRightPanelOpen ? "translate-x-0" : "translate-x-full"
            } w-full lg:w-80 xl:w-96 bg-card border-l border-border flex flex-col absolute z-40 transition-transform duration-300 max-w-[100vw] md:max-w-[400px] right-0 h-full shadow-xl`}
        >
          <div className="border-b border-border relative">
            <div className="flex">
              <button
                onClick={() => setActiveRightPanel("notes")}
                className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${activeRightPanel === "notes"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                Notes
              </button>
              <button
                onClick={() => setActiveRightPanel("chat")}
                className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${activeRightPanel === "chat"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                AI Tutor
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            {activeRightPanel === "notes" ? (
              <div className="h-full flex flex-col">
                <div className="p-3 sm:p-4 border-b border-border">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">
                    My Notes
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Take notes while learning
                  </p>
                </div>
                <div className="flex-1 p-3 sm:p-4">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write your notes here..."
                    className="w-full h-full resize-none overflow-y-auto hide-scrollbar bg-transparent text-sm sm:text-base text-foreground placeholder-muted-foreground focus:outline-none"
                    dir="ltr"
                  />
                  {isSavingNotes && (
                    <div className="text-xs text-muted-foreground mt-2 animate-pulse">
                      Saving...
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-border">
                  <button
                    onClick={() => {
                      if (!isPro) {
                        toast.error("Notes PDF export is a Pro feature. Please upgrade.");
                        router.push("/pricing");
                        return;
                      }
                      handleDownloadNotes();
                    }}
                    disabled={!notes.trim() || !isPro}
                    className={`w-full flex items-center justify-center space-x-2 py-3 px-4 text-sm rounded-xl font-bold transition-all ${isPro
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02]"
                      : "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed"
                      }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>{isPro ? "Download Notes" : "Pro: PDF Export"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col bg-muted/30 dark:bg-background relative overflow-hidden">
                {/* Chat Background Pattern */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")` }} />

                <div className="p-4 border-b border-border bg-card/90 backdrop-blur-md z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Bot className="w-6 h-6 text-primary" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">
                        AI Tutor
                      </h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">AI Assistant</p>
                    </div>
                  </div>
                </div>

                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 z-10"
                >
                  {chatMessages.map((message, index) => {
                    const isUser = message.type === "user";
                    const time = message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

                    return (
                      <div key={index} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm border ${isUser
                          ? "bg-primary text-primary-foreground border-primary shadow-primary/20 rounded-tr-none"
                          : "bg-card text-foreground border-border rounded-tl-none"
                          }`}>
                          {!isUser && (
                            <div className="flex items-center space-x-2 mb-1.5 opacity-70">
                              <Bot className="w-4 h-4 text-primary" />
                              <span className="text-[10px] font-black uppercase tracking-wider">AI Assistant</span>
                            </div>
                          )}
                          <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed" dangerouslySetInnerHTML={{ __html: renderContent(message.message) }} />
                          <div className="text-[10px] mt-2 flex justify-end items-center space-x-1 opacity-50">
                            <span>{time}</span>
                            {isUser && <CheckCircle size={10} className="text-primary-foreground" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-card/80 backdrop-blur-md border-t border-border z-10">
                  <div className="flex items-end space-x-2">
                    <div className="flex-1 bg-secondary/50 rounded-2xl border border-border focus-within:border-primary transition-all p-1">
                      <textarea
                        value={aiQuestion}
                        onChange={(e) => {
                          setAiQuestion(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                        placeholder="Ask anything..."
                        className="w-full px-3 py-2 bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none resize-none max-h-[120px]"
                        rows={1}
                      />
                    </div>
                    <button
                      onClick={sendAiQuestion}
                      disabled={!aiQuestion.trim()}
                      className={`p-4 rounded-full transition-all ${aiQuestion.trim() ? "bg-primary text-primary-foreground shadow-lg hover:rotate-12" : "bg-muted text-muted-foreground opacity-50"}`}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Limit Reached Modal */}
      {showLimitModal && limitModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-lime-100 dark:bg-lime-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-lime-600 dark:text-lime-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Monthly Limit Reached
              </h2>
              <p className="text-muted-foreground mb-4">
                You've used {limitModalData.used} of {limitModalData.limit} free{" "}
                {format === "flashcards" ? "flashcard sets" : "courses"} this
                month.
              </p>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Upgrade to Pro for unlimited{" "}
                  {format === "flashcards" ? "flashcards" : "courses"} and
                  premium features!
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLimitModal(false);
                    setLimitModalData(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowLimitModal(false);
                    setLimitModalData(null);
                    router.push("/pricing");
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
