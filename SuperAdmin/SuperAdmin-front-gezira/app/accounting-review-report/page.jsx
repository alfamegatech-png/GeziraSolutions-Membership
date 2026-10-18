import FinancialReportPage from "../components/reports/FinancialReportPage";

export default function AccountingReviewReportPage() {
  return (
    <FinancialReportPage
      title="مراجعة القيود المحاسبية"
      endpoint="GetAccountingReviewReport"
      type="accounting"
    />
  );
}
