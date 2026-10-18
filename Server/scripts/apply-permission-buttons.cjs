// Mechanical JSX edits only: preserve every existing handler and binding.
const fs = require('node:fs');
const h = require('../tests/regression/calculation-baseline/harness.cjs');
const files = [
  'components/Members/Members.jsx', 'components/MemberDetails/MemberDetails.jsx',
  'components/RefMemberDetails/RefMemberDetails.jsx', 'components/RelatedMember/RelatedMember.jsx',
  'components/MemberDetails/MemberAttachment.jsx', 'components/MembershipPrices/MembershipPricesPage.jsx',
  'components/LazyTable/Report.jsx', 'components/NewMembershipInstallments/InstallmentCycle.jsx',
];
const permissions = {
  'إضافة عضو جديد': 'members.create', 'تعليق العضويات المنتهية': 'memberships.expire',
  'تعديل البيانات': 'members.edit', 'طباعة الكارنيه': 'cards.print', 'إيقاف العضو': 'members.suspend',
  'إيقاف': 'members.suspend', 'فصل العضو ونقل العضوية': 'refs.separate', 'فصل': 'refs.separate', 'حذف': 'refs.delete',
  'تجديد العضوية': 'memberships.renew', 'تجديد إشتراك سباحة': 'memberships.swim',
  'ايصال اشتراك عضويه': 'receipts.print', 'إيصال دفع': 'receipts.print', 'إيصال إشتراك السباحة': 'receipts.print',
  'إيصال إشتراك السباحة': 'receipts.print', 'إضافة عضو تابع جديد': 'refs.create', 'إيصال إضافة تابع': 'receipts.print',
  'الحاق مرفق خارجي': 'attachments.manage', 'إستخراج تقرير': 'reports.print',
  'عقد جديد': 'installments.create', 'معاينة العقد': 'installments.create', 'حفظ العقد بدون تحصيل': 'installments.create',
  'تحصيل المقدم والرسوم': 'installments.collect_deposit', 'معاينة التحصيل': 'installments.collect', 'إلغاء العقد': 'installments.cancel_contract',
};
let changes = 0;
for (const file of files) {
  let source = fs.readFileSync(file, 'utf8');
  const inserts = [];
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXOpeningElement' && node.name.name === 'Button' && !node.attributes.some((item) => item.name?.name === 'permission')) {
      const attr = (key) => node.attributes.find((item) => item.name?.name === key)?.value?.value;
      const label = attr('label'), aria = attr('aria-label');
      let permission = permissions[label];
      if (label === 'تعديل البيانات' && file.includes('RefMemberDetails')) permission = 'refs.edit';
      if (label === 'حفظ' && file.includes('MembershipPrices')) permission = 'prices.edit';
      if (label === 'ارسال' && file.includes('MemberAttachment')) permission = 'attachments.manage';
      if (aria === 'إلغاء آخر تحصيل') permission = 'installments.cancel_payment';
      if (file.includes('InstallmentCycle') && attr('icon') === 'pi pi-print') permission = 'receipts.print';
      if (file.includes('InstallmentCycle') && label === 'تأكيد الإلغاء') permission = 'installments.cancel_payment';
      if (aria === 'طباعة العقد والجدول' || String(aria).startsWith('إيصال ')) permission = 'receipts.print';
      if (file.includes('InstallmentCycle') && label === 'تأكيد استلام المبلغ وإصدار الإيصال') inserts.push({ at: node.name.end, text: ' permission={paymentKind === "deposit" ? "installments.collect_deposit" : "installments.collect"}' });
      else if (permission) inserts.push({ at: node.name.end, text: ` permission="${permission}"` });
    }
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'comments', 'tokens'].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value === 'object') walk(value);
    }
  }
  walk(h.parse(source));
  if (!inserts.length) continue;
  for (const edit of inserts.sort((a, b) => b.at - a.at)) source = source.slice(0, edit.at) + edit.text + source.slice(edit.at);
  source = source.replace('import { Button } from "primereact/button";', 'import { AccessButton as Button } from "@components/Access/AccessButton";');
  fs.writeFileSync(file, source);
  changes += inserts.length;
}
console.log(`Added explicit permissions to ${changes} existing buttons; event handlers unchanged`);
