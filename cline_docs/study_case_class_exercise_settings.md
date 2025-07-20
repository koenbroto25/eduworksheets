# Study Case: Advanced Class Exercise Settings & Parent Notifications

## 1. Problem Statement

Teachers need more granular control over class assignments to effectively manage their classrooms. The current system lacks specific settings for deadlines, attempts, and grading. Furthermore, the communication loop between teachers, students, and parents is not fully realized; parents lack precise, real-time updates on their child's performance and assignment status (e.g., passed, failed, overdue).

## 2. The Solution: An Integrated Approach

We will implement an "Advanced Class Exercise Settings" feature that is deeply integrated with a proactive parental notification system. This solution leverages the existing database structure for maximum efficiency and minimal disruption.

- **For Teachers:** An intuitive UI to set deadlines, attempt limits, passing grades, and answer visibility for each class exercise.
- **For Students:** A clear and rule-based exercise experience.
- **For Parents:** Precise, real-time notifications about their child's achievements, challenges, and pending tasks.

## 3. UI/UX Design Plan

### 3.1. The "Settings" Button
- **Location:** `src/pages/ClassDetailPage.tsx`
- **Component:** `src/components/public-library/ExerciseCard.tsx`
- **Change:** When rendered in the class detail context, the "Lihat Detail" button will be replaced by a "Settings" button, featuring a gear icon for clear visual distinction.

### 3.2. The Settings Modal (`ClassExerciseSettingsModal.tsx`)
- **Trigger:** Clicking the "Settings" button.
- **Layout:** A clean, well-organized modal form.
    - **Title:** "Settings for: [Exercise Title]"
    - **Sections:**
        1.  **Availability:**
            -   `Due Date`: A date-picker input.
        2.  **Rules & Grading:**
            -   `Max Attempts`: A number input.
            -   `Time Limit (Minutes)`: A number input.
            -   `Minimum Passing Grade (%)`: A slider or number input (0-100).
        3.  **Student Experience:**
            -   `Randomize Questions`: A checkbox.
            -   `Show Answers Policy`: A dropdown menu with options ('Immediately', 'After Deadline', 'On Max Attempts', 'Manual').
    - **Actions:** A "Save Changes" button and a "Cancel" button.

## 4. Detailed Implementation Steps

### Step 1: Minimal Database Migration
- **Goal:** Add a `status` column to `user_progress` to track pass/fail status.
- **Action:** Provide the following SQL script for manual execution in the Supabase editor.
- **SQL Script:**
  ```sql
  CREATE TYPE public.progress_status_enum AS ENUM (
      'not_started',
      'in_progress',
      'completed_passed',
      'completed_failed'
  );

  ALTER TABLE public.user_progress
  ADD COLUMN status progress_status_enum NOT NULL DEFAULT 'not_started';
  ```

### Step 2: Build the Teacher UI
- **Goal:** Implement the "Settings" button and modal.
- **Actions:**
    1.  Modify `ExerciseCard.tsx` to show the "Settings" button when on `ClassDetailPage`.
    2.  Create the new component `src/components/classroom/ClassExerciseSettingsModal.tsx`.
    3.  Implement the form inside the modal, fetching current settings from the `class_exercises` table.
    4.  Create a new function `updateClassExerciseSettings` in `src/services/supabaseService.ts`. This function will update the dedicated columns (`due_date`, `max_attempts`) and the `settings` JSONB field in the `class_exercises` table.

### Step 3: Enforce Rules for Students
- **Goal:** Apply the teacher's settings when a student takes an exercise.
- **Actions:**
    1.  In `src/pages/TakeExercisePage.tsx`, fetch the full record from `class_exercises`.
    2.  Enforce all rules: check `due_date`, compare `exercise_attempts` with `max_attempts`, start a timer for `time_limit`, and shuffle questions if `randomize_questions` is true.

### Step 4: Implement Smart Feedback and Reporting
- **Goal:** Update student progress and provide rich reports.
- **Actions:**
    1.  After an attempt in `ExerciseResults.tsx`, call a service function to compare the score with `minimum_passing_grade` from the settings.
    2.  This service function will update the `user_progress.status` field to `'completed_passed'` or `'completed_failed'`.
    3.  Update `ClassReport.tsx` to display the new, color-coded status for each student, giving teachers an at-a-glance overview.

### Step 5: Activate Proactive Parent Notifications
- **Goal:** Inform parents of their child's progress in real-time.
- **Actions:**
    1.  **Upgrade Database Trigger:** Modify the existing trigger on the `exercise_attempts` table. This trigger will now read the newly set `user_progress.status` to generate specific notification messages.
    2.  **Create Notification Logic:** The trigger will find the parent(s) via the `parent_child_link` table and insert a new row into the `notifications` table with a precise message (e.g., "...has passed the exercise...", "...has completed the exercise but did not pass...").
    3.  **Enhance UI:** The `NotificationBell.tsx` and `ParentDashboard.tsx` will render these new detailed notifications, closing the communication loop.

## 5. Implementation Progress (As of 2025-07-16)

This section details the work completed so far and the exact next steps.

### Work Completed

-   **Step 1: Database Migration**
    -   **Done:** Created the migration file `supabase/migrations/20250716110000_add_status_to_user_progress.sql` to add the `status` column to the `user_progress` table.
    -   **Done:** Corrected a typo in the initial migration script.
-   **Status:** Awaiting manual application of the migration by the user.

-   **Step 2: Build the Teacher UI**
    -   **Done:** Created the settings modal component at `src/components/classroom/ClassExerciseSettingsModal.tsx`.
    -   **Done:** Modified `src/components/public-library/ExerciseCard.tsx` to conditionally render a "Settings" button using a new `context` prop.
    -   **Done:** Integrated the settings modal and its state management into `src/pages/ClassDetailPage.tsx`.
    -   **Done:** Added the `updateClassExerciseSettings` function to `src/services/supabaseService.ts` to handle saving the data.

-   **Step 3: Enforce Rules for Students**
    -   **Done:** Added the `getClassExercise` function to `supabaseService.ts` to fetch specific assignment settings.
    -   **Done:** Modified `src/pages/TakeExercisePage.tsx` to fetch class exercise settings and the student's previous attempts.
    -   **Done:** Implemented logic in `TakeExercisePage.tsx` to block students from taking an exercise if the due date has passed or if they have reached the maximum number of attempts.

-   **Step 4: Implement Smart Feedback and Reporting (Partial)**
    -   **Done:** Modified `src/components/student-exercise/ExerciseResults.tsx` to accept a `minimumPassingGrade` prop and display a dynamic pass/fail message with corresponding icons.
    -   **Done:** Modified `src/components/student-exercise/TakeExercise.tsx` to correctly pass the `minimumPassingGrade` from the settings down to the `ExerciseResults` component.

-   **Step 4: Implement Smart Feedback and Reporting (Completed)**
    -   **Done:** Modified `src/pages/TakeExercisePage.tsx` to correctly save the student's pass/fail status in the `exercise_attempts` table.
    -   **Done:** Updated `src/components/classroom/ClassReport.tsx` to display the new status information in a "Student Progress Details" section.
-   **Status**: `Untested`

### Next Steps

The immediate next action is to complete Step 5 by activating the proactive parent notifications.

1.  **File to Modify**: `supabase/migrations/20250707010000_add_notification_triggers.sql`
2.  **Action**: Upgrade the existing trigger on the `exercise_attempts` table to read the newly set `user_progress.status` and generate specific notification messages.
3.  **After that**: Enhance the UI in `NotificationBell.tsx` and `ParentDashboard.tsx` to render these new detailed notifications.
