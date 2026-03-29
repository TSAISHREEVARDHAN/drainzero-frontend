import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

// ── Session timeout: 30 minutes in ms ──
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const LAST_ACTIVE_KEY    = 'drainzero-last-active';

const getCachedSession = () => {
  try {
    // Check if session has timed out due to inactivity
    const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
    if (lastActive) {
      const elapsed = Date.now() - parseInt(lastActive);
      if (elapsed > SESSION_TIMEOUT_MS) {
        // Timed out — clear everything
        localStorage.removeItem(LAST_ACTIVE_KEY);
        return null;
      }
    }

    const raw = localStorage.getItem('drainzero-session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const session = parsed?.currentSession || parsed?.session || parsed;
    if (session?.access_token && session?.user) return session;
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
  const cachedSession = getCachedSession();
  const [user,           setUser]           = useState(cachedSession?.user ?? null);
  const [loading,        setLoading]        = useState(!cachedSession);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [userProfile,    setUserProfile]    = useState(null);
  const initRef                             = useRef(false);
  const timeoutRef                          = useRef(null);

  // ── Update last active timestamp on any user interaction ──
  const updateActivity = () => {
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    // Reset timeout timer
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // Auto logout after 30 min inactivity
      handleAutoLogout();
    }, SESSION_TIMEOUT_MS);
  };

  const handleAutoLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    localStorage.removeItem(LAST_ACTIVE_KEY);
    setUser(null);
    setOnboardingDone(false);
    setUserProfile(null);
  };

  // ── Attach activity listeners ──
  useEffect(() => {
    if (!user) return;

    // Set initial activity timestamp
    updateActivity();

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }));

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user]);

  const checkOnboarding = async (uid) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('id, name, email, age, gender, marital_status, employment_type, sector, profession, state, city, is_metro, onboarding_done, onboarding_complete')
        .eq('id', uid)
        .maybeSingle();

      if (!data) { setOnboardingDone(false); setUserProfile(null); return false; }
      const done = !!(data.onboarding_done || data.onboarding_complete);
      setOnboardingDone(done);
      setUserProfile(data);
      return done;
    } catch {
      setOnboardingDone(true);
      return true;
    }
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      if (cachedSession?.user) {
        checkOnboarding(cachedSession.user.id);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await checkOnboarding(u.id);
      } else if (!u && cachedSession?.user) {
        setOnboardingDone(false);
        setUserProfile(null);
      }
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
        localStorage.removeItem(LAST_ACTIVE_KEY);
        setOnboardingDone(false);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options : {
        redirectTo  : `${window.location.origin}/auth/callback`,
        queryParams : { prompt: 'select_account' },
      }
    });
    if (error) throw error;
  };

  const logout = async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.warn('Supabase signOut warning:', error?.message || error);
    }

    try {
      localStorage.removeItem(LAST_ACTIVE_KEY);
      localStorage.removeItem('drainzero-session');
      Object.keys(localStorage).forEach((key) => {
        if (key && (key.includes('supabase') || key.includes('drainzero'))) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage).forEach((key) => {
        if (key && (key.includes('supabase') || key.includes('drainzero'))) {
          sessionStorage.removeItem(key);
        }
      });
    } catch {}

    setUser(null);
    setOnboardingDone(false);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (!user) return false;
    return await checkOnboarding(user.id);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, onboardingDone, userProfile,
      loginWithGoogle, logout, refreshProfile
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
