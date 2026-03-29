import React, { useState, useEffect } from 'react';
import {
    Layout, Card, Form, Input, InputNumber, Button, Typography,
    Space, Row, Col, Divider, Select, ConfigProvider, Radio,
    Tag, message, Collapse, Tooltip, DatePicker, Switch, Alert
} from 'antd';
import {
    ArrowRightOutlined, ArrowLeftOutlined, CarOutlined,
    SafetyCertificateOutlined, DollarOutlined, LineChartOutlined,
    MedicineBoxOutlined, StockOutlined, HomeOutlined,
    InfoCircleOutlined, SafetyOutlined, TransactionOutlined,
    GlobalOutlined, BankOutlined, RocketOutlined, SwapOutlined,
    EditOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { runFullAnalysis, getExistingProfile, mapProfileToForm } from '../services/profileService';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const AnalysisForm = ({
    category: propCategory,
    subcategory: propSubcategory,
    ownership: propOwnership
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [savedProfile, setSavedProfile] = useState(null);

    const category    = propCategory    || location.state?.category    || 'Vehicle';
    const subcategory = propSubcategory || location.state?.subcategory || 'Car';
    const ownership   = propOwnership   || location.state?.ownership   || 'First-hand';

    const isVehicle         = category === 'Vehicle';
    const isHealthInsurance = category === 'Health Insurance';
    const isStocks          = category === 'Stocks' || category === 'Investments';
    const isLand            = category === 'Land' || category === 'Property';

    const employmentType     = Form.useWatch('employmentType', form) || 'Salaried';
    const usageType          = Form.useWatch('usageType', form) || 'Personal';
    const hasLoan            = Form.useWatch('hasLoan', form) || 'no';
    const isEmployerProvided = Form.useWatch('isEmployerProvided', form) || 'no';
    const propertyStatus     = Form.useWatch('propertyStatus', form) || null;
    const hasPropertyLoan    = Form.useWatch('hasPropertyLoan', form) || 'no';
    const ageGroup           = Form.useWatch('ageGroup', form) || 'under-60';
    const rentalIncome       = Form.useWatch('rentalIncome', form) || 0;
    const sellingPrice       = Form.useWatch('sellingPrice', form) || 0;
    const isCoOwned          = Form.useWatch('isCoOwned', form) || 'no';

    // Validation watchers
    const vPurchasePrice  = Form.useWatch('purchasePrice', form) || 0;
    const vPurchaseDate   = Form.useWatch('purchaseDate', form) || null;
    const hPremiumAmount  = Form.useWatch('premiumAmount', form) || 0;
    const lPurchasePrice  = Form.useWatch('propertyPurchasePrice', form) || 0;
    const lPropertyStatus = Form.useWatch('propertyStatus', form) || null;
    const stName          = Form.useWatch('stockName', form);
    const mfName          = Form.useWatch('fundName', form);
    const fnoBuy          = Form.useWatch('totalBuyValue', form);
    const bondName        = Form.useWatch('bondName', form);
    const cryptoName      = Form.useWatch('cryptoName', form);
    const hAge            = Form.useWatch('hAge', form);
    const hOldestAge      = Form.useWatch('hOldestAge', form);
    const hParentAgeGroup = Form.useWatch('hParentAgeGroup', form);
    const hParentAge      = Form.useWatch('hParentAge', form);

    // ── Load saved income profile from Supabase on mount ──
    useEffect(() => {
        const load = async () => {
            if (!user) return;
            const profile = await getExistingProfile(user.id);
            if (profile) {
                setSavedProfile(profile);
                // Pre-fill form with saved global income & deductions
                const mapped = mapProfileToForm(profile);
                form.setFieldsValue(mapped);
            }
        };
        load();
    }, [user]);

    const checkFormValidity = () => {
        // NEW USERS must add income details first before analysis can run
        if (!savedProfile) return false;
        // Income is loaded from Supabase — just check category-specific fields
        if (isVehicle) return vPurchasePrice > 0 && vPurchaseDate && usageType;
        if (isStocks) {
            if (subcategory === 'Equity Shares')     return !!stName;
            if (subcategory === 'Mutual Funds')      return !!mfName;
            if (subcategory === 'F&O Trading')       return fnoBuy > 0;
            if (subcategory === 'Bonds / Debentures') return !!bondName;
            if (subcategory === 'Crypto')            return !!cryptoName;
            return true;
        }
        if (isHealthInsurance) {
            const basic = hPremiumAmount > 0;
            if (subcategory === 'Self')           return basic && hAge > 0;
            if (subcategory === 'Family')         return basic && hOldestAge > 0;
            if (subcategory === 'Parents')        return basic && !!hParentAgeGroup;
            if (subcategory === 'Senior Parents') return basic && hParentAge >= 60;
            return basic;
        }
        if (isLand) return lPurchasePrice > 0 && lPropertyStatus;
        return true;
    };

    const isFormValid = checkFormValidity();

    const onFinish = async (values) => {
        // Merge saved profile income/deductions with category-specific form values
        const mergedValues = {
            annualSalary    : savedProfile?.gross_salary      || 0,
            bonus           : savedProfile?.bonus             || 0,
            otherIncome     : savedProfile?.other_income      || 0,
            deduction80C    : savedProfile?.section_80c       || 0,
            deduction80D    : savedProfile?.section_80d       || 0,
            deductionNPS    : savedProfile?.nps_personal      || 0,
            hraDeduction    : savedProfile?.hra_deduction     || savedProfile?.hra_received || 0,
            professionalTax : savedProfile?.professional_tax  || 2500,
            regimePreference: savedProfile?.preferred_regime  || 'Auto Suggest',
            ...values,
            purchaseAmount: values.purchaseAmount || ((values.purchasePrice || 0) * (values.quantity || 0)) || values.investmentAmount || values.totalBuyValue || 0,
            sellingAmount : values.sellingAmount  || ((values.sellingPrice  || 0) * (values.quantity || 0)) || values.redemptionAmount || values.totalSellValue  || 0,
        };

        // Numeric sanitization
        const numericFields = [
            'purchasePrice','loanAmount','interestRate','loanTenure','downPayment',
            'fuelReimbursement','maintenanceReimbursement','driverSalaryReimbursement','businessUsagePercentage',
            'resaleValue','insuranceCost','purchasePricePerShare','purchaseQuantity','sellPricePerShare','sellQuantity',
            'dividendIncome','brokerage','sttPaid','lossCarryForward','premiumAmount','employerContribution',
            'preventiveCheckup','propertyPurchasePrice','rentalIncome','municipalTaxes','sellingPrice',
            'loanInterestPaid','loanPrincipalPaid','coOwnedPercentage','reinvest54F',
            'annualSalary','bonus','otherIncome','deduction80C','deduction80D','deductionNPS','hraDeduction','professionalTax',
            'stampDutyCharges','monthlyRent','monthsRented','maintenanceCharges','propertyBrokerage','reinvest54',
            'hSumInsured','hAge','hOldestAge','hParentsCount','hParentAge','hMedicalExpenses','hAdditionalPremium'
        ];
        numericFields.forEach(key => {
            if (mergedValues[key] === undefined || mergedValues[key] === null || mergedValues[key] === '') {
                mergedValues[key] = 0;
            }
        });

        let backendResult = null;
        if (user) {
            try {
                setSubmitting(true);
                message.loading({ content: 'Running analysis...', key: 'analysis', duration: 0 });
                backendResult = await runFullAnalysis(user.id, user.email, mergedValues, category, subcategory, ownership);
                message.success({ content: 'Analysis complete!', key: 'analysis', duration: 2 });
            } catch (err) {
                message.destroy('analysis');
                console.warn('Backend analyse failed, using local computation:', err.message);
            } finally {
                setSubmitting(false);
                message.destroy('analysis');
            }
        }

        navigate('/dashboard', {
            state: { formData: mergedValues, backendResult, category, subcategory, ownership }
        });
    };

    const onFinishFailed = () => {
        message.error('Please fill required fields before running tax analysis.');
    };

    const cardStyle = {
        borderRadius: '24px', border: 'none',
        boxShadow: '0 4px 25px rgba(0,0,0,0.04)',
        background: '#FFFFFF', marginBottom: '24px'
    };
    const inputStyle = { borderRadius: '12px', height: '48px', width: '100%' };

    // ── VEHICLE INPUTS ──
    const renderVehicleInputs = () => (
        <>
            <Card title={<Space><CarOutlined style={{ color: '#5B92E5' }} /><span>Vehicle Details ({subcategory})</span></Space>} style={cardStyle}>
                <Row gutter={[24, 0]}>
                    <Col xs={24} md={12}>
                        <Form.Item label="Vehicle Category" name="vehicleCategory" initialValue={subcategory} rules={[{ required: true }]}>
                            <Input style={inputStyle} disabled />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Fuel / Propulsion Type" name="fuelType" initialValue="Petrol" rules={[{ required: true }]}>
                            <Select style={inputStyle} placeholder="Select Fuel Type">
                                <Option value="Petrol">Petrol</Option>
                                {subcategory === 'Car' && <Option value="Diesel">Diesel</Option>}
                                <Option value="Electric">Electric</Option>
                                {subcategory === 'Car' && <Option value="Hybrid">Hybrid</Option>}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Purchase Price (₹)" name="purchasePrice" rules={[{ required: true, message: 'Please enter purchase price' }]}>
                            <InputNumber style={inputStyle} prefix="₹" min={0} placeholder="Price in INR" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Purchase Date" name="purchaseDate" rules={[{ required: true }]}>
                            <DatePicker style={inputStyle} format="DD-MM-YYYY" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Employment Type" name="employmentType" initialValue="Salaried" rules={[{ required: true }]}>
                            <Radio.Group onChange={e => { if (e.target.value === 'Salaried') form.setFieldsValue({ usageType: 'Personal' }); }}>
                                <Space size={16}>
                                    <Radio value="Salaried">Salaried</Radio>
                                    <Radio value="Self-Employed">Self-Employed</Radio>
                                </Space>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Usage Type" name="usageType" rules={[{ required: true }]} help="Business usage only for self-employed.">
                            <Select style={inputStyle} placeholder="Select Usage">
                                <Option value="Personal">Personal</Option>
                                {employmentType === 'Self-Employed' && <Option value="Business">Business</Option>}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Registration Date" name="registrationDate">
                            <DatePicker style={inputStyle} format="DD-MM-YYYY" />
                        </Form.Item>
                    </Col>
                    {Form.useWatch('fuelType', form) === 'Electric' && hasLoan === 'yes' && (
                        <Col xs={24}>
                            <Alert message="EV Loan Benefit: You are eligible for Section 80EEB deduction (up to ₹1.5L interest)." type="success" showIcon style={{ marginBottom: 16, borderRadius: 12 }} />
                        </Col>
                    )}
                </Row>
            </Card>

            {employmentType === 'Salaried' && (
                <Card title={<Space><CarOutlined style={{ color: '#5B92E5' }} /><span>Employer Provided {subcategory} (Perquisites)</span></Space>} style={cardStyle}>
                    <Row gutter={[24, 0]}>
                        <Col xs={24}>
                            <Form.Item label={`Is the ${subcategory.toLowerCase()} provided by your employer?`} name="isEmployerProvided" initialValue="no">
                                <Radio.Group buttonStyle="solid">
                                    <Radio.Button value="no">No</Radio.Button>
                                    <Radio.Button value="yes">Yes</Radio.Button>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        {isEmployerProvided === 'yes' && (
                            <>
                                <Col xs={24} md={8}><Form.Item label="Fuel Paid by Employer?" name="fuelByEmployer" initialValue="no"><Radio.Group size="small"><Radio value="yes">Yes</Radio> <Radio value="no">No</Radio></Radio.Group></Form.Item></Col>
                                <Col xs={24} md={8}><Form.Item label="Maintenance by Employer?" name="maintenanceByEmployer" initialValue="no"><Radio.Group size="small"><Radio value="yes">Yes</Radio> <Radio value="no">No</Radio></Radio.Group></Form.Item></Col>
                                {subcategory === 'Car' && <Col xs={24} md={8}><Form.Item label="Driver Provided?" name="driverProvided" initialValue="no"><Radio.Group size="small"><Radio value="yes">Yes</Radio> <Radio value="no">No</Radio></Radio.Group></Form.Item></Col>}
                            </>
                        )}
                    </Row>
                </Card>
            )}

            <Card title={<Space><DollarOutlined style={{ color: '#5B92E5' }} /><span>Vehicle Loan Details</span></Space>} style={cardStyle}>
                <Row gutter={[24, 0]}>
                    <Col xs={24}>
                        <Form.Item label="Did you take a vehicle loan?" name="hasLoan" initialValue="no">
                            <Radio.Group buttonStyle="solid"><Radio.Button value="no">No</Radio.Button><Radio.Button value="yes">Yes</Radio.Button></Radio.Group>
                        </Form.Item>
                    </Col>
                    {hasLoan === 'yes' && (
                        <>
                            <Col xs={24} md={12}><Form.Item label="Loan Amount (₹)" name="loanAmount" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col>
                            <Col xs={24} md={12}><Form.Item label="Interest Rate (%)" name="interestRate" rules={[{ required: true }]}><InputNumber style={inputStyle} suffix="%" min={0} max={30} step={0.1} /></Form.Item></Col>
                            <Col xs={24} md={8}><Form.Item label="Loan Tenure (Years)" name="loanTenure" rules={[{ required: true }]}><InputNumber style={inputStyle} min={1} max={10} /></Form.Item></Col>
                            <Col xs={24} md={8}><Form.Item label="Down Payment (₹)" name="downPayment" initialValue={0}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col>
                            <Col xs={24} md={8}><Form.Item label="Loan Interest Paid this FY (₹)" name="loanInterestPaid" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col>
                        </>
                    )}
                </Row>
            </Card>

            <Collapse ghost expandIconPosition="end" style={{ marginBottom: 24 }}>
                <Panel header={<Text strong style={{ color: '#5B92E5' }}>Advanced & Optional Details</Text>} key="1" style={{ background: '#FFFFFF', borderRadius: 24, padding: '10px 20px', border: 'none', boxShadow: '0 4px 25px rgba(0,0,0,0.04)' }}>
                    <Row gutter={[24, 0]}>
                        {usageType === 'Business' && employmentType === 'Self-Employed' && (
                            <>
                                <Col xs={24}><Alert message={`Business Usage: Depreciation (${subcategory === 'Car' ? '15%' : '30%'}) on business-used portion.`} type="success" showIcon style={{ marginBottom: 24, borderRadius: 12 }} /></Col>
                                <Col xs={24} md={12}><Form.Item label="Business Usage (%)" name="businessUsagePercentage" initialValue={100}><InputNumber style={inputStyle} suffix="%" min={1} max={100} /></Form.Item></Col>
                            </>
                        )}
                        <Col xs={24} md={12}><Form.Item label={subcategory === 'Car' ? 'Fuel Reimbursement (Annual ₹)' : 'Travel Allowance (Annual ₹)'} name="fuelReimbursement"><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col>
                        <Col xs={24} md={12}><Form.Item label="Maintenance Reimbursement (Annual ₹)" name="maintenanceReimbursement"><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col>
                        <Col xs={24} md={12}><Form.Item label="Insurance Cost (₹)" name="insuranceCost"><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col>
                        <Col xs={24} md={12}><Form.Item label={<Space>Estimated Resale Value (₹) <Tag color="orange">Optional</Tag></Space>} name="resaleValue"><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col>
                    </Row>
                </Panel>
            </Collapse>
        </>
    );

    // ── HEALTH INSURANCE INPUTS ──
    const renderHealthInsuranceInputs = () => {
        const hEmployerHealth = Form.useWatch('hasEmployerHealth', form) || 'no';
        const hParentGroup    = Form.useWatch('hParentAgeGroup', form);
        return (
            <Card title={<Space><MedicineBoxOutlined style={{ color: '#5B92E5' }} /><span>Health Insurance Details</span></Space>} style={cardStyle}>
                <Row gutter={[24, 0]}>
                    <Col xs={24} md={12}><Form.Item label="Coverage Type" name="coverageType" initialValue={`${subcategory} Insurance`}><Input style={{ ...inputStyle, background: '#F3F4F6', color: '#5B92E5', fontWeight: 700 }} readOnly /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item label="Annual Premium Paid (₹) *" name="premiumAmount" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} placeholder="Total annual premium" /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item label="Policy Start Date *" name="hPolicyStartDate" rules={[{ required: true }]}><DatePicker style={inputStyle} format="DD-MM-YYYY" /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item label="Sum Insured (₹) *" name="hSumInsured" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item label="Payment Mode *" name="hPaymentMode" rules={[{ required: true }]} initialValue="Online"><Select style={inputStyle}><Option value="Online">Online Transfer</Option><Option value="Credit/Debit Card">Credit / Debit Card</Option><Option value="Net Banking">Net Banking</Option><Option value="Other Non-Cash">Other Non-Cash</Option></Select></Form.Item></Col>
                    {subcategory === 'Self' && <Col xs={24} md={12}><Form.Item label="Age of Insured *" name="hAge" rules={[{ required: true }]}><InputNumber style={inputStyle} min={1} max={100} /></Form.Item></Col>}
                    {subcategory === 'Family' && <><Col xs={24} md={12}><Form.Item label="Number of Members *" name="insuredMembers" initialValue={1} rules={[{ required: true }]}><InputNumber style={inputStyle} min={1} max={10} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Age of Oldest Member *" name="hOldestAge" rules={[{ required: true }]}><InputNumber style={inputStyle} min={1} max={100} /></Form.Item></Col></>}
                    {subcategory === 'Parents' && <><Col xs={24} md={12}><Form.Item label="Number of Parents *" name="hParentsCount" rules={[{ required: true }]}><InputNumber style={inputStyle} min={1} max={2} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Age Group of Parents *" name="hParentAgeGroup" rules={[{ required: true }]}><Radio.Group buttonStyle="solid"><Radio.Button value="under-60">Below 60</Radio.Button><Radio.Button value="above-60">60 or Above</Radio.Button></Radio.Group></Form.Item></Col></>}
                    {subcategory === 'Senior Parents' && <><Col xs={24} md={12}><Form.Item label="Age of Parent(s) *" name="hParentAge" rules={[{ required: true }]}><InputNumber style={inputStyle} min={60} max={120} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Medical Expenses (₹)" name="hMedicalExpenses" extra="Only if no insurance exists"><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col></>}
                    <Col xs={24} md={12}><Form.Item label="Preventive Health Checkup (₹)" name="preventiveCheckup" extra="Max ₹5,000"><InputNumber style={inputStyle} prefix="₹" min={0} max={5000} /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item label="Policy Provider (Optional)" name="hProviderName"><Input style={inputStyle} placeholder="e.g. Star Health" /></Form.Item></Col>
                    <Col xs={24}><Divider /><Form.Item label="Employer group health insurance?" name="hasEmployerHealth" initialValue="no"><Radio.Group buttonStyle="solid"><Radio.Button value="no">No</Radio.Button><Radio.Button value="yes">Yes</Radio.Button></Radio.Group></Form.Item></Col>
                    {hEmployerHealth === 'yes' && <><Col xs={24} md={12}><Form.Item label="Employer Premium (₹)" name="employerContribution"><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Additional Personal Premium (₹)" name="hAdditionalPremium"><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col></>}
                    <Col xs={24} style={{ marginTop: 16 }}>
                        <Alert message="Section 80D: Premiums must be paid via non-cash methods." type="warning" showIcon />
                        <Alert message={`Deduction Limit: ${subcategory === 'Senior Parents' || hParentGroup === 'above-60' ? '₹50,000' : '₹25,000'} maximum.`} type="info" showIcon style={{ marginTop: 12 }} />
                    </Col>
                </Row>
            </Card>
        );
    };

    // ── STOCKS INPUTS ──
    const renderStocksInputs = () => {
        const assetType = subcategory;
        return (
            <Card title={<Space><StockOutlined style={{ color: '#5B92E5' }} /><span>Investment Details ({assetType})</span></Space>} style={cardStyle}>
                <Row gutter={[24, 0]}>
                    {assetType === 'Equity Shares' && (<><Col xs={24} md={12}><Form.Item label="Stock Name" name="stockName" rules={[{ required: true }]}><Input style={inputStyle} placeholder="e.g. Reliance, TCS" /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Quantity" name="quantity" rules={[{ required: true }]}><InputNumber style={inputStyle} min={1} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Purchase Price (per share ₹)" name="purchasePrice" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Purchase Date" name="purchaseDate" rules={[{ required: true }]}><DatePicker style={inputStyle} format="DD-MM-YYYY" /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Selling Price (per share ₹)" name="sellingPrice" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Selling Date" name="sellingDate" rules={[{ required: true }]}><DatePicker style={inputStyle} format="DD-MM-YYYY" /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Brokerage Charges (₹)" name="brokerageCharges" initialValue={0}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Dividend Received (₹)" name="dividendReceived" initialValue={0}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col></>)}
                    {assetType === 'Mutual Funds' && (<><Col xs={24} md={12}><Form.Item label="Fund Name" name="fundName" rules={[{ required: true }]}><Input style={inputStyle} placeholder="e.g. HDFC Midcap" /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Fund Type" name="fundType" rules={[{ required: true }]} initialValue="Equity"><Select style={inputStyle}><Option value="Equity">Equity Fund</Option><Option value="Debt">Debt Fund</Option><Option value="Hybrid">Hybrid Fund</Option></Select></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Investment Amount (₹)" name="investmentAmount" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Purchase Date" name="purchaseDate" rules={[{ required: true }]}><DatePicker style={inputStyle} format="DD-MM-YYYY" /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Redemption Amount (₹)" name="redemptionAmount" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Redemption Date" name="redemptionDate" rules={[{ required: true }]}><DatePicker style={inputStyle} format="DD-MM-YYYY" /></Form.Item></Col></>)}
                    {assetType === 'F&O Trading' && (<><Col xs={24} md={12}><Form.Item label="Total Buy Value (₹)" name="totalBuyValue" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Total Sell Value (₹)" name="totalSellValue" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={8}><Form.Item label="Brokerage (₹)" name="brokerageCharges" initialValue={0}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={8}><Form.Item label="Exchange Charges (₹)" name="exchangeCharges" initialValue={0}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={8}><Form.Item label="Net Profit / Loss (₹)" name="netProfitLoss" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Number of Trades" name="numberOfTrades" rules={[{ required: true }]}><InputNumber style={inputStyle} min={1} /></Form.Item></Col><Col xs={24}><Alert message="F&O is treated as Non-Speculative Business Income." type="info" showIcon style={{ marginTop: 16 }} /></Col></>)}
                    {assetType === 'Bonds / Debentures' && (<><Col xs={24} md={12}><Form.Item label="Bond Name" name="bondName" rules={[{ required: true }]}><Input style={inputStyle} placeholder="e.g. SGB, NHAI" /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Investment Amount (₹)" name="investmentAmount" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Purchase Date" name="purchaseDate" rules={[{ required: true }]}><DatePicker style={inputStyle} format="DD-MM-YYYY" /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Interest Received (₹)" name="interestReceived" initialValue={0}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Selling Price (₹)" name="sellingPrice" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Selling Date" name="sellingDate" rules={[{ required: true }]}><DatePicker style={inputStyle} format="DD-MM-YYYY" /></Form.Item></Col></>)}
                    {assetType === 'Crypto' && (<><Col xs={24}><Alert message="Crypto Tax: 30% flat tax. No deduction except purchase cost. Losses cannot be carried forward." type="warning" showIcon style={{ marginBottom: 24 }} /></Col><Col xs={24} md={12}><Form.Item label="Crypto Name" name="cryptoName" rules={[{ required: true }]}><Input style={inputStyle} placeholder="e.g. BTC, ETH" /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Purchase Amount (₹)" name="purchaseAmount" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Purchase Date" name="purchaseDate" rules={[{ required: true }]}><DatePicker style={inputStyle} format="DD-MM-YYYY" /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Selling Amount (₹)" name="sellingAmount" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Selling Date" name="sellingDate" rules={[{ required: true }]}><DatePicker style={inputStyle} format="DD-MM-YYYY" /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Transaction Fees (₹)" name="transactionFees" initialValue={0}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col></>)}
                </Row>
            </Card>
        );
    };

    // ── LAND INPUTS (unchanged from original) ──
    const renderLandInputs = () => {
        const selectedType   = Form.useWatch('propertyType', form) || subcategory;
        const status         = propertyStatus;
        const isAgricultural = selectedType === 'Agricultural';
        const isPlot         = selectedType === 'Plot';

        return (
            <>
                <Card title={<Space><HomeOutlined style={{ color: '#5B92E5' }} /><span>Property Details</span></Space>} style={cardStyle}>
                    <Row gutter={[24, 0]}>
                        <Col xs={24} md={12}><Form.Item label="Property Category" name="propertyType" initialValue={subcategory === 'Residential' ? 'Residential Property' : subcategory === 'Commercial' ? 'Commercial Property' : subcategory}><Input style={{ ...inputStyle, background: '#F1F5F9', fontWeight: 700 }} readOnly /></Form.Item></Col>
                        <Col xs={24} md={12}><Form.Item label="Property Status" name="propertyStatus" rules={[{ required: true }]}><Select style={inputStyle} placeholder="Select Status"><Option value="Self Occupied">Self Occupied</Option>{!isAgricultural && !isPlot && <Option value="Let-Out">Let-Out / Rented</Option>}<Option value="Vacant">Vacant</Option><Option value="Sold">Sold</Option></Select></Form.Item></Col>
                        <Col xs={24} md={12}><Form.Item label="Ownership Type" name="ownershipType" initialValue="Self Owned"><Radio.Group buttonStyle="solid"><Radio.Button value="Self Owned">Self Owned</Radio.Button><Radio.Button value="Co-Owned">Co-Owned</Radio.Button></Radio.Group></Form.Item></Col>
                        {Form.useWatch('ownershipType', form) === 'Co-Owned' && <Col xs={24} md={12}><Form.Item label="Ownership Percentage (%)" name="coOwnedPercentage" rules={[{ required: true }]}><InputNumber style={inputStyle} min={1} max={100} /></Form.Item></Col>}
                        <Col xs={24} md={12}><Form.Item label="State" name="propertyState" rules={[{ required: true }]}><Select style={inputStyle} placeholder="Select State" showSearch>{["Andhra Pradesh","Maharashtra","Karnataka","Tamil Nadu","Telangana","Delhi","Gujarat","Rajasthan","Uttar Pradesh","West Bengal","Other"].map(s => <Option key={s} value={s}>{s}</Option>)}</Select></Form.Item></Col>
                        <Col xs={24} md={12}><Form.Item label="City" name="propertyCity" rules={[{ required: true }]}><Input style={inputStyle} placeholder="e.g. Mumbai" /></Form.Item></Col>
                        <Col xs={24} md={8}><Form.Item label="Purchase Price (₹)" name="propertyPurchasePrice" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col>
                        <Col xs={24} md={8}><Form.Item label="Purchase Date" name="propertyPurchaseDate" rules={[{ required: true }]}><DatePicker style={inputStyle} format="DD-MM-YYYY" /></Form.Item></Col>
                        <Col xs={24} md={8}><Form.Item label="Stamp Duty + Registration (₹)" name="stampDutyCharges"><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col>
                    </Row>
                </Card>

                {status === 'Let-Out' && !isAgricultural && !isPlot && (
                    <Card title={<Space><SafetyCertificateOutlined style={{ color: '#5B92E5' }} /><span>Rental Income & Taxes</span></Space>} style={cardStyle}>
                        <Row gutter={[24, 0]}>
                            <Col xs={24}><Alert message="30% Standard Deduction allowed on Net Annual Value." type="success" showIcon style={{ marginBottom: 24, borderRadius: 12 }} /></Col>
                            <Col xs={24} md={8}><Form.Item label="Monthly Rent (₹)" name="monthlyRent" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col>
                            <Col xs={24} md={8}><Form.Item label="Months Rented" name="monthsRented" initialValue={12}><InputNumber style={inputStyle} min={1} max={12} /></Form.Item></Col>
                            <Col xs={24} md={8}><Form.Item label="Municipal Taxes (₹)" name="municipalTaxes"><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col>
                        </Row>
                    </Card>
                )}

                {!isAgricultural && (
                    <Card title={<Space><DollarOutlined style={{ color: '#5B92E5' }} /><span>Home Loan Details</span></Space>} style={cardStyle}>
                        <Row gutter={[24, 0]}>
                            <Col xs={24}><Form.Item label="Active home loan?" name="hasPropertyLoan" initialValue="no"><Radio.Group buttonStyle="solid"><Radio.Button value="no">No</Radio.Button><Radio.Button value="yes">Yes</Radio.Button></Radio.Group></Form.Item></Col>
                            {hasPropertyLoan === 'yes' && (<><Col xs={24} md={12}><Form.Item label="Loan Amount (₹)" name="loanAmount"><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Interest Paid this FY (₹)" name="loanInterestPaid" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Principal Repaid this FY (₹)" name="loanPrincipalPaid" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col></>)}
                        </Row>
                    </Card>
                )}

                {status === 'Sold' && (
                    <Card title={<Space><RocketOutlined style={{ color: '#5B92E5' }} /><span>Sale & Capital Gains</span></Space>} style={cardStyle}>
                        <Row gutter={[24, 0]}>
                            <Col xs={24} md={12}><Form.Item label="Selling Price (₹)" name="sellingPrice" rules={[{ required: true }]}><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col>
                            <Col xs={24} md={12}><Form.Item label="Selling Date" name="sellingDate" rules={[{ required: true }]}><DatePicker style={inputStyle} format="DD-MM-YYYY" /></Form.Item></Col>
                            <Col xs={24} md={12}><Form.Item label="Brokerage Paid (₹)" name="propertyBrokerage"><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col>
                            <Col xs={24}><Alert message="LTCG (>2 years): 12.5% tax. STCG (≤2 years): Slab rate." type="warning" showIcon style={{ marginBottom: 24 }} /></Col>
                            <Col xs={24}><Form.Item label="Reinvest capital gains?" name="reinvestGains" initialValue="no"><Radio.Group buttonStyle="solid"><Radio.Button value="no">No</Radio.Button><Radio.Button value="yes">Yes</Radio.Button></Radio.Group></Form.Item></Col>
                            {Form.useWatch('reinvestGains', form) === 'yes' && (<><Col xs={24} md={12}><Form.Item label="New Residential Property (₹)" name="reinvest54"><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="54EC Bonds (₹)" name="reinvest54EC"><InputNumber style={inputStyle} prefix="₹" min={0} /></Form.Item></Col></>)}
                        </Row>
                    </Card>
                )}
            </>
        );
    };

    return (
        <ConfigProvider theme={{ token: { colorPrimary: '#5B92E5', borderRadius: 16, fontFamily: "'Outfit', sans-serif" } }}>
            <Layout style={{ minHeight: '100vh', background: '#F2F3F4' }}>
                <Navbar />
                <div style={{ padding: '32px 24px' }}>
                    <Content style={{ maxWidth: '900px', margin: '0 auto', width: '100%', padding: '24px 16px' }}>

                        <div style={{ marginBottom: 32 }}>
                            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/category-selection')} style={{ color: '#5B92E5', fontWeight: 600, padding: 0, marginBottom: 16 }}>
                                Back to Category Selection
                            </Button>
                            <Title level={2} style={{ color: '#5B92E5', margin: 0, fontWeight: 700 }}>
                                {category} → {subcategory} {isVehicle ? `→ ${ownership}` : ''}
                            </Title>
                            <Text type="secondary" style={{ fontSize: 16 }}>
                                Enter your asset details. Income & deductions are loaded from your profile automatically.
                            </Text>
                        </div>

                        {/* Saved income summary banner */}
                        {savedProfile && (
                            <Alert
                                message={
                                    <Space>
                                        <span>
                                            Using saved profile — Income: <strong>₹{(savedProfile.gross_salary || 0).toLocaleString('en-IN')}</strong> · 
                                            80C: <strong>₹{(savedProfile.section_80c || 0).toLocaleString('en-IN')}</strong> · 
                                            80D: <strong>₹{(savedProfile.section_80d || 0).toLocaleString('en-IN')}</strong> · 
                                            NPS: <strong>₹{(savedProfile.nps_personal || 0).toLocaleString('en-IN')}</strong>
                                        </span>
                                        <Button size="small" icon={<EditOutlined />} onClick={() => navigate('/profile')} style={{ borderRadius: 8 }}>
                                            Edit
                                        </Button>
                                    </Space>
                                }
                                type="success"
                                showIcon
                                style={{ marginBottom: 24, borderRadius: 16 }}
                            />
                        )}

                        {!savedProfile && (
                            <div style={{
                                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                                border: '1.5px solid #F59E0B',
                                borderRadius: 20, padding: '28px 32px',
                                marginBottom: 28, textAlign: 'center'
                            }}>
                                <div style={{ fontSize: 28, marginBottom: 12 }}>📋</div>
                                <Title level={4} style={{ color: '#92400E', margin: '0 0 8px 0' }}>
                                    Income Details Required
                                </Title>
                                <Paragraph style={{ color: '#78350F', marginBottom: 20, fontSize: 14 }}>
                                    You need to add your income &amp; deductions once — they'll be reused for every future analysis automatically. Only takes 2 minutes.
                                </Paragraph>
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={() => navigate('/profile', { state: { from: location.pathname, locationState: location.state } })}
                                    style={{ borderRadius: 12, background: '#D97706', border: 'none', fontWeight: 700, height: 48, paddingLeft: 32, paddingRight: 32 }}
                                >
                                    Add Income Details →
                                </Button>
                            </div>
                        )}

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            onFinishFailed={onFinishFailed}
                            requiredMark={false}
                            initialValues={{ purchaseYear: 2025 }}
                        >
                            {isVehicle         && renderVehicleInputs()}
                            {isHealthInsurance && renderHealthInsuranceInputs()}
                            {isStocks          && renderStocksInputs()}
                            {isLand            && renderLandInputs()}
                            {!isVehicle && !isHealthInsurance && !isStocks && !isLand && (
                                <Card title="Analysis Details" style={cardStyle}>
                                    <Paragraph>Analysis for {category} - {subcategory} is coming soon.</Paragraph>
                                </Card>
                            )}

                            <div style={{ marginTop: 48, textAlign: 'center' }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    disabled={!isFormValid || !savedProfile || submitting}
                                    loading={submitting}
                                    icon={<ArrowRightOutlined />}
                                    style={{
                                        height: 64, padding: '0 64px', fontSize: 20,
                                        borderRadius: 50, fontWeight: 700,
                                        boxShadow: isFormValid ? '0 8px 30px rgba(8,69,126,0.3)' : 'none',
                                        opacity: isFormValid ? 1 : 0.6
                                    }}
                                >
                                    Analyze Now
                                </Button>
                                {!savedProfile && (
                                    <div style={{ marginTop: 12 }}>
                                        <Text type="danger">Please add your income details first using the button above.</Text>
                                    </div>
                                )}
                                {savedProfile && !isFormValid && (
                                    <div style={{ marginTop: 12 }}>
                                        <Text type="danger">Please fill all required fields before running analysis.</Text>
                                    </div>
                                )}
                            </div>
                        </Form>

                        <div style={{ marginTop: 60, textAlign: 'center', marginBottom: 40 }}>
                            <Text style={{ color: '#9CA3AF', fontSize: 13 }}>Private & Secure Analysis · Encrypted Data Transmission</Text>
                        </div>
                    </Content>
                </div>
            </Layout>
            <style>{`.ant-input-number-input { height: 48px !important; } .ant-form-item-label label { font-weight: 600; color: #5B92E5; }`}</style>
        </ConfigProvider>
    );
};

export default AnalysisForm;
