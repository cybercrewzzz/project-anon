import { useState, useEffect } from 'react';
import { useUpdateVolunteerProfile } from '@/hooks/useVolunteerProfile';
import { useSpecialisations } from '@/hooks/useLookup';

// =============================================================================
// ENDPOINT: PATCH /volunteer/profile
// SCREEN:   src/app/volunteer/EditProfile/index.tsx  (not built yet)
// PURPOSE:  Combines form state + submit logic for the edit profile screen
//
// CONTAINS:
//   - about text field state
//   - selected specialisation IDs state
//   - useSpecialisations() to load the picker options
//   - useUpdateVolunteerProfile() mutation to save changes
// =============================================================================

export function useVolunteerEditProfile(
  initialAbout: string | null,
  initialSpecialisationIds: string[],
) {
  // ── Local form state ────────────────────────────────────────────────────────
  const [about, setAbout] = useState(initialAbout ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialSpecialisationIds,
  );

  // ── Sync form state when initial values change ──────────────────────────────
  // This ensures the form populates when profile data loads after mount
  useEffect(() => {
    if (initialAbout !== null) {
      setAbout(initialAbout);
    }
  }, [initialAbout]);

  useEffect(() => {
    setSelectedIds(initialSpecialisationIds);
  }, [initialSpecialisationIds]);

  // ── GET /lookup/specialisations ─────────────────────────────────────────────
  // Loads the list of available specialisations for the picker
  const { data: specialisations, isLoading: isLoadingSpecialisations } =
    useSpecialisations();

  // ── PATCH /volunteer/profile ────────────────────────────────────────────────
  const { mutate: updateProfile, isPending: isSaving } =
    useUpdateVolunteerProfile();

  // Toggle a specialisation on or off in the selected list
  const toggleSpecialisation = (specialisationId: string) => {
    setSelectedIds(prev =>
      prev.includes(specialisationId) ?
        prev.filter(id => id !== specialisationId)
      : [...prev, specialisationId],
    );
  };

  // ── Dirty-check: true only when something actually changed ─────────────────
  const aboutChanged = about.trim() !== (initialAbout ?? '').trim();
  const sortedCurrent = [...selectedIds].sort().join(',');
  const sortedInitial = [...initialSpecialisationIds].sort().join(',');
  const specsChanged = sortedCurrent !== sortedInitial;
  const isDirty = aboutChanged || specsChanged;

  // Call this when the save button is pressed on the screen
  const handleSave = (options: {
    onSuccess?: () => void;
    onError?: (err: any) => void;
  }) => {
    // Build payload with only the fields that actually changed
    const payload: { about?: string; specialisationIds?: string[] } = {};
    if (aboutChanged) payload.about = about.trim();
    if (specsChanged && selectedIds.length > 0)
      payload.specialisationIds = selectedIds;

    updateProfile(payload, {
      onSuccess: () => {
        options.onSuccess?.();
      },
      onError: (err: any) => {
        options.onError?.(err);
      },
    });
  };

  return {
    // Form state
    about,
    setAbout,
    selectedIds,
    toggleSpecialisation,
    // Specialisation picker data
    specialisations,
    isLoadingSpecialisations,
    // Submit
    handleSave,
    isSaving,
    isDirty,
  };
}
