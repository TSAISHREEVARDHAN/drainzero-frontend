import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Typography } from 'antd';
import { supabase } from '../../config/supabase';

const { Text } = Typography;

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Completing sign in...');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // With implicit flow, Supabase auto-detects token in URL hash
        // Just wait a moment then check session
        setStatus('Completing sign in...');
        
        await new Promise(r => setTimeout(r, 1000));

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          console.error('No session:', error?.message);
          navigate('/login', { replace: true });
          return;
        }

        setStatus('Checking your profile...');

        const { data: profile } = await supabase
          .from('users')
          .select('onboarding_done, onboarding_complete')
          .eq('id', session.user.id)
          .maybeSingle();

        const done = !!(profile?.onboarding_done || profile?.onboarding_complete);

        if (done) {
          navigate('/category-selection', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }

      } catch (err) {
        console.error('AuthCallback error:', err);
        navigate('/login', { replace: true });
      }
    };

    handleAuth();
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#F2F3F4', gap: 16
    }}>
      <Spin size="large" />
      <Text style={{ color: '#6B7280', fontSize: 16 }}>{status}</Text>
    </div>
  );
};

export default AuthCallback;
