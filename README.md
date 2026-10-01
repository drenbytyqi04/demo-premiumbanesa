# Rezidenca Aurora – interactive apartment sales demo

A demo sales site for a residential complex. Buyers click a building on the aerial view, then an apartment on the facade, then take a 360° virtual tour.
All data is mock data and every image is either a generated placeholder or a CC0 panorama.

**Stack:** Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router (HashRouter) · Pannellum

## Run it locally

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build in dist/ (base "./", works from any sub-path)
npm run preview      # serve the build
```

Optional:

```bash
npm run panoramas         # download ~4K CC0 indoor panoramas from Poly Haven into public/panoramas/
npm run generate:images   # regenerate the placeholder aerial/facade/floor-plan images
npm run generate:data     # ⚠ reset src/data/*.json to fresh random mock data (overwrites polygons!)
npm run apply-polygons -- file.json   # merge an editor export into src/data/*.json
```

## Home page

`#/` is built from sections in `src/components/home/` with copy in `src/data/site.json`:
the aerial site plan as hero (outlines draw in on load, live availability per building),
a stacking plan (floors × units, every cell clickable), apartment types, the 360° tour,
location & features, the payment plan and a contact form (demo – nothing is sent).
Animations use [motion](https://motion.dev) and respect `prefers-reduced-motion`.
Typeface: Archivo (self-hosted via `@fontsource-variable/archivo`).

Design skills used are committed in `.claude/skills/` (`frontend-design` from anthropics/skills,
`ui-ux-pro-max` installed with `npm i -g ui-ux-pro-max-cli && uipro init --ai claude`).

## Pages

| Route                | What it does |
|----------------------|--------------|
| `#/`                 | Aerial view. One SVG polygon per building: green if it has free apartments, red if sold out. Hover shows a tooltip; on touch screens the first tap previews and the second tap (or the button) opens the building. |
| `#/buildings/:id`    | Facade with one polygon per apartment (green = free, red = sold, yellow = reserved). Filters for floor, rooms, m² and "only free" dim the units that don't match (filters are kept in the URL). Arrows switch facades (building A has 2). |
| `#/apartments`       | List of every apartment, with the same filters. |
| `#/apartments/:id`   | Info panel, floor plan and a Pannellum 360° tour. Floor hotspots move between rooms, and the thumbnail strip jumps straight to a room. |

The public site is read-only and has **no link or login button** to the admin area.

## Admin area (`#/admin`) – login required

Open `https://your-site/#/admin` directly (it is not linked anywhere). After login:

- **Banesat** – change status (e lirë / e rezervuar / e shitur), m², rooms and price per apartment.
- **Poligonet** – the polygon editor (see below). `#/editor` redirects here.

How the protection works (Supabase mode):

- Visitors use the public *anon* key, which the database allows to **read only** (Row-Level Security in
  `supabase/migrations/0001_init.sql`). Writes are refused by the database itself, not just hidden in the UI.
- Only users listed in the `admins` table can update. A signed-in user who is not in `admins` is signed out.
- Visitors never download the admin code (separate lazy-loaded bundle).
- Changes reach visitors live (Supabase Realtime) – no reload needed.

### Set up Supabase (once)

1. Create a Supabase project. In **SQL Editor** run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`
   (regenerate it from the JSON files any time with `npm run export-seed`).
2. **Authentication → Users → Add user**: create the admin (email + strong password, "Auto confirm").
3. Make that user an admin (SQL Editor):
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'admin@yourcompany.com';
   ```
4. **Authentication → Sign In / Providers**: turn **off** "Allow new users to sign up", so nobody else can create an account.
5. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   (Project Settings → API). Restart `npm run dev`. Set the same two variables on your hosting (Netlify/Vercel) before building.

### Demo mode (no Supabase)

Without the env vars the site still runs: data comes from `src/data/*.json` and the admin login is
`admin@demo.local` / `aurora-demo` (change via `VITE_DEMO_ADMIN_*`). This is **not secure** (the password is in the
JavaScript) and edits are stored only in that browser's `localStorage` – use it for local testing only.

## Placeholder images to replace

| File | Used for | Current size |
|------|----------|--------------|
| `public/images/aerial.jpg` | Aerial view of the complex | 1920×1080 |
| `public/images/facade-a.jpg` | Building A – south facade (apartments x01, x02) | 1200×1500 |
| `public/images/facade-a-back.jpg` | Building A – north facade (apartments x03, x04) | 1200×1500 |
| `public/images/facade-b.jpg` | Building B – main facade | 1200×1500 |
| `public/images/facade-c.jpg` | Building C – main facade | 1200×1500 |
| `public/images/floorplans/plan-{1..4}.svg` | Floor plans by room count | SVG |
| `public/panoramas/{living,bedroom,kitchen,bathroom}.jpg` | 360° tour (already CC0, 2K) | 2048×1024 |

Your images can be any size. The editor saves the real pixel size, so the overlay always matches the image.

## Redraw the polygons on your own images (editor)

1. Copy your photo into `public/images/`, using the same name to replace a placeholder (e.g. `aerial.jpg`).
2. Log in at **`#/admin`**, open **Poligonet** and choose what you are drawing in **"1 · Imazhi"**: *Pamja ajrore* (buildings) or a facade (apartments).
   - Or click **"Zëvendëso imazhin…"** to load a file straight from disk. If its size differs from the old image, existing polygons are scaled to fit.
3. Click **"Fshi të gjitha"** to start clean, or keep the existing polygons and adjust them.
4. **Draw** (`D`): click the corners of a building or apartment. Close the shape by clicking the first point (green) or pressing `Enter`.
   The new polygon automatically gets the next ID from the **"Pa poligon"** list (e.g. `A-801`, `A-802`…). Click a chip in that list to pick a different ID, or type one yourself.
   New points snap to existing corners, so neighbouring apartments share edges (hold `Alt` to turn snapping off).
5. **Edit** (`E`): drag points or whole polygons. Drag the small midpoint circles to add points. `Shift`/`Alt`+click a point to delete it. `Delete` removes the selected polygon, the arrow keys nudge it, and you can rename IDs in the list.
   Zoom with `Ctrl`+scroll or `+`/`−`/`0`, pan with `Space`+drag, undo/redo with `Ctrl+Z` / `Ctrl+Shift+Z`.
6. **"Ruaj dhe publiko"** saves the polygons (to Supabase, or to `localStorage` in demo mode) and the site shows them immediately.
7. **"Shkarko JSON"**, then make the change permanent:
   ```bash
   npm run apply-polygons -- ~/Downloads/polygons-aerial.json ~/Downloads/polygons-facade-A-front.json
   ```
   After that, clear the local overrides with Admin → "Rikthe të dhënat fillestare".

Your work is auto-saved as a draft per image, so a page refresh doesn't lose it. "Ringarko" discards the draft.

Export format (the same shape `src/data` uses; points are pixel coordinates in the image):

```json
{
  "version": 1,
  "target": { "type": "facade", "buildingId": "A", "facadeId": "A-front" },
  "image": "images/facade-a.jpg",
  "width": 1200,
  "height": 1500,
  "polygons": [{ "id": "A-801", "points": [[156, 266], [594, 266], [594, 386], [156, 386]] }]
}
```

## Data

```
src/data/*.json                 seed / demo data (complex, buildings, apartments, 360° scenes)
src/data/repository.ts          DataRepository interface + local demo implementation
src/data/supabaseRepository.ts  Supabase implementation (used when VITE_SUPABASE_* are set)
src/data/DataContext.tsx        React provider; pages use useData()
src/auth/AuthContext.tsx        admin login (Supabase Auth, or demo credentials)
src/admin/                      admin shell + login page (lazy-loaded)
supabase/migrations/0001_init.sql  tables, RLS rules, realtime
supabase/seed.sql               generated by `npm run export-seed`
```

360° scenes stay in `scenes.json` because they describe image files in `public/panoramas/`.

## Assets & licences

- 360° panoramas: [Poly Haven](https://polyhaven.com), CC0 (see `public/panoramas/CREDITS.md`).
- Aerial, facade and floor-plan images: generated placeholders (`scripts/generate-demo.mjs`).
- No images from any real developer's website are used.
