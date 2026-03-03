# Backend Architecture & Connection Paths

> **Audience:** Team developers who understand the app's features but need to learn _how_ the backend implements them.
>
> **Scope:** Low-level data flows, service interactions, and protocol choices. This does NOT cover feature descriptions or how to run Docker / dev-tools.
>
> **Status:** This document describes the **target architecture**. The backend is currently a fresh NestJS scaffold — use this as the implementation guide.

---

## Table of Contents

- [Backend Architecture \& Connection Paths](#backend-architecture--connection-paths)
  - [Table of Contents](#table-of-contents)
  - [1. Core Principles \& Constraints](#1-core-principles--constraints)
  - [2. Technology Stack](#2-technology-stack)
  - [3. Packages to Install](#3-packages-to-install)
  - [4. Suggested Module Structure](#4-suggested-module-structure)
  - [5. High-Level Component Map](#5-high-level-component-map)
  - [6. Database Schema Reference](#6-database-schema-reference)
    - [6.1 Account \& Role Model](#61-account--role-model)
    - [6.2 Other Tables](#62-other-tables)
  - [7. Key Workflows](#7-key-workflows)
    - [7.1 Authentication \& Authorization](#71-authentication--authorization)
    - [7.2 Volunteer Goes Online](#72-volunteer-goes-online)
    - [7.3 User Requests a Session (Matching)](#73-user-requests-a-session-matching)
    - [7.4 Active Chat Session (Real-Time Messaging)](#74-active-chat-session-real-time-messaging)
    - [7.5 Reconnection \& Message Recovery](#75-reconnection--message-recovery)
    - [7.6 Session End \& Cleanup](#76-session-end--cleanup)
    - [7.7 Voice / Video Call (WebRTC)](#77-voice--video-call-webrtc)
    - [7.8 Reporting \& Blocking](#78-reporting--blocking)
  - [8. Ticket System](#8-ticket-system)
    - [8.1 Ticket Lifecycle](#81-ticket-lifecycle)
    - [8.2 Rules Summary](#82-rules-summary)
  - [9. Redis Data Structures](#9-redis-data-structures)
  - [10. Notification Pipeline](#10-notification-pipeline)
  - [11. WebSocket Events Reference](#11-websocket-events-reference)
  - [12. REST API Endpoints Summary](#12-rest-api-endpoints-summary)
  - [13. Security Model](#13-security-model)
  - [14. Server Recovery](#14-server-recovery)
  - [15. Scaling Considerations](#15-scaling-considerations)
  - [16. Glossary](#16-glossary)

---

## 1. Core Principles & Constraints

| Principle                            | What it means in practice                                                                                                                                                                                                                                              |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Privacy First**                    | Chat message _content_ is never persisted to the database. Only session metadata (timestamps, ratings, category) is stored in PostgreSQL.                                                                                                                              |
| **Ephemeral Sessions**               | A chat session is time-limited. All in-flight message data lives in Redis and is purged on session end.                                                                                                                                                                |
| **No Forced Persistence**            | Users keep a session only if _they_ want one. There is no always-on connection or background sync.                                                                                                                                                                     |
| **End-to-End Encryption**            | Messages are encrypted on the client before transit. The backend relays opaque ciphertext — it cannot read message content.                                                                                                                                            |
| **Role-Based Access Control (RBAC)** | Every API endpoint is gated by roles (`user`, `volunteer`, `admin`) via the `role` → `role_permission` → `permission` chain in the DB. JWT claims carry the role.                                                                                                      |
| **One Account, Multiple Roles**      | A single `account` (one email) can hold both `user` and `volunteer` roles simultaneously via the `account_role` bridge table. There are no separate accounts per role. The JWT `roles[]` claim contains all assigned roles, and the client picks which role to act as. |
| **Anonymous by Default**             | Seekers never see volunteer real names. Volunteers see only the category and session metadata.                                                                                                                                                                         |
| **Ticket-Gated Access**              | Each user has a daily ticket allowance (5 free tickets per day). A session consumes one ticket only after the grace period (3 minutes) has elapsed.                                                                                                                    |

---

## 2. Technology Stack

| Layer               | Technology                                                   | Why                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API Framework       | **NestJS** (TypeScript)                                      | Modular architecture, first-class WebSocket & microservice support, decorator-based guards for RBAC.                                                                        |
| Database            | **PostgreSQL**                                               | Relational integrity for accounts, roles, sessions, reports. UUID primary keys everywhere.                                                                                  |
| ORM                 | **Prisma**                                                   | Type-safe database client, declarative schema, migration management, seamless NestJS integration.                                                                           |
| Validation          | **Zod** + **nestjs-zod**                                     | Shared Zod schemas between mobile and backend. `createZodDto()` generates NestJS-compatible DTOs from Zod schemas. `ZodValidationPipe` applied globally.                    |
| In-Memory Store     | **Redis**                                                    | Sub-millisecond reads for the volunteer pool, ephemeral message buffer, session state, and pub/sub for multi-instance WebSocket fan-out.                                    |
| Real-Time Transport | **WebSocket** (via `@nestjs/websockets` + Socket.IO adapter) | Bi-directional, persistent connection for chat messages and WebRTC signaling.                                                                                               |
| Job Queue           | **BullMQ** (backed by Redis)                                 | Reliable async processing: push-notification dispatch, session timeout enforcement, cleanup jobs. Supports retry with exponential backoff, rate limiting, and delayed jobs. |
| Push Notifications  | **Expo Push API** + **Firebase Cloud Messaging (FCM)**       | Expo for the managed Expo workflow; FCM as the underlying Android/iOS transport. Device tokens stored in `device_token` table.                                              |
| Media Relay         | **COTURN** (STUN / TURN)                                     | NAT traversal for WebRTC voice/video when P2P fails. The backend is _never_ in the media path.                                                                              |
| Admin Dashboard     | **Next.js** (planned, post-MVP)                              | Separate web application for admin moderation. Consumes the same NestJS REST API via `/admin/*` endpoints using the same JWT auth. Not part of the mobile app.              |

---

## 3. Packages to Install

Backend dependencies needed to implement this architecture:

```bash
# Core
yarn add @prisma/client ioredis

# WebSocket
yarn add @nestjs/websockets @nestjs/platform-socket.io

# Validation
yarn add zod nestjs-zod

# Auth
yarn add @nestjs/jwt @nestjs/passport passport passport-jwt argon2

# Job Queue
yarn add @nestjs/bullmq bullmq

# Push Notifications
yarn add expo-server-sdk

# Rate Limiting
yarn add @nestjs/throttler

# Config
yarn add @nestjs/config

# API Docs (auto-generated from Zod DTOs)
yarn add @nestjs/swagger

# Dev
yarn add -D prisma @types/passport-jwt
```

> These are the planned dependencies. Install them as you implement each module — you do not need all of them on day one.

---

## 4. Suggested Module Structure

```
backend/src/
├── main.ts
├── app.module.ts
│
├── common/                  # Shared utilities
│   ├── guards/              # AuthGuard, RolesGuard
│   ├── decorators/          # @Roles(), @CurrentUser()
│   ├── filters/             # Exception filters
│   └── interceptors/
│
├── prisma/                  # PrismaService, PrismaModule
│   └── prisma.service.ts
│
├── redis/                   # Redis connection module
│   └── redis.service.ts
│
├── auth/                    # Login, register, refresh, JWT
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── dto/                 # Zod schemas → createZodDto()
│
├── volunteer/               # Profile, status, specialisations
│   ├── volunteer.module.ts
│   ├── volunteer.controller.ts
│   └── volunteer.service.ts
│
├── session/                 # Matching, session lifecycle, tickets
│   ├── session.module.ts
│   ├── session.controller.ts
│   ├── session.service.ts
│   ├── matching.service.ts
│   └── ticket.service.ts
│
├── chat/                    # WebSocket gateway for messaging
│   ├── chat.module.ts
│   └── chat.gateway.ts
│
├── signaling/               # WebRTC signaling (SDP, ICE)
│   ├── signaling.module.ts
│   └── signaling.gateway.ts
│
├── notification/            # BullMQ workers, Expo/FCM push
│   ├── notification.module.ts
│   ├── notification.service.ts
│   └── notification.processor.ts
│
├── report/                  # Reports, blocks, admin actions
│   ├── report.module.ts
│   ├── report.controller.ts
│   └── report.service.ts
│
└── admin/                   # Admin-only endpoints (serves Next.js dashboard)
    ├── admin.module.ts
    ├── admin.controller.ts
    └── admin.service.ts
```

---

## 5. High-Level Component Map

```
┌──────────────────────────────────────────────────────────────────────┐
│                         MOBILE APP (Expo / React Native)            │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ REST Client│  │ WS Client  │  │ WebRTC Client│  │Push Listener│ │
│  └─────┬──────┘  └─────┬──────┘  └──────┬───────┘  └──────┬──────┘ │
└────────┼───────────────┼────────────────┼──────────────────┼────────┘
         │ HTTPS          │ WSS            │ DTLS/SRTP        │ FCM/APNs
─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─┼─ ─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─
         ▼                ▼               │                  │
┌─────────────────────────────────────┐   │    ┌─���───────────▼───────┐
│       NestJS Backend Server         │   │    │  Firebase / Expo    │
│  ┌──────────┐  ┌──────────────────┐ │   │    │  Push Service       │
│  │REST API  │  │WebSocket Gateway │ │   │    └─────────────────────┘
│  │Controllers│ │  (Socket.IO)     │ │   │
│  └────┬─────┘  └───────┬─────────┘ │   │
│       │                │            │   │          ┌──────────────┐
│  ┌────▼────────────────▼─────────┐  │   │          │ Next.js Admin│
│  │        Service Layer          │  │   │          │ Dashboard    │
│  │  (MatchingService, Session    │  │   │          │ (post-MVP)   │
│  │   Service, NotificationSvc,   │  │   │          └──────┬───────┘
│  │   AuthService, TicketService, │  │   │                 │ HTTPS
│  │   SignalingService)           │  │   │                 │
│  └──┬──────────┬──────────┬──────┘  │◄────────────────────┘
│     │          │          │         │   │  (same REST API,
│  ┌──▼───┐  ┌──▼───┐  ┌───▼──────┐  │   │   /admin/* endpoints,
│  │Prisma│  │Redis │  │ BullMQ   │  │   │   CORS enabled for
│  │Client│  │Client│  │ Producer │  │   │   admin domain)
│  └──┬───┘  └──┬───┘  └───┬──────┘  │   │
└─────┼─────────┼──────────┼──────────┘   │
      │         │          │              │
      ▼         ▼          ▼              │
┌──────────┐ ┌──────┐ ┌──────────┐        │
│PostgreSQL│ │Redis │ │BullMQ    │        │
│          │ │      │ │Workers   ├────────┘
│ accounts │ │ pool │ │(notify,  │  (sends push via
│ sessions │ │ msgs │ │ cleanup) │   Expo/FCM SDK)
│ roles    │ │ state│ └──────────┘
│ reports  │ └──────┘
└──────────┘

                          ┌──────────┐
                          │  COTURN  │
                          │STUN/TURN │◄──── WebRTC media relay
                          └──────────┘      (only when P2P fails)
```

---

## 6. Database Schema Reference

> Based on the current PostgreSQL schema (see ER diagram). Every PK is `uuid`. Timestamps are `datetime`.

### 6.1 Account & Role Model

A single `account` row represents one person. Roles are assigned via the `account_role` bridge table — **one account can hold multiple roles** (e.g., both `user` and `volunteer`). This means:

- A person registers once with one email.
- They start with the `user` role.
- If they apply and are approved as a volunteer, the `volunteer` role is **added** to their existing account (a new row in `account_role`).
- The JWT issued at login contains `roles: ["user", "volunteer"]` (all assigned roles).
- The `admin` role is never assignable from the mobile app — it is managed via database seeding or an admin action.

| Table                                     | Purpose                                                         | Key Relationships                                  |
| ----------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------- |
| `account`                                 | Core identity. Email, password hash (argon2id), OAuth, status.  | FK `interface_language_id` → `language`            |
| `role` / `permission` / `role_permission` | RBAC definitions.                                               | Many-to-many via `role_permission`                 |
| `account_role`                            | Assigns roles to accounts. One account can have multiple roles. | FK `account_id` → `account`, FK `role_id` → `role` |
| `account_action`                          | Audit log of admin actions (bans, warnings).                    | FK `account_id`, `admin_id`, `report_id`           |
| `refresh_token`                           | JWT refresh-token rotation. `family_id` detects token reuse.    | FK `account_id` → `account`                        |
| `device_token`                            | Push-notification tokens per device. `fcm_token`, `platform`.   | FK `account_id` → `account`                        |

### 6.2 Other Tables

| Table                                         | Purpose                                                 | Key Relationships                                            |
| --------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| `language` / `account_language`               | Supported languages and user language preferences.      | Many-to-many bridge                                          |
| `category`                                    | Problem categories (Anxiety, Relationships, etc.).      | Referenced by `user_problem`, `chat_session`                 |
| `user_problem`                                | Seeker's self-reported problem + feeling level.         | FK `account_id`, `category_id`                               |
| `volunteer_profile`                           | Volunteer verification & bio info. `is_available` flag. | FK `account_id` → `account`                                  |
| `volunteer_experience`                        | Gamification: points, level.                            | FK `account_id` → `account`                                  |
| `specialisation` / `volunteer_specialisation` | Volunteer expertise areas.                              | Many-to-many bridge                                          |
| `volunteer_verification`                      | Document verification workflow for volunteers.          | FK `volunteer_id`, `reviewed_by`                             |
| `chat_session`                                | Session metadata **only**. No message content.          | FK `seeker_id`, `listener_id`, `problem_id` → `user_problem` |
| `report`                                      | Abuse reports tied to a session.                        | FK `session_id`, `reporter_id`, `reported_id`                |
| `blocklist`                                   | User-to-user blocks.                                    | FK `blocker_id`, `blocked_id`                                |

> **Note:** Ticket storage (daily allowance tracking) is planned but the table design is not yet finalised. See [Section 8 — Ticket System](#8-ticket-system) for the logic.

---

## 7. Key Workflows

### 7.1 Authentication & Authorization

```
Mobile App                     NestJS                      PostgreSQL
    │                            │                             │
    │── POST /auth/register ────►│                             │
    │   {email, password}        │── hash password (argon2id) ─│
    │                            │── INSERT account ──────────►│
    │                            │── INSERT account_role ─────►│  (role: "user")
    │                            │── Generate JWT (access +    │
    │                            │   refresh tokens)           │
    │                            │   claims: {sub, roles[]}    │
    │                            │── INSERT refresh_token ────►│
    │◄── 201 {accessToken,       │                             │
    │    refreshToken} ──────────│                             │
    │                            │                             │
    │── POST /auth/login ───────►│                             │
    │   {email, password}        │── SELECT account ──────────►│
    │                            │── Verify argon2id hash      │
    │                            │── SELECT account_role ─────►│  (get ALL roles)
    │                            │── Generate JWT pair         │
    │                            │   claims: {sub,             │
    │                            │    roles: ["user",          │
    │                            │            "volunteer"]}    │
    │                            │── INSERT refresh_token ────►│
    │◄── 200 {accessToken,       │                             │
    │    refreshToken} ──────────│                             │
    │                            │                             │
    │── POST /auth/refresh ─────►│                             │
    │   {refreshToken}           │── SELECT refresh_token ────►│
    │                            │── Check family_id reuse     │
    │                            │   (if reused → revoke ALL   │
    │                            │    family tokens = stolen!) │
    │                            │── Rotate: revoke old,       │
    │                            │   INSERT new refresh_token ►│
    │◄── 200 {accessToken,       │                             │
    │    refreshToken} ──────────│                             │
```

**Key details:**

- **Access token** — short-lived (e.g., 15 min), carried in `Authorization: Bearer <token>` header.
- **Refresh token** — long-lived (e.g., 7 days), stored in `refresh_token` table with `family_id`. If the same `family_id` appears twice (token reuse), all tokens in the family are revoked.
- **JWT `roles[]` claim** — contains **all** roles assigned to the account. A person with both `user` and `volunteer` roles gets `roles: ["user", "volunteer"]` in their JWT. The mobile app decides which role to act as; the backend enforces it via guards.
- **Guards** — NestJS `AuthGuard` validates JWT; `RolesGuard` checks the `roles[]` claim against the required role for the endpoint.
- **Validation** — Request DTOs are defined as Zod schemas and converted to NestJS-compatible classes via `createZodDto()`. The global `ZodValidationPipe` handles validation automatically.
- **Admin accounts** — use the same login flow. The `admin` role is assigned via DB seeding or admin action, never from the mobile app. Admin endpoints (`/admin/*`) are protected by `@Roles('admin')`.

---

### 7.2 Volunteer Goes Online

```
Volunteer App                  NestJS                      PostgreSQL           Redis
    │                            │                             │                  │
    │── PATCH /volunteer/status ►│                             │                  │
    │   {available: true}        │                             │                  │
    │   Header: Bearer <JWT>     │                             │                  │
    │                            │── AuthGuard: verify JWT     │                  │
    │                            │── RolesGuard: role must     │                  │
    │                            │   include "volunteer"       │                  │
    │                            │                             │                  │
    │                            │── UPDATE volunteer_profile  │                  │
    │                            │   SET is_available = true ─►│                  │
    │                            │                             │                  │
    │                            │── SADD volunteer:pool ─────────────────────────►│
    │                            │   {accountId, specialisations[],               │
    │                            │    languages[], socketId}                       │
    │                            │                             │                  │
    │◄── 200 OK ─────────────────│                             │                  │
    │                            │                             │                  │
    │── WS: connect(JWT) ───────►│                             │                  │
    │                            │── Authenticate WS handshake │                  │
    │                            │── Map socketId → accountId  │                  │
    │                            │   in Redis ────────────────────────────────────►│
    │◄── WS: connected ─────────│                             │                  │
```

**Key details:**

- `volunteer_profile.is_available` is the **persistent** flag (survives app restart).
- The **Redis Set** (`volunteer:pool`) is the **live** pool — it contains only volunteers who are _both_ `is_available = true` in the DB _and_ have an active WebSocket connection.
- When a volunteer disconnects (socket drop), their entry is removed from the Redis pool but `is_available` stays `true` in the DB — so they can still receive push notifications.

---

### 7.3 User Requests a Session (Matching)

```
Seeker App                     NestJS                      PostgreSQL           Redis              BullMQ / Notification
    │                            │                             │                  │                       │
    │── POST /session/connect ──►│                             │                  │                       │
    │   {categoryId, feelingLevel│                             │                  │                       │
    │    customLabel?}           │                             │                  │                       │
    │   Header: Bearer <JWT>     │                             │                  │                       │
    │                            │── AuthGuard + RolesGuard    │                  │                       │
    │                            │                             │                  │                       │
    │                            │── TicketService:            │                  │                       │
    │                            │   remaining = 5 - consumed  │                  │                       │
    │                            │     - active_pending ──────►│ (or Redis)       │                       │
    │                            │   If remaining <= 0:        │                  │                       │
    │                            │     return 403              │                  │                       │
    │                            │   Else: reserve 1 ticket    │                  │                       │
    │                            │                             │                  │                       │
    │                            │── Check blocklist: ────────►│                  │                       │
    │                            │   blocked pairs for seeker  │                  │                       │
    │                            │                             │                  │                       │
    │                            │── INSERT user_problem ─────►│                  │                       │
    │                            │   (account_id, category_id, │                  │                       │
    │                            │    feeling_level, status:   │                  │                       │
    │                            │    'waiting')               │                  │                       │
    │                            │                             │                  │                       │
    │                            │── SMEMBERS volunteer:pool ─────────────────────►│                       │
    │                            │   Filter + rank candidates  │                  │                       │
    │                            │   *** ALSO: exclude         │                  │                       │
    │                            │   volunteers where          │                  │                       │
    │                            │   accountId == seeker's     │                  │                       │
    │                            │   accountId (self-match     │                  │                       │
    │                            │   prevention) ***           │                  │                       │
    │                            │── SREM volunteer:{id} ─────────────────────────►│ (atomic claim:        │
    │                            │   If returns 1 → claimed    │                  │  returns 1=success,   │
    │                            │   If returns 0 → taken,     │                  │  0=already taken,     │
    │                            │     try next candidate      │                  │  try next)            │
    │                            │                             │                  │                       │
    ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ PATH A: MATCH FOUND ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
    │                            │                             │                  │                       │
    │                            │── INSERT chat_session ─────►│                  │                       │
    │                            │   (seeker_id, listener_id,  │                  │                       │
    │                            │    problem_id, started_at,  │                  │                       │
    │                            │    status: 'active')        │                  │                       │
    │                            │                             │                  │                       │
    │                            │── HSET session:{id} ───────────────────────────►│                       │
    │                            │   {seekerSocket, volSocket, │  (session state) │                       │
    │                            │    startedAt, expiresAt,    │                  │                       │
    │                            │    graceExpiresAt}          │                  │                       │
    │                            │                             │                  │                       │
    │                            │── BullMQ: delayed job ──────────────────────────────────────────────────►│
    │                            │   "session:grace-end"       │                  │    (fires at 3 min)   │
    │                            │                             │                  │                       │
    │                            │── BullMQ: delayed job ──────────────────────────────────────────────────►│
    │                            │   "session:timeout"         │                  │    (fires at expiry)  │
    │                            │                             │                  │                       │
    │                            │── WS emit → volunteer:      │                  │                       │
    │                            │   "session:matched"         │                  │                       │
    │                            │   {sessionId, category}     │                  │                       │
    │                            │                             │                  │                       │
    │◄── 200 {sessionId,         │                             │                  │                       │
    │    volunteerId, wsRoom} ───│                             │                  │                       │
    │                            │                             │                  │                       │
    ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ PATH B: NO MATCH FOUND  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
    │                            │                             │                  │                       │
    │                            │── SELECT volunteer_profile ►│                  │                       │
    │                            │   WHERE is_available = true │                  │                       │
    │                            │   AND NOT in volunteer:pool │                  │                       │
    │                            │   (app-active but offline   │                  │                       │
    │                            │    volunteers)              │                  │                       │
    │                            │                             │                  │                       │
    │                            │── SELECT device_token ─────►│                  │                       │
    │                            │   for those volunteers      │                  │                       │
    │                            │                             │                  │                       │
    │                            │── BullMQ: "notify:volunteers" ─────────────────────────────────────────►│
    │                            │   {volunteerIds[], categoryId,                 │                       │
    │                            │    seekerId, sessionId}     │                  │                       │
    │                            │                             │                  │                       │
    │                            │── BullMQ: delayed job ──────────────────────────────────────────────────►│
    │                            │   "match:timeout"           │                  │    (fires at ~3 min)  │
    │                            │   If no volunteer accepts   │                  │    Emits WS:          │
    │                            │   → release ticket,         │                  │    "session:no-match" │
    │                            │     emit "session:no-match" │                  │    to seeker          │
    │                            │                             │                  │                       │
    │◄── 202 {status: "waiting"} │                             │                  │                       │
    │                            │                             │                  │                       │
    │   (Seeker waits on WS for  │                             │                  │                       │
    │    "session:matched" event) │                             │                  │                       │
    │                            │                             │                  │                       │
    ├─ ─ ─ ─ ─ ─ ─ ─ VOLUNTEER ACCEPTS (from push) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
    │                            │                             │                  │                       │
    │   Volunteer App ──────────►│── POST /session/{id}/accept │                  │                       │
    │                            │   Assign volunteer to       │                  │                       │
    │                            │   session, cancel           │                  │                       │
    │                            │   "match:timeout" job ──────────────────────────────────────────────────►│
    │                            │── WS emit → seeker:         │                  │                       │
    │                            │   "session:matched"         │                  │                       │
```

**Matching algorithm priority:**

1. **Self-match exclusion** — skip volunteers whose `accountId` equals the seeker's `accountId` (same person with both roles).
2. **Specialisation overlap** — volunteer's `volunteer_specialisation` matches session `category`.
3. **Block exclusion** — skip any volunteer in `blocklist` for this seeker.
4. **Language preference** — prefer shared `account_language`.
5. **Experience level** — tie-break with `volunteer_experience.level` (higher = preferred).
6. **Availability recency** — FIFO from the Redis set (longest-waiting volunteer gets matched first to balance load).

**Atomic claim:** After filtering candidates, the backend claims a volunteer using `SREM`. If `SREM` returns `1`, the claim succeeded. If it returns `0`, another request already took that volunteer — move to the next candidate. This prevents two seekers from being matched to the same volunteer.

---

### 7.4 Active Chat Session (Real-Time Messaging)

```
Seeker App                     NestJS WS Gateway              Redis
    │                            │                               │
    │── WS: join room ──────────►│                               │
    │   {sessionId, JWT}         │── Verify JWT                  │
    │                            │── HGET session:{id} ─────────►│  (validate session exists
    │                            │                               │   and user belongs to it)
    │◄── WS: "room:joined" ─────│                               │
    │                            │                               │
    │   ═══════════════ MESSAGE FLOW (repeated) ═══════════════  │
    │                            │                               │
    │── WS: "message:send" ─────►│                               │
    │   {sessionId,              │                               │
    │    encryptedPayload,       │   The backend CANNOT read     │
    │    clientMsgId,            │   the message content. It is  │
    │    timestamp}              │   encrypted ciphertext.       │
    │                            │                               │
    │                            │── RPUSH session:{id}:msgs ───►│  (append to buffer list)
    │                            │   {encryptedPayload,          │   TTL = session duration
    │                            │    clientMsgId, timestamp,    │
    │                            │    senderType}                │
    │                            │                               │
    │                            │── WS emit → volunteer socket: │
    │                            │   "message:receive"           │
    │                            │   {encryptedPayload,          │
    │                            │    clientMsgId, timestamp}    │
    │                            │                               │
    │   Volunteer App ◄──────────│                               │
    │                            │                               │
    │                            │── WS emit → seeker socket:    │
    │◄── WS: "message:ack" ─────│   "message:ack"               │
    │   {clientMsgId,            │   {clientMsgId, status:       │
    │    status: "delivered"}    │    "delivered"}               │
    │                            │                               │
    │   ═══════════════ TYPING INDICATORS ═══════════════════    │
    │                            │                               │
    │── WS: "typing:start" ─────►│── WS emit → other party:     │
    │   {sessionId}              │   "typing:start"              │
    │                            │   (pure relay, no storage)    │
```

**Key details:**

- **Message content never touches PostgreSQL.** It is relayed via WebSocket and buffered in Redis only.
- **Redis message buffer** (`session:{id}:msgs`) is a `LIST` with a TTL matching the session duration. Its purpose is message recovery on brief disconnection (see 7.5).
- **Delivery acknowledgments** — the backend sends `message:ack` back to the sender with `delivered` / `seen` status (double-tick system).
- **`clientMsgId`** — a UUID generated by the sender app. This enables idempotency — if a message is sent twice (network retry), the recipient can deduplicate by `clientMsgId`.

---

### 7.5 Reconnection & Message Recovery

```
(User drops connection, e.g., network switch, tunnel, elevator)

Seeker App                     NestJS WS Gateway              Redis
    │                            │                               │
    │   ✕ connection lost        │── Detect via Socket.IO        │
    │                            │   ping/pong timeout           │
    │                            │── HSET session:{id}           │
    │                            │   seekerStatus = "disconnected"►│
    │                            │── BullMQ: delayed job          │
    │                            │   "session:reconnect-expire"  │
    │                            │   (e.g., 60s)                 │
    │                            │                               │
    │                            │── WS emit → volunteer:        │
    │                            │   "peer:disconnected"         │
    │                            │                               │
    │   ... time passes ...      │                               │
    │   (volunteer may keep      │                               │
    │    sending messages,       │                               │
    │    they get buffered       │                               │
    │    in Redis)               │                               │
    │                            │                               │
    │── WS: reconnect(JWT) ─────►│                               │
    │   {sessionId,              │── Verify JWT + session        │
    │    lastMsgId}              │                               │
    │                            │── LRANGE session:{id}:msgs ──►│  (get buffered messages
    │                            │   from index after lastMsgId  │   since disconnect)
    │                            │                               │
    │◄── WS: "message:sync" ────│   Send missed messages        │
    │   [{msg1}, {msg2}, ...]    │   in order                    │
    │                            │                               │
    │                            │── HSET session:{id}           │
    │                            │   seekerStatus = "connected" ─►│
    │                            │── Cancel "session:reconnect-  │
    │                            │   expire" job                 │
    │                            │                               │
    │                            │── WS emit → volunteer:        │
    │                            │   "peer:reconnected"          │
```

**Key details:**

- Socket.IO's `pingInterval` and `pingTimeout` control how quickly a disconnect is detected. These should be tuned for mobile (e.g., `pingInterval: 10000, pingTimeout: 5000`).
- If the reconnect-expire timer fires without reconnection, the session is force-ended (→ Flow 7.6).
- `lastMsgId` (the `clientMsgId` of the last message the client received) enables the backend to replay only missed messages.

---

### 7.6 Session End & Cleanup

```
(Triggered by: timer expiry, manual end, grace-period expiry, or admin action)

    NestJS                      PostgreSQL           Redis              BullMQ
      │                             │                  │                  │
      │── UPDATE chat_session ─────►│                  │                  │
      │   SET ended_at = NOW(),     │                  │                  │
      │       status = 'completed', │                  │                  │
      │       closed_reason = ...   │                  │                  │
      │                             │                  │                  │
      │── UPDATE volunteer_experience►│                │                  │
      │   points += session_points  │                  │                  │
      │   (recalculate level)       │                  │                  │
      │                             │                  │                  │
      │── DEL session:{id} ────────────────────────────►│                 │
      │── DEL session:{id}:msgs ───────────���───────────►│  (purge buffer)│
      │                             │                  │                  │
      │── SADD volunteer:pool ─────────────────────────►│  (return vol   │
      │   (if volunteer still       │                  │   to pool)      │
      │    connected)               │                  │                  │
      │                             │                  │                  │
      │── Cancel remaining BullMQ ─────────────────────────────────────────►│
      │   jobs for this session     │                  │                  │
      │                             │                  │                  │
      │── WS emit → both parties:   │                  │                  │
      │   "session:ended"           │                  │                  │
      │   {sessionId, reason,       │                  │                  │
      │    ticketConsumed,          │                  │                  │
      │    canRate: true}           │                  │                  │
      │                             │                  │                  │
      │── (Later) PATCH /session/   │                  │                  │
      │   {id}/rate                 ���                  │                  │
      │── UPDATE chat_session ─────►│                  │                  │
      │   SET user_rating = X,      │                  │                  │
      │       volunteer_rating = Y, │                  │                  │
      │       starred_by_user = ... │                  │                  │
```

**Key details:**

- **Zero message residue** — all Redis keys for the session are deleted. No message content survives.
- The volunteer is returned to the `volunteer:pool` Redis set only if they still have an active WebSocket connection.
- `volunteer_experience.points` are incremented to power the gamification/levelling system.

---

### 7.7 Voice / Video Call (WebRTC)

```
Seeker App              NestJS WS Gateway           Volunteer App            COTURN
    │                        │                           │                      │
    │  User taps "Call"      │                           │                      │
    │                        │                           │                      │
    │── WS: "call:offer" ──►│── WS relay ──────────────►│                      │
    │   {sessionId,          │   "call:offer"            │                      │
    │    sdpOffer}           │   {sdpOffer}              │                      │
    │                        │                           │                      │
    │                        │◄── WS: "call:answer" ─────│                      │
    │◄── WS relay ───────────│   {sdpAnswer}             │  Volunteer accepts   │
    │   "call:answer"        │                           │                      │
    │   {sdpAnswer}          │                           │                      │
    │                        │                           │                      │
    │   ═══════════ ICE CANDIDATE EXCHANGE ═══════════   │                      │
    │                        │                           │                      │
    │── WS: "ice:candidate"►│── WS relay ──────────────►│                      │
    │◄── WS relay ───────────│◄── WS: "ice:candidate" ──│                      │
    │   (repeated for each   │                           │                      │
    │    ICE candidate)      │                           │                      │
    │                        │                           │                      │
    │   ═══════════ MEDIA CONNECTION ════════════════    │                      │
    │                        │                           │                      │
    │   Attempt 1: P2P direct (STUN)                    │                      │
    │──────────── DTLS/SRTP ─────────────────────────────│                      │
    │   (encrypted media flows directly, backend NOT     │                      │
    │    involved in media at all)                       │                      │
    │                        │                           │                      │
    │   Attempt 2: If P2P fails → TURN relay            │                      │
    │────── DTLS/SRTP ──────────────────────────────────────────────────────────►│
    │                        │                           │◄─── DTLS/SRTP ───────│
    │   (COTURN relays encrypted packets; it cannot      │                      │
    │    decrypt the media content)                      │                      │
    │                        │                           │                      │
    │── WS: "call:end" ────►│── WS relay ──────────────►│                      │
    │                        │   "call:ended"            │                      │
```

**Key details:**

- **NestJS is only a signaling server** — it passes SDP offers/answers and ICE candidates via the existing WebSocket connection. It never touches media.
- **STUN** (part of COTURN) — helps clients discover their public IP for direct P2P.
- **TURN** (part of COTURN) — full media relay when both clients are behind symmetric NATs or restrictive firewalls.
- **DTLS/SRTP** — WebRTC's built-in encryption. Even COTURN cannot read the media.
- **COTURN credentials** — the backend generates short-lived TURN credentials (time-limited HMAC-based tokens) and sends them to clients during ICE gathering.

---

### 7.8 Reporting & Blocking

```
Seeker/Volunteer App           NestJS                      PostgreSQL
    │                            │                             │
    │── POST /report ───────────►│                             │
    │   {sessionId, reportedId,  │── AuthGuard + validate      │
    │    category, description}  │   reporter was in session   │
    │                            │                             │
    │                            │── INSERT report ───────────►│
    │                            │   (session_id, reporter_id, │
    │                            │    reported_id, category,   │
    │                            │    description, status:     │
    │                            │    'pending')               │
    │                            │                             │
    │◄── 201 {reportId} ────────│                             │
    │                            │                             │
    │── POST /block ────────────►│                             │
    │   {blockedId}              │── INSERT blocklist ────────►│
    │                            │   (blocker_id, blocked_id)  │
    │◄── 201 OK ─────────────────│                             │
    │                            │                             │
    │   (Admin later reviews     │                             │
    │    via Next.js dashboard)  │                             │
    │                            │── UPDATE report             │
    │                            │   SET status = 'resolved' ─►│
    │                            │── INSERT account_action ───►│
    │                            │   (action_type: 'ban',      │
    │                            │    reason, admin_id)        │
```

---

## 8. Ticket System

Each user receives **5 free tickets per day**. One ticket is consumed per session — but only **after the 3-minute grace period** has passed. This gives users flexibility to disconnect from an unsuitable session without losing a ticket.

### 8.1 Ticket Lifecycle

```
Seeker App                     NestJS                      Storage (TBD)        BullMQ
    │                            │                             │                  │
    │── POST /session/connect ──►│                             │                  │
    │                            │── TicketService:            │                  │
    │                            │   remaining = 5             │                  │
    │                            │     - consumed_today        │                  │
    │                            │     - active_pending ──────►│                  │
    │                            │                             │                  │
    │                            │   If remaining <= 0:        │                  │
    │◄── 403 {error:             │     return 403              │                  │
    │    "no_tickets_remaining"} │                             │                  │
    │                            │                             │                  │
    │                            │   If remaining > 0:         │                  │
    │                            │     reserve 1 ticket ──────►│                  │
    │                            │     proceed with matching   │                  │
    │                            │                             │                  │
    │   ════════ SESSION STARTS — 3-MIN GRACE PERIOD ════════  │                  │
    │                            │                             │                  │
    │   Either party can close   │                             │                  │
    │   the session within 3 min │                             │                  │
    │   → ticket is NOT consumed │                             │                  │
    │   → reserved ticket is     │                             │                  │
    │     released               │                             │                  │
    │                            │                             │                  │
    │   ════════ GRACE PERIOD EXPIRES (3 min) ═══════════════  │                  │
    │                            │                             │                  │
    │                            │◄── BullMQ: "session:grace-end" fires ─────────│
    │                            │                             │                  │
    │                            │── TicketService:            │                  │
    │                            │   confirm reservation ─────►│                  │
    │                            │   (reserved → consumed)     │                  │
    │                            │                             │                  │
    │   ════════ IF SESSION CLOSED BEFORE GRACE EXPIRES ═════  │                  │
    │                            │                             │                  │
    │── WS: "session:end" ──────►│                             │                  │
    │   (within 3 min)           │── Grace still active?       │                  │
    │                            │   YES → release reserved    │                  │
    │                            │         ticket ────────────►│                  │
    │                            │── Cancel "session:grace-end"────────────────────►│
    │                            │                             │                  │
    │                            │── End session normally       │                  │
    │                            │   (status: 'cancelled_grace')                  │
    │◄── WS: "session:ended"    │                             │                  │
    │   {ticketConsumed: false}  │                             │                  │
```

### 8.2 Rules Summary

| Rule                   | Detail                                                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Daily allowance**    | 5 free tickets per user, resets at midnight (server timezone).                                                                                                           |
| **When checked**       | On `POST /session/connect` — before matching begins. Both consumed and reserved (active pending) tickets are counted.                                                    |
| **When reserved**      | Immediately on `POST /session/connect` if a ticket is available.                                                                                                         |
| **When consumed**      | Only after the 3-minute grace period has elapsed without either party closing the session.                                                                               |
| **Grace period close** | If either the seeker or the volunteer closes the session within 3 minutes, the reserved ticket is released. Session is recorded with `closed_reason: 'cancelled_grace'`. |
| **Volunteer impact**   | Tickets are a seeker-only concept. Volunteers are never charged tickets.                                                                                                 |

> **Note:** The ticket storage mechanism (dedicated table vs. column on an existing table) is not yet finalised. The logic above applies regardless of the storage approach.

---

## 9. Redis Data Structures

| Key Pattern                  | Type       | Contents                                                                                                                                                        | TTL                                |
| ---------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `volunteer:pool`             | **Set**    | Serialized JSON per volunteer: `{accountId, specialisations[], languages[], socketId}`                                                                          | None (managed by add/remove)       |
| `session:{sessionId}`        | **Hash**   | `seekerSocketId`, `volunteerSocketId`, `seekerStatus` (connected/disconnected), `volunteerStatus`, `startedAt`, `expiresAt`, `graceExpiresAt`, `ticketConsumed` | Session duration + reconnect grace |
| `session:{sessionId}:msgs`   | **List**   | Ordered encrypted message payloads: `{encryptedPayload, clientMsgId, timestamp, senderType}`                                                                    | Session duration + reconnect grace |
| `socket:{socketId}`          | **String** | `accountId`                                                                                                                                                     | Until disconnect                   |
| `account:{accountId}:socket` | **String** | `socketId`                                                                                                                                                      | Until disconnect                   |

---

## 10. Notification Pipeline

```
┌─────────────┐     ┌──────────┐     ┌─────────────────────┐     ┌──────────────┐
│ NestJS      │────►│ BullMQ   │────►│ Notification Worker  │────►│ Expo Push API│
│ (Producer)  │     │ Queue    │     │                     │     └──────┬───────┘
│             │     │ (Redis)  │     │  1. Look up tokens  │            │
└─────────────┘     └──────────┘     │     from DB         │     ┌──────▼───────┐
                                     │  2. Build messages   │     │ APNs / FCM   │
                                     │  3. Use Expo SDK's   │     │ (Apple/Google)│
                                     │     chunkPush-       │     └──────────────┘
                                     │     Notifications()  │
                                     │     (auto-batches    │
                                     │      at 100/request) │
                                     │  4. Send chunks      │
                                     │  5. Retry failures   │
                                     └─────────────────────┘
```

**Job types in BullMQ:**

| Queue           | Job Name                   | Trigger                      | Behavior                                                                                                              |
| --------------- | -------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `notifications` | `notify:volunteers`        | No online match found        | Sends push to `is_available` volunteers. Looks up `device_token` table.                                               |
| `sessions`      | `session:timeout`          | Session created              | **Delayed job.** Fires after session max duration. Triggers session-end cleanup (Flow 7.6).                           |
| `sessions`      | `session:grace-end`        | Session created              | **Delayed job** (3 minutes). When fired, confirms the reserved ticket as consumed.                                    |
| `sessions`      | `session:reconnect-expire` | User disconnects mid-session | **Delayed job** (e.g., 60s). If user hasn't reconnected, ends the session.                                            |
| `sessions`      | `match:timeout`            | Path B: no online match      | **Delayed job** (e.g., 3 min). If no volunteer accepts, emits `session:no-match` to seeker, releases reserved ticket. |
| `cleanup`       | `session:cleanup`          | Periodic (cron)              | Sweeps orphaned Redis keys from crashed sessions (see [Section 14](#14-server-recovery)).                             |

**Why Expo Push + FCM together?**

- **Expo Push API** is the primary interface — it abstracts both APNs (iOS) and FCM (Android) behind a single endpoint. Since the mobile app is built with Expo, this is the natural fit.
- **FCM tokens** (`device_token.fcm_token`) are stored because Expo Push Service routes through FCM for Android. The `platform` column (`android` / `ios`) helps the worker select the right path.

---

## 11. WebSocket Events Reference

| Event               | Direction                         | Payload                                                 | Description                                        |
| ------------------- | --------------------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| `session:matched`   | Server → Client                   | `{sessionId, category, volunteerId}`                    | Notifies both parties that a match has been made.  |
| `session:no-match`  | Server → Seeker                   | `{message}`                                             | No volunteer accepted within the timeout.          |
| `session:ended`     | Server → Client                   | `{sessionId, reason, ticketConsumed, canRate}`          | Session has ended (timer, manual, or admin).       |
| `room:joined`       | Server → Client                   | `{sessionId}`                                           | Confirms the client joined the session room.       |
| `message:send`      | Client → Server                   | `{sessionId, encryptedPayload, clientMsgId, timestamp}` | Send an encrypted message.                         |
| `message:receive`   | Server → Client                   | `{encryptedPayload, clientMsgId, timestamp}`            | Receive an encrypted message from the other party. |
| `message:ack`       | Server → Client                   | `{clientMsgId, status}`                                 | Delivery acknowledgment (`delivered` / `seen`).    |
| `message:sync`      | Server → Client                   | `[{msg1}, {msg2}, ...]`                                 | Missed messages replayed after reconnection.       |
| `typing:start`      | Client → Server / Server → Client | `{sessionId}`                                           | Typing indicator. Pure relay, no storage.          |
| `typing:stop`       | Client → Server / Server → Client | `{sessionId}`                                           | Stopped typing. Pure relay.                        |
| `peer:disconnected` | Server → Client                   | `{sessionId}`                                           | Other party lost connection.                       |
| `peer:reconnected`  | Server → Client                   | `{sessionId}`                                           | Other party reconnected.                           |
| `call:offer`        | Client → Server → Client          | `{sessionId, sdpOffer}`                                 | WebRTC call initiation.                            |
| `call:answer`       | Client → Server → Client          | `{sessionId, sdpAnswer}`                                | WebRTC call acceptance.                            |
| `call:rejected`     | Client → Server → Client          | `{sessionId}`                                           | Call declined.                                     |
| `ice:candidate`     | Client → Server → Client          | `{sessionId, candidate}`                                | ICE candidate exchange.                            |
| `call:ended`        | Client → Server → Client          | `{sessionId}`                                           | Call ended.                                        |

---

## 12. REST API Endpoints Summary

> API endpoints are not yet finalised. This section will be populated once the endpoint design is complete. In the meantime, Swagger auto-docs will be available at `/api-docs` once modules are implemented (see [Section 13 — Security Model](#13-security-model) for auth requirements per endpoint).

---

## 13. Security Model

| Layer                      | Mechanism                                                                                                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Transport**              | HTTPS (REST) + WSS (WebSocket) with TLS 1.3.                                                                                                                                                   |
| **Authentication**         | JWT with short-lived access token (e.g., 15 min) + refresh-token rotation with family-based reuse detection.                                                                                   |
| **Authorization**          | NestJS Guards: `AuthGuard` (JWT validity) → `RolesGuard` (role-based endpoint access). A single JWT carries all roles for the account.                                                         |
| **Password Storage**       | **argon2id** (memory-hard, resistant to GPU/ASIC attacks).                                                                                                                                     |
| **Message Privacy**        | Client-side E2E encryption. Backend relays opaque ciphertext.                                                                                                                                  |
| **WebRTC Media**           | DTLS handshake + SRTP encryption. Even TURN relay cannot decrypt.                                                                                                                              |
| **TURN Credentials**       | Time-limited HMAC-SHA1 credentials. Generated per-session.                                                                                                                                     |
| **Refresh Token Security** | `family_id` grouping. Reuse of an old token → entire family revoked (compromise detection).                                                                                                    |
| **Input Validation**       | Zod schemas validated globally via `ZodValidationPipe` (from `nestjs-zod`). Shared between mobile and backend.                                                                                 |
| **Rate Limiting**          | NestJS `ThrottlerGuard` on auth endpoints.                                                                                                                                                     |
| **Abuse Prevention**       | `blocklist` table exclusion in matching. `report` workflow with admin review via `account_action`. Ticket system limits daily usage to 5 sessions. Self-match prevention in `MatchingService`. |
| **CORS**                   | Not needed for mobile app (native client). Will be enabled for the admin dashboard domain when the Next.js dashboard is built.                                                                 |

---

## 14. Server Recovery

If the NestJS server crashes or restarts, all WebSocket connections drop. BullMQ delayed jobs (`session:timeout`, `session:grace-end`, etc.) survive because they are backed by Redis — they will still fire on schedule.

**On startup, the server runs a recovery sweep:**

1. Scan for `session:*` keys in Redis that are still in `active` state.
2. For each, check if both socket mappings (`socket:{id}`) are stale (no live connection).
3. If both parties are gone and the reconnect grace has expired → end the session (update PostgreSQL, purge Redis keys).
4. If the session is still within its reconnect grace window → leave it and let the normal `session:reconnect-expire` BullMQ job handle it.

The `session:cleanup` cron job (see Section 10) acts as a periodic safety net for any keys missed during the startup sweep.

---

## 15. Scaling Considerations

| Concern                              | Strategy                                                                                                                                                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Multiple NestJS instances**        | Use Redis Adapter for Socket.IO (`@socket.io/redis-adapter`). All instances share the same Redis pub/sub channel — when instance A receives a message for a user on instance B, Redis pub/sub fans it out. |
| **Redis as single point of failure** | Redis Sentinel or Redis Cluster for HA. BullMQ natively supports Sentinel.                                                                                                                                 |
| **Database connection pooling**      | Prisma manages a connection pool internally. Pool size is configurable via the `connection_limit` parameter in the database URL.                                                                           |
| **COTURN scaling**                   | COTURN is stateless per-session. Scale horizontally by adding more TURN servers and returning multiple `iceServers` URLs to clients.                                                                       |
| **Volunteer pool at scale**          | The Redis Set with `SMEMBERS` is O(n). Fine for hundreds of volunteers. If the pool grows to thousands, switch to a Sorted Set for O(log n) operations.                                                    |

---

## 16. Glossary

| Term                     | Meaning                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| **Seeker**               | A user seeking emotional support (initiates a session).                                          |
| **Listener / Volunteer** | A verified volunteer who provides support.                                                       |
| **Session**              | A time-bounded chat between one seeker and one volunteer.                                        |
| **Ticket**               | A consumable token. Each seeker gets 5 per day. One is spent per session (after grace period).   |
| **Grace Period**         | The first 3 minutes of a session during which either party can close without consuming a ticket. |
| **Pool**                 | The Redis set of currently online, available volunteers.                                         |
| **SDP**                  | Session Description Protocol — describes media capabilities for WebRTC.                          |
| **ICE**                  | Interactive Connectivity Establishment — discovers the best network path for WebRTC.             |
| **STUN**                 | Session Traversal Utilities for NAT — discovers public IP.                                       |
| **TURN**                 | Traversal Using Relays around NAT — relays media when direct connection fails.                   |
| **BullMQ**               | A Node.js job queue backed by Redis, used for async task processing.                             |
| **E2EE**                 | End-to-End Encryption — only sender and receiver can read the content.                           |
| **RBAC**                 | Role-Based Access Control — permissions are assigned to roles, roles to users.                   |
| **JWT**                  | JSON Web Token — stateless authentication token carrying user claims.                            |
| **Prisma**               | Type-safe ORM for Node.js/TypeScript, used for all PostgreSQL interactions.                      |
| **Zod**                  | TypeScript-first schema validation library, shared between mobile and backend.                   |
