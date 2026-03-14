"use client";

import React, { useState, useEffect, useCallback } from "react";
import { List, ShowButton, DateField } from "@refinedev/antd";
import { Table, Input, Select, Space, Tag } from "antd";
import { StatusTag } from "@components/status-tag";
import { apiClient } from "@providers/axios";
import type { AccountStatus, AccountListItem } from "@/types";

export default function AccountListPage() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | undefined>();
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [data, setData] = useState<AccountListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (searchText) params.search = searchText;
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;
      const res = await apiClient.get("/admin/accounts", { params });
      setData(res.data.data);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [searchText, statusFilter, roleFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <List>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Search by email, name, or nickname"
          onSearch={(v) => {
            setSearchText(v);
            setPage(1);
          }}
          onChange={(e) => !e.target.value && setSearchText("")}
          allowClear
          style={{ width: 300 }}
        />
        <Select
          placeholder="Filter by status"
          allowClear
          onChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          style={{ width: 160 }}
          options={[
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
            { value: "banned", label: "Banned" },
            { value: "deleted", label: "Deleted" },
          ]}
        />
        <Select
          placeholder="Filter by role"
          allowClear
          onChange={(value) => {
            setRoleFilter(value);
            setPage(1);
          }}
          style={{ width: 160 }}
          options={[
            { value: "user", label: "User" },
            { value: "volunteer", label: "Volunteer" },
            { value: "admin", label: "Admin" },
          ]}
        />
      </Space>

      <Table
        dataSource={data}
        rowKey="accountId"
        loading={loading}
        pagination={{
          current: page,
          pageSize: 10,
          total,
          onChange: (p) => setPage(p),
        }}
      >
        <Table.Column
          title="Account ID"
          dataIndex="accountId"
          render={(value: string) => (
            <span style={{ fontFamily: "monospace", fontSize: 12 }}>
              {value.slice(0, 12)}...
            </span>
          )}
        />
        <Table.Column title="Email" dataIndex="email" />
        <Table.Column title="Name" dataIndex="name" />
        <Table.Column title="Nickname" dataIndex="nickname" />
        <Table.Column
          title="Status"
          dataIndex="status"
          render={(value: string) => <StatusTag status={value} />}
        />
        <Table.Column
          title="Roles"
          dataIndex="roles"
          render={(roles: string[]) => (
            <Space>
              {roles.map((role) => (
                <Tag
                  key={role}
                  color={
                    role === "admin"
                      ? "purple"
                      : role === "volunteer"
                        ? "blue"
                        : "default"
                  }
                >
                  {role}
                </Tag>
              ))}
            </Space>
          )}
        />
        <Table.Column
          title="Created At"
          dataIndex="createdAt"
          render={(value: string) => (
            <DateField value={value} format="YYYY-MM-DD" />
          )}
        />
        <Table.Column
          title="Actions"
          render={(_: unknown, record: AccountListItem) => (
            <ShowButton hideText size="small" recordItemId={record.accountId} />
          )}
        />
      </Table>
    </List>
  );
}
