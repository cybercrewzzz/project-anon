"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Show } from "@refinedev/antd";
import {
  Descriptions,
  Card,
  Button,
  Space,
  Typography,
  Image,
  App,
  Alert,
  Empty,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { StatusTag } from "@components/status-tag";
import { RejectModal } from "@components/reject-modal";
import { mockVolunteerApplications } from "@/mock/volunteer-applications";

const { Title, Paragraph, Text } = Typography;

export default function VolunteerApplicationShowPage() {
  const { id } = useParams<{ id: string }>();
  const application =
    mockVolunteerApplications.find((a) => a.requestId === id) ||
    mockVolunteerApplications[0];

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const { message } = App.useApp();

  const isPending = application.status === "pending";
  const isImage =
    application.documentUrl.endsWith(".jpg") ||
    application.documentUrl.endsWith(".jpeg") ||
    application.documentUrl.endsWith(".png");

  const handleApprove = () => {
    message.success("Application approved successfully");
  };

  const handleRejectSubmit = () => {
    message.success("Application rejected");
    setRejectModalOpen(false);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Show
      isLoading={false}
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          {isPending && (
            <>
              <Button
                icon={<CloseCircleOutlined />}
                danger
                onClick={() => setRejectModalOpen(true)}
              >
                Reject
              </Button>
              <Button
                icon={<CheckCircleOutlined />}
                type="primary"
                onClick={handleApprove}
              >
                Approve
              </Button>
            </>
          )}
        </>
      )}
    >
      {/* Application Status Banner */}
      {application.status === "approved" && (
        <Alert
          message="This application has been approved"
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      {application.status === "rejected" && (
        <Alert
          message="This application has been rejected"
          description={application.adminNotes}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Applicant Info */}
      <Title level={5} style={{ marginTop: 0 }}>
        Applicant Information
      </Title>
      <Descriptions bordered column={{ xs: 1, sm: 2 }}>
        <Descriptions.Item label="Name">
          {application.volunteer.name}
        </Descriptions.Item>
        <Descriptions.Item label="Email">
          {application.volunteer.email}
        </Descriptions.Item>
        <Descriptions.Item label="Volunteer ID">
          <Text copyable style={{ fontFamily: "monospace", fontSize: 12 }}>
            {application.volunteerId}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Institute">
          {application.volunteer.volunteerProfile?.instituteName ?? (
            <Text type="secondary">Not provided</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Bio" span={2}>
          {application.volunteer.volunteerProfile?.bio ? (
            <Paragraph
              style={{ marginBottom: 0 }}
              ellipsis={{ rows: 3, expandable: true, symbol: "more" }}
            >
              {application.volunteer.volunteerProfile.bio}
            </Paragraph>
          ) : (
            <Text type="secondary">No bio provided</Text>
          )}
        </Descriptions.Item>
      </Descriptions>

      {/* Request Details */}
      <Title level={5} style={{ marginTop: 24 }}>
        Request Details
      </Title>
      <Descriptions bordered column={{ xs: 1, sm: 2 }}>
        <Descriptions.Item label="Request ID">
          <Text copyable style={{ fontFamily: "monospace", fontSize: 12 }}>
            {application.requestId}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <StatusTag status={application.status} />
        </Descriptions.Item>
        <Descriptions.Item label="Submitted At">
          {formatDate(application.submittedAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Reviewed At">
          {application.reviewedAt ? (
            formatDate(application.reviewedAt)
          ) : (
            <Text type="secondary">Not yet reviewed</Text>
          )}
        </Descriptions.Item>
        {application.adminNotes && (
          <Descriptions.Item label="Admin Notes" span={2}>
            {application.adminNotes}
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Document Viewer */}
      <Title level={5} style={{ marginTop: 24 }}>
        Submitted Document
      </Title>
      <Card
        styles={{
          body: { padding: 16, textAlign: "center" },
        }}
        extra={
          <Space>
            <Button
              icon={<DownloadOutlined />}
              href={application.documentUrl}
              target="_blank"
              size="small"
            >
              Open Original
            </Button>
          </Space>
        }
      >
        {isImage ? (
          <Image
            src={application.documentUrl}
            alt="Verification Document"
            style={{
              maxWidth: "100%",
              maxHeight: 600,
              objectFit: "contain",
              borderRadius: 8,
            }}
            fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZjVmNWY1IiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjUwJSIgeT0iNTAlIiBkeT0iLjNlbSI+RG9jdW1lbnQgUHJldmlldzwvdGV4dD48L3N2Zz4="
          />
        ) : application.documentUrl.endsWith(".pdf") ? (
          <div
            style={{
              border: "1px solid #d9d9d9",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <iframe
              src={application.documentUrl}
              style={{ width: "100%", height: 600, border: "none" }}
              title="Document Preview"
            />
          </div>
        ) : (
          <Empty
            description={
              <span>
                Preview not available for this file type.
                <br />
                <Button
                  type="link"
                  href={application.documentUrl}
                  target="_blank"
                >
                  Download to view
                </Button>
              </span>
            }
          />
        )}
        <Paragraph
          type="secondary"
          style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}
        >
          Document URL: {application.documentUrl}
        </Paragraph>
      </Card>

      <RejectModal
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onSubmit={handleRejectSubmit}
      />
    </Show>
  );
}
