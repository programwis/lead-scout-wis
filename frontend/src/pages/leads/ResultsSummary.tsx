import { Card, Col, Row, Statistic } from "antd";
import type { GenerateSummary } from "@/types/lead.types";

interface ResultsSummaryProps {
  summary: GenerateSummary;
}

export default function ResultsSummary({ summary }: ResultsSummaryProps) {
  const items: { title: string; value: number; color?: string }[] = [
    { title: "ธุรกิจที่พบ", value: summary.companiesFound },
    { title: "ติดต่อได้", value: summary.contactable, color: "#389e0d" },
    { title: "ติดต่อได้บางส่วน", value: summary.partial, color: "#d46b08" },
    { title: "มีเบอร์โทร", value: summary.withPhone },
    { title: "มีอีเมล", value: summary.withEmail },
  ];

  return (
    <Card size="small">
      <Row gutter={16}>
        {items.map((item) => (
          <Col xs={12} sm={8} md={4} key={item.title}>
            <Statistic title={item.title} value={item.value} valueStyle={item.color ? { color: item.color } : undefined} />
          </Col>
        ))}
      </Row>
    </Card>
  );
}
