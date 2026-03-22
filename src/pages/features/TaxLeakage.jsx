import React from 'react';
import { Layout, Typography, Card, Row, Col, Space, Button, List, Tag, Statistic, ConfigProvider } from 'antd';
import { ArrowLeftOutlined, WarningOutlined, InfoCircleFilled } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import TaxAssistantChatbot from '../../components/TaxAssistantChatbot';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const TaxLeakage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    if (!location.state) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <Title level={2}>Tax Leakage Detection</Title>
                <div style={{ padding: '60px', background: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <p>Analysis data not available. Please enter your details first.</p>
                    <Button type="primary" onClick={() => navigate('/category-selection')}>Begin Analysis</Button>
                </div>
            </div>
        );
    }

    const { category, subcategory, ownership, formData, backendResult } = location.state || {};

    // Use backend leakage gaps if available, else compute locally
    const backendGaps = backendResult?.leakageGaps || [];
    const backendTotalLeakage = backendResult?.totalLeakage || 0;
    
    const missed80C = Math.max(0, 150000 - (formData?.deduction80C || 0));
    const slabRate = (formData?.annualSalary || 0) > 1500000 ? 0.30 : 0.20;

    let leakageItems = [];
    let totalLeakage = 0;
    
    // If backend gave us real leakage gaps, use those instead
    if (backendGaps.length > 0) {
        leakageItems = backendGaps.map(g => ({
            title: g.label || g.section || 'Tax Saving Opportunity',
            description: g.description || `Utilize this deduction to reduce your tax liability.`,
            potential: g.taxSaved || 0,
            tag: g.section || 'Deduction'
        }));
        totalLeakage = backendTotalLeakage;
    }

    // Local computation fallback when no backend data
    if (backendGaps.length === 0) {
    // 1. 80C Leakage
    if (missed80C > 1000) {
        const potentialSave = missed80C * slabRate;
        leakageItems.push({
            title: 'Unused 80C Limit',
            description: `You have ₹${missed80C.toLocaleString()} left in your Section 80C limit (LIC, PPF, ELSS, etc).`,
            potential: potentialSave,
            tag: 'Investment'
        });
        totalLeakage += potentialSave;
    }

    // 2. NPS Leakage (80CCD 1B - extra 50k)
    const currentNPS = formData?.deductionNPS || 0;
    const missedNPS = Math.max(0, 50000 - currentNPS);
    if (missedNPS > 1000) {
        const potentialSave = missedNPS * slabRate;
        leakageItems.push({
            title: 'NPS Extra Benefit (80CCD 1B)',
            description: `You are missing out on the additional ₹50,000 deduction available only for NPS contributions.`,
            potential: potentialSave,
            tag: 'Retirement'
        });
        totalLeakage += potentialSave;
    }

    // 3. 80D Leakage
    const currentClaimed80D = formData?.deduction80D || 0;
    const premiumAmount = formData?.premiumAmount || 0;
    const coverageType = formData?.coverageType || '';
    const limit80D = (formData?.hasSeniorCitizen === 'yes' || coverageType === 'Senior Parents') ? 50000 : 25000;
    const potential80DValue = Math.min(premiumAmount + (formData?.preventiveCheckup || 0), limit80D);
    const missed80D = Math.max(0, potential80DValue - currentClaimed80D);

    if (missed80D > 1000) {
        const potentialSave = missed80D * slabRate;
        leakageItems.push({
            title: 'Health Insurance (80D) Leakage',
            description: `Claiming ₹${missed80D.toLocaleString()} more in Section 80D (Health Premiums + Preventive Checkups) can reduce tax.`,
            potential: potentialSave,
            tag: 'Health'
        });
        totalLeakage += potentialSave;
    }

    // 4. Vehicle Module Leakage
    if (category === 'Vehicle') {
        // EV Benefit
        if (formData.fuelType === 'Electric' && !formData.loanInterestPaid) {
            leakageItems.push({
                title: 'EV 80EEB Benefit Missed',
                description: `Electric vehicles qualify for ₹1.5L interest deduction. You are using personal capital instead of tax-efficient debt.`,
                potential: 150000 * slabRate,
                tag: 'EV Benefit'
            });
            totalLeakage += 150000 * slabRate;
        }

        // Business Usage Depreciation
        if (formData.usageType === 'Business' && formData.employmentType === 'Self-Employed' && (formData.businessUsagePercentage || 100) < 100) {
            leakageItems.push({
                title: 'Under-utilized Business Depreciation',
                description: `You have logged less than 100% business usage. Increasing this to actual usage can shield more income via depreciation.`,
                potential: 15000,
                tag: 'Business'
            });
            totalLeakage += 15000;
        }

        // Salary Optimization (Salaried)
        if (formData.employmentType === 'Salaried' && !formData.fuelReimbursement) {
            leakageItems.push({
                title: 'Salary Structure Not Optimized',
                description: `Fuel, Maintenance and Driver salary reimbursements are tax-free. Your current structure taxes these as pure salary.`,
                potential: 36000,
                tag: 'Salary Struct'
            });
            totalLeakage += 36000;
        }
    }

    // 5. Stocks & F&O Leakage
    if (category === 'Stocks' || category === 'Investments') {
        if (formData.assetType === 'F&O Trading' && formData.numTrades > 50 && !formData.brokerage) {
            leakageItems.push({
                title: 'Missing F&O Business Expenses',
                description: `F&O is a business. You haven't claimed brokerage, internet, or advisory costs which could reduce taxable profit.`,
                potential: 10000,
                tag: 'Business'
            });
            totalLeakage += 10000;
        }
        
        if (formData.hasCapitalLoss === 'yes' && !formData.lossCarryForward) {
             leakageItems.push({
                title: 'Unclaimed Loss Carry Forward',
                description: `Previous capital losses can offset current gains. You haven't utilized your 8-year carry forward window.`,
                potential: 5000,
                tag: 'Capital Gains'
            });
            totalLeakage += 5000;
        }
    }

    // 6. Property Leakage
    if (category === 'Land' || category === 'Property') {
        if (formData.propertyOwnershipType === 'Self-occupied' && !formData.loanInterestPaid) {
            leakageItems.push({
                title: 'Missing Home Loan Interest (24b)',
                description: `You are missing out on up to ₹2,00,000 deduction on home loan interest for self-occupied property.`,
                potential: 200000 * slabRate,
                tag: 'Property'
            });
            totalLeakage += 200000 * slabRate;
        }

        if (formData.propertyOwnershipType === 'Let-out' && !formData.municipalTaxes) {
            leakageItems.push({
                title: 'Missing Municipal Tax Deduction',
                description: `Municipal taxes are deductible from rental income before applying the 30% standard deduction.`,
                potential: 3000,
                tag: 'Rental'
            });
            totalLeakage += 3000;
        }
    }

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
                <Content style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '24px 16px' }}>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/dashboard', { state: location.state })}
                        style={{ marginBottom: '24px', borderRadius: '12px', fontWeight: 600, color: '#5B92E5' }}
                    >
                        Back to Dashboard
                    </Button>

                    <Title level={2} style={{ color: '#5B92E5', fontWeight: 800 }}>
                        Tax Leakage Detection
                    </Title>
                    <Paragraph style={{ color: '#6B7280', fontSize: '16px', marginBottom: '40px' }}>
                        Identifying efficiency gaps where you are paying more tax than legally necessary.
                    </Paragraph>

                    <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
                        <Col span={24}>
                            <Card
                                style={{ borderRadius: '24px', background: '#EF444408', border: '1px solid #FCA5A5' }}
                                bodyStyle={{ padding: '40px' }}
                            >
                                <Row align="middle" gutter={24}>
                                    <Col xs={24} md={12}>
                                        <Space direction="vertical" size={12}>
                                            <Tag color="red" style={{ fontWeight: 700, borderRadius: '4px' }} icon={<WarningOutlined />}>HIGH LEAKAGE FOUND</Tag>
                                            <Title level={1} style={{ margin: 0, color: '#5B92E5', fontWeight: 800 }}>
                                                ₹{totalLeakage.toLocaleString()}
                                            </Title>
                                            <Text style={{ fontSize: '18px', color: '#4B5563' }}>Total Estimated Annual Tax Leakage</Text>
                                        </Space>
                                    </Col>
                                    <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                                        <div style={{ padding: '24px', background: '#FFFFFF', borderRadius: '20px', display: 'inline-block', minWidth: '240px', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.05)' }}>
                                            <Statistic title={<span style={{ color: '#5B92E5' }}>Estimated Tax Leakage</span>} value={Math.round(totalLeakage)} prefix="₹" valueStyle={{ color: '#EF4444', fontWeight: 800 }} />
                                        </div>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>

                    <Card
                        title={<Space><InfoCircleFilled style={{ color: '#5B92E5' }} /> <span>Leakage Breakdown</span></Space>}
                        style={{ borderRadius: '24px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
                    >
                        <List
                            itemLayout="horizontal"
                            dataSource={leakageItems}
                            renderItem={(item) => (
                                <List.Item style={{ padding: '24px 0' }} extra={
                                    <Statistic
                                        value={item.potential}
                                        prefix="₹"
                                        valueStyle={{ fontSize: '18px', color: '#EF4444', fontWeight: 700 }}
                                        title={<span style={{ fontSize: '12px' }}>Potential Savings</span>}
                                    />
                                }>
                                    <List.Item.Meta
                                        title={<Space><Text strong style={{ fontSize: '18px', color: '#5B92E5' }}>{item.title}</Text><Tag color="orange" style={{ borderRadius: '4px' }}>{item.tag}</Tag></Space>}
                                        description={<Text style={{ fontSize: '15px', color: '#6B7280' }}>{item.description}</Text>}
                                    />
                                </List.Item>
                            )}
                        />

                        <div style={{ marginTop: '32px', textAlign: 'center' }}>
                            <Button
                                type="primary"
                                size="large"
                                style={{ borderRadius: '50px', height: '52px', padding: '0 40px', fontWeight: 700 }}
                                onClick={() => navigate('/feature/recommendations', { state: location.state })}
                            >
                                Get Fix Recommendations <ArrowLeftOutlined style={{ rotate: '180deg', marginLeft: '8px' }} />
                            </Button>
                        </div>
                    </Card>

                    <div style={{ marginTop: '40px' }}>
                        <TaxAssistantChatbot />
                    </div>

                    <style>
                        {`
                            .ant-list-item-meta-title { margin-bottom: 8px !important; }
                        `}
                    </style>
                </Content>
            </div>
</Layout>
        </ConfigProvider>
    );
};

export default TaxLeakage;
