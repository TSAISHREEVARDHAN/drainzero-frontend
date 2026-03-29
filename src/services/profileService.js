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
  const salary = formData.annualSalary || 0;
  const bonus  = formData.bonus        || 0;
  const total  = salary + bonus;
  const basic  = total * 0.40;
  const hra    = total * 0.20;

  // ONLY columns that exist in the income_profile table
  return {
    gross_salary            : total,
    basic_da                : formData.basicSalary    || basic,
    hra_received            : hra,
    bonus                   : bonus,
    other_income            : formData.otherIncome    || 0,
    fd_interest             : 0,
    section_80c             : formData.deduction80C   || 0,
    section_80d             : formData.deduction80D   || 0,
    section_80d_parents     : 0,
    nps_personal            : formData.deductionNPS   || 0,
    employer_nps            : 0,
    education_loan_interest : 0,
    donations_80g           : 0,
    hra_deduction           : formData.hraDeduction   || 0,
    rent_paid               : formData.hraDeduction
                              ? formData.hraDeduction + (salary * 0.04) : 0,
    home_loan_interest      : formData.loanInterestPaid || formData.homeLoanInterest || 0,
    professional_tax        : formData.professionalTax || 2500,
    dividend_income         : 0,
    preferred_regime        : formData.regimePreference || 'Auto Suggest',
    is_metro                : formData.is_metro        || false,
  };
};

// ── Map Supabase income_profile → form fields (for pre-filling) ──
export const mapProfileToForm = (profile) => {
  if (!profile) return {};
  return {
    annualSalary      : profile.gross_salary         || 0,
    bonus             : profile.bonus                || 0,
    otherIncome       : profile.other_income         || 0,
    deduction80C      : profile.section_80c          || 0,
    deduction80D      : profile.section_80d          || 0,
    deductionNPS      : profile.nps_personal         || 0,
    hraDeduction      : profile.hra_deduction        || profile.hra_received || 0,
    homeLoanInterest  : profile.home_loan_interest   || 0,
    professionalTax   : profile.professional_tax     || 2500,
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
    .single();
  if (error) return null;
  return data;
};

// ── Get last tax result from Supabase ──
export const getLastTaxResult = async (userId) => {
  const { data, error } = await supabase
    .from('tax_results')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
};
