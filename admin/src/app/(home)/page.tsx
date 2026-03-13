"use client";

import React from "react";
import { Card, Col, Row, Statistic, Typography } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  WarningOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

export default function IndexPage() {
  const stats = {
    totalAccounts: 1245,
    totalVolunteers: 85,
    activeVolunteers: 12,
    sessionsToday: 34,
    pendingReports: 5,
    pendingApplications: 3,
  };

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>Admin Dashboard</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card variant="borderless">
            <Statistic
              title="Total Accounts"
              value={stats.totalAccounts}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card variant="borderless">
            <Statistic
              title="Total Volunteers"
              value={stats.totalVolunteers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card variant="borderless">
            <Statistic
              title="Active Volunteers (Online)"
              value={stats.activeVolunteers}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card variant="borderless">
            <Statistic
              title="Sessions Today"
              value={stats.sessionsToday}
              prefix={<MessageOutlined style={{ color: "#1890ff" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card
            variant="borderless"
            style={{
              borderLeft:
                stats.pendingReports > 0 ? "4px solid #ff4d4f" : undefined,
            }}
          >
            <Statistic
              title="Pending Abuse Reports"
              value={stats.pendingReports}
              prefix={<WarningOutlined style={{ color: "#ff4d4f" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card
            variant="borderless"
            style={{
              borderLeft:
                stats.pendingApplications > 0 ? "4px solid #faad14" : undefined,
            }}
          >
            <Statistic
              title="Pending Verifications"
              value={stats.pendingApplications}
              prefix={<FileDoneOutlined style={{ color: "#faad14" }} />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
