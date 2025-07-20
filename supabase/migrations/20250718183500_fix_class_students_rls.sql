-- Step 1: Drop all existing policies on class_students to start fresh.
DROP POLICY IF EXISTS "Students can join classes" ON public.class_students;
DROP POLICY IF EXISTS "Students can read own enrollments" ON public.class_students;
DROP POLICY IF EXISTS "Teachers can manage students in their own classes" ON public.class_students;

-- Step 2: Create new, specific policies for STUDENTS.
-- Students can see their own enrollment records.
CREATE POLICY "Students can SELECT their own enrollments"
ON public.class_students FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Students can join a class (insert their own student_id).
CREATE POLICY "Students can INSERT themselves into a class"
ON public.class_students FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

-- Students can leave a class (delete their own enrollment).
CREATE POLICY "Students can DELETE their own enrollments"
ON public.class_students FOR DELETE
TO authenticated
USING (student_id = auth.uid());

-- Step 3: Create new, specific policies for TEACHERS.
-- Teachers can see all students in classes they teach.
CREATE POLICY "Teachers can SELECT students in their classes"
ON public.class_students FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.classes
        WHERE classes.id = class_students.class_id
        AND classes.teacher_id = auth.uid()
    )
);

-- Teachers can add (INSERT) students to their classes.
CREATE POLICY "Teachers can INSERT students into their classes"
ON public.class_students FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.classes
        WHERE classes.id = class_students.class_id
        AND classes.teacher_id = auth.uid()
    )
);

-- Teachers can remove (DELETE) students from their classes.
CREATE POLICY "Teachers can DELETE students from their classes"
ON public.class_students FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.classes
        WHERE classes.id = class_students.class_id
        AND classes.teacher_id = auth.uid()
    )
);
