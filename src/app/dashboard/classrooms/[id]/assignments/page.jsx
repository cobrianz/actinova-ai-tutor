"use client";

import { useClassroomContext } from "../../components/ClassroomContext";
import AssignmentsTab from "../../components/AssignmentsTab";
import AnnouncementsBanner from "../../components/AnnouncementsBanner";
import InstructorStats from "../../components/InstructorStats";

export default function AssignmentsPage() {
  const state = useClassroomContext();
  return (
    <>
      <AnnouncementsBanner />
      <InstructorStats />
      <AssignmentsTab classroomState={state} />
    </>
  );
}
