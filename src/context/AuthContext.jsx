import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,           setUser]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [userProfile,    setUserProfile]    = useState(null);
  const initializedRef                      = useRef(false);

  const checkOnboarding = async (uid) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('id, name, email, age, gender, marital_status, employment_type, sector, profession, state, city, is_metro, onboarding_done, onboarding_complete')
        .eq('id', uid)
        .maybeSingle();

      if (!data) {
        setOnboardingDone(false);
        setUserProfile(null);
        return false;
      }
      const done = !!(data.onboarding_done || data.onboarding_complete);
      setOnboardingDone(done);
      setUserProfile(data);
      return done;
    } catch {
      setOnboardingDone(false);
      return false;
    }
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Check existing session on load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await checkOnboarding(u.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;
      const u = session?.user ?? null;
      setUser(u);
      if (u && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        await checkOnboarding(u.id);
      } else if (event === 'SIGNED_OUT') {
        setOnboardingDone(false);
        setUserProfile(null);
      }
      setLoading(false);
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
