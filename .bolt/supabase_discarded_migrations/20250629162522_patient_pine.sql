/*
  # Create useful views and functions

  1. Views
    - `exercise_stats` - Statistics for exercises
    - `class_progress` - Progress overview for classes
    - `user_dashboard_stats` - Dashboard statistics for users

  2. Functions
    - `get_public_exercises` - Get public exercises with creator info
    - `get_user_classes` - Get classes for a user based on role
    - `get_class_students_with_progress` - Get students in a class with their progress
*/

-- Create view for exercise statistics
CREATE OR REPLACE VIEW exercise_stats AS
SELECT 
  e.id,
  e.title,
  e.subject,
  e.grade,
  e.difficulty,
  e.is_public,
  e.creator_id,
  u.name as creator_name,
  e.created_at,
  COUNT(DISTINCT q.id) as question_count,
  COUNT(DISTINCT ea.id) as attempt_count,
  COUNT(DISTINCT ea.user_id) as unique_users,
  ROUND(AVG(ea.score)::numeric, 2) as average_score,
  MAX(ea.score) as highest_score
FROM exercises e
LEFT JOIN users u ON e.creator_id = u.id
LEFT JOIN questions q ON e.id = q.exercise_id
LEFT JOIN exercise_attempts ea ON e.id = ea.exercise_id AND ea.is_completed = true
GROUP BY e.id, u.name;

-- Create view for class progress
CREATE OR REPLACE VIEW class_progress AS
SELECT 
  c.id as class_id,
  c.name as class_name,
  c.teacher_id,
  COUNT(DISTINCT cs.student_id) as total_students,
  COUNT(DISTINCT ce.exercise_id) as total_exercises,
  COUNT(DISTINCT ea.id) as total_attempts,
  COUNT(DISTINCT CASE WHEN ea.is_completed THEN ea.id END) as completed_attempts,
  ROUND(
    CASE 
      WHEN COUNT(DISTINCT ea.id) > 0 
      THEN (COUNT(DISTINCT CASE WHEN ea.is_completed THEN ea.id END)::float / COUNT(DISTINCT ea.id) * 100)
      ELSE 0 
    END, 2
  ) as completion_rate
FROM classes c
LEFT JOIN class_students cs ON c.id = cs.class_id AND cs.is_active = true
LEFT JOIN class_exercises ce ON c.id = ce.class_id AND ce.is_active = true
LEFT JOIN exercise_attempts ea ON ce.exercise_id = ea.exercise_id AND ea.class_id = c.id
GROUP BY c.id, c.name, c.teacher_id;

-- Create view for user dashboard statistics
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
  u.id as user_id,
  u.role,
  -- Teacher stats
  CASE WHEN u.role = 'teacher' THEN COUNT(DISTINCT e.id) ELSE 0 END as exercises_created,
  CASE WHEN u.role = 'teacher' THEN COUNT(DISTINCT c.id) ELSE 0 END as classes_created,
  CASE WHEN u.role = 'teacher' THEN COUNT(DISTINCT cs.student_id) ELSE 0 END as total_students,
  -- Student stats
  CASE WHEN u.role = 'student' THEN COUNT(DISTINCT cs.class_id) ELSE 0 END as classes_joined,
  CASE WHEN u.role = 'student' THEN COUNT(DISTINCT ea.id) ELSE 0 END as exercises_attempted,
  CASE WHEN u.role = 'student' THEN COUNT(DISTINCT CASE WHEN ea.is_completed THEN ea.id END) ELSE 0 END as exercises_completed,
  CASE WHEN u.role = 'student' AND COUNT(DISTINCT CASE WHEN ea.is_completed THEN ea.id END) > 0 
       THEN ROUND(AVG(ea.score)::numeric, 2) ELSE 0 END as average_score
FROM users u
LEFT JOIN exercises e ON u.id = e.creator_id AND u.role = 'teacher'
LEFT JOIN classes c ON u.id = c.teacher_id AND u.role = 'teacher'
LEFT JOIN class_students cs ON (u.id = cs.student_id AND u.role = 'student') OR (c.id = cs.class_id AND u.role = 'teacher')
LEFT JOIN exercise_attempts ea ON u.id = ea.user_id AND u.role = 'student' AND ea.is_completed = true
GROUP BY u.id, u.role;

-- Function to get public exercises with creator info
CREATE OR REPLACE FUNCTION get_public_exercises(
  search_term text DEFAULT NULL,
  subject_filter text DEFAULT NULL,
  grade_filter text DEFAULT NULL,
  difficulty_filter difficulty_level DEFAULT NULL,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  subject text,
  grade text,
  material text,
  difficulty difficulty_level,
  creator_id uuid,
  creator_name text,
  created_at timestamptz,
  question_count bigint,
  tags text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.subject,
    e.grade,
    e.material,
    e.difficulty,
    e.creator_id,
    u.name as creator_name,
    e.created_at,
    COUNT(q.id) as question_count,
    e.tags
  FROM exercises e
  JOIN users u ON e.creator_id = u.id
  LEFT JOIN questions q ON e.id = q.exercise_id
  WHERE e.is_public = true
    AND (search_term IS NULL OR 
         e.title ILIKE '%' || search_term || '%' OR 
         e.description ILIKE '%' || search_term || '%' OR
         e.subject ILIKE '%' || search_term || '%')
    AND (subject_filter IS NULL OR e.subject = subject_filter)
    AND (grade_filter IS NULL OR e.grade = grade_filter)
    AND (difficulty_filter IS NULL OR e.difficulty = difficulty_filter)
  GROUP BY e.id, u.name
  ORDER BY e.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user classes based on role
CREATE OR REPLACE FUNCTION get_user_classes(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  teacher_id uuid,
  teacher_name text,
  class_code text,
  is_active boolean,
  created_at timestamptz,
  student_count bigint,
  exercise_count bigint,
  user_role user_role
) AS $$
DECLARE
  user_role_val user_role;
BEGIN
  -- Get user role
  SELECT role INTO user_role_val FROM users WHERE users.id = user_uuid;
  
  IF user_role_val = 'teacher' THEN
    -- Return classes where user is teacher
    RETURN QUERY
    SELECT 
      c.id,
      c.name,
      c.description,
      c.teacher_id,
      u.name as teacher_name,
      c.class_code,
      c.is_active,
      c.created_at,
      COUNT(DISTINCT cs.student_id) as student_count,
      COUNT(DISTINCT ce.exercise_id) as exercise_count,
      user_role_val as user_role
    FROM classes c
    JOIN users u ON c.teacher_id = u.id
    LEFT JOIN class_students cs ON c.id = cs.class_id AND cs.is_active = true
    LEFT JOIN class_exercises ce ON c.id = ce.class_id AND ce.is_active = true
    WHERE c.teacher_id = user_uuid
    GROUP BY c.id, u.name
    ORDER BY c.created_at DESC;
  ELSE
    -- Return classes where user is student
    RETURN QUERY
    SELECT 
      c.id,
      c.name,
      c.description,
      c.teacher_id,
      u.name as teacher_name,
      c.class_code,
      c.is_active,
      c.created_at,
      COUNT(DISTINCT cs.student_id) as student_count,
      COUNT(DISTINCT ce.exercise_id) as exercise_count,
      user_role_val as user_role
    FROM classes c
    JOIN users u ON c.teacher_id = u.id
    JOIN class_students cs_user ON c.id = cs_user.class_id AND cs_user.student_id = user_uuid AND cs_user.is_active = true
    LEFT JOIN class_students cs ON c.id = cs.class_id AND cs.is_active = true
    LEFT JOIN class_exercises ce ON c.id = ce.class_id AND ce.is_active = true
    GROUP BY c.id, u.name
    ORDER BY cs_user.joined_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get class students with their progress
CREATE OR REPLACE FUNCTION get_class_students_with_progress(class_uuid uuid)
RETURNS TABLE (
  student_id uuid,
  student_name text,
  student_email text,
  joined_at timestamptz,
  exercises_assigned bigint,
  exercises_completed bigint,
  average_score numeric,
  last_activity timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as student_id,
    u.name as student_name,
    u.email as student_email,
    cs.joined_at,
    COUNT(DISTINCT ce.exercise_id) as exercises_assigned,
    COUNT(DISTINCT up.exercise_id) as exercises_completed,
    COALESCE(ROUND(AVG(up.best_score)::numeric, 2), 0) as average_score,
    MAX(up.last_attempt_at) as last_activity
  FROM class_students cs
  JOIN users u ON cs.student_id = u.id
  LEFT JOIN class_exercises ce ON cs.class_id = ce.class_id AND ce.is_active = true
  LEFT JOIN user_progress up ON u.id = up.user_id AND ce.exercise_id = up.exercise_id AND up.class_id = class_uuid
  WHERE cs.class_id = class_uuid AND cs.is_active = true
  GROUP BY u.id, u.name, u.email, cs.joined_at
  ORDER BY cs.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON exercise_stats TO authenticated;
GRANT SELECT ON class_progress TO authenticated;
GRANT SELECT ON user_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_exercises TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_classes TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_students_with_progress TO authenticated;