# Study Case: State Management & Data Flow Bug

## 1. Problem Summary

A persistent and elusive bug was identified in the **Exercise Builder** page. The user interface (UI) would consistently display incorrect data in the "AI Prompt Setting" section, despite the user selecting different options in the "Basic Settings."

This manifested in two distinct but related symptoms:

1.  **Stuck Grade:** Initially, no matter which grade the user selected, the AI Prompt form would always show "Grade 9."
2.  **Stuck Semester:** After some fixes, the grade issue was resolved, but a new problem appeared: the form would always default to showing materials for "Semester 2," regardless of the user's selection.

The core issue was a failure to correctly synchronize state between parent and child components, leading to a disconnect between the user's selections and the data used for API calls and UI rendering.

## 2. Debugging Journey & Resolution

The path to resolving this bug involved several steps, including some missteps that provided valuable learning opportunities.

### Step 1: Centralizing State (Initial Attempt)

*   **Hypothesis:** The `grade` and `subject` values existed in two separate state objects (`promptData` and `exerciseData`), causing a race condition.
*   **Action:** I refactored the code to make `exerciseData` the single source of truth and removed the redundant fields from `promptData`'s initial state in `ExerciseBuilderPage.tsx`.
*   **Result:** This was a step in the right direction but did not fully solve the problem, as the data was still not flowing correctly to all child components.

### Step 2: Synchronizing with `useEffect` (The Infinite Loop)

*   **Hypothesis:** The `PromptBuilderForm` was not being updated when `exerciseData` changed.
*   **Action:** I introduced a `useEffect` hook in `ExerciseBuilder.tsx` to explicitly synchronize `promptData` whenever `exerciseData` was updated.
*   **Mistake:** This was a critical error. Because `onPromptDataChange` (which is `setPromptData`) was a dependency of the hook, and the hook itself called `onPromptDataChange`, it created an infinite render loop (`setState -> render -> useEffect -> setState`). This was identified by the "Maximum update depth exceeded" error reported by the user.
*   **Correction:** I removed the faulty `useEffect` hook entirely.

### Step 3: Fixing the Child Component (`PromptBuilderForm.tsx`)

*   **Hypothesis:** The child component had its own internal, hardcoded state that was overriding the props it received.
*   **Action:** I inspected `PromptBuilderForm.tsx` and found a `useState('Semester 1')` line. I removed this internal state and the corresponding UI dropdown, refactoring the component to *only* rely on the `semester` prop passed down from its parent.

### Step 4: Correcting the Parent Components (`ExerciseBuilder.tsx` & `ExerciseSettings.tsx`)

*   **Hypothesis:** Even with the child fixed, the parent components were not correctly passing the `semester` prop all the way down the chain.
*   **Action:**
    1.  I updated the `ExerciseSettingsProps` in `ExerciseSettings.tsx` to include the `semester` value and an `onSemesterChange` handler.
    2.  I added the `semester` prop to the `<ExerciseSettings />` component instance within `ExerciseBuilder.tsx`.
    3.  I ensured the `semester` was being passed from `exerciseData` to the `<PromptBuilderForm />` instance.

### Step 5: Fixing the Initial State (The Final Piece)

*   **Hypothesis:** The root of the problem was that the initial state being created in `ExerciseBuilderPage.tsx` was incomplete.
*   **Action:** I inspected the `useState` hook for `exerciseData` in `ExerciseBuilderPage.tsx` and discovered it was missing the `semester` property entirely.
*   **Resolution:** I added `semester: '1'` to the initial `exerciseData` object. This ensured that from the moment the page loaded, the entire component tree had a valid, consistent `semester` value, which finally resolved the bug.

## 3. Root Cause Analysis

The bug was caused by a combination of three state management anti-patterns:

1.  **Multiple Sources of Truth:** Critical data (grade, semester) was stored in multiple, independent state variables across different components, leading to synchronization nightmares.
2.  **State Synchronization with `useEffect`:** Attempting to "sync" state between components using `useEffect` is often a sign of a flawed architecture. In this case, it led directly to an infinite loop.
3.  **Incomplete Initial State:** The top-level state object was created without all the necessary properties, causing unpredictable behavior in child components that depended on them.

## 4. Key Takeaway

The primary lesson from this debugging session is the importance of a **single source of truth** in React applications. Data should flow in one direction (top-down), and child components should receive their data via props rather than maintaining their own conflicting internal state. `useEffect` should not be used to patch over a broken data flow.
