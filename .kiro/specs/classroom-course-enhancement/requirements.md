# Requirements Document

## Introduction

This feature enhances the Classroom Course section of the Actinova AI Tutor web application (Next.js). It covers six areas: UI polish (remove box shadows), fixing the fork content workflow, course banner improvements (hide decorative dots, full-width content), a redesigned students section with an improved student profile view, a real-time Socket.IO chat channel between instructors and students, and a Canvas LMS-inspired role-based permission system that prevents students from performing instructor-only actions.

The classroom section is built in Next.js with React components located under `src/app/components/classroom/`. The backend uses Next.js API routes under `src/app/api/classrooms/` backed by MongoDB via Mongoose. A new Socket.IO server will be introduced for real-time messaging.

## Glossary

- **Classroom**: A virtual course space created by an Instructor and joined by Students via an invite code.
- **Instructor**: A user with `role === "instructor"` or `role === "admin"` who owns and manages a Classroom.
- **Student**: A user enrolled in a Classroom with `role === "student"`.
- **Enrollment**: A MongoDB document linking a Student to a Classroom (model: `Enrollment`).
- **Forked Content**: A course, quiz, or flashcard set linked into a Classroom by an Instructor (stored in `classroom.forkedContent`).
- **Course Banner**: The hero section at the top of the Course tab (`CourseTab.jsx`) that displays the classroom name, subject, tags, and description.
- **Socket.IO Server**: A Node.js WebSocket server that enables real-time bidirectional communication for the Classroom Chat feature.
- **Classroom Chat**: A real-time messaging channel scoped to a single Classroom, accessible to Instructors and enrolled Students.
- **Permission Guard**: A server-side or client-side check that verifies the caller's role before allowing a protected action.
- **Chat_Server**: The Socket.IO server component responsible for managing chat rooms and message delivery.
- **Chat_Client**: The React component responsible for connecting to the Chat_Server and rendering the chat UI.
- **Permission_System**: The combination of server-side API middleware and client-side UI guards that enforce role-based access control within a Classroom.
- **ClassroomDetail**: The main React component (`ClassroomDetail.jsx`) that renders the tabbed classroom view.
- **StudentsTab**: The React component (`StudentsTab.jsx`) that lists enrolled students and shows individual student profiles.
- **StudentProfile**: The profile panel within `StudentsTab` that shows a single student's progress, grades, and activity.
- **ForkContentPanel**: The React component (`ForkContentPanel.jsx`) that allows Instructors to search for and link content into a Classroom.

## Requirements

---

### Requirement 1: Remove Box Shadows from Classroom Course Section

**User Story:** As a student or instructor, I want the classroom interface to have a clean, flat visual style, so that the UI feels modern and consistent.

#### Acceptance Criteria

1. THE ClassroomDetail SHALL render all classroom card elements, course panel elements, tab container elements, and content section panel elements without any `box-shadow` property applied via inline styles, Tailwind utility classes (e.g. `shadow`, `shadow-md`), or Framer Motion animation targets.
2. THE ClassroomDetail SHALL use `border` and `border-radius` for visual separation in place of `box-shadow`.
3. WHEN a student card in `StudentsTab` is in its idle state, THE StudentsTab SHALL apply `border-gray-200` as the baseline border color. WHEN the student card is hovered, THE StudentsTab SHALL transition the border color to `border-green-300` with no `box-shadow` property applied during or after the hover transition.
4. IF a `whileHover` Framer Motion animation target is defined on a classroom card, THEN THE ClassroomDashboard SHALL not include a `boxShadow` key in that animation target object.

---

### Requirement 2: Fix Fork Content Functionality

**User Story:** As an instructor, I want the Fork Content panel to reliably search, display, and link my existing courses, quizzes, and flashcards into a classroom, so that I can reuse my own content without manually re-creating it.

#### Acceptance Criteria

1. WHEN the Fork Content panel opens and the browse query is empty, THE ForkContentPanel SHALL automatically trigger a browse fetch for all content types, display a loading indicator within 200ms of opening, and show results within 10 seconds of the fetch completing.
2. WHEN an Instructor clicks a content-type filter button (Courses, Quizzes, Flashcards, All), THE ForkContentPanel SHALL display a loading indicator within 200ms and show updated results within 10 seconds without requiring a separate Search button click.
3. WHEN an Instructor successfully forks a content item, THE ForkContentPanel SHALL display a "Forked" badge on that item and disable its Fork button until the page is reloaded or the user logs out.
4. IF the fork API call returns a `409 Conflict` response AND the server confirms the item is already forked, THEN THE ForkContentPanel SHALL display the item with a "Forked" badge rather than showing an error.
5. WHEN an Instructor removes a forked item via the Trash icon in the Linked Content section and the removal API call succeeds, THE CourseTab SHALL immediately remove that item from the Linked Content list without requiring a page refresh.
6. IF the removal API call for a forked item fails, THEN THE CourseTab SHALL retain the item in the Linked Content list and display an error toast notification.
7. THE fork API endpoint (`POST /api/classrooms/[id]/fork`) SHALL return `{ success: true, forked: { ...entry } }` where `entry.contentId` is serialized as a string.
8. WHEN the browse API (`GET /api/classrooms/[id]/browse`) is called, THE browse endpoint SHALL return only content owned by the authenticated user (matching `userId` or `instructorId` fields on the source documents) up to a maximum of 100 items per content type per request.
9. IF the browse query is empty and no results exist for the authenticated user, THEN THE ForkContentPanel SHALL display the message "No content found. Create courses, quizzes, or flashcards first to fork them here."
10. IF the browse API fetch times out (exceeds 10 seconds) or returns a non-200 response, THEN THE ForkContentPanel SHALL display an error message "Failed to load content. Please try again." and show a Retry button.

---

### Requirement 3: Course Banner — Hide Decorative Dots and Full-Width Content

**User Story:** As a student or instructor, I want the course banner at the top of the Course tab to display cleanly without decorative dot patterns, and I want the banner content (classroom name, description, tags) to use the full available width, so that the banner looks polished and information is easy to read.

#### Acceptance Criteria

1. THE CourseTab SHALL not render any decorative dot-pattern or polka-dot background overlay elements inside the course hero banner.
2. WHEN the course banner renders, THE CourseTab SHALL render all banner content (title, subject, description, tags) in a container that occupies 100% of the rendered banner width with no narrower inner wrapper constraint applied to it.
3. THE CourseTab hero section SHALL render the description element at 100% of the banner content container width, with no CSS class or inline style constraining it to a narrower fixed or max-width value.
4. WHEN the course banner is displayed on screens wider than 640px, THE CourseTab SHALL lay out the banner content so that the right edge of each content element (title, description, tags) aligns with the banner container's right inner boundary, with no content clipped or offset inward by padding applied only to the right side.
5. THE CourseTab hero section SHALL retain its gradient background, rounded corners, and border while removing decorative overlay elements.

---

### Requirement 4: Redesign Students Section and Student Profile View

**User Story:** As an instructor, I want a more informative and visually engaging students section and student profile view, so that I can quickly assess individual student performance and take action.

#### Acceptance Criteria

1. THE StudentsTab SHALL display a summary stats bar at the top showing Total Students, Active Students (students with activity within the last 7 days), and Average Progress as metric cards.
2. WHEN the student list is rendered, THE StudentsTab SHALL display each student as a card containing: avatar initial, full name, email, a color-coded grade badge (A: ≥90%, B: ≥75%, C: ≥60%, D: <60%), a progress bar, completed/total assignments count, and time spent.
3. WHEN an Instructor clicks "View Profile" on a student card, THE StudentsTab SHALL render the `StudentProfile` panel with the selected student's detailed information within 100ms of the click.
4. THE StudentProfile SHALL display: a gradient profile header with avatar, name, email, last-active status, a circular progress indicator, an overall progress percentage, and a 2×2 stats grid (Completed, Time Spent, Remaining, Avg Score).
5. WHEN the student has not been active in the last 24 hours, THE StudentProfile SHALL display the last-active date in the format "{N}d ago" where N is the number of whole days elapsed since last activity.
6. WHEN the student was active today (last activity date equals the current calendar date in the user's local timezone), THE StudentProfile SHALL display "Active today" in the last-active section.
7. WHEN an instructor types in the search/filter input, THE StudentsTab SHALL filter the displayed student list to only cards whose name or email contains the typed string (case-insensitive) within 100ms of the last keystroke, without an API call.
8. WHEN the filtered student list is empty due to an active search filter, THE StudentsTab SHALL display a no-results message: "No students match your search."
9. WHEN the student list is empty and no search filter is active, THE StudentsTab SHALL display an empty state with an Invite Students call-to-action.
10. THE StudentsTab SHALL support an Instructor action to remove a student from the classroom by calling `DELETE /api/classrooms/[id]/enrollment` with the student's ID.
11. WHEN an Instructor removes a student and the API call succeeds, THE StudentsTab SHALL immediately remove that student from the displayed list and show a success toast notification.
12. IF the student removal API call fails, THEN THE StudentsTab SHALL retain the student in the displayed list and show an error toast notification with the server's error message.

---

### Requirement 5: Real-Time Classroom Chat (Socket.IO)

**User Story:** As an instructor or student, I want a real-time chat channel within each classroom, so that I can communicate directly with my instructor or students without leaving the platform.

#### Acceptance Criteria

1. THE Classroom SHALL have a "Chat" tab visible to both Instructors and enrolled Students in the classroom tab navigation.
2. WHEN a user opens the Chat tab, THE Chat_Client SHALL establish a Socket.IO connection to the Chat_Server and join the room identified by the classroom ID. IF the Socket.IO connection attempt fails, THEN THE Chat_Client SHALL display a "Connection failed. Retrying…" message and retry with exponential backoff up to 3 attempts before displaying a "Chat unavailable" error state.
3. WHEN a user sends a message, THE Chat_Client SHALL emit a `send_message` event to the Chat_Server containing: `{ classroomId, senderId, senderName, senderRole, content, timestamp }`, where `content` is at most 2000 characters.
4. WHEN THE Chat_Server receives a `send_message` event, THE Chat_Server SHALL broadcast the message to all connected clients in the same classroom room.
5. WHEN a new message is received, THE Chat_Client SHALL append the message to the chat history and auto-scroll to the most recent message.
6. THE Chat_Client SHALL visually distinguish messages sent by the current user (right-aligned, accent color) from messages sent by others (left-aligned, neutral color).
7. THE Chat_Client SHALL display the sender's name and role badge ("Instructor" or "Student") above each message bubble.
8. THE Chat_Client SHALL display a relative timestamp for each message using these thresholds: "Just now" for messages less than 60 seconds old; "{N} min ago" for messages 1–59 minutes old; "{N} hr ago" for messages 1–23 hours old; the formatted date for messages 24+ hours old.
9. WHEN a user connects or reconnects to the Chat_Server, THE Chat_Server SHALL deliver the last 50 messages for that classroom room so the user can see recent history.
10. THE Chat_Server SHALL persist chat messages to a MongoDB `ClassroomMessage` collection with fields: `classroomId`, `senderId`, `senderName`, `senderRole`, `content`, `createdAt`.
11. IF a user connects to the Chat_Server without a valid session token, THEN THE Chat_Server SHALL reject the Socket.IO connection with an HTTP 401 authorization error.
12. IF an authenticated user attempts to join a classroom room they are not enrolled in or do not instruct, THEN THE Chat_Server SHALL emit an `authorization_error` event to that socket without dropping the connection.
13. WHEN a user's Socket.IO connection disconnects, THE Chat_Server SHALL log the disconnection and remove the socket from the classroom room.
14. WHEN a user begins typing in the message input, THE Chat_Client SHALL emit a `typing` event to the Chat_Server at most once every 2 seconds (throttled) until the user stops typing.
15. WHEN THE Chat_Server receives a `typing` event, THE Chat_Server SHALL relay it to all other members of the classroom room but not back to the sender.
16. THE Chat_Client SHALL render message bubbles using mutually exclusive styling: a message SHALL be either accent-colored and right-aligned (current user) or neutral-colored and left-aligned (other users), never both simultaneously.
17. IF a user attempts to send a message with empty content or content exceeding 2000 characters, THEN THE Chat_Client SHALL not emit the `send_message` event and SHALL display a validation error inline below the input field.

---

### Requirement 6: Canvas LMS-Inspired Role-Based Permission System

**User Story:** As a platform administrator or instructor, I want a role-based permission system so that students can only perform actions appropriate to their role (e.g., view and submit, but not create assignments, post announcements, or manage students), matching the access control model found in Canvas LMS.

#### Acceptance Criteria

1. THE Permission_System SHALL define two roles within a Classroom context: `instructor` and `student`.
2. IF a user attempts to perform an instructor-only action (create assignments, post announcements, add/remove materials, manage forked content, view Analytics tab, view Students tab, access classroom Settings, remove students, or export grades), THEN THE Permission_System SHALL block the action unless the user's `user.role` equals `"instructor"` or `"admin"`.
3. WHEN a Student navigates to the classroom, THE ClassroomDetail SHALL hide the Analytics tab, Students tab, and Settings tab from the DOM and only display tabs available to students: Course, Assignments, Grades, Discussions, Notes, Materials, Chat.
4. IF an authenticated user with `role === "student"` calls an instructor-only API endpoint, THEN THE Permission_System SHALL return HTTP 403 with `{ error: "Access denied" }` and SHALL NOT process or persist the request.
5. IF an unauthenticated user calls any protected API endpoint, THEN THE Permission_System SHALL return HTTP 401 with `{ error: "Unauthorized" }` and SHALL NOT process the request.
6. WHEN a Student views the Assignments tab, THE AssignmentsTab SHALL not display "Create Assignment" buttons or instructor management controls.
7. WHEN a Student views the Discussions tab and `classroom.settings.allowStudentPosts` is `true`, THE DiscussionsTab SHALL display the "New Discussion" and reply forms to the student.
8. IF `classroom.settings.allowStudentPosts` is `false`, THEN when a Student views the Discussions tab, THE DiscussionsTab SHALL hide the "New Discussion" and reply forms and display a read-only notice.
9. WHEN a Student views the Materials tab, THE MaterialsTab SHALL hide the "Add Material" button and all delete/edit controls.
10. WHEN a Student views the Grades tab, THE GradesTab SHALL only display the current student's own grades, never the grades of other students.
11. WHEN a Student views the Course tab, THE CourseTab SHALL not display the Fork Content button, the Generate Course Structure button, or the Add More linked-content button.
12. THE server-side API routes for assignments (`POST /api/classrooms/[id]/assignments`), announcements (`POST /api/classrooms/[id]/announcements`), materials (`POST /api/classrooms/[id]/materials`), and fork (`POST /api/classrooms/[id]/fork`) SHALL verify that the requesting user is the classroom instructor before processing the request.
13. IF `classroom.instructorId` is undefined or `user._id` is undefined, THEN THE Permission_System SHALL resolve `isInstructor` to `false`.
14. THE Permission_System SHALL store `isInstructor` as a derived boolean on the classroom object passed to all child components, computed as `classroom.instructorId?.toString() === user._id?.toString()`.
15. WHEN a Student is enrolled in multiple classrooms, THE Permission_System SHALL apply per-classroom permission checks based on the specific classroom's `instructorId`, not a global role flag alone.
