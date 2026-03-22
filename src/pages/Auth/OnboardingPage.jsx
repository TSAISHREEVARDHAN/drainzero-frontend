import React, { useState } from 'react';
import {
  ConfigProvider, Card, Typography, Form, Input, Select,
  Radio, Button, Space, Layout, Steps, Alert, Progress
} from 'antd';
import {
  UserOutlined, ArrowRightOutlined, ArrowLeftOutlined,
  BankOutlined, TeamOutlined, EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';

const { Title, Text, Paragraph } = Typography;

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh'
];

const STEPS = [
  { title: 'Personal', icon: <UserOutlined /> },
  { title: 'Employment', icon: <BankOutlined /> },
  { title: 'Location', icon: <EnvironmentOutlined /> },
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form] = Form.useForm();

  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    age: '',
    gender: '',
    marital_status: '',
    employment_type: '',
    sector: '',
    profession: '',
    state: '',
    city: '',
    is_metro: false,
  });

  const updateData = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const validateStep = async () => {
    try {
      if (current === 0) {
        await form.validateFields(['name', 'age', 'gender', 'marital_status']);
      } else if (current === 1) {
        await form.validateFields(['employment_type', 'sector']);
      } else if (current === 2) {
        await form.validateFields(['state', 'city']);
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleNext = async () => {
    const valid = await validateStep();
    if (!valid) return;
    if (current < STEPS.length - 1) {
      setCurrent(current + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const values = form.getFieldsValue(true);
      const isMetro = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'].some(
        c => values.city?.toLowerCase().includes(c.toLowerCase())
      );

      // Save to Supabase users table
      const { error: userErr } = await supabase.from('users').upsert({
        id              : user.id,
        email           : user.email,
        name            : values.name,
        age             : parseInt(values.age),
        gender          : values.gender,
        marital_status  : values.marital_status,
        employment_type : values.employment_type,
        sector          : values.sector,
        profession      : values.profession || '',
        state           : values.state,
        city            : values.city,
        is_metro        : isMetro,
        onboarding_done : true,
        updated_at      : new Date().toISOString(),
      }, { onConflict: 'id' });

      if (userErr) throw new Error(userErr.message);

      // Initialize empty income profile
      const { error: incErr } = await supabase.from('income_profile').upsert({
        user_id         : user.id,
        gross_salary    : 0,
        preferred_regime: 'Auto Suggest',
        updated_at      : new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (incErr) console.warn('Income profile init:', incErr.message);

      // Refresh profile in context so ProtectedRoute sees onboarding_done = true
      await refreshProfile();
      navigate('/category-selection', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { borderRadius: 12, height: 48 };
  const labelStyle = { color: '#08457E', fontWeight: 600 };

  const Step0 = () => (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <Title level={4} style={{ color: '#08457E', marginBottom: 24 }}>Tell us about yourself</Title>

      <Form.Item name="name" label={<Text style={labelStyle}>Full Name</Text>}
        rules={[{ required: true, message: 'Please enter your name' }]}>
        <Input style={inputStyle} placeholder="e.g. Rahul Sharma" prefix={<UserOutlined style={{ color: '#6B7280' }} />} />
      </Form.Item>

      <Form.Item name="age" label={<Text style={labelStyle}>Age</Text>}
        rules={[
          { required: true, message: 'Please enter your age' },
          { pattern: /^[0-9]+$/, message: 'Enter valid age' },
          { validator: (_, v) => (v >= 18 && v <= 100) ? Promise.resolve() : Promise.reject('Age must be between 18–100') }
        ]}>
        <Input style={inputStyle} placeholder="e.g. 28" type="number" min={18} max={100} />
      </Form.Item>

      <Form.Item name="gender" label={<Text style={labelStyle}>Gender</Text>}
        rules={[{ required: true, message: 'Please select gender' }]}>
        <Radio.Group buttonStyle="solid" size="large">
          <Radio.Button value="Male">Male</Radio.Button>
          <Radio.Button value="Female">Female</Radio.Button>
          <Radio.Button value="Other">Other</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item name="marital_status" label={<Text style={labelStyle}>Marital Status</Text>}
        rules={[{ required: true, message: 'Please select marital status' }]}>
        <Radio.Group buttonStyle="solid" size="large">
          <Radio.Button value="Single">Single</Radio.Button>
          <Radio.Button value="Married">Married</Radio.Button>
          <Radio.Button value="Divorced">Divorced</Radio.Button>
          <Radio.Button value="Widowed">Widowed</Radio.Button>
        </Radio.Group>
      </Form.Item>
    </Space>
  );

  const Step1 = () => (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <Title level={4} style={{ color: '#08457E', marginBottom: 24 }}>Your Employment Details</Title>

      <Form.Item name="employment_type" label={<Text style={labelStyle}>Employment Type</Text>}
        rules={[{ required: true, message: 'Please select employment type' }]}>
        <Radio.Group buttonStyle="solid" size="large" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Radio.Button value="Salaried">Salaried</Radio.Button>
          <Radio.Button value="Self-Employed">Self-Employed</Radio.Button>
          <Radio.Button value="Freelancer">Freelancer</Radio.Button>
          <Radio.Button value="Business Owner">Business Owner</Radio.Button>
          <Radio.Button value="Student">Student</Radio.Button>
          <Radio.Button value="Retired">Retired</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item name="sector" label={<Text style={labelStyle}>Sector / Industry</Text>}
        rules={[{ required: true, message: 'Please select your sector' }]}>
        <Select size="large" style={{ borderRadius: 12 }} placeholder="Select your sector">
          <Select.Option value="Government">Government / PSU</Select.Option>
          <Select.Option value="IT/Software">IT / Software</Select.Option>
          <Select.Option value="Banking/Finance">Banking / Finance</Select.Option>
          <Select.Option value="Healthcare">Healthcare / Medical</Select.Option>
          <Select.Option value="Education">Education</Select.Option>
          <Select.Option value="Manufacturing">Manufacturing</Select.Option>
          <Select.Option value="Real Estate">Real Estate</Select.Option>
          <Select.Option value="Retail/Trade">Retail / Trade</Select.Option>
          <Select.Option value="Agriculture">Agriculture</Select.Option>
          <Select.Option value="Legal/CA">Legal / CA / Consulting</Select.Option>
          <Select.Option value="Media/Arts">Media / Arts / Content</Select.Option>
          <Select.Option value="Startup">Startup</Select.Option>
          <Select.Option value="Defence">Defence / Armed Forces</Select.Option>
          <Select.Option value="Other">Other</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="profession" label={<Text style={labelStyle}>Job Title / Profession <span style={{ color: '#6B7280', fontWeight: 400 }}>(Optional)</span></Text>}>
        <Input style={inputStyle} placeholder="e.g. Software Engineer, CA, Teacher" />
      </Form.Item>
    </Space>
  );

  const Step2 = () => (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <Title level={4} style={{ color: '#08457E', marginBottom: 24 }}>Where are you based?</Title>

      <Form.Item name="state" label={<Text style={labelStyle}>State</Text>}
        rules={[{ required: true, message: 'Please select your state' }]}>
        <Select size="large" showSearch placeholder="Select your state" style={{ borderRadius: 12 }}>
          {STATES.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
        </Select>
      </Form.Item>

      <Form.Item name="city" label={<Text style={labelStyle}>City</Text>}
        rules={[{ required: true, message: 'Please enter your city' }]}>
        <Input style={inputStyle} placeholder="e.g. Hyderabad, Mumbai, Bangalore" prefix={<EnvironmentOutlined style={{ color: '#6B7280' }} />} />
      </Form.Item>

      <div style={{ background: '#EEF3FA', borderRadius: 12, padding: '14px 16px', marginTop: 8 }}>
        <Text style={{ color: '#08457E', fontSize: 13 }}>
          💡 Your city helps us calculate HRA exemption correctly (Metro cities get 50% of Basic, others get 40%).
        </Text>
      </div>
    </Space>
  );

  return (
    <ConfigProvider theme={{
      token: { colorPrimary: '#5B92E5', borderRadius: 12, fontFamily: "'Outfit', sans-serif" },
      components: {
        Button: { controlHeightLG: 52, fontWeight: 600, borderRadius: 12 },
        Input: { colorBgContainer: '#EEF3FA', colorBorder: '#B8C8E6', borderRadius: 12, controlHeight: 48 },
        Card: { paddingLG: 40, borderRadiusLG: 24 }
      }
    }}>
      <Layout style={{ minHeight: '100vh', background: '#DCE6F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: 560, width: '100%' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2} style={{ color: '#08457E', fontWeight: 800, margin: 0 }}>
              Welcome to DrainZero 👋
            </Title>
            <Paragraph style={{ color: '#6B7280', fontSize: 16, marginTop: 8 }}>
              Tell us a bit about yourself so we can personalize your tax analysis.
            </Paragraph>
          </div>

          {/* Progress */}
          <div style={{ marginBottom: 24 }}>
            <Steps current={current} items={STEPS} size="small" />
          </div>
          <Progress
            percent={Math.round(((current + 1) / STEPS.length) * 100)}
            showInfo={false}
            strokeColor="#5B92E5"
            style={{ marginBottom: 24 }}
          />

          <Card style={{ border: 'none', boxShadow: '0 8px 30px rgba(8,76,141,0.08)' }}>
            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 24, borderRadius: 12 }} />}

            <Form
              form={form}
              layout="vertical"
              initialValues={{ name: user?.user_metadata?.full_name || '' }}
              requiredMark={false}
            >
              {current === 0 && <Step0 />}
              {current === 1 && <Step1 />}
              {current === 2 && <Step2 />}
            </Form>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => current > 0 ? setCurrent(current - 1) : navigate('/')}
                style={{ height: 48, borderRadius: 12, color: '#08457E', borderColor: '#B8C8E6' }}
              >
                {current === 0 ? 'Back' : 'Previous'}
              </Button>

              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                loading={loading}
                onClick={handleNext}
                style={{ height: 48, borderRadius: 12, background: '#5B92E5', border: 'none', paddingLeft: 32, paddingRight: 32 }}
              >
                {current === STEPS.length - 1 ? 'Start Analysis →' : 'Next'}
              </Button>
            </div>
          </Card>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text style={{ color: '#6B7280', fontSize: 12 }}>
              🔒 Your data is private and encrypted. We never share it with third parties.
            </Text>
          </div>

        </div>
      </Layout>
    </ConfigProvider>
  );
};

export default OnboardingPage;
