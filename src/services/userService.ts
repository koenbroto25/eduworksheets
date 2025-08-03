import { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from './supabaseClient';

export const userService = {
  async getUserProfile(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
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

  async getCreators(supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('id, name')
      .eq('role', 'teacher');

    return { data, error };
  },
};
