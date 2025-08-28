import { create } from 'zustand';
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
  signUp: (email: string, password: string, name: string, role: 'student' | 'teacher', grade?: number) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,

  signUp: async (email: string, password: string, name: string, role: 'student' | 'teacher', grade?: number) => {
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
  },

  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { error };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    set({ profile });
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { user } = get();
    if (!user) return { error: 'No user found' };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      await get().fetchProfile();
    }

    return { error };
  }
}));

// Initialize auth state
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.setState({ 
    session, 
    user: session?.user ?? null,
    loading: false 
  });

  if (session?.user) {
    setTimeout(() => {
      useAuthStore.getState().fetchProfile();
    }, 0);
  } else {
    useAuthStore.setState({ profile: null });
  }
});

// Check for existing session
supabase.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.setState({ 
    session, 
    user: session?.user ?? null,
    loading: false 
  });

  if (session?.user) {
    useAuthStore.getState().fetchProfile();
  }
});