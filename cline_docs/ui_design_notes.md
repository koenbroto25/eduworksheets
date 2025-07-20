# UI Design Notes: Teacher's Exercise Management & Consistency

This document outlines UI changes for exercise management and ensures data consistency across different components.

## Component: `MyExercises.tsx`

### Proposed New Layout with Full Management Controls

The new design will add an "Edit" button (triggering a modal), a "Delete" button, and a "Public/Private" toggle to each exercise card.

```
+-----------------------------------------------------------------+
| My Created Exercises                                            |
+-----------------------------------------------------------------+
| [Filter Grade] [Filter Subject] [Filter Type] ...               |
+-----------------------------------------------------------------+
|                                                                 |
| +---------------------------------------------------------------+
| | Exercise Title 1                                              |
| | <Details: Subject, Grade, Semester, etc.>                     |
| |                                                               |
| | [Icon: Public/Private]  Public <---(toggle switch)---> Private |
| |                                                               |
| | [Edit] [Share] [Delete]                                       |
| +---------------------------------------------------------------+
|                                                                 |
+-----------------------------------------------------------------+
```

### Component Breakdown:

1.  **Action Buttons**:
    *   **Edit Button**: Opens the `EditExerciseInfoModal` to allow modification of the exercise's metadata (title, description, etc.) without changing the questions.
    *   **Delete Button**: Triggers a confirmation modal before proceeding with deletion.
2.  **Visibility Toggle**: A switch to control the `is_public` status.

### Modal: `EditExerciseInfoModal.tsx`

-   **Trigger**: Clicking the "Edit" button on an exercise card in `MyExercises.tsx`.
-   **Content**: A form containing fields for all editable metadata:
    *   Title
    *   Description
    *   Grade
    *   Subject
    *   Semester
    *   Curriculum Type
    *   Assessment Type
-   **Actions**:
    *   [Cancel] button (closes the modal).
    *   [Save Changes] button (submits the form and updates the exercise).

---

## Component: `ExerciseCard.tsx` (Data Consistency)

### Goal
To ensure the `ExerciseCard` component displays the exact same set of information whether it is rendered in the "My Created Exercises" list or the public "Library".

### Required Data Fields
The `exercise` object passed to `ExerciseCard` must contain the following fields to be displayed:
- `title`
- `description`
- `subject`
- `grade`
- `semester`
- `curriculum_type`
- `assessment_type`
- `difficulty`
- `creatorName` (or equivalent)
- `createdAt`
- `questions` (for question count)

### Action Item
The `getPublicExercises` function in `supabaseService.ts` must be updated to `select` all of the above fields. The current implementation may be missing fields like `semester`, which needs to be added to the query. The `ExerciseCard.tsx` component should also be updated to render any fields that are currently missing, such as `semester`.

---

## Component: `TakeExercise.tsx` (Immediate Feedback)

### Goal
To provide immediate and detailed feedback to all users (both logged-in students and public users) after they complete an exercise.

### UI/UX Flow
1.  A user (student or public) takes an exercise.
2.  Upon submitting their answers, the view will update.
3.  The updated view will display the following:
    *   The final score (e.g., "Your Score: 85%").
    *   A clear "Thank you for completing the exercise!" message.
    *   A "Review Your Answers" section.
4.  The "Review Your Answers" section will render the complete exercise again, but this time including:
    *   The original questions.
    *   The user's submitted answers.
    *   The correct answers clearly indicated.
    *   The detailed explanation for each question, identical to how it appears in the `ExercisePreview` component.

### Implementation Notes
-   The logic for displaying the completed exercise with answers and explanations will be handled within the `TakeExercise.tsx` component.
-   State management (e.g., using `useState`) will be used to track whether the exercise has been submitted.
-   The rendering logic for the questions and explanations can be reused or adapted from the existing `ExercisePreview.tsx` component to ensure visual consistency and code reusability.

---

## Component: `ExerciseBuilder.tsx` (Multi-Step Workflow)

### Goal
To create a clear, step-by-step workflow for building an exercise, from initial setup to final save, ensuring data integrity and a smooth user experience.

### UI/UX Flow

The builder is organized into four distinct tabs:

1.  **Basic Setting**: The user configures all initial parameters for the exercise (subject, grade, learning objectives, etc.). An "Apply" button moves them to the next step.
2.  **AI Prompt Setting**:
    *   Displays a static summary of the settings from the previous step.
    *   The user can generate an AI prompt by clicking **[Buat Prompt AI]**.
    *   This opens a modal (`PromptDisplayModal`) containing the generated prompt and detailed instructions for using it with the recommended Qwen AI.
    *   The modal includes a **[Salin Prompt & Buka AI]** button that copies the prompt and opens the Qwen AI website in a new tab.
    *   A **[Tutup]** button in the modal closes it and navigates the user to the "Paste JSON" tab.
3.  **Paste JSON**:
    *   The user pastes the JSON output from the AI into a text area.
    *   Upon clicking **[Process and Apply JSON]**, a success alert appears.
    *   After the user dismisses the alert, the page automatically navigates to the "Preview" tab.
4.  **Preview**:
    *   A user guide explains that this is a simulation of the student experience.
    *   The user can interact with the exercise and click "Submit" to see the results, including correct answers and feedback.
    *   The **[Save Exercise]** button is located at the bottom of this tab, ensuring the user only saves after a final review.

### Implementation Notes
-   The main state, including the active tab (`activeTab`), is managed in `ExerciseBuilder.tsx`.
-   The `staticData` state is used to lock in settings when moving from "Basic Setting" to "AI Prompt Setting".
-   Navigation between tabs is handled by the `setActiveTab` function, which is triggered by various UI interactions (button clicks, successful JSON paste).
-   The `PromptDisplayModal` contains its own UI logic for buttons and instructional text. The `onClose` prop passed to it is now a function that both closes the modal and navigates to the "Paste JSON" tab.
-   The "Save Exercise" button was moved from the main header into the "Preview" tab's content to enforce a logical workflow.

---

## Feature: Student Dashboard

### Goal
To create a comprehensive, motivating, and well-organized "command center" for students. The dashboard should provide a clear overview of tasks from all sources (teachers, parents, self-initiated) and easy access to progress tracking.

### Proposed Layout: Widget-Based Command Center

The UI will be modular, using a card-based layout for different sections.

```
+--------------------------------------------------------------------------------------+
| Header: [Logo] [Nama Siswa & Avatar] [Notifikasi 🔔] [Poin/Gamifikasi ✨]             |
+--------------------------------------------------------------------------------------+
|                                                                                      |
|   +---------------------------------+  +-------------------------------------------+ |
|   | Widget: Tugas Hari Ini (Today)  |  | Widget: Progres & Rapor Belajar             | |
|   | - Tugas dari Guru               |  | - Grafik performa per mata pelajaran      | |
|   | - Tugas dari Orang Tua          |  | - Rata-rata nilai & pencapaian            | |
|   | - Latihan Mandiri               |  | - [Lihat Rapor Lengkap ->]                | |
|   +---------------------------------+  +-------------------------------------------+ |
|                                                                                      |
|   +--------------------------------------------------------------------------------+ |
|   | Widget: Semua Tugas Aktif (Active Assignments)                                 | |
|   | [Filter: Semua | Dari Guru | Dari Ortu | Mandiri] [Urutkan: Tenggat | Terbaru] | |
|   | +----------------------------------------------------------------------------+ | |
|   | | [Tugas 1: Matematika] [Tenggat: Besok] [Status: Belum Dikerjakan] [Mulai]   | | |
|   | +----------------------------------------------------------------------------+ | |
|   | | [Tugas 2: B. Indo] [Tenggat: 3 hari lagi] [Status: Sedang Dikerjakan] [Lanjut]| |
|   | +----------------------------------------------------------------------------+ | |
|   | | [Tugas 3: dari Ayah] [Tenggat: -] [Status: Selesai] [Lihat Hasil]           | | |
|   | +----------------------------------------------------------------------------+ | |
|   +--------------------------------------------------------------------------------+ |
|                                                                                      |
|   +---------------------------------+  +-------------------------------------------+ |
|   | Widget: Kelas Saya              |  | Widget: Perpustakaan Latihan (Practice)   | |
|   | - Kelas A (Guru: Pak Budi)      |  | - Cari latihan soal berdasarkan...        | |
|   | - Kelas B (Guru: Ibu Ani)       |  | - [Jelajahi Perpustakaan ->]              | |
|   | - [Lihat Semua Kelas ->]        |  |                                           | |
|   +---------------------------------+  +-------------------------------------------+ |
|                                                                                      |
+--------------------------------------------------------------------------------------+
```

### Widget Breakdown:

1.  **Header & Gamification**:
    *   **Points/Badges (✨)**: Displays accumulated points for completing tasks, encouraging engagement.
    *   **Notifications (🔔)**: Aggregates all important updates: new assignments, grades, announcements.

2.  **Today's Focus Widget**:
    *   **Goal**: Provide a clear, prioritized list of tasks due today.
    *   **Features**: Clearly distinguishes task sources (teacher, parent, self-assigned) with unique icons. Direct action buttons like "Start" or "Continue".

3.  **My Progress Widget**:
    *   **Goal**: Offer a quick, visual snapshot of academic performance.
    *   **Features**: Uses charts (bar, radar) to show strengths/weaknesses by subject. Links to a more detailed report page.

4.  **All Assignments Widget**:
    *   **Goal**: A comprehensive list of all current and recently completed tasks.
    *   **Features**:
        *   **Filtering/Sorting**: Allows students to filter by source (teacher, parent) and sort by due date or assignment date.
        *   **Status Indicators**: Uses color-coding (e.g., red for overdue, yellow for in-progress, green for completed) for quick status checks.

5.  **My Classes Widget**:
    *   **Goal**: Quick navigation to individual class pages.
    *   **Features**: Lists all enrolled classes with teacher names, linking to each `StudentClassPage`.

6.  **Practice Library Widget**:
    *   **Goal**: Encourage self-directed learning.
    *   **Features**: A simple search interface to access the public exercise library for independent practice.
