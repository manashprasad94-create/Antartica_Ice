"use client";

import { Polyline, CircleMarker, Popup } from "react-leaflet";
import type { RouteResponse, RiskSeverity } from "@/lib/types";

interface RouteLayerProps {
  route: RouteResponse | null;
}

function severityColor(severity: RiskSeverity): string {
  switch (severity) {
    case "high":
      return "#C4453A"; // danger
    case "medium":
      return "#D69A2D"; // warn
    case "low":
      return "#2F8F5B"; // safe
  }
}

export default function RouteLayer({ route }: RouteLayerProps) {
  if (!route) return null;

  const shortestPositions: [number, number][] = route.shortest_route.waypoints.map(
    (w) => [w.lat, w.lon]
  );
  const recommendedPositions: [number, number][] = route.recommended_route.waypoints.map(
    (w) => [w.lat, w.lon]
  );

  return (
    <>
      {/* Shortest route — red */}
      <Polyline
        positions={shortestPositions}
        pathOptions={{
          color: "#C4453A",
          weight: 3,
          opacity: 0.85,
        }}
      />

      {/* Recommended route — green */}
      <Polyline
        positions={recommendedPositions}
        pathOptions={{
          color: "#2F8F5B",
          weight: 3,
          opacity: 0.9,
        }}
      />

      {/* Risk zone markers on the shortest route — the "why" explainability moment */}
      {route.shortest_route.risk_zones.map((zone, i) => (
        <CircleMarker
          key={`risk-${i}`}
          center={[zone.lat, zone.lon]}
          radius={8}
          pathOptions={{
            color: "#FFFFFF",
            fillColor: severityColor(zone.severity),
            fillOpacity: 0.9,
            weight: 2,
          }}
        >
          <Popup className="font-sans" minWidth={220}>
            <div className="flex flex-col gap-1.5 p-0.5">
              <span
                className="font-data text-[10px] uppercase tracking-wide"
                style={{ color: severityColor(zone.severity) }}
              >
                {zone.severity} risk
              </span>
              <p className="text-sm text-ink leading-snug m-0">
                {zone.reason}
              </p>
              <span className="font-data text-[10px] text-ink-muted mt-1">
                {zone.lat.toFixed(2)}°, {zone.lon.toFixed(2)}°
              </span>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}