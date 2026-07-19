# Design Document: Classroom Course Enhancement

## Overview

This document details the technical design for six enhancement areas in the Actinova AI Tutor classroom section. The work spans UI polish, functional bug fixes, a new real-time chat channel, and a hardened role-based permission model. All changes live under `src/app/components/classroom/` (React) and `src/app/api/classrooms/` (Next.js API routes), with a new standalone Socket.IO server introduced at `src/server/socket.js`.

The primary constraints are:
- Next.js 16 API routes are serverless/Edge — they cannot host a persistent WebSocket server.
- The existing middleware chain `combineMiddleware(withErrorHandling, withCsrf, withAuth)` must be preserved for all mutating endpoints.
- JWT tokens are issued by `verifyToken` (from `src/app/lib/auth.js`) and stored in the `token` cookie; the Socket.IO server must use the same verify logic.
- No new client-side state management libraries; all chat and UI state uses React `useState`/`useReducer`.


## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser                                             │
│                                                      │
│  ClassroomDetail.jsx                                 │
│    ├── CourseTab.jsx      (ForkContentPanel inside)  │
│    ├── StudentsTab.jsx    (StudentProfilePanel)      │
│    ├── ClassroomChat.jsx  ← NEW                      │
│    └── ... other tabs                                │
│                                                      │
│  socket.io-client ──────────────────────────────┐   │
└────────────────────────────────────────────────┬┘   │
                                                 │     │
          HTTP/REST (apiClient + CSRF)           │     │
                     │                           │     │
┌────────────────────▼────────────────────────   │     │
│  Next.js App (port 3000)                       │     │
│  src/app/api/classrooms/[id]/...               │     │
│    fork/route.js, browse/route.js,             │     │
│    enrollment/route.js (DELETE — NEW)          │     │
└────────────────────────────────────────────────┘     │
                                                       │
┌──────────────────────────────────────────────────────▼──┐
│  Socket.IO Server (port 3001) — src/server/socket.js     │
│  Started via server.js at project root                    │
│  Shares MongoDB connection; uses same verifyToken()       │
└─────────────────────────────────────────────────────────┘
```

### Dev startup

`package.json` `dev` script changes from `next dev --webpack` to `node server.js`.

`server.js` (project root) starts the Socket.IO server on port 3001, then spawns Next.js programmatically via `next/dist/server/next.js` so both processes share the same terminal session. In production the Socket.IO process runs separately (e.g. `node src/server/socket.js`) alongside `next start`.


## Components and Interfaces

---

### 1. UI — Remove Box Shadows

**Files changed:** `StudentsTab.jsx`

**Problem:** The student card `motion.div` in `StudentsTab` has:
```js
whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
```
This violates the flat UI requirement and adds visual inconsistency.

**Fix:** Remove `boxShadow` from every `whileHover` target. Replace lift with border-color transition only:

```jsx
// Before
<motion.div
  whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
  className="... border border-slate-200 ..."
>

// After
<motion.div
  whileHover={{ y: -2 }}
  className="... border border-slate-200 hover:border-green-300 dark:hover:border-green-600 ..."
>
```

**Rule applied globally:** Any `whileHover`, `animate`, or `variants` object across all classroom components must not contain a `boxShadow` key. Use Tailwind `hover:border-*` for visual feedback instead. No `shadow`, `shadow-md`, or `shadow-*` Tailwind classes on card or panel elements.

**Idle border:** `border-gray-200 dark:border-slate-700`  
**Hover border:** `border-green-300 dark:border-green-600`  
**No transition needed for boxShadow** — remove it entirely.


---

### 2. Fork Content Panel Fix

**Files changed:** `ClassroomDetail.jsx`, `ForkContentPanel.jsx`

#### 2a. Auto-load on open

The current `useEffect` in `ClassroomDetail` only fires when `activeTab === "course"` AND `showForkPanel` changes. This means a second open (panel closed, re-opened on same tab) does not re-fetch. Replace with:

```js
// ClassroomDetail.jsx
useEffect(() => {
  if (showForkPanel && isInstructor) {
    fetchBrowseContent("all", "");
  }
}, [showForkPanel]); // deliberately narrow dep array — only react to panel toggle
```

The `fetchBrowseContent` ref is stable (via `useCallback`) so it is safe to omit from the dep array here. The intent is: every time the panel opens, trigger a fresh "all" fetch with no query.

#### 2b. Filter buttons — no stale closure

Current code in `ForkContentPanel` calls `onBrowse()` inside a filter button click, but `onBrowse` is `fetchBrowseContent` which closes over the `browseType` state that has not yet updated. Fix: pass type and query values directly, bypassing state:

```jsx
// ForkContentPanel.jsx — filter button onClick
onClick={() => {
  setBrowseType(value);                    // update UI highlight
  onBrowse(value, browseQuery);            // pass value directly, not from state
}}
```

`fetchBrowseContent(overrideType, overrideQuery)` already accepts overrides — the signature is unchanged, just callers must pass explicit values.

#### 2c. Session-persistent "Forked" badge

Current `forkedIds` is recomputed from `classroom.forkedContent` (a prop snapshot). This loses badges for items forked in the current session.

Fix: maintain a `Set` in `ClassroomDetail` state, initialized from `classroom.forkedContent` and updated on successful fork/unfork:

```js
// ClassroomDetail.jsx
const [forkedIdSet, setForkedIdSet] = useState(
  () => new Set(
    (classroom.forkedContent || []).map(
      (fc) => `${fc.contentType}-${fc.contentId?.toString()}`
    )
  )
);

// Inside handleForkContent, on data.success:
setForkedIdSet((prev) => new Set([...prev, `${contentType}-${contentId}`]));

// Inside handleUnforkContent, on data.success:
setForkedIdSet((prev) => {
  const next = new Set(prev);
  next.delete(`${contentType}-${contentId}`);
  return next;
});
```

Pass `forkedIdSet` into `classroomState` and into `ForkContentPanel`. The panel computes `isForked` as:

```js
const isForked = forkedIdSet.has(`${contentType}-${item.id}`);
```

#### 2d. 409 → badge, not error

In `handleForkContent`:

```js
if (res.status === 409) {
  // Item already forked — just mark it in session without error toast
  setForkedIdSet((prev) => new Set([...prev, `${contentType}-${contentId}`]));
  return;
}
```

#### 2e. Remove success/fail handling

The existing `handleUnforkContent` swallows errors. Update to show toasts:

```js
const handleUnforkContent = async (contentType, contentId, title) => {
  try {
    const res = await apiClient.delete(`/api/classrooms/${classroom.id}/fork`, { contentType, contentId });
    const data = await res.json();
    if (data.success) {
      setForkedContent((prev) => prev.filter(...));
      setForkedIdSet((prev) => { const s = new Set(prev); s.delete(...); return s; });
      toast.success(`"${title}" removed from classroom`);
    } else {
      toast.error(data.error || "Failed to remove content");
    }
  } catch {
    toast.error("Failed to remove content. Please try again.");
  }
};
```

#### 2f. Browse cap at 100 items/type

`src/app/api/classrooms/[id]/browse/route.js` — change `.limit(50)` to `.limit(100)` on all three collection queries (courses, quizzes, flashcards).


---

### 3. Course Banner Polish

**File changed:** `CourseTab.jsx`

#### 3a. Remove decorative blur element

Remove the absolutely-positioned div that creates a decorative background blob inside the hero:

```jsx
// Remove this element entirely from the hero section:
<div className="absolute top-3 right-3 w-32 h-32 rounded-full bg-green-500/5 blur-3xl" />
```

The hero's `relative overflow-hidden` wrapper and gradient background are retained.

#### 3b. Full-width description

Remove `max-w-2xl` from the description paragraph:

```jsx
// Before
<p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2 max-w-2xl">
  {classroom.description}
</p>

// After
<p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2 w-full">
  {classroom.description}
</p>
```

The outer `<div className="relative">` inside the hero already fills the padding-constrained hero width, so removing `max-w-2xl` lets the description text run the full banner content area. No other structural changes needed — the hero's gradient, `rounded-2xl`, and border are preserved as per requirement 3.5.


---

### 4. Students Section Redesign

**File changed:** `StudentsTab.jsx`  
**New API endpoint:** `DELETE /api/classrooms/[id]/enrollment`

#### 4a. Stats bar

Already rendered in the current `StudentsTab` as a 3-column grid. The metric cards need no box shadows. Verify styling uses only border + rounded corners.

#### 4b. Corrected grade thresholds

The current code uses `>= 80` for A, `>= 60` for B, `>= 40` for C. Update to match Canvas LMS conventions:

```js
// Shared grade utility — used in both the card list and StudentProfilePanel
function getGradeInfo(progress) {
  if (progress >= 90) return { label: "A", color: "#22c55e", bg: "bg-green-50 dark:bg-green-500/10", text: "text-green-600" };
  if (progress >= 75) return { label: "B", color: "#3b82f6", bg: "bg-blue-50 dark:bg-blue-500/10",  text: "text-blue-600" };
  if (progress >= 60) return { label: "C", color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600" };
  return                        { label: "D", color: "#ef4444", bg: "bg-red-50 dark:bg-red-500/10",   text: "text-red-600" };
}
```

Replace all inline threshold checks (`>= 80`, `>= 60`, `>= 40`) with calls to `getGradeInfo(progress)` throughout `StudentsTab` and `StudentProfilePanel`.

#### 4c. Search/filter — client-side, ≤100ms

Add `searchQuery` state to `StudentsTab`. Derive `filteredStudents` inline (no API call):

```js
const [searchQuery, setSearchQuery] = useState("");

const filteredStudents = students.filter((s) => {
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  return s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
});
```

Render a search input above the student grid:

```jsx
<input
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Search students..."
  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30"
/>
```

Empty-state when `filteredStudents.length === 0 && searchQuery`:

```jsx
<p className="text-xs text-center text-slate-400 py-6">No students match your search.</p>
```

#### 4d. Timestamp display — "Active today" vs "{N}d ago"

The existing inline IIFE already handles this correctly in `StudentProfilePanel`. Align the card list timestamp to use the same logic:

```js
const daysAgo = Math.floor((Date.now() - new Date(student.lastActivityAt)) / 86400000);
const label = daysAgo === 0 ? "Active today" : `${daysAgo}d ago`;
```

"Active today" condition: `daysAgo === 0`, which means the UTC-floored day difference is zero. This is calendar-day agnostic — `Math.floor(ms / 86400000)` gives 0 for anything within the current 24-hour rolling window, which aligns with requirement 4.6 ("active today = last activity date equals current calendar date in user's local timezone" is approximated safely by this threshold).

#### 4e. Remove-student action

Add a remove button to each student card (instructor only):

```jsx
{isInstructor && (
  <button
    onClick={() => handleRemoveStudent(student.id, student.name)}
    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
    title="Remove student"
  >
    <Trash2 className="w-3.5 h-3.5" />
  </button>
)}
```

Handler in `ClassroomDetail.jsx`:

```js
const handleRemoveStudent = async (studentId, studentName) => {
  try {
    const res = await apiClient.delete(`/api/classrooms/${classroom.id}/enrollment`, { studentId });
    const data = await res.json();
    if (data.success) {
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      toast.success(`${studentName} removed from classroom`);
    } else {
      toast.error(data.error || "Failed to remove student");
    }
  } catch {
    toast.error("Failed to remove student. Please try again.");
  }
};
```

Pass `handleRemoveStudent` through `classroomState`.


---

### 5. Real-Time Chat (Socket.IO)

#### 5a. New files

| Path | Purpose |
|---|---|
| `src/server/socket.js` | Socket.IO server — auth, rooms, persistence |
| `server.js` | Project root entry — starts socket.js + Next.js |
| `src/app/components/classroom/ClassroomChat.jsx` | Chat UI component |
| `src/models/ClassroomMessage.js` | Mongoose model |

#### 5b. `server.js` (project root)

```js
const { createServer } = require("http");
const next = require("next");
const { initSocketServer } = require("./src/server/socket");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  initSocketServer(httpServer);
  const port = parseInt(process.env.PORT || "3000", 10);
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
```

Update `package.json` dev/start scripts:

```json
"dev":   "node server.js",
"start": "NODE_ENV=production node server.js"
```

#### 5c. `src/server/socket.js`

```js
const { Server } = require("socket.io");
const { connectToDatabase } = require("../app/lib/mongodb");
const { verifyToken } = require("../app/lib/auth");
const mongoose = require("mongoose");

// Lazy-load ClassroomMessage to avoid Next.js module boundary issues
let ClassroomMessage;

function getModel() {
  if (!ClassroomMessage) {
    ClassroomMessage = require("../models/ClassroomMessage").default;
  }
  return ClassroomMessage;
}

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  // Auth middleware — runs before connection is established
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
      || socket.handshake.headers?.cookie?.match(/token=([^;]+)/)?.[1];

    if (!token) {
      return next(Object.assign(new Error("Authentication required"), { data: { code: 401 } }));
    }
    try {
      const decoded = verifyToken(token);
      const { db } = await connectToDatabase();
      const user = await db.collection("users").findOne(
        { _id: new mongoose.Types.ObjectId(decoded.id) },
        { projection: { _id: 1, name: 1, email: 1, role: 1, status: 1 } }
      );
      if (!user || user.status !== "active") {
        return next(Object.assign(new Error("Unauthorized"), { data: { code: 401 } }));
      }
      socket.user = { id: user._id.toString(), name: user.name, role: user.role };
      next();
    } catch {
      next(Object.assign(new Error("Invalid token"), { data: { code: 401 } }));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[chat] connected: ${socket.user.id}`);

    socket.on("join_room", async ({ classroomId }) => {
      if (!classroomId) return;
      try {
        const { db } = await connectToDatabase();
        const classroom = await db.collection("classrooms").findOne(
          { _id: new mongoose.Types.ObjectId(classroomId) },
          { projection: { instructorId: 1 } }
        );
        if (!classroom) {
          return socket.emit("authorization_error", { message: "Classroom not found" });
        }
        const isInstructor = classroom.instructorId.toString() === socket.user.id;
        if (!isInstructor) {
          const enrollment = await db.collection("enrollments").findOne({
            classroomId: new mongoose.Types.ObjectId(classroomId),
            studentId: new mongoose.Types.ObjectId(socket.user.id),
            status: "active",
          });
          if (!enrollment) {
            return socket.emit("authorization_error", { message: "Not enrolled in this classroom" });
          }
        }
        socket.join(classroomId);

        // Deliver last 50 messages
        const Model = getModel();
        const history = await Model.find({ classroomId })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        socket.emit("message_history", history.reverse());
      } catch (err) {
        console.error("[chat] join_room error:", err);
        socket.emit("authorization_error", { message: "Failed to join room" });
      }
    });

    socket.on("send_message", async ({ classroomId, content }) => {
      if (!content || typeof content !== "string") return;
      const trimmed = content.trim();
      if (!trimmed || trimmed.length > 2000) return;

      try {
        const Model = getModel();
        const message = await Model.create({
          classroomId,
          senderId: socket.user.id,
          senderName: socket.user.name,
          senderRole: socket.user.role,
          content: trimmed,
          createdAt: new Date(),
        });
        const payload = {
          _id: message._id.toString(),
          classroomId,
          senderId: socket.user.id,
          senderName: socket.user.name,
          senderRole: socket.user.role,
          content: trimmed,
          createdAt: message.createdAt.toISOString(),
        };
        io.to(classroomId).emit("new_message", payload);
      } catch (err) {
        console.error("[chat] send_message error:", err);
      }
    });

    // Throttle is enforced client-side; server just relays
    socket.on("typing", ({ classroomId }) => {
      if (classroomId) {
        socket.to(classroomId).emit("user_typing", {
          userId: socket.user.id,
          userName: socket.user.name,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[chat] disconnected: ${socket.user.id}`);
    });
  });

  return io;
}

module.exports = { initSocketServer };
```


#### 5d. `ClassroomChat.jsx` — component interface

```jsx
// src/app/components/classroom/ClassroomChat.jsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { Send, MessageSquare, Loader2, AlertCircle } from "lucide-react";

const MAX_CHARS = 2000;
const TYPING_THROTTLE_MS = 2000;

export default function ClassroomChat({ classroomId, user }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [connectionState, setConnectionState] = useState("connecting");
  //  "connecting" | "connected" | "retrying" | "failed"
  const [retryCount, setRetryCount] = useState(0);
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);
  const lastTypingEmit = useRef(0);

  // ... (full implementation described below)
}
```

**Connection lifecycle:**

1. On mount: create `io(SOCKET_URL, { auth: { token }, transports: ["websocket"] })`.
2. `connect` event → set state to `"connected"`, join room via `socket.emit("join_room", { classroomId })`.
3. `connect_error` event → increment `retryCount`. If `retryCount < 3`, set state to `"retrying"` (socket.io handles exponential backoff natively via `reconnectionDelay`). If `retryCount >= 3`, set state to `"failed"`.
4. `message_history` event → `setMessages(history)`.
5. `new_message` event → `setMessages(prev => [...prev, msg])`.
6. `user_typing` event → add user to `typingUsers`, debounce removal after 3s.
7. `authorization_error` event → show inline error, do not disconnect socket.
8. On unmount: `socket.disconnect()`.

`SOCKET_URL` = `process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000"`. When running as a single `server.js` process the socket server is attached to the same HTTP server as Next.js on port 3000, so no separate port is needed.

**Sending a message:**

```js
const handleSend = () => {
  const trimmed = input.trim();
  if (!trimmed) { setInputError("Message cannot be empty"); return; }
  if (trimmed.length > MAX_CHARS) { setInputError(`Message too long (max ${MAX_CHARS} chars)`); return; }
  setInputError("");
  socket.emit("send_message", { classroomId, content: trimmed });
  setInput("");
};
```

**Typing indicator — throttled:**

```js
const handleInputChange = (e) => {
  setInput(e.target.value);
  const now = Date.now();
  if (now - lastTypingEmit.current > TYPING_THROTTLE_MS) {
    socket.emit("typing", { classroomId });
    lastTypingEmit.current = now;
  }
};
```

**Message bubble layout:**

```jsx
const isMine = msg.senderId === user._id?.toString();
<div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
  <div className={`max-w-[70%] rounded-2xl px-3 py-2 ${
    isMine
      ? "bg-green-500 text-white rounded-br-sm"
      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm"
  }`}>
    {!isMine && (
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-[10px] font-bold">{msg.senderName}</span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold
          ${msg.senderRole === "instructor"
            ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"
            : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
          }`}>
          {msg.senderRole === "instructor" ? "Instructor" : "Student"}
        </span>
      </div>
    )}
    <p className="text-xs leading-relaxed break-words">{msg.content}</p>
    <p className={`text-[9px] mt-0.5 ${isMine ? "text-green-100" : "text-slate-400"}`}>
      {formatTimestamp(msg.createdAt)}
    </p>
  </div>
</div>
```

**`formatTimestamp(isoString)`:**

```js
function formatTimestamp(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (seconds < 60)  return "Just now";
  if (minutes < 60)  return `${minutes} min ago`;
  if (hours < 24)    return `${hours} hr ago`;
  return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
```


#### 5e. Wiring Chat tab in `ClassroomDetail.jsx`

Add `MessageSquare` to existing imports (it is already imported). Add `{ id: "chat", label: "Chat", icon: MessageSquare }` to both `instructorTabs` and `studentTabs`:

```js
const instructorTabs = [
  { id: "course",       label: "Course",       icon: BookOpen },
  { id: "schedule",     label: "Schedule",     icon: Calendar },
  { id: "assignments",  label: "Assignments",  icon: ClipboardList },
  { id: "grades",       label: "Grades",       icon: BarChart2 },
  { id: "analytics",    label: "Analytics",    icon: TrendingUp },
  { id: "discussions",  label: "Discussions",  icon: MessageSquare },
  { id: "notes",        label: "Notes",        icon: StickyNote },
  { id: "materials",    label: "Materials",    icon: Layers },
  { id: "students",     label: "Students",     icon: Users },
  { id: "chat",         label: "Chat",         icon: MessageSquare }, // NEW
  { id: "settings",     label: "Settings",     icon: Settings },
];

const studentTabs = [
  { id: "course",       label: "Course",       icon: BookOpen },
  { id: "assignments",  label: "Assignments",  icon: ClipboardList },
  { id: "grades",       label: "Grades",       icon: BarChart2 },
  { id: "discussions",  label: "Discussions",  icon: MessageSquare },
  { id: "notes",        label: "Notes",        icon: StickyNote },
  { id: "materials",    label: "Materials",    icon: Layers },
  { id: "chat",         label: "Chat",         icon: MessageSquare }, // NEW
];
```

Add to the tab render switch (in the main content area):

```jsx
import ClassroomChat from "./ClassroomChat";

// Inside the tab content render:
{activeTab === "chat" && (
  <ClassroomChat classroomId={classroom.id} user={user} />
)}
```

Pass `user` down from `ClassroomDetail` props — it is already received as a prop but not currently in `classroomState`. Add it:

```js
const classroomState = {
  ...
  user, // ADD — needed by ClassroomChat and GradesTab permission filtering
};
```


---

### 6. Role-Based Permission System

**Files changed:** `ClassroomDetail.jsx`, `GradesTab.jsx`, `AssignmentsTab.jsx`, `DiscussionsTab.jsx`, `MaterialsTab.jsx`, `CourseTab.jsx`, and multiple API route files.

#### 6a. `isInstructor` with null safety

Update every location that checks instructor identity to use optional chaining:

```js
// Computed server-side in src/app/api/classrooms/route.js (already correct pattern)
const isInstructor = classroom.instructorId?.toString() === user._id?.toString();
```

In `ClassroomDetail.jsx`, the value comes from `classroom.isInstructor` (set by the API). No client-side recomputation is needed. However, add a fallback:

```js
const isInstructor = classroom.isInstructor ?? false;
```

In API route handlers that currently use `===` directly (e.g. `fork/route.js` line: `classroom.instructorId.toString() !== user._id.toString()`), add null guards:

```js
if (!classroom.instructorId || !user._id ||
    classroom.instructorId.toString() !== user._id.toString()) {
  return NextResponse.json({ error: "Access denied" }, { status: 403 });
}
```

#### 6b. Instructor-only tab hiding

The current `studentTabs` array already omits `analytics`, `students`, and `settings`. This ensures those tab navigation items are not rendered in the DOM for students. The pattern is correct — the tab list is built at render time based on `isInstructor`. No additional DOM-level hiding is needed beyond keeping the two separate tab arrays.

#### 6c. API route 403 guards

All mutating endpoints already use `withAuth` (returns 401 for unauthenticated) and manually check `instructorId` (returns 403 for unauthorized). The null-guard update in 6a applies to:

- `POST /api/classrooms/[id]/fork`
- `DELETE /api/classrooms/[id]/fork`
- `PATCH /api/classrooms/[id]/fork`
- `POST /api/classrooms/[id]/assignments`
- `POST /api/classrooms/[id]/announcements`
- `POST /api/classrooms/[id]/materials`
- `DELETE /api/classrooms/[id]/enrollment` (new endpoint)

#### 6d. `GradesTab` — student sees only own grades

Pass `user` through `classroomState`. In `GradesTab.jsx`:

```js
const { grades, gradesLoading, handleExportGrades, isInstructor, user } = classroomState;

const visibleGrades = isInstructor
  ? grades
  : grades.filter((g) => g.studentId?.toString() === user._id?.toString());
```

Replace all references to `grades` in the render with `visibleGrades`. Do not render the export button for students:

```jsx
{isInstructor && (
  <button onClick={handleExportGrades}>Export CSV</button>
)}
```

#### 6e. `AssignmentsTab` — hide instructor controls from students

```jsx
{isInstructor && (
  <button onClick={() => setShowCreateAssignment(true)}>
    <Plus className="w-4 h-4" /> Create Assignment
  </button>
)}
```

Any delete/edit controls on individual assignment cards are also gated on `isInstructor`.

#### 6f. `DiscussionsTab` — `allowStudentPosts` gate

```jsx
const canPost = isInstructor || classroom.settings?.allowStudentPosts === true;

{canPost ? (
  <button onClick={() => setShowNewDiscussion(true)}>New Discussion</button>
) : (
  <p className="text-xs text-slate-400 italic">
    Discussion posting is disabled for students in this classroom.
  </p>
)}
```

The same `canPost` flag gates the reply form within a selected discussion.

#### 6g. `MaterialsTab` — hide add/edit/delete from students

```jsx
{isInstructor && (
  <button onClick={() => setShowNewMaterial(true)}>Add Material</button>
)}
// Per-item edit and delete buttons also wrapped in {isInstructor && ...}
```

#### 6h. `CourseTab` — hide instructor-only action buttons from students

```jsx
{isInstructor && (
  <div className="flex gap-2 flex-wrap">
    <button onClick={() => setShowForkPanel(!showForkPanel)}>Fork Content</button>
    {/* Generate Course Structure button */}
    {classroom.durationWeeks > 0 && !courseModules?.length && (
      <button onClick={handleGenerateCourseStructure}>Generate Course Structure</button>
    )}
  </div>
)}

{/* "Add More" inside Linked Content section */}
{isInstructor && (
  <button onClick={() => setShowForkPanel(true)}>
    <Plus className="w-3 h-3" /> Add More
  </button>
)}
```


---

## Data Models

### `ClassroomMessage` Mongoose model

**File:** `src/models/ClassroomMessage.js`

```js
import mongoose from "mongoose";

const ClassroomMessageSchema = new mongoose.Schema(
  {
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    senderRole: {
      type: String,
      enum: ["instructor", "admin", "student"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false, versionKey: false }
);

// Compound index for efficient per-classroom history queries
ClassroomMessageSchema.index({ classroomId: 1, createdAt: -1 });

const ClassroomMessage =
  mongoose.models.ClassroomMessage ||
  mongoose.model("ClassroomMessage", ClassroomMessageSchema);

export default ClassroomMessage;
```

**MongoDB collection name:** `classroommessages`

**Query pattern for last-50 history:**
```js
await ClassroomMessage.find({ classroomId })
  .sort({ createdAt: -1 })
  .limit(50)
  .lean();
// Results reversed before emitting so client receives chronological order
```


---

## API Design

### Existing endpoints — changes required

#### `GET /api/classrooms/[id]/browse`

**Change:** Increase per-type result cap from 50 to 100.

```js
// All three .limit(50) calls → .limit(100)
.limit(100)
```

Response shape unchanged: `{ success: true, courses: [...], quizzes: [...], flashcards: [...] }`

#### `POST /api/classrooms/[id]/fork`

**Change:** Add null guard before instructor check. Response already correct per requirements (`{ success: true, forked: { ...entry, contentId: string } }`).

**409 response** (already implemented):
```json
{ "error": "Already forked" }
```
Client interprets 409 as "mark badge, no toast error".

---

### New endpoint: `DELETE /api/classrooms/[id]/enrollment`

**File:** `src/app/api/classrooms/[id]/enrollment/route.js`

**Auth:** `combineMiddleware(withErrorHandling, withCsrf, withAuth)`

**Request body:**
```json
{ "studentId": "ObjectId string" }
```

**Handler logic:**
1. Verify caller is classroom instructor (null-safe check). Return 403 if not.
2. Find `Enrollment` document with `{ classroomId: id, studentId, status: "active" }`. Return 404 if not found.
3. Set `enrollment.status = "removed"` and `enrollment.removedAt = new Date()`. Save.
4. Return `{ success: true }`.

**Response on success:**
```json
{ "success": true }
```

**Response on instructor check failure:**
```json
{ "error": "Access denied" }   // HTTP 403
```

**Response on enrollment not found:**
```json
{ "error": "Enrollment not found" }   // HTTP 404
```

---

### Socket.IO protocol

| Direction | Event | Payload | Notes |
|---|---|---|---|
| Client → Server | `join_room` | `{ classroomId: string }` | Triggers enrollment check + history emit |
| Server → Client | `message_history` | `ClassroomMessage[]` | Last 50, chronological order |
| Client → Server | `send_message` | `{ classroomId: string, content: string }` | Validated server-side; content ≤ 2000 chars |
| Server → All in room | `new_message` | `{ _id, classroomId, senderId, senderName, senderRole, content, createdAt }` | Broadcast including sender |
| Client → Server | `typing` | `{ classroomId: string }` | Throttled to 1 emit/2s by client |
| Server → Room (excl. sender) | `user_typing` | `{ userId, userName }` | Relayed only to others |
| Server → Client | `authorization_error` | `{ message: string }` | Room join denied; socket stays connected |

**Connection auth:** Token passed in `socket.handshake.auth.token`. The server also tries to extract from the `cookie` header as a fallback (for cookie-based auth). If neither yields a valid JWT, the connection is rejected with error code `401` before the `connection` event fires. The client sees this as a `connect_error`.


---

## Error Handling

### Fork Content Panel

| Scenario | Client behavior |
|---|---|
| `fetchBrowseContent` returns non-200 or times out (>10s) | Show "Failed to load content. Please try again." + Retry button that calls `fetchBrowseContent(browseType, browseQuery)` |
| Empty results for authenticated user | Show "No content found. Create courses, quizzes, or flashcards first to fork them here." |
| Fork POST returns 409 | Add to `forkedIdSet`; show no error toast |
| Fork POST returns other error | `toast.error(data.error || "Failed to fork")` |
| Unfork DELETE fails | Retain item in list; `toast.error(data.error || "Failed to remove content")` |

**Timeout implementation for browse fetch:**

```js
const fetchBrowseContent = useCallback(async (overrideType, overrideQuery) => {
  setBrowseLoading(true);
  setBrowseError(null);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await apiClient.get(`...`, { signal: controller.signal });
    // ...
  } catch (e) {
    if (e.name === "AbortError") {
      setBrowseError("timeout");
    } else {
      setBrowseError("fetch_failed");
    }
  } finally {
    clearTimeout(timeout);
    setBrowseLoading(false);
  }
}, [...]);
```

Add `browseError` state to `ClassroomDetail` and pass through `classroomState`.

### Student Removal

| Scenario | Client behavior |
|---|---|
| DELETE succeeds | Remove student from list immediately; `toast.success(...)` |
| DELETE returns error | Keep student in list; `toast.error(data.error || "Failed to remove student")` |
| Network error | Keep student in list; `toast.error("Failed to remove student. Please try again.")` |

### Chat

| Scenario | Client behavior |
|---|---|
| Socket `connect_error` (attempt 1–2) | Show "Connection failed. Retrying…" banner; socket.io auto-retries |
| Socket `connect_error` (attempt 3+) | Show "Chat unavailable" error state with a manual retry button |
| `authorization_error` event | Show inline error: "You do not have access to this classroom's chat." |
| `send_message` with empty content | Inline error below input: "Message cannot be empty." No emit. |
| `send_message` with content > 2000 chars | Inline error below input: "Message too long (max 2000 characters)." No emit. |
| Server fails to persist message | `new_message` is not broadcast; client sees no update. No explicit client error — message silently fails. (Future: acknowledgement callbacks can improve this.) |

### Permission system

| Scenario | Response |
|---|---|
| Unauthenticated request to any protected endpoint | `401 { error: "Authentication required", code: "AUTH_REQUIRED" }` |
| Authenticated student calls instructor-only endpoint | `403 { error: "Access denied" }` |
| `classroom.instructorId` or `user._id` is undefined | `isInstructor` resolves to `false`; request blocked as student |


---

## Testing Strategy

The project uses Vitest + `@testing-library/react` + MSW for mocking. Tests live under `src/__tests__/` or co-located `*.test.jsx` files.

### 1. UI — Box Shadow removal

**Test approach:** Snapshot / DOM assertion.

- Render a `StudentsTab` with mock students.
- Assert that the rendered `motion.div` student cards have no `style` attribute containing `box-shadow`.
- Assert that `whileHover` prop on each card does not include `boxShadow` key (inspect via `framer-motion` mock that captures animation props).

### 2. Fork Content Panel

**Unit tests (ForkContentPanel.jsx):**
- Render with `browseLoading=true` → loading skeletons appear.
- Render with empty results → "No content found..." message visible.
- Click filter button "Courses" → `onBrowse("course", "")` called immediately (no Search click needed).
- Item with `forkedIdSet` containing its key → button shows "Forked" and is disabled.
- Clicking Fork button on unforked item → `onForkContent` called with correct `(contentType, contentId, title)`.

**Integration tests (ClassroomDetail + ForkContentPanel via MSW):**
- Set `showForkPanel` to true → `GET /browse?type=all` fires automatically.
- Mock POST fork returning 409 → item shows "Forked" badge, no error toast.
- Mock DELETE unfork returning error → item remains in list, error toast shown.

### 3. Course Banner

**Unit tests (CourseTab.jsx):**
- Render with `classroom.description = "Test description"` → `<p>` element has `w-full` class, no `max-w-2xl` class.
- The hero section has no child element with `blur-3xl` class.
- Hero retains `rounded-2xl` and `border` classes.

### 4. Students Section

**Unit tests (StudentsTab.jsx):**
- `getGradeInfo(95)` → `{ label: "A" }`.
- `getGradeInfo(80)` → `{ label: "B" }` (not "A" — threshold is 90, not 80).
- `getGradeInfo(75)` → `{ label: "B" }`.
- `getGradeInfo(65)` → `{ label: "C" }`.
- `getGradeInfo(50)` → `{ label: "D" }`.
- Render with `students`, type in search box → only matching student cards rendered within the same render cycle (100ms assertion with `act`).
- Search with no matches → "No students match your search." visible.
- Click Remove button on student card → DELETE API called; on success, card removed from DOM and success toast shown.
- Mock DELETE returning error → card remains, error toast shown.

**Timestamp tests:**
- `student.lastActivityAt = new Date().toISOString()` → displays "Active today".
- `student.lastActivityAt = new Date(Date.now() - 5 * 86400000).toISOString()` → displays "5d ago".

### 5. Real-Time Chat

**Unit tests (ClassroomChat.jsx — socket mocked):**
- Mock `socket.io-client` with a fake socket.
- Emit `message_history` with 3 messages → all 3 rendered.
- Emit `new_message` → message appended to list.
- Own message (`senderId === user._id`) → right-aligned green bubble.
- Other's message → left-aligned, shows sender name + role badge.
- Submit empty input → inline error shown, `send_message` not emitted.
- Submit 2001-char input → inline error shown, `send_message` not emitted.
- `authorization_error` event → error message rendered.
- 3 `connect_error` events → "Chat unavailable" state rendered.

**`formatTimestamp` unit tests:**
- 30 seconds ago → "Just now".
- 5 minutes ago → "5 min ago".
- 2 hours ago → "2 hr ago".
- 25 hours ago → formatted date string.

**Socket.IO server tests (Node.js, mocked MongoDB):**
- Unauthenticated connection (no token) → `connect_error` with code 401.
- Valid token, `join_room` for non-enrolled classroom → `authorization_error` emitted.
- Valid token, `join_room` for enrolled classroom → `message_history` emitted with last 50 messages.
- `send_message` with content > 2000 chars → message NOT persisted, NOT broadcast.
- `send_message` with valid content → `ClassroomMessage` created in DB, `new_message` broadcast to room.
- `typing` event → relayed to all room members except sender.

### 6. Role-Based Permissions

**Unit tests:**
- `isInstructor = false` → Analytics, Students, Settings tab IDs absent from rendered nav.
- `isInstructor = false` → "Fork Content" button absent from CourseTab.
- `isInstructor = false` → "Create Assignment" button absent from AssignmentsTab.
- `isInstructor = false`, `allowStudentPosts = false` → "New Discussion" form absent, read-only notice shown.
- `isInstructor = false`, `allowStudentPosts = true` → "New Discussion" form present.
- `isInstructor = false` → "Add Material" button absent from MaterialsTab.
- `GradesTab` with `isInstructor = false` → only grades where `g.studentId === user._id` rendered.

**API integration tests (MSW or supertest):**
- Student token calling `POST /fork` → 403 response.
- No token calling `GET /classrooms/[id]` → 401 response.
- `classroom.instructorId = undefined` → `isInstructor` resolves to `false`.


---

## Correctness Properties

These properties capture invariants that must hold at all times, independent of test case specifics. They are suitable for property-based verification.

### Property 1: `isInstructor` is deterministic and null-safe

**Validates: Requirements 6.13, 6.14**

For any `(classroomInstructorId, userId)` pair, `isInstructor` equals `true` if and only if both values are defined, non-null, and their string representations are equal. If either is `undefined` or `null`, `isInstructor` is `false`.

```
∀ (instructorId, userId):
  isInstructor(instructorId, userId) = true
    ⟺ instructorId ≠ null ∧ userId ≠ null ∧ instructorId.toString() = userId.toString()
```

### Property 2: Forked badge monotonicity within a session

**Validates: Requirements 2.3, 2.4**

Once an item enters the `forkedIdSet`, it remains there for the lifetime of the page session unless the user explicitly removes it via the unlink action. A 409 response from the fork API must also add to the set, not remove it.

```
∀ forkAttempt:
  POST fork → 2xx ∨ 409 ⟹ item ∈ forkedIdSet
  DELETE unfork → 2xx ⟹ item ∉ forkedIdSet
  DELETE unfork → non-2xx ⟹ item ∈ forkedIdSet (unchanged)
```

### Property 3: Grade threshold ordering

**Validates: Requirements 4.2**

Grade labels are a total order on `[0, 100]` with no gaps and no overlaps:

```
progress ∈ [90, 100] → "A"
progress ∈ [75, 89]  → "B"
progress ∈ [60, 74]  → "C"
progress ∈ [0,  59]  → "D"
```

Every integer in `[0, 100]` maps to exactly one grade label. No integer maps to two labels.

### Property 4: Chat message content invariant

**Validates: Requirements 5.3, 5.17**

A `send_message` event is only emitted by the client and persisted by the server when:
- `content.trim().length > 0`
- `content.trim().length ≤ 2000`

Messages violating either constraint are never broadcast and never written to the `ClassroomMessage` collection.

### Property 5: Student visibility in grades tab

**Validates: Requirements 6.10**

For any authenticated student `S` in classroom `C`, the set of grade records rendered in `GradesTab` is a subset of `{ g | g.studentId = S._id }`. No grade record belonging to a different student is ever included in the rendered output when `isInstructor = false`.

### Property 6: Browse result count bounded

**Validates: Requirements 2.8**

For any valid browse request, the count of returned items for each content type satisfies:

```
|courses| ≤ 100 ∧ |quizzes| ≤ 100 ∧ |flashcards| ≤ 100
```

### Property 7: Socket auth rejection completeness

**Validates: Requirements 5.11**

Any Socket.IO connection attempt without a valid, non-expired JWT in `handshake.auth.token` or the `token` cookie is rejected before the `connection` event fires. The server never emits `message_history` or `new_message` to a socket that has not passed the auth middleware.

### Property 8: Instructor-only tab DOM exclusion

**Validates: Requirements 6.3**

For any `isInstructor = false` render of `ClassroomDetail`, the DOM contains no elements with `data-tab-id` (or equivalent identifier) equal to `"analytics"`, `"students"`, or `"settings"`. These nodes are absent from the React tree, not merely hidden via CSS.

