BEGIN;
CREATE TABLE IF NOT EXISTS public.membership_installment_contracts (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES public.members(id),
  price_cents BIGINT NOT NULL CHECK (price_cents > 2000000 AND price_cents <= 1000000000000),
  deposit_cents BIGINT NOT NULL CHECK (deposit_cents >= 2000000 AND deposit_cents < price_cents),
  extras_cents BIGINT NOT NULL DEFAULT 0 CHECK (extras_cents >= 0),
  fee_snapshot JSONB NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly','quarterly','semiannual')),
  application_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_deposit' CHECK (status IN ('awaiting_deposit','pending','active','cancelled')),
  created_by TEXT NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activated_at TIMESTAMPTZ,
  cancelled_by TEXT REFERENCES public.users(id),
  cancelled_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS membership_installment_one_contract_per_member
  ON public.membership_installment_contracts(member_id) WHERE status <> 'cancelled';
CREATE TABLE IF NOT EXISTS public.membership_installment_payments (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES public.membership_installment_contracts(id),
  receipt_id TEXT NOT NULL UNIQUE REFERENCES public.memberships(id),
  kind TEXT NOT NULL CHECK (kind IN ('deposit','installment')),
  principal_cents BIGINT NOT NULL CHECK (principal_cents > 0),
  extras_cents BIGINT NOT NULL DEFAULT 0 CHECK (extras_cents >= 0),
  penalty_cents BIGINT NOT NULL DEFAULT 0 CHECK (penalty_cents >= 0),
  amount_cents BIGINT NOT NULL CHECK (amount_cents = principal_cents + extras_cents + penalty_cents),
  allocations JSONB NOT NULL,
  payment_date DATE NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL,
  user_id TEXT NOT NULL REFERENCES public.users(id),
  safe_no INTEGER NOT NULL CHECK (safe_no > 0),
  request_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','void')),
  void_by TEXT REFERENCES public.users(id),
  void_at TIMESTAMPTZ,
  void_reason TEXT
);
CREATE TABLE IF NOT EXISTS public.membership_installment_items (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES public.membership_installment_contracts(id),
  number SMALLINT NOT NULL CHECK (number BETWEEN 1 AND 12),
  due_date DATE NOT NULL CHECK (EXTRACT(DAY FROM due_date) = 1),
  principal_cents BIGINT NOT NULL CHECK (principal_cents > 0),
  paid_payment_id TEXT REFERENCES public.membership_installment_payments(id),
  paid_at TIMESTAMPTZ,
  paid_penalty_cents BIGINT NOT NULL DEFAULT 0 CHECK (paid_penalty_cents >= 0),
  UNIQUE(contract_id, number),
  CHECK ((paid_payment_id IS NULL) = (paid_at IS NULL))
);
CREATE INDEX IF NOT EXISTS membership_installment_items_due ON public.membership_installment_items(contract_id, number);
CREATE INDEX IF NOT EXISTS membership_installment_payments_contract ON public.membership_installment_payments(contract_id, paid_at);
COMMIT;
