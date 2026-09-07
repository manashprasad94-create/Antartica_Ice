"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Rectangle } from "react-leaflet";
import type { DailyForecast } from "@/lib/types";

// Initial view centered on the Bharati–Maitri corridor —
// no longer a hard lock, just the starting position/zoom.
const INITIAL_CENTER: [number, number] = [-69.5, 44.0];
const INITIAL_ZOOM = 4;

interface MapViewProps {
  dayForecast?: DailyForecast;
  showIce: boolean;
  showConfidence: boolean;
  children?: React.ReactNode;
}

function concentrationColor(pct: number): string {
  const t = Math.max(0, Math.min(100, pct)) / 100;
  const from = { r: 0x1e, g: 0x45, b: 0x60 };
  const to = { r: 0xff, g: 0xff, b: 0xff };
  const r = Math.round(from.r + (to.r - from.r) * t);
  const g = Math.round(from.g + (to.g - from.g) * t);
  const b = Math.round(from.b + (to.b - from.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function confidenceOpacity(pct: number): number {
  const inverted = 100 - Math.max(0, Math.min(100, pct));
  return (inverted / 100) * 0.4;
}

export default function MapView({
  dayForecast,
  showIce,
  showConfidence,
  children,
}: MapViewProps) {
  const cellSize = useMemo(() => {
    if (!dayForecast) return { latStep: 0.5, lonStep: 0.5 };
    const { lats, lons } = dayForecast.grid;
    const latStep = lats.length > 1 ? Math.abs(lats[1] - lats[0]) : 0.5;
    const lonStep = lons.length > 1 ? Math.abs(lons[1] - lons[0]) : 0.5;
    return { latStep, lonStep };
  }, [dayForecast]);

  return (
    <MapContainer
      center={INITIAL_CENTER}
      zoom={INITIAL_ZOOM}
      minZoom={2}
      maxZoom={12}
      className="w-full h-full"
      style={{ background: "#0A1622" }}
      zoomControl={true}
      // No bounds / maxBoundsViscosity — free pan and zoom anywhere.
    >
      <TileLayer
        attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />

      {showIce &&
        dayForecast &&
        dayForecast.grid.lats.map((lat, r) =>
          dayForecast.grid.lons.map((lon, c) => {
            const pct = dayForecast.grid.concentration_pct[r][c];
            const bounds: [[number, number], [number, number]] = [
              [lat - cellSize.latStep / 2, lon - cellSize.lonStep / 2],
              [lat + cellSize.latStep / 2, lon + cellSize.lonStep / 2],
            ];
            return (
              <Rectangle
                key={`ice-${r}-${c}`}
                bounds={bounds}
                pathOptions={{
                  fillColor: concentrationColor(pct),
                  fillOpacity: 0.45,
                  color: "#0A1622",
                  weight: 0.5,
                  opacity: 0.3,
                }}
              />
            );
          })
        )}

      {showConfidence &&
        dayForecast &&
        dayForecast.grid.lats.map((lat, r) =>
          dayForecast.grid.lons.map((lon, c) => {
            const conf = dayForecast.grid.confidence_pct[r][c];
            const bounds: [[number, number], [number, number]] = [
              [lat - cellSize.latStep / 2, lon - cellSize.lonStep / 2],
              [lat + cellSize.latStep / 2, lon + cellSize.lonStep / 2],
            ];
            return (
              <Rectangle
                key={`conf-${r}-${c}`}
                bounds={bounds}
                pathOptions={{
                  fillColor: "#000000",
                  fillOpacity: confidenceOpacity(conf),
                  color: "transparent",
                  weight: 0,
                }}
              />
            );
          })
        )}

      {children}
    </MapContainer>
  );
}