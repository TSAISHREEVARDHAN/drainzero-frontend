import React from 'react';
import {
  Layout, Typography, Row, Col, Space, Button,
  ConfigProvider, Tag, Card, Alert, Statistic
} from 'antd';
import {
  ArrowRightOutlined, SearchOutlined, SwapOutlined,
  LineChartOutlined, CheckCircleOutlined, WalletOutlined,
  DownloadOutlined, LogoutOutlined, SyncOutlined, LockFilled,
  BulbOutlined, FileTextOutlined, ExperimentOutlined,
  BookOutlined, ClockCircleOutlined, StarOutlined, GiftOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getLastTaxResult } from '../services/profileService';
import { useState, useEffect } from 'react';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const state = location.state || {};
  const { category, subcategory, ownership, formData } = state;

  // ── Load result: prefer navigation state, fallback to DB ──────────────────
  const [dbResult, setDbResult] = useState(null);
  const [dbLoading, setDbLoading] = useState(!state.backendResult);

  useEffect(() => {
    if (state.backendResult) { setDbLoading(false); return; }
    if (!user) { setDbLoading(false); return; }
    getLastTaxResult(user.id).then(r => { setDbResult(r); setDbLoading(false); }).catch(() => setDbLoading(false));
  }, [user]);

  const backendResult    = state.backendResult || dbResult;
  const hasResult        = backendResult?.success && backendResult?.oldRegime && backendResult?.newRegime;
  const oldTax           = hasResult ? (backendResult.oldRegime?.totalTax  || 0) : null;
  const newTax           = hasResult ? (backendResult.newRegime?.totalTax  || 0) : null;
  const savings          = hasResult ? (backendResult.saving ?? Math.abs((oldTax || 0) - (newTax || 0))) : null;
  const regime           = hasResult ? backendResult.recommendedRegime : null;
  const newRegimeZeroReason = hasResult ? backendResult.validation?.newRegimeZeroReason : null;
  const score     = hasResult ? backendResult.healthScore : null;
  const leakage   = hasResult ? (backendResult.totalLeakage || 0) : null;

  const fmt = n => Number(n || 0).toLocaleString('en-IN');

  const featureCards = [
    { id: 'regime',        title: 'Regime Comparison',           description: 'Compare Old vs New tax regime and find the best option.',        icon: <SwapOutlined />,         iconColor: '#5B92E5', path: '/feature/regime-comparison' },
    { id: 'leakage',       title: 'Missed Deductions Finder',    description: 'Find deductions you missed and opportunities to reduce your tax.', icon: <SearchOutlined />,       iconColor: '#F59E0B', path: '/feature/tax-leakage' },
    { id: 'health',        title: 'Tax Health Score',            description: 'Your overall tax optimization score across all parameters.',      icon: <LineChartOutlined />,    iconColor: '#10B981', path: '/feature/tax-health' },
    { id: 'recommendations', title: 'Actionable Recommendations', description: 'Clear personalised steps to legally reduce your tax.',           icon: <CheckCircleOutlined />,  iconColor: '#3B82F6', path: '/feature/recommendations' },
    { id: 'salary',        title: 'Salary Structure Analysis',   description: 'Optimise your salary components for better tax efficiency.',      icon: <WalletOutlined />,       iconColor: '#8B5CF6', path: '/feature/salary-analysis' },
    { id: 'loopholes',     title: 'Legal Tax Loopholes',         description: '15 legally bulletproof strategies that even CAs miss.',           icon: <BulbOutlined />,         iconColor: '#D97706', path: '/feature/loopholes',        badge: 'NEW' },
    { id: 'documents',     title: 'Document Upload',             description: 'Upload Form 16 or AIS — AI reads and fills your profile.',        icon: <FileTextOutlined />,     iconColor: '#084C8D', path: '/feature/documents',        badge: 'NEW' },
    { id: 'whatif',        title: 'What-If Simulator',           description: 'Move sliders to instantly see how deductions affect your tax.',    icon: <ExperimentOutlined />,   iconColor: '#059669', path: '/feature/what-if',          badge: 'NEW' },
    { id: 'deductions',    title: 'Deductions Explorer',         description: 'All 50+ tax sections with your personal claim status.',           icon: <BookOutlined />,         iconColor: '#0891B2', path: '/feature/deductions',       badge: 'NEW' },
    { id: 'deadlines',     title: 'Deadline Reminders',          description: 'Advance tax dates, ITR filing and investment cutoffs.',            icon: <ClockCircleOutlined />,  iconColor: '#EF4444', path: '/feature/deadlines',        badge: 'NEW' },
    { id: 'investment-guide', title: 'Investment Guide',         description: 'ULIP traps, SGB vs Gold, Crypto reality, Buyback and LRS.',       icon: <StarOutlined />,         iconColor: '#D97706', path: '/feature/investment-guide', badge: 'NEW' },
    { id: 'benefits',      title: 'Benefits Explorer',           description: 'Scholarships, state-specific and profession-based benefits.',      icon: <GiftOutlined />,         iconColor: '#059669', path: '/feature/benefits',         badge: 'NEW' },
  ];

  const handleCardClick = (path) => {
    navigate(path, { state: { category, subcategory, ownership, formData, backendResult } });
  };

  // FIX: clean logout — await, then navigate via React Router (no window.location.replace)
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#5B92E5', borderRadius: 20, fontFamily: "'Outfit', sans-serif" } }}>
      <Layout style={{ minHeight: '100vh', background: '#F2F3F4' }}>
        <Navbar />
        <div style={{ padding: '32px 24px' }}>
          <Content style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>

            {/* Header */}
            <div style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <Title level={1} style={{ color: '#08457E', margin: 0, fontWeight: 800 }}>Strategy Dashboard</Title>
                <Space size={10} style={{ marginTop: 8, flexWrap: 'wrap' }}>
                  {category    && <Tag color="blue"   style={{ fontSize: 13, padding: '4px 12px', borderRadius: 100, fontWeight: 600 }}>{category}</Tag>}
                  {subcategory && <Tag color="cyan"   style={{ fontSize: 13, padding: '4px 12px', borderRadius: 100, fontWeight: 600 }}>{subcategory}</Tag>}
                  {ownership   && <Tag color="purple" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 100, fontWeight: 600 }}>{ownership}</Tag>}
                </Space>
              </div>
              <Space wrap>
                <Button type="primary" icon={<SyncOutlined />} onClick={() => navigate('/category-selection')}
                  style={{ height: 48, borderRadius: 12 }}>
                  New Analysis
                </Button>
                <Button icon={<LogoutOutlined />} onClick={handleLogout}
                  style={{ height: 48, borderRadius: 12, color: '#EF4444', borderColor: '#FCA5A5', fontWeight: 600 }}>
                  Logout
                </Button>
              </Space>
            </div>

            {/* ── Analysis Summary — real data only ── */}
            {hasResult ? (
              <div style={{ marginBottom: 40 }}>
                <Title level={4} style={{ color: '#08457E', marginBottom: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 }}>
                  Your Tax Analysis Results
                </Title>
                <Row gutter={[20, 20]}>
                  <Col xs={24} sm={12} md={6}>
                    <Card style={{ borderRadius: 20, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                      <Text style={{ display: 'block', fontSize: 12, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Old Regime Tax</Text>
                      <div style={{ fontSize: 28, fontWeight: 800, color: '#EF4444' }}>₹{fmt(oldTax)}</div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card style={{ borderRadius: 20, border: newTax === 0 ? '2px solid #10B981' : 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', background: newTax === 0 ? '#F0FDF4' : '#FFFFFF', textAlign: 'center' }}>
                      <Text style={{ display: 'block', fontSize: 12, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>New Regime Tax</Text>
                      <div style={{ fontSize: 28, fontWeight: 800, color: newTax === 0 ? '#10B981' : '#3B82F6' }}>₹{fmt(newTax)}</div>
                      {newTax === 0 && (
                        <div>
                          <Text style={{ fontSize: 11, color: '#059669', display: 'block', marginTop: 4, fontWeight: 600 }}>
                            87A Rebate Applied ✓
                          </Text>
                          {newRegimeZeroReason && (
                            <Text style={{ fontSize: 10, color: '#6B7280', display: 'block', marginTop: 2 }}>
                              {newRegimeZeroReason}
                            </Text>
                          )}
                        </div>
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card style={{ borderRadius: 20, border: 'none', boxShadow: '0 8px 24px rgba(91,146,229,0.15)', background: '#EEF3FA', textAlign: 'center' }}>
                      <Text style={{ display: 'block', fontSize: 12, color: '#5B92E5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>You Can Save</Text>
                      <div style={{ fontSize: 28, fontWeight: 800, color: '#10B981' }}>₹{fmt(savings)}</div>
                      <Text style={{ fontSize: 12, color: '#059669', marginTop: 4, display: 'block' }}>
                        Best: {regime === 'old' ? 'Old Regime' : 'New Regime'}
                      </Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card style={{ borderRadius: 20, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                      <Text style={{ display: 'block', fontSize: 12, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Health Score</Text>
                      <div style={{ fontSize: 28, fontWeight: 800, color: score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444' }}>
                        {score !== null ? `${score}/100` : '—'}
                      </div>
                      {leakage > 0 && <Text style={{ fontSize: 12, color: '#EF4444', display: 'block', marginTop: 4 }}>Leakage: ₹{fmt(leakage)}</Text>}
                    </Card>
                  </Col>
                </Row>
              </div>
            ) : (
              <Alert type="info" showIcon
                message="No analysis results yet"
                description="Run an analysis first — your results will appear here."
                style={{ borderRadius: 16, marginBottom: 32 }}
                action={
                  <Button size="small" type="primary" onClick={() => navigate('/category-selection')} style={{ borderRadius: 8 }}>
                    Start Analysis
                  </Button>
                }
              />
            )}

            {/* Feature Cards */}
            <div style={{ marginBottom: 60 }}>
              <Title level={4} style={{ color: '#08457E', marginBottom: 24, opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                Detailed Analysis Features
              </Title>
              <Row gutter={[24, 24]}>
                {featureCards.map(feat => (
                  <Col xs={24} md={12} lg={8} key={feat.id}>
                    <div onClick={() => handleCardClick(feat.path)} className="feature-card"
                      style={{ background: '#FFFFFF', borderRadius: 24, padding: 40, cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', transition: 'all 0.3s ease', position: 'relative' }}>
                      {feat.badge && (
                        <span style={{ position: 'absolute', top: 16, right: 16, background: '#10B981', color: '#FFF', fontSize: 10, padding: '2px 10px', borderRadius: 20, fontWeight: 700, letterSpacing: 1 }}>
                          {feat.badge}
                        </span>
                      )}
                      <div>
                        <div style={{ width: 56, height: 56, background: `${feat.iconColor}15`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: feat.iconColor, marginBottom: 28, fontSize: 24 }}>
                          {feat.icon}
                        </div>
                        <Title level={4} style={{ color: '#08457E', margin: '0 0 16px', fontWeight: 700 }}>{feat.title}</Title>
                        <Paragraph style={{ color: '#6B7280', fontSize: 15, lineHeight: 1.6, margin: 0 }}>{feat.description}</Paragraph>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                        <Button type="text" icon={<ArrowRightOutlined />} style={{ color: '#5B92E5', fontSize: 20 }} />
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>

            {/* CTA */}
            <div style={{ borderRadius: 24, background: '#08457E', padding: '40px 24px', textAlign: 'center', boxShadow: '0 20px 40px rgba(8,69,126,0.15)', marginBottom: 60 }}>
              <Title level={3} style={{ color: '#FFFFFF', margin: '0 0 12px', fontWeight: 700 }}>Ready to Optimize?</Title>
              <Paragraph style={{ color: '#CCF1FF', fontSize: 15, maxWidth: 500, margin: '0 auto 24px' }}>
                Get the complete breakdown of your tax strategy across all analysis features.
              </Paragraph>
              <Button type="primary" icon={<DownloadOutlined />}
                onClick={() => navigate('/feature/report', { state: { formData, backendResult, category, subcategory, ownership } })}
                style={{ height: 52, minWidth: 260, borderRadius: 14, fontSize: 16, background: '#5B92E5', border: 'none', fontWeight: 700, boxShadow: '0 8px 20px rgba(91,146,229,0.3)' }}>
                Download Analysis Report
              </Button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <Space style={{ background: '#FFFFFF', padding: '12px 20px', borderRadius: 50, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', flexWrap: 'wrap', justifyContent: 'center' }}>
                <LockFilled style={{ color: '#10B981', fontSize: 20 }} />
                <Text style={{ fontWeight: 600, color: '#08457E', fontSize: 15 }}>Your data is secure and private. Analysis is visible only to you.</Text>
              </Space>
            </div>
          </Content>
        </div>
      </Layout>

      <style>{`
        .feature-card:hover {
          transform: translateY(-10px) !important;
          box-shadow: 0 20px 40px rgba(8,69,126,0.08) !important;
          background: #F8FAFF !important;
        }
      `}</style>
    </ConfigProvider>
  );
};

export default Dashboard;
