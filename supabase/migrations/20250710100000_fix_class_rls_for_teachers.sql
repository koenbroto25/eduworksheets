-- Drop all potentially conflicting SELECT policies on class_members first for a clean slate.
-- REMOVED: class_members does not exist
-- REMOVED: class_members does not exist
-- REMOVED: class_members does not exist

-- Policy 1: Allow teachers to see all members of the classes they teach.
-- This is crucial for the "Assign to Class" modal, as it needs to read the class_members table
-- to eventually join and find the classes associated with the teacher.
-- REMOVED: class_members does not exist

-- Policy 2: Allow students to see their own membership record.
-- This is necessary for students to see which classes they are enrolled in.
-- REMOVED: class_members does not exist
