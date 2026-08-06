-- Transactional production-schema RLS smoke test. This creates no durable data.
begin;

create temporary table mydogportal_rls_context (
  member_user uuid not null,
  kennel_a uuid not null,
  kennel_b uuid not null,
  dog_a bigint,
  dog_b bigint,
  buyer_a bigint,
  buyer_b bigint
) on commit drop;

insert into mydogportal_rls_context(member_user, kennel_a, kennel_b)
select auth_user_id, gen_random_uuid(), gen_random_uuid()
from public.kennel_members
order by created_at
limit 1;

do $$
begin
  if not exists (select 1 from mydogportal_rls_context) then
    raise exception 'RLS test requires one existing authenticated kennel member';
  end if;
end;
$$;

insert into public.kennels(id, owner_auth_user_id, name, slug)
select kennel_a, member_user, 'MyDogPortal RLS A', 'rls-a-' || substr(replace(kennel_a::text, '-', ''), 1, 12)
from mydogportal_rls_context
union all
select kennel_b, member_user, 'MyDogPortal RLS B', 'rls-b-' || substr(replace(kennel_b::text, '-', ''), 1, 12)
from mydogportal_rls_context;

insert into public.kennel_members(kennel_id, auth_user_id, role)
select kennel_a, member_user, 'staff' from mydogportal_rls_context;

with inserted as (
  insert into public.dogs(kennel_id, name, sex, role, status, created_at, updated_at)
  select kennel_a, '__mydogportal_rls_visible__', 'Female', 'Dam', 'Active', now()::text, now()::text from mydogportal_rls_context
  union all
  select kennel_b, '__mydogportal_rls_hidden__', 'Female', 'Dam', 'Active', now()::text, now()::text from mydogportal_rls_context
  returning id, kennel_id
)
update mydogportal_rls_context context
set dog_a = (select id from inserted where kennel_id = context.kennel_a),
    dog_b = (select id from inserted where kennel_id = context.kennel_b);

with inserted as (
  insert into public.buyers(kennel_id, first_name, last_name, email, application_status, created_at, updated_at)
  select kennel_a, 'Visible', 'Family', 'visible-rls@example.invalid', 'Approved', now()::text, now()::text from mydogportal_rls_context
  union all
  select kennel_b, 'Hidden', 'Family', 'hidden-rls@example.invalid', 'Approved', now()::text, now()::text from mydogportal_rls_context
  returning id, kennel_id
)
update mydogportal_rls_context context
set buyer_a = (select id from inserted where kennel_id = context.kennel_a),
    buyer_b = (select id from inserted where kennel_id = context.kennel_b);

grant select on mydogportal_rls_context to authenticated;

select set_config('request.jwt.claims', json_build_object('sub', member_user, 'role', 'authenticated')::text, true)
from mydogportal_rls_context;
set local role authenticated;

do $$
declare visible_count integer;
declare cross_tenant_link_blocked boolean := false;
begin
  select count(*) into visible_count from public.dogs where name like '__mydogportal_rls_%';
  if visible_count <> 1 then raise exception 'member RLS isolation failed: saw % test dogs', visible_count; end if;
  update public.dogs set notes = 'member-visible' where name = '__mydogportal_rls_hidden__';
  get diagnostics visible_count = row_count;
  if visible_count <> 0 then raise exception 'member RLS update isolation failed'; end if;
  begin
    insert into public.heat_cycles(kennel_id, dog_id, heat_start)
    select kennel_a, dog_b, current_date from mydogportal_rls_context;
  exception when foreign_key_violation then
    cross_tenant_link_blocked := true;
  end;
  if not cross_tenant_link_blocked then raise exception 'cross-tenant foreign key isolation failed'; end if;
end;
$$;

reset role;
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', gen_random_uuid(),
    'role', 'authenticated',
    'app_metadata', json_build_object('portal_account', true, 'portal_kennel_id', kennel_a, 'portal_buyer_id', buyer_a)
  )::text,
  true
)
from mydogportal_rls_context;
set local role authenticated;

do $$
declare visible_count integer;
begin
  select count(*) into visible_count from public.buyers where email like '%-rls@example.invalid';
  if visible_count <> 1 then raise exception 'family portal RLS isolation failed: saw % test buyers', visible_count; end if;
end;
$$;

rollback;
