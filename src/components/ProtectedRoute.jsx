import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const { user, loading, onboardingDone } = useAuth();
  const location = useLocation();

  // Show spinner only if context is still loading
  // With cached session this is near-instant on refresh
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: '#F2F3F4', gap: 16
      }}>
        <img src="/DRAINZERO-LOGO.png" alt="DrainZero"
          style={{ height: 48, width: 'auto' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <Spin size="large" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Not onboarded
  if (requireOnboarding && !onboardingDone) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default ProtectedRoute;
