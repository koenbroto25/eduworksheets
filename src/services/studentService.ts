import { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from './supabaseClient';

export const studentService = {
  async getStudentDashboardData(supabase: SupabaseClient, studentId: string) {
    // Fetch assignments from parents
    const { data: parentAssignments, error: parentAssignmentsError } = await supabase
      .from(TABLES.PARENT_ASSIGNMENTS)
      .select(`
        id,
        due_date:completed_at,
        exercise:exercises(id, title, subject)
      `)
      .eq('child_id', studentId);

    // Fetch assignments from teachers
    const { data: studentClasses, error: classesError } = await supabase
      .from(TABLES.CLASS_STUDENTS)
      .select('class_id, class:classes(name)')
      .eq('student_id', studentId);

    if (classesError || parentAssignmentsError) {
      console.error('Error fetching assignments:', classesError || parentAssignmentsError);
      return { data: null, error: classesError || parentAssignmentsError };
    }

    const classIds = studentClasses.map((sc: any) => sc.class_id);
    
    let teacherAssignments: any[] = [];
    if (classIds.length > 0) {
      const { data: fetchedTeacherAssignments, error: deadlinesError } = await supabase
        .from(TABLES.CLASS_EXERCISES)
        .select(`
          id,
          due_date,
          exercise:exercises(id, title, subject),
          class:classes(name)
        `)
        .in('class_id', classIds)
        .gt('due_date', new Date().toISOString())
        .order('due_date', { ascending: true });
      
      if (deadlinesError) {
        console.error('Error fetching teacher assignments:', deadlinesError);
        return { data: null, error: deadlinesError };
      }
      teacherAssignments = fetchedTeacherAssignments || [];
    }

    // Augment and merge assignments
    const allAssignments = [
      ...(parentAssignments || []).map((a: any) => ({ 
        ...a, 
        source: { type: 'parent', name: 'Orang Tua' } 
      })),
      ...(teacherAssignments || []).map((a: any) => ({ 
        ...a, 
        source: { type: 'teacher', name: a.class.name } 
      })),
    ];

    // Fetch recent grades
    const { data: recentGrades, error: gradesError } = await supabase
      .from(TABLES.EXERCISE_ATTEMPTS)
      .select(`
        *,
        exercise:exercises(title)
      `)
      .eq('user_id', studentId)
      .not('score', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5);

    if (gradesError) {
      console.error('Error fetching student grades:', gradesError);
      return { data: null, error: gradesError };
    }

    return {
      data: {
        allAssignments,
        recentGrades
      },
      error: null
    };
  },
};
