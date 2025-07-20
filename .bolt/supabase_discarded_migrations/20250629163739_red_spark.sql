-- Create policies for class_students table
CREATE POLICY "Teachers can read students in own classes"
  ON class_students
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_students.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can read own class enrollments"
  ON class_students
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can add students to own classes"
  ON class_students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_students.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can join classes"
  ON class_students
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can update students in own classes"
  ON class_students
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_students.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own enrollments"
  ON class_students
  FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());