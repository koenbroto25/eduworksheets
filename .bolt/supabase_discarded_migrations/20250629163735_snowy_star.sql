-- Create policies for classes table
CREATE POLICY "Teachers can read own classes"
  ON classes
  FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can read classes they're enrolled in"
  ON classes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM class_students 
      WHERE class_students.class_id = classes.id 
      AND class_students.student_id = auth.uid()
      AND class_students.is_active = true
    )
  );

CREATE POLICY "Teachers can create classes"
  ON classes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update own classes"
  ON classes
  FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own classes"
  ON classes
  FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());