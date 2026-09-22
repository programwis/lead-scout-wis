import { Alert } from "antd";
import type { GenerateSuggestion } from "@/types/lead.types";

const SUGGESTION_TEXT: Record<Exclude<GenerateSuggestion, null>, string> = {
  search_again: "ยิงค้นหาซ้ำอีกครั้งด้วยเงื่อนไขเดิม มีโอกาสได้ Lead เพิ่ม",
  expand_scope: "ธุรกิจที่ตรงคำค้นในพื้นที่นี้ใกล้หมดแล้ว ลองขยายพื้นที่ค้นหา",
  try_other_keyword: "คำค้นนี้ไม่ค่อยพาไปเจอธุรกิจที่ใช้งานได้ ลองเปลี่ยนคำค้น",
};

interface InsufficientResultsAlertProps {
  requested: number;
  found: number;
  suggestion: GenerateSuggestion;
}

export default function InsufficientResultsAlert({ requested, found, suggestion }: InsufficientResultsAlertProps) {
  return (
    <Alert
      type="warning"
      showIcon
      message={`พบ Leads ที่ใช้งานได้ ${found} จาก ${requested} รายการที่ต้องการ`}
      description={suggestion ? SUGGESTION_TEXT[suggestion] : "ลองปรับคำค้นหรือพื้นที่ แล้วค้นหาอีกครั้งได้ตามต้องการ"}
    />
  );
}
