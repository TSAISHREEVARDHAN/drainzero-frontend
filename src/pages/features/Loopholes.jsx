import React, { useState } from 'react';
import {
  Layout, Typography, Card, Row, Col, Space, Button,
  Tag, Collapse, ConfigProvider, Input, Badge
} from 'antd';
import {
  ArrowLeftOutlined, SafetyCertificateOutlined, SearchOutlined,
  BulbOutlined, CheckCircleOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import TaxAssistantChatbot from '../../components/TaxAssistantChatbot';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const LOOPHOLES = [
  {
    id: 1,
    title: 'Marriage Gift — Unlimited Tax-Free',
    tag: 'Gift Tax',
    tagColor: '#08457E',
    saving: 'Unlimited',
    section: 'Sec 56(2)',
    difficulty: 'Easy',
    description: 'Gifts received on marriage are fully exempt from tax — no limit, from anyone (relatives or friends). Cash, jewellery, property — all exempt.',
    steps: [
      'Receive gifts during marriage ceremony window',
      'Document all gifts with occasion date proof',
      'No upper cap — ₹50L gift is still 100% tax-free',
      'Applies to both cash and non-cash gifts',
    ],
    caution: 'Only on marriage occasion. Birthday/anniversary gifts from non-relatives above ₹50,000 are taxable.'
  },
  {
    id: 2,
    title: 'RNOR Status — Foreign Income Tax-Free',
    tag: 'NRI',
    tagColor: '#5B92E5',
    saving: '₹5L–₹20L+',
    section: 'Sec 6',
    difficulty: 'Medium',
    description: 'Returning NRIs get RNOR (Resident but Not Ordinarily Resident) status for 2–3 years. During this window, foreign income is NOT taxed in India.',
    steps: [
      'Check if you qualify: NRI for 9+ of last 10 years, or stayed ≤729 days in last 7 years',
      'File ITR as RNOR — foreign salary/investments not reported',
      'Only Indian-sourced income is taxable',
      'Window lasts 2–3 years after return',
    ],
    caution: 'Consult a CA for exact residency calculation. Wrong classification = penalty.'
  },
  {
    id: 3,
    title: 'HUF Formation — Split Income, Halve Tax',
    tag: 'HUF',
    tagColor: '#7C3AED',
    saving: '₹1L–₹3L/yr',
    section: 'Sec 2(31)',
    difficulty: 'Medium',
    description: 'A Hindu Undivided Family (HUF) is a separate tax entity. You can transfer income-generating assets to HUF and claim full basic exemption (₹3L) separately.',
    steps: [
      'Register HUF with a PAN card (takes ~2 weeks)',
      'Transfer assets via gift deed to HUF',
      'HUF files its own ITR — gets ₹3L basic exemption',
      'Invest ₹1.5L in 80C separately in HUF name',
    ],
    caution: 'HUF must have genuine business/income. Sham HUFs are scrutinized by IT Dept.'
  },
  {
    id: 4,
    title: 'Form 15G / 15H — Stop TDS at Source',
    tag: 'TDS',
    tagColor: '#D97706',
    saving: '₹10K–₹1L',
    section: 'Sec 197A',
    difficulty: 'Easy',
    description: 'Submit Form 15G (below 60) or 15H (above 60) to your bank/FD issuer to prevent TDS deduction if your total income is below taxable limit.',
    steps: [
      'Check: total income < basic exemption limit',
      'Download Form 15G/15H from income tax portal',
      'Submit to your bank at start of every financial year',
      'Submit to all FD/RD accounts, not just one bank',
    ],
    caution: 'False declaration is a criminal offence under Sec 277. Verify income before submitting.'
  },
  {
    id: 5,
    title: 'Nil TDS Certificate — Section 197 / Form 128',
    tag: 'TDS',
    tagColor: '#D97706',
    saving: 'Cash flow benefit',
    section: 'Sec 197',
    difficulty: 'Medium',
    description: 'Apply to your Assessing Officer for Nil or lower TDS certificate. From 2025, the new Form 128 allows online application for multiple payers at once.',
    steps: [
      'Login to TRACES portal (tdscpc.gov.in)',
      'Apply under "Lower/Nil Deduction Certificate"',
      'New Form 128 (2025) — covers all deductors in one form',
      'Submit to deductors — valid for entire FY',
    ],
    caution: 'AO approval depends on your estimated tax liability. Apply 30 days before TDS is due.'
  },
  {
    id: 6,
    title: 'LTCG Harvesting — ₹1.25L Tax-Free Every Year',
    tag: 'Capital Gains',
    tagColor: '#059669',
    saving: '₹15,625/yr',
    section: 'Sec 112A',
    difficulty: 'Easy',
    description: 'Long-term capital gains on equity up to ₹1.25L are 100% tax-free every year. Sell and rebuy to reset your cost basis — legally pocket ₹1.25L gain tax-free annually.',
    steps: [
      'Identify long-term equity holdings (held > 1 year)',
      'Sell up to ₹1.25L gain before March 31',
      'Immediately rebuy the same stocks at new (higher) price',
      'Repeat every year — permanently reduces future tax',
    ],
    caution: 'STT applies on each transaction. Plan around brokerage costs. Works only for equity/equity MFs.'
  },
  {
    id: 7,
    title: 'SGB Maturity — Completely Tax-Free Gold',
    tag: 'Investment',
    tagColor: '#B45309',
    saving: '₹50K–₹5L',
    section: 'Sec 47(viic)',
    difficulty: 'Easy',
    description: 'Sovereign Gold Bonds held to maturity (8 years) have ZERO capital gains tax. Physical gold or gold ETFs are taxed at 12.5% LTCG. SGBs also give 2.5% annual interest.',
    steps: [
      'Buy SGBs from RBI through bank/demat (issued in tranches)',
      'Hold for full 8-year tenure',
      'Redemption proceeds are 100% tax-free',
      'Annual 2.5% interest is taxable but minor vs capital gain',
    ],
    caution: 'Premature exit (after 5 years) is taxable as LTCG. Hold to maturity for full benefit.'
  },
  {
    id: 8,
    title: 'Two Self-Occupied Homes — Both Exempt',
    tag: 'Property',
    tagColor: '#5B92E5',
    saving: '₹2L–₹4L',
    section: 'Sec 23 (Budget 2025)',
    difficulty: 'Easy',
    description: 'Budget 2025 allows TWO self-occupied properties to be treated as self-occupied (nil annual value). Previously only one was allowed. Second home no longer has deemed rental income.',
    steps: [
      'Own two residential properties',
      'Both can be declared as self-occupied in ITR',
      'No deemed rental income on second property',
      'Claim home loan interest on both (up to ₹2L each)',
    ],
    caution: 'Both must be genuinely self-occupied. Cannot claim if either is actually rented out.'
  },
  {
    id: 9,
    title: 'Joint Home Loan — Double the Deduction',
    tag: 'Property',
    tagColor: '#5B92E5',
    saving: '₹4L+/yr',
    section: 'Sec 24(b) + 80C',
    difficulty: 'Medium',
    description: 'Take a home loan jointly with spouse. Both co-borrowers can claim ₹2L interest (Sec 24b) and ₹1.5L principal (Sec 80C) independently — total ₹7L deduction vs ₹3.5L alone.',
    steps: [
      'Both spouses must be co-owners AND co-borrowers',
      'Ownership ratio documented in sale deed',
      'Each files ITR claiming their respective share',
      'Effective deduction doubles for the household',
    ],
    caution: 'Both must have taxable income. No benefit if one spouse has no income.'
  },
  {
    id: 10,
    title: 'ESOP Deferral Strategy',
    tag: 'Startup',
    tagColor: '#6D28D9',
    saving: '₹2L–₹10L',
    section: 'Sec 192(1C)',
    difficulty: 'Medium',
    description: 'For startup employees, ESOP tax is deferred — you pay tax only when you sell shares (not at exercise). This avoids cash crunch of paying tax on illiquid stock.',
    steps: [
      'Applicable only for DPIIT-registered startups',
      'Tax deferred for 5 years or till sale, whichever earlier',
      'Employer submits Form 16 with deferral details',
      'Plan exit strategically to minimize tax bracket at sale',
    ],
    caution: 'Only for employees of eligible startups. Check DPIIT registration of your employer.'
  },
  {
    id: 11,
    title: 'Author / Patent Royalty Deduction',
    tag: 'Profession',
    tagColor: '#08457E',
    saving: 'Up to ₹3L',
    section: 'Sec 80QQB / 80RRB',
    difficulty: 'Easy',
    description: 'Authors earn royalty? Deduct up to ₹3L under Sec 80QQB. Patent holders get ₹3L under Sec 80RRB. Completely overlooked by most tax advisors.',
    steps: [
      '80QQB: Indian author of literary/artistic/scientific work',
      '80RRB: Indian patent holder registered after 01-04-2003',
      'Royalty income must be from Indian sources',
      'Claim in ITR under Chapter VI-A deductions',
    ],
    caution: 'Foreign royalty is limited to ₹3L. Lump sum amounts (non-royalty) may not qualify.'
  },
  {
    id: 12,
    title: 'Hire Employees, Save 30% — Section 80JJAA',
    tag: 'Business',
    tagColor: '#B45309',
    saving: '30% of wages',
    section: 'Sec 80JJAA',
    difficulty: 'Hard',
    description: 'Businesses that hire new employees earning < ₹25K/month can claim 30% of additional wages as deduction for 3 years. New hires must work 240+ days.',
    steps: [
      'Applicable to businesses with statutory audit requirement',
      'New employee salary must be < ₹25,000/month',
      'Employee must work minimum 240 days in the year',
      'Claim 30% of incremental wages for 3 consecutive years',
    ],
    caution: 'Requires CA-certified audit report. Temporary/contractual workers may not qualify.'
  },
  {
    id: 13,
    title: 'GST 0% on Insurance — September 2025',
    tag: 'Insurance',
    tagColor: '#059669',
    saving: '18% on premiums',
    section: 'GST Amendment 2025',
    difficulty: 'Easy',
    description: 'From September 2025, term life insurance and health insurance for senior citizens attract 0% GST (down from 18%). This makes premiums significantly cheaper and increases effective 80D deduction value.',
    steps: [
      'Buy or renew term/health insurance after Sept 2025',
      'Premiums are now GST-free — saving 18% immediately',
      'Higher savings → claim more under 80D',
      'Review existing policies for revised premium quotes',
    ],
    caution: 'ULIPs and investment-linked plans may not qualify. Verify with insurer.'
  },
  {
    id: 14,
    title: 'FAST-DS Amnesty — Declare Old Undisclosed Income',
    tag: 'Amnesty',
    tagColor: '#DC2626',
    saving: 'Avoid 200% penalty',
    section: 'FAST-DS 2026',
    difficulty: 'Hard',
    description: 'Budget 2026 introduced FAST-DS amnesty scheme. Declare previously undisclosed income, pay tax + 25% surcharge — and avoid 200% penalty + prosecution. One-time window.',
    steps: [
      'Identify any undisclosed income from past years',
      'Apply through FAST-DS portal (income tax website)',
      'Pay tax + 25% surcharge on declared amount',
      'Get immunity from penalty and prosecution',
    ],
    caution: 'Window is time-limited. Consult a CA before applying. False declarations still prosecutable.'
  },
];

const DIFFICULTY_COLOR = { Easy: '#059669', Medium: '#D97706', Hard: '#DC2626' };

const LoopholesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('All');

  const tags = ['All', 'Gift Tax', 'NRI', 'HUF', 'TDS', 'Capital Gains', 'Investment', 'Property', 'Startup', 'Profession', 'Business', 'Insurance', 'Amnesty'];

  const filtered = LOOPHOLES.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase());
    const matchTag = activeTag === 'All' || l.tag === activeTag;
    return matchSearch && matchTag;
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

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <Title level={2} style={{ color: '#08457E', fontWeight: 800, margin: 0 }}>
              Legal Tax Loopholes
            </Title>
            <Paragraph style={{ color: '#6B7280', fontSize: 16, marginTop: 8 }}>
              14 legally bulletproof strategies that even CAs miss. All verified for FY 2025–26.
            </Paragraph>
          </div>

          {/* Stats Bar */}
          <Row gutter={[16, 16]} style={{ marginBottom: 40 }}>
            {[
              { label: 'Total Strategies', value: '14', color: '#5B92E5' },
              { label: 'Easy to Implement', value: '8', color: '#059669' },
              { label: 'Potential Annual Saving', value: '₹5L+', color: '#08457E' },
              { label: 'Updated FY', value: '2025–26', color: '#D97706' },
            ].map((s, i) => (
              <Col xs={12} md={6} key={i}>
                <Card style={{ borderRadius: 20, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{s.label}</div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Search + Filter */}
          <Space direction="vertical" style={{ width: '100%', marginBottom: 32 }} size={16}>
            <Input
              size="large"
              prefix={<SearchOutlined style={{ color: '#6B7280' }} />}
              placeholder="Search loopholes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ borderRadius: 12, maxWidth: 400 }}
            />
            <Space wrap>
              {tags.map(tag => (
                <Tag
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  style={{
                    cursor: 'pointer', borderRadius: 20, padding: '4px 16px', fontSize: 13,
                    background: activeTag === tag ? '#5B92E5' : '#FFFFFF',
                    color: activeTag === tag ? '#FFFFFF' : '#5B92E5',
                    border: `1px solid ${activeTag === tag ? '#5B92E5' : '#B8C8E6'}`,
                  }}
                >
                  {tag}
                </Tag>
              ))}
            </Space>
          </Space>

          {/* Loopholes List */}
          <Collapse
            accordion={false}
            expandIconPosition="end"
            style={{ background: 'transparent', border: 'none' }}
            className="loopholes-collapse"
          >
            {filtered.map((l) => (
              <Panel
                key={l.id}
                style={{ background: '#FFFFFF', borderRadius: 20, marginBottom: 16, border: '1px solid #B8C8E6', overflow: 'hidden' }}
                header={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: `${l.tagColor}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: l.tagColor, fontSize: 18, flexShrink: 0
                    }}>
                      <BulbOutlined />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#5B92E5', fontSize: 16 }}>{l.title}</div>
                      <Space size={8} style={{ marginTop: 4 }}>
                        <Tag style={{ borderRadius: 20, background: `${l.tagColor}15`, color: l.tagColor, border: 'none', fontSize: 11 }}>{l.tag}</Tag>
                        <Tag style={{ borderRadius: 20, background: '#F2F3F4', color: '#6B7280', border: 'none', fontSize: 11 }}>{l.section}</Tag>
                        <Tag style={{ borderRadius: 20, background: `${DIFFICULTY_COLOR[l.difficulty]}15`, color: DIFFICULTY_COLOR[l.difficulty], border: 'none', fontSize: 11 }}>{l.difficulty}</Tag>
                      </Space>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>{l.saving}</div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>potential saving</div>
                    </div>
                  </div>
                }
              >
                <div style={{ padding: '8px 0 16px' }}>
                  <Paragraph style={{ color: '#6B7280', fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
                    {l.description}
                  </Paragraph>

                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ color: '#5B92E5', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>How to Implement</Text>
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {l.steps.map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#5B92E5', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                          <Text style={{ color: '#1F2937', fontSize: 14, lineHeight: 1.6 }}>{step}</Text>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: '#FEF3C7', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <InfoCircleOutlined style={{ color: '#D97706', fontSize: 16, marginTop: 2, flexShrink: 0 }} />
                    <Text style={{ color: '#92400E', fontSize: 13 }}><strong>Caution:</strong> {l.caution}</Text>
                  </div>
                </div>
              </Panel>
            ))}
          </Collapse>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
              No loopholes found for "{search}". Try a different search.
            </div>
          )}

          <TaxAssistantChatbot />
        </Content>
      </div>
</Layout>

      <style>{`
        .loopholes-collapse .ant-collapse-header { padding: 20px 24px !important; }
        .loopholes-collapse .ant-collapse-content-box { padding: 0 24px 8px !important; }
        .loopholes-collapse .ant-collapse-item { box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
        .loopholes-collapse .ant-collapse-item:hover { box-shadow: 0 8px 25px rgba(8,69,126,0.08); }
      `}</style>
    </ConfigProvider>
  );
};

export default LoopholesPage;
