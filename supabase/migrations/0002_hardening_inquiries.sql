-- Rezidenca Aurora – hardening + contact requests. Safe to re-run.

-- ------------------------------------------------------------------ timestamps on every table
alter table public.complex   add column if not exists updated_at timestamptz not null default now();
alter table public.buildings add column if not exists updated_at timestamptz not null default now();
alter table public.facades   add column if not exists updated_at timestamptz not null default now();
alter table public.apartments add column if not exists created_at timestamptz not null default now();

drop trigger if exists complex_touch on public.complex;
create trigger complex_touch before update on public.complex for each row execute function public.touch_updated_at();
drop trigger if exists buildings_touch on public.buildings;
create trigger buildings_touch before update on public.buildings for each row execute function public.touch_updated_at();
drop trigger if exists facades_touch on public.facades;
create trigger facades_touch before update on public.facades for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------ data validation
do $$ begin
  alter table public.apartments add constraint apartments_floor_valid check (floor between 0 and 50);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.apartments add constraint apartments_rooms_supported check (rooms between 1 and 4);
exception when duplicate_object then null; end $$;
do $$ begin
  -- an apartment number is unique within its wing and floor
  alter table public.apartments add constraint apartments_number_unique unique (building_id, floor, number);
exception when duplicate_object or duplicate_table then null; end $$;
do $$ begin
  alter table public.apartments add constraint apartments_polygon_array check (polygon is null or (jsonb_typeof(polygon) = 'array' and jsonb_array_length(polygon) >= 3));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.buildings add constraint buildings_polygon_array check (polygon is null or (jsonb_typeof(polygon) = 'array' and jsonb_array_length(polygon) >= 3));
exception when duplicate_object then null; end $$;
create index if not exists apartments_status_idx on public.apartments (status);

-- ------------------------------------------------------------------ admins may change only these columns
revoke update on public.apartments from authenticated;
grant update (status, price, area, rooms, polygon, facade_id) on public.apartments to authenticated;
revoke update on public.buildings from authenticated;
grant update (polygon) on public.buildings to authenticated;
revoke update on public.facades from authenticated;
grant update (image, width, height) on public.facades to authenticated;
revoke update on public.complex from authenticated;
grant update (aerial_image, aerial_width, aerial_height) on public.complex to authenticated;
-- the admins table is managed only from the Supabase dashboard / SQL editor (service role)
revoke insert, update, delete on public.admins from anon, authenticated;

-- ------------------------------------------------------------------ contact / appointment requests
create table if not exists public.inquiries (
  id bigint generated always as identity primary key,
  client_id uuid not null unique,                 -- one id per filled-in form: retries never duplicate
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (phone ~ '^\+?[0-9]{8,15}$'),
  email text check (email is null or (char_length(email) <= 200 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  building_id text references public.buildings(id) on delete set null,
  rooms int check (rooms is null or rooms between 1 and 4),
  apartment_id text references public.apartments(id) on delete set null,
  message text check (message is null or char_length(message) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists inquiries_phone_time_idx on public.inquiries (phone, created_at desc);
alter table public.inquiries enable row level security;

-- visitors cannot read or write the table directly; only admins can read it
revoke all on public.inquiries from anon, authenticated;
grant select on public.inquiries to authenticated;
drop policy if exists "admin read" on public.inquiries;
create policy "admin read" on public.inquiries for select to authenticated using ((select public.is_admin()));

-- the only way in: a narrow function that validates and rate-limits
create or replace function public.submit_inquiry(
  p_client_id uuid, p_name text, p_phone text, p_email text,
  p_building_id text, p_rooms int, p_apartment_id text, p_message text
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[\s()./-]', '', 'g');
begin
  if exists (select 1 from public.inquiries where client_id = p_client_id) then
    return; -- same form submitted twice: already stored
  end if;
  if (select count(*) from public.inquiries where phone = v_phone and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  if (select count(*) from public.inquiries where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.inquiries (client_id, name, phone, email, building_id, rooms, apartment_id, message)
  values (
    p_client_id, btrim(p_name), v_phone, nullif(btrim(p_email), ''),
    (select id from public.buildings where id = p_building_id),
    p_rooms,
    (select id from public.apartments where id = p_apartment_id),
    nullif(btrim(p_message), '')
  )
  on conflict (client_id) do nothing;
end $$;
revoke execute on function public.submit_inquiry(uuid, text, text, text, text, int, text, text) from public;
grant execute on function public.submit_inquiry(uuid, text, text, text, text, int, text, text) to anon, authenticated;
