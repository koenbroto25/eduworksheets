-- Table for class announcements
CREATE TABLE class_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE class_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage announcements for their classes"
ON class_announcements FOR ALL
USING (
    (SELECT teacher_id FROM classes WHERE id = class_id) = auth.uid()
);

CREATE POLICY "Students can view announcements for their classes"
ON class_announcements FOR SELECT
USING (
    id IN (
        SELECT class_id FROM class_students WHERE student_id = auth.uid()
    )
);

-- Trigger to notify students on new announcement
CREATE OR REPLACE FUNCTION notify_students_on_announcement()
RETURNS TRIGGER AS $$
DECLARE
    student_record RECORD;
    class_name_text TEXT;
BEGIN
    -- Get class name
    SELECT name INTO class_name_text FROM classes WHERE id = NEW.class_id;

    -- Loop through all students in the class and create a notification
    FOR student_record IN
        SELECT student_id FROM class_students WHERE class_id = NEW.class_id
    LOOP
        PERFORM create_notification(
            student_record.student_id,
            'New announcement in ' || class_name_text || ': ' || NEW.message
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER new_announcement_trigger
AFTER INSERT ON class_announcements
FOR EACH ROW
EXECUTE FUNCTION notify_students_on_announcement();
