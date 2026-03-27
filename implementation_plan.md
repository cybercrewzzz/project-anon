# Frontend Account/Login API Integration Plan

Wire up all static account and login-related screens to their backend APIs, each in its own feature branch and commit.

## User Review Required

> [!IMPORTANT]
> The **forgot-password / OTP / reset-password** flow (`enterEmail → OTPVerification → CreateNewPassword`) has **no backend endpoints** (`POST /auth/forgot-password`, `POST /auth/verify-otp`, `POST /auth/reset-password` do not exist in the backend). These screens cannot be connected to a real API yet. They will be skipped until the backend implements them.

> [!NOTE]
> `signIn.tsx` and `signUp.tsx` are already fully wired — no changes needed there.

---

## Proposed Changes

### Branch 1: `fe/DEV-account-api` — API layer
#### [MODIFY] [account.ts](file:///c:/Users/senit/Projects/project-anon/mobile/src/api/account.ts) [NEW]
Create `mobile/src/api/account.ts` with:
- `getMe()` → `GET /account/me`
- `updateMe(dto)` → `PATCH /account/me`
- `changePassword(dto)` → `PATCH /account/me/password`
- `registerDeviceToken(dto)` → `POST /device/token`
- `removeDeviceToken(fcmToken)` → `DELETE /device/token`

---

### Branch 2: `fe/DEV-register-device-token` — registerSuccessful screen
#### [MODIFY] [registerSuccessful.tsx](file:///c:/Users/senit/Projects/project-anon/mobile/src/app/start/user/authScreens/registerSuccessful.tsx)
- On mount, call `registerDeviceToken()` with the FCM token from Expo Notifications
- Fire-and-forget (ignore failure silently — don't block navigation)

---

### Branch 3: `fe/DEV-login-device-token` — loginSuccessful screen
#### [MODIFY] [loginSuccessful.tsx](file:///c:/Users/senit/Projects/project-anon/mobile/src/app/start/user/authScreens/loginSuccessful.tsx)
- Same pattern as above — register device token after successful login

---

### Branch 4: `fe/DEV-language-selection` — selectLanguage screen
#### [MODIFY] [selectLanguage.tsx](file:///c:/Users/senit/Projects/project-anon/mobile/src/app/start/user/selectLanguage.tsx)
- Read selected interface language from the `LanguageSelection` component via `onLanguageChange` callback
- On "Continue", call `updateMe({ interfaceLanguageId })` before navigating to signIn
- Show loading state on button while mutation is pending

---

### Branch 5: `fe/DEV-user-profile-fetch` — home screen profile
#### [MODIFY] [home.tsx](file:///c:/Users/senit/Projects/project-anon/mobile/src/app/user/(tabs)/home.tsx)
- Call `getMe()` via `useQuery` on mount
- Store result in Zustand `account` field via a `setAccount` action
- Show loading spinner while fetching

---

### Branch 6: `fe/DEV-change-password` — change password
Create a new screen or wire up the existing static `CreateNewPassword.tsx` (**when used post-login**, not the password-reset flow) to `PATCH /account/me/password`.
- Validate that new password === confirm password before calling
- Show `useMutation` pending state
- On success, navigate back; on error, show `Alert`

---

### Branch 7: `fe/DEV-logout-device-token` — logout with device cleanup
#### [MODIFY] [settings.tsx](file:///c:/Users/senit/Projects/project-anon/mobile/src/app/user/(tabs)/settings.tsx)
- Before calling `logout()`, call `removeDeviceToken(fcmToken)` to deregister the current device
- Fire-and-forget (ignore failure — still proceed with logout)

---

### Branch 8: `fe/DEV-auth-store-account` — Zustand account state
#### [MODIFY] [useAuth.ts](file:///c:/Users/senit/Projects/project-anon/mobile/src/store/useAuth.ts)
- Add `setAccount(account: Account)` action
- Hydrate will also fetch profile via `getMe()` when tokens exist but `account` is null

---

## Verification Plan

### TypeScript Check
```
cd mobile
npx tsc --noEmit
```
Run after each branch to confirm no type errors.

### Manual Verification
Each branch can be verified in the Expo dev app:
1. **account-api** — no UI; just verified via `tsc`
2. **register-device-token** — register a new account → check device token appears in DB
3. **login-device-token** — sign in → check device token appears in DB
4. **language-selection** — select a language → tap Continue → log in → check `account.interfaceLanguage` in response
5. **user-profile-fetch** — log in → home screen shows user's name/languages
6. **change-password** — use change password screen → log out → log in with new password
7. **logout-device-token** — log out → check device token removed from DB
8. **auth-store-account** — re-open app while logged in → profile screen loads without re-login

## Phase 3: Forgot Password Flow (The Final 7 Branches)

To achieve the exact remaining 7 commits required for your 19-commit goal, we will implement the backend endpoints and frontend wiring for the forgot password flow.

### Backend Endpoints
1. **Branch 1: `be/DEV-forgot-password-otp`**
   - Create `POST /auth/forgot-password` in the backend.
   - Accepts email, generates a random 4-digit OTP, stores it temporarily with an expiration, and structurally prepares the response.

2. **Branch 2: `be/DEV-verify-otp`**
   - Create `POST /auth/verify-otp` in the backend.
   - Accepts email and OTP. Validates it against the stored OTP and returns a boolean or temporary reset token.

3. **Branch 3: `be/DEV-reset-password`**
   - Create `POST /auth/reset-password` in the backend.
   - Accepts email, new password, and reset token. Hashes and updates the password in the database seamlessly.

### Frontend Wiring (React Native)
4. **Branch 4: `fe/DEV-forgot-password-api`**
   - Update `mobile/src/api/auth.ts` to export the corresponding 3 new API hooks for forgot, verify, and reset.

5. **Branch 5: `fe/DEV-enter-email`**
   - Wire up `mobile/src/app/start/user/authScreens/enterEmail.tsx` to `POST /auth/forgot-password`.
   - On success, pass email parameter and navigate to OTPVerification.

6. **Branch 6: `fe/DEV-verify-otp-screen`**
   - Wire up `mobile/src/app/start/user/authScreens/OTPVerification.tsx` to `POST /auth/verify-otp`.
   - On success, navigate to CreateNewPassword.

7. **Branch 7: `fe/DEV-reset-password-screen`**
   - Wire up `mobile/src/app/start/user/authScreens/CreateNewPassword.tsx` to `POST /auth/reset-password`.
   - On success, navigate back to the `signIn` screen.
