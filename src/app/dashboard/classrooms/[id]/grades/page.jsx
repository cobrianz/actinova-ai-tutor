"use client";

import { useClassroomContext } from "../../components/ClassroomContext";
import GradesTab from "../../components/GradesTab";
import AnnouncementsBanner from "../../components/AnnouncementsBanner";

export default function GradesPage() {
  const state = useClassroomContext();
  return (
    <>
      <AnnouncementsBanner />
      <GradesTab classroomState={state} />
    </>
  );
}
