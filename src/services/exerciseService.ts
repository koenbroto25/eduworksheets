import { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from './supabaseClient';

export const exerciseService = {
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
