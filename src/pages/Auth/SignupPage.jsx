import React, { useState } from 'react';
import { ConfigProvider, Button, Card, Typography, Space, Layout, Form, Input, Alert, Divider } from 'antd';
import { ArrowLeftOutlined, LockOutlined, MailOutlined, GoogleOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

const SignupPage = () => {
  const navigate = useNavigate();
  const { signUpWithEmail, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form] = Form.useForm();

  const handleSignup = async (values) => {
    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await signUpWithEmail(values.email, values.password);
      setSuccess('Account created! Check your email to confirm, then login.');
      form.resetFields();
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true);
      await loginWithGoogle();
    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  return (
    <ConfigProvider theme={{
      token: {
        colorPrimary: '#5B92E5',
        borderRadius: 12,
        colorText: '#1F2937',
        fontFamily: "'Outfit', sans-serif",
      },
      components: {
        Button: { controlHeightLG: 52, fontWeight: 600, borderRadius: 12 },
        Input: { colorBgContainer: '#EEF3FA', colorBorder: '#B8C8E6', borderRadius: 12, controlHeight: 48 },
        Card: { paddingLG: 40, borderRadiusLG: 24, boxShadow: '0 8px 30px rgba(8,76,141,0.08)' }
      },
    }}>
      <Layout style={{ minHeight: '100vh', background: '#DCE6F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <Card style={{ maxWidth: 500, width: '100%', border: 'none' }}>

          <div style={{ marginBottom: 32 }}>
            <Space align="center" size={16} style={{ marginBottom: 8 }}>
              <ArrowLeftOutlined onClick={() => navigate('/')} style={{ fontSize: 22, color: '#084C8D', cursor: 'pointer' }} />
              <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#084C8D' }}>Create Account</Title>
            </Space>
            <Text style={{ fontSize: 16, color: '#6B7280', display: 'block' }}>
              Start your journey with professional tax optimization
            </Text>
          </div>

          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 24, borderRadius: 12 }} />}
          {success && <Alert message={success} type="success" showIcon style={{ marginBottom: 24, borderRadius: 12 }} />}

          <Button
            block size="large"
            icon={<GoogleOutlined />}
            loading={googleLoading}
            onClick={handleGoogleSignup}
            style={{ borderColor: '#B8C8E6', color: '#1F2937', height: 52, borderRadius: 12, marginBottom: 24, fontWeight: 600 }}
          >
            Sign up with Google
          </Button>

          <Divider style={{ color: '#6B7280', fontSize: 13 }}>or sign up with email</Divider>

          <Form
            form={form}
            layout="vertical"
            size="large"
            onFinish={handleSignup}
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label={<Text strong style={{ color: '#084C8D' }}>Email</Text>}
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Enter a valid email address' }
              ]}
            >
              <Input prefix={<MailOutlined style={{ color: '#6B7280' }} />} placeholder="Enter your email" />
            </Form.Item>

            <Form.Item
              name="password"
              label={<Text strong style={{ color: '#084C8D' }}>Password</Text>}
              rules={[
                { required: true, message: 'Please enter a password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#6B7280' }} />} placeholder="Create a password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={<Text strong style={{ color: '#084C8D' }}>Confirm Password</Text>}
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                    return Promise.reject(new Error('Passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#6B7280' }} />} placeholder="Confirm your password" />
            </Form.Item>

            <Form.Item style={{ marginTop: 8 }}>
              <Button
                type="primary" block size="large"
                htmlType="submit"
                loading={loading}
                style={{ height: 52, borderRadius: 12, background: '#5B92E5', border: 'none', fontWeight: 600 }}
              >
                Create Account
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Text style={{ color: '#6B7280' }}>
              Already have an account? <Link to="/login" style={{ color: '#5B92E5', fontWeight: 600 }}>Sign In</Link>
            </Text>
          </div>

        </Card>
      </Layout>
    </ConfigProvider>
  );
};

export default SignupPage;
