-- Apply apply-rbac.sql first. Existing role assignments and permissions remain unchanged.
BEGIN;
CREATE TABLE IF NOT EXISTS public.user_privilege_overrides (
  user_id TEXT NOT NULL REFERENCES public.users(id),
  privilege_code TEXT NOT NULL REFERENCES public.privileges(code),
  effect TEXT NOT NULL CHECK (effect IN ('allow', 'deny')),
  assigned_by TEXT REFERENCES public.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, privilege_code)
);
COMMIT;
