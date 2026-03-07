> ⚠️ **Note: This architecture is subject to change without prior notice and may be outdated or not relevant as development progresses.**

# 🗄️ Database Architecture & Relations

This document outlines the database tables for our privacy-first emotional support application. It explains exactly what each table does and how they connect.

## 🔐 Core Identity & Access Control

**1️⃣ Account**
💡 **What this is for:** The master table for EVERYONE. Seekers, Volunteers, and Admins all live here. It stores auth details and demographics. Seekers use auto-generated `nickname`s to stay anonymous.

- `account_id` (PK)
- `email` (UNIQUE)
- `password_hash` (nullable)
- `oauth_provider`, `oauth_id` (nullable, for Google/Apple login)
- `name` (nullable, used for Admins/Volunteers)
- `nickname` (UNIQUE, auto-generated for Seekers)
- `date_of_birth`
- `gender`
- `interface_language_id` (FK → Language)
- `status` (active / suspended / banned / deleted)
- `created_at`, `updated_at`, `deleted_at`

**2️⃣ Role**
💡 **What this is for:** Defines the broad categories of users in the system (e.g., "Seeker", "Volunteer", "Admin").

- `role_id` (PK)
- `name` (UNIQUE)
- `description`
- `created_at`

**3️⃣ Permission**
💡 **What this is for:** Defines granular actions a user can take (e.g., `can_ban_users`, `can_accept_chats`).

- `permission_id` (PK)
- `name` (UNIQUE)
- `description`
- `created_at`

**4️⃣ RolePermission**
💡 **What this is for:** Links specific Permissions to a Role (e.g., giving the "Admin" role the `can_ban_users` permission).

- `role_id` (FK → Role)
- `permission_id` (FK → Permission)
- **PK** (`role_id`, `permission_id`)

**5️⃣ AccountRole**
💡 **What this is for:** The bridge table that assigns a Role to an Account. A person can have multiple roles (e.g., someone can be both a "Seeker" and a "Volunteer" at the same time).

- `account_id` (FK → Account)
- `role_id` (FK → Role)
- `assigned_by` (FK → Account)
- `assigned_at`
- **PK** (`account_id`, `role_id`)

**6️⃣ RefreshToken**
💡 **What this is for:** Keeps the user logged in securely on their device without requiring them to type their password every time they open the app.

- `token_id` (PK)
- `account_id` (FK → Account)
- `token_hash`
- `expires_at`
- `is_revoked`
- `family_id`

**7️⃣ DeviceToken**
💡 **What this is for:** Stores the user's phone identifier (FCM Token). The backend uses this to send Push Notifications (e.g., waking up a volunteer's phone when a seeker needs help).

- `device_id` (PK)
- `account_id` (FK → Account)
- `fcm_token`
- `platform` (ios / android / web)
- `last_active_at`

---

## 🌍 Language & Matching

**8️⃣ Language**
💡 **What this is for:** The master list of languages supported by the app (e.g., English, Sinhala, Tamil).

- `language_id` (PK)
- `code` (UNIQUE)
- `name`

**9️⃣ AccountLanguage**
💡 **What this is for:** Tracks which languages a Volunteer actually speaks. Crucial for ensuring Seekers get matched with someone who understands them.

- `account_id` (FK → Account)
- `language_id` (FK → Language)
- **PK** (`account_id`, `language_id`)

---

## 👤 User Context & Problems

**🔟 Category**
💡 **What this is for:** The predefined list of topics a Seeker can choose from when asking for help (e.g., "Academic Stress", "Relationship Issues").

- `category_id` (PK)
- `name` (UNIQUE)
- `description`

**1️⃣1️⃣ UserProblem**
💡 **What this is for:** The actual "Help Ticket" created by a Seeker. This is what the matchmaking algorithm looks at to find the right Volunteer.

- `problem_id` (PK)
- `account_id` (FK → Account - The Seeker)
- `category_id` (FK → Category)
- `custom_category_label` (nullable, for extra description)
- `feeling_level` (1-5)
- `status` (waiting / matched / expired)
- `created_at`

---

## 🎓 Volunteer-Specific Data

**1️⃣2️⃣ VolunteerProfile**
💡 **What this is for:** Holds the volunteer's specific details. The `is_available` toggle here is what allows them to receive incoming chat requests.

- `account_id` (PK, FK → Account)
- `institute_email`, `institute_name`, `student_id`
- `institute_id_image_url`
- `grade`, `about`
- `verification_status` (pending / approved / rejected)
- `is_available` (boolean - Online/Offline toggle)

**1️⃣3️⃣ VolunteerExperience**
💡 **What this is for:** The Gamification engine. Tracks points and levels for volunteers based on successful sessions.

- `account_id` (PK, FK → Account)
- `points`
- `level`
- `last_updated`

**1️⃣4️⃣ Specialisation**
💡 **What this is for:** The predefined list of expert topics (e.g., Grief Counseling, Career Anxiety).

- `specialisation_id` (PK)
- `name` (UNIQUE)
- `description`

**1️⃣5️⃣ VolunteerSpecialisation**
💡 **What this is for:** Links volunteers to specific Specialisations, helping the matching algorithm pair them with the right `UserProblem`.

- `account_id` (FK → Account)
- `specialisation_id` (FK → Specialisation)
- **PK** (`account_id`, `specialisation_id`)

**1️⃣6️⃣ VolunteerVerification**
💡 **What this is for:** The Admin approval queue. When a user applies to be a volunteer, it sits here until an admin reviews their student ID and approves them.

- `request_id` (PK)
- `volunteer_id` (FK → Account)
- `document_url`
- `status` (pending / approved / rejected)
- `admin_notes`
- `reviewed_by` (FK → Account - The Admin)
- `submitted_at`, `reviewed_at`

---

## 💬 Chat Metadata (Privacy-First)

**1️⃣7️⃣ ChatSession**
💡 **What this is for:** The log of the connection. **It DOES NOT store messages.** It only proves that a conversation happened, who was in it, and how long it lasted.

- `session_id` (PK)
- `seeker_id` (FK → Account)
- `listener_id` (FK → Account, nullable until matched)
- `problem_id` (FK → UserProblem)
- `started_at`
- `ended_at`
- `user_rating` (1-5, nullable)
- `volunteer_rating` (1-5, nullable)
- `starred_by_user` (boolean)
- `status` (active / completed / cancelled_disconnect / etc.)
- `closed_reason`

---

## 🛡️ Moderation & Safety

**1️⃣8️⃣ Report**
💡 **What this is for:** Allows a user to flag bad behavior during a chat. Links the accuser, the accused, and the specific session where the offense occurred.

- `report_id` (PK)
- `session_id` (FK → ChatSession)
- `reporter_id` (FK → Account)
- `reported_id` (FK → Account)
- `category` (harassment / spam / etc.)
- `description`
- `status` (pending / reviewing / resolved / dismissed)
- `reported_at`, `resolved_at`

**1️⃣9️⃣ AccountAction**
💡 **What this is for:** The Admin's disciplinary log. If a report is valid, the admin creates an action here to mute, suspend, or ban the bad actor.

- `action_id` (PK)
- `account_id` (FK → Account - The offender)
- `admin_id` (FK → Account - The punisher)
- `report_id` (FK → Report, nullable)
- `action_type` (warning / mute / suspend / ban)
- `reason`
- `created_at`, `expires_at`

**2️⃣0️⃣ Blocklist**
💡 **What this is for:** Personal boundaries. If Seeker A blocks Volunteer B, this table ensures the matchmaking engine NEVER puts them in a session together again.

- `blocker_id` (FK → Account)
- `blocked_id` (FK → Account)
- `blocked_at`
- **PK** (`blocker_id`, `blocked_id`)
