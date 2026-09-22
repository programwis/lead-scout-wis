import { Button, Descriptions, Empty, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { TableProps } from "antd";
import { Pencil, ExternalLink } from "lucide-react";
import ContactStatusTag from "@/components/leads/ContactStatusTag";
import type { EditableLeadRow, ReferenceType } from "@/types/lead.types";

const { Text, Link } = Typography;

const REFERENCE_LABEL: Record<ReferenceType, string> = {
  official_website: "เว็บทางการ",
  directory: "Google Maps",
  social: "โซเชียล",
  government: "หน่วยงานรัฐ",
};

interface LeadsTableProps {
  rows: EditableLeadRow[];
  selectedRowKeys: React.Key[];
  onSelectionChange: (keys: React.Key[]) => void;
  onEdit: (row: EditableLeadRow) => void;
}

export default function LeadsTable({ rows, selectedRowKeys, onSelectionChange, onEdit }: LeadsTableProps) {
  const columns: TableProps<EditableLeadRow>["columns"] = [
    {
      title: "บริษัท",
      dataIndex: "companyName",
      key: "companyName",
      fixed: "left",
      width: 220,
      render: (value: string, row) => (
        <div>
          <Text strong>{value}</Text>
          <div>
            <Tag style={{ marginTop: 2 }}>{row.industry}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: "เบอร์โทร",
      dataIndex: "phone",
      key: "phone",
      width: 150,
      render: (value: string | null) => value ?? <Text type="secondary">—</Text>,
    },
    {
      title: "อีเมล",
      dataIndex: "email",
      key: "email",
      width: 200,
      render: (value: string | null) => value ?? <Text type="secondary">—</Text>,
    },
    {
      title: "สถานะติดต่อ",
      dataIndex: "contactStatus",
      key: "contactStatus",
      width: 130,
      render: (status: EditableLeadRow["contactStatus"]) => <ContactStatusTag status={status} />,
    },
    {
      title: "เว็บไซต์",
      dataIndex: "website",
      key: "website",
      width: 160,
      render: (value: string | null) =>
        value ? (
          <Link href={value} target="_blank" rel="noreferrer">
            <Space size={4}>
              เปิดเว็บ <ExternalLink size={12} />
            </Space>
          </Link>
        ) : (
          <Text type="secondary">ไม่มีเว็บไซต์</Text>
        ),
    },
    {
      title: "ที่อยู่",
      dataIndex: "address",
      key: "address",
      ellipsis: { showTitle: false },
      render: (value: string | null) =>
        value ? (
          <Tooltip title={value}>
            <Text>{value}</Text>
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "จัดการ",
      key: "actions",
      fixed: "right",
      width: 80,
      render: (_, row) => (
        <Tooltip title="แก้ไขข้อมูล">
          <Button type="text" icon={<Pencil size={16} />} onClick={() => onEdit(row)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <Table<EditableLeadRow>
      rowKey="rowKey"
      columns={columns}
      dataSource={rows}
      scroll={{ x: 1100 }}
      pagination={{ pageSize: 10, showSizeChanger: false }}
      locale={{ emptyText: <Empty description="ยังไม่มี Lead ที่ใช้งานได้" /> }}
      rowSelection={{
        selectedRowKeys,
        onChange: onSelectionChange,
      }}
      expandable={{
        rowExpandable: (row) => !!row.industryDetail || !!row.address || row.references.length > 0,
        expandedRowRender: (row) => (
          <Descriptions size="small" column={1} bordered>
            {row.industryDetail && <Descriptions.Item label="รายละเอียดธุรกิจ">{row.industryDetail}</Descriptions.Item>}
            {row.address && <Descriptions.Item label="ที่อยู่เต็ม">{row.address}</Descriptions.Item>}
            {row.references.length > 0 && (
              <Descriptions.Item label="แหล่งอ้างอิง">
                <Space direction="vertical" size={2}>
                  {row.references.map((ref, i) => (
                    <Link key={i} href={ref.url} target="_blank" rel="noreferrer">
                      [{REFERENCE_LABEL[ref.type]}] {ref.name ?? ref.url}
                    </Link>
                  ))}
                </Space>
              </Descriptions.Item>
            )}
          </Descriptions>
        ),
      }}
    />
  );
}
