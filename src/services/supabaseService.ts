import { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from './supabaseClient';

// This service now accepts a SupabaseClient instance for each call
export const supabaseService = {
  // Auth helpers
  async signUp(supabase: SupabaseClient, email: string, password: string, userData: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { data, error };
  },

  async signIn(supabase: SupabaseClient, email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  async signOut(supabase: SupabaseClient) {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser(supabase: SupabaseClient) {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  async getUserProfile(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  // Exercise helpers
  async getPublicExercises(supabase: SupabaseClient, filters: {
    creator?: string;
    grade?: string;
    subject?: string;
    difficulty?: string;
    assessment_type?: string;
    sort?: string;
  } = {}) {
    let query = supabase
      .from(TABLES.EXERCISES)
      .select(`
        id,
        title,
        description,
        subject,
        grade,
        semester,
        difficulty,
        assessment_type,
        curriculum_type,
        created_at,
        questions(count),
        creator:users!creator_id(name)
      `)
      .eq('is_public', true);

    if (filters.creator && filters.creator !== 'all') {
      query = query.eq('creator_id', filters.creator);
    }
    if (filters.grade && filters.grade !== 'all') {
      query = query.eq('grade', filters.grade);
    }
    if (filters.subject && filters.subject !== 'all') {
      query = query.ilike('subject', `%${filters.subject}%`);
    }
    if (filters.difficulty && filters.difficulty !== 'all') {
      query = query.eq('difficulty', filters.difficulty);
    }
    if (filters.assessment_type && filters.assessment_type !== 'all') {
      query = query.eq('assessment_type', filters.assessment_type);
    }

    if (filters.sort === 'views') {
      query = query.order('views', { ascending: false });
    } else if (filters.sort === 'ratings') {
      query = query.order('ratings', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    
    return { data, error };
  },

  async getUserExercises(supabase: SupabaseClient, userId: string, filters: {
    grade?: string;
    subject?: string;
    assessment_type?: string;
    semester?: string;
    curriculum_type?: string;
    sort?: string;
  } = {}) {
    let query = supabase
      .from(TABLES.EXERCISES)
      .select('*')
      .eq('creator_id', userId);

    if (filters.grade && filters.grade !== 'all') {
      query = query.eq('grade', filters.grade);
    }
    if (filters.subject && filters.subject !== 'all') {
      query = query.ilike('subject', `%${filters.subject}%`);
    }
    if (filters.assessment_type && filters.assessment_type !== 'all') {
      query = query.eq('assessment_type', filters.assessment_type);
    }
    if (filters.semester && filters.semester !== 'all') {
      query = query.eq('semester', filters.semester);
    }
    if (filters.curriculum_type && filters.curriculum_type !== 'all') {
      query = query.eq('curriculum_type', filters.curriculum_type);
    }

    if (filters.sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    
    return { data, error };
  },

  async deleteExercise(supabase: SupabaseClient, exerciseId: string) {
    const { error } = await supabase
      .from(TABLES.EXERCISES)
      .delete()
      .eq('id', exerciseId);
    
    return { error };
  },

  async getExerciseWithQuestions(supabase: SupabaseClient, exerciseId: string) {
    const { data: exerciseData, error: exerciseError } = await supabase
      .from(TABLES.EXERCISES)
      .select(`
        *,
        creator:users!creator_id(name)
      `)
      .eq('id', exerciseId)
      .single();

    if (exerciseError) {
      console.error('Error fetching exercise:', exerciseError);
      return { data: null, error: exerciseError };
    }

    const { data: questionsData, error: questionsError } = await supabase
      .from(TABLES.QUESTIONS)
      .select('*')
      .eq('exercise_id', exerciseId);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return { data: null, error: questionsError };
    }

    const questionTypes = questionsData ? [...new Set(questionsData.map((q: any) => q.type))] : [];

    // Manually map snake_case to camelCase to match the Exercise type
    const formattedExercise = {
      ...exerciseData,
      is_public: exerciseData.is_public,
      creator_id: exerciseData.creator_id,
      creatorName: exerciseData.creator?.name || 'Pengguna Publik',
      createdAt: exerciseData.created_at,
      updatedAt: exerciseData.updated_at,
      minimum_passing_grade: exerciseData.minimum_passing_grade,
      assessment_type: exerciseData.assessment_type,
      curriculum_type: exerciseData.curriculum_type,
      question_types: questionTypes,
      questions: questionsData || [],
      tags: [], // Placeholder
      views: 0, // Placeholder
      ratings: 0, // Placeholder
    };

    return { data: formattedExercise, error: null };
  },

  async getExerciseById(supabase: SupabaseClient, exerciseId: string) {
    const { data, error } = await supabase
      .from(TABLES.EXERCISES)
      .select('*')
      .eq('id', exerciseId)
      .single();
    return { data, error };
  },

  async updateExercise(supabase: SupabaseClient, exerciseId: string, exerciseData: any) {
    const { error } = await supabase
      .from(TABLES.EXERCISES)
      .update(exerciseData)
      .eq('id', exerciseId);
    return { error };
  },

  async updateExerciseVisibility(supabase: SupabaseClient, exerciseId: string, isPublic: boolean) {
    const { error } = await supabase
      .from(TABLES.EXERCISES)
      .update({ is_public: isPublic })
      .eq('id', exerciseId);
    return { error };
  },

  async getCreators(supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('id, name')
      .eq('role', 'teacher');

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

  // Class helpers
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

  // Progress helpers
  async getUserProgress(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from(TABLES.USER_PROGRESS)
      .select('*')
      .eq('user_id', userId);
    
    return { data, error };
  },

  // Create exercise with questions
  async createExercise(supabase: SupabaseClient, exerciseData: any) {
    const {
      questions,
      creator_id,
      is_public,
      minimum_passing_grade,
      curriculum_type,
      question_types,
      ...restOfExercise
    } = exerciseData;

    const exerciseToInsert = {
      ...restOfExercise,
      creator_id,
      is_public,
      minimum_passing_grade,
      curriculum_type,
      question_types,
    };
    
    const { data: exerciseResult, error: exerciseError } = await supabase
      .from(TABLES.EXERCISES)
      .insert([exerciseToInsert])
      .select()
      .single();

    if (exerciseError) {
      return { data: null, error: exerciseError };
    }

    const questionData = questions.map((q: any, index: number) => ({
      ...q,
      exercise_id: exerciseResult.id,
      order_index: index,
    }));

    const { error: questionsError } = await supabase
      .from(TABLES.QUESTIONS)
      .insert(questionData);

    if (questionsError) {
      // If questions fail, roll back exercise creation
      await supabase.from(TABLES.EXERCISES).delete().eq('id', exerciseResult.id);
      return { data: null, error: questionsError };
    }

    return { data: exerciseResult, error: null };
  },

  // Join class with code
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

  // New Reporting Functions
  async getStudentClassReport(supabase: SupabaseClient, studentId: string, classId: string) {
    const { data, error } = await supabase.rpc('get_student_class_report', {
      p_student_id: studentId,
      p_class_id: classId,
    });
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

  async updateUserSettings(supabase: SupabaseClient, userId: string, settings: any) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update({ preferences: settings })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  async isStudentInClass(supabase: SupabaseClient, classId: string, studentId: string) {
    const { data, error } = await supabase.rpc('is_student_member', {
      class_id_to_check: classId,
      student_id_to_check: studentId
    });

    return { isMember: data, error };
  },

  async getCurriculum(supabase: SupabaseClient) {
    return await supabase.from(TABLES.CURRICULUM).select('*');
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

  async getStudentDashboardData(supabase: SupabaseClient, studentId: string) {
    // Fetch assignments from parents
    const { data: parentAssignments, error: parentAssignmentsError } = await supabase
      .from(TABLES.PARENT_ASSIGNMENTS)
      .select(`
        *,
        exercise:exercises(title)
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
          *,
          exercise:exercises(title),
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

  async getParentDashboardData(supabase: SupabaseClient, parentId: string) {
    const { data: links, error: linkError } = await supabase
      .from('parent_child_link')
      .select('child:users!parent_child_link_child_id_fkey(id, name)')
      .eq('parent_id', parentId);

    if (linkError) {
      console.error('Error fetching linked children:', linkError);
      return { data: null, error: linkError };
    }

    if (!links || links.length === 0) {
      return { data: { children: [] }, error: null };
    }

    const children = links.map((link: any) => link.child).filter(Boolean);

    const childrenData = await Promise.all(
      children.map(async (child: any) => {
        const childId = child.id;
        
        const { data: recentScores, error: scoresError } = await supabase
          .from('exercise_attempts')
          .select('score, exercise:exercises(title)')
          .eq('user_id', childId)
          .not('score', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(5);

        const { data: activeAssignments, error: assignmentsError } = await this.getChildActiveAssignments(supabase, childId);

        if (scoresError || assignmentsError) {
          console.error(`Error fetching dashboard data for child ${childId}:`, scoresError || assignmentsError);
          return { ...child, recent_scores: [], assignments: [] };
        }

        const formattedScores = (recentScores || []).map((s: any) => {
          const exerciseInfo = Array.isArray(s.exercise) ? s.exercise[0] : s.exercise;
          return {
            score: s.score,
            exercise_title: exerciseInfo?.title ?? 'Latihan Tanpa Judul',
          };
        });

        return { ...child, recent_scores: formattedScores, assignments: activeAssignments || [] };
      })
    );

    return { data: { children: childrenData }, error: null };
  },

  async getChildPerformanceDetails(supabase: SupabaseClient, childId: string) {
    // 1. Get parent assignments
    const { data: parentAssignments, error: parentAssignmentsError } = await supabase
      .from(TABLES.PARENT_ASSIGNMENTS)
      .select('exercise_id')
      .eq('child_id', childId);

    if (parentAssignmentsError) return { data: null, error: parentAssignmentsError };

    // 2. Get class assignments
    const { data: studentClasses, error: studentClassesError } = await supabase
      .from(TABLES.CLASS_STUDENTS)
      .select('class_id')
      .eq('student_id', childId);

    if (studentClassesError) return { data: null, error: studentClassesError };

    const classIds = studentClasses.map((sc: any) => sc.class_id);

    let classAssignments: { exercise_id: string }[] = [];
    if (classIds.length > 0) {
      const { data: fetchedClassAssignments, error: classAssignmentsError } = await supabase
        .from(TABLES.CLASS_EXERCISES)
        .select('exercise_id')
        .in('class_id', classIds);
      
      if (classAssignmentsError) return { data: null, error: classAssignmentsError };
      classAssignments = fetchedClassAssignments || [];
    }

    // 3. Combine and get unique exercises
    const parentExerciseIds = parentAssignments.map(a => a.exercise_id);
    const classExerciseIds = classAssignments.map(a => a.exercise_id);
    const allExerciseIds = [...new Set([...parentExerciseIds, ...classExerciseIds])];

    if (allExerciseIds.length === 0) {
      return { data: [], error: null };
    }

    // 4. Fetch details for all exercises in one go
    const { data: exercises, error: exercisesError } = await supabase
      .from(TABLES.EXERCISES)
      .select('id, title, subject, grade, difficulty')
      .in('id', allExerciseIds);

    if (exercisesError) return { data: null, error: exercisesError };

    // 5. Fetch all attempts and progress for the child for these exercises
    const { data: attempts, error: attemptsError } = await supabase
      .from(TABLES.EXERCISE_ATTEMPTS)
      .select('*')
      .eq('user_id', childId)
      .in('exercise_id', allExerciseIds);

    if (attemptsError) return { data: null, error: attemptsError };

    const { data: progress, error: progressError } = await supabase
      .from(TABLES.USER_PROGRESS)
      .select('exercise_id, status, created_at')
      .eq('user_id', childId)
      .in('exercise_id', allExerciseIds);

    if (progressError) return { data: null, error: progressError };

    // 6. Combine data into a structured report
    const performanceDetails = exercises.map(exercise => {
      const exerciseAttempts = attempts?.filter(a => a.exercise_id === exercise.id) || [];
      const exerciseProgress = progress?.filter(p => p.exercise_id === exercise.id)
        .sort((a, b) => new Date((b as any).created_at).getTime() - new Date((a as any).created_at).getTime());
      
      return {
        ...exercise,
        attempts: exerciseAttempts,
        final_status: exerciseProgress?.[0]?.status || 'not_started',
      };
    });

    return { data: performanceDetails, error: null };
  },

  async getSubjectOptions(supabase: SupabaseClient, grade?: string) {
    let query = supabase.from('curriculum').select('subject');

    if (grade && grade !== 'all') {
      query = query.eq('grade', parseInt(grade, 10));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching subjects:', error);
      return { data: [], error };
    }

    const uniqueSubjects = [...new Set(data.map((item: any) => item.subject))];
    const subjectOptions = uniqueSubjects.map(subject => ({
      value: subject as string,
      label: subject as string,
    }));
    
    return { data: subjectOptions, error: null };
  },

  async getCurriculumData(supabase: SupabaseClient, subject: string, grade: string, semester: string, curriculumType: string) {
    if (!subject || subject === 'custom' || !grade) {
      return { data: { chapters: [], topics: {} }, error: null };
    }

    const { data, error } = await supabase
      .from('curriculum')
      .select('chapter, topic, sub_topic')
      .eq('subject', subject)
      .eq('grade', grade)
      .eq('semester', semester)
      .eq('curriculum_type', curriculumType);

    if (error) {
      console.error('Error fetching curriculum:', error);
      return { data: null, error };
    }

    const chaptersSet = new Set<string>();
    const topicsData: { [key: string]: { subtopics: string[], subSubtopics: { [key: string]: string[] } } } = {};

    data.forEach((item: any) => {
      if (item.chapter) {
        chaptersSet.add(item.chapter);
        if (!topicsData[item.chapter]) {
          topicsData[item.chapter] = { subtopics: [], subSubtopics: {} };
        }
        if (item.topic && !topicsData[item.chapter].subtopics.includes(item.topic)) {
          topicsData[item.chapter].subtopics.push(item.topic);
        }
        if (item.topic && item.sub_topic) {
          if (!topicsData[item.chapter].subSubtopics[item.topic]) {
            topicsData[item.chapter].subSubtopics[item.topic] = [];
          }
          if (!topicsData[item.chapter].subSubtopics[item.topic].includes(item.sub_topic)) {
            topicsData[item.chapter].subSubtopics[item.topic].push(item.sub_topic);
          }
        }
      }
    });
    
    const sortedChapters = Array.from(chaptersSet).sort((a, b) => {
      const numA = parseInt(a.split(' ')[1], 10);
      const numB = parseInt(b.split(' ')[1], 10);

      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });

    return { data: { chapters: sortedChapters, topics: topicsData }, error: null };
  },

  async assignExerciseToChild(supabase: SupabaseClient, assignment: { parentId: string; childId: string; exerciseId: string }) {
    const { parentId, childId, exerciseId } = assignment;
    const { data, error } = await supabase
      .from(TABLES.PARENT_ASSIGNMENTS)
      .insert([
        {
          parent_id: parentId,
          child_id: childId,
          exercise_id: exerciseId,
        },
      ]);

    return { data, error };
  },

  // Parent-child invitation helpers
  async createParentInvitation(supabase: SupabaseClient, parentId: string) {
    const { data, error } = await supabase
      .from(TABLES.PARENT_INVITATIONS)
      .insert([{ parent_id: parentId }])
      .select();
    return { data, error };
  },

  async getParentInvitation(supabase: SupabaseClient, invitationId: string) {
    const { data: invitationData, error: invitationError } = await supabase
      .from(TABLES.PARENT_INVITATIONS)
      .select('id, parent_id, status')
      .eq('id', invitationId)
      .eq('status', 'pending')
      .maybeSingle();

    if (invitationError) {
      console.error('Error fetching invitation:', invitationError);
      return { data: null, error: invitationError };
    }
    
    if (!invitationData) {
      const customError = new Error('Undangan tidak ditemukan, sudah digunakan, atau telah kedaluwarsa.');
      console.error(customError.message);
      return { data: null, error: customError };
    }

    const { data: parentData, error: parentError } = await supabase
      .from(TABLES.USERS)
      .select('name')
      .eq('id', invitationData.parent_id)
      .maybeSingle();

    if (parentError) {
      console.error('Error fetching parent details:', parentError);
    }

    return {
      data: {
        ...invitationData,
        parent: {
          name: parentData?.name || 'Orang Tua',
        },
      },
      error: null,
    };
  },

  async acceptParentInvitation(supabase: SupabaseClient, invitationId: string, childId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('smooth-endpoint', {
        body: { invitationId },
      });

      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error accepting parent invitation:', error);
      return { data: null, error };
    }
  },

  async declineParentInvitation(supabase: SupabaseClient, invitationId: string) {
    const { error } = await supabase
      .from(TABLES.PARENT_INVITATIONS)
      .update({ status: 'declined' })
      .eq('id', invitationId);
    return { error };
  },

  async isChildLinked(supabase: SupabaseClient, childId: string, parentId: string) {
    const { data, error } = await supabase
      .from('parent_child_link')
      .select('id')
      .eq('child_id', childId)
      .eq('parent_id', parentId)
      .maybeSingle();

    return { data: !!data, error };
  },

  async findChildByCode(supabase: SupabaseClient, code: string) {
    const { data, error } = await supabase
      .rpc('find_child_by_code', { p_code: code });
    
    if (error) {
      console.error('Error finding child by code:', error);
      return { data: null, error };
    }

    // RPC returns an array, even if it's a single result.
    return { data: data?.[0] || null, error: null };
  },

  async linkParentToChild(supabase: SupabaseClient, parentId: string, childId: string) {
    const { error } = await supabase
      .rpc('link_parent_to_child', { p_parent_id: parentId, p_child_id: childId });
    
    return { error };
  },

  async getChildActiveAssignments(supabase: SupabaseClient, childId: string) {
    const { data, error } = await supabase.rpc('get_child_active_assignments', {
      p_child_id: childId,
    });
    return { data, error };
  },

  async findByCode(supabase: SupabaseClient, code: string) {
    // The RPC now returns a single JSON object or NULL.
    const { data, error } = await supabase
      .rpc('find_by_code', { p_code: code });

    if (error) {
      // Pass through any real database errors.
      return { data: null, error };
    }

    // If data is null, it means the code was not found. This is the new, robust check.
    if (!data) {
      return { data: null, error: new Error('Code not found.') };
    }

    // The data is the JSON object we need.
    return { data, error: null };
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

  // New RPC for submitting exercise attempts safely
  async submitExerciseAttempt(supabase: SupabaseClient, attemptData: any) {
    const { error } = await supabase.rpc('submit_exercise_attempt', {
      p_user_id: attemptData.user_id,
      p_exercise_id: attemptData.exercise_id,
      p_class_exercise_id: attemptData.class_exercise_id,
      p_answers: attemptData.answers,
      p_score: attemptData.score,
      p_max_score: attemptData.max_score,
      p_time_elapsed: attemptData.time_elapsed,
      p_started_at: attemptData.started_at,
      p_completed_at: attemptData.completed_at,
      p_submitted_at: attemptData.submitted_at,
    });
    return { error };
  },
};
