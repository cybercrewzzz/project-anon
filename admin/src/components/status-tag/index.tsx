"use client";

import { Tag } from "antd";

const statusColors: Record<string, string> = {
  // Shared
  pending: "orange",
  active: "green",
  // ReportStatus
  reviewing: "blue",
  resolved: "green",
  dismissed: "default",
  // AccountStatus
  suspended: "orange",
  banned: "red",
  deleted: "default",
  // VerificationStatus
  approved: "green",
  rejected: "red",
  // SessionStatus
  completed: "green",
  cancelled_grace: "volcano",
  cancelled_timeout: "volcano",
  cancelled_disconnect: "volcano",
  cancelled_admin: "red",
  // ActionType
  warning: "orange",
  mute: "blue",
  suspend: "volcano",
  ban: "red",
};

interface StatusTagProps {
  status: string;
}

export const StatusTag = ({ status }: StatusTagProps) => {
  const color = statusColors[status] || "default";
  const label = status.replace(/_/g, " ").toUpperCase();
  return <Tag color={color}>{label}</Tag>;
};
