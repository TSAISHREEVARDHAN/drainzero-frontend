import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[DrainZero] Missing Supabase env vars!');
}

// ─────────────────────────────────────────────────────────────────────────────
//  Single Supabase client instance — NEVER call createClient() elsewhere.
//
//  Lock contention fix:
//  The error "lock was released because another request stole it" happens when
//  multiple concurrent Supabase calls all try to read/write the auth token in
//  localStorage at the same time (page load fires AuthContext queries +
//  autoRefreshToken + ProfilePage queries simultaneously).
//
//  Fix: use lock: 'shared' (no exclusive lock) for read queries.
//  The auth token lock is only acquired for mutations (sign in/out/refresh).
//  Our read queries don't need an exclusive lock — they just need the token.
// ─────────────────────────────────────────────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType          : 'pkce',
    autoRefreshToken  : true,
    persistSession    : true,
    detectSessionInUrl: true,
  },
});

export default supabase;
