import { createClient } from '@supabase/supabase-js';

// Check if environment variables are defined
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    const msg = `ERROR CRÍTICO VERCEL: 
    URL: ${supabaseUrl ? 'DEFINIDA' : 'FALTA'}
    KEY: ${supabaseAnonKey ? 'DEFINIDA' : 'FALTA'}
    
    Revisa las Environment Variables en Vercel y haz REDEPLOY.`;
    console.error(msg);
    alert(msg);
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);
