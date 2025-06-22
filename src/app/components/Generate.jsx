"use client";

import { useState } from "react";
import { Sparkles, BookOpen, FileText, ChevronDown } from "lucide-react";

export default function Generate({ setActiveContent }) {
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("course");
  const [difficulty, setDifficulty] = useState("beginner");

  const handleGenerate = () => {
    if (topic.trim()) {
      // Store course parameters (could use context or state management)
      // For now, switch to Learn component
      setActiveContent("learn");
    }
  };

  const featuredTopics = [
    "Artificial Intelligence",
    "Frontend Development",
    "Backend Development",
    "Data Science",
    "Machine Learning",
    "Web Development",
    "Mobile Development",
    "DevOps",
  ];

  return (
    <>
      {/* AI Tutor Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mb-10">
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

      {/* Quick Topics */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Popular Learning Tracks
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {featuredTopics.map((topic) => (
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
    </>
  );
}
