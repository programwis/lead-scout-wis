import { useEffect, useState } from "react";
import { LeadService } from "@/services/LeadService/LeadService";
import type { AIModel } from "@/types/lead.types";

/** โหลดข้อมูลตั้งต้นของหน้า Leads เท่านั้น (ตัวเลือกโมเดล AI) — mutation ต่าง ๆ อยู่ใน index.tsx */
export function useLoadInitialData() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [defaultModel, setDefaultModel] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await LeadService.getModels();
      // model selector เป็นแค่ตัวเลือกเสริม โหลดไม่ได้ก็ไม่ต้องบล็อกการใช้งานหลัก
      if (!res.ok) return;

      setModels(res.data.models);
      setDefaultModel(res.data.defaultModel);
    })();
  }, []);

  return { models, defaultModel };
}
