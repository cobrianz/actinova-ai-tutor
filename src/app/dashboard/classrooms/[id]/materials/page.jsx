"use client";

import { useClassroomContext } from "../../components/ClassroomContext";
import MaterialsTab from "../../components/MaterialsTab";
import AnnouncementsBanner from "../../components/AnnouncementsBanner";

export default function MaterialsPage() {
  const state = useClassroomContext();
  return (
    <>
      <AnnouncementsBanner />
      <MaterialsTab classroomState={state} />
    </>
  );
}
