-- Gezira membership Server database updates
-- Target database: clubserver
-- Target schema: public
-- Safe to rerun.

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
  ('maintenance_with_related', 'رسم صيانة وإنشاء عند وجود تابعين', 'رسوم التجديد', 100, 20),
  ('maintenance_without_related', 'رسم صيانة وإنشاء بدون تابعين', 'رسوم التجديد', 50, 30),
  ('special_section_member_renew', 'رسم تجديد العضو للقطاعات الخاصة 12 و 14', 'رسوم التجديد', 450, 40),
  ('special_section_ref_adult', 'رسم تجديد التابع البالغ للقطاعات الخاصة 12 و 14', 'رسوم التجديد', 450, 50),
  ('special_section_ref_child', 'رسم تجديد التابع غير البالغ للقطاعات الخاصة 12 و 14', 'رسوم التجديد', 350, 60),
  ('associated_underage_renew', 'رسم تجديد المنتسبة غير البالغة', 'رسوم التجديد', 60, 70),
  ('old_member_renew_fee', 'رسم تجديد العضو القديم', 'رسوم التجديد', 100, 75),
  ('old_reduced_renew_fee', 'رسم التجديد القديم للقيمة 60', 'رسوم التجديد', 50, 76),
  ('default_ref_adult_renew', 'رسم تجديد التابع البالغ الافتراضي', 'رسوم التجديد', 100, 80),
  ('reduced_sections_renew_multiplier', 'نسبة تخفيض التجديد للقطاعات 2 و 22 و 23', 'النسب', 0.5, 90),
  ('delay_penalty_one_year', 'نسبة غرامة تأخير سنة واحدة', 'الغرامات', 0.2, 100),
  ('delay_penalty_two_years', 'نسبة غرامة تأخير سنتين', 'الغرامات', 0.5, 110),
  ('delay_penalty_three_years', 'نسبة غرامة تأخير ثلاث سنوات', 'الغرامات', 0.7, 120),
  ('delay_penalty_four_plus_years', 'نسبة غرامة تأخير أربع سنوات فأكثر', 'الغرامات', 0.7, 130),
  ('fellowship_fund_fee', 'صندوق الزمالة', 'رسوم التجديد', 10, 135),
  ('vat_rate', 'نسبة ضريبة القيمة المضافة', 'النسب', 0.14, 140),
  ('swimming_fee', 'رسم اشتراك السباحة', 'رسوم ثابتة', 150, 150),
  ('separation_fee', 'رسم فصل العضوية', 'رسوم الفصل', 100, 160),
  ('separation_maintenance_fee', 'رسم الصيانة مع الفصل', 'رسوم الفصل', 50, 170),
  ('separation_card_fee', 'رسم البطاقة مع الفصل', 'رسوم الفصل', 4.39, 180),
  ('separation_total_amount', 'إجمالي الفصل في التقرير', 'رسوم الفصل', 162.7, 190)
ON CONFLICT (setting_key) DO UPDATE SET
  label = EXCLUDED.label,
  category = EXCLUDED.category,
  value = EXCLUDED.value,
  sort_order = EXCLUDED.sort_order,
  updated_at = CURRENT_TIMESTAMP;

COMMIT;
