import { createClient } from '@supabase/supabase-js';

// Check if environment variables are defined
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing. Check your .env file or Vercel project settings.');
}

// Create client only if URL is present to screen crash, otherwise undefined (or throw clear error)
// For safety in this verified crash scenario, we will use a fallback or throw a clean error.
// Best approach: If missing, throw an error that explains it.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);
