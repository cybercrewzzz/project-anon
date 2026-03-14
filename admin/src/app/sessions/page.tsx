"use client";

import React, { useState, useMemo } from "react";
import { List, DateField } from "@refinedev/antd";
import { Table, Select, Input, Space } from "antd";
import { StatusTag } from "@components/status-tag";
import { mockSessions } from "@/mock/sessions";
import type { SessionStatus } from "@/types";

export default function SessionListPage() {
  const [statusFilter, setStatusFilter] = useState<
    SessionStatus | undefined
  >();
  const [seekerIdFilter, setSeekerIdFilter] = useState("");
  const [listenerIdFilter, setListenerIdFilter] = useState("");

  const filteredData = useMemo(() => {
    return mockSessions.filter((s) => {
      const matchesStatus = !statusFilter || s.status === statusFilter;
      const matchesSeeker =
        !seekerIdFilter || s.seekerId.includes(seekerIdFilter);
      const matchesListener =
        !listenerIdFilter || s.listenerId.includes(listenerIdFilter);
      return matchesStatus && matchesSeeker && matchesListener;
    });
  }, [statusFilter, seekerIdFilter, listenerIdFilter]);

  return (
    <List>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="Filter by status"
          allowClear
          onChange={(value) => setStatusFilter(value)}
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
          onChange={(e) => setSeekerIdFilter(e.target.value)}
          style={{ width: 200 }}
        />
        <Input
          placeholder="Listener ID"
          allowClear
          onChange={(e) => setListenerIdFilter(e.target.value)}
          style={{ width: 200 }}
        />
      </Space>

      <Table
        dataSource={filteredData}
        rowKey="sessionId"
        pagination={{ pageSize: 10 }}
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
