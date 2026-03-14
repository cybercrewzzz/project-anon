"use client";

import { useEffect, useState } from "react";
import { Row, Col, Card, Statistic, Spin } from "antd";
import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  FlagOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import { apiClient } from "@providers/axios";
import type { DashboardStats } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/admin/dashboard/stats")
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  const cards = [
    {
      title: "Total Accounts",
      value: stats.totalAccounts,
      icon: <TeamOutlined />,
    },
    {
      title: "Total Volunteers",
      value: stats.totalVolunteers,
      icon: <UserOutlined />,
    },
    {
      title: "Active Volunteers",
      value: stats.activeVolunteers,
      icon: <CheckCircleOutlined />,
      valueStyle: { color: "#52c41a" },
    },
    {
      title: "Sessions Today",
      value: stats.sessionsToday,
      icon: <MessageOutlined />,
    },
    {
      title: "Pending Reports",
      value: stats.pendingReports,
      icon: <FlagOutlined />,
      valueStyle: { color: "#faad14" },
    },
    {
      title: "Pending Applications",
      value: stats.pendingApplications,
      icon: <SolutionOutlined />,
      valueStyle: { color: "#faad14" },
    },
  ];

  return (
    <div style={{ padding: 0 }}>
      <Row gutter={[16, 16]}>
        {cards.map((card) => (
          <Col xs={24} sm={12} lg={8} key={card.title}>
            <Card>
              <Statistic
                title={card.title}
                value={card.value}
                prefix={card.icon}
                valueStyle={card.valueStyle}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
