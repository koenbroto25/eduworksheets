import { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from './supabaseClient';

// This file is being refactored.
// Functions are being moved to more specific service files.

export const miscService = {
  async getUserProgress(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from(TABLES.USER_PROGRESS)
      .select('*')
      .eq('user_id', userId);
    
    return { data, error };
  },

  async getCurriculum(supabase: SupabaseClient) {
    return await supabase.from(TABLES.CURRICULUM).select('*');
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
};
