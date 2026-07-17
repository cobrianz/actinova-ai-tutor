# Requirements Document

## Introduction

The Spaced Repetition Dashboard is a dedicated `srs-review` tab in the Actinova AI Tutor platform dashboard. It provides users with a centralized view of their spaced repetition (SRS) learning progress across all flashcard sets, and a focused review mode for working through due cards. The feature integrates with the existing SM-2 algorithm endpoints (`GET /api/srs/due`, `POST /api/srs/review`), the platform's gamification system (XP rewards), and the existing dashboard navigation pattern. SRS review is free and requires no credit gate.

## Glossary

- **SRS_Dashboard**: The new `srs-review` tab component rendered within the Actinova dashboard that shows the summary, per-deck breakdown, and entry point into review sessions.
- **Review_Session**: The focused flip-card review mode launched from the SRS_Dashboard where users rate recalled cards using SM-2 quality scores.
- **Card_Set**: A MongoDB `cardSets` document belonging to a user, containing an array of cards each with SRS metadata (`interval`, `repetitions`, `ease`, `dueDate`).
- **Due_Card**: A card whose `srs.dueDate` is less than or equal to the current UTC timestamp.
- **SM2_Rating**: A quality score (0–5) mapped to the four user-facing buttons: Again (0), Hard (2), Good (4), Easy (5).
- **Streak**: The user's current consecutive-day login/review streak, stored in the `users` collection as `streak.current`.
- **Mastery_Rate**: The percentage of a Card_Set's cards with `srs.interval > 30` days, indicating mature (well-learned) cards.
- **XP_System**: The platform gamification layer in `src/app/lib/gamification.js`; `XP_REWARDS.flashcard_review = 2` is awarded per reviewed card.
- **Session_Summary**: The completion screen shown after all Due_Cards in a Review_Session have been rated, displaying stats and XP earned.

---

## Requirements

### Requirement 1: SRS Dashboard Tab Navigation

**User Story:** As a learner, I want a dedicated SRS Review tab in the dashboard sidebar, so that I can navigate directly to my spaced repetition overview without hunting through other sections.

#### Acceptance Criteria

1. THE SRS_Dashboard SHALL be accessible via the `srs-review` tab id in the dashboard navigation.
2. WHEN a user navigates to `?tab=srs-review`, THE SRS_Dashboard SHALL render the overview screen as the default view.
3. THE Sidebar SHALL display a "SRS Review" navigation item in the "Learn" group, positioned after the "Flashcards" item.
4. THE DashboardContent SHALL register the `srs-review` route and map it to the SRS_Dashboard component.

---

### Requirement 2: Summary Card

**User Story:** As a learner, I want a summary card at the top of the SRS Dashboard, so that I can quickly see my total due cards, total card count, and current streak at a glance.

#### Acceptance Criteria

1. WHEN the SRS_Dashboard loads, THE SRS_Dashboard SHALL fetch due cards from `GET /api/srs/due` and display the count of Due_Cards returned.
2. WHEN the SRS_Dashboard loads, THE SRS_Dashboard SHALL fetch all Card_Sets from `GET /api/flashcards` and display the sum of all cards across all sets as "Total Cards."
3. WHEN the SRS_Dashboard loads, THE SRS_Dashboard SHALL fetch the user's streak from `GET /api/xp` and display `streak.current` as the "Current Streak."
4. WHILE data is loading, THE SRS_Dashboard SHALL display skeleton placeholder elements in place of the summary statistics.
5. IF a fetch request fails, THEN THE SRS_Dashboard SHALL display an error message and a retry button in place of the failed statistic.
6. WHEN the due card count is zero, THE SRS_Dashboard SHALL display "All caught up!" text in place of the due count number.

---

### Requirement 3: Per-Deck Breakdown

**User Story:** As a learner, I want to see each of my flashcard decks listed with its due count, last reviewed date, and mastery percentage, so that I can prioritize which decks need my attention.

#### Acceptance Criteria

1. WHEN the SRS_Dashboard loads, THE SRS_Dashboard SHALL render one deck row per Card_Set belonging to the user.
2. FOR each Card_Set, THE SRS_Dashboard SHALL display the deck title, the count of Due_Cards within that set, the most recent `srs.dueDate` that is in the past as "Last Reviewed," and the Mastery_Rate.
3. WHEN a Card_Set has no Due_Cards, THE SRS_Dashboard SHALL display "Up to date" in the due count column for that deck.
4. WHEN a Card_Set has no cards with a past `srs.dueDate`, THE SRS_Dashboard SHALL display "Not started" as the Last Reviewed value.
5. THE SRS_Dashboard SHALL sort deck rows so that Card_Sets with the most Due_Cards appear first.
6. WHEN the user has no Card_Sets, THE SRS_Dashboard SHALL display an empty state with a prompt linking to the "generate" tab to create flashcards.

---

### Requirement 4: Start Review Session

**User Story:** As a learner, I want a prominent "Start Review Session" button that launches a focused review mode, so that I can immediately begin working through my due cards.

#### Acceptance Criteria

1. WHEN Due_Cards exist, THE SRS_Dashboard SHALL display a "Start Review Session" button that is visually prominent.
2. WHEN the "Start Review Session" button is clicked, THE SRS_Dashboard SHALL transition to the Review_Session view.
3. WHEN no Due_Cards exist, THE SRS_Dashboard SHALL disable the "Start Review Session" button and display a tooltip explaining there are no cards due.
4. WHERE a specific deck row has due cards, THE SRS_Dashboard SHALL display a "Review" button on that row that starts a Review_Session pre-filtered to that deck's cards only.

---

### Requirement 5: Flip-Card Review Mode

**User Story:** As a learner, I want to review cards one at a time in a flip-card interface, so that I can test my recall before revealing the answer.

#### Acceptance Criteria

1. WHEN a Review_Session starts, THE Review_Session SHALL display the front face of the first Due_Card showing the `question` field.
2. WHEN a user clicks or taps the card, THE Review_Session SHALL animate a 3D flip and reveal the back face showing the `answer` field and optionally the `explanation` field.
3. WHEN the card is showing the back face, THE Review_Session SHALL display the four SM2_Rating buttons: Again, Hard, Good, and Easy.
4. THE Review_Session SHALL show a progress indicator displaying the current card number and total card count (e.g., "3 of 12").
5. THE Review_Session SHALL display a progress bar that fills proportionally as cards are completed.
6. WHILE a card rating is being submitted, THE Review_Session SHALL disable the SM2_Rating buttons to prevent duplicate submissions.
7. WHEN the back face is visible, THE Review_Session SHALL show a live tally of Again / Hard / Good / Easy counts for the current session.
8. THE Review_Session SHALL display a "Back to Dashboard" link that returns the user to the SRS_Dashboard overview without losing dashboard context.

---

### Requirement 6: Rating Submission and XP Award

**User Story:** As a learner, I want my card ratings to be saved and XP awarded automatically, so that my progress is tracked and I am rewarded for consistent review.

#### Acceptance Criteria

1. WHEN a user selects an SM2_Rating, THE Review_Session SHALL POST to `/api/srs/review` with `{ type: "flashcard", id: cardId, setId: setId, quality: sm2Quality }`.
2. WHEN the review POST succeeds, THE Review_Session SHALL advance to the next Due_Card or transition to the Session_Summary if all cards are complete.
3. WHEN a user selects an SM2_Rating, THE Review_Session SHALL POST to `/api/xp` with `{ action: "flashcard_review" }` to award 2 XP.
4. IF the review POST fails, THEN THE Review_Session SHALL display a toast error and allow the user to retry the rating without advancing.
5. IF the XP POST fails, THEN THE Review_Session SHALL silently continue without blocking the review flow.
6. THE Review_Session SHALL accumulate the total XP earned during the session and display it in the Session_Summary.

---

### Requirement 7: Session Summary

**User Story:** As a learner, I want to see a summary screen when I finish a review session, so that I know my performance and what to expect next.

#### Acceptance Criteria

1. WHEN all Due_Cards in a Review_Session have been rated, THE Review_Session SHALL display the Session_Summary screen.
2. THE Session_Summary SHALL display the total number of cards reviewed in the session.
3. THE Session_Summary SHALL display the total XP earned during the session.
4. THE Session_Summary SHALL display the breakdown of ratings: Again, Hard, Good, and Easy counts.
5. THE Session_Summary SHALL display the next scheduled due date, defined as the earliest future `dueDate` returned from the last review POST response.
6. THE Session_Summary SHALL provide a "Review Again" button that resets the session and re-fetches any remaining due cards.
7. THE Session_Summary SHALL provide a "Back to Dashboard" button that returns the user to the SRS_Dashboard overview.
8. WHEN the user earned any new gamification badges during the session, THE Session_Summary SHALL display the badge names and icons.

---

### Requirement 8: Access Control and Credit Gate

**User Story:** As a platform operator, I want SRS review to be free for all authenticated users, so that spaced repetition is an unrestricted learning tool.

#### Acceptance Criteria

1. THE SRS_Dashboard SHALL be accessible to all authenticated users regardless of subscription tier.
2. THE Review_Session SHALL not consume any platform credits when rating cards.
3. WHEN an unauthenticated user navigates to `?tab=srs-review`, THE SRS_Dashboard SHALL redirect the user to the login page via the existing `ProtectedRoute` mechanism.
