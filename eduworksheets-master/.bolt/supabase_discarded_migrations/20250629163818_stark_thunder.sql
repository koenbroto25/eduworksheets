-- Insert sample users (Note: These are just profile records, auth users need to be created separately)
INSERT INTO users (id, email, name, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'teacher1@demo.com', 'Ms. Sarah Johnson', 'teacher'),
  ('550e8400-e29b-41d4-a716-446655440002', 'teacher2@demo.com', 'Dr. Michael Smith', 'teacher'),
  ('550e8400-e29b-41d4-a716-446655440011', 'student1@demo.com', 'Alice Cooper', 'student'),
  ('550e8400-e29b-41d4-a716-446655440012', 'student2@demo.com', 'Bob Wilson', 'student')
ON CONFLICT (id) DO NOTHING;

-- Insert sample exercises
INSERT INTO exercises (id, title, description, subject, grade, material, difficulty, is_public, creator_id, tags) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'Basic Algebra: Linear Equations',
    'Practice solving linear equations with one variable. Perfect for Grade 8 students.',
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
    'Understanding how plants convert sunlight into energy through photosynthesis.',
    'Biology',
    '9',
    'Plant Biology',
    'easy',
    true,
    '550e8400-e29b-41d4-a716-446655440002',
    ARRAY['biology', 'plants', 'photosynthesis']
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample questions
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
    '660e8400-e29b-41d4-a716-446655440002',
    'true_false',
    'Photosynthesis only occurs in the leaves of plants.',
    'false',
    NULL,
    'Photosynthesis can occur in any green part of the plant that contains chlorophyll.',
    'easy',
    1
  )
ON CONFLICT DO NOTHING;