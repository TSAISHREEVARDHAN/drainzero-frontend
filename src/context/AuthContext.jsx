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

// ── Ensure public.users row exists — via backend (service role, no RLS issues) ─
export const ensurePublicUserRow = async (authUser) => {
  if (!authUser?.id) return null;
  const googleName = getGoogleName(authUser);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  try {
    const res = await fetch(`${BACKEND_URL}/api/profile/ensure-user`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ userId: authUser.id, email: authUser.email, name: googleName }),
    });
    const data = await res.json();
    return data?.user || null;
  } catch (e) {
    console.warn('[Auth] ensurePublicUserRow backend error:', e.message);
    return null;
  }
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
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

      // Use rowFromEnsure if it has full data, otherwise load from backend
      let userData = (rowFromEnsure && rowFromEnsure.age) ? rowFromEnsure : null;

      if (!userData) {
        const res  = await fetch(`${BACKEND_URL}/api/profile/load/${uid}`);
        const data = await res.json();
        userData   = data?.user || rowFromEnsure || null;
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

      // Check income from backend load
      try {
        const res    = await fetch(`${BACKEND_URL}/api/profile/load/${uid}`);
        const data   = await res.json();
        const income = data?.income;
        setHasIncomeData(!!(income && Number(income.gross_salary) > 0));
      } catch {
        setHasIncomeData(done);
      }

      return done;
    } catch (err) {
      console.error('[Auth] checkOnboarding error:', err.message);
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
            done(); // always call done — callback page will react to user state
          } else {
            done();
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
