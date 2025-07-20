DROP POLICY IF EXISTS "Users can read public exercises" ON exercises;
CREATE POLICY "Users can read public exercises"
  ON exercises
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

DROP POLICY IF EXISTS "Users can read questions from public exercises" ON questions;
CREATE POLICY "Users can read questions from public exercises"
  ON questions
  FOR SELECT
  TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = questions.exercise_id AND exercises.is_public = true));
