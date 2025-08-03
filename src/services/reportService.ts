import { SupabaseClient } from '@supabase/supabase-js';

export const reportService = {
  async getClassReport(supabase: SupabaseClient, classId: string) {
    // 1. Get all exercises for the class
    const { data: classExercises, error: classExercisesError } = await supabase
      .from('class_exercises')
      .select('exercise_id, exercises(title)')
      .eq('class_id', classId);

    if (classExercisesError) return { data: null, error: classExercisesError };

    // 2. Get all students in the class
    const { data: classStudents, error: classStudentsError } = await supabase
      .from('class_students')
      .select('student_id, users(name)')
      .eq('class_id', classId);

    if (classStudentsError) return { data: null, error: classStudentsError };

    if (!classStudents || !classExercises) {
      return { data: { averageScores: [], incompleteStudents: [], studentPerformance: [] }, error: null };
    }

    const studentIds = classStudents.map(cs => cs.student_id);
    const exerciseIds = classExercises.map(ce => ce.exercise_id);

    // 3. Get all relevant attempts for the entire class in one query
    const { data: allAttempts, error: attemptsError } = await supabase
      .from('exercise_attempts')
      .select('*')
      .in('user_id', studentIds)
      .in('exercise_id', exerciseIds)
      .eq('class_id', classId);

    if (attemptsError) return { data: null, error: attemptsError };

    // 4. Process data to build the report
    const studentPerformance: any[] = [];
    const exerciseAverages: { [key: string]: { totalScore: number; count: number; title: string | null } } = {};

    for (const exercise of classExercises) {
      const exerciseInfo = Array.isArray(exercise.exercises) ? exercise.exercises[0] : exercise.exercises;
      exerciseAverages[exercise.exercise_id] = { totalScore: 0, count: 0, title: exerciseInfo?.title || null };
    }

    for (const student of classStudents) {
      const userInfo = Array.isArray(student.users) ? student.users[0] : student.users;
      for (const exercise of classExercises) {
        const exerciseInfo = Array.isArray(exercise.exercises) ? exercise.exercises[0] : exercise.exercises;
        const attempts = allAttempts?.filter(
          (a) => a.user_id === student.student_id && a.exercise_id === exercise.exercise_id
        ) || [];

        let best_score = null;
        let status: any = 'not_started';

        if (attempts.length > 0) {
          best_score = Math.max(...attempts.map(a => a.score));
          const latestAttempt = attempts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          status = latestAttempt.status;
          
          if (best_score !== null) {
            exerciseAverages[exercise.exercise_id].totalScore += best_score;
            exerciseAverages[exercise.exercise_id].count += 1;
          }
        }

        studentPerformance.push({
          student_id: student.student_id,
          student_name: userInfo?.name || 'Unknown Student',
          exercise_id: exercise.exercise_id,
          exercise_title: exerciseInfo?.title || 'Untitled Exercise',
          best_score,
          status,
        });
      }
    }

    const averageScores = Object.entries(exerciseAverages)
      .map(([exercise_id, { totalScore, count, title }]) => ({
        exercise_id,
        exercise_title: title,
        avg_score: count > 0 ? totalScore / count : 0,
      }));

    const incompleteStudents = studentPerformance
      .filter(sp => sp.status === 'not_started')
      .map(sp => ({ student_id: sp.student_id, student_name: sp.student_name }))
      .filter((student, index, self) => 
        index === self.findIndex((s) => s.student_id === student.student_id)
      );

    return { data: { averageScores, incompleteStudents, studentPerformance }, error: null };
  },

  async getStudentClassReport(supabase: SupabaseClient, studentId: string, classId: string) {
    // FIX: The RPC returns a single row, so .single() is required to return a single object instead of an array.
    const { data, error } = await supabase.rpc('get_student_class_report', {
      p_student_id: studentId,
      p_class_id: classId,
    }).single();
    return { data, error };
  },

  async getTeacherClassDashboard(supabase: SupabaseClient, classId: string) {
    const { data, error } = await supabase.rpc('get_teacher_class_dashboard', {
      p_class_id: classId,
    });
    return { data, error };
  },

  async getStudentExerciseDetails(supabase: SupabaseClient, studentId: string, classExerciseId: string) {
    const { data, error } = await supabase.rpc('get_student_exercise_details', {
      p_student_id: studentId,
      p_class_exercise_id: classExerciseId,
    });
    return { data, error };
  },

  async getClassExerciseDetailsForTeacher(supabase: SupabaseClient, classId: string, exerciseId: string) {
    const { data, error } = await supabase
      .rpc('get_class_exercise_details_for_teacher', {
        p_class_id: classId,
        p_exercise_id: exerciseId,
      })
      .single(); // Expecting a single object return

    return { data, error };
  },

  async getClassGradesReport(supabase: SupabaseClient, classId: string) {
    const { data, error } = await supabase.rpc('get_class_grades_report', {
      p_class_id: classId,
    });
    return { data, error };
  },

  async getStudentReports(supabase: SupabaseClient, classId: string) {
    const { data, error } = await supabase.rpc('get_class_student_reports', {
      p_class_id: classId,
    });

    return { data, error };
  },
};
