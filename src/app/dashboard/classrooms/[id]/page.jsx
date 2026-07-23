"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ClassroomIdPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/dashboard/classrooms/${params.id}/course`);
  }, [params.id, router]);

  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
