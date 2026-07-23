"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ClassroomDetail from "@/app/components/classroom/ClassroomDetail";
import { useAuth } from "@/app/components/AuthProvider";
import { apiClient } from "@/lib/csrfClient";
import { ArrowLeft } from "lucide-react";

export default function ClassroomIdPage({ setHideDashboardNav, hideDashboardNav, classroomSidebarCollapsed, setClassroomSidebarCollapsed }) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const classroomId = params.id;

  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClassroom = useCallback(async () => {
    if (!classroomId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/classrooms?id=${classroomId}`);
      const data = await res.json();
      if (data.success && data.classrooms?.length > 0) {
        setClassroom(data.classrooms[0]);
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

  useEffect(() => {
    if (setHideDashboardNav) setHideDashboardNav(true);
    return () => { if (setHideDashboardNav) setHideDashboardNav(false); };
  }, [setHideDashboardNav]);

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
    <ClassroomDetail
      classroom={classroom}
      onBack={() => router.push("/dashboard/classrooms")}
      user={user}
      sidebarCollapsed={classroomSidebarCollapsed}
      setSidebarCollapsed={setClassroomSidebarCollapsed}
      searchParams={searchParams}
      router={router}
    />
  );
}
