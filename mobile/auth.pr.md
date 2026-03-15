# Mobile Auth Integration

## Summary

This PR implements mobile authentication integration — wiring the existing auth screens to the backend API, adding a root navigation gatekeeper, and enabling persistent sessions with secure token storage.

---

## Tasks Closed

- DEV-90: Mobile Auth Integration

---

## Details

- Created `src/api/auth.ts` with API functions for login, register (user), register (volunteer), and logout.
- Enhanced `useAuth` Zustand store with `userRole` derived from account roles.
- Implemented a root navigation gatekeeper (`index.tsx`) with dev bypass (`EXPO_PUBLIC_AUTH_BYPASS`).
- Wired all 6 auth screens (sign-in, sign-up, loginSuccessful for both user and volunteer paths) to real API calls with `useMutation`.
- Added age range mapping (`AGE_RANGE_MAP`) to convert UI labels to backend enum values.
- Synced `useRole` store from auth state so theme auto-switches after login.
- Fixed outdated backend `README_API_ENDPOINTS.md` (dateOfBirth → ageRange, added volunteer register docs).
- Added dev-testing seed credentials for quick mobile auth testing.

---

## Auth Flow Architecture

```
App Launch
    │
    ├── EXPO_PUBLIC_AUTH_BYPASS=true (Dev Mode)
    │       └── Use EXPO_PUBLIC_ROLE → redirect to /user/home or /volunteer/home
    │
    └── EXPO_PUBLIC_AUTH_BYPASS=false (Production)
            │
            ├── Has token + userRole → redirect to /${userRole}/(tabs)/home
            │
            └── No token → redirect to /start/welcome
                    │
                    ├── User path:    /start/user/authScreens/signIn or signUp
                    │                       │
                    │                       ├── POST /auth/login (signIn)
                    │                       └── POST /auth/register (signUp + ageRange)
                    │                               │
                    │                               └── signIn(accessToken, refreshToken, account)
                    │                                       → loginSuccessful / registerSuccessful → home
                    │
                    └── Volunteer path: /start/volunteer/authScreens/signIn or signUp
                                            │
                                            ├── POST /auth/login (signIn)
                                            └── POST /auth/register/volunteer (signUp + name)
                                                    │
                                                    └── signIn(accessToken, refreshToken, account)
                                                            → loginSuccessful / registerSuccessful → home
```

### Token Lifecycle

1. **Login/Register** → Backend returns `{ accessToken, refreshToken, account }`.
2. **`useAuth.signIn()`** → Persists tokens to `expo-secure-store`, sets in-memory state, derives `userRole`.
3. **Every API call** → Axios interceptor auto-attaches `Authorization: Bearer <token>`.
4. **401 response** → Interceptor auto-refreshes via `POST /auth/refresh` with queue for concurrent requests.
5. **Refresh failure** → Auto sign-out, clears storage, redirects to welcome screen.

### `EXPO_PUBLIC_AUTH_BYPASS`

| Value   | Behavior |
|---------|----------|
| `true`  | Bypasses auth entirely. Uses `EXPO_PUBLIC_ROLE` env var for routing. Mock socket IDs used. |
| `false` | Strict auth gating. Must sign in/register. Socket only connects when authenticated. |

---

## Endpoints Used

| Endpoint URL | HTTP Method | Used By |
|---|---|---|
| `/v1/auth/register` | `POST` | User SignUp screen — sends `{ email, password, ageRange }` |
| `/v1/auth/register/volunteer` | `POST` | Volunteer SignUp screen — sends `{ name, email, password }` |
| `/v1/auth/login` | `POST` | Both SignIn screens — sends `{ email, password }` |
| `/v1/auth/refresh` | `POST` | Automatic (Axios 401 interceptor) |
| `/v1/auth/logout` | `POST` | Logout action — sends `{ refreshToken }` |

---

## Changes Made

### Created

- `mobile/src/api/auth.ts` — Auth API functions: `login()`, `registerUser()`, `registerVolunteer()`, `logout()`.

### Modified

- `mobile/.env` — Added `EXPO_PUBLIC_AUTH_BYPASS=true`.
- `mobile/src/api/types.ts` — Added `AgeRange` type matching backend Prisma enum.
- `mobile/src/store/useAuth.ts` — Added `userRole` derived from `account.roles[]` via `deriveRole()`.
- `mobile/src/app/index.tsx` — Auth-aware gatekeeper with bypass logic.
- `mobile/src/app/_layout.tsx` — Syncs `useRole` from auth; gates mock socket IDs behind bypass.
- `mobile/src/app/start/user/authScreens/signIn.tsx` — Wired `useMutation` → `login()`.
- `mobile/src/app/start/user/authScreens/signUp.tsx` — Wired `useMutation` → `registerUser()` with `AGE_RANGE_MAP`.
- `mobile/src/app/start/user/authScreens/loginSuccessful.tsx` — Role-aware redirect via `userRole`.
- `mobile/src/app/start/volunteer/authScreens/signIn.tsx` — Wired `useMutation` → `login()`.
- `mobile/src/app/start/volunteer/authScreens/signUp.tsx` — Wired `useMutation` → `registerVolunteer()`.
- `mobile/src/app/start/volunteer/authScreens/loginSuccessful.tsx` — Role-aware redirect via `userRole`.
- `backend/README_API_ENDPOINTS.md` — Fixed `dateOfBirth` → `ageRange`, added `POST /auth/register/volunteer`.
- `backend/prisma/seed.ts` — Added dev-testing accounts for mobile auth testing.

---

## Dev-Testing Seed Credentials

These accounts are created by `yarn db:seed` and can be used to test the mobile auth flow:

### Quick Test Accounts (Password: `Admin@123`)

| Email | Password | Role | Purpose |
|---|---|---|---|
| `admin.v@anora-app.com` | `Admin@123` | volunteer | Test volunteer login flow |
| `admin.u@anora-app.com` | `Admin@123` | user | Test user/seeker login flow |

### Existing Seed Accounts (Password: `Password123!`)

| Email | Role | Status |
|---|---|---|
| `admin@example.com` | admin | active |
| `volunteer1@example.com` | volunteer | active |
| `volunteer2@example.com` | volunteer | active |
| `seeker1@example.com` | user | active |
| `seeker2@example.com` | user | active |
| `seeker3@example.com` | user | active |
| `seeker4@example.com` | user | suspended |
| `seeker5@example.com` | user | banned |

---

## How to Test

### 1. Backend Setup

```bash
cd backend

# Install dependencies
yarn install

# Start PostgreSQL + Redis via Docker
yarn db:start

# Wait a few seconds, then push the schema
yarn db:push

# Seed the database (creates test accounts)
yarn db:seed

# Start the NestJS dev server
yarn start:dev
```

The backend runs on `http://localhost:3000` with prefix `/v1`.

### 2. Mobile Setup

```bash
cd mobile

# Install dependencies
yarn install
```

### 3. Test: Auth Bypass Mode (Default — No Backend Needed)

1. Ensure `mobile/.env` has `EXPO_PUBLIC_AUTH_BYPASS=true` (this is the default).
2. Run `yarn start` → app should redirect straight to user/volunteer home based on `EXPO_PUBLIC_ROLE`.
3. This is the same behavior as before — no auth required.

### 4. Test: Auth Gating Mode (Requires Backend Running)

1. Make sure the backend is running (Step 1 above).
2. Update `mobile/.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://<YOUR_IP>:3000/v1
   EXPO_PUBLIC_AUTH_BYPASS=false
   ```
   > Replace `<YOUR_IP>` with your machine's local IP if testing on a physical device (e.g., `192.168.1.5`). Use `localhost` for emulators.
3. Restart the Expo dev server: `yarn start --clear`
4. The app should redirect to `/start/welcome`.

#### 4.1: Test User Login
1. Tap **Get Started** → go through language selection → reach SignIn screen.
2. Enter: `admin.u@anora-app.com` / `Admin@123`
3. Tap **Sign In** → should see "Login Successful!" → auto-redirects to `/user/(tabs)/home`.

#### 4.2: Test Volunteer Login
1. From the Welcome screen, tap **Continue as a Volunteer** → language selection → reach SignIn screen.
2. Enter: `admin.v@anora-app.com` / `Admin@123`
3. Tap **Sign In** → should see "Login Successful!" → auto-redirects to `/volunteer/(tabs)/home`.

#### 4.3: Test User Registration
1. Navigate to the User SignUp screen.
2. Enter a new email (not already in DB), select an age range, enter password.
3. Tap **Sign Up** → should see "Registration Successful!" → auto-redirects to special notice.

#### 4.4: Test Volunteer Registration
1. Navigate to the Volunteer SignUp screen.
2. Enter name, a new email, and password.
3. Tap **Create Account** → should see "Registration Successful!" → auto-redirects to verification step.

#### 4.5: Test Error Handling
- **Wrong password**: Enter a valid email with wrong password → should show alert "Invalid credentials".
- **Duplicate email**: Register with an already-used email → should show alert "Email already registered".
- **Banned account**: Try logging in with `seeker5@example.com` / `Password123!` → should show "Account has been banned".
- **Suspended account**: Try logging in with `seeker4@example.com` / `Password123!` → should show "Account is suspended".

#### 4.6: Session Persistence
1. Login successfully with any account.
2. Close the app completely (kill process).
3. Reopen the app → should auto-redirect to the correct home screen (tokens are restored from SecureStore).
