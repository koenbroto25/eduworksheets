import { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from './supabaseClient';

export const classService = {
  async getUserClasses(supabase: SupabaseClient, userId: string, role: 'teacher' | 'student' | 'parent') {
    if (role === 'parent') {
      return { data: [], error: null };
    }

    // Final solution: Call the get_my_classes() RPC function.
    // This function contains all the necessary security logic and bypasses the RLS recursion issue entirely.
    const { data, error } = await supabase.rpc('get_my_classes');

    return { data, error };
  },

  async getClassDetails(supabase: SupabaseClient, classId: string) {
    const { data, error } = await supabase
      .rpc('get_class_details', { p_class_id: classId });

    return { data, error };
  },

  async getClassStudents(supabase: SupabaseClient, classId: string) {
    const { data, error } = await supabase
      .from(TABLES.CLASS_STUDENTS)
      .select('*, student:users(*)')
      .eq('class_id', classId);

    return { data, error };
  },

  async getClassExercises(supabase: SupabaseClient, classId: string) {
    const { data, error } = await supabase.rpc('get_teacher_class_exercises', {
      p_class_id: classId,
    });

    return { data, error };
  },

  async getStudentClassAssignments(supabase: SupabaseClient, classId: string) {
    const { data, error } = await supabase.rpc('get_student_class_assignments', {
      p_class_id: classId,
    });

    return { data, error };
  },

  async getClassExercise(supabase: SupabaseClient, classId: string, exerciseId: string) {
    const { data, error } = await supabase
      .from(TABLES.CLASS_EXERCISES)
      .select('*')
      .eq('class_id', classId)
      .eq('exercise_id', exerciseId)
      .single();

    return { data, error };
  },

  async getClassMembers(supabase: SupabaseClient, classId: string) {
    const { data, error } = await supabase
      .from(TABLES.CLASS_STUDENTS)
      .select('user:users(*)')
      .eq('class_id', classId);

    if (error) {
      return { data: null, error };
    }

    const members = data?.map((item: any) => item.user);
    return { data: members, error: null };
  },

  async getClassAnnouncements(supabase: SupabaseClient, classId: string) {
    const { data, error } = await supabase
      .from('class_announcements')
      .select('*, author:users(name, avatar_url)')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  async unassignExerciseFromClass(supabase: SupabaseClient, classId: string, exerciseId: string) {
    const { error } = await supabase
      .from(TABLES.CLASS_EXERCISES)
      .delete()
      .eq('class_id', classId)
      .eq('exercise_id', exerciseId);

    return { error };
  },

  async assignExerciseToClasses(supabase: SupabaseClient, exerciseId: string, classIds: string[]) {
    const { error } = await supabase.rpc('assign_exercise_to_classes', {
      p_exercise_id: exerciseId,
      p_class_ids: classIds,
    });
    return { error };
  },

  async getAssignmentsForClass(supabase: SupabaseClient, classId: string) {
    const { data, error } = await supabase
      .from('teacher_assignments')
      .select(`
        *,
        exercise:exercises(*)
      `)
      .eq('class_id', classId);

    return { data, error };
  },

  async createClass(supabase: SupabaseClient, classData: { name: string; description: string }): Promise<{ data: any, error: any }> {
    const { name, description } = classData;

    // Call the new RPC function to create the class securely.
    const { data, error } = await supabase
      .rpc('create_class_rpc', {
        class_name: name,
        class_description: description,
      });

    // The RPC will handle the teacher check and insertion.
    // It returns the new class ID on success or throws an error on failure.
    return { data, error };
  },

  generateClassCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let classCode = '';
    for (let i = 0; i < 6; i++) {
      classCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return classCode;
  },

  async joinClassWithCode(supabase: SupabaseClient, classCode: string, studentId: string) {
    const { data: classData, error: classError } = await supabase
      .from(TABLES.CLASSES)
      .select('id')
      .eq('class_code', classCode)
      .eq('is_active', true)
      .single();

    if (classError) return { data: null, error: classError };

    const { data, error } = await supabase
      .from(TABLES.CLASS_STUDENTS)
      .insert([{
        class_id: classData.id,
        student_id: studentId
      }])
      .select()
      .single();

    return { data, error };
  },

  async getClassesByTeacher(supabase: SupabaseClient, teacherId: string) {
    const { data, error } = await supabase
      .from(TABLES.CLASSES)
      .select('*')
      .eq('teacher_id', teacherId);
    return { data, error };
  },

  async deleteClass(supabase: SupabaseClient, classId: string) {
    const { error } = await supabase
      .from(TABLES.CLASSES)
      .delete()
      .eq('id', classId);
    return { error };
  },

  async isStudentInClass(supabase: SupabaseClient, classId: string, studentId: string) {
    const { data, error } = await supabase.rpc('is_student_member', {
      class_id_to_check: classId,
      student_id_to_check: studentId
    });

    return { isMember: data, error };
  },

  async getStudentClasses(supabase: SupabaseClient, studentId: string) {
    // Call the new, robust RPC function to get the list of classes for a student.
    return supabase.rpc('get_student_classes_rpc', {
      p_student_id: studentId,
    });
  },

  updateClassExerciseSettings: async (supabase: SupabaseClient, classExerciseId: string, settings: any) => {
    // The settings object is a Partial<ClassExercise>
    // It contains fields like due_date, max_attempts, minimum_passing_grade, and a nested settings object.
    // The update method will correctly map these to the columns in the class_exercises table.
    return supabase
      .from('class_exercises')
      .update(settings)
      .eq('id', classExerciseId);
  },

  async getTeacherDashboardData(supabase: SupabaseClient, teacherId: string) {
    const { data: classes, error: classesError } = await supabase
      .from(TABLES.CLASSES)
      .select('id')
      .eq('teacher_id', teacherId);

    if (classesError) {
      return { data: null, error: classesError };
    }
    const classIds = classes.map((c: any) => c.id);

    const { data: assignmentsToGrade, error: assignmentsError } = await supabase
      .from(TABLES.EXERCISE_ATTEMPTS)
      .select(`
        *,
        exercise:exercises(title),
        student:users(name),
        class:classes(name)
      `)
      .in('class_id', classIds)
      .is('score', null)
      .order('completed_at', { ascending: true });

    const { data: recentActivities, error: activitiesError } = await supabase
      .from(TABLES.EXERCISE_ATTEMPTS)
      .select(`
        *,
        student:users(name),
        exercise:exercises(title)
      `)
      .in('class_id', classIds)
      .order('completed_at', { ascending: false })
      .limit(5);

    if (assignmentsError || activitiesError) {
      console.error('Error fetching teacher dashboard data:', assignmentsError || activitiesError);
      return { data: null, error: assignmentsError || activitiesError };
    }

    return {
      data: {
        assignmentsToGrade,
        recentActivities
      },
      error: null
    };
  },
};
