import React, { useEffect, useMemo, useState } from 'react';
import {
  Layout, Card, Typography, Row, Col, Button, ConfigProvider, Space, Tag
} from 'antd';
import {
  CarOutlined, StockOutlined, MedicineBoxOutlined, HomeOutlined,
  CheckCircleFilled, ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { getLastTaxResult } from '../../services/profileService';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const CATEGORIES = [
  {
    id: 'Vehicle',
    title: 'Vehicle',
    icon: <CarOutlined style={{ fontSize: 32 }} />,
    description: 'Optimize tax for cars, bikes, and other vehicles.'
  },
  {
    id: 'Stocks',
    title: 'Stocks / Investments',
    icon: <StockOutlined style={{ fontSize: 32 }} />,
    description: 'Analysis for equity, mutual funds, and crypto.'
  },
  {
    id: 'Health Insurance',
    title: 'Health Insurance',
    icon: <MedicineBoxOutlined style={{ fontSize: 32 }} />,
    description: 'Deductions for self, family, and parents.'
  },
  {
    id: 'Land',
    title: 'Land / Property',
    icon: <HomeOutlined style={{ fontSize: 32 }} />,
    description: 'Tax benefits for residential and commercial property.'
  }
];

const SUBCATEGORIES = {
  Vehicle: ['Car', 'Bike', 'Scooter'],
  Stocks: ['Equity Shares', 'Mutual Funds', 'F&O Trading', 'Bonds / Debentures', 'Crypto'],
  'Health Insurance': ['Self', 'Family', 'Parents', 'Senior Parents'],
  Land: ['Residential', 'Commercial', 'Agricultural Land', 'Plot / Vacant Land']
};

const OWNERSHIP_TYPES = ['First-hand', 'Second-hand'];

const fmt = (n) => `₹${Math.round(Number(n || 0)).toLocaleString('en-IN')}`;

export default function CategorySelection() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedOwnership, setSelectedOwnership] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!user) return;

    getLastTaxResult(user.id)
      .then((result) => {
        if (mounted && result) setLastResult(result);
      })
      .catch(() => {});

    return () => { mounted = false; };
  }, [user]);

  const firstName = useMemo(() => {
    const raw = userProfile?.name || userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    return raw.split(' ')[0];
  }, [userProfile, user]);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
    setSelectedOwnership(null);
  };

  const proceedToAnalysis = (subcategory, ownership) => {
    navigate('/analysis', {
      state: {
        category: selectedCategory,
        subcategory,
        ownership
      }
    });
  };

  const handleSubcategorySelect = (subcategory) => {
    setSelectedSubcategory(subcategory);
    if (selectedCategory !== 'Vehicle') {
      proceedToAnalysis(subcategory, null);
    }
  };

  const handleOwnershipSelect = (ownership) => {
    setSelectedOwnership(ownership);
    proceedToAnalysis(selectedSubcategory, ownership);
  };

  const cardStyle = (isSelected) => ({
    borderRadius: 24,
    border: isSelected ? '2px solid #5B92E5' : '2px solid transparent',
    boxShadow: isSelected ? '0 12px 40px rgba(8,69,126,0.15)' : '0 8px 30px rgba(0,0,0,0.04)',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    background: '#FFFFFF',
    height: '100%',
    padding: 32,
    position: 'relative',
    textAlign: 'center'
  });

  const choiceButtonStyle = (isSelected) => ({
    borderRadius: 16,
    height: 'auto',
    padding: '18px 24px',
    fontSize: 16,
    fontWeight: 600,
    textAlign: 'center',
    background: isSelected ? '#5B92E5' : '#FFFFFF',
    border: isSelected ? '1.5px solid #5B92E5' : '1.5px solid #B8C8E6',
    color: isSelected ? '#FFFFFF' : '#5B92E5',
    transition: 'all 0.2s ease',
    boxShadow: isSelected ? '0 8px 16px rgba(8,69,126,0.2)' : 'none'
  });

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#5B92E5',
          borderRadius: 20,
          fontFamily: "'Outfit', sans-serif",
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: '#F2F3F4' }}>
        <Navbar />
        <div style={{ padding: '24px 16px' }}>
          <Content style={{ maxWidth: 1100, margin: '0 auto', width: '100%', padding: '24px 16px' }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/dashboard')}
              style={{ color: '#5B92E5', fontWeight: 600, padding: 0, marginBottom: 20 }}
            >
              Back
            </Button>

            <div style={{ marginBottom: 34, textAlign: 'center' }}>
              <Title level={1} style={{ color: '#5B92E5', marginBottom: 8, fontWeight: 800 }}>
                Select Category
              </Title>
              <Paragraph style={{ color: '#4B5563', fontSize: 16, marginBottom: 0 }}>
                What activity would you like to analyze for tax optimization today?
              </Paragraph>
            </div>

            {lastResult && (
              <Card
                style={{
                  borderRadius: 24,
                  border: '1px solid #C9DAF5',
                  boxShadow: '0 8px 24px rgba(8,69,126,0.06)',
                  marginBottom: 36,
                  background: '#F8FBFF'
                }}
                bodyStyle={{ padding: '22px 24px' }}
              >
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
                      <span style={{ color: '#EF4444', fontWeight: 700 }}>
                        {fmt(lastResult.total_leakage || 0)}
                      </span>
                    </div>
                  </Col>
                  <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                    <Button
                      type="primary"
                      onClick={() => navigate('/dashboard')}
                      style={{ height: 44, borderRadius: 12, fontWeight: 700 }}
                    >
                      Open Dashboard
                    </Button>
                  </Col>
                </Row>
              </Card>
            )}

            <div style={{ marginBottom: 60 }}>
              <Title level={4} style={{ color: '#5B92E5', marginBottom: 24, opacity: 0.9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                01 — Main Category
              </Title>
              <Row gutter={[24, 24]}>
                {CATEGORIES.map((cat) => (
                  <Col xs={24} sm={12} md={6} key={cat.id}>
                    <div
                      style={cardStyle(selectedCategory === cat.id)}
                      onClick={() => handleCategorySelect(cat.id)}
                      className="selection-card"
                    >
                      <div style={{
                        width: 64,
                        height: 64,
                        background: selectedCategory === cat.id ? '#5B92E515' : '#F2F3F4',
                        borderRadius: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#5B92E5',
                        margin: '0 auto 24px'
                      }}>
                        {cat.icon}
                      </div>
                      <Title level={4} style={{ margin: '0 0 12px 0', color: '#5B92E5', fontWeight: 700 }}>
                        {cat.title}
                      </Title>
                      <Text style={{ fontSize: 14, lineHeight: 1.5, color: '#6B7280' }}>
                        {cat.description}
                      </Text>

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

            {selectedCategory && (
              <div style={{ marginBottom: 60, animation: 'slideUp 0.28s ease-out' }}>
                <Title level={4} style={{ color: '#5B92E5', marginBottom: 24, opacity: 0.9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                  02 — Select Subcategory
                </Title>
                <Row gutter={[16, 16]}>
                  {SUBCATEGORIES[selectedCategory].map((sub) => (
                    <Col xs={24} sm={12} md={6} lg={4} key={sub}>
                      <Button
                        block
                        style={choiceButtonStyle(selectedSubcategory === sub)}
                        onClick={() => handleSubcategorySelect(sub)}
                        className="sub-btn"
                      >
                        {sub}
                      </Button>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {selectedCategory === 'Vehicle' && selectedSubcategory && (
              <div style={{ marginBottom: 60, animation: 'slideUp 0.28s ease-out' }}>
                <Title level={4} style={{ color: '#5B92E5', marginBottom: 24, opacity: 0.9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                  03 — Ownership Type
                </Title>
                <Row gutter={[16, 16]}>
                  {OWNERSHIP_TYPES.map((type) => (
                    <Col xs={12} sm={8} md={6} key={type}>
                      <Button
                        block
                        style={choiceButtonStyle(selectedOwnership === type)}
                        onClick={() => handleOwnershipSelect(type)}
                        className="sub-btn"
                      >
                        {type}
                      </Button>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            <style>{`
              @keyframes slideUp {
                from { opacity: 0; transform: translateY(12px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .selection-card:hover {
                transform: translateY(-6px);
                box-shadow: 0 15px 35px rgba(8,69,126,0.08) !important;
              }
              .sub-btn:hover {
                border-color: #5B92E5 !important;
                color: #5B92E5 !important;
              }
            `}</style>
          </Content>
        </div>
      </Layout>
    </ConfigProvider>
  );
}
