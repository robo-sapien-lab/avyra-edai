// src/lib/supabaseClient.ts
import { createBrowserClient, SupabaseClient } from '@supabase/ssr';
import { Database } from '@/integrations/supabase/types';

// Singleton pattern to ensure only one Supabase client instance
let supabaseInstance: SupabaseClient<Database> | null = null;

export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!supabaseInstance) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  
  return supabaseInstance;
};

// Export the singleton instance
export const supabase = getSupabaseClient();

// Prevent multiple instances in development
if (import.meta.env.DEV) {
  // @ts-ignore - Expose for debugging
  window.__SUPABASE_CLIENT = supabase;
}