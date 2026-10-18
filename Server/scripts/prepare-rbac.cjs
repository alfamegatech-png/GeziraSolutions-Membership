const fs = require('node:fs');
const h = require('../tests/regression/calculation-baseline/harness.cjs');
const { PRIVILEGES, ROLES } = h.evaluateModule(h.root, 'lib/privilegeCatalog.js');
const q = (value) => "'" + String(value).replace(/'/g, "''") + "'";
const sql = `-- Additive role/privilege tables. No existing user receives an implicit role.
BEGIN;
CREATE TABLE IF NOT EXISTS public.privileges(code TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS public.roles(code TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS public.role_privileges(role_code TEXT NOT NULL REFERENCES public.roles(code), privilege_code TEXT NOT NULL REFERENCES public.privileges(code), PRIMARY KEY(role_code,privilege_code));
CREATE TABLE IF NOT EXISTS public.user_roles(user_id TEXT NOT NULL REFERENCES public.users(id), role_code TEXT NOT NULL REFERENCES public.roles(code), assigned_by TEXT REFERENCES public.users(id), assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,role_code));
CREATE TABLE IF NOT EXISTS public.access_screen_owners(screen_code TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES public.users(id));
CREATE TABLE IF NOT EXISTS public.security_audit(id TEXT PRIMARY KEY, actor_id TEXT REFERENCES public.users(id), action TEXT NOT NULL, target_id TEXT, before_value JSONB, after_value JSONB, reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS security_audit_time ON public.security_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS user_roles_role ON public.user_roles(role_code);
INSERT INTO public.privileges(code,name,category) VALUES
${PRIVILEGES.map((row) => '(' + row.map(q).join(',') + ')').join(',\n')}
ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,category=EXCLUDED.category;
INSERT INTO public.roles(code,name) VALUES ${ROLES.map((row) => `(${q(row.code)},${q(row.name)})`).join(',\n')}
ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO public.role_privileges(role_code,privilege_code) VALUES
${ROLES.flatMap((role) => role.privileges.map((permission) => `(${q(role.code)},${q(permission)})`)).join(',\n')}
ON CONFLICT DO NOTHING;
COMMIT;
`;
fs.writeFileSync('scripts/apply-rbac.sql', sql);
console.log(`Generated ${PRIVILEGES.length} privileges and ${ROLES.length} roles; no user assignments`);
