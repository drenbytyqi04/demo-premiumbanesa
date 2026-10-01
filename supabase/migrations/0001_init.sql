-- Rezidenca Aurora – database schema.
-- Visitors (anon) can only READ. Only users listed in public.admins can UPDATE.
-- Run in Supabase → SQL Editor (or `supabase db push`), then run supabase/seed.sql.

-- ------------------------------------------------------------------ tables
create table if not exists public.complex (
  id int primary key default 1 check (id = 1),     -- single row
  name text not null,
  tagline text,
  location text,
  aerial_image text not null,
  aerial_width int not null check (aerial_width > 0),
  aerial_height int not null check (aerial_height > 0)
);

create table if not exists public.buildings (
  id text primary key,                              -- 'A'
  name text not null,
  description text,
  floors int not null check (floors > 0),
  polygon jsonb,                                    -- [[x,y],...] on the aerial image
  sort int not null default 0
);

create table if not exists public.facades (
  id text primary key,                              -- 'A-front'
  building_id text not null references public.buildings(id) on delete cascade,
  label text not null,
  image text not null,
  width int not null check (width > 0),
  height int not null check (height > 0),
  sort int not null default 0
);

do $$ begin
  create type public.apartment_status as enum ('available', 'sold', 'reserved');
exception when duplicate_object then null; end $$;

create table if not exists public.apartments (
  id text primary key,                              -- 'A-302'
  building_id text not null references public.buildings(id) on delete cascade,
  floor int not null,
  number text not null,
  area numeric(6,1) not null check (area > 0),
  rooms int not null check (rooms between 1 and 10),
  price int not null check (price >= 0),
  status public.apartment_status not null default 'available',
  facade_id text references public.facades(id) on delete set null,
  polygon jsonb,                                    -- [[x,y],...] on the facade image
  panorama_scene_ids text[] not null default '{}',
  floor_plan text,
  updated_at timestamptz not null default now()
);
create index if not exists apartments_building_idx on public.apartments (building_id);
create index if not exists facades_building_idx on public.facades (building_id);

-- who may manage the site: add a row here for each admin user (see README)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists apartments_touch on public.apartments;
create trigger apartments_touch before update on public.apartments
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------ access rules
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()))
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

alter table public.complex    enable row level security;
alter table public.buildings  enable row level security;
alter table public.facades    enable row level security;
alter table public.apartments enable row level security;
alter table public.admins     enable row level security;

-- everyone (website visitors) can read the project data
grant select on public.complex, public.buildings, public.facades, public.apartments to anon, authenticated;
drop policy if exists "public read" on public.complex;
create policy "public read" on public.complex    for select to anon, authenticated using (true);
drop policy if exists "public read" on public.buildings;
create policy "public read" on public.buildings  for select to anon, authenticated using (true);
drop policy if exists "public read" on public.facades;
create policy "public read" on public.facades    for select to anon, authenticated using (true);
drop policy if exists "public read" on public.apartments;
create policy "public read" on public.apartments for select to anon, authenticated using (true);

-- only admins can change it (no insert/delete from the app at all)
grant update on public.complex, public.buildings, public.facades, public.apartments to authenticated;
drop policy if exists "admin update" on public.complex;
create policy "admin update" on public.complex    for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "admin update" on public.buildings;
create policy "admin update" on public.buildings  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "admin update" on public.facades;
create policy "admin update" on public.facades    for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "admin update" on public.apartments;
create policy "admin update" on public.apartments for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- a signed-in user may only check whether they themselves are an admin
grant select on public.admins to authenticated;
drop policy if exists "read own admin row" on public.admins;
create policy "read own admin row" on public.admins for select to authenticated using (user_id = (select auth.uid()));

-- ------------------------------------------------------------------ realtime (live updates on the website)
do $$ begin
  alter publication supabase_realtime add table public.apartments, public.buildings, public.facades;
exception when duplicate_object then null; end $$;
