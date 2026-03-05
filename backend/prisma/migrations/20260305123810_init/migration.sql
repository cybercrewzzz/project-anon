/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'suspended', 'banned', 'deleted');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "UserProblemStatus" AS ENUM ('waiting', 'matched', 'expired');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('active', 'completed', 'cancelled_grace', 'cancelled_timeout', 'cancelled_disconnect', 'cancelled_admin');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('warning', 'mute', 'suspend', 'ban');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('harassment', 'spam', 'inappropriate_content', 'impersonation', 'other');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('ios', 'android', 'web');

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "account" (
    "account_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "oauth_provider" VARCHAR(50),
    "oauth_id" VARCHAR(255),
    "name" VARCHAR(100),
    "nickname" VARCHAR(50),
    "date_of_birth" DATE NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'prefer_not_to_say',
    "interface_language_id" UUID,
    "status" "AccountStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "account_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "role" (
    "role_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "permission" (
    "permission_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "account_role" (
    "account_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_by" UUID,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_role_pkey" PRIMARY KEY ("account_id","role_id")
);

-- CreateTable
CREATE TABLE "account_action" (
    "action_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "report_id" UUID,
    "action_type" "ActionType" NOT NULL,
    "reason" VARCHAR(300),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "account_action_pkey" PRIMARY KEY ("action_id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "token_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "family_id" UUID NOT NULL,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("token_id")
);

-- CreateTable
CREATE TABLE "device_token" (
    "device_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "fcm_token" VARCHAR(255) NOT NULL,
    "platform" "Platform" NOT NULL,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_token_pkey" PRIMARY KEY ("device_id")
);

-- CreateTable
CREATE TABLE "language" (
    "language_id" UUID NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "language_pkey" PRIMARY KEY ("language_id")
);

-- CreateTable
CREATE TABLE "account_language" (
    "account_id" UUID NOT NULL,
    "language_id" UUID NOT NULL,

    CONSTRAINT "account_language_pkey" PRIMARY KEY ("account_id","language_id")
);

-- CreateTable
CREATE TABLE "category" (
    "category_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(200),

    CONSTRAINT "category_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "user_problem" (
    "problem_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "custom_category_label" VARCHAR(100),
    "feeling_level" SMALLINT NOT NULL,
    "status" "UserProblemStatus" NOT NULL DEFAULT 'waiting',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_problem_pkey" PRIMARY KEY ("problem_id")
);

-- CreateTable
CREATE TABLE "volunteer_profile" (
    "account_id" UUID NOT NULL,
    "institute_email" VARCHAR(255),
    "institute_name" VARCHAR(100),
    "student_id" VARCHAR(50),
    "institute_id_image_url" TEXT,
    "grade" VARCHAR(20),
    "about" VARCHAR(500),
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "is_available" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "volunteer_profile_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "volunteer_experience" (
    "account_id" UUID NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" SMALLINT NOT NULL DEFAULT 1,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteer_experience_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "specialisation" (
    "specialisation_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(300),

    CONSTRAINT "specialisation_pkey" PRIMARY KEY ("specialisation_id")
);

-- CreateTable
CREATE TABLE "volunteer_specialisation" (
    "account_id" UUID NOT NULL,
    "specialisation_id" UUID NOT NULL,

    CONSTRAINT "volunteer_specialisation_pkey" PRIMARY KEY ("account_id","specialisation_id")
);

-- CreateTable
CREATE TABLE "volunteer_verification" (
    "request_id" UUID NOT NULL,
    "volunteer_id" UUID NOT NULL,
    "document_url" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "admin_notes" VARCHAR(300),
    "reviewed_by" UUID,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "volunteer_verification_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "chat_session" (
    "session_id" UUID NOT NULL,
    "seeker_id" UUID NOT NULL,
    "listener_id" UUID,
    "problem_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "user_rating" SMALLINT,
    "volunteer_rating" SMALLINT,
    "starred_by_user" BOOLEAN NOT NULL DEFAULT false,
    "status" "SessionStatus" NOT NULL DEFAULT 'active',
    "closed_reason" VARCHAR(50),

    CONSTRAINT "chat_session_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "report" (
    "report_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "reported_id" UUID NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "description" VARCHAR(500),
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "report_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "blocklist" (
    "blocker_id" UUID NOT NULL,
    "blocked_id" UUID NOT NULL,
    "blocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocklist_pkey" PRIMARY KEY ("blocker_id","blocked_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_email_key" ON "account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "account_nickname_key" ON "account"("nickname");

-- CreateIndex
CREATE INDEX "account_status_idx" ON "account"("status");

-- CreateIndex
CREATE INDEX "account_interface_language_id_idx" ON "account"("interface_language_id");

-- CreateIndex
CREATE INDEX "account_oauth_provider_oauth_id_idx" ON "account"("oauth_provider", "oauth_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_oauth_provider_oauth_id_key" ON "account"("oauth_provider", "oauth_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permission_name_key" ON "permission"("name");

-- CreateIndex
CREATE INDEX "role_permission_permission_id_idx" ON "role_permission"("permission_id");

-- CreateIndex
CREATE INDEX "account_role_role_id_idx" ON "account_role"("role_id");

-- CreateIndex
CREATE INDEX "account_role_assigned_by_idx" ON "account_role"("assigned_by");

-- CreateIndex
CREATE INDEX "account_action_account_id_idx" ON "account_action"("account_id");

-- CreateIndex
CREATE INDEX "account_action_admin_id_idx" ON "account_action"("admin_id");

-- CreateIndex
CREATE INDEX "account_action_report_id_idx" ON "account_action"("report_id");

-- CreateIndex
CREATE INDEX "refresh_token_account_id_idx" ON "refresh_token"("account_id");

-- CreateIndex
CREATE INDEX "refresh_token_family_id_idx" ON "refresh_token"("family_id");

-- CreateIndex
CREATE INDEX "refresh_token_expires_at_idx" ON "refresh_token"("expires_at");

-- CreateIndex
CREATE INDEX "device_token_account_id_idx" ON "device_token"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "language_code_key" ON "language"("code");

-- CreateIndex
CREATE INDEX "account_language_language_id_idx" ON "account_language"("language_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_name_key" ON "category"("name");

-- CreateIndex
CREATE INDEX "user_problem_account_id_idx" ON "user_problem"("account_id");

-- CreateIndex
CREATE INDEX "user_problem_category_id_idx" ON "user_problem"("category_id");

-- CreateIndex
CREATE INDEX "user_problem_status_idx" ON "user_problem"("status");

-- CreateIndex
CREATE INDEX "volunteer_profile_verification_status_idx" ON "volunteer_profile"("verification_status");

-- CreateIndex
CREATE INDEX "volunteer_profile_is_available_idx" ON "volunteer_profile"("is_available");

-- CreateIndex
CREATE UNIQUE INDEX "specialisation_name_key" ON "specialisation"("name");

-- CreateIndex
CREATE INDEX "volunteer_specialisation_specialisation_id_idx" ON "volunteer_specialisation"("specialisation_id");

-- CreateIndex
CREATE INDEX "volunteer_verification_volunteer_id_idx" ON "volunteer_verification"("volunteer_id");

-- CreateIndex
CREATE INDEX "volunteer_verification_status_idx" ON "volunteer_verification"("status");

-- CreateIndex
CREATE INDEX "volunteer_verification_reviewed_by_idx" ON "volunteer_verification"("reviewed_by");

-- CreateIndex
CREATE INDEX "chat_session_seeker_id_idx" ON "chat_session"("seeker_id");

-- CreateIndex
CREATE INDEX "chat_session_listener_id_idx" ON "chat_session"("listener_id");

-- CreateIndex
CREATE INDEX "chat_session_problem_id_idx" ON "chat_session"("problem_id");

-- CreateIndex
CREATE INDEX "chat_session_status_idx" ON "chat_session"("status");

-- CreateIndex
CREATE INDEX "chat_session_started_at_idx" ON "chat_session"("started_at");

-- CreateIndex
CREATE INDEX "report_session_id_idx" ON "report"("session_id");

-- CreateIndex
CREATE INDEX "report_reporter_id_idx" ON "report"("reporter_id");

-- CreateIndex
CREATE INDEX "report_reported_id_idx" ON "report"("reported_id");

-- CreateIndex
CREATE INDEX "report_status_idx" ON "report"("status");

-- CreateIndex
CREATE INDEX "blocklist_blocked_id_idx" ON "blocklist"("blocked_id");

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_interface_language_id_fkey" FOREIGN KEY ("interface_language_id") REFERENCES "language"("language_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("permission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_role" ADD CONSTRAINT "account_role_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_role" ADD CONSTRAINT "account_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_role" ADD CONSTRAINT "account_role_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_action" ADD CONSTRAINT "account_action_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_action" ADD CONSTRAINT "account_action_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_action" ADD CONSTRAINT "account_action_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "report"("report_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_token" ADD CONSTRAINT "device_token_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_language" ADD CONSTRAINT "account_language_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_language" ADD CONSTRAINT "account_language_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "language"("language_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_problem" ADD CONSTRAINT "user_problem_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_problem" ADD CONSTRAINT "user_problem_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_profile" ADD CONSTRAINT "volunteer_profile_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_experience" ADD CONSTRAINT "volunteer_experience_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_specialisation" ADD CONSTRAINT "volunteer_specialisation_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_specialisation" ADD CONSTRAINT "volunteer_specialisation_specialisation_id_fkey" FOREIGN KEY ("specialisation_id") REFERENCES "specialisation"("specialisation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_verification" ADD CONSTRAINT "volunteer_verification_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_verification" ADD CONSTRAINT "volunteer_verification_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_session" ADD CONSTRAINT "chat_session_seeker_id_fkey" FOREIGN KEY ("seeker_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_session" ADD CONSTRAINT "chat_session_listener_id_fkey" FOREIGN KEY ("listener_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_session" ADD CONSTRAINT "chat_session_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "user_problem"("problem_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_session"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_reported_id_fkey" FOREIGN KEY ("reported_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocklist" ADD CONSTRAINT "blocklist_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocklist" ADD CONSTRAINT "blocklist_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;
