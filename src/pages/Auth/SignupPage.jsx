import React, { useState } from 'react';
import { ConfigProvider, Button, Typography, Alert } from 'antd';
import { GoogleOutlined, ArrowLeftOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

const FEATURES = [
  'Old vs New regime comparison',
  'AI Tax Assistant (Gemini-powered)',
  '14 legal tax loopholes',
  'Form 16 upload & auto-analysis',
  'Tax leakage detection',
];

const SignupPage = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Google signup failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <ConfigProvider theme={{
      token: { colorPrimary: '#5B92E5', borderRadius: 12, fontFamily: "'Outfit', sans-serif" },
    }}>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #DCE6F5 0%, #EEF3FA 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 440,
          background: '#FFFFFF',
          borderRadius: 24,
          padding: '40px 32px',
          boxShadow: '0 8px 40px rgba(8,69,126,0.12)',
          boxSizing: 'border-box',
        }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <img src="/DRAINZERO-LOGO.png" alt="DrainZero"
                style={{ height: 40, width: 'auto' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span style={{ fontSize: 26, fontWeight: 800, color: '#08457E' }}>
                Drain<span style={{ color: '#5B92E5' }}>Zero</span>
              </span>
            </div>
            <Title level={3} style={{ margin: '0 0 8px', fontWeight: 700, color: '#084C8D', fontSize: 22 }}>
              Create Your Account
            </Title>
            <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5 }}>
              Optimize your taxes in under 5 minutes — free
            </Text>
          </div>

          {/* Features list */}
          <div style={{
            background: '#EEF3FA',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 24,
          }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: '#08457E',
                marginBottom: i < FEATURES.length - 1 ? 8 : 0
              }}>
                <CheckCircleFilled style={{ color: '#10B981', fontSize: 13, flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>

          {error && (
            <Alert message={error} type="error" showIcon
              style={{ marginBottom: 20, borderRadius: 10 }} />
          )}

          {/* Google Button */}
          <Button
            block size="large"
            icon={<GoogleOutlined style={{ fontSize: 18 }} />}
            loading={loading}
            onClick={handleGoogleSignup}
            style={{
              height: 52,
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 15,
              borderColor: '#D1D5DB',
              color: '#1F2937',
              background: '#FFFFFF',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            Sign up with Google
          </Button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 8 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#5B92E5', fontWeight: 600 }}>
                Sign in
              </Link>
            </div>
            <Button type="text" size="small"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/')}
              style={{ color: '#9CA3AF', fontSize: 13 }}>
              Back to Home
            </Button>
          </div>

          <div style={{
            marginTop: 20,
            padding: '10px 16px',
            background: '#F9FAFB',
            borderRadius: 10,
            textAlign: 'center',
          }}>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
              🔒 Secure signup via Google · Only name & email accessed
            </Text>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default SignupPage;
