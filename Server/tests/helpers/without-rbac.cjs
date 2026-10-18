// Remove only explicitly authorized access checks when comparing legacy financial source.
module.exports = function withoutRbac(source, file) {
  source = source.replace(/^import \{[^\n]+\} from "@lib\/accessControl";\n/gm, '');
  if (file === 'components/LazyTable/report.js') return source
    .replace('  const access = await requirePrivilege("reports.view");\n', '')
    .replace('  include = safeInclude(include);\n', '')
    .replace('  if (!access.privileges.includes("reports.all_safes")) filter1 = { AND: [filter1 || {}, { safe_no: scopeSafe(access) }] };\n', '');
  if (file === 'components/MembershipPrices/priceSettingsActions.js') return source
    .replace('import crypto from "crypto";\n', '')
    .replaceAll('  await requirePrivilege("prices.view");\n', '')
    .replaceAll('  await requirePrivilege("prices.manage");\n', '')
    .replace('  const access = await requirePrivilege("prices.edit");\n', '')
    .replace('    const before = await tx.$queryRaw`SELECT setting_key,value FROM public.membership_price_settings ORDER BY setting_key`;\n', '')
    .replace('    await tx.$executeRaw`INSERT INTO public.security_audit(id,actor_id,action,before_value,after_value) VALUES (${crypto.randomUUID()},${access.user.id},\'prices.changed\',${JSON.stringify(before)}::jsonb,${JSON.stringify({ fixedSettings, memberTypes, refTypes })}::jsonb)`;\n', '');
  source = source.replace('  try { await requirePrivilege("reports.export"); } catch (error) { return Response.json({ message: error.status ? error.message : "تعذر التحقق من الصلاحيات" }, { status: error.status || 503 }); }\n', '')
    .replace('  try { await requirePrivilege("cards.print"); } catch (error) { return Response.json({ message: error.status ? error.message : "تعذر التحقق من الصلاحيات" }, { status: error.status || 503 }); }\n', '')
    .replace('    await requirePrivilege("attachments.manage");\n', '')
    .replace('    }, { status: err.status || 500 });', '    });');
  if (file === 'app/api/membership-prices/route.js') source = source
    .replace('  getMembershipPriceSettingsMap,\n', '')
    .replace('export async function GET(request)', 'export async function GET()')
    .replace('    if (request && new URL(request.url).searchParams.get("mode") === "calculation") return NextResponse.json(await getMembershipPriceSettingsMap());\n', '')
    .replace('{ message: error.status ? error.message : "تعذر تحميل الأسعار" }', '{ message: "تعذر تحميل الأسعار" }')
    .replace('{ status: error.status || 500 }', '{ status: 500 }')
    .replace('{ message: error.status ? error.message : "تعذر حفظ الأسعار" }, { status: error.status || 500 }', '{ message: "تعذر حفظ الأسعار" }, { status: 500 }');
  if (file === 'components/MembershipPrices/priceSettingsClient.js') {
    const current = '    const response = await fetch("/api/membership-prices?mode=calculation", { cache: "no-store" });\n    if (!response.ok) throw new Error("Failed to load calculation prices");\n    return { ...DEFAULT_PRICE_SETTINGS_MAP, ...await response.json() };';
    const before = '    const data = await fetchMembershipPricesData();\n    return data.fixedSettings.reduce(\n      (settings, row) => ({\n        ...settings,\n        [row.key]: Number(row.value),\n      }),\n      { ...DEFAULT_PRICE_SETTINGS_MAP }\n    );';
    source = source.replace(current, before);
  }
  return source;
};
