-- Create policies for exercises table
CREATE POLICY "Users can read public exercises"
  ON exercises
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can read own exercises"
  ON exercises
  FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Users can create exercises"
  ON exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own exercises"
  ON exercises
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can delete own exercises"
  ON exercises
  FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());