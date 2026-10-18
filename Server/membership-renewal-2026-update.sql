-- Renewal pricing update for the old Server app.
-- Safe to rerun.

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS previous_penalties DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fellowship_fund_fee DOUBLE PRECISION DEFAULT 0;

INSERT INTO public.membership_price_settings
  (setting_key, label, category, value, sort_order)
VALUES
  ('membership_card_fee', 'رسم بطاقة العضوية لكل سنة ولكل فرد', 'رسوم التجديد', 15, 10),
  ('old_membership_card_fee', 'رسم بطاقة العضوية القديم لكل سنة ولكل فرد', 'رسوم التجديد', 5, 15),
  ('fellowship_fund_fee', 'صندوق الزمالة', 'رسوم التجديد', 10, 135),
  ('associated_underage_renew', 'رسم تجديد المنتسبة غير البالغة', 'رسوم التجديد', 60, 70),
  ('old_member_renew_fee', 'رسم تجديد العضو القديم', 'رسوم التجديد', 100, 75),
  ('old_reduced_renew_fee', 'رسم التجديد القديم للقيمة 60', 'رسوم التجديد', 50, 76),
  ('delay_penalty_one_year', 'نسبة غرامة تأخير سنة واحدة', 'الغرامات', 0.2, 100),
  ('delay_penalty_two_years', 'نسبة غرامة تأخير سنتين', 'الغرامات', 0.5, 110),
  ('delay_penalty_three_years', 'نسبة غرامة تأخير ثلاث سنوات', 'الغرامات', 0.7, 120),
  ('delay_penalty_four_plus_years', 'نسبة غرامة تأخير أربع سنوات فأكثر', 'الغرامات', 0.7, 130)
ON CONFLICT (setting_key) DO UPDATE SET
  label = EXCLUDED.label,
  category = EXCLUDED.category,
  value = EXCLUDED.value,
  sort_order = EXCLUDED.sort_order,
  updated_at = CURRENT_TIMESTAMP;
