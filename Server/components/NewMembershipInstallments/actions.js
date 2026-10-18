"use server";
import prisma from "@app/api/db";
import { requirePrivilege, requireSafe } from "@lib/accessControl";
import { previewContract, createContract, listContracts, contractDetail, quotePayment, collectPayment, voidPayment, cancelContract } from "@lib/newMembershipInstallmentService";

async function run(permission, operation, cash = false) {
  try { const access = await requirePrivilege(permission); if (cash) requireSafe(access); return { ok: true, data: await operation(access.user, access) }; }
  catch (error) {
    const message = typeof error.message === "string" && /[\u0600-\u06ff]/.test(error.message) ? error.message : "تعذر إتمام العملية؛ لم يتم حفظ أي تحصيل. راجع الحسابات أو حاول مرة أخرى";
    return { ok: false, message };
  }
}
export async function previewAgreement(input) { return run("installments.create", () => previewContract(prisma, input)); }
export async function saveAgreement(input) { return run("installments.create", (actor) => createContract(prisma, actor, input)); }
export async function searchAgreements(search, status, page) { return run("installments.view", () => listContracts(prisma, search, status, page)); }
export async function getAgreement(id) { return run("installments.view", async (actor, access) => {
  const detail = await contractDetail(prisma, id);
  if (!access.privileges.includes("reports.all_safes")) detail.payments = detail.payments.filter((payment) => payment.safe_no === actor.safe_no);
  return detail;
}); }
export async function getPaymentQuote(id, kind, count) { return run(kind === "deposit" ? "installments.collect_deposit" : "installments.collect", () => quotePayment(prisma, id, kind, count), true); }
export async function postPayment(input) { return run(input.kind === "deposit" ? "installments.collect_deposit" : "installments.collect", (actor) => collectPayment(prisma, actor, input), true); }
export async function cancelPayment(id, paymentId, reason) { return run("installments.cancel_payment", (actor) => voidPayment(prisma, actor, id, paymentId, reason), true); }
export async function closeAgreement(id) { return run("installments.cancel_contract", (actor) => cancelContract(prisma, actor, id)); }
