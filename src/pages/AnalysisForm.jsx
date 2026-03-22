import React, { useState, useEffect } from 'react';
import {
    Layout,
    Card,
    Form,
    Input,
    InputNumber,
    Button,
    Typography,
    Space,
    Row,
    Col,
    Divider,
    Select,
    ConfigProvider,
    Radio,
    Tag,
    message,
    Collapse,
    Tooltip,
    DatePicker,
    Switch,
    Alert
} from 'antd';
import {
    ArrowRightOutlined,
    ArrowLeftOutlined,
    CarOutlined,
    SafetyCertificateOutlined,
    DollarOutlined,
    LineChartOutlined,
    MedicineBoxOutlined,
    StockOutlined,
    HomeOutlined,
    InfoCircleOutlined,
    SafetyOutlined,
    TransactionOutlined,
    GlobalOutlined,
    BankOutlined,
    RocketOutlined,
    SwapOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { runFullAnalysis } from '../services/profileService';

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
    const [submitting, setSubmitting] = React.useState(false);

    // Get state from props or navigation state or defaults
    const category = propCategory || location.state?.category || 'Vehicle';
    const subcategory = propSubcategory || location.state?.subcategory || 'Car';
    const ownership = propOwnership || location.state?.ownership || 'First-hand';

    const isVehicle = category === 'Vehicle';
    const isHealthInsurance = category === 'Health Insurance';
    const isStocks = category === 'Stocks' || category === 'Investments';
    const isLand = category === 'Land' || category === 'Property';
    const isFirstHand = ownership === 'First-hand';

    const employmentType = Form.useWatch('employmentType', form) || 'Salaried';
    const usageType = Form.useWatch('usageType', form) || 'Personal';
    const hasLoan = Form.useWatch('hasLoan', form) || 'no';
    const isEmployerProvided = Form.useWatch('isEmployerProvided', form) || 'no';
    const propertyStatus = Form.useWatch('propertyStatus', form) || null;
    const hasPropertyLoan = Form.useWatch('hasPropertyLoan', form) || 'no';
    const ageGroup = Form.useWatch('ageGroup', form) || 'under-60';
    const eldestAge = ageGroup === 'above-60' ? 60 : 25; 
    const rentalIncome = Form.useWatch('rentalIncome', form) || 0;
    const sellingPrice = Form.useWatch('sellingPrice', form) || 0;
    const isCoOwned = Form.useWatch('isCoOwned', form) || 'no';

    // Deduction limits check for warnings
    const d80C = Form.useWatch('deduction80C', form) || 0;
    const d80D = Form.useWatch('deduction80D', form) || 0;
    const dNPS = Form.useWatch('deductionNPS', form) || 0;

    // Required fields for validation
    const annualSalary = Form.useWatch('annualSalary', form) || 0;

    // Vehicle specific
    const vPurchasePrice = Form.useWatch('purchasePrice', form) || 0;
    const vPurchaseDate = Form.useWatch('purchaseDate', form) || null;
    const isEV = Form.useWatch('isEV', form) || false;

    // Stocks specific
    const sAssetType = Form.useWatch('assetType', form) || subcategory;
    const sPurchasePrice = Form.useWatch('purchasePricePerShare', form) || 0;
    const sPurchaseQty = Form.useWatch('purchaseQuantity', form) || 0;
    const sSellPrice = Form.useWatch('sellPricePerShare', form) || 0;
    const sSellQty = Form.useWatch('sellQuantity', form) || 0;
    
    // Automatically calculate totals for analysis engine
    const totalPurchase = sPurchasePrice * sPurchaseQty;
    const totalSelling = sSellPrice * sSellQty;

    const sPurchaseDate = Form.useWatch('purchaseDate', form) || null;
    const sSellingDate = Form.useWatch('sellingDate', form) || null;
    const sDividendIncome = Form.useWatch('hasDividendIncome', form) === 'yes';
    const sHasCapitalLoss = Form.useWatch('hasCapitalLoss', form) === 'yes';

    // Health specific
    const hCoverageType = Form.useWatch('coverageType', form) || null;
    const hPremiumAmount = Form.useWatch('premiumAmount', form) || 0;

    // Land specific
    const lPurchasePrice = Form.useWatch('propertyPurchasePrice', form) || 0;
    const lPropertyStatus = Form.useWatch('propertyStatus', form) || null;
    const lPropertyType = Form.useWatch('propertyType', form) || subcategory;
    const lSoldProperty = Form.useWatch('propertyStatus', form) === 'Sold';

    // F&O specific
    const sAssetTypeCurrent = Form.useWatch('assetType', form) || subcategory;
    const fnoTurnover = Form.useWatch('fnoTurnover', form) || 0;

    // Values used for validation (MUST BE DECLARED AT TOP LEVEL, NOT INSIDE checkFormValidity)
    const stName = Form.useWatch('stockName', form);
    const mfName = Form.useWatch('fundName', form);
    const fnoBuy = Form.useWatch('totalBuyValue', form);
    const bondName = Form.useWatch('bondName', form);
    const cryptoName = Form.useWatch('cryptoName', form);

    const hAge = Form.useWatch('hAge', form);
    const hOldestAge = Form.useWatch('hOldestAge', form);
    const hParentAgeGroup = Form.useWatch('hParentAgeGroup', form);
    const hParentAge = Form.useWatch('hParentAge', form);

    const checkFormValidity = () => {
        if (!annualSalary || annualSalary <= 0) return false;
        if (isVehicle) {
            return vPurchasePrice > 0 && vPurchaseDate && usageType;
        }
        if (isStocks) {
            if (subcategory === 'Equity Shares') return !!stName;
            if (subcategory === 'Mutual Funds') return !!mfName;
            if (subcategory === 'F&O Trading') return fnoBuy > 0;
            if (subcategory === 'Bonds / Debentures') return !!bondName;
            if (subcategory === 'Crypto') return !!cryptoName;
            return true;
        }
        if (isHealthInsurance) {
            const hSub = subcategory;
            const basic = hPremiumAmount > 0;
            if (hSub === 'Self') return basic && hAge > 0;
            if (hSub === 'Family') return basic && hOldestAge > 0;
            if (hSub === 'Parents') return basic && !!hParentAgeGroup;
            if (hSub === 'Senior Parents') return basic && hParentAge >= 60;
            return basic;
        }
        if (isLand) {
            return lPurchasePrice > 0 && lPropertyStatus;
        }
        return true;
    };

    const isFormValid = checkFormValidity();

    const onFinish = async (values) => {
        const calculatedValues = {
            ...values,
            purchaseAmount: values.purchaseAmount || ((values.purchasePrice || 0) * (values.quantity || 0)) || values.investmentAmount || values.totalBuyValue || 0,
            sellingAmount: values.sellingAmount  || ((values.sellingPrice  || 0) * (values.quantity || 0)) || values.redemptionAmount || values.totalSellValue  || 0
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
            if (calculatedValues[key] === undefined || calculatedValues[key] === null || calculatedValues[key] === '') {
                calculatedValues[key] = 0;
            }
        });

        // Try backend — if it fails, fall back to local computation
        let backendResult = null;
        if (user) {
            try {
                setSubmitting(true);
                // Show loading toast — save the key to close it later
                message.loading({ content: 'Saving profile and running analysis...', key: 'analysis', duration: 0 });
                backendResult = await runFullAnalysis(
                    user.id, user.email,
                    calculatedValues, category, subcategory, ownership
                );
                message.success({ content: 'Analysis complete!', key: 'analysis', duration: 2 });
            } catch (err) {
                // Close toast on error too
                message.destroy('analysis');
                console.warn('Backend analyse failed, using local computation:', err.message);
            } finally {
                setSubmitting(false);
                message.destroy('analysis'); // always close
            }
        }

        navigate('/dashboard', {
            state: {
                formData: calculatedValues,
                backendResult,
                category,
                subcategory,
                ownership
            }
        });
    };

    const onFinishFailed = () => {
        message.error("Please fill required fields before running tax analysis.");
    };

    const cardStyle = {
        borderRadius: '24px',
        border: 'none',
        boxShadow: '0 4px 25px rgba(0, 0, 0, 0.04)',
        background: '#FFFFFF',
        marginBottom: '24px'
    };

    const inputStyle = {
        borderRadius: '12px',
        height: '48px',
        width: '100%'
    };

    const renderVehicleInputs = () => {
        return (
            <>
                {/* Vehicle Details */}
                <Card
                    title={<Space><CarOutlined style={{ color: '#5B92E5' }} /> <span>Vehicle Details ({subcategory})</span></Space>}
                    style={cardStyle}
                >
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
                            <Form.Item
                                label="Purchase Price (₹)"
                                name="purchasePrice"
                                rules={[{ required: true, message: 'Please enter purchase price' }]}
                            >
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
                                <Radio.Group
                                    onChange={(e) => {
                                        if (e.target.value === 'Salaried') {
                                            form.setFieldsValue({ usageType: 'Personal' });
                                        }
                                    }}
                                >
                                    <Space size={16}>
                                        <Radio value="Salaried">Salaried</Radio>
                                        <Radio value="Self-Employed">Self-Employed</Radio>
                                    </Space>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item 
                                label="Usage Type" 
                                name="usageType" 
                                rules={[{ required: true }]}
                                help="Business usage is only available for self-employed individuals."
                            >
                                <Select style={inputStyle} placeholder="Select Usage">
                                    <Option value="Personal">Personal</Option>
                                    {employmentType === 'Self-Employed' && (
                                        <Option value="Business">Business</Option>
                                    )}
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
                                <Alert
                                    message="EV Loan Benefit: You are eligible for Section 80EEB deduction (up to ₹1.5L interest) for this electric vehicle loan."
                                    type="success"
                                    showIcon
                                    style={{ marginBottom: '16px', borderRadius: '12px' }}
                                />
                            </Col>
                        )}
                    </Row>
                </Card>

                {/* Employer Provided Section */}
                {employmentType === 'Salaried' && (
                    <Card
                        title={<Space><CarOutlined style={{ color: '#5B92E5' }} /> <span>Employer Provided {subcategory} (Perquisites)</span></Space>}
                        style={cardStyle}
                    >
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
                                    <Col xs={24} md={8}>
                                        <Form.Item label="Fuel Paid by Employer?" name="fuelByEmployer" initialValue="no">
                                            <Radio.Group size="small">
                                                <Radio value="yes">Yes</Radio> <Radio value="no">No</Radio>
                                            </Radio.Group>
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item label="Maintenance by Employer?" name="maintenanceByEmployer" initialValue="no">
                                            <Radio.Group size="small">
                                                <Radio value="yes">Yes</Radio> <Radio value="no">No</Radio>
                                            </Radio.Group>
                                        </Form.Item>
                                    </Col>
                                    {subcategory === 'Car' && (
                                        <Col xs={24} md={8}>
                                            <Form.Item label="Driver Provided?" name="driverProvided" initialValue="no">
                                                <Radio.Group size="small">
                                                    <Radio value="yes">Yes</Radio> <Radio value="no">No</Radio>
                                                </Radio.Group>
                                            </Form.Item>
                                        </Col>
                                    )}
                                </>
                            )}
                        </Row>
                    </Card>
                )}

                {/* Loan Selection */}
                <Card
                    title={<Space><DollarOutlined style={{ color: '#5B92E5' }} /> <span>Vehicle Loan Details</span></Space>}
                    style={cardStyle}
                >
                    <Row gutter={[24, 0]}>
                        <Col xs={24}>
                            <Form.Item label="Did you take a vehicle loan?" name="hasLoan" initialValue="no">
                                <Radio.Group buttonStyle="solid">
                                    <Radio.Button value="no">No</Radio.Button>
                                    <Radio.Button value="yes">Yes</Radio.Button>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        {hasLoan === 'yes' && (
                            <>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Loan Amount (₹)" name="loanAmount" rules={[{ required: true }]}>
                                        <InputNumber style={inputStyle} prefix="₹" min={0} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Interest Rate (%)" name="interestRate" rules={[{ required: true }]}>
                                        <InputNumber style={inputStyle} suffix="%" min={0} max={30} step={0.1} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Loan Tenure (Years)" name="loanTenure" rules={[{ required: true }]}>
                                        <InputNumber style={inputStyle} min={1} max={10} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Down Payment (₹)" name="downPayment" initialValue={0}>
                                        <InputNumber style={inputStyle} prefix="₹" min={0} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Loan Interest Paid this FY (₹)" name="loanInterestPaid" rules={[{ required: true }]}>
                                        <InputNumber style={inputStyle} prefix="₹" min={0} />
                                    </Form.Item>
                                </Col>
                            </>
                        )}
                    </Row>
                </Card>

                {/* Optional Details */}
                <Collapse
                    ghost
                    expandIconPosition="end"
                    className="optional-collapse"
                    style={{ marginBottom: '24px' }}
                >
                    <Panel
                        header={<Text strong style={{ color: '#5B92E5' }}>Advanced & Optional Details (Reimbursements, Market Value)</Text>}
                        key="1"
                        style={{ background: '#FFFFFF', borderRadius: '24px', padding: '10px 20px', border: 'none', boxShadow: '0 4px 25px rgba(0, 0, 0, 0.04)' }}
                    >
                        <Row gutter={[24, 0]}>
                            {usageType === 'Business' && employmentType === 'Self-Employed' && (
                                <>
                                    <Col xs={24} md={24}>
                                        <Alert
                                            message={`Business Usage rule: Depreciation (${subcategory === 'Car' ? '15%' : '30%'}) can be claimed for the portion of the vehicle used for business.`}
                                            description={`Example: ₹10L car @ 15% dep. with 40% business use = ₹60,000 deduction.`}
                                            type="success"
                                            showIcon
                                            style={{ marginBottom: '24px', borderRadius: '12px' }}
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Business Usage (%)" name="businessUsagePercentage" initialValue={100}>
                                            <InputNumber style={inputStyle} suffix="%" min={1} max={100} />
                                        </Form.Item>
                                    </Col>
                                </>
                            )}

                            {(employmentType === 'Salaried' || (employmentType === 'Self-Employed' && usageType === 'Business')) && (
                                <>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label={subcategory === 'Car' ? "Fuel Expense / Reimbursement (Annual) (₹)" : "Travel Allowance (Annual) (₹)"}
                                            name="fuelReimbursement"
                                        >
                                            <InputNumber style={inputStyle} prefix="₹" min={0} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Maintenance Expense / Reimbursement (Annual) (₹)"
                                            name="maintenanceReimbursement"
                                        >
                                            <InputNumber style={inputStyle} prefix="₹" min={0} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Insurance Cost (Optional) (₹)" name="insuranceCost">
                                            <InputNumber style={inputStyle} prefix="₹" min={0} />
                                        </Form.Item>
                                    </Col>

                                    {subcategory === 'Car' && (isEmployerProvided === 'yes' || usageType === 'Business') && (
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Driver Salary Expense / Reimbursement (Annual) (₹)"
                                                name="driverSalaryReimbursement"
                                                rules={[
                                                    { type: 'number', min: 0, max: 500000, message: 'Salary must be between ₹0 and ₹5,00,000' }
                                                ]}
                                            >
                                                <InputNumber style={inputStyle} prefix="₹" min={0} max={500000} placeholder="Business deduction / Perquisite" />
                                            </Form.Item>
                                        </Col>
                                    )}
                                </>
                            )}

                            <Col xs={24} md={12}>
                                <Form.Item label={<Space>Estimated Resale Value (₹) <Tag color="orange">Optional</Tag></Space>} name="resaleValue">
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Panel>
                </Collapse>
            </>
        );
    };

    const renderHealthInsuranceInputs = () => {
        const hEmployerHealth = Form.useWatch('hasEmployerHealth', form) || 'no';
        const hSubcategory = subcategory;
        const hParentGroup = Form.useWatch('hParentAgeGroup', form);

        return (
            <Card
                title={<Space><MedicineBoxOutlined style={{ color: '#5B92E5' }} /> <span>Health Insurance Details</span></Space>}
                style={cardStyle}
            >
                <Row gutter={[24, 0]}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label={<Space>Coverage Type <Tooltip title="Section 80D allows separate limits defined by age and relation."><InfoCircleOutlined style={{ fontSize: '12px' }} /></Tooltip></Space>}
                            name="coverageType"
                            initialValue={`${hSubcategory} Insurance`}
                        >
                            <Input style={{ ...inputStyle, background: '#F3F4F6', color: '#5B92E5', fontWeight: 700 }} readOnly />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label={
                                <Space>
                                    Annual Premium Paid (₹) *
                                    <Tooltip title="Must be paid in non-cash mode (Online/Card/Cheque) to qualify.">
                                        <InfoCircleOutlined style={{ fontSize: '12px', color: '#9CA3AF' }} />
                                    </Tooltip>
                                </Space>
                            }
                            name="premiumAmount"
                            rules={[{ required: true, message: 'Please enter premium amount' }]}
                        >
                            <InputNumber style={inputStyle} prefix="₹" min={0} placeholder="Total annual premium paid" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                        <Form.Item label="Policy Start Date *" name="hPolicyStartDate" rules={[{ required: true }]}>
                            <DatePicker style={inputStyle} format="DD-MM-YYYY" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                        <Form.Item label="Sum Insured (₹) *" name="hSumInsured" rules={[{ required: true }]}>
                            <InputNumber style={inputStyle} prefix="₹" min={0} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                        <Form.Item label="Payment Mode *" name="hPaymentMode" rules={[{ required: true }]} initialValue="Online">
                            <Select style={inputStyle}>
                                <Option value="Online">Online Transfer</Option>
                                <Option value="Credit/Debit Card">Credit / Debit Card</Option>
                                <Option value="Net Banking">Net Banking</Option>
                                <Option value="Other Non-Cash">Other Non-Cash</Option>
                            </Select>
                        </Form.Item>
                    </Col>

                    {/* Scenario Specific Inputs */}
                    {hSubcategory === 'Self' && (
                        <Col xs={24} md={12}>
                            <Form.Item label="Age of Insured Person *" name="hAge" rules={[{ required: true }]}>
                                <InputNumber style={inputStyle} min={1} max={100} placeholder="Age in years" />
                            </Form.Item>
                        </Col>
                    )}

                    {hSubcategory === 'Family' && (
                        <>
                            <Col xs={24} md={12}>
                                <Form.Item label="Number of Insured Members *" name="insuredMembers" initialValue={1} rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} min={1} max={10} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Age of Oldest Family Member *" name="hOldestAge" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} min={1} max={100} />
                                </Form.Item>
                            </Col>
                        </>
                    )}

                    {subcategory === 'Parents' && (
                        <>
                            <Col xs={24} md={12}>
                                <Form.Item label="Number of Parents Covered *" name="hParentsCount" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} min={1} max={2} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Age Group of Parents *" name="hParentAgeGroup" rules={[{ required: true }]}>
                                    <Radio.Group buttonStyle="solid">
                                        <Radio.Button value="under-60">Below 60</Radio.Button>
                                        <Radio.Button value="above-60">60 or Above</Radio.Button>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>
                        </>
                    )}

                    {subcategory === 'Senior Parents' && (
                        <>
                            <Col xs={24} md={12}>
                                <Form.Item label="Age of Parent(s) *" name="hParentAge" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} min={60} max={120} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Medical Expenses (₹)" name="hMedicalExpenses" extra="Only if no insurance policy exists">
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                        </>
                    )}

                    <Col xs={24} md={12}>
                        <Form.Item label="Preventive Health Checkup Cost (₹)" name="preventiveCheckup" extra="Max ₹5,000 allowed within total limit">
                            <InputNumber style={inputStyle} prefix="₹" min={0} max={5000} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Policy Provider Name (Optional)" name="hProviderName">
                            <Input style={inputStyle} placeholder="e.g., Star Health, HDFC Ergo" />
                        </Form.Item>
                    </Col>

                    <Col xs={24}>
                        <Divider />
                        <Form.Item label="Does your employer provide group health insurance?" name="hasEmployerHealth" initialValue="no">
                            <Radio.Group buttonStyle="solid">
                                <Radio.Button value="no">No</Radio.Button>
                                <Radio.Button value="yes">Yes</Radio.Button>
                            </Radio.Group>
                        </Form.Item>
                    </Col>

                    {hEmployerHealth === 'yes' && (
                        <>
                            <Col xs={24} md={12}>
                                <Form.Item label="Employer Premium Contribution (₹)" name="employerContribution">
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Additional Personal Premium Paid (₹)" name="hAdditionalPremium">
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                        </>
                    )}

                    <Col xs={24} style={{ marginTop: '16px' }}>
                        <Alert 
                            message="Section 80D: Insurance premiums must be paid using non-cash methods to qualify for tax deductions."
                            type="warning" 
                            showIcon 
                        />
                        <Alert 
                            message={`Deduction Limit: ${subcategory === 'Senior Parents' || hParentGroup === 'above-60' ? '₹50,000' : '₹25,000'} maximum allowed for this coverage set.`}
                            type="info"
                            showIcon
                            style={{ marginTop: '12px' }}
                        />
                    </Col>
                </Row>
            </Card>
        );
    };

    const renderStocksInputs = () => {
        const assetType = subcategory;
        
        return (
            <Card
                title={<Space><StockOutlined style={{ color: '#5B92E5' }} /> <span>Investment Details ({assetType})</span></Space>}
                style={cardStyle}
            >
                <Row gutter={[24, 0]}>
                    {assetType === 'Equity Shares' && (
                        <>
                            <Col xs={24} md={12}>
                                <Form.Item label="Stock Name" name="stockName" rules={[{ required: true }]}>
                                    <Input style={inputStyle} placeholder="e.g. Reliance, TCS" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Quantity" name="quantity" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} min={1} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Purchase Price (per share ₹)" name="purchasePrice" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Purchase Date" name="purchaseDate" rules={[{ required: true }]}>
                                    <DatePicker style={inputStyle} format="DD-MM-YYYY" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Selling Price (per share ₹)" name="sellingPrice" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Selling Date" name="sellingDate" rules={[{ required: true }]}>
                                    <DatePicker style={inputStyle} format="DD-MM-YYYY" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Brokerage Charges (₹)" name="brokerageCharges" initialValue={0}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Dividend Received (Optional ₹)" name="dividendReceived" initialValue={0}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                        </>
                    )}

                    {assetType === 'Mutual Funds' && (
                        <>
                            <Col xs={24} md={12}>
                                <Form.Item label="Fund Name" name="fundName" rules={[{ required: true }]}>
                                    <Input style={inputStyle} placeholder="e.g. HDFC Midcap App" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Fund Type" name="fundType" rules={[{ required: true }]} initialValue="Equity">
                                    <Select style={inputStyle}>
                                        <Option value="Equity">Equity Fund (&gt;65% Equity)</Option>
                                        <Option value="Debt">Debt Fund</Option>
                                        <Option value="Hybrid">Hybrid Fund</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Investment Amount (₹)" name="investmentAmount" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Purchase Date" name="purchaseDate" rules={[{ required: true }]}>
                                    <DatePicker style={inputStyle} format="DD-MM-YYYY" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Redemption Amount (₹)" name="redemptionAmount" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Redemption Date" name="redemptionDate" rules={[{ required: true }]}>
                                    <DatePicker style={inputStyle} format="DD-MM-YYYY" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Exit Load (Optional ₹)" name="exitLoad" initialValue={0}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Dividend Received (Optional ₹)" name="dividendReceived" initialValue={0}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                        </>
                    )}

                    {assetType === 'F&O Trading' && (
                        <>
                            <Col xs={24} md={12}>
                                <Form.Item label="Total Buy Value (₹)" name="totalBuyValue" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Total Sell Value (₹)" name="totalSellValue" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item label="Brokerage Charges (₹)" name="brokerageCharges" initialValue={0}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item label="Exchange Charges (₹)" name="exchangeCharges" initialValue={0}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item label="Net Profit / Loss (₹)" name="netProfitLoss" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} prefix="₹" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Number of Trades" name="numberOfTrades" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} min={1} />
                                </Form.Item>
                            </Col>
                            <Col xs={24}>
                                <Alert 
                                    message="F&O is treated as Non-Speculative Business Income. Audit may be required if turnover exceeds limits."
                                    type="info"
                                    showIcon
                                    style={{ marginTop: '16px' }}
                                />
                            </Col>
                        </>
                    )}

                    {assetType === 'Bonds / Debentures' && (
                        <>
                            <Col xs={24} md={12}>
                                <Form.Item label="Bond Name" name="bondName" rules={[{ required: true }]}>
                                    <Input style={inputStyle} placeholder="e.g. SGB, NHAI" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Investment Amount (₹)" name="investmentAmount" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Purchase Date" name="purchaseDate" rules={[{ required: true }]}>
                                    <DatePicker style={inputStyle} format="DD-MM-YYYY" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Interest Received (₹)" name="interestReceived" initialValue={0}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Selling Price (₹)" name="sellingPrice" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Selling Date" name="sellingDate" rules={[{ required: true }]}>
                                    <DatePicker style={inputStyle} format="DD-MM-YYYY" />
                                </Form.Item>
                            </Col>
                        </>
                    )}

                    {assetType === 'Crypto' && (
                        <>
                            <Col xs={24}>
                                <Alert 
                                    message="Crypto Tax Rule in India: 30% flat tax on gains. No deduction allowed except purchase cost. Losses cannot offset other income or be carried forward."
                                    type="warning"
                                    showIcon
                                    style={{ marginBottom: '24px' }}
                                />
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Crypto Name" name="cryptoName" rules={[{ required: true }]}>
                                    <Input style={inputStyle} placeholder="e.g. BTC, ETH" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Purchase Amount (₹)" name="purchaseAmount" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Purchase Date" name="purchaseDate" rules={[{ required: true }]}>
                                    <DatePicker style={inputStyle} format="DD-MM-YYYY" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Selling Amount (₹)" name="sellingAmount" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Selling Date" name="sellingDate" rules={[{ required: true }]}>
                                    <DatePicker style={inputStyle} format="DD-MM-YYYY" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Transaction Fees (₹)" name="transactionFees" initialValue={0}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                        </>
                    )}
                </Row>
            </Card>
        );
    };

    const renderLandInputs = () => {
        const selectedType = lPropertyType;
        const status = propertyStatus;
        const isAgricultural = selectedType === 'Agricultural';
        const isPlot = selectedType === 'Plot';
        
        return (
            <>
                {/* BASIC PROPERTY DETAILS */}
                <Card
                    title={<Space><HomeOutlined style={{ color: '#5B92E5' }} /> <span>Property Details</span></Space>}
                    style={cardStyle}
                >
                    <Row gutter={[24, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item 
                                label="Property Category" 
                                name="propertyType" 
                                initialValue={
                                    subcategory === 'Residential' ? 'Residential Property' :
                                    subcategory === 'Commercial' ? 'Commercial Property' :
                                    subcategory.includes('Agricultural') ? 'Agricultural Land' :
                                    subcategory.includes('Plot') ? 'Plot / Vacant Land' : subcategory
                                } 
                            >
                                <Input style={{ ...inputStyle, background: '#F1F5F9', color: '#0F172A', fontWeight: 700, border: '1px solid #E2E8F0' }} readOnly />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="Property Status" name="propertyStatus" rules={[{ required: true }]}>
                                <Select style={inputStyle} placeholder="Select Status">
                                    <Option value="Self Occupied">{selectedType === 'Commercial' ? 'Self Used for Business' : 'Self Occupied'}</Option>
                                    {!isAgricultural && !isPlot && <Option value="Let-Out">Let-Out / Rented</Option>}
                                    <Option value="Vacant">Vacant</Option>
                                    <Option value="Sold">Sold</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        
                        <Col xs={24} md={12}>
                            <Form.Item label="Ownership Type" name="ownershipType" initialValue="Self Owned">
                                <Radio.Group buttonStyle="solid">
                                    <Radio.Button value="Self Owned">Self Owned</Radio.Button>
                                    <Radio.Button value="Co-Owned">Co-Owned</Radio.Button>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        
                        {Form.useWatch('ownershipType', form) === 'Co-Owned' && (
                            <Col xs={24} md={12}>
                                <Form.Item label="Ownership Percentage (%)" name="coOwnedPercentage" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} min={1} max={100} />
                                </Form.Item>
                            </Col>
                        )}

                        <Col xs={24} md={12}>
                            <Form.Item label="State" name="propertyState" rules={[{ required: true }]}>
                                <Select style={inputStyle} placeholder="Select State" showSearch>
                                    {["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh","Puducherry","Chandigarh","Other"].map(s => (
                                        <Option key={s} value={s}>{s}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="City" name="propertyCity" rules={[{ required: true }]}>
                                <Input style={inputStyle} placeholder="e.g. Mumbai" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item label="Purchase Price (₹)" name="propertyPurchasePrice" rules={[{ required: true }]}>
                                <InputNumber style={inputStyle} prefix="₹" min={0} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Purchase Date" name="propertyPurchaseDate" rules={[{ required: true }]}>
                                <DatePicker style={inputStyle} format="DD-MM-YYYY" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Registration Date" name="registrationDate" rules={[{ required: true }]}>
                                <DatePicker style={inputStyle} format="DD-MM-YYYY" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="Stamp Duty + Registration Charges (₹)" name="stampDutyCharges">
                                <InputNumber style={inputStyle} prefix="₹" min={0} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* RENTAL INCOME DETAILS */}
                {status === 'Let-Out' && !isAgricultural && !isPlot && (
                    <Card
                        title={<Space><SafetyCertificateOutlined style={{ color: '#5B92E5' }} /> <span>Rental Income & Taxes</span></Space>}
                        style={cardStyle}
                    >
                        <Row gutter={[24, 0]}>
                            <Col xs={24} md={24}>
                                <Alert
                                    message="Tax Rule: 30% Standard Deduction is allowed on Net Annual Value (Rent - Municipal Taxes)."
                                    type="success"
                                    showIcon
                                    style={{ marginBottom: '24px', borderRadius: '12px' }}
                                />
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item label="Monthly Rent Received (₹)" name="monthlyRent" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item label="Months Rented" name="monthsRented" initialValue={12} rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} min={1} max={12} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item label="Municipal Taxes Paid (₹)" name="municipalTaxes">
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                <Form.Item label="Maintenance Charges Paid (₹)" name="maintenanceCharges">
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                )}

                {/* HOME LOAN DETAILS (Hidden for Agricultural) */}
                {!isAgricultural && (
                    <Card
                        title={<Space><DollarOutlined style={{ color: '#5B92E5' }} /> <span>Home Loan Details</span></Space>}
                        style={cardStyle}
                    >
                        <Row gutter={[24, 0]}>
                            <Col xs={24}>
                                <Form.Item label="Do you have an active home loan?" name="hasPropertyLoan" initialValue="no">
                                    <Radio.Group buttonStyle="solid">
                                        <Radio.Button value="no">No</Radio.Button>
                                        <Radio.Button value="yes">Yes</Radio.Button>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>
                            {hasPropertyLoan === 'yes' && (
                                <>
                                    <Col xs={24} md={24}>
                                        <Alert
                                            message={
                                                selectedType === 'Residential' 
                                                ? "Sec 24(b): Max ₹2L interest deduction for self-occupied. Full interest for let-out (capped offset)."
                                                : "Commercial Loan: Interest may be treated as a business expense if used for business."
                                            }
                                            type="info"
                                            showIcon
                                            style={{ marginBottom: '24px', borderRadius: '12px' }}
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Loan Amount (₹)" name="loanAmount">
                                            <InputNumber style={inputStyle} prefix="₹" min={0} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Loan Start Date" name="loanStartDate">
                                             <DatePicker style={inputStyle} format="DD-MM-YYYY" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Interest Paid this FY (₹)" name="loanInterestPaid" rules={[{ required: true }]}>
                                            <InputNumber style={inputStyle} prefix="₹" min={0} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Principal Repaid this FY (₹)" name="loanPrincipalPaid" rules={[{ required: true }]}>
                                            <InputNumber style={inputStyle} prefix="₹" min={0} extra={selectedType === 'Residential' ? "Qualifies for 80C" : ""} />
                                        </Form.Item>
                                    </Col>
                                </>
                            )}
                        </Row>
                    </Card>
                )}

                {/* SALE DETAILS */}
                {status === 'Sold' && (
                    <Card
                        title={<Space><RocketOutlined style={{ color: '#5B92E5' }} /> <span>Sale & Capital Gains</span></Space>}
                        style={cardStyle}
                    >
                        <Row gutter={[24, 0]}>
                            <Col xs={24} md={12}>
                                <Form.Item label="Selling Price (₹)" name="sellingPrice" rules={[{ required: true }]}>
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Selling Date" name="sellingDate" rules={[{ required: true }]}>
                                    <DatePicker style={inputStyle} format="DD-MM-YYYY" />
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                <Form.Item label="Brokerage Paid (₹)" name="propertyBrokerage">
                                    <InputNumber style={inputStyle} prefix="₹" min={0} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={24}>
                                <Alert 
                                    message={
                                        isAgricultural 
                                        ? "Agricultural Land: Capital gains may not apply if classified as Rural Agricultural Land."
                                        : "Capital Gains: Holding period > 2 years is LTCG (12.5% tax). holding period <= 2 years is STCG (Slab rate)."
                                    }
                                    type="warning"
                                    showIcon
                                    style={{ marginBottom: '24px' }}
                                />
                            </Col>
                            
                            <Col xs={24} md={24}>
                                <Form.Item label="Did you reinvest the capital gains?" name="reinvestGains" initialValue="no">
                                    <Radio.Group buttonStyle="solid">
                                        <Radio.Button value="no">No</Radio.Button>
                                        <Radio.Button value="yes">Yes</Radio.Button>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>
                            
                            {Form.useWatch('reinvestGains', form) === 'yes' && (
                                <>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="New Residential Property (₹)" name="reinvest54">
                                            <InputNumber style={inputStyle} prefix="₹" min={0} extra="Sec 54 / 54F" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="54EC Bonds (₹)" name="reinvest54EC">
                                            <InputNumber style={inputStyle} prefix="₹" min={0} extra="Max ₹50L" />
                                        </Form.Item>
                                    </Col>
                                </>
                            )}
                        </Row>
                    </Card>
                )}
            </>
        );
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#5B92E5',
                    borderRadius: 16,
                    fontFamily: "'Outfit', sans-serif",
                },
            }}
        >
            <Layout style={{ minHeight: '100vh', background: '#F2F3F4' }}>
          <Navbar />
          <div style={{ padding: '32px 24px' }}>
                <Content style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
                    {/* Page Header */}
                    <div style={{ marginBottom: '32px' }}>
                        <Button
                            type="text"
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/category-selection')}
                            style={{ color: '#5B92E5', fontWeight: 600, padding: 0, marginBottom: '16px' }}
                        >
                            Back to Category Selection
                        </Button>
                        <div>
                            <Title level={2} style={{ color: '#5B92E5', margin: 0, fontWeight: 700 }}>
                                {category} → {subcategory} {isVehicle ? `→ ${ownership}` : ''}
                            </Title>
                            <Text type="secondary" style={{ fontSize: '16px' }}>
                                Provide your financial and asset details for precise tax optimization.
                            </Text>
                        </div>
                    </div>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        requiredMark={false}
                        initialValues={{
                            purchaseYear: 2025,
                            annualSalary: 1500000,
                            regimePreference: 'Auto Suggest'
                        }}
                    >
                        {/* Dynamic Category Inputs */}
                        {isVehicle && renderVehicleInputs()}

                        {isHealthInsurance && renderHealthInsuranceInputs()}

                        {isStocks && renderStocksInputs()}

                        {isLand && renderLandInputs()}

                        {!isVehicle && !isHealthInsurance && !isStocks && !isLand && (
                            <Card title="Analysis Details" style={cardStyle}>
                                <Paragraph>Analysis logic for {category} - {subcategory} is under preparation. Please enter your income details below.</Paragraph>
                            </Card>
                        )}

                        {/* Global Identity & Income Details */}
                        <Card
                            title={<Space><GlobalOutlined style={{ color: '#5B92E5' }} /> <span>GLOBAL INCOME</span></Space>}
                            style={cardStyle}
                        >
                            <Row gutter={[24, 0]}>
                                {!isVehicle && (
                                    <Col xs={24} md={24}>
                                        <Form.Item label="Employment Type" name="employmentType" initialValue="Salaried" rules={[{ required: true }]}>
                                            <Radio.Group buttonStyle="solid">
                                                <Radio.Button value="Self-Employed">Self-Employed</Radio.Button>
                                                <Radio.Button value="Salaried">Salaried</Radio.Button>
                                            </Radio.Group>
                                        </Form.Item>
                                    </Col>
                                )}
                                <Col xs={24} md={12}>
                                    <Form.Item label="Annual Income (Gross) (₹)" name="annualSalary" rules={[{ required: true, message: 'Income is required' }]}>
                                        <InputNumber style={inputStyle} prefix="₹" min={0} placeholder="E.g. 1500000" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Bonus Income (Annual ₹)" name="bonus">
                                        <InputNumber style={inputStyle} prefix="₹" min={0} placeholder="E.g. 200000" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Other Income (Annual ₹)" name="otherIncome">
                                        <InputNumber style={inputStyle} prefix="₹" min={0} placeholder="Rent, Side Hustle, etc." />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>

                        {/* Deductions */}
                        <Card
                            title={<Space><SafetyOutlined style={{ color: '#5B92E5' }} /> <span>DEDUCTIONS (Old Regime Only)</span></Space>}
                            style={cardStyle}
                        >
                            <Row gutter={[24, 0]}>
                                <Col xs={24} md={12}>
                                    <Form.Item label="80C Investments" name="deduction80C">
                                        <InputNumber style={inputStyle} prefix="₹" min={0} />
                                    </Form.Item>
                                    {d80C > 150000 && <Alert message="Warning: Exceeds ₹1.5L limit." type="error" showIcon />}
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="80D Health" name="deduction80D">
                                        <InputNumber style={inputStyle} prefix="₹" min={0} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="NPS Contribution" name="deductionNPS">
                                        <InputNumber style={inputStyle} prefix="₹" min={0} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="HRA Claim" name="hraDeduction">
                                        <InputNumber style={inputStyle} prefix="₹" min={0} />
                                    </Form.Item>
                                </Col>
                                {employmentType === 'Salaried' && (
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Professional Tax (Annual ₹)" name="professionalTax" initialValue={2500}>
                                            <InputNumber style={inputStyle} prefix="₹" min={0} />
                                        </Form.Item>
                                    </Col>
                                )}
                                {employmentType === 'Salaried' && (
                                    <Col xs={24}>
                                        <Alert 
                                            message="Standard Deduction: ₹75,000 flat deduction automatically applied for salaried individuals in both Old and New Regimes." 
                                            type="success" 
                                            showIcon 
                                            style={{ marginTop: '16px', borderRadius: '12px' }}
                                        />
                                    </Col>
                                )}
                            </Row>
                        </Card>

                        {/* Regime Preference */}
                        <Card style={{ ...cardStyle, background: '#5B92E5' }} bodyStyle={{ padding: '32px' }}>
                            <Row align="middle" justify="space-between" gutter={[16, 16]}>
                                <Col xs={24} md={16}>
                                    <Text style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 600 }}>Tax Regime Preference</Text>
                                    <div style={{ color: '#CCF1FF', fontSize: '13px', marginTop: '4px' }}>Our engine will recommend the best option based on your inputs.</div>
                                </Col>
                                <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                                    <Form.Item name="regimePreference" noStyle>
                                        <Radio.Group buttonStyle="solid">
                                            <Radio.Button value="Auto Suggest">Auto Suggest</Radio.Button>
                                            <Radio.Button value="Old Regime">Old</Radio.Button>
                                            <Radio.Button value="New Regime">New</Radio.Button>
                                        </Radio.Group>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>

                        {/* Submit */}
                        <div style={{ marginTop: '48px', textAlign: 'center' }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                disabled={!isFormValid || submitting}
                                loading={submitting}
                                icon={<ArrowRightOutlined />}
                                style={{
                                    height: '64px',
                                    padding: '0 64px',
                                    fontSize: '20px',
                                    borderRadius: '50px',
                                    fontWeight: 700,
                                    boxShadow: isFormValid ? '0 8px 30px rgba(8, 69, 126, 0.3)' : 'none',
                                    opacity: isFormValid ? 1 : 0.6
                                }}
                            >
                                Analyze Now
                            </Button>
                            {!isFormValid && (
                                <div style={{ marginTop: '12px' }}>
                                    <Text type="danger">Please fill required fields before running tax analysis.</Text>
                                </div>
                            )}
                        </div>
                    </Form>

                    <div style={{ marginTop: '60px', textAlign: 'center', marginBottom: '40px' }}>
                        <Text style={{ color: '#9CA3AF', fontSize: '13px' }}>
                            Private & Secure Analysis · Encrypted Data Transmission
                        </Text>
                    </div>
                </Content>
            </div>
            </Layout>
            <style>
                {`
                    .ant-input-number-input { height: 48px !important; }
                    .ant-form-item-label label { font-weight: 600; color: #5B92E5; }
                    .ant-radio-button-wrapper-checked { background: #5B92E5 !important; border-color: #5B92E5 !important; }
                `}
            </style>
        </ConfigProvider>
    );
};

export default AnalysisForm;
