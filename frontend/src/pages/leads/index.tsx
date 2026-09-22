import { useState } from "react";
import { Alert, Button, Card, Space, Typography, message, notification } from "antd";
import { CheckCircle } from "lucide-react";
import SearchForm from "@/components/leads/SearchForm/SearchForm";
import GeneratingPanel from "@/components/leads/GeneratingPanel/GeneratingPanel";
import ResultsSummary from "@/components/leads/ResultsSummary/ResultsSummary";
import InsufficientResultsAlert from "@/components/leads/InsufficientResultsAlert/InsufficientResultsAlert";
import LeadsTable from "@/components/leads/LeadsTable/LeadsTable";
import EditLeadDrawer from "@/components/leads/EditLeadDrawer/EditLeadDrawer";
import SecondaryLeadsSections from "@/components/leads/SecondaryLeadsSections/SecondaryLeadsSections";
import { LeadService } from "@/services/LeadService/LeadService";
import { useLoadInitialData } from "./hooks/useLoadInitialData";
import type { EditableLeadRow, GenerateRequest, GenerateResponse, LeadCandidate } from "@/types/lead.types";

const { Text } = Typography;

function toRowKey(lead: LeadCandidate, index: number): string {
  return `${lead.domain ?? lead.companyName}::${index}`;
}

export default function LeadsPage() {
  const { models } = useLoadInitialData();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [rows, setRows] = useState<EditableLeadRow[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [editingRow, setEditingRow] = useState<EditableLeadRow | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [savedTotal, setSavedTotal] = useState(0);

  const isInsufficient = !!result && result.leads.length < result.requested;

  const handleGenerate = async (values: GenerateRequest) => {
    setLoading(true);
    setErrorMessage(null);

    const res = await LeadService.generate(values);
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
  };

  const handleSaveEdit = (updated: EditableLeadRow) => {
    setRows((prev) => prev.map((row) => (row.rowKey === updated.rowKey ? updated : row)));
    setEditingRow(null);
  };

  const handleConfirm = async () => {
    const selected = rows.filter((row) => selectedRowKeys.includes(row.rowKey));
    if (selected.length === 0) {
      message.warning("กรุณาเลือก Lead อย่างน้อย 1 รายการก่อนยืนยัน");
      return;
    }

    setConfirming(true);
    const payload = selected.map(({ rowKey: _rowKey, ...lead }) => lead);
    const res = await LeadService.confirm({ leads: payload });
    setConfirming(false);

    if (!res.ok) {
      message.error(res.message);
      return;
    }

    const savedDomains = new Set(res.data.saved.map((s) => s.domain));
    const savedKeys = new Set(
      selected.filter((row) => (row.domain ? savedDomains.has(row.domain) : true)).map((row) => row.rowKey),
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
  };

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <SearchForm loading={loading} models={models} onSubmit={handleGenerate} />

        {errorMessage && (
          <Alert type="error" showIcon message="ไม่สามารถสร้าง Leads ได้" description={errorMessage} closable />
        )}

        {loading && <GeneratingPanel />}

        {!loading && result && (
          <>
            <ResultsSummary summary={result.summary} />

            {isInsufficient && (
              <InsufficientResultsAlert
                requested={result.requested}
                found={result.leads.length}
                suggestion={result.suggestion}
              />
            )}

            {savedTotal > 0 && (
              <Alert
                type="success"
                showIcon
                message={`บันทึก Lead ไปแล้ว ${savedTotal} รายการในรอบนี้`}
              />
            )}

            <Card
              title={`Leads ที่ใช้งานได้ (${rows.length})`}
              extra={
                <Space>
                  <Text type="secondary">เลือกแล้ว {selectedRowKeys.length} รายการ</Text>
                  <Button
                    type="primary"
                    icon={<CheckCircle size={16} />}
                    disabled={selectedRowKeys.length === 0}
                    loading={confirming}
                    onClick={handleConfirm}
                  >
                    ยืนยัน Lead ที่เลือก
                  </Button>
                </Space>
              }
            >
              <LeadsTable
                rows={rows}
                selectedRowKeys={selectedRowKeys}
                onSelectionChange={setSelectedRowKeys}
                onEdit={setEditingRow}
              />
            </Card>

            <Card title="รายการอื่น ๆ" size="small">
              <SecondaryLeadsSections
                needsReview={result.needsReview}
                rejected={result.rejected}
                skipped={result.skipped}
                failed={result.failed}
                noContactCount={result.noContact.length}
              />
            </Card>
          </>
        )}
      </Space>

      <EditLeadDrawer row={editingRow} onClose={() => setEditingRow(null)} onSave={handleSaveEdit} />
    </>
  );
}
