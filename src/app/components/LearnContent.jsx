"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Share,
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
  X,
} from "lucide-react";
import NotesDownload from "./NotesDownload";
import AchievementCertificate from "./AchievementCertificate";
import toast from "react-hot-toast";
import { courseData } from "../lib/LearnContentData";

export default function LearnContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const topic = decodeURIComponent(params.topic);
  const format = searchParams.get("format") || "course";
  const difficulty = searchParams.get("difficulty") || "beginner";
  const [activeView, setActiveView] = useState("outline");
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [expandedModules, setExpandedModules] = useState(new Set([1]));
  const [activeLesson, setActiveLesson] = useState({
    moduleId: 1,
    lessonIndex: 0,
  });
  const [notes, setNotes] = useState("");
  const [aiQuestion, setAiQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      type: "ai",
      message:
        "Hi! I'm your AI tutor. I'm here to help you understand the concepts better. Feel free to ask me any questions about the lesson!",
      timestamp: new Date(),
    },
  ]);
  const [activeRightPanel, setActiveRightPanel] = useState("notes");
  const [showNotesDownload, setShowNotesDownload] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [currentNotes, setCurrentNotes] = useState(null);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  const toggleModule = (moduleId) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const selectLesson = (moduleId, lessonIndex) => {
    setActiveLesson({ moduleId, lessonIndex });
    setIsSidebarOpen(false);
  };

  const toggleLessonCompletion = (moduleId, lessonIndex) => {
    const lessonId = `${moduleId}-${lessonIndex}`;
    const newCompleted = new Set(completedLessons);
    if (newCompleted.has(lessonId)) {
      newCompleted.delete(lessonId);
    } else {
      newCompleted.add(lessonId);
    }
    setCompletedLessons(newCompleted);
  };

  const sendAiQuestion = () => {
    if (!aiQuestion.trim()) return;

    const userMessage = {
      type: "user",
      message: aiQuestion,
      timestamp: new Date(),
    };

    const aiResponses = [
      "That's a great question! Let me explain that concept in more detail...",
      "I can help clarify that for you. This is a common point of confusion...",
      "Excellent question! This relates to what we covered earlier about...",
      "Let me break that down for you step by step...",
      "That's an important concept to understand. Here's how it works...",
    ];

    const aiMessage = {
      type: "ai",
      message: aiResponses[Math.floor(Math.random() * aiResponses.length)],
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage, aiMessage]);
    setAiQuestion("");
  };

  const getCurrentLesson = () => {
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

  const totalLessons = courseData.modules.reduce(
    (acc, module) => acc + module.lessons.length,
    0
  );
  const completedCount = completedLessons.size;
  const progressPercentage = (completedCount / totalLessons) * 100;

  const currentLesson = getCurrentLesson();

  const handleDownloadNotes = () => {
    const notesData = {
      title: currentLesson?.title || "Lesson Notes",
      content: notes,
      date: new Date().toLocaleDateString(),
      course: courseData.title,
      tags: ["TypeScript", "Programming", "Learning"],
    };
    setCurrentNotes(notesData);
    setShowNotesDownload(true);
  };

  const handleShowCertificate = () => {
    const achievement = {
      title: courseData.title,
      recipient: "Student Name",
      date: new Date().toLocaleDateString(),
      level: courseData.level,
      score: "95%",
      skills: ["TypeScript", "JavaScript", "Programming", "Problem Solving"],
    };
    setCurrentAchievement(achievement);
    setShowCertificate(true);
  };

  useEffect(() => {
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

      setCurrentAchievement(achievement);
      setShowCertificate(true);

      toast.success(
        "🎉 Congratulations! You've completed the course and earned a certificate!"
      );
    }
  }, [completedCount, totalLessons]);

  return (
    <div className=" h-[calc(100vh-6rem)] flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          {isSidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
        <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">
          {courseData.title}
        </h2>
        <button
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          {isRightPanelOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <FileText className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Course Navigation */}
        <div
          className={`${
            isSidebarOpen ? "block" : "hidden"
          } lg:block w-full lg:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col absolute lg:static z-20 lg:z-auto transition-all duration-300 max-w-[90vw] md:max-w-[400px] h-full overflow-y-auto hide-scrollbar`} 
        >
          <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">
              {courseData.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {courseData.totalModules} modules • {courseData.totalLessons}{" "}
              lessons
            </p>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-sm font-semibold">
                {Math.round(progressPercentage)}%
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Completed
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="flex-1">
            {courseData.modules.map((module, moduleIndex) => (
              <div
                key={module.id}
                className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
              >
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                      {moduleIndex + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-left">
                      {module.title}
                    </span>
                  </div>
                  {expandedModules.has(module.id) ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {expandedModules.has(module.id) && (
                  <div className="bg-gray-50 dark:bg-gray-700">
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
                          className={`w-full p-3 pl-12 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                            isActive
                              ? "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500"
                              : ""
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                                isCompleted
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {isCompleted ? "✓" : lessonIndex + 1}
                            </div>
                            <span
                              className={`text-sm text-left ${
                                isActive
                                  ? "text-blue-600 dark:text-blue-400 font-medium"
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {lessonTitle}
                            </span>
                          </div>
                          {!isCompleted && (
                            <Play className="w-4 h-4 text-gray-400" />
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
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {currentLesson?.title || "Select a lesson"}
                </h1>
                <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs sm:text-sm font-medium">
                  {courseData.level}
                </span>
              </div>
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <button
                  onClick={() =>
                    toggleLessonCompletion(
                      activeLesson.moduleId,
                      activeLesson.lessonIndex
                    )
                  }
                  className="bg-green-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  Mark Complete
                </button>
                {progressPercentage === 100 && (
                  <button
                    onClick={handleShowCertificate}
                    className="bg-purple-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-1"
                  >
                    <Award className="w-4 h-4" />
                    <span>Get Certificate</span>
                  </button>
                )}
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                  <Share className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar bg-white dark:bg-gray-800">
            <div className="max-w-full sm:max-w-3xl lg:max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
              {currentLesson?.content ? (
                <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: currentLesson.content
                        .replace(
                          /^# (.*$)/gm,
                          '<h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">$1</h1>'
                        )
                        .replace(
                          /^## (.*$)/gm,
                          '<h2 class="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 mt-6 sm:mt-8">$1</h2>'
                        )
                        .replace(
                          /^### (.*$)/gm,
                          '<h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 mt-4 sm:mt-6">$1</h3>'
                        )
                        .replace(
                          /```(\w+)?\n([\s\S]*?)```/g,
                          '<pre class="bg-gray-100 dark:bg-gray-900 p-3 sm:p-4 rounded-lg overflow-x-auto"><code class="text-xs sm:text-sm">$2</code></pre>'
                        )
                        .replace(
                          /`([^`]+)`/g,
                          '<code class="bg-gray-100 dark:bg-gray-700 px-1 sm:px-2 py-0.5 rounded text-xs sm:text-sm">$1</code>'
                        )
                        .replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong class="font-semibold">$1</strong>'
                        )
                        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                        .replace(
                          /^- (.*$)/gm,
                          '<li class="mb-1 sm:mb-2">$1</li>'
                        )
                        .replace(
                          /(<li.*<\/li>)/s,
                          '<ul class="list-disc list-inside mb-3 sm:mb-4 space-y-1 sm:space-y-2">$1</ul>'
                        )
                        .replace(
                          /\n\n/g,
                          '</p><p class="mb-3 sm:mb-4 text-gray-700 dark:text-gray-300">'
                        )
                        .replace(
                          /^(?!<[h|u|p|c])(.*$)/gm,
                          '<p class="mb-3 sm:mb-4 text-gray-700 dark:text-gray-300">$1</p>'
                        ),
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
                    Select a lesson to start learning
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Choose a lesson from the sidebar to begin your learning
                    journey.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Notes & AI Tutor */}
        <div
          className={`${
            isRightPanelOpen ? "block" : "hidden"
          } lg:block w-full lg:w-80 xl:w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col absolute lg:static z-20 lg:z-auto transition-all duration-300 max-w-[90vw] md:max-w-[400px] right-0 h-full`} // Added h-full
        >
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveRightPanel("notes")}
                className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                  activeRightPanel === "notes"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                Notes
              </button>
              <button
                onClick={() => setActiveRightPanel("chat")}
                className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                  activeRightPanel === "chat"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                AI Tutor
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden h-[calc(100vh-10rem)]">
            {activeRightPanel === "notes" ? (
              <div className="h-full flex flex-col">
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                    My Notes
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Take notes while learning
                  </p>
                </div>
                <div className="flex-1 p-3 sm:p-4">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write your notes here..."
                    className="w-full h-full resize-none overflow-y-auto hide-scrollbar bg-transparent text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" 
                  />
                </div>
                <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleDownloadNotes}
                    disabled={!notes.trim()}
                    className="w-full flex items-center justify-center space-x-1 sm:space-x-2 bg-blue-600 text-white py-1.5 sm:py-4 px-3 sm:px-4 text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors sm:p-x3"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Download Notes</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                    AI Tutor
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Ask questions about the lesson
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto hide-scrollbar p-3 sm:p-4">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.type === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-1.5 sm:px-4 sm:p-2 rounded-lg text-xs sm:text-sm ${
                          message.type === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {message.type === "ai" && (
                          <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                            <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm font-medium">
                              AI Tutor
                            </span>
                          </div>
                        )}
                        <p className="sm:text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-1 sm:space-x-2">
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendAiQuestion()}
                      placeholder="Ask a question..."
                      className="flex-1 px-2 py-1.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={sendAiQuestion}
                      disabled={!aiQuestion.trim()}
                      className="px-2 py-1.5 sm:p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <NotesDownload
        notes={currentNotes}
        isOpen={showNotesDownload}
        onClose={() => setShowNotesDownload(false)}
      />
      <AchievementCertificate
        achievement={currentAchievement}
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
      />
    </div>
  );
    }