# Mobile App

Expo (React Native) mobile client built with file-based routing, TanStack Query for server state, and Zustand for client state.

## Quick Start

```bash
cd mobile
yarn install
yarn start          # Start Expo dev server
yarn android        # Start on Android
yarn ios            # Start on iOS
```

### Environment

Copy `.env` and set your backend URL:

```env
EXPO_PUBLIC_ROLE=user
EXPO_PUBLIC_API_URL=http://localhost:3000/v1
```

> If you're running on a physical device or emulator, replace `localhost` with your machine's local IP (e.g. `http://192.168.1.5:3000/v1`).

---

## Project Structure

```
src/
├── api/                  # API client layer (explained below)
│   ├── client.ts         # Axios instance + interceptors
│   ├── errors.ts         # ApiError class + parseApiError()
│   ├── keys.ts           # TanStack Query key factory
│   ├── queryClient.ts    # TanStack Query client singleton
│   ├── tokenStorage.ts   # expo-secure-store token persistence
│   ├── types.ts          # Shared TS types (Account, AuthResponse, etc.)
│   └── schemas/          # Zod schemas for response validation
├── app/                  # Expo Router file-based routing
│   ├── _layout.tsx       # Root layout (QueryClientProvider, auth hydration)
│   ├── user/             # User (seeker) screens
│   └── volunteer/        # Volunteer screens
├── components/           # Shared UI components
├── store/                # Zustand stores
│   ├── useAuth.ts        # Auth state (tokens, account, signIn, signOut)
│   └── useRole.ts        # Role state (user vs volunteer)
└── theme/                # react-native-unistyles theming
```

### Folder convention as the app grows

```
src/api/
├── client.ts             # Axios instance (exists)
├── errors.ts             # ApiError class (exists)
├── keys.ts               # Query key factory (exists)
├── queryClient.ts        # QueryClient singleton (exists)
├── tokenStorage.ts       # Token persistence (exists)
├── types.ts              # Shared types (exists)
├── auth.ts               # Auth API functions (create per-domain files as needed)
├── user.ts               # User API functions
├── volunteer.ts          # Volunteer API functions
├── session.ts            # Session API functions
└── schemas/              # Zod schemas for response validation (exists)
    ├── index.ts          # Barrel export
    ├── common.ts         # Shared primitives (Category, Language, etc.)
    ├── auth.ts           # Auth response schemas
    ├── user.ts           # User profile & session schemas
    ├── volunteer.ts      # Volunteer profile schemas
    └── session.ts        # Session connect/detail schemas
```

---

## API Integration Guide

Everything you need is already wired up in `src/api/`. You don't need to configure axios, handle tokens, or set up React Query — it's all done. Here's how to use it.

### How It Works (The Short Version)

1. **`apiClient`** (`src/api/client.ts`) — A pre-configured Axios instance that:
   - Points to the backend URL from your `.env`
   - Auto-attaches the `Authorization: Bearer <token>` header on every request
   - Auto-refreshes expired tokens (401 handling with a queue) — you don't need to think about this

2. **`queryClient`** (`src/api/queryClient.ts`) — A TanStack Query client that:
   - Retries failed requests up to 2 times (but NOT for 401/403/404)
   - Caches data for 5 minutes (`staleTime`) before considering it stale
   - Garbage-collects unused cache after 10 minutes (`gcTime`)
   - Never retries mutations
   - Is already wrapped in `<QueryClientProvider>` at the root layout

3. **`useAuth`** (`src/store/useAuth.ts`) — A Zustand store that manages the full auth lifecycle:
   - `signIn(accessToken, refreshToken, account)` — persist tokens + set state (call after login/register)
   - `signOut()` — clear storage + reset state (call on logout)
   - `hydrate()` — read tokens from SecureStore on app start (called in root layout)

### Step-by-Step: Adding a New API Call

#### 1. Define a Zod schema for the response

We have [Zod](https://zod.dev/) (`v4`) installed and schemas are already defined in `src/api/schemas/`. Use them to validate API responses at runtime — this catches backend changes before they cause weird UI bugs.

The existing schemas cover all backend endpoints. Here's what `src/api/schemas/user.ts` looks like:

```ts
// src/api/schemas/user.ts (already exists — don't recreate)
import { z } from 'zod';

export const UserProfileSchema = z.object({
  accountId: z.string().uuid(),
  email: z.string().email(),
  nickname: z.string(),
  dateOfBirth: z.string(),
  gender: z.string(),
  interfaceLanguageId: z.string().uuid().nullable(),
  languages: z.array(
    z.object({
      languageId: z.string().uuid(),
      code: z.string(),
      name: z.string(),
    }),
  ),
  roles: z.array(z.enum(['user', 'volunteer', 'admin'])),
});

// Infer the TS type from the schema — single source of truth
export type UserProfile = z.infer<typeof UserProfileSchema>;
```

> **Why Zod?** The backend can change response shapes at any time. Zod gives you a runtime check + auto-generated TypeScript type in one place. If the backend adds/removes a field, Zod will throw immediately instead of causing `undefined` errors deep in your components.

Available schemas (see `src/api/schemas/`):

| File             | Schemas                                                       |
| ---------------- | ------------------------------------------------------------- |
| `common.ts`      | `CategorySchema`, `LanguageSchema`, `SpecialisationSchema`, `BlockEntrySchema`, `TicketsRemainingSchema`, `paginatedSchema()` |
| `auth.ts`        | `AccountSchema`, `AuthResponseSchema`, `TokenPairSchema`      |
| `user.ts`        | `UserProfileSchema`, `UserSessionSchema`                      |
| `volunteer.ts`   | `VolunteerProfileSchema`, `VolunteerApplyResponseSchema`, `VolunteerStatusResponseSchema` |
| `session.ts`     | `SessionConnectMatchSchema`, `SessionConnectWaitingSchema`, `SessionAcceptSchema`, `SessionDetailSchema` |

If the backend adds a new endpoint, add the schema to the appropriate file (or create a new one) and re-export from `index.ts`.

> **Important:** These schemas reflect the **target** API response shapes based on the backend architecture docs. The actual backend response may differ as endpoints get implemented. When you're working on a feature and the real response doesn't match the schema, **update the schema in your PR** to match what the backend actually returns. The schemas are meant to evolve with the backend — treat them as living contracts, not fixed specs. Run `npx tsc --noEmit` after changes to make sure everything still compiles.

#### 2. Write the API function

Create a function that calls `apiClient` and validates the response with your Zod schema.

```ts
// src/api/user.ts
import { apiClient } from './client';
import { UserProfileSchema } from './schemas/user';
import type { UserProfile } from './schemas/user';
import type { PaginatedResponse } from './types';

export async function getUserProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get('/user/profile');
  return UserProfileSchema.parse(data);
}

export async function updateUserProfile(body: {
  gender?: string;
  interfaceLanguageId?: string;
  languageIds?: string[];
}): Promise<UserProfile> {
  const { data } = await apiClient.patch('/user/profile', body);
  return UserProfileSchema.parse(data);
}
```

> You don't need to pass auth headers. The axios interceptor in `client.ts` does it automatically.

For endpoints where you don't need validation yet, you can skip Zod and use a plain type:

```ts
// src/api/auth.ts
import { apiClient } from './client';
import type { AuthResponse } from './types';

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', {
    email,
    password,
  });
  return data;
}

export async function register(body: {
  email: string;
  password: string;
  dateOfBirth: string;
  gender?: string;
}) {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', body);
  return data;
}

export async function logout(refreshToken: string) {
  await apiClient.post('/auth/logout', { refreshToken });
}
```

#### 3. Use the query key factory

All query keys are defined in `src/api/keys.ts`. Always import from here — never hardcode key strings.

```ts
// src/api/keys.ts (already exists — don't recreate)
export const queryKeys = {
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    sessions: (params?) => [...queryKeys.user.all, 'sessions', params] as const,
  },
  volunteer: { ... },
  session: {
    all: ['session'] as const,
    detail: (sessionId: string) => [...queryKeys.session.all, sessionId] as const,
  },
  categories: ['categories'] as const,
  languages: ['languages'] as const,
  specialisations: ['specialisations'] as const,
  tickets: ['tickets', 'remaining'] as const,
  blocks: ['blocks'] as const,
} as const;
```

Use it everywhere instead of raw string arrays:

```ts
// Instead of: queryKey: ['user', 'profile']
queryKey: queryKeys.user.profile()

// Instead of: queryKey: ['user', 'sessions', { page: 1 }]
queryKey: queryKeys.user.sessions({ page: 1 })

// Invalidate all user-related queries at once:
queryClient.invalidateQueries({ queryKey: queryKeys.user.all })
```

#### 4. Use `useQuery` — for GET requests (fetching data)

`useQuery` fetches data, caches it, and gives you loading/error states for free.

```tsx
import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '@/api/user';
import { queryKeys } from '@/api/keys';

export default function ProfileScreen() {
  const {
    data: profile, // the response data (undefined while loading)
    isLoading, // true during first fetch
    error, // error object if request failed
    refetch, // call this to manually re-fetch
  } = useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: getUserProfile,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <Text>{profile.nickname}</Text>;
}
```

**Important things about `queryKey`:**

- It's the cache key. Same key = same cached data everywhere in the app.
- When the key changes (e.g. `page` param changes), React Query auto-refetches.
- Always use the `queryKeys` factory from `src/api/keys.ts` — never hardcode strings.

#### 5. Use `useMutation` — for POST / PATCH / DELETE requests (changing data)

`useMutation` is for actions that modify data on the server.

```tsx
import { useMutation } from '@tanstack/react-query';
import { login } from '@/api/auth';
import { useAuth } from '@/store/useAuth';
import { parseApiError } from '@/api/errors';

export default function LoginScreen() {
  const signIn = useAuth(state => state.signIn);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: data => {
      // Save tokens + account to Zustand store (also persists to SecureStore)
      signIn(data.accessToken, data.refreshToken, data.account);
    },
    onError: error => {
      const apiError = parseApiError(error);
      Alert.alert('Login failed', apiError.message);
    },
  });

  const handleLogin = () => {
    loginMutation.mutate({ email, password });
  };

  return (
    <>
      {/* ...form inputs... */}
      <Button
        title="Login"
        onPress={handleLogin}
        disabled={loginMutation.isPending}
      />
    </>
  );
}
```

#### 6. Invalidate cache after mutations

When a mutation changes server data, tell React Query to refetch related queries:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserProfile } from '@/api/user';
import { queryKeys } from '@/api/keys';

function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      // This tells React Query: "the profile data is stale, re-fetch it"
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
    },
  });
}
```

#### 7. Create reusable hooks (recommended pattern)

Wrap your queries/mutations in custom hooks. This keeps your screen components clean and makes API logic reusable.

```ts
// src/hooks/useUserProfile.ts
import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '@/api/user';
import { queryKeys } from '@/api/keys';

export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: getUserProfile,
  });
}
```

```ts
// src/hooks/useCategories.ts
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/client';
import { queryKeys } from '@/api/keys';
import { CategorySchema } from '@/api/schemas';

async function getCategories() {
  const { data } = await apiClient.get('/categories');
  return z.array(CategorySchema).parse(data);
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: getCategories,
    staleTime: Infinity, // Categories rarely change — cache forever
  });
}
```

Then your screen just does:

```tsx
export default function HomeScreen() {
  const { data: profile, isLoading } = useUserProfile();
  const { data: categories } = useCategories();
  // ...
}
```

### Paginated Data

Use the `PaginatedResponse<T>` type from `src/api/types.ts` for list endpoints.

The backend uses `?page=1&limit=20` format. Example matching `GET /user/sessions`:

```ts
// src/api/user.ts
import { apiClient } from './client';
import { paginatedSchema, UserSessionSchema } from './schemas';

export async function getUserSessions(page = 1, limit = 20) {
  const { data } = await apiClient.get('/user/sessions', {
    params: { page, limit },
  });
  return paginatedSchema(UserSessionSchema).parse(data);
}
```

```tsx
// In your screen
import { queryKeys } from '@/api/keys';

const { data } = useQuery({
  queryKey: queryKeys.user.sessions({ page }),
  queryFn: () => getUserSessions(page),
});

// data.data     → Session[]
// data.total    → total count
// data.page     → current page
// data.limit    → page size
```

### Error Handling

Use `parseApiError()` from `src/api/errors.ts` to normalize any error into a clean `ApiError` object:

```tsx
import { parseApiError } from '@/api/errors';

onError: error => {
  const apiError = parseApiError(error);
  // apiError.statusCode → 400, 401, 409, etc.
  // apiError.message    → "Email already taken", "Invalid credentials", etc.
  Alert.alert('Error', apiError.message);
};
```

What `parseApiError` handles:
- **Backend error** (e.g. `{ statusCode: 409, message: "Email already taken" }`) → extracts fields
- **Network error** (no internet, timeout) → returns `statusCode: 0` with a friendly message
- **Already an `ApiError`** → returns as-is
- **Anything else** → generic `statusCode: 500`

### Complete Auth Flow Reference

This matches the backend endpoints from [README_API_ENDPOINTS.md](../backend/README_API_ENDPOINTS.md):

| Action   | Backend Endpoint     | What to do on mobile                                              |
| -------- | -------------------- | ----------------------------------------------------------------- |
| Register | `POST /auth/register`| Call API → `useAuth.signIn(accessToken, refreshToken, account)`   |
| Login    | `POST /auth/login`   | Call API → `useAuth.signIn(accessToken, refreshToken, account)`   |
| Logout   | `POST /auth/logout`  | Call API with `{ refreshToken }` → `useAuth.signOut()`            |
| Refresh  | `POST /auth/refresh` | **Automatic** — the axios interceptor handles this on 401         |

### Shared Types

Available in `src/api/types.ts`:

| Type                   | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `Account`              | Account object (id, email, nickname, name?, roles) |
| `AuthResponse`         | Login/register response (tokens + account)        |
| `TokenPair`            | Access + refresh token pair                       |
| `PaginatedResponse<T>` | Paginated list wrapper (data, total, page, limit) |
| `ApiErrorResponse`     | Backend error envelope shape                      |
| `AccountRole`          | `'user' \| 'volunteer' \| 'admin'`                |

---

## Key Libraries

| Library            | Purpose                          | Where it's used                  |
| ------------------ | -------------------------------- | -------------------------------- |
| `@tanstack/react-query` | Server state (fetch, cache, sync) | All API data fetching       |
| `axios`            | HTTP client                      | `src/api/client.ts`              |
| `zustand`          | Client state management          | `src/store/` (auth, role)        |
| `zod`              | Runtime schema validation        | Validate API responses           |
| `expo-router`      | File-based routing               | `src/app/` directory             |
| `expo-secure-store`| Encrypted token storage          | `src/api/tokenStorage.ts`        |
| `react-native-unistyles` | Theming and styling        | `src/theme/`                     |

---

## Scripts

| Script           | Description                           |
| ---------------- | ------------------------------------- |
| `start`          | Start Expo dev server                 |
| `android`        | Start on Android emulator/device      |
| `ios`            | Start on iOS simulator/device         |
| `lint`           | Lint TypeScript source files          |
| `format`         | Format all files with Prettier        |
| `format:check`   | Check formatting without writing      |
| `format:ci`      | Check formatting with LF endings (CI) |
| `format_lint:ci` | Run both format and lint checks (CI)  |

---

## Related Docs

- [Backend API Endpoints](../backend/README_API_ENDPOINTS.md) — Full list of all REST endpoints
- [Database Schema](../backend/README_DB_SCHEMA.md) — Database tables and relations
- [Backend Architecture](../backend/README.md) — Backend design and workflows
