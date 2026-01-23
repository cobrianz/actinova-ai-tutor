"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
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
} from "lucide-react";

import { toast } from "sonner";
import { downloadCourseAsPDF } from "@/lib/pdfUtils";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
// D3 visualizations removed per policy: no interactive D3 visuals
import ActinovaLoader from "./ActinovaLoader";
import Flashcards from "./Flashcards";
import QuizInterface from "./QuizInterface";

export default function LearnContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refreshToken, fetchUser, loading } = useAuth();

  if (loading) return <ActinovaLoader />;
  if (!user) return null;
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
  const [activeLesson, setActiveLesson] = useState({
    moduleId: 1,
    lessonIndex: 0,
  });
  const [notes, setNotes] = useState("");
  const isPro = user && ((user.subscription?.plan === "pro" && user.subscription?.status === "active") || user.isPremium);
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
  const fetchInProgressRef = useRef(false); // Prevent duplicate API calls
  const initializedCoursesRef = useRef(new Set()); // Track initialized courses
  const contentRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalData, setLimitModalData] = useState(null);


  const [currentNotes, setCurrentNotes] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [lessonQuestions, setLessonQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showQuestionResults, setShowQuestionResults] = useState(false);

  // Persist and restore agent conversation
  const conversationKey = () => {
    const id = courseData?._id || `${actualTopic}-${format}-${difficulty}`;
    return `conversation_${id}`;
  };

  const progressKey = () => {
    const id = courseData?._id || `${actualTopic}-${format}-${difficulty}`;
    return `progress_${id}`;
  };

  const saveConversation = (messages) => {
    try {
      localStorage.setItem(conversationKey(), JSON.stringify(messages));
    } catch (e) {
      // Silent fail for conversation persistence
    }
    // Also persist to backend library for reloads
    try {
      fetch("/api/library", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?._id || user?.id || user?.idString || "",
        },
        body: JSON.stringify({
          action: "saveConversation",
          courseId: courseData?._id || null,
          topic: actualTopic,
          difficulty,
          format,
          messages,
        }),
      }).catch(() => { });
    } catch (e) {
      // Silent fail for backend conversation persistence
    }
  };

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
      const res = await fetch("/api/library", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?._id || user?.id || user?.idString || "",
        },
        body: JSON.stringify({
          action: "getConversation",
          courseId: courseData?._id || null,
          topic: actualTopic,
          difficulty,
          format,
        }),
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
      if (width >= 1024) { // Large
        setIsSidebarOpen(true);
        setIsRightPanelOpen(true);
      } else if (width >= 768) { // Medium
        setIsSidebarOpen(true);
        setIsRightPanelOpen(false);
      } else { // Small
        setIsSidebarOpen(true); // Open by default as requested
        setIsRightPanelOpen(false);
      }
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

  const selectLesson = async (moduleId, lessonIndex) => {
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

      const response = await fetch("/api/course-agent", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "generateLesson",
          courseId: courseData?._id || null,
          moduleId,
          lessonIndex,
          lessonTitle,
          moduleTitle,
          courseTopic: topic,
          difficulty,
        }),
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
    const lessonId = `${moduleId}-${lessonIndex}`;
    const newCompleted = new Set(completedLessons);

    if (newCompleted.has(lessonId)) {
      newCompleted.delete(lessonId);
    } else {
      newCompleted.add(lessonId);
    }
    setCompletedLessons(newCompleted);

    // --- Save progress ---
    try {
      // 1. Save to Local Storage for immediate persistence
      localStorage.setItem(
        progressKey(),
        JSON.stringify(Array.from(newCompleted))
      );

      // 2. Save to backend database
      const courseId = courseData?._id ? String(courseData._id) : null;
      if (courseId) {
        const totalLessons = courseData?.totalLessons || 0;
        const progress =
          totalLessons > 0
            ? Math.round((newCompleted.size / totalLessons) * 100)
            : 0;

        const response = await fetch("/api/course-progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": String(user?._id || user?.id || ""),
          },
          credentials: "include",
          body: JSON.stringify({
            courseId,
            progress,
            completed: progress === 100,
            isLessonCompleted: newCompleted.has(lessonId),
            userId: String(user?._id || user?.id || ""),
            lessonId: lessonId,
          }),
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

      const relevanceCheck = await fetch("/api/course-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "checkRelevance",
          question: userMessage.message,
          courseContent: allCourseContent,
          lessonTitle: currentLesson?.title || "",
          context: `Course: ${courseData?.title || ""
            }, Level: ${courseData?.level || ""}, Topic: ${topic}. Module: ${courseData?.modules?.find((m) => m.id === activeLesson.moduleId)
              ?.title || ""
            }`,
        }),
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
      const response = await fetch("/api/course-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "answer",
          question: userMessage.message,
          courseContent: allCourseContent,
          lessonTitle: currentLesson?.title || "",
          context: `Course: ${courseData?.title || ""
            }, Level: ${courseData?.level || ""}, Topic: ${topic}. Module: ${courseData?.modules?.find((m) => m.id === activeLesson.moduleId)
              ?.title || ""
            }`,
        }),
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

    let html = content;

    // keep content as generated

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
    html = html.replace(/```(\w+)?\s*\n([\s\S]*?)```/g, (match, lang, code) => {
      const placeholder = `___CODEBLOCK_${codeBlocks.length}___`;
      codeBlocks.push(
        `<pre class="bg-slate-900 p-4 rounded-lg overflow-x-auto my-4 border border-border"><code class="text-sm text-green-400 language-${lang || "plaintext"}">${code.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`
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

    // Handle LaTeX with \[ \] delimiters (display mode)
    html = html.replace(
      /\\\[([^\]]*?)\\\]/g,
      (match, equation) => {
        try {
          const rendered = katex.renderToString(equation.trim(), {
            displayMode: true,
            throwOnError: false,
            output: 'html'
          });
          return `<div class="my-4 p-4 bg-accent text-accent-foreground rounded-lg overflow-x-auto">${rendered}</div>`;
        } catch (e) {
          return `<div class="my-4 p-4 bg-destructive/10 rounded-lg text-destructive">LaTeX Error: ${equation}</div>`;
        }
      }
    );

    // Handle LaTeX with \( \) delimiters (inline mode)
    html = html.replace(
      /\\\(([^\)]*?)\\\)/g,
      (match, equation) => {
        try {
          const rendered = katex.renderToString(equation.trim(), {
            displayMode: false,
            throwOnError: false,
            output: 'html',
            strict: false
          });
          return `<span class="inline-block align-middle mx-0.5">${rendered}</span>`;
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
          return `<div class="my-4 p-4 bg-accent text-accent-foreground rounded-lg overflow-x-auto">${rendered}</div>`;
        } catch (e) {
          return `<div class="my-4 p-4 bg-destructive/10 rounded-lg text-destructive">LaTeX Error: ${equation}</div>`;
        }
      }
    );

    // Handle equations - inline mode $...$
    // Use a more specific pattern to avoid matching dollar signs in regular text
    html = html.replace(
      /\$([^\$\n]+?)\$/g,
      (match, equation) => {
        // Skip if it looks like a price (e.g., $100 or $5.99)
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
          return `<span class="inline-block align-middle mx-0.5">${rendered}</span>`;
        } catch (e) {
          return `<span class="text-destructive text-xs">LaTeX Error: ${equation}</span>`;
        }
      }
    );

    // Handle headers
    html = html.replace(
      /^# (.*$)/gm,
      '<h1 class="text-3xl font-bold text-foreground mb-6 mt-8 border-b-2 border-primary pb-2">$1</h1>'
    );
    html = html.replace(
      /^## (.*$)/gm,
      '<h2 class="text-2xl font-semibold text-foreground mb-4 mt-6">$1</h2>'
    );
    html = html.replace(
      /^### (.*$)/gm,
      '<h3 class="text-xl font-semibold text-foreground/90 mb-3 mt-5">$1</h3>'
    );
    html = html.replace(
      /^#### (.*$)/gm,
      '<h4 class="text-lg font-semibold text-foreground/90 mb-2 mt-4">$1</h4>'
    );

    // Handle blockquotes
    html = html.replace(
      /^> (.*$)/gm,
      '<blockquote class="border-l-4 border-primary pl-4 py-2 my-4 bg-secondary text-muted-foreground italic rounded-r">$1</blockquote>'
    );

    // Handle bold - must come before italics
    html = html.replace(
      /\*\*([^\*\n]+?)\*\*/g,
      '<strong class="font-bold text-foreground">$1</strong>'
    );

    // Handle italics
    html = html.replace(
      /\*([^\*\n]+?)\*/g,
      '<em class="italic text-foreground/90">$1</em>'
    );

    // Handle numbered lists
    let inOrderedList = false;
    html = html
      .split("\n")
      .map((line) => {
        if (/^\d+\.\s+/.test(line)) {
          const content = line.replace(/^\d+\.\s+/, "");
          if (!inOrderedList) {
            inOrderedList = true;
            return (
              '<ol class="list-decimal list-inside mb-4 space-y-2 text-muted-foreground ml-4"><li class="mb-2">' +
              content +
              "</li>"
            );
          }
          return '<li class="mb-2">' + content + "</li>";
        } else {
          if (inOrderedList) {
            inOrderedList = false;
            return "</ol>" + line;
          }
          return line;
        }
      })
      .join("\n");
    if (inOrderedList) html += "</ol>";

    // Handle bullet lists
    let inUnorderedList = false;
    html = html
      .split("\n")
      .map((line) => {
        if (/^[-•*]\s+/.test(line)) {
          const content = line.replace(/^[-•*]\s+/, "");
          if (!inUnorderedList) {
            inUnorderedList = true;
            return (
              '<ul class="list-disc list-inside mb-4 space-y-2 text-muted-foreground ml-4"><li class="mb-2">' +
              content +
              "</li>"
            );
          }
          return '<li class="mb-2">' + content + "</li>";
        } else {
          if (inUnorderedList) {
            inUnorderedList = false;
            return "</ul>" + line;
          }
          return line;
        }
      })
      .join("\n");
    if (inUnorderedList) html += "</ul>";

    // Handle paragraphs
    html = html
      .split("\n\n")
      .map((para) => {
        para = para.trim();
        if (para && !para.startsWith("<")) {
          return `<p class="mb-4 text-foreground/90 leading-relaxed">${para}</p>`;
        }
        return para;
      })
      .join("\n");

    // Handle horizontal rules
    html = html.replace(
      /^---+$/gm,
      '<hr class="my-6 border-border" />'
    );

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

      const response = await fetch("/api/notes", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: `course_${courseData?._id}`,
          lessonId: `${activeLesson.moduleId}-${activeLesson.lessonIndex}`,
          content: notesContent,
          title: currentLesson?.title || "Lesson Notes",
        }),
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
  useEffect(() => {
    const courseKey = `${actualTopic}/${format}/${difficulty}`;

    // Clear initialized set when topic/format/difficulty changes
    initializedCoursesRef.current.clear();

    let isMounted = true; // Prevent state updates if component unmounts

    const fetchCourseData = async () => {
      // Prevent multiple simultaneous calls (guards StrictMode double-effect)
      if (fetchInProgressRef.current) {

        return;
      }

      fetchInProgressRef.current = true;

      setIsLoading(true);
      setError(null);

      // Check if free user is trying to use non-beginner difficulty
      const isPro =
        !!(
          user?.subscription &&
          (user.subscription.plan === "pro" || user.subscription.plan === "enterprise") &&
          user.subscription.status === "active"
        ) || !!user?.isPremium;

      // Clean up local storage on component mount
      cleanupLocalStorage();

      // Validate topic existence before proceeding
      if (!actualTopic || actualTopic.trim() === "") {
        console.error("No topic provided for learning content");
        setError("A topic is required to generate or load content. Please go back to the dashboard and try again.");
        setIsLoading(false);
        fetchInProgressRef.current = false;
        return;
      }

      // First, try to get from library (saves tokens!)
      try {
        const libraryResponse = await fetch("/api/library", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?._id || user?.id || user?.idString || "",
          },
        });

        if (libraryResponse.ok) {
          const libraryData = await libraryResponse.json();

          // Find course matching this topic, format, and difficulty
          const existingCourse = libraryData.items?.find((c) => {
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

          if (
            existingCourse &&
            ((existingCourse.modules && existingCourse.modules.length > 0) ||
              (existingCourse.courseData?.modules &&
                existingCourse.courseData.modules.length > 0))
          ) {
            // Course exists in library - use it!
            console.log(
              "✅ Found existing course in library:",
              existingCourse.title || existingCourse.courseData?.title
            );

            if (!isMounted) return;

            // Extract course data from the correct location
            const courseData = existingCourse.courseData || existingCourse;
            const courseDataWithProgress = {
              ...courseData,
              // Add any additional progress data if needed
            };

            setCourseData(courseDataWithProgress);

            // Restore completed lessons from database/library first
            const completedLessonsFromDB = new Set();
            if (courseData.modules) {
              courseData.modules.forEach((module) => {
                if (module.lessons) {
                  module.lessons.forEach((lesson) => {
                    if (lesson.completed && lesson.id) {
                      completedLessonsFromDB.add(lesson.id);
                    }
                  });
                }
              });
            }

            // Then check localStorage for any additional progress
            const courseId =
              courseData._id || `${actualTopic}-${format}-${difficulty}`;
            const progressStorageKey = `progress_${courseId}`;
            const savedProgress = localStorage.getItem(progressStorageKey);
            if (savedProgress) {
              try {
                const parsed = JSON.parse(savedProgress);
                // Merge DB and localStorage progress
                parsed.forEach((lessonId) => completedLessonsFromDB.add(lessonId));
                console.log(
                  "Restored completed lessons from DB and localStorage:",
                  Array.from(completedLessonsFromDB)
                );
              } catch (e) {
                console.warn("Failed to parse saved progress:", e);
              }
            } else {
              console.log(
                "Restored completed lessons from DB:",
                Array.from(completedLessonsFromDB)
              );
            }

            setCompletedLessons(completedLessonsFromDB);

            console.log(
              "Found course in library, setting isLoading to false"
            );
            console.log("Setting isLoading to false (library)");
            setIsLoading(false);

            // Notify other components that loading finished and perform a dev-time cleanup
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("actinova:loading-done"));
              setTimeout(() => {
                const leftovers = document.querySelectorAll(
                  "[data-actinova-loader-overlay], [data-actinova-loader]"
                );
                if (leftovers.length) {
                  console.warn("Detected leftover loaders after library load, removing...", leftovers.length);
                  leftovers.forEach((n) => n.remove());
                }
              }, 1000);
            }

            fetchInProgressRef.current = false;
            initializedCoursesRef.current.add(courseKey);
            return;
          } else {
            console.log("generating course...");
          }
        }
      } catch (libraryError) {
        console.log("Library check error:", libraryError);
      }

      // For flashcards, check the flashcards collection
      if (format === "flashcards") {
        try {
          const cardsResponse = await fetch("/api/flashcards", {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
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
          const quizResponse = await fetch(`/api/quizzes/${existingQuizId}`);
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
        router.push("/dashboard?tab=upgrade");
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
        const response = await fetch(apiEndpoint, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          if (response.status === 429) {
            const errorData = await response.json();
            if (!isMounted) return;
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
              window.dispatchEvent(new CustomEvent("actinova:loading-done"));
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
          window.dispatchEvent(new CustomEvent("actinova:loading-done"));
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("actinova:loading-done"));
          }, 50);
          setTimeout(() => {
            const leftovers = document.querySelectorAll(
              "[data-actinova-loader-overlay], [data-actinova-loader]"
            );
            if (leftovers.length) {
              console.warn("Detected leftover loaders after generation, removing...", leftovers.length);
              leftovers.forEach((n) => n.remove());
            }
          }, 1000);
        }

        // Persist generated course to library (no-op on server if already saved)
        try {
          const libRes = await fetch("/api/library", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": user?._id || user?.id || user?.idString || "",
            },
            body: JSON.stringify({
              action: "add",
              course: {
                isGenerated: true,
                courseData: courseDataToSet,
                title: courseDataToSet.title,
                topic: courseDataToSet.topic || actualTopic,
                level: courseDataToSet.level || difficulty,
                format,
              },
            }),
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
        if (isMounted) {
          setError(err.message);
          toast.error(`Failed to load course: ${err.message}`);
        }
      } finally {
        console.log("Finally block executed, setting isLoading to false");
        if (isMounted) {
          console.log("Setting isLoading to false (finally)");
          setIsLoading(false);

          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("actinova:loading-done"));
            setTimeout(() => {
              const leftovers = document.querySelectorAll(
                "[data-actinova-loader-overlay], [data-actinova-loader]"
              );
              if (leftovers.length) {
                console.warn("Detected leftover loaders in finally block, removing...", leftovers.length);
                leftovers.forEach((n) => n.remove());
              }
            }, 1000);
          }
        }
        fetchInProgressRef.current = false;
      }

      // Safety timeout to ensure loading state is cleared
      setTimeout(() => {
        if (isMounted && fetchInProgressRef.current) {
          console.log("Safety timeout: forcing isLoading to false");
          setIsLoading(false);
          fetchInProgressRef.current = false;

          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("actinova:loading-done"));
            setTimeout(() => {
              const leftovers = document.querySelectorAll(
                "[data-actinova-loader-overlay], [data-actinova-loader]"
              );
              if (leftovers.length) {
                console.warn("Detected leftover loaders from safety timeout, removing...", leftovers.length);
                leftovers.forEach((n) => n.remove());
              }
            }, 1000);
          }
        }
      }, 30000); // 30 seconds timeout
    };

    fetchCourseData();

    // Cleanup function
    return () => {
      isMounted = false;
      // Don't clear initializedCoursesRef here as we want to persist across re-mounts
    };
  }, [actualTopic, format, difficulty]);

  useEffect(() => {
    if (!courseData) return;

    const progressPercentage = (completedCount / totalLessons) * 100;

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
  }, [completedCount, totalLessons, courseData]);

  // Ensure loader disappears when course data is available
  useLayoutEffect(() => {
    if (courseData && isLoading) {
      setIsLoading(false);
    }
  }, [courseData, isLoading]);

  // No knowledge-check parsing: nothing to do when content changes

  // Show loading state only if no course data yet and no limit modal
  if (isLoading && !courseData && !showLimitModal) {
    return (
      <ActinovaLoader
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
      <div className="h-[calc(100vh-6rem)] flex flex-col bg-background overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Failed to generate course
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
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
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Permanent Navbar Header */}
      <div className="bg-card backdrop-blur-md border-b border-border p-3 sm:p-4 z-50 shadow-sm relative">
        <div className="flex items-center justify-between w-full px-2 sm:px-4 lg:px-6">
          {/* Left Group - Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm rounded-xl bg-foreground text-background hover:opacity-90 transition-all font-bold shadow-lg"
            >
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm rounded-xl border transition-all font-bold ${isSidebarOpen
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary"
                }`}
            >
              <Menu className="w-4 h-4" />
              <span className="hidden md:inline">Modules</span>
            </button>
          </div>

          {/* Center Title (Desktop only or scaled) */}
          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2">
            <h2 className="text-sm font-black text-foreground uppercase tracking-[0.2em] line-clamp-1 max-w-[300px]">
              {courseData?.title}
            </h2>
          </div>

          {/* Right Group - Controls (HIDDEN ON MOBILE, moved to bottom) */}
          <div className="hidden lg:flex items-center space-x-3">
            <button
              onClick={async () => {
                if (!activeLesson || lessonContentLoading) return;
                const lessonId = `${activeLesson.moduleId}-${activeLesson.lessonIndex}`;
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
              className={`flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm rounded-xl transition-all font-bold border ${completedLessons.has(`${activeLesson.moduleId}-${activeLesson.lessonIndex}`)
                ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                : "bg-green-500/10 text-green-500 border-green-500/20"
                }`}
              disabled={!currentLesson?.content || lessonContentLoading}
            >
              <CheckCircle className="w-4 h-4" />
              <span>
                {completedLessons.has(`${activeLesson.moduleId}-${activeLesson.lessonIndex}`)
                  ? "Incomplete"
                  : "Complete"}
              </span>
            </button>

            <button
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              className={`flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm rounded-xl border transition-all font-bold ${isRightPanelOpen
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/50 text-muted-foreground border-border"
                }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isRightPanelOpen ? "Hide Tools" : "Show Tools"}</span>
            </button>
          </div>

          {/* Mobile Right Tools Toggle */}
          <button
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className="lg:hidden p-2 text-muted-foreground hover:bg-secondary rounded-xl transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
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
              <h2 className="font-bold text-lg text-foreground mb-2">
                {courseData.title}
              </h2>
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
                  router.push("/dashboard?tab=upgrade");
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
                  ? "w-full mb-4 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
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
                    onClick={() => toggleModule(module.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {moduleIndex + 1}
                      </div>
                      <span className="text-sm font-medium text-foreground text-left">
                        {module.title}
                      </span>
                    </div>
                    {expandedModules.has(module.id) ? (
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
                        const lessonId = `${module.id}-${lessonIndex}`;
                        const isCompleted = completedLessons.has(lessonId);
                        const isActive =
                          activeLesson.moduleId === module.id &&
                          activeLesson.lessonIndex === lessonIndex;
                        return (
                          <button
                            key={lessonIndex}
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
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 ml-2"></div>
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
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto hide-scrollbar bg-background"
          >
            <div className={`mx-auto p-4 sm:p-6 lg:p-8 transition-all duration-300 ${isRightPanelOpen && isSidebarOpen ? "max-w-4xl" : "max-w-5xl"}`}>
              {generatingLessons.has(`${activeLesson.moduleId}-${activeLesson.lessonIndex}`) ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
                    <div
                      dangerouslySetInnerHTML={{
                        __html: renderContent(currentLesson.content),
                      }}
                    />
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
                        router.push("/dashboard?tab=upgrade");
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
                          <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed" dangerouslySetInnerHTML={{ __html: message.html ? message.message : message.message }} />
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

      {/* Mobile Sticky Footer Controls */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-card/80 backdrop-blur-xl border-t border-border z-50 flex items-center justify-around shadow-[0_-8px_32px_rgba(0,0,0,0.1)]">
        <button
          onClick={async () => {
            if (!activeLesson || lessonContentLoading) return;
            await toggleLessonCompletion(activeLesson.moduleId, activeLesson.lessonIndex);
          }}
          className={`flex-1 mx-2 p-3 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${completedLessons.has(`${activeLesson.moduleId}-${activeLesson.lessonIndex}`)
            ? "text-orange-500"
            : "text-green-500"
            }`}
        >
          <CheckCircle size={20} />
          <span className="text-[10px] uppercase tracking-widest">{completedLessons.has(`${activeLesson.moduleId}-${activeLesson.lessonIndex}`) ? "Undo" : "Done"}</span>
        </button>

        <button
          onClick={() => {
            if (!isPro) {
              toast.error("Pro feature");
              return;
            }
            downloadCourseAsPDF({
              title: currentLesson.title,
              content: currentLesson.content
            }, "notes");
          }}
          className="flex-1 mx-2 p-3 rounded-xl font-bold text-foreground flex flex-col items-center gap-1"
        >
          <Download size={20} />
          <span className="text-[10px] uppercase tracking-widest">PDF</span>
        </button>

        <button
          onClick={() => setIsRightPanelOpen(true)}
          className="flex-1 mx-2 p-3 rounded-xl font-bold text-primary flex flex-col items-center gap-1"
        >
          <MessageCircle size={20} />
          <span className="text-[10px] uppercase tracking-widest">AI Tutor</span>
        </button>
      </div>

      {/* Notes Download Modal removed for instant download */}

      {/* Limit Reached Modal */}
      {showLimitModal && limitModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-orange-600 dark:text-orange-400"
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
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200">
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
                    router.push("/dashboard?tab=upgrade");
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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