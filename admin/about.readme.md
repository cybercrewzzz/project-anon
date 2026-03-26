# Anora Admin Dashboard — Overview

> **Internal admin panel for the Anora mental-health support platform.**  
> Administrators can monitor platform activity, manage user accounts, review volunteer applications, investigate reports, and observe support sessions — all from one secure web interface.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Authentication & Access Control](#authentication--access-control)
4. [Features & Functionalities](#features--functionalities)
   - [Dashboard](#1-dashboard)
   - [Accounts Management](#2-accounts-management)
   - [Reports Management](#3-reports-management)
   - [Volunteer Applications](#4-volunteer-applications)
   - [Sessions Monitor](#5-sessions-monitor)
5. [Providers & Infrastructure](#providers--infrastructure)
6. [Data Types Reference](#data-types-reference)
7. [Running the App](#running-the-app)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router) | ^15.2.4 |
| **UI Library** | [Ant Design (antd)](https://ant-design.antgroup.com/) | ^5.23.0 |
| **Admin Framework** | [Refine](https://refine.dev/) (`@refinedev/core`) | ^5.0.8 |
| **Refine Adapter** | `@refinedev/antd` | ^6.0.1 |
| **Routing** | `@refinedev/nextjs-router` | ^7.0.0 |
| **HTTP Client** | [Axios](https://axios-http.com/) | ^1.7.9 |
| **Auth Cookies** | [js-cookie](https://github.com/js-cookie/js-cookie) | ^3.0.5 |
| **Command Palette** | `@refinedev/kbar` | ^2.0.0 |
| **Language** | TypeScript | ^5.8.3 |
| **Node Requirement** | Node.js | >=20 |
| **Linter** | ESLint + `eslint-config-next` | ^8 |
| **Formatter** | Prettier | 3.8.1 |
| **Containerization** | Docker (Dockerfile included) | — |

---

## Project Structure

```
admin/
├── Dockerfile
├── next.config.mjs
├── package.json
├── tsconfig.json
└── src/
    ├── types.ts                        # Shared TypeScript interfaces & enums
    ├── app/
    │   ├── layout.tsx                  # Root layout — Refine, Auth, Theme providers
    │   ├── page.tsx                    # Root redirect (→ /dashboard)
    │   ├── not-found.tsx               # 404 page
    │   ├── dashboard/
    │   │   └── page.tsx                # Stats overview page
    │   ├── accounts/
    │   │   ├── page.tsx                # Account list with search & filters
    │   │   └── show/[id]/page.tsx      # Account detail with action modals
    │   ├── reports/
    │   │   ├── page.tsx                # Report list with status filter
    │   │   └── show/[id]/page.tsx      # Report detail view
    │   ├── volunteer-applications/
    │   │   ├── page.tsx                # Applications list (approve/reject inline)
    │   │   └── show/[id]/page.tsx      # Application detail view
    │   ├── sessions/
    │   │   └── page.tsx                # Session list with multi-filter
    │   ├── login/                      # Login page
    │   ├── register/                   # Register page (admin-only)
    │   └── forgot-password/            # Password reset flow
    ├── components/
    │   ├── auth-page/                  # Custom auth page wrapper
    │   ├── header/                     # Top navigation header
    │   ├── status-tag/                 # Reusable colored status badge
    │   ├── reject-modal/               # Modal for rejection + notes input
    │   └── take-action-modal/          # Modal for warning/mute/suspend/ban
    ├── contexts/
    │   └── color-mode/                 # Light/dark theme context
    └── providers/
        ├── axios.ts                    # Axios instance + JWT interceptors
        ├── auth-provider/
        │   ├── auth-provider.client.ts # Client-side auth (login/logout/check)
        │   └── auth-provider.server.ts # Server-side auth checks
        ├── data-provider/              # Refine REST data provider
        └── devtools/                   # Refine devtools wrapper
```

---

## Authentication & Access Control

- **Role-based gate**: Only accounts with the `"admin"` role can log in. Non-admin users are rejected at login with a `403`-style message.
- **Cookie-based tokens**: On login, `accessToken`, `refreshToken`, and a serialised `auth` cookie are stored via `js-cookie`.
- **Automatic token refresh**: The Axios response interceptor detects `401` responses, queues concurrent failing requests, silently refreshes the access token via `POST /auth/refresh`, then replays all queued requests — no user action required.
- **Auto-logout on failure**: If refresh fails or no token is present, all auth cookies are cleared and the user is redirected to `/login`.
- **Identity & permissions**: `getIdentity()` and `getPermissions()` are provided to Refine via the auth provider for display and role-based UI decisions.

---

## Features & Functionalities

### 1. Dashboard

**Route:** `/dashboard`  
**API:** `GET /admin/dashboard/stats`

Displays a 6-card statistics overview of the platform at a glance:

| Card | Description |
|---|---|
| Total Accounts | All registered accounts |
| Total Volunteers | Total volunteer accounts |
| Active Volunteers | Currently active volunteers |
| Sessions Today | Sessions started today |
| Pending Reports | Reports awaiting review (highlighted amber) |
| Pending Applications | Volunteer applications awaiting decision (highlighted amber) |

---

### 2. Accounts Management

**Route:** `/accounts` (list) · `/accounts/show/:id` (detail)  
**API:** `GET /admin/accounts` · `GET /admin/accounts/:id` · `POST /admin/accounts/:id/action`

#### List View
- **Search** by email, name, or nickname
- **Filter** by account status (`active`, `suspended`, `banned`, `deleted`)
- **Filter** by role (`user`, `volunteer`, `admin`)
- Paginated table (10 per page) with columns: Account ID, Email, Name, Nickname, Status, Roles, Created At

#### Detail View (`/accounts/show/:id`)
Full description panel showing all account metadata plus three tabbed sub-panels:

| Tab | What it shows |
|---|---|
| **Actions Received** | Moderation history — type, reason, issuing admin, date, expiry |
| **Reports Received** | Reports filed against this account |
| **Reports Filed** | Reports this account has submitted |

- **"Take Action" button** opens a modal (`TakeActionModal`) to issue one of: `warning`, `mute`, `suspend`, or `ban` — with a reason and optional expiry date. Submitted to `POST /admin/accounts/:id/action`.

---

### 3. Reports Management

**Route:** `/reports` (list) · `/reports/show/:id` (detail)  
**API:** `GET /admin/reports` · `GET /admin/reports/:id`

#### List View
- **Filter** by report status (`pending`, `reviewing`, `resolved`, `dismissed`)
- Paginated table with: Report ID, Category, Status tag, Reported At timestamp, and a **Show** button
- Categories cleaned up: underscores replaced with spaces, uppercased

#### Detail View (`/reports/show/:id`)
Full report details including:
- Reporter and reported user info
- Session context (session ID, start/end times, ratings, closed reason, problem feeling level)
- Description and resolution timestamp

**Report statuses:** `pending` → `reviewing` → `resolved` / `dismissed`

---

### 4. Volunteer Applications

**Route:** `/volunteer-applications` (list) · `/volunteer-applications/show/:id` (detail)  
**API:** `GET /admin/volunteer-applications` · `PATCH /admin/volunteer-applications/:id/approve` · `PATCH /admin/volunteer-applications/:id/reject`

#### List View
- **Filter** by verification status (`pending`, `approved`, `rejected`)
- Paginated table with: Volunteer name + email, Institute name, Document link (opens externally), Status tag, Submitted At, Reviewed At

#### Inline Actions (only for `pending` applications)
| Button | Description |
|---|---|
| **Approve** | `PATCH /admin/volunteer-applications/:id/approve` — immediately promotes volunteer |
| **Reject** | Opens `RejectModal` to collect admin notes, then `PATCH .../reject` with `{ adminNotes }` |

#### Detail View (`/volunteer-applications/show/:id`)
Full application detail including volunteer profile, document preview link, and review history with admin notes.

---

### 5. Sessions Monitor

**Route:** `/sessions`  
**API:** `GET /admin/sessions`

Read-only monitoring view of all support sessions on the platform.

#### Filters
- **Status** (`active`, `completed`, `cancelled_grace`, `cancelled_timeout`, `cancelled_disconnect`, `cancelled_admin`)
- **Seeker ID** (free-text)
- **Listener ID** (free-text)

#### Table Columns
Session ID, Seeker ID, Listener ID, Status, Started At, Ended At, Closed Reason, Category, User Rating, Volunteer Rating

> Sessions are read-only in this view; no admin actions are available directly on sessions.

---

## Providers & Infrastructure

### Axios (`src/providers/axios.ts`)
- Centralised `axios` instance pointing at `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3000/v1`)
- **Request interceptor** — attaches `Authorization: Bearer <accessToken>` from cookies on every request
- **Response interceptor** — handles `401` with a transparent token refresh queue to avoid multiple simultaneous refresh calls

### Data Provider (`src/providers/data-provider/`)
- Built on `@refinedev/simple-rest` using the `apiClient` Axios instance
- Provides standard Refine CRUD operations (`getList`, `getOne`, `create`, `update`, `deleteOne`)

### Color Mode (`src/contexts/color-mode/`)
- Light/dark theme persisted via a `theme` cookie
- Default mode is read server-side in `layout.tsx` to avoid flash-of-wrong-theme
- Wrapped around the entire app via `ColorModeContextProvider`

### Refine Configuration (`src/app/layout.tsx`)
Configured resources:

| Resource | List Route | Show Route |
|---|---|---|
| `dashboard` | `/dashboard` | — |
| `reports` | `/reports` | `/reports/show/:id` |
| `volunteer-applications` | `/volunteer-applications` | `/volunteer-applications/show/:id` |
| `accounts` | `/accounts` | `/accounts/show/:id` |
| `sessions` | `/sessions` | — |

---

## Data Types Reference

Defined in `src/types.ts`:

| Type / Interface | Description |
|---|---|
| `DashboardStats` | Stats shape returned by the dashboard endpoint |
| `AccountStatus` | `active` \| `suspended` \| `banned` \| `deleted` |
| `ReportStatus` | `pending` \| `reviewing` \| `resolved` \| `dismissed` |
| `SessionStatus` | `active` \| `completed` \| `cancelled_*` (4 variants) |
| `VerificationStatus` | `pending` \| `approved` \| `rejected` |
| `ActionType` | `warning` \| `mute` \| `suspend` \| `ban` |
| `ReportListItem` | Lightweight report row for lists |
| `ReportDetail` | Full report including reporter/reported/session detail |
| `AccountListItem` | Lightweight account row for lists |
| `AccountDetail` | Full account with actions received + reports received/filed |
| `SessionListItem` | Session row with seeker/listener IDs and ratings |
| `VolunteerApplicationItem` | Application row with embedded volunteer profile |

---

## Running the App

```bash
# Install dependencies
npm install

# Development server (with Refine CLI + increased heap)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint
npm run lint

# Format
npm run format
```

> **Environment variable required:**  
> `NEXT_PUBLIC_API_URL` — Base URL of the backend API (e.g. `http://localhost:3000/v1`)

### Docker

A `Dockerfile` is included. Build and run:

```bash
docker build -t anora-admin .
docker run -p 3001:3000 -e NEXT_PUBLIC_API_URL=http://your-api:3000/v1 anora-admin
```

---

*Generated by scanning `/admin` — Last updated: 2026-03-19*
