# Prompt – Rezidenca Aurora (interactive apartment sales website)

Build a premium, interactive sales website for a residential building, where buyers pick a
wing on an aerial photo, then an apartment on the facade, then take a 360° virtual tour.
A separate, login-protected admin area lets the sales team change apartment data.

## Tech stack
- Vite + React + TypeScript, Tailwind CSS v4, React Router with **HashRouter**
  (routes: `#/`, `#/buildings/:id`, `#/apartments`, `#/apartments/:id`, `#/admin`, `#/admin/poligonet`)
- **motion** (Framer Motion) for animations, **Lenis** for smooth scrolling (desktop only)
- **Pannellum** for 360° panoramas
- **Supabase** (Postgres + Auth + Realtime) as backend; a local demo mode
  (JSON files + localStorage) when the Supabase env vars are missing
- Fonts self-hosted: **Instrument Serif** (headlines) + **Geist** (body)
- Build with `base: './'` so it works from any path; deploy on Vercel

## Language
All user-facing text in **Albanian** (e.g. "Banesat", "Kati", "Dhoma", "E lirë", "E shitur",
"E rezervuar", "Filtro banesat", "Rezervo takim", "Tura virtuale 360°").

## The project
- One building with **two wings (Lamela A and Lamela B)** joined at the top by a bridging
  top floor, 10 residential floors over a ground floor with shops, green roofs,
  terracotta facade with balcony bands, inner courtyard.
- 2 wings × 10 floors × 7 apartments = **140 apartments**.
- Apartment fields: `id, buildingId, floor, number, area, rooms, price, status
  (available | sold | reserved), facadeId, polygon, panoramaSceneIds, floorPlan`.
- Mock values until the real data arrives: ~50% available, 35% sold, 15% reserved;
  45–130 m²; 1–4 rooms; ~1,200–1,800 €/m².

## Design direction
- Premium, editorial, architectural – **not** a template look.
- Palette taken from the building: deep green-black ink (`#18201b`/`#0e130f`),
  **terracotta** accent (`#b5532e`), limestone paper background (`#f3f2ef`).
- Status colours: pine green (available), ochre (reserved), brick / hatched (sold) –
  status never shown by colour alone.
- Large serif headlines, square corners, no card shadows; fine 1px rules instead of boxes;
  generous spacing (sections ~144px apart on desktop); max content width ~1400px.
- Fully responsive; touch-friendly (44px targets); visible keyboard focus;
  respects `prefers-reduced-motion`.

## Public website (read-only, no login or admin links anywhere)

**Header**: serif wordmark, links "Projekti", "Banesat", "Lokacioni", button "Rezervo takim".
On the homepage it floats transparent over the hero and becomes a light bar on scroll;
it hides while scrolling down and returns on scroll up.

**Homepage sections, in order:**
1. **Hero** – big serif headline, short text, buttons "Shiko X banesat e lira" and
   "Tura virtuale 360°". Below, the **full-width aerial render** with an SVG overlay
   (same viewBox as the image) containing one polygon per wing: fine white contour at rest,
   status colour + tooltip on hover (name, free count, price from). Click → wing page.
   On phones the photo is wider than the screen, swipeable, starts centred;
   first tap previews, second tap/button opens. Under the photo: one column per wing with
   name, "nga X €", availability bar, counts.
2. **Project in numbers** – 6 figures (wings, floors, apartments + free, delivery year,
   parking spaces, courtyard m²); live counts animate up once.
3. **Architecture** – 3 alternating photo/text rows (bridge between wings, shading facade,
   residents-only courtyard), photos with parallax.
4. **Gallery** – editorial grid (1 large, 2 beside, 4 below) with a full-screen viewer
   (arrows, keyboard, swipe, Esc, focus handling).
5. **Stacking plan** – per wing, a floors × units grid; every cell clickable, hover shows
   details; on phones one wing at a time with tabs.
6. **Apartment types** – 1–4 rooms with floor plan, m² range, price from, link to filtered list.
7. **360° band** – full-bleed living-room panorama background with parallax, "Hap turën 360°".
8. **Location & features** – distances list, address, 6 features with icons,
   embedded OpenStreetMap (no API key) + link to larger map.
9. **Construction progress** – phases with dates (done ✓ / current / next) and a progress bar.
10. **Payment plan** – 10% / 30% / 40% / 20% proportional bar + steps.
11. **FAQ** – native `<details>` accordion.
12. **Contact** – phone, email, office, hours + form (name, phone, email, wing, rooms,
    message) with validation, loading and success states.
13. **Footer** – large serif name, links, contact.

All homepage copy lives in `src/data/site.json` so it can be edited without code.

**Wing page (`#/buildings/:id`)**
- Top: back button + wing name + "10 kate · 70 banesa · X të lira"; next to it a
  **dark filter panel**: room chips **1+1, 2+1, 3+1, 4+1** (multi-select), two-handle
  sliders for **m²** and **floor range**, "Vetëm të lirat", "Pastro filtrat";
  applies live, state stored in the URL (`?dhoma=2,3&kati=3-8&min=..&max=..&lira=1`).
- The **facade render full width**, one polygon per apartment coloured by status;
  non-matching apartments are dimmed; hover tooltip (number, floor, rooms, m², price, status);
  click → apartment. Arrows (and swipe) switch to the other wing keeping the filters.
- Below: the apartment list (table on desktop, cards on phones).

**Apartments list (`#/apartments`)** – all apartments with the same filters.

**Apartment page (`#/apartments/:id`)** – info panel (wing, floor, number, m², rooms,
price, €/m², status badge), floor plan, "Kërko informacion"; Pannellum 360° tour with
several scenes (living room, bedroom, kitchen, bathroom), floor hotspots to move between
rooms and a thumbnail strip; previous/next apartment links; on phones a sticky bottom bar
with price + CTA. Note that the 360° views are illustrative.

## Admin area (`#/admin`, not linked from the public site)
- Login page (Supabase Auth email + password). Only users listed in an `admins` table get
  in; others are signed out. Admin code is a separate lazy-loaded chunk.
- **Banesat**: table (cards on phones) to edit **status, m², rooms and price** per
  apartment, with saving / saved / error feedback, filters and status counters.
- **Poligonet**: polygon editor – load any image (or pick aerial / facade), click points
  to draw, close on first point or Enter, auto-suggest the next missing apartment id,
  snap to existing corners, drag points / whole polygons, add points on edge midpoints,
  delete points/polygons, undo/redo, zoom (Ctrl+wheel, +/−) and pan (Space+drag; touch:
  tap adds, drag pans), autosave draft per image, import/export JSON, "Ruaj dhe publiko".
- Logout button; deep admin URLs require login again.

## Data & security
- All data access through one `DataRepository` interface (`load`, `updateApartment`,
  `savePolygons`, `reset`, `subscribe`) with a Supabase and a local implementation.
- Supabase schema: `complex`, `buildings`, `facades`, `apartments`, `admins`
  (+ `is_admin()` function). **Row-Level Security**: everyone can read; only admins can
  update; nobody can delete from the app; check constraints (area > 0, rooms 1–10, price ≥ 0).
- Realtime subscription so admin changes appear for visitors without reload.
- Seed SQL generated from the JSON data; script to merge editor JSON exports into the data.

## Animations (subtle, professional)
- Section headings: words rise out of a mask on first view (hero on page load).
- Hero photo opens from a slight zoom; wing outlines draw themselves in.
- Parallax on architecture photos and the 360° band; staggered reveals for gallery tiles
  and texts; progress and payment bars draw in; count-up numbers.
- Page fade between routes (not on first load); Lenis smooth scroll on desktop only.
- Everything disabled with `prefers-reduced-motion`.

## Images
- Aerial render (hero), front facade render (cropped per wing for the wing pages),
  6–7 exterior renders for gallery/architecture – served in original quality (WebP/JPG),
  never upscaled; thumbnails for the gallery.
- Placeholders where real material is missing: floor plans (SVG) and CC0 Poly Haven
  panoramas for the 360° tour.

## Quality bar
- No horizontal scroll at 320–1920px; works with touch, mouse and keyboard.
- Images reserve their space (no layout shift); the hero never stays on a grey placeholder.
- Lazy-load heavy routes (360° tour, admin).
- End-to-end tests (Playwright) for hero → wing → apartment, filters, gallery,
  admin login/edit, mobile.
