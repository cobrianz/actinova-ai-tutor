"use client";

import { createContext, useContext } from "react";

const ClassroomContext = createContext(null);

export function ClassroomProvider({ value, children }) {
  return <ClassroomContext.Provider value={value}>{children}</ClassroomContext.Provider>;
}

export function useClassroomContext() {
  const ctx = useContext(ClassroomContext);
  if (!ctx) throw new Error("useClassroomContext must be used within ClassroomProvider");
  return ctx;
}
