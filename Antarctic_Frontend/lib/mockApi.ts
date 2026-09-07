import {
  IceForecastResponse,
  IcebergsResponse,
  IcebergTrajectoryResponse,
  RouteRequest,
  RouteResponse,
  RiskZone,
} from "./types";

// ── Helpers ─────────────────────────────────────────────────────────────

/** Simulates real network latency (300–600ms) */
function delay<T>(data: T, ms = 300 + Math.random() * 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

function isoDatePlusDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Corridor midpoint between Bharati (-69.4, 76.2) and Maitri (-70.8, 11.7),
// used as the default forecast center so the mock heatmap covers a
// meaningful chunk of the visible map instead of one small patch.
const DEFAULT_CENTER_LAT = -70.1;
const DEFAULT_CENTER_LON = 44.0;

/** Deterministic-ish pseudo-random so demo looks consistent across reloads */
function seededNoise(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ── 4.1 Mock: GET /api/ice-forecast ───────────────────────────────────────

export async function mockGetIceForecast(
  lat: number = DEFAULT_CENTER_LAT,
  lon: number = DEFAULT_CENTER_LON,
  days: number = 5
): Promise<IceForecastResponse> {
  // Wide grid spanning most of the corridor: 14 columns x 6 rows,
  // ~5.5° longitude steps and ~1.2° latitude steps.
  const latCount = 6;
  const lonCount = 14;
  const latStep = 1.2;
  const lonStep = 5.5;

  const lats = Array.from(
    { length: latCount },
    (_, i) => Number((lat - (latCount / 2) * latStep + i * latStep).toFixed(2))
  );
  const lons = Array.from(
    { length: lonCount },
    (_, i) => Number((lon - (lonCount / 2) * lonStep + i * lonStep).toFixed(2))
  );

  const now = new Date();
  const daily_forecasts = Array.from({ length: days }, (_, dayOffset) => {
    const grid_concentration: number[][] = [];
    const grid_confidence: number[][] = [];

    for (let r = 0; r < latCount; r++) {
      const concRow: number[] = [];
      const confRow: number[] = [];
      for (let c = 0; c < lonCount; c++) {
        const base = 12 + r * 13 + Math.abs(c - lonCount / 2) * 1.5;
        const dayDrift = dayOffset * 3;
        const noise = seededNoise(r * 31 + c * 7 + dayOffset * 13) * 15;
        const conc = Math.min(100, Math.max(0, Math.round(base + dayDrift + noise - 7)));
        concRow.push(conc);

        const confBase = 96 - dayOffset * 4;
        const confNoise = seededNoise(r * 17 + c * 23 + dayOffset * 5) * 6;
        const conf = Math.min(98, Math.max(55, Math.round(confBase - confNoise)));
        confRow.push(conf);
      }
      grid_concentration.push(concRow);
      grid_confidence.push(confRow);
    }

    return {
      day_offset: dayOffset,
      date: isoDatePlusDays(now, dayOffset),
      grid: {
        lats,
        lons,
        concentration_pct: grid_concentration,
        confidence_pct: grid_confidence,
      },
    };
  });

  const response: IceForecastResponse = {
    region: {
      center_lat: lat,
      center_lon: lon,
      bbox: [
        lats[0] - latStep / 2,
        lons[0] - lonStep / 2,
        lats[lats.length - 1] + latStep / 2,
        lons[lons.length - 1] + lonStep / 2,
      ],
    },
    forecast_days: days,
    generated_at: now.toISOString(),
    daily_forecasts,
  };

  return delay(response);
}

// ── 4.2 Mock: GET /api/icebergs ────────────────────────────────────────────

const ICEBERGS: IcebergsResponse["icebergs"] = [
  { id: "A23A", name: "A23A", current_lat: -66.2, current_lon: -55.1, area_km2: 3800 },
  { id: "B22A", name: "B22A", current_lat: -70.1, current_lon: -80.4, area_km2: 2900 },
  { id: "D28", name: "D28", current_lat: -68.7, current_lon: 71.3, area_km2: 1636 },
];

export async function mockGetIcebergs(): Promise<IcebergsResponse> {
  return delay({ icebergs: ICEBERGS });
}

// ── 4.3 Mock: GET /api/icebergs/{id}/trajectory ────────────────────────────

export async function mockGetIcebergTrajectory(
  id: string,
  days: number = 5
): Promise<IcebergTrajectoryResponse> {
  const iceberg = ICEBERGS.find((b) => b.id === id) ?? ICEBERGS[0];
  const now = new Date();

  const historical_path = [-6, -3, 0].map((offset, idx) => ({
    date: isoDatePlusDays(now, offset),
    lat: Number((iceberg.current_lat - offset * 0.02 * (idx + 1)).toFixed(3)),
    lon: Number((iceberg.current_lon + offset * 0.03 * (idx + 1)).toFixed(3)),
  }));

  const predicted_path = Array.from({ length: days }, (_, i) => {
    const dayOffset = i + 1;
    return {
      date: isoDatePlusDays(now, dayOffset),
      lat: Number((iceberg.current_lat + dayOffset * 0.04).toFixed(3)),
      lon: Number((iceberg.current_lon + dayOffset * 0.06).toFixed(3)),
      uncertainty_radius_km: Number((6 + dayOffset * dayOffset * 0.8).toFixed(1)),
    };
  });

  const response: IcebergTrajectoryResponse = {
    iceberg_id: iceberg.id,
    historical_path,
    predicted_path,
    physics_baseline_contribution_pct: 78,
    ml_correction_contribution_pct: 22,
  };

  return delay(response);
}

// ── 4.4 Mock: POST /api/route ──────────────────────────────────────────────

function lerpWaypoints(
  start: { lat: number; lon: number },
  end: { lat: number; lon: number },
  bendLatOffset: number,
  bendLonFraction: number = 0.5
) {
  const midLat =
    start.lat + (end.lat - start.lat) * bendLonFraction + bendLatOffset;
  const midLon = start.lon + (end.lon - start.lon) * bendLonFraction;

  return [
    { lat: start.lat, lon: start.lon },
    { lat: Number(midLat.toFixed(2)), lon: Number(midLon.toFixed(2)) },
    { lat: end.lat, lon: end.lon },
  ];
}

function haversineNm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R_km = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const km = 2 * R_km * Math.asin(Math.sqrt(h));
  return km * 0.539957;
}

function pathDistanceNm(points: { lat: number; lon: number }[]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineNm(points[i], points[i + 1]);
  }
  return Math.round(total);
}

export async function mockPostRoute(
  req: RouteRequest
): Promise<RouteResponse> {
  const { start, end, vessel } = req;

  const shortestWaypoints = lerpWaypoints(start, end, 0.6, 0.5);
  const shortestDistance = pathDistanceNm(shortestWaypoints);
  const shortestFuel = Number(
    (shortestDistance * vessel.fuel_rate_ton_per_nm).toFixed(1)
  );
  const shortestTimeHours = Math.round(shortestDistance / vessel.speed_knots);

  const shortestRiskZones: RiskZone[] = [
    {
      lat: Number((shortestWaypoints[1].lat - 0.3).toFixed(2)),
      lon: shortestWaypoints[1].lon,
      reason:
        "Forecasted 70% ice concentration on day 3 along direct heading — dense pack ice zone.",
      severity: "high",
    },
    {
      lat: Number((shortestWaypoints[1].lat + 0.5).toFixed(2)),
      lon: Number((shortestWaypoints[1].lon - 2).toFixed(2)),
      reason:
        "Drifting iceberg D28 predicted to intersect this corridor within 48 hours.",
      severity: "medium",
    },
  ];

  const recommendedWaypoints = lerpWaypoints(start, end, -1.4, 0.45);
  const recommendedDistance = pathDistanceNm(recommendedWaypoints);
  const recommendedFuel = Number(
    (recommendedDistance * vessel.fuel_rate_ton_per_nm).toFixed(1)
  );
  const recommendedTimeHours = Math.round(
    recommendedDistance / vessel.speed_knots
  );

  const extra_distance_pct = Number(
    (
      ((recommendedDistance - shortestDistance) / shortestDistance) *
      100
    ).toFixed(1)
  );
  const extra_fuel_pct = Number(
    (((recommendedFuel - shortestFuel) / shortestFuel) * 100).toFixed(1)
  );

  const response: RouteResponse = {
    shortest_route: {
      waypoints: shortestWaypoints,
      distance_nm: shortestDistance,
      estimated_fuel_tons: shortestFuel,
      estimated_time_hours: shortestTimeHours,
      ice_risk_pct: 42,
      risk_zones: shortestRiskZones,
    },
    recommended_route: {
      waypoints: recommendedWaypoints,
      distance_nm: recommendedDistance,
      estimated_fuel_tons: recommendedFuel,
      estimated_time_hours: recommendedTimeHours,
      ice_risk_pct: 8,
      risk_zones: [],
      recommended_speed_knots: [
        { segment_index: 0, speed_knots: vessel.speed_knots },
        {
          segment_index: 1,
          speed_knots: Number((vessel.speed_knots * 0.55).toFixed(1)),
        },
      ],
    },
    comparison: {
      extra_distance_pct,
      extra_fuel_pct,
      risk_reduction_pct: 34,
    },
  };

  return delay(response, 500 + Math.random() * 400);
}

// ── 4.5 Mock: GET /api/export-report ───────────────────────────────────────

export async function mockExportReport(): Promise<Blob> {
  const content = `Antarctic Navigation Decision Support — Route Report (Mock)
Generated: ${new Date().toISOString()}

This is a placeholder export generated by the mock API layer.
Replace with real backend-generated PDF/CSV once NEXT_PUBLIC_USE_MOCK_API=false.
`;
  await delay(null, 600);
  return new Blob([content], { type: "text/plain" });
}