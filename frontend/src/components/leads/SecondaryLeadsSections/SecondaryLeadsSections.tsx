import { Collapse, Empty, List, Typography } from "antd";
import type { FailedLead, NeedsReviewLead, RejectedLead, SkippedLead } from "@/types/lead.types";

const { Text } = Typography;

interface SecondaryLeadsSectionsProps {
  needsReview: NeedsReviewLead[];
  rejected: RejectedLead[];
  skipped: SkippedLead[];
  failed: FailedLead[];
  noContactCount: number;
}

function EmptySection() {
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีรายการ" />;
}

export default function SecondaryLeadsSections({
  needsReview,
  rejected,
  skipped,
  failed,
  noContactCount,
}: SecondaryLeadsSectionsProps) {
  const items = [
    {
      key: "needsReview",
      label: `ต้องตรวจสอบพื้นที่ (${needsReview.length})`,
      children:
        needsReview.length === 0 ? (
          <EmptySection />
        ) : (
          <List
            size="small"
            dataSource={needsReview}
            renderItem={(item) => (
              <List.Item>
                <Text strong>{item.lead.companyName}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {item.lead.address ?? "ไม่มีที่อยู่"}
                </Text>
              </List.Item>
            )}
          />
        ),
    },
    {
      key: "noContact",
      label: `ไม่มีช่องทางติดต่อ (${noContactCount})`,
      children: noContactCount === 0 ? <EmptySection /> : <Text type="secondary">ธุรกิจในพื้นที่ที่ตรวจสอบแล้ว แต่ไม่พบเบอร์โทรหรืออีเมล</Text>,
    },
    {
      key: "rejected",
      label: `นอกพื้นที่ / ซ้ำ (${rejected.length})`,
      children:
        rejected.length === 0 ? (
          <EmptySection />
        ) : (
          <List
            size="small"
            dataSource={rejected}
            renderItem={(item) => (
              <List.Item>
                <Text strong>{item.companyName}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {item.reason === "outside_location" ? "อยู่นอกพื้นที่ที่ขอ" : "เว็บไซต์ซ้ำกับรายการที่รับไปแล้ว"}
                </Text>
              </List.Item>
            )}
          />
        ),
    },
    {
      key: "skipped",
      label: `มีในระบบแล้ว (${skipped.length})`,
      children:
        skipped.length === 0 ? (
          <EmptySection />
        ) : (
          <List
            size="small"
            dataSource={skipped}
            renderItem={(item) => (
              <List.Item>
                <Text strong>{item.companyName}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {item.domain ?? "—"}
                </Text>
              </List.Item>
            )}
          />
        ),
    },
    {
      key: "failed",
      label: `เข้าเว็บไม่สำเร็จ (${failed.length})`,
      children:
        failed.length === 0 ? (
          <EmptySection />
        ) : (
          <List
            size="small"
            dataSource={failed}
            renderItem={(item) => (
              <List.Item>
                <Text>{item.url}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {item.message}
                </Text>
              </List.Item>
            )}
          />
        ),
    },
  ];

  return <Collapse items={items} ghost />;
}
