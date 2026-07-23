"use client";

import { useClassroomContext } from "../../components/ClassroomContext";
import SettingsTab from "../../components/SettingsTab";

export default function SettingsPage() {
  const state = useClassroomContext();
  return <SettingsTab classroomState={state} />;
}
