import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { queryKeys } from '@/api/keys';
import type { VolunteerProfile } from '@/api/schemas';

// =============================================================================
// TESTING MODE FLAG — PATCH /volunteer/status
// Set USE_MOCK = true  → fake response, no backend needed
// Set USE_MOCK = false → real API (needs backend running + EXPO_PUBLIC_API_URL)
// =============================================================================
const USE_MOCK = true;

// Change to true to simulate the toggle failing (tests rollback behaviour)
const SIMULATE_STATUS_ERROR = false;
