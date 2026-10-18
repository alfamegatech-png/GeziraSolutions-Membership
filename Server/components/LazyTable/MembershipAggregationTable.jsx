"use client";
import React from "react";

const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const money = (value) => number(value).toFixed(2);

const sum = (rows, field) =>
  rows.reduce((total, row) => total + number(row[field]), 0);

export default function MembershipAggregationTable({
  data,
  price,
  vatFactor,
  clubUser,
  reportReceiptDate,
}) {
  const rows = data
    .filter((item) => number(item.total_amount) !== 0)
    .map((item) => {
      const active = number(item.canceled) === 0;
      let renewFee = number(item.renew_fee);
      let associatedFee = 0;
      let associatedVat = 0;
      let cardFee = number(item.membership_card_fee);
      let separationFee = number(item.seperate_fees);
      let maintenanceFee = number(item.maintenance_fee);
      let valueAddedTax = number(item.value_added_tax);
      let totalAmount = number(item.total_amount);

      if (active && number(item.new_ref_fees) > 0) {
        const newRefFees = number(item.new_ref_fees);
        cardFee = price("membership_card_fee");

        if (
          number(item.refAge) >= 22 &&
          number(item.member?.member_type) === 7
        ) {
          renewFee = price("default_ref_adult_renew");
          const fees = newRefFees - renewFee;
          associatedFee = fees * vatFactor() - cardFee;
          associatedVat = fees - fees * vatFactor();
        } else if ([7, 9].includes(number(item.member?.member_type))) {
          const adultReferenceCodes = [
            1, 2, 4, 9, 10, 43, 44, 49, 68, 69, 70, 79, 80,
          ];
          renewFee = adultReferenceCodes.includes(number(item.refType))
            ? price("default_ref_adult_renew")
            : price("associated_underage_renew");
          const fees = newRefFees - renewFee;
          const feesBeforeVat = Math.floor(newRefFees - cardFee - renewFee);
          associatedFee = Math.floor(feesBeforeVat * vatFactor());
          associatedVat = fees - fees * vatFactor();
        } else if ([1, 5].includes(number(item.member?.member_type))) {
          renewFee = 0;
          associatedFee = newRefFees * vatFactor() - cardFee;
          associatedVat = newRefFees - newRefFees * vatFactor();
        }

        // VAT applies to both the associated-member fee and the card fee.
        // Renewal is outside the taxable amount and may vary by member type.
        const vatRate = number(price("vat_rate"));
        const taxableBeforeVat =
          vatRate >= 0 ? (newRefFees - renewFee) / (1 + vatRate) : 0;

        associatedFee = Math.max(0, taxableBeforeVat - cardFee);
        associatedVat = Math.max(
          0,
          (associatedFee + cardFee) * vatRate
        );
      }

      if (active && number(item.seperate_fees) > 0) {
        separationFee = price("separation_fee");
        maintenanceFee = price("separation_maintenance_fee");
        cardFee = price("separation_card_fee");
        valueAddedTax =
          (maintenanceFee + cardFee) * price("vat_rate");
        totalAmount = price("separation_total_amount");
      }

      const swimming = number(item.swimming);
      const swimmingBeforeVat = swimming * vatFactor();
      const swimmingVat = swimming - swimmingBeforeVat;
      const beforeVat =
        active && number(item.new_ref_fees) > 0
          ? renewFee + associatedFee + cardFee
          : totalAmount - valueAddedTax;

      return {
        active,
        memberCode: item.member_code,
        memberName: item.member?.name || "",
        renewFee,
        previousYearsFee: number(item.prev_years_fee),
        delayPenalty: number(item.delay_penalty),
        previousPenalties: number(item.previous_penalties),
        fellowshipFundFee: number(item.fellowship_fund_fee),
        transferSeparationFee: number(item.transfer_separation_fee),
        installment: number(item.installment),
        feeDifference: 0,
        associatedFee,
        firstTimeFee: number(item.first_time_fee),
        separationFee,
        maintenanceFee,
        cardFee,
        joinFee: number(item.join_fee),
        swimmingBeforeVat,
        beforeVat,
        swimmingVat,
        valueAddedTax: valueAddedTax + associatedVat,
        totalAmount,
        paymentNumber: `${item.safe_no ?? ""}${item.serial_no ?? ""}`,
        paymentDate: item.member_order_date
          ? new Date(item.member_order_date).toLocaleDateString(undefined, {
              timeZone: "UTC",
            })
          : "",
        status: item.rel_canceled?.name || "",
      };
    });

  // The aggregation must always equal the values displayed in the table.
  // Cancelled rows remain visible, but are intentionally excluded from totals.
  const activeRows = rows.filter((row) => row.active);
  const renewalReceiptCount = activeRows.filter(
    (row) => number(row.renewFee) > 0
  ).length;

  const columns = [
    ["renewFee", ["تجديد"]],
    ["previousYearsFee", ["سنوات", "سابقة"]],
    ["delayPenalty", ["غرامة", "تأخير"]],
    ["previousPenalties", ["غرامات", "سابقة"]],
    ["fellowshipFundFee", ["صندوق", "الزمالة"]],
    ["transferSeparationFee", ["رسوم التحويل", "والفصل"]],
    ["installment", ["قسط.ق.م"]],
    ["feeDifference", ["فرق", "اشتراك"]],
    ["associatedFee", ["إضافة", "تابع"]],
    ["firstTimeFee", ["عضوية", "أول مرة"]],
    ["separationFee", ["فصل/نقل", "عضوية"]],
    ["maintenanceFee", ["رسم صيانة", "وإنشاء"]],
    ["cardFee", ["بطاقة", "عضوية"]],
    ["joinFee", ["رسم", "التحاق"]],
    ["swimmingBeforeVat", ["رسم اشتراك", "السباحة"]],
    ["beforeVat", ["إجمالي", "ق-ق"]],
    ["swimmingVat", ["ضريبة", "السباحة"]],
    ["valueAddedTax", ["قيمة", "مضافة"]],
    ["totalAmount", ["الإجمالي"]],
  ];

  const formattedReportDate = reportReceiptDate
    ? new Date(reportReceiptDate).toLocaleDateString("ar-EG", {
        timeZone: "UTC",
      })
    : "";

  // A4 landscape height is shared by the 2.5 cm header, 2.2 cm footer,
  // heading, page metadata, signatures, and (on the last page) totals.
  // Increased from 18 to make better use of the remaining page height now
  // that the header row uses a smaller, two-line font.
  const rowsPerPage = 26;
  const longestMemberName = rows.reduce(
    (longest, row) => Math.max(longest, row.memberName.length),
    0
  );
  const nameColumnWidth = `${Math.min(
    Math.max(longestMemberName + 1, 13),
    24
  )}ch`;
  const pages = rows.length
    ? Array.from(
        { length: Math.ceil(rows.length / rowsPerPage) },
        (_, pageIndex) =>
          rows.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage)
      )
    : [[]];

  return (
    <div className="report-pages">
      {pages.map((pageRows, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;

        return (
          <section className="report-sheet" key={`report-page-${pageIndex}`}>
            <header className="report-sheet-header">
              <img src="/images/reports/p14-header.png" alt="" />
            </header>

            <div className="report-heading">
              <div className="report-title">تقرير تجميع إيصالات العضوية</div>
              <div className="report-title-details">
                <span>إحصائية خزينة رقم: {clubUser?.safe_no ?? ""}</span>
                <span>اسم مسئول الخزينة: {clubUser?.fullname ?? ""}</span>
                <span>تاريخ الإيصال: {formattedReportDate}</span>
              </div>
            </div>

            <div className="report-table-area">
              <table className="aggregation-table">
                <thead>
                  <tr>
                    <th className="row-number">م</th>
                    <th>رقم العضوية</th>
                    <th
                      className="member-name"
                      style={{ width: nameColumnWidth }}
                    >
                      الاسم
                    </th>
                    {columns.map(([field, titleLines]) => (
                      <th key={field}>
                        {titleLines.map((line, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <br />}
                            {line}
                          </React.Fragment>
                        ))}
                      </th>
                    ))}
                    <th>إذن دفع رقم</th>
                    <th>تاريخ الإذن</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, rowIndex) => (
                    <tr key={`${row.paymentNumber}-${rowIndex}`}>
                      <td className="row-number">
                        {pageIndex * rowsPerPage + rowIndex + 1}
                      </td>
                      <td>{row.memberCode}</td>
                      <td
                        className="member-name"
                        style={{ width: nameColumnWidth }}
                      >
                        {row.memberName}
                      </td>
                      {columns.map(([field]) => (
                        <td key={field}>{money(row[field])}</td>
                      ))}
                      <td>{row.paymentNumber}</td>
                      <td>{row.paymentDate}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                  {isLastPage && (
                    <tr className="sum">
                      <td colSpan={3}>الإجماليات</td>
                      {columns.map(([field]) => (
                        <td key={field}>{money(sum(activeRows, field))}</td>
                      ))}
                      <td colSpan={3}></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="report-sheet-meta">
              <div className="report-receipt-count">
                عدد إيصالات التجديد: {renewalReceiptCount}
              </div>
              <div className="report-page-number">
                صفحة {pageIndex + 1} من {pages.length}
              </div>
            </div>

            <div className="report-signatures">
              <div>توقيع مسئول خزينة داخلية</div>
              <div>توقيع مراجع الخزينة</div>
              <div>توقيع رئيس قسم العضوية</div>
            </div>

            <footer className="report-sheet-footer">
              <img src="/images/reports/p14-footer.png" alt="" />
            </footer>
          </section>
        );
      })}
    </div>
  );
}
