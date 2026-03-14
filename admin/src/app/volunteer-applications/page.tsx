"use client";

import React, { useState, useMemo } from "react";
import { List, DateField } from "@refinedev/antd";
import { Table, Select, Space, Button, App } from "antd";
import { StatusTag } from "@components/status-tag";
import { RejectModal } from "@components/reject-modal";
import { mockVolunteerApplications } from "@/mock/volunteer-applications";
import type { VerificationStatus, VolunteerApplicationItem } from "@/types";

export default function VolunteerApplicationListPage() {
  const [statusFilter, setStatusFilter] = useState<
    VerificationStatus | undefined
  >();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [, setSelectedRequestId] = useState<string | null>(null);
  const { message } = App.useApp();

  const filteredData = useMemo(
    () =>
      mockVolunteerApplications.filter(
        (a) => !statusFilter || a.status === statusFilter
      ),
    [statusFilter]
  );

  const handleApprove = (requestId: string) => {
    message.success(`Application ${requestId.slice(0, 8)}... approved`);
  };

  const handleRejectSubmit = () => {
    message.success("Application rejected");
    setRejectModalOpen(false);
    setSelectedRequestId(null);
  };

  return (
    <List>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter by status"
          allowClear
          onChange={(value) => setStatusFilter(value)}
          style={{ width: 200 }}
          options={[
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ]}
        />
      </Space>

      <Table
        dataSource={filteredData}
        rowKey="requestId"
        pagination={{ pageSize: 10 }}
      >
        <Table.Column
          title="Request ID"
          dataIndex="requestId"
          render={(value: string) => (
            <span style={{ fontFamily: "monospace", fontSize: 12 }}>
              {value.slice(0, 12)}...
            </span>
          )}
        />
        <Table.Column
          title="Volunteer Name"
          render={(
            _: unknown,
            record: VolunteerApplicationItem
          ) => record.volunteer.name}
        />
        <Table.Column
          title="Institute"
          render={(
            _: unknown,
            record: VolunteerApplicationItem
          ) => record.volunteer.volunteerProfile?.instituteName ?? "N/A"}
        />
        <Table.Column
          title="Status"
          dataIndex="status"
          render={(value: string) => <StatusTag status={value} />}
        />
        <Table.Column
          title="Submitted At"
          dataIndex="submittedAt"
          render={(value: string) => (
            <DateField value={value} format="YYYY-MM-DD HH:mm" />
          )}
        />
        <Table.Column
          title="Actions"
          render={(
            _: unknown,
            record: VolunteerApplicationItem
          ) =>
            record.status === "pending" ? (
              <Space>
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
              </Space>
            ) : (
              "-"
            )
          }
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
