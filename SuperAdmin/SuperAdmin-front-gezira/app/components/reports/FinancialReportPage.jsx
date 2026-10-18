"use client";

import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "react-bootstrap";
import Swal from "sweetalert2";
import style from "./financialReport.module.css";

const API_BASE = "http://10.1.1.115:5000/api";
const PAGE_SIZE = 20;

const statusLabels = {
  1: "نشط",
  2: "منتهي",
  3: "متوقف",
};

const operationLabels = {
  new: "اشتراك عضوية",
  renew: "تجديد عضوية",
  swimming: "اشتراك سباحة",
};

const reviewLabels = {
  balanced: "متزن",
  difference: "فرق",
  missing_transaction: "لا يوجد قيد",
};

const moneyLabels = {
  delay_penalty: "غرامة تأخير",
  previous_penalties: "غرامات سابقة",
  maintenance_fee: "صيانة وإنشاء",
  membership_card_fee: "كارنيه",
  fellowship_fund_fee: "صندوق الزمالة",
  transfer_separation_fee: "تحويل وفصل",
  renew_fee: "تجديد",
  value_added_tax: "ضريبة",
  swimming: "سباحة",
  first_time_fee: "أول مرة",
  join_fee: "انضمام",
  installment: "تقسيط",
  new_ref_fees: "إضافة تابع",
  prev_years_fee: "سنوات سابقة",
  seperate_fees: "فصل عضوية",
  total_amount: "الإجمالي",
};

const receiptColumns = [
  { key: "serial_no", label: "رقم الإيصال" },
  { key: "member_code", label: "رقم العضوية" },
  { key: "member_name", label: "اسم العضو" },
  { key: "member_type_name", label: "نوع العضوية" },
  { key: "status", label: "الحالة", format: (value) => statusLabels[value] || value || "-" },
  { key: "safe_no", label: "الخزنة", format: (value) => value || "خزينة الأدمن" },
  { key: "member_order_date", label: "تاريخ العملية", format: formatDate },
  ...Object.entries(moneyLabels).map(([key, label]) => ({
    key,
    label,
    format: formatMoney,
  })),
];

const safeColumns = [
  { key: "safe_no", label: "الخزنة", format: (value) => value || "خزينة الأدمن" },
  { key: "serial_no", label: "رقم الإيصال" },
  { key: "member_code", label: "رقم العضوية" },
  { key: "member_name", label: "اسم العضو" },
  { key: "member_order_date", label: "تاريخ العملية", format: formatDate },
  ...Object.entries(moneyLabels).map(([key, label]) => ({
    key,
    label,
    format: formatMoney,
  })),
];

const accountingColumns = [
  { key: "serial_no", label: "رقم الإيصال" },
  { key: "member_code", label: "رقم العضوية" },
  { key: "member_name", label: "اسم العضو" },
  { key: "member_type_name", label: "نوع العضوية" },
  { key: "safe_no", label: "الخزنة", format: (value) => value || "خزينة الأدمن" },
  { key: "member_order_date", label: "تاريخ العملية", format: formatDate },
  { key: "transaction_id", label: "رقم القيد", format: (value) => value || "-" },
  { key: "debit_total", label: "المدين", format: formatMoney },
  { key: "credit_total", label: "الدائن", format: formatMoney },
  { key: "difference", label: "الفرق", format: formatMoney },
  { key: "review_status", label: "الحالة", format: (value) => reviewLabels[value] || value || "-" },
];

function toNumber(value) {
  return Number(value || 0);
}

function formatMoney(value) {
  return toNumber(value).toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-EG");
}

function getColumns(type) {
  if (type === "safe") return safeColumns;
  if (type === "accounting") return accountingColumns;
  return receiptColumns;
}

export default function FinancialReportPage({ title, endpoint, type }) {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    memberType: "",
    status: "",
    operationType: "",
    safeNo: "",
    serialNo: "",
    memberCode: "",
    onlyProblems: false,
  });
  const [memberTypes, setMemberTypes] = useState([]);
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [safeTotals, setSafeTotals] = useState([]);
  const [summary, setSummary] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const columns = useMemo(() => getColumns(type), [type]);

  const pageTotal = useMemo(
    () => rows.reduce((sum, row) => sum + toNumber(row.total_amount || row.debit_total), 0),
    [rows]
  );

  const handleFilterChange = (event) => {
    const { name, value, type: inputType, checked } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: inputType === "checkbox" ? checked : value,
    }));
  };

  const loadMemberTypes = async () => {
    try {
      const response = await axios.get(`${API_BASE}/GetAllMemberType`);
      setMemberTypes(response.data?.rows?.rows || []);
    } catch (error) {
      console.error(error);
      setMemberTypes([]);
    }
  };

  const fetchReport = async (page = 1, activeFilters = filters) => {
    try {
      setLoading(true);
      const params = {
        PageNumber: page,
        PageLimit: PAGE_SIZE,
      };

      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value !== "" && value !== false) params[key] = value;
      });

      const response = await axios.get(`${API_BASE}/${endpoint}`, { params });
      const data = response.data || {};
      const nextRows = data.rows || [];

      setRows(nextRows);
      setTotals(data.totals || {});
      setSafeTotals(data.safeTotals || []);
      setSummary(data.summary || {});
      setTotalCount(data.count || 0);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || page);

      if (nextRows.length === 0) {
        Swal.fire({
          icon: "info",
          title: "لا يوجد بيانات",
          text: "لا توجد نتائج مطابقة للفلاتر المختارة",
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "حدث خطأ",
        text: "تعذر تحميل التقرير",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemberTypes();
  }, []);

  const resetFilters = () => {
    const emptyFilters = {
      startDate: "",
      endDate: "",
      memberType: "",
      status: "",
      operationType: "",
      safeNo: "",
      serialNo: "",
      memberCode: "",
      onlyProblems: false,
    };
    setFilters(emptyFilters);
    setRows([]);
    setTotals({});
    setSafeTotals([]);
    setSummary({});
    setTotalCount(0);
    setTotalPages(1);
    setCurrentPage(1);
  };

  const nextPage = () => {
    if (currentPage < totalPages) fetchReport(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) fetchReport(currentPage - 1);
  };

  return (
    <main className={style.page} dir="rtl">
      <h1 className={style.title}>{title}</h1>

      <section className={style.filters}>
        <label className={style.filterItem}>
          <span>من</span>
          <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
        </label>
        <label className={style.filterItem}>
          <span>إلى</span>
          <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
        </label>
        <label className={style.filterItem}>
          <span>نوع العضوية</span>
          <select name="memberType" value={filters.memberType} onChange={handleFilterChange}>
            <option value="">الكل</option>
            {memberTypes.map((memberType) => (
              <option key={memberType.code} value={memberType.code}>
                {memberType.name}
              </option>
            ))}
          </select>
        </label>
        <label className={style.filterItem}>
          <span>الحالة</span>
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">الكل</option>
            <option value="1">نشط</option>
            <option value="2">منتهي</option>
            <option value="3">متوقف</option>
          </select>
        </label>
        <label className={style.filterItem}>
          <span>نوع العملية</span>
          <select name="operationType" value={filters.operationType} onChange={handleFilterChange}>
            <option value="">الكل</option>
            <option value="new">{operationLabels.new}</option>
            <option value="renew">{operationLabels.renew}</option>
            <option value="swimming">{operationLabels.swimming}</option>
          </select>
        </label>
        <label className={style.filterItem}>
          <span>رقم الخزنة</span>
          <input name="safeNo" value={filters.safeNo} onChange={handleFilterChange} />
        </label>
        <label className={style.filterItem}>
          <span>رقم الإيصال</span>
          <input name="serialNo" value={filters.serialNo} onChange={handleFilterChange} />
        </label>
        <label className={style.filterItem}>
          <span>رقم العضوية</span>
          <input name="memberCode" value={filters.memberCode} onChange={handleFilterChange} />
        </label>
        {type === "accounting" && (
          <label className={style.checkItem}>
            <input
              type="checkbox"
              name="onlyProblems"
              checked={filters.onlyProblems}
              onChange={handleFilterChange}
            />
            <span>عرض المشاكل فقط</span>
          </label>
        )}
      </section>

      <div className={style.actions}>
        <Button variant="primary" onClick={() => fetchReport(1)} disabled={loading}>
          {loading ? "جاري التحميل..." : "بحث"}
        </Button>
        <Button variant="secondary" onClick={resetFilters} disabled={loading}>
          مسح الفلاتر
        </Button>
      </div>

      <section className={style.summary}>
        <span>عدد السجلات: {totalCount}</span>
        <span>إجمالي الصفحة: {formatMoney(pageTotal)} جنيه</span>
        {type === "accounting" && (
          <>
            <span>متزن: {summary.balanced_count || 0}</span>
            <span>فرق: {summary.difference_count || 0}</span>
            <span>بدون قيد: {summary.missing_transaction_count || 0}</span>
          </>
        )}
      </section>

      {type === "safe" && safeTotals.length > 0 && (
        <section className={style.safeTotals}>
          <h2>إجمالي الخزن</h2>
          <div className={style.tableWrap}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>الخزنة</th>
                  <th>عدد الإيصالات</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {safeTotals.map((safe) => (
                  <tr key={safe.safe_no}>
                    <td>{safe.safe_no}</td>
                    <td>{safe.receipt_count}</td>
                    <td>{formatMoney(safe.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {type === "receipt" && Object.keys(totals).length > 0 && (
        <section className={style.safeTotals}>
          <h2>إجماليات البنود</h2>
          <div className={style.totalsGrid}>
            {Object.entries(moneyLabels).map(([key, label]) => (
              <div key={key} className={style.totalItem}>
                <span>{label}</span>
                <strong>{formatMoney(totals[key])}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className={style.tableWrap}>
        <table className={style.table}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id || `${row.serial_no}-${row.member_code}`}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.format ? column.format(row[column.key]) : row[column.key] || "-"}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length}>لا يوجد بيانات</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={style.pagination}>
        <Button variant="outline-primary" onClick={prevPage} disabled={loading || currentPage <= 1}>
          السابق
        </Button>
        <span>
          صفحة {currentPage} من {totalPages || 1}
        </span>
        <Button variant="outline-primary" onClick={nextPage} disabled={loading || currentPage >= totalPages}>
          التالي
        </Button>
      </div>
    </main>
  );
}
