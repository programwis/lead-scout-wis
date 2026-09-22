import { useCallback, useEffect, useMemo, useState } from "react";
import { message, notification } from "antd";
import { confirmLeads, generateLeads, getModels } from "@/services/lead.service";
import type {
  AIModel,
  EditableLeadRow,
  GenerateRequest,
  GenerateResponse,
  LeadCandidate,
} from "@/types/lead.types";

function toRowKey(lead: LeadCandidate, index: number): string {
  return `${lead.domain ?? lead.companyName}::${index}`;
}

export function useLoadInitialData() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [defaultModel, setDefaultModel] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [rows, setRows] = useState<EditableLeadRow[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [editingRow, setEditingRow] = useState<EditableLeadRow | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [savedTotal, setSavedTotal] = useState(0);

  // Call Models Data
  const callModels = async () => {
    const res = await getModels();
    // model selector เป็นแค่ตัวเลือกเสริม โหลดไม่ได้ก็ไม่ต้องบล็อกการใช้งานหลัก
    if (!res.ok) return;

    setModels(res.data.models);
    setDefaultModel(res.data.defaultModel);
  };

  useEffect(() => {
    (async () => {
      await callModels();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = useCallback(async (values: GenerateRequest) => {
    setLoading(true);
    setErrorMessage(null);

    const res = await generateLeads(values);
    setLoading(false);

    if (!res.ok) {
      setResult(null);
      setRows([]);
      setErrorMessage(res.message);
      return;
    }

    const data = res.data;
    setResult(data);
    const nextRows = data.leads.map((lead, index) => ({ ...lead, rowKey: toRowKey(lead, index) }));
    setRows(nextRows);
    setSelectedRowKeys(nextRows.map((r) => r.rowKey));
    setSavedTotal(0);
    if (data.leads.length === 0) {
      message.warning("ไม่พบ Lead ที่ใช้งานได้จากเงื่อนไขนี้");
    }
  }, []);

  const handleSaveEdit = useCallback((updated: EditableLeadRow) => {
    setRows((prev) => prev.map((row) => (row.rowKey === updated.rowKey ? updated : row)));
    setEditingRow(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    const selected = rows.filter((row) => selectedRowKeys.includes(row.rowKey));
    if (selected.length === 0) {
      message.warning("กรุณาเลือก Lead อย่างน้อย 1 รายการก่อนยืนยัน");
      return;
    }

    setConfirming(true);
    const payload = selected.map(({ rowKey: _rowKey, ...lead }) => lead);
    const res = await confirmLeads({ leads: payload });
    setConfirming(false);

    if (!res.ok) {
      message.error(res.message);
      return;
    }

    const savedDomains = new Set(res.data.saved.map((s) => s.domain));
    const savedKeys = new Set(
      selected
        .filter((row) => (row.domain ? savedDomains.has(row.domain) : true))
        .map((row) => row.rowKey),
    );

    setRows((prev) => prev.filter((row) => !savedKeys.has(row.rowKey)));
    setSelectedRowKeys((prev) => prev.filter((key) => !savedKeys.has(String(key))));
    setSavedTotal((prev) => prev + res.data.saved.length);

    notification.success({
      message: "บันทึก Lead สำเร็จ",
      description: `บันทึกแล้ว ${res.data.saved.length} รายการ`,
      placement: "top",
    });

    if (res.data.failed.length > 0) {
      notification.warning({
        message: `มี ${res.data.failed.length} รายการที่บันทึกไม่สำเร็จ`,
        description: res.data.failed.map((f) => f.message).join(", "),
        placement: "top",
      });
    }
  }, [rows, selectedRowKeys]);

  const isInsufficient = useMemo(
    () => !!result && result.leads.length < result.requested,
    [result],
  );

  return {
    models,
    defaultModel,
    loading,
    errorMessage,
    result,
    rows,
    selectedRowKeys,
    setSelectedRowKeys,
    editingRow,
    setEditingRow,
    confirming,
    savedTotal,
    isInsufficient,
    handleGenerate,
    handleSaveEdit,
    handleConfirm,
  };
}
