-- Additive migration. No financial records or user privileges are changed.
BEGIN;
CREATE TABLE IF NOT EXISTS public.system_license (
  id TEXT PRIMARY KEY CHECK (id='membership'),
  envelope TEXT NOT NULL,
  activated_by TEXT NOT NULL REFERENCES public.users(id),
  activated_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL
);
COMMIT;
