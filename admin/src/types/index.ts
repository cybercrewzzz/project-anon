// Enums matching backend Prisma enums
export type AccountStatus = "active" | "suspended" | "banned" | "deleted";
export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";
export type ActionType = "warning" | "mute" | "suspend" | "ban";
export type VerificationStatus = "pending" | "approved" | "rejected";
export type SessionStatus =
  | "active"
  | "completed"
  | "cancelled_grace"
  | "cancelled_timeout"
  | "cancelled_disconnect"
  | "cancelled_admin";
export type ReportCategory =
  | "harassment"
  | "spam"
  | "inappropriate_content"
  | "impersonation"
  | "other";
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type AgeRange = "range_16_20" | "range_21_26" | "range_27_plus";

// Dashboard
export interface DashboardStats {
  totalAccounts: number;
  totalVolunteers: number;
  activeVolunteers: number;
  sessionsToday: number;
  pendingReports: number;
  pendingApplications: number;
}

// Reports
export interface ReportListItem {
  reportId: string;
  sessionId: string;
  reporterId: string;
  reportedId: string;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  reportedAt: string;
  resolvedAt: string | null;
}

export interface ReportDetail extends ReportListItem {
  reporter: { accountId: string; name: string; email: string };
  reported: { accountId: string; name: string; email: string };
  session: {
    closedReason: string | null;
    problem: {
      problemId: string;
      customCategoryLabel: string | null;
      feelingLevel: number;
      status: string;
      createdAt: string;
    } | null;
    starredByUser: boolean;
    startedAt: string;
    status: SessionStatus;
    userRating: number | null;
    volunteerRating: number | null;
  };
}

// Volunteer Applications
export interface VolunteerApplicationItem {
  requestId: string;
  volunteerId: string;
  documentUrl: string;
  status: VerificationStatus;
  adminNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  volunteer: {
    name: string;
    email: string;
    volunteerProfile: {
      instituteName: string;
      bio: string;
    } | null;
  };
}

// Accounts
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
  ageRange: AgeRange | null;
  gender: Gender | null;
  updatedAt: string;
  actionsReceived: {
    actionId: string;
    actionType: ActionType;
    reason: string;
    createdAt: string;
    expiresAt: string | null;
    admin: { accountId: string; email: string };
  }[];
  reportsReceived: {
    reportId: string;
    category: ReportCategory;
    status: ReportStatus;
    reportedAt: string;
  }[];
  reportsFiled: {
    reportId: string;
    category: ReportCategory;
    status: ReportStatus;
    reportedAt: string;
  }[];
}

// Sessions
export interface SessionListItem {
  sessionId: string;
  seekerId: string;
  listenerId: string;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  closedReason: string | null;
  userRating: number | null;
  volunteerRating: number | null;
  category: string | null;
}
