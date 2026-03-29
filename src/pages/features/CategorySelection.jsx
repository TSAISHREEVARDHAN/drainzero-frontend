import React, { useState } from 'react';
import {
    Layout,
    Card,
    Typography,
    Row,
    Col,
    Button,
    ConfigProvider,
    Space
} from 'antd';
import {
    CarOutlined,
    StockOutlined,
    MedicineBoxOutlined,
    HomeOutlined,
    ArrowRightOutlined,
    ArrowLeftOutlined,
    CheckCircleFilled
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
        icon: <CarOutlined style={{ fontSize: '32px' }} />,
        description: 'Optimize tax for cars, bikes, and other vehicles.'
    },
    {
        id: 'Stocks',
        title: 'Stocks / Investments',
        icon: <StockOutlined style={{ fontSize: '32px' }} />,
        description: 'Analysis for equity, mutual funds, and crypto.'
    },
    {
        id: 'Health Insurance',
        title: 'Health Insurance',
        icon: <MedicineBoxOutlined style={{ fontSize: '32px' }} />,
        description: 'Deductions for self, family, and parents.'
    },
    {
        id: 'Land',
        title: 'Land / Property',
        icon: <HomeOutlined style={{ fontSize: '32px' }} />,
        description: 'Tax benefits for residential and commercial property.'
    }
];

const SUBCATEGORIES = {
    'Vehicle': ['Car', 'Bike', 'Scooter'],
    'Stocks': ['Equity Shares', 'Mutual Funds', 'F&O Trading', 'Bonds / Debentures', 'Crypto'],
    'Health Insurance': ['Self', 'Family', 'Parents', 'Senior Parents'],
    'Land': ['Residential', 'Commercial', 'Agricultural Land', 'Plot / Vacant Land']
};

const OWNERSHIP_TYPES = ['First-hand', 'Second-hand'];

const CategorySelection = () => {
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [selectedOwnership, setSelectedOwnership] = useState(null);
    const [lastResult, setLastResult] = React.useState(null);

    // Check if returning user has previous results
    React.useEffect(() => {
        if (user) {
            getLastTaxResult(user.id).then(result => {
                if (result) setLastResult(result);
            }).catch(() => {});
        }
    }, [user]);

    const handleCategorySelect = (categoryId) => {
        setSelectedCategory(categoryId);
        setSelectedSubcategory(null);
        setSelectedOwnership(null);
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

    const proceedToAnalysis = (subcategory, ownership) => {
        navigate('/analysis', {
            state: {
                category: selectedCategory,
                subcategory: subcategory,
                ownership: ownership
            }
        });
    };

    const cardStyle = (isSelected) => ({
        borderRadius: '24px',
        border: isSelected ? '2px solid #5B92E5' : '2px solid transparent',
        boxShadow: isSelected
            ? '0 12px 40px rgba(8, 69, 126, 0.15)'
            : '0 8px 30px rgba(0, 0, 0, 0.04)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: '#FFFFFF',
        height: '100%',
        padding: '32px',
        position: 'relative',
        textAlign: 'center'
    });

    const subcategoryButtonStyle = (isSelected) => ({
        borderRadius: '16px',
        height: 'auto',
        padding: '18px 24px',
        fontSize: '16px',
        fontWeight: 600,
        textAlign: 'center',
        background: isSelected ? '#5B92E5' : '#FFFFFF',
        border: isSelected ? '1.5px solid #5B92E5' : '1.5px solid #B8C8E6',
        color: isSelected ? '#FFFFFF' : '#5B92E5',
        transition: 'all 0.2s ease',
        boxShadow: isSelected ? '0 8px 16px rgba(8, 69, 126, 0.2)' : 'none'
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
                <Content style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '24px 16px' }}>
                    {/* Back to login */}
                    <div style={{ marginBottom: '16px' }}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            onClick={() => navigate('/login')}
                            style={{ color: '#5B92E5', fontWeight: 600, padding: 0 }}
                        >
                            Back
                        </Button>
                    </div>

                    {/* Header */}
                    <div style={{ marginBottom: '64px', textAlign: 'center' }}>
                        <Title level={1} style={{ color: '#5B92E5', marginBottom: '12px', fontWeight: 800, fontSize: '3rem' }}>
                            Select Category
                        </Title>
                        <Paragraph style={{ fontSize: '1.25rem', color: '#4B5563', maxWidth: 600, margin: '0 auto' }}>
                            What activity would you like to analyze for tax optimization today?
                        </Paragraph>
                    </div>

                    {/* Returning User Banner */}
                    {lastResult && userProfile?.name && (
                        <div style={{
                            background: '#EEF3FA', borderRadius: 20, padding: '20px 28px',
                            marginBottom: 40, border: '1px solid #B8C8E6',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
                        }}>
                            <div>
                                <Text strong style={{ color: '#08457E', fontSize: 16 }}>
                                    Welcome back, {userProfile.name}! 👋
                                </Text>
                                <div style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>
                                    Your last analysis: Health Score <strong style={{ color: '#5B92E5' }}>{lastResult.health_score}/100</strong>
                                    {' · '}Recommended: <strong style={{ color: '#059669' }}>{lastResult.recommended_regime}</strong>
                                    {' · '}Leakage: <strong style={{ color: '#EF4444' }}>₹{(lastResult.total_leakage || 0).toLocaleString()}</strong>
                                </div>
                            </div>
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => navigate('/dashboard', { state: { backendResult: { ...lastResult, success: true, oldRegime: { totalTax: lastResult.old_tax }, newRegime: { totalTax: lastResult.new_tax }, healthScore: lastResult.health_score, recommendedRegime: lastResult.recommended_regime, leakageGaps: lastResult.leakage_gaps || [] }, formData: {}, category: '', subcategory: '', ownership: '' } })}
                                style={{ borderRadius: 10, background: '#5B92E5', border: 'none' }}
                            >
                                View Last Dashboard →
                            </Button>
                        </div>
                    )}

                    {/* Step 1: Main Category */}
                    <div style={{ marginBottom: '60px' }}>
                        <Title level={4} style={{ color: '#5B92E5', marginBottom: '24px', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
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
                                            width: '64px',
                                            height: '64px',
                                            background: selectedCategory === cat.id ? '#5B92E515' : '#F2F3F4',
                                            borderRadius: '18px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: selectedCategory === cat.id ? '#5B92E5' : '#5B92E5',
                                            marginBottom: '24px',
                                            margin: '0 auto 24px'
                                        }}>
                                            {cat.icon}
                                        </div>
                                        <Title level={4} style={{ margin: '0 0 12px 0', color: '#5B92E5', fontWeight: 700 }}>
                                            {cat.title}
                                        </Title>
                                        <Text style={{ fontSize: '14px', lineHeight: '1.5', color: '#6B7280' }}>
                                            {cat.description}
                                        </Text>
                                        {selectedCategory === cat.id && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '16px',
                                                right: '16px',
                                                color: '#5B92E5'
                                            }}>
                                                <CheckCircleFilled style={{ fontSize: '24px' }} />
                                            </div>
                                        )}
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </div>

                    {/* Step 2: Subcategory */}
                    {selectedCategory && (
                        <div style={{ marginBottom: '60px', animation: 'slideUp 0.4s ease-out' }}>
                            <Title level={4} style={{ color: '#5B92E5', marginBottom: '24px', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                02 — Select Subcategory
                            </Title>
                            <Row gutter={[16, 16]}>
                                {SUBCATEGORIES[selectedCategory].map((sub, index) => (
                                    <Col xs={24} sm={12} md={6} lg={4} key={index}>
                                        <Button
                                            block
                                            style={subcategoryButtonStyle(selectedSubcategory === sub)}
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

                    {/* Step 3: Ownership (Vehicle Only) */}
                    {selectedCategory === 'Vehicle' && selectedSubcategory && (
                        <div style={{ marginBottom: '60px', animation: 'slideUp 0.4s ease-out' }}>
                            <Title level={4} style={{ color: '#5B92E5', marginBottom: '24px', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                03 — Ownership Type
                            </Title>
                            <Row gutter={[16, 16]}>
                                {OWNERSHIP_TYPES.map((type, index) => (
                                    <Col xs={12} sm={8} md={6} key={index}>
                                        <Button
                                            block
                                            style={subcategoryButtonStyle(selectedOwnership === type)}
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

                    <div style={{ marginTop: '80px' }} />

                    <style>
                        {`
                            @keyframes slideUp {
                                from { opacity: 0; transform: translateY(20px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                            .selection-card:hover {
                                transform: translateY(-8px);
                                box-shadow: 0 15px 35px rgba(8, 69, 126, 0.08) !important;
                            }
                            .sub-btn:hover {
                                border-color: #5B92E5 !important;
                                color: #5B92E5 !important;
                            }
                        `}
                    </style>
                </Content>
            </div>
            </Layout>
        </ConfigProvider>
    );
};

export default CategorySelection;
