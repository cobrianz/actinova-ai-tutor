"use client";

import { useClassroomContext } from "../../components/ClassroomContext";
import DiscussionsTab from "../../components/DiscussionsTab";
import AnnouncementsBanner from "../../components/AnnouncementsBanner";

export default function DiscussionsPage() {
  const state = useClassroomContext();
  return (
    <>
      <AnnouncementsBanner />
      <DiscussionsTab classroomState={state} />
    </>
  );
}
