# Study Case: Class Assignment and Page Crash Bug

This document outlines the investigation and resolution of a two-part bug related to class functionality. The first issue prevented teachers from assigning exercises to their classes, and the second caused the class detail page to crash after an assignment was made.

## 1. Problem Description

A user logged in as a teacher ("koen broto") encountered two critical issues:

1.  **Assign to Class Failure**: After creating a new class, the user went to the public library to assign an exercise. When clicking the "Gunakan di Kelas Saya" (Use in My Class) button, the modal displayed the message "Anda belum memiliki kelas" (You don't have a class yet), incorrectly indicating that no classes existed.
2.  **Class Page Crash**: After the initial bug was fixed, assigning an exercise to the class led to a subsequent error. Navigating to the class detail page resulted in a blank screen. The browser console showed a fatal error: `Uncaught TypeError: Cannot read properties of null (reading 'length')` originating from the `ExerciseList.tsx` component.

## 2. Investigation and Diagnosis

The investigation was conducted in two phases to address each bug.

### Phase 1: "Assign to Class" Modal Bug

1.  **Initial Analysis**: The modal's failure to display classes suggested a data-fetching problem. The component responsible for the modal, `AssignToClassModal.tsx`, was identified as the likely source of the error.
2.  **Code Review**: An examination of `AssignToClassModal.tsx` revealed that it was using a direct, incorrect Supabase query to fetch classes:
    ```typescript
    const { data, error } = await supabase
      .from('class_members')
      .select('classes(*)')
      .eq('user_id', user.id)
      .eq('role', 'teacher');
    ```
    This query was flawed because it targeted the `class_members` table (which tracks student enrollment) and incorrectly assumed a `role` column existed.
3.  **Identifying the Correct Pattern**: The application's `supabaseService.ts` already contained the correct function, `getUserClasses`, which is designed to fetch classes based on a user's role by querying the `classes` table directly.

### Phase 2: Class Page Crash

1.  **Error Analysis**: The console error clearly indicated that the `ExerciseList.tsx` component was trying to access the `.length` property of a `questions` object that was `null`.
2.  **Component Tracing**: The error stack trace showed the following component hierarchy: `ClassPage` -> `StudentClassPage` -> `ExerciseList`. This was a critical clue, as a user with a "teacher" role should have been routed to `ClassDetailPage`, not `StudentClassPage`.
3.  **Root Cause Identification**:
    *   **Data Integrity Issue**: The immediate cause of the crash was that the `getClassExercises` function in `StudentClassPage.tsx` was not filtering out `null` exercises. This occurred when a `class_exercises` entry existed, but the corresponding exercise had been deleted, causing the database join to return `null`.
    *   **Routing Flaw**: The deeper issue was in `ClassPage.tsx`. The logic was not robust enough, allowing a teacher to be incorrectly routed to the student-specific view, which then failed because it was trying to process data that wasn't relevant to a teacher's perspective.

## 3. Solution Implemented

A multi-step solution was implemented to address both the immediate crashes and the underlying architectural flaws.

1.  **Fixing the "Assign to Class" Modal**:
    *   The incorrect data-fetching logic in `AssignToClassModal.tsx` was removed.
    *   The component was refactored to use the existing `supabaseService.getUserClasses` function, ensuring it correctly fetched and displayed the teacher's classes.

2.  **Fixing the Class Page Crash**:
    *   **Data Safeguarding**: In `StudentClassPage.tsx`, the data fetching logic was updated to explicitly filter out any `null` or `undefined` exercises returned from the database. This ensures that the `ExerciseList` component only receives a clean array of valid exercise objects.
        ```typescript
        const validExercises = exerciseData
          ? exerciseData.map(ce => ce.exercise).filter(ex => ex != null)
          : [];
        setExercises(validExercises);
        ```
    *   **Component Resilience**: In `ExerciseList.tsx`, optional chaining was added to safely access the number of questions, preventing a crash even if an exercise object somehow lacks the `questions` property.
        ```jsx
        {exercise.questions?.length || 0} questions
        ```
    *   **Correcting the Routing Logic**: The `ClassPage.tsx` component was refactored to be more secure and explicit in its role-based rendering. The final logic ensures that teachers are always directed to the `ClassDetailPage`, while students are correctly verified as class members before being shown the `StudentClassPage`.

By implementing these changes, both bugs were resolved, and the application's stability and architectural integrity were improved.
