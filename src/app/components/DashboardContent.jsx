"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, BookOpen, FileText, ChevronDown } from "lucide-react";
import Sidebar from "./Sidebar";
import Explore from "./Explore";
import Library from "./Library";
import PremiumCourses from "./PremiumCourses";
import Upgrade from "./Upgrade";
import { useAuth } from "./AuthProvider";

export default function DashboardContent({ sidebarOpen, setSidebarOpen }) {
  const [activeContent, setActiveContent] = useState("generate");
  const [topic, setTopic] = useState("");
  const [localTopic, setLocalTopic] = useState("");
  const [format, setFormat] = useState("course");
  const [difficulty, setDifficulty] = useState("beginner");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState("");
  const router = useRouter();
  const { user, loading } = useAuth();

  const friendlyName = (!loading && user) ? (user.firstName || user.name || "") : "";

  const routeComponents = {
    generate: () => (
      <div>
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {friendlyName ? `Welcome back, ${friendlyName}` : "Welcome to Actinova AI Tutor"}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Ready to continue your learning journey? Let's create something amazing today.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 mb-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              What can I help you learn today?
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Enter a topic below to generate a personalized course or guide
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                What can I help you learn?
              </label>
              <textarea
                value={localTopic}
                onChange={(e) => {
                  setLocalTopic(e.target.value);
                  setTopic(e.target.value);
                }}
                placeholder="Describe what you want to learn in detail... (e.g., I want to learn Python programming from scratch, including data structures, web development with Django, and machine learning basics)"
                className="w-full px-4 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 resize-none min-h-[120px] max-h-[200px] shadow-sm hover:shadow-md"
                onKeyDown={(e) => { 
                  if (e.key === "Enter" && e.ctrlKey) { 
                    e.preventDefault(); 
                    handleGenerate(); 
                  } 
                }}
                autoFocus
                rows={4}
              />
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                💡 Tip: Press Ctrl + Enter to generate your course
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-left">
                Choose the format
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFormat("course")}
                  className={`p-4 rounded-lg border-2 transition-colors flex flex-col items-center justify-center ${
                    format === "course"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <BookOpen className="w-6 h-6 mb-2 text-gray-700 dark:text-gray-300" />
                  <span className="font-medium text-sm">Course</span>
                </button>
                <button
                  onClick={() => setFormat("guide")}
                  className={`p-4 rounded-lg border-2 transition-colors flex flex-col items-center justify-center ${
                    format === "guide"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <FileText className="w-6 h-6 mb-2 text-gray-700 dark:text-gray-300" />
                  <span className="font-medium text-sm">Guide</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                Choose difficulty level
              </label>
              <div className="relative">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 appearance-none pr-10"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!topic.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium text-sm hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Generate</span>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Popular Learning Tracks
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              "Artificial Intelligence",
              "Frontend Development",
              "Backend Development",
              "Data Science",
              "Machine Learning",
              "Web Development",
              "Mobile Development",
              "DevOps",
            ].map((topicOption) => (
              <button
                key={topicOption}
                onClick={() => {
                  setTopic(topicOption);
                  setLocalTopic(topicOption);
                }}
                className="p-4 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {topicOption}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    ),
    explore: Explore,
    library: Library,
    "staff-picks": PremiumCourses,
    upgrade: Upgrade,
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationMessage("Initializing generation...");

    if (format === 'guide') {
      try {
        setGenerationMessage('Creating your guide...')
        const genRes = await fetch('/api/generate-course', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: topic.trim(), format: 'guide', difficulty })
        })
        if (!genRes.ok) throw new Error('Failed to generate guide')
        const generated = await genRes.json()
        const title = generated?.title || topic.trim()
        const totalLessons = generated?.totalLessons || (generated?.modules?.[0]?.lessons?.length || 0)
        await fetch('/api/guides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, topic: topic.trim(), level: difficulty, totalLessons, modules: generated?.modules || [] })
        })
        setIsGenerating(false)
        setActiveContent('library')
        return
      } catch (e) {
        setIsGenerating(false)
        setActiveContent('library')
        return
      }
    }

    // Directly navigate for course without popup loader
    router.push(
      `/learn/${encodeURIComponent(
        topic.trim()
      )}?format=${format}&difficulty=${difficulty}`
    );

    setIsGenerating(false);
  };

  const ContentComponent =
    routeComponents[activeContent] || routeComponents.generate;

  return (
    <div className="relative flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        setActiveContent={setActiveContent}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeContent={activeContent}
      />
      <div
        className="flex-1 max-w-[90rem] w-full mx-auto px-6 sm:px-8 lg:px-12 py-12 overflow-y-auto h-[100vh] scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            {ContentComponent ? (
              <ContentComponent setActiveContent={setActiveContent} />
            ) : (
              <div className="text-center text-gray-600 dark:text-gray-400">
                Loading content...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
