export async function installmentContractState(db, memberCode) {
  if (!Number.isInteger(memberCode) || memberCode <= 0) return null;
  const rows = await db.$queryRaw`
    SELECT c.id, c.status FROM public.membership_installment_contracts c
    JOIN public.members m ON m.id = c.member_id
    WHERE m.member_code = ${memberCode} AND c.status <> 'cancelled'
    ORDER BY c.created_at DESC LIMIT 1
  `;
  return rows[0] || null;
}
export async function assertNoPendingInstallments(db, memberCode) {
  if (Number.isInteger(memberCode) && memberCode > 0) await db.$queryRaw`SELECT id FROM public.members WHERE member_code = ${memberCode} FOR UPDATE`;
  const contract = await installmentContractState(db, memberCode);
  if (contract && contract.status !== "active") throw new Error("العضوية تحت التقسيط؛ التحصيل والتفعيل من دورة تقسيط العضوية الجديدة فقط");
}
export async function isNewInstallmentReceiptNumber(db, receiptNumber) {
  const rows = await db.$queryRaw`
    SELECT p.id FROM public.membership_installment_payments p JOIN public.memberships m ON m.id = p.receipt_id
    WHERE m.serial_no = ${receiptNumber} LIMIT 1
  `;
  return rows.length > 0;
}
export async function memberInstallmentStates(db, ids) {
  if (!ids.length) return [];
  return db.$queryRaw`SELECT member_id, status FROM public.membership_installment_contracts WHERE member_id = ANY(${ids}::text[]) AND status IN ('awaiting_deposit','pending')`;
}
export async function isNewInstallmentReceipt(db, receiptId) {
  const rows = await db.$queryRaw`SELECT id FROM public.membership_installment_payments WHERE receipt_id = ${receiptId} LIMIT 1`;
  return rows.length > 0;
}
