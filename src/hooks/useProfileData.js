// ─────────────────────────────────────────────
//  useProfileData — loads profile from Supabase
//  Used by all feature pages so they work even
//  when location.state is missing (direct nav / refresh)
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getExistingProfile, getLastTaxResult, mapProfileToForm } from '../services/profileService';

const useProfileData = () => {
  const { user } = useAuth();
  const location = useLocation();

  const stateData      = location.state?.formData;
  const stateBackend   = location.state?.backendResult;
  const stateCategory  = location.state?.category    || 'General';
  const stateSubcat    = location.state?.subcategory || '';
  const stateOwnership = location.state?.ownership   || '';

  const [formData,      setFormData]      = useState(stateData   || null);
  const [backendResult, setBackendResult] = useState(stateBackend || null);
  const [dataLoading,   setDataLoading]   = useState(!stateData);
  const [category,      setCategory]      = useState(stateCategory);
  const [subcategory,   setSubcategory]   = useState(stateSubcat);
  const [ownership,     setOwnership]     = useState(stateOwnership);

  useEffect(() => {
    // Already have data from navigation state — no need to fetch
    if (stateData) {
      setDataLoading(false);
      return;
    }

    const load = async () => {
      if (!user) { setDataLoading(false); return; }

      try {
        const [profile, taxResult] = await Promise.all([
          getExistingProfile(user.id),
          getLastTaxResult(user.id),
        ]);

        if (profile) {
          const mapped = mapProfileToForm(profile);
          setFormData(mapped);
          // Use saved category from profile if available
          if (profile.category)     setCategory(profile.category);
          if (profile.subcategory)  setSubcategory(profile.subcategory);
          if (profile.ownership_type) setOwnership(profile.ownership_type);
        }

        if (taxResult) {
          setBackendResult({
            success          : true,
            oldRegime        : { totalTax: taxResult.old_tax   || 0 },
            newRegime        : { totalTax: taxResult.new_tax   || 0 },
            recommendedRegime: taxResult.recommended_regime    || 'new',
            totalLeakage     : taxResult.total_leakage         || 0,
            healthScore      : taxResult.health_score          || null,
            leakageGaps      : taxResult.leakage_gaps          || [],
            saving           : Math.abs((taxResult.old_tax || 0) - (taxResult.new_tax || 0)),
          });
        }
      } catch (e) {
        console.warn('useProfileData load error:', e.message);
      } finally {
        setDataLoading(false);
      }
    };

    load();
  }, [user, stateData]);

  return { formData, backendResult, dataLoading, category, subcategory, ownership };
};

export default useProfileData;
