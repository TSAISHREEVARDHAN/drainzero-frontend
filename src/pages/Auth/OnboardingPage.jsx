import React, { useState } from 'react';
import {
  ConfigProvider, Card, Typography, Form, Input, Select,
  Radio, Button, Space, Steps, Alert, Progress, InputNumber,
  Divider, Tag
} from 'antd';
import {
  UserOutlined, ArrowRightOutlined, ArrowLeftOutlined,
  BankOutlined, EnvironmentOutlined, DollarOutlined, SafetyOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { mapFormToProfile } from '../../services/profileService';
// FIX 1: TaxFieldLabel was used in Step4 but never imported — caused crash on step 3→4
import TaxFieldLabel from '../../components/TaxFieldLabel';

const { Title, Text, Paragraph } = Typography;

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh',
];

const STEPS = [
  { title: 'Personal',   icon: <UserOutlined /> },
  { title: 'Employment', icon: <BankOutlined /> },
  { title: 'Location',   icon: <EnvironmentOutlined /> },
  { title: 'Income',     icon: <DollarOutlined /> },
  { title: 'Deductions', icon: <SafetyOutlined /> },
];

const SALARIED_TYPES = ['Salaried', 'Government'];
const VARIABLE_TYPES = ['Self-Employed', 'Freelancer', 'Business Owner'];

const fmt   = v => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
const parse = v => v ? v.replace(/,/g, '') : '0';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, refreshProfile, markOnboardingDone, markIncomeDataSaved } = useAuth();
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form]                = Form.useForm();

  const inputStyle = { borderRadius: 12, height: 48, width: '100%' };
  const labelStyle = { color: '#08457E', fontWeight: 600 };

  // Read watched values at top level — safe, no nested hook issues
  const empType    = Form.useWatch('employment_type', form) || '';
  const isSalaried = SALARIED_TYPES.includes(empType);
  const isVariable = VARIABLE_TYPES.includes(empType);

  const validateStep = async () => {
    try {
      if (current === 0) await form.validateFields(['name', 'age', 'gender', 'marital_status']);
      else if (current === 1) await form.validateFields(['employment_type', 'sector']);
      else if (current === 2) await form.validateFields(['state', 'city']);
      else if (current === 3) await form.validateFields(['annualSalary']);
      // Step 4 (deductions) — all optional, no validation needed
      return true;
    } catch {
      return false;
    }
  };

  const handleNext = async () => {
    const valid = await validateStep();
    if (!valid) return;
    if (current < STEPS.length - 1) {
      setCurrent(c => c + 1);
    } else {
      await handleSubmit();
    }
  };

  // Timeout wrapper — prevents Supabase calls from hanging forever
  const withTimeout = (promise, ms = 12000) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Check your internet connection and try again.')), ms)
      ),
    ]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      if (!user) throw new Error('Not logged in. Please login again.');

      const values  = form.getFieldsValue(true);
      const isMetro = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad']
        .some(c => values.city?.toLowerCase().includes(c.toLowerCase()));

      // ── 1. Save user profile ─────────────────────────────────────────────
      //
      //    CRITICAL: use upsert (not update) with onConflict:'id'.
      //
      //    Why NOT plain .update():
      //    Supabase .update() silently does nothing and returns NO error if
      //    the row doesn't exist yet (0 rows affected ≠ error). So
      //    onboarding_done would never be saved as true in the DB, and the
      //    returning user after 1 month would be sent back to /onboarding.
      //
      //    Why NOT upsert with email in payload:
      //    If users_email_key unique constraint exists it would fail.
      //    We exclude email from the upsert payload to avoid this.
      //    If the row is new (INSERT path), we add email separately via
      //    the id-based insert below.
      //
      //    The safe pattern: upsert on id only (no email in payload),
      //    then on conflict-23505 (email key), fall back to plain update.
      const profilePayload = {
        name                : values.name,
        full_name           : values.name,
        age                 : parseInt(values.age) || 0,
        gender              : values.gender,
        marital_status      : values.marital_status,
        employment_type     : values.employment_type,
        sector              : values.sector,
        profession          : values.profession || '',
        state               : values.state,
        city                : values.city,
        is_metro            : isMetro,
        onboarding_done     : true,
        onboarding_complete : true,
        updated_at          : new Date().toISOString(),
      };

      const baseSalary = parseFloat(values.annualSalary) || 0;
      const bonus      = isSalaried ? (parseFloat(values.bonus) || 0) : 0;

      const incomePayload = mapFormToProfile({
        annualSalary    : baseSalary,
        bonus,
        otherIncome     : parseFloat(values.otherIncome)   || 0,
        deduction80C    : parseFloat(values.deduction80C)  || 0,
        deduction80D    : parseFloat(values.deduction80D)  || 0,
        deductionNPS    : parseFloat(values.deductionNPS)  || 0,
        hraDeduction    : isSalaried ? (parseFloat(values.hraDeduction) || 0) : 0,
        regimePreference: values.regimePreference || 'Auto Suggest',
        is_metro        : isMetro,
      });

      // Save via backend (service role — bypasses RLS, always works)
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const saveRes = await withTimeout(
        fetch(`${BACKEND_URL}/api/profile/save`, {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({
            userId        : user.id,
            email         : user.email,
            profilePayload,
            incomePayload,
          }),
        }).then(r => r.json())
      );

      if (saveRes?.error) {
        console.warn('[Onboarding] Backend save error:', saveRes.error);
        throw new Error('Failed to save profile: ' + saveRes.error);
      }

      // ── 3. Update context AFTER DB save so refreshProfile won't overwrite ─
      markOnboardingDone();
      if (baseSalary > 0) markIncomeDataSaved();

      // ── 4. Navigate — NO refreshProfile() call here. ─────────────────────
      // refreshProfile() reads DB and can overwrite onboardingDone=true with
      // false if there's any propagation delay, causing an infinite loop.
      // Context is already correct from the marks above.
      navigate('/dashboard', { replace: true });

    } catch (err) {
      console.error('[Onboarding] Submit error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // FIX 2: Render steps INLINE (not as nested
  // components). Nested components defined inside
  // a parent re-create on every render, React
  // unmounts+remounts them → form values lost.
  // ─────────────────────────────────────────────

  const renderStep0 = () => (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <Title level={4} style={{ color: '#08457E', marginBottom: 24 }}>Tell us about yourself</Title>
      <Form.Item name="name" label={<Text style={labelStyle}>Full Name</Text>}
        rules={[{ required: true, message: 'Please enter your name' }]}>
        <Input style={inputStyle} placeholder="e.g. Rahul Sharma"
          prefix={<UserOutlined style={{ color: '#6B7280' }} />} />
      </Form.Item>
      <Form.Item name="age" label={<Text style={labelStyle}>Age</Text>}
        rules={[
          { required: true, message: 'Please enter your age' },
          { validator: (_, v) => (v >= 18 && v <= 100) ? Promise.resolve() : Promise.reject('Age must be 18–100') },
        ]}>
        <Input style={inputStyle} placeholder="e.g. 28" type="number" min={18} max={100} />
      </Form.Item>
      <Form.Item name="gender" label={<Text style={labelStyle}>Gender</Text>} rules={[{ required: true }]}>
        <Radio.Group buttonStyle="solid" size="large">
          <Radio.Button value="Male">Male</Radio.Button>
          <Radio.Button value="Female">Female</Radio.Button>
          <Radio.Button value="Other">Other</Radio.Button>
        </Radio.Group>
      </Form.Item>
      <Form.Item name="marital_status" label={<Text style={labelStyle}>Marital Status</Text>} rules={[{ required: true }]}>
        <Radio.Group buttonStyle="solid" size="large">
          <Radio.Button value="Single">Single</Radio.Button>
          <Radio.Button value="Married">Married</Radio.Button>
          <Radio.Button value="Divorced">Divorced</Radio.Button>
          <Radio.Button value="Widowed">Widowed</Radio.Button>
        </Radio.Group>
      </Form.Item>
    </Space>
  );

  const renderStep1 = () => (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <Title level={4} style={{ color: '#08457E', marginBottom: 24 }}>Your Employment Details</Title>
      <Form.Item name="employment_type" label={<Text style={labelStyle}>Employment Type</Text>} rules={[{ required: true }]}>
        <Radio.Group buttonStyle="solid" size="large" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Radio.Button value="Salaried">Salaried</Radio.Button>
          <Radio.Button value="Self-Employed">Self-Employed</Radio.Button>
          <Radio.Button value="Freelancer">Freelancer</Radio.Button>
          <Radio.Button value="Business Owner">Business Owner</Radio.Button>
          <Radio.Button value="Student">Student</Radio.Button>
          <Radio.Button value="Retired">Retired</Radio.Button>
          <Radio.Button value="Government">Government</Radio.Button>
        </Radio.Group>
      </Form.Item>
      <Form.Item name="sector" label={<Text style={labelStyle}>Sector / Industry</Text>} rules={[{ required: true }]}>
        <Select size="large" placeholder="Select your sector">
          {[
            'Government / PSU','IT / Software','Banking / Finance',
            'Healthcare / Medical','Education','Manufacturing',
            'Real Estate','Retail / Trade','Agriculture',
            'Legal / CA / Consulting','Media / Arts / Content',
            'Startup','Defence / Armed Forces','Other',
          ].map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
        </Select>
      </Form.Item>
      <Form.Item name="profession"
        label={<Text style={labelStyle}>Job Title / Profession <span style={{ color: '#6B7280', fontWeight: 400 }}>(Optional)</span></Text>}>
        <Input style={inputStyle} placeholder="e.g. Software Engineer, CA, Teacher" />
      </Form.Item>

      {/* Car Lease question — shown only for Salaried / Government */}
      {isSalaried && (
        <Form.Item
          name="has_car_lease"
          label={
            <span>
              <Text style={labelStyle}>Does your employer offer a Car Lease Allowance?</Text>
              <br />
              <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: 400 }}>
                Company leases = only ₹22K–₹29K/year taxable instead of full lease cost. Saves ₹60K–₹3L/year.
              </Text>
            </span>
          }
          initialValue={false}
        >
          <Radio.Group buttonStyle="solid" size="large">
            <Radio.Button value={true}>Yes, I have / can get one</Radio.Button>
            <Radio.Button value={false}>No</Radio.Button>
          </Radio.Group>
        </Form.Item>
      )}

      {/* Business owner vehicle question */}
      {(empType === 'Business Owner' || empType === 'Self-Employed') && (
        <Form.Item
          name="has_business_vehicle"
          label={
            <span>
              <Text style={labelStyle}>Do you use a vehicle for business?</Text>
              <br />
              <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: 400 }}>
                Enables vehicle depreciation (15–30%) and fuel/maintenance deductions under business expenses.
              </Text>
            </span>
          }
          initialValue={false}
        >
          <Radio.Group buttonStyle="solid" size="large">
            <Radio.Button value={true}>Yes</Radio.Button>
            <Radio.Button value={false}>No</Radio.Button>
          </Radio.Group>
        </Form.Item>
      )}
    </Space>
  );

  const renderStep2 = () => (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <Title level={4} style={{ color: '#08457E', marginBottom: 24 }}>Where are you based?</Title>
      <Form.Item name="state" label={<Text style={labelStyle}>State</Text>} rules={[{ required: true }]}>
        <Select size="large" showSearch placeholder="Select your state">
          {STATES.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
        </Select>
      </Form.Item>
      <Form.Item name="city" label={<Text style={labelStyle}>City</Text>} rules={[{ required: true }]}>
        <Input style={inputStyle} placeholder="e.g. Hyderabad, Mumbai, Bangalore"
          prefix={<EnvironmentOutlined style={{ color: '#6B7280' }} />} />
      </Form.Item>
      <div style={{ background: '#EEF3FA', borderRadius: 12, padding: '12px 16px', marginTop: 8 }}>
        <Text style={{ color: '#08457E', fontSize: 13 }}>
          Metro cities get 50% of Basic as HRA exemption. Non-metro cities get 40%.
        </Text>
      </div>
    </Space>
  );

  const renderStep3 = () => (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <Title level={4} style={{ color: '#08457E', marginBottom: 4 }}>
        {isVariable ? 'Your Business / Freelance Income' : 'Your Annual Income'}
      </Title>
      <Paragraph style={{ color: '#6B7280', marginBottom: 20, fontSize: 13 }}>
        Saved once — used across all features. Edit anytime from your profile.
      </Paragraph>

      <Form.Item
        name="annualSalary"
        label={<Text style={labelStyle}>{isVariable ? 'Estimated Annual Income (₹) *' : 'Annual Gross Salary (₹) *'}</Text>}
        rules={[
          { required: true, message: 'Please enter your income' },
          { validator: (_, v) => Number(v) > 0 ? Promise.resolve() : Promise.reject('Must be greater than 0') },
        ]}>
        <InputNumber
          style={inputStyle} prefix="₹" min={0}
          placeholder="e.g. 1200000" formatter={fmt} parser={parse} />
      </Form.Item>

      {isSalaried && (
        <Form.Item name="bonus"
          label={<Text style={labelStyle}>Annual Bonus (₹) <Tag color="blue" style={{ fontSize: 10, borderRadius: 8 }}>Optional</Tag></Text>}
          extra="Added to your gross total income">
          <InputNumber style={inputStyle} prefix="₹" min={0} placeholder="e.g. 100000" formatter={fmt} parser={parse} />
        </Form.Item>
      )}

      <Form.Item name="otherIncome"
        label={<Text style={labelStyle}>Other Income (₹) <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 12 }}>Optional</span></Text>}
        extra="Rent, interest, freelance income etc.">
        <InputNumber style={inputStyle} prefix="₹" min={0} placeholder="e.g. 50000" formatter={fmt} parser={parse} />
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
          {isSalaried
            ? 'Standard deduction of ₹75,000 applies automatically to salaried in both regimes.'
            : isVariable
            ? 'Self-employed can claim business expenses under Sec 44ADA or 44AD.'
            : 'DrainZero will suggest the best regime based on your income and deductions.'}
        </Text>
      </div>
    </Space>
  );

  const renderStep4 = () => (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <Title level={4} style={{ color: '#08457E', marginBottom: 4 }}>Deductions & Tax Savings</Title>
      <Paragraph style={{ color: '#6B7280', marginBottom: 20, fontSize: 13 }}>
        All fields optional — leave blank if unsure. You can update anytime from your profile.
      </Paragraph>

      <Form.Item
        name="deduction80C"
        label={
          <TaxFieldLabel text="80C Investments (₹)" topic="80C" style={labelStyle}
            suffix={<span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 12 }}>Optional</span>} />
        }
        extra="PPF, ELSS, LIC, EPF — Max ₹1,50,000">
        <InputNumber style={inputStyle} prefix="₹" min={0} max={150000} placeholder="e.g. 150000" formatter={fmt} parser={parse} />
      </Form.Item>

      <Form.Item
        name="deduction80D"
        label={
          <TaxFieldLabel text="80D Health Insurance Premium (₹)" topic="80D" style={labelStyle}
            suffix={<span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 12 }}>Optional</span>} />
        }
        extra="Self + family — Max ₹25,000 (₹50,000 if senior)">
        <InputNumber style={inputStyle} prefix="₹" min={0} max={25000} placeholder="e.g. 20000" formatter={fmt} parser={parse} />
      </Form.Item>

      <Form.Item
        name="deductionNPS"
        label={
          <TaxFieldLabel text="NPS Contribution 80CCD(1B) (₹)" topic="80CCD_1B" style={labelStyle}
            suffix={<span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 12 }}>Optional</span>} />
        }
        extra="Extra deduction beyond 80C — Max ₹50,000">
        <InputNumber style={inputStyle} prefix="₹" min={0} max={50000} placeholder="e.g. 50000" formatter={fmt} parser={parse} />
      </Form.Item>

      {isSalaried && (
        <Form.Item
          name="hraDeduction"
          label={
            <TaxFieldLabel text="HRA Exemption Claimed (₹)" topic="HRA" style={labelStyle}
              suffix={<Tag color="blue" style={{ fontSize: 10, borderRadius: 8 }}>Salaried Only</Tag>} />
          }
          extra="Only if you pay rent and receive HRA from employer">
          <InputNumber style={inputStyle} prefix="₹" min={0} placeholder="e.g. 120000" formatter={fmt} parser={parse} />
        </Form.Item>
      )}

      {isVariable && (
        <Alert
          icon={<InfoCircleOutlined />}
          message="Business Expense Deductions"
          description="As a freelancer/self-employed, you can claim business expenses under Sec 44ADA or 44AD. These are handled in the analysis form."
          type="success" showIcon style={{ marginTop: 8, borderRadius: 12 }}
        />
      )}

      <Divider />
      <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '12px 16px' }}>
        <Text style={{ color: '#059669', fontSize: 13 }}>
          All values are saved to your profile and auto-loaded in every feature — Missed Deductions Finder, Health Score, Regime Comparison, and more.
        </Text>
      </div>
    </Space>
  );

  return (
    <ConfigProvider theme={{
      token: { colorPrimary: '#5B92E5', borderRadius: 12, fontFamily: "'Outfit', sans-serif" },
      components: {
        Button: { controlHeightLG: 52, fontWeight: 600, borderRadius: 12 },
        Card  : { paddingLG: 40, borderRadiusLG: 24 },
      },
    }}>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #DCE6F5 0%, #EEF3FA 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', boxSizing: 'border-box',
      }}>
        <div style={{ maxWidth: 560, width: '100%' }}>

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src="/DRAINZERO-LOGO.png" alt="DrainZero"
              style={{ height: 40, width: 'auto', marginBottom: 12 }}
              onError={e => { e.target.style.display = 'none'; }} />
            <Title level={2} style={{ color: '#08457E', fontWeight: 800, margin: 0 }}>Welcome to DrainZero</Title>
            <Paragraph style={{ color: '#6B7280', fontSize: 16, marginTop: 8 }}>
              Let's set up your profile for a personalised tax analysis.
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
            {error && (
              <Alert message={error} type="error" showIcon
                style={{ marginBottom: 24, borderRadius: 12 }} closable onClose={() => setError('')} />
            )}

            <Form
              form={form}
              layout="vertical"
              initialValues={{
                name            : user?.user_metadata?.full_name || '',
                regimePreference: 'Auto Suggest',
              }}
              requiredMark={false}
            >
              {/* FIX: render inline, not as nested components */}
              {current === 0 && renderStep0()}
              {current === 1 && renderStep1()}
              {current === 2 && renderStep2()}
              {current === 3 && renderStep3()}
              {current === 4 && renderStep4()}
            </Form>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => current > 0 ? setCurrent(c => c - 1) : navigate('/')}
                style={{ height: 48, borderRadius: 12, color: '#08457E', borderColor: '#B8C8E6' }}
              >
                {current === 0 ? 'Back' : 'Previous'}
              </Button>
              <Button
                type="primary" icon={<ArrowRightOutlined />}
                loading={loading} disabled={loading}
                onClick={handleNext}
                style={{
                  height: 48, borderRadius: 12,
                  background: '#5B92E5', border: 'none',
                  paddingLeft: 32, paddingRight: 32, fontWeight: 700,
                }}
              >
                {loading
                  ? 'Saving...'
                  : current === STEPS.length - 1
                  ? 'Start Analysis'
                  : 'Next'}
              </Button>
            </div>
          </Card>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text style={{ color: '#6B7280', fontSize: 12 }}>
              Your data is private and encrypted. We never share it with third parties.
            </Text>
          </div>

        </div>
      </div>
    </ConfigProvider>
  );
};

export default OnboardingPage;
