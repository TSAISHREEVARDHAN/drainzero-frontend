import React, { useState } from 'react';
import { ConfigProvider, Button, Card, Typography, Space, Layout, Alert } from 'antd';
import { GoogleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Google login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <ConfigProvider theme={{
      token: { colorPrimary: '#5B92E5', borderRadius: 12, colorText: '#1F2937', fontFamily: "'Outfit', sans-serif" },
      components: {
        Button: { controlHeightLG: 52, fontWeight: 600, borderRadius: 12 },
        Card: { paddingLG: 40, borderRadiusLG: 24, boxShadow: '0 8px 30px rgba(8,76,141,0.08)' }
      }
    }}>
      <Layout style={{ minHeight: '100vh', background: '#DCE6F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <Card style={{ maxWidth: 440, width: '100%', border: 'none', textAlign: 'center' }}>

          {/* Logo */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#08457E' }}>
              Drain<span style={{ color: '#5B92E5' }}>Zero</span>
            </div>
          </div>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <Title level={3} style={{ margin: '0 0 8px', fontWeight: 700, color: '#084C8D' }}>
              Welcome Back
            </Title>
            <Text style={{ fontSize: 15, color: '#6B7280' }}>
              Sign in to access your tax optimization dashboard
            </Text>
          </div>

          {error && (
            <Alert message={error} type="error" showIcon style={{ marginBottom: 24, borderRadius: 12, textAlign: 'left' }} />
          )}

          {/* Google Login Only */}
          <Button
            block size="large"
            icon={<GoogleOutlined style={{ fontSize: 18 }} />}
            loading={loading}
            onClick={handleGoogleLogin}
            style={{
              height: 56, borderRadius: 12, fontWeight: 600, fontSize: 16,
              borderColor: '#B8C8E6', color: '#1F2937',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            Continue with Google
          </Button>

          <div style={{ marginTop: 24 }}>
            <Text style={{ color: '#6B7280', fontSize: 13 }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: '#5B92E5', fontWeight: 600 }}>Sign up free</Link>
            </Text>
          </div>

          <div style={{ marginTop: 16 }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}
              style={{ color: '#6B7280', fontSize: 13 }}>
              Back to Home
            </Button>
          </div>

          <div style={{ marginTop: 24, padding: '12px 16px', background: '#F2F3F4', borderRadius: 10 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
              🔒 Secure login powered by Google OAuth. We never see your password.
            </Text>
          </div>

        </Card>
      </Layout>
    </ConfigProvider>
  );
};

export default LoginPage;
