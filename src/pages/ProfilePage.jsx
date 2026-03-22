import React, { useState, useEffect } from 'react';
import {
  ConfigProvider, Card, Typography, Form, Input, Select,
  Radio, Button, Alert, message, Row, Col, Avatar, Tag
} from 'antd';
import { UserOutlined, SaveOutlined, ArrowLeftOutlined, EnvironmentOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import Navbar from '../components/Navbar';

const { Title, Text } = Typography;

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh'
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, userProfile, refreshProfile } = useAuth();
  const [form]    = Form.useForm();
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [loaded,  setLoaded]  = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      // Try from context first
      let profile = userProfile;
      
      // If not in context, fetch directly
      if (!profile && user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        profile = data;
      }

      if (profile) {
        form.setFieldsValue({
          name           : profile.name            || '',
          age            : profile.age             || '',
          gender         : profile.gender          || '',
          marital_status : profile.marital_status  || '',
          employment_type: profile.employment_type || '',
          sector         : profile.sector          || '',
          profession     : profile.profession      || '',
          state          : profile.state           || '',
          city           : profile.city            || '',
        });
      }
      setLoaded(true);
    };

    loadProfile();
  }, [userProfile, user]);

  const handleSave = async (values) => {
    try {
      setSaving(true);
      setError('');

      const isMetro = ['Mumbai','Delhi','Bangalore','Bengaluru','Chennai','Kolkata','Hyderabad']
        .some(c => values.city?.toLowerCase().includes(c.toLowerCase()));

      const { error: err } = await supabase.from('users').upsert({
        id             : user.id,
        email          : user.email,
        name           : values.name,
        age            : parseInt(values.age),
        gender         : values.gender,
        marital_status : values.marital_status,
        employment_type: values.employment_type,
        sector         : values.sector,
        profession     : values.profession || '',
        state          : values.state,
        city           : values.city,
        is_metro       : isMetro,
        onboarding_done: true,
        updated_at     : new Date().toISOString(),
      }, { onConflict: 'id' });

      if (err) throw new Error(err.message);
      await refreshProfile();
      message.success('Profile updated!');
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const lbl = { color: '#08457E', fontWeight: 600, fontSize: 13 };

  return (
    <ConfigProvider theme={{
      token: { colorPrimary: '#5B92E5', borderRadius: 12, fontFamily: "'Outfit', sans-serif" },
      components: {
        Input: { colorBgContainer: '#F8FAFC', colorBorder: '#E2E8F0', controlHeight: 44 },
      }
    }}>
      <div style={{ minHeight: '100vh', background: '#F2F3F4' }}>
        <Navbar />
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px', boxSizing: 'border-box' }}>

          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}
            style={{ marginBottom: 20, borderRadius: 10, color: '#08457E', borderColor: '#B8C8E6' }}>
            Back
          </Button>

          {/* Header card */}
          <Card style={{ borderRadius: 20, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Avatar size={64} style={{ background: '#EEF3FA', color: '#08457E', fontSize: 24, fontWeight: 700, flexShrink: 0 }}>
                {userProfile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Title level={4} style={{ margin: '0 0 4px', color: '#08457E' }}>{userProfile?.name || 'Your Profile'}</Title>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <LockOutlined style={{ color: '#9CA3AF', fontSize: 12 }} />
                  <Text style={{ color: '#9CA3AF', fontSize: 13 }}>{user?.email}</Text>
                  <Tag color="blue" style={{ borderRadius: 20, fontSize: 11 }}>Google Account</Tag>
                </div>
                {userProfile?.employment_type && (
                  <Text style={{ color: '#5B92E5', fontSize: 13, fontWeight: 600 }}>
                    {userProfile.employment_type} · {userProfile.sector || ''} · {userProfile.city || ''}
                  </Text>
                )}
              </div>
            </div>
          </Card>

          {/* Edit form */}
          <Card style={{ borderRadius: 20, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <Title level={5} style={{ color: '#08457E', marginBottom: 20 }}>Edit Personal Information</Title>

            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16, borderRadius: 10 }} />}

            <Form form={form} layout="vertical" onFinish={handleSave} requiredMark={false}>

              {/* Personal */}
              <Row gutter={[12, 0]}>
                <Col xs={24} md={14}>
                  <Form.Item name="name" label={<Text style={lbl}>Full Name</Text>}
                    rules={[{ required: true, message: 'Required' }]}>
                    <Input prefix={<UserOutlined style={{ color: '#9CA3AF' }} />} placeholder="Your full name" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={10}>
                  <Form.Item name="age" label={<Text style={lbl}>Age</Text>}
                    rules={[{ required: true, message: 'Required' }]}>
                    <Input type="number" min={18} max={100} placeholder="e.g. 28" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="gender" label={<Text style={lbl}>Gender</Text>}
                rules={[{ required: true, message: 'Required' }]}>
                <Radio.Group buttonStyle="solid" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['Male','Female','Other'].map(g => (
                    <Radio.Button key={g} value={g} style={{ borderRadius: 8 }}>{g}</Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>

              <Form.Item name="marital_status" label={<Text style={lbl}>Marital Status</Text>}
                rules={[{ required: true, message: 'Required' }]}>
                <Radio.Group buttonStyle="solid" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['Single','Married','Divorced','Widowed'].map(s => (
                    <Radio.Button key={s} value={s} style={{ borderRadius: 8 }}>{s}</Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>

              {/* Employment */}
              <Row gutter={[12, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item name="employment_type" label={<Text style={lbl}>Employment Type</Text>}
                    rules={[{ required: true, message: 'Required' }]}>
                    <Select placeholder="Select type" style={{ borderRadius: 10 }}>
                      {['Salaried','Self-Employed','Freelancer','Business Owner','Student','Retired'].map(t => (
                        <Select.Option key={t} value={t}>{t}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="sector" label={<Text style={lbl}>Sector</Text>}
                    rules={[{ required: true, message: 'Required' }]}>
                    <Select placeholder="Select sector" style={{ borderRadius: 10 }}>
                      {['Government','IT/Software','Banking/Finance','Healthcare','Education','Manufacturing','Real Estate','Retail/Trade','Agriculture','Legal/CA','Media/Arts','Startup','Defence','Other'].map(s => (
                        <Select.Option key={s} value={s}>{s}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="profession" label={<Text style={{ ...lbl, fontWeight: 400, color: '#6B7280' }}>Job Title (Optional)</Text>}>
                <Input placeholder="e.g. Software Engineer, CA" style={{ borderRadius: 10 }} />
              </Form.Item>

              {/* Location */}
              <Row gutter={[12, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item name="state" label={<Text style={lbl}>State</Text>}
                    rules={[{ required: true, message: 'Required' }]}>
                    <Select showSearch placeholder="Select state" style={{ borderRadius: 10 }}>
                      {STATES.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="city" label={<Text style={lbl}>City</Text>}
                    rules={[{ required: true, message: 'Required' }]}>
                    <Input prefix={<EnvironmentOutlined style={{ color: '#9CA3AF' }} />} placeholder="e.g. Hyderabad" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
              </Row>

              <Button
                type="primary" htmlType="submit" size="large"
                icon={<SaveOutlined />} loading={saving}
                style={{ height: 48, borderRadius: 12, background: '#08457E', border: 'none', fontWeight: 600, width: '100%' }}
              >
                Save Changes
              </Button>
            </Form>
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default ProfilePage;
