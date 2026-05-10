import React, {
  createContext, useContext, useEffect, useState, useRef, useCallback,
} from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

const isCallbackPage = () =>
  window.location.pathname.toLowerCase().includes('/auth/callback');

// ── Single in-flight guard ────────────────────────────────────────────────────
// Prevents two concurrent processUser() calls (e.g. INITIAL_SESSION + SIGNED_IN
// firing at the same time) which both trigger Supabase queries that fight for
// the auth token storage lock → "lock was released because another request stole it"
let processingUser = false;

// ── Get the best display name for a Google OAuth user ────────────────────────
const getGoogleName = (authUser) => {
  if (!authUser) return '';
  const meta = authUser.user_metadata || {};
  // Google puts the full name in full_name or name
  const name =
    meta.full_name ||
    meta.name      ||
    meta.given_name ||
    '';
  // Never use the email as a display name
  if (name && !name.includes('@')) return name;
  // Last resort: capitalise the local part of the email
  const local = (authUser.email || '').split('@')[0];
  return local
    .split(/[._-]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

// ── Ensure public.users row exists — serialised, never concurrent ─────────────
export const ensurePublicUserRow = async (authUser) => {
  if (!authUser?.id) return null;

  const googleName = getGoogleName(authUser);

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id, name, full_name, onboarding_done, onboarding_complete')
      .eq('id', authUser.id)
      .maybeSingle();

    if (existing) {
      // Row exists — fix name if it looks like an email fragment or is blank
      const needsNameFix =
        !existing.name ||
        existing.name.includes('@') ||
        existing.name === authUser.email?.split('@')[0];

      if (needsNameFix && googleName) {
        // Fire-and-forget — don't await so we don't delay auth flow
        supabase
          .from('users')
          .update({ name: googleName, full_name: googleName, updated_at: new Date().toISOString() })
          .eq('id', authUser.id)
          .then(() => {})
          .catch(() => {});
      }
      return {
        ...existing,
        name      : needsNameFix ? googleName : existing.name,
        full_name : needsNameFix ? googleName : existing.full_name,
      };
    }
  } catch {}

  // Row missing — insert
  try {
    const { data: inserted } = await supabase
      .from('users')
      .insert({
        id                  : authUser.id,
        email               : authUser.email,
        name                : googleName,
        full_name           : googleName,
        onboarding_done     : false,
        onboarding_complete : false,
        updated_at          : new Date().toISOString(),
      })
      .select('id, name, full_name, onboarding_done, onboarding_complete')
      .maybeSingle();

    if (inserted) return inserted;
  } catch (e) {
    if (e?.code !== '23505') console.warn('[Auth] ensurePublicUserRow:', e?.message);
  }

  // Conflict — read again
  try {
    const { data: retry } = await supabase
      .from('users')
      .select('id, name, full_name, onboarding_done, onboarding_complete')
      .eq('id', authUser.id)
      .maybeSingle();
    return retry;
  } catch {}

  return null;
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user,           setUser]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [userProfile,    setUserProfile]    = useState(null);
  const [hasIncomeData,  setHasIncomeData]  = useState(false);

  const initDone  = useRef(false);
  const safetyRef = useRef(null);

  const clearAllState = useCallback(() => {
    setUser(null);
    setOnboardingDone(false);
    setUserProfile(null);
    setHasIncomeData(false);
  }, []);

  const checkOnboarding = useCallback(async (uid, rowFromEnsure) => {
    if (!uid) return false;
    try {
      // If ensurePublicUserRow already returned the row, skip re-fetching users table
      let userData = rowFromEnsure || null;

      if (!userData) {
        const { data, error } = await supabase
          .from('users')
          .select(
            'id, name, full_name, email, age, gender, marital_status, ' +
            'employment_type, sector, profession, state, city, is_metro, ' +
            'onboarding_done, onboarding_complete'
          )
          .eq('id', uid)
          .maybeSingle();

        if (error) throw error;
        userData = data;
      } else if (!userData.age) {
        // rowFromEnsure only has limited fields — fetch full profile
        const { data } = await supabase
          .from('users')
          .select(
            'id, name, full_name, email, age, gender, marital_status, ' +
            'employment_type, sector, profession, state, city, is_metro, ' +
            'onboarding_done, onboarding_complete'
          )
          .eq('id', uid)
          .maybeSingle();
        userData = data || userData;
      }

      if (!userData) {
        setOnboardingDone(false);
        setUserProfile(null);
        setHasIncomeData(false);
        return false;
      }

      const done = !!(userData.onboarding_done || userData.onboarding_complete);
      setOnboardingDone(done);
      setUserProfile(userData);

      // Income check — separate query, non-fatal
      try {
        const { data: income } = await supabase
          .from('income_profile')
          .select('user_id, gross_salary')
          .eq('user_id', uid)
          .maybeSingle();
        setHasIncomeData(!!(income && Number(income.gross_salary) > 0));
      } catch {
        // If income query times out, assume income exists for onboarded users
        setHasIncomeData(done);
      }

      return done;
    } catch (err) {
      console.error('[Auth] checkOnboarding error:', err.message);
      // On network error, check localStorage for a cached onboarding flag
      // so returning users aren't looped back to onboarding
      const cached = localStorage.getItem('dz_onboarding_done');
      if (cached === 'true') {
        setOnboardingDone(true);
        return true;
      }
      setOnboardingDone(false);
      return false;
    }
  }, []);

  // ── processUser — serialised with in-flight guard ─────────────────────────
  const processUser = useCallback(async (authUser) => {
    if (!authUser || processingUser) return;
    processingUser = true;
    try {
      // Sequential — never concurrent — so they don't fight for the token lock
      const row = await ensurePublicUserRow(authUser);
      await checkOnboarding(authUser.id, row);
    } finally {
      processingUser = false;
    }
  }, [checkOnboarding]);

  // ── Main auth init ────────────────────────────────────────────────────────
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    safetyRef.current = setTimeout(() => {
      console.warn('[Auth] safety timer — forcing loading=false');
      setLoading(false);
    }, 15000);

    const done = () => {
      clearTimeout(safetyRef.current);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null);
          return;
        }

        if (event === 'SIGNED_OUT') {
          clearAllState();
          done();
          return;
        }

        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            setUser(session.user);
            await processUser(session.user);
          }
          if (!isCallbackPage()) done();
          return;
        }

        if (event === 'SIGNED_IN') {
          const u = session?.user ?? null;
          setUser(u);
          if (u) await processUser(u);
          done();
          return;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo : `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    processingUser = false;
    localStorage.removeItem('dz_onboarding_done');
    try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
    clearAllState();
  };

  const refreshProfile = useCallback(async () => {
    if (!user) return false;
    return await checkOnboarding(user.id);
  }, [user, checkOnboarding]);

  const markOnboardingDone  = useCallback(() => {
    setOnboardingDone(true);
    localStorage.setItem('dz_onboarding_done', 'true');
  }, []);
  const markIncomeDataSaved = useCallback(() => setHasIncomeData(true),  []);

  return (
    <AuthContext.Provider value={{
      user, loading, onboardingDone, userProfile,
      hasIncomeData, markIncomeDataSaved, markOnboardingDone,
      loginWithGoogle, logout, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export default AuthContext;
