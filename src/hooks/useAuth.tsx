import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  name: string;
  role: 'student' | 'teacher';
  grade?: number;
  school?: string;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { error: error.message };
      }
      
      return { error: null };
    } catch (error: unknown) {
      return { error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: 'student' | 'teacher', grade?: number) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            grade,
          }
        }
      });
      
      if (error) {
        return { error: error.message };
      }
      
      // Create profile in Supabase
      if (data.user) {
        const profileData = {
          id: data.user.id,
          name,
          role,
          grade,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData);
          
        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }
      
      return { error: null };
    } catch (error: unknown) {
      return { error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Profile management
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      if (data) {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user found' };
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        return { error: error.message };
      }
      
      await fetchProfile(user.id);
      return { error: null };
    } catch (error: unknown) {
      return { error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  };

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    profile,
    loading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    fetchProfile,
    updateProfile
  };
};
