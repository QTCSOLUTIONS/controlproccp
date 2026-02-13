import { createClient } from '@supabase/supabase-js';

// Check if environment variables are defined
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debugging: Always show the URL to detect issues like trailing spaces
if (supabaseUrl) {
    // Show first 15 chars and last 5 chars of key for safety check
    const keyPreview = supabaseAnonKey ? `${supabaseAnonKey.substring(0, 5)}...` : 'MISSING';
    // alert(`DEBUG VERCEL:\nURL: '${supabaseUrl}'\nKEY: ${keyPreview}`);
}

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    const msg = `ERROR CRÍTICO VERCEL: 
    URL: ${supabaseUrl ? `'${supabaseUrl}'` : 'FALTA (Check Env Vars)'}
    KEY: ${supabaseAnonKey ? 'DEFINIDA' : 'FALTA'}
    
    Revisa las Environment Variables en Vercel y haz REDEPLOY.`;
    console.error(msg);
    alert(msg);
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);
