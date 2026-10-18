-- SuperAdmin membership renewal updates
-- Target database: clubNew
-- Target schema: public

BEGIN;

CREATE TABLE IF NOT EXISTS public.membership_price_settings (
  setting_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS previous_penalties DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fellowship_fund_fee DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transfer_separation_fee DOUBLE PRECISION DEFAULT 0;

INSERT INTO public.membership_price_settings
  (setting_key, label, category, value, sort_order)
VALUES
  ('membership_card_fee', 'رسم بطاقة العضوية لكل سنة ولكل فرد', 'رسوم التجديد', 15, 10),
  ('old_membership_card_fee', 'رسم بطاقة العضوية القديم لكل سنة ولكل فرد', 'رسوم التجديد', 5, 15),
  ('fellowship_fund_fee', 'صندوق الزمالة', 'رسوم التجديد', 10, 135),
  ('associated_underage_renew', 'رسم تجديد المنتسبة غير البالغة', 'رسوم التجديد', 60, 70),
  ('old_member_renew_fee', 'رسم تجديد العضو القديم', 'رسوم التجديد', 100, 75),
  ('old_reduced_renew_fee', 'رسم التجديد القديم للقيمة 60', 'رسوم التجديد', 50, 76),
  ('vat_rate', 'نسبة ضريبة القيمة المضافة', 'النسب', 0.14, 140)
ON CONFLICT (setting_key) DO UPDATE SET
  label = EXCLUDED.label,
  category = EXCLUDED.category,
  value = EXCLUDED.value,
  sort_order = EXCLUDED.sort_order,
  updated_at = CURRENT_TIMESTAMP;

COMMIT;
