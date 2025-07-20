-- Create policies for user_progress table
CREATE POLICY "Users can read own progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Teachers can read student progress in their classes"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (
    class_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = user_progress.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own progress"
  ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress"
  ON user_progress
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());