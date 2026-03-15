// ── Auth & Dashboard ─────────────────────────────────────────────

export interface DashboardStats {
  totalAccounts: number;
  totalVolunteers: number;
  activeVolunteers: number;
  sessionsToday: number;
  pendingReports: number;
  pendingApplications: number;
}

// ── Enums ────────────────────────────────────────────────────────

export type AccountStatus = "active" | "suspended" | "banned" | "deleted";
export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";
export type SessionStatus =
  | "active"
  | "completed"
  | "cancelled_grace"
  | "cancelled_timeout"
  | "cancelled_disconnect"
  | "cancelled_admin";
export type VerificationStatus = "pending" | "approved" | "rejected";
export type ActionType = "warning" | "mute" | "suspend" | "ban";

// ── Reports ──────────────────────────────────────────────────────

export interface ReportListItem {
  reportId: string;
  category: string;
  status: ReportStatus;
  reportedAt: string;
  sessionId: string;
  reporterId: string;
  reportedId: string;
}

export interface ReportDetail {
  reportId: string;
  category: string;
  status: ReportStatus;
  description: string;
  reportedAt: string;
  resolvedAt: string | null;
  reporter: { accountId: string; name: string; email: string };
  reported: { accountId: string; name: string; email: string };
  session: {
    sessionId: string;
    status: string;
    startedAt: string;
    endedAt: string | null;
    userRating: number | null;
    volunteerRating: number | null;
    closedReason: string | null;
    starredByUser: boolean;
    problem?: {
      customCategoryLabel: string | null;
      feelingLevel: number;
      status: string;
      createdAt: string;
    };
  };
}

// ── Accounts ─────────────────────────────────────────────────────

export interface AccountListItem {
  accountId: string;
  email: string;
  name: string;
  nickname: string;
  status: AccountStatus;
  createdAt: string;
  roles: string[];
}

export interface AccountDetail extends AccountListItem {
  ageRange: string | null;
  gender: string | null;
  updatedAt: string;
  actionsReceived: {
    actionId: string;
    actionType: string;
    reason: string;
    expiresAt: string | null;
    createdAt: string;
    admin: { accountId: string; email: string };
  }[];
  reportsReceived: {
    reportId: string;
    category: string;
    status: string;
    reportedAt: string;
  }[];
  reportsFiled: {
    reportId: string;
    category: string;
    status: string;
    reportedAt: string;
  }[];
}

// ── Sessions ─────────────────────────────────────────────────────

export interface SessionListItem {
  sessionId: string;
  seekerId: string;
  listenerId: string | null;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  closedReason: string | null;
  userRating: number | null;
  volunteerRating: number | null;
  category: string | null;
}

// ── Volunteer Applications ────────────────────────────────────────

export interface VolunteerApplicationItem {
  requestId: string;
  volunteerId: string;
  documentUrl: string;
  status: VerificationStatus;
  adminNotes: string | null;
  reviewedAt: string | null;
  submittedAt: string;
  volunteer: {
    name: string;
    email?: string;
    volunteerProfile?: {
      instituteName: string | null;
      about?: string | null;
    } | null;
  };
}
