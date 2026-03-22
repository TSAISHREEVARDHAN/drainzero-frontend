import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Check your .env file.');
}

// Use proxy URL when on Netlify so Google shows YOUR domain
// On localhost it uses Supabase URL directly
const isNetlify = typeof window !== 'undefined' && 
  window.location.hostname !== 'localhost' && 
  !window.location.hostname.includes('127.0.0.1');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // When deployed, redirect through your own domain
    flowType: 'pkce',
  }
});

export default supabase;
