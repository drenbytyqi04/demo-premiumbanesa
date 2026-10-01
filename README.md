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
| `#/admin`            | Table where you change status and price. Changes are saved in `localStorage` and show up in the colors right away. |
| `#/editor`           | Polygon editor (see below). |

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
2. Open **`#/editor`** and choose what you are drawing in **"1 · Imazhi"**: *Pamja ajrore* (buildings) or a facade (apartments).
   - Or click **"Zëvendëso imazhin…"** to load a file straight from disk. If its size differs from the old image, existing polygons are scaled to fit.
3. Click **"Fshi të gjitha"** to start clean, or keep the existing polygons and adjust them.
4. **Draw** (`D`): click the corners of a building or apartment. Close the shape by clicking the first point (green) or pressing `Enter`.
   The new polygon automatically gets the next ID from the **"Pa poligon"** list (e.g. `A-801`, `A-802`…). Click a chip in that list to pick a different ID, or type one yourself.
   New points snap to existing corners, so neighbouring apartments share edges (hold `Alt` to turn snapping off).
5. **Edit** (`E`): drag points or whole polygons. Drag the small midpoint circles to add points. `Shift`/`Alt`+click a point to delete it. `Delete` removes the selected polygon, the arrow keys nudge it, and you can rename IDs in the list.
   Zoom with `Ctrl`+scroll or `+`/`−`/`0`, pan with `Space`+drag, undo/redo with `Ctrl+Z` / `Ctrl+Shift+Z`.
6. **"Ruaj në demo"** saves to `localStorage`, so the site shows the new polygons immediately and you can check them.
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

## Data & moving to Supabase

```
src/data/complex.json      name, location, aerial image + size
src/data/buildings.json    id, name, floors, polygon (aerial), facades[]
src/data/apartments.json   id, buildingId, floor, number, area, rooms, price, status,
                           facadeId, polygon, panoramaSceneIds, floorPlan
src/data/scenes.json       360° scenes + floor hotspots (pitch/yaw → target scene)
src/data/repository.ts     ← the ONLY place that knows where data comes from
src/data/DataContext.tsx   React provider; pages use useData()
src/types.ts               shared types
supabase/schema.sql        table sketch matching the types
```

Every page reads and writes data through the `DataRepository` interface (`load`, `updateApartment`, `savePolygons`, `reset`, `subscribe`).
To move to Supabase, implement that interface with `@supabase/supabase-js`, mapping snake_case columns to the camelCase types, and change one line:

```ts
// src/data/repository.ts
export const repository: DataRepository = supabaseRepository
```

`subscribe` fits Supabase Realtime (`channel.on('postgres_changes', …)`), so status changes made in the admin show up for every visitor live.

## Assets & licences

- 360° panoramas: [Poly Haven](https://polyhaven.com), CC0 (see `public/panoramas/CREDITS.md`).
- Aerial, facade and floor-plan images: generated placeholders (`scripts/generate-demo.mjs`).
- No images from any real developer's website are used.
