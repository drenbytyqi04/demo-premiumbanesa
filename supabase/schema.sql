-- Sketch of a Supabase schema matching src/types.ts (not used by the demo yet).
-- Polygons are stored as jsonb arrays of [x, y] pairs, exactly like the JSON files.

create table complex (
  id int primary key default 1,
  name text not null,
  tagline text,
  location text,
  aerial_image text not null,
  aerial_width int not null,
  aerial_height int not null
);

create table buildings (
  id text primary key,                 -- 'A'
  name text not null,
  description text,
  floors int not null,
  polygon jsonb                        -- [[x,y],...] on the aerial image
);

create table facades (
  id text primary key,                 -- 'A-front'
  building_id text not null references buildings(id) on delete cascade,
  label text not null,
  image text not null,
  width int not null,
  height int not null,
  sort int not null default 0
);

create type apartment_status as enum ('available', 'sold', 'reserved');

create table apartments (
  id text primary key,                 -- 'A-302'
  building_id text not null references buildings(id) on delete cascade,
  floor int not null,
  number text not null,
  area numeric(6,1) not null,
  rooms int not null,
  price int not null,
  status apartment_status not null default 'available',
  facade_id text references facades(id) on delete set null,
  polygon jsonb,                       -- [[x,y],...] on the facade image
  panorama_scene_ids text[] not null default '{}',
  floor_plan text
);

create table panorama_scenes (
  id text primary key,                 -- 'living'
  title text not null,
  image text not null,
  initial_yaw real default 0,
  hot_spots jsonb not null default '[]' -- [{pitch, yaw, target}]
);

-- Public read, authenticated write (admins)
alter table complex enable row level security;
alter table buildings enable row level security;
alter table facades enable row level security;
alter table apartments enable row level security;
alter table panorama_scenes enable row level security;

create policy "public read" on complex for select using (true);
create policy "public read" on buildings for select using (true);
create policy "public read" on facades for select using (true);
create policy "public read" on apartments for select using (true);
create policy "public read" on panorama_scenes for select using (true);
create policy "admin write" on apartments for update to authenticated using (true);
create policy "admin write" on buildings for update to authenticated using (true);
create policy "admin write" on facades for update to authenticated using (true);
