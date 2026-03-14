"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Show } from "@refinedev/antd";
import {
  Descriptions,
  Card,
  Button,
  Tag,
  Typography,
  App,
  Spin,
  Alert,
} from "antd";
import { StatusTag } from "@components/status-tag";
import { TakeActionModal } from "@components/take-action-modal";
import { apiClient } from "@providers/axios";
import type { ReportDetail } from "@/types";

const { Text } = Typography;

export default function ReportShowPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { message } = App.useApp();

  useEffect(() => {
    apiClient
      .get(`/admin/reports/${id}`)
      .then((res) => setReport(res.data))
      .catch(() => setError("Failed to load report."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Alert message={error ?? "Report not found."} type="error" showIcon />
      </div>
    );
  }

  const isActionable =
    report.status === "pending" || report.status === "reviewing";

  const handleDismiss = async () => {
    setSubmitting(true);
    try {
      await apiClient.patch(`/admin/reports/${id}/dismiss`);
      message.success("Report dismissed");
      setReport({ ...report, status: "dismissed" });
    } catch {
      message.error("Failed to dismiss report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTakeAction = async (values: {
    actionType: string;
    reason: string;
    expiresAt?: string;
  }) => {
    setSubmitting(true);
    try {
      await apiClient.post(`/admin/reports/${id}/action`, values);
      message.success("Action taken successfully");
      setActionModalOpen(false);
      setReport({ ...report, status: "resolved" });
    } catch {
      message.error("Failed to take action");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Show
      isLoading={false}
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          <Button
            onClick={handleDismiss}
            disabled={!isActionable}
            loading={submitting}
          >
            Dismiss
          </Button>
          <Button
            type="primary"
            danger
            onClick={() => setActionModalOpen(true)}
            disabled={!isActionable}
          >
            Take Action
          </Button>
        </>
      )}
    >
      <Descriptions bordered column={{ xs: 1, sm: 2 }}>
        <Descriptions.Item label="Report ID">
          <Text copyable style={{ fontFamily: "monospace", fontSize: 12 }}>
            {report.reportId}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Category">
          <Tag>{report.category.replace(/_/g, " ").toUpperCase()}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <StatusTag status={report.status} />
        </Descriptions.Item>
        <Descriptions.Item label="Reported At">
          {new Date(report.reportedAt).toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="Description" span={2}>
          {report.description}
        </Descriptions.Item>
      </Descriptions>

      <Card title="Reporter" style={{ marginTop: 24 }}>
        <Descriptions column={{ xs: 1, sm: 3 }}>
          <Descriptions.Item label="Name">
            {report.reporter.name}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {report.reporter.email}
          </Descriptions.Item>
          <Descriptions.Item label="Account ID">
            <Text copyable style={{ fontFamily: "monospace", fontSize: 12 }}>
              {report.reporter.accountId.slice(0, 8)}...
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Reported User" style={{ marginTop: 16 }}>
        <Descriptions column={{ xs: 1, sm: 3 }}>
          <Descriptions.Item label="Name">
            {report.reported.name}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {report.reported.email}
          </Descriptions.Item>
          <Descriptions.Item label="Account ID">
            <Text copyable style={{ fontFamily: "monospace", fontSize: 12 }}>
              {report.reported.accountId.slice(0, 8)}...
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Session Info" style={{ marginTop: 16 }}>
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Status">
            <StatusTag status={report.session.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Started At">
            {new Date(report.session.startedAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="User Rating">
            {report.session.userRating ?? "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Volunteer Rating">
            {report.session.volunteerRating ?? "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Closed Reason">
            {report.session.closedReason ?? "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Starred by User">
            {report.session.starredByUser ? "Yes" : "No"}
          </Descriptions.Item>
        </Descriptions>

        {report.session.problem && (
          <Descriptions
            title="Problem Details"
            bordered
            column={{ xs: 1, sm: 2 }}
            style={{ marginTop: 16 }}
          >
            <Descriptions.Item label="Category">
              {report.session.problem.customCategoryLabel ?? "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Feeling Level">
              {report.session.problem.feelingLevel}/10
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {report.session.problem.status}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {new Date(report.session.problem.createdAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <TakeActionModal
        open={actionModalOpen}
        onCancel={() => setActionModalOpen(false)}
        onSubmit={handleTakeAction}
        targetName={report.reported.name}
      />
    </Show>
  );
}
