"use client";

import React, { useState, useEffect, useCallback } from "react";
import { List, ShowButton, DateField } from "@refinedev/antd";
import { Table, Select, Space, Tag } from "antd";
import { StatusTag } from "@components/status-tag";
import { apiClient } from "@providers/axios";
import type { ReportListItem, ReportStatus } from "@/types";

export default function ReportListPage() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | undefined>();
  const [data, setData] = useState<ReportListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get("/admin/reports", { params });
      setData(res.data.data);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
            { value: "reviewing", label: "Reviewing" },
            { value: "resolved", label: "Resolved" },
            { value: "dismissed", label: "Dismissed" },
          ]}
        />
      </Space>

      <Table
        dataSource={data}
        rowKey="reportId"
        loading={loading}
        pagination={{
          current: page,
          pageSize: 10,
          total,
          onChange: (p) => setPage(p),
        }}
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
          render={(value: string) => (
            <DateField value={value} format="YYYY-MM-DD HH:mm" />
          )}
        />
        <Table.Column
          title="Actions"
          render={(_: unknown, record: ReportListItem) => (
            <ShowButton hideText size="small" recordItemId={record.reportId} />
          )}
        />
      </Table>
    </List>
  );
}
