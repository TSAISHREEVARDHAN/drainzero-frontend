import React, {
  createContext, useContext, useEffect, useState, useRef, useCallback,
} from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

// ─── helpers ─────────────────────────────────────────────────────────────────

const isCallbackPage = () =>
  window.location.pathname.toLowerCase().includes('/auth/callback');

// Wraps a promise with a timeout so slow Supabase connections never hang forever
const withTimeout = (promise, ms = 8000) =>
  Promise.race([
    promise,
    new Promise((_, rej) =>
      setTimeout(() => rej(new Error('DB query timed out')), ms)
    ),
  ]);

// Ensure public.users row exists for this auth user.
// The DB trigger only fires on the very first INSERT into auth.users.
// Returning users whose public row was deleted have no row here.
export const ensurePublicUserRow = async (authUser) => {
  if (!authUser?.id) return null;

  const fullName =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email?.split('@')[0] ||
    'User';

  // Read first — cheapest path for existing users
  try {
    const { data: existing } = await withTimeout(
      supabase
        .from('users')
        .select('id, onboarding_done, onboarding_complete')
        .eq('id', authUser.id)
        .maybeSingle()
    );
    if (existing) return existing;
  } catch {}

  // Row missing — create it
  try {
    const { data: inserted, error } = await withTimeout(
      supabase
        .from('users')
        .insert({
          id                  : authUser.id,
          email               : authUser.email,
          name                : fullName,
          full_name           : fullName,
          onboarding_done     : false,
          onboarding_complete : false,
          updated_at          : new Date().toISOString(),
        })
        .select('id, onboarding_done, onboarding_complete')
        .maybeSingle()
    );

    if (inserted) return inserted;
    if (error && error.code !== '23505') {
      console.warn('[Auth] ensurePublicUserRow insert error:', error.message);
    }
  } catch {}

  // Unique conflict or timeout — read again
  try {
    const { data: retry } = await withTimeout(
      supabase
        .from('users')
        .select('id, onboarding_done, onboarding_complete')
        .eq('id', authUser.id)
        .maybeSingle()
    );
    return retry;
  } catch {}

  return null;
};

// ─── provider ────────────────────────────────────────────────────────────────

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

  const checkOnboarding = useCallback(async (uid) => {
    if (!uid) return false;
    try {
      // Both queries have individual timeouts so they never hang
      const { data: userData, error } = await withTimeout(
        supabase
          .from('users')
          .select(
            'id, name, full_name, email, age, gender, marital_status, ' +
            'employment_type, sector, profession, state, city, is_metro, ' +
            'onboarding_done, onboarding_complete'
          )
          .eq('id', uid)
          .maybeSingle()
      );

      if (error) throw error;
      if (!userData) {
        setOnboardingDone(false);
        setUserProfile(null);
        setHasIncomeData(false);
        return false;
      }

      const done = !!(userData.onboarding_done || userData.onboarding_complete);
      setOnboardingDone(done);
      setUserProfile(userData);

      try {
        const { data: income } = await withTimeout(
          supabase
            .from('income_profile')
            .select('user_id, gross_salary')
            .eq('user_id', uid)
            .maybeSingle()
        );
        setHasIncomeData(!!(income && Number(income.gross_salary) > 0));
      } catch {
        // Income query timed out — non-fatal
        setHasIncomeData(false);
      }

      return done;
    } catch (err) {
      console.error('[Auth] checkOnboarding error:', err.message);
      // On timeout/network error, let user through rather than locking them out
      setOnboardingDone(true);
      return true;
    }
  }, []);

  const processUser = useCallback(async (authUser) => {
    if (!authUser) return;
    await ensurePublicUserRow(authUser);
    await checkOnboarding(authUser.id);
  }, [checkOnboarding]);

  // ── main auth init — runs once ────────────────────────────────────────────
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    // Safety valve: never leave app spinner-locked forever
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
        console.log('[Auth]', event, session?.user?.email ?? 'no user');

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
            done();
          } else {
            if (!isCallbackPage()) done();
            // else stay loading=true, wait for SIGNED_IN
          }
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

  // ── public API ────────────────────────────────────────────────────────────

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
    try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
    clearAllState();
  };

  // NOTE: refreshProfile intentionally NOT exported anymore.
  // Calling it after onboarding can overwrite onboardingDone=true with false
  // if the DB save hasn't propagated yet. Profile data reloads on next login.
  const refreshProfile = async () => {
    if (!user) return false;
    return await checkOnboarding(user.id);
  };

  const markOnboardingDone  = useCallback(() => setOnboardingDone(true), []);
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
