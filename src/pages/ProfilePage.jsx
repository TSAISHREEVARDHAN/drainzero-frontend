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
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import Navbar from '../components/Navbar';
import TaxFieldLabel from '../components/TaxFieldLabel';
import { mapFormToProfile, saveIncomeProfile } from '../services/profileService';

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
  const location = useLocation();
  const { user, userProfile, refreshProfile, markIncomeDataSaved } = useAuth();
  // If user arrived from AnalysisForm, these let us navigate back with context restored
  const returnTo       = location.state?.from         || null;
  const returnState    = location.state?.locationState || null;
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

      const profileData = {
        name               : values.name,
        full_name          : values.name,
        age                : parseInt(values.age) || 0,
        gender             : values.gender,
        marital_status     : values.marital_status,
        employment_type    : values.employment_type,
        sector             : values.sector,
        profession         : values.profession || '',
        state              : values.state,
        city               : values.city,
        is_metro           : isMetro,
        onboarding_done    : true,
        onboarding_complete: true,
        updated_at         : new Date().toISOString(),
      };

      // Use upsert on id (not email) — handles both new and existing rows.
      // Plain .update() silently does nothing if the row doesn't exist (0 rows, no error),
      // which means returning users could find their profile data missing.
      const { error: upsertErr } = await supabase
        .from('users')
        .upsert(
          { id: user.id, email: user.email, ...profileData },
          { onConflict: 'id' }
        );

      if (upsertErr) {
        if (upsertErr.code === '23505') {
          // email unique constraint exists — fall back to plain update
          const { error: updateErr } = await supabase
            .from('users').update(profileData).eq('id', user.id);
          if (updateErr) throw new Error(updateErr.message);
        } else {
          throw new Error(upsertErr.message);
        }
      }

      message.success('✅ Personal details saved!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Save income & deductions ──
  const handleSaveIncome = async () => {
    // FIX: setLoading before await, clear in finally (no infinite spinner)
    setSavingIncome(true);
    setIncomeError('');
    try {
      const values = incomeForm.getFieldsValue();
      const base = parseFloat(values.annualSalary) || 0;
      if (base <= 0) throw new Error('Annual income must be greater than ₹0');

      // FIX: enforce statutory deduction limits before saving
      const capped = {
        ...values,
        deduction80C : Math.min(parseFloat(values.deduction80C)  || 0, 150000),
        deduction80D : Math.min(parseFloat(values.deduction80D)  || 0, 25000),
        deductionNPS : Math.min(parseFloat(values.deductionNPS)  || 0, 50000),
      };

      const profilePayload = mapFormToProfile(capped);
      await saveIncomeProfile(user.id, profilePayload);

      // Update context so hasIncomeData is immediately true everywhere
      markIncomeDataSaved();

      message.success('✅ Details saved successfully — all features use your updated values.');

      // If user arrived from AnalysisForm (or any other page), go back with context restored
      if (returnTo) {
        setTimeout(() => navigate(returnTo, { state: returnState, replace: true }), 600);
      }
    } catch (err) {
      // FIX: show failure explicitly — never fake success
      message.error(`❌ Failed to save: ${err.message}`);
      setIncomeError(err.message);
    } finally {
      // FIX: always clear loading state
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
                  <Select size="large" getPopupContainer={t => t.parentNode} style={{ width: "100%" }}>
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
                  <Select size="large" placeholder="Select sector" getPopupContainer={t => t.parentNode} style={{ width: "100%" }}>
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
                  <Select size="large" showSearch placeholder="Select state" getPopupContainer={t => t.parentNode} style={{ width: "100%" }}>
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
                <Form.Item name="deduction80C" label={<TaxFieldLabel text="80C Investments (₹)" topic="80C" style={labelStyle} />} extra="PPF, ELSS, LIC etc. — Max ₹1,50,000">
                  <InputNumber style={{ ...inputStyle, width: '100%' }} prefix="₹" min={0} max={150000} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="deduction80D" label={<TaxFieldLabel text="80D Health Premium (₹)" topic="80D" style={labelStyle} />} extra="Self + family — Max ₹25,000">
                  <InputNumber style={{ ...inputStyle, width: '100%' }} prefix="₹" min={0} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="deductionNPS" label={<TaxFieldLabel text="NPS 80CCD(1B) (₹)" topic="80CCD_1B" style={labelStyle} />} extra="Extra beyond 80C — Max ₹50,000">
                  <InputNumber style={{ ...inputStyle, width: '100%' }} prefix="₹" min={0} max={50000} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="hraDeduction" label={<TaxFieldLabel text="HRA Exemption (₹)" topic="HRA" style={labelStyle} />} extra="Only if you pay rent and receive HRA">
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
        Input:       { colorBgContainer: '#FFFFFF', colorBorder: '#E5E7EB', colorText: '#1A1A2E' },
        InputNumber: { colorBgContainer: '#FFFFFF', colorBorder: '#E5E7EB', colorText: '#1A1A2E' },
        Select:      { colorBgContainer: '#FFFFFF', colorBorder: '#E5E7EB', colorText: '#1A1A2E', colorTextPlaceholder: '#9CA3AF' },
        Card:        { paddingLG: 32, borderRadiusLG: 20 }
      }
    }}>
      <div style={{ minHeight: '100vh', background: '#F2F3F4' }}>
        <Navbar />
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>

          <Button icon={<ArrowLeftOutlined />} onClick={() => returnTo ? navigate(returnTo, { state: returnState }) : navigate('/dashboard')}
            style={{ marginBottom: 24, borderRadius: 12, color: '#5B92E5', borderColor: '#B8C8E6' }}>
            {returnTo ? 'Back' : 'Back to Dashboard'}
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

      <style>{`
        /* ── PROFILE PAGE: Fix AntD v5 Select not showing selected value ── */

        /* Make selector box correct height and white bg */
        .ant-select .ant-select-selector {
          height: 48px !important;
          background: #ffffff !important;
          border: 1px solid #d9d9d9 !important;
          border-radius: 12px !important;
          display: flex !important;
          align-items: center !important;
          padding: 0 11px !important;
        }

        /* This is the span that shows the chosen value — force it visible */
        .ant-select .ant-select-selection-item {
          line-height: 46px !important;
          color: #1a1a2e !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          opacity: 1 !important;
          visibility: visible !important;
          display: block !important;
        }

        /* Placeholder text */
        .ant-select .ant-select-selection-placeholder {
          line-height: 46px !important;
          color: #9ca3af !important;
        }

        /* Search input inside select (don't hide it, just style) */
        .ant-select-selection-search input {
          height: 46px !important;
          color: #1a1a2e !important;
          background: transparent !important;
          border: none !important;
          opacity: 1 !important;
        }

        /* Dropdown popup */
        .ant-select-dropdown .ant-select-item-option-content {
          color: #1a1a2e !important;
        }
        .ant-select-dropdown .ant-select-item-option-selected {
          background: #eef3fa !important;
          font-weight: 600 !important;
        }

        /* Regular text inputs */
        .ant-input {
          background: #ffffff !important;
          color: #1a1a2e !important;
        }
        .ant-input-number .ant-input-number-input {
          background: #ffffff !important;
          color: #1a1a2e !important;
        }
      `}</style>
    </ConfigProvider>
  );
};

export default ProfilePage;
