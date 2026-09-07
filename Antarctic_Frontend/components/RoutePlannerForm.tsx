"use client";

import { useState } from "react";
import { Navigation, Ship, Loader2, Crosshair } from "lucide-react";
import type { RoutePoint, VesselProfile } from "@/lib/types";

interface RoutePlannerFormProps {
  start: RoutePoint;
  end: RoutePoint;
  onStartChange: (point: RoutePoint) => void;
  onEndChange: (point: RoutePoint) => void;
  onPlanRoute: (vessel: VesselProfile) => void;
  loading?: boolean;
  /** Which point (if any) the next map click should set. null = not picking. */
  pickingTarget?: "start" | "end" | null;
  onSetPickingTarget?: (target: "start" | "end" | null) => void;
}

const ICE_CLASSES = ["PC3", "PC4", "PC5", "PC6", "PC7"];

export default function RoutePlannerForm({
  start,
  end,
  onStartChange,
  onEndChange,
  onPlanRoute,
  loading = false,
  pickingTarget = null,
  onSetPickingTarget,
}: RoutePlannerFormProps) {
  const [iceClass, setIceClass] = useState("PC5");
  const [speedKnots, setSpeedKnots] = useState(12);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onPlanRoute({
      ice_class: iceClass,
      speed_knots: speedKnots,
      fuel_rate_ton_per_nm: 0.02,
    });
  }

  function togglePicking(target: "start" | "end") {
    if (!onSetPickingTarget) return;
    onSetPickingTarget(pickingTarget === target ? null : target);
  }

  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-center gap-2 mb-3">
        <Navigation size={14} className="text-ice-600" />
        <h2 className="text-xs font-semibold text-ice-600 tracking-wide">
          ROUTE PLANNER
        </h2>
      </div>

      {pickingTarget && (
        <div className="flex items-center gap-2 mb-3 px-2.5 py-2 bg-ice-50 border border-ice-200 rounded text-xs text-ink">
          <Crosshair size={13} className="text-ice-600" />
          Click the map to set the {pickingTarget === "start" ? "start" : "end"} point
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Start point */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-ink-muted tracking-wide">START</label>
            {onSetPickingTarget && (
              <button
                type="button"
                onClick={() => togglePicking("start")}
                className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                  pickingTarget === "start"
                    ? "bg-ice-500 text-white"
                    : "text-ice-600 hover:bg-ice-50"
                }`}
              >
                Pick on map
              </button>
            )}
          </div>
          <input
            type="text"
            value={start.name ?? ""}
            onChange={(e) => onStartChange({ ...start, name: e.target.value })}
            placeholder="Start location name"
            className="w-full mt-1 px-2.5 py-1.5 bg-white border border-border rounded text-sm text-ink"
          />
          <div className="flex gap-2 mt-1.5">
            <input
              type="number"
              step="0.1"
              value={start.lat}
              onChange={(e) => onStartChange({ ...start, lat: Number(e.target.value) })}
              className="w-1/2 px-2.5 py-1.5 bg-white border border-border rounded text-xs font-data text-ink"
            />
            <input
              type="number"
              step="0.1"
              value={start.lon}
              onChange={(e) => onStartChange({ ...start, lon: Number(e.target.value) })}
              className="w-1/2 px-2.5 py-1.5 bg-white border border-border rounded text-xs font-data text-ink"
            />
          </div>
        </div>

        {/* End point */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-ink-muted tracking-wide">END</label>
            {onSetPickingTarget && (
              <button
                type="button"
                onClick={() => togglePicking("end")}
                className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                  pickingTarget === "end"
                    ? "bg-ice-500 text-white"
                    : "text-ice-600 hover:bg-ice-50"
                }`}
              >
                Pick on map
              </button>
            )}
          </div>
          <input
            type="text"
            value={end.name ?? ""}
            onChange={(e) => onEndChange({ ...end, name: e.target.value })}
            placeholder="End location name"
            className="w-full mt-1 px-2.5 py-1.5 bg-white border border-border rounded text-sm text-ink"
          />
          <div className="flex gap-2 mt-1.5">
            <input
              type="number"
              step="0.1"
              value={end.lat}
              onChange={(e) => onEndChange({ ...end, lat: Number(e.target.value) })}
              className="w-1/2 px-2.5 py-1.5 bg-white border border-border rounded text-xs font-data text-ink"
            />
            <input
              type="number"
              step="0.1"
              value={end.lon}
              onChange={(e) => onEndChange({ ...end, lon: Number(e.target.value) })}
              className="w-1/2 px-2.5 py-1.5 bg-white border border-border rounded text-xs font-data text-ink"
            />
          </div>
        </div>

        {/* Vessel profile */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <Ship size={12} className="text-ice-600" />
            <span className="text-[10px] text-ink-muted tracking-wide">VESSEL PROFILE</span>
          </div>
          <div className="flex gap-2">
            <select
              value={iceClass}
              onChange={(e) => setIceClass(e.target.value)}
              className="w-1/2 px-2.5 py-1.5 bg-white border border-border rounded text-xs text-ink"
            >
              {ICE_CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
            <div className="w-1/2 relative">
              <input
                type="number"
                min={1}
                max={25}
                value={speedKnots}
                onChange={(e) => setSpeedKnots(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 pr-10 bg-white border border-border rounded text-xs font-data text-ink"
              />
              <span className="absolute right-2.5 top-1.5 text-[10px] text-ink-muted">kts</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white text-sm font-medium py-2 rounded transition-colors mt-1"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Computing route…
            </>
          ) : (
            "Plan Route"
          )}
        </button>
      </form>
    </div>
  );
}