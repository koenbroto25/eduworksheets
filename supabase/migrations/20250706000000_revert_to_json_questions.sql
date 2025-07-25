ALTER TABLE public.questions
DROP COLUMN IF EXISTS component_code;

ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS question TEXT,
ADD COLUMN IF NOT EXISTS options JSONB,
ADD COLUMN IF NOT EXISTS answer JSONB,
ADD COLUMN IF NOT EXISTS explanation TEXT;
