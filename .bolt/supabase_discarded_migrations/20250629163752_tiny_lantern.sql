-- Create trigger for class updates
DROP TRIGGER IF EXISTS on_class_updated ON classes;
CREATE TRIGGER on_class_updated
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION handle_class_update();

-- Create trigger for class code generation
DROP TRIGGER IF EXISTS on_class_code_generation ON classes;
CREATE TRIGGER on_class_code_generation
  BEFORE INSERT ON classes
  FOR EACH ROW EXECUTE FUNCTION set_class_code();

-- Create indexes for classes
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_class_code ON classes(class_code);
CREATE INDEX IF NOT EXISTS idx_classes_is_active ON classes(is_active);

-- Create indexes for class_students
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_class_students_is_active ON class_students(is_active);

-- Create indexes for class_exercises
CREATE INDEX IF NOT EXISTS idx_class_exercises_class_id ON class_exercises(class_id);
CREATE INDEX IF NOT EXISTS idx_class_exercises_exercise_id ON class_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_class_exercises_is_active ON class_exercises(is_active);