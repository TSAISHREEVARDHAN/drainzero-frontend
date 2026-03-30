import React, { useEffect, useMemo, useState } from 'react';
import {
  Layout, Card, Typography, Row, Col, Button,
  ConfigProvider, Space, Tag, Modal, Form,
  InputNumber, Radio, Divider, message, Alert
} from 'antd';
import {
  CarOutlined, StockOutlined, MedicineBoxOutlined, HomeOutlined,
  CheckCircleFilled, ArrowLeftOutlined, PlusCircleOutlined,
  LoadingOutlined, CheckCircleOutlined, WarningOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { getLastTaxResult } from '../../services/profileService';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const CATEGORIES = [
  { id: 'Vehicle',          title: 'Vehicle',             icon: <CarOutlined style={{ fontSize: 32 }} />,         description: 'Optimize tax for cars, bikes, and other vehicles.' },
  { id: 'Stocks',           title: 'Stocks / Investments', icon: <StockOutlined style={{ fontSize: 32 }} />,       description: 'Analysis for equity, mutual funds, and crypto.' },
  { id: 'Health Insurance', title: 'Health Insurance',    icon: <MedicineBoxOutlined style={{ fontSize: 32 }} />, description: 'Deductions for self, family, and parents.' },
  { id: 'Land',             title: 'Land / Property',     icon: <HomeOutlined style={{ fontSize: 32 }} />,        description: 'Tax benefits for residential and commercial property.' },
];

const SUBCATEGORIES = {
  Vehicle          : ['Car', 'Bike', 'Scooter'],
  Stocks           : ['Equity Shares', 'Mutual Funds', 'F&O Trading', 'Bonds / Debentures', 'Crypto'],
  'Health Insurance': ['Self', 'Family', 'Parents', 'Senior Parents'],
  Land             : ['Residential', 'Commercial', 'Agricultural Land', 'Plot / Vacant Land'],
};

const OWNERSHIP_TYPES = ['First-hand', 'Second-hand'];

const fmtInr = (n) => `₹${Math.round(Number(n || 0)).toLocaleString('en-IN')}`;
const numFmt  = (v) => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
const numParse= (v) => v ? v.replace(/,/g, '') : '0';

// ─────────────────────────────────────
//  Income Details Modal
// ─────────────────────────────────────
const IncomeModal = ({ open, onCancel, onSuccess }) => {
  const { user, markIncomeDataSaved } = useAuth();
  const [form]   = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    let values;
    try { values = await form.validateFields(); } catch { return; }

    const salary = parseFloat(values.annualSalary) || 0;
    if (salary <= 0) {
      message.error('Annual income must be greater than ₹0');
      return;
    }

    setSaving(true);
    try {
      const bonus = parseFloat(values.bonus) || 0;
      const gross = salary + bonus;

      const payload = {
        user_id          : user.id,
        gross_salary     : gross,
        basic_da         : gross * 0.40,
        hra_received     : gross * 0.20,
        bonus            : bonus,
        other_income     : parseFloat(values.otherIncome)   || 0,
        // FIX: enforce statutory caps with Math.min()
        section_80c      : Math.min(parseFloat(values.deduction80C) || 0, 150000),
        section_80d      : Math.min(parseFloat(values.deduction80D) || 0, 25000),
        nps_personal     : Math.min(parseFloat(values.deductionNPS) || 0, 50000),
        hra_deduction    : parseFloat(values.hraDeduction)  || 0,
        professional_tax : 2500,
        preferred_regime : values.regimePreference || 'Auto Suggest',
        updated_at       : new Date().toISOString(),
      };

      const { error } = await supabase
        .from('income_profile')
        .upsert(payload, { onConflict: 'user_id' });

      // FIX: only show success when DB write confirmed (response.ok)
      if (error) throw new Error(error.message);

      markIncomeDataSaved();
      message.success('✅ Details saved successfully');
      form.resetFields();
      onSuccess();
    } catch (err) {
      message.error(`❌ Failed to save: ${err.message}`);
    } finally {
      // FIX: always clear loading — no infinite spinner
      setSaving(false);
    }
  };

  const inputStyle = { borderRadius: 12, height: 48, width: '100%' };
  const lbl        = { color: '#08457E', fontWeight: 600 };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={<span style={{ color: '#08457E', fontWeight: 700, fontSize: 18 }}>Add Income Details</span>}
      footer={null}
      width={620}
      destroyOnClose
    >
      <Alert
        message="Recommended based on your income and deductions"
        description="These values power Regime Comparison, Health Score, Leakage Detection and every other feature. Saved once, reused everywhere."
        type="info" showIcon style={{ borderRadius: 12, marginBottom: 24 }}
      />
      <Form form={form} layout="vertical" requiredMark={false}>
        <Title level={5} style={{ color: '#08457E', marginBottom: 16 }}>Annual Income</Title>
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item name="annualSalary" label={<Text style={lbl}>Gross Annual Income (₹) *</Text>}
              rules={[
                { required: true, message: 'Income is required' },
                { validator: (_, v) => Number(v) > 0 ? Promise.resolve() : Promise.reject('Must be greater than ₹0') },
              ]}>
              <InputNumber style={inputStyle} prefix="₹" min={0} formatter={numFmt} parser={numParse} placeholder="e.g. 1200000" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="bonus" label={<Text style={lbl}>Annual Bonus (₹)</Text>}>
              <InputNumber style={inputStyle} prefix="₹" min={0} formatter={numFmt} parser={numParse} placeholder="e.g. 100000" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="otherIncome" label={<Text style={lbl}>Other Income (₹)</Text>}>
              <InputNumber style={inputStyle} prefix="₹" min={0} formatter={numFmt} parser={numParse} placeholder="Rent, interest etc." />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="regimePreference" label={<Text style={lbl}>Regime Preference</Text>} initialValue="Auto Suggest">
              <Radio.Group buttonStyle="solid">
                <Radio.Button value="Auto Suggest">Auto</Radio.Button>
                <Radio.Button value="Old Regime">Old</Radio.Button>
                <Radio.Button value="New Regime">New</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        <Divider />
        <Title level={5} style={{ color: '#08457E', marginBottom: 16 }}>Deductions <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 13 }}>(optional)</span></Title>
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item name="deduction80C" label={<Text style={lbl}>80C Investments (₹)</Text>} extra="Max ₹1,50,000">
              <InputNumber style={inputStyle} prefix="₹" min={0} max={150000} formatter={numFmt} parser={numParse} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="deduction80D" label={<Text style={lbl}>80D Health Premium (₹)</Text>} extra="Max ₹25,000">
              <InputNumber style={inputStyle} prefix="₹" min={0} max={25000} formatter={numFmt} parser={numParse} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="deductionNPS" label={<Text style={lbl}>NPS 80CCD(1B) (₹)</Text>} extra="Max ₹50,000">
              <InputNumber style={inputStyle} prefix="₹" min={0} max={50000} formatter={numFmt} parser={numParse} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="hraDeduction" label={<Text style={lbl}>HRA Exemption (₹)</Text>}>
              <InputNumber style={inputStyle} prefix="₹" min={0} formatter={numFmt} parser={numParse} />
            </Form.Item>
          </Col>
        </Row>

        <Button
          type="primary" block
          loading={saving} disabled={saving}
          onClick={handleSave}
          icon={saving ? <LoadingOutlined /> : <CheckCircleOutlined />}
          style={{ height: 52, borderRadius: 14, background: '#5B92E5', border: 'none', fontWeight: 700, fontSize: 16, marginTop: 8 }}
        >
          {saving ? 'Saving...' : 'Save Income Details'}
        </Button>
      </Form>
    </Modal>
  );
};

// ─────────────────────────────────────
//  CategorySelection
// ─────────────────────────────────────
export default function CategorySelection() {
  const navigate = useNavigate();
  const { user, userProfile, hasIncomeData } = useAuth();

  const [selectedCategory,    setSelectedCategory]    = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedOwnership,   setSelectedOwnership]   = useState(null);
  const [lastResult,          setLastResult]          = useState(null);
  const [modalOpen,           setModalOpen]           = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!user) return;
    getLastTaxResult(user.id)
      .then(r => { if (mounted && r) setLastResult(r); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [user]);

  const firstName = useMemo(() => {
    const raw = userProfile?.name || userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    return raw.split(' ')[0];
  }, [userProfile, user]);

  const handleCategorySelect = (id) => {
    setSelectedCategory(id);
    setSelectedSubcategory(null);
    setSelectedOwnership(null);
  };

  const proceedToAnalysis = (subcategory, ownership) =>
    navigate('/analysis', { state: { category: selectedCategory, subcategory, ownership } });

  const handleSubcategorySelect = (sub) => {
    setSelectedSubcategory(sub);
    if (selectedCategory !== 'Vehicle') proceedToAnalysis(sub, null);
  };

  const handleOwnershipSelect = (ownership) => {
    setSelectedOwnership(ownership);
    proceedToAnalysis(selectedSubcategory, ownership);
  };

  const cardStyle = (sel) => ({
    borderRadius: 24,
    border      : sel ? '2px solid #5B92E5' : '2px solid transparent',
    boxShadow   : sel ? '0 12px 40px rgba(8,69,126,0.15)' : '0 8px 30px rgba(0,0,0,0.04)',
    cursor      : 'pointer',
    transition  : 'all 0.25s ease',
    background  : '#FFFFFF',
    height      : '100%',
    padding     : 32,
    position    : 'relative',
    textAlign   : 'center',
  });

  const choiceBtn = (sel) => ({
    borderRadius: 16, height: 'auto', padding: '18px 24px',
    fontSize: 16, fontWeight: 600, textAlign: 'center',
    background : sel ? '#5B92E5' : '#FFFFFF',
    border     : sel ? '1.5px solid #5B92E5' : '1.5px solid #B8C8E6',
    color      : sel ? '#FFFFFF' : '#5B92E5',
    transition : 'all 0.2s ease',
    boxShadow  : sel ? '0 8px 16px rgba(8,69,126,0.2)' : 'none',
  });

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#5B92E5', borderRadius: 20, fontFamily: "'Outfit', sans-serif" } }}>
      <Layout style={{ minHeight: '100vh', background: '#F2F3F4' }}>
        <Navbar />
        <div style={{ padding: '24px 16px' }}>
          <Content style={{ maxWidth: 1100, margin: '0 auto', width: '100%', padding: '24px 16px' }}>

            {/* ── INCOME GATE: show warning if no income data ── */}
            {!hasIncomeData && (
              <Card style={{
                borderRadius: 20, border: '2px solid #F59E0B',
                background: '#FFFBEB', marginBottom: 28,
                boxShadow: '0 4px 20px rgba(245,158,11,0.12)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <WarningOutlined style={{ color: '#D97706', fontSize: 20 }} />
                      <Text strong style={{ color: '#92400E', fontSize: 16 }}>Add Income Details Required</Text>
                    </div>
                    <Text style={{ color: '#78350F', fontSize: 14 }}>
                      Income data is needed to enable the Analyze button and produce accurate tax results.
                    </Text>
                  </div>
                  <Button
                    type="primary" icon={<PlusCircleOutlined />}
                    onClick={() => setModalOpen(true)}
                    style={{ height: 48, borderRadius: 12, background: '#D97706', border: 'none', fontWeight: 700, flexShrink: 0 }}
                  >
                    Add Income Details
                  </Button>
                </div>
              </Card>
            )}

            {hasIncomeData && (
              <Alert type="success" showIcon
                message="Income data loaded — Analyze button is enabled"
                style={{ borderRadius: 14, marginBottom: 24 }}
              />
            )}

            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')}
              style={{ color: '#5B92E5', fontWeight: 600, padding: 0, marginBottom: 20 }}>
              Back
            </Button>

            <div style={{ marginBottom: 34, textAlign: 'center' }}>
              <Title level={1} style={{ color: '#5B92E5', marginBottom: 8, fontWeight: 800 }}>Select Category</Title>
              <Paragraph style={{ color: '#4B5563', fontSize: 16, marginBottom: 0 }}>
                What activity would you like to analyze for tax optimization today?
              </Paragraph>
            </div>

            {/* Returning user summary */}
            {lastResult && (
              <Card style={{ borderRadius: 24, border: '1px solid #C9DAF5', boxShadow: '0 8px 24px rgba(8,69,126,0.06)', marginBottom: 36, background: '#F8FBFF' }}>
                <Row gutter={[16, 16]} align="middle" justify="space-between">
                  <Col xs={24} md={16}>
                    <Title level={4} style={{ color: '#08457E', margin: 0, fontWeight: 800 }}>
                      Welcome back, {firstName}.
                    </Title>
                    <div style={{ marginTop: 8, color: '#5B6475', fontSize: 15 }}>
                      Your last analysis:
                      <span style={{ color: '#5B92E5', fontWeight: 700 }}> Health Score {Number(lastResult.health_score || 0)}/100</span>
                      <span> · Recommended: </span>
                      <span style={{ color: '#08457E', fontWeight: 700, textTransform: 'capitalize' }}>
                        {lastResult.recommended_regime || 'N/A'}
                      </span>
                      <span> · Leakage: </span>
                      <span style={{ color: '#EF4444', fontWeight: 700 }}>{fmtInr(lastResult.total_leakage || 0)}</span>
                    </div>
                  </Col>
                  <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                    <Button type="primary" onClick={() => navigate('/dashboard')}
                      style={{ height: 44, borderRadius: 12, fontWeight: 700 }}>
                      Open Dashboard
                    </Button>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Step 1: Category */}
            <div style={{ marginBottom: 60 }}>
              <Title level={4} style={{ color: '#5B92E5', marginBottom: 24, opacity: 0.9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                01 — Main Category
              </Title>
              <Row gutter={[24, 24]}>
                {CATEGORIES.map(cat => (
                  <Col xs={24} sm={12} md={6} key={cat.id}>
                    <div style={cardStyle(selectedCategory === cat.id)}
                      onClick={() => handleCategorySelect(cat.id)} className="selection-card">
                      <div style={{ width: 64, height: 64, background: selectedCategory === cat.id ? '#5B92E515' : '#F2F3F4', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5B92E5', margin: '0 auto 24px' }}>
                        {cat.icon}
                      </div>
                      <Title level={4} style={{ margin: '0 0 12px', color: '#5B92E5', fontWeight: 700 }}>{cat.title}</Title>
                      <Text style={{ fontSize: 14, lineHeight: 1.5, color: '#6B7280' }}>{cat.description}</Text>
                      {selectedCategory === cat.id && (
                        <div style={{ position: 'absolute', top: 16, right: 16, color: '#5B92E5' }}>
                          <CheckCircleFilled style={{ fontSize: 24 }} />
                        </div>
                      )}
                    </div>
                  </Col>
                ))}
              </Row>
            </div>

            {/* Step 2: Subcategory */}
            {selectedCategory && (
              <div style={{ marginBottom: 60, animation: 'slideUp 0.28s ease-out' }}>
                <Title level={4} style={{ color: '#5B92E5', marginBottom: 24, opacity: 0.9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                  02 — Select Subcategory
                </Title>
                <Row gutter={[16, 16]}>
                  {SUBCATEGORIES[selectedCategory].map(sub => (
                    <Col xs={24} sm={12} md={6} lg={4} key={sub}>
                      <Button block style={choiceBtn(selectedSubcategory === sub)}
                        onClick={() => handleSubcategorySelect(sub)} className="sub-btn">
                        {sub}
                      </Button>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Step 3: Ownership (Vehicle only) */}
            {selectedCategory === 'Vehicle' && selectedSubcategory && (
              <div style={{ marginBottom: 60, animation: 'slideUp 0.28s ease-out' }}>
                <Title level={4} style={{ color: '#5B92E5', marginBottom: 24, opacity: 0.9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                  03 — Ownership Type
                </Title>
                <Row gutter={[16, 16]}>
                  {OWNERSHIP_TYPES.map(type => (
                    <Col xs={12} sm={8} md={6} key={type}>
                      <Button block style={choiceBtn(selectedOwnership === type)}
                        onClick={() => handleOwnershipSelect(type)} className="sub-btn">
                        {type}
                      </Button>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            <style>{`
              @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
              .selection-card:hover { transform:translateY(-6px); box-shadow:0 15px 35px rgba(8,69,126,0.08) !important; }
              .sub-btn:hover { border-color:#5B92E5 !important; color:#5B92E5 !important; }
            `}</style>
          </Content>
        </div>
      </Layout>

      <IncomeModal open={modalOpen} onCancel={() => setModalOpen(false)} onSuccess={() => setModalOpen(false)} />
    </ConfigProvider>
  );
}
