import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Typography } from 'antd';
import { useAuth } from '../../context/AuthContext';

const { Text } = Typography;

const AuthCallback = () => {
  const navigate     = useNavigate();
  const { user, loading, onboardingDone } = useAuth();
  const navigatedRef = useRef(false); // prevent double navigation

  useEffect(() => {
    if (loading) return;
    if (navigatedRef.current) return;
    navigatedRef.current = true;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (onboardingDone) {
      navigate('/category-selection', { replace: true });
    } else {
      navigate('/onboarding', { replace: true });
    }
  }, [user, loading, onboardingDone]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#F2F3F4', gap: 16
    }}>
      <Spin size="large" />
      <Text style={{ color: '#6B7280', fontSize: 16 }}>Setting up your account...</Text>
    </div>
  );
};

export default AuthCallback;
