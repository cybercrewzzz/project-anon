import type { AccountListItem, AccountDetail } from "@/types";

export const mockAccounts: AccountListItem[] = [
  {
    accountId: "acc-00000001-1111-4000-a000-000000000001",
    email: "admin@mindbridge.lk",
    name: "Super Admin",
    nickname: "admin",
    status: "active",
    createdAt: "2025-01-15T08:00:00Z",
    roles: ["admin", "user"],
  },
  {
    accountId: "acc-00000002-2222-4000-a000-000000000002",
    email: "kamal@example.com",
    name: "Kamal Perera",
    nickname: "kamal_p",
    status: "active",
    createdAt: "2025-06-10T09:30:00Z",
    roles: ["user"],
  },
  {
    accountId: "acc-00000003-3333-4000-a000-000000000003",
    email: "nimal@example.com",
    name: "Nimal Silva",
    nickname: "nimal_s",
    status: "suspended",
    createdAt: "2025-07-20T14:00:00Z",
    roles: ["user"],
  },
  {
    accountId: "acc-00000004-4444-4000-a000-000000000004",
    email: "tharushi@example.com",
    name: "Tharushi Bandara",
    nickname: "tharushi_b",
    status: "active",
    createdAt: "2025-08-05T11:15:00Z",
    roles: ["user", "volunteer"],
  },
  {
    accountId: "acc-00000005-5555-4000-a000-000000000005",
    email: "ashan@example.com",
    name: "Ashan Rajapaksha",
    nickname: "ashan_r",
    status: "active",
    createdAt: "2025-09-12T07:45:00Z",
    roles: ["user", "volunteer"],
  },
  {
    accountId: "acc-00000006-6666-4000-a000-000000000006",
    email: "chaminda@example.com",
    name: "Chaminda Vaas",
    nickname: "chaminda_v",
    status: "banned",
    createdAt: "2025-10-01T16:30:00Z",
    roles: ["user"],
  },
  {
    accountId: "acc-00000007-7777-4000-a000-000000000007",
    email: "nethmi@example.com",
    name: "Nethmi Wickramasinghe",
    nickname: "nethmi_w",
    status: "active",
    createdAt: "2025-11-18T10:00:00Z",
    roles: ["user", "volunteer"],
  },
  {
    accountId: "acc-00000008-8888-4000-a000-000000000008",
    email: "kasun@example.com",
    name: "Kasun Dissanayake",
    nickname: "kasun_d",
    status: "active",
    createdAt: "2025-12-03T13:20:00Z",
    roles: ["user", "volunteer"],
  },
  {
    accountId: "acc-00000009-9999-4000-a000-000000000009",
    email: "sandun@example.com",
    name: "Sandun Perera",
    nickname: "sandun_p",
    status: "deleted",
    createdAt: "2025-04-22T08:00:00Z",
    roles: ["user"],
  },
  {
    accountId: "acc-0000000a-aaaa-4000-a000-00000000000a",
    email: "dineth@example.com",
    name: "Dineth Pathirana",
    nickname: "dineth_pa",
    status: "active",
    createdAt: "2026-01-10T09:00:00Z",
    roles: ["user"],
  },
  {
    accountId: "acc-0000000b-bbbb-4000-a000-00000000000b",
    email: "imalsha@example.com",
    name: "Imalsha Gunawardena",
    nickname: "imalsha_g",
    status: "active",
    createdAt: "2026-02-14T15:45:00Z",
    roles: ["user", "volunteer"],
  },
];

export const mockAccountDetails: AccountDetail[] = [
  {
    ...mockAccounts[2], // Nimal Silva - suspended
    ageRange: "range_21_26",
    gender: "male",
    updatedAt: "2026-03-10T09:00:00Z",
    actionsReceived: [
      {
        actionId: "act-00000001-1111-4000-a000-000000000001",
        actionType: "suspend",
        reason: "Repeated harassment in chat sessions.",
        createdAt: "2026-03-10T09:00:00Z",
        expiresAt: "2026-04-10T09:00:00Z",
        admin: {
          accountId: "acc-00000001-1111-4000-a000-000000000001",
          email: "admin@mindbridge.lk",
        },
      },
      {
        actionId: "act-00000002-2222-4000-a000-000000000002",
        actionType: "warning",
        reason: "First offense — inappropriate language.",
        createdAt: "2026-02-20T14:00:00Z",
        expiresAt: null,
        admin: {
          accountId: "acc-00000001-1111-4000-a000-000000000001",
          email: "admin@mindbridge.lk",
        },
      },
    ],
    reportsReceived: [
      {
        reportId: "a1b2c3d4-1111-4000-a000-000000000001",
        category: "harassment",
        status: "pending",
        reportedAt: "2026-03-13T14:30:00Z",
      },
      {
        reportId: "a1b2c3d4-6666-4000-a000-000000000006",
        category: "harassment",
        status: "pending",
        reportedAt: "2026-03-14T07:10:00Z",
      },
    ],
    reportsFiled: [],
  },
  {
    ...mockAccounts[5], // Chaminda Vaas - banned
    ageRange: "range_27_plus",
    gender: "male",
    updatedAt: "2026-03-12T11:00:00Z",
    actionsReceived: [
      {
        actionId: "act-00000003-3333-4000-a000-000000000003",
        actionType: "ban",
        reason: "Severe policy violations — sharing harmful content.",
        createdAt: "2026-03-12T11:00:00Z",
        expiresAt: null,
        admin: {
          accountId: "acc-00000001-1111-4000-a000-000000000001",
          email: "admin@mindbridge.lk",
        },
      },
      {
        actionId: "act-00000004-4444-4000-a000-000000000004",
        actionType: "suspend",
        reason: "Spamming promotional links.",
        createdAt: "2026-02-15T10:00:00Z",
        expiresAt: "2026-03-15T10:00:00Z",
        admin: {
          accountId: "acc-00000001-1111-4000-a000-000000000001",
          email: "admin@mindbridge.lk",
        },
      },
      {
        actionId: "act-00000005-5555-4000-a000-000000000005",
        actionType: "warning",
        reason: "Minor language issue in session.",
        createdAt: "2026-01-10T08:00:00Z",
        expiresAt: null,
        admin: {
          accountId: "acc-00000001-1111-4000-a000-000000000001",
          email: "admin@mindbridge.lk",
        },
      },
    ],
    reportsReceived: [
      {
        reportId: "a1b2c3d4-3333-4000-a000-000000000003",
        category: "inappropriate_content",
        status: "resolved",
        reportedAt: "2026-03-10T08:45:00Z",
      },
    ],
    reportsFiled: [
      {
        reportId: "a1b2c3d4-4444-4000-a000-000000000004",
        category: "impersonation",
        status: "dismissed",
        reportedAt: "2026-03-09T16:20:00Z",
      },
    ],
  },
  {
    ...mockAccounts[3], // Tharushi Bandara - active volunteer
    ageRange: "range_21_26",
    gender: "female",
    updatedAt: "2026-03-01T12:00:00Z",
    actionsReceived: [],
    reportsReceived: [],
    reportsFiled: [
      {
        reportId: "a1b2c3d4-2222-4000-a000-000000000002",
        category: "spam",
        status: "reviewing",
        reportedAt: "2026-03-12T10:15:00Z",
      },
    ],
  },
];
