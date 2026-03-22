import React from 'react';
import { Layout, Typography, Card, Row, Col, Space, Button, Badge, Tag, ConfigProvider, Alert } from 'antd';
import { ArrowLeftOutlined, RocketOutlined, CheckCircleOutlined, SwapOutlined, CarOutlined, SafetyOutlined, HomeOutlined, StockOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import TaxAssistantChatbot from '../../components/TaxAssistantChatbot';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const Recommendations = () => {
  const location = useLocation();
  const navigate  = useNavigate();

  if (!location.state) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Title level={2}>Actionable Recommendations</Title>
        <div style={{ padding: '60px', background: '#fff', borderRadius: '24px' }}>
          <p>Please complete the analysis form first.</p>
          <Button type="primary" onClick={() => navigate('/category-selection')}>Start Analysis</Button>
        </div>
      </div>
    );
  }

  const { category, subcategory, formData, backendResult } = location.state || {};
  const salary    = formData?.annualSalary || 0;
  const slabRate  = salary > 1500000 ? 0.30 : salary > 1000000 ? 0.20 : salary > 500000 ? 0.10 : 0.05;
  const fmt       = (n) => n > 0 ? `₹${Math.round(n).toLocaleString('en-IN')}` : 'Variable';

  const recommendations = [];

  // ── 1. Always add NPS if not maxed ──
  const currentNPS = formData?.deductionNPS || 0;
  if (currentNPS < 50000) {
    recommendations.push({
      id: 1, title: 'Maximize NPS 80CCD(1B)',
      description: `Invest ₹${(50000 - currentNPS).toLocaleString('en-IN')} more in NPS Tier-1 for exclusive deduction beyond 80C limit.`,
      icon: <RocketOutlined />, iconColor: '#8B5CF6',
      savings: fmt((50000 - currentNPS) * slabRate), tag: 'Retirement'
    });
  }

  // ── 2. 80C gap ──
  const d80C = formData?.deduction80C || 0;
  if (d80C < 150000) {
    recommendations.push({
      id: 2, title: 'Fill Section 80C Limit',
      description: `You have ₹${(150000 - d80C).toLocaleString('en-IN')} remaining in 80C. Invest in PPF, ELSS, or LIC premium.`,
      icon: <CheckCircleOutlined />, iconColor: '#059669',
      savings: fmt((150000 - d80C) * slabRate), tag: 'Investment'
    });
  }

  // ── 3. Health Insurance ──
  const d80D = formData?.deduction80D || 0;
  if (d80D < 25000) {
    recommendations.push({
      id: 3, title: 'Get Health Insurance (80D)',
      description: 'Health insurance premium up to ₹25,000 is fully deductible under Section 80D. Add parents for up to ₹50,000 extra.',
      icon: <SafetyOutlined />, iconColor: '#EF4444',
      savings: fmt((25000 - d80D) * slabRate), tag: 'Health'
    });
  }

  // ── 4. Regime recommendation ──
  const backendOld = backendResult?.oldRegime?.totalTax;
  const backendNew = backendResult?.newRegime?.totalTax;
  if (backendOld !== undefined && backendNew !== undefined) {
    const better = backendOld <= backendNew ? 'Old Regime' : 'New Regime';
    const saving = Math.abs(backendOld - backendNew);
    if (saving > 0) {
      recommendations.push({
        id: 4, title: `Switch to ${better}`,
        description: `Based on your profile, ${better} saves you more money. Your current deductions ${backendOld <= backendNew ? 'justify' : 'do not justify'} the Old Regime.`,
        icon: <SwapOutlined />, iconColor: '#5B92E5',
        savings: fmt(saving), tag: 'Regime'
      });
    }
  } else {
    // fallback regime recommendation
    const regime = formData?.regimePreference;
    if (regime && regime !== 'Auto Suggest') {
      recommendations.push({
        id: 4, title: 'Enable Auto-Regime Selector',
        description: 'Let DrainZero automatically pick the cheaper regime based on your deductions. Could save you money.',
        icon: <SwapOutlined />, iconColor: '#5B92E5',
        savings: 'Variable', tag: 'Regime'
      });
    }
  }

  // ── 5. LTCG Harvesting ──
  if (salary > 700000) {
    recommendations.push({
      id: 5, title: 'LTCG Tax Harvesting (₹1.25L Free)',
      description: 'Equity long-term gains up to ₹1.25L per year are tax-free. Sell and rebuy to reset cost basis annually.',
      icon: <StockOutlined />, iconColor: '#10B981',
      savings: '₹15,625/yr', tag: 'LTCG'
    });
  }

  // ── 6. Vehicle specific ──
  if (category === 'Vehicle') {
    if (formData?.usageType !== 'Business' && formData?.employmentType === 'Self-Employed') {
      recommendations.push({
        id: 6, title: 'Convert Vehicle to Business Asset',
        description: `Claim ${subcategory === 'Car' ? '15%' : '30%'} depreciation by registering your ${subcategory} as business asset.`,
        icon: <CarOutlined />, iconColor: '#D97706',
        savings: fmt((formData?.purchasePrice || 0) * (subcategory === 'Car' ? 0.15 : 0.30) * slabRate), tag: 'Vehicle'
      });
    }
    if (formData?.fuelType === 'Electric') {
      recommendations.push({
        id: 7, title: 'EV Loan — Section 80EEB',
        description: 'Your Electric Vehicle qualifies for ₹1.5L interest deduction under Sec 80EEB. Take a loan even if you have cash.',
        icon: <CarOutlined />, iconColor: '#059669',
        savings: fmt(150000 * slabRate), tag: 'EV Benefit'
      });
    }
  }

  // ── 7. Property specific ──
  if (category === 'Land' || category === 'Property') {
    if (!formData?.loanInterestPaid || formData?.loanInterestPaid === 0) {
      recommendations.push({
        id: 8, title: 'Home Loan Interest Deduction',
        description: 'Self-occupied property: claim up to ₹2L interest deduction under Sec 24(b). Renovate using loan to claim this.',
        icon: <HomeOutlined />, iconColor: '#5B92E5',
        savings: fmt(200000 * slabRate), tag: 'Property'
      });
    }
  }

  // ── 8. Always show HRA tip if salaried ──
  if (formData?.employmentType === 'Salaried' && (!formData?.hraDeduction || formData?.hraDeduction === 0)) {
    recommendations.push({
      id: 9, title: 'Claim HRA Exemption',
      description: 'If you pay rent, you are eligible for HRA exemption. Submit rent receipts to your employer or claim in ITR.',
      icon: <HomeOutlined />, iconColor: '#0891B2',
      savings: fmt(salary * 0.15 * slabRate), tag: 'Salary'
    });
  }

  // ── 9. Backend leakage gaps ──
  if (backendResult?.leakageGaps?.length > 0) {
    backendResult.leakageGaps.slice(0, 3).forEach((gap, i) => {
      if (recommendations.length < 10) {
        recommendations.push({
          id: 100 + i,
          title: gap.label || gap.section || 'Tax Saving Opportunity',
          description: gap.description || `Claim ${gap.section} to reduce tax liability.`,
          icon: <CheckCircleOutlined />,
          iconColor: '#0F7B6C',
          savings: fmt(gap.taxSaved || 0),
          tag: 'Leakage'
        });
      }
    });
  }

  // ── 10. Always show MACT/SGB if nothing else ──
  if (recommendations.length < 3) {
    recommendations.push({
      id: 99, title: 'Invest in SGB for Tax-Free Gold Returns',
      description: 'Sovereign Gold Bonds held for 8 years have ZERO capital gains tax + 2.5% annual interest.',
      icon: <RocketOutlined />, iconColor: '#D97706',
      savings: 'Tax-Free Maturity', tag: 'Investment'
    });
  }

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#5B92E5', borderRadius: 20, fontFamily: "'Outfit', sans-serif" } }}>
      <Layout style={{ minHeight: '100vh', background: '#F2F3F4' }}>
          <Navbar />
          <div style={{ padding: '32px 24px' }}>
        <Content style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard', { state: location.state })}
            style={{ marginBottom: 24, borderRadius: 12, fontWeight: 600, color: '#08457E' }}>
            Back to Dashboard
          </Button>

          <Title level={2} style={{ color: '#08457E', fontWeight: 800 }}>Actionable Recommendations</Title>
          <Paragraph style={{ color: '#6B7280', fontSize: 16, marginBottom: 40 }}>
            Personalized steps to improve your tax efficiency based on your profile.
          </Paragraph>

          {salary === 0 && (
            <Alert message="Tip: Enter your annual salary in the analysis form to get more personalized recommendations." type="info" showIcon style={{ marginBottom: 24, borderRadius: 12 }} />
          )}

          <Row gutter={[24, 24]}>
            {recommendations.map((rec) => (
              <Col xs={24} md={12} key={rec.id}>
                <Badge.Ribbon text={rec.tag} color={rec.iconColor} style={{ padding: '0 12px', borderRadius: 4, top: 20, right: -10 }}>
                  <Card style={{ borderRadius: 24, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.03)', height: '100%' }} bodyStyle={{ padding: 32 }}>
                    <Space direction="vertical" size={20} style={{ width: '100%' }}>
                      <div style={{ width: 52, height: 52, background: `${rec.iconColor}15`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: rec.iconColor, fontSize: 22 }}>
                        {rec.icon}
                      </div>
                      <div>
                        <Title level={4} style={{ color: '#08457E', margin: '0 0 10px', fontWeight: 700 }}>{rec.title}</Title>
                        <Paragraph style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{rec.description}</Paragraph>
                      </div>
                      <div style={{ padding: '12px 16px', background: '#F2F3F4', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>POTENTIAL SAVINGS</Text>
                        <Text strong style={{ color: '#10B981', fontSize: 16 }}>{rec.savings}</Text>
                      </div>
                    </Space>
                  </Card>
                </Badge.Ribbon>
              </Col>
            ))}
          </Row>

          <div style={{ marginTop: 60, textAlign: 'center' }}>
            <div style={{ background: '#FFFFFF', padding: '28px 32px', borderRadius: 24, border: '1px dashed #5B92E5', display: 'inline-block', maxWidth: 600 }}>
              <Title level={4} style={{ color: '#08457E', marginBottom: 8 }}>Want deeper analysis?</Title>
              <Paragraph style={{ color: '#6B7280', margin: 0 }}>Ask the AI Tax Assistant below for personalized advice based on your exact situation.</Paragraph>
            </div>
          </div>

          <TaxAssistantChatbot />
        </Content>
      </div>
</Layout>
    </ConfigProvider>
  );
};

export default Recommendations;
