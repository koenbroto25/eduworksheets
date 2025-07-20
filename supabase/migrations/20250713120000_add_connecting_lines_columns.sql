ALTER TABLE public.questions
ADD COLUMN "leftItems" jsonb,
ADD COLUMN "rightItems" jsonb;

-- Since we are modifying the table, let's also add a comment to describe the new columns
COMMENT ON COLUMN public.questions."leftItems" IS 'Stores the items for the left side of a connecting-lines question.';
COMMENT ON COLUMN public.questions."rightItems" IS 'Stores the items for the right side of a connecting-lines question.';
