ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS transfer_separation_fee DOUBLE PRECISION DEFAULT 0;
