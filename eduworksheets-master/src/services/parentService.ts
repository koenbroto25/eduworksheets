import { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from './supabaseClient';

export const parentService = {
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
};
