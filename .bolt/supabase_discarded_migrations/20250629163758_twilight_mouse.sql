-- Create policies for exercise_attempts table
CREATE POLICY "Users can read own attempts"
  ON exercise_attempts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Teachers can read student attempts in their classes"
  ON exercise_attempts
  FOR SELECT
  TO authenticated
  USING (
    class_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = exercise_attempts.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own attempts"
  ON exercise_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own attempts"
  ON exercise_attempts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own attempts"
  ON exercise_attempts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());