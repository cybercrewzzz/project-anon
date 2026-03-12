import 'dotenv/config';
import { createHash } from 'crypto';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import * as argon2 from 'argon2';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Generate a deterministic UUID from a descriptive seed name.
 * Ensures the seed script is fully idempotent on re-runs.
 */
function seedUuid(name: string): string {
  const hash = createHash('sha256').update(`seed:${name}`).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8).toString(16) +
      hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-');
}

async function main() {
  // Generate a real argon2id hash for all seeded accounts
  // Test password: Password123!
  const testPasswordHash = await argon2.hash('Password123!', {
    type: argon2.argon2id,
  });
  // ─── Languages ──────────────────────────────────────────────────────────────
  const english = await prisma.language.upsert({
    where: { code: 'en' },
    update: {},
    create: { code: 'en', name: 'English' },
  });

  const thai = await prisma.language.upsert({
    where: { code: 'th' },
    update: {},
    create: { code: 'th', name: 'Thai' },
  });

  const japanese = await prisma.language.upsert({
    where: { code: 'ja' },
    update: {},
    create: { code: 'ja', name: 'Japanese' },
  });

  const chinese = await prisma.language.upsert({
    where: { code: 'zh' },
    update: {},
    create: { code: 'zh', name: 'Chinese' },
  });

  // ─── Roles ──────────────────────────────────────────────────────────────────
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'System administrator' },
  });

  const volunteerRole = await prisma.role.upsert({
    where: { name: 'volunteer' },
    update: {},
    create: { name: 'volunteer', description: 'Volunteer listener' },
  });

  const seekerRole = await prisma.role.upsert({
    where: { name: 'seeker' },
    update: {},
    create: { name: 'seeker', description: 'Help seeker' },
  });

  // ─── Permissions ────────────────────────────────────────────────────────────
  const permissions = await Promise.all(
    [
      {
        name: 'manage_users',
        description: 'Create, update, delete user accounts',
      },
      { name: 'manage_roles', description: 'Assign and revoke roles' },
      { name: 'review_reports', description: 'Review and resolve reports' },
      {
        name: 'review_verifications',
        description: 'Review volunteer verifications',
      },
      {
        name: 'moderate_sessions',
        description: 'View and moderate chat sessions',
      },
      {
        name: 'view_analytics',
        description: 'View platform analytics and metrics',
      },
      { name: 'create_problem', description: 'Create a new problem request' },
      { name: 'join_session', description: 'Join chat sessions as listener' },
    ].map((p) =>
      prisma.permission.upsert({
        where: { name: p.name },
        update: {},
        create: p,
      }),
    ),
  );

  const permByName = Object.fromEntries(permissions.map((p) => [p.name, p]));

  // ─── Role ↔ Permission mappings ─────────────────────────────────────────────
  const adminPermissions = [
    'manage_users',
    'manage_roles',
    'review_reports',
    'review_verifications',
    'moderate_sessions',
    'view_analytics',
  ];
  const volunteerPermissions = ['join_session'];
  const seekerPermissions = ['create_problem'];

  for (const pName of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.roleId,
          permissionId: permByName[pName].permissionId,
        },
      },
      update: {},
      create: {
        roleId: adminRole.roleId,
        permissionId: permByName[pName].permissionId,
      },
    });
  }

  for (const pName of volunteerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: volunteerRole.roleId,
          permissionId: permByName[pName].permissionId,
        },
      },
      update: {},
      create: {
        roleId: volunteerRole.roleId,
        permissionId: permByName[pName].permissionId,
      },
    });
  }

  for (const pName of seekerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: seekerRole.roleId,
          permissionId: permByName[pName].permissionId,
        },
      },
      update: {},
      create: {
        roleId: seekerRole.roleId,
        permissionId: permByName[pName].permissionId,
      },
    });
  }

  // ─── Categories ─────────────────────────────────────────────────────────────
  const categories = await Promise.all(
    [
      {
        name: 'Anxiety',
        description: 'Feelings of worry, nervousness, or unease',
      },
      {
        name: 'Depression',
        description: 'Persistent sadness or loss of interest',
      },
      {
        name: 'Relationships',
        description: 'Issues with personal relationships',
      },
      {
        name: 'Academic Stress',
        description: 'Stress related to studies or exams',
      },
      {
        name: 'Loneliness',
        description: 'Feelings of isolation or being alone',
      },
      {
        name: 'Self-esteem',
        description: 'Issues with self-worth or confidence',
      },
      {
        name: 'Family Issues',
        description: 'Problems related to family dynamics',
      },
      { name: 'Other', description: 'Topics not covered by other categories' },
    ].map((c) =>
      prisma.category.upsert({
        where: { name: c.name },
        update: {},
        create: c,
      }),
    ),
  );

  // ─── Specialisations ───────────────────────────────────────────────────────
  const specialisations = await Promise.all(
    [
      {
        name: 'Active Listening',
        description: 'Skilled in empathetic and active listening',
      },
      {
        name: 'Anxiety Support',
        description: 'Experience supporting people with anxiety',
      },
      {
        name: 'Depression Support',
        description: 'Experience supporting people with depression',
      },
      {
        name: 'Grief Counselling',
        description: 'Supporting people through loss and grief',
      },
      {
        name: 'Academic Guidance',
        description: 'Helping with academic-related stress',
      },
    ].map((s) =>
      prisma.specialisation.upsert({
        where: { name: s.name },
        update: {},
        create: s,
      }),
    ),
  );

  // ─── Accounts ───────────────────────────────────────────────────────────────
  const adminAccount = await prisma.account.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: testPasswordHash,
      name: 'Admin User',
      nickname: 'admin',
      dateOfBirth: new Date('1990-01-15'),
      gender: 'prefer_not_to_say',
      interfaceLanguageId: english.languageId,
      status: 'active',
    },
  });

  const volunteer1 = await prisma.account.upsert({
    where: { email: 'volunteer1@example.com' },
    update: {},
    create: {
      email: 'volunteer1@example.com',
      passwordHash: testPasswordHash,
      name: 'Alice Volunteer',
      nickname: 'alice_v',
      dateOfBirth: new Date('1998-05-20'),
      gender: 'female',
      interfaceLanguageId: english.languageId,
      status: 'active',
    },
  });

  const volunteer2 = await prisma.account.upsert({
    where: { email: 'volunteer2@example.com' },
    update: {},
    create: {
      email: 'volunteer2@example.com',
      passwordHash: testPasswordHash,
      name: 'Bob Volunteer',
      nickname: 'bob_v',
      dateOfBirth: new Date('1997-08-10'),
      gender: 'male',
      interfaceLanguageId: thai.languageId,
      status: 'active',
    },
  });

  const seeker1 = await prisma.account.upsert({
    where: { email: 'seeker1@example.com' },
    update: {},
    create: {
      email: 'seeker1@example.com',
      passwordHash: testPasswordHash,
      name: 'Charlie Seeker',
      nickname: 'charlie_s',
      dateOfBirth: new Date('2000-03-25'),
      gender: 'male',
      interfaceLanguageId: english.languageId,
      status: 'active',
    },
  });

  const seeker2 = await prisma.account.upsert({
    where: { email: 'seeker2@example.com' },
    update: {},
    create: {
      email: 'seeker2@example.com',
      passwordHash: testPasswordHash,
      name: 'Dana Seeker',
      nickname: 'dana_s',
      dateOfBirth: new Date('2001-11-05'),
      gender: 'female',
      interfaceLanguageId: thai.languageId,
      status: 'active',
    },
  });

  // ─── Account Roles ──────────────────────────────────────────────────────────
  await prisma.accountRole.upsert({
    where: {
      accountId_roleId: {
        accountId: adminAccount.accountId,
        roleId: adminRole.roleId,
      },
    },
    update: {},
    create: {
      accountId: adminAccount.accountId,
      roleId: adminRole.roleId,
    },
  });

  await prisma.accountRole.upsert({
    where: {
      accountId_roleId: {
        accountId: volunteer1.accountId,
        roleId: volunteerRole.roleId,
      },
    },
    update: {},
    create: {
      accountId: volunteer1.accountId,
      roleId: volunteerRole.roleId,
      assignedBy: adminAccount.accountId,
    },
  });

  await prisma.accountRole.upsert({
    where: {
      accountId_roleId: {
        accountId: volunteer2.accountId,
        roleId: volunteerRole.roleId,
      },
    },
    update: {},
    create: {
      accountId: volunteer2.accountId,
      roleId: volunteerRole.roleId,
      assignedBy: adminAccount.accountId,
    },
  });

  await prisma.accountRole.upsert({
    where: {
      accountId_roleId: {
        accountId: seeker1.accountId,
        roleId: seekerRole.roleId,
      },
    },
    update: {},
    create: {
      accountId: seeker1.accountId,
      roleId: seekerRole.roleId,
    },
  });

  await prisma.accountRole.upsert({
    where: {
      accountId_roleId: {
        accountId: seeker2.accountId,
        roleId: seekerRole.roleId,
      },
    },
    update: {},
    create: {
      accountId: seeker2.accountId,
      roleId: seekerRole.roleId,
    },
  });

  // ─── Account Languages ──────────────────────────────────────────────────────
  const languagePairs: { accountId: string; languageId: string }[] = [
    { accountId: adminAccount.accountId, languageId: english.languageId },
    { accountId: adminAccount.accountId, languageId: thai.languageId },
    { accountId: volunteer1.accountId, languageId: english.languageId },
    { accountId: volunteer1.accountId, languageId: japanese.languageId },
    { accountId: volunteer2.accountId, languageId: thai.languageId },
    { accountId: volunteer2.accountId, languageId: english.languageId },
    { accountId: seeker1.accountId, languageId: english.languageId },
    { accountId: seeker2.accountId, languageId: thai.languageId },
    { accountId: seeker2.accountId, languageId: chinese.languageId },
  ];

  for (const pair of languagePairs) {
    await prisma.accountLanguage.upsert({
      where: {
        accountId_languageId: {
          accountId: pair.accountId,
          languageId: pair.languageId,
        },
      },
      update: {},
      create: pair,
    });
  }

  // ─── Volunteer Profiles ─────────────────────────────────────────────────────
  await prisma.volunteerProfile.upsert({
    where: { accountId: volunteer1.accountId },
    update: {},
    create: {
      accountId: volunteer1.accountId,
      instituteEmail: 'alice@university.edu',
      instituteName: 'University of Example',
      studentId: 'STU-2024-001',
      grade: 'Senior',
      about: 'Passionate about mental health support and peer counselling.',
      verificationStatus: 'approved',
      isAvailable: true,
    },
  });

  await prisma.volunteerProfile.upsert({
    where: { accountId: volunteer2.accountId },
    update: {},
    create: {
      accountId: volunteer2.accountId,
      instituteEmail: 'bob@university.edu',
      instituteName: 'Bangkok University',
      studentId: 'STU-2024-042',
      grade: 'Junior',
      about:
        'Experienced in active listening and stress management techniques.',
      verificationStatus: 'approved',
      isAvailable: false,
    },
  });

  // ─── Volunteer Experience ───────────────────────────────────────────────────
  await prisma.volunteerExperience.upsert({
    where: { accountId: volunteer1.accountId },
    update: {},
    create: {
      accountId: volunteer1.accountId,
      points: 250,
      level: 3,
    },
  });

  await prisma.volunteerExperience.upsert({
    where: { accountId: volunteer2.accountId },
    update: {},
    create: {
      accountId: volunteer2.accountId,
      points: 80,
      level: 1,
    },
  });

  // ─── Volunteer Specialisations ──────────────────────────────────────────────
  const volSpecPairs = [
    {
      accountId: volunteer1.accountId,
      specialisationId: specialisations[0].specialisationId,
    },
    {
      accountId: volunteer1.accountId,
      specialisationId: specialisations[1].specialisationId,
    },
    {
      accountId: volunteer1.accountId,
      specialisationId: specialisations[2].specialisationId,
    },
    {
      accountId: volunteer2.accountId,
      specialisationId: specialisations[0].specialisationId,
    },
    {
      accountId: volunteer2.accountId,
      specialisationId: specialisations[4].specialisationId,
    },
  ];

  for (const pair of volSpecPairs) {
    await prisma.volunteerSpecialisation.upsert({
      where: {
        accountId_specialisationId: {
          accountId: pair.accountId,
          specialisationId: pair.specialisationId,
        },
      },
      update: {},
      create: pair,
    });
  }

  // ─── Volunteer Verifications ────────────────────────────────────────────────
  await prisma.volunteerVerification.upsert({
    where: { requestId: seedUuid('verification-volunteer1') },
    update: {},
    create: {
      requestId: seedUuid('verification-volunteer1'),
      volunteerId: volunteer1.accountId,
      documentUrl: 'https://storage.example.com/docs/alice_student_id.pdf',
      status: 'approved',
      adminNotes: 'Student ID verified successfully.',
      reviewedBy: adminAccount.accountId,
      reviewedAt: new Date('2025-01-10'),
    },
  });

  await prisma.volunteerVerification.upsert({
    where: { requestId: seedUuid('verification-volunteer2') },
    update: {},
    create: {
      requestId: seedUuid('verification-volunteer2'),
      volunteerId: volunteer2.accountId,
      documentUrl: 'https://storage.example.com/docs/bob_student_id.pdf',
      status: 'approved',
      adminNotes: 'Verified via institute email confirmation.',
      reviewedBy: adminAccount.accountId,
      reviewedAt: new Date('2025-02-15'),
    },
  });

  // ─── User Problems ─────────────────────────────────────────────────────────
  const problem1 = await prisma.userProblem.upsert({
    where: { problemId: seedUuid('problem-seeker1-anxiety') },
    update: {},
    create: {
      problemId: seedUuid('problem-seeker1-anxiety'),
      accountId: seeker1.accountId,
      categoryId: categories[0].categoryId, // Anxiety
      feelingLevel: 7,
      status: 'matched',
    },
  });

  const problem2 = await prisma.userProblem.upsert({
    where: { problemId: seedUuid('problem-seeker2-academic-stress') },
    update: {},
    create: {
      problemId: seedUuid('problem-seeker2-academic-stress'),
      accountId: seeker2.accountId,
      categoryId: categories[3].categoryId, // Academic Stress
      customCategoryLabel: 'Final exam pressure',
      feelingLevel: 8,
      status: 'matched',
    },
  });

  await prisma.userProblem.upsert({
    where: { problemId: seedUuid('problem-seeker1-loneliness') },
    update: {},
    create: {
      problemId: seedUuid('problem-seeker1-loneliness'),
      accountId: seeker1.accountId,
      categoryId: categories[4].categoryId, // Loneliness
      feelingLevel: 5,
      status: 'waiting',
    },
  });

  // ─── Chat Sessions ─────────────────────────────────────────────────────────
  const session1 = await prisma.chatSession.upsert({
    where: { sessionId: seedUuid('session-seeker1-volunteer1') },
    update: {},
    create: {
      sessionId: seedUuid('session-seeker1-volunteer1'),
      seekerId: seeker1.accountId,
      listenerId: volunteer1.accountId,
      problemId: problem1.problemId,
      status: 'completed',
      endedAt: new Date(Date.now() - 3600_000), // 1 hour ago
      userRating: 5,
      volunteerRating: 4,
      starredByUser: true,
    },
  });

  await prisma.chatSession.upsert({
    where: { sessionId: seedUuid('session-seeker2-volunteer2') },
    update: {},
    create: {
      sessionId: seedUuid('session-seeker2-volunteer2'),
      seekerId: seeker2.accountId,
      listenerId: volunteer2.accountId,
      problemId: problem2.problemId,
      status: 'active',
    },
  });

  // ─── Reports ────────────────────────────────────────────────────────────────
  const report = await prisma.report.upsert({
    where: { reportId: seedUuid('report-session1') },
    update: {},
    create: {
      reportId: seedUuid('report-session1'),
      sessionId: session1.sessionId,
      reporterId: seeker1.accountId,
      reportedId: volunteer1.accountId,
      category: 'other',
      description: 'Test report for seed data - not a real report.',
      status: 'resolved',
      resolvedAt: new Date(),
    },
  });

  // ─── Account Actions ────────────────────────────────────────────────────────
  await prisma.accountAction.upsert({
    where: { actionId: seedUuid('action-report1-warning') },
    update: {},
    create: {
      actionId: seedUuid('action-report1-warning'),
      accountId: volunteer1.accountId,
      adminId: adminAccount.accountId,
      reportId: report.reportId,
      actionType: 'warning',
      reason: 'Seed data: example warning action.',
    },
  });

  // ─── Blocklist ──────────────────────────────────────────────────────────────
  await prisma.blocklist.upsert({
    where: {
      blockerId_blockedId: {
        blockerId: seeker1.accountId,
        blockedId: seeker2.accountId,
      },
    },
    update: {},
    create: {
      blockerId: seeker1.accountId,
      blockedId: seeker2.accountId,
    },
  });

  // ─── Device Tokens ─────────────────────────────────────────────────────────
  await prisma.deviceToken.upsert({
    where: { deviceId: seedUuid('device-seeker1-ios') },
    update: {},
    create: {
      deviceId: seedUuid('device-seeker1-ios'),
      accountId: seeker1.accountId,
      fcmToken: 'fake-fcm-token-seeker1-ios',
      platform: 'ios',
    },
  });

  await prisma.deviceToken.upsert({
    where: { deviceId: seedUuid('device-volunteer1-android') },
    update: {},
    create: {
      deviceId: seedUuid('device-volunteer1-android'),
      accountId: volunteer1.accountId,
      fcmToken: 'fake-fcm-token-volunteer1-android',
      platform: 'android',
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
