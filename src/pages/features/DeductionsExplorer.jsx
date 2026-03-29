import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import {
  Layout, Typography, Card, Table, Tag, Input,
  Space, Button, ConfigProvider, Select, Badge
} from 'antd';
import { ArrowLeftOutlined, SearchOutlined, CheckCircleFilled, CloseCircleFilled, MinusCircleFilled } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const ALL_DEDUCTIONS = [
  { section: '80C', name: 'PPF / EPF / ELSS / LIC / NSC / Home Loan Principal', limit: '₹1,50,000', category: 'Investment', regime: 'Old Only' },
  { section: '80CCC', name: 'Pension Fund Contribution (LIC/Annuity)', limit: '₹1,50,000 (within 80C)', category: 'Retirement', regime: 'Old Only' },
  { section: '80CCD(1)', name: 'Employee NPS Contribution', limit: '₹1,50,000 (within 80C)', category: 'Retirement', regime: 'Old Only' },
  { section: '80CCD(1B)', name: 'Additional NPS Contribution (extra)', limit: '₹50,000', category: 'Retirement', regime: 'Old Only' },
  { section: '80CCD(2)', name: 'Employer NPS Contribution', limit: '10% of Basic', category: 'Salary', regime: 'Both' },
  { section: '80D', name: 'Health Insurance Premium (Self + Family)', limit: '₹25,000 / ₹50,000 (senior)', category: 'Health', regime: 'Old Only' },
  { section: '80D', name: 'Parents Health Insurance', limit: '₹25,000 / ₹50,000 (senior)', category: 'Health', regime: 'Old Only' },
  { section: '80DD', name: 'Disabled Dependent Medical Expenses', limit: '₹75,000 / ₹1,25,000 (severe)', category: 'Health', regime: 'Old Only' },
  { section: '80DDB', name: 'Treatment of Specified Diseases', limit: '₹40,000 / ₹1,00,000 (senior)', category: 'Health', regime: 'Old Only' },
  { section: '80E', name: 'Education Loan Interest', limit: 'Unlimited (8 years)', category: 'Education', regime: 'Old Only' },
  { section: '80EE', name: 'First-time Home Loan Interest (upto Mar 2022)', limit: '₹50,000', category: 'Property', regime: 'Old Only' },
  { section: '80EEA', name: 'Affordable Housing Loan Interest', limit: '₹1,50,000', category: 'Property', regime: 'Old Only' },
  { section: '80EEB', name: 'Electric Vehicle Loan Interest', limit: '₹1,50,000', category: 'Vehicle', regime: 'Both' },
  { section: '80G', name: 'Donations to Approved Funds / Charities', limit: '50% or 100% of donation', category: 'Donation', regime: 'Old Only' },
  { section: '80GG', name: 'Rent Paid (no HRA in salary)', limit: '₹60,000/yr', category: 'Rent', regime: 'Old Only' },
  { section: '80GGA', name: 'Scientific Research Donations', limit: '100% of donation', category: 'Donation', regime: 'Old Only' },
  { section: '80GGC', name: 'Donations to Political Parties', limit: 'Amount donated', category: 'Donation', regime: 'Old Only' },
  { section: '80IA', name: 'Infrastructure Development Business', limit: '100% of profits', category: 'Business', regime: 'Old Only' },
  { section: '80JJAA', name: 'New Employee Wages (business)', limit: '30% of wages (3 yrs)', category: 'Business', regime: 'Old Only' },
  { section: '80P', name: 'Co-operative Society Income', limit: 'Various limits', category: 'Business', regime: 'Old Only' },
  { section: '80QQB', name: 'Royalty from Books (Author)', limit: '₹3,00,000', category: 'Profession', regime: 'Old Only' },
  { section: '80RRB', name: 'Patent Royalty Income', limit: '₹3,00,000', category: 'Profession', regime: 'Old Only' },
  { section: '80TTA', name: 'Savings Account Interest', limit: '₹10,000', category: 'Interest', regime: 'Old Only' },
  { section: '80TTB', name: 'Interest Income (Senior Citizens)', limit: '₹50,000', category: 'Interest', regime: 'Old Only' },
  { section: '80U', name: 'Self with Disability', limit: '₹75,000 / ₹1,25,000 (severe)', category: 'Health', regime: 'Old Only' },
  { section: '24(b)', name: 'Home Loan Interest (Self-Occupied)', limit: '₹2,00,000', category: 'Property', regime: 'Old Only' },
  { section: '24(b)', name: 'Home Loan Interest (Let-Out)', limit: 'Unlimited (capped set-off)', category: 'Property', regime: 'Old Only' },
  { section: '10(13A)', name: 'HRA Exemption', limit: 'Least of 3 formulas', category: 'Salary', regime: 'Old Only' },
  { section: '10(14)', name: 'Special Allowances (LTA, Uniform, etc.)', limit: 'Varies', category: 'Salary', regime: 'Old Only' },
  { section: '16(ia)', name: 'Standard Deduction (Salaried)', limit: '₹75,000 (New) / ₹50,000 (Old)', category: 'Salary', regime: 'Both' },
  { section: '16(iii)', name: 'Professional Tax', limit: 'Actual paid', category: 'Salary', regime: 'Old Only' },
  { section: '10(10D)', name: 'Life Insurance Maturity Proceeds', limit: 'Exempt (conditions)', category: 'Insurance', regime: 'Both' },
  { section: '10(10C)', name: 'VRS Compensation', limit: '₹5,00,000', category: 'Salary', regime: 'Both' },
  { section: '10(10)', name: 'Gratuity Exemption', limit: '₹20,00,000', category: 'Salary', regime: 'Both' },
  { section: '10(10A)', name: 'Pension Commutation', limit: '1/3rd of pension', category: 'Retirement', regime: 'Both' },
  { section: '10(11)', name: 'PPF Maturity & Interest', limit: 'Fully exempt', category: 'Investment', regime: 'Both' },
  { section: '10(15)', name: 'Interest on Govt Securities (specified)', limit: 'Fully exempt', category: 'Interest', regime: 'Both' },
  { section: '10(16)', name: 'Scholarship for Education', limit: 'Fully exempt', category: 'Education', regime: 'Both' },
  { section: '10(17)', name: 'Daily Allowance to MPs/MLAs', limit: 'Fully exempt', category: 'Govt', regime: 'Both' },
  { section: '10(26)', name: 'Income of Scheduled Tribe in Specified Areas', limit: 'Fully exempt', category: 'Special', regime: 'Both' },
  { section: '10(32)', name: 'Minor Child Income (clubbed)', limit: '₹1,500/child', category: 'Family', regime: 'Both' },
  { section: '54', name: 'LTCG on Property reinvested in house', limit: 'Actual investment', category: 'Capital Gains', regime: 'Both' },
  { section: '54EC', name: 'LTCG reinvested in 54EC Bonds', limit: '₹50,00,000', category: 'Capital Gains', regime: 'Both' },
  { section: '54F', name: 'LTCG on any asset reinvested in house', limit: 'Proportionate', category: 'Capital Gains', regime: 'Both' },
  { section: '112A', name: 'LTCG on Equity — First ₹1.25L', limit: '₹1,25,000 (tax-free)', category: 'Capital Gains', regime: 'Both' },
  { section: 'Sec 6', name: 'RNOR Status — Foreign Income', limit: 'Fully exempt (2-3 yrs)', category: 'NRI', regime: 'Both' },
  { section: '56(2)', name: 'Marriage Gift Exemption', limit: 'Unlimited', category: 'Gift', regime: 'Both' },
  { section: '47(viic)', name: 'SGB Maturity Capital Gain', limit: 'Fully exempt (8-yr maturity)', category: 'Investment', regime: 'Both' },
  { section: '80CCD(2)', name: 'Agniveer Corpus Fund', limit: 'Fully exempt', category: 'Special', regime: 'Both' },
  { section: '10(12B)', name: 'NPS Tier-1 Withdrawal (60%)', limit: '60% of corpus exempt', category: 'Retirement', regime: 'Both' },
  { section: 'Finance Act 25', name: 'Perquisite Cap ₹4L (Both Regimes)', limit: '₹4,00,000', category: 'Salary', regime: 'Both' },
  { section: 'Budget 25', name: 'Two Self-Occupied Homes Exempt', limit: 'Both treated as self-occ', category: 'Property', regime: 'Both' },
  { section: '10(19)', name: 'Disability Pension (Armed Forces)', limit: 'Fully exempt', category: 'Special', regime: 'Both' },
  { section: '10(1)', name: 'Agricultural Income', limit: 'Fully exempt', category: 'Special', regime: 'Both' },
];

const CATEGORIES = ['All', 'Investment', 'Retirement', 'Health', 'Salary', 'Property', 'Capital Gains', 'Education', 'Business', 'Profession', 'Interest', 'Insurance', 'NRI', 'Gift', 'Donation', 'Special'];

const DeductionsExplorer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const formData = location.state?.formData || {};
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [regimeFilter, setRegimeFilter] = useState('All');

  const hasData = Object.keys(formData).length > 0;
  
  const getStatus = (d) => {
    if (!hasData) return 'Check'; // no form data yet
    if (d.regime === 'Old Only' && formData.regimePreference === 'New Regime') return 'NA';
    if (d.section === '80C' && (formData.deduction80C || 0) >= 150000) return 'Claimed';
    if (d.section === '80C' && (formData.deduction80C || 0) > 0) return 'Partial';
    if (d.section === '80C' && (formData.deduction80C || 0) === 0) return 'Missing';
    if (d.section === '80D' && (formData.deduction80D || 0) > 0) return 'Claimed';
    if (d.section === '80D' && (formData.deduction80D || 0) === 0) return 'Missing';
    if (d.section === '80CCD(1B)' && (formData.deductionNPS || 0) >= 50000) return 'Claimed';
    if (d.section === '80CCD(1B)' && (formData.deductionNPS || 0) > 0) return 'Partial';
    if (d.section === '80CCD(1B)' && (formData.deductionNPS || 0) === 0) return 'Missing';
    if (d.section === '10(13A)' && (formData.hraDeduction || 0) > 0) return 'Claimed';
    if (d.section === '10(13A)' && (formData.hraDeduction || 0) === 0 && (formData.annualSalary || 0) > 0) return 'Missing';
    if (d.section === '16(ia)') return 'Claimed'; // standard deduction always applies
    if (d.regime === 'Old Only') return 'Missing';
    return 'Check';
  };

  const STATUS_CONFIG = {
    'Claimed': { color: '#059669', bg: '#F0FDF4', icon: <CheckCircleFilled style={{ color: '#059669' }} />, label: 'Claimed' },
    'Partial': { color: '#D97706', bg: '#FFF7ED', icon: <MinusCircleFilled style={{ color: '#D97706' }} />, label: 'Partial' },
    'Missing': { color: '#DC2626', bg: '#FEF2F2', icon: <CloseCircleFilled style={{ color: '#DC2626' }} />, label: 'Missing' },
    'NA': { color: '#6B7280', bg: '#F2F3F4', icon: <MinusCircleFilled style={{ color: '#6B7280' }} />, label: 'N/A' },
    'Check': { color: '#5B92E5', bg: '#EEF3F9', icon: <MinusCircleFilled style={{ color: '#08457E' }} />, label: 'Check' },
  };

  const filtered = ALL_DEDUCTIONS.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.section.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || d.category === category;
    const matchRegime = regimeFilter === 'All' || d.regime === regimeFilter || d.regime === 'Both';
    return matchSearch && matchCat && matchRegime;
  });

  const columns = [
    { title: 'Section', dataIndex: 'section', key: 'section', width: '10%', render: v => <Tag style={{ borderRadius: 8, background: '#EEF3F9', color: '#5B92E5', border: 'none', fontWeight: 700 }}>{v}</Tag> },
    { title: 'Deduction', dataIndex: 'name', key: 'name', width: '35%', render: v => <Text style={{ fontSize: 13 }}>{v}</Text> },
    { title: 'Limit', dataIndex: 'limit', key: 'limit', width: '18%', render: v => <Text strong style={{ color: '#08457E', fontSize: 13 }}>{v}</Text> },
    { title: 'Category', dataIndex: 'category', key: 'category', width: '12%', render: v => <Tag style={{ borderRadius: 20, fontSize: 11 }}>{v}</Tag> },
    { title: 'Regime', dataIndex: 'regime', key: 'regime', width: '12%', render: v => <Tag style={{ borderRadius: 20, fontSize: 11, background: v === 'Both' ? '#F0FDF4' : '#FEF2F2', color: v === 'Both' ? '#059669' : '#DC2626', border: 'none' }}>{v}</Tag> },
    {
      title: 'Status', key: 'status', width: '13%', render: (_, row) => {
        const s = getStatus(row);
        const c = STATUS_CONFIG[s];
        return <Tag style={{ borderRadius: 20, background: c.bg, color: c.color, border: 'none', fontSize: 11 }}>{c.icon} {c.label}</Tag>;
      }
    },
  ];

  const claimed = filtered.filter(d => getStatus(d) === 'Claimed').length;
  const missing = filtered.filter(d => getStatus(d) === 'Missing').length;

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#5B92E5', borderRadius: 16, fontFamily: "'Outfit', sans-serif" } }}>
      <Layout style={{ minHeight: '100vh', background: '#F2F3F4' }}>
          <Navbar />
          <div style={{ padding: '32px 24px' }}>
        <Content style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '24px 16px' }}>

          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard', { state: location.state })}
            style={{ marginBottom: 24, borderRadius: 12, fontWeight: 600, color: '#08457E' }}>
            Back to Dashboard
          </Button>

          <div style={{ marginBottom: 32 }}>
            <Title level={2} style={{ color: '#08457E', fontWeight: 800, margin: 0 }}>Deductions Explorer</Title>
            <Paragraph style={{ color: '#6B7280', fontSize: 16, marginTop: 8 }}>
              All 50+ tax deductions in one place — with your claim status.
            </Paragraph>
          </div>

          {/* Stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            {[
              { label: 'Total Sections', value: ALL_DEDUCTIONS.length, color: '#5B92E5' },
              { label: 'Claimed by You', value: claimed, color: '#059669' },
              { label: 'Potentially Missing', value: missing, color: '#DC2626' },
              { label: 'Both Regimes', value: ALL_DEDUCTIONS.filter(d => d.regime === 'Both').length, color: '#08457E' },
            ].map((s, i) => (
              <Col xs={12} md={6} key={i}>
                <Card style={{ borderRadius: 20, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{s.label}</div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Filters */}
          <Space wrap style={{ marginBottom: 24 }}>
            <Input prefix={<SearchOutlined />} placeholder="Search section or name..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ width: 240, borderRadius: 12 }} />
            <Select value={category} onChange={setCategory} style={{ width: 160, borderRadius: 12 }}>
              {CATEGORIES.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
            </Select>
            <Select value={regimeFilter} onChange={setRegimeFilter} style={{ width: 140, borderRadius: 12 }}>
              <Select.Option value="All">All Regimes</Select.Option>
              <Select.Option value="Old Only">Old Only</Select.Option>
              <Select.Option value="Both">Both Regimes</Select.Option>
            </Select>
          </Space>

          <Card style={{ borderRadius: 24, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Table
              columns={columns}
              dataSource={filtered.map((d, i) => ({ ...d, key: i }))}
              pagination={{ pageSize: 15, showSizeChanger: false }}
              size="middle"
              style={{ borderRadius: 16 }}
            />
          </Card>

        </Content>
      </div>
</Layout>
    </ConfigProvider>
  );
};

export default DeductionsExplorer;
