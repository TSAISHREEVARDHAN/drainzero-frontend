// ─────────────────────────────────────────────
//  DrainZero — Profile Service
// ─────────────────────────────────────────────

import { supabase } from '../config/supabase';
import { analyseProfile } from '../config/api';

// ── Map form fields → Supabase income_profile columns ──
export const mapFormToProfile = (formData, category, subcategory, ownership) => {
  const salary = formData.annualSalary || 0;
  const basic  = salary * 0.40;
  const hra    = salary * 0.20;

  return {
    gross_salary          : salary,
    basic_da              : formData.basicSalary || basic,
    hra_received          : hra,
    bonus                 : formData.bonus              || 0,
    other_income          : formData.otherIncome        || 0,
    fd_interest           : 0,
    section_80c           : formData.deduction80C       || 0,
    section_80d           : formData.deduction80D       || 0,
    section_80d_parents   : 0,
    nps_personal          : formData.deductionNPS       || 0,
    education_loan_interest: 0,
    donations_80g         : 0,
    hra_deduction         : formData.hraDeduction       || 0,
    rent_paid             : formData.hraDeduction
                            ? formData.hraDeduction + (salary * 0.04)
                            : 0,
    home_loan_interest    : formData.loanInterestPaid   || 0,
    professional_tax      : formData.professionalTax    || 2500,
    preferred_regime      : formData.regimePreference === 'Auto Suggest' ? 'new' : (formData.regimePreference || 'new'),
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

// ── Map Supabase income_profile → form fields (for pre-filling) ──
export const mapProfileToForm = (profile) => {
  if (!profile) return {};
  return {
    annualSalary      : profile.gross_salary          || 0,
    bonus             : profile.bonus                 || 0,
    otherIncome       : profile.other_income          || 0,
    deduction80C      : profile.section_80c           || 0,
    deduction80D      : profile.section_80d           || 0,
    deductionNPS      : profile.nps_personal          || 0,
    hraDeduction      : profile.hra_deduction         || profile.hra_received || 0,
    professionalTax   : profile.professional_tax      || 2500,
    regimePreference  : profile.preferred_regime      || 'Auto Suggest',
    // Vehicle
    purchasePrice     : profile.vehicle_purchase_price || 0,
    fuelType          : profile.vehicle_fuel_type      || 'Petrol',
    usageType         : profile.vehicle_usage_type     || 'Personal',
    hasLoan           : profile.vehicle_has_loan ? 'yes' : 'no',
    isEmployerProvided: profile.vehicle_is_employer_provided ? 'yes' : 'no',
    loanInterestPaid  : profile.home_loan_interest     || 0,
    // Health
    premiumAmount     : profile.health_premium         || 0,
    // Property
    propertyPurchasePrice: profile.property_purchase_price || 0,
    propertyStatus    : profile.property_status        || null,
    rentalIncome      : profile.rental_income          || 0,
    municipalTaxes    : profile.municipal_taxes        || 0,
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
  const profile = mapFormToProfile(formData, category, subcategory, ownership);
  await saveIncomeProfile(userId, profile);
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
