# System Patterns: EduWorksheets

## Architecture

*   **Frontend:** Single-Page Application (SPA) built with React and Vite.
*   **Backend:** Backend-as-a-Service (BaaS) provided by Supabase.
*   **Component-Based Architecture:** The UI is built using a component-based architecture, with components organized by feature (e.g., `auth`, `classroom`, `exercise-builder`).

## Data-Driven UI and Content Generation

The application's core architecture revolves around a data-driven approach, where both the user interface and the educational content are dynamically generated based on structured data. This applies to rendering exercises and configuring the AI Prompt Builder.

### 1. JSON-Based Exercise and Content Model
- **Unified Data Structure**: Exercises, including their questions, answers, and metadata, are stored as a single JSON object in the `exercises` table. This denormalized approach simplifies data retrieval, as it avoids complex joins and allows an entire exercise to be fetched in a single query.
- **Dynamic Rendering**: The frontend uses a component-based architecture (`QuestionRenderer`, `ExerciseCard`, etc.) that dynamically renders UI elements based on the properties within the fetched JSON data. For example, the `type` property of a question object determines which interactive component is displayed.
- **Metadata for Rich UI**: The `metadata` field within the exercise's JSON is used to store supplementary information like `curriculum`. This allows components like `ExerciseCard` to display rich, contextual labels without needing extra database columns.

### 2. AI-Powered Content Generation
- **Sophisticated Prompt Engineering**: The `PromptBuilderForm` is the heart of content creation. It doesn't just collect user input; it programmatically constructs a highly detailed and structured prompt for an external AI.
- **Comprehensive Instruction Header**: The generated prompt includes a detailed `INSTRUCTION HEADER` that reflects every user selection from the form, such as `assessmentType`, `cognitiveLevel`, `learningContext`, and `feedbackType`. This ensures the AI has the full context to generate highly relevant and accurate questions.
- **Strict JSON Schema Enforcement**: The prompt's `REQUIREMENTS` section explicitly defines the expected JSON structure for every supported `questionType`. This strict schema guidance minimizes the risk of the AI producing malformed or unusable JSON, making the content generation process more reliable.
- **Centralized State Management**: The `ExerciseBuilder` component acts as a central controller, managing the state of the `PromptBuilderForm` (`promptData`) and the exercise being built (`exerciseData`). This ensures a clean data flow and separation of concerns.

### 3. Centralized Filter Options
- **Single Source of Truth**: To ensure consistency across the application, all filter dropdown options are managed in a single file: `src/data/filterOptions.ts`.
- **Static and Dynamic Options**: This file exports both static option arrays (e.g., `gradeLevels`, `assessmentTypeOptions`) and dynamic functions (e.g., `getSubjectOptions`) that fetch data from the backend.
- **Reusable and Maintainable**: This approach makes the code more maintainable, as any changes to filter options only need to be made in one place. It also ensures that components like the "AI Prompt Builder" and "My Created Exercises" always display the same, consistent options.

## Routing and Layout

*   **Routing:** `react-router-dom` is used for client-side routing.
*   **Layouts:** The application uses a `MainLayout` for the main application pages and an `AuthLayout` for authentication pages.
*   **Protected Routes:** The application uses a `ProtectedRoute` component to protect routes that require authentication.
*   **Role-Based Access Control (RBAC):** The application uses role-specific route components (`TeacherRoute`, `ParentRoute`) to restrict access to certain routes based on the user's role.

## State Management

*   **Authentication State:** The `AuthContext` is used to manage authentication state throughout the application.
*   **Local State:** Component-level state is managed using React hooks (`useState`, `useEffect`, etc.).

## Data Fetching and Caching

*   **Centralized Service:** All interactions with the Supabase backend are managed through a dedicated `supabaseService.ts`. This service acts as a single source of truth for all data fetching, insertion, and update operations.
*   **Clear Separation of Concerns:** By centralizing data logic, components are freed from handling data fetching directly. They simply call methods from the `supabaseService`, making the codebase cleaner, more maintainable, and easier to debug.
*   **Custom Hooks for Authentication:** While data fetching is centralized, authentication state is still managed through the `useAuth` custom hook, which interacts with the `AuthContext`.

## Database

*   **Schema:** The database schema is defined in SQL migration files within the `supabase/migrations` directory. A key design choice is the use of a JSONB column (`questions`) within the `exercises` table to store the entire array of question objects. This denormalizes the data for efficient retrieval of entire exercises in a single operation.
*   **Execution**: I don't have supabase cli, everytime i execute sql script, i do it manually in supabase.
*   **Parent-Child Relationship**: The `parent_child_link` table establishes a many-to-many relationship between parents and children, secured by RLS policies that ensure users can only access their own links. A unique, automatically generated `child_code` on the `users` table facilitates the secure linking process.
*   **Security:** Row Level Security (RLS) is enabled on all tables to enforce data access policies, ensuring users can only access and modify data they are permitted to.
*   **Automation:** Database triggers and functions are used to automate tasks such as creating user profiles upon sign-up and generating unique `child_code` values for students.
*   **Parental Notification System**: A robust notification system keeps parents informed about their children's academic activities.
    *   **Real-time Triggers**: PostgreSQL triggers on the `class_exercises` and `exercise_attempts` tables automatically generate notifications for parents when a child receives a new assignment or completes one.
    *   **Scheduled Overdue Checks**: A daily cron job executes the `notify_parents_of_overdue_assignments` function, which scans for incomplete assignments past their due date and sends notifications accordingly. This ensures parents are aware of and can follow up on pending tasks.

## Refined Architecture: Decoupled Progress Tracking

To provide more granular and accurate reporting, the progress tracking system was completely refactored. The original, monolithic `user_progress` table was insufficient for distinguishing between a student's personal practice and their performance on a specific class assignment.

### 1. Dual-Table Progress System
- **`user_progress` (Personal Mastery)**: This table now exclusively tracks a student's overall, lifelong progress on a specific exercise, regardless of class context. It answers the question: "How well does this student understand the material in this exercise?" Key columns include `best_score_overall` and `is_mastered`.
- **`class_assignment_progress` (Class Performance)**: This new table tracks a student's performance on an exercise *as a specific class assignment*. It answers the question: "How did this student perform on the homework for Math 101?" Key columns include `class_exercise_id`, `student_id`, `best_score`, and `status` (e.g., `completed_passed`, `completed_failed`).

### 2. Centralized Trigger Logic
- **`handle_exercise_attempt_update` Function**: A new, robust trigger function now orchestrates all progress updates. When a student submits an `exercise_attempt`:
    1.  It **always** updates the `user_progress` table to reflect personal mastery.
    2.  **If** the attempt is linked to a class assignment (`class_exercise_id` is not null), it **also** updates the `class_assignment_progress` table.
- **Decoupling**: This architecture decouples personal learning from formal assessment, allowing for more accurate reporting for all user roles (students, teachers, and parents).

### 3. Efficient Reporting with RPCs
- **Specialized RPCs**: New RPC functions like `get_class_grades_report` and `get_student_class_assignments` were created to query the new `class_assignment_progress` table directly.
- **Performance**: This avoids complex, slow, and error-prone `JOIN`s on the frontend, moving the heavy lifting of data aggregation to the database for faster and more reliable reporting.

## Refined Architecture: Centralized Options via Edge Function

To eliminate inconsistencies and create a true single source of truth, the management of filter options has been refactored.

### 1. Backend: `get-all-options` Edge Function
- **Single Source of Truth**: A new Supabase Edge Function, `get-all-options`, has been created to serve as the definitive source for all dynamic dropdown options.
- **Direct Database Reflection**: This function queries the database schema directly to retrieve the allowed values from the `ENUM` types. A helper function `get_enum_values` was created in the database for this purpose.
- **Schema Synchronization**: To ensure the Edge Function worked correctly, a migration (`20250713000000_create_missing_enums.sql`) was created to add the missing `ENUM` types to the database, ensuring the backend schema is perfectly synchronized with the frontend's data requirements.
- **Centralized Logic**: By centralizing this logic on the backend, any future changes to the database schema are automatically reflected in the options provided to the frontend, ensuring perfect synchronization.

### 2. Frontend: Dynamic and Asynchronous Option Fetching
- **Removed Hardcoded Data**: The `src/data/filterOptions.ts` file has been refactored to remove all hardcoded option arrays.
- **Asynchronous Fetching**: A new function, `fetchFilterOptions`, has been introduced. This function calls the `get-all-options` Edge Function to retrieve the options from the backend.
- **Component-Level State Management**: UI components that require these options (e.g., filter dropdowns, forms) now use React hooks (`useState`, `useEffect`) to fetch and manage this data asynchronously. Components will display a loading or disabled state until the options are successfully fetched, ensuring a smooth user experience.

## Curriculum Data Seeding

The `curriculum` table is populated using a series of SQL seed scripts located in the `supabase/sql-scripts/` directory. This approach ensures that the application has a consistent and comprehensive set of curriculum data from the start.

### 1. Data Structure
The `curriculum` table stores hierarchical educational data with the following columns:
- `curriculum_type`: The type of curriculum (e.g., 'Kurikulum Merdeka Belajar').
- `language`: The language of the curriculum material (e.g., 'id').
- `subject`: The subject name (e.g., 'Bahasa Indonesia', 'Matematika').
- `grade`: The grade level, including the school level (e.g., 'Grade 1 (SD)', 'Grade 10 (SMA)').
- `semester`: The semester ('Semester 1' or 'Semester 2').
- `chapter`: The chapter title within the subject and grade.
- `topic`: The specific topic within a chapter.

### 2. Seed Scripts
A dedicated SQL script is used for each subject to keep the data organized and manageable. The following scripts are used to populate the `curriculum` table:
- `seed_bahasa_indonesia.sql`
- `seed_bahasa_inggris.sql`
- `seed_ipa.sql`
- `seed_ipas.sql`
- `seed_ips.sql`
- `seed_matematika.sql`
- `seed_pendidikan_agama_islam.sql`
- `seed_pendidikan_pancasila.sql`

Each script first deletes any existing data for its specific subject to prevent duplication and then inserts the new curriculum data. This ensures data integrity and allows for easy updates.
