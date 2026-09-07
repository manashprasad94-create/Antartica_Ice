// ── Shared / error contract (Section 4.6) ────────────────────────────────

export interface ApiError {
  error: true;
  message: string;
  code: string;
}

export function isApiError(x: unknown): x is ApiError {
  return (
    typeof x === "object" &&
    x !== null &&
    (x as Record<string, unknown>).error === true
  );
}

// ── 4.1 GET /api/ice-forecast ─────────────────────────────────────────────

export interface IceForecastRegion {
  center_lat: number;
  center_lon: number;
  /** [south, west, north, east] */
  bbox: [number, number, number, number];
}

export interface IceForecastGrid {
  lats: number[];
  lons: number[];
  /** rows = lats, cols = lons, values 0-100 */
  concentration_pct: number[][];
  /** rows = lats, cols = lons, values 0-100 */
  confidence_pct: number[][];
}

export interface DailyForecast {
  day_offset: number;
  date: string; // ISO date
  grid: IceForecastGrid;
}

export interface IceForecastResponse {
  region: IceForecastRegion;
  forecast_days: number;
  generated_at: string; // ISO datetime
  daily_forecasts: DailyForecast[];
}

// ── 4.2 GET /api/icebergs ──────────────────────────────────────────────────

export interface IcebergSummary {
  id: string;
  name: string;
  current_lat: number;
  current_lon: number;
  area_km2: number;
}

export interface IcebergsResponse {
  icebergs: IcebergSummary[];
}

// ── 4.3 GET /api/icebergs/{id}/trajectory ───────────────────────────────────

export interface HistoricalPathPoint {
  date: string;
  lat: number;
  lon: number;
}

export interface PredictedPathPoint {
  date: string;
  lat: number;
  lon: number;
  uncertainty_radius_km: number;
}

export interface IcebergTrajectoryResponse {
  iceberg_id: string;
  historical_path: HistoricalPathPoint[];
  predicted_path: PredictedPathPoint[];
  physics_baseline_contribution_pct: number;
  ml_correction_contribution_pct: number;
}

// ── 4.4 POST /api/route ─────────────────────────────────────────────────────

export interface RoutePoint {
  name?: string;
  lat: number;
  lon: number;
}

export interface VesselProfile {
  ice_class: string;
  speed_knots: number;
  fuel_rate_ton_per_nm: number;
}

export interface RouteRequest {
  start: RoutePoint;
  end: RoutePoint;
  vessel: VesselProfile;
}

export type RiskSeverity = "low" | "medium" | "high";

export interface RiskZone {
  lat: number;
  lon: number;
  reason: string;
  severity: RiskSeverity;
}

export interface RecommendedSpeedSegment {
  segment_index: number;
  speed_knots: number;
}

export interface ShortestRoute {
  waypoints: RoutePoint[];
  distance_nm: number;
  estimated_fuel_tons: number;
  estimated_time_hours: number;
  ice_risk_pct: number;
  risk_zones: RiskZone[];
}

export interface RecommendedRoute extends ShortestRoute {
  recommended_speed_knots: RecommendedSpeedSegment[];
}

export interface RouteComparison {
  extra_distance_pct: number;
  extra_fuel_pct: number;
  risk_reduction_pct: number;
}

export interface RouteResponse {
  shortest_route: ShortestRoute;
  recommended_route: RecommendedRoute;
  comparison: RouteComparison;
}

// ── 4.5 Export ───────────────────────────────────────────────────────────

export interface ExportReportParams {
  route_id?: string;
}

// ── UI-only helper types (not part of API contract) ─────────────────────

export type LayerKey = "ice" | "confidence" | "icebergTracks" | "route";

export interface LayerVisibility {
  ice: boolean;
  confidence: boolean;
  icebergTracks: boolean;
  route: boolean;
}