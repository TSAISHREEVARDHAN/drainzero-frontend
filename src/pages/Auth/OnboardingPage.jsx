import React, { useState } from 'react';
import {
  ConfigProvider, Card, Typography, Form, Input, Select,
  Radio, Button, Space, Steps, Alert, Progress, InputNumber, Divider, Tag
} from 'antd';
import {
  UserOutlined, ArrowRightOutlined, ArrowLeftOutlined,
  BankOutlined, EnvironmentOutlined, DollarOutlined, SafetyOutlined,
  InfoCircleOutlined
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
  { title: 'Personal',   icon: <UserOutlined /> },
  { title: 'Employment', icon: <BankOutlined /> },
  { title: 'Location',   icon: <EnvironmentOutlined /> },
  { title: 'Income',     icon: <DollarOutlined /> },
  { title: 'Deductions', icon: <SafetyOutlined /> },
];

// Employment types that have fixed salary structure
const SALARIED_TYPES = ['Salaried'];
const GOVT_TYPES     = ['Government'];
// Employment types with variable income
const VARIABLE_TYPES = ['Self-Employed', 'Freelancer', 'Business Owner'];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form] = Form.useForm();

  const inputStyle = { borderRadius: 12, height: 48, width: '100%' };
  const labelStyle = { color: '#08457E', fontWeight: 600 };

  // Watch employment type to adjust income/deduction fields
  const empType = Form.useWatch('employment_type', form) || '';
  const isSalaried = SALARIED_TYPES.includes(empType) || GOVT_TYPES.includes(empType);
  const isVariable = VARIABLE_TYPES.includes(empType);

  const validateStep = async () => {
    try {
      if (current === 0) await form.validateFields(['name', 'age', 'gender', 'marital_status']);
      else if (current === 1) await form.validateFields(['employment_type', 'sector']);
      else if (current === 2) await form.validateFields(['state', 'city']);
      else if (current === 3) await form.validateFields(['annualSalary']);
      return true;
    } catch {
      return false;
    }
  };

  const handleNext = async () => {
    const valid = await validateStep();
    if (!valid) return;
    if (current < STEPS.length - 1) setCurrent(current + 1);
    else await handleSubmit();
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      const values  = form.getFieldsValue(true);
      const isMetro = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'].some(
        c => values.city?.toLowerCase().includes(c.toLowerCase())
      );

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

      // Merge bonus into gross_salary to avoid schema issues
      const baseSalary = values.annualSalary || 0;
      const bonus      = isSalaried ? (values.bonus || 0) : 0;
      const grossTotal = baseSalary + bonus;
      const basic      = grossTotal * 0.40;
      const hra        = grossTotal * 0.20;

      const incomePayload = {
        user_id          : user.id,
        gross_salary     : grossTotal,
        basic_da         : basic,
        hra_received     : hra,
        other_income     : values.otherIncome      || 0,
        preferred_regime : values.regimePreference  || 'Auto Suggest',
        updated_at       : new Date().toISOString(),
      };

      // Only add deductions if salaried / applicable
      if (!isVariable) {
        incomePayload.section_80c      = values.deduction80C   || 0;
        incomePayload.section_80d      = values.deduction80D   || 0;
        incomePayload.nps_personal     = values.deductionNPS   || 0;
        incomePayload.hra_deduction    = values.hraDeduction   || 0;
        incomePayload.professional_tax = values.professionalTax || 2500;
      } else {
        // Variable income — set reasonable defaults
        incomePayload.section_80c      = values.deduction80C || 0;
        incomePayload.section_80d      = values.deduction80D || 0;
        incomePayload.nps_personal     = 0;
        incomePayload.hra_deduction    = 0;
        incomePayload.professional_tax = 0;
      }

      const { error: incErr } = await supabase.from('income_profile').upsert(incomePayload, { onConflict: 'user_id' });
      if (incErr) console.warn('Income profile save:', incErr.message);

      await refreshProfile();
      navigate('/category-selection', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 0: Personal ──
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
          { validator: (_, v) => (v >= 18 && v <= 100) ? Promise.resolve() : Promise.reject('Age must be 18–100') }
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

  // ── STEP 1: Employment ──
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
        <Select size="large" placeholder="Select your sector">
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

  // ── STEP 2: Location ──
  const Step2 = () => (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <Title level={4} style={{ color: '#08457E', marginBottom: 24 }}>Where are you based?</Title>
      <Form.Item name="state" label={<Text style={labelStyle}>State</Text>}
        rules={[{ required: true, message: 'Please select your state' }]}>
        <Select size="large" showSearch placeholder="Select your state">
          {STATES.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
        </Select>
      </Form.Item>
      <Form.Item name="city" label={<Text style={labelStyle}>City</Text>}
        rules={[{ required: true, message: 'Please enter your city' }]}>
        <Input style={inputStyle} placeholder="e.g. Hyderabad, Mumbai, Bangalore" prefix={<EnvironmentOutlined style={{ color: '#6B7280' }} />} />
      </Form.Item>
      <div style={{ background: '#EEF3FA', borderRadius: 12, padding: '12px 16px', marginTop: 8 }}>
        <Text style={{ color: '#08457E', fontSize: 13 }}>
          💡 Metro cities (Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata) get 50% of Basic as HRA exemption. Others get 40%.
        </Text>
      </div>
    </Space>
  );

  // ── STEP 3: Income — smart based on employment type ──
  const Step3 = () => {
    const currentEmpType = form.getFieldValue('employment_type') || '';
    const isSal = SALARIED_TYPES.includes(currentEmpType);
    const isVar = VARIABLE_TYPES.includes(currentEmpType);

    return (
      <Space direction="vertical" size={0} style={{ width: '100%' }}>
        <Title level={4} style={{ color: '#08457E', marginBottom: 4 }}>
          {isVar ? 'Your Business / Freelance Income' : 'Your Annual Income'}
        </Title>
        <Paragraph style={{ color: '#6B7280', marginBottom: 20, fontSize: 13 }}>
          Saved once and used across all features. Edit anytime from your profile.
        </Paragraph>

        {isVar && (
          <Alert
            message="Variable Income Detected"
            description="As a freelancer / self-employed, enter your estimated annual income. Deductions like 80C still apply — enter them in the next step."
            type="info" showIcon
            style={{ marginBottom: 20, borderRadius: 12 }}
          />
        )}

        <Form.Item
          name="annualSalary"
          label={<Text style={labelStyle}>{isVar ? 'Estimated Annual Income (₹) *' : 'Annual Gross Income (₹) *'}</Text>}
          rules={[{ required: true, message: 'Please enter your income' }]}>
          <InputNumber style={inputStyle} prefix="₹" min={0} placeholder="e.g. 1200000" />
        </Form.Item>

        {/* Bonus only for salaried */}
        {isSal && (
          <Form.Item name="bonus" label={<Text style={labelStyle}>Annual Bonus (₹) <Tag color="blue" style={{ fontSize: 10, borderRadius: 8 }}>Salaried</Tag></Text>}
            extra="Will be included in your gross total income">
            <InputNumber style={inputStyle} prefix="₹" min={0} placeholder="e.g. 100000" />
          </Form.Item>
        )}

        {/* Other income for everyone */}
        <Form.Item name="otherIncome"
          label={<Text style={labelStyle}>Other Income (₹) <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 12 }}>Optional</span></Text>}
          extra={isVar ? 'Additional income from investments, rent, or other sources' : 'Rent, interest, side income etc.'}>
          <InputNumber style={inputStyle} prefix="₹" min={0} placeholder="e.g. 50000" />
        </Form.Item>

        <Form.Item name="regimePreference" label={<Text style={labelStyle}>Tax Regime Preference</Text>} initialValue="Auto Suggest">
          <Radio.Group buttonStyle="solid">
            <Radio.Button value="Auto Suggest">Auto Suggest</Radio.Button>
            <Radio.Button value="Old Regime">Old Regime</Radio.Button>
            <Radio.Button value="New Regime">New Regime</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <div style={{ background: '#EEF3FA', borderRadius: 12, padding: '12px 16px', marginTop: 4 }}>
          <Text style={{ color: '#08457E', fontSize: 13 }}>
            {isSal
              ? '💡 Standard deduction of ₹75,000 is automatically applied for salaried individuals in both regimes.'
              : isVar
              ? '💡 As self-employed/freelancer, you can claim business expenses as deductions under Sec 44ADA or 44AD.'
              : '💡 DrainZero will suggest the best regime based on your income and deductions.'}
          </Text>
        </div>
      </Space>
    );
  };

  // ── STEP 4: Deductions — smart based on employment type ──
  const Step4 = () => {
    const currentEmpType = form.getFieldValue('employment_type') || '';
    const isSal = SALARIED_TYPES.includes(currentEmpType);
    const isVar = VARIABLE_TYPES.includes(currentEmpType);

    return (
      <Space direction="vertical" size={0} style={{ width: '100%' }}>
        <Title level={4} style={{ color: '#08457E', marginBottom: 4 }}>Deductions & Tax Savings</Title>
        <Paragraph style={{ color: '#6B7280', marginBottom: 20, fontSize: 13 }}>
          {isVar
            ? 'These deductions apply to all taxpayers regardless of employment type. All fields are optional — leave blank if unsure.'
            : 'These apply to the Old Regime. Leave blank if unsure — you can update anytime from your profile.'}
        </Paragraph>

        {/* 80C — everyone can claim */}
        <Form.Item name="deduction80C"
          label={<Text style={labelStyle}>80C Investments (₹) <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 12 }}>Optional</span></Text>}
          extra="PPF, ELSS, LIC, EPF, ULIP etc. — Max ₹1,50,000 (applies to all)">
          <InputNumber style={inputStyle} prefix="₹" min={0} max={150000} placeholder="e.g. 150000" />
        </Form.Item>

        {/* 80D — everyone can claim */}
        <Form.Item name="deduction80D"
          label={<Text style={labelStyle}>80D Health Insurance Premium (₹) <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 12 }}>Optional</span></Text>}
          extra="Self + family — Max ₹25,000 (₹50,000 if you or parents are senior citizens)">
          <InputNumber style={inputStyle} prefix="₹" min={0} placeholder="e.g. 20000" />
        </Form.Item>

        {/* NPS — everyone can claim */}
        <Form.Item name="deductionNPS"
          label={<Text style={labelStyle}>NPS Contribution 80CCD(1B) (₹) <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 12 }}>Optional</span></Text>}
          extra="Extra deduction beyond 80C — Max ₹50,000 (applies to all including self-employed)">
          <InputNumber style={inputStyle} prefix="₹" min={0} max={50000} placeholder="e.g. 50000" />
        </Form.Item>

        {/* HRA — only for salaried */}
        {isSal && (
          <Form.Item name="hraDeduction"
            label={<Text style={labelStyle}>HRA Exemption Claimed (₹) <Tag color="blue" style={{ fontSize: 10, borderRadius: 8 }}>Salaried Only</Tag></Text>}
            extra="Only if you pay rent and receive HRA from employer">
            <InputNumber style={inputStyle} prefix="₹" min={0} placeholder="e.g. 120000" />
          </Form.Item>
        )}

        {/* Variable income notice */}
        {isVar && (
          <Alert
            icon={<InfoCircleOutlined />}
            message="Business Expense Deductions"
            description="As a freelancer/self-employed, you can also claim business expenses (internet, equipment, travel, office rent) under Sec 44ADA or 44AD. These are handled separately in the analysis form."
            type="success" showIcon
            style={{ marginTop: 8, borderRadius: 12 }}
          />
        )}

        <Divider />
        <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '12px 16px' }}>
          <Text style={{ color: '#059669', fontSize: 13 }}>
            ✅ All values are saved to your profile and auto-loaded in every feature — Tax Leakage, Health Score, Regime Comparison, and more.
          </Text>
        </div>
      </Space>
    );
  };

  return (
    <ConfigProvider theme={{
      token: { colorPrimary: '#5B92E5', borderRadius: 12, fontFamily: "'Outfit', sans-serif" },
      components: {
        Button: { controlHeightLG: 52, fontWeight: 600, borderRadius: 12 },
        Input: { colorBgContainer: '#EEF3FA', colorBorder: '#B8C8E6', borderRadius: 12, controlHeight: 48 },
        Card: { paddingLG: 40, borderRadiusLG: 24 }
      }
    }}>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #DCE6F5 0%, #EEF3FA 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: 560, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2} style={{ color: '#08457E', fontWeight: 800, margin: 0 }}>Welcome to DrainZero </Title>
            <Paragraph style={{ color: '#6B7280', fontSize: 16, marginTop: 8 }}>
              Let's set up your profile for a personalized tax analysis.
            </Paragraph>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Steps current={current} items={STEPS} size="small" />
          </div>
          <Progress
            percent={Math.round(((current + 1) / STEPS.length) * 100)}
            showInfo={false} strokeColor="#5B92E5" style={{ marginBottom: 24 }}
          />

          <Card style={{ border: 'none', boxShadow: '0 8px 30px rgba(8,76,141,0.08)' }}>
            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 24, borderRadius: 12 }} />}

            <Form
              form={form}
              layout="vertical"
              initialValues={{ name: user?.user_metadata?.full_name || '', professionalTax: 2500, regimePreference: 'Auto Suggest' }}
              requiredMark={false}
            >
              {current === 0 && <Step0 />}
              {current === 1 && <Step1 />}
              {current === 2 && <Step2 />}
              {current === 3 && <Step3 />}
              {current === 4 && <Step4 />}
            </Form>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
              <Button icon={<ArrowLeftOutlined />}
                onClick={() => current > 0 ? setCurrent(current - 1) : navigate('/')}
                style={{ height: 48, borderRadius: 12, color: '#08457E', borderColor: '#B8C8E6', transition: 'all 0.2s ease' }}>
                {current === 0 ? 'Back' : 'Previous'}
              </Button>
              <Button type="primary" icon={<ArrowRightOutlined />}
                loading={loading}
                onClick={handleNext}
                style={{ height: 48, borderRadius: 12, background: '#5B92E5', border: 'none', paddingLeft: 32, paddingRight: 32, transition: 'all 0.2s ease' }}>
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
      </div>
    </ConfigProvider>
  );
};

export default OnboardingPage;
