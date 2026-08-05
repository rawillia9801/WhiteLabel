-- Run after the existing SWVAOS schema when upgrading an already-created WhiteLabel database.
-- This file is intentionally idempotent. The same definitions are included in schema.sql.
create table if not exists kennels (
  id uuid primary key default gen_random_uuid(),
  owner_auth_user_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$'),
  plan text not null default 'starter' check (plan in ('starter', 'professional', 'custom_domain')),
  custom_domain text unique,
  domain_status text not null default 'not_requested' check (domain_status in ('not_requested', 'pending', 'verified', 'failed')),
  primary_color text not null default '#087f8c', accent_color text not null default '#c68b24', font_family text not null default 'Geist',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists kennel_members (
  kennel_id uuid not null references kennels(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now(), primary key (kennel_id, auth_user_id)
);
alter table dogs add column if not exists kennel_id uuid references kennels(id) on delete cascade;
alter table dog_medical_records add column if not exists kennel_id uuid references kennels(id) on delete cascade;
alter table dog_registrations add column if not exists kennel_id uuid references kennels(id) on delete cascade;
alter table dog_documents add column if not exists kennel_id uuid references kennels(id) on delete cascade;
alter table buyers add column if not exists kennel_id uuid references kennels(id) on delete cascade;
alter table litters add column if not exists kennel_id uuid references kennels(id) on delete cascade;
alter table puppies add column if not exists kennel_id uuid references kennels(id) on delete cascade;
alter table payment_plans add column if not exists kennel_id uuid references kennels(id) on delete cascade;
alter table payment_plan_puppies add column if not exists kennel_id uuid references kennels(id) on delete cascade;
alter table transactions add column if not exists kennel_id uuid references kennels(id) on delete cascade;
alter table buyer_documents add column if not exists kennel_id uuid references kennels(id) on delete cascade;
alter table buyer_document_puppies add column if not exists kennel_id uuid references kennels(id) on delete cascade;
alter table events add column if not exists kennel_id uuid references kennels(id) on delete cascade;
alter table puppy_updates add column if not exists kennel_id uuid references kennels(id) on delete cascade;

create index if not exists kennel_members_user_idx on kennel_members(auth_user_id);
create index if not exists dogs_kennel_idx on dogs(kennel_id);
create index if not exists buyers_kennel_idx on buyers(kennel_id);
create index if not exists litters_kennel_idx on litters(kennel_id);
create index if not exists puppies_kennel_idx on puppies(kennel_id);
create index if not exists transactions_kennel_idx on transactions(kennel_id);
create index if not exists events_kennel_idx on events(kennel_id);

alter table kennels enable row level security;
alter table kennel_members enable row level security;

drop policy if exists "members can read their kennel" on kennels;
create policy "members can read their kennel" on kennels for select to authenticated
using (exists (select 1 from kennel_members where kennel_members.kennel_id = kennels.id and kennel_members.auth_user_id = auth.uid()));

drop policy if exists "members can read membership" on kennel_members;
create policy "members can read membership" on kennel_members for select to authenticated
using (auth_user_id = auth.uid());
