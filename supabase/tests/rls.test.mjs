// Runs the real migrations + seed in an in-memory Postgres (PGlite) with minimal Supabase
// stand-ins (anon/authenticated roles, auth.uid()) and checks the access rules.
// Usage: npm run test:db   – does not touch any remote database.
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'

const R = new URL('../', import.meta.url)
const read = (p) => readFileSync(new URL(p, R), 'utf8')
const db = new PGlite()
let failed = 0
const ok = (c, m) => {
  console.log(c ? 'ok  ' : 'FAIL', m)
  if (!c) failed++
}
const ADMIN = '11111111-1111-1111-1111-111111111111'
const USER = '22222222-2222-2222-2222-222222222222'

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth; create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  create publication supabase_realtime;
  insert into auth.users values ('${ADMIN}','admin@x'), ('${USER}','random@x');
`)
for (let i = 0; i < 2; i++) {
  await db.exec(read('migrations/0001_init.sql'))
  await db.exec(read('migrations/0002_hardening_inquiries.sql'))
  await db.exec(read('seed.sql'))
}
ok(true, 'migrations + seed run twice (re-runnable)')
const n = (await db.query('select count(*)::int n, count(*) filter (where building_id = $1)::int a from public.apartments', ['A'])).rows[0]
ok(n.n === 140 && n.a === 70, `seed: ${n.n} apartments, ${n.a} in wing A`)
await db.exec(`insert into public.admins values ('${ADMIN}')`)

async function as(role, sub, sql, params) {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${sub ?? ''}', false);`)
  try {
    return await db.query(sql, params)
  } catch (e) {
    return { error: e.message }
  } finally {
    await db.exec('reset role')
  }
}
const denied = (r) => !!r.error || r.rows.length === 0

let r = await as('anon', null, 'select count(*)::int n from public.apartments')
ok(r.rows?.[0].n === 140, 'visitor can read apartments')
ok(denied(await as('anon', null, `update public.apartments set status='sold' where id='A-101' returning id`)), 'visitor cannot update apartments')
ok(denied(await as('anon', null, `delete from public.apartments where id='A-101' returning id`)), 'visitor cannot delete apartments')
ok(!!(await as('anon', null, `insert into public.admins values ('${USER}')`)).error, 'visitor cannot add admins')
ok(denied(await as('authenticated', USER, `update public.apartments set price=1 where id='A-101' returning id`)), 'signed-in non-admin cannot update')
ok(!!(await as('authenticated', USER, `insert into public.admins values ('${USER}')`)).error, 'signed-in non-admin cannot add self to admins')
r = await as('authenticated', USER, 'select count(*)::int n from public.admins')
ok(r.rows?.[0].n === 0, 'non-admin cannot list admins')

r = await as('authenticated', ADMIN, `update public.apartments set status='reserved', price=99000 where id='A-101' returning status, price`)
ok(r.rows?.[0]?.status === 'reserved' && r.rows[0].price === 99000, 'admin can update status and price')
ok(!!(await as('authenticated', ADMIN, `update public.apartments set number='X' where id='A-101' returning id`)).error, 'admin cannot change other columns (number)')
ok(!!(await as('authenticated', ADMIN, `update public.apartments set area=-5 where id='A-101' returning id`)).error, 'check constraint rejects area <= 0')
ok(!!(await as('authenticated', ADMIN, `update public.apartments set rooms=7 where id='A-101' returning id`)).error, 'check constraint rejects unsupported room count')
ok(denied(await as('authenticated', ADMIN, `delete from public.apartments where id='A-101' returning id`)), 'admin cannot delete apartments from the app')
r = await as('authenticated', ADMIN, `select updated_at > created_at as touched from public.apartments where id='A-101'`)
ok(r.rows?.[0]?.touched === true, 'updated_at is refreshed on update')
ok(!!(await db.query(`insert into public.apartments (id, building_id, floor, number, area, rooms, price) values ('A-dup','A',1,(select number from public.apartments where id='A-101'),50,1,1)`).catch((e) => ({ error: e.message }))).error, 'apartment number unique per wing/floor')

const submit = (id, phone = '+38344123456', name = 'Test Person') =>
  as('anon', null, `select public.submit_inquiry($1, $2, $3, null, 'A', 2, 'A-101', 'Përshëndetje')`, [id, name, phone])
const id1 = 'aaaaaaaa-0000-4000-8000-000000000001'
ok(!(await submit(id1)).error, 'visitor can submit an inquiry')
ok(!(await submit(id1)).error, 'same form submitted twice is accepted without error')
ok((await db.query('select count(*)::int n from public.inquiries')).rows[0].n === 1, '…and stored once')
ok(!!(await submit('aaaaaaaa-0000-4000-8000-000000000002', 'abc')).error, 'server rejects an invalid phone')
ok(!!(await submit('aaaaaaaa-0000-4000-8000-000000000003', undefined, 'x')).error, 'server rejects a too short name')
await submit('aaaaaaaa-0000-4000-8000-000000000004')
await submit('aaaaaaaa-0000-4000-8000-000000000005')
r = await submit('aaaaaaaa-0000-4000-8000-000000000006')
ok(/rate_limited/.test(r.error ?? ''), 'rate limit after 3 requests from the same phone in 10 min')
ok(!!(await as('anon', null, 'select * from public.inquiries')).error, 'visitor cannot read inquiries')
ok(!!(await as('anon', null, `insert into public.inquiries (client_id, name, phone) values (gen_random_uuid(), 'Xx', '+38344123456')`)).error, 'visitor cannot insert into inquiries directly')
r = await as('authenticated', USER, 'select count(*)::int n from public.inquiries')
ok(r.rows?.[0].n === 0, 'signed-in non-admin sees no inquiries')
r = await as('authenticated', ADMIN, 'select count(*)::int n from public.inquiries')
ok(r.rows?.[0].n === 3, 'admin can read inquiries')

console.log(failed ? `\n${failed} check(s) failed` : '\nall database checks passed')
process.exit(failed ? 1 : 0)
