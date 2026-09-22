import { Button, Card, Col, Form, AutoComplete, Row, Select, Space, Tooltip } from "antd";
import { Search, Info } from "lucide-react";
import { INDUSTRY_SUGGESTIONS } from "@/constants/industries";
import { THAI_PROVINCES } from "@/constants/provinces";
import { LEAD_COUNT_OPTIONS, DEFAULT_LEAD_COUNT } from "@/constants/leadCount";
import type { AIModel, GenerateRequest } from "@/types/lead.types";

const industryOptions = INDUSTRY_SUGGESTIONS.map((v) => ({ value: v }));
const provinceOptions = THAI_PROVINCES.map((v) => ({ value: v, label: v }));
const leadCountOptions = LEAD_COUNT_OPTIONS.map((v) => ({ value: v, label: `${v} รายการ` }));

interface SearchFormProps {
  loading: boolean;
  models: AIModel[];
  onSubmit: (values: GenerateRequest) => void;
}

export default function SearchForm({ loading, models, onSubmit }: SearchFormProps) {
  const [form] = Form.useForm<{
    keyword: string;
    location?: string;
    limit: number;
    model?: string;
  }>();

  const handleFinish = (values: { keyword: string; location?: string; limit: number; model?: string }) => {
    onSubmit({
      keyword: values.keyword.trim(),
      location: values.location?.trim() || undefined,
      limit: values.limit,
      model: values.model || undefined,
    });
  };

  return (
    <Card title="ค้นหา Lead" size="default">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ limit: DEFAULT_LEAD_COUNT }}
        disabled={loading}
      >
        <Row gutter={16}>
          <Col xs={24} md={9}>
            <Form.Item
              name="keyword"
              label="ธุรกิจ / คำค้น"
              rules={[{ required: true, message: "กรุณาระบุประเภทธุรกิจที่ต้องการค้นหา" }]}
            >
              <AutoComplete
                options={industryOptions}
                filterOption={(input, option) =>
                  (option?.value as string).toLowerCase().includes(input.toLowerCase())
                }
                placeholder="เช่น โรงพยาบาล, ร้านอาหาร หรือพิมพ์คำค้นของคุณเอง"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={7}>
            <Form.Item name="location" label="จังหวัด">
              <Select
                allowClear
                showSearch
                placeholder="เลือกจังหวัด (ไม่ระบุก็ได้)"
                options={provinceOptions}
                optionFilterProp="label"
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item name="limit" label="จำนวน Lead" rules={[{ required: true }]}>
              <Select options={leadCountOptions} />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item
              name="model"
              label={
                <Space size={4}>
                  โมเดล AI
                  <Tooltip title="ไม่บังคับเลือก ระบบจะใช้โมเดลเริ่มต้นให้อัตโนมัติ">
                    <Info size={13} />
                  </Tooltip>
                </Space>
              }
            >
              <Select
                allowClear
                placeholder="ค่าเริ่มต้น"
                options={models.map((m) => ({ value: m.name, label: m.label }))}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Button type="primary" htmlType="submit" icon={<Search size={16} />} loading={loading} size="large">
            ค้นหา Lead
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
