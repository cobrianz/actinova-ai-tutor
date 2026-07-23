"use client";

import { useClassroomContext } from "../../components/ClassroomContext";
import StudentsTab from "../../components/StudentsTab";
import AnnouncementsBanner from "../../components/AnnouncementsBanner";

export default function StudentsPage() {
  const state = useClassroomContext();
  return (
    <>
      <AnnouncementsBanner />
      <StudentsTab classroomState={state} />
    </>
  );
}
