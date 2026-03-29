// ─────────────────────────────────────────────
//  DrainZero — Profile Service
//  FIXED: mapFormToProfile only sends columns that
//  actually exist in the income_profile schema.
//  Removed: vehicle_*, stock_*, health_*, property_*,
//  category, subcategory, ownership_type, updated_at
// ─────────────────────────────────────────────

import { supabase } from '../config/supabase';
import { analyseProfile } from '../config/api';

// ── Map form fields → Supabase income_profile columns (schema-safe) ──
export const mapFormToProfile = (formData) => {
  const annualSalary = Number(formData.annualSalary || 0);
  const bonus        = Number(formData.bonus || 0);
  const total        = annualSalary + bonus;
  const basic        = total * 0.40;
  const hra          = total * 0.20;

  // Keep writes schema-safe. Do not send columns that may not exist in every DB.
  return {
    gross_salary            : total,
    basic_da                : Number(formData.basicSalary || basic),
    hra_received            : Number(formData.hraReceived || hra),
    bonus                   : bonus,
    other_income            : Number(formData.otherIncome || 0),
    fd_interest             : Number(formData.fdInterest || 0),
    section_80c             : Number(formData.deduction80C || 0),
    section_80d             : Number(formData.deduction80D || 0),
    section_80d_parents     : Number(formData.deduction80DParents || 0),
    nps_personal            : Number(formData.deductionNPS || 0),
    employer_nps            : Number(formData.employerNPS || 0),
    education_loan_interest : Number(formData.educationLoanInterest || 0),
    donations_80g           : Number(formData.donations80G || 0),
    hra_deduction           : Number(formData.hraDeduction || 0),
    rent_paid               : formData.hraDeduction ? Number(formData.hraDeduction) + (annualSalary * 0.04) : 0,
    home_loan_interest      : Number(formData.loanInterestPaid || formData.homeLoanInterest || 0),
    dividend_income         : Number(formData.dividendIncome || 0),
    preferred_regime        : formData.regimePreference || 'Auto Suggest',
    is_metro                : !!formData.is_metro,
  };
};

// ── Map Supabase income_profile → form fields (for pre-filling) ──
export const mapProfileToForm = (profile) => {
  if (!profile) return {};
  return {
    annualSalary      : Math.max((profile.gross_salary || 0) - (profile.bonus || 0), 0),
    bonus             : profile.bonus                || 0,
    otherIncome       : profile.other_income         || 0,
    deduction80C      : profile.section_80c          || 0,
    deduction80D      : profile.section_80d          || 0,
    deductionNPS      : profile.nps_personal         || 0,
    hraDeduction      : profile.hra_deduction        || profile.hra_received || 0,
    homeLoanInterest  : profile.home_loan_interest   || 0,
    regimePreference  : profile.preferred_regime     || 'Auto Suggest',
  };
};

// ── Save income profile to Supabase ──
export const saveIncomeProfile = async (userId, profileData) => {
  const { error } = await supabase
    .from('income_profile')
    .upsert({ user_id: userId, ...profileData }, { onConflict: 'user_id' });
  if (error) throw new Error(`Failed to save profile: ${error.message}`);
};

// ── Full flow: save profile → call backend analyse ──
export const runFullAnalysis = async (userId, email, formData, category, subcategory, ownership) => {
  // Save only schema-valid income/deduction columns
  const profile = mapFormToProfile(formData);
  await saveIncomeProfile(userId, profile);

  // Now call backend — it can find the user's income_profile
  const result = await analyseProfile(userId);
  return result;
};

// ── Get existing income profile from Supabase ──
export const getExistingProfile = async (userId) => {
  const { data, error } = await supabase
    .from('income_profile')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  return data;
};

// ── Get last tax result from Supabase ──
export const getLastTaxResult = async (userId) => {
  const { data, error } = await supabase
    .from('tax_results')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  return data;
};
