"use client";

import { useClassroomContext } from "../../components/ClassroomContext";
import CourseTab from "../../components/CourseTab";
import AnnouncementsBanner from "../../components/AnnouncementsBanner";

export default function CoursePage() {
  const state = useClassroomContext();
  return (
    <>
      <AnnouncementsBanner />
      <CourseTab classroomState={state} />
    </>
  );
}
