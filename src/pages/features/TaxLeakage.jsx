import React from 'react';
import { Layout, Typography, Card, Row, Col, Space, Button, Tag, Progress, ConfigProvider, Spin } from 'antd';
import { ArrowLeftOutlined, WarningOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import TaxAssistantChatbot from '../../components/TaxAssistantChatbot';
import useProfileData from '../../hooks/useProfileData';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const TaxLeakage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { formData, backendResult, dataLoading, category } = useProfileData();

  if (dataLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F2F3F4' }}><Spin size="large" /></div>;
  }

  const salary   = formData?.annualSalary || 0;
  const slabRate = salary > 1500000 ? 0.30 : salary > 1000000 ? 0.20 : salary > 500000 ? 0.10 : 0.05;
  const fmt      = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

  let leakageGaps  = [];
  let totalLeakage = 0;

  if (backendResult?.leakageGaps?.length > 0) {
    leakageGaps  = backendResult.leakageGaps;
    totalLeakage = backendResult.totalLeakage || leakageGaps.reduce((a, g) => a + (g.taxSaved || 0), 0);
  } else {
    const d80C = formData?.deduction80C || 0;
    const dNPS = formData?.deductionNPS || 0;
    const d80D = formData?.deduction80D || 0;
    const dHRA = formData?.hraDeduction || 0;

    if (d80C < 150000) {
      const missed = 150000 - d80C;
      leakageGaps.push({ label: 'Section 80C Gap', description: `You have ₹${missed.toLocaleString('en-IN')} unused in 80C limit. Invest in PPF, ELSS, or LIC.`, taxSaved: Math.round(missed * slabRate), severity: 'high' });
    }
    if (dNPS < 50000) {
      const missed = 50000 - dNPS;
      leakageGaps.push({ label: 'NPS 80CCD(1B) Gap', description: `₹${missed.toLocaleString('en-IN')} more in NPS gives exclusive deduction beyond 80C.`, taxSaved: Math.round(missed * slabRate), severity: 'high' });
    }
    if (d80D < 25000) {
      const missed = 25000 - d80D;
      leakageGaps.push({ label: 'Health Insurance 80D Gap', description: 'Get health insurance to claim up to ₹25,000 deduction.', taxSaved: Math.round(missed * slabRate), severity: 'medium' });
    }
    if (dHRA === 0 && salary > 0) {
      leakageGaps.push({ label: 'HRA Not Claimed', description: 'If you pay rent, submit rent receipts to claim HRA exemption.', taxSaved: Math.round(salary * 0.10 * slabRate), severity: 'medium' });
    }
    if (category === 'Vehicle' && formData?.fuelType === 'Electric') {
      leakageGaps.push({ label: 'EV Loan 80EEB Not Claimed', description: 'EV loan interest up to ₹1.5L is deductible under Section 80EEB.', taxSaved: Math.round(150000 * slabRate), severity: 'medium' });
    }
    if (salary > 700000) {
      leakageGaps.push({ label: 'LTCG Harvesting Not Used', description: 'You can harvest up to ₹1.25L of equity LTCG tax-free every year.', taxSaved: Math.round(125000 * 0.10), severity: 'low' });
    }
    totalLeakage = leakageGaps.reduce((a, g) => a + (g.taxSaved || 0), 0);
  }

  const severityColor = (s) => {
    if (s === 'high')    return '#EF4444';
    if (s === 'medium')  return '#F59E0B';
    if (s === 'warning') return '#DC2626';
    return '#5B92E5';
  };
  const severityLabel = (s) => {
    if (s === 'high')    return 'High Impact';
    if (s === 'medium')  return 'Medium Impact';
    if (s === 'warning') return 'Risk';
    return 'Low Impact';
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#5B92E5', borderRadius: 16, fontFamily: "'Outfit', sans-serif" } }}>
      <Layout style={{ minHeight: '100vh', background: '#F2F3F4' }}>
        <Navbar />
        <div style={{ padding: '24px 16px' }}>
          <Content style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard', { state: location.state })}
              style={{ marginBottom: 24, borderRadius: 12, fontWeight: 600, color: '#5B92E5' }}>
              Back to Dashboard
            </Button>
            <Title level={2} style={{ color: '#08457E', fontWeight: 800, marginBottom: 8 }}>Missed Deductions Finder</Title>
            <Paragraph style={{ color: '#6B7280', fontSize: 16, marginBottom: 32 }}>
              Money you are legally entitled to save but currently losing.
            </Paragraph>

            <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
              <Col xs={24} sm={12} md={8}>
                <Card style={{ borderRadius: 20, border: 'none', background: '#FEF2F2', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Total Tax Leakage</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#EF4444' }}>{fmt(totalLeakage)}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>per year you're overpaying</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card style={{ borderRadius: 20, border: 'none', background: '#FFF7ED', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Gaps Found</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#D97706' }}>{leakageGaps.length}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>areas to optimize</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card style={{ borderRadius: 20, border: 'none', background: '#F0FDF4', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Potential Saving</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>{fmt(totalLeakage)}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>if all gaps are closed</div>
                </Card>
              </Col>
            </Row>

            {leakageGaps.length === 0 ? (
              <Card style={{ borderRadius: 20, border: 'none', textAlign: 'center', padding: '40px 20px' }}>
                <CheckCircleFilled style={{ fontSize: 48, color: '#10B981', marginBottom: 16 }} />
                <Title level={4} style={{ color: '#059669' }}>No Leakage Detected!</Title>
                <Paragraph style={{ color: '#6B7280' }}>Your tax planning appears optimized.</Paragraph>
              </Card>
            ) : (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {leakageGaps.map((gap, i) => (
                  <Card key={i} style={{ borderRadius: 20, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderLeft: `4px solid ${severityColor(gap.severity || 'medium')}` }}>
                    <Row gutter={[16, 16]} align="middle">
                      <Col xs={24} md={16}>
                        <Space size={12} align="start">
                          <WarningOutlined style={{ color: severityColor(gap.severity || 'medium'), fontSize: 20, marginTop: 2, flexShrink: 0 }} />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                              <Text strong style={{ color: '#08457E', fontSize: 16 }}>{gap.label || gap.section}</Text>
                              <Tag style={{ borderRadius: 20, fontSize: 11, background: severityColor(gap.severity || 'medium') + '20', color: severityColor(gap.severity || 'medium'), border: 'none' }}>
                                {severityLabel(gap.severity || 'medium')}
                              </Tag>
                            </div>
                            <Paragraph style={{ color: '#6B7280', margin: 0, fontSize: 14, lineHeight: 1.6 }}>
                              {gap.description || gap.action || 'Utilize this section to reduce your tax burden.'}
                            </Paragraph>
                          </div>
                        </Space>
                      </Col>
                      <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                        {gap.taxSaved > 0 && (
                          <div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>POTENTIAL SAVING</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981' }}>{fmt(gap.taxSaved)}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>per year</div>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            )}

            {leakageGaps.length > 0 && totalLeakage > 0 && (
              <Card style={{ borderRadius: 20, border: 'none', marginTop: 24, background: '#08457E' }}>
                <Title level={5} style={{ color: '#FFFFFF', marginBottom: 16 }}>Optimization Roadmap</Title>
                <div style={{ color: '#CCF1FF', fontSize: 14, marginBottom: 12 }}>
                  Closing all gaps could save you <strong style={{ color: '#FFFFFF' }}>{fmt(totalLeakage)}</strong> annually
                </div>
                <Progress percent={Math.min(100, Math.round((totalLeakage / Math.max(salary * 0.05, 1)) * 100))}
                  strokeColor="#10B981" trailColor="rgba(255,255,255,0.2)" showInfo={false} />
                <div style={{ color: '#CCF1FF', fontSize: 12, marginTop: 8 }}>
                  {leakageGaps.length} gap{leakageGaps.length > 1 ? 's' : ''} identified · Fix the high impact ones first
                </div>
              </Card>
            )}

            <div style={{ marginTop: 40 }}><TaxAssistantChatbot /></div>
          </Content>
        </div>
      </Layout>
    </ConfigProvider>
  );
};

export default TaxLeakage;
