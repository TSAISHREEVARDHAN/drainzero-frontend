import React from 'react';
import { Layout, Typography, Card, Row, Col, Statistic, Table, Tag, Button, ConfigProvider, Space, Alert, Spin } from 'antd';
import { ArrowLeftOutlined, CheckCircleFilled, SwapOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import dayjs from 'dayjs';
import TaxAssistantChatbot from '../../components/TaxAssistantChatbot';
import useProfileData from '../../hooks/useProfileData';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const RegimeComparison = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { formData, backendResult, dataLoading, category, subcategory, ownership } = useProfileData();

    if (dataLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F2F3F4' }}><Spin size="large" /></div>;
    }

    if (!formData) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <Title level={2}>Regime Comparison</Title>
                <div style={{ padding: '60px', background: '#fff', borderRadius: '24px' }}>
                    <p>Please complete the analysis form first.</p>
                    <Button type="primary" onClick={() => navigate('/category-selection')}>Start New Analysis</Button>
                </div>
            </div>
        );
    }

    // ── If backend result available, use it directly ──
    const hasBackend = backendResult?.success && backendResult?.oldRegime && backendResult?.newRegime;
    // Extract slab tax and rebate from backend if available
    const bSlabOld   = hasBackend ? (backendResult.oldRegime.slabTax ?? backendResult.oldRegime.baseTax) : 0;
    const bSlabNew   = hasBackend ? (backendResult.newRegime.slabTax ?? backendResult.newRegime.baseTax) : 0;
    const bRebateOld = hasBackend ? (backendResult.oldRegime.rebate87A ?? 0) : 0;
    const bRebateNew = hasBackend ? (backendResult.newRegime.rebate87A ?? 0) : 0;
    const bCessOld   = hasBackend ? (backendResult.oldRegime.cess ?? 0) : 0;
    const bCessNew   = hasBackend ? (backendResult.newRegime.cess ?? 0) : 0;
    const bFinalOld  = hasBackend ? (backendResult.oldRegime.totalTax || 0) : null;
    const bFinalNew  = hasBackend ? (backendResult.newRegime.totalTax || 0) : null;
    const bSavings   = hasBackend ? (backendResult.saving || Math.abs(bFinalOld - bFinalNew)) : null;
    const bBest      = hasBackend ? (backendResult.recommendedRegime === 'old' ? 'Old Regime' : 'New Regime') : null;

    // 1. Gross Income Calculation
    const salary = formData.annualSalary || 0;
    const bonus = formData.bonus || 0;
    const otherIncome = formData.otherIncome || 0;
    const dividendIncome = formData.dividendIncome || 0;

    // Employer Provided Car Perquisite (Valuation Rules)
    let carPerquisite = 0;
    if (category === 'Vehicle' && formData.isEmployerProvided === 'yes') {
        const basePerk = subcategory === 'Car' ? 2400 : 1800; // Simplified engine size logic
        const driverPerk = formData.driverProvided === 'yes' ? 900 : 0;
        carPerquisite = (basePerk + driverPerk) * 12;
    }

    // Stocks / Capital Gains Logic
    let capitalGainsTax = 0;
    let businessIncome = 0;
    if (category === 'Stocks' || category === 'Investments') {
        const gain = (formData.sellingAmount || 0) - (formData.purchaseAmount || 0) - (formData.brokerage || 0);
        if (gain > 0) {
            const assetType = formData.assetType || subcategory;
            if (assetType === 'Crypto') {
                capitalGainsTax = gain * 0.30;
            } else if (assetType === 'F&O Trading') {
                businessIncome = gain; // Treated as business income
            } else {
                // Equity / MF / Real Estate (FY 25-26 rules)
                const holdPeriodMonths = dayjs(formData.sellingDate).diff(dayjs(formData.purchaseDate), 'month');
                const isLongTerm = assetType === 'Equity' || assetType === 'Mutual Funds' ? holdPeriodMonths >= 12 : holdPeriodMonths >= 24;
                
                if (isLongTerm) {
                    // LTCG: 12.5% (Exemption 1.25L for financial assets)
                    const exemption = (assetType === 'Equity' || assetType === 'Mutual Funds') ? 125000 : 0;
                    capitalGainsTax = Math.max(0, gain - exemption) * 0.125;
                } else {
                    // STCG: 20% for Equity, Slab for others
                    if (assetType === 'Equity' || assetType === 'Mutual Funds') {
                        capitalGainsTax = gain * 0.20;
                    } else {
                        businessIncome += gain;
                    }
                }
            }
        }
    }

    const grossTotalIncome = salary + bonus + otherIncome + dividendIncome + businessIncome + carPerquisite;

    // 2. Old Regime Deductions
    const stdDeductionOld = 50000;
    const d80C = Math.min(formData.deduction80C || 0, 150000);
    
    // 80D Logic with age enforcement
    let d80D = 0;
    const hasSenior = formData.hasSeniorCitizen === 'yes' || formData.coverageType === 'Senior Parents';
    const limit80D = hasSenior ? 50000 : 25000;
    d80D = Math.min((formData.premiumAmount || 0) + (formData.preventiveCheckup || 0), limit80D);
    // NPS 80CCD(1B)
    const dNPS = Math.min(formData.deductionNPS || 0, 50000);
    const dHRA = formData.hraDeduction || 0;

    // Vehicle (Old Regime Specific / Business)
    let vehicleBenefitOld = 0;
    if (category === 'Vehicle') {
        // Business usage depreciation
        if (formData.usageType === 'Business' && formData.employmentType === 'Self-Employed') {
            const depRate = subcategory === 'Car' ? 0.15 : 0.30;
            const dep = (formData.purchasePrice || 0) * depRate * ((formData.businessUsagePercentage || 100) / 100);
            vehicleBenefitOld += dep;
        }
        // 80EEB EV Benefit
        if (formData.fuelType === 'Electric') {
            vehicleBenefitOld += Math.min(formData.loanInterestPaid || 0, 150000);
        }
    }

    // Home Loan Interest
    let propertyBenefitOld = 0;
    if (category === 'Land' || category === 'Property') {
        if (formData.propertyOwnershipType === 'Self-occupied') {
            propertyBenefitOld = Math.min(formData.loanInterestPaid || 0, 200000);
        } else {
            // Rented: 30% Std Ded + Full Interest (Interest set off against rental income)
            const nav = (formData.rentalIncome || 0) - (formData.municipalTaxes || 0);
            propertyBenefitOld = (nav * 0.30) + (formData.loanInterestPaid || 0);
        }
    }

    const totalDeductionsOld = stdDeductionOld + d80C + d80D + dNPS + dHRA + vehicleBenefitOld + propertyBenefitOld;

    // 3. New Regime Deductions
    const stdDeductionNew = 75000;
    let vehicleBenefitNew = 0;
    // 80EEB allowed in both regimes as per user prompt
    if (category === 'Vehicle' && formData.fuelType === 'Electric') {
        vehicleBenefitNew = Math.min(formData.loanInterestPaid || 0, 150000);
    }
    const totalDeductionsNew = stdDeductionNew + vehicleBenefitNew;

    // 4. Tax Calculation Engine (FY 2025-26)
    const calcTaxOld = (taxable) => {
        if (taxable <= 250000) return 0;
        if (taxable <= 500000) return (taxable - 250000) * 0.05;
        if (taxable <= 1000000) return 12500 + (taxable - 500000) * 0.20;
        return 112500 + (taxable - 1000000) * 0.30;
    };

    const calcTaxNew = (taxable) => {
        // FY 2025-26 (Budget 2025) slabs
        if (taxable <= 400000)  return 0;
        if (taxable <= 800000)  return (taxable - 400000) * 0.05;
        if (taxable <= 1200000) return 20000 + (taxable - 800000) * 0.10;
        if (taxable <= 1600000) return 60000 + (taxable - 1200000) * 0.15;
        if (taxable <= 2000000) return 120000 + (taxable - 1600000) * 0.20;
        if (taxable <= 2400000) return 200000 + (taxable - 2000000) * 0.25;
        return 300000 + (taxable - 2400000) * 0.30;
    };

    const taxableIncomeOld = Math.max(0, grossTotalIncome - totalDeductionsOld);
    const taxableIncomeNew = Math.max(0, grossTotalIncome - totalDeductionsNew);

    let taxOld = calcTaxOld(taxableIncomeOld);
    let taxNew = calcTaxNew(taxableIncomeNew);

    // Rebate 87A — New Regime: full rebate if taxable ≤ ₹12L (Budget 2025)
    if (taxableIncomeNew <= 1200000) taxNew = 0;
    // Rebate 87A — Old Regime: full rebate if taxable ≤ ₹5L
    if (taxableIncomeOld <= 500000) taxOld = 0;

    // Apply 4% cess to local calculation too (backend already includes it)
    const localCessOld = Math.round(taxOld * 0.04);
    const localCessNew = Math.round(taxNew * 0.04);
    // Use backend values if available, else use local calculation (with cess)
    const finalTaxOld = hasBackend ? bFinalOld : Math.round(taxOld + localCessOld + capitalGainsTax);
    const finalTaxNew = hasBackend ? bFinalNew : Math.round(taxNew + localCessNew + capitalGainsTax);
    const bestRegime  = hasBackend ? bBest : (finalTaxNew <= finalTaxOld ? 'New Regime' : 'Old Regime');
    const savings     = hasBackend ? bSavings : Math.abs(finalTaxOld - finalTaxNew);

    const columns = [
        { title: 'Tax Component', dataIndex: 'label', key: 'label', width: '40%' },
        { title: 'Old Regime', dataIndex: 'old', key: 'old', render: (v) => <Text strong>₹{Math.round(v).toLocaleString()}</Text> },
        { title: 'New Regime', dataIndex: 'new', key: 'new', render: (v) => <Text strong>₹{Math.round(v).toLocaleString()}</Text> },
    ];

    const data = [
        { key: 1, label: 'Gross Total Income', old: grossTotalIncome, new: grossTotalIncome },
        { key: 2, label: 'Standard Deduction', old: stdDeductionOld, new: stdDeductionNew },
        { key: 3, label: 'Traditional Deductions (80C, 80D, HRA etc.)', old: d80C + d80D + dNPS + dHRA, new: 0 },
        { key: 4, label: `Asset Specific Benefits (${category})`, old: vehicleBenefitOld + propertyBenefitOld, new: vehicleBenefitNew },
        { key: 5, label: 'Taxable Slab Income', old: taxableIncomeOld, new: taxableIncomeNew },
        { key: 6, label: 'Slab Tax (Before Rebate & Cess)', old: hasBackend ? bSlabOld : taxOld, new: hasBackend ? bSlabNew : taxNew },
        { key: 7, label: 'Section 87A Rebate (Budget 2025)',
            old: hasBackend ? -bRebateOld : (taxableIncomeOld <= 500000 ? -Math.min(calcTaxOld(taxableIncomeOld), 12500) : 0),
            // local: rebate = full slab tax (since taxNew is already 0 after rebate, we show pre-rebate as the rebate amount)
            new: hasBackend ? -bRebateNew : (taxableIncomeNew <= 1200000 ? -calcTaxNew(taxableIncomeNew) : 0) },
        { key: 8, label: '4% Health & Education Cess', old: hasBackend ? bCessOld : localCessOld, new: hasBackend ? bCessNew : localCessNew },
        { key: 9, label: 'Capital Gains / VDA Tax', old: capitalGainsTax, new: capitalGainsTax },
        { key: 10, label: 'Total Tax Payable (Final)', old: finalTaxOld, new: finalTaxNew },
    ];

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

                    <div style={{ marginBottom: '40px' }}>
                        <Title level={2} style={{ color: '#5B92E5', fontWeight: 800, marginBottom: '8px' }}>
                            Regime Comparison Analysis
                        </Title>
                        <Paragraph style={{ color: '#6B7280', fontSize: '16px' }}>
                            FY 2025-26 updated tax slabs applied to your {subcategory} ({ownership}) analysis.
                        </Paragraph>
                    </div>

                    <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
                        <Col xs={24} md={8}>
                            <Card style={{ borderRadius: '24px', textAlign: 'center', height: '100%', border: 'none' }}>
                                <Statistic title="Old Regime Tax (incl. 4% cess)" value={Math.round(finalTaxOld)} prefix="₹" precision={0} valueStyle={{ color: '#6B7280' }} />
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card style={{ borderRadius: '24px', textAlign: 'center', height: '100%', border: '2px solid #5B92E5', background: '#EEF3F9' }}>
                                <Statistic title="New Regime Tax (incl. 4% cess)" value={Math.round(finalTaxNew)} prefix="₹" precision={0} valueStyle={{ color: '#5B92E5', fontWeight: 800 }} />
                                {finalTaxNew === 0 && <Tag color="green" style={{ marginTop: '8px', borderRadius: '4px' }}>₹0 Tax — 87A Rebate Applied</Tag>}
                                {bestRegime === 'New Regime' && finalTaxNew > 0 && <Tag color="blue" style={{ marginTop: '8px', borderRadius: '4px' }}>Recommended</Tag>}
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card style={{ borderRadius: '24px', textAlign: 'center', height: '100%', background: '#5B92E5' }}>
                                <Statistic
                                    title={<span style={{ color: '#CCF1FF' }}>Annual Potential Savings</span>}
                                    value={savings}
                                    prefix="₹"
                                    precision={0}
                                    valueStyle={{ color: '#FFFFFF', fontWeight: 800 }}
                                />
                                <div style={{ color: '#10B981', fontWeight: 600, marginTop: '8px' }}>
                                    <CheckCircleFilled /> Switch to {bestRegime}
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {savings === 0 && finalTaxNew === 0 && finalTaxOld === 0 && (
                        <Alert
                            message="Both regimes result in zero tax. Your income is within full rebate limits."
                            type="success"
                            showIcon
                            style={{ marginBottom: '24px', borderRadius: '16px' }}
                        />
                    )}
                    {finalTaxNew === 0 && finalTaxOld > 0 && (
                        <Alert
                            icon={<CheckCircleFilled />}
                            message={
                                <span>
                                    <strong>New Regime wins — ₹0 tax on your income!</strong>{' '}
                                    Budget 2025 Section 87A rebate applies: taxable income ₹{Math.round(taxableIncomeNew).toLocaleString()} is within the ₹12L rebate limit,
                                    making your entire new-regime tax liability zero. Switch to New Regime and save ₹{Math.round(finalTaxOld).toLocaleString()} vs Old Regime.
                                </span>
                            }
                            type="success"
                            showIcon
                            style={{ marginBottom: '24px', borderRadius: '16px' }}
                        />
                    )}

                    <Card
                        title={<Space><SwapOutlined /> Detailed Tax Computation Table</Space>}
                        style={{ borderRadius: '24px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
                    >
                        <Table
                            columns={columns}
                            dataSource={data}
                            pagination={false}
                            style={{ borderRadius: '16px', overflow: 'hidden' }}
                        />

                        <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#F2F3F4', borderRadius: '16px' }}>
                            <Title level={4} style={{ color: '#5B92E5', marginBottom: '16px' }}>Analysis Insights</Title>
                            <Row gutter={[24, 16]}>
                                <Col xs={24} md={12}>
                                    <Space align="start">
                                        <InfoCircleOutlined style={{ color: '#5B92E5', marginTop: '4px' }} />
                                        <Text><strong>Best Option:</strong> {bestRegime} saves you ₹{Math.round(savings).toLocaleString()} annually due to your specific investment profile.</Text>
                                    </Space>
                                </Col>
                                {formData.isEV && (
                                    <Col xs={24} md={12}>
                                        <Space align="start">
                                            <InfoCircleOutlined style={{ color: '#10B981', marginTop: '4px' }} />
                                            <Text><strong>EV Benefit:</strong> Your Electric Vehicle provides an additional interest deduction under 80EEB in the Old Regime.</Text>
                                        </Space>
                                    </Col>
                                )}
                                {category === 'Stocks' && capitalGainsTax > 0 && (
                                    <Col xs={24} md={12}>
                                        <Space align="start">
                                            <InfoCircleOutlined style={{ color: '#F59E0B', marginTop: '4px' }} />
                                            <Text><strong>Investments:</strong> Capital gains are taxed identically in both regimes, but slab income benefits differ.</Text>
                                        </Space>
                                    </Col>
                                )}
                            </Row>
                        </div>
                    </Card>

                    <div style={{ marginTop: '40px' }}>
                        <TaxAssistantChatbot />
                    </div>
                </Content>
            </div>
</Layout>
        </ConfigProvider>
    );
};

export default RegimeComparison;
