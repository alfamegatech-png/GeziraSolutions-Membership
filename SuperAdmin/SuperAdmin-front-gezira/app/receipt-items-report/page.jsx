import FinancialReportPage from "../components/reports/FinancialReportPage";

export default function ReceiptItemsReportPage() {
  return (
    <FinancialReportPage
      title="تقرير تفصيلي لبنود الإيصال"
      endpoint="GetReceiptItemsReport"
      type="receipt"
    />
  );
}
