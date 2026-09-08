"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Info, Menu, X } from "lucide-react";
import {
  getIceForecast,
  getIcebergs,
  getIcebergTrajectory,
  postRoute,
} from "@/lib/api";
import { isApiError } from "@/lib/types";
import type {
  IceForecastResponse,
  IcebergSummary,
  IcebergTrajectoryResponse,
  RouteResponse,
  RoutePoint,
  VesselProfile,
  LayerVisibility,
  LayerKey,
  ApiError,
} from "@/lib/types";

import LayerControls from "@/components/LayerControls";
import IcebergSelector from "@/components/IcebergSelector";
import RoutePlannerForm from "@/components/RoutePlannerForm";
import RouteComparisonPanel from "@/components/RouteComparisonPanel";
import RouteComparisonChart from "@/components/RouteComparisonChart";
import IceForecastTrendChart from "@/components/IceForecastTrendChart";
import TimelineSlider from "@/components/TimelineSlider";
import StalenessBanner from "@/components/StalenessBanner";
import ExportButton from "@/components/ExportButton";
import AboutPanel from "@/components/AboutPanel";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });
const IcebergTrajectoryLayer = dynamic(
  () => import("@/components/IcebergTrajectoryLayer"),
  { ssr: false }
);
const RouteLayer = dynamic(() => import("@/components/RouteLayer"), {
  ssr: false,
});
const MapClickHandler = dynamic(
  () => import("@/components/MapClickHandler"),
  { ssr: false }
);

const BHARATI: RoutePoint = { name: "Bharati Station", lat: -69.4, lon: 76.2 };
const MAITRI: RoutePoint = { name: "Maitri Station", lat: -70.8, lon: 11.7 };

export default function DashboardPage() {
  const [forecast, setForecast] = useState<IceForecastResponse | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);

  const [visibility, setVisibility] = useState<LayerVisibility>({
    ice: true,
    confidence: false,
    icebergTracks: true,
    route: true,
  });

  function handleToggleLayer(key: LayerKey) {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const [icebergs, setIcebergs] = useState<IcebergSummary[]>([]);
  const [icebergsLoading, setIcebergsLoading] = useState(true);
  const [selectedIcebergId, setSelectedIcebergId] = useState<string>("");
  const [trajectory, setTrajectory] = useState<IcebergTrajectoryResponse | null>(null);

  const [startPoint, setStartPoint] = useState<RoutePoint>(BHARATI);
  const [endPoint, setEndPoint] = useState<RoutePoint>(MAITRI);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const [pickingTarget, setPickingTarget] = useState<"start" | "end" | null>(null);

  function handleMapPick(lat: number, lon: number) {
    const rounded = { lat: Number(lat.toFixed(2)), lon: Number(lon.toFixed(2)) };
    if (pickingTarget === "start") {
      setStartPoint((prev) => ({ ...prev, ...rounded }));
    } else if (pickingTarget === "end") {
      setEndPoint((prev) => ({ ...prev, ...rounded }));
    }
    setPickingTarget(null);
  }

  const [aboutOpen, setAboutOpen] = useState(false);
  const [apiError, setApiError] = useState<ApiError | null>(null);

  // Responsive sidebar — collapsed by default below the lg breakpoint,
  // toggled via a menu button in the header. Always visible on lg+.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await getIceForecast(-70.1, 44.0, 5);
      if (isApiError(result)) {
        setApiError(result);
      } else {
        setForecast(result);
      }

      setIcebergsLoading(true);
      const bergResult = await getIcebergs();
      setIcebergsLoading(false);
      if (isApiError(bergResult)) {
        setApiError(bergResult);
      } else {
        setIcebergs(bergResult.icebergs);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedIcebergId) {
      setTrajectory(null);
      return;
    }
    (async () => {
      const result = await getIcebergTrajectory(selectedIcebergId, 5);
      if (isApiError(result)) {
        setApiError(result);
      } else {
        setTrajectory(result);
      }
    })();
  }, [selectedIcebergId]);

  async function handlePlanRoute(vessel: VesselProfile) {
    setRouteLoading(true);
    const result = await postRoute({ start: startPoint, end: endPoint, vessel });
    setRouteLoading(false);
    if (isApiError(result)) {
      setApiError(result);
    } else {
      setRoute(result);
    }
  }

  const dayForecast = forecast?.daily_forecasts[selectedDay];

  return (
    <div className="min-h-screen w-screen bg-surface text-ink flex flex-col">
      {/* Top bar */}
      <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-4 md:px-6 bg-white">
        <div className="flex items-center gap-3">
          {/* Sidebar toggle — visible below lg only */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="lg:hidden text-ink-muted hover:text-ink transition-colors"
            aria-label="Toggle panel"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <a href="/" className="text-xs text-ice-600 hover:text-ice-500 transition-colors">
            ← Home
          </a>
          <span className="w-px h-4 bg-border hidden sm:block" />
          <span className="font-semibold text-sm tracking-tight text-ink hidden sm:inline">
            ANTARCTIC NDSS · Bharati–Maitri Corridor
          </span>
          <span className="font-semibold text-sm tracking-tight text-ink sm:hidden">
            ANTARCTIC NDSS
          </span>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => setAboutOpen(true)}
            className="flex items-center gap-1.5 text-xs text-ice-600 hover:text-ice-500 transition-colors"
          >
            <Info size={13} />
            <span className="hidden sm:inline">How it works</span>
          </button>
          <span className="w-px h-4 bg-border hidden sm:block" />
          <span className="font-data text-xs text-ice-600 hidden md:inline">
            LIVE DATA
          </span>
          <span className="w-2 h-2 rounded-full bg-safe" />
        </div>
      </header>

      <div className="flex-1 flex min-h-0 relative">
        {/* Sidebar — fixed width on lg+, slide-over drawer below lg */}
        <aside
          className={`
            w-80 shrink-0 border-r border-border bg-surface-alt overflow-y-auto
            lg:static lg:translate-x-0
            fixed inset-y-0 left-0 z-[1500] top-14 lg:top-0
            transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <LayerControls visibility={visibility} onToggle={handleToggleLayer} />

          <IcebergSelector
            icebergs={icebergs}
            selectedId={selectedIcebergId}
            onSelect={setSelectedIcebergId}
            loading={icebergsLoading}
          />

          <RoutePlannerForm
            start={startPoint}
            end={endPoint}
            onStartChange={setStartPoint}
            onEndChange={setEndPoint}
            onPlanRoute={handlePlanRoute}
            loading={routeLoading}
            pickingTarget={pickingTarget}
            onSetPickingTarget={setPickingTarget}
          />

          {forecast && <IceForecastTrendChart dailyForecasts={forecast.daily_forecasts} />}

          <ExportButton
            start={startPoint}
            end={endPoint}
            vessel={{ ice_class: "PC5", speed_knots: 12, fuel_rate_ton_per_nm: 0.02 }}
            onError={(message) =>
              setApiError({ error: true, message, code: "EXPORT_FAILED" })
            }
          />
        </aside>

        {/* Backdrop for drawer on small screens */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 top-14 bg-navy-950/30 z-[1400]"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Map + timeline + comparison */}
        <main className="flex-1 flex flex-col min-w-0">
          <div
            className={`flex-1 relative bg-navy-800 border-b border-border ${
              pickingTarget ? "cursor-crosshair" : ""
            }`}
          >
            <MapView
              dayForecast={dayForecast}
              showIce={visibility.ice}
              showConfidence={visibility.confidence}
            >
              {visibility.icebergTracks && (
                <IcebergTrajectoryLayer trajectory={trajectory} activeDayOffset={selectedDay} />
              )}
              {visibility.route && <RouteLayer route={route} />}
              <MapClickHandler
                active={pickingTarget !== null}
                settingStart={pickingTarget === "start"}
                onPick={handleMapPick}
              />
            </MapView>

            {pickingTarget && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-ice-500 text-white text-xs font-medium px-3 py-1.5 rounded shadow-crisp pointer-events-none z-[1000]">
                Click the map to set the {pickingTarget} point
              </div>
            )}
          </div>

          {forecast && (
            <TimelineSlider
              days={forecast.daily_forecasts}
              selectedDay={selectedDay}
              onChange={setSelectedDay}
            />
          )}

          {route && (
            <div className="max-h-[45vh] md:max-h-none overflow-y-auto">
              <RouteComparisonPanel route={route} />
              <RouteComparisonChart route={route} />
            </div>
          )}
        </main>
      </div>

      <StalenessBanner error={apiError} onDismiss={() => setApiError(null)} />
      <AboutPanel open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}