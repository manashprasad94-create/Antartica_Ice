"use client";

import { useEffect } from "react";
import { Polyline, Circle, CircleMarker, Tooltip, useMap } from "react-leaflet";
import type { IcebergTrajectoryResponse } from "@/lib/types";

interface IcebergTrajectoryLayerProps {
  trajectory: IcebergTrajectoryResponse | null;
  /** Optional: only show the predicted point/cone up to this day offset, driven by TimelineSlider */
  activeDayOffset?: number;
}

export default function IcebergTrajectoryLayer({
  trajectory,
  activeDayOffset,
}: IcebergTrajectoryLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!trajectory) return;

    const allPoints: [number, number][] = [
      ...trajectory.historical_path.map((p) => [p.lat, p.lon] as [number, number]),
      ...trajectory.predicted_path.map((p) => [p.lat, p.lon] as [number, number]),
    ];

    if (allPoints.length > 0) {
     map.fitBounds(allPoints, { padding: [100, 100], maxZoom: 5 });
    }
  }, [trajectory, map]);

  if (!trajectory) return null;

  const historicalPositions: [number, number][] = trajectory.historical_path.map(
    (p) => [p.lat, p.lon]
  );

  const predictedPositions: [number, number][] = trajectory.predicted_path.map(
    (p) => [p.lat, p.lon]
  );

  const predictedLineWithBridge: [number, number][] =
    historicalPositions.length > 0
      ? [historicalPositions[historicalPositions.length - 1], ...predictedPositions]
      : predictedPositions;

  const activePoint =
    activeDayOffset != null
      ? trajectory.predicted_path.find((_, i) => i === activeDayOffset - 1)
      : undefined;

  return (
    <>
      <Polyline
        positions={historicalPositions}
        pathOptions={{
          color: "#5FA9CC",
          weight: 2.5,
          opacity: 0.9,
        }}
      />

      <Polyline
        positions={predictedLineWithBridge}
        pathOptions={{
          color: "#5FA9CC",
          weight: 2,
          opacity: 0.7,
          dashArray: "6 6",
        }}
      />

      {trajectory.predicted_path.map((p, i) => (
        <Circle
          key={`uncertainty-${i}`}
          center={[p.lat, p.lon]}
          radius={p.uncertainty_radius_km * 1000}
          pathOptions={{
            color: "#D69A2D",
            fillColor: "#D69A2D",
            fillOpacity: 0.08,
            weight: 1,
            opacity: 0.5,
          }}
        />
      ))}

      {historicalPositions.length > 0 && (
        <CircleMarker
          center={historicalPositions[historicalPositions.length - 1]}
          radius={6}
          pathOptions={{
            color: "#FFFFFF",
            fillColor: "#3A8AB0",
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Tooltip direction="top" offset={[0, -6]} className="font-data">
            {trajectory.iceberg_id} — last confirmed position
          </Tooltip>
        </CircleMarker>
      )}

      {activePoint && (
        <CircleMarker
          center={[activePoint.lat, activePoint.lon]}
          radius={5}
          pathOptions={{
            color: "#FFFFFF",
            fillColor: "#D69A2D",
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Tooltip direction="top" offset={[0, -6]} className="font-data">
            {trajectory.iceberg_id} predicted · {activePoint.date} · ±
            {activePoint.uncertainty_radius_km} km
          </Tooltip>
        </CircleMarker>
      )}
    </>
  );
}