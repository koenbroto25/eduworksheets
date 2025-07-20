-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  subject text NOT NULL,
  grade text NOT NULL,
  material text,
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  is_public boolean NOT NULL DEFAULT false,
  creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;