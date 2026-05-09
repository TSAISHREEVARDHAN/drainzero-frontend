import React from 'react';
import { Layout, Typography, Card, Row, Col, Space, Button, Tag, Alert, Timeline, ConfigProvider } from 'antd';
import Navbar from '../../components/Navbar';
import { ArrowLeftOutlined, ClockCircleOutlined, CheckCircleFilled, WarningOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const today = new Date();

const DEADLINES = [
  { date: '15 Jun 2025', label: 'Advance Tax — Q1 (15%)', amount: '15% of estimated tax', status: 'done', note: 'April 1 – June 15' },
  { date: '15 Sep 2025', label: 'Advance Tax — Q2 (30% instalment)', amount: '30% of estimated tax', status: 'done', note: 'Pay 30% more (total 45% by Sep 15)' },
  { date: '15 Dec 2025', label: 'Advance Tax — Q3 (30% instalment)', amount: '30% of estimated tax', status: 'done', note: 'Pay 30% more (total 75% by Dec 15)' },
  { date: '15 Mar 2026', label: 'Advance Tax — Q4 (25% instalment)', amount: '25% of estimated tax — final payment', status: new Date('2026-03-15') > today ? 'upcoming' : 'done', note: 'Final installment' },
  { date: '31 Mar 2026', label: 'Last Date to Make Tax-Saving Investments', amount: '80C, 80D, NPS', status: new Date('2026-03-31') > today ? 'urgent' : 'done', note: 'Last chance for FY 2025-26 investments' },
  { date: '15 Jun 2026', label: 'Advance Tax — Q1 FY26-27', amount: '15% of estimated tax', status: 'upcoming', note: 'Start planning now' },
  { date: '31 Jul 2026', label: 'ITR Filing Deadline (Non-Audit)', amount: 'File your ITR', status: 'upcoming', note: 'For salaried + business (non-audit)' },
  { date: '31 Oct 2026', label: 'ITR Filing Deadline (Audit Cases)', amount: 'File your ITR', status: 'upcoming', note: 'For businesses requiring audit' },
  { date: '31 Dec 2026', label: 'Belated / Revised ITR Deadline', amount: 'Last chance', status: 'upcoming', note: 'With ₹5,000 late fee' },
];

const STATUS_CONFIG = {
  done: { color: '#059669', bg: '#F0FDF4', icon: <CheckCircleFilled style={{ color: '#059669' }} />, label: 'Done' },
  upcoming: { color: '#5B92E5', bg: '#EEF3F9', icon: <ClockCircleOutlined style={{ color: '#08457E' }} />, label: 'Upcoming' },
  urgent: { color: '#DC2626', bg: '#FEF2F2', icon: <WarningOutlined style={{ color: '#DC2626' }} />, label: 'Urgent' },
};

const ADVANCE_TAX_RULES = [
  { who: 'Salaried (No other income)', rule: 'TDS by employer covers it. Advance tax only if interest/freelance > ₹10,000.' },
  { who: 'Freelancers / Self-Employed', rule: 'Must pay advance tax if liability > ₹10,000. Quarterly installments mandatory.' },
  { who: 'Senior Citizens (No business)', rule: 'Exempt from advance tax. Pay full tax at time of filing.' },
  { who: 'F&O / Day Traders', rule: 'Business income — mandatory quarterly advance tax even if salaried.' },
];

const DeadlineReminders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const formData = location.state?.formData || {};
  const income = formData.annualSalary || 0;

  const estimatedTax = (() => {
    // FY 2025-26 (Budget 2025) new regime slabs; standard deduction ₹75,000
    const taxable = Math.max(0, income - 75000);
    // 87A rebate: taxable ≤ ₹12L → zero tax
    if (taxable <= 1200000) return 0;
    // Slabs above ₹12L (rebate does not apply)
    if (taxable <= 1600000) return 60000  + (taxable - 1200000) * 0.15;
    if (taxable <= 2000000) return 120000 + (taxable - 1600000) * 0.20;
    if (taxable <= 2400000) return 200000 + (taxable - 2000000) * 0.25;
    return                          300000 + (taxable - 2400000) * 0.30;
  })();
  const taxWithCess = Math.round(estimatedTax * 1.04);

  // Advance tax: each quarter shows the instalment amount due that quarter
  const q1 = Math.round(taxWithCess * 0.15);                          // Jun 15: 15%
  const q2 = Math.round(taxWithCess * 0.45) - q1;                    // Sep 15: 30% more
  const q3 = Math.round(taxWithCess * 0.75) - q1 - q2;               // Dec 15: 30% more
  const q4 = taxWithCess - q1 - q2 - q3;                              // Mar 15: 25% more

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#5B92E5', borderRadius: 16, fontFamily: "'Outfit', sans-serif" } }}>
      <Layout style={{ minHeight: '100vh', background: '#F2F3F4' }}>
          <Navbar />
          <div style={{ padding: '32px 24px' }}>
        <Content style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '24px 16px' }}>

          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard', { state: location.state })}
            style={{ marginBottom: 24, borderRadius: 12, fontWeight: 600, color: '#08457E' }}>
            Back to Dashboard
          </Button>

          <div style={{ marginBottom: 40 }}>
            <Title level={2} style={{ color: '#08457E', fontWeight: 800, margin: 0 }}>
              Tax Deadline Reminders
            </Title>
            <Paragraph style={{ color: '#6B7280', fontSize: 16, marginTop: 8 }}>
              Never miss a deadline. Advance tax, ITR filing, investment cutoffs — all in one place.
            </Paragraph>
          </div>

          {/* Advance Tax Calculator */}
          {income > 0 && (
            <Card style={{ borderRadius: 24, background: '#5B92E5', border: 'none', marginBottom: 32 }}>
              <Title level={4} style={{ color: '#FFFFFF', margin: '0 0 20px' }}>Your Advance Tax Schedule (FY 2025–26)</Title>
              <Row gutter={[16, 16]}>
                {[
                  { q: 'Q1', due: 'Jun 15', pct: '15%', amount: q1 },
                  { q: 'Q2', due: 'Sep 15', pct: '30% instalment', amount: q2 },
                  { q: 'Q3', due: 'Dec 15', pct: '30% instalment', amount: q3 },
                  { q: 'Q4', due: 'Mar 15', pct: '25% instalment', amount: q4 },
                ].map((item, i) => (
                  <Col xs={12} md={6} key={i}>
                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#CCF1FF', letterSpacing: 1, marginBottom: 8 }}>{item.q} · Due {item.due}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>₹{item.amount.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: '#CCF1FF', marginTop: 4 }}>{item.pct}</div>
                    </div>
                  </Col>
                ))}
              </Row>
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.06)', borderRadius: 12 }}>
                <Text style={{ color: '#CCF1FF', fontSize: 13 }}>
                  Estimated annual tax ₹{taxWithCess.toLocaleString()} (incl. cess). Each row shows the instalment due that quarter.
                </Text>
              </div>
            </Card>
          )}

          <Row gutter={[24, 24]}>
            {/* Timeline */}
            <Col xs={24} lg={14}>
              <Card style={{ borderRadius: 24, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <Title level={4} style={{ color: '#5B92E5', marginBottom: 28 }}>
                  <CalendarOutlined style={{ marginRight: 8 }} /> All Deadlines FY 2025–26
                </Title>
                <Timeline
                  items={DEADLINES.map(d => ({
                    dot: STATUS_CONFIG[d.status].icon,
                    children: (
                      <div style={{ paddingBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                          <div>
                            <Text strong style={{ color: '#1F2937', fontSize: 15 }}>{d.label}</Text>
                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{d.note}</div>
                          </div>
                          <Space size={8}>
                            <Tag style={{ borderRadius: 20, background: STATUS_CONFIG[d.status].bg, color: STATUS_CONFIG[d.status].color, border: 'none', fontSize: 11 }}>
                              {STATUS_CONFIG[d.status].label}
                            </Tag>
                            <Tag style={{ borderRadius: 20, background: '#F2F3F4', color: '#5B92E5', border: '1px solid #B8C8E6', fontSize: 11 }}>
                              {d.date}
                            </Tag>
                          </Space>
                        </div>
                        <div style={{ marginTop: 6, padding: '6px 12px', background: '#F2F3F4', borderRadius: 8, display: 'inline-block' }}>
                          <Text style={{ fontSize: 12, color: '#6B7280' }}>{d.amount}</Text>
                        </div>
                      </div>
                    )
                  }))}
                />
              </Card>
            </Col>

            {/* Rules */}
            <Col xs={24} lg={10}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card style={{ borderRadius: 24, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
                  <Title level={5} style={{ color: '#5B92E5', marginBottom: 16 }}>Who Must Pay Advance Tax?</Title>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {ADVANCE_TAX_RULES.map((r, i) => (
                      <div key={i} style={{ background: '#F2F3F4', borderRadius: 12, padding: '12px 16px' }}>
                        <Text strong style={{ color: '#5B92E5', fontSize: 13, display: 'block' }}>{r.who}</Text>
                        <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 4, display: 'block' }}>{r.rule}</Text>
                      </div>
                    ))}
                  </Space>
                </Card>

                <Alert
                  message="Interest Penalty for Missing Advance Tax"
                  description="Missing installments attract 1% simple interest per month under Sec 234B and 234C. On ₹50,000 tax, that's ₹500/month extra."
                  type="warning" showIcon
                  style={{ borderRadius: 16 }}
                />

                <Card style={{ borderRadius: 24, background: '#F0FDF4', border: '1px solid #D1FAE5' }}>
                  <Text strong style={{ color: '#059669', fontSize: 14 }}>💡 Pro Tip</Text>
                  <Paragraph style={{ color: '#065F46', fontSize: 13, margin: '8px 0 0' }}>
                    Pay advance tax via Challan 280 on the Income Tax portal. Keep the payment receipt as proof. Q4 is always March 15 — not March 31.
                  </Paragraph>
                </Card>
              </Space>
            </Col>
          </Row>

        </Content>
      </div>
</Layout>
    </ConfigProvider>
  );
};

export default DeadlineReminders;
