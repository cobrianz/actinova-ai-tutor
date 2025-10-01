"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, BookOpen, FileText, ChevronDown } from "lucide-react";
import Sidebar from "./Sidebar";
import Explore from "./Explore";
import Roadmap from "./Roadmap";
import Library from "./Library";
import StaffPicks from "./StaffPicks";
import Community from "./Community";
import Upgrade from "./Upgrade";

export default function DashboardContent({ sidebarOpen, setSidebarOpen }) {
  const [activeContent, setActiveContent] = useState("generate");
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("course");
  const [difficulty, setDifficulty] = useState("beginner");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState("");
  const router = useRouter();

  const routeComponents = {
    generate: () => (
      <div>
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Welcome back, John! 👋
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Ready to continue your learning journey? Let's create something
            amazing today.
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
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic (e.g., Python, Web Development)"
                className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                onKeyPress={(e) => e.key === "Enter" && handleGenerate()}
              />
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
                  <span className="font-medium text-sm">Cards</span>
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
            ].map((topic) => (
              <button
                key={topic}
                onClick={() => setTopic(topic)}
                className="p-4 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {topic}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    ),
    explore: Explore,
    roadmap: Roadmap,
    library: Library,
    "staff-picks": StaffPicks,
    community: Community,
    upgrade: Upgrade,
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationMessage("Initializing course generation...");

    // Simulate progress updates
    const progressSteps = [
      { progress: 10, message: "Analyzing your topic...", delay: 500 },
      { progress: 25, message: "Designing course structure...", delay: 800 },
      { progress: 45, message: "Generating learning objectives...", delay: 1000 },
      { progress: 65, message: "Creating lesson content...", delay: 1200 },
      { progress: 85, message: "Adding interactive elements...", delay: 800 },
      { progress: 95, message: "Finalizing your course...", delay: 600 },
      { progress: 100, message: "Course ready! Redirecting...", delay: 300 },
    ];

    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, step.delay));
      setGenerationProgress(step.progress);
      setGenerationMessage(step.message);
    }

    // Navigate to the course
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

      {/* Beautiful Generation Loading Modal */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              {/* Animated SVG Icon */}
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto relative">
                  {/* Outer rotating ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>

                  {/* Inner pulsing circle */}
                  <div className="absolute inset-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center animate-pulse">
                      <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>

                {/* Floating particles */}
                <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="absolute top-1/2 -right-3 w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${generationProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {generationProgress}% Complete
                </div>
              </div>

              {/* Dynamic Messages */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Generating Your Course
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {generationMessage}
              </p>

              {/* Fun facts or tips */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>Did you know?</strong> Our AI creates personalized learning paths tailored to your skill level and interests!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
