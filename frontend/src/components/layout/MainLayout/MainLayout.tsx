import type { PropsWithChildren } from "react";
import { Layout, Typography, Space } from "antd";
import { Radar } from "lucide-react";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function MainLayout({ children }: PropsWithChildren) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#fff",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          height: 64,
        }}
      >
        <Space align="center" size={10}>
          <Radar size={22} color="#1677ff" />
          <Title level={4} style={{ margin: 0 }}>
            LeadScout
          </Title>
          <Text type="secondary" style={{ marginLeft: 4 }}>
            ค้นหาและรวบรวม Lead ธุรกิจ
          </Text>
        </Space>
      </Header>
      <Content style={{ padding: "24px", maxWidth: 1320, width: "100%", margin: "0 auto" }}>
        {children}
      </Content>
    </Layout>
  );
}
