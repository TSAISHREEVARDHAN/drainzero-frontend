import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const { user, loading, onboardingDone } = useAuth();
  const location = useLocation();

  // Show spinner while auth is loading
  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center',
        alignItems: 'center', height: '100vh', background: '#F2F3F4'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // Not logged in → go to login, remember where they were
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but onboarding not done → onboarding
  if (requireOnboarding && !onboardingDone) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default ProtectedRoute;
