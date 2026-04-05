import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Typography, Button } from 'antd';
import { useAuth } from '../../context/AuthContext';

const { Text } = Typography;

// ─────────────────────────────────────────────────────────────────────────────
//  AuthCallback — Google OAuth lands here: /auth/callback
//
//  Error taxonomy:
//  ┌─ "Database error saving new user"
//  │   = Supabase trigger failed. Auth MAY still succeed on retry.
//  │   = NOT a user-facing error — show "Try Again" immediately.
//  │
//  ├─ "access_denied" / user cancelled
//  │   = Real OAuth error — show message.
//  │
//  └─ No error in URL → normal PKCE flow
//      → detectSessionInUrl exchanges code → AuthContext fires SIGNED_IN
//      → we react to useAuth() state change and navigate
// ─────────────────────────────────────────────────────────────────────────────

const MSGS = [
  [0,    'Signing in with Google…'],
  [2500, 'Verifying your account…'],
  [6000, 'Almost there…'],
];

// Errors caused by Supabase internals — not the user's fault.
// Retry immediately instead of showing a scary message.
const RETRIABLE_ERRORS = [
  'database error',
  'saving new user',
  'unexpected_failure',
  'server_error',
];

const isRetriable = (msg) => {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return RETRIABLE_ERRORS.some(k => lower.includes(k));
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading, onboardingDone } = useAuth();

  const [oauthError,  setOauthError]  = useState('');
  const [statusMsg,   setStatusMsg]   = useState(MSGS[0][1]);
  const [autoRetry,   setAutoRetry]   = useState(false);

  // ── Step 1: detect URL-level errors ─────────────────────────────────────
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const h = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    const errDesc =
      q.get('error_description') || h.get('error_description') ||
      q.get('error')             || h.get('error');

    if (errDesc) {
      const decoded = decodeURIComponent(errDesc.replace(/\+/g, ' '));

      if (isRetriable(decoded)) {
        // Supabase DB trigger failed — redirect straight back to login
        // so the user can retry. The trigger has been fixed to not block
        // on the next attempt; ensurePublicUserRow() will create the row.
        console.warn('[AuthCallback] Retriable Supabase error:', decoded);
        setAutoRetry(true);
        setTimeout(() => window.location.replace('/login'), 1500);
      } else {
        // Real OAuth error (user cancelled, access denied, etc.)
        setOauthError(decoded);
      }
      return;
    }

    // Progressive status messages
    const timers = MSGS.slice(1).map(([ms, msg]) =>
      setTimeout(() => setStatusMsg(msg), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // ── Step 2: react to auth state — navigate when resolved ────────────────
  useEffect(() => {
    if (oauthError || autoRetry) return;
    if (loading) return;

    window.history.replaceState({}, document.title, '/auth/callback');

    if (user) {
      navigate(onboardingDone ? '/dashboard' : '/onboarding', { replace: true });
    } else {
      window.location.replace('/login');
    }
  }, [user, loading, onboardingDone, oauthError, autoRetry, navigate]);

  // ── Auto-retry UI (database error) ──────────────────────────────────────
  if (autoRetry) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#F2F3F4', gap: 20,
      }}>
        <img src="/DRAINZERO-LOGO.png" alt="DrainZero"
          style={{ height: 72, width: 'auto' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <Spin size="large" />
        <Text style={{ color: '#6B7280', fontSize: 16 }}>
          Retrying sign in…
        </Text>
      </div>
    );
  }

  // ── Real OAuth error UI ──────────────────────────────────────────────────
  if (oauthError) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#F2F3F4', gap: 20, padding: 24,
      }}>
        <img src="/DRAINZERO-LOGO.png" alt="DrainZero"
          style={{ height: 72, width: 'auto' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <Text style={{ color: '#EF4444', fontSize: 16, textAlign: 'center', maxWidth: 360 }}>
          Google sign-in was declined.<br />
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>{oauthError}</span>
        </Text>
        <Button type="primary" onClick={() => window.location.replace('/login')}
          style={{ height: 48, borderRadius: 12, paddingInline: 32, fontWeight: 700 }}>
          Try Again
        </Button>
      </div>
    );
  }

  // ── Normal loading UI ────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#F2F3F4', gap: 20,
    }}>
      <img src="/DRAINZERO-LOGO.png" alt="DrainZero"
        style={{ height: 72, width: 'auto' }}
        onError={e => { e.target.style.display = 'none'; }}
      />
      <Spin size="large" />
      <Text style={{ color: '#6B7280', fontSize: 16 }}>{statusMsg}</Text>
    </div>
  );
};

export default AuthCallback;
