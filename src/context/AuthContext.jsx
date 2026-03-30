import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const LAST_ACTIVE_KEY    = 'drainzero-last-active';

// ── Safely read any cached Supabase session from localStorage ──
const getCachedSession = () => {
  try {
    const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
    if (lastActive && Date.now() - parseInt(lastActive) > SESSION_TIMEOUT_MS) {
      localStorage.removeItem(LAST_ACTIVE_KEY);
      return null;
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('drainzero'))) {
        try {
          const val = JSON.parse(localStorage.getItem(key));
          if (val?.access_token && val?.user) return val;
          if (val?.currentSession?.access_token) return val.currentSession;
        } catch {}
      }
    }
    return null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const cachedSession   = getCachedSession();
  const [user,           setUser]           = useState(cachedSession?.user ?? null);
  const [loading,        setLoading]        = useState(!cachedSession);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [userProfile,    setUserProfile]    = useState(null);
  // ── NEW: tracks whether user has real income data in DB ──
  const [hasIncomeData,  setHasIncomeData]  = useState(false);

  const initRef    = useRef(false);
  const timeoutRef = useRef(null);

  // ── Wipe all app state and localStorage keys ──
  const clearAllState = useCallback(() => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.includes('supabase') || k.includes('drainzero'))) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    try {
      const sKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && (k.includes('supabase') || k.includes('drainzero'))) sKeys.push(k);
      }
      sKeys.forEach(k => sessionStorage.removeItem(k));
    } catch {}
    setUser(null);
    setOnboardingDone(false);
    setUserProfile(null);
    setHasIncomeData(false);
  }, []);

  const handleAutoLogout = useCallback(async () => {
    try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
    clearAllState();
  }, [clearAllState]);

  const updateActivity = useCallback(() => {
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(handleAutoLogout, SESSION_TIMEOUT_MS);
  }, [handleAutoLogout]);

  // ── Attach activity listeners when user is logged in ──
  useEffect(() => {
    if (!user) return;
    updateActivity();
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }));
    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user, updateActivity]);

  // ── Check DB for onboarding status + income data ──
  const checkOnboarding = useCallback(async (uid) => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, full_name, email, age, gender, marital_status, employment_type, sector, profession, state, city, is_metro, onboarding_done, onboarding_complete')
        .eq('id', uid)
        .maybeSingle();

      if (!userData) {
        setOnboardingDone(false);
        setUserProfile(null);
        setHasIncomeData(false);
        return false;
      }

      const done = !!(userData.onboarding_done || userData.onboarding_complete);
      setOnboardingDone(done);
      setUserProfile(userData);

      // ── Check income_profile: must exist AND have real salary > 0 ──
      const { data: incomeRow } = await supabase
        .from('income_profile')
        .select('user_id, gross_salary')
        .eq('user_id', uid)
        .maybeSingle();

      setHasIncomeData(!!(incomeRow && Number(incomeRow.gross_salary) > 0));
      return done;
    } catch (err) {
      console.error('checkOnboarding error:', err.message);
      // On network error, allow user through rather than locking them out
      setOnboardingDone(true);
      return true;
    }
  }, []);

  // ── Initialise once ──
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      if (cachedSession?.user) checkOnboarding(cachedSession.user.id);
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user ?? null;
      setUser(u);
      if (u) await checkOnboarding(u.id);
      else if (!u && cachedSession?.user) clearAllState();
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;
      const u = session?.user ?? null;
      setUser(u);
      if (event === 'SIGNED_IN' && u) {
        localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
        await checkOnboarding(u.id);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        clearAllState();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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

  // ── FIX: full logout — clear token, storage, state; caller handles redirect ──
  const logout = async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
    clearAllState();
  };

  const refreshProfile = async () => {
    if (!user) return false;
    return await checkOnboarding(user.id);
  };

  // ── Called by CategorySelection/AnalysisForm after income is saved ──
  const markIncomeDataSaved = useCallback(() => setHasIncomeData(true), []);

  return (
    <AuthContext.Provider value={{
      user, loading, onboardingDone, userProfile,
      hasIncomeData, markIncomeDataSaved,
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
