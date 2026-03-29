import React, { useState, useEffect } from 'react';
import {
  ConfigProvider, Card, Typography, Form, Input, Select,
  Radio, Button, Alert, message, Row, Col, Avatar, Tag,
  InputNumber, Divider, Tabs
} from 'antd';
import {
  UserOutlined, SaveOutlined, ArrowLeftOutlined,
  EnvironmentOutlined, DollarOutlined, SafetyOutlined
} from '@ant-design/icons';
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
  const [personalForm] = Form.useForm();
  const [incomeForm]   = Form.useForm();
  const [saving,  setSaving]  = useState(false);
  const [savingIncome, setSavingIncome] = useState(false);
  const [error,   setError]   = useState('');
  const [incomeError, setIncomeError] = useState('');
  const [loaded,  setLoaded]  = useState(false);

  const inputStyle  = { borderRadius: 12, height: 48 };
  const labelStyle  = { color: '#08457E', fontWeight: 600 };
  const cardStyle   = { borderRadius: 20, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: 24 };

  useEffect(() => {
    const loadProfile = async () => {
      let profile = userProfile;
      if (!profile && user) {
        const { data } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
        profile = data;
      }
      if (profile) {
        personalForm.setFieldsValue({
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

      // Load income profile
      if (user) {
        const { data: inc } = await supabase.from('income_profile').select('*').eq('user_id', user.id).maybeSingle();
        if (inc) {
          incomeForm.setFieldsValue({
            annualSalary    : inc.gross_salary      || 0,
            bonus           : inc.bonus             || 0,
            otherIncome     : inc.other_income      || 0,
            deduction80C    : inc.section_80c       || 0,
            deduction80D    : inc.section_80d       || 0,
            deductionNPS    : inc.nps_personal      || 0,
            hraDeduction    : inc.hra_deduction     || inc.hra_received || 0,
            professionalTax : inc.professional_tax  || 2500,
            regimePreference: inc.preferred_regime  || 'Auto Suggest',
          });
        }
      }
      setLoaded(true);
    };
    loadProfile();
  }, [user, userProfile]);

  // ── Save personal details ──
  const handleSavePersonal = async () => {
    try {
      setSaving(true);
      setError('');
      const values = personalForm.getFieldsValue();
      const isMetro = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'].some(
        c => values.city?.toLowerCase().includes(c.toLowerCase())
      );
      const { error: err } = await supabase.from('users').upsert({
        id              : user.id,
        email           : user.email,
        name            : values.name,
        full_name       : values.name,
        age             : parseInt(values.age) || 0,
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
      if (err) throw new Error(err.message);
      await refreshProfile();
      message.success('Personal details saved!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Save income & deductions ──
  const handleSaveIncome = async () => {
    try {
      setSavingIncome(true);
      setIncomeError('');
      const values  = incomeForm.getFieldsValue();
      // Merge bonus into gross_salary to avoid schema issues
      const base    = values.annualSalary || 0;
      const bonus   = values.bonus || 0;
      const salary  = base + bonus;
      const { error: err } = await supabase.from('income_profile').upsert({
        user_id          : user.id,
        gross_salary     : salary,
        basic_da         : salary * 0.40,
        hra_received     : salary * 0.20,
        other_income     : values.otherIncome      || 0,
        section_80c      : values.deduction80C     || 0,
        section_80d      : values.deduction80D     || 0,
        nps_personal     : values.deductionNPS     || 0,
        hra_deduction    : values.hraDeduction     || 0,
        professional_tax : values.professionalTax  || 0,
        preferred_regime : values.regimePreference === 'Auto Suggest' ? 'new' : (values.regimePreference || 'new'),
        updated_at       : new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (err) throw new Error(err.message);
      message.success('Saved! All features will now use these updated values.');
    } catch (err) {
      setIncomeError(err.message);
    } finally {
      setSavingIncome(false);
    }
  };

  const tabItems = [
    {
      key: 'personal',
      label: <span><UserOutlined /> Personal Details</span>,
      children: (
        <Card style={cardStyle}>
          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 24, borderRadius: 12 }} />}
          <Form form={personalForm} layout="vertical" requiredMark={false}>
            <Row gutter={[24, 0]}>
              <Col xs={24} md={12}>
                <Form.Item name="name" label={<Text style={labelStyle}>Full Name</Text>} rules={[{ required: true }]}>
                  <Input style={inputStyle} prefix={<UserOutlined style={{ color: '#6B7280' }} />} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="age" label={<Text style={labelStyle}>Age</Text>} rules={[{ required: true }]}>
                  <Input style={inputStyle} type="number" min={18} max={100} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="gender" label={<Text style={labelStyle}>Gender</Text>} rules={[{ required: true }]}>
                  <Radio.Group buttonStyle="solid">
                    <Radio.Button value="Male">Male</Radio.Button>
                    <Radio.Button value="Female">Female</Radio.Button>
                    <Radio.Button value="Other">Other</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="marital_status" label={<Text style={labelStyle}>Marital Status</Text>} rules={[{ required: true }]}>
                  <Radio.Group buttonStyle="solid">
                    <Radio.Button value="Single">Single</Radio.Button>
                    <Radio.Button value="Married">Married</Radio.Button>
                    <Radio.Button value="Divorced">Divorced</Radio.Button>
                    <Radio.Button value="Widowed">Widowed</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="employment_type" label={<Text style={labelStyle}>Employment Type</Text>} rules={[{ required: true }]}>
                  <Select size="large">
                    <Select.Option value="Salaried">Salaried</Select.Option>
                    <Select.Option value="Self-Employed">Self-Employed</Select.Option>
                    <Select.Option value="Freelancer">Freelancer</Select.Option>
                    <Select.Option value="Business Owner">Business Owner</Select.Option>
                    <Select.Option value="Student">Student</Select.Option>
                    <Select.Option value="Retired">Retired</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="sector" label={<Text style={labelStyle}>Sector</Text>} rules={[{ required: true }]}>
                  <Select size="large" placeholder="Select sector">
                    <Select.Option value="IT/Software">IT / Software</Select.Option>
                    <Select.Option value="Banking/Finance">Banking / Finance</Select.Option>
                    <Select.Option value="Government">Government / PSU</Select.Option>
                    <Select.Option value="Healthcare">Healthcare</Select.Option>
                    <Select.Option value="Education">Education</Select.Option>
                    <Select.Option value="Other">Other</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="profession" label={<Text style={labelStyle}>Job Title (Optional)</Text>}>
                  <Input style={inputStyle} placeholder="e.g. Software Engineer" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="state" label={<Text style={labelStyle}>State</Text>} rules={[{ required: true }]}>
                  <Select size="large" showSearch placeholder="Select state">
                    {STATES.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="city" label={<Text style={labelStyle}>City</Text>} rules={[{ required: true }]}>
                  <Input style={inputStyle} prefix={<EnvironmentOutlined style={{ color: '#6B7280' }} />} />
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSavePersonal}
              style={{ height: 48, borderRadius: 12, background: '#08457E', border: 'none', fontWeight: 600, marginTop: 8 }}>
              Save Personal Details
            </Button>
          </Form>
        </Card>
      )
    },
    {
      key: 'income',
      label: <span><DollarOutlined /> Income & Deductions</span>,
      children: (
        <Card style={cardStyle}>
          <Alert
            message="These values are used across all features — Regime Comparison, Tax Leakage, Health Score, Recommendations. Update them here anytime."
            type="info" showIcon style={{ marginBottom: 24, borderRadius: 12 }}
          />
          {incomeError && <Alert message={incomeError} type="error" showIcon style={{ marginBottom: 24, borderRadius: 12 }} />}
          <Form form={incomeForm} layout="vertical" requiredMark={false}>

            <Title level={5} style={{ color: '#08457E', marginBottom: 16 }}>Annual Income</Title>
            <Row gutter={[24, 0]}>
              <Col xs={24} md={12}>
                <Form.Item name="annualSalary" label={<Text style={labelStyle}>Gross Annual Income (₹) *</Text>} rules={[{ required: true }]}>
                  <InputNumber style={{ ...inputStyle, width: '100%' }} prefix="₹" min={0} placeholder="e.g. 1200000" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="bonus" label={<Text style={labelStyle}>Bonus (₹)</Text>}>
                  <InputNumber style={{ ...inputStyle, width: '100%' }} prefix="₹" min={0} placeholder="e.g. 100000" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="otherIncome" label={<Text style={labelStyle}>Other Income (₹)</Text>}>
                  <InputNumber style={{ ...inputStyle, width: '100%' }} prefix="₹" min={0} placeholder="Rent, interest, freelance" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="regimePreference" label={<Text style={labelStyle}>Tax Regime Preference</Text>}>
                  <Radio.Group buttonStyle="solid">
                    <Radio.Button value="Auto Suggest">Auto Suggest</Radio.Button>
                    <Radio.Button value="Old Regime">Old Regime</Radio.Button>
                    <Radio.Button value="New Regime">New Regime</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            <Divider />
            <Title level={5} style={{ color: '#08457E', marginBottom: 4 }}>Deductions (Old Regime)</Title>
            <Text style={{ color: '#6B7280', fontSize: 13, display: 'block', marginBottom: 16 }}>
              Leave blank if you don't claim them. These are used to detect tax leakage.
            </Text>
            <Row gutter={[24, 0]}>
              <Col xs={24} md={12}>
                <Form.Item name="deduction80C" label={<Text style={labelStyle}>80C Investments (₹)</Text>} extra="PPF, ELSS, LIC etc. — Max ₹1,50,000">
                  <InputNumber style={{ ...inputStyle, width: '100%' }} prefix="₹" min={0} max={150000} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="deduction80D" label={<Text style={labelStyle}>80D Health Premium (₹)</Text>} extra="Self + family — Max ₹25,000">
                  <InputNumber style={{ ...inputStyle, width: '100%' }} prefix="₹" min={0} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="deductionNPS" label={<Text style={labelStyle}>NPS 80CCD(1B) (₹)</Text>} extra="Extra beyond 80C — Max ₹50,000">
                  <InputNumber style={{ ...inputStyle, width: '100%' }} prefix="₹" min={0} max={50000} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="hraDeduction" label={<Text style={labelStyle}>HRA Exemption (₹)</Text>} extra="Only if you pay rent and receive HRA">
                  <InputNumber style={{ ...inputStyle, width: '100%' }} prefix="₹" min={0} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="professionalTax" label={<Text style={labelStyle}>Professional Tax (₹)</Text>} extra="Usually ₹2,500 for salaried">
                  <InputNumber style={{ ...inputStyle, width: '100%' }} prefix="₹" min={0} />
                </Form.Item>
              </Col>
            </Row>

            <Button type="primary" icon={<SaveOutlined />} loading={savingIncome} onClick={handleSaveIncome}
              style={{ height: 48, borderRadius: 12, background: '#5B92E5', border: 'none', fontWeight: 600, marginTop: 8 }}>
              Save Income & Deductions
            </Button>
          </Form>
        </Card>
      )
    }
  ];

  return (
    <ConfigProvider theme={{
      token: { colorPrimary: '#5B92E5', borderRadius: 12, fontFamily: "'Outfit', sans-serif" },
      components: {
        Input: { colorBgContainer: '#EEF3FA', colorBorder: '#B8C8E6' },
        Card: { paddingLG: 32, borderRadiusLG: 20 }
      }
    }}>
      <div style={{ minHeight: '100vh', background: '#F2F3F4' }}>
        <Navbar />
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>

          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')}
            style={{ marginBottom: 24, borderRadius: 12, color: '#5B92E5', borderColor: '#B8C8E6' }}>
            Back to Dashboard
          </Button>

          {/* Avatar header */}
          <Card style={{ ...cardStyle, background: '#08457E' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <Avatar size={64} style={{ background: '#5B92E5', fontSize: 28 }}>
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <div>
                <Title level={4} style={{ color: '#FFFFFF', margin: 0 }}>
                  {userProfile?.name || user?.email}
                </Title>
                <Text style={{ color: '#CCF1FF', fontSize: 13 }}>{user?.email}</Text>
                <div style={{ marginTop: 8 }}>
                  {userProfile?.employment_type && <Tag color="blue">{userProfile.employment_type}</Tag>}
                  {userProfile?.sector && <Tag color="cyan">{userProfile.sector}</Tag>}
                  {userProfile?.city && <Tag color="geekblue">{userProfile.city}</Tag>}
                </div>
              </div>
            </div>
          </Card>

          <Tabs items={tabItems} defaultActiveKey="personal" size="large"
            style={{ background: 'transparent' }}
          />

        </div>
      </div>
    </ConfigProvider>
  );
};

export default ProfilePage;
