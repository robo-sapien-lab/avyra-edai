import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface Profile {
  id: string;
  name: string;
  role: 'student' | 'teacher';
  grade?: number;
  school?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  signUp: (email: string, password: string, name: string, role: 'student' | 'teacher', grade?: number) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  refreshSession: () => Promise<void>;
}

export const useAuth = (): AuthState & AuthActions => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    isAuthenticated: false,
  });

  const fetchProfile = useCallback(async () => {
    const { user } = state;
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setState(prev => ({ ...prev, profile }));
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, [state.user]);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }

      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
        loading: false,
      }));

      if (session?.user) {
        await fetchProfile();
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, name: string, role: 'student' | 'teacher', grade?: number) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          role,
          grade
        }
      }
    });

    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      session: null,
      profile: null,
      loading: false,
      isAuthenticated: false,
    });
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    const { user } = state;
    if (!user) return { error: 'No user found' };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      await fetchProfile();
    }

    return { error };
  }, [state.user, fetchProfile]);

  // Initialize auth state and set up listeners
  useEffect(() => {
    // Get initial session
    refreshSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session?.user,
          loading: false,
        }));

        if (session?.user) {
          await fetchProfile();
        } else {
          setState(prev => ({ ...prev, profile: null }));
        }
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSession, fetchProfile]);

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    fetchProfile,
    updateProfile,
    refreshSession,
  };
};
