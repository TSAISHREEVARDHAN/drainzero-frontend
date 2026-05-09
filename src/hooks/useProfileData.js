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
        // Sequential (not concurrent) to avoid Supabase auth lock contention.
        // Promise.all fires both simultaneously and competes with AuthContext
        // for the auth token lock → "lock was released because another request stole it"
        const profile   = await getExistingProfile(user.id);
        const taxResult = await getLastTaxResult(user.id);

        if (profile) {
          const mapped = mapProfileToForm(profile);
          setFormData(mapped);
          // Use saved category from profile if available
          if (profile.category)     setCategory(profile.category);
          if (profile.subcategory)  setSubcategory(profile.subcategory);
          if (profile.ownership_type) setOwnership(profile.ownership_type);
        }

        if (taxResult) {
          // getLastTaxResult already returns the full backendResult shape —
          // just pass it through directly. Don't reconstruct a partial shape
          // or feature pages will get undefined for saving, advanceTax, etc.
          setBackendResult(taxResult);
        }
      } catch (e) {
        console.warn('useProfileData load error:', e.message);
      } finally {
        setDataLoading(false);
      }
    };

    load();
  }, [user]);

  return { formData, backendResult, dataLoading, category, subcategory, ownership };
};

export default useProfileData;
