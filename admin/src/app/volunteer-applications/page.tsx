"use client";

import React, { useState, useEffect, useCallback } from "react";
import { List, DateField, ShowButton } from "@refinedev/antd";
import { Table, Select, Space, Button, App, Tooltip, Typography } from "antd";
import { EyeOutlined, FileTextOutlined } from "@ant-design/icons";
import { StatusTag } from "@components/status-tag";
import { RejectModal } from "@components/reject-modal";
import { apiClient } from "@providers/axios";
import type { VerificationStatus, VolunteerApplicationItem } from "@/types";

const { Text } = Typography;

export default function VolunteerApplicationListPage() {
  const [statusFilter, setStatusFilter] = useState<
    VerificationStatus | undefined
  >();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );
  const [data, setData] = useState<VolunteerApplicationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get("/admin/volunteer-applications", {
        params,
      });
      setData(res.data.data);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (requestId: string) => {
    try {
      await apiClient.patch(
        `/admin/volunteer-applications/${requestId}/approve`,
      );
      message.success("Application approved");
      fetchData();
    } catch {
      message.error("Failed to approve application");
    }
  };

  const handleRejectSubmit = async (adminNotes: string) => {
    if (!selectedRequestId) return;
    try {
      await apiClient.patch(
        `/admin/volunteer-applications/${selectedRequestId}/reject`,
        { adminNotes },
      );
      message.success("Application rejected");
      setRejectModalOpen(false);
      setSelectedRequestId(null);
      fetchData();
    } catch {
      message.error("Failed to reject application");
    }
  };

  return (
    <List>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter by status"
          allowClear
          onChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          style={{ width: 200 }}
          options={[
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ]}
        />
      </Space>

      <Table
        dataSource={data}
        rowKey="requestId"
        loading={loading}
        pagination={{
          current: page,
          pageSize: 10,
          total,
          onChange: (p) => setPage(p),
        }}
        scroll={{ x: 900 }}
      >
        <Table.Column
          title="Volunteer"
          key="volunteer"
          render={(_: unknown, record: VolunteerApplicationItem) => (
            <div>
              <Text strong>{record.volunteer.name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.volunteer.email}
              </Text>
            </div>
          )}
        />
        <Table.Column
          title="Institute"
          key="institute"
          render={(_: unknown, record: VolunteerApplicationItem) =>
            record.volunteer.volunteerProfile?.instituteName ?? (
              <Text type="secondary">Not provided</Text>
            )
          }
        />
        <Table.Column
          title="Document"
          key="document"
          render={(_: unknown, record: VolunteerApplicationItem) => (
            <Tooltip title="View submitted document">
              <Button
                type="link"
                icon={<FileTextOutlined />}
                href={record.documentUrl}
                target="_blank"
                size="small"
              >
                View
              </Button>
            </Tooltip>
          )}
        />
        <Table.Column
          title="Status"
          dataIndex="status"
          width={120}
          render={(value: string) => <StatusTag status={value} />}
        />
        <Table.Column
          title="Submitted"
          dataIndex="submittedAt"
          width={150}
          render={(value: string) => (
            <DateField value={value} format="YYYY-MM-DD HH:mm" />
          )}
        />
        <Table.Column
          title="Reviewed"
          dataIndex="reviewedAt"
          width={150}
          render={(value: string | null) =>
            value ? (
              <DateField value={value} format="YYYY-MM-DD HH:mm" />
            ) : (
              <Text type="secondary">Pending</Text>
            )
          }
        />
        <Table.Column
          title="Actions"
          key="actions"
          width={200}
          fixed="right"
          render={(_: unknown, record: VolunteerApplicationItem) => (
            <Space>
              <ShowButton
                hideText
                size="small"
                recordItemId={record.requestId}
                icon={<EyeOutlined />}
              />
              {record.status === "pending" && (
                <>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleApprove(record.requestId)}
                  >
                    Approve
                  </Button>
                  <Button
                    danger
                    size="small"
                    onClick={() => {
                      setSelectedRequestId(record.requestId);
                      setRejectModalOpen(true);
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}
            </Space>
          )}
        />
      </Table>

      <RejectModal
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setSelectedRequestId(null);
        }}
        onSubmit={handleRejectSubmit}
      />
    </List>
  );
}
