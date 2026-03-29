import React from 'react';
import {
  Layout, Typography, Row, Col, Space, Button,
  ConfigProvider, Tag, Tooltip, message
} from 'antd';
import {
  ArrowRightOutlined, SearchOutlined, SwapOutlined,
  LineChartOutlined, CheckCircleOutlined, WalletOutlined,
  DownloadOutlined, LogoutOutlined, SyncOutlined, LockFilled,
  BulbOutlined, FileTextOutlined, ExperimentOutlined,
  BookOutlined, ClockCircleOutlined, StarOutlined, GiftOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, userProfile } = useAuth();

  const { category, subcategory, ownership, formData } = location.state || {
    category: 'General', subcategory: 'Analysis', ownership: '', formData: {}
  };

  const featureCards = [
    { id: 'regime', title: 'Regime Comparison', description: 'Compare Old vs New tax regime and show the best option.', icon: <SwapOutlined />, iconColor: '#5B92E5', path: '/feature/regime-comparison' },
    { id: 'leakage', title: 'Tax Leakage Detection', description: 'Identify missed deductions and hidden tax-saving opportunities.', icon: <SearchOutlined />, iconColor: '#F59E0B', path: '/feature/tax-leakage' },
    { id: 'health', title: 'Tax Health Score', description: 'Show overall tax optimization score.', icon: <LineChartOutlined />, iconColor: '#10B981', path: '/feature/tax-health' },
    { id: 'recommendations', title: 'Actionable Recommendations', description: 'Provide clear steps to reduce tax.', icon: <CheckCircleOutlined />, iconColor: '#3B82F6', path: '/feature/recommendations' },
    { id: 'salary', title: 'Salary Structure Analysis', description: 'Analyze salary structure for better tax efficiency.', icon: <WalletOutlined />, iconColor: '#8B5CF6', path: '/feature/salary-analysis' },
    { id: 'loopholes', title: 'Legal Tax Loopholes', description: '14 legally bulletproof strategies that even CAs miss.', icon: <BulbOutlined />, iconColor: '#D97706', path: '/feature/loopholes', badge: 'NEW' },
    { id: 'documents', title: 'Document Upload', description: 'Upload Form 16 or AIS — AI reads and fills your profile.', icon: <FileTextOutlined />, iconColor: '#084C8D', path: '/feature/documents', badge: 'NEW' },
    { id: 'whatif', title: 'What-If Simulator', description: 'Move sliders to instantly see how deductions affect tax.', icon: <ExperimentOutlined />, iconColor: '#059669', path: '/feature/what-if', badge: 'NEW' },
    { id: 'deductions', title: 'Deductions Explorer', description: 'All 50+ tax sections with your personal claim status.', icon: <BookOutlined />, iconColor: '#0891B2', path: '/feature/deductions', badge: 'NEW' },
    { id: 'deadlines', title: 'Deadline Reminders', description: 'Advance tax dates, ITR filing and investment cutoffs.', icon: <ClockCircleOutlined />, iconColor: '#EF4444', path: '/feature/deadlines', badge: 'NEW' },
    { id: 'investment-guide', title: 'Investment Guide', description: 'ULIP traps, SGB vs Gold, Crypto reality, Buyback rules and LRS.', icon: <StarOutlined />, iconColor: '#D97706', path: '/feature/investment-guide', badge: 'NEW' },
    { id: 'benefits', title: 'Benefits Explorer', description: 'Scholarships, state-specific and profession-based tax benefits.', icon: <GiftOutlined />, iconColor: '#059669', path: '/feature/benefits', badge: 'NEW' },
  ];

  const handleCardClick = (path) => {
    navigate(path, { state: { category, subcategory, ownership, formData } });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleDownloadReport = () => {
    navigate('/feature/report', {
      state: { formData, backendResult: location.state?.backendResult, category, subcategory, ownership }
    });
  };

  return (
    <ConfigProvider theme={{
      token: { colorPrimary: '#5B92E5', borderRadius: 20, fontFamily: "'Outfit', sans-serif" },
    }}>
      <Layout style={{ minHeight: '100vh', background: '#F2F3F4' }}>
          <Navbar />
          <div style={{ padding: '32px 24px' }}>
        <Content style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '24px 16px' }}>

          {/* Header */}
          <div style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <Title level={1} style={{ color: '#08457E', margin: 0, fontWeight: 800 }}>Strategy Dashboard</Title>
              <Paragraph style={{ margin: '10px 0 0', color: '#6B7280', fontSize: 16 }}>Welcome back, {(userProfile?.name || userProfile?.full_name || user?.email?.split('@')[0] || 'User')}</Paragraph>
              <Space size={12} style={{ marginTop: 8 }}>
                {category && <Tag color="blue" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 100, fontWeight: 600 }}>{category}</Tag>}
                {subcategory && <Tag color="cyan" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 100, fontWeight: 600 }}>{subcategory}</Tag>}
                {ownership && <Tag color="purple" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 100, fontWeight: 600 }}>{ownership}</Tag>}
              </Space>
            </div>
            <Space wrap>
              <Button type="primary" icon={<SyncOutlined />} onClick={() => navigate('/category-selection')}
                style={{ height: 48, borderRadius: 12 }}>
                New Analysis
              </Button>
              <Button icon={<LogoutOutlined />} onClick={handleLogout}
                style={{ height: 48, borderRadius: 12, color: '#EF4444', borderColor: '#FCA5A5' }}>
                Logout
              </Button>
            </Space>
          </div>

          {/* Feature Cards */}
          <div style={{ marginBottom: 60 }}>
            <Title level={4} style={{ color: '#08457E', marginBottom: 24, opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              Detailed Analysis Features
            </Title>
            <Row gutter={[24, 24]}>
              {featureCards.map((feat) => (
                <Col xs={24} md={12} lg={8} key={feat.id}>
                  <div
                    onClick={() => handleCardClick(feat.path)}
                    className="feature-card"
                    style={{
                      background: '#FFFFFF', borderRadius: 24, padding: 40, cursor: 'pointer',
                      height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.03)', transition: 'all 0.3s ease', position: 'relative'
                    }}
                  >
                    {feat.badge && (
                      <span style={{
                        position: 'absolute', top: 16, right: 16,
                        background: '#10B981', color: '#FFFFFF',
                        fontSize: 10, padding: '2px 10px', borderRadius: 20, fontWeight: 700, letterSpacing: 1
                      }}>
                        {feat.badge}
                      </span>
                    )}
                    <div>
                      <div style={{ width: 56, height: 56, background: `${feat.iconColor}15`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: feat.iconColor, marginBottom: 28, fontSize: 24 }}>
                        {feat.icon}
                      </div>
                      <Title level={4} style={{ color: '#08457E', margin: '0 0 16px 0', fontWeight: 700 }}>{feat.title}</Title>
                      <Paragraph style={{ color: '#6B7280', fontSize: 15, lineHeight: 1.6, margin: 0 }}>{feat.description}</Paragraph>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                      <Tooltip title="View Detailed Analysis">
                        <Button type="text" icon={<ArrowRightOutlined />} style={{ color: '#5B92E5', fontSize: 20 }} />
                      </Tooltip>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderRadius: 24, background: '#08457E', padding: '40px 24px', width: '100%', boxShadow: '0 20px 40px rgba(8,69,126,0.15)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <Title level={3} style={{ color: '#FFFFFF', margin: 0, fontWeight: 700, textAlign: 'center' }}>Ready to Optimize?</Title>
                <Paragraph style={{ color: '#CCF1FF', fontSize: 15, maxWidth: 500, margin: 0, textAlign: 'center' }}>
                  Get the complete breakdown of your tax strategy across all 10 analysis features.
                </Paragraph>
                <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadReport}
                  style={{ height: 52, width: '100%', maxWidth: 360, borderRadius: 14, fontSize: 16, background: '#5B92E5', border: 'none', fontWeight: 700, boxShadow: '0 8px 20px rgba(91,146,229,0.3)' }}>
                  Download Analysis Report
                </Button>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div style={{ marginTop: 80, textAlign: 'center', marginBottom: 40 }}>
            <Space style={{ background: '#FFFFFF', padding: '12px 20px', borderRadius: 50, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', flexWrap: 'wrap', justifyContent: 'center' }}>
              <LockFilled style={{ color: '#10B981', fontSize: 20 }} />
              <Text style={{ fontWeight: 600, color: '#08457E', fontSize: 15 }}>
                Your data is secure and private. Analysis is visible only to you.
              </Text>
            </Space>
          </div>

        </Content>
      </div>
</Layout>

      <style>{`
        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(8,69,126,0.08) !important;
          background: #F8FAFF !important;
        }
      `}</style>
    </ConfigProvider>
  );
};

export default Dashboard;
