# Tech Context: EduWorksheets

## Technologies Used

*   **Frontend:**
    *   React
    *   Vite
    *   TypeScript
    *   Tailwind CSS
*   **Routing:**
    *   React Router DOM
*   **Backend & Database:**
    *   Supabase (PostgreSQL)
*   **Linting & Formatting:**
    *   ESLint
    *   Prettier (implied by standard Vite/React setups)

## Development Setup

1.  **Prerequisites:**
    *   Node.js and npm
    *   A Supabase account and project

2.  **Installation:**
    *   Run `npm install` to install project dependencies.

3.  **Database Setup:**
    *   Follow the instructions in `DATABASE_SETUP_INSTRUCTIONS.md` to set up the Supabase database.
    *   **Note:** The user does not have the Supabase CLI installed. All SQL migration scripts will be provided to be run manually in the Supabase SQL editor.

4.  **Running the Application:**
    *   Run `npm run dev` to start the development server.
    *   The application will be available at `http://localhost:5173`.

## Technical Constraints

*   The application relies on Supabase for authentication, database, and other backend services.
*   The frontend is built as a single-page application (SPA).
*   The styling is done using Tailwind CSS, so knowledge of Tailwind is required for UI development.
