"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { apiClient } from "@/lib/csrfClient";
import { ClassroomProvider } from "../components/ClassroomContext";
import useClassroom from "../components/useClassroom";
import ClassroomSidebar from "../components/ClassroomSidebar";
import ClassroomMobileNav from "../components/ClassroomMobileNav";
import ClassroomAIPanel from "../components/ClassroomAIPanel";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function ClassroomLayout({ children }) {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const classroomId = params.id;

  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const fetchClassroom = useCallback(async () => {
    if (!classroomId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/classrooms?id=${classroomId}`);
      const data = await res.json();
      if (data.success && data.classroom) {
        setClassroom(data.classroom);
        setError(null);
      } else {
        setError("Classroom not found");
      }
    } catch (e) {
      console.error("Failed to fetch classroom:", e);
      setError("Failed to load classroom");
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => { fetchClassroom(); }, [fetchClassroom]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">{error || "Classroom not found"}</p>
        <button onClick={() => router.push("/dashboard/classrooms")} className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700">
          <ArrowLeft className="w-4 h-4" /> Back to Classrooms
        </button>
      </div>
    );
  }

  return (
    <ClassroomLayoutInner
      classroom={classroom}
      user={user}
      router={router}
      sidebarCollapsed={sidebarCollapsed}
      setSidebarCollapsed={setSidebarCollapsed}
      onBack={() => router.push("/dashboard/classrooms")}
    >
      {children}
    </ClassroomLayoutInner>
  );
}

function ClassroomLayoutInner({ classroom, user, router, sidebarCollapsed, setSidebarCollapsed, onBack, children }) {
  const state = useClassroom(classroom, null, onBack);
  const { tabs, isInstructor, showInvite, setShowInvite } = state;
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const pathname = usePathname();
  const segments = pathname.split("/");
  const activeTab = segments[segments.length - 1] || "course";

  const navigateTab = useCallback((tab) => {
    router.push(`/dashboard/classrooms/${classroom.id}/${tab}`);
  }, [router, classroom.id]);

  return (
    <ClassroomProvider value={{ ...state, classroom, user, activeTab, setActiveTab: navigateTab }}>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden pb-16 lg:pb-0 relative">
        <ClassroomSidebar
          classroom={classroom}
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={navigateTab}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          isInstructor={isInstructor}
          setShowCreateAssignment={state.setShowCreateAssignment}
          setShowInvite={setShowInvite}
        />

        <ClassroomMobileNav activeTab={activeTab} setActiveTab={navigateTab} isInstructor={isInstructor} onBack={onBack} />

        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 sm:pt-8 lg:pt-12 pb-16 space-y-4">
            {children}
          </div>
        </div>

        {/* Floating AI Assistant Trigger */}
        <button
          onClick={() => setAiPanelOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-full font-bold text-xs shadow-lg shadow-green-500/25 transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Assistant</span>
        </button>

        {/* Slide-in AI Panel */}
        <ClassroomAIPanel
          classroom={classroom}
          user={user}
          activeTab={activeTab}
          isInstructor={isInstructor}
          isOpen={aiPanelOpen}
          onClose={() => setAiPanelOpen(false)}
        />
      </div>
    </ClassroomProvider>
  );
}
