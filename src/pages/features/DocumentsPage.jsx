import React, { useMemo, useState } from 'react';
import Navbar from '../../components/Navbar';
import {
  Layout, Typography, Card, Row, Col, Button, Upload,
  Space, Alert, Spin, ConfigProvider, Divider, Tag
} from 'antd';
import {
  ArrowLeftOutlined, UploadOutlined, FilePdfOutlined,
  CheckCircleFilled, WarningOutlined, FileTextOutlined, InfoCircleFilled
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { uploadDocument } from '../../config/api';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'number') return `₹${Number(value).toLocaleString('en-IN')}`;
  return String(value);
};

const prettifyKey = (key) =>
  String(key)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const SummaryRows = ({ data, preferredKeys = [] }) => {
  const entries = useMemo(() => {
    if (!data || typeof data !== 'object') return [];
    const all = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '');
    const ordered = [];
    preferredKeys.forEach((key) => {
      const found = all.find(([k]) => k === key);
      if (found) ordered.push(found);
    });
    all.forEach((entry) => {
      if (!ordered.find(([k]) => k === entry[0])) ordered.push(entry);
    });
    return ordered.slice(0, 8);
  }, [data, preferredKeys]);

  if (!entries.length) {
    return <Text style={{ color: '#6B7280', fontSize: 13 }}>No structured fields were extracted. Please try a clearer document.</Text>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {entries.map(([key, value]) => (
        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <Text style={{ fontSize: 13, color: '#6B7280' }}>{prettifyKey(key)}</Text>
          <Text strong style={{ fontSize: 13, color: '#08457E', textAlign: 'right' }}>{formatValue(value)}</Text>
        </div>
      ))}
    </div>
  );
};

const MismatchList = ({ mismatches }) => {
  if (!mismatches?.length) {
    return (
      <div style={{ background: '#F0FDF4', borderRadius: 12, padding: 16 }}>
        <Space>
          <CheckCircleFilled style={{ color: '#059669', fontSize: 18 }} />
          <Text strong style={{ color: '#059669' }}>No mismatches found in the uploaded AIS / 26AS.</Text>
        </Space>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {mismatches.map((mismatch, index) => {
        const message = typeof mismatch === 'string' ? mismatch : mismatch.message || JSON.stringify(mismatch);
        const severity = typeof mismatch === 'object' ? mismatch.severity : null;

        return (
          <div
            key={index}
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '12px 14px',
              border: '1px solid #FED7AA'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: '#92400E' }}>{message}</Text>
              {severity && (
                <Tag color={severity === 'high' ? 'red' : severity === 'medium' ? 'orange' : 'blue'}>
                  {severity}
                </Tag>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DocumentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [form16Loading, setForm16Loading] = useState(false);
  const [aisLoading, setAisLoading] = useState(false);
  const [form16Result, setForm16Result] = useState(null);
  const [aisResult, setAisResult] = useState(null);
  const [form16Error, setForm16Error] = useState('');
  const [aisError, setAisError] = useState('');

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });

  const uploadAndProcess = async (file, docType) => {
    if (!user?.id) throw new Error('Please log in again before uploading a document.');
    const base64 = await toBase64(file);
    const mimeType = file?.type || 'application/pdf';
    const fileName = file?.name || `${docType}-${Date.now()}`;
    return uploadDocument(user.id, base64, docType, mimeType, fileName);
  };

  const handleForm16Upload = async ({ file, onSuccess, onError }) => {
    try {
      setForm16Loading(true);
      setForm16Error('');
      setForm16Result(null);
      const result = await uploadAndProcess(file, 'form16');
      setForm16Result(result);
      onSuccess?.(result);
    } catch (err) {
      const message = err.message || 'Upload failed. Please try again.';
      setForm16Error(message);
      onError?.(new Error(message));
    } finally {
      setForm16Loading(false);
    }
  };

  const handleAISUpload = async ({ file, onSuccess, onError }) => {
    try {
      setAisLoading(true);
      setAisError('');
      setAisResult(null);
      const result = await uploadAndProcess(file, 'ais');
      setAisResult(result);
      onSuccess?.(result);
    } catch (err) {
      const message = err.message || 'Upload failed. Please try again.';
      setAisError(message);
      onError?.(new Error(message));
    } finally {
      setAisLoading(false);
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#5B92E5', borderRadius: 16, fontFamily: "'Outfit', sans-serif" } }}>
      <Layout style={{ minHeight: '100vh', background: '#F2F3F4' }}>
        <Navbar />
        <div style={{ padding: '32px 24px' }}>
          <Content style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '24px 16px' }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/dashboard', { state: location.state })}
              style={{ marginBottom: 24, borderRadius: 12, fontWeight: 600, color: '#08457E' }}
            >
              Back to Dashboard
            </Button>

            <div style={{ marginBottom: 40 }}>
              <Title level={2} style={{ color: '#08457E', fontWeight: 800, margin: 0 }}>
                Document Upload & Analysis
              </Title>
              <Paragraph style={{ color: '#6B7280', fontSize: 16, marginTop: 8 }}>
                Upload Form 16 or AIS / 26AS. The system extracts structured tax data and cross-checks it against your saved profile.
              </Paragraph>
            </div>

            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card style={{ borderRadius: 24, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', height: '100%' }}>
                  <Space direction="vertical" size={20} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#5B92E515', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FilePdfOutlined style={{ fontSize: 24, color: '#08457E' }} />
                      </div>
                      <div>
                        <Title level={4} style={{ margin: 0, color: '#08457E' }}>Form 16 Upload</Title>
                        <Text style={{ color: '#6B7280', fontSize: 13 }}>Employer-issued TDS certificate</Text>
                      </div>
                    </div>

                    <Alert
                      message="The backend extracts salary, deductions, TDS, and employer fields from Form 16 and can update your saved income profile."
                      type="info"
                      showIcon
                      icon={<InfoCircleFilled />}
                      style={{ borderRadius: 12 }}
                    />

                    <div style={{ background: '#F2F3F4', borderRadius: 16, padding: 20 }}>
                      <Text strong style={{ color: '#5B92E5', fontSize: 13 }}>What gets extracted:</Text>
                      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {['Gross Salary & Basic Pay', 'HRA & Allowances', 'TDS Deducted', '80C / 80D Declarations', 'Employer PAN & TAN', 'Net Taxable Income'].map((item, i) => (
                          <Space key={i} size={8}>
                            <CheckCircleFilled style={{ color: '#059669', fontSize: 14 }} />
                            <Text style={{ fontSize: 13, color: '#6B7280' }}>{item}</Text>
                          </Space>
                        ))}
                      </div>
                    </div>

                    {form16Error && <Alert message={form16Error} type="error" showIcon style={{ borderRadius: 12 }} />}

                    {form16Loading ? (
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 12, color: '#6B7280' }}>Reading your Form 16...</div>
                      </div>
                    ) : form16Result ? (
                      <div style={{ background: '#F0FDF4', borderRadius: 16, padding: 20 }}>
                        <Space style={{ marginBottom: 12 }}>
                          <CheckCircleFilled style={{ color: '#059669', fontSize: 20 }} />
                          <Text strong style={{ color: '#059669' }}>
                            {form16Result.profileUpdated ? 'Form 16 processed — income profile auto-updated.' : 'Form 16 processed successfully.'}
                          </Text>
                        </Space>
                        <SummaryRows
                          data={form16Result.extractedData}
                          preferredKeys={['employerName', 'grossSalary', 'basicSalary', 'hra', 'section80C', 'section80D', 'tdsByEmployer', 'regime']}
                        />
                        {form16Result.profileUpdated && (
                          <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <Button
                              type="primary"
                              icon={<ArrowLeftOutlined style={{ transform: 'rotate(180deg)' }} />}
                              onClick={() => navigate('/category-selection', { state: location.state })}
                              style={{ borderRadius: 12, background: '#08457E', border: 'none', fontWeight: 600 }}
                            >
                              Run Analysis with Form 16 Data
                            </Button>
                            <Button
                              onClick={() => { setForm16Result(null); setForm16Error(''); }}
                              style={{ borderRadius: 12 }}
                            >
                              Upload Another
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Upload
                        accept=".pdf,.jpg,.jpeg,.png"
                        showUploadList={false}
                        customRequest={handleForm16Upload}
                        maxCount={1}
                      >
                        <Button
                          block
                          size="large"
                          icon={<UploadOutlined />}
                          style={{ height: 52, borderRadius: 12, borderStyle: 'dashed', borderColor: '#5B92E5', color: '#5B92E5', background: '#F2F3F4' }}
                        >
                          Upload Form 16 (PDF / Image)
                        </Button>
                      </Upload>
                    )}
                  </Space>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card style={{ borderRadius: 24, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', height: '100%' }}>
                  <Space direction="vertical" size={20} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#08457E15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileTextOutlined style={{ fontSize: 24, color: '#08457E' }} />
                      </div>
                      <div>
                        <Title level={4} style={{ margin: 0, color: '#08457E' }}>AIS / 26AS Upload</Title>
                        <Text style={{ color: '#6B7280', fontSize: 13 }}>Annual Information Statement</Text>
                      </div>
                    </div>

                    <Alert
                      message="The backend compares AIS income with your saved profile and flags likely mismatches before filing."
                      type="warning"
                      showIcon
                      style={{ borderRadius: 12 }}
                    />

                    <div style={{ background: '#F2F3F4', borderRadius: 16, padding: 20 }}>
                      <Text strong style={{ color: '#5B92E5', fontSize: 13 }}>What gets checked:</Text>
                      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {['TDS vs actual income match', 'Bank interest reported correctly', 'Capital gains cross-check', 'Rental income mismatch', 'Dividend income verification'].map((item, i) => (
                          <Space key={i} size={8}>
                            <CheckCircleFilled style={{ color: '#08457E', fontSize: 14 }} />
                            <Text style={{ fontSize: 13, color: '#6B7280' }}>{item}</Text>
                          </Space>
                        ))}
                      </div>
                    </div>

                    {aisError && <Alert message={aisError} type="error" showIcon style={{ borderRadius: 12 }} />}

                    {aisLoading ? (
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 12, color: '#6B7280' }}>Checking your AIS / 26AS...</div>
                      </div>
                    ) : aisResult ? (
                      <div style={{ background: aisResult.mismatchCount > 0 ? '#FFF7ED' : '#F0FDF4', borderRadius: 16, padding: 20 }}>
                        <Space style={{ marginBottom: 12 }}>
                          {aisResult.mismatchCount > 0 ? (
                            <WarningOutlined style={{ color: '#D97706', fontSize: 20 }} />
                          ) : (
                            <CheckCircleFilled style={{ color: '#059669', fontSize: 20 }} />
                          )}
                          <Text strong style={{ color: aisResult.mismatchCount > 0 ? '#D97706' : '#059669' }}>
                            {aisResult.mismatchCount > 0 ? `${aisResult.mismatchCount} mismatch(es) found` : 'No mismatches found'}
                          </Text>
                        </Space>
                        <MismatchList mismatches={aisResult.mismatches} />
                        {aisResult.extractedData && (
                          <>
                            <Divider />
                            <SummaryRows
                              data={aisResult.extractedData}
                              preferredKeys={['salaryIncome', 'fdInterest', 'dividendIncome', 'rentalIncome', 'capitalGains', 'otherIncome', 'totalTDS']}
                            />
                          </>
                        )}
                      </div>
                    ) : (
                      <Upload
                        accept=".pdf,.jpg,.jpeg,.png"
                        showUploadList={false}
                        customRequest={handleAISUpload}
                        maxCount={1}
                      >
                        <Button
                          block
                          size="large"
                          icon={<UploadOutlined />}
                          style={{ height: 52, borderRadius: 12, borderStyle: 'dashed', borderColor: '#08457E', color: '#08457E', background: '#F2F3F4' }}
                        >
                          Upload AIS / 26AS (PDF / Image)
                        </Button>
                      </Upload>
                    )}
                  </Space>
                </Card>
              </Col>
            </Row>

            <Card style={{ marginTop: 24, borderRadius: 24, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <Title level={4} style={{ color: '#5B92E5', marginTop: 0 }}>How to Download These Documents</Title>
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Text strong style={{ color: '#08457E' }}>Form 16:</Text>
                  <Paragraph style={{ color: '#6B7280', marginTop: 8 }}>
                    Ask your HR or payroll team. It is usually issued once the employer files salary TDS details for the financial year.
                  </Paragraph>
                </Col>
                <Col xs={24} md={12}>
                  <Text strong style={{ color: '#08457E' }}>AIS / 26AS:</Text>
                  <Paragraph style={{ color: '#6B7280', marginTop: 8 }}>
                    Download it from the Income Tax portal after login under the AIS section or from TRACES for Form 26AS.
                  </Paragraph>
                </Col>
              </Row>
            </Card>
          </Content>
        </div>
      </Layout>
    </ConfigProvider>
  );
};

export default DocumentsPage;
