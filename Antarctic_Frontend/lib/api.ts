import {
  IceForecastResponse,
  IcebergsResponse,
  IcebergTrajectoryResponse,
  RouteRequest,
  RouteResponse,
  ApiError,
  isApiError,
} from "./types";
import {
  mockGetIceForecast,
  mockGetIcebergs,
  mockGetIcebergTrajectory,
  mockPostRoute,
  mockExportReport,
} from "./mockApi";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// ── Result wrapper ──────────────────────────────────────────────────────
// Every function below returns either the typed success shape or an ApiError.
// Components check `isApiError(result)` and never need to catch/try themselves.

export type ApiResult<T> = T | ApiError;

function networkError(message: string): ApiError {
  return { error: true, message, code: "NETWORK_ERROR" };
}

async function safeFetchJson<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${url}`, init);
    const data = await res.json();

    if (!res.ok || isApiError(data)) {
      return isApiError(data)
        ? data
        : {
            error: true,
            message: data?.message ?? `Request failed (${res.status})`,
            code: data?.code ?? "UNKNOWN_ERROR",
          };
    }

    return data as T;
  } catch (err) {
    return networkError(
      "Could not reach backend — check your connection or API base URL."
    );
  }
}

// ── 4.1 Ice forecast ────────────────────────────────────────────────────

export async function getIceForecast(
  lat: number,
  lon: number,
  days: number = 5
): Promise<ApiResult<IceForecastResponse>> {
  if (USE_MOCK) {
    try {
      return await mockGetIceForecast(lat, lon, days);
    } catch {
      return networkError("Mock ice forecast generation failed.");
    }
  }
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    days: String(days),
  });
  return safeFetchJson<IceForecastResponse>(`/api/ice-forecast?${params}`);
}

// ── 4.2 Icebergs list ───────────────────────────────────────────────────

export async function getIcebergs(): Promise<ApiResult<IcebergsResponse>> {
  if (USE_MOCK) {
    try {
      return await mockGetIcebergs();
    } catch {
      return networkError("Mock iceberg list failed.");
    }
  }
  return safeFetchJson<IcebergsResponse>(`/api/icebergs`);
}

// ── 4.3 Iceberg trajectory ──────────────────────────────────────────────

export async function getIcebergTrajectory(
  id: string,
  days: number = 5
): Promise<ApiResult<IcebergTrajectoryResponse>> {
  if (USE_MOCK) {
    try {
      return await mockGetIcebergTrajectory(id, days);
    } catch {
      return networkError("Mock trajectory generation failed.");
    }
  }
  return safeFetchJson<IcebergTrajectoryResponse>(
    `/api/icebergs/${encodeURIComponent(id)}/trajectory?days=${days}`
  );
}

// ── 4.4 Route planning ──────────────────────────────────────────────────

export async function postRoute(
  req: RouteRequest
): Promise<ApiResult<RouteResponse>> {
  if (USE_MOCK) {
    try {
      return await mockPostRoute(req);
    } catch {
      return networkError("Mock route computation failed.");
    }
  }
  return safeFetchJson<RouteResponse>(`/api/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
}

// ── 4.5 Export report ───────────────────────────────────────────────────
// Returns a Blob on success so caller can trigger a download,
// or an ApiError if something went wrong.

export async function exportReport(
  routeId?: string
): Promise<ApiResult<Blob>> {
  if (USE_MOCK) {
    try {
      return await mockExportReport();
    } catch {
      return networkError("Mock export failed.");
    }
  }
  try {
    const params = routeId ? `?route_id=${encodeURIComponent(routeId)}` : "";
    const res = await fetch(`${API_BASE}/api/export-report${params}`);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return isApiError(data)
        ? data
        : {
            error: true,
            message: `Export failed (${res.status})`,
            code: "EXPORT_FAILED",
          };
    }
    return await res.blob();
  } catch {
    return networkError("Could not reach export endpoint.");
  }
}

/** Small helper for components: trigger a browser download from a Blob */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}