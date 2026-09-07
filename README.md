# Antarctic Navigation Decision Support System — Backend

AI-enabled backend for Problem Statement 26059 (SIH 2026, Ministry of Earth Sciences / NCPOR): forecasts Antarctic sea-ice concentration, predicts iceberg drift trajectories, and recommends safe, fuel-efficient ship routes.

## What's Real vs. What's Extrapolated (read this first)

This project follows a strict data-honesty policy — every number is either real observed data, a documented physics model, or clearly labeled as a placeholder/extrapolation.

| Component | Status |
|---|---|
| Iceberg positions (A23A) | **Real** — BYU/NIC Consolidated Antarctic Iceberg Tracking Database |
| Wind data for iceberg drift | **Real** — ERA5 reanalysis, exact matching coordinates/dates |
| Ocean current data | **Placeholder** — small constant values; real Copernicus Marine Service integration is a documented Phase 2 task |
| Iceberg drift physics model | Real, empirically-validated "windage factor" drift model (~2% of wind speed + current, with Coriolis deflection) |
| Iceberg ML residual correction | Real model, trained on 19 real historical points — **not yet held-out validated** (trained and tested on the same small sample; needs a proper train/test split once more historical data is added) |
| Sea-ice concentration (day 0) | **Real** — NOAA/NSIDC G02202 v6 Climate Data Record |
| Sea-ice concentration (future days) | Extrapolated from real day-0 trend using a simple persistence model — **not** yet a trained ConvLSTM/U-Net (documented Phase 2 upgrade) |
| Route optimization algorithm (A*) | Real, functioning pathfinding on a real cost-grid |
| Route risk-zone explanations | Real, derived from actual ice concentration and iceberg proximity values at each flagged point |

## Setup

### 1. Python environment
```bash
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

### 2. Real data access (optional, for regenerating/updating data)

**ERA5 wind data** (Copernicus Climate Data Store):
1. Register free at https://cds.climate.copernicus.eu/
2. Get your API key from your profile page, save to `~/.cdsapirc`
3. `pip install cdsapi`

**NSIDC sea-ice data** — no registration needed, direct HTTPS download:
- Files pulled from `https://noaadata.apps.nsidc.org/NOAA/G02202_V6/south/daily/{year}/`
- Filename pattern: `sic_pss25_YYYYMMDD_F17_v06r00.nc`

**Iceberg tracking data** — BYU/NIC Consolidated Database:
- Download from https://www.scp.byu.edu/data/iceberg/database1.html
- Real format columns: `date` (YYYYDDD Julian), `date_gap`, `disp`, `flags`, `lat`, `lon`, `mask`, `size`, `vel_angle`
- `flags=3` rows are no-data placeholders — filter these out; `flags=7` rows are real sensor readings

### 3. Run the server
```bash
uvicorn app.main:app --reload
```
Visit `http://127.0.0.1:8000/docs` for interactive API documentation.

### 4. Run tests
```bash
python test_physics.py
python test_route_optimizer.py
```

## Project Structure

```
app/
├── main.py                    # FastAPI app entry point
├── api/
│   ├── icebergs.py             # Module B endpoints
│   ├── ice_forecast.py         # Module A endpoint
│   ├── route.py                 # Module C endpoint
│   └── export.py                # PDF report generation
├── models/                     # Pydantic request/response schemas
├── services/
│   ├── iceberg_physics.py      # Physics drift model (wind+current+Coriolis)
│   ├── ice_forecast.py         # Sea-ice forecasting logic
│   ├── route_optimizer.py      # A* pathfinding + cost-grid
│   └── data_freshness.py       # Staleness detection
├── ml/
│   └── drift_correction.py     # ML residual correction (trained model)
data/
├── iceberg_a23a_fully_real.json   # Real positions + real wind, merged
├── ice_concentration_real.json    # Real NSIDC sea-ice data
└── nsidc_raw/                     # Raw downloaded NetCDF files
tests/
```

## API Endpoints

- `GET /api/icebergs` — list tracked icebergs
- `GET /api/icebergs/{id}/trajectory?days=N` — historical + predicted iceberg path
- `GET /api/ice-forecast?days=N` — sea-ice concentration forecast grid
- `POST /api/route` — compute shortest vs. recommended route between two points
- `POST /api/export-report` — generate downloadable PDF route report

## Known Limitations (Phase 2 Roadmap)

1. Real ocean current data (Copernicus Marine Service) not yet integrated — currently placeholder values
2. Sea-ice forecast beyond day 0 uses simple trend extrapolation, not a trained ConvLSTM/U-Net
3. ML iceberg-drift correction model trained on only 19 real samples with no held-out test set — needs more historical data and proper train/test split for honest generalization claims
4. Only one iceberg (A23A) currently has a full real dataset wired in
5. Data currently served from static cached files, not a live/scheduled data pipeline
6. No database yet (flat JSON files) — PostgreSQL+PostGIS migration planned for scale
7. No authentication/access control yet
8. Not yet containerized (Docker)

## Data Sources & Citations

- BYU/NIC Consolidated Antarctic Iceberg Tracking Database
- NOAA/NSIDC Climate Data Record of Passive Microwave Sea Ice Concentration, Version 6 (G02202)
- ERA5 Reanalysis, Copernicus Climate Data Store
- Route optimization approach informed by published research on Dijkstra-based routing between India's Bharati and Maitri Antarctic stations
- Iceberg drift model approach informed by published physics-informed hybrid drift research (e.g. IDRIFTNET)
