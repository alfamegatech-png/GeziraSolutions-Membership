const crypto = require('node:crypto');
require('@next/env').loadEnvConfig(process.cwd());
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  const login = process.argv[2];
  if (!login) throw new Error('Usage: node scripts/bootstrap-rbac-admin.cjs <exact login or email>');
  const users = await db.users.findMany({ where: { OR: [{ name: login }, { email: login }] }, select: { id: true, name: true } });
  if (users.length !== 1) throw new Error('Login must identify exactly one existing user');
  const user = users[0];
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(20261018)::text AS lock`;
    const current = await tx.$queryRaw`SELECT user_id FROM public.user_roles WHERE role_code='system_admin'`;
    if (current.some((row) => row.user_id === user.id)) return;
    if (current.length) throw new Error('An administrator already exists; use the role administration screen');
    await tx.$executeRaw`INSERT INTO public.user_roles(user_id,role_code) VALUES (${user.id},'system_admin')`;
    await tx.$executeRaw`INSERT INTO public.security_audit(id,action,target_id,before_value,after_value,reason) VALUES (${crypto.randomUUID()},'user_roles.bootstrap',${user.id},'[]'::jsonb,'["system_admin"]'::jsonb,'Explicit local administrator bootstrap')`;
  });
  console.log(`Administrator initialized for ${user.name}. No other user roles were changed.`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => db.$disconnect());
