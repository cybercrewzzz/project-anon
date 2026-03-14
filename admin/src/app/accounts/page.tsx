"use client";

import React, { useState, useMemo } from "react";
import { List, ShowButton, DateField } from "@refinedev/antd";
import { Table, Input, Select, Space, Tag } from "antd";
import { StatusTag } from "@components/status-tag";
import { mockAccounts } from "@/mock/accounts";
import type { AccountStatus, AccountListItem } from "@/types";

export default function AccountListPage() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    AccountStatus | undefined
  >();
  const [roleFilter, setRoleFilter] = useState<string | undefined>();

  const filteredData = useMemo(() => {
    return mockAccounts.filter((a) => {
      const q = searchText.toLowerCase();
      const matchesSearch =
        !searchText ||
        a.email.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.nickname.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || a.status === statusFilter;
      const matchesRole = !roleFilter || a.roles.includes(roleFilter);
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [searchText, statusFilter, roleFilter]);

  return (
    <List>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Search by email, name, or nickname"
          onSearch={setSearchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: 300 }}
        />
        <Select
          placeholder="Filter by status"
          allowClear
          onChange={(value) => setStatusFilter(value)}
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
          onChange={(value) => setRoleFilter(value)}
          style={{ width: 160 }}
          options={[
            { value: "user", label: "User" },
            { value: "volunteer", label: "Volunteer" },
            { value: "admin", label: "Admin" },
          ]}
        />
      </Space>

      <Table
        dataSource={filteredData}
        rowKey="accountId"
        pagination={{ pageSize: 10 }}
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
            <ShowButton
              hideText
              size="small"
              recordItemId={record.accountId}
            />
          )}
        />
      </Table>
    </List>
  );
}
