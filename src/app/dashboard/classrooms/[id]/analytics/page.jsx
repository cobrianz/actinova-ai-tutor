"use client";

import { useClassroomContext } from "../../components/ClassroomContext";
import AnalyticsTab from "../../components/AnalyticsTab";
import AnnouncementsBanner from "../../components/AnnouncementsBanner";

export default function AnalyticsPage() {
  const state = useClassroomContext();
  return (
    <>
      <AnnouncementsBanner />
      <AnalyticsTab classroomState={state} />
    </>
  );
}
