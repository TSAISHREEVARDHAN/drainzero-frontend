import React from 'react';
import { Layout, Typography, Card, Space, Button, Statistic, Progress, Row, Col, List, Tag, ConfigProvider } from 'antd';
import { ArrowLeftOutlined, SafetyCertificateFilled, CheckCircleFilled, WarningOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import TaxAssistantChatbot from '../../components/TaxAssistantChatbot';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const TaxHealth = () => {
    const location = useLocation();
    const navigate = useNavigate();

    if (!location.state) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <Title level={2}>Tax Health Score</Title>
                <div style={{ padding: '60px', background: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <p>Financial health score calculation requires input data. Please complete the optimization form.</p>
                    <Button type="primary" onClick={() => navigate('/category-selection')}>Get Scored</Button>
                </div>
            </div>
        );
    }

    const { category, subcategory, formData, backendResult } = location.state || {};
    const salary = formData?.annualSalary || 0;
    const otherIncome = formData?.otherIncome || 0;

    // ── Use backend health score if available, else compute locally ──
    let scoreFinal, factors;

    if (backendResult?.healthScore !== undefined && backendResult?.healthScore !== null) {
        // REAL backend score
        scoreFinal = backendResult.healthScore;
        // Build factors from real leakage gaps
        factors = (backendResult.leakageGaps || []).map(gap => ({
            status: 'warning',
            title: gap.label || gap.section || 'Missed Deduction',
            description: `You could save ₹${(gap.taxSaved || 0).toLocaleString()} by utilizing this benefit.`
        }));
        if (factors.length === 0) {
            factors.push({ status: 'success', title: 'Fully Optimized', description: 'No significant leakage gaps found. Your tax planning is efficient.' });
        }
    } else {
        // LOCAL fallback — compute from form data
        let score = 100;
        factors = [];
        const d80C = formData?.deduction80C || 0;
        if (d80C < 150000) { score -= 15; factors.push({ status: 'warning', title: 'Sec 80C Utilization', description: `₹${(150000 - d80C).toLocaleString()} gap remaining in ₹1.5L limit.` }); }
        else { factors.push({ status: 'success', title: 'Sec 80C', description: 'Fully utilized ₹1.5L limit.' }); }
        const dNPS = formData?.deductionNPS || 0;
        if (dNPS < 50000) { score -= 10; factors.push({ status: 'warning', title: 'NPS 80CCD(1B)', description: `₹${(50000 - dNPS).toLocaleString()} extra NPS deduction available.` }); }
        else { factors.push({ status: 'success', title: 'NPS', description: 'NPS retirement benefit maximized.' }); }
        const d80D = formData?.deduction80D || 0;
        if (d80D < 25000) { score -= 10; factors.push({ status: 'warning', title: 'Health Insurance 80D', description: 'Health insurance coverage below optimal.' }); }
        else { factors.push({ status: 'success', title: 'Health Shield', description: 'Health cover is well utilized.' }); }
        if (category === 'Stocks' && formData?.assetType === 'Crypto') { score -= 15; factors.push({ status: 'warning', title: 'Crypto Tax', description: '30% flat tax with no loss set-off.' }); }
        scoreFinal = Math.max(20, score);
    }

    let level = 'Good';
    let statusColor = '#10B981';
    if (scoreFinal < 50) { level = 'Poor'; statusColor = '#EF4444'; }
    else if (scoreFinal < 80) { level = 'Moderate'; statusColor = '#F59E0B'; }

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
          <div style={{ padding: '32px 24px' }}>
                <Content style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/dashboard', { state: location.state })}
                        style={{ marginBottom: '24px', borderRadius: '12px', fontWeight: 600, color: '#5B92E5' }}
                    >
                        Back to Dashboard
                    </Button>

                    <Title level={2} style={{ color: '#5B92E5', fontWeight: 800 }}>
                        Tax Health Score
                    </Title>
                    <Paragraph style={{ color: '#6B7280', fontSize: '16px', marginBottom: '40px' }}>
                        Your overall fiscal efficiency score across regime, investments, and assets.
                    </Paragraph>

                    <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
                        <Col xs={24} md={12}>
                            <Card
                                style={{ borderRadius: '24px', textAlign: 'center', height: '100%', padding: '40px 20px' }}
                                bodyStyle={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                            >
                                <Progress
                                    type="dashboard"
                                    percent={scoreFinal}
                                    strokeColor={statusColor}
                                    strokeWidth={10}
                                    width={220}
                                    gapDegree={40}
                                    format={(percent) => (
                                        <div style={{ padding: '0 20px' }}>
                                            <div style={{ fontSize: '48px', fontWeight: 800, color: '#5B92E5' }}>{percent}</div>
                                            <div style={{ fontSize: '16px', color: '#6B7280', marginTop: '-10px' }}>out of 100</div>
                                        </div>
                                    )}
                                />
                                <div style={{ marginTop: '24px' }}>
                                    <Tag color={statusColor === '#10B981' ? 'green' : statusColor === '#F59E0B' ? 'orange' : 'red'} style={{ padding: '4px 20px', fontSize: '16px', fontWeight: 700, borderRadius: '50px' }}>
                                        {level} Optimization
                                    </Tag>
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card
                                style={{ borderRadius: '24px', height: '100%', background: '#5B92E5', color: '#FFFFFF' }}
                                title={<span style={{ color: '#FFFFFF' }}>Optimization Breakdown</span>}
                            >
                                <List
                                    dataSource={factors}
                                    renderItem={(item) => (
                                        <List.Item style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 0' }}>
                                            <List.Item.Meta
                                                avatar={item.status === 'success' ? <CheckCircleFilled style={{ color: '#10B981', fontSize: '20px' }} /> : <WarningOutlined style={{ color: '#F59E0B', fontSize: '20px' }} />}
                                                title={<Text style={{ color: '#FFFFFF', fontWeight: 600 }}>{item.title}</Text>}
                                                description={<Text style={{ color: '#CCF1FF', fontSize: '13px' }}>{item.description}</Text>}
                                            />
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Card
                        style={{ borderRadius: '24px', border: 'none', padding: '24px', backgroundColor: '#FFFFFF' }}
                        title={<Space><SafetyCertificateFilled style={{ color: '#5B92E5' }} /> <span>Improvement Strategy</span></Space>}
                    >
                        <Paragraph style={{ color: '#4B5563', fontSize: '15px', lineHeight: 2 }}>
                            To reach a <strong>Perfect Score (100)</strong>, you should:
                            <ul style={{ paddingLeft: '20px', marginTop: '12px' }}>
                                <li>Fully utilize Section 80C through voluntary provident funds (VPF) or ELSS mutual funds.</li>
                                <li>Claim the additional ₹50,000 deduction under Section 80CCD(1B) for NPS.</li>
                                {category === 'Vehicle' && (
                                    <li>Restructure your {subcategory} ownership to business usage if eligible, claiming 15% annual depreciation.</li>
                                )}
                                {category === 'Health Insurance' && (
                                    <>
                                        <li>Maximize Parents' 80D limit (₹50k if seniors) by paying their premiums from your taxable income.</li>
                                        <li>Always claim the ₹5,000 preventive health checkup - no separate receipts needed if paid digitally.</li>
                                    </>
                                )}
                                <li>Ensure medical premium receipts cover both health checkups and primary insurance.</li>
                            </ul>
                        </Paragraph>
                    </Card>
                    <TaxAssistantChatbot />
                </Content>
            </div>
</Layout>
        </ConfigProvider>
    );
};

export default TaxHealth;
