## Summary

This PR implements the report and block functionality for the backend service, enabling privacy-first moderation and user safety features for chat sessions.

---

## Tasks Closed

- DEV-91: Implement Report and Block Endpoints

---

## Details

- Added endpoints for users and volunteers to submit abuse reports for a session.
- Added endpoints for users to block and unblock other users, ensuring bidirectional exclusion in matchmaking.
- Integrated `ReportsModule` and `BlocksModule` into the application.
- Added/updated tests for report and block logic.

---

## Endpoints Summary

| Endpoint URL | HTTP Method | Description |
|---|---|---|
| `/v1/report` | `POST` | Submit abuse report for a session |
| `/v1/block` | `POST` | Block another user |
| `/v1/block/:blockedId` | `DELETE` | Unblock a user |
| `/v1/block` | `GET` | List all users blocked by current user |

## Changes Made

### Created
- `backend/src/reports/reports.module.ts`: Module for report functionality.
- `backend/src/reports/reports.controller.ts`: Controller defining the report endpoint.
- `backend/src/reports/reports.service.ts`: Service handling the business logic for submitting reports.
- `backend/src/reports/dto/create-report.dto.ts`: Zod validation schema for report requests.
- `backend/src/reports/reports.controller.spec.ts`: Controller unit tests for report endpoint.
- `backend/src/reports/reports.service.spec.ts`: Service unit tests for report business logic.
- `backend/src/blocks/blocks.module.ts`: Module for block functionality.
- `backend/src/blocks/blocks.controller.ts`: Controller defining the block, unblock, and list endpoints.
- `backend/src/blocks/blocks.service.ts`: Service handling the business logic for blocking users.
- `backend/src/blocks/dto/create-block.dto.ts`: Zod validation schemas for block requests and params.
- `backend/src/blocks/blocks.controller.spec.ts`: Controller unit tests for block endpoints.
- `backend/src/blocks/blocks.service.spec.ts`: Service unit tests for block business logic.

### Modified
- `backend/src/app.module.ts`: Imported `ReportsModule` and `BlocksModule`.

---

## How to Test

### 1. Environment Setup

Open your terminal in the `backend` folder and run the following commands sequentially:

```bash
# Install dependencies
yarn install

# Start the PostgreSQL and Redis containers using Docker
yarn db:start

# Wait a few seconds for the database to be ready, then push the schema
yarn db:push

# Seed the database if necessary
yarn db:seed

# Start the NestJS development server
yarn start:dev
```

### 2. Testing with Postman (or cURL)

*(Assuming you have already logged in and have a valid Access Token).*

#### Step 2.1: Submit a Report
1. Open Postman.
2. Create a new **POST** request to `http://localhost:3000/v1/report`.
3. In Authorization tab, use **Bearer Token** and insert your token.
4. Body payload (JSON):
   ```json
   {
       "sessionId": "<VALID_SESSION_ID>",
       "reportedId": "<VALID_REPORTED_USER_ID>",
       "category": "harassment",
       "description": "They were being rude..."
   }
   ```
5. Click **Send**. Should receive `201 Created` with a `reportId`.

#### Step 2.2: Block a User
1. Create a new **POST** request to `http://localhost:3000/v1/block`.
2. Auth: **Bearer Token**.
3. Body payload (JSON):
   ```json
   {
       "blockedId": "<VALID_USER_ID>"
   }
   ```
4. Click **Send**. Should receive `201 Created` with `{"message": "User blocked"}`.

#### Step 2.3: List Blocked Users
1. Create a new **GET** request to `http://localhost:3000/v1/block`.
2. Auth: **Bearer Token**.
3. Click **Send**. Returns `200 OK` with `{"data": [{"blockedId": "...", "blockedAt": "..."}]}`.

#### Step 2.4: Unblock a User
1. Create a new **DELETE** request to `http://localhost:3000/v1/block/<VALID_USER_ID>`.
2. Auth: **Bearer Token**.
3. Click **Send**. Should receive `200 OK` with `{"message": "User unblocked"}`.
