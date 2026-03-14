"use client";

import React from "react";
import { Modal, Form, Input } from "antd";

interface RejectModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (adminNotes: string) => void;
}

export const RejectModal: React.FC<RejectModalProps> = ({
  open,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values.adminNotes);
    form.resetFields();
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Reject Application"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Reject"
      okButtonProps={{ danger: true }}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="adminNotes"
          label="Reason for Rejection"
          rules={[
            { required: true, message: "Please provide a reason for rejection" },
          ]}
        >
          <Input.TextArea
            rows={4}
            maxLength={300}
            showCount
            placeholder="Explain why this application is being rejected..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
