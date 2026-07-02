-- Create policies for class_exercises table
CREATE POLICY "Teachers can read exercises in own classes"
  ON class_exercises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_exercises.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can read exercises in enrolled classes"
  ON class_exercises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM class_students 
      WHERE class_students.class_id = class_exercises.class_id 
      AND class_students.student_id = auth.uid()
      AND class_students.is_active = true
    )
  );

CREATE POLICY "Teachers can assign exercises to own classes"
  ON class_exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_exercises.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update exercises in own classes"
  ON class_exercises
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_exercises.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can remove exercises from own classes"
  ON class_exercises
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_exercises.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );