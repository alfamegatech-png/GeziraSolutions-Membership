export function installmentReceiptColumns(contract, payment) {
  const fees = payment.kind === "deposit" ? contract.fee_snapshot : {};
  return [
    ["عضوية أول مرة", 0], ["رسم التحاق", 0], ["تجديد", fees.renew_fee],
    ["بطاقة عضوية", fees.membership_card_fee], ["سنوات سابقة", 0],
    ["غرامة تأخير", payment.penalty_cents], ["غرامات سابقة", 0],
    ["صندوق الزمالة", fees.fellowship_fund_fee], ["رسوم التحويل والفصل", 0],
    ["قسط ق.م", payment.principal_cents], ["فرق اشتراك", 0],
    ["إضافة تابع", 0], ["فصل / نقل عضوية", 0],
    ["رسم صيانة وإنشاء", fees.maintenance_fee], ["رسم الدولاب", 0],
    ["قيمة مضافة", fees.value_added_tax], ["رسم اشتراك السباحة", 0],
  ].map(([label, cents]) => ({ label, cents: Number(cents || 0) }));
}
