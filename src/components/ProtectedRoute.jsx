import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { Spin } from 'antd';

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const { user, loading, onboardingDone } = useAuth();
  const location = useLocation();
  const [sessionState, setSessionState] = useState({ checked: false, hasSession: false, onboardingOk: false });

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setSessionState({ checked: true, hasSession: false, onboardingOk: false });
          return;
        }
        // Directly check onboarding from DB
        const { data: profile } = await supabase
          .from('users')
          .select('onboarding_done, onboarding_complete')
          .eq('id', session.user.id)
          .maybeSingle();

        const done = !!(profile?.onboarding_done || profile?.onboarding_complete);
        setSessionState({ checked: true, hasSession: true, onboardingOk: done });
      } catch {
        setSessionState({ checked: true, hasSession: false, onboardingOk: false });
      }
    };
    check();
  }, [location.pathname]); // re-check on every navigation

  // Show spinner while either context or direct check is loading
  if (loading || !sessionState.checked) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F2F3F4' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Not logged in → login
  const isLoggedIn = !!(user || sessionState.hasSession);
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check onboarding — use EITHER context OR direct DB check
  const isOnboarded = onboardingDone || sessionState.onboardingOk;
  if (requireOnboarding && !isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default ProtectedRoute;
