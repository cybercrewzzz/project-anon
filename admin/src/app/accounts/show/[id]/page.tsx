"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Show, DateField } from "@refinedev/antd";
import { Descriptions, Tag, Tabs, Table, Button, Typography, App } from "antd";
import { StatusTag } from "@components/status-tag";
import { TakeActionModal } from "@components/take-action-modal";
import { mockAccountDetails } from "@/mock/accounts";

const { Text } = Typography;

export default function AccountShowPage() {
  const { id } = useParams<{ id: string }>();
  const account =
    mockAccountDetails.find((a) => a.accountId === id) ||
    mockAccountDetails[0];

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const { message } = App.useApp();

  return (
    <Show
      isLoading={false}
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          <Button
            type="primary"
            danger
            onClick={() => setActionModalOpen(true)}
          >
            Take Action
          </Button>
        </>
      )}
    >
      <Descriptions bordered column={{ xs: 1, sm: 2 }}>
        <Descriptions.Item label="Account ID">
          <Text copyable style={{ fontFamily: "monospace", fontSize: 12 }}>
            {account.accountId}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Email">{account.email}</Descriptions.Item>
        <Descriptions.Item label="Name">{account.name}</Descriptions.Item>
        <Descriptions.Item label="Nickname">
          {account.nickname}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <StatusTag status={account.status} />
        </Descriptions.Item>
        <Descriptions.Item label="Roles">
          {account.roles.map((role) => (
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
        </Descriptions.Item>
        <Descriptions.Item label="Age Range">
          {account.ageRange?.replace(/_/g, " ") ?? "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Gender">
          {account.gender?.replace(/_/g, " ") ?? "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {new Date(account.createdAt).toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="Updated At">
          {new Date(account.updatedAt).toLocaleString()}
        </Descriptions.Item>
      </Descriptions>

      <Tabs
        style={{ marginTop: 24 }}
        items={[
          {
            key: "actions",
            label: `Actions Received (${account.actionsReceived.length})`,
            children: (
              <Table
                dataSource={account.actionsReceived}
                rowKey="actionId"
                pagination={false}
                size="small"
              >
                <Table.Column
                  title="Type"
                  dataIndex="actionType"
                  render={(value: string) => <StatusTag status={value} />}
                />
                <Table.Column title="Reason" dataIndex="reason" />
                <Table.Column
                  title="Admin"
                  dataIndex={["admin", "email"]}
                />
                <Table.Column
                  title="Date"
                  dataIndex="createdAt"
                  render={(value: string) => (
                    <DateField value={value} format="YYYY-MM-DD HH:mm" />
                  )}
                />
                <Table.Column
                  title="Expires"
                  dataIndex="expiresAt"
                  render={(value: string | null) =>
                    value ? (
                      <DateField value={value} format="YYYY-MM-DD HH:mm" />
                    ) : (
                      "Never"
                    )
                  }
                />
              </Table>
            ),
          },
          {
            key: "reportsReceived",
            label: `Reports Received (${account.reportsReceived.length})`,
            children: (
              <Table
                dataSource={account.reportsReceived}
                rowKey="reportId"
                pagination={false}
                size="small"
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
              </Table>
            ),
          },
          {
            key: "reportsFiled",
            label: `Reports Filed (${account.reportsFiled.length})`,
            children: (
              <Table
                dataSource={account.reportsFiled}
                rowKey="reportId"
                pagination={false}
                size="small"
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
              </Table>
            ),
          },
        ]}
      />

      <TakeActionModal
        open={actionModalOpen}
        onCancel={() => setActionModalOpen(false)}
        onSubmit={() => {
          message.success("Action taken successfully");
          setActionModalOpen(false);
        }}
        targetName={account.name}
      />
    </Show>
  );
}
