import { SupabaseClient } from '@supabase/supabase-js';
import { classService } from './classService';
import { exerciseService } from './exerciseService';
import { reportService } from './reportService';
import { TABLES } from './supabaseClient';

export const miscService = {
  async getUserProgress(supabase: SupabaseClient, userId: string) {
    return await supabase.from(TABLES.USER_PROGRESS).select('*').eq('user_id', userId);
  },
  async getCurriculum(supabase: SupabaseClient) {
    return await supabase.from(TABLES.CURRICULUM).select('*');
  },
  async findByCode(supabase: SupabaseClient, code: string) {
    const { data, error } = await supabase.rpc('find_by_code', { p_code: code });
    if (error) return { data: null, error };
    if (!data) return { data: null, error: new Error('Code not found.') };
    return { data, error: null };
  },
};

export const supabaseService = {
  ...classService,
  ...exerciseService,
  ...reportService,
  findByCode: miscService.findByCode,
};