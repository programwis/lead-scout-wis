import { useEffect } from "react";
import { Button, Drawer, Form, Input, Space } from "antd";
import type { EditableLeadRow } from "@/types/lead.types";

interface EditLeadDrawerProps {
  row: EditableLeadRow | null;
  onClose: () => void;
  onSave: (row: EditableLeadRow) => void;
}

interface EditFormValues {
  companyName: string;
  industry: string;
  industryDetail?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export default function EditLeadDrawer({ row, onClose, onSave }: EditLeadDrawerProps) {
  const [form] = Form.useForm<EditFormValues>();

  useEffect(() => {
    if (row) {
      form.setFieldsValue({
        companyName: row.companyName,
        industry: row.industry,
        industryDetail: row.industryDetail ?? undefined,
        address: row.address ?? undefined,
        phone: row.phone ?? undefined,
        email: row.email ?? undefined,
        website: row.website ?? undefined,
      });
    }
  }, [row, form]);

  if (!row) return null;

  const handleFinish = (values: EditFormValues) => {
    onSave({
      ...row,
      companyName: values.companyName.trim(),
      industry: values.industry.trim(),
      industryDetail: values.industryDetail?.trim() || null,
      address: values.address?.trim() || null,
      phone: values.phone?.trim() || null,
      email: values.email?.trim() || null,
      website: values.website?.trim() || null,
    });
  };

  return (
    <Drawer title="แก้ไขข้อมูล Lead" open={!!row} onClose={onClose} width={420}>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="companyName"
          label="ชื่อบริษัท"
          rules={[{ required: true, message: "กรุณาระบุชื่อบริษัท" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="industry" label="ประเภทธุรกิจ" rules={[{ required: true, message: "กรุณาระบุประเภทธุรกิจ" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="industryDetail" label="รายละเอียดธุรกิจ">
          <Input />
        </Form.Item>
        <Form.Item name="address" label="ที่อยู่">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="phone" label="เบอร์โทร">
          <Input />
        </Form.Item>
        <Form.Item name="email" label="อีเมล" rules={[{ type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="website" label="เว็บไซต์">
          <Input />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Space>
            <Button onClick={onClose}>ยกเลิก</Button>
            <Button type="primary" htmlType="submit">
              บันทึก
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Drawer>
  );
}
