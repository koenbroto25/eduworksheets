-- Create class_exercises table
CREATE TABLE IF NOT EXISTS class_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  assigned_at timestamptz DEFAULT now(),
  due_date timestamptz,
  UNIQUE(class_id, exercise_id)
);

-- Enable RLS
ALTER TABLE class_exercises ENABLE ROW LEVEL SECURITY;