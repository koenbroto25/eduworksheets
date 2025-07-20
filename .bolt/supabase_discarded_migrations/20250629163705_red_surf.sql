-- Create enum types
CREATE TYPE user_role AS ENUM ('teacher', 'student');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'short_answer', 'true_false', 'matching');