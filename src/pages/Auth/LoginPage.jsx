import React, { useState } from 'react';
import { ConfigProvider, Button, Card, Typography, Space, Layout, Form, Input, Divider, Alert } from 'antd';
import { GoogleOutlined, ArrowLeftOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGLoading]= useState(false);
  const [error, setError]           = useState('');
  const [form]                      = Form.useForm();

  const handleGoogleLogin = async () => {
    try {
      setGLoading(true);
      setError('');
      await loginWithGoogle();
      // Redirect handled by Google → /auth/callback → AuthCallback
    } catch (err) {
      setError(err.message || 'Google login failed. Please try again.');
      setGLoading(false);
    }
  };

  const handleEmailLogin = async (values) => {
    try {
      setLoading(true);
      setError('');
      const result = await loginWithEmail(values.email, values.password);
      // loginWithEmail now returns onboardingDone
      if (result.onboardingDone) {
        navigate('/category-selection', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider theme={{
      token: { colorPrimary: '#5B92E5', borderRadius: 12, colorText: '#1F2937', fontFamily: "'Outfit', sans-serif" },
      components: {
        Button: { controlHeightLG: 52, fontWeight: 600, borderRadius: 12 },
        Input: { colorBgContainer: '#EEF3FA', colorBorder: '#B8C8E6', borderRadius: 12, controlHeight: 48 },
        Card: { paddingLG: 40, borderRadiusLG: 24, boxShadow: '0 8px 30px rgba(8,76,141,0.08)' }
      }
    }}>
      <Layout style={{ minHeight: '100vh', background: '#DCE6F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <Card style={{ maxWidth: 480, width: '100%', border: 'none' }}>

          <div style={{ marginBottom: 32 }}>
            <Space align="center" size={16} style={{ marginBottom: 8 }}>
              <ArrowLeftOutlined onClick={() => navigate('/')} style={{ fontSize: 22, color: '#084C8D', cursor: 'pointer' }} />
              <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#084C8D' }}>Login</Title>
            </Space>
            <Text style={{ fontSize: 16, color: '#6B7280', display: 'block' }}>
              Access your personal fiscal optimization dashboard
            </Text>
          </div>

          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 24, borderRadius: 12 }} />}

          <Button block size="large" icon={<GoogleOutlined />} loading={googleLoading}
            onClick={handleGoogleLogin}
            style={{ borderColor: '#B8C8E6', color: '#1F2937', height: 52, borderRadius: 12, marginBottom: 24, fontWeight: 600 }}>
            Continue with Google
          </Button>

          <Divider style={{ color: '#6B7280', fontSize: 13 }}>or login with email</Divider>

          <Form form={form} layout="vertical" size="large" onFinish={handleEmailLogin} requiredMark={false}>
            <Form.Item name="email"
              rules={[{ required: true, message: 'Please enter your email' }, { type: 'email', message: 'Enter a valid email' }]}>
              <Input prefix={<MailOutlined style={{ color: '#6B7280' }} />} placeholder="Email address" />
            </Form.Item>
            <Form.Item name="password"
              rules={[{ required: true, message: 'Please enter your password' }, { min: 6, message: 'Min 6 characters' }]}>
              <Input.Password prefix={<LockOutlined style={{ color: '#6B7280' }} />} placeholder="Password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" block size="large" htmlType="submit" loading={loading}
                style={{ height: 52, borderRadius: 12, background: '#5B92E5', border: 'none', fontWeight: 600 }}>
                Login
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Text style={{ color: '#6B7280' }}>
              New here? <Link to="/signup" style={{ color: '#5B92E5', fontWeight: 600 }}>Create account</Link>
            </Text>
          </div>

        </Card>
      </Layout>
    </ConfigProvider>
  );
};

export default LoginPage;
