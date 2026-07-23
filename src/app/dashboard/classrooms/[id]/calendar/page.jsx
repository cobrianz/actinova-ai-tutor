"use client";

import { useClassroomContext } from "../../components/ClassroomContext";
import CalendarTab from "../../components/CalendarTab";
import AnnouncementsBanner from "../../components/AnnouncementsBanner";
import InstructorStats from "../../components/InstructorStats";

export default function CalendarPage() {
  const state = useClassroomContext();
  return (
    <>
      <AnnouncementsBanner />
      <InstructorStats />
      <CalendarTab classroomState={state} />
    </>
  );
}
