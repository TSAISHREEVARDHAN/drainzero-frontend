import React, { useState } from 'react';
import {
  Layout, Typography, Card, Row, Col, Space, Button,
  Tag, Collapse, ConfigProvider, Alert, Table
} from 'antd';
import {
  ArrowLeftOutlined, WarningOutlined, CheckCircleFilled,
  InfoCircleOutlined, RiseOutlined, FallOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import TaxAssistantChatbot from '../../components/TaxAssistantChatbot';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const GUIDES = [
  {
    id: 1,
    title: 'ULIP Trap — Why Most ULIPs Are a Bad Deal',
    tag: 'WARNING',
    tagColor: '#DC2626',
    icon: <WarningOutlined />,
    summary: 'ULIPs (Unit Linked Insurance Plans) combine insurance + investment. Sounds good — but the charges can silently eat 30–60% of your returns in the first 5 years.',
    details: [
      { label: 'Premium Allocation Charge', value: '2–8% of every premium deducted upfront' },
      { label: 'Fund Management Charge', value: '1.35% per annum on fund value' },
      { label: 'Mortality Charge', value: 'Increases with age, deducted monthly' },
      { label: 'Policy Administration', value: '₹60–₹500/month flat' },
      { label: 'Surrender Charge', value: 'Steep penalty if you exit before 5 years' },
    ],
    verdict: 'Better alternative: Buy a pure term plan (₹1Cr cover at ~₹8,000/yr) + invest in ELSS separately for ₹1.5L 80C benefit. You get more cover + better returns.',
    verdictType: 'warning',
  },
  {
    id: 2,
    title: 'SSY vs PPF — Best Tax-Free Investment for Girl Child',
    tag: 'SSY',
    tagColor: '#059669',
    icon: <RiseOutlined />,
    summary: 'Sukanya Samriddhi Yojana (SSY) offers 8.2% interest, fully EEE (Exempt-Exempt-Exempt). Better than PPF for girl children under 10.',
    details: [
      { label: 'SSY Interest Rate', value: '8.2% p.a. (Q1 FY26) — higher than PPF' },
      { label: 'PPF Interest Rate', value: '7.1% p.a. — fixed, lower' },
      { label: 'SSY Tax Status', value: 'EEE — deposits, interest, maturity all exempt' },
      { label: 'SSY Lock-in', value: '21 years or girl\'s marriage after 18' },
      { label: 'SSY Max Deposit', value: '₹1.5L/year (counts in 80C limit)' },
      { label: 'SSY Eligibility', value: 'Girl child below age 10, max 2 accounts' },
    ],
    verdict: 'If you have a daughter under 10 — open SSY immediately. It beats PPF by ~1.1% annually, compounded over 21 years that is massive.',
    verdictType: 'success',
  },
  {
    id: 3,
    title: 'SGB vs Physical Gold vs Gold ETF — Tax Comparison',
    tag: 'Gold',
    tagColor: '#D97706',
    icon: <RiseOutlined />,
    summary: 'Sovereign Gold Bonds (SGBs) are far superior to physical gold and Gold ETFs from a tax perspective, especially if held to maturity.',
    details: [
      { label: 'SGB Maturity (8 yr) Capital Gain', value: '100% EXEMPT — zero tax' },
      { label: 'SGB Annual Interest', value: '2.5% p.a. on initial investment (taxable)' },
      { label: 'Physical Gold LTCG (>2 yr)', value: '12.5% LTCG tax on gains' },
      { label: 'Gold ETF LTCG (>2 yr)', value: '12.5% LTCG tax on gains' },
      { label: 'Physical Gold Storage Risk', value: 'Locker cost, theft risk, making charges' },
      { label: 'SGB Premature Exit (after 5 yr)', value: '12.5% LTCG applies — hold to 8 yr' },
    ],
    verdict: 'Always choose SGB over physical gold or ETFs if your horizon is 8 years. The tax-free maturity benefit alone can save ₹50,000–₹5L depending on investment size.',
    verdictType: 'success',
  },
  {
    id: 4,
    title: 'Crypto — The Brutal Tax Reality in India',
    tag: 'Crypto',
    tagColor: '#7C3AED',
    icon: <FallOutlined />,
    summary: 'India has the harshest crypto tax regime globally. 30% flat tax on gains, 1% TDS on every transaction, and losses CANNOT offset anything.',
    details: [
      { label: 'Tax on Crypto Gains', value: '30% flat — no slab benefit, no deductions' },
      { label: 'TDS on Every Transaction', value: '1% TDS deducted by exchange on sale' },
      { label: 'Loss Set-Off', value: 'ZERO — crypto losses cannot offset any income' },
      { label: 'Loss Carry Forward', value: 'NOT allowed — unlike equity losses' },
      { label: 'GST on Exchange Fees', value: '18% GST on brokerage/trading fees' },
      { label: 'Gifted Crypto', value: 'Taxable at 30% in receiver\'s hands if >₹50K' },
    ],
    verdict: 'If you trade crypto: file ITR-3, report every transaction, claim TDS credit. Do NOT hide — IT Dept gets data directly from exchanges. Consider equity over crypto for tax efficiency.',
    verdictType: 'warning',
  },
  {
    id: 5,
    title: 'Share Buyback — Tax Rules Changed April 2026',
    tag: 'Buyback',
    tagColor: '#0891B2',
    icon: <InfoCircleOutlined />,
    summary: 'From April 1, 2026, share buyback proceeds are taxed as Capital Gains in the hands of shareholders — not as dividend. Major change from previous rules.',
    details: [
      { label: 'Old Rule (before Apr 2026)', value: 'Company paid 20% buyback tax. Investor received tax-free.' },
      { label: 'New Rule (from Apr 2026)', value: 'Company pays no buyback tax. Investor pays CG tax.' },
      { label: 'Holding > 1 year', value: 'LTCG at 12.5% (above ₹1.25L exemption)' },
      { label: 'Holding < 1 year', value: 'STCG at 20%' },
      { label: 'Cost of Acquisition', value: 'Original purchase price' },
      { label: 'Impact', value: 'High-income investors now pay more vs old regime' },
    ],
    verdict: 'If you hold shares in companies that do frequent buybacks (TCS, Infosys, etc.) — factor in the new CG tax when deciding to participate in buybacks from FY 2026-27.',
    verdictType: 'info',
  },
  {
    id: 6,
    title: 'LRS / TCS on Foreign Remittance — ₹10L Threshold',
    tag: 'LRS',
    tagColor: '#0891B2',
    icon: <InfoCircleOutlined />,
    summary: 'Liberalised Remittance Scheme (LRS) allows Indians to send up to $250,000 abroad per year. TCS applies on remittances above ₹10L in a financial year.',
    details: [
      { label: 'TCS on Education Loan (abroad)', value: '0.5% on amount above ₹7L' },
      { label: 'TCS on Other Education', value: '5% on amount above ₹7L' },
      { label: 'TCS on Medical Treatment', value: '5% on amount above ₹7L' },
      { label: 'TCS on Travel / Other', value: '20% on amount above ₹10L' },
      { label: 'Foreign Investment (stocks, ETFs)', value: '20% TCS above ₹10L (can be claimed back)' },
      { label: 'TCS Credit', value: 'Fully claimable in ITR as advance tax paid' },
    ],
    verdict: 'TCS is NOT an extra tax — it\'s advance tax collection. Claim it back fully in your ITR. But it does hurt cash flow. Plan large remittances across financial years to stay under ₹10L.',
    verdictType: 'info',
  },
  {
    id: 7,
    title: 'Pre-Construction Loan Deduction — 1/5th Rule',
    tag: 'Property',
    tagColor: '#5B92E5',
    icon: <InfoCircleOutlined />,
    summary: 'Interest paid on home loan BEFORE possession of property is deductible in 5 equal instalments starting from the year of possession. Most people miss this.',
    details: [
      { label: 'Pre-construction Interest', value: 'Total interest paid before possession date' },
      { label: 'How to Claim', value: 'Split into 5 equal parts, claim each year after possession' },
      { label: 'Section', value: 'Section 24(b) — same as regular home loan interest' },
      { label: 'Cap', value: '₹2L/year total including regular + pre-construction' },
      { label: 'Example', value: 'Paid ₹5L interest before possession → claim ₹1L/yr for 5 years' },
      { label: 'Regime', value: 'Old Regime only — not available in New Regime' },
    ],
    verdict: 'If you took a home loan for under-construction property and have received possession — check your loan statement for pre-EMI interest paid and claim it starting this year.',
    verdictType: 'success',
  },
  {
    id: 8,
    title: 'Joint Property Tax Strategy — Double the Exemption',
    tag: 'Property',
    tagColor: '#5B92E5',
    icon: <CheckCircleFilled />,
    summary: 'When a property is jointly owned and jointly financed, EACH co-owner can claim the full deduction limits independently — effectively doubling the household benefit.',
    details: [
      { label: 'Section 24(b) per person', value: '₹2L interest deduction each (₹4L total)' },
      { label: 'Section 80C per person', value: '₹1.5L principal repayment each (₹3L total)' },
      { label: 'Total household benefit', value: '₹7L deduction (vs ₹3.5L for single owner)' },
      { label: 'Requirement', value: 'Both must be co-owners AND co-borrowers in loan' },
      { label: 'Ownership proof', value: 'Sale deed must show ownership ratio' },
      { label: 'Budget 2025', value: 'Both properties can now be self-occupied (no deemed rent)' },
    ],
    verdict: 'If buying a home — always register jointly with spouse and take loan jointly. This one decision can save ₹70,000–₹1L in tax annually for your household.',
    verdictType: 'success',
  },
];

const VERDICT_STYLE = {
  success: { bg: '#F0FDF4', border: '#D1FAE5', color: '#065F46', icon: <CheckCircleFilled style={{ color: '#059669' }} /> },
  warning: { bg: '#FFF7ED', border: '#FED7AA', color: '#92400E', icon: <WarningOutlined style={{ color: '#D97706' }} /> },
  info   : { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF', icon: <InfoCircleOutlined style={{ color: '#3B82F6' }} /> },
};

const InvestmentGuide = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [activeTag, setActiveTag] = useState('All');

  const tags = ['All', 'WARNING', 'SSY', 'Gold', 'Crypto', 'Buyback', 'LRS', 'Property'];

  const filtered = activeTag === 'All' ? GUIDES : GUIDES.filter(g => g.tag === activeTag);

  const detailColumns = [
    { title: 'Detail', dataIndex: 'label', key: 'label', width: '45%', render: v => <Text strong style={{ color: '#08457E', fontSize: 13 }}>{v}</Text> },
    { title: 'Value', dataIndex: 'value', key: 'value', render: v => <Text style={{ color: '#6B7280', fontSize: 13 }}>{v}</Text> },
  ];

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
            <Title level={2} style={{ color: '#08457E', fontWeight: 800, margin: 0 }}>Investment & Tax Guide</Title>
            <Paragraph style={{ color: '#6B7280', fontSize: 16, marginTop: 8 }}>
              ULIP traps, SGB vs Gold, Crypto reality, Buyback rules, LRS/TCS, Property strategies — all in one place.
            </Paragraph>
          </div>

          {/* Filter tags */}
          <Space wrap style={{ marginBottom: 32 }}>
            {tags.map(tag => (
              <Tag key={tag} onClick={() => setActiveTag(tag)} style={{
                cursor: 'pointer', borderRadius: 20, padding: '4px 16px', fontSize: 13,
                background: activeTag === tag ? '#08457E' : '#FFFFFF',
                color: activeTag === tag ? '#FFFFFF' : '#08457E',
                border: `1px solid ${activeTag === tag ? '#08457E' : '#B8C8E6'}`,
              }}>
                {tag}
              </Tag>
            ))}
          </Space>

          {/* Guide Cards */}
          <Collapse accordion={false} expandIconPosition="end" style={{ background: 'transparent', border: 'none' }}>
            {filtered.map(guide => {
              const vs = VERDICT_STYLE[guide.verdictType];
              return (
                <Panel
                  key={guide.id}
                  style={{ background: '#FFFFFF', borderRadius: 20, marginBottom: 16, border: '1px solid #B8C8E6', overflow: 'hidden' }}
                  header={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${guide.tagColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: guide.tagColor, fontSize: 20, flexShrink: 0 }}>
                        {guide.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ color: '#08457E', fontSize: 16 }}>{guide.title}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag style={{ borderRadius: 20, background: `${guide.tagColor}15`, color: guide.tagColor, border: 'none', fontSize: 11 }}>{guide.tag}</Tag>
                        </div>
                      </div>
                    </div>
                  }
                >
                  <div style={{ padding: '8px 0 16px' }}>
                    <Paragraph style={{ color: '#6B7280', fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>{guide.summary}</Paragraph>

                    <Table
                      columns={detailColumns}
                      dataSource={guide.details.map((d, i) => ({ ...d, key: i }))}
                      pagination={false}
                      size="small"
                      style={{ marginBottom: 20, borderRadius: 12, overflow: 'hidden' }}
                    />

                    <div style={{ background: vs.bg, border: `1px solid ${vs.border}`, borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0, marginTop: 2 }}>{vs.icon}</span>
                      <Text style={{ color: vs.color, fontSize: 14, lineHeight: 1.6 }}><strong>Bottom Line: </strong>{guide.verdict}</Text>
                    </div>
                  </div>
                </Panel>
              );
            })}
          </Collapse>

          <div style={{ marginTop: 40 }}>
            <TaxAssistantChatbot />
          </div>

        </Content>
      </div>
</Layout>
    </ConfigProvider>
  );
};

export default InvestmentGuide;
