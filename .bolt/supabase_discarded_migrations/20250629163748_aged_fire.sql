-- Create function to generate unique class code
CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM classes WHERE class_code = code) INTO exists;
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle class updates
CREATE OR REPLACE FUNCTION handle_class_update()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate class code
CREATE OR REPLACE FUNCTION set_class_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.class_code IS NULL OR NEW.class_code = '' THEN
    NEW.class_code := generate_class_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;