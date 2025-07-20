-- Create function to handle exercise updates
CREATE OR REPLACE FUNCTION handle_exercise_update()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;