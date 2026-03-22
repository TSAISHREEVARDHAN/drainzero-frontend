import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,           setUser]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [userProfile,    setUserProfile]    = useState(null);
  const initRef                             = useRef(false);

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
    } catch (e) {
      console.warn('checkOnboarding error:', e.message);
      // On error - don't log out, just assume onboarding done
      setOnboardingDone(true);
      return true;
    }
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // 1. Check existing session immediately
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await checkOnboarding(u.id);
      setLoading(false);
    });

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignore these events to prevent loops
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;

      const u = session?.user ?? null;
      setUser(u);

      if (event === 'SIGNED_IN' && u) {
        await checkOnboarding(u.id);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setOnboardingDone(false);
        setUserProfile(null);
        setLoading(false);
      } else if (event === 'USER_UPDATED' && u) {
        await checkOnboarding(u.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options : {
        redirectTo : `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      }
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
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
