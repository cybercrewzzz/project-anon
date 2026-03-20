"use client";

import React from "react";
import { Modal, Form, Select, Input, DatePicker } from "antd";
import type { ActionType } from "@/types";

interface TakeActionModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    actionType: ActionType;
    reason: string;
    expiresAt?: string;
  }) => void;
  targetName?: string;
}

export const TakeActionModal: React.FC<TakeActionModalProps> = ({
  open,
  onCancel,
  onSubmit,
  targetName,
}) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit({
      actionType: values.actionType,
      reason: values.reason,
      expiresAt: values.expiresAt?.toISOString(),
    });
    form.resetFields();
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={`Take Action${targetName ? ` against ${targetName}` : ""}`}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Submit Action"
      okButtonProps={{ danger: true }}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="actionType"
          label="Action Type"
          rules={[{ required: true, message: "Please select an action type" }]}
        >
          <Select
            placeholder="Select action type"
            options={[
              { value: "warning", label: "Warning" },
              { value: "mute", label: "Mute" },
              { value: "suspend", label: "Suspend" },
              { value: "ban", label: "Ban" },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="reason"
          label="Reason"
          rules={[{ required: true, message: "Please provide a reason" }]}
        >
          <Input.TextArea
            rows={4}
            maxLength={300}
            showCount
            placeholder="Describe the reason for this action..."
          />
        </Form.Item>

        <Form.Item name="expiresAt" label="Expires At (optional)">
          <DatePicker showTime style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
