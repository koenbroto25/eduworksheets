/*
  # Insert sample data for testing

  1. Sample Data
    - Sample users (teachers and students)
    - Sample exercises with questions
    - Sample classes with enrollments
    - Sample exercise attempts and progress

  Note: This is for development/testing purposes only
*/

-- Insert sample users (passwords will be handled by Supabase Auth)
-- These are just the profile records, actual auth users need to be created through Supabase Auth

-- Sample teachers
INSERT INTO users (id, email, name, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'teacher1@demo.com', 'Ms. Sarah Johnson', 'teacher'),
  ('550e8400-e29b-41d4-a716-446655440002', 'teacher2@demo.com', 'Dr. Michael Smith', 'teacher'),
  ('550e8400-e29b-41d4-a716-446655440003', 'teacher3@demo.com', 'Pak Ahmad Rahman', 'teacher')
ON CONFLICT (id) DO NOTHING;

-- Sample students
INSERT INTO users (id, email, name, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440011', 'student1@demo.com', 'Alice Cooper', 'student'),
  ('550e8400-e29b-41d4-a716-446655440012', 'student2@demo.com', 'Bob Wilson', 'student'),
  ('550e8400-e29b-41d4-a716-446655440013', 'student3@demo.com', 'Charlie Brown', 'student'),
  ('550e8400-e29b-41d4-a716-446655440014', 'student4@demo.com', 'Diana Prince', 'student'),
  ('550e8400-e29b-41d4-a716-446655440015', 'student5@demo.com', 'Eva Martinez', 'student')
ON CONFLICT (id) DO NOTHING;

-- Sample exercises
INSERT INTO exercises (id, title, description, subject, grade, material, difficulty, is_public, creator_id, tags) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'Basic Algebra: Linear Equations',
    'Practice solving linear equations with one variable. Perfect for Grade 8 students learning fundamental algebra concepts.',
    'Mathematics',
    '8',
    'Algebra',
    'medium',
    true,
    '550e8400-e29b-41d4-a716-446655440001',
    ARRAY['algebra', 'equations', 'mathematics']
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    'Photosynthesis Process',
    'Understanding how plants convert sunlight into energy through photosynthesis. Includes cellular processes and chemical equations.',
    'Biology',
    '9',
    'Plant Biology',
    'easy',
    true,
    '550e8400-e29b-41d4-a716-446655440002',
    ARRAY['biology', 'plants', 'photosynthesis']
  ),
  (
    '660e8400-e29b-41d4-a716-446655440003',
    'Indonesian Grammar: Prefix and Suffix',
    'Learn about Indonesian language prefixes and suffixes with practical examples and usage patterns.',
    'Indonesian',
    '7',
    'Grammar',
    'medium',
    true,
    '550e8400-e29b-41d4-a716-446655440003',
    ARRAY['indonesian', 'grammar', 'language']
  ),
  (
    '660e8400-e29b-41d4-a716-446655440004',
    'Fraction Operations',
    'Master addition, subtraction, multiplication, and division of fractions with step-by-step solutions.',
    'Mathematics',
    '6',
    'Fractions',
    'easy',
    true,
    '550e8400-e29b-41d4-a716-446655440001',
    ARRAY['mathematics', 'fractions', 'operations']
  )
ON CONFLICT (id) DO NOTHING;

-- Sample questions for algebra exercise
INSERT INTO questions (exercise_id, type, question, correct_answer, options, explanation, difficulty, order_index) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'multiple_choice',
    'Solve for x: 2x + 5 = 13',
    '0',
    '["x = 4", "x = 6", "x = 9", "x = 11"]',
    'Subtract 5 from both sides: 2x = 8, then divide by 2: x = 4',
    'medium',
    1
  ),
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'multiple_choice',
    'What is the value of y in: 3y - 7 = 14?',
    '1',
    '["y = 5", "y = 7", "y = 9", "y = 11"]',
    'Add 7 to both sides: 3y = 21, then divide by 3: y = 7',
    'medium',
    2
  )
ON CONFLICT DO NOTHING;

-- Sample questions for photosynthesis exercise
INSERT INTO questions (exercise_id, type, question, correct_answer, options, explanation, difficulty, order_index) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440002',
    'true_false',
    'Photosynthesis only occurs in the leaves of plants.',
    'false',
    NULL,
    'Photosynthesis can occur in any green part of the plant that contains chlorophyll.',
    'easy',
    1
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    'multiple_choice',
    'What is the main product of photosynthesis?',
    '0',
    '["Glucose", "Oxygen", "Carbon dioxide", "Water"]',
    'Glucose is the main product, while oxygen is released as a byproduct.',
    'easy',
    2
  )
ON CONFLICT DO NOTHING;

-- Sample questions for Indonesian grammar exercise
INSERT INTO questions (exercise_id, type, question, correct_answer, options, explanation, difficulty, order_index) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440003',
    'short_answer',
    'What is the root word of "membaca"?',
    '"baca"',
    NULL,
    'The prefix "mem-" is added to the root word "baca" to form "membaca".',
    'medium',
    1
  ),
  (
    '660e8400-e29b-41d4-a716-446655440003',
    'multiple_choice',
    'Which prefix is used with the word "tulis" to mean "to write"?',
    '1',
    '["me-", "men-", "meng-", "mem-"]',
    'The prefix "men-" is used with "tulis" to form "menulis".',
    'medium',
    2
  )
ON CONFLICT DO NOTHING;

-- Sample classes
INSERT INTO classes (id, name, description, teacher_id, class_code) VALUES
  (
    '770e8400-e29b-41d4-a716-446655440001',
    'Grade 8 Mathematics',
    'Advanced mathematics for grade 8 students focusing on algebra and geometry.',
    '550e8400-e29b-41d4-a716-446655440001',
    'MATH8A01'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440002',
    'Grade 9 Biology',
    'Introduction to biology covering cell structure, photosynthesis, and basic genetics.',
    '550e8400-e29b-41d4-a716-446655440002',
    'BIO9A01'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440003',
    'Grade 7 Indonesian Language',
    'Indonesian language fundamentals including grammar, vocabulary, and writing skills.',
    '550e8400-e29b-41d4-a716-446655440003',
    'IND7A01'
  )
ON CONFLICT (id) DO NOTHING;

-- Sample class enrollments
INSERT INTO class_students (class_id, student_id) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011'),
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012'),
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440013'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440014'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440015'),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440013'),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440014')
ON CONFLICT (class_id, student_id) DO NOTHING;

-- Sample exercise assignments to classes
INSERT INTO class_exercises (class_id, exercise_id) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001'),
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004'),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002'),
  ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003')
ON CONFLICT (class_id, exercise_id) DO NOTHING;

-- Sample exercise attempts
INSERT INTO exercise_attempts (exercise_id, user_id, class_id, answers, score, max_score, time_elapsed, is_completed, completed_at) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440011',
    '770e8400-e29b-41d4-a716-446655440001',
    '[{"questionId": 1, "answer": 0}, {"questionId": 2, "answer": 1}]',
    85,
    100,
    420,
    true,
    now() - interval '2 days'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440012',
    '770e8400-e29b-41d4-a716-446655440002',
    '[{"questionId": 1, "answer": false}, {"questionId": 2, "answer": 0}]',
    90,
    100,
    380,
    true,
    now() - interval '1 day'
  )
ON CONFLICT DO NOTHING;