import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import {
  Layout, Typography, Card, Row, Col, Button, Upload,
  Space, Tag, Alert, Spin, ConfigProvider, Divider, List
} from 'antd';
import {
  ArrowLeftOutlined, UploadOutlined, FilePdfOutlined,
  CheckCircleFilled, WarningOutlined, RobotOutlined, FileTextOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { uploadDocument } from '../../config/api';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

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

  const handleForm16Upload = async ({ file }) => {
    try {
      setForm16Loading(true);
      setForm16Error('');
      setForm16Result(null);
      const base64 = await toBase64(file);
      const result = await uploadDocument(user.id, base64, 'form16');
      setForm16Result(result);
    } catch (err) {
      setForm16Error(err.message || 'Upload failed. Please try again.');
    } finally {
      setForm16Loading(false);
    }
  };

  const handleAISUpload = async ({ file }) => {
    try {
      setAisLoading(true);
      setAisError('');
      setAisResult(null);
      const base64 = await toBase64(file);
      const result = await uploadDocument(user.id, base64, 'ais');
      setAisResult(result);
    } catch (err) {
      setAisError(err.message || 'Upload failed. Please try again.');
    } finally {
      setAisLoading(false);
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#5B92E5', borderRadius: 16, fontFamily: "'Outfit', sans-serif" } }}>
      <Layout style={{ minHeight: '100vh', background: '#F2F3F4' }}>
          <Navbar />
          <div style={{ padding: '32px 24px' }}>
        <Content style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>

          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard', { state: location.state })}
            style={{ marginBottom: 24, borderRadius: 12, fontWeight: 600, color: '#08457E' }}>
            Back to Dashboard
          </Button>

          <div style={{ marginBottom: 40 }}>
            <Title level={2} style={{ color: '#08457E', fontWeight: 800, margin: 0 }}>
              Document Upload & Analysis
            </Title>
            <Paragraph style={{ color: '#6B7280', fontSize: 16, marginTop: 8 }}>
              Upload Form 16 or AIS — our AI reads it and auto-fills your profile. Zero manual entry.
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>

            {/* Form 16 Upload */}
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
                    message="Gemini Vision reads your Form 16 and auto-extracts salary, TDS, deductions and employer details."
                    type="info" showIcon
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
                      <div style={{ marginTop: 12, color: '#6B7280' }}>AI is reading your Form 16...</div>
                    </div>
                  ) : form16Result ? (
                    <div style={{ background: '#F0FDF4', borderRadius: 16, padding: 20 }}>
                      <Space style={{ marginBottom: 12 }}>
                        <CheckCircleFilled style={{ color: '#059669', fontSize: 20 }} />
                        <Text strong style={{ color: '#059669' }}>Form 16 Processed Successfully!</Text>
                      </Space>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {form16Result.extracted && Object.entries(form16Result.extracted).slice(0, 6).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 13, color: '#6B7280' }}>{k}</Text>
                            <Text strong style={{ fontSize: 13, color: '#08457E' }}>{v}</Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Upload
                      accept=".pdf,.jpg,.jpeg,.png"
                      showUploadList={false}
                      customRequest={handleForm16Upload}
                      maxCount={1}
                    >
                      <Button
                        block size="large"
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

            {/* AIS Upload */}
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
                    message="AI cross-checks your AIS against your profile and flags mismatches before the IT Dept notices."
                    type="warning" showIcon
                    style={{ borderRadius: 12 }}
                  />

                  <div style={{ background: '#F2F3F4', borderRadius: 16, padding: 20 }}>
                    <Text strong style={{ color: '#5B92E5', fontSize: 13 }}>What gets checked:</Text>
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {['TDS vs actual income match', 'Bank interest reported correctly', 'Capital gains cross-check', 'Foreign remittance flags', 'GST turnover alignment', 'Dividend income verification'].map((item, i) => (
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
                      <div style={{ marginTop: 12, color: '#6B7280' }}>AI is checking your AIS for mismatches...</div>
                    </div>
                  ) : aisResult ? (
                    <div style={{ background: aisResult.mismatches?.length > 0 ? '#FFF7ED' : '#F0FDF4', borderRadius: 16, padding: 20 }}>
                      <Space style={{ marginBottom: 12 }}>
                        {aisResult.mismatches?.length > 0
                          ? <WarningOutlined style={{ color: '#D97706', fontSize: 20 }} />
                          : <CheckCircleFilled style={{ color: '#059669', fontSize: 20 }} />
                        }
                        <Text strong style={{ color: aisResult.mismatches?.length > 0 ? '#D97706' : '#059669' }}>
                          {aisResult.mismatches?.length > 0 ? `${aisResult.mismatches.length} Mismatch(es) Found!` : 'No Mismatches Found'}
                        </Text>
                      </Space>
                      {aisResult.mismatches?.map((m, i) => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: 10, padding: '10px 14px', marginBottom: 8, border: '1px solid #FED7AA' }}>
                          <Text style={{ fontSize: 13, color: '#92400E' }}>{m}</Text>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Upload
                      accept=".pdf,.jpg,.jpeg,.png"
                      showUploadList={false}
                      customRequest={handleAISUpload}
                      maxCount={1}
                    >
                      <Button
                        block size="large"
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

          {/* How to Download */}
          <Card style={{ borderRadius: 24, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginTop: 24 }}>
            <Title level={5} style={{ color: '#5B92E5', marginBottom: 16 }}>How to Download These Documents</Title>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Text strong style={{ color: '#08457E' }}>Form 16:</Text>
                <Paragraph style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>
                  Ask your HR/Payroll team. Issued by employer every year before June 15. Available in TRACES portal if employer has filed TDS returns.
                </Paragraph>
              </Col>
              <Col xs={24} md={12}>
                <Text strong style={{ color: '#08457E' }}>AIS / 26AS:</Text>
                <Paragraph style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>
                  Go to incometax.gov.in → Login → AIS tab → Download PDF. Or TRACES portal → View 26AS → Export PDF.
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
