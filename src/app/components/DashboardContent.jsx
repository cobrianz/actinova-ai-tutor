"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Generate from "./Generate";
import Explore from "./Explore";
import Roadmap from "./Roadmap";
import Library from "./Library";
import StaffPicks from "./StaffPicks";
import Community from "./Community";
import Upgrade from "./Upgrade";

export default function DashboardContent() {
  const [activeContent, setActiveContent] = useState("generate"); // Default to Generate

  const routeComponents = {
    generate: Generate,
    explore: Explore,
    roadmap: Roadmap,
    library: Library,
    "staff-picks": StaffPicks,
    community: Community,
    upgrade: Upgrade,
  };

  const recentCourses = [
    {
      title: "JavaScript Fundamentals",
      progress: 75,
      lastAccessed: "2 hours ago",
    },
    { title: "React Development", progress: 40, lastAccessed: "1 day ago" },
    { title: "Node.js Backend", progress: 10, lastAccessed: "3 days ago" },
  ];

  // Get the component to render
  const ContentComponent = routeComponents[activeContent];

  return (
    <div className="relative flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar setActiveContent={setActiveContent} />
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {ContentComponent && (
              <ContentComponent setActiveContent={setActiveContent} />
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Recent Courses */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Continue Learning
              </h3>
              <div className="space-y-4">
                {recentCourses.map((course, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {course.title}
                    </h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {course.progress}% complete
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {course.lastAccessed}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Limit */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Daily Usage
                </h3>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  4% used
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-3">
                <div
                  className="bg-blue-500 h-2.5 rounded-full"
                  style={{ width: "4%" }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You have plenty of AI generations left today!
              </p>
              <button
                onClick={() => setActiveContent("upgrade")}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-4 rounded-lg font-medium text-sm hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
