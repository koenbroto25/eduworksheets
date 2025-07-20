# Study Case: Persistent Semester State Bug

## 1. Problem Summary

This document details a persistent and critical bug in the **Exercise Builder** where the curriculum materials displayed in the "AI Prompt Setting" are always filtered for "Semester 2," regardless of the semester selected by the user in the "Basic Settings."

This bug is functionally identical to a previously resolved issue where the form was stuck on "Grade 9." Despite applying the same logic that fixed the grade issue, the semester filtering remains broken.

## 2. Debugging Journey & Current Status

The attempts to resolve this issue have been extensive but unsuccessful, highlighting a deeper, more complex problem than initially anticipated.

### Step 1: Initial State and Prop Drilling

*   **Hypothesis:** The issue was caused by incomplete initial state or incorrect prop passing, similar to the "Grade 9" bug.
*   **Actions:**
    1.  Ensured the `semester` property was added to the initial state in `ExerciseBuilderPage.tsx`.
    2.  Verified that the `semester` prop was correctly passed down through `ExerciseBuilder.tsx` and `ExerciseSettings.tsx`.
    3.  Updated all relevant component interfaces and type definitions to include the `semester` property.
*   **Result:** These actions did not resolve the issue.

### Step 2: Investigating the Render Loop

*   **Hypothesis:** A "Maximum update depth exceeded" error indicated an infinite render loop was preventing state from updating correctly.
*   **Action:**
    1.  Added `console.log` statements to trace the data flow.
    2.  Identified that the `onFormChange` function was being recreated on every render, triggering a `useEffect` hook in the child component.
    3.  Wrapped the `handlePromptFormChange` function in `ExerciseBuilder.tsx` with the `useCallback` hook.
*   **Result:** This successfully resolved the infinite loop error, but the underlying semester filtering bug remained.

### Step 3: Verifying the Data Source

*   **Hypothesis:** The issue might originate from the data source itself.
*   **Action:** I inspected `src/data/filterOptions.ts` to check for any hardcoded or incorrect values in the `semesterOptions` array.
*   **Result:** The data source was confirmed to be correct, ruling it out as the cause.

## 3. Current Hypothesis & Next Steps

All attempts to fix the issue from the frontend component side have failed. The data flow *appears* to be correct, yet the component responsible for fetching the data (`PromptBuilderForm.tsx`) is consistently using the wrong semester value.

This strongly suggests the problem lies in the one part of the chain that has not yet been investigated: **the data fetching logic itself.**

The current hypothesis is that the `getCurriculumData` function within `supabaseService.ts` is either ignoring the `semester` parameter passed to it or is unintentionally overriding it.

The next logical step is to inspect the implementation of `supabaseService.ts` to understand how it constructs and executes the query to the backend.

### Step 4: The Final Fix - Investigating the Service Layer

*   **Hypothesis:** The final point of failure had to be in the data fetching logic itself, specifically within the `getCurriculumData` function in `supabaseService.ts`.
*   **Action:** I inspected the `getCurriculumData` function.
*   **Discovery:** The root cause was located in a single line of code responsible for filtering the data by semester:
    ```javascript
    .eq('semester', semester === 'Semester 1' ? 1 : 2)
    ```
*   **The Bug:** The code was checking if the `semester` prop was strictly equal to the string `'Semester 1'`. However, the value being passed down from the frontend was the string `'1'` or `'2'`. This comparison would always fail, causing the ternary operator to default to `2`, which is why the query always returned data for Semester 2.
*   **Resolution:** I corrected the line to compare the `semester` prop with the string `'1'`:
    ```javascript
    .eq('semester', semester === '1' ? 1 : 2)
    ```
*   **Result:** This change ensured that the correct semester value was used in the Supabase query. The bug was immediately resolved, and the curriculum data began filtering correctly based on the user's selection.

## 4. Conclusion & Key Takeaway

The successful resolution of this bug underscores a critical principle in debugging complex, state-driven applications: **when the data flow appears correct on the surface, the problem often lies at the boundaries of the system**—in this case, the point of interaction with the external service (the database).

While initial efforts correctly focused on establishing a single source of truth in the UI, the final error was a subtle but critical logic flaw in the data service layer. This highlights the importance of end-to-end data tracing, from the UI component down to the final database query.
