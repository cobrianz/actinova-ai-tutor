"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import Link from "next/link";

import {
  Send,
  Bot,
  FileText,
  MessageCircle,
  Download,
  X,
  CheckCircle,
  Lock,
  HelpCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

import { toast } from "sonner";
import { parseContentIntoBlocks } from "@/lib/contentBlocks";
import { renderContent, renderLessonBlocks } from "@/lib/contentRenderer";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
// D3 visualizations removed per policy: no interactive D3 visuals
import ActirovaLoader from "./ActirovaLoader";
import Flashcards from "./Flashcards";
import QuizInterface from "./QuizInterface";
import CourseToolbar from "./CourseToolbar";
import CourseSidebar from "./CourseSidebar";
import LessonContentPanel from "./LessonContentPanel";
import MobileBottomNav from "./MobileBottomNav";
import LimitModal from "./LimitModal";
import { apiClient } from "@/lib/csrfClient";
import { PRODUCTS } from "@/lib/planLimits";
import LessonChart from "./LessonChart";
import LessonTable from "./LessonTable";
import CourseNotes from "./CourseNotes";
import html2canvas from "html2canvas";

export default function LearnContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refreshToken, fetchUser, loading, hasPurchased } = useAuth();

  const shareId = searchParams.get("shareId") || params.shareId;
  // Retrieve topic from either path params or query params
  const topicParam = params.topic || searchParams.get("topic") || "";
  const topic = decodeURIComponent(topicParam);
  const originalTopic = searchParams.get("originalTopic");
  const format = searchParams.get("format") || "course";
  const difficulty = searchParams.get("difficulty") || "beginner";
  const existingQuizId = searchParams.get("existing");
  const premiumRequested = searchParams.get("premiumRequested") === "true";
  const forceRegenerate = searchParams.get("forceRegenerate") === "true";
  const marketplaceCourseId = searchParams.get("marketplaceCourseId");
  // Use original topic if provided, otherwise use the URL topic
  const actualTopic = originalTopic ? decodeURIComponent(originalTopic) : topic;
  const [activeView, setActiveView] = useState("outline");
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const completedLessonsRef = useRef(new Set());
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
  const mobileSidebarHintedCoursesRef = useRef(new Set());
  const contentRef = useRef(null);
  const lastWidthRef = useRef(typeof window !== "undefined" ? window.innerWidth : 0);
  const chatContainerRef = useRef(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalData, setLimitModalData] = useState(null);

  useEffect(() => {
    completedLessonsRef.current = completedLessons;
  }, [completedLessons]);


  const [currentNotes, setCurrentNotes] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [lessonQuestions, setLessonQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showQuestionResults, setShowQuestionResults] = useState(false);
  const [typingLessonKey, setTypingLessonKey] = useState(null);
  const hasCourseAccess = hasPurchased('course_generation');
  // Format product lookup for credit/access checks
  const formatProductMap = {
    course: 'course_generation',
    report: 'report_generation',
    flashcards: 'flashcard_generation',
    quiz: 'exam_generation',
  };
  const formatProductId = formatProductMap[format] || 'course_generation';
  const formatProduct = PRODUCTS.find(p => p.id === formatProductId);



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
      // Removed automatic selectLesson(activeLesson.moduleId, activeLesson.lessonIndex)
      // to prevent Lesson 1 from auto-generating content.
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
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState(new Set());

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

  useEffect(() => {
    if (
      !courseData?._id ||
      typeof window === "undefined" ||
      window.innerWidth >= 768 ||
      mobileSidebarHintedCoursesRef.current.has(String(courseData._id))
    ) {
      return;
    }

    mobileSidebarHintedCoursesRef.current.add(String(courseData._id));
    setIsSidebarOpen(true);
  }, [courseData?._id]);

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
    const modules = courseData.modules || courseData.courseData?.modules || [];
    const currentModuleIndex = modules.findIndex(m => m.id === moduleId);
    if (currentModuleIndex === -1) return;

    const currentModule = modules[currentModuleIndex];
    if (!currentModule) return;
    const currentLessons = currentModule.lessons || [];
    
    // Check if there's another lesson in the current module
    if (lessonIndex + 1 < currentLessons.length) {
      selectLesson(moduleId, lessonIndex + 1);
    } 
    // Otherwise, try to go to the first lesson of the next module
    else if (currentModuleIndex + 1 < modules.length) {
      const nextModule = modules[currentModuleIndex + 1];
      
      toggleModule(nextModule.id); // Ensure it's expanded
      selectLesson(nextModule.id, 0);
    } else {
      toast.success("Congratulations! You've finished the course.");
    }
  };

  const selectLesson = async (moduleId, lessonIndex) => {
    setActiveLesson({ moduleId, lessonIndex });

    // Only auto-close sidebar on smaller screens
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }

    // Fetch lesson content if not already loaded
    const targetModule = courseData?.modules?.find((m) => m.id === moduleId);
    const lesson = targetModule?.lessons?.[lessonIndex];

    // Check local storage first
    const localStorageKey = `lesson_${actualTopic}_${difficulty}_${moduleId}_${lessonIndex}`;
    const cachedContent = localStorage.getItem(localStorageKey);

    if (
      cachedContent &&
      cachedContent.trim() !== "" &&
      cachedContent.trim() !== "Content for this lesson is coming soon..."
    ) {
      // Update course data with cached content immutably and mark as complete
      setCourseData((prevData) => {
        if (!prevData) return prevData;
        const newModules = (prevData.modules || []).map((m) => {
          if (m.id === moduleId) {
            const newLessons = (m.lessons || []).map((l, idx) => {
              if (idx === lessonIndex) {
                return typeof l === "string" 
                  ? { title: l, content: cachedContent, completed: true }
                  : { ...l, content: cachedContent, completed: true };
              }
              return l;
            });
            return { ...m, lessons: newLessons };
          }
          return m;
        });
        return { ...prevData, modules: newModules };
      });

      // Synchronize local completion set using a consistent ID
      const lessonId = (typeof lesson === "object" && lesson?.id) || `${moduleId}-${lessonIndex}`;
      setCompletedLessons((prev) => {
        const next = new Set(prev);
        if (!next.has(lessonId)) {
          next.add(lessonId);
          try {
            localStorage.setItem(progressKey(), JSON.stringify(Array.from(next)));
          } catch (_) {}
        }
        return next;
      });
      return;
    }

    // Check if lesson content already exists in course data
    const hasExistingContent =
      lesson &&
      lesson.content &&
      lesson.content.trim() !== "" &&
      !lesson.content.includes("coming soon") &&
      lesson.content !== "Content will be generated when you start the lesson.";

    if (hasExistingContent) {
      // Mark lesson as completed since content exists
      const lessonId = (typeof lesson === "object" && lesson?.id) || `${moduleId}-${lessonIndex}`;
      setCompletedLessons((prev) => {
        const next = new Set(prev);
        if (!next.has(lessonId)) {
          next.add(lessonId);
          try {
            localStorage.setItem(progressKey(), JSON.stringify(Array.from(next)));
          } catch (_) {}
        }
        return next;
      });
    } else if (lesson) {
      // Only fetch if content doesn't exist or is empty
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
      setTypingLessonKey(lessonKey);

      const parseSseStream = async (response, { onChunk }) => {
        const reader = response?.body?.getReader?.();
        if (!reader) throw new Error("Streaming not supported");

        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let fullText = "";

        const handleEvent = (evt, dataStr) => {
          if (!dataStr) return;
          if (evt === "chunk") {
            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed?.text || "";
              if (delta) {
                fullText += delta;
                onChunk?.(fullText, delta);
              }
            } catch (_) {
              // ignore malformed chunk
            }
            return;
          }

          if (evt === "error") {
            try {
              const parsed = JSON.parse(dataStr);
              const msg = parsed?.error || "stream_failed";
              throw new Error(msg);
            } catch (e) {
              throw e instanceof Error ? e : new Error("stream_failed");
            }
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE frames separated by blank line
          while (true) {
            let idx = buffer.indexOf("\n\n");
            let sepLen = 2;
            const idxCrlf = buffer.indexOf("\r\n\r\n");
            if (idxCrlf !== -1 && (idxCrlf < idx || idx === -1)) {
              idx = idxCrlf;
              sepLen = 4;
            }

            if (idx === -1) break;

            const frame = buffer.slice(0, idx);
            buffer = buffer.slice(idx + sepLen);

            if (!frame.trim()) continue;
            if (frame.startsWith(":")) continue; // ping/comments

            let eventName = "message";
            const dataLines = [];
            frame.split(/\r?\n/).forEach((line) => {
              if (line.startsWith("event:")) {
                eventName = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                dataLines.push(line.slice(5).trimStart());
              }
            });

            const dataStr = dataLines.join("\n");
            handleEvent(eventName, dataStr);
          }
        }

        return { content: fullText };
      };

      let data = null;
      try {
        const response = await apiClient.post(
          "/api/course-agent",
          {
            action: "generateLesson",
            stream: true,
            courseId: courseData?._id || null,
            shareId: searchParams.get("shareId"),
            moduleId,
            lessonIndex,
            lessonTitle,
            moduleTitle,
            courseTopic: topic,
            difficulty,
          },
          { headers: { Accept: "text/event-stream", "Content-Type": "application/json" } }
        );

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || err.message || "Failed to generate lesson content");
        }

        // If server didn't return SSE (e.g. cached JSON), fallback to JSON parsing.
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("text/event-stream")) {
          const { content } = await parseSseStream(response, {
            onChunk: (fullSoFar) => {
              // Update "typing" content progressively.
              setTypingContent(fullSoFar);
            },
          });
          data = { content };
        } else {
          data = await response.json();
          if (data?.content) setTypingContent(data.content);
        }
      } catch (streamErr) {
        // Fallback to non-streaming mode if anything goes wrong.
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

        data = await response.json();
        if (data?.content) setTypingContent(data.content);
      }

      if (!data?.content) {
        throw new Error("Failed to generate lesson content");
      }

      // Update course data with the new content immutably
      setCourseData((prevData) => {
        if (!prevData) return prevData;
        const newModules = (prevData.modules || []).map((m) => {
          if (m.id === moduleId) {
            const newLessons = (m.lessons || []).map((l, idx) => {
              if (idx === lessonIndex) {
                return typeof l === "string"
                  ? { title: l, content: data.content, completed: true }
                  : { ...l, content: data.content, completed: true };
              }
              return l;
            });
            return { ...m, lessons: newLessons };
          }
          return m;
        });
        return { ...prevData, modules: newModules };
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
      const courseModules = courseData?.modules || courseData?.courseData?.modules || [];
      const currentModule = courseModules.find(m => m.id === moduleId);
      const lesson = currentModule?.lessons?.[lessonIndex];
      const lessonId = (lesson && typeof lesson !== "string" && lesson.id) || `${moduleId}-${lessonIndex}`;
      const courseId = courseData?._id ? String(courseData._id) : null;

      // Update local completion state using a consistent ID
      const finalLessonId = (lesson && typeof lesson !== "string" && lesson.id) || `${moduleId}-${lessonIndex}`;
      const nextCompletedSet = new Set(completedLessonsRef.current || completedLessons);
      nextCompletedSet.add(finalLessonId);
      setCompletedLessons(nextCompletedSet);
      // Persist to localStorage
      try {
        localStorage.setItem(progressKey(), JSON.stringify(Array.from(nextCompletedSet)));
      } catch (_) {}

      // Completion status is already handled in the previous setCourseData call

      // Persist completed flag to backend DB
      if (courseId) {
        try {
          const totalLessonsCnt = courseData?.totalLessons || 100;
          const progress = Math.round((nextCompletedSet.size / totalLessonsCnt) * 100);

          await apiClient.post("/api/course-progress", {
            courseId,
            progress,
            completed: progress >= 100,
            isLessonCompleted: true,
            lessonId,
            title: courseData?.title || courseData?.topic || null,
            userId: String(user?._id || user?.id || ""),
          });

          // Sync lesson completion to related study plans
          try {
            await apiClient.post("/api/study-plan/sync-from-course", {
              courseId,
              moduleId,
              lessonIndex,
              completed: true,
            });
          } catch (_) {}
        } catch (progressErr) {
          // Silent fail — don't block the user from reading content
          console.warn("Failed to auto-save lesson completion:", progressErr);
        }
      }

      // Show typing animation
      setTypingContent(data.content);
    } catch (error) {
      console.error("Lesson generation error:", error);
      toast.error("Generation took longer than expected. Please try refreshing in a few moments or try again.", {
        duration: 5000,
      });
      // Set a fallback message immutably
      setCourseData((prevData) => {
        if (!prevData) return prevData;
        const newModules = (prevData.modules || []).map((m) => {
          if (m.id === moduleId) {
            const newLessons = (m.lessons || []).map((l, idx) => {
              if (idx === lessonIndex) {
                const existingContent = (typeof l === "object" && l.content) ? l.content : "";
                return typeof l === "string"
                  ? { title: l, content: existingContent || "Taking a bit longer... If this persists, please refresh the page.", completed: false }
                  : { ...l, content: existingContent || "Taking a bit longer... If this persists, please refresh the page.", completed: false };
              }
              return l;
            });
            return { ...m, lessons: newLessons };
          }
          return m;
        });
        return { ...prevData, modules: newModules };
      });
    } finally {
      setGeneratingLessons((prev) => {
        const next = new Set(prev);
        next.delete(lessonKey);
        return next;
      });
      setLessonContentLoading(false);
      setTypingLessonKey((prev) => (prev === lessonKey ? null : prev));
    }
  };

  const toggleLessonCompletion = async (moduleId, lessonIndex) => {
    const courseModules = courseData?.modules || courseData?.courseData?.modules || [];
    const mod = courseModules.find(m => m.id === moduleId);
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

      // 1. Update lesson.completed on courseData in memory for instant UI feedback immutably
      setCourseData((prevData) => {
        if (!prevData) return prevData;
        const newModules = (prevData.modules || []).map((m) => {
          if (m.id === moduleId) {
            const newLessons = (m.lessons || []).map((l, idx) => {
              if (idx === lessonIndex) {
                return typeof l === "string"
                  ? { title: l, completed: isNowCompleted }
                  : { ...l, completed: isNowCompleted };
              }
              return l;
            });
            return { ...m, lessons: newLessons };
          }
          return m;
        });
        return { ...prevData, modules: newModules };
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
          title: courseData?.title || courseData?.topic || null,
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

        // Sync lesson completion to related study plans
        try {
          await apiClient.post("/api/study-plan/sync-from-course", {
            courseId,
            moduleId,
            lessonIndex,
            completed: isNowCompleted,
          });
        } catch (_) {}
      }
    } catch (err) {
      console.error("Progress save error:", err);
      toast.error("Failed to save progress to the cloud.");
    }
  };

  const handleDownloadLesson = async () => {
    if (!currentLesson?.content || lessonContentLoading) return;

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
      const { downloadCourseAsPDF } = await import("@/lib/pdfUtils");
      await downloadCourseAsPDF(lessonData, "notes", visuals);
      toast.success("Download started!", { id: toastId });
    } catch (error) {
      console.error("Lesson download error:", error);
      toast.error("Failed to download lesson PDF", { id: toastId });
    }
  };

  const handleMarkCurrentLesson = async () => {
    if (!activeLesson || !currentLesson?.content || lessonContentLoading) return;
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
  };

  const handleDownloadCourse = async () => {
    if (!courseData) return;

    try {
      const { downloadCourseAsPDF } = await import("@/lib/pdfUtils");
      await downloadCourseAsPDF(courseData, format);
      toast.success("Course PDF download started!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error(error?.message || "Failed to download course PDF");
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
          description: `Anyone with this link can now view this course (Full Access).`,
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

    if (!hasPurchased('course_generation')) {
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

      const response = await apiClient.post("/api/course-agent", {
        action: "answer",
        question: userMessage.message,
        messages: chatMessages,
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
        const next = [
          ...withoutLoading,
          {
            type: "ai",
            message: data.response || "",
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

  const generateQuestions = async () => {
    const currentLesson = getCurrentLesson();
    if (!currentLesson?.content) {
      toast.error("Lesson content not loaded yet");
      return;
    }

    setIsGeneratingQuestions(true);
    setGeneratedQuestions([]);
    setRevealedAnswers(new Set());

    try {
      const response = await apiClient.post("/api/course-agent", {
        action: "generateQuestions",
        lessonContent: currentLesson.content,
        lessonTitle: currentLesson.title,
        courseTopic: courseData?.title || topic,
      });

      if (!response.ok) {
        throw new Error("Failed to generate questions");
      }

      const data = await response.json();
      setGeneratedQuestions(data.questions || []);
      toast.success(`Generated ${data.questions?.length || 0} questions`);
    } catch (error) {
      console.error("Question generation error:", error);
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const toggleAnswer = (questionId) => {
    setRevealedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const generateFlashcardsFromLesson = async () => {
    const currentLesson = getCurrentLesson();
    if (!currentLesson?.content) {
      toast.error("Lesson content not loaded yet");
      return;
    }

    if (!hasPurchased('flashcard_generation')) {
      toast.error("Flashcard generation is a Pro feature. Please upgrade.");
      return;
    }

    setIsGeneratingQuestions(true);

    try {
      const response = await apiClient.post("/api/course-agent", {
        action: "generateFlashcards",
        lessonContent: currentLesson.content,
        lessonTitle: currentLesson.title,
        courseTopic: courseData?.title || topic,
        difficulty: courseData?.level || difficulty,
      });

      if (!response.ok) {
        throw new Error("Failed to generate flashcards");
      }

      const data = await response.json();
      toast.success(`Generated ${data.totalCards || 0} flashcards!`);
      
      // Navigate to flashcards tab in dashboard
      router.push("/dashboard?tab=flashcards");
    } catch (error) {
      console.error("Flashcard generation error:", error);
      toast.error("Failed to generate flashcards. Please try again.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Interactive D3 visualizations removed. If needed later, replace with static
  // images or links to externally hosted diagrams.



  // Knowledge-check removed: lessons will no longer include an embedded quiz

  const getCurrentLesson = () => {
    const modules = courseData?.modules || courseData?.courseData?.modules;
    if (!modules) return null;

    const currentModule = modules.find(
      (m) => m.id === activeLesson.moduleId
    );
    if (!currentModule) return null;
    if (!Array.isArray(currentModule.lessons)) return null;

    const lesson = currentModule.lessons[activeLesson.lessonIndex];
    if (typeof lesson === "string") {
      return {
        title: lesson,
        content: "Content for this lesson is coming soon...",
      };
    }

    return lesson;
  };

  const totalLessons =
    courseData && (courseData.modules || courseData.courseData?.modules)
      ? (courseData.modules || courseData.courseData?.modules).reduce(
        (acc, module) => acc + (module.lessons?.length || 0),
        0
      )
      : 0;
  const completedCount = completedLessons.size;
  const progressPercentage =
    totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  const currentLesson = getCurrentLesson();
  const currentLessonId =
    currentLesson?.id || `${activeLesson.moduleId}-${activeLesson.lessonIndex}`;
  const isCurrentLessonCompleted = completedLessons.has(currentLessonId);
  const canDownloadCoursePdf = Boolean(courseData);
  const canDownloadLessonPdf = Boolean(
    currentLesson?.content &&
      currentLesson.content !== "Content for this lesson is coming soon..." &&
      !lessonContentLoading
  );

  const courseLessons = (courseData?.modules || courseData?.courseData?.modules || []).flatMap((mod) =>
    (mod.lessons || []).map((lesson, idx) => ({
      id: (typeof lesson === "object" && lesson?.id) || `${mod.id}-${idx}`,
      title: typeof lesson === "string" ? lesson : lesson.title,
      moduleTitle: mod.title,
    }))
  );

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
      course: courseData?.title || "Untitled Course",
      tags: ["Learning", courseData?.level || "General"],
    };

    toast.loading("Preparing your study notes PDF...", { id: "downloading-notes" });
    try {
      const { downloadCourseAsPDF } = await import("@/lib/pdfUtils");
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

  // Reset questions when lesson changes
  useEffect(() => {
    setGeneratedQuestions([]);
    setRevealedAnswers(new Set());
  }, [activeLesson]);

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
      const libraryResponse = await apiClient.get("/api/library?limit=50", {
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
        if (!existingCourse && actualTopic && !forceRegenerate) {
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
        const refreshResponse = await apiClient.get("/api/library?limit=50", {
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

      if (existingCourse) {
        const existingCourseData = existingCourse.courseData || existingCourse;

        if (
          !existingCourseData.modules ||
          existingCourseData.modules.length === 0
        ) {
          setCourseData(existingCourseData);
          setIsLoading(false);
          fetchInProgressRef.current = false;
          initializedCoursesRef.current.add(courseKey);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("actirova:loading-done"));
          }
          clearTimeout(globalSafetyTimeout);
          return;
        }
        const existingPremiumExpiry = existingCourseData.premiumAccessExpiresAt
          ? new Date(existingCourseData.premiumAccessExpiresAt)
          : null;

        // Align "premium access" with the actual gating rules used elsewhere:
        // - Paid plan users (subscription) get premium without per-course expiry.
        // - Per-course unlock requires a future premiumAccessExpiresAt.
        const userHasActivePlan = Boolean(
          user &&
            user.subscription?.status === "active" &&
            (
              ["pro", "enterprise", "premium"].includes(
                String(user.subscription?.plan || "").toLowerCase()
              ) ||
              ["pro", "enterprise"].includes(
                String(user.subscription?.tier || "").toLowerCase()
              ) ||
              user.isPremium
            )
        );

        const hasLivePremiumAccess = Boolean(
          (userHasActivePlan && existingCourseData.isPremium) ||
            (existingPremiumExpiry && existingPremiumExpiry > new Date())
        );
        const shouldUpgradeExistingCourse =
          format === "course" && premiumRequested && !hasLivePremiumAccess;

        if (shouldUpgradeExistingCourse) {
          console.log(
            "Premium access requested for existing free course, continuing generation flow."
          );
        } else {
        // Course exists - use it!
        console.log(
          "✅ Found course:",
          existingCourse.title || existingCourse.courseData?.title
        );

        // Extract course data from the correct location
        const courseData = existingCourseData;

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
        if (Array.isArray(courseData.modules || courseData.courseData?.modules)) {
          (courseData.modules || courseData.courseData?.modules).forEach((module) => {
            if (module.lessons) {
              module.lessons.forEach((lesson, lessonIndex) => {
                if (lesson.completed || (lesson.content && lesson.content.length > 100)) {
                  const lessonId = lesson.id || `${module.id}-${lessonIndex}`;
                  completedLessonsFromDB.add(lessonId);
                }
              });
            }
          });
        }

        // Then merge user's saved progress from the API (fetched by library endpoint)
        if (Array.isArray(courseData._completedLessons)) {
          courseData._completedLessons.forEach(lId => completedLessonsFromDB.add(lId));
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

    if (!hasPurchased('course_generation') && difficulty !== "beginner") {
      toast.error(
        "Intermediate and Advanced levels require Pro subscription. Redirecting to upgrade..."
      );
      router.push("/dashboard");
      console.log(
        "✅ Free user trying non-beginner difficulty, setting isLoading to false and redirecting"
      );
      console.log("Setting isLoading to false (free user redirect)");
      setIsLoading(false);
      fetchInProgressRef.current = false;
      initializedCoursesRef.current.add(courseKey);
      return;
    }

    // Course not in library - check access before generating
    if (!hasPurchased(formatProductId) && !(user?.credits >= (formatProduct?.creditCost || 0))) {
      setShowLimitModal(true);
      setLimitModalData({ used: 0, limit: 2 });
      setIsLoading(false);
      fetchInProgressRef.current = false;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("actirova:loading-done"));
      }
      return;
    }

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
        difficulty,
        questions: parseInt(searchParams.get("questions")) || 10,
      };
    } else if (format === "flashcards") {
      apiEndpoint = "/api/generate-flashcards";
      requestBody = {
        topic: actualTopic,
        format,
        difficulty,
      };
    } else {
      // Course generation
      apiEndpoint = "/api/generate-course";
        requestBody =
          format === "guide"
            ? {
             topic: actualTopic,
              difficulty: difficulty.toLowerCase(),
            }
            : {
             topic: actualTopic,
              format,
              difficulty: difficulty.toLowerCase(),
             premiumRequested,
             forceRegenerate,
             marketplaceCourseId,
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
  }, [actualTopic, format, difficulty, user?._id, user?.id, loading, searchParams.get("shareId"), searchParams.get("questions"), params.shareId, hasCourseAccess, existingQuizId, router, courseData, fetchUser, courseKey]);

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

    // Find any lesson that has real content but isn't yet marked completed
    const contentLessonIds = new Set();
    modules.forEach((module) => {
      (module.lessons || []).forEach((lesson, index) => {
        const lessonId = lesson.id || `${module.id}-${index}`;
        if (
          lesson.content &&
          String(lesson.content).trim().length > 0 &&
          !String(lesson.content).toLowerCase().includes("coming soon")
        ) {
          contentLessonIds.add(lessonId);
        }
      });
    });

    const currentCompleted = new Set(completedLessons);
    let changed = false;
    contentLessonIds.forEach((id) => {
      if (!currentCompleted.has(id)) {
        currentCompleted.add(id);
        changed = true;
      }
    });

    if (changed) {
      setCompletedLessons(currentCompleted);
      return;
    }

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
      toast.success("Congratulations! You've completed the course!");
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
  const hasNoCreditsForGeneration = !hasPurchased(formatProductId) && !(user?.credits >= (formatProduct?.creditCost || 0));
  if (isLoading && !courseData && !showLimitModal && !hasNoCreditsForGeneration) {
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
      <CourseToolbar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isRightPanelOpen={isRightPanelOpen}
        setIsRightPanelOpen={setIsRightPanelOpen}
        isMyShareActive={isMyShareActive}
        isSharingToggle={isSharingToggle}
        canDownloadLessonPdf={canDownloadLessonPdf}
        isCurrentLessonCompleted={isCurrentLessonCompleted}
        currentLesson={currentLesson}
        lessonContentLoading={lessonContentLoading}
        handleShare={handleShare}
        handleDownloadLesson={handleDownloadLesson}
        handleMarkCurrentLesson={handleMarkCurrentLesson}
        courseData={courseData}
      />

      {/* Main Layout Area below navbar */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Backdrops - moved outside to fix blur and hidden on large screens */}
        {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
        )}
        {isRightPanelOpen && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] lg:hidden"
              onClick={() => setIsRightPanelOpen(false)}
            />
        )}

        <CourseSidebar
          isSidebarOpen={isSidebarOpen}
          courseData={courseData}

          expandedModules={expandedModules}
          toggleModule={toggleModule}
          activeLesson={activeLesson}
          selectLesson={selectLesson}
          completedLessons={completedLessons}
          generatingLessons={generatingLessons}
          progressPercentage={progressPercentage}
          canDownloadCoursePdf={canDownloadCoursePdf}
          handleDownloadCourse={handleDownloadCourse}
          isMyShareActive={isMyShareActive}
          isSharingToggle={isSharingToggle}
          handleShare={handleShare}
          format={format}
        />

        <LessonContentPanel
          contentRef={contentRef}
          isRightPanelOpen={isRightPanelOpen}
          isSidebarOpen={isSidebarOpen}
          activeLesson={activeLesson}
          generatingLessons={generatingLessons}
          typingLessonKey={typingLessonKey}
          typingContent={typingContent}
          currentLesson={currentLesson}
          completedLessons={completedLessons}
          toggleLessonCompletion={toggleLessonCompletion}
          goToNextLesson={goToNextLesson}
          courseData={courseData}
        />

        {/* Right Panel - Notes & AI Tutor */}
        <div
          className={`${isRightPanelOpen ? "translate-x-0" : "translate-x-full"
            } w-full lg:w-80 xl:w-96 bg-card border-l border-border flex flex-col absolute z-[80] transition-transform duration-300 max-w-[100vw] md:max-w-[400px] right-0 h-full shadow-xl pb-24 md:pb-0`}
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
                onClick={() => setActiveRightPanel("questions")}
                className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${activeRightPanel === "questions"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                Questions
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
              <CourseNotes
                courseId={courseData?._id}
                lessons={courseLessons}
              />
            ) : activeRightPanel === "questions" ? (
              <div className="h-full flex flex-col">
                <div className="p-3 sm:p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base text-foreground">
                        Practice Questions
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Test your understanding
                      </p>
                    </div>
                    {generatedQuestions.length > 0 && (
                      <button
                        onClick={generateQuestions}
                        disabled={isGeneratingQuestions}
                        className="text-xs text-primary hover:text-primary/80 font-medium"
                      >
                        Regenerate
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                  {isGeneratingQuestions ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground text-center">
                        Generating questions from this lesson...
                      </p>
                    </div>
                  ) : generatedQuestions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <HelpCircle className="w-8 h-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-semibold text-sm text-foreground mb-1">
                          Ready to test yourself?
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-[200px]">
                          Generate questions based on the current lesson content
                        </p>
                      </div>
                      <button
                        onClick={generateQuestions}
                        disabled={!currentLesson?.content}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          currentLesson?.content
                            ? "bg-primary text-primary-foreground hover:scale-[1.02] shadow-lg shadow-primary/20"
                            : "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed"
                        }`}
                      >
                        Generate Questions
                      </button>
                      <button
                        onClick={generateFlashcardsFromLesson}
                        disabled={!currentLesson?.content || !hasPurchased('flashcard_generation')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          currentLesson?.content && hasPurchased('flashcard_generation')
                            ? "bg-secondary text-foreground hover:scale-[1.02] border border-border"
                            : "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed"
                        }`}
                      >
                        Generate Flashcards
                      </button>
                    </div>
                  ) : (
                    generatedQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="bg-card border border-border rounded-xl overflow-hidden"
                      >
                        <div className="p-3 sm:p-4">
                          <div className="flex items-start gap-2 mb-2">
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              q.difficulty === "easy"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : q.difficulty === "hard"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}>
                              {q.difficulty}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground leading-relaxed">
                            {q.question}
                          </p>
                        </div>
                        <div className="border-t border-border">
                          <button
                            onClick={() => toggleAnswer(q.id)}
                            className="w-full px-3 sm:px-4 py-2.5 flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          >
                            <span>{revealedAnswers.has(q.id) ? "Hide Answer" : "Show Answer"}</span>
                            {revealedAnswers.has(q.id) ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {revealedAnswers.has(q.id) && (
                            <div className="px-3 sm:p-4 pt-0 pb-3 sm:pb-4">
                              <div className="bg-muted/50 rounded-lg p-3 mt-2">
                                <p
                                  className="text-sm text-foreground leading-relaxed"
                                  dangerouslySetInnerHTML={{
                                    __html: renderContent(q.answer)
                                  }}
                                />
                              </div>
                            </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      {generatedQuestions.length > 0 && (
                        <div className="pt-4 border-t border-border">
                          <button
                            onClick={generateFlashcardsFromLesson}
                            disabled={!hasPurchased('flashcard_generation')}
                            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                              hasPurchased('flashcard_generation')
                                ? "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                                : "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed"
                            }`}
                          >
                            Create Flashcards from This Lesson
                          </button>
                        </div>
                      )}
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
                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm border ${isUser
                          ? "bg-green-500 text-white border-green-500 rounded-tr-none"
                          : "bg-card text-foreground border-border rounded-tl-none"
                          }`}>
                          {!isUser && (
                            <div className="flex items-center space-x-2 mb-1.5 opacity-70">
                              <Bot className="w-4 h-4 text-primary" />
                              <span className="text-[10px] font-black uppercase tracking-wider">AI Assistant</span>
                            </div>
                          )}
                          <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed text-inherit" dangerouslySetInnerHTML={{ __html: message.html ? message.message : renderContent(message.message) }} />
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

      <MobileBottomNav
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isRightPanelOpen={isRightPanelOpen}
        setIsRightPanelOpen={setIsRightPanelOpen}
        currentLesson={currentLesson}
        lessonContentLoading={lessonContentLoading}
        isCurrentLessonCompleted={isCurrentLessonCompleted}
        handleMarkCurrentLesson={handleMarkCurrentLesson}
        handleDownloadLesson={handleDownloadLesson}
        canDownloadLessonPdf={canDownloadLessonPdf}
      />

      <LimitModal
        isOpen={showLimitModal}
        onClose={() => {
          setShowLimitModal(false);
          setLimitModalData(null);
        }}
      />
    </div>
  );
}
