// TODO: Remove this file when JWT auth is fully implemented.
// These are only used as fallbacks when account is null.
// Fixed UUIDs (not random) so the socket and chat screens share the same
// userId; Crypto.randomUUID() caused divergence with hardcoded fallbacks.

/** Seeder account: seeker2 (dana_s) */
export const MOCK_USER_ID = '8806c4dd-358e-4fb6-a2cd-6f03a3f0ed10';

/** Seeder account: volunteer2 (bob_v) */
export const MOCK_VOLUNTEER_ID = '29ff5fe9-c7ce-4b26-af56-d4c02da32285';
