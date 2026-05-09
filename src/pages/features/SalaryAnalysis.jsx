import React from 'react';
import { Layout, Typography, Card, Row, Col, Space, Button, Table, Statistic, Alert, Tag, ConfigProvider, Spin } from 'antd';
import { ArrowLeftOutlined, SolutionOutlined, CheckCircleFilled, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import TaxAssistantChatbot from '../../components/TaxAssistantChatbot';
import useProfileData from '../../hooks/useProfileData';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const SalaryAnalysis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { formData, backendResult, dataLoading, category } = useProfileData();

  if (dataLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F2F3F4' }}><Spin size="large" /></div>;
  }

  const salary  = formData?.annualSalary || 0;
  const bonus   = formData?.bonus        || 0;
  const dHRA    = formData?.hraDeduction || 0;
  const empType = formData?.employmentType || 'Salaried';
  const fmt     = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

  const basic   = salary * 0.50;
  const hraAct  = salary * 0.20;
  const special = salary - basic - hraAct;

  const currentStructure = [
    { key: 1, component: 'Basic Pay (50%)',   value: Math.round(basic),   note: 'Taxable' },
    { key: 2, component: 'HRA (20%)',          value: Math.round(hraAct),  note: dHRA > 0 ? 'Partially exempt' : 'Fully taxable' },
    { key: 3, component: 'Special Allowance', value: Math.round(special), note: 'Fully taxable' },
    bonus > 0 ? { key: 4, component: 'Bonus', value: Math.round(bonus), note: 'Fully taxable' } : null,
  ].filter(Boolean);

  const optBasic   = salary * 0.40;
  const optHRA     = salary * 0.25;
  const optMedical = 15000;
  const optLeave   = 10000;
  const optVehicle = category === 'Vehicle' ? 120000 : 0;
  const optSpecial = Math.max(0, salary - optBasic - optHRA - optMedical - optLeave - optVehicle);

  const suggestedStructure = [
    { key: 1, component: 'Basic Pay (40%)',       value: Math.round(optBasic),   note: 'Reduced → lower PF, lower tax base' },
    { key: 2, component: 'HRA (25%)',              value: Math.round(optHRA),     note: 'Increased → more HRA exemption' },
    { key: 3, component: 'Medical Reimbursement', value: optMedical,              note: 'Tax-free' },
    { key: 4, component: 'Leave Travel Allowance', value: optLeave,              note: 'Exempt on actual travel' },
    optVehicle > 0 ? { key: 5, component: 'Vehicle Fuel/Maint.', value: optVehicle, note: 'Reimbursement — tax-free' } : null,
    { key: 6, component: 'Special Allowance',     value: Math.round(optSpecial), note: 'Taxable remainder' },
  ].filter(Boolean).filter(r => r.value > 0);

  const taxRate      = salary > 1500000 ? 0.30 : salary > 1000000 ? 0.20 : 0.10;
  const taxSavingAmt = Math.round((optMedical + optLeave + optVehicle) * taxRate);
  // Use backend result if available; otherwise 0 (never fake 12% estimate)
  const currentTax   = backendResult?.newRegime?.totalTax ?? 0;
  const optimizedTax = Math.max(0, currentTax - taxSavingAmt);

  const columns = [
    { title: 'Component',   dataIndex: 'component', key: 'component', render: v => <Text strong style={{ color: '#08457E' }}>{v}</Text> },
    { title: 'Annual (₹)',  dataIndex: 'value',     key: 'value',     render: v => <Text>{fmt(v)}</Text> },
    { title: 'Monthly (₹)', dataIndex: 'value',     key: 'monthly',   render: v => <Text style={{ color: '#6B7280' }}>{fmt(v / 12)}</Text> },
    { title: 'Tax Status',  dataIndex: 'note',      key: 'note',      render: v => <Tag style={{ borderRadius: 20, fontSize: 11 }} color={v.includes('tax-free') || v.includes('Exempt') || v.includes('exempt') ? 'green' : v.includes('Partial') ? 'orange' : 'red'}>{v}</Tag> },
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#5B92E5', borderRadius: 20, fontFamily: "'Outfit', sans-serif" } }}>
      <Layout style={{ minHeight: '100vh', background: '#F2F3F4' }}>
        <Navbar />
        <div style={{ padding: '32px 24px' }}>
          <Content style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '24px 16px' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard', { state: location.state })}
              style={{ marginBottom: 24, borderRadius: 12, fontWeight: 600, color: '#5B92E5' }}>
              Back to Dashboard
            </Button>
            <Title level={2} style={{ color: '#08457E', fontWeight: 800, marginBottom: 8 }}>Salary Structure Analysis</Title>
            <Paragraph style={{ color: '#6B7280', fontSize: 16, marginBottom: 32 }}>
              Comparing your current pay structure with an optimized layout to maximize your take-home pay.
            </Paragraph>

            {salary === 0 && (
              <Alert message="Update your income in your profile for accurate salary structure analysis." type="warning" showIcon style={{ marginBottom: 24, borderRadius: 12 }} />
            )}

            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
              <Col xs={12} md={6}><Card style={{ borderRadius: 20, textAlign: 'center', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}><Statistic title="Gross Salary" value={salary} prefix="₹" formatter={v => v.toLocaleString('en-IN')} /></Card></Col>
              <Col xs={12} md={6}><Card style={{ borderRadius: 20, textAlign: 'center', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}><Statistic title="Current Est. Tax" value={currentTax} prefix="₹" formatter={v => v.toLocaleString('en-IN')} valueStyle={{ color: '#EF4444' }} /></Card></Col>
              <Col xs={12} md={6}><Card style={{ borderRadius: 20, textAlign: 'center', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}><Statistic title="Optimized Tax" value={optimizedTax} prefix="₹" formatter={v => v.toLocaleString('en-IN')} valueStyle={{ color: '#10B981' }} /></Card></Col>
              <Col xs={12} md={6}><Card style={{ borderRadius: 20, textAlign: 'center', background: '#5B92E5', border: 'none' }}><Statistic title={<span style={{ color: '#CCF1FF' }}>Annual Tax Saving</span>} value={taxSavingAmt} prefix="₹" formatter={v => v.toLocaleString('en-IN')} valueStyle={{ color: '#FFFFFF', fontWeight: 800 }} /></Card></Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
              <Col xs={24} md={12}>
                <Card title={<Space><SolutionOutlined style={{ color: '#6B7280' }} /><span>Current Structure</span></Space>}
                  style={{ borderRadius: 24, border: '1px solid #E5E7EB' }}>
                  <Table columns={columns} dataSource={currentStructure} pagination={false} size="small" />
                  <div style={{ marginTop: 16, padding: '12px 16px', background: '#FEF2F2', borderRadius: 12, textAlign: 'right' }}>
                    <Text style={{ color: '#EF4444', fontSize: 13 }}>Estimated Annual Tax: </Text>
                    <Text strong style={{ color: '#EF4444', fontSize: 16 }}>{fmt(currentTax)}</Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title={<Space><CheckCircleFilled style={{ color: '#10B981' }} /><span style={{ color: '#059669' }}>Optimized Structure</span></Space>}
                  style={{ borderRadius: 24, border: '2px solid #10B981' }}>
                  <Table columns={columns} dataSource={suggestedStructure} pagination={false} size="small" />
                  <div style={{ marginTop: 16, padding: '12px 16px', background: '#F0FDF4', borderRadius: 12, textAlign: 'right' }}>
                    <Text style={{ color: '#059669', fontSize: 13 }}>Optimized Annual Tax: </Text>
                    <Text strong style={{ color: '#059669', fontSize: 16 }}>{fmt(optimizedTax)}</Text>
                    <div style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>Save {fmt(taxSavingAmt)}/yr by restructuring</div>
                  </div>
                </Card>
              </Col>
            </Row>

            <Card style={{ borderRadius: 24, background: '#08457E', border: 'none', marginBottom: 24 }}>
              <Title level={5} style={{ color: '#FFFFFF', marginBottom: 20 }}>How to Restructure Your Salary</Title>
              <Row gutter={[24, 16]}>
                {[
                  { tip: 'Reduce Basic Pay to 40%', desc: 'Lower basic reduces PF deduction AND reduces taxable base for HRA calculation.' },
                  { tip: 'Increase HRA to 25%', desc: 'Higher HRA means more exemption if you pay rent. Metro cities get 50% of basic exempt.' },
                  { tip: 'Add Tax-Free Perquisites', desc: 'Medical coupons, medical reimbursement, LTA — all tax-free up to specified limits.' },
                  { tip: 'Claim Standard Deduction', desc: '₹75,000 flat deduction automatically applied in both old and new regimes for salaried.' },
                ].map((item, i) => (
                  <Col xs={24} md={12} key={i}>
                    <Space align="start">
                      <CheckCircleFilled style={{ color: '#10B981', fontSize: 16, marginTop: 3, flexShrink: 0 }} />
                      <div>
                        <Text strong style={{ color: '#FFFFFF', display: 'block', fontSize: 13 }}>{item.tip}</Text>
                        <Text style={{ color: '#CCF1FF', fontSize: 12 }}>{item.desc}</Text>
                      </div>
                    </Space>
                  </Col>
                ))}
              </Row>
            </Card>

            <Alert message="Important: Salary restructuring requires approval from your HR/Payroll team. These are suggestions based on Indian tax rules for FY 2025–26."
              type="info" showIcon style={{ borderRadius: 12, marginBottom: 24 }} icon={<InfoCircleOutlined />} />

            <TaxAssistantChatbot />
          </Content>
        </div>
      </Layout>
    </ConfigProvider>
  );
};

export default SalaryAnalysis;
