import { Alert, Button, Card, Space, Typography } from "antd";
import { CheckCircle } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import SearchForm from "./SearchForm";
import GeneratingPanel from "./GeneratingPanel";
import ResultsSummary from "./ResultsSummary";
import InsufficientResultsAlert from "./InsufficientResultsAlert";
import LeadsTable from "./LeadsTable";
import EditLeadDrawer from "./EditLeadDrawer";
import SecondaryLeadsSections from "./SecondaryLeadsSections";
import { useLoadInitialData } from "./hooks/useLoadInitialData";

const { Text } = Typography;

export default function LeadsPage() {
  const {
    models,
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
  } = useLoadInitialData();

  return (
    <MainLayout>
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
    </MainLayout>
  );
}
