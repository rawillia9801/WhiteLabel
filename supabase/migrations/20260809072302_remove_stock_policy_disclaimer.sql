alter table public.kennels
  alter column custom_policy_notice set default '';

update public.kennels
set custom_policy_notice = ''
where custom_policy_notice = concat(
  'Have a qualified local ',
  'attorney review all customer-facing ',
  'policies and contracts before use.'
);
