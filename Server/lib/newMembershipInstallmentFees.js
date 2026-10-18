function adult(birth, paymentDate) {
  const date = new Date(birth);
  if (!birth || Number.isNaN(date.getTime())) throw new Error("راجع تاريخ الميلاد قبل التعاقد");
  const now = new Date(`${paymentDate}T00:00:00Z`);
  let years = now.getUTCFullYear() - date.getUTCFullYear();
  if (now.getUTCMonth() < date.getUTCMonth() || (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate())) years--;
  return years >= 21;
}
export function newMembershipFees(member, prices, paymentDate, priceCents) {
  if (!member.rel_member_type || !Number.isFinite(Number(member.rel_member_type.price))) throw new Error("راجع نوع العضوية وسعر التجديد");
  const refs = member.rel_members.filter((row) => row.deleted === 0);
  const latest = (fee) => Number(fee) === prices.old_reduced_renew_fee ? prices.associated_underage_renew : Number(fee || 0);
  const special = [12, 14].includes(member.section);
  const underageAssociated = member.rel_member_type?.name === "منتسبه" && !adult(member.birth_date, paymentDate);
  let renew = special ? prices.special_section_member_renew : underageAssociated ? prices.associated_underage_renew : latest(member.rel_member_type?.price);
  for (const ref of refs) {
    if (!ref.rel_ref || !ref.birth_date) throw new Error("راجع تاريخ الميلاد وصلة القرابة لكل تابع قبل التعاقد");
    renew += special ? (adult(ref.birth_date, paymentDate) ? prices.special_section_ref_adult : prices.special_section_ref_child)
      : underageAssociated ? (adult(ref.birth_date, paymentDate) ? prices.associated_underage_renew : latest(ref.rel_ref.price))
      : adult(ref.birth_date, paymentDate) ? prices.default_ref_adult_renew : latest(ref.rel_ref.price);
  }
  if ([2, 22, 23].includes(member.section)) renew *= prices.reduced_sections_renew_multiplier;
  const fees = {
    renew_fee: Math.round(renew * 100),
    maintenance_fee: Math.round((refs.length ? prices.maintenance_with_related : prices.maintenance_without_related) * 100),
    membership_card_fee: Math.round(prices.membership_card_fee * (refs.length + 1) * 100),
    fellowship_fund_fee: Math.round(prices.fellowship_fund_fee * 100),
  };
  const vatCents = Math.round((priceCents + fees.maintenance_fee + fees.membership_card_fee) * prices.vat_rate);
  if (Object.values(fees).some((value) => !Number.isSafeInteger(value) || value < 0) || !Number.isSafeInteger(vatCents) || vatCents < 0) throw new Error("إعدادات الأسعار غير صالحة للتعاقد");
  const membershipVat = Math.round(priceCents * prices.vat_rate);
  return { ...fees, value_added_tax: vatCents, membership_vat_cents: membershipVat, annual_vat_cents: vatCents - membershipVat, vat_rate: prices.vat_rate, dependent_count: refs.length,
    total_cents: Object.values(fees).reduce((sum, value) => sum + value, 0) + vatCents };
}
