# Supabase Database Setup Scripts

Run these SQL migration files in order in your Supabase SQL Editor:

## Order of Execution:

1. **red_surf.sql** - Create enum types (user_role, difficulty_level, question_type)
2. **smooth_tower.sql** - Create users table
3. **winter_hill.sql** - Create users policies
4. **yellow_recipe.sql** - Create user functions (handle_new_user, handle_user_update)
5. **lucky_summit.sql** - Create user triggers
6. **dusty_sun.sql** - Create exercises table
7. **violet_pine.sql** - Create exercises policies
8. **lively_sea.sql** - Create exercises functions (handle_exercise_update)
9. **bronze_mouse.sql** - Create exercises triggers and indexes
10. **dusty_cherry.sql** - Create questions table
11. **tiny_credit.sql** - Create questions policies
12. **soft_coast.sql** - Create questions indexes
13. **lingering_meadow.sql** - Create classes table
14. **bitter_poetry.sql** - Create class_students table
15. **bold_palace.sql** - Create class_exercises table
16. **snowy_star.sql** - Create classes policies
17. **red_spark.sql** - Create class_students policies
18. **morning_torch.sql** - Create class_exercises policies
19. **aged_fire.sql** - Create class functions (generate_class_code, handle_class_update, set_class_code)
20. **tiny_lantern.sql** - Create class triggers and indexes
21. **quiet_sea.sql** - Create exercise_attempts table
22. **twilight_mouse.sql** - Create exercise_attempts policies
23. **precious_wood.sql** - Create user_progress table
24. **fancy_queen.sql** - Create user_progress policies
25. **dark_snow.sql** - Create progress functions (handle_attempt_completion, update_user_progress)
26. **shiny_ember.sql** - Create progress triggers and indexes
27. **stark_thunder.sql** - Insert sample data (optional)

## Migration File Locations:

All migration files are located in: `/home/project/supabase/migrations/`

The files follow this naming pattern:
- `20250629163705_red_surf.sql`
- `20250629163707_smooth_tower.sql`
- etc.

## Instructions:

1. **Go to your Supabase Dashboard** → SQL Editor
2. **Copy and paste each migration file content** in the exact order listed above
3. **Execute each script individually** and wait for success before proceeding
4. **Check for errors** after each execution

## What Each Script Does:

### Core Setup (Scripts 1-5)
- **red_surf**: Creates enum types for user roles, difficulty levels, and question types
- **smooth_tower**: Creates the main users table with RLS enabled
- **winter_hill**: Sets up security policies for user data access
- **yellow_recipe**: Creates functions for handling user creation and updates
- **lucky_summit**: Sets up triggers for automatic user management

### Exercises System (Scripts 6-12)
- **dusty_sun**: Creates exercises table for storing educational content
- **violet_pine**: Sets up security policies for exercise access
- **lively_sea**: Creates functions for exercise management
- **bronze_mouse**: Sets up triggers and performance indexes
- **dusty_cherry**: Creates questions table linked to exercises
- **tiny_credit**: Sets up security policies for question access
- **soft_coast**: Creates performance indexes for questions

### Class Management (Scripts 13-20)
- **lingering_meadow**: Creates classes table for organizing students
- **bitter_poetry**: Creates class_students junction table
- **bold_palace**: Creates class_exercises junction table
- **snowy_star**: Sets up security policies for class access
- **red_spark**: Sets up policies for student enrollment
- **morning_torch**: Sets up policies for exercise assignments
- **aged_fire**: Creates functions for class code generation and management
- **tiny_lantern**: Sets up triggers and indexes for class system

### Progress Tracking (Scripts 21-26)
- **quiet_sea**: Creates exercise_attempts table for tracking student work
- **twilight_mouse**: Sets up security policies for attempt data
- **precious_wood**: Creates user_progress table for analytics
- **fancy_queen**: Sets up policies for progress data access
- **dark_snow**: Creates functions for automatic progress tracking
- **shiny_ember**: Sets up triggers and indexes for progress system

### Sample Data (Script 27)
- **stark_thunder**: Inserts demo users, exercises, and questions (optional)

## After Running All Scripts:

1. **Create demo auth users** in Supabase Auth dashboard:
   - Email: `teacher1@demo.com` (Password: `demo123`)
   - Email: `student1@demo.com` (Password: `demo123`)

2. **Test the application** by logging in with demo accounts

3. **Verify database setup** by checking that all tables exist and have data

## Troubleshooting:

If you encounter errors:

1. **Check dependencies**: Make sure previous scripts ran successfully
2. **Verify table existence**: Ensure required tables exist before running dependent scripts
3. **Check Supabase logs**: Look for detailed error messages in the dashboard
4. **RLS verification**: Ensure Row Level Security is enabled on all tables
5. **Function conflicts**: If functions already exist, you may need to drop them first

## Common Issues:

- **"relation does not exist"**: Run the table creation scripts first
- **"function already exists"**: Add `OR REPLACE` to function definitions
- **"policy already exists"**: Drop existing policies before creating new ones
- **Permission errors**: Ensure you're running scripts as the database owner

## Database Schema Overview:

After successful execution, you'll have:
- ✅ User management with role-based access
- ✅ Exercise and question creation system
- ✅ Class management with student enrollment
- ✅ Progress tracking and analytics
- ✅ Comprehensive security policies
- ✅ Sample data for testing