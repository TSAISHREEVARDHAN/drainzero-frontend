import React from 'react';
import { ConfigProvider, Button, Typography, Row, Col, Card, Space, Tag, Statistic } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SwapOutlined, SearchOutlined, LineChartOutlined, CheckCircleOutlined,
  WalletOutlined, BulbOutlined, FileTextOutlined, SafetyOutlined,
  ArrowRightOutlined, StarFilled, ThunderboltFilled
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const FEATURES = [
  { title: 'Regime Comparison', desc: 'Side-by-side Old vs New regime with FY 2025-26 slabs. Shows exactly which saves more.', icon: <SwapOutlined />, color: '#5B92E5' },
  { title: 'Tax Leakage Detection', desc: 'Finds money you\'re losing without knowing — missed deductions, unclaimed exemptions.', icon: <SearchOutlined />, color: '#F59E0B' },
  { title: 'Tax Health Score', desc: 'A score out of 100 showing how optimized your tax planning is.', icon: <LineChartOutlined />, color: '#10B981' },
  { title: 'AI Tax Assistant', desc: 'Ask anything — the AI knows your income, deductions and profile. Like a personal CA.', icon: <ThunderboltFilled />, color: '#7C3AED' },
  { title: 'Legal Loopholes', desc: '14 legally bulletproof strategies — HUF, RNOR, LTCG harvesting, marriage gifts and more.', icon: <BulbOutlined />, color: '#D97706' },
  { title: 'Document Upload', desc: 'Upload Form 16 or AIS — Gemini Vision reads it and fills your profile automatically.', icon: <FileTextOutlined />, color: '#0891B2' },
  { title: 'What-If Simulator', desc: 'Drag sliders to see live tax impact. No other free tool has this.', icon: <WalletOutlined />, color: '#059669' },
  { title: '50+ Deductions Explorer', desc: 'Every tax section — 80C to 112A — with your personal claim status.', icon: <CheckCircleOutlined />, color: '#EF4444' },
];

const STATS = [
  { value: '50+', label: 'Tax Sections Covered' },
  { value: '14', label: 'Legal Loopholes' },
  { value: '63', label: 'KB Entries (RAG)' },
  { value: '₹0', label: 'Cost to Use' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Tell us about yourself', desc: 'Name, age, employment type, sector, city — takes 2 minutes.' },
  { step: '02', title: 'Select your category', desc: 'Vehicle, Stocks, Health Insurance, or Property — we go deep on each.' },
  { step: '03', title: 'Enter financial details', desc: 'Salary, deductions, asset details — our smart form guides you.' },
  { step: '04', title: 'Get your full analysis', desc: 'Tax comparison, health score, leakage gaps, recommendations — all in one dashboard.' },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <ConfigProvider theme={{
      token: { colorPrimary: '#5B92E5', colorBgContainer: '#FFFFFF', borderRadius: 20, fontFamily: "'Outfit', sans-serif" },
      components: { Button: { borderRadius: 50, controlHeight: 52, fontWeight: 600 } }
    }}>
      <div style={{ backgroundColor: '#F2F3F4', color: '#1F2937', overflowX: 'hidden' }}>

        {/* ── Navbar ── */}
        <nav style={{ background: '#FFFFFF', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 0 #E5E7EB', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#08457E', letterSpacing: -0.5 }}>
            Drain<span style={{ color: '#5B92E5' }}>Zero</span>
          </div>
          <Space size={12}>
            <Button onClick={() => navigate('/login')} style={{ height: 40, borderRadius: 10, color: '#08457E', borderColor: '#B8C8E6' }}>Login</Button>
            <Button type="primary" onClick={() => navigate('/signup')} style={{ height: 40, borderRadius: 10, background: '#08457E', border: 'none' }}>Get Started Free</Button>
          </Space>
        </nav>

        {/* ── Hero ── */}
        <section style={{ padding: '80px 40px 60px', textAlign: 'center', maxWidth: 1100, margin: '0 auto' }}>
          <Tag style={{ background: '#EEF3FA', color: '#5B92E5', border: 'none', borderRadius: 20, padding: '4px 16px', fontSize: 13, marginBottom: 24 }}>
            🇮🇳 Built for Indian Taxpayers · FY 2025–26
          </Tag>
          <Title style={{ color: '#08457E', fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 800, margin: '0 0 20px', lineHeight: 1.1, letterSpacing: -2 }}>
            Stop Paying More Tax<br />Than You Have To
          </Title>
          <Paragraph style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', maxWidth: 620, margin: '0 auto 36px', color: '#6B7280', lineHeight: 1.7 }}>
            DrainZero analyzes your income, detects tax leakage, and gives you an AI-powered action plan — so you keep more of what you earn.
          </Paragraph>
          <Space size={16} wrap style={{ justifyContent: 'center' }}>
            <Button type="primary" size="large" icon={<ArrowRightOutlined />} onClick={() => navigate('/signup')}
              style={{ height: 56, padding: '0 40px', fontSize: 18, background: '#08457E', border: 'none', boxShadow: '0 8px 20px rgba(8,69,126,0.25)' }}>
              Analyze My Taxes Free
            </Button>
            <Button size="large" onClick={() => navigate('/login')}
              style={{ height: 56, padding: '0 32px', fontSize: 16, color: '#08457E', borderColor: '#08457E', borderWidth: 2 }}>
              Login
            </Button>
          </Space>
          <div style={{ marginTop: 20, fontSize: 13, color: '#9CA3AF' }}>
            No credit card · No CA needed · 100% free to use
          </div>
        </section>

        {/* ── Stats ── */}
        <section style={{ background: '#08457E', padding: '48px 40px' }}>
          <Row gutter={[32, 32]} justify="center" style={{ maxWidth: 900, margin: '0 auto' }}>
            {STATS.map((s, i) => (
              <Col xs={12} md={6} key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 800, color: '#FFFFFF' }}>{s.value}</div>
                <div style={{ fontSize: 14, color: '#CCF1FF', marginTop: 4 }}>{s.label}</div>
              </Col>
            ))}
          </Row>
        </section>

        {/* ── What's Different ── */}
        <section style={{ padding: '80px 40px', background: '#FFFFFF' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <Tag style={{ background: '#EEF3FA', color: '#5B92E5', border: 'none', borderRadius: 20, padding: '4px 16px', marginBottom: 16 }}>Why DrainZero?</Tag>
              <Title level={2} style={{ color: '#08457E', fontWeight: 800, margin: 0 }}>Not Just Another Tax Calculator</Title>
              <Paragraph style={{ color: '#6B7280', fontSize: 16, maxWidth: 600, margin: '12px auto 0' }}>
                ClearTax and TaxBuddy help you file. DrainZero helps you <strong>pay less</strong> — before you file.
              </Paragraph>
            </div>

            <Row gutter={[24, 24]}>
              {/* Comparison */}
              <Col xs={24} md={12}>
                <Card style={{ borderRadius: 20, border: '1px solid #E5E7EB', height: '100%' }}>
                  <Title level={5} style={{ color: '#EF4444', marginBottom: 20 }}>❌ Traditional Tax Tools</Title>
                  {['Enter income → get tax amount (no advice)', 'Generic deductions list — same for everyone', 'No AI — no personalization', 'You figure out what to do next', 'File and forget'].map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 14, color: '#6B7280' }}>
                      <span>✗</span><span>{t}</span>
                    </div>
                  ))}
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card style={{ borderRadius: 20, border: '2px solid #5B92E5', background: '#EFF6FF', height: '100%' }}>
                  <Title level={5} style={{ color: '#08457E', marginBottom: 20 }}>✅ DrainZero</Title>
                  {['Category-aware analysis — Bike gets bike strategies', 'AI that knows YOUR income, deductions, and profile', 'Detects leakage — finds money you didn\'t know you were losing', 'Specific action steps with savings estimates', 'Legal loopholes even CAs miss'].map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #BFDBFE', fontSize: 14, color: '#1E40AF' }}>
                      <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span><span>{t}</span>
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
          </div>
        </section>

        {/* ── Features ── */}
        <section style={{ padding: '80px 40px', background: '#F2F3F4' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <Title level={2} style={{ color: '#08457E', fontWeight: 800 }}>Everything in One Dashboard</Title>
              <Paragraph style={{ color: '#6B7280', fontSize: 16 }}>12 powerful features — all free, all in one place.</Paragraph>
            </div>
            <Row gutter={[24, 24]}>
              {FEATURES.map((f, i) => (
                <Col xs={24} sm={12} lg={6} key={i}>
                  <Card style={{ borderRadius: 20, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', height: '100%', transition: 'transform 0.2s' }}
                    className="feature-card" bodyStyle={{ padding: 28 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, fontSize: 22, marginBottom: 16 }}>
                      {f.icon}
                    </div>
                    <Text strong style={{ color: '#08457E', fontSize: 15, display: 'block', marginBottom: 8 }}>{f.title}</Text>
                    <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section style={{ padding: '80px 40px', background: '#FFFFFF' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <Title level={2} style={{ color: '#08457E', fontWeight: 800 }}>How It Works</Title>
              <Paragraph style={{ color: '#6B7280', fontSize: 16 }}>From login to full tax analysis in under 5 minutes.</Paragraph>
            </div>
            <Row gutter={[24, 24]}>
              {HOW_IT_WORKS.map((s, i) => (
                <Col xs={24} sm={12} md={6} key={i}>
                  <div style={{ textAlign: 'center', padding: '0 12px' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#08457E', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, margin: '0 auto 16px' }}>{s.step}</div>
                    <Text strong style={{ color: '#08457E', fontSize: 16, display: 'block', marginBottom: 8 }}>{s.title}</Text>
                    <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>{s.desc}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </section>

        {/* ── About ── */}
        <section style={{ padding: '80px 40px', background: '#F2F3F4' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <Tag style={{ background: '#EEF3FA', color: '#5B92E5', border: 'none', borderRadius: 20, padding: '4px 16px', marginBottom: 20 }}>About DrainZero</Tag>
            <Title level={2} style={{ color: '#08457E', fontWeight: 800, marginBottom: 24 }}>What is DrainZero?</Title>
            <Paragraph style={{ color: '#6B7280', fontSize: 16, lineHeight: 1.8, marginBottom: 16 }}>
              DrainZero is a <strong>Personal Fiscal Optimization Engine</strong> built for Indian middle-income taxpayers. With the New Tax Regime simplifying deductions, many taxpayers suffer from "benefit blindness" — assuming there's nothing to optimize.
            </Paragraph>
            <Paragraph style={{ color: '#6B7280', fontSize: 16, lineHeight: 1.8, marginBottom: 16 }}>
              DrainZero changes that. It uses <strong>AI (Gemini)</strong>, a <strong>RAG knowledge base</strong> of 63 verified Indian tax law entries, and <strong>semantic search</strong> to give you answers that feel like talking to a CA — but free, instant, and available 24/7.
            </Paragraph>
            <Paragraph style={{ color: '#6B7280', fontSize: 16, lineHeight: 1.8 }}>
              It's not a filing tool. It's a <strong>diagnostic and advisory tool</strong> — helping you understand where your tax money is going and what you can legally do about it.
            </Paragraph>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ padding: '80px 40px', background: '#08457E', textAlign: 'center' }}>
          <Title level={2} style={{ color: '#FFFFFF', fontWeight: 800, marginBottom: 16 }}>Start Optimizing Your Taxes Today</Title>
          <Paragraph style={{ color: '#CCF1FF', fontSize: 18, marginBottom: 36 }}>Free · No CA needed · Takes 5 minutes</Paragraph>
          <Button type="primary" size="large" onClick={() => navigate('/signup')}
            style={{ height: 60, padding: '0 60px', fontSize: 20, background: '#5B92E5', border: 'none', borderRadius: 50, fontWeight: 700, boxShadow: '0 10px 30px rgba(91,146,229,0.4)' }}>
            Get Started Free →
          </Button>
        </section>

        {/* ── Footer ── */}
        <footer style={{ background: '#1F2937', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>
            Drain<span style={{ color: '#5B92E5' }}>Zero</span>
          </div>
          <Text style={{ color: '#6B7280', fontSize: 13 }}>
            Personal Fiscal Optimization Engine · FY 2025–26 · Built for Indian Taxpayers
          </Text>
          <div style={{ marginTop: 8, color: '#4B5563', fontSize: 12 }}>
            Not a substitute for professional CA advice. For informational purposes only.
          </div>
        </footer>

        <style>{`
          .feature-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(8,69,126,0.1) !important; }
          @media (max-width: 768px) {
            section { padding: 48px 20px !important; }
            nav { padding: 0 20px !important; }
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
};

export default LandingPage;
