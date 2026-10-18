"use server";

import prisma from "@app/api/db";
import crypto from "crypto";
import { requirePrivilege } from "@lib/accessControl";
import {
  DEFAULT_PRICE_SETTINGS_MAP,
  FIXED_PRICE_SETTINGS,
} from "./priceSettingsConfig";

const fixedSettingKeys = new Set(FIXED_PRICE_SETTINGS.map((item) => item.key));

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error("Invalid numeric price setting");
  }
  return String(number);
}

async function ensurePriceSettingsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.membership_price_settings (
      setting_key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      category TEXT NOT NULL,
      value DOUBLE PRECISION NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const setting of FIXED_PRICE_SETTINGS) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO public.membership_price_settings
        (setting_key, label, category, value, sort_order)
      VALUES
        (${sqlString(setting.key)}, ${sqlString(setting.label)}, ${sqlString(
      setting.category
    )}, ${sqlNumber(setting.value)}::double precision, ${sqlNumber(
      setting.sortOrder
    )}::integer)
      ON CONFLICT (setting_key) DO UPDATE SET
        label = EXCLUDED.label,
        category = EXCLUDED.category,
        sort_order = EXCLUDED.sort_order
    `);
  }
}

export async function getMembershipPriceSettingsMap() {
  await requirePrivilege("prices.view");
  try {
    await ensurePriceSettingsTable();
    const rows = await prisma.$queryRaw`
      SELECT setting_key, value
      FROM public.membership_price_settings
    `;

    return rows.reduce(
      (settings, row) => ({
        ...settings,
        [row.setting_key]: Number(row.value),
      }),
      { ...DEFAULT_PRICE_SETTINGS_MAP }
    );
  } catch (error) {
    console.error("Error loading membership price settings:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
    return { ...DEFAULT_PRICE_SETTINGS_MAP };
  }
}

export async function getMembershipPricesData() {
  await requirePrivilege("prices.manage");
  await ensurePriceSettingsTable();

  const [fixedSettings, memberTypes, refTypes] = await Promise.all([
    prisma.$queryRaw`
      SELECT setting_key, label, category, value, sort_order
      FROM public.membership_price_settings
      ORDER BY sort_order ASC
    `,
    prisma.lookup_member_type.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true, price: true },
    }),
    prisma.lookup_ref.findMany({
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        member_type: true,
        price: true,
      },
    }),
  ]);

  return {
    fixedSettings: fixedSettings.map((item) => ({
      key: item.setting_key,
      label: item.label,
      category: item.category,
      value: Number(item.value),
      sortOrder: item.sort_order,
    })),
    memberTypes,
    refTypes,
  };
}

export async function updateMembershipPrices({
  fixedSettings = [],
  memberTypes = [],
  refTypes = [],
}) {
  const access = await requirePrivilege("prices.edit");
  await ensurePriceSettingsTable();

  await prisma.$transaction(async (tx) => {
    const before = await tx.$queryRaw`SELECT setting_key,value FROM public.membership_price_settings ORDER BY setting_key`;
    for (const setting of fixedSettings) {
      if (!fixedSettingKeys.has(setting.key)) {
        continue;
      }

      await tx.$executeRawUnsafe(`
        UPDATE public.membership_price_settings
        SET value = ${sqlNumber(setting.value)}::double precision,
            updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = ${sqlString(setting.key)}
      `);
    }

    for (const memberType of memberTypes) {
      await tx.lookup_member_type.update({
        where: { id: memberType.id },
        data: {
          price:
            memberType.value === "" || memberType.value === null
              ? null
              : Number(memberType.value),
        },
      });
    }

    for (const refType of refTypes) {
      await tx.lookup_ref.update({
        where: { id: refType.id },
        data: { price: Number(refType.value) },
      });
    }
    await tx.$executeRaw`INSERT INTO public.security_audit(id,actor_id,action,before_value,after_value) VALUES (${crypto.randomUUID()},${access.user.id},'prices.changed',${JSON.stringify(before)}::jsonb,${JSON.stringify({ fixedSettings, memberTypes, refTypes })}::jsonb)`;
  });

  return { status: "success" };
}
