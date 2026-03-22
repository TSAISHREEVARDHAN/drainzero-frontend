import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase env vars. Check your .env file.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType          : 'implicit',
    autoRefreshToken  : true,
    persistSession    : true,
    detectSessionInUrl: true,
    // Use localStorage explicitly — works on Brave, Chrome, Firefox mobile
    storage: {
      getItem   : (key) => { try { return localStorage.getItem(key); }    catch { return null; } },
      setItem   : (key, val) => { try { localStorage.setItem(key, val); } catch {} },
      removeItem: (key) => { try { localStorage.removeItem(key); }        catch {} },
    },
    storageKey: 'drainzero-session',
  }
});

export default supabase;
