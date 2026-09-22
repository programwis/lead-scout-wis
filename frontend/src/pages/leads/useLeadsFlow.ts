import { useCallback, useEffect, useMemo, useState } from "react";
import { message, notification } from "antd";
import { confirmLeads, generateLeads, getModels } from "@/services/lead.service";
import { toFriendlyErrorMessage } from "@/utils/apiError";
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

export function useLeadsFlow() {
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

  useEffect(() => {
    getModels()
      .then((res) => {
        setModels(res.models);
        setDefaultModel(res.defaultModel);
      })
      .catch(() => {
        // model selector เป็นแค่ตัวเลือกเสริม โหลดไม่ได้ก็ไม่ต้องบล็อกการใช้งานหลัก
      });
  }, []);

  const handleGenerate = useCallback(
    async (values: GenerateRequest) => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const data = await generateLeads(values);
        setResult(data);
        const nextRows = data.leads.map((lead, index) => ({ ...lead, rowKey: toRowKey(lead, index) }));
        setRows(nextRows);
        setSelectedRowKeys(nextRows.map((r) => r.rowKey));
        setSavedTotal(0);
        if (data.leads.length === 0) {
          message.warning("ไม่พบ Lead ที่ใช้งานได้จากเงื่อนไขนี้");
        }
      } catch (error) {
        setResult(null);
        setRows([]);
        setErrorMessage(toFriendlyErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

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
    try {
      const payload = selected.map(({ rowKey: _rowKey, ...lead }) => lead);
      const res = await confirmLeads({ leads: payload });

      const savedDomains = new Set(res.saved.map((s) => s.domain));
      const savedKeys = new Set(
        selected
          .filter((row) => (row.domain ? savedDomains.has(row.domain) : true))
          .map((row) => row.rowKey),
      );

      setRows((prev) => prev.filter((row) => !savedKeys.has(row.rowKey)));
      setSelectedRowKeys((prev) => prev.filter((key) => !savedKeys.has(String(key))));
      setSavedTotal((prev) => prev + res.saved.length);

      notification.success({
        message: "บันทึก Lead สำเร็จ",
        description: `บันทึกแล้ว ${res.saved.length} รายการ`,
        placement: "top",
      });

      if (res.failed.length > 0) {
        notification.warning({
          message: `มี ${res.failed.length} รายการที่บันทึกไม่สำเร็จ`,
          description: res.failed.map((f) => f.message).join(", "),
          placement: "top",
        });
      }
    } catch (error) {
      message.error(toFriendlyErrorMessage(error));
    } finally {
      setConfirming(false);
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
