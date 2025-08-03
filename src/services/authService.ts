import { SupabaseClient } from '@supabase/supabase-js';

export const authService = {
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
};
