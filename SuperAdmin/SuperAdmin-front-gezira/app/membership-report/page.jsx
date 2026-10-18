"use client";

import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "react-bootstrap";
import Swal from "sweetalert2";
import style from "./page.module.css";

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

const moneyFields = [
  "join_fee",
  "first_time_fee",
  "renew_fee",
  "prev_years_fee",
  "delay_penalty",
  "maintenance_fee",
  "membership_card_fee",
  "fellowship_fund_fee",
  "transfer_separation_fee",
  "swimming",
];

const toNumber = (value) => Number(value || 0);

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-EG");
};

const formatMoney = (value) =>
  toNumber(value).toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getOperationType = (row) => {
  if (toNumber(row.join_fee) > 0 || toNumber(row.first_time_fee) > 0) {
    return "new";
  }

  const isSwimmingOnly =
    toNumber(row.swimming) > 0 &&
    toNumber(row.renew_fee) === 0 &&
    toNumber(row.prev_years_fee) === 0 &&
    toNumber(row.join_fee) === 0 &&
    toNumber(row.first_time_fee) === 0;

  if (isSwimmingOnly) return "swimming";
  return "renew";
};

export default function MembershipReport() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    memberType: "",
    status: "",
    operationType: "",
  });
  const [memberTypes, setMemberTypes] = useState([]);
  const [rows, setRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const pageTotal = useMemo(
    () => rows.reduce((sum, row) => sum + toNumber(row.total_amount), 0),
    [rows]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const loadMemberTypes = async () => {
    try {
      const response = await axios.get(`${API_BASE}/GetAllMemberType`);
      setMemberTypes(response.data?.rows?.rows || []);
    } catch (error) {
      setMemberTypes([]);
      console.error(error);
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
        if (value !== "") params[key] = value;
      });

      const response = await axios.get(`${API_BASE}/GetMembershipReport`, {
        params,
      });

      const nextRows = response.data?.rows || [];
      setRows(nextRows);
      setTotalCount(response.data?.count || 0);
      setTotalPages(response.data?.totalPages || 1);
      setCurrentPage(response.data?.currentPage || page);

      if (nextRows.length === 0) {
        Swal.fire({
          icon: "info",
          title: "لا يوجد بيانات",
          text: "لا توجد عضويات مطابقة للفلاتر المختارة",
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "حدث خطأ",
        text: "تعذر تحميل تقرير العضوية",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemberTypes();
    fetchReport(1);
  }, []);

  const searchReport = () => {
    fetchReport(1);
  };

  const resetFilters = () => {
    const emptyFilters = {
      startDate: "",
      endDate: "",
      memberType: "",
      status: "",
      operationType: "",
    };

    setFilters(emptyFilters);
    setCurrentPage(1);
    fetchReport(1, emptyFilters);
  };

  const nextPage = () => {
    if (currentPage < totalPages) fetchReport(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) fetchReport(currentPage - 1);
  };

  return (
    <main className={style.page} dir="rtl">
      <h1 className={style.headStyle}>تقرير العضوية</h1>

      <section className={style.filters}>
        <label className={style.filterItem}>
          <span>من</span>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
        </label>

        <label className={style.filterItem}>
          <span>إلى</span>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </label>

        <label className={style.filterItem}>
          <span>نوع العضوية</span>
          <select
            name="memberType"
            value={filters.memberType}
            onChange={handleFilterChange}
          >
            <option value="">الكل</option>
            {memberTypes.map((type) => (
              <option key={type.code} value={type.code}>
                {type.name}
              </option>
            ))}
          </select>
        </label>

        <label className={style.filterItem}>
          <span>الحالة</span>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">الكل</option>
            <option value="1">نشط</option>
            <option value="2">منتهي</option>
            <option value="3">متوقف</option>
          </select>
        </label>

        <label className={style.filterItem}>
          <span>نوع العملية</span>
          <select
            name="operationType"
            value={filters.operationType}
            onChange={handleFilterChange}
          >
            <option value="">الكل</option>
            <option value="new">اشتراك عضوية</option>
            <option value="renew">تجديد عضوية</option>
            <option value="swimming">اشتراك سباحة</option>
          </select>
        </label>
      </section>

      <div className={style.actions}>
        <Button variant="primary" onClick={searchReport} disabled={loading}>
          {loading ? "جاري التحميل..." : "بحث"}
        </Button>
        <Button variant="secondary" onClick={resetFilters} disabled={loading}>
          مسح الفلاتر
        </Button>
      </div>

      <section className={style.summary}>
        <span>عدد السجلات: {totalCount}</span>
        <span>إجمالي الصفحة: {formatMoney(pageTotal)} جنيه</span>
      </section>

      <div className={style.tableWrap}>
        <table className={style.tableStyle}>
          <thead>
            <tr>
              <th>رقم العضوية</th>
              <th>اسم العضو</th>
              <th>نوع العضوية</th>
              <th>الحالة</th>
              <th>نوع العملية</th>
              <th>رقم الإيصال</th>
              <th>تاريخ العملية</th>
              <th>تاريخ البداية</th>
              <th>تاريخ النهاية</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const member = row.members || {};
              const operationType = getOperationType(row);

              return (
                <tr key={row.id || `${row.member_code}-${row.serial_no}`}>
                  <td>{row.member_code}</td>
                  <td>{member.name || "-"}</td>
                  <td>{member.memberType?.name || "-"}</td>
                  <td>{statusLabels[row.status] || row.status || "-"}</td>
                  <td>{operationLabels[operationType]}</td>
                  <td>{row.serial_no || "-"}</td>
                  <td>{formatDate(row.member_order_date)}</td>
                  <td>{formatDate(row.start_date)}</td>
                  <td>{formatDate(row.end_date)}</td>
                  <td>{formatMoney(row.total_amount)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan="10">لا يوجد بيانات</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <details className={style.details}>
        <summary>تفاصيل بنود الأموال للصفحة الحالية</summary>
        <div className={style.tableWrap}>
          <table className={style.tableStyle}>
            <thead>
              <tr>
                <th>رقم العضوية</th>
                {moneyFields.map((field) => (
                  <th key={field}>{field}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`money-${row.id || `${row.member_code}-${row.serial_no}`}`}>
                  <td>{row.member_code}</td>
                  {moneyFields.map((field) => (
                    <td key={field}>{formatMoney(row[field])}</td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={moneyFields.length + 1}>لا يوجد بيانات</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </details>

      <div className={style.pagination}>
        <Button
          variant="outline-primary"
          onClick={prevPage}
          disabled={loading || currentPage <= 1}
        >
          السابق
        </Button>
        <span>
          صفحة {currentPage} من {totalPages || 1}
        </span>
        <Button
          variant="outline-primary"
          onClick={nextPage}
          disabled={loading || currentPage >= totalPages}
        >
          التالي
        </Button>
      </div>
    </main>
  );
}
