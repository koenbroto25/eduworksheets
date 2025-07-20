-- Drop all potentially conflicting SELECT policies on class_members first for a clean slate.
DROP POLICY IF EXISTS "Users can view their own class membership" ON public.class_members;
DROP POLICY IF EXISTS "Teachers can view members in their own classes" ON public.class_members;
DROP POLICY IF EXISTS "Students can view their own membership" ON public.class_members;

-- Policy 1: Allow teachers to see all members of the classes they teach.
-- This is crucial for the "Assign to Class" modal, as it needs to read the class_members table
-- to eventually join and find the classes associated with the teacher.
CREATE POLICY "Teachers can view members in their own classes"
ON public.class_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classes
    WHERE classes.id = class_members.class_id
      AND classes.teacher_id = auth.uid()
  )
);

-- Policy 2: Allow students to see their own membership record.
-- This is necessary for students to see which classes they are enrolled in.
CREATE POLICY "Students can view their own membership"
ON public.class_members FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);
