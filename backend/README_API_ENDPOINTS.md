> ⚠️ **Note: This architecture is subject to change without prior notice and may be outdated or not relevant as development progresses.**

# REST API Endpoints

> **Base URL:** `/api/v1`
> **Auth:** All endpoints except register/login require `Authorization: Bearer <accessToken>`
> **Validation:** `class-validator` DTOs with global `ValidationPipe`
> **Responses:** All errors return `{ statusCode, message, error? }`

---

## Auth (`/auth`)

### `POST /auth/register`

Register a new user (seeker) account.

|           |      |
| --------- | ---- |
| **Auth**  | None |
| **Roles** | None |

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePass123",
  "dateOfBirth": "2000-01-15",
  "gender": "male" // optional, default: "prefer_not_to_say"
}
```

**Response `201`:**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "account": {
    "accountId": "uuid",
    "email": "user@example.com",
    "nickname": "BlueFox42",
    "roles": ["user"]
  }
}
```

**Errors:** `409` email taken, `400` validation

---

### `POST /auth/login`

Login for all roles (user, volunteer, admin).

|           |      |
| --------- | ---- |
| **Auth**  | None |
| **Roles** | None |

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePass123"
}
```

**Response `200`:**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "account": {
    "accountId": "uuid",
    "email": "user@example.com",
    "nickname": "BlueFox42",
    "name": null,
    "roles": ["user", "volunteer"]
  }
}
```

**Errors:** `401` invalid credentials, `403` account banned/suspended

---

### `POST /auth/refresh`

Rotate refresh token. Old token is revoked.

|           |                      |
| --------- | -------------------- |
| **Auth**  | None (token in body) |
| **Roles** | None                 |

**Request Body:**

```json
{
  "refreshToken": "eyJ..."
}
```

**Response `200`:**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Errors:** `401` invalid/expired/revoked token. If family reuse detected → all family tokens revoked, return `401`

---

### `POST /auth/logout`

Revoke the current refresh token.

|           |              |
| --------- | ------------ |
| **Auth**  | Bearer token |
| **Roles** | any          |

**Request Body:**

```json
{
  "refreshToken": "eyJ..."
}
```

**Response `200`:**

```json
{ "message": "Logged out" }
```

---

## User / Seeker (`/user`)

### `GET /user/profile`

Get current user's profile.

|           |              |
| --------- | ------------ |
| **Auth**  | Bearer token |
| **Roles** | `user`       |

**Response `200`:**

```json
{
  "accountId": "uuid",
  "email": "user@example.com",
  "nickname": "BlueFox42",
  "dateOfBirth": "2000-01-15",
  "gender": "male",
  "interfaceLanguageId": "uuid",
  "languages": [{ "languageId": "uuid", "code": "en", "name": "English" }],
  "roles": ["user"]
}
```

---

### `PATCH /user/profile`

Update seeker profile fields.

|           |              |
| --------- | ------------ |
| **Auth**  | Bearer token |
| **Roles** | `user`       |

**Request Body (all optional):**

```json
{
  "gender": "female",
  "interfaceLanguageId": "uuid",
  "languageIds": ["uuid1", "uuid2"]
}
```

**Response `200`:** Updated profile object (same shape as GET).

---

### `GET /user/sessions`

Get seeker's past session history (metadata only, no messages).

|           |              |
| --------- | ------------ |
| **Auth**  | Bearer token |
| **Roles** | `user`       |

**Query:** `?page=1&limit=20`

**Response `200`:**

```json
{
  "data": [
    {
      "sessionId": "uuid",
      "category": "Anxiety",
      "startedAt": "2026-03-01T10:00:00Z",
      "endedAt": "2026-03-01T10:30:00Z",
      "status": "completed",
      "userRating": 5,
      "starredByUser": true
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

## Volunteer (`/volunteer`)

### `POST /volunteer/apply`

Apply to become a volunteer. Creates `volunteer_profile` + `volunteer_verification`.

|           |                                                 |
| --------- | ----------------------------------------------- |
| **Auth**  | Bearer token                                    |
| **Roles** | `user` (must NOT already have `volunteer` role) |

**Request Body:**

```json
{
  "name": "John Doe",
  "instituteEmail": "john@uni.edu",
  "instituteName": "State University",
  "studentId": "STU-12345",
  "instituteIdImageUrl": "https://storage.example.com/id.jpg",
  "grade": "3rd Year",
  "about": "Passionate about mental health...",
  "specialisationIds": ["uuid1", "uuid2"]
}
```

**Response `201`:**

```json
{
  "message": "Application submitted",
  "verificationStatus": "pending"
}
```

**Errors:** `409` already applied, `400` validation

---

### `GET /volunteer/profile`

Get own volunteer profile.

|           |              |
| --------- | ------------ |
| **Auth**  | Bearer token |
| **Roles** | `volunteer`  |

**Response `200`:**

```json
{
  "accountId": "uuid",
  "name": "John Doe",
  "instituteEmail": "john@uni.edu",
  "instituteName": "State University",
  "grade": "3rd Year",
  "about": "Passionate about...",
  "verificationStatus": "approved",
  "isAvailable": false,
  "specialisations": [{ "specialisationId": "uuid", "name": "Anxiety" }],
  "experience": { "points": 150, "level": 3 }
}
```

---

### `PATCH /volunteer/profile`

Update volunteer profile fields.

|           |              |
| --------- | ------------ |
| **Auth**  | Bearer token |
| **Roles** | `volunteer`  |

**Request Body (all optional):**

```json
{
  "about": "Updated bio...",
  "specialisationIds": ["uuid1", "uuid3"]
}
```

**Response `200`:** Updated profile object.

---

### `PATCH /volunteer/status`

Toggle availability (online/offline for matching).

|           |              |
| --------- | ------------ |
| **Auth**  | Bearer token |
| **Roles** | `volunteer`  |

**Request Body:**

```json
{
  "available": true
}
```

**Response `200`:**

```json
{ "isAvailable": true }
```

---

### `GET /volunteer/sessions`

Get volunteer's past session history.

|           |              |
| --------- | ------------ |
| **Auth**  | Bearer token |
| **Roles** | `volunteer`  |

**Query:** `?page=1&limit=20`

**Response `200`:** Same shape as `GET /user/sessions` but from the volunteer perspective (includes `volunteerRating`).

---

## Session (`/session`)

### `POST /session/connect`

Request a new session (seeker only). Triggers matching.

|           |              |
| --------- | ------------ |
| **Auth**  | Bearer token |
| **Roles** | `user`       |

**Request Body:**

```json
{
  "categoryId": "uuid",
  "feelingLevel": 3,
  "customLabel": "Work stress",
  "idempotencyKey": "uuid"
}
```

**Response `200` (match found):**

```json
{
  "sessionId": "uuid",
  "volunteerId": "uuid",
  "wsRoom": "session:uuid",
  "turnCredentials": {
    "urls": ["turn:host:3478"],
    "username": "...",
    "credential": "..."
  }
}
```

**Response `202` (waiting for volunteer):**

```json
{
  "status": "waiting",
  "sessionId": "uuid"
}
```

**Errors:** `409` already in active session, `403` no tickets remaining

---

### `POST /session/:sessionId/accept`

Volunteer accepts a waiting session (from push notification).

|           |              |
| --------- | ------------ |
| **Auth**  | Bearer token |
| **Roles** | `volunteer`  |

**Response `200`:**

```json
{
  "sessionId": "uuid",
  "seekerId": "uuid",
  "category": "Anxiety",
  "wsRoom": "session:uuid",
  "turnCredentials": { "urls": [...], "username": "...", "credential": "..." }
}
```

**Errors:** `409` already accepted by another volunteer, `404` session not found

---

### `PATCH /session/:sessionId/rate`

Rate a completed session.

|           |                       |
| --------- | --------------------- |
| **Auth**  | Bearer token          |
| **Roles** | `user` or `volunteer` |

**Request Body:**

```json
{
  "rating": 5,
  "starred": true
}
```

**Response `200`:**

```json
{ "message": "Rating saved" }
```

**Errors:** `400` session not completed, `404` not found, `409` already rated

---

### `GET /session/:sessionId`

Get session metadata (for participants only).

|           |                                             |
| --------- | ------------------------------------------- |
| **Auth**  | Bearer token                                |
| **Roles** | `user` or `volunteer` (must be participant) |

**Response `200`:**

```json
{
  "sessionId": "uuid",
  "category": "Anxiety",
  "startedAt": "...",
  "endedAt": "...",
  "status": "completed",
  "closedReason": null,
  "userRating": 5,
  "volunteerRating": 4,
  "starredByUser": true
}
```

---

## Report & Block (`/report`, `/block`)

### `POST /report`

File a report against the other session participant.

|           |                       |
| --------- | --------------------- |
| **Auth**  | Bearer token          |
| **Roles** | `user` or `volunteer` |

**Request Body:**

```json
{
  "sessionId": "uuid",
  "reportedId": "uuid",
  "category": "harassment",
  "description": "They were being rude..."
}
```

**Response `201`:**

```json
{ "reportId": "uuid" }
```

**Errors:** `400` reporter not in session, `409` already reported this session

---

### `POST /block`

Block another user. Bidirectional exclusion in matching.

|           |                       |
| --------- | --------------------- |
| **Auth**  | Bearer token          |
| **Roles** | `user` or `volunteer` |

**Request Body:**

```json
{
  "blockedId": "uuid"
}
```

**Response `201`:**

```json
{ "message": "User blocked" }
```

**Errors:** `409` already blocked, `400` can't block self

---

### `DELETE /block/:blockedId`

Unblock a user.

|           |                       |
| --------- | --------------------- |
| **Auth**  | Bearer token          |
| **Roles** | `user` or `volunteer` |

**Response `200`:**

```json
{ "message": "User unblocked" }
```

---

### `GET /block`

List blocked users.

|           |                       |
| --------- | --------------------- |
| **Auth**  | Bearer token          |
| **Roles** | `user` or `volunteer` |

**Response `200`:**

```json
{
  "data": [{ "blockedId": "uuid", "blockedAt": "2026-03-01T10:00:00Z" }]
}
```

---

## Notification (`/notification`)

### `POST /notification/device-token`

Register or update a device token for push notifications.

|           |                       |
| --------- | --------------------- |
| **Auth**  | Bearer token          |
| **Roles** | `user` or `volunteer` |

**Request Body:**

```json
{
  "fcmToken": "fcm-token-string",
  "platform": "android"
}
```

**Response `201`:**

```json
{ "deviceId": "uuid" }
```

---

### `DELETE /notification/device-token/:deviceId`

Remove a device token (e.g., on logout).

|           |                       |
| --------- | --------------------- |
| **Auth**  | Bearer token          |
| **Roles** | `user` or `volunteer` |

**Response `200`:**

```json
{ "message": "Device token removed" }
```

---

## Categories & Languages (public reference data)

### `GET /categories`

List all problem categories.

|           |              |
| --------- | ------------ |
| **Auth**  | Bearer token |
| **Roles** | any          |

**Response `200`:**

```json
[
  { "categoryId": "uuid", "name": "Anxiety", "description": "..." },
  { "categoryId": "uuid", "name": "Relationships", "description": "..." }
]
```

---

### `GET /languages`

List all supported languages.

|           |              |
| --------- | ------------ |
| **Auth**  | Bearer token |
| **Roles** | any          |

**Response `200`:**

```json
[
  { "languageId": "uuid", "code": "en", "name": "English" },
  { "languageId": "uuid", "code": "si", "name": "Sinhala" }
]
```

---

### `GET /specialisations`

List all volunteer specialisations.

|           |              |
| --------- | ------------ |
| **Auth**  | Bearer token |
| **Roles** | any          |

**Response `200`:**

```json
[{ "specialisationId": "uuid", "name": "Anxiety", "description": "..." }]
```

---

## Admin (`/admin`)

> All admin endpoints require `@Roles('admin')`. Used by the Next.js web portal.

### `GET /admin/reports`

List reports with filters.

**Query:** `?status=pending&page=1&limit=20`

**Response `200`:**

```json
{
  "data": [
    {
      "reportId": "uuid",
      "sessionId": "uuid",
      "reporterId": "uuid",
      "reportedId": "uuid",
      "category": "harassment",
      "description": "...",
      "status": "pending",
      "reportedAt": "..."
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

---

### `GET /admin/reports/:reportId`

Get single report detail.

**Response `200`:** Full report object + related session metadata + reporter/reported account info.

---

### `POST /admin/reports/:reportId/action`

Take action on a report (warn, suspend, ban the reported user).

**Request Body:**

```json
{
  "actionType": "ban",
  "reason": "Repeated harassment",
  "expiresAt": "2026-06-01T00:00:00Z"
}
```

**Response `201`:**

```json
{
  "actionId": "uuid",
  "reportStatus": "resolved"
}
```

**Side effects:** Updates `report.status` → `resolved`, inserts `account_action`, updates `account.status` if ban/suspend.

**Errors:** `404` report not found, `409` report already resolved/dismissed, `400` validation

---

### `PATCH /admin/reports/:reportId/dismiss`

Dismiss a report without action.

**Response `200`:**

```json
{ "reportStatus": "dismissed" }
```

**Errors:** `404` report not found, `409` report already resolved/dismissed

---

### `GET /admin/volunteer-applications`

List pending volunteer verification requests.

**Query:** `?status=pending&page=1&limit=20`

**Response `200`:**

```json
{
  "data": [
    {
      "requestId": "uuid",
      "volunteerId": "uuid",
      "name": "John Doe",
      "instituteName": "State University",
      "documentUrl": "https://...",
      "status": "pending",
      "submittedAt": "..."
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 20
}
```

---

### `PATCH /admin/volunteer-applications/:requestId/approve`

Approve a volunteer application. Grants `volunteer` role.

**Response `200`:**

```json
{ "message": "Volunteer approved", "volunteerId": "uuid" }
```

**Side effects:** Updates `volunteer_verification.status` → `approved`, `volunteer_profile.verification_status` → `approved`, inserts `account_role` with `volunteer` role, sends push notification to the volunteer.

**Errors:** `404` request not found, `409` application already approved/rejected

---

### `PATCH /admin/volunteer-applications/:requestId/reject`

Reject a volunteer application.

**Request Body:**

```json
{
  "adminNotes": "Documents unclear, please resubmit"
}
```

**Response `200`:**

```json
{ "message": "Application rejected" }
```

**Errors:** `404` request not found, `409` application already approved/rejected

---

### `GET /admin/accounts`

Search/list accounts.

**Query:** `?search=john&role=volunteer&status=active&page=1&limit=20`

**Response `200`:**

```json
{
  "data": [
    {
      "accountId": "uuid",
      "email": "john@example.com",
      "name": "John Doe",
      "nickname": null,
      "status": "active",
      "roles": ["user", "volunteer"],
      "createdAt": "..."
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

---

### `GET /admin/accounts/:accountId`

Get detailed account info (roles, actions history, reports).

**Response `200`:** Full account object + roles + recent actions + recent reports.

---

### `POST /admin/accounts/:accountId/action`

Direct admin action on an account (without a report).

**Request Body:**

```json
{
  "actionType": "suspend",
  "reason": "TOS violation",
  "expiresAt": "2026-04-01T00:00:00Z"
}
```

**Response `201`:**

```json
{ "actionId": "uuid" }
```

---

### `GET /admin/sessions`

List/search sessions for moderation.

**Query:** `?status=completed&seekerId=uuid&page=1&limit=20`

**Response `200`:** Paginated session list with metadata.

---

### `GET /admin/dashboard/stats`

Basic analytics for the admin dashboard.

**Response `200`:**

```json
{
  "totalAccounts": 5000,
  "totalVolunteers": 120,
  "activeVolunteers": 45,
  "sessionsToday": 87,
  "pendingReports": 3,
  "pendingApplications": 7
}
```

---

## Tickets (`/tickets`)

### `GET /tickets/remaining`

Check how many tickets the seeker has left today.

|           |              |
| --------- | ------------ |
| **Auth**  | Bearer token |
| **Roles** | `user`       |

**Response `200`:**

```json
{
  "daily": 5,
  "consumed": 2,
  "reserved": 1,
  "remaining": 2
}
```

> Data comes from Redis key `ticket:{accountId}:{date}`.

---

## Quick Reference Table

| Method | Endpoint                                    | Roles          | Purpose                  |
| ------ | ------------------------------------------- | -------------- | ------------------------ |
| POST   | `/auth/register`                            | —              | Register seeker          |
| POST   | `/auth/login`                               | —              | Login                    |
| POST   | `/auth/refresh`                             | —              | Rotate tokens            |
| POST   | `/auth/logout`                              | any            | Revoke refresh token     |
| GET    | `/user/profile`                             | user           | Get own profile          |
| PATCH  | `/user/profile`                             | user           | Update profile           |
| GET    | `/user/sessions`                            | user           | Session history          |
| POST   | `/volunteer/apply`                          | user           | Apply to volunteer       |
| GET    | `/volunteer/profile`                        | volunteer      | Get volunteer profile    |
| PATCH  | `/volunteer/profile`                        | volunteer      | Update volunteer profile |
| PATCH  | `/volunteer/status`                         | volunteer      | Toggle availability      |
| GET    | `/volunteer/sessions`                       | volunteer      | Session history          |
| POST   | `/session/connect`                          | user           | Request session          |
| POST   | `/session/:id/accept`                       | volunteer      | Accept session           |
| PATCH  | `/session/:id/rate`                         | user/volunteer | Rate session             |
| GET    | `/session/:id`                              | user/volunteer | Session detail           |
| POST   | `/report`                                   | user/volunteer | File report              |
| POST   | `/block`                                    | user/volunteer | Block user               |
| DELETE | `/block/:id`                                | user/volunteer | Unblock                  |
| GET    | `/block`                                    | user/volunteer | List blocked             |
| POST   | `/notification/device-token`                | user/volunteer | Register push token      |
| DELETE | `/notification/device-token/:id`            | user/volunteer | Remove push token        |
| GET    | `/categories`                               | any            | List categories          |
| GET    | `/languages`                                | any            | List languages           |
| GET    | `/specialisations`                          | any            | List specialisations     |
| GET    | `/tickets/remaining`                        | user           | Check tickets            |
| GET    | `/admin/reports`                            | admin          | List reports             |
| GET    | `/admin/reports/:id`                        | admin          | Report detail            |
| POST   | `/admin/reports/:id/action`                 | admin          | Act on report            |
| PATCH  | `/admin/reports/:id/dismiss`                | admin          | Dismiss report           |
| GET    | `/admin/volunteer-applications`             | admin          | List applications        |
| PATCH  | `/admin/volunteer-applications/:id/approve` | admin          | Approve volunteer        |
| PATCH  | `/admin/volunteer-applications/:id/reject`  | admin          | Reject volunteer         |
| GET    | `/admin/accounts`                           | admin          | Search accounts          |
| GET    | `/admin/accounts/:id`                       | admin          | Account detail           |
| POST   | `/admin/accounts/:id/action`                | admin          | Direct action            |
| GET    | `/admin/sessions`                           | admin          | Search sessions          |
| GET    | `/admin/dashboard/stats`                    | admin          | Dashboard stats          |
