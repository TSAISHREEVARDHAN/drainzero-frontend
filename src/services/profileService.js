// ─────────────────────────────────────────────
//  DrainZero — Profile Service
//  Maps frontend form → Supabase schema
//  Saves profile + calls backend analyse
// ─────────────────────────────────────────────

import { supabase } from '../config/supabase';
import { analyseProfile } from '../config/api';

// ── Map form fields → Supabase income_profile columns ──
export const mapFormToProfile = (formData, category, subcategory, ownership) => {
  const salary    = formData.annualSalary     || 0;
  const basic     = salary * 0.40;  // standard 40% basic
  const hra       = salary * 0.20;  // standard 20% HRA

  return {
    gross_salary          : salary,
    basic_da              : formData.basicSalary || basic,
    hra_received          : hra,
    bonus                 : formData.bonus             || 0,
    other_income          : formData.otherIncome        || 0,
    fd_interest           : 0,
    section_80c           : formData.deduction80C       || 0,
    section_80d           : formData.deduction80D        || 0,
    section_80d_parents   : 0,
    nps_personal          : formData.deductionNPS        || 0,
    education_loan_interest: 0,
    donations_80g         : 0,
    rent_paid             : formData.hraDeduction
                            ? formData.hraDeduction + (salary * 0.04)
                            : 0,
    home_loan_interest    : formData.loanInterestPaid   || 0,
    professional_tax      : formData.professionalTax    || 2500,
    preferred_regime      : formData.regimePreference   || 'Auto Suggest',
    category              : category    || 'General',
    subcategory           : subcategory || '',
    ownership_type        : ownership   || '',
    // Vehicle
    vehicle_purchase_price       : formData.purchasePrice       || 0,
    vehicle_fuel_type            : formData.fuelType            || '',
    vehicle_usage_type           : formData.usageType           || '',
    vehicle_has_loan             : formData.hasLoan === 'yes',
    vehicle_is_employer_provided : formData.isEmployerProvided === 'yes',
    vehicle_ev_loan_interest     : formData.fuelType === 'Electric'
                                   ? (formData.loanInterestPaid || 0) : 0,
    // Stocks
    stock_asset_type      : formData.assetType          || subcategory || '',
    stock_purchase_amount : formData.purchaseAmount     || 0,
    stock_selling_amount  : formData.sellingAmount      || 0,
    stock_purchase_date   : formData.purchaseDate       || null,
    stock_selling_date    : formData.sellingDate        || null,
    // Health
    health_premium        : formData.premiumAmount      || 0,
    health_coverage_type  : formData.coverageType       || subcategory || '',
    // Property
    property_purchase_price: formData.propertyPurchasePrice || 0,
    property_status        : formData.propertyStatus    || '',
    rental_income          : formData.rentalIncome      || 0,
    municipal_taxes        : formData.municipalTaxes    || 0,
    property_selling_price : formData.sellingPrice      || 0,
    updated_at             : new Date().toISOString(),
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
  // Map + save income profile
  const profile = mapFormToProfile(formData, category, subcategory, ownership);
  await saveIncomeProfile(userId, profile);

  // Call backend
  const result = await analyseProfile(userId);
  return result;
};

// ── Get existing income profile from Supabase (for returning users) ──
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
