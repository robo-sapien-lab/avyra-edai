// src/lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr';

// Create a singleton Supabase client for browser
export const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);