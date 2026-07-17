# Requirements Document

## Introduction

The "AI Exam Generator" feature allows users of the Actinova AI Tutor platform to create timed, structured exams on any topic (or sourced from an existing course in their library). Users configure the exam with a question count (10/20/30/50), time limit (15/30/45/60/90 minutes), difficulty level, and mix of question types (MCQ, true/false, short-answer). The AI generates a complete exam which is then taken in a focused, distraction-free mode with a visible countdown timer. On completion, the user sees a detailed results screen with score, time taken, per-question review with explanations, and XP awarded. All completed exams are persisted to a new `exams` MongoDB collection and are accessible from a new "Exams" dashboard tab. The feature is gated behind the existing 25-credit `exam_generation` product already defined in `planLimits.js`.

---

## Glossary

- **Exam_Generator**: The React component (`ExamGenerator.jsx`) that presents the topic/configuration form and triggers exam creation.
- **Exam_Session**: The React component (`ExamSession.jsx`) that renders the focused exam-taking interface with a countdown timer.
- **Exam_Results**: The React component (`ExamResults.jsx`) that displays the post-exam score, time taken, per-question review, and XP reward.
- **Exam_Library**: The React component (`ExamLibrary.jsx`) that lists a user's past exams and provides entry points to retake or review them.
- **Exam_API**: The Next.js API route (`/api/exams`) that handles exam generation (POST), exam retrieval (GET), and exam submission (PATCH).
- **Exam_Document**: A MongoDB document in the `exams` collection representing a single generated exam, its configuration, questions, and (after submission) the user's answers and results.
- **Question**: A single examination item with a `text`, `type`, `options` (where applicable), `correctAnswer`, and `explanation` field, matching the schema already used in the `tests` collection.
- **Focused_Mode**: The distraction-free UI state during an active exam, in which the sidebar and navigation are suppressed and the timer is prominently displayed.
- **Credit_System**: The existing Actinova credit-based gating mechanism defined in `planLimits.js`, where exam generation costs 25 credits per exam.
- **XP_System**: The existing gamification system in `gamification.js`, awarding XP on exam completion and perfect scores.
- **Course_Library**: The user's existing library of generated courses stored in the `library` MongoDB collection, available as topic seeds for exam generation.

---

## Requirements

### Requirement 1: Exam Configuration

**User Story:** As a student, I want to configure an exam by selecting a topic and setting question count, time limit, difficulty, and question types, so that the AI generates a focused exam tailored to my learning needs.

#### Acceptance Criteria

1. THE Exam_Generator SHALL provide a text input for the exam topic and a dropdown to optionally select a course from the user's Course_Library as the topic source.
2. THE Exam_Generator SHALL provide a question count selector with exactly the options: 10, 20, 30, and 50 questions.
3. THE Exam_Generator SHALL provide a time limit selector with exactly the options: 15, 30, 45, 60, and 90 minutes.
4. THE Exam_Generator SHALL provide a difficulty selector with options: Easy, Medium, and Hard.
5. THE Exam_Generator SHALL provide question type toggles allowing the user to include or exclude: Multiple Choice (MCQ), True/False, and Short Answer.
6. WHEN a user attempts to generate an exam without a topic, THE Exam_Generator SHALL prevent submission and display an inline validation error: "Please enter an exam topic."
7. WHEN a user attempts to generate an exam with all question types deselected, THE Exam_Generator SHALL prevent submission and display an inline validation error: "Please select at least one question type."
8. WHEN a user selects a course from the Course_Library dropdown, THE Exam_Generator SHALL populate the topic input with that course's title and allow the user to edit it further.

---

### Requirement 2: Credit Gate and Exam Generation

**User Story:** As a student, I want the AI to generate a complete exam after I confirm I have enough credits, so that I receive a high-quality, ready-to-take assessment.

#### Acceptance Criteria

1. WHEN a user submits the exam configuration form, THE Exam_Generator SHALL check if the user has sufficient credits (25) using the existing `checkAPILimit` mechanism before calling the generation API.
2. WHEN the user has insufficient credits, THE Exam_Generator SHALL display the existing `UpgradeModal` component and SHALL NOT call the generation API.
3. WHEN sufficient credits are confirmed, THE Exam_API SHALL deduct 25 credits from the user's account and call the OpenAI API to generate questions.
4. THE Exam_API SHALL generate questions conforming to the requested type distribution: approximately 60% MCQ, 20% True/False, and 20% Short Answer when all types are enabled, adjusting proportionally when types are excluded.
5. WHEN the OpenAI API returns a valid response, THE Exam_API SHALL save the Exam_Document to the `exams` collection and return the exam ID and questions to the client.
6. WHILE the exam is being generated, THE Exam_Generator SHALL display a loading indicator and disable the submit button to prevent duplicate submissions.
7. IF the OpenAI API fails or returns an invalid response, THEN THE Exam_API SHALL return a 500 error and THE Exam_Generator SHALL display a toast error: "Exam generation failed. Your credits have not been deducted."
8. WHEN an exam is successfully generated, THE Exam_Generator SHALL transition the UI to the Exam_Session component without a full page navigation.

---

### Requirement 3: Focused Exam Session

**User Story:** As a student, I want to take my exam in a distraction-free environment with a visible countdown timer, so that I can simulate real exam conditions and manage my time effectively.

#### Acceptance Criteria

1. WHEN the Exam_Session loads, THE Exam_Session SHALL display a countdown timer initialised to the user's configured time limit, decrementing every second.
2. THE Exam_Session SHALL display all questions on a single scrollable page, grouped into pages of 10 questions each with pagination controls.
3. WHEN the timer reaches zero, THE Exam_Session SHALL automatically submit the exam with whatever answers have been provided up to that point.
4. WHEN a user attempts to navigate away from the Exam_Session (via browser back, tab close, or route change), THE Exam_Session SHALL display a browser confirmation dialog: "Your exam is in progress. Leaving will submit your current answers."
5. THE Exam_Session SHALL show an answer-progress indicator displaying the count of answered questions versus the total (e.g., "12 / 30 answered").
6. THE Exam_Session SHALL apply Focused_Mode styling: the dashboard sidebar SHALL be visually hidden and the exam header with the timer SHALL be sticky at the top.
7. WHEN the timer has 5 minutes or fewer remaining, THE Exam_Session SHALL change the timer display to a red/destructive colour to alert the user.
8. THE Exam_Session SHALL support all question types: MCQ (radio buttons), True/False (radio buttons), and Short Answer (text input), rendering each type correctly per the schema used in `QuizInterface.jsx`.

---

### Requirement 4: Exam Submission

**User Story:** As a student, I want to submit my completed exam and have my answers evaluated, so that I receive an accurate score and meaningful feedback.

#### Acceptance Criteria

1. WHEN a user clicks "Submit Exam", THE Exam_Session SHALL display a `ConfirmModal` asking: "Submit exam? You have [N] unanswered questions." if any questions are unanswered, or a direct confirmation if all are answered.
2. WHEN the user confirms submission, THE Exam_Session SHALL POST the user's answers and time taken (in seconds) to THE Exam_API.
3. WHEN the Exam_API receives a submission, THE Exam_API SHALL score the answers server-side by comparing them against the stored `correctAnswer` values in the Exam_Document.
4. THE Exam_API SHALL compute: total score (points earned), total possible points, percentage score, time taken in seconds, and per-question correctness.
5. WHEN scoring is complete, THE Exam_API SHALL update the Exam_Document in the `exams` collection with the submission data (answers, score, percentage, timeTaken, completedAt).
6. IF the user's percentage score is ≥ 80%, THEN THE Exam_API SHALL award `exam_perfect` XP (30 XP); otherwise THE Exam_API SHALL award `exam_complete` XP (20 XP), using the existing XP update pattern from `gamification.js`.
7. WHEN the Exam_API returns a successful submission response, THE Exam_Session SHALL transition to the Exam_Results component passing the score data.

---

### Requirement 5: Exam Results

**User Story:** As a student, I want to see a detailed breakdown of my exam results including per-question review and explanations, so that I can understand what I got wrong and learn from my mistakes.

#### Acceptance Criteria

1. THE Exam_Results SHALL display: the exam title, total score (points/total), percentage score, time taken (formatted as "Xm Ys"), and XP earned.
2. THE Exam_Results SHALL display a performance label based on percentage: ≥ 90% "Excellent!", ≥ 70% "Good job!", ≥ 50% "Keep practising!", < 50% "Needs improvement."
3. THE Exam_Results SHALL render a per-question review section showing each question, the user's answer, the correct answer, and the AI-generated explanation, consistent with the review UI in `QuizInterface.jsx`.
4. WHEN a question was answered correctly, THE Exam_Results SHALL highlight it with a green border and a `CheckCircle` icon.
5. WHEN a question was answered incorrectly or left unanswered, THE Exam_Results SHALL highlight it with a red border and an `XCircle` icon.
6. THE Exam_Results SHALL provide a "Retake Exam" button that resets answers and restarts the Exam_Session with the same questions and configuration.
7. THE Exam_Results SHALL provide a "Back to Exams" button that navigates to the Exam_Library tab.
8. WHEN the XP reward is displayed, THE Exam_Results SHALL show a brief animated XP badge (e.g., "+20 XP") using the existing `LevelUpModal` or a toast notification.

---

### Requirement 6: Exam Library

**User Story:** As a student, I want to see all my past exams in a dedicated dashboard tab, so that I can review past performance or retake exams I want to improve on.

#### Acceptance Criteria

1. THE Exam_Library SHALL be accessible as a new dashboard tab with the identifier `exams`, registered in `DashboardContent.jsx`.
2. THE Exam_Library SHALL display a summary of each past Exam_Document: title, topic, difficulty, question count, time limit, best score (percentage), and date taken.
3. WHEN no exams exist for the user, THE Exam_Library SHALL display an empty state with the message "No exams yet. Generate your first exam to get started." and a "Generate Exam" button linking to the `generate` or `exams-generate` view.
4. THE Exam_Library SHALL provide "Review" and "Retake" action buttons for each completed exam.
5. THE Exam_Library SHALL provide a "Delete" button for each exam, displaying a `ConfirmModal` before deleting the Exam_Document from the `exams` collection via a DELETE request to Exam_API.
6. WHEN an exam is not yet completed (generated but not submitted), THE Exam_Library SHALL display it with a "Continue" button that resumes the Exam_Session.
7. THE Exam_Library SHALL display aggregate stats: total exams taken, average score, best score, and total time spent on exams.
8. THE Exam_Library SHALL support pagination of 6 exams per page with previous/next controls consistent with `TestYourself.jsx`.

---

### Requirement 7: Navigation and Discoverability

**User Story:** As a user, I want the Exam Generator feature to be easily discoverable in the dashboard sidebar and consistent with the existing navigation design, so that I can find and use it without confusion.

#### Acceptance Criteria

1. THE Sidebar SHALL include an "AI Exams" navigation item with a `GraduationCap` icon in the "Learn" group, positioned after "Test Yourself".
2. THE Exam_Library (tab id `exams`) SHALL be registered in `DashboardContent.jsx`'s `routeComponents` map.
3. WHEN the `exams` tab is active, THE DashboardContent SHALL apply standard (non-full-height) layout styling, consistent with the `quizzes` tab.
4. WHEN a user navigates to the `exams` tab for the first time, THE Exam_Library SHALL render the empty state with the "Generate Exam" button.

---

### Requirement 8: Data Persistence and Retrieval

**User Story:** As a student, I want my exams to be saved and retrievable between sessions, so that I can return to review my results at any time.

#### Acceptance Criteria

1. THE Exam_API (GET `/api/exams`) SHALL return all Exam_Documents belonging to the authenticated user, sorted by `createdAt` descending.
2. THE Exam_API (GET `/api/exams/[id]`) SHALL return a single Exam_Document by ID, verifying that the `userId` matches the authenticated user before returning data.
3. IF the requested Exam_Document does not belong to the authenticated user, THEN THE Exam_API SHALL return a 403 Forbidden response.
4. THE Exam_API (DELETE `/api/exams/[id]`) SHALL delete the Exam_Document by ID, verifying ownership before deletion.
5. THE Exam_Document SHALL be stored in the `exams` MongoDB collection with the schema: `{ _id, userId, title, topic, difficulty, questionCount, timeLimit (minutes), questionTypes[], questions[], status ("pending"|"completed"), answers, score, totalPoints, percentage, timeTaken (seconds), completedAt, createdAt, updatedAt }`.
6. WHEN an Exam_Document has `status: "pending"`, THE Exam_API SHALL return the full questions array so the session can resume; WHEN `status: "completed"`, THE Exam_API SHALL return the full document including answers and scores.

---

### Requirement 9: Accessibility and Responsiveness

**User Story:** As a user, I want all interactive elements of the exam feature to be keyboard-navigable, screen-reader-friendly, and usable on mobile devices, so that the feature is accessible to everyone.

#### Acceptance Criteria

1. THE Exam_Session SHALL provide a visible focus ring on all interactive elements (radio buttons, text inputs, submit button, navigation controls) compliant with WCAG 2.1 AA contrast requirements.
2. THE countdown timer region in Exam_Session SHALL use `aria-live="polite"` so screen readers can announce significant time events (e.g., the 5-minute warning).
3. THE Exam_Generator form SHALL associate all inputs with `<label>` elements and use `aria-describedby` for validation error messages.
4. WHEN the Exam_Session is in Focused_Mode on a mobile device, THE Exam_Session SHALL render a single-column layout with the timer fixed to the top of the viewport and questions scrollable below it.
