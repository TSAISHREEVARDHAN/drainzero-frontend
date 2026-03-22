import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase env vars');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType          : 'implicit',
    autoRefreshToken  : true,
    persistSession    : true,
    detectSessionInUrl: true,
    storage           : window.localStorage, // force localStorage — works on Brave
    storageKey        : 'drainzero-auth',
  }
});

export default supabase;
