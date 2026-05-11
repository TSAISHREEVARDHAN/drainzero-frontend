// ─────────────────────────────────────────────
//  DrainZero — Profile Service  (FIXED)
//  - Deduction limits enforced with Math.min()
//  - No static/mock values anywhere
//  - All writes go to real DB
// ─────────────────────────────────────────────

import { supabase }      from '../config/supabase';
import { analyseProfile, analyseProfileWithCategory } from '../config/api';

// Statutory caps — FY 2025-26
const CAP_80C = 150000;
const CAP_80D = 25000;   // self + family (senior: 50000, handled in backend)
const CAP_NPS = 50000;   // 80CCD(1B) additional

// ── Map form fields → income_profile columns ──
export const mapFormToProfile = (formData) => {
  const annualSalary = Number(formData.annualSalary || 0);
  const bonus        = Number(formData.bonus        || 0);
  const total        = annualSalary + bonus;
  const basic        = total * 0.40;
  const hra          = total * 0.20;

  const rnd = v => Math.round(Number(v) || 0);
  return {
    gross_salary            : rnd(total),
    basic_da                : rnd(formData.basicSalary  || basic),
    hra_received            : rnd(formData.hraReceived  || hra),
    bonus                   : rnd(bonus),
    other_income            : rnd(formData.otherIncome  || 0),
    fd_interest             : rnd(formData.fdInterest   || 0),
    section_80c             : Math.min(rnd(formData.deduction80C        || 0), CAP_80C),
    section_80d             : Math.min(rnd(formData.deduction80D        || 0), CAP_80D),
    section_80d_parents     : Math.min(rnd(formData.deduction80DParents || 0), 50000),
    nps_personal            : Math.min(rnd(formData.deductionNPS        || 0), CAP_NPS),
    employer_nps            : rnd(formData.employerNPS            || 0),
    education_loan_interest : rnd(formData.educationLoanInterest  || 0),
    donations_80g           : rnd(formData.donations80G           || 0),
    hra_deduction           : rnd(formData.hraDeduction           || 0),
    rent_paid               : rnd(formData.rentPaid || formData.rent_paid || 0),
    home_loan_interest      : rnd(formData.loanInterestPaid || formData.homeLoanInterest || 0),
    dividend_income         : rnd(formData.dividendIncome   || 0),
    preferred_regime        : formData.regimePreference || 'Auto Suggest',
    is_metro                : !!formData.is_metro,
    updated_at              : new Date().toISOString(),
  };
};

// ── Map income_profile row → form fields ──
export const mapProfileToForm = (profile) => {
  if (!profile) return {};
  return {
    annualSalary     : Math.max((profile.gross_salary || 0) - (profile.bonus || 0), 0),
    bonus            : profile.bonus               || 0,
    otherIncome      : profile.other_income        || 0,
    deduction80C     : profile.section_80c         || 0,
    deduction80D     : profile.section_80d         || 0,
    deductionNPS     : profile.nps_personal        || 0,
    hraDeduction     : profile.hra_deduction       || profile.hra_received || 0,
    homeLoanInterest : profile.home_loan_interest  || 0,
    regimePreference : profile.preferred_regime    || 'Auto Suggest',
  };
};

// ── Save income profile via backend (service role — bypasses RLS) ──
export const saveIncomeProfile = async (userId, profileData) => {
  if (!userId) throw new Error('userId required');
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const res = await fetch(`${BACKEND_URL}/api/profile/save-income`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ userId, incomePayload: profileData }),
  });
  const data = await res.json();
  if (data?.error) throw new Error(`Failed to save income profile: ${data.error}`);
};

// ── Full flow: save → backend analyse (uses real DB data) ──
export const runFullAnalysis = async (userId, email, formData, category, subcategory, ownership) => {
  if (!userId) throw new Error('Not authenticated');
  const profile = mapFormToProfile(formData);
  await saveIncomeProfile(userId, profile);
  // Pass category-specific form data so backend can compute crypto/F&O/property tax correctly
  const result = await analyseProfileWithCategory(userId, category, subcategory, formData);
  return result;
};

// ── Fetch existing income profile ──
export const getExistingProfile = async (userId) => {
  if (!userId) return null;
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const res  = await fetch(`${BACKEND_URL}/api/profile/load/${userId}`);
    const data = await res.json();
    return data?.income || null;
  } catch (e) {
    console.warn('getExistingProfile:', e.message);
    return null;
  }
};

// ── Fetch last tax result ──
export const getLastTaxResult = async (userId) => {
  if (!userId) return null;
  let data = null;
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const res = await fetch(`${BACKEND_URL}/api/profile/tax-result/${userId}`);
    const json = await res.json();
    data = json?.result || null;
  } catch (e) {
    console.warn('getLastTaxResult:', e.message);
    return null;
  }
  if (!data) return null;

  // Restore full backendResult shape so all feature pages work after
  // session refresh / re-login without needing to re-run analysis
  return {
    success           : true,
    recommendedRegime : data.recommended_regime,
    saving            : data.saving   ?? Math.abs((data.old_tax||0) - (data.new_tax||0)),
    healthScore       : data.health_score,
    totalLeakage      : data.total_leakage,
    leakageGaps       : data.leakage_gaps   || [],
    advanceTax        : data.advance_tax    || {},
    capitalGains      : data.capital_gains  || {},
    category          : data.category       || '',
    subcategory       : data.subcategory    || '',
    validation        : data.validation     || {},
    oldRegime: {
      totalTax      : data.old_tax,
      taxableIncome : data.old_taxable || 0,
      regime        : 'old',
    },
    newRegime: {
      totalTax      : data.new_tax,
      taxableIncome : data.new_taxable || 0,
      regime        : 'new',
    },
  };
};
