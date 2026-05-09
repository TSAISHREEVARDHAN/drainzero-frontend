import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, ConfigProvider, message } from 'antd';
import { PrinterOutlined, ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import useProfileData from '../../hooks/useProfileData';
import Navbar from '../../components/Navbar';

const TaxReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const reportRef = useRef();

  // Prefer navigation state; fallback to DB via useProfileData (handles refresh)
  const profileData = useProfileData();
  const formData     = (location.state?.formData)     || profileData.formData     || {};
  const backendResult= (location.state?.backendResult) || profileData.backendResult || {};
  const category     = location.state?.category     || profileData.category     || '';
  const subcategory  = location.state?.subcategory  || profileData.subcategory  || '';

  const salary      = formData?.annualSalary || 0;
  const bonus       = formData?.bonus        || 0;
  const otherIncome = formData?.otherIncome  || 0;
  const gross       = salary + bonus + otherIncome;
  const d80C        = Math.min(formData?.deduction80C || 0, 150000);
  const d80D        = Math.min(formData?.deduction80D || 0, 50000);
  const dNPS        = Math.min(formData?.deductionNPS || 0, 50000);
  const dHRA        = formData?.hraDeduction || 0;
  const stdOld      = 50000;
  const stdNew      = 75000;
  const taxableOld  = Math.max(0, gross - stdOld - d80C - d80D - dNPS - dHRA);
  const taxableNew  = Math.max(0, gross - stdNew);

  const calcOld = (t) => {
    if (t <= 250000) return 0;
    if (t <= 500000) return (t-250000)*0.05;
    if (t <= 1000000) return 12500+(t-500000)*0.20;
    return 112500+(t-1000000)*0.30;
  };
  const calcNew = (t) => {
    // FY 2025-26 (Budget 2025) slabs
    if (t <= 400000)  return 0;
    if (t <= 800000)  return (t-400000)*0.05;
    if (t <= 1200000) return 20000+(t-800000)*0.10;
    if (t <= 1600000) return 60000+(t-1200000)*0.15;
    if (t <= 2000000) return 120000+(t-1600000)*0.20;
    if (t <= 2400000) return 200000+(t-2000000)*0.25;
    return 300000+(t-2400000)*0.30;
  };

  const taxOld  = backendResult?.oldRegime?.totalTax ?? (taxableOld<=500000?0:Math.round(calcOld(taxableOld)*1.04));
  const taxNew  = backendResult?.newRegime?.totalTax ?? (taxableNew<=1200000?0:Math.round(calcNew(taxableNew)*1.04));
  // FIX: when new=0 and old>0, new regime clearly wins
  const better  = taxNew < taxOld ? 'New Regime' : taxOld < taxNew ? 'Old Regime' : 'New Regime';
  const saving  = Math.abs(taxOld - taxNew);
  // Real health score from backend, or compute from form data, never fake
  const computeLocalHealth = () => {
    let score = 100;
    if (d80C < 150000) score -= 15;
    if (d80D < 25000)  score -= 10;
    if (dNPS < 50000)  score -= 10;
    if (dHRA === 0 && salary > 0) score -= 5;
    return Math.max(30, score);
  };
  const hasBackendHealth = backendResult?.healthScore !== undefined && backendResult?.healthScore !== null;
  const health = hasBackendHealth ? backendResult.healthScore : (salary > 0 ? computeLocalHealth() : null);
  const leakage = backendResult?.totalLeakage ?? 0;
  const gaps    = backendResult?.leakageGaps  ?? [];
  const today   = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  const fmt     = (n) => `₹${Math.round(n||0).toLocaleString('en-IN')}`;

  const handleDownload = () => {
    message.info({ content: 'Opening print dialog — select "Save as PDF" as destination', duration: 4 });
    setTimeout(() => window.print(), 500);
  };

  return (
    <ConfigProvider theme={{ token: { fontFamily: "'Outfit', sans-serif" } }}>

      {/* Toolbar */}
      <div className="no-print">
        <Navbar />
        <div style={{ background:'#fff', padding:'12px 32px', display:'flex', gap:12, alignItems:'center', borderBottom:'1px solid #E5E7EB', flexWrap:'wrap' }}>
          <Button icon={<ArrowLeftOutlined/>} onClick={() => navigate(-1)} style={{ borderRadius:10 }}>Back</Button>
          <Button type="primary" icon={<DownloadOutlined/>} onClick={handleDownload}
            style={{ borderRadius:10, background:'#08457E', border:'none', fontWeight:600 }}>
            Download PDF
          </Button>
          <Button icon={<PrinterOutlined/>} onClick={() => window.print()} style={{ borderRadius:10 }}>Print</Button>
          <span style={{ color:'#6B7280', fontSize:13 }}>
            💡 In print dialog → change <strong>Destination</strong> to <strong>"Save as PDF"</strong>
          </span>
        </div>
      </div>

      {/* Report */}
      <div ref={reportRef} className="rp">

        {/* Header */}
        <div className="rp-header">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:26, fontWeight:800, color:'#fff' }}>DrainZero</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.75)', marginTop:4 }}>
                Tax Optimization Report · FY 2025–26 · AY 2026–27
              </div>
            </div>
            <div style={{ textAlign:'right', fontSize:12, color:'rgba(255,255,255,0.7)' }}>
              <div>Date: {today}</div>
              {category && <div>{category} {subcategory && `→ ${subcategory}`}</div>}
            </div>
          </div>
          {userProfile && (
            <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.2)', display:'flex', gap:28, flexWrap:'wrap', fontSize:13 }}>
              <div><span style={{opacity:0.7}}>Name: </span><strong style={{color:'#fff'}}>{userProfile.name}</strong></div>
              <div><span style={{opacity:0.7}}>Email: </span><strong style={{color:'#fff'}}>{userProfile.email}</strong></div>
              {userProfile.city && <div><span style={{opacity:0.7}}>City: </span><strong style={{color:'#fff'}}>{userProfile.city}, {userProfile.state}</strong></div>}
              {userProfile.employment_type && <div><span style={{opacity:0.7}}>Employment: </span><strong style={{color:'#fff'}}>{userProfile.employment_type}</strong></div>}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="rp-grid3">
          <div className="rp-card" style={{ background:'#EFF6FF', textAlign:'center' }}>
            <div className="rp-label">Old Regime Tax</div>
            <div className="rp-val" style={{ color:'#6B7280' }}>{fmt(taxOld)}</div>
          </div>
          <div className="rp-card" style={{ background:'#F0FDF4', border:'2px solid #10B981', textAlign:'center' }}>
            <div className="rp-label">New Regime Tax</div>
            <div className="rp-val" style={{ color:'#059669' }}>{fmt(taxNew)}</div>
            {better==='New Regime' && <span className="rp-badge-green">✓ Recommended</span>}
          </div>
          <div className="rp-card" style={{ background:'#08457E', textAlign:'center' }}>
            <div className="rp-label" style={{ color:'#CCF1FF' }}>You Save</div>
            <div className="rp-val" style={{ color:'#fff' }}>{fmt(saving)}</div>
            <div style={{ fontSize:11, color:'#CCF1FF', marginTop:4 }}>choosing {better}</div>
          </div>
        </div>

        {/* Income */}
        <div className="rp-section">
          <div className="rp-title">📊 Income Profile</div>
          <table className="rp-table">
            <tbody>
              {[['Annual Salary',fmt(salary)],['Bonus',fmt(bonus)],['Other Income',fmt(otherIncome)],['Total Gross',fmt(gross)]].map(([l,v],i)=>(
                <tr key={i} className={i===3?'rp-total':'rp-row'}><td>{l}</td><td style={{textAlign:'right'}}>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Regime Comparison */}
        <div className="rp-section">
          <div className="rp-title">⚖️ Old vs New Regime</div>
          <table className="rp-table">
            <thead>
              <tr style={{background:'#F8F9FA'}}>
                <th style={{textAlign:'left',padding:'8px 12px',color:'#6B7280'}}>Component</th>
                <th style={{textAlign:'right',padding:'8px 12px',color:'#6B7280'}}>Old Regime</th>
                <th style={{textAlign:'right',padding:'8px 12px',color:'#059669'}}>New Regime</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Gross Income',fmt(gross),fmt(gross)],
                ['Standard Deduction',fmt(stdOld),fmt(stdNew)],
                ['80C',fmt(d80C),'—'],
                ['80D Health',fmt(d80D),'—'],
                ['NPS 80CCD(1B)',fmt(dNPS),'—'],
                ['HRA',fmt(dHRA),'—'],
                ['Total Deductions',fmt(stdOld+d80C+d80D+dNPS+dHRA),fmt(stdNew)],
                ['Taxable Income',fmt(taxableOld),fmt(taxableNew)],
                ['Tax + 4% Cess',fmt(taxOld),fmt(taxNew)],
              ].map(([l,o,n],i)=>(
                <tr key={i} className={l.includes('Tax +') ? 'rp-total' : 'rp-row'}>
                  <td>{l}</td>
                  <td style={{textAlign:'right',color:'#6B7280'}}>{o}</td>
                  <td style={{textAlign:'right',color:'#059669'}}>{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="rp-reco">✅ Switch to <strong>{better}</strong> — saves <strong>{fmt(saving)}</strong> annually</div>
        </div>

        {/* Health Score */}
        <div className="rp-section">
          <div className="rp-title">💯 Tax Health Score</div>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ width:72,height:72,borderRadius:'50%',background:health>=80?'#F0FDF4':health>=50?'#FFF7ED':'#FEF2F2',border:`4px solid ${health>=80?'#10B981':health>=50?'#F59E0B':'#EF4444'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <span style={{ fontSize:20,fontWeight:800,color:health>=80?'#10B981':health>=50?'#F59E0B':'#EF4444' }}>{health}</span>
            </div>
            <div>
              <div style={{ fontSize:16,fontWeight:700,color:'#08457E' }}>{health>=80?'Well Optimized':health>=50?'Moderate':'Needs Improvement'} ({health}/100)</div>
              {leakage>0 && <div style={{ color:'#EF4444',fontSize:13,marginTop:4 }}>⚠️ Tax leakage detected: <strong>{fmt(leakage)}</strong></div>}
            </div>
          </div>
        </div>

        {/* Gaps */}
        {gaps.length > 0 && (
          <div className="rp-section">
            <div className="rp-title">🔍 Missed Deductions & Gaps</div>
            {gaps.map((g,i)=>(
              <div key={i} className="rp-row" style={{ display:'flex',justifyContent:'space-between',padding:'10px 0',gap:16,flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontWeight:600,fontSize:13 }}>{g.label||g.section}</div>
                  <div style={{ color:'#6B7280',fontSize:12 }}>{g.description||'Claim this deduction'}</div>
                </div>
                <div style={{ color:'#EF4444',fontWeight:700 }}>Save {fmt(g.taxSaved)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Deductions */}
        <div className="rp-section">
          <div className="rp-title">📋 Deductions Status</div>
          <div className="rp-grid2">
            {[
              ['Section 80C',fmt(d80C),'₹1,50,000',d80C>=150000],
              ['Section 80D',fmt(d80D),'₹25,000',d80D>=25000],
              ['NPS 80CCD(1B)',fmt(dNPS),'₹50,000',dNPS>=50000],
              ['HRA Exemption',fmt(dHRA),'As applicable',dHRA>0],
            ].map(([l,v,max,done],i)=>(
              <div key={i} style={{ background:'#F8F9FA',borderRadius:8,padding:'12px 16px' }}>
                <div style={{ fontSize:11,color:'#6B7280' }}>{l}</div>
                <div style={{ fontSize:18,fontWeight:700,color:done?'#059669':'#EF4444',margin:'4px 0' }}>{v}</div>
                <div style={{ fontSize:11,color:'#9CA3AF' }}>Max: {max} {done?'✓':''}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="rp-section">
          <div className="rp-title">🎯 Recommendations</div>
          {[
            d80C<150000 && `Invest ₹${(150000-d80C).toLocaleString('en-IN')} more in 80C (PPF/ELSS/LIC)`,
            dNPS<50000  && `Add ₹${(50000-dNPS).toLocaleString('en-IN')} to NPS for 80CCD(1B) benefit`,
            d80D<25000  && 'Get health insurance — claim up to ₹25,000 under Section 80D',
            saving>0    && `Switch to ${better} — saves ${fmt(saving)}/year`,
            salary>700000 && 'Harvest LTCG up to ₹1.25L annually — completely tax-free',
          ].filter(Boolean).map((r,i)=>(
            <div key={i} style={{ display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid #F3F4F6',fontSize:13 }}>
              <span style={{ color:'#10B981',fontWeight:700 }}>✓</span>
              <span style={{ color:'#374151' }}>{r}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center',padding:'20px 0',borderTop:'2px solid #E5E7EB',marginTop:8 }}>
          <div style={{ fontSize:15,fontWeight:700,color:'#08457E' }}>DrainZero — Personal Fiscal Optimization Engine</div>
          <div style={{ fontSize:11,color:'#9CA3AF',marginTop:6 }}>
            Informational purposes only. Consult a CA for professional advice. · FY 2025–26 / AY 2026–27 · {today}
          </div>
        </div>
      </div>

      <style>{`
        .rp { font-family:'Outfit','Segoe UI',sans-serif; max-width:900px; margin:0 auto; padding:32px 40px; background:#fff; color:#1F2937; }
        .rp-header { background:#08457E; padding:28px 32px; border-radius:16px; margin-bottom:20px; }
        .rp-section { background:#fff; border:1px solid #E5E7EB; border-radius:12px; padding:20px 24px; margin-bottom:16px; }
        .rp-title { font-size:15px; font-weight:700; color:#08457E; margin-bottom:14px; }
        .rp-table { width:100%; border-collapse:collapse; font-size:13px; }
        .rp-row td { padding:8px 12px; border-bottom:1px solid #F3F4F6; color:#374151; }
        .rp-total td { padding:10px 12px; font-weight:700; color:#08457E; border-top:2px solid #E5E7EB; background:#F8F9FA; }
        .rp-reco { margin-top:12px; padding:12px 16px; background:#08457E; border-radius:8px; color:#fff; font-size:13px; }
        .rp-grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:20px; }
        .rp-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .rp-card { border-radius:12px; padding:20px; border:1px solid #E5E7EB; }
        .rp-label { font-size:11px; color:#6B7280; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
        .rp-val { font-size:22px; font-weight:800; }
        .rp-badge-green { display:inline-block; padding:2px 10px; border-radius:20px; font-size:11px; font-weight:600; background:#DCFCE7; color:#059669; margin-top:4px; }
        @media print {
          .no-print { display:none !important; }
          body { margin:0 !important; background:white !important; }
          .rp { padding:16px !important; max-width:100% !important; }
          .rp-section { break-inside:avoid; page-break-inside:avoid; }
          .rp-grid3 { grid-template-columns:1fr 1fr 1fr !important; }
          .rp-grid2 { grid-template-columns:1fr 1fr !important; }
          @page { margin:12mm; size:A4; }
        }
        @media (max-width:600px) {
          .rp { padding:16px !important; }
          .rp-grid3 { grid-template-columns:1fr !important; }
          .rp-grid2 { grid-template-columns:1fr !important; }
        }
      `}</style>
    </ConfigProvider>
  );
};

export default TaxReport;
