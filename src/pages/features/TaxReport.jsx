import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { Button, ConfigProvider } from 'antd';
import { PrinterOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const TaxReport = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { userProfile } = useAuth();
  const printRef  = useRef();

  const { formData = {}, backendResult = {}, category = '', subcategory = '', ownership = '' } = location.state || {};

  // ── Tax calculations ──
  const salary      = formData?.annualSalary || 0;
  const bonus       = formData?.bonus        || 0;
  const otherIncome = formData?.otherIncome  || 0;
  const gross       = salary + bonus + otherIncome;

  const d80C  = Math.min(formData?.deduction80C  || 0, 150000);
  const d80D  = Math.min(formData?.deduction80D   || 0, 50000);
  const dNPS  = Math.min(formData?.deductionNPS   || 0, 50000);
  const dHRA  = formData?.hraDeduction            || 0;
  const stdOld = 50000;
  const stdNew = 75000;

  const taxableOld = Math.max(0, gross - stdOld - d80C - d80D - dNPS - dHRA);
  const taxableNew = Math.max(0, gross - stdNew);

  const calcOld = (t) => {
    if (t <= 250000) return 0;
    if (t <= 500000) return (t - 250000) * 0.05;
    if (t <= 1000000) return 12500 + (t - 500000) * 0.20;
    return 112500 + (t - 1000000) * 0.30;
  };
  const calcNew = (t) => {
    if (t <= 400000) return 0;
    if (t <= 800000) return (t - 400000) * 0.05;
    if (t <= 1200000) return 20000 + (t - 800000) * 0.10;
    if (t <= 1600000) return 60000 + (t - 1200000) * 0.15;
    if (t <= 2000000) return 120000 + (t - 1600000) * 0.20;
    return 200000 + (t - 2000000) * 0.25;
  };

  const taxOld = backendResult?.oldRegime?.totalTax ?? (taxableOld <= 500000 ? 0 : Math.round(calcOld(taxableOld) * 1.04));
  const taxNew = backendResult?.newRegime?.totalTax ?? (taxableNew <= 700000 ? 0 : Math.round(calcNew(taxableNew) * 1.04));
  const better  = taxOld <= taxNew ? 'Old Regime' : 'New Regime';
  const saving  = Math.abs(taxOld - taxNew);
  const health  = backendResult?.healthScore ?? 75;
  const leakage = backendResult?.totalLeakage ?? 0;
  const gaps    = backendResult?.leakageGaps  ?? [];

  const today   = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  const fmt = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

  const s = { // styles
    page      : { fontFamily: "'Outfit', 'Segoe UI', sans-serif", maxWidth: 800, margin: '0 auto', padding: '24px', color: '#1F2937', background: '#fff' },
    header    : { background: '#08457E', color: '#fff', padding: '32px 40px', borderRadius: 16, marginBottom: 24 },
    section   : { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px', marginBottom: 16 },
    label     : { fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    value     : { fontSize: 20, fontWeight: 700, color: '#08457E' },
    row       : { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F3F4F6' },
    tag       : (c) => ({ display: 'inline-block', background: c + '20', color: c, padding: '2px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }),
    grid2     : { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    grid3     : { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
    card      : (bg) => ({ background: bg, borderRadius: 12, padding: '20px', textAlign: 'center' }),
  };

  return (
    <ConfigProvider theme={{ token: { fontFamily: "'Outfit', sans-serif" } }}>
      {/* Print button — hidden when printing */}
      <div className="no-print" style={{ background: '#F2F3F4', padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #E5E7EB' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ borderRadius: 10 }}>Back</Button>
        <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}
          style={{ borderRadius: 10, background: '#08457E', border: 'none', fontWeight: 600 }}>
          Download PDF / Print
        </Button>
        <span style={{ color: '#6B7280', fontSize: 13 }}>Opens browser print dialog — save as PDF</span>
      </div>

      {/* ── PRINTABLE REPORT ── */}
      <div ref={printRef} style={s.page}>

        {/* Header */}
        <div style={s.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>DrainZero</div>
              <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>Personal Tax Optimization Report — FY 2025–26</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, opacity: 0.8 }}>
              <div>Generated: {today}</div>
              <div>AY 2026–27</div>
            </div>
          </div>
          {userProfile && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', gap: 32, flexWrap: 'wrap', fontSize: 14 }}>
              <div><span style={{ opacity: 0.7 }}>Name: </span><strong>{userProfile.name}</strong></div>
              <div><span style={{ opacity: 0.7 }}>Email: </span><strong>{userProfile.email}</strong></div>
              {userProfile.city && <div><span style={{ opacity: 0.7 }}>City: </span><strong>{userProfile.city}, {userProfile.state}</strong></div>}
              {userProfile.employment_type && <div><span style={{ opacity: 0.7 }}>Employment: </span><strong>{userProfile.employment_type}</strong></div>}
              {category && <div><span style={{ opacity: 0.7 }}>Analysis: </span><strong>{category} → {subcategory}</strong></div>}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div style={{ ...s.grid3, marginBottom: 16 }}>
          <div style={s.card('#EFF6FF')}>
            <div style={s.label}>Old Regime Tax</div>
            <div style={{ ...s.value, color: '#6B7280' }}>{fmt(taxOld)}</div>
          </div>
          <div style={{ ...s.card('#F0FDF4'), border: '2px solid #10B981' }}>
            <div style={s.label}>New Regime Tax</div>
            <div style={{ ...s.value, color: '#059669' }}>{fmt(taxNew)}</div>
            {better === 'New Regime' && <div style={s.tag('#059669')}>Recommended ✓</div>}
          </div>
          <div style={s.card('#08457E')}>
            <div style={{ ...s.label, color: '#CCF1FF' }}>You Save</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>{fmt(saving)}</div>
            <div style={{ fontSize: 12, color: '#CCF1FF' }}>by choosing {better}</div>
          </div>
        </div>

        {/* Income Profile */}
        <div style={s.section}>
          <h3 style={{ color: '#08457E', margin: '0 0 16px', fontSize: 16 }}>Income Profile</h3>
          {[
            ['Gross Annual Salary', fmt(salary)],
            ['Bonus / Variable Pay', fmt(bonus)],
            ['Other Income', fmt(otherIncome)],
            ['Total Gross Income', fmt(gross)],
          ].map(([l, v], i) => (
            <div key={i} style={{ ...s.row, fontWeight: l.includes('Total') ? 700 : 400, borderBottom: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
              <span style={{ color: '#6B7280' }}>{l}</span>
              <span style={{ color: '#08457E' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Regime Comparison */}
        <div style={s.section}>
          <h3 style={{ color: '#08457E', margin: '0 0 16px', fontSize: 16 }}>Regime Comparison</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#F8F9FA' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#6B7280', fontWeight: 600 }}>Component</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: '#6B7280', fontWeight: 600 }}>Old Regime</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: '#059669', fontWeight: 600 }}>New Regime</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Gross Income',         fmt(gross),       fmt(gross)],
                ['Standard Deduction',   fmt(stdOld),      fmt(stdNew)],
                ['80C Investments',      fmt(d80C),        '—'],
                ['80D Health Insurance', fmt(d80D),        '—'],
                ['NPS 80CCD(1B)',         fmt(dNPS),        '—'],
                ['HRA Exemption',        fmt(dHRA),        '—'],
                ['Total Deductions',     fmt(stdOld+d80C+d80D+dNPS+dHRA), fmt(stdNew)],
                ['Taxable Income',       fmt(taxableOld),  fmt(taxableNew)],
                ['Tax + Cess (4%)',       fmt(taxOld),      fmt(taxNew)],
              ].map(([l, o, n], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB', fontWeight: l.includes('Tax + Cess') ? 700 : 400 }}>
                  <td style={{ padding: '10px 12px', color: '#374151' }}>{l}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#6B7280' }}>{o}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#059669' }}>{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#08457E', borderRadius: 8, color: '#fff', fontSize: 14 }}>
            ✅ <strong>Recommendation:</strong> Switch to <strong>{better}</strong> — saves you <strong>{fmt(saving)}</strong> annually.
          </div>
        </div>

        {/* Tax Health Score */}
        <div style={s.section}>
          <h3 style={{ color: '#08457E', margin: '0 0 16px', fontSize: 16 }}>Tax Health Score</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: health >= 80 ? '#F0FDF4' : health >= 50 ? '#FFF7ED' : '#FEF2F2', border: `4px solid ${health >= 80 ? '#10B981' : health >= 50 ? '#F59E0B' : '#EF4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: health >= 80 ? '#10B981' : health >= 50 ? '#F59E0B' : '#EF4444' }}>{health}</span>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#08457E' }}>{health >= 80 ? 'Good Optimization' : health >= 50 ? 'Moderate Optimization' : 'Needs Improvement'}</div>
              <div style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>Your tax planning efficiency score out of 100</div>
              {leakage > 0 && <div style={{ color: '#EF4444', fontSize: 14, marginTop: 4 }}>⚠️ Estimated annual tax leakage: <strong>{fmt(leakage)}</strong></div>}
            </div>
          </div>
        </div>

        {/* Leakage Gaps */}
        {gaps.length > 0 && (
          <div style={s.section}>
            <h3 style={{ color: '#08457E', margin: '0 0 16px', fontSize: 16 }}>Tax Leakage Gaps Identified</h3>
            {gaps.map((gap, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: i < gaps.length - 1 ? '1px solid #F3F4F6' : 'none', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1F2937', fontSize: 14 }}>{gap.label || gap.section}</div>
                  <div style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>{gap.description || `Utilize ${gap.section} to reduce tax burden`}</div>
                </div>
                <div style={{ color: '#EF4444', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>Save {fmt(gap.taxSaved)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Deduction Summary */}
        <div style={s.section}>
          <h3 style={{ color: '#08457E', margin: '0 0 16px', fontSize: 16 }}>Declared Deductions (Old Regime)</h3>
          <div style={s.grid2}>
            {[
              ['Section 80C (Investments)', fmt(d80C), '₹1,50,000'],
              ['Section 80D (Health)',      fmt(d80D), '₹25,000–50,000'],
              ['NPS 80CCD(1B)',              fmt(dNPS), '₹50,000'],
              ['HRA Exemption',             fmt(dHRA), 'Actual formula'],
            ].map(([l, v, max], i) => (
              <div key={i} style={{ background: '#F8F9FA', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{l}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#08457E', margin: '4px 0' }}>{v}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>Max: {max}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Recommendations */}
        <div style={s.section}>
          <h3 style={{ color: '#08457E', margin: '0 0 16px', fontSize: 16 }}>Key Recommendations</h3>
          {[
            d80C < 150000 && `Invest ₹${(150000-d80C).toLocaleString('en-IN')} more in 80C (PPF/ELSS/LIC) to maximize limit`,
            dNPS < 50000  && `Contribute ₹${(50000-dNPS).toLocaleString('en-IN')} more to NPS for exclusive 80CCD(1B) benefit`,
            d80D < 25000  && 'Get health insurance to claim Section 80D deduction',
            better === 'New Regime' && `Switch to New Regime — saves ₹${saving.toLocaleString('en-IN')} annually`,
            better === 'Old Regime' && `Stay in Old Regime — your deductions make it more beneficial`,
            category === 'Vehicle' && formData?.fuelType === 'Electric' && 'EV loan qualifies for ₹1.5L deduction under Section 80EEB',
          ].filter(Boolean).map((rec, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid #F3F4F6', fontSize: 14 }}>
              <span style={{ color: '#10B981', fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span style={{ color: '#374151' }}>{rec}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '24px 0', borderTop: '2px solid #E5E7EB', marginTop: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#08457E' }}>DrainZero — Smart Tax Optimization</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
            This report is for informational purposes only. Consult a CA for professional tax advice. • FY 2025–26 / AY 2026–27
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Generated on {today}</div>
        </div>

      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          @page { margin: 15mm; size: A4; }
        }
        @media (max-width: 600px) {
          div[style*="grid-template-columns: 1fr 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </ConfigProvider>
  );
};

export default TaxReport;
