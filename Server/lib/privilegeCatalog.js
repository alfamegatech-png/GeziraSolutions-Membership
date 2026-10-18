export const PRIVILEGES = [
  ["members.view", "عرض الأعضاء", "الأعضاء"], ["members.create", "إضافة عضو", "الأعضاء"], ["members.edit", "تعديل عضو", "الأعضاء"], ["members.suspend", "إيقاف عضو أو تابع", "الأعضاء"],
  ["refs.view", "عرض التابعين", "التابعون"], ["refs.create", "إضافة تابع", "التابعون"], ["refs.edit", "تعديل تابع", "التابعون"], ["refs.delete", "حذف تابع", "التابعون"], ["refs.separate", "فصل ونقل العضوية", "التابعون"],
  ["attachments.view", "عرض المرفقات", "المرفقات"], ["attachments.manage", "إضافة مرفقات وصور", "المرفقات"], ["cards.print", "طباعة الكارنيهات", "الطباعة"],
  ["memberships.subscribe", "تحصيل اشتراك جديد وإضافة تابع", "التحصيل"], ["memberships.renew", "تحصيل تجديد عضوية", "التحصيل"], ["memberships.swim", "تحصيل اشتراك سباحة", "التحصيل"], ["memberships.expire", "تعليق العضويات المنتهية", "الأعضاء"],
  ["receipts.view", "عرض الإيصالات", "الإيصالات"], ["receipts.print", "طباعة الإيصالات", "الإيصالات"], ["receipts.cancel", "إلغاء إيصال وقيده المالي", "الإيصالات"],
  ["installments.view", "عرض عقود التقسيط", "التقسيط"], ["installments.create", "إنشاء عقد تقسيط", "التقسيط"], ["installments.collect_deposit", "تحصيل مقدم التقسيط", "التقسيط"], ["installments.collect", "تحصيل الأقساط", "التقسيط"], ["installments.cancel_payment", "إلغاء تحصيل تقسيط", "التقسيط"], ["installments.cancel_contract", "إلغاء عقد تقسيط", "التقسيط"],
  ["reports.view", "عرض اليومية والتقارير المالية", "التقارير"], ["reports.print", "طباعة التقارير", "التقارير"], ["reports.export", "تصدير البيانات", "التقارير"], ["reports.all_safes", "عرض جميع الخزائن", "التقارير"],
  ["prices.view", "قراءة أسعار الحسابات", "الإعدادات"], ["prices.manage", "شاشة إعدادات الأسعار - حساب الشركة", "الإعدادات"], ["prices.edit", "تعديل الأسعار - حساب الشركة", "الإعدادات"], ["users.roles.manage", "إسناد أدوار المستخدمين", "الإدارة"], ["audit.view", "عرض سجل الصلاحيات", "الإدارة"],
  ["lockers.view", "عرض إيرادات الدواليب", "الدواليب"], ["lockers.collect", "تحصيل الدواليب", "الدواليب"], ["legacy_installments.view", "عرض التقسيط القديم", "التقسيط القديم"],
];
const read = ["members.view", "refs.view", "attachments.view", "receipts.view", "prices.view", "installments.view"];
const collect = ["memberships.subscribe", "memberships.renew", "memberships.swim", "installments.collect_deposit", "installments.collect", "lockers.collect"];
export const ROLES = [
  { code: "system_admin", name: "مدير النظام", privileges: PRIVILEGES.map(([code]) => code) },
  { code: "membership_staff", name: "موظف العضويات", privileges: [...read, "members.create", "members.edit", "members.suspend", "refs.create", "refs.edit", "refs.delete", "refs.separate", "attachments.manage", "cards.print", "receipts.print", "installments.create"] },
  { code: "cashier", name: "محصل الخزينة", privileges: [...read, ...collect, "cards.print", "receipts.print", "reports.view", "reports.print", "lockers.view"] },
  { code: "auditor", name: "مراجع الحسابات", privileges: [...read, "receipts.print", "reports.view", "reports.print", "reports.export", "reports.all_safes", "audit.view", "lockers.view", "legacy_installments.view"] },
  { code: "accounts_supervisor", name: "مشرف الحسابات", privileges: [...read, ...collect, "receipts.print", "receipts.cancel", "installments.cancel_payment", "installments.cancel_contract", "reports.view", "reports.print", "reports.export", "reports.all_safes", "audit.view", "lockers.view", "legacy_installments.view"] },
];
export function routePrivilege(path) {
  if (path.startsWith("/club/security-audit")) return "audit.view";
  if (path.startsWith("/club/user-roles")) return "users.roles.manage";
  if (path.startsWith("/club/membership-prices")) return "prices.manage";
  if (path.startsWith("/club/new-membership-installments")) return "installments.view";
  if (path.startsWith("/club/installments")) return "legacy_installments.view";
  if (path.startsWith("/club/memberships")) return "receipts.view";
  if (path.startsWith("/club/dailyLockersRevenues")) return "lockers.view";
  if (path.startsWith("/club/members-ref") || path.startsWith("/club/suspendedMembersRef") || path.startsWith("/club/members/ref/")) return "refs.view";
  return "members.view";
}
