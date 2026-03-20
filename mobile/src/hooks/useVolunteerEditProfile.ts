import { useState } from 'react';
import { useUpdateVolunteerProfile } from '@/hooks/useVolunteerProfile';
import { useSpecialisations } from '@/hooks/useLookup';

// =============================================================================
// ENDPOINT: PATCH /volunteer/profile
// SCREEN:   src/app/volunteer/EditProfile/index.tsx  (not built yet)
// PURPOSE:  Combines form state + submit logic for the edit profile screen
//
// CONTAINS:
//   - tagline text field state
//   - about text field state
//   - selected specialisation IDs state
//   - useSpecialisations() to load the picker options
//   - useUpdateVolunteerProfile() mutation to save changes
// =============================================================================

export function useVolunteerEditProfile(
  initialTagline: string | null,
  initialAbout: string | null,
  initialSpecialisationIds: string[],
) {
  // ── Local form state ────────────────────────────────────────────────────────
  const [tagline, setTagline] = useState(initialTagline ?? '');
  const [about, setAbout] = useState(initialAbout ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialSpecialisationIds,
  );

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

  // Call this when the save button is pressed on the screen
  const handleSave = (options: {
    onSuccess?: () => void;
    onError?: (err: any) => void;
  }) => {
    updateProfile(
      {
        tagline: tagline.trim() || undefined,
        about: about.trim() || undefined,
        specialisationIds: selectedIds,
      },
      {
        onSuccess: () => {
          console.log('Profile updated successfully');
          options.onSuccess?.();
        },
        onError: (err: any) => {
          console.error('Failed to update profile:', err?.message);
          options.onError?.(err);
        },
      },
    );
  };

  return {
    // Form state
    tagline,
    setTagline,
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
  };
}
