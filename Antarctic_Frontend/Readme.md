# Antarctic Sea-Ice, Iceberg & Navigation Decision Support System — Frontend

Smart India Hackathon 2026 · Problem Statement 26059 · Ministry of Earth Sciences / NCPOR

A decision-support dashboard for research vessels navigating near Antarctica. Forecasts
sea-ice concentration, predicts iceberg drift, and recommends safe, fuel-efficient
routes — demoed on the real **Bharati–Maitri** corridor between India's two Antarctic
research stations.

This repository is the **frontend only**. It is built against a fixed REST API contract
and ships with a full mock data layer, so it runs standalone with zero backend required.
Swapping to the real backend (built separately in FastAPI) takes one environment variable
change — no component code needs to change.

---

## Tech stack

- Next.js (App Router) + React
- Tailwind CSS
- Leaflet / react-leaflet for the map (satellite basemap via Esri, free tier, no API key)
- lucide-react for icons
- TypeScript throughout

---

## Getting started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Then open:

- `http://localhost:3000` — landing page
- `http://localhost:3000/dashboard` — main dashboard

By default the app runs entirely on **mock data** — no backend needed to see it working.

---

## Project structure

```
app/
  page.tsx              Landing page (white theme, hero video)
  dashboard/page.tsx     Main dashboard (map + all controls)
  layout.tsx             Root layout, fonts, global shell
  globals.css            Tailwind + Leaflet CSS imports

components/
  MapView.tsx                  Leaflet map + ice/confidence heatmap
  IcebergTrajectoryLayer.tsx   Historical/predicted iceberg path + uncertainty cones
  RouteLayer.tsx               Shortest/recommended route lines + risk zone popups
  MapClickHandler.tsx          Lets the user click the map to set route points
  LayerControls.tsx            Layer visibility toggles
  IcebergSelector.tsx          Iceberg dropdown/list
  RoutePlannerForm.tsx         Start/end point + vessel profile + submit
  RouteComparisonPanel.tsx     Shortest vs recommended stats
  TimelineSlider.tsx           Forecast day scrubber
  StalenessBanner.tsx          Error / stale-data banner
  ExportButton.tsx             Report download trigger
  AboutPanel.tsx               Optional "how this works" slide-in
  HeroSection.tsx               Landing page hero

lib/
  types.ts       TypeScript types matching the exact API contract
  mockApi.ts     Mock implementations of every endpoint (realistic Antarctic data)
  api.ts         Central fetch layer — switches mock/real via env var
```

---

## Environment variables

Set these in `.env.local` (copy from `.env.local.example`):

```bash
# true = use built-in mock data, false = call the real backend
NEXT_PUBLIC_USE_MOCK_API=true

# Only used when NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## Switching to the real backend

Once your backend is running and implements the endpoints below, switch over by editing
`.env.local`:

```bash
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=http://your-backend-host:8000
```

Restart the dev server (`npm run dev`). No component files need to change — `lib/api.ts`
reads this flag and routes every call to the real backend instead of `lib/mockApi.ts`.

### Endpoints the backend must implement

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/ice-forecast?lat=&lon=&days=` | Sea-ice concentration forecast grid |
| GET | `/api/icebergs` | List of tracked icebergs |
| GET | `/api/icebergs/{id}/trajectory?days=` | Historical + predicted iceberg path |
| POST | `/api/route` | Shortest vs recommended route computation |
| GET | `/api/export-report?route_id=` | Downloadable report file |

Exact request/response JSON shapes are defined in `lib/types.ts` — match those field
names and types precisely, since components are written directly against them.

### Error contract

Any endpoint may return this shape instead of its normal response, and the frontend will
show it in the `StalenessBanner` automatically:

```json
{ "error": true, "message": "human readable message", "code": "ICE_DATA_UNAVAILABLE" }
```

---

## Notes on implementation choices

- **Map basemap:** Uses Esri's free "World Imagery" satellite tiles. No API key required.
  If this ever needs to change, only `components/MapView.tsx`'s `TileLayer` `url` needs editing.
- **Map projection:** Standard Web Mercator (via Leaflet), not a polar stereographic
  projection. This was a deliberate hackathon-timeline tradeoff — polar CRS plugins are
  fragile to configure correctly under time pressure, and since the demo focuses on one
  fixed corridor rather than full circumpolar coverage, the distortion is negligible.
- **Design direction:** Landing page uses a white/minimal theme; dashboard uses a
  blue-and-white theme with the map itself kept dark for ice/water contrast legibility.
  No glassmorphism or blurred panels anywhere by design.

---

## Known gaps / not yet built

- `vessel.fuel_rate_ton_per_nm` is fixed at a default value in the UI (not user-editable)
- No automated tests
- Report export currently downloads a placeholder text file in mock mode — real
  PDF/CSV generation is the backend's responsibility per the API contract