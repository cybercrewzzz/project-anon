### [Database Schema Guide](README_DB_SCHEMA.md)

### [Api Endpoints Guide](README_API_ENDPOINTS.md)

### [Backend Scripts Guide](README_SCRIPTS.md)

---

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
    - [Role Rules](#role-rules)
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

| Principle                               | What it means in practice                                                                                                                                                                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Privacy First**                       | Chat message _content_ is never persisted to the database. Only session metadata (timestamps, ratings, category) is stored in PostgreSQL.                                                                                                                                               |
| **Ephemeral Sessions**                  | A chat session is time-limited (max **45 minutes**). All in-flight message data lives in Redis and is purged on session end.                                                                                                                                                            |
| **No Forced Persistence**               | Users keep a session only if _they_ want one. There is no always-on connection or background sync.                                                                                                                                                                                      |
| **End-to-End Encryption**               | Messages are encrypted on the client before transit. The backend relays opaque ciphertext -- it cannot read message content. Key exchange happens client-side during session setup (see [Section 7.4](#74-active-chat-session-real-time-messaging) for details).                        |
| **Role-Based Access Control (RBAC)**    | Every API endpoint is gated by roles (`user`, `volunteer`, `admin`) via the `role` -> `role_permission` -> `permission` chain in the DB. JWT claims carry the role.                                                                                                                     |
| **Three Distinct Roles**                | **User** = help seeker (anonymous, gets a system-generated nickname). **Volunteer** = verified listener (has a real name, handpicked by admin after verification). **Admin** = platform moderator (separate account, uses web portal). See [Role Rules](#role-rules) below.             |
| **Anonymous Seekers, Named Volunteers** | Users (seekers) never provide a real name — they receive a system-generated nickname (e.g., "BlueFox42"). Volunteers provide their real name during volunteer registration. Seekers never see volunteer real names during sessions — only the category and session metadata.            |
| **Ticket-Gated Access**                 | Each user has a daily ticket allowance (5 free tickets per day, resets at midnight **UTC**). A session consumes one ticket only after the grace period (3 minutes) has elapsed.                                                                                                         |
| **One Session at a Time**               | A seeker can have at most **1 active session** at any time. A volunteer can listen to at most **1 seeker** at any time. This is enforced at both the REST layer (reject `POST /session/connect` if active session exists) and the pool layer (volunteer is removed from pool on match). |
| **Single Device per Role**              | Each account maintains one active WebSocket connection at a time. If a second device connects, the previous socket is displaced. This simplifies message routing and session state management.                                                                                          |

### Role Rules

| Rule                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User (Seeker)**    | Registers via the mobile app. Gets the `user` role automatically. `account.name` is NULL; `account.nickname` is system-generated. Can seek help by requesting sessions.                                                                                                                                                                                                                               |
| **Volunteer**        | A person first registers as a `user`, then applies through the app's **volunteer registration path** providing their real name and verification documents. An admin reviews the application (`volunteer_verification`). Upon approval, the `volunteer` role is **added** to their existing account. The volunteer's real name is stored in `account.name`.                                            |
| **Volunteer + User** | A volunteer MAY also hold the `user` role — they can seek help too. Both roles coexist on the same account. The JWT carries `roles: ["user", "volunteer"]` and the mobile app lets them switch context.                                                                                                                                                                                               |
| **Admin**            | Admin accounts are **completely separate** — an admin email CANNOT be shared with any user or volunteer account. Admins are handpicked (seeded in DB for MVP, later created by other admins). Admins use the **web portal** (Next.js dashboard), not the mobile app. The `admin` role CANNOT coexist with `user` or `volunteer` roles on the same account. This is enforced at the application layer. |

---

## 2. Technology Stack

| Layer               | Technology                                                   | Why                                                                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API Framework       | **NestJS** (TypeScript)                                      | Modular architecture, first-class WebSocket & microservice support, decorator-based guards for RBAC.                                                                                                                                 |
| Database            | **PostgreSQL**                                               | Relational integrity for accounts, roles, sessions, reports. UUID primary keys everywhere.                                                                                                                                           |
| ORM                 | **Prisma**                                                   | Type-safe database client, declarative schema, migration management, seamless NestJS integration.                                                                                                                                    |
| Validation          | **class-validator** + **class-transformer**                  | NestJS's built-in validation approach. DTOs are plain classes decorated with validation decorators (e.g., `@IsEmail()`, `@IsString()`, `@MinLength()`). The global `ValidationPipe` auto-validates and transforms incoming requests. |
| In-Memory Store     | **Redis**                                                    | Sub-millisecond reads for the volunteer pool, ephemeral message buffer, session state, and pub/sub for multi-instance WebSocket fan-out.                                                                                             |
| Real-Time Transport | **WebSocket** (via `@nestjs/websockets` + Socket.IO adapter) | Bi-directional, persistent connection for chat messages and WebRTC signaling.                                                                                                                                                        |
| Job Queue           | **BullMQ** (backed by Redis)                                 | Reliable async processing: push-notification dispatch, session timeout enforcement, cleanup jobs. Supports retry with exponential backoff, rate limiting, and delayed jobs.                                                          |
| Push Notifications  | **Expo Push API** + **Firebase Cloud Messaging (FCM)**       | Expo for the managed Expo workflow; FCM as the underlying Android/iOS transport. Device tokens stored in `device_token` table.                                                                                                       |
| Media Relay         | **COTURN** (STUN / TURN)                                     | NAT traversal for WebRTC voice/video when P2P fails. The backend is _never_ in the media path.                                                                                                                                       |
| Admin Dashboard     | **Next.js** (planned, post-MVP)                              | Separate web application for admin moderation. Consumes the same NestJS REST API via `/admin/*` endpoints using the same JWT auth. Not part of the mobile app.                                                                       |

---

## 3. Packages to Install

Backend dependencies needed to implement this architecture:

```bash
# Core
yarn add @prisma/client ioredis

# WebSocket
yarn add @nestjs/websockets @nestjs/platform-socket.io

# Validation
yarn add class-validator class-transformer

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

# API Docs (auto-generated from DTO decorators)
yarn add @nestjs/swagger

# Dev
yarn add -D prisma @types/passport-jwt
```

> These are the planned dependencies. Install them as you implement each module -- you do not need all of them on day one.

---

## 4. Suggested Module Structure

```
backend/src/
|-- main.ts
|-- app.module.ts
|
|-- common/                  # Shared utilities
|   |-- guards/              # AuthGuard, RolesGuard
|   |-- decorators/          # @Roles(), @CurrentUser()
|   |-- filters/             # Exception filters
|   |-- interceptors/
|   +-- utils/               # Nickname generator, etc.
|
|-- prisma/                  # PrismaService, PrismaModule
|   +-- prisma.service.ts
|
|-- redis/                   # Redis connection module
|   +-- redis.service.ts
|
|-- auth/                    # Login, register, refresh, JWT
|   |-- auth.module.ts
|   |-- auth.controller.ts
|   |-- auth.service.ts
|   +-- dto/                 # class-validator DTO classes
|
|-- user/                    # Seeker-specific: profile, nickname, session history
|   |-- user.module.ts
|   |-- user.controller.ts
|   |-- user.service.ts
|   +-- dto/
|
|-- volunteer/               # Volunteer registration, profile, status, specialisations
|   |-- volunteer.module.ts
|   |-- volunteer.controller.ts
|   |-- volunteer.service.ts
|   +-- dto/
|
|-- session/                 # Matching, session lifecycle, tickets
|   |-- session.module.ts
|   |-- session.controller.ts
|   |-- session.service.ts
|   |-- matching.service.ts
|   +-- ticket.service.ts
|
|-- chat/                    # WebSocket gateway for messaging
|   |-- chat.module.ts
|   +-- chat.gateway.ts
|
|-- signaling/               # WebRTC signaling (SDP, ICE)
|   |-- signaling.module.ts
|   +-- signaling.gateway.ts
|
|-- notification/            # BullMQ workers, Expo/FCM push
|   |-- notification.module.ts
|   |-- notification.service.ts
|   +-- notification.processor.ts
|
|-- report/                  # Reports, blocks, admin actions
|   |-- report.module.ts
|   |-- report.controller.ts
|   |-- report.service.ts
|   +-- dto/
|
+-- admin/                   # Admin-only endpoints (serves Next.js dashboard)
    |-- admin.module.ts
    |-- admin.controller.ts
    |-- admin.service.ts
    +-- dto/
```

**Module responsibilities by role:**

| Module          |                                    User (Seeker)                                    |                         Volunteer                          |                                           Admin (Web Portal)                                           |
| --------------- | :---------------------------------------------------------------------------------: | :--------------------------------------------------------: | :----------------------------------------------------------------------------------------------------: |
| `auth/`         |                       ✅ register (user path), login, refresh                       |                   ✅ same account login                    |                                       ✅ separate account login                                        |
| `user/`         | ✅ view/update own profile (nickname, DOB, gender, languages), view session history |        ✅ (if also a user — shared account fields)         |                                                   —                                                    |
| `volunteer/`    |          ✅ apply to become a volunteer (submit name + verification docs)           | ✅ manage volunteer profile, availability, specialisations |                                                   —                                                    |
| `session/`      |                              ✅ request session, rate                               |                  ✅ accept session, rate                   |                                                   —                                                    |
| `chat/`         |                              ✅ send/receive messages                               |                  ✅ send/receive messages                  |                                                   —                                                    |
| `signaling/`    |                                   ✅ WebRTC calls                                   |                      ✅ WebRTC calls                       |                                                   —                                                    |
| `notification/` |                                   ✅ receive push                                   |                      ✅ receive push                       |                                                   —                                                    |
| `report/`       |                                ✅ file report, block                                |                   ✅ file report, block                    |                                                   —                                                    |
| `admin/`        |                                          —                                          |                             —                              | ✅ review reports, ban/warn users, approve/reject volunteer applications, manage roles, view analytics |

---

## 5. High-Level Component Map

```
+----------------------------------------------------------------------+
|                         MOBILE APP (Expo / React Native)             |
|  +-----------+  +-----------+  +-------------+  +------------+      |
|  |REST Client|  | WS Client |  |WebRTC Client|  |Push Listener|     |
|  +-----+-----+  +-----+-----+  +------+------+  +------+-----+     |
+---------|--------------|--------------|-----------------|-----------+
          | HTTPS         | WSS           | DTLS/SRTP       | FCM/APNs
- - - - - | - - - - - - - | - - - - - - - | - - - - - - - - | - - - -
          v               v              |                  |
+-------------------------------------+ |    +-------------v-------+
|       NestJS Backend Server         | |    |  Firebase / Expo    |
|  +----------+  +----------------+   | |    |  Push Service       |
|  |REST API  |  |WebSocket       |   | |    +---------------------+
|  |Controllers| |Gateway         |   | |
|  +----+-----+  |(Socket.IO)     |   | |
|       |        +-------+--------+   | |
|       |                |            | |          +--------------+
|  +----v----------------v---------+  | |          | Next.js Admin|
|  |        Service Layer          |  | |          | Dashboard    |
|  |  (MatchingService, Session    |  | |          | (post-MVP)   |
|  |   Service, NotificationSvc,   |  | |          +------+-------+
|  |   AuthService, TicketService, |  | |                 | HTTPS
|  |   SignalingService)           |  | |                 |
|  +--+----------+----------+-----+  |<------------------+
|     |          |          |         | |  (same REST API,
|  +--v---+  +--v---+  +---v------+  | |   /admin/* endpoints,
|  |Prisma|  |Redis |  | BullMQ   |  | |   CORS enabled for
|  |Client|  |Client|  | Producer |  | |   admin domain)
|  +--+---+  +--+---+  +---+------+  | |
+-----|---------|-----------|---------+ |
      |         |           |            |
      v         v           v            |
+----------+ +------+ +----------+       |
|PostgreSQL| |Redis | |BullMQ    |       |
|          | |      | |Workers   +-------+
| accounts | | pool | |(notify,  |  (sends push via
| sessions | | msgs | | cleanup) |   Expo/FCM SDK)
| roles    | | state| +----------+
| reports  | +------+
+----------+

                          +----------+
                          |  COTURN  |
                          |STUN/TURN |<---- WebRTC media relay
                          +----------+      (only when P2P fails)
```

---

## 6. Database Schema Reference

> Based on the current PostgreSQL schema (see ER diagram). Every PK is `uuid`. Timestamps are `datetime`. The Prisma schema lives at `backend/prisma/schema.prisma`.

### 6.1 Account & Role Model

A single `account` row represents one person.

- **Users (seekers):** `name` is NULL, `nickname` is a unique system-generated display name (e.g., "BlueFox42").
- **Volunteers:** `name` is their real name (provided during volunteer application). They may also have a `nickname` if they also hold the `user` role.
- **Admins:** `name` is their real name. Completely separate account — email cannot overlap with any user/volunteer.

Roles are assigned via the `account_role` bridge table:

- A person registers once with one email → starts with the `user` role.
- To become a volunteer, they apply through the app providing their real name + verification docs. An admin reviews and approves → `volunteer` role is **added** to the same account.
- A volunteer MAY also be a seeker (both `user` + `volunteer` roles on one account).
- Admin accounts are **isolated** — the `admin` role CANNOT coexist with `user` or `volunteer`. This is enforced at the application layer.
- The JWT issued at login contains `roles: ["user", "volunteer"]` (all assigned roles).

| Table                                     | Purpose                                                                                                | Key Columns                                                                                                                                                                                                                                                         | Key Relationships                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `account`                                 | Core identity. Stores email, password hash, name (nullable), nickname (nullable), DOB, gender, status. | `account_id` (PK), `email`, `password_hash`, `oauth_provider`, `oauth_id`, `name` (NULL for seekers), `nickname` (system-generated for seekers), `date_of_birth`, `gender`, `interface_language_id` (FK), `status` (enum), `created_at`, `updated_at`, `deleted_at` | FK `interface_language_id` -> `language`             |
| `role` / `permission` / `role_permission` | RBAC definitions. Three seeded roles: `user`, `volunteer`, `admin`.                                    | `role_id` (PK), `name`, `description`; `permission_id` (PK), `name`, `description`                                                                                                                                                                                  | Many-to-many via `role_permission`                   |
| `account_role`                            | Assigns roles to accounts. One account can have multiple roles (but not `admin` + `user`/`volunteer`). | `account_id` (PK, FK), `role_id` (PK, FK), `assigned_by` (FK, nullable), `assigned_at`                                                                                                                                                                              | FK `account_id` -> `account`, FK `role_id` -> `role` |
| `account_action`                          | Audit log of admin actions (bans, warnings, temporary suspensions).                                    | `action_id` (PK), `account_id` (FK), `admin_id` (FK), `report_id` (FK, nullable), `action_type`, `reason`, `created_at`, `expires_at` (nullable, for temp bans)                                                                                                     | FK `account_id`, `admin_id`, `report_id`             |
| `refresh_token`                           | JWT refresh-token rotation. `family_id` detects token reuse.                                           | `token_id` (PK), `account_id` (FK), `token_hash`, `expires_at`, `is_revoked`, `family_id`                                                                                                                                                                           | FK `account_id` -> `account`                         |
| `device_token`                            | Push-notification tokens per device.                                                                   | `device_id` (PK), `account_id` (FK), `fcm_token`, `platform`, `last_active_at`                                                                                                                                                                                      | FK `account_id` -> `account`                         |

### 6.2 Other Tables

| Table                                         | Purpose                                                                                                                  | Key Columns                                                                                                                                                                           | Key Relationships                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `language` / `account_language`               | Supported languages and user language preferences.                                                                       | `language_id` (PK), `code` (2-char ISO), `name`; bridge: `account_id` + `language_id`                                                                                                 | Many-to-many bridge                           |
| `category`                                    | Problem categories (Anxiety, Relationships, etc.).                                                                       | `category_id` (PK), `name`, `description`                                                                                                                                             | Referenced by `user_problem`, `chat_session`  |
| `user_problem`                                | Seeker's self-reported problem + feeling level.                                                                          | `problem_id` (PK), `account_id` (FK), `category_id` (FK), `custom_category_label`, `feeling_level`, `status`, `created_at`                                                            | FK `account_id`, `category_id`                |
| `volunteer_profile`                           | Volunteer verification & bio info. `is_available` flag. Created when a user applies to become a volunteer.               | `account_id` (PK, FK), `institute_email`, `institute_name`, `student_id`, `institute_id_image_url`, `grade`, `about`, `verification_status`, `is_available`                           | FK `account_id` -> `account`                  |
| `volunteer_experience`                        | Gamification: points, level.                                                                                             | `account_id` (PK, FK), `points`, `level`, `last_updated`                                                                                                                              | FK `account_id` -> `account`                  |
| `specialisation` / `volunteer_specialisation` | Volunteer expertise areas.                                                                                               | `specialisation_id` (PK), `name`, `description`; bridge: `account_id` + `specialisation_id`                                                                                           | Many-to-many bridge                           |
| `volunteer_verification`                      | Document verification workflow. Admin reviews and approves/rejects. Only after approval is the `volunteer` role granted. | `request_id` (PK), `volunteer_id` (FK), `document_url`, `status`, `admin_notes`, `reviewed_by` (FK), `submitted_at`, `reviewed_at`                                                    | FK `volunteer_id`, `reviewed_by`              |
| `chat_session`                                | Session metadata **only**. No message content.                                                                           | `session_id` (PK), `seeker_id` (FK), `listener_id` (FK), `problem_id` (FK), `started_at`, `ended_at`, `user_rating`, `volunteer_rating`, `starred_by_user`, `status`, `closed_reason` | FK `seeker_id`, `listener_id`, `problem_id`   |
| `report`                                      | Abuse reports tied to a session.                                                                                         | `report_id` (PK), `session_id` (FK), `reporter_id` (FK), `reported_id` (FK), `category`, `description`, `status`, `reported_at`, `resolved_at`                                        | FK `session_id`, `reporter_id`, `reported_id` |
| `blocklist`                                   | User-to-user blocks. Composite PK on (blocker, blocked).                                                                 | `blocker_id` (PK, FK), `blocked_id` (PK, FK), `blocked_at`                                                                                                                            | FK `blocker_id`, `blocked_id`                 |

> **Ticket tracking** uses Redis (see [Section 9 -- Redis Data Structures](#9-redis-data-structures), key `ticket:{accountId}:{date}`). No dedicated PostgreSQL table is needed for the MVP.

---

## 7. Key Workflows

### 7.1 Authentication & Authorization

There are **two registration paths** from the mobile app and one admin path:

1. **User (seeker) registration** -- provides email, password, date of birth, and optionally gender. A system-generated nickname is assigned. Gets the `user` role.
2. **Volunteer application** -- an existing user (or new registrant) provides their **real name** plus volunteer verification details (institute info, documents). This creates a `volunteer_profile` and `volunteer_verification` record. The account stays as `user` until an admin approves the verification → `volunteer` role is added.
3. **Admin account creation** -- admins are seeded in the database (for MVP) or created by other admins via the web portal. Admin accounts use a completely separate email.

```
Mobile App                     NestJS                      PostgreSQL
    |                            |                             |
    |== USER (SEEKER) REGISTRATION ===========================|
    |                            |                             |
    |-- POST /auth/register ---->|                             |
    |   {email, password,        |-- Validate DTO              |
    |    dateOfBirth, gender?}   |-- hash password (argon2id) -|
    |                            |-- Generate nickname ---------|  (e.g., "BlueFox42")
    |                            |-- INSERT account ---------->|
    |                            |   (email, password_hash,    |
    |                            |    name: NULL,              |
    |                            |    nickname: "BlueFox42",   |
    |                            |    date_of_birth, gender,   |
    |                            |    status: 'active')        |
    |                            |-- INSERT account_role ----->|  (role: "user")
    |                            |-- Generate JWT (access +    |
    |                            |   refresh tokens)           |
    |                            |   claims: {sub, roles[]}    |
    |                            |-- INSERT refresh_token ---->|
    |<-- 201 {accessToken,       |                             |
    |    refreshToken,           |                             |
    |    nickname} --------------|                             |
    |                            |                             |
    |== LOGIN (all roles use same endpoint) ==================|
    |                            |                             |
    |-- POST /auth/login ------->|                             |
    |   {email, password}        |-- SELECT account ---------->|
    |                            |-- Verify argon2id hash      |
    |                            |-- Check account.status      |
    |                            |   (reject if banned/suspended)
    |                            |-- SELECT account_role ----->|  (get ALL roles)
    |                            |-- Generate JWT pair         |
    |                            |   claims: {sub,             |
    |                            |    roles: ["user",          |
    |                            |            "volunteer"]}    |
    |                            |-- INSERT refresh_token ---->|
    |<-- 200 {accessToken,       |                             |
    |    refreshToken} ----------|                             |
    |                            |                             |
    |== VOLUNTEER APPLICATION (from existing user account) ===|
    |                            |                             |
    |-- POST /volunteer/apply -->|                             |
    |   {name, instituteEmail?,  |-- AuthGuard + RolesGuard   |
    |    instituteName?,         |   (must have "user" role)   |
    |    studentId?,             |                             |
    |    instituteIdImage?,      |-- UPDATE account            |
    |    grade?, about?,         |   SET name = <real name> -->|
    |    specialisations[]}      |                             |
    |                            |-- INSERT volunteer_profile ->|
    |                            |   (verification_status:     |
    |                            |    'pending')               |
    |                            |-- INSERT volunteer_         |
    |                            |   verification ------------>|
    |                            |   (status: 'pending')       |
    |                            |-- INSERT volunteer_         |
    |                            |   specialisation(s) ------->|
    |<-- 201 {status: "pending"} |                             |
    |                            |                             |
    |== ADMIN APPROVES VOLUNTEER (from web portal) ===========|
    |                            |                             |
    |   Admin Dashboard -------->|-- PATCH /admin/volunteer/   |
    |                            |   {id}/approve              |
    |                            |-- UPDATE volunteer_         |
    |                            |   verification              |
    |                            |   SET status = 'approved',  |
    |                            |   reviewed_by, reviewed_at ->|
    |                            |-- UPDATE volunteer_profile  |
    |                            |   SET verification_status   |
    |                            |   = 'approved' ------------>|
    |                            |-- INSERT account_role ----->|  (role: "volunteer")
    |                            |-- Push notification -------->|  (notify volunteer)
    |                            |                             |
    |== REFRESH TOKEN =========================================|
    |                            |                             |
    |-- POST /auth/refresh ----->|                             |
    |   {refreshToken}           |-- SELECT refresh_token ---->|
    |                            |-- Check family_id reuse     |
    |                            |   (if reused -> revoke ALL  |
    |                            |    family tokens = stolen!) |
    |                            |-- Rotate: revoke old,       |
    |                            |   INSERT new refresh_token >|
    |<-- 200 {accessToken,       |                             |
    |    refreshToken} ----------|                             |
```

**Key details:**

- **Access token** -- short-lived (e.g., 15 min), carried in `Authorization: Bearer <token>` header.
- **Refresh token** -- long-lived (e.g., 7 days), stored in `refresh_token` table with `family_id`. If the same `family_id` appears twice (token reuse), all tokens in the family are revoked.
- **User registration** requires `email`, `password`, `dateOfBirth`, and optionally `gender`. **No real name is collected** — a unique nickname is generated by the server (e.g., "BlueFox42", "SilentOwl7").
- **Volunteer application** is a separate step after having a user account. The user provides their **real name**, institute info, and verification documents. This creates `volunteer_profile` + `volunteer_verification` records. The `volunteer` role is NOT granted until an admin approves.
- **Admin email isolation** -- when a user registers, the backend checks that the email doesn't belong to an admin account. When an admin account is created, the backend checks the email doesn't belong to any existing user/volunteer account.
- **JWT `roles[]` claim** -- contains **all** roles assigned to the account. A person with both `user` and `volunteer` roles gets `roles: ["user", "volunteer"]` in their JWT. The mobile app decides which role to act as; the backend enforces it via guards.
- **Guards** -- NestJS `AuthGuard` validates JWT; `RolesGuard` checks the `roles[]` claim against the required role for the endpoint.
- **Validation** -- Request DTOs are plain TypeScript classes decorated with `class-validator` decorators (e.g., `@IsEmail()`, `@IsString()`, `@MinLength()`). The global `ValidationPipe` (from `@nestjs/common`) handles validation and transformation automatically.
- **Admin accounts** -- for MVP, seeded directly in the database. Later, existing admins can create new admin accounts via the web portal. Admin endpoints (`/admin/*`) are protected by `@Roles('admin')`.

---

### 7.2 Volunteer Goes Online

```
Volunteer App                  NestJS                      PostgreSQL           Redis
    |                            |                             |                  |
    |-- PATCH /volunteer/status >|                             |                  |
    |   {available: true}        |                             |                  |
    |   Header: Bearer <JWT>     |                             |                  |
    |                            |-- AuthGuard: verify JWT     |                  |
    |                            |-- RolesGuard: role must     |                  |
    |                            |   include "volunteer"       |                  |
    |                            |                             |                  |
    |                            |-- UPDATE volunteer_profile  |                  |
    |                            |   SET is_available = true ->|                  |
    |                            |                             |                  |
    |<-- 200 OK -----------------|                             |                  |
    |                            |                             |                  |
    |-- WS: connect(JWT) ------->|                             |                  |
    |                            |-- Authenticate WS handshake |                  |
    |                            |-- If account already has    |                  |
    |                            |   a socket -> disconnect    |                  |
    |                            |   the old one (single       |                  |
    |                            |   device enforcement)       |                  |
    |                            |-- Map socketId -> accountId |                  |
    |                            |   in Redis ---------------------------------------->|
    |                            |                             |                  |
    |                            |-- Check: is_available AND   |                  |
    |                            |   NOT in active session?    |                  |
    |                            |   If yes:                   |                  |
    |                            |     SADD volunteer:pool ----|----------------->|
    |                            |     {accountId,             |                  |
    |                            |      specialisations[],     |                  |
    |                            |      languages[],           |                  |
    |                            |      socketId}              |                  |
    |                            |                             |                  |
    |<-- WS: connected ----------|                             |                  |
```

**Key details:**

- `volunteer_profile.is_available` is the **persistent** flag (survives app restart).
- The **Redis Set** (`volunteer:pool`) is the **live** pool -- it contains only volunteers who are _both_ `is_available = true` in the DB _and_ have an active WebSocket connection.
- **Pool entry happens after WebSocket connection** -- not before. The volunteer is only added to `volunteer:pool` once the socket is live and authenticated. This prevents a matching race where a session is assigned before the socket exists.
- **Single device enforcement** -- when a new socket connects for an account that already has one, the old socket is disconnected and its `volunteer:pool` entry (if any) is removed before the new one is added.
- When a volunteer disconnects (socket drop), their entry is removed from the Redis pool but `is_available` stays `true` in the DB -- so they can still receive push notifications.

---

### 7.3 User Requests a Session (Matching)

```
Seeker App                     NestJS                      PostgreSQL           Redis              BullMQ / Notification
    |                            |                             |                  |                       |
    |-- POST /session/connect -->|                             |                  |                       |
    |   {categoryId, feelingLevel|                             |                  |                       |
    |    customLabel?,           |                             |                  |                       |
    |    idempotencyKey}         |                             |                  |                       |
    |   Header: Bearer <JWT>     |                             |                  |                       |
    |                            |-- AuthGuard + RolesGuard    |                  |                       |
    |                            |   (must have "user" role)   |                  |                       |
    |                            |                             |                  |                       |
    |                            |-- Check: seeker already     |                  |                       |
    |                            |   has an active session? -->| (or Redis)       |                       |
    |                            |   If yes: return 409        |                  |                       |
    |                            |                             |                  |                       |
    |                            |-- Check idempotencyKey:     |                  |                       |
    |                            |   already processed? ------------------------------>|                  |
    |                            |   If yes: return cached     |                  |                       |
    |                            |   response                  |                  |                       |
    |                            |                             |                  |                       |
    |                            |-- TicketService:            |                  |                       |
    |                            |   remaining = 5 - consumed  |                  |                       |
    |                            |     - active_pending        |                  |                       |
    |                            |   (atomic read+reserve) --->| (or Redis)       |                       |
    |                            |   If remaining <= 0:        |                  |                       |
    |                            |     return 403              |                  |                       |
    |                            |                             |                  |                       |
    |                            |-- Check blocklist --------->|                  |                       |
    |                            |   (BOTH directions:         |                  |                       |
    |                            |    seeker blocked vol OR    |                  |                       |
    |                            |    vol blocked seeker)      |                  |                       |
    |                            |                             |                  |                       |
    |                            |-- INSERT user_problem ----->|                  |                       |
    |                            |   (account_id, category_id, |                  |                       |
    |                            |    feeling_level, status:   |                  |                       |
    |                            |    'waiting')               |                  |                       |
    |                            |                             |                  |                       |
    |                            |-- SMEMBERS volunteer:pool ---------------------->|                      |
    |                            |   Filter + rank candidates  |                  |                       |
    |                            |-- SREM volunteer:pool       |                  |                       |
    |                            |   <member JSON> -------------------------------->| (atomic claim:       |
    |                            |   If returns 1 -> claimed   |                  |  returns 1=success,   |
    |                            |   If returns 0 -> taken,    |                  |  0=already taken,     |
    |                            |     try next candidate      |                  |  try next)            |
    |                            |                             |                  |                       |
    |--- PATH A: MATCH FOUND ---|                             |                  |                       |
    |                            |                             |                  |                       |
    |                            |-- INSERT chat_session ----->|                  |                       |
    |                            |   (seeker_id, listener_id,  |                  |                       |
    |                            |    problem_id, category_id, |                  |                       |
    |                            |    started_at,              |                  |                       |
    |                            |    status: 'active')        |                  |                       |
    |                            |                             |                  |                       |
    |                            |-- HSET session:{id} --------------------------->|                      |
    |                            |   {seekerSocket, volSocket, |  (session state) |                       |
    |                            |    startedAt, expiresAt,    |                  |                       |
    |                            |    graceExpiresAt}          |                  |                       |
    |                            |                             |                  |                       |
    |                            |-- BullMQ: delayed job --------------------------------------------->|
    |                            |   "session:grace-end"       |                  |    (fires at 3 min)   |
    |                            |                             |                  |                       |
    |                            |-- BullMQ: delayed job --------------------------------------------->|
    |                            |   "session:timeout"         |                  |    (fires at 45 min)  |
    |                            |                             |                  |                       |
    |                            |-- WS emit -> volunteer:     |                  |                       |
    |                            |   "session:matched"         |                  |                       |
    |                            |   {sessionId, category,     |                  |                       |
    |                            |    turnCredentials}         |                  |                       |
    |                            |                             |                  |                       |
    |<-- 200 {sessionId,         |                             |                  |                       |
    |    volunteerId, wsRoom,    |                             |                  |                       |
    |    turnCredentials} -------|                             |                  |                       |
    |                            |                             |                  |                       |
    |--- PATH B: NO MATCH ------|                             |                  |                       |
    |                            |                             |                  |                       |
    |                            |-- SELECT volunteer_profile >|                  |                       |
    |                            |   WHERE is_available = true |                  |                       |
    |                            |   AND NOT in volunteer:pool |                  |                       |
    |                            |   AND NOT in blocklist      |                  |                       |
    |                            |   (bidirectional check)     |                  |                       |
    |                            |                             |                  |                       |
    |                            |-- SELECT device_token ----->|                  |                       |
    |                            |   for those volunteers      |                  |                       |
    |                            |                             |                  |                       |
    |                            |-- BullMQ: "notify:volunteers" ---------------------------------------->|
    |                            |   {volunteerIds[], categoryId,                 |                       |
    |                            |    seekerId, sessionId}     |                  |                       |
    |                            |                             |                  |                       |
    |                            |-- BullMQ: delayed job --------------------------------------------->|
    |                            |   "match:timeout"           |                  |    (fires at ~3 min)  |
    |                            |   If no volunteer accepts   |                  |    Emits WS:          |
    |                            |   -> release ticket,        |                  |    "session:no-match" |
    |                            |     emit "session:no-match" |                  |    to seeker          |
    |                            |                             |                  |                       |
    |<-- 202 {status: "waiting"} |                             |                  |                       |
    |                            |                             |                  |                       |
    |   (Seeker waits on WS for  |                             |                  |                       |
    |    "session:matched" event)|                             |                  |                       |
    |                            |                             |                  |                       |
    |--- VOLUNTEER ACCEPTS (from push) ---|                    |                  |                       |
    |                            |                             |                  |                       |
    |   Volunteer App ---------->|-- POST /session/{id}/accept |                  |                       |
    |                            |   Check blocklist --------->|                  |                       |
    |                            |   (bidirectional) before    |                  |                       |
    |                            |   confirming assignment     |                  |                       |
    |                            |                             |                  |                       |
    |                            |   Atomic claim:             |                  |                       |
    |                            |   HSETNX session:{id}       |                  |                       |
    |                            |   listenerId <volId> ------------------------------>|                  |
    |                            |   If returns 0 -> another   |                  |                       |
    |                            |     volunteer already       |                  |                       |
    |                            |     accepted, return 409    |                  |                       |
    |                            |   If returns 1 -> claimed   |                  |                       |
    |                            |                             |                  |                       |
    |                            |   Assign volunteer to       |                  |                       |
    |                            |   session, cancel           |                  |                       |
    |                            |   "match:timeout" job --------------------------------------------->|
    |                            |-- WS emit -> seeker:        |                  |                       |
    |                            |   "session:matched"         |                  |                       |
    |                            |   {sessionId, category,     |                  |                       |
    |                            |    turnCredentials}         |                  |                       |
```

**Matching algorithm priority:**

1. **Self-match exclusion** -- skip volunteers whose `accountId` equals the seeker's `accountId` (same person with both roles).
2. **Bidirectional block exclusion** -- skip any volunteer who has blocked the seeker OR whom the seeker has blocked.
3. **Specialisation overlap** -- volunteer's `volunteer_specialisation` matches session `category`.
4. **Language preference** -- prefer shared `account_language`.
5. **Experience level** -- tie-break with `volunteer_experience.level` (higher = preferred).
6. **Availability recency** -- FIFO from the Redis set (longest-waiting volunteer gets matched first to balance load).

**Atomic claim (Path A):** After filtering candidates, the backend claims a volunteer using `SREM volunteer:pool <member>`. If `SREM` returns `1`, the claim succeeded. If it returns `0`, another request already took that volunteer -- move to the next candidate.

**Atomic claim (Path B):** When a volunteer accepts via `POST /session/{id}/accept`, the backend uses `HSETNX session:{id} listenerId <volunteerId>` in Redis. `HSETNX` only sets the field if it doesn't already exist -- if it returns `0`, another volunteer already accepted first, and the late volunteer gets `409 Conflict`. This prevents two volunteers from both accepting the same session.

**Idempotency:** The client sends an `idempotencyKey` (UUID) with each connect request. The backend stores this key in Redis with a short TTL (e.g., 5 minutes). If the same key appears again (network retry), the backend returns the cached response instead of creating a duplicate session or reserving another ticket.

**Concurrent session guard:** Before matching begins, the backend checks whether the seeker already has an active session (status = `active` or `waiting` in `chat_session` or `session:*` in Redis). If yes, the request is rejected with `409 Conflict`.

**TURN credentials:** Short-lived COTURN credentials (HMAC-SHA1 time-limited tokens) are generated by the backend and included in both the `session:matched` WebSocket event and the REST response. Both clients receive them at session start so they are ready for voice/video without an additional round-trip.

---

### 7.4 Active Chat Session (Real-Time Messaging)

```
Seeker App                     NestJS WS Gateway              Redis
    |                            |                               |
    |-- WS: join room ---------->|                               |
    |   {sessionId, JWT}         |-- Verify JWT                  |
    |                            |-- HGET session:{id} --------->|  (validate session exists
    |                            |                               |   and user belongs to it)
    |<-- WS: "room:joined" ------|                               |
    |                            |                               |
    |   =========== KEY EXCHANGE (client-side only) ===========  |
    |                            |                               |
    |   Both clients derive a shared secret using X25519         |
    |   Diffie-Hellman key agreement. Each client generates an   |
    |   ephemeral key pair, sends the public key via the         |
    |   "key:exchange" WS event (relayed by the backend as       |
    |   opaque data), and derives the shared AES-256-GCM key     |
    |   locally. The backend NEVER sees the private keys or      |
    |   the derived shared secret -- it only relays the public   |
    |   keys like any other message.                             |
    |                            |                               |
    |-- WS: "key:exchange" ----->|-- WS relay -> other party ----|
    |   {publicKey}              |   "key:exchange" {publicKey}  |
    |                            |                               |
    |   =============== MESSAGE FLOW (repeated) ===============  |
    |                            |                               |
    |-- WS: "message:send" ----->|                               |
    |   {sessionId,              |                               |
    |    encryptedPayload,       |   The backend CANNOT read     |
    |    clientMsgId,            |   the message content. It is  |
    |    timestamp}              |   AES-256-GCM ciphertext.     |
    |                            |                               |
    |                            |-- RPUSH session:{id}:msgs --->|  (append to buffer list)
    |                            |   {encryptedPayload,          |   TTL = session duration
    |                            |    clientMsgId, timestamp,    |
    |                            |    senderType}                |
    |                            |                               |
    |                            |-- WS emit -> volunteer socket:|
    |                            |   "message:receive"           |
    |                            |   {encryptedPayload,          |
    |                            |    clientMsgId, timestamp}    |
    |                            |                               |
    |   Volunteer App <----------|                               |
    |                            |                               |
    |                            |-- WS emit -> seeker socket:   |
    |<-- WS: "message:ack" ------|   "message:ack"               |
    |   {clientMsgId,            |   {clientMsgId, status:       |
    |    status: "delivered"}    |    "delivered"}               |
    |                            |                               |
    |   =============== TYPING INDICATORS =====================  |
    |                            |                               |
    |-- WS: "typing:start" ----->|-- WS emit -> other party:     |
    |   {sessionId}              |   "typing:start"              |
    |                            |   (pure relay, no storage)    |
    |                            |                               |
    |   NOTE: If no "typing:start" is received for 5 seconds,   |
    |   the recipient client auto-clears the typing indicator    |
    |   locally. No server-side timer needed -- the client       |
    |   treats "typing:start" as a heartbeat that must be        |
    |   renewed every ~3 seconds while the user is typing.       |
```

**Key details:**

- **E2E key exchange** -- happens via the `key:exchange` WebSocket event at the start of each session. The backend relays public keys as opaque data. It never sees private keys. On reconnection, the client re-derives the shared key from stored ephemeral keys. The full encryption protocol is a client-side implementation detail.
- **E2E limitation** -- because the backend relays public keys, a theoretically compromised server could substitute keys (MITM). This design protects against passive eavesdropping and data-at-rest exposure, which is the primary threat model for this app. It does _not_ protect against an actively malicious backend. This is an accepted trade-off. Full MITM resistance would require out-of-band key verification (safety numbers), which is out of scope for the MVP.
- **Message content never touches PostgreSQL.** It is relayed via WebSocket and buffered in Redis only.
- **Redis message buffer** (`session:{id}:msgs`) is a `LIST` with a TTL matching the session duration. Its purpose is message recovery on brief disconnection (see 7.5).
- **Delivery acknowledgments** -- the backend sends `message:ack` back to the sender with `delivered` status. The `seen` status is triggered when the recipient client explicitly sends a `message:seen` event (i.e., the message scrolled into view), which the backend relays as a `message:ack` with `status: "seen"`.
- **`clientMsgId`** -- a UUID generated by the sender app. This enables idempotency -- if a message is sent twice (network retry), the recipient can deduplicate by `clientMsgId`.
- **Typing indicator auto-expire** -- the client sends `typing:start` repeatedly while typing (e.g., every 3 seconds). The recipient clears the indicator if no `typing:start` arrives within 5 seconds. This handles the case where a user disconnects while typing.

---

### 7.5 Reconnection & Message Recovery

```
(User drops connection, e.g., network switch, tunnel, elevator)

Seeker App                     NestJS WS Gateway              Redis
    |                            |                               |
    |   X connection lost        |-- Detect via Socket.IO        |
    |                            |   ping/pong timeout           |
    |                            |-- HSET session:{id}           |
    |                            |   seekerStatus = "disconnected">|
    |                            |-- BullMQ: delayed job          |
    |                            |   "session:reconnect-expire"  |
    |                            |   (e.g., 60s)                 |
    |                            |                               |
    |                            |-- WS emit -> volunteer:        |
    |                            |   "peer:disconnected"         |
    |                            |                               |
    |   ... time passes ...      |                               |
    |   (volunteer may keep      |                               |
    |    sending messages,       |                               |
    |    they get buffered       |                               |
    |    in Redis)               |                               |
    |                            |                               |
    |-- WS: reconnect(JWT) ----->|                               |
    |   {sessionId,              |-- Verify JWT + session        |
    |    lastMsgId}              |                               |
    |                            |-- LRANGE session:{id}:msgs -->|  (get buffered messages
    |                            |   from index after lastMsgId  |   since disconnect)
    |                            |                               |
    |<-- WS: "message:sync" -----|   Send missed messages        |
    |   [{msg1}, {msg2}, ...]    |   in order                    |
    |                            |                               |
    |                            |-- HSET session:{id}           |
    |                            |   seekerStatus = "connected" ->|
    |                            |-- Cancel "session:reconnect-  |
    |                            |   expire" job                 |
    |                            |                               |
    |                            |-- WS emit -> volunteer:        |
    |                            |   "peer:reconnected"          |
```

**Key details:**

- Socket.IO's `pingInterval` and `pingTimeout` control how quickly a disconnect is detected. These should be tuned for mobile (e.g., `pingInterval: 10000, pingTimeout: 5000`).
- If the reconnect-expire timer fires without reconnection, the session is force-ended (-> Flow 7.6).
- `lastMsgId` (the `clientMsgId` of the last message the client received) enables the backend to replay only missed messages.
- **WebSocket authentication on reconnect** -- the client must provide a valid JWT on every reconnect handshake. If the access token has expired during the disconnection, the client must refresh it via `POST /auth/refresh` first, then reconnect with the new token. (See [Section 13 -- Security Model](#13-security-model) for how long-lived sessions handle JWT expiry.)

---

### 7.6 Session End & Cleanup

```
(Triggered by: timer expiry, manual end by either party, grace-period close, or admin action)

    NestJS                      PostgreSQL           Redis              BullMQ
      |                             |                  |                  |
      |-- UPDATE chat_session ----->|                  |                  |
      |   SET ended_at = NOW(),     |                  |                  |
      |       status = 'completed', |                  |                  |
      |       closed_reason = ...   |                  |                  |
      |                             |                  |                  |
      |-- UPDATE volunteer_experience>|                |                  |
      |   points += session_points  |                  |                  |
      |   (recalculate level)       |                  |                  |
      |                             |                  |                  |
      |-- DEL session:{id} ---------------------------->|                 |
      |-- DEL session:{id}:msgs ------------------------>|  (purge buffer)|
      |                             |                  |                  |
      |-- SADD volunteer:pool ----------------------->  |  (return vol   |
      |   (if volunteer still       |                  |   to pool)      |
      |    connected)               |                  |                  |
      |                             |                  |                  |
      |-- Cancel remaining BullMQ ------------------------------------------->|
      |   jobs for this session:    |                  |                  |
      |   session:timeout,          |                  |                  |
      |   session:grace-end,        |                  |                  |
      |   session:reconnect-expire  |                  |                  |
      |                             |                  |                  |
      |-- WS emit -> both parties:  |                  |                  |
      |   "session:ended"           |                  |                  |
      |   {sessionId, reason,       |                  |                  |
      |    ticketConsumed,          |                  |                  |
      |    canRate: true}           |                  |                  |
      |                             |                  |                  |
      |-- (Later) PATCH /session/   |                  |                  |
      |   {id}/rate                 |                  |                  |
      |-- UPDATE chat_session ----->|                  |                  |
      |   SET user_rating = X,      |                  |                  |
      |       volunteer_rating = Y, |                  |                  |
      |       starred_by_user = ... |                  |                  |
```

**Key details:**

- A session can be ended by **either party** via the `session:end` WebSocket event (see [Section 11](#11-websocket-events-reference)).
- **Zero message residue** -- all Redis keys for the session are deleted. No message content survives.
- The volunteer is returned to the `volunteer:pool` Redis set only if they still have an active WebSocket connection.
- `volunteer_experience.points` are incremented to power the gamification/levelling system.

---

### 7.7 Voice / Video Call (WebRTC)

```
Seeker App              NestJS WS Gateway           Volunteer App            COTURN
    |                        |                           |                      |
    |  User taps "Call"      |                           |                      |
    |                        |                           |                      |
    |-- WS: "call:offer" -->|-- WS relay -------------->|                      |
    |   {sessionId,          |   "call:offer"            |                      |
    |    sdpOffer}           |   {sdpOffer}              |                      |
    |                        |                           |                      |
    |                        |<-- WS: "call:answer" -----|                      |
    |<-- WS relay -----------|   {sdpAnswer}             |  Volunteer accepts   |
    |   "call:answer"        |                           |                      |
    |   {sdpAnswer}          |                           |                      |
    |                        |                           |                      |
    |   =========== ICE CANDIDATE EXCHANGE ===========   |                      |
    |                        |                           |                      |
    |-- WS: "ice:candidate">|-- WS relay -------------->|                      |
    |<-- WS relay -----------|<-- WS: "ice:candidate" ---|                      |
    |   (repeated for each   |                           |                      |
    |    ICE candidate)      |                           |                      |
    |                        |                           |                      |
    |   =========== MEDIA CONNECTION =================   |                      |
    |                        |                           |                      |
    |   Attempt 1: P2P direct (STUN)                     |                      |
    |------------ DTLS/SRTP ----------------------------->|                     |
    |   (encrypted media flows directly, backend NOT     |                      |
    |    involved in media at all)                       |                      |
    |                        |                           |                      |
    |   Attempt 2: If P2P fails -> TURN relay            |                      |
    |------ DTLS/SRTP -------------------------------------------------------->|
    |                        |                           |<--- DTLS/SRTP -------|
    |   (COTURN relays encrypted packets; it cannot      |                      |
    |    decrypt the media content)                      |                      |
    |                        |                           |                      |
    |-- WS: "call:end" ---->|-- WS relay -------------->|                      |
    |                        |   "call:ended"            |                      |
```

**Key details:**

- **NestJS is only a signaling server** -- it passes SDP offers/answers and ICE candidates via the existing WebSocket connection. It never touches media.
- **STUN** (part of COTURN) -- helps clients discover their public IP for direct P2P.
- **TURN** (part of COTURN) -- full media relay when both clients are behind symmetric NATs or restrictive firewalls.
- **DTLS/SRTP** -- WebRTC's built-in encryption. Even COTURN cannot read the media.
- **COTURN credentials** -- short-lived HMAC-SHA1 time-limited tokens. Generated at session start and delivered to both clients via the `session:matched` event/response (see [Section 7.3](#73-user-requests-a-session-matching)). No separate endpoint or round-trip needed. Credentials are scoped to the session duration.

---

### 7.8 Reporting & Blocking

```
Seeker/Volunteer App           NestJS                      PostgreSQL
    |                            |                             |
    |-- POST /report ----------->|                             |
    |   {sessionId, reportedId,  |-- AuthGuard + validate      |
    |    category, description}  |   reporter was in session   |
    |                            |                             |
    |                            |-- INSERT report ----------->|
    |                            |   (session_id, reporter_id, |
    |                            |    reported_id, category,   |
    |                            |    description, status:     |
    |                            |    'pending')               |
    |                            |                             |
    |<-- 201 {reportId} --------|                             |
    |                            |                             |
    |-- POST /block ------------>|                             |
    |   {blockedId}              |-- INSERT blocklist -------->|
    |                            |   (blocker_id, blocked_id)  |
    |<-- 201 OK -----------------|                             |
    |                            |                             |
    |   (Admin later reviews     |                             |
    |    via Next.js dashboard)  |                             |
    |                            |-- UPDATE report             |
    |                            |   SET status = 'resolved' ->|
    |                            |-- INSERT account_action --->|
    |                            |   (action_type: 'ban',      |
    |                            |    reason, admin_id)        |
```

---

## 8. Ticket System

Each user (seeker) receives **5 free tickets per day** (resets at midnight **UTC**). One ticket is consumed per session -- but only **after the 3-minute grace period** has passed. This gives users flexibility to disconnect from an unsuitable session without losing a ticket.

### 8.1 Ticket Lifecycle

```
Seeker App                     NestJS                      Redis (ticket tracking)  BullMQ
    |                            |                             |                  |
    |-- POST /session/connect -->|                             |                  |
    |                            |-- TicketService:            |                  |
    |                            |   remaining = 5             |                  |
    |                            |     - consumed_today        |                  |
    |                            |     - active_pending        |                  |
    |                            |   (atomic operation:        |                  |
    |                            |    read + reserve in one    |                  |
    |                            |    transaction/command) --->|                  |
    |                            |                             |                  |
    |                            |   If remaining <= 0:        |                  |
    |<-- 403 {error:             |     return 403              |                  |
    |    "no_tickets_remaining"} |                             |                  |
    |                            |                             |                  |
    |                            |   If remaining > 0:         |                  |
    |                            |     reserve 1 ticket ------>|                  |
    |                            |     proceed with matching   |                  |
    |                            |                             |                  |
    |   ======== SESSION STARTS -- 3-MIN GRACE PERIOD =======  |                  |
    |                            |                             |                  |
    |   Either party can close   |                             |                  |
    |   the session within 3 min |                             |                  |
    |   -> ticket is NOT consumed|                             |                  |
    |   -> reserved ticket is    |                             |                  |
    |     released               |                             |                  |
    |                            |                             |                  |
    |   ======== GRACE PERIOD EXPIRES (3 min) ===============  |                  |
    |                            |                             |                  |
    |                            |<-- BullMQ: "session:grace-end" fires ----------|
    |                            |                             |                  |
    |                            |-- TicketService:            |                  |
    |                            |   confirm reservation ----->|                  |
    |                            |   (reserved -> consumed)    |                  |
    |                            |                             |                  |
    |   ======== IF SESSION CLOSED BEFORE GRACE EXPIRES =====  |                  |
    |                            |                             |                  |
    |-- WS: "session:end" ------>|                             |                  |
    |   (within 3 min)           |-- Grace still active?       |                  |
    |                            |   YES -> release reserved   |                  |
    |                            |         ticket ------------>|                  |
    |                            |-- Cancel "session:grace-end"--------------------->|
    |                            |                             |                  |
    |                            |-- End session normally       |                  |
    |                            |   (status: 'cancelled_grace')                  |
    |<-- WS: "session:ended"     |                             |                  |
    |   {ticketConsumed: false}  |                             |                  |
```

### 8.2 Rules Summary

| Rule                   | Detail                                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Daily allowance**    | 5 free tickets per user (seeker), resets at midnight **UTC**.                                                                                                                                    |
| **When checked**       | On `POST /session/connect` -- before matching begins. Both consumed and reserved (active pending) tickets are counted in a single atomic operation.                                              |
| **When reserved**      | Immediately on `POST /session/connect` if a ticket is available. The check-and-reserve is atomic (single Redis command or DB transaction) to prevent race conditions from simultaneous requests. |
| **When consumed**      | Only after the 3-minute grace period has elapsed without either party closing the session.                                                                                                       |
| **Grace period close** | If either the seeker or the volunteer closes the session within 3 minutes, the reserved ticket is released. Session is recorded with `closed_reason: 'cancelled_grace'`.                         |
| **Volunteer impact**   | Tickets are a seeker-only concept. Volunteers are never charged tickets.                                                                                                                         |

---

## 9. Redis Data Structures

| Key Pattern                  | Type       | Contents                                                                                                                                                                                                          | TTL                                |
| ---------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `volunteer:pool`             | **Set**    | Serialized JSON per volunteer: `{accountId, specialisations[], languages[], socketId}`                                                                                                                            | None (managed by add/remove)       |
| `session:{sessionId}`        | **Hash**   | `seekerSocketId`, `volunteerSocketId`, `seekerStatus` (connected/disconnected), `volunteerStatus`, `startedAt`, `expiresAt`, `graceExpiresAt`, `ticketConsumed`, `listenerId` (set via `HSETNX` on Path B accept) | Session duration + reconnect grace |
| `session:{sessionId}:msgs`   | **List**   | Ordered encrypted message payloads: `{encryptedPayload, clientMsgId, timestamp, senderType}`                                                                                                                      | Session duration + reconnect grace |
| `socket:{socketId}`          | **String** | `accountId`                                                                                                                                                                                                       | Until disconnect                   |
| `account:{accountId}:socket` | **String** | `socketId` (single value -- only one active socket per account; new connection displaces old)                                                                                                                     | Until disconnect                   |
| `idempotency:{key}`          | **String** | Cached response JSON for `POST /session/connect`                                                                                                                                                                  | 5 minutes                          |
| `ticket:{accountId}:{date}`  | **Hash**   | `consumed` (int), `reserved` (int) -- used by `TicketService` for atomic check+reserve                                                                                                                            | Until end of UTC day               |

> **Scaling note on `volunteer:pool`:** The current design stores full JSON objects in a single Set, requiring `SMEMBERS` + application-level filtering. This is fine for the MVP (< 500 concurrent volunteers). If the pool grows significantly, consider restructuring to per-specialisation sets (e.g., `volunteer:pool:anxiety`, `volunteer:pool:relationships`) so `SMEMBERS` returns only pre-filtered candidates. This avoids O(n) deserialization of the entire pool on every match request.

---

## 10. Notification Pipeline

```
+-----------+     +--------+     +-------------------+     +------------+
| NestJS    |---->| BullMQ |---->| Notification      |---->|Expo Push   |
| (Producer)|     | Queue  |     | Worker            |     |API         |
|           |     | (Redis)|     |                   |     +------+-----+
+-----------+     +--------+     | 1. Look up tokens |            |
                                 |    from DB        |     +------v-----+
                                 | 2. Build messages |     | APNs / FCM |
                                 | 3. Use Expo SDK   |     |(Apple/Goog)|
                                 |    chunkPush-     |     +------------+
                                 |    Notifications()|
                                 |    (auto-batches  |
                                 |     at 100/req)   |
                                 | 4. Send chunks    |
                                 | 5. Retry failures |
                                 +-------------------+
```

**Job types in BullMQ:**

| Queue           | Job Name                   | Trigger                      | Behavior                                                                                                              |
| --------------- | -------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `notifications` | `notify:volunteers`        | No online match found        | Sends push to `is_available` volunteers. Looks up `device_token` table.                                               |
| `sessions`      | `session:timeout`          | Session created              | **Delayed job** (45 min). Fires after session max duration. Triggers session-end cleanup (Flow 7.6).                  |
| `sessions`      | `session:grace-end`        | Session created              | **Delayed job** (3 minutes). When fired, confirms the reserved ticket as consumed.                                    |
| `sessions`      | `session:reconnect-expire` | User disconnects mid-session | **Delayed job** (e.g., 60s). If user hasn't reconnected, ends the session.                                            |
| `sessions`      | `match:timeout`            | Path B: no online match      | **Delayed job** (e.g., 3 min). If no volunteer accepts, emits `session:no-match` to seeker, releases reserved ticket. |
| `cleanup`       | `session:cleanup`          | Periodic (cron)              | Sweeps orphaned Redis keys from crashed sessions (see [Section 14](#14-server-recovery)).                             |

**Why Expo Push + FCM together?**

- **Expo Push API** is the primary interface -- it abstracts both APNs (iOS) and FCM (Android) behind a single endpoint. Since the mobile app is built with Expo, this is the natural fit.
- **FCM tokens** (`device_token.fcm_token`) are stored because Expo Push Service routes through FCM for Android. The `platform` column (`android` / `ios`) helps the worker select the right path.

---

## 11. WebSocket Events Reference

| Event               | Direction                           | Payload                                                 | Description                                                                                                                 |
| ------------------- | ----------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `session:matched`   | Server -> Client                    | `{sessionId, category, volunteerId, turnCredentials}`   | Notifies both parties that a match has been made. Includes TURN credentials for WebRTC.                                     |
| `session:no-match`  | Server -> Seeker                    | `{message}`                                             | No volunteer accepted within the timeout.                                                                                   |
| `session:end`       | Client -> Server                    | `{sessionId}`                                           | Either party requests to end the session. Triggers cleanup (Flow 7.6).                                                      |
| `session:ended`     | Server -> Client                    | `{sessionId, reason, ticketConsumed, canRate}`          | Session has ended (timer, manual, or admin).                                                                                |
| `room:joined`       | Server -> Client                    | `{sessionId}`                                           | Confirms the client joined the session room.                                                                                |
| `key:exchange`      | Client -> Server -> Client          | `{publicKey}`                                           | E2E encryption: relay ephemeral X25519 public key to the other party. Backend treats this as opaque data.                   |
| `message:send`      | Client -> Server                    | `{sessionId, encryptedPayload, clientMsgId, timestamp}` | Send an encrypted message.                                                                                                  |
| `message:receive`   | Server -> Client                    | `{encryptedPayload, clientMsgId, timestamp}`            | Receive an encrypted message from the other party.                                                                          |
| `message:ack`       | Server -> Client                    | `{clientMsgId, status}`                                 | Delivery acknowledgment (`delivered` or `seen`).                                                                            |
| `message:seen`      | Client -> Server                    | `{sessionId, clientMsgId}`                              | Client reports that a message has been viewed. Server relays as `message:ack` with `status: "seen"` to the sender.          |
| `message:sync`      | Server -> Client                    | `[{msg1}, {msg2}, ...]`                                 | Missed messages replayed after reconnection.                                                                                |
| `typing:start`      | Client -> Server / Server -> Client | `{sessionId}`                                           | Typing indicator. Pure relay, no storage. Client sends every ~3s while typing; recipient auto-clears after 5s of no signal. |
| `typing:stop`       | Client -> Server / Server -> Client | `{sessionId}`                                           | Explicit stop typing. Pure relay.                                                                                           |
| `peer:disconnected` | Server -> Client                    | `{sessionId}`                                           | Other party lost connection.                                                                                                |
| `peer:reconnected`  | Server -> Client                    | `{sessionId}`                                           | Other party reconnected.                                                                                                    |
| `call:offer`        | Client -> Server -> Client          | `{sessionId, sdpOffer}`                                 | WebRTC call initiation.                                                                                                     |
| `call:answer`       | Client -> Server -> Client          | `{sessionId, sdpAnswer}`                                | WebRTC call acceptance.                                                                                                     |
| `call:rejected`     | Client -> Server -> Client          | `{sessionId}`                                           | Call declined.                                                                                                              |
| `ice:candidate`     | Client -> Server -> Client          | `{sessionId, candidate}`                                | ICE candidate exchange.                                                                                                     |
| `call:ended`        | Client -> Server -> Client          | `{sessionId}`                                           | Call ended.                                                                                                                 |

---

## 12. REST API Endpoints Summary

> API endpoints are not yet finalised. This section will be populated once the endpoint design is complete. In the meantime, Swagger auto-docs will be available at `/api-docs` once modules are implemented (see [Section 13 -- Security Model](#13-security-model) for auth requirements per endpoint).

---

## 13. Security Model

| Layer                         | Mechanism                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Transport**                 | HTTPS (REST) + WSS (WebSocket) with TLS 1.3.                                                                                                                                                                                                                                                                                                                                                                                 |
| **Authentication**            | JWT with short-lived access token (e.g., 15 min) + refresh-token rotation with family-based reuse detection.                                                                                                                                                                                                                                                                                                                 |
| **WebSocket Auth Lifecycle**  | JWT is verified at the WebSocket handshake. Since sessions can outlast the 15-min access token, the client is responsible for proactively refreshing the token via `POST /auth/refresh` and reconnecting with the new token before (or immediately after) the old one expires. Socket.IO's built-in reconnection handles this transparently if the client refreshes the token in the `reconnect_attempt` event handler.      |
| **Authorization**             | NestJS Guards: `AuthGuard` (JWT validity) -> `RolesGuard` (role-based endpoint access). A single JWT carries all roles for the account.                                                                                                                                                                                                                                                                                      |
| **Role Isolation**            | Admin accounts are fully isolated — the `admin` role cannot coexist with `user` or `volunteer` on the same account. Enforced at the application layer during registration and role assignment.                                                                                                                                                                                                                               |
| **Password Storage**          | **argon2id** (memory-hard, resistant to GPU/ASIC attacks).                                                                                                                                                                                                                                                                                                                                                                   |
| **Message Privacy**           | Client-side E2E encryption (X25519 key agreement + AES-256-GCM). Protects against passive eavesdropping and data-at-rest exposure. Does not protect against an actively compromised backend (MITM) -- see [Section 7.4](#74-active-chat-session-real-time-messaging) for details on this accepted trade-off.                                                                                                                 |
| **WebRTC Media**              | DTLS handshake + SRTP encryption. Even TURN relay cannot decrypt.                                                                                                                                                                                                                                                                                                                                                            |
| **TURN Credentials**          | Time-limited HMAC-SHA1 credentials. Generated per-session, delivered in `session:matched` payload.                                                                                                                                                                                                                                                                                                                           |
| **Refresh Token Security**    | `family_id` grouping. Reuse of an old token -> entire family revoked (compromise detection).                                                                                                                                                                                                                                                                                                                                 |
| **Input Validation**          | DTO classes decorated with `class-validator` decorators, validated globally via NestJS's built-in `ValidationPipe`. `whitelist: true` strips unknown properties. `forbidNonWhitelisted: true` rejects requests with unexpected fields.                                                                                                                                                                                       |
| **Rate Limiting (REST)**      | NestJS `ThrottlerGuard` on auth endpoints.                                                                                                                                                                                                                                                                                                                                                                                   |
| **Rate Limiting (WebSocket)** | Per-socket rate limiter on `message:send` and `typing:start` events (e.g., max 30 messages/min, max 5 typing events/5s). Enforced in the gateway using a simple in-memory counter per socket. Exceeding the limit triggers a warning event; repeated violations disconnect the socket.                                                                                                                                       |
| **Abuse Prevention**          | `blocklist` table exclusion in matching (bidirectional). `report` workflow with admin review via `account_action`. Ticket system limits daily usage to 5 sessions. Self-match prevention in `MatchingService`. Concurrent session guard (1 active session per seeker). Idempotency keys on `POST /session/connect` to prevent duplicate sessions from network retries. Single device per account (new socket displaces old). |
| **CORS**                      | Not needed for mobile app (native client). Enabled for the admin dashboard domain (Next.js web portal).                                                                                                                                                                                                                                                                                                                      |

---

## 14. Server Recovery

If the NestJS server crashes or restarts, all WebSocket connections drop. BullMQ delayed jobs (`session:timeout`, `session:grace-end`, etc.) survive because they are backed by Redis -- they will still fire on schedule.

**On startup, the server runs a recovery sweep:**

1. Scan for `session:*` keys in Redis that are still in `active` state.
2. For each, check if both socket mappings (`socket:{id}`) are stale (no live connection).
3. If both parties are gone and the reconnect grace has expired -> end the session (update PostgreSQL, purge Redis keys).
4. If the session is still within its reconnect grace window -> leave it and let the normal `session:reconnect-expire` BullMQ job handle it.
5. **Purge stale `volunteer:pool` entries** -- iterate the `volunteer:pool` set and remove any member whose `socketId` maps to a dead connection (i.e., `socket:{socketId}` key no longer exists in Redis).

The `session:cleanup` cron job (see Section 10) acts as a periodic safety net for any keys missed during the startup sweep.

---

## 15. Scaling Considerations

| Concern                              | Strategy                                                                                                                                                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Multiple NestJS instances**        | Use Redis Adapter for Socket.IO (`@socket.io/redis-adapter`). All instances share the same Redis pub/sub channel -- when instance A receives a message for a user on instance B, Redis pub/sub fans it out. |
| **Redis as single point of failure** | Redis Sentinel or Redis Cluster for HA. BullMQ natively supports Sentinel.                                                                                                                                  |
| **Database connection pooling**      | Prisma manages a connection pool internally. Pool size is configurable via the `connection_limit` parameter in the database URL.                                                                            |
| **COTURN scaling**                   | COTURN is stateless per-session. Scale horizontally by adding more TURN servers and returning multiple `iceServers` URLs to clients.                                                                        |
| **Volunteer pool at scale**          | The Redis Set with `SMEMBERS` is O(n). Fine for hundreds of volunteers. If the pool grows to thousands, restructure to per-specialisation sets (see [Section 9](#9-redis-data-structures) scaling note).    |

---

## 16. Glossary

| Term                     | Meaning                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **User (Seeker)**        | A help seeker — anonymous, identified only by a system-generated nickname (e.g., "BlueFox42"). Initiates sessions.                    |
| **Listener / Volunteer** | A verified volunteer who provides support. Has a real name. Handpicked by admin after verification.                                   |
| **Admin**                | Platform moderator. Separate account (cannot share email with users/volunteers). Uses the web portal, not the mobile app.             |
| **Nickname**             | A unique, system-generated display name assigned to seekers at registration (e.g., "SilentOwl7"). Replaces a real name for anonymity. |
| **Session**              | A time-bounded chat (max 45 min) between one seeker and one volunteer.                                                                |
| **Ticket**               | A consumable token. Each seeker gets 5 per day (UTC). One is spent per session (after grace period).                                  |
| **Grace Period**         | The first 3 minutes of a session during which either party can close without consuming a ticket.                                      |
| **Pool**                 | The Redis set of currently online, available volunteers.                                                                              |
| **SDP**                  | Session Description Protocol -- describes media capabilities for WebRTC.                                                              |
| **ICE**                  | Interactive Connectivity Establishment -- discovers the best network path for WebRTC.                                                 |
| **STUN**                 | Session Traversal Utilities for NAT -- discovers public IP.                                                                           |
| **TURN**                 | Traversal Using Relays around NAT -- relays media when direct connection fails.                                                       |
| **BullMQ**               | A Node.js job queue backed by Redis, used for async task processing.                                                                  |
| **E2EE**                 | End-to-End Encryption -- only sender and receiver can read the content.                                                               |
| **RBAC**                 | Role-Based Access Control -- permissions are assigned to roles, roles to users.                                                       |
| **JWT**                  | JSON Web Token -- stateless authentication token carrying user claims.                                                                |
| **Prisma**               | Type-safe ORM for Node.js/TypeScript, used for all PostgreSQL interactions.                                                           |
| **class-validator**      | Decorator-based validation library for TypeScript classes, used with NestJS's `ValidationPipe` for request DTO validation.            |
| **X25519**               | Elliptic-curve Diffie-Hellman key agreement used for E2E encryption key exchange.                                                     |
| **AES-256-GCM**          | Symmetric encryption cipher used for encrypting message content after key agreement.                                                  |
| **HSETNX**               | Redis command: set a hash field only if it does not already exist. Used for atomic claims.                                            |
