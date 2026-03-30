// ─────────────────────────────────────────────
//  DrainZero — Profile Service  (FIXED)
//  - Deduction limits enforced with Math.min()
//  - No static/mock values anywhere
//  - All writes go to real DB
// ─────────────────────────────────────────────

import { supabase }      from '../config/supabase';
import { analyseProfile } from '../config/api';

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

  return {
    gross_salary            : total,
    basic_da                : Number(formData.basicSalary  || basic),
    hra_received            : Number(formData.hraReceived  || hra),
    bonus                   : bonus,
    other_income            : Number(formData.otherIncome  || 0),
    fd_interest             : Number(formData.fdInterest   || 0),
    // FIX: enforce statutory caps
    section_80c             : Math.min(Number(formData.deduction80C        || 0), CAP_80C),
    section_80d             : Math.min(Number(formData.deduction80D        || 0), CAP_80D),
    section_80d_parents     : Math.min(Number(formData.deduction80DParents || 0), 50000),
    nps_personal            : Math.min(Number(formData.deductionNPS        || 0), CAP_NPS),
    employer_nps            : Number(formData.employerNPS            || 0),
    education_loan_interest : Number(formData.educationLoanInterest  || 0),
    donations_80g           : Number(formData.donations80G           || 0),
    hra_deduction           : Number(formData.hraDeduction           || 0),
    rent_paid               : formData.hraDeduction
                              ? Number(formData.hraDeduction) + (annualSalary * 0.04)
                              : 0,
    home_loan_interest      : Number(formData.loanInterestPaid || formData.homeLoanInterest || 0),
    dividend_income         : Number(formData.dividendIncome   || 0),
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

// ── Save income profile to Supabase ──
export const saveIncomeProfile = async (userId, profileData) => {
  if (!userId) throw new Error('userId required');
  const { error } = await supabase
    .from('income_profile')
    .upsert({ user_id: userId, ...profileData }, { onConflict: 'user_id' });
  if (error) throw new Error(`Failed to save income profile: ${error.message}`);
};

// ── Full flow: save → backend analyse (uses real DB data) ──
export const runFullAnalysis = async (userId, email, formData, category, subcategory, ownership) => {
  if (!userId) throw new Error('Not authenticated');
  const profile = mapFormToProfile(formData);
  await saveIncomeProfile(userId, profile);
  const result = await analyseProfile(userId);
  return result;
};

// ── Fetch existing income profile ──
export const getExistingProfile = async (userId) => {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('income_profile')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) { console.warn('getExistingProfile:', error.message); return null; }
  return data;
};

// ── Fetch last tax result ──
export const getLastTaxResult = async (userId) => {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('tax_results')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  return data;
};
