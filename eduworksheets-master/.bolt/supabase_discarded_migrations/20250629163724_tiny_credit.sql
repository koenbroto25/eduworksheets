-- Create policies for questions table
CREATE POLICY "Users can read questions from public exercises"
  ON questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercises 
      WHERE exercises.id = questions.exercise_id 
      AND exercises.is_public = true
    )
  );

CREATE POLICY "Users can read questions from own exercises"
  ON questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercises 
      WHERE exercises.id = questions.exercise_id 
      AND exercises.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can create questions for own exercises"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercises 
      WHERE exercises.id = questions.exercise_id 
      AND exercises.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions in own exercises"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercises 
      WHERE exercises.id = questions.exercise_id 
      AND exercises.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercises 
      WHERE exercises.id = questions.exercise_id 
      AND exercises.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions from own exercises"
  ON questions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercises 
      WHERE exercises.id = questions.exercise_id 
      AND exercises.creator_id = auth.uid()
    )
  );