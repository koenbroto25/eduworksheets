import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { User } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  supabase: SupabaseClient;
  login: (email: string, password: string) => Promise<{ user: User | null }>;
  signup: (email: string, password: string, userData: { name: string; role: string }) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isActionLoading: boolean;
  refreshUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        const { data: userData } = await supabase.from('users').select('*, role').eq('id', session.user.id).single();
        setUser(userData as User);
      }
      setIsLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        const fetchUser = async () => {
          const { data: userData } = await supabase.from('users').select('*, role').eq('id', session.user.id).single();
          setUser(userData as User);
        };
        fetchUser();
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsActionLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (authData.user) {
        const { data: userData } = await supabase.from('users').select('*, role').eq('id', authData.user.id).single();
        setUser(userData as User);
        return { user: userData as User };
      }
      return { user: null };
    } finally {
      setIsActionLoading(false);
    }
  };

  const signup = async (email: string, password: string, userData: { name: string; role: string }) => {
    setIsActionLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
          },
        },
      });
      if (error) throw error;
    } finally {
      setIsActionLoading(false);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: userData } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      setUser(userData as User);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    const { error } = await supabase.from('users').update(userData).eq('id', user.id);
    if (error) throw error;
    await refreshUser();
  };

  const value = {
    session,
    user,
    supabase: supabase,
    login,
    signup,
    logout,
    isLoading,
    isActionLoading,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
