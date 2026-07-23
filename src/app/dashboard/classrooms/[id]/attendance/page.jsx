"use client";

import { useClassroomContext } from "../../components/ClassroomContext";
import AttendanceTab from "../../components/AttendanceTab";
import AnnouncementsBanner from "../../components/AnnouncementsBanner";

export default function AttendancePage() {
  const state = useClassroomContext();
  return (
    <>
      <AnnouncementsBanner />
      <AttendanceTab classroomState={state} />
    </>
  );
}
