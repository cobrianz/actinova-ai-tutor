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

  // Get the component to render
  const ContentComponent = routeComponents[activeContent];

  return (
    <div className="relative flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar setActiveContent={setActiveContent} />
      <div className="flex-1 max-w-[90rem] w-full mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {ContentComponent && (
              <ContentComponent setActiveContent={setActiveContent} />
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Daily Limit */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Daily Usage
                </h3>
                <span className="text-sm text-blue-400">3% used</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-3">
                <div
                  className="bg-blue-500 h-2.5 rounded-full"
                  style={{ width: "3%" }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You have plenty of generations left today!
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
