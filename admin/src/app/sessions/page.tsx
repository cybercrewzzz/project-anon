"use client";

import React, { useState, useEffect, useCallback } from "react";
import { List, DateField } from "@refinedev/antd";
import { Table, Select, Input, Space } from "antd";
import { StatusTag } from "@components/status-tag";
import { apiClient } from "@providers/axios";
import type { SessionStatus, SessionListItem } from "@/types";

export default function SessionListPage() {
  const [statusFilter, setStatusFilter] = useState<SessionStatus | undefined>();
  const [seekerIdFilter, setSeekerIdFilter] = useState("");
  const [listenerIdFilter, setListenerIdFilter] = useState("");
  const [data, setData] = useState<SessionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (seekerIdFilter) params.seekerId = seekerIdFilter;
      if (listenerIdFilter) params.listenerId = listenerIdFilter;
      const res = await apiClient.get("/admin/sessions", { params });
      setData(res.data.data);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, seekerIdFilter, listenerIdFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <List>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="Filter by status"
          allowClear
          onChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          style={{ width: 220 }}
          options={[
            { value: "active", label: "Active" },
            { value: "completed", label: "Completed" },
            { value: "cancelled_grace", label: "Cancelled (Grace)" },
            { value: "cancelled_timeout", label: "Cancelled (Timeout)" },
            { value: "cancelled_disconnect", label: "Cancelled (Disconnect)" },
            { value: "cancelled_admin", label: "Cancelled (Admin)" },
          ]}
        />
        <Input
          placeholder="Seeker ID"
          allowClear
          onChange={(e) => {
            setSeekerIdFilter(e.target.value);
            setPage(1);
          }}
          style={{ width: 200 }}
        />
        <Input
          placeholder="Listener ID"
          allowClear
          onChange={(e) => {
            setListenerIdFilter(e.target.value);
            setPage(1);
          }}
          style={{ width: 200 }}
        />
      </Space>

      <Table
        dataSource={data}
        rowKey="sessionId"
        loading={loading}
        pagination={{
          current: page,
          pageSize: 10,
          total,
          onChange: (p) => setPage(p),
        }}
        scroll={{ x: 1200 }}
      >
        <Table.Column
          title="Session ID"
          dataIndex="sessionId"
          render={(value: string) => (
            <span style={{ fontFamily: "monospace", fontSize: 12 }}>
              {value.slice(0, 12)}...
            </span>
          )}
        />
        <Table.Column
          title="Seeker ID"
          dataIndex="seekerId"
          render={(value: string) => (
            <span style={{ fontFamily: "monospace", fontSize: 12 }}>
              {value.slice(0, 12)}...
            </span>
          )}
        />
        <Table.Column
          title="Listener ID"
          dataIndex="listenerId"
          render={(value: string) => (
            <span style={{ fontFamily: "monospace", fontSize: 12 }}>
              {value.slice(0, 12)}...
            </span>
          )}
        />
        <Table.Column
          title="Status"
          dataIndex="status"
          render={(value: string) => <StatusTag status={value} />}
        />
        <Table.Column
          title="Started At"
          dataIndex="startedAt"
          render={(value: string) => (
            <DateField value={value} format="YYYY-MM-DD HH:mm" />
          )}
        />
        <Table.Column
          title="Ended At"
          dataIndex="endedAt"
          render={(value: string | null) =>
            value ? (
              <DateField value={value} format="YYYY-MM-DD HH:mm" />
            ) : (
              "N/A"
            )
          }
        />
        <Table.Column
          title="Closed Reason"
          dataIndex="closedReason"
          render={(value: string | null) => value ?? "N/A"}
        />
        <Table.Column
          title="Category"
          dataIndex="category"
          render={(value: string | null) => value ?? "N/A"}
        />
        <Table.Column
          title="User Rating"
          dataIndex="userRating"
          render={(value: number | null) => value ?? "N/A"}
        />
        <Table.Column
          title="Vol. Rating"
          dataIndex="volunteerRating"
          render={(value: number | null) => value ?? "N/A"}
        />
      </Table>
    </List>
  );
}
