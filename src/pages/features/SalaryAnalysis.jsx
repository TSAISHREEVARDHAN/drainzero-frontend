import React from 'react';
import { Layout, Typography, Card, Row, Col, Space, Button, Table, Statistic, Alert, Tag, ConfigProvider } from 'antd';
import { ArrowLeftOutlined, SolutionOutlined, CheckCircleFilled, InfoCircleOutlined, RiseOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import TaxAssistantChatbot from '../../components/TaxAssistantChatbot';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const SalaryAnalysis = () => {
  const location = useLocation();
  const navigate  = useNavigate();

  if (!location.state) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Title level={2}>Salary Structure Analysis</Title>
        <div style={{ padding: 60, background: '#fff', borderRadius: 24 }}>
          <p>Please complete the analysis form first.</p>
          <Button type="primary" onClick={() => navigate('/category-selection')}>Start Analysis</Button>
        </div>
      </div>
    );
  }

  const { formData, category, subcategory, backendResult } = location.state || {};
  const salary  = formData?.annualSalary || 0;
  const bonus   = formData?.bonus        || 0;
  const d80C    = formData?.deduction80C || 0;
  const dHRA    = formData?.hraDeduction || 0;
  const dNPS    = formData?.deductionNPS || 0;
  const profTax = formData?.professionalTax || 2500;
  const empType = formData?.employmentType || 'Salaried';

  const fmt = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

  // Current structure based on actual entered data
  const basic    = salary * 0.50; // typical current
  const hraAct   = salary * 0.20;
  const special  = salary - basic - hraAct;

  const currentStructure = [
    { key: 1, component: 'Basic Pay (50%)',      value: Math.round(basic),   note: 'Taxable' },
    { key: 2, component: 'HRA (20%)',            value: Math.round(hraAct),  note: dHRA > 0 ? 'Partially exempt' : 'Fully taxable' },
    { key: 3, component: 'Special Allowance',    value: Math.round(special), note: 'Fully taxable' },
    bonus > 0 ? { key: 4, component: 'Bonus', value: Math.round(bonus), note: 'Fully taxable' } : null,
  ].filter(Boolean);

  // Optimized structure
  const optBasic    = salary * 0.40;
  const optHRA      = salary * 0.25;
  const optPerqs    = Math.min(400000, salary * 0.10); // tax-free perquisites up to ₹4L cap
  const optVehicle  = category === 'Vehicle' ? 120000 : 0;
  const optMedical  = 15000; // medical reimbursement
  const optLeave    = 10000; // leave travel allowance
  const optSpecial  = Math.max(0, salary - optBasic - optHRA - optPerqs - optVehicle - optMedical - optLeave);

  const suggestedStructure = [
    { key: 1, component: 'Basic Pay (40%)',          value: Math.round(optBasic),   note: 'Reduced → lower PF, lower tax base' },
    { key: 2, component: 'HRA (25%)',                value: Math.round(optHRA),     note: 'Increased → more HRA exemption' },
    { key: 3, component: 'Tax-free Perquisites',     value: Math.round(optPerqs),   note: 'Exempt up to ₹4L cap' },
    optVehicle > 0 ? { key: 4, component: 'Vehicle Fuel/Maint.', value: optVehicle, note: 'Reimbursement — tax-free' } : null,
    { key: 5, component: 'Medical Reimbursement',   value: optMedical,              note: 'Tax-free' },
    { key: 6, component: 'Leave Travel Allowance',  value: optLeave,                note: 'Exempt on actual travel' },
    { key: 7, component: 'Special Allowance',        value: Math.round(optSpecial), note: 'Taxable remainder' },
  ].filter(Boolean).filter(r => r.value > 0);

  const taxRate       = salary > 1500000 ? 0.30 : salary > 1000000 ? 0.20 : 0.10;
  const taxSavingAmt  = Math.round((optPerqs + optVehicle + optMedical + optLeave) * taxRate);
  const currentTax    = backendResult?.newRegime?.totalTax  || Math.round(salary * 0.12);
  const optimizedTax  = Math.max(0, currentTax - taxSavingAmt);

  const columns = [
    { title: 'Component',    dataIndex: 'component', key: 'component', render: v => <Text strong style={{ color: '#08457E' }}>{v}</Text> },
    { title: 'Annual (₹)',   dataIndex: 'value',     key: 'value',     render: v => <Text>{fmt(v)}</Text> },
    { title: 'Monthly (₹)',  dataIndex: 'value',     key: 'monthly',   render: v => <Text style={{ color: '#6B7280' }}>{fmt(v / 12)}</Text> },
    { title: 'Tax Status',   dataIndex: 'note',      key: 'note',      render: v => <Tag style={{ borderRadius: 20, fontSize: 11 }} color={v.includes('tax-free') || v.includes('Exempt') || v.includes('exempt') ? 'green' : v.includes('Partial') ? 'orange' : 'red'}>{v}</Tag> },
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#5B92E5', borderRadius: 16, fontFamily: "'Outfit', sans-serif" } }}>
      <Layout style={{ minHeight: '100vh', background: '#F2F3F4' }}>
          <Navbar />
          <div style={{ padding: '32px 24px' }}>
        <Content style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard', { state: location.state })}
            style={{ marginBottom: 24, borderRadius: 12, fontWeight: 600, color: '#08457E' }}>
            Back to Dashboard
          </Button>

          <Title level={2} style={{ color: '#08457E', fontWeight: 800 }}>Salary Structure Analysis</Title>
          <Paragraph style={{ color: '#6B7280', fontSize: 16, marginBottom: 32 }}>
            Comparing your current pay structure with an optimized layout to maximize your take-home pay.
          </Paragraph>

          {salary === 0 && (
            <Alert message="Enter your annual salary in the analysis form for accurate salary structure analysis." type="warning" showIcon style={{ marginBottom: 24, borderRadius: 12 }} />
          )}

          {/* Summary Stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            {[
              { label: 'Gross Salary', value: fmt(salary + bonus), color: '#08457E' },
              { label: 'Current Est. Tax', value: fmt(currentTax), color: '#EF4444' },
              { label: 'Optimized Tax', value: fmt(optimizedTax), color: '#059669' },
              { label: 'Annual Tax Saving', value: fmt(taxSavingAmt), color: '#0F7B6C' },
            ].map((s, i) => (
              <Col xs={12} md={6} key={i}>
                <Card style={{ borderRadius: 20, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[24, 24]}>
            {/* Current Structure */}
            <Col xs={24} lg={12}>
              <Card
                title={<Space><SolutionOutlined style={{ color: '#6B7280' }} /> <span style={{ color: '#6B7280' }}>Current Structure</span></Space>}
                style={{ borderRadius: 24, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
              >
                <Table columns={columns} dataSource={currentStructure} pagination={false} size="small" style={{ borderRadius: 12, overflow: 'hidden' }} />
                <div style={{ marginTop: 20, padding: '16px 20px', background: '#FEF2F2', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Estimated Annual Tax</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#EF4444' }}>{fmt(currentTax)}</div>
                </div>
              </Card>
            </Col>

            {/* Optimized Structure */}
            <Col xs={24} lg={12}>
              <Card
                title={<Space><CheckCircleFilled style={{ color: '#10B981' }} /> <span style={{ color: '#10B981', fontWeight: 700 }}>Optimized Structure</span></Space>}
                style={{ borderRadius: 24, border: '2px dashed #10B981' }}
              >
                <Table columns={columns} dataSource={suggestedStructure} pagination={false} size="small" style={{ borderRadius: 12, overflow: 'hidden' }} />
                <div style={{ marginTop: 20, padding: '16px 20px', background: '#F0FDF4', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Optimized Annual Tax</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981' }}>{fmt(optimizedTax)}</div>
                  {taxSavingAmt > 0 && <div style={{ fontSize: 13, color: '#059669', marginTop: 4 }}>Save {fmt(taxSavingAmt)}/year by restructuring</div>}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Insights */}
          <Card style={{ borderRadius: 24, background: '#08457E', marginTop: 24, border: 'none' }}>
            <Title level={4} style={{ color: '#FFFFFF', marginBottom: 20 }}>How to Restructure Your Salary</Title>
            <Row gutter={[20, 20]}>
              {[
                { title: 'Reduce Basic Pay to 40%', desc: 'Lower basic reduces PF deduction AND reduces taxable base for HRA calculation.' },
                { title: 'Increase HRA to 25%', desc: 'Higher HRA means more exemption if you pay rent. Metro cities get 50% of basic exempt.' },
                { title: 'Add Tax-Free Perquisites', desc: 'Meal coupons, medical reimbursement, LTA — all tax-free up to specified limits.' },
                empType === 'Salaried' ? { title: 'Claim Standard Deduction', desc: '₹75,000 flat deduction automatically applied in both old and new regimes for salaried.' } : { title: 'Business Expense Claims', desc: 'Self-employed can deduct office rent, equipment, travel, and internet as business expenses.' },
              ].map((tip, i) => (
                <Col xs={24} md={12} key={i}>
                  <Space size={10} align="start">
                    <InfoCircleOutlined style={{ color: '#5B92E5', fontSize: 16, marginTop: 3, flexShrink: 0 }} />
                    <div>
                      <Text strong style={{ color: '#FFFFFF', display: 'block' }}>{tip.title}</Text>
                      <Text style={{ color: '#CCF1FF', fontSize: 13 }}>{tip.desc}</Text>
                    </div>
                  </Space>
                </Col>
              ))}
            </Row>
          </Card>

          <Alert
            message="Important: Salary restructuring requires approval from your HR/Payroll team. These are suggestions based on Indian tax rules for FY 2025-26."
            type="info" showIcon style={{ marginTop: 24, borderRadius: 12 }}
          />

          <div style={{ marginTop: 40 }}>
            <TaxAssistantChatbot />
          </div>
        </Content>
      </div>
</Layout>
    </ConfigProvider>
  );
};

export default SalaryAnalysis;
