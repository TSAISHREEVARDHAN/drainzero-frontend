import React, { useState, useMemo } from 'react';
import {
  Layout, Typography, Card, Row, Col, Slider, InputNumber,
  Space, Button, Statistic, Tag, ConfigProvider, Divider, Switch
} from 'antd';
import { ArrowLeftOutlined, SwapOutlined, BulbOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import TaxAssistantChatbot from '../../components/TaxAssistantChatbot';
import TaxFieldLabel from '../../components/TaxFieldLabel';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const calcTaxOld = (taxable) => {
  if (taxable <= 250000) return 0;
  if (taxable <= 500000) return (taxable - 250000) * 0.05;
  if (taxable <= 1000000) return 12500 + (taxable - 500000) * 0.20;
  return 112500 + (taxable - 1000000) * 0.30;
};

// FIX: Updated to FY 2025-26 Budget 2025 slabs
const calcTaxNew = (taxable) => {
  if (taxable <= 400000)  return 0;
  if (taxable <= 800000)  return (taxable - 400000) * 0.05;
  if (taxable <= 1200000) return 20000 + (taxable - 800000) * 0.10;
  if (taxable <= 1600000) return 60000 + (taxable - 1200000) * 0.15;
  if (taxable <= 2000000) return 120000 + (taxable - 1600000) * 0.20;
  if (taxable <= 2400000) return 200000 + (taxable - 2000000) * 0.25;
  return 300000 + (taxable - 2400000) * 0.30;
};

const WhatIfSimulator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const formData = location.state?.formData || {};

  const [income, setIncome] = useState(formData.annualSalary || 1200000);
  const [d80C, setD80C] = useState(formData.deduction80C || 0);
  const [d80D, setD80D] = useState(formData.deduction80D || 0);
  const [dNPS, setDNPS] = useState(formData.deductionNPS || 0);
  const [dHRA, setDHRA] = useState(formData.hraDeduction || 0);
  const [homeLoan, setHomeLoan] = useState(0);
  const [salaried, setSalaried] = useState(true);

  const results = useMemo(() => {
    const stdOld = salaried ? 50000 : 0;
    const stdNew = salaried ? 75000 : 0;
    const cap80C = Math.min(d80C, 150000);
    const cap80D = Math.min(d80D, 50000);
    const capNPS = Math.min(dNPS, 50000);
    const capHL = Math.min(homeLoan, 200000);

    const totalOld = stdOld + cap80C + cap80D + capNPS + dHRA + capHL;
    const totalNew = stdNew;

    const taxableOld = Math.max(0, income - totalOld);
    const taxableNew = Math.max(0, income - totalNew);

    let taxOld = calcTaxOld(taxableOld);
    let taxNew = calcTaxNew(taxableNew);

    // FIX: correct 87A rebates for FY 2025-26
    // Old regime: full rebate if taxable income ≤ ₹5L (rebate ₹12,500)
    if (taxableOld <= 500000) taxOld = 0;
    // New regime: full rebate if taxable income ≤ ₹12L (rebate ₹60,000)
    if (taxableNew <= 1200000) taxNew = 0;

    const cessOld = taxOld * 0.04;
    const cessNew = taxNew * 0.04;

    const finalOld = Math.round(taxOld + cessOld);
    const finalNew = Math.round(taxNew + cessNew);
    const savings = Math.abs(finalOld - finalNew);
    const better = finalOld <= finalNew ? 'Old Regime' : 'New Regime';

    const effectiveRateOld = income > 0 ? ((finalOld / income) * 100).toFixed(1) : 0;
    const effectiveRateNew = income > 0 ? ((finalNew / income) * 100).toFixed(1) : 0;

    return { finalOld, finalNew, savings, better, totalOld, totalNew, taxableOld, taxableNew, effectiveRateOld, effectiveRateNew };
  }, [income, d80C, d80D, dNPS, dHRA, homeLoan, salaried]);

  const SliderRow = ({ label, value, setValue, max, color = '#5B92E5', note }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <Text strong style={{ color: '#1F2937', fontSize: 14 }}>{label}</Text>
          {note && <div style={{ fontSize: 11, color: '#6B7280' }}>{note}</div>}
        </div>
        <InputNumber
          value={value}
          onChange={v => setValue(v || 0)}
          formatter={v => `₹${Number(v).toLocaleString()}`}
          parser={v => v.replace(/₹\s?|(,*)/g, '')}
          min={0} max={max}
          style={{ width: 140, borderRadius: 8 }}
          size="small"
        />
      </div>
      <Slider
        value={value}
        onChange={setValue}
        min={0} max={max} step={max > 500000 ? 50000 : 5000}
        tooltip={{ formatter: v => `₹${v.toLocaleString()}` }}
        trackStyle={{ background: color }}
        handleStyle={{ borderColor: color }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, color: '#6B7280' }}>₹0</Text>
        <Text style={{ fontSize: 11, color: '#6B7280' }}>₹{max.toLocaleString()}</Text>
      </div>
    </div>
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#5B92E5', borderRadius: 16, fontFamily: "'Outfit', sans-serif" } }}>
      <Layout style={{ minHeight: '100vh', background: '#F2F3F4' }}>
          <Navbar />
          <div style={{ padding: '32px 24px' }}>
        <Content style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '24px 16px' }}>

          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard', { state: location.state })}
            style={{ marginBottom: 24, borderRadius: 12, fontWeight: 600, color: '#08457E' }}>
            Back to Dashboard
          </Button>

          <div style={{ marginBottom: 40 }}>
            <Title level={2} style={{ color: '#08457E', fontWeight: 800, margin: 0 }}>
              What-If Tax Simulator
            </Title>
            <Paragraph style={{ color: '#6B7280', fontSize: 16, marginTop: 8 }}>
              Move sliders to instantly see how changing your income or deductions affects your tax.
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            {/* Left — Sliders */}
            <Col xs={24} lg={14}>
              <Card style={{ borderRadius: 24, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                  <Title level={4} style={{ margin: 0, color: '#08457E' }}>Adjust Parameters</Title>
                  <Space>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Salaried</Text>
                    <Switch checked={salaried} onChange={setSalaried} style={{ background: salaried ? '#5B92E5' : '#B8C8E6' }} />
                  </Space>
                </div>

                <SliderRow label="Gross Annual Income" value={income} setValue={setIncome} max={5000000} color="#5B92E5" note="Total CTC before deductions" />
                <Divider style={{ margin: '4px 0 20px' }} />
                <Text style={{ fontSize: 11, color: '#6B7280', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 20 }}>Old Regime Deductions</Text>
                <SliderRow label={<TaxFieldLabel text="Section 80C" topic="80C" style={{ color: '#1F2937', fontWeight: 600, fontSize: 14 }} />} value={d80C} setValue={setD80C} max={150000} color="#08457E" note="Max ₹1.5L (PPF, ELSS, LIC, etc.)" />
                <SliderRow label={<TaxFieldLabel text="Section 80D (Health)" topic="80D" style={{ color: '#1F2937', fontWeight: 600, fontSize: 14 }} />} value={d80D} setValue={setD80D} max={50000} color="#08457E" note="Max ₹25K–₹50K" />
                <SliderRow label={<TaxFieldLabel text="NPS 80CCD(1B)" topic="80CCD_1B" style={{ color: '#1F2937', fontWeight: 600, fontSize: 14 }} />} value={dNPS} setValue={setDNPS} max={50000} color="#7C3AED" note="Extra ₹50K beyond 80C" />
                <SliderRow label={<TaxFieldLabel text="HRA Exemption" topic="HRA" style={{ color: '#1F2937', fontWeight: 600, fontSize: 14 }} />} value={dHRA} setValue={setDHRA} max={600000} color="#D97706" note="House Rent Allowance" />
                <SliderRow label="Home Loan Interest (24b)" value={homeLoan} setValue={setHomeLoan} max={200000} color="#DC2626" note="Max ₹2L self-occupied" />
              </Card>
            </Col>

            {/* Right — Results */}
            <Col xs={24} lg={10}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>

                {/* Winner Banner */}
                <Card style={{ borderRadius: 24, background: '#5B92E5', border: 'none' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Tag style={{ background: '#08457E', color: '#FFFFFF', border: 'none', borderRadius: 20, padding: '4px 16px', fontSize: 12, marginBottom: 12 }}>
                      RECOMMENDED
                    </Tag>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF' }}>{results.better}</div>
                    <div style={{ color: '#CCF1FF', fontSize: 14, marginTop: 4 }}>saves you more</div>
                    <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />
                    <div style={{ fontSize: 36, fontWeight: 800, color: '#10B981' }}>
                      ₹{results.savings.toLocaleString()}
                    </div>
                    <div style={{ color: '#CCF1FF', fontSize: 13 }}>annual savings vs other regime</div>
                  </div>
                </Card>

                {/* Comparison Cards */}
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <Card style={{ borderRadius: 20, border: results.better === 'Old Regime' ? '2px solid #5B92E5' : '1px solid #B8C8E6', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Old Regime</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: results.better === 'Old Regime' ? '#5B92E5' : '#6B7280' }}>
                        ₹{results.finalOld.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>{results.effectiveRateOld}% effective</div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card style={{ borderRadius: 20, border: results.better === 'New Regime' ? '2px solid #5B92E5' : '1px solid #B8C8E6', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>New Regime</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: results.better === 'New Regime' ? '#5B92E5' : '#6B7280' }}>
                        ₹{results.finalNew.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>{results.effectiveRateNew}% effective</div>
                    </Card>
                  </Col>
                </Row>

                {/* Breakdown */}
                <Card style={{ borderRadius: 20, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
                  <Text strong style={{ color: '#5B92E5', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>Breakdown</Text>
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'Gross Income', old: income, new: income },
                      { label: 'Total Deductions', old: results.totalOld, new: results.totalNew },
                      { label: 'Taxable Income', old: results.taxableOld, new: results.taxableNew },
                      { label: 'Final Tax (+ Cess)', old: results.finalOld, new: results.finalNew },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid #F2F3F4' : 'none' }}>
                        <Text style={{ fontSize: 13, color: '#6B7280' }}>{row.label}</Text>
                        <Space size={16}>
                          <Text style={{ fontSize: 13, color: '#6B7280', minWidth: 80, textAlign: 'right' }}>₹{row.old.toLocaleString()}</Text>
                          <Text style={{ fontSize: 13, color: '#5B92E5', fontWeight: 600, minWidth: 80, textAlign: 'right' }}>₹{row.new.toLocaleString()}</Text>
                        </Space>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 8 }}>
                    <Text style={{ fontSize: 11, color: '#6B7280' }}>← Old</Text>
                    <Text style={{ fontSize: 11, color: '#08457E' }}>New →</Text>
                  </div>
                </Card>

                {/* Tip */}
                <Card style={{ borderRadius: 20, background: '#F0FDF4', border: '1px solid #D1FAE5' }}>
                  <Space align="start">
                    <BulbOutlined style={{ color: '#059669', fontSize: 18, marginTop: 2 }} />
                    <div>
                      <Text strong style={{ color: '#059669', fontSize: 13 }}>Optimization Tip</Text>
                      <Paragraph style={{ color: '#065F46', fontSize: 13, margin: '4px 0 0' }}>
                        {results.better === 'Old Regime'
                          ? `You benefit from Old Regime because your deductions (₹${results.totalOld.toLocaleString()}) exceed the New Regime standard deduction (₹${results.totalNew.toLocaleString()}).`
                          : `New Regime is better for you. Your current deductions (₹${results.totalOld.toLocaleString()}) don't justify the Old Regime. Try maximizing 80C and NPS to flip this.`
                        }
                      </Paragraph>
                    </div>
                  </Space>
                </Card>

              </Space>
            </Col>
          </Row>

          <div style={{ marginTop: 40 }}>
            <TaxAssistantChatbot />
          </div>

        </Content>
      </div>
</Layout>
    </ConfigProvider>
  );
};

export default WhatIfSimulator;
