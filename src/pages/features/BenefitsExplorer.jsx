import React, { useState } from 'react';
import {
  Layout, Typography, Card, Row, Col, Space, Button,
  Tag, Input, ConfigProvider, List, Badge
} from 'antd';
import {
  ArrowLeftOutlined, SearchOutlined, CheckCircleFilled,
  GiftOutlined, BankOutlined, UserOutlined, HomeOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import TaxAssistantChatbot from '../../components/TaxAssistantChatbot';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const BENEFITS = [
  // Scholarships
  { id: 1,  category: 'Scholarship', title: 'PM Scholarship for Central Armed Police Forces', eligibility: 'Wards of CAPF/RPF personnel', amount: '₹2,500–₹3,000/month', section: '10(16)', taxStatus: 'Fully Exempt', state: 'All India' },
  { id: 2,  category: 'Scholarship', title: 'National Scholarship Portal (NSP) Central Schemes', eligibility: 'Minority, SC/ST, OBC students with family income < ₹2.5L', amount: 'Up to ₹20,000/year', section: '10(16)', taxStatus: 'Fully Exempt', state: 'All India' },
  { id: 3,  category: 'Scholarship', title: 'AICTE Pragati Scholarship (Girls)', eligibility: 'Girl students in AICTE-approved technical courses', amount: '₹50,000/year + ₹2,000 contingency', section: '10(16)', taxStatus: 'Fully Exempt', state: 'All India' },
  { id: 4,  category: 'Scholarship', title: 'INSPIRE Scholarship (Science)', eligibility: 'Top 1% in Class 12 pursuing natural sciences', amount: '₹80,000/year', section: '10(16)', taxStatus: 'Fully Exempt', state: 'All India' },
  { id: 5,  category: 'Scholarship', title: 'Ishan Uday (NE States)', eligibility: 'Students from NE states in non-technical courses', amount: '₹5,400–₹7,800/month', section: '10(16)', taxStatus: 'Fully Exempt', state: 'NE States' },
  { id: 6,  category: 'Scholarship', title: 'Post-Matric Scholarship SC/ST/OBC', eligibility: 'SC/ST/OBC students with family income below threshold', amount: 'Tuition + maintenance', section: '10(16)', taxStatus: 'Fully Exempt', state: 'All India' },

  // State-Specific
  { id: 7,  category: 'State Benefit', title: 'Maharashtra: Stamp Duty Concession for Women', eligibility: 'Property registered in woman\'s name', amount: '1% less stamp duty vs male buyer', section: 'State Rule', taxStatus: 'Cost Saving', state: 'Maharashtra' },
  { id: 8,  category: 'State Benefit', title: 'Delhi: Women Car Loan — Lower Interest', eligibility: 'Women borrowers for car loans', amount: '0.25–0.5% lower interest rate', section: 'Bank Policy', taxStatus: 'Cost Saving', state: 'Delhi' },
  { id: 9,  category: 'State Benefit', title: 'Karnataka: Stamp Duty Exemption (First-time buyers)', eligibility: 'Property up to ₹45L, first-time buyer', amount: 'Stamp duty reduction', section: 'State Rule', taxStatus: 'Cost Saving', state: 'Karnataka' },
  { id: 10, category: 'State Benefit', title: 'Gujarat: MSME Subsidy on Plant & Machinery', eligibility: 'New MSME units in Gujarat', amount: '25% capital subsidy', section: 'State Scheme', taxStatus: 'Subsidy', state: 'Gujarat' },
  { id: 11, category: 'State Benefit', title: 'Tamil Nadu: Amma Cement / Amma Salt Scheme', eligibility: 'BPL families in TN', amount: 'Subsidised essential goods', section: 'State Scheme', taxStatus: 'Subsidy', state: 'Tamil Nadu' },
  { id: 12, category: 'State Benefit', title: 'Telangana: Rythu Bandhu (Farmer Scheme)', eligibility: 'Farmers owning agricultural land in Telangana', amount: '₹10,000/acre/year', section: 'State Scheme', taxStatus: 'Exempt', state: 'Telangana' },

  // Profession-Specific
  { id: 13, category: 'Profession', title: 'Journalists: Gratuity Exemption', eligibility: 'Working journalists under Working Journalists Act', amount: '3 months salary per year of service', section: '10(10)', taxStatus: 'Fully Exempt', state: 'All India' },
  { id: 14, category: 'Profession', title: 'Authors: Royalty Deduction 80QQB', eligibility: 'Indian author of books (literary/artistic/scientific)', amount: 'Up to ₹3,00,000/year deduction', section: '80QQB', taxStatus: 'Deduction', state: 'All India' },
  { id: 15, category: 'Profession', title: 'Patent Holders: Royalty Deduction 80RRB', eligibility: 'Indian patent holder registered after 01-04-2003', amount: 'Up to ₹3,00,000/year deduction', section: '80RRB', taxStatus: 'Deduction', state: 'All India' },
  { id: 16, category: 'Profession', title: 'Teachers: Scholarships & Awards Exempt', eligibility: 'Teachers receiving national/state awards', amount: 'Award amount fully exempt', section: '10(17A)', taxStatus: 'Fully Exempt', state: 'All India' },
  { id: 17, category: 'Profession', title: 'Armed Forces: Disability Pension', eligibility: 'Disabled military personnel (Army/Navy/CRPF/BSF)', amount: 'Full disability pension exempt', section: '10(18)', taxStatus: 'Fully Exempt', state: 'All India' },
  { id: 18, category: 'Profession', title: 'Gallantry Award Winners: All Income Exempt', eligibility: 'Param Vir Chakra / Ashoka Chakra awardees', amount: 'All income including pension exempt', section: '10(18)', taxStatus: 'Fully Exempt', state: 'All India' },
  { id: 19, category: 'Profession', title: 'Startup Founders: ESOP Tax Deferral', eligibility: 'Employees of DPIIT-registered startups', amount: 'Tax deferred 5 years or till sale', section: '192(1C)', taxStatus: 'Deferral', state: 'All India' },
  { id: 20, category: 'Profession', title: 'NRI Returning: RNOR Status Window', eligibility: 'NRI for 9+ of last 10 years returning to India', amount: 'Foreign income not taxed for 2–3 years', section: 'Sec 6', taxStatus: 'Exemption Window', state: 'All India' },
];

const CATEGORY_COLORS = {
  'Scholarship' : { color: '#059669', bg: '#F0FDF4' },
  'State Benefit': { color: '#5B92E5', bg: '#EFF6FF' },
  'Profession'  : { color: '#7C3AED', bg: '#F5F3FF' },
  'Student'     : { color: '#0891B2', bg: '#EFF6FF' },
};

const BenefitsExplorer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch]       = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeState, setActiveState]     = useState('All');

  const categories = ['All', 'Scholarship', 'State Benefit', 'Profession', 'Student'];
  const states = ['All', 'All India', 'Maharashtra', 'Delhi', 'Karnataka', 'Gujarat', 'Tamil Nadu', 'Telangana', 'NE States'];

  const filtered = BENEFITS.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.eligibility.toLowerCase().includes(search.toLowerCase());
    const matchCat   = activeCategory === 'All' || b.category === activeCategory;
    const matchState = activeState === 'All' || b.state === activeState;
    return matchSearch && matchCat && matchState;
  });

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#5B92E5', borderRadius: 16, fontFamily: "'Outfit', sans-serif" } }}>
      <Layout style={{ minHeight: '100vh', background: '#F2F3F4' }}>
          <Navbar />
          <div style={{ padding: '32px 24px' }}>
        <Content style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>

          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard', { state: location.state })}
            style={{ marginBottom: 24, borderRadius: 12, fontWeight: 600, color: '#08457E' }}>
            Back to Dashboard
          </Button>

          <div style={{ marginBottom: 40 }}>
            <Title level={2} style={{ color: '#08457E', fontWeight: 800, margin: 0 }}>Benefits Explorer</Title>
            <Paragraph style={{ color: '#6B7280', fontSize: 16, marginTop: 8 }}>
              Scholarships, state-specific benefits, and profession-specific tax advantages — all verified for FY 2025–26.
            </Paragraph>
          </div>

          {/* Stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            {[
              { label: 'Total Benefits', value: BENEFITS.length, color: '#08457E', icon: <GiftOutlined /> },
              { label: 'Scholarships', value: BENEFITS.filter(b => b.category === 'Scholarship').length, color: '#059669', icon: <UserOutlined /> },
              { label: 'State Benefits', value: BENEFITS.filter(b => b.category === 'State Benefit').length, color: '#5B92E5', icon: <HomeOutlined /> },
              { label: 'Profession', value: BENEFITS.filter(b => b.category === 'Profession').length, color: '#7C3AED', icon: <BankOutlined /> },
              { label: 'Student', value: BENEFITS.filter(b => b.category === 'Student').length, color: '#0891B2', icon: <UserOutlined /> },
            ].map((s, i) => (
              <Col xs={12} md={6} key={i}>
                <Card style={{ borderRadius: 20, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, color: s.color, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{s.label}</div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Filters */}
          <Space direction="vertical" style={{ width: '100%', marginBottom: 28 }} size={12}>
            <Input
              size="large"
              prefix={<SearchOutlined style={{ color: '#6B7280' }} />}
              placeholder="Search benefits, eligibility..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ borderRadius: 12, maxWidth: 400 }}
            />
            <Space wrap>
              {categories.map(c => (
                <Tag key={c} onClick={() => setActiveCategory(c)} style={{
                  cursor: 'pointer', borderRadius: 20, padding: '4px 16px', fontSize: 13,
                  background: activeCategory === c ? '#08457E' : '#FFFFFF',
                  color: activeCategory === c ? '#FFFFFF' : '#08457E',
                  border: `1px solid ${activeCategory === c ? '#08457E' : '#B8C8E6'}`,
                }}>{c}</Tag>
              ))}
              <div style={{ width: 1, height: 24, background: '#B8C8E6', margin: '0 8px' }} />
              {states.map(s => (
                <Tag key={s} onClick={() => setActiveState(s)} style={{
                  cursor: 'pointer', borderRadius: 20, padding: '4px 14px', fontSize: 12,
                  background: activeState === s ? '#5B92E5' : '#FFFFFF',
                  color: activeState === s ? '#FFFFFF' : '#6B7280',
                  border: `1px solid ${activeState === s ? '#5B92E5' : '#B8C8E6'}`,
                }}>{s}</Tag>
              ))}
            </Space>
          </Space>

          {/* Benefits List */}
          <Row gutter={[20, 20]}>
            {filtered.map(b => {
              const cc = CATEGORY_COLORS[b.category];
              return (
                <Col xs={24} md={12} key={b.id}>
                  <Card style={{ borderRadius: 20, border: '1px solid #B8C8E6', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', height: '100%' }}>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Tag style={{ borderRadius: 20, background: cc.bg, color: cc.color, border: 'none', fontSize: 11, fontWeight: 600 }}>
                          {b.category}
                        </Tag>
                        <Space size={6}>
                          {b.state !== 'All India' && (
                            <Tag style={{ borderRadius: 20, background: '#F2F3F4', color: '#6B7280', border: 'none', fontSize: 10 }}>{b.state}</Tag>
                          )}
                          <Tag style={{ borderRadius: 20, background: '#F0FDF4', color: '#059669', border: 'none', fontSize: 10 }}>{b.taxStatus}</Tag>
                        </Space>
                      </div>

                      <Text strong style={{ color: '#08457E', fontSize: 15, lineHeight: 1.4, display: 'block' }}>{b.title}</Text>

                      <div style={{ background: '#F2F3F4', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Eligibility</div>
                        <Text style={{ fontSize: 13, color: '#1F2937' }}>{b.eligibility}</Text>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>Amount / Benefit</div>
                          <Text strong style={{ color: '#059669', fontSize: 14 }}>{b.amount}</Text>
                        </div>
                        <Tag style={{ borderRadius: 8, background: '#EEF3FA', color: '#08457E', border: 'none', fontSize: 11, fontWeight: 600 }}>
                          {b.section}
                        </Tag>
                      </div>
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
              No benefits found. Try a different search or filter.
            </div>
          )}

          <div style={{ marginTop: 40 }}>
            <TaxAssistantChatbot />
          </div>

        </Content>
      </div></Layout>
    </ConfigProvider>
  );
};

export default BenefitsExplorer;
