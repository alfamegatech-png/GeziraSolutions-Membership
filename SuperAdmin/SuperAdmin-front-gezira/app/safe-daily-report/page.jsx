import FinancialReportPage from "../components/reports/FinancialReportPage";

export default function SafeDailyReportPage() {
  return (
    <FinancialReportPage
      title="يومية الخزنة"
      endpoint="GetSafeDailyReport"
      type="safe"
    />
  );
}
