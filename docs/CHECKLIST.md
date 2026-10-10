# Rezidenca Aurora – implementation checklist

Tracks the master prompt (palette + phases 1–8). ✅ done and verified · ⏳ open / depends on others.

## 1 · Foundation
- ✅ Vite + React 19 + TS strict, Tailwind v4 tokens, HashRouter, `base: './'`, lazy admin/panorama/contact form
- ✅ Brand board palette: charcoal `#0B0F14`, slate `#1E293B`, gold `#D4AF37`, soft gray `#A3A3A3`, ivory `#F8F7F4`, status `#10B981` / `#F59E0B` / `#EF4444` + hatch (darker *-ink tones for text, AA)
- ✅ Lucide React icons, Instrument Serif + Geist self-hosted

## 2 · Domain & repositories
- ✅ 140 apartments, 70 per wing, deterministic seed (unit-tested)
- ✅ Room mapping 1+1…4+1, null-safe €/m² and starting price (`src/lib/domain.ts`)
- ✅ `site.json` validated with Zod; unconfirmed facts are `null` → “Të dhënat së shpejti”
- ✅ Local repo validates stored data; Supabase repo shows an honest error, no demo fallback; stale loads ignored
- ✅ `submitInquiry` in both repositories

## 3 · Homepage
- ✅ All 12 sections; payment plan + construction phases labelled illustrative; payment total validated = 100%
- ✅ Contact form: React Hook Form + Zod, inline errors, consent, honeypot, min fill time, one client id per form, success only after storing
- ✅ Map hidden until a location is configured (placeholder instead)

## 4 · Discovery
- ✅ URL filters parsed/validated, back/forward restores them (Playwright)
- ✅ Facade polygons + accessible list alternative; wing outlines focusable (Enter opens)
- ✅ Apartment page: illustrative price/plan labels, inquiry link carries the apartment id, sold units offer “similar apartments”

## 5 · Tours
- ✅ Pannellum scenes, hotspots, thumbnails (existing); CC0 panoramas labelled illustrative

## 6 · Admin & editor
- ✅ Admin gate (Supabase Auth + `admins`), edit status/m²/rooms/price, no deletes
- ✅ Editor: drafts per image separate from published, validation before publish, confirmation, schema-validated import

## 7 · Backend
- ✅ Migration 0002: timestamps, unique number per wing/floor, column-level update grants, polygon checks, `inquiries` + `submit_inquiry()` (validation, de-dup, rate limit)
- ✅ RLS verified locally with PGlite (`npm run test:db`, 26 checks)
- ⏳ Apply migrations to a real Supabase project and repeat the checks there (needs the project choice + keys)

## 8 · QA & docs
- ✅ `npm run typecheck`, `npm run lint` (warnings only), `npm test` (40), `npm run test:e2e` (15 passed, 3 skipped by design on mobile), `npm run build`
- ✅ No horizontal overflow at 320 / 375 / 768 / 1024 / 1440 / 1920 (e2e)
- ✅ README: setup, demo mode, Supabase + first admin, Vercel, troubleshooting, rollback
- ⏳ Optimistic rollback / unsaved-change guard in the admin table (saves are per field today, errors shown per row)
- ⏳ Real content from the investor (see README “Still needed”)
