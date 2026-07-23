"use client";

import { useClassroomContext } from "../../components/ClassroomContext";
import ClassroomChat from "../../components/ClassroomChat";

export default function ChatPage() {
  const state = useClassroomContext();
  return (
    <ClassroomChat
      classroomId={state.classroom.id}
      user={state.user}
      classroom={state.classroom}
      isInstructor={state.isInstructor}
      students={state.students}
      announcements={state.announcements}
      onAnnouncementAdd={(ann) => state.setAnnouncements((prev) => [...prev, ann])}
      onAnnouncementDelete={(annId) => state.setAnnouncements((prev) => prev.filter((a) => (a._id || a.id) !== annId))}
    />
  );
}
