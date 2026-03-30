import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Typography } from 'antd';
import { supabase } from '../../config/supabase';

const { Text } = Typography;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Completing sign in...');

  useEffect(() => {
    let mounted = true;

    // Ensure a public `users` row exists for the auth user
    const ensurePublicUser = async (session) => {
      if (!session?.user?.id) return null;
      const authUser = session.user;
      const fullName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] ||
        'User';

      const { data: existing } = await supabase
        .from('users')
        .select('id, onboarding_done, onboarding_complete')
        .eq('id', authUser.id)
        .maybeSingle();

      if (existing) return existing;

      const { data: inserted, error } = await supabase
        .from('users')
        .upsert(
          {
            id              : authUser.id,
            email           : authUser.email,
            name            : fullName,
            full_name       : fullName,
            onboarding_done : false,
            onboarding_complete: false,
            updated_at      : new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select('id, onboarding_done, onboarding_complete')
        .maybeSingle();

      if (error) {
        console.error('Failed to create public user row:', error.message);
        return null;
      }
      return inserted;
    };

    const waitForSession = async () => {
      for (let i = 0; i < 15; i++) {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data?.session?.user) return data.session;
        await sleep(400);
      }
      return null;
    };

    const handle = async () => {
      try {
        setStatus('Finalizing Google sign in...');
        let session = await waitForSession();

        // Fallback: try exchanging code if present
        if (!session) {
          const url  = new URL(window.location.href);
          const code = url.searchParams.get('code');
          if (code) {
            setStatus('Verifying secure login...');
            try {
              await Promise.race([
                supabase.auth.exchangeCodeForSession(code),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Code exchange timeout')), 5000)
                ),
              ]);
            } catch (err) {
              console.warn('Code exchange fallback failed:', err?.message);
            }
            session = await waitForSession();
          }
        }

        if (!session?.user) throw new Error('Session not found after callback');

        setStatus('Preparing your account...');
        const profile = await ensurePublicUser(session);
        const onboardingDone = !!(profile?.onboarding_done || profile?.onboarding_complete);

        // Clean URL so refreshing doesn't loop
        window.history.replaceState({}, document.title, '/auth/callback');

        if (!mounted) return;

        // FIX: onboarded users → /dashboard, new users → /onboarding
        navigate(onboardingDone ? '/dashboard' : '/onboarding', { replace: true });
      } catch (err) {
        console.error('AuthCallback error:', err.message);
        if (!mounted) return;
        setStatus('Sign in failed. Redirecting...');
        setTimeout(() => { window.location.replace('/login'); }, 900);
      }
    };

    handle();
    return () => { mounted = false; };
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#F2F3F4', gap: 16,
    }}>
      <img
        src="/DRAINZERO-LOGO.png" alt="DrainZero"
        style={{ height: 48, width: 'auto' }}
        onError={e => { e.target.style.display = 'none'; }}
      />
      <Spin size="large" />
      <Text style={{ color: '#6B7280', fontSize: 16 }}>{status}</Text>
    </div>
  );
};

export default AuthCallback;
