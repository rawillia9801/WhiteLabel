-- Separate subscription tier from the optional Brand Launch / custom-domain add-on.
-- Existing custom-domain-package kennels keep their domain entitlement and move to Professional.
alter table public.kennels add column if not exists domain_addon_enabled boolean not null default false;

update public.kennels
set domain_addon_enabled = true
where plan = 'custom_domain' or custom_domain is not null;

update public.kennels
set plan = 'professional'
where plan = 'custom_domain';

alter table public.kennels drop constraint if exists kennels_plan_check;
alter table public.kennels
  add constraint kennels_plan_check check (plan in ('starter', 'professional', 'studio'));
