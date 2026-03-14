"use client";

import React, { useState, useMemo } from "react";
import { List, ShowButton, DateField } from "@refinedev/antd";
import { Table, Select, Space, Tag } from "antd";
import { StatusTag } from "@components/status-tag";
import { mockReports } from "@/mock/reports";
import type { ReportStatus } from "@/types";

export default function ReportListPage() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | undefined>();

  const filteredData = useMemo(
    () => mockReports.filter((r) => !statusFilter || r.status === statusFilter),
    [statusFilter]
  );

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
            { value: "reviewing", label: "Reviewing" },
            { value: "resolved", label: "Resolved" },
            { value: "dismissed", label: "Dismissed" },
          ]}
        />
      </Space>

      <Table
        dataSource={filteredData}
        rowKey="reportId"
        pagination={{ pageSize: 10 }}
      >
        <Table.Column
          title="Report ID"
          dataIndex="reportId"
          render={(value: string) => (
            <span style={{ fontFamily: "monospace", fontSize: 12 }}>
              {value.slice(0, 8)}...
            </span>
          )}
        />
        <Table.Column
          title="Category"
          dataIndex="category"
          render={(value: string) => (
            <Tag>{value.replace(/_/g, " ").toUpperCase()}</Tag>
          )}
        />
        <Table.Column
          title="Status"
          dataIndex="status"
          render={(value: string) => <StatusTag status={value} />}
        />
        <Table.Column
          title="Reported At"
          dataIndex="reportedAt"
          render={(value: string) => <DateField value={value} format="YYYY-MM-DD HH:mm" />}
        />
        <Table.Column
          title="Actions"
          render={(_, record: (typeof mockReports)[0]) => (
            <ShowButton hideText size="small" recordItemId={record.reportId} />
          )}
        />
      </Table>
    </List>
  );
}
