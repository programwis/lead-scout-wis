import { Card, Spin, Typography } from "antd";

const { Text } = Typography;

export default function GeneratingPanel() {
  return (
    <Card>
      <div style={{ textAlign: "center", padding: "32px 16px" }}>
        <Spin size="large" />
        <div style={{ marginTop: 20 }}>
          <Text strong style={{ fontSize: 16, display: "block" }}>
            กำลังค้นหา Leads...
          </Text>
          <Text type="secondary" style={{ display: "block", marginTop: 6 }}>
            ระบบกำลังค้นหาธุรกิจและตรวจสอบข้อมูล Contact
          </Text>
          <Text type="secondary" style={{ display: "block" }}>
            กระบวนการนี้อาจใช้เวลาสักครู่ (ประมาณ 1–5 นาที ขึ้นอยู่กับจำนวนที่ขอ)
          </Text>
        </div>
      </div>
    </Card>
  );
}
