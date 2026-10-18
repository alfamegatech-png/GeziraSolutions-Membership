-- Apply scripts/apply-rbac.sql first. Explicit company account authorized by the owner.
BEGIN;
DO $$ BEGIN
  IF (SELECT COUNT(*) FROM public.users WHERE email='Admin@gmail.com') <> 1 OR
     (SELECT COUNT(*) FROM public.users WHERE email='m.saeed@gmail.com') <> 1 THEN
    RAISE EXCEPTION 'Expected administrator accounts are missing or ambiguous';
  END IF;
END $$;
INSERT INTO public.security_audit(id,actor_id,action,target_id,before_value,after_value,reason)
SELECT gen_random_uuid()::text,actor.id,'user_roles.changed',company.id,
  COALESCE((SELECT jsonb_agg(role_code ORDER BY role_code) FROM public.user_roles WHERE user_id=company.id),'[]'::jsonb),
  '["system_admin"]'::jsonb,'Company account explicitly granted system administrator by the owner'
FROM public.users company CROSS JOIN public.users actor
WHERE company.email='Admin@gmail.com' AND actor.email='m.saeed@gmail.com'
AND NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=company.id AND role_code='system_admin');
INSERT INTO public.user_roles(user_id,role_code,assigned_by)
SELECT company.id,'system_admin',actor.id FROM public.users company CROSS JOIN public.users actor
WHERE company.email='Admin@gmail.com' AND actor.email='m.saeed@gmail.com'
ON CONFLICT DO NOTHING;
INSERT INTO public.security_audit(id,actor_id,action,target_id,before_value,after_value,reason)
SELECT gen_random_uuid()::text,actor.id,'company_prices.owner_assigned',company.id,
  (SELECT to_jsonb(o) FROM public.access_screen_owners o WHERE screen_code='membership_prices'),
  jsonb_build_object('screen_code','membership_prices','user_id',company.id),
  'Membership price settings screen and editing restricted to the company account'
FROM public.users company CROSS JOIN public.users actor
WHERE company.email='Admin@gmail.com' AND actor.email='m.saeed@gmail.com'
AND NOT EXISTS(SELECT 1 FROM public.access_screen_owners WHERE screen_code='membership_prices' AND user_id=company.id);
INSERT INTO public.access_screen_owners(screen_code,user_id)
SELECT 'membership_prices',id FROM public.users WHERE email='Admin@gmail.com'
ON CONFLICT(screen_code) DO UPDATE SET user_id=EXCLUDED.user_id;
COMMIT;
